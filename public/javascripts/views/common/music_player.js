/**
 * View: MusicPlayerView

    ちょっと責務重すぎにしちゃってるけど、Headerの全機能を担当しています。
    views/common/header.jsは、headerの表示だけなのです。いまのところ実は。。
    理想の責務分担はこれから考えます。

 */
define([
    'views/pop/index'
], function (
    PopView
) {

    var MusicPlayerView = Backbone.View.extend({

        // Playlist内の再生位置
        currentPos: null,

        // 現在のYoutubePlayer
        youtubePlayer: null,

        // 現在のAudioタグPlayer
        audioPlayer: null,

        // timer
        timerId: null,

        // 再生中のMusic
        currentMusic: null,

        // 再生キュー
        musicQueue: null,

        // Playerを表示するか
        playerVisible: false,

        // シャッフルするか
        shuffle: false,

        // リピートするか
        repeat: 0,

        // fields.
        $playlistTitle: undefined,
        $musicTitle: undefined,
        $artistName: undefined,



        $blackout: null,

        // Screen Size.
        previewSize: null,
        movieSize: null,
        scaleSize: null,

        initialize: function () {

            // 要素指定
            this.$header = $('#header');

            // イベント自動バインド
            _.bindEvents(this);
            _.bindEvents(this, {$el:this.$header});

            // this binds.
            _.bindAll(this, '_playMusicAtCurrentPos');


            // set elements.
            this.$playlistTitle = $('#mpPlaylistTitle');
            this.$musicTitle = $('#mpMusicTitle');
            this.$artistName = $('#mpArtistName');


            this.previewSize = {width: 640, height: 450};
            this.movieSize = {width: 640, height: 390};
            this.scaleSize = 200 / this.previewSize.width;

        },


        // header.jsでレンダリングしているので、今のところ何もしてない。
        render: function () {},


        /**
            曲一覧をレンダリングする
        */
        renderMusicQueueArea: function () {
            var snipet = _.mbTemplate('header_component_music_list', {musicArray:this.musicQueue, currentMusic:this.currentMusic});
            this.$header.find('#musicList').html(snipet);
        },



        /**
         * YoutubeとiTunes視聴を交えて再生する
         */
        playMusics: function (options) {

            // 再生可能チェック
            if (!options || !options.musicArray || options.musicArray.length === 0) {
                console.warn('musicArray must be set');
                return;
            }

            // 必須項目チェック
            if (!options.identifier) {
                throw 'identifier must be set.';
            }

            // 表示を初期化
            this.resetPlayer();


            // 再生位置
            this.currentPos = parseInt(options.startPos || 0, 10);


            // オプション指定
            options = options || {};
            options.callbackWhenWillStart = options.callbackWhenWillStart || function () {};
            options.callbackWhenEnd = options.callbackWhenEnd || function () {};
            options.musicArray = options.musicArray || [];
            this.options = options;


            // aliasの揺れを集約する
            _.each(options.musicArray, function (music) {
                music.youtubeId = music.youtubeId || music.youtube_id;
                music.songUrl = music.songUrl || music.song_url;
                music.musicId = music.musicId || music.music_id;
                music.artistName = music.artistName || music.artist_name;
                music.artistId = music.artistId || music.artist_id;
            });


            // プレイリストを生成する
            console.debug('shuffle: ', this.shuffle);
            if (this.shuffle) {
                this.musicQueue = this._createShuffleMusicQueue(options.musicArray[this.currentPos].id);
            } else {
                this.musicQueue = options.musicArray;
            }




            // ベースAreaを作る
            mb.$playArea.html(this.$el);
            var $previewArea = $('<div id="previewArea" class="previewArea"/>');
            $previewArea.css(_.extend({}, this.previewSize, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                margin: '-225px 0 0 -320px',
                'background-color': 'black',
            }));
            if (!_.isIphone && !_.isAndroid && !this.playerVisible) {
                $previewArea.toggleClass('posNotShow'); // 最初は非表示
            }
            this.$el.html($previewArea);
            this.$previewArea = $previewArea;

            // Drag可能にしてみる
            this.$previewArea.draggable();

            // 再生開始
            this._playMusicAtCurrentPos();


            // プレイリスト名
            var playlistNameText = options.playlistName || 'プレイリスト';
            this.$playlistTitle
                .html('<span class="elps">' + playlistNameText + '</span>')
                .append('<i class="ico-font ico-below fr fs9"></i>')
                .removeClass('hidden');

            // プレイヤーを再生状態にする
            this.$header.find('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

            // プレイリスト中身表示を作る
            this.renderMusicQueueArea();

            // ga
            _gaq.push(['_trackEvent', 'playMusic', (options.playlistType || '')]);

        },


        /**
            曲の番号を指定して再生する
        */
        _playMusicAtCurrentPos: function () {
            console.debug('_playMusicAtCurrentPos is called. currentPos=', this.currentPos, 'musicQueue.count=', this.musicQueue.length);

            // 変数定義
            var musicQueue = this.musicQueue;
            var callbackWhenEnd = this.options.callbackWhenEnd;
            var callbackWhenWillStart = this.options.callbackWhenWillStart;


            // 初期化
            this.youtubePlayer = null;
            this.audioPlayer = null;
            if (this.timerId) {
                clearInterval(this.timerId);
            }

            // 終了判定
            if (this.currentPos >= musicQueue.length) {

                // リピート設定の場合には、キューを作り直して次へ
                if (this.repeat) {
                    this.currentPos = 0;
                    console.debug('最後までキタから作り直し。shuffle=', this.shuffle);
                    if (this.shuffle) {
                        this.musicQueue = this._createShuffleMusicQueue();
                    } else {
                        this.musicQueue = this.options.musicArray;
                    }

                } else {
                    // リピートでない場合には、終了する

                    console.debug('finish play musics. currentPos=', this.currentPos, 'musicQueue.count=', musicQueue.length);
                    callbackWhenEnd();

                    // 対象曲を削除
                    this.currentMusic = null;

                    return;

                }

            }

            this.currentMusic = musicQueue[this.currentPos++];
            var func = _.bind(this.currentMusic.youtubeId ? this._playYoutube : this._playItunesMusic, this);
            var param = this.currentMusic.youtubeId || this.currentMusic.songUrl;

            // callback.
            if (callbackWhenWillStart) {
                callbackWhenWillStart(this.currentMusic);
            }

            // 表示情報
            this.$musicTitle.html(this.currentMusic.title);
            this.$artistName.html(this.currentMusic.artistName);
            if(_.alreadyPocket(this.currentMusic.music_id)) {
                this.$header.find('[data-event-click="pocket"]').addClass('is-active');
            } else {
                this.$header.find('[data-event-click="pocket"]').removeClass('is-active');
            }

            func(param, this.$previewArea, _.bind(function () {

                // next
                this._playMusicAtCurrentPos();

            }, this));


            // プレイリスト内の表示を切り替え
            this._highlightMusicInPlaylist(this.currentMusic.id);


            // 再生回数を保存
            _.addMusicPlayCount(this.currentMusic.music_id);

        },


        /**
            （シャッフル専用）再生順を作る
        */
        _createShuffleMusicQueue: function (firstItemId) {

            // 状態チェック
            if (!this.shuffle) {
                return;
            }


            // 曲順最初に持ってくるものを取得する
            var firstItems = _.filter(this.options.musicArray, function (item) {return item.id === firstItemId;});

            // 最初の曲以外のものを取得して、シャッフルする
            var otherItems = _.filter(this.options.musicArray, function (item) {return item.id !== firstItemId;});
            otherItems = _.shuffle(otherItems);

            // くっつけて返す
            return firstItems.concat(otherItems);

        },




        /**
            曲を再開する
        */
        startMusic: function () {
            this.$header.find('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

            // audioタグの場合
            if (this.audioPlayer) {
                this.audioPlayer.play();
            }

            // Youtubeの場合
            if (this.youtubePlayer) {
                this.youtubePlayer.playVideo();
            }

            // 開始Callbackを呼ぶ
            if (this.options.callbackWhenWillStart) {
                this.options.callbackWhenWillStart(this.musicQueue[this.currentPos-1]);
            }

        },


        /**
            曲を一時停止させる
        */
        pauseMusic: function () {
            this.$header.find('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

            // audioタグの場合
            if (this.audioPlayer) {
                this.audioPlayer.pause();
            }

            // Youtubeの場合
            if (this.youtubePlayer) {
                this.youtubePlayer.pauseVideo();
            }

            // UI側は表示をキャンセルしたいので、いったんコールバックを呼ぶ
            if (this.options.callbackWhenPause) {
                this.options.callbackWhenPause();
            }
        },




        /**
         * 閉じる
         */
        close: function () {
            this.togglePlayerVisible();
            // if (this.options.callbackWhenEnd) {
            //     this.options.callbackWhenEnd();
            // }

            // this.$el.remove();

            // this.resetPlayer();

            return false;
        },


        /**
         * 小さくする
         */
        minimize: function () {
            this.togglePlayerVisible();

            return false;
        },


        /**
            プレイヤーの状態を初期状態に戻す
        */
        resetPlayer: function (e) {

            // player表示
            $('[data-event-click="togglePlayerVisible"]').removeClass('is-active');
            // 再生ボタン
            $('[data-event-click="startMusic"]').removeClass('hidden');
            // 一時停止ボタン
            $('[data-event-click="pauseMusic"]').addClass('hidden');
            // 再生時間
            $('#seekBar').css('width', '0%');

            // タイマー削除
            if (self.timerId) {
                clearInterval(self.timerId);
            }

        },




        /**
         * Audioタグで再生する
         */
         _playItunesMusic: function (songUrl, $appendView, endCallback) {

            // 初期化
            $appendView.html('');


            // 閉じるボタンを追加
            if (_.isIphone || _.isAndroid) {
                var $closeBtn = $('<a href="#" class="closeBtn">×</a>');
                $closeBtn.on('click', _.bind(this.close, this));
                $appendView.append($closeBtn);
            }


            // iTunesリンクエリアを追加する
            if (this.currentMusic.itunes_url) {
                var $a = $('<a target="_blank"/>').css({
                    display: 'inline-block',
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    color: 'white'
                });
                $a.attr('href', _.createItunesUrl(this.currentMusic.itunes_url)).text('iTunesでこの曲をチェックする');
                this.$previewArea.append($a);
            }


            // audio tag.
            this.audioPlayer = document.createElement('audio');
            this.audioPlayer.src = songUrl;
            this.audioPlayer.autoplay = true;
            this.audioPlayer.controls = true;
            var $audio = $(this.audioPlayer);
            $audio.css({
                display: 'block',
                width: '400px',
                height: '50px',
                position: 'absolute',
                top: '50%',
                left: '50%',
                'margin-top': '-25px',
                'margin-left': '-200px'
            });
            // $blackout.append(audio);
            $appendView.append($audio);


            // callback.
            $audio.on('ended', function () {
                if (endCallback) {
                    endCallback();
                }
            });


            // 時間シークバーの動きを表現する
            var audio = this.audioPlayer;
            var $seekBar = $('#seekBar');
            var timestamp = 0;
            $audio.on('timeupdate', function () {
                var newTimestamp = new Date().getTime();
                if (newTimestamp - 200 > timestamp) {
                    timestamp = newTimestamp;
                    var maxTime = audio.duration;
                    var currentTime = audio.currentTime;
                    $seekBar.css('width', Math.floor(currentTime * 100 / maxTime) + '%');
                }
            });
            $audio.on('ended', function () {
                $seekBar.css('width', '100%');
            });



         },




        /**
         *  Youtubeを再生する
         */
        _playYoutube: function (youtubeId, $appendView, endCallback) {

            // 内容の初期化
            $appendView.html('');

            // 閉じるボタンを追加
            if (_.isIphone || _.isAndroid) {
                var $closeBtn = $('<a href="#" class="closeBtn">×</a>');
                $closeBtn.on('click', _.bind(this.close, this));
                $appendView.append($closeBtn);
            }



            if (this.currentMusic.itunes_url) {
                var $a = $('<a target="_blank"/>').css({
                    display: 'inline-block',
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    color: 'white'
                });
                $a.attr('href', _.createItunesUrl(this.currentMusic.itunes_url)).text('iTunesでこの曲をチェックする');
                this.$previewArea.append($a);
            }





            // Youtubeエリア
            var $player = $('<div id="player"/>');
            $player.css(this.movieSize);
            $appendView.append($player);



            var self = this;

            // youtubeをダウンロード
            function startYoutube () {
                console.debug('startYoutube is called. id=', youtubeId);
                var anId = youtubeId;
                self.youtubePlayer = new window.YT.Player('player', {
                    height: self.movieSize.width,
                    width: self.movieSize.height,
                    videoId: anId,
                    events: {
                        'onReady': window.onPlayerReady,
                        'onStateChange': window.onPlayerStateChange
                    }
                });

            }
            if (window.YT) {

                $('#player').remove();
                var $player = $('<div id="player"/>');
                $player.css(this.movieSize);
                $appendView.append($player);

                startYoutube();
            } else {
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                window.onYouTubeIframeAPIReady = function () {
                    console.log('onYouTubeIframeAPIReady');
                    startYoutube();
                };
            }

            window.onPlayerReady = function (event) {
                console.log('onPlayerReady');
                if (!_.isIphone && !_.isAndroid) {
                    event.target.playVideo();
                } else {
                    console.log('iphone or android');
                }

                startSeeking();

            };
            window.onPlayerStateChange = function (event) {
                console.log('onPlayerStateChange');
                if (event.data === YT.PlayerState.ENDED) {
                    console.log('youtube end');

                    if (endCallback) {
                        endCallback();
                    }
                }
            };

            var maxTime;
            var currentTime;
            var $seekBar = $('#seekBar');
            function startSeeking() {
                setInterval(function () {

                    if (!self.youtubePlayer || !self.youtubePlayer.getDuration) return;

                    maxTime = self.youtubePlayer.getDuration();
                    currentTime = self.youtubePlayer.getCurrentTime();
                    var raito = currentTime * 100 / maxTime;
                    if (raito > 95) {
                        raito = 100;
                    }
                    // console.debug('youtube:', currentTime, maxTime, raito);
                    $seekBar.css('width', raito + '%');
                }, 200);
            };


        },




        /**
            Playerの表示、非表示を制御します。
        */
        togglePlayerVisible: function (e) {
            this.playerVisible = !this.playerVisible;
            $('[data-event-click="togglePlayerVisible"]').toggleClass('is-active');
            $('#previewArea').toggleClass('posNotShow');
        },



        /**
            次の曲へ
        */
        prevMusic: function () {
            console.debug('prevMusic');
            if (this.options) {
                this.currentPos = Math.max(this.currentPos - 2, 0);
                this._playMusicAtCurrentPos();
            }
        },


        /**
            前の曲へ
        */
        nextMusic: function () {
            console.debug('nextMusic');
            if (this.options) {
                this.currentPos = Math.min(this.currentPos, this.musicQueue.length - 1);
                this._playMusicAtCurrentPos();
            }
        },


        /**
            Pocketの追加、削除を行う
        */
        pocket: function (e) {
            e.preventDefault();

            // Pocket対象曲がなければ何もしない
            if (!this.currentMusic) {
                return;
            }

            // alias.
            var $this = $(e.currentTarget);


            // Pocket追加
            if (!$this.hasClass('is-active')) {
                _.addPocket({music_id: this.currentMusic.music_id, youtube_id:this.currentMusic.youtube_id}, _.bind(function () {

                    // Pocketボタンの表示切替
                    $(e.currentTarget).addClass('is-active');

                }, this));


            // Pocket削除
            } else {

                // PocketIdを特定して、削除する
                var pocketId = _.selectPocketId(this.currentMusic.music_id);

                // もし見つからない場合には、未ログインと思われるので、ログインを促す。
                if (!pocketId) {
                    mb.router.appView.authErrorHandler();
                    return;
                }

                // Pocketを削除する
                _.deletePocket(pocketId, function () {

                    // Pocketボタンの表示切替
                    $(e.currentTarget).removeClass('is-active');

                });

            }

            return false;
        },



        /**
            プレイリストダイアログを開く
        */
        openPlaylistPopup: function () {

            // 表示できるものがある時だけ開きます。
            if (this.musicQueue) {
                $('#playlistPopup').removeClass('hidden');
            }
        },



        /**
            プレイリストダイアログを閉じる
        */
        closePlaylistPopup: function (e) {
            $('#playlistPopup').addClass('hidden');
        },


        /**
            クリックされた際のイベントバブリングを防ぐ（想定しないダイアログ閉じをしない）
        */
        cancelEvent: function (e) {
            // e.preventDefault();
            e.stopPropagation();
            // return false;
        },


        /**
            曲を再生する（プレイリスト内で選択）
        */
        playMusicAt: function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.debug('playMusicAt');

            var $li = $(e.currentTarget).parents('li');
            var id = parseInt($li.data('id'));

            // 表示制御
            this._highlightMusicInPlaylist(id);


            // 再生位置を特定して再生する。
            var musicQueue = this.musicQueue;
            for (var i = 0; i < musicQueue.length; i++) {
                if (musicQueue[i].id === id) {
                    this.currentPos = i;
                    break;
                }
            }
            this._playMusicAtCurrentPos();

            return false;
        },


        /**
            プレイリスト内のハイライトを切り替える
        */
        _highlightMusicInPlaylist: function (id) {

            var $musicList = this.$header.find('#musicList');
            var $li = this.$header.find('#musicList [data-id="'+id+'"]');

            // 表示制御
            $musicList.find('li').removeClass('is-active');
            $musicList.find('[data-event-click="pauseMusicAt"]').addClass('hidden');
            $musicList.find('[data-event-click="playMusicAt"]').removeClass('hidden');
            $li.addClass('is-active');
            $li.find('[data-event-click="playMusicAt"],[data-event-click="pauseMusicAt"]').toggleClass('hidden');

        },


        /**
            曲を停止する（プレイリスト内で選択）
        */
        pauseMusicAt: function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.debug('pauseMusicAt');

            // 表示きりかえ
            $(e.currentTarget).parents('li').find('[data-event-click="playMusicAt"],[data-event-click="pauseMusicAt"]').toggleClass('hidden');

            // Pause処理
            this.pauseMusic();

            return false;
        },




        /**
            シャッフル状態を切り替える
        */
        toggleShuffle: function (e) {
            $(e.currentTarget).toggleClass('is-active');
            this.shuffle = !this.shuffle;

            // 現在再生中の場合のみ
            if (this.currentMusic) {

                // シャッフル状態になった場合
                if (this.shuffle) {
                    // キューを現在曲を始めにしてシャッフルに作り直す
                    this.musicQueue = this._createShuffleMusicQueue(this.currentMusic.id);


                // シャッフルでなくなった場合
                } else {

                    // 現在曲+1の位置を再生位置にしておく
                    var musicArray = this.options.musicArray;
                    for (var i = 0; i < musicArray.length; i++) {
                        if (musicArray[i].id === this.currentMusic.id) {
                            this.currentPos = i + 1;
                            break;
                        }
                    }
                    this.musicQueue = this.options.musicArray;

                }


                // 曲一覧を再レンダリング
                this.renderMusicQueueArea();
            }


        },



        /**
            リピート状態を切り替える
        */
        toggleRepeat: function (e) {
            $(e.currentTarget).toggleClass('is-active');
            this.repeat = !this.repeat;
        },





        /**
            Dropを追加する
        */
        addDrop: function (e) {

            e.preventDefault();
            e.stopPropagation();

            // Playerが使われていない場合には、動かさない
            if (!this.currentMusic) {
                return false;
            }

            // ga
            _gaq.push(['_trackEvent', 'addDropWithCurrentMusic', '']);

            // show PopView.
            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(this.currentMusic.music_id, undefined, 'modal');

            return false;
        },




























        /**
         * 終了処理
         */
        dealloc: function () {
            this.$el.remove();
        },



    });

    return MusicPlayerView;
});
