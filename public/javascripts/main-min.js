

/**
 * Header
 */
define('views/common/header',[], function () {

    var HeaderView = Backbone.View.extend({

        initialize: function () {
            this.$el = $('header');
            _.bindAll(this, 'show');
        },

        events: {

        },

        render: function () {
            var template = $('#component_header').html();
            this.$el.html(template);
        },

        show: function () {
            this.render();
        },

        dealloc: function () {

        },



    });

    return HeaderView;
});


/**
 * Model: LocalStorage and SessionStorage
 */
define('models/common/user_storage',[], function () {

    var UserStorage = Backbone.Model.extend({


        /**
         * Low Level API
         */
        getStorage: function (type) {
            return (type === 'ls' ? localStorage : localStorage);
        },
        setItem: function (key, value, type) {
            this.getStorage(type).setItem(key, value);
        },
        getItem: function (key, type) {
            return this.getStorage(type).getItem(key);
        },
        setObject: function (key, value, type) {
            this.setItem(key, JSON.stringify(value), type);
        },
        getObject: function (key, type) {
            return JSON.parse(this.getItem(key, type));
        },


        // API: uid
        setUid: function (uid) {this.setItem('uid', uid);},
        getUid: function () {return this.getItem('uid');},

        // API: common
        setCommon: function (common) {this.setObject('common', common);},
        getCommon: function () {return this.getObject('common');},

        loadCommonInfo: function (options) {
            console.debug('loadCommonInfo!!');

            // null safe.
            options = options || {};

            if (!this.getCommon() || options.force === true) {
                console.debug('loadCommonInfo from server');

                var common = this.getCommon();
                var self = this;
                $.ajax({
                    url: '/api/v1/common',
                    dataType: 'json',
                    success: function (json) {
                        json.lastRequestTime = new Date().getTime();
                        self.setCommon(json);
                        if (options.callback) {
                            options.callback();
                        }
                    },
                    error: function () {
                        console.error('/api/v1/common error: ', arguments);
                    },
                });

            } else {
                if (options.callback) {
                    options.callback();
                }
            }

        },

        // API: user
        setUser: function (user) {this.setObject('user', user);},
        getUser: function () {return this.getObject('user');},







    });


    // ちょっとズル
    mb.userStorage = new UserStorage();



    return UserStorage;
});

/*
 * Music
 */
define('models/music/music',[],function () {
    var Music = Backbone.Model.extend({
        defaults: {
            id: null,
            title: null,
            artwork_url: null,
            song_url: null,
            artist_id: null,
            artist_name: null,
            itunes_url: null,
            create_at: null,
            update_at: null,
        },
        urlRoot: '/api/v1/musics/',
        loadData: function (musicId) {
            this.set('id', musicId);
            this.fetch();
        },
    });
    
    return Music;
});

/*
 *  Pop
 */
define('models/pop/pop',[],function () {

    var Pop = Backbone.Model.extend({
        defaults: {
            id: null,
            feeling_id: null,
            artwork_url: null,
            user_name: null,
            comment: null,
            music_id: null,
        },

        urlRoot: '/api/v1/pops',


        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: localStorage.getItem('uid')},
                success: _.bind(function () {
                    // this.trigger('success_save');
                }, this),
                error: _.bind(function () {
                    console.log('Pop save failed. reson: ', arguments);
                    // this.trigger('fail_save');
                }, this),
            });

        },

        update: function () {
            console.log('update');
            throw new '実装する';
        },
    });


    return Pop;
});


/**
 * View: Pop
 */
define('views/pop/index',[
    'models/common/user_storage',
    'models/music/music',
    'models/pop/pop'
], function (
    UserStorage,
    MusicModel,
    PopModel
) {

    var popView = Backbone.View.extend({

        // data field.
        displayType:    'normal', // normal or modal
        type:           null, // add or update


        initialize: function () {

            // auto event bind.
            _.bindEvents(this);
        },



        render: function () {

            console.debug('render.', this.pop);

            // レンダリング
            var snipet = _.mbTemplate('page_pop', {
                type: this.type,
                feelingList: _.mbStorage.getCommon().feelings,
                music: this.music,
                pop: this.pop
            });
            this.$el.html(snipet);


            // モーダルの場合の表示制御
            if (this.displayType === 'modal') {

                // expand area.
                this.$el.css({
                    width: '100%',
                    height: '100%',
                });

                // black background.
                var $blackout = $('<div class="blackout"/>').css({opacity:1});
                $blackout.on('click', _.bind(function () {
                    this.$el.remove();
                    this.dealloc();
                }, this));
                this.$el.prepend($blackout);

                // display as modal.
                this.$el.find('#pagePop').addClass('popUp');

                // 文字数の数え上げをしておく
                this.countCharacters();
            }
        },



        /**
            文字数を数える
        */
        countCharacters: function () {
            var length = this.$el.find('#comment').val().length;
            this.$el.find('#numOfCharacters').text(length);
        },


        /**
            POPを投稿する
        */
        addPop: function () {

            // 選択されたキモチ
            var feelingId = this.$el.find('[name="feelingSelect"]:checked').val();
            // コメント
            var comment = this.$el.find('#comment').val();


            // キモチが選択されていない場合はだめ
            if (!feelingId) {
                alert('ドロップの種類を選択してください');
                return;
            }

            // コメントが入力されていない場合はだめ
            if (!comment) {
                alert('感想は１文字以上入力してください');
            }

            // 登録する
            this.pop.set('music_id', this.music.attributes.id);
            this.pop.set('feeling_id', feelingId);
            this.pop.set('comment', comment);
            this.pop.bind('sync', _.bind(function () {

                // ga
                _gaq.push(['_trackEvent', 'addPop', feelingId]);

                if (this.type === 'add') {
                    alert('登録完了しました');
                } else {
                    alert('編集完了しました');
                }

                location.reload();


            }, this));
            this.pop.save();

        },




        show: function (musicId, popId, displayType) {
            console.log('pop:show: ', musicId, popId);

            // set data.
            this.type = (popId ? 'update' : 'add');
            this.displayType = displayType;


            // musicのロード
            this.music = new MusicModel();
            this.music.set('id', musicId);
            this.music.bind('sync', _.bind(function () {

                // 新規の場合には、画面をレンダリング
                if (this.type === 'add') {
                    console.debug('aaaaa');
                    this.render();

                // 変更の場合に既にpopIdがあれば、レンダリング
                } else if (this.pop.attributes.feeling_id) {
                    console.debug('bbbb');
                    this.render();

                } else {
                    // popのロード待ち
                    console.log('cccc');
                }

            }, this));
            this.music.fetch();



            // popのロード
            this.pop = new PopModel();
            this.pop.set('id', popId);
            this.pop.bind('sync', _.bind(function () {

                // 既にMusicがロード済みの場合には、表示
                if (this.music.attributes.title) {
                    console.debug('dddd', this.pop, this.music);
                    this.render();

                } else {
                    // Musicがまだ無ければそれ待ち
                    console.debug('eeee');
                }

            }, this));
            this.pop.fetch();

        },



        dealloc: function () {},
    });

    return popView;
});



















/**
 * View: MusicPlayerView

    ちょっと責務重すぎにしちゃってるけど、Headerの全機能を担当しています。
    views/common/header.jsは、headerの表示だけなのです。いまのところ実は。。
    理想の責務分担はこれから考えます。

 */
define('views/common/music_player',[
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
            e.preventDefault();
            e.stopPropagation();
            return false;
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


/**
 *  各Modelのベース機能
 */
define('models/common/base',['models/common/user_storage'], function (UserStorage) {

    var userStorage = new UserStorage();


    return {
        
        // uidをHeaderへ付与する
        sync: function (method, model, options) {

            var uid = userStorage.getUid();
            if (uid) {
                options = options || {};
                var headers = options.headers || {};
                headers.uid = uid;
                options.headers = headers;
            }

            Backbone.sync(method, model, options);

        },

    };

});


/*
 *  Feeling
 */
define('models/feeling/feeling',[],function () {

    var Feeling = Backbone.Model.extend({
        defaults: {
            id: null,
            name: null,
            create_at: null,
            update_at: null
        },
    });

    return Feeling;
});



/**
 * FeelingList
 */
define('models/feeling/feeling_list',[
    'models/common/base',
    'models/feeling/feeling'
], function (
    BaseModel,
    Feeling
) {

    var FeelingList = Backbone.Collection.extend({
    
        model: Feeling,

        url: function () {
            return '/api/v1/feelings';
        },
    });

    return FeelingList;
});


/**
 *  PopList
 */
define('models/pop/pop_list',['models/pop/pop'], function (Pop) {

    var PopList = Backbone.Collection.extend({
        model: Pop,
        url: function () {
            return '/api/v1/poplist';
        },


        refreshDataWithFeelingId: function (feelingId) {
            console.log('fetchOption: ', {reset: true, data: {feeling_id: feelingId}});
            this.fetch({reset: true, data: {feeling_id: feelingId}});
        },


        refreshDataWithMusicId: function (musicId) {
            this.fetch({reset: true, data: {music_id: musicId}});
        },


        loadNewList: function () {
            this.fetch({reset: true, data: {type: 'new'}});
        },


        loadPopularList: function () {
            this.fetch({reset: true, data: {type: 'popular'}});
        },


        loadHotList: function () {
            this.fetch({reset: true, data: {type: 'hot'}});
        },



    });


    return PopList;
});


/**
 * Like Model.
 */
define('models/pop/like',[], function () {

    var LikeModel = Backbone.Model.extend({
    
        defaults: {
            id: null
        },

        url: '/api/v1/likepop',
    });

    return LikeModel;
});


/**
 * Dislike Model.
 */
define('models/pop/dislike',[], function () {

    var DislikeModel = Backbone.Model.extend({
    
        defaults: {
            id: null
        },

        url: '/api/v1/dislikepop'
    });

    return DislikeModel; 
});

/**
 * View: Youtube
 */
define('views/common/youtube',[], function () {

    var YoutubeView = Backbone.View.extend({

        $blackout: null,

        // Screen Size.
        previewSize: null,
        movieSize: null,
        scaleSize: null,

        initialize: function () {
            _.bindAll(this, 'show', 'showScreen');

            this.previewSize = {width: 640, height: 500};
            this.movieSize = {width: 640, height: 390};
            this.scaleSize = 200 / this.previewSize.width;

        },

        events: {},

        render: function () {

        },

        show: function (youtubeIds, baseView) {
            this.showScreen(youtubeIds, baseView);
        },

        showScreen: function (youtubeIds, baseView) {
            console.log('showScreen', this);

            if (typeof youtubeIds === 'string') {
                this.youtubeIdArray = [youtubeIds];
            } else {
                this.youtubeIdArray = youtubeIds;
            }

            // 既に存在する場合には、それを削除する
            if (mb._youtubeView) {
                mb._youtubeView.dealloc();
            }
            mb._youtubeView = this;


            // HTMLとして追加
            mb.$playArea.html(this.$el);



            // 黒半透明の背景を表示
            this.$blackout = $('<div class="blackout"/>');
            this.$blackout.css({
                width: $(document).width(),
                height: $(document).height()
            });
            var self = this;
            this.$blackout.one('click', function (e) {
                $(e.currentTarget).transition({opacity: 0}, 200, function () {
                    console.log(self, self.$el);
                    self.$el.remove();
                    if (mb.windowResize2) {
                        window.removeEventListener('resize', mb.windowResize2);
                    }
                });
            });


            // Youtube再生画面を真ん中に表示
            baseView.$previewArea = $('<div id="previewArea" class="previewArea"/>');
            baseView.$previewArea.css(_.extend({}, this.previewSize, {
                'background-color': 'black',  // for debug
            }));
            // this.$blackout.append(baseView.$previewArea);
            this.$el.append(baseView.$previewArea);
            this.$previewArea = baseView.$previewArea;


            // 閉じるボタンを追加
            var $closeBtn = $('<a href="#" class="closeBtn"/>');
            $closeBtn.text('×');
            $closeBtn.on('click', _.bind(this.close, this));
            baseView.$previewArea.append($closeBtn);


            // 小さくするボタン
            var $minimizeBtn = $('<a href="#" class="minimizeBtn"/>');
            $minimizeBtn.text('-');
            $minimizeBtn.on('click', _.bind(this.minimize, this));
            baseView.$previewArea.append($minimizeBtn);


            // Youtubeを追加
            var $player = $('<div id="player"/>');
            $player.css(this.movieSize);
            baseView.$previewArea.append($player);

            var self = this;
            window.mb.windowResize2 = function () {
                self.$blackout.css({
                    width: $(document).width(),
                    height: $(document).height()
                });
                var moviePos = {x: (self.$blackout.width() - self.movieSize.width) / 2, y: ($(window).height() - self.movieSize.height) / 2};
                baseView.$previewArea.css({
                    position: 'fixed',
                    top: moviePos.y,
                    left: moviePos.x,
                });
            };
            window.addEventListener('resize', _.bind(mb.windowResize2, this));
            mb.windowResize2();

            if (baseView.pocket) {
                var $pocketBtn = $('<div class="btn btn-large btn-inverse btn-primary mlra mt20">');
                $pocketBtn.text('Pocket').css({
                    display: 'block',
                    'max-width': '200px',
                });
                $pocketBtn.on('click', _.bind(baseView.pocket, baseView));
                baseView.$previewArea.append($pocketBtn);
            }

            // youtubeをダウンロード
            function startYoutube () {
                var anId = self.youtubeIdArray.shift();
                player = new YT.Player('player', {
                    height: self.movieSize.width,
                    width: self.movieSize.height,
                    videoId: anId,
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });

            }
            if (window.YT) {
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

            };
            window.onPlayerStateChange = function (event) {
                console.log('onPlayerStateChange');
                if (event.data === YT.PlayerState.ENDED) {
                    console.log('youtube end');
                    if (self.youtubeIdArray.length > 0) {
                        var anId = self.youtubeIdArray[0];
                        self.youtubeIdArray = self.youtubeIdArray.slice(1, self.youtubeIdArray.length);
                        player.cueVideoById(anId);
                        if (!_.isIphone && !_.isAndroid) {
                            player.playVideo();
                        }
                    } else {
                        setTimeout(function () {
                            self.$blackout.transition({opacity: 0}, 200, function () {
                                self.$el.remove();
                                if (mb.windowResize2) {
                                    window.removeEventListener('resize', mb.windowResize2);
                                }
                            });
                        }, 2000);
                    }
                }
            };


        },




        playSampleMusic: function (songUrl) {
            console.debug('playSampleMusic: ', songUrl);

            var $blackout = $('<div class="blackout"/>');
            $blackout.on('click', function () {
                $(this).transit({opacity:0}, function () {
                    $(this).remove();
                });
            });
            $blackout.transit({opacity:1});
            var self = this;
            $('#playArea').append($blackout);

            this._playItunesMusic(songUrl, $blackout, function () {
                console.log('sampleMusic end.');
                $('#playArea .blackout').transit({opacity:0}, function () {
                    $(this).remove();
                });
            });

        },


        /**
         * YoutubeとiTunes視聴を交えて再生する
         */
        playMusics: function (options) {

            var musicArray = options.musicArray;
            var callbackWhenWillStart = options.callbackWhenWillStart || function () {};
            var callbackWhenEnd = options.callbackWhenEnd || function () {};
            this.options = options;


            // 再生対象なければ何もしない
            if (!musicArray || musicArray.length === 0) {
                console.warn('musicArray is not defined or empty');
                return;
            }

            // aliasを柔軟にする
            _.each(musicArray, function (music) {
                music.youtubeId = music.youtubeId || music.youtube_id;
                music.songUrl = music.songUrl || music.song_url;
                music.musicId = music.musicId || music.music_id;
                music.artistName = music.artistName || music.artist_name;
                music.artistId = music.artistId || music.artist_id;
            });


            // ベースAreaを作る
            mb.$playArea.html(this.$el);
            var $previewArea = $('<div id="previewArea" class="previewArea"/>');
            $previewArea.css(_.extend({}, this.previewSize, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                margin: '-250px 0 0 -320px',
                'background-color': 'black',
            }));
            this.$el.html($previewArea);


            // 連続再生の関数
            var self = this;
            var next = function (aMusic) {

                var func = _.bind(aMusic.youtubeId ? self._playYoutube : self._playItunesMusic, self);
                var param = aMusic.youtubeId || aMusic.songUrl;

                // callback.
                if (callbackWhenWillStart) {
                    callbackWhenWillStart(aMusic);
                }

                func(param, $previewArea, function () {


                    // end
                    if (musicArray.length === 0) {
                        if (callbackWhenEnd) {
                            callbackWhenEnd();
                        }
                        return;
                    }

                    // next
                    var music = musicArray.shift();
                    next(music);

                });
            };
            _.bind(next, this);

            // 再生開始
            var aMusic = musicArray.shift();
            next(aMusic);

        },




        /**
         * 閉じる
         */
        close: function () {

            if (this.options.callbackWhenEnd) {
                this.options.callbackWhenEnd();
            }

            this.$el.remove();

            return false;
        },


        /**
         * 小さくする
         */
        minimize: function () {
            console.log('minimize', this.scaleSize, this.$previewArea);

            $('#previewArea').toggleClass('posNotShow');


            return false;
        },



        /**
         * iTunes視聴曲を再生する
         */
         _playItunesMusic: function (songUrl, $appendView, endCallback) {

            // 初期化
            $appendView.html('');


            // 閉じるボタンを追加
            var $closeBtn = $('<a href="#" class="closeBtn">×</a>');
            $closeBtn.on('click', _.bind(this.close, this));
            $appendView.append($closeBtn);


            // 小さくするボタン
            var $minimizeBtn = $('<a href="#" class="minimizeBtn">-</a>');
            $minimizeBtn.on('click', _.bind(this.minimize, this));
            $appendView.append($minimizeBtn);


            // var $blackout = $('<div class="blackout"/>');
            // $blackout.on('click', function () {
            //     $(this).transit({opacity:0}, function () {
            //         $(this).remove();
            //     });
            // });
            // $blackout.transit({opacity:1});
            // $appendView.append($blackout);



            // audio tag.
            var audio = document.createElement('audio');
            audio.src = songUrl;
            audio.autoplay = true;
            audio.controls = true;
            audio = $(audio);
            audio.css({
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
            $appendView.append(audio);


            // callback.
            audio.on('ended', function () {
                if (endCallback) {
                    endCallback();
                }
            });


         },




        /**
         *  Youtubeを再生する
         */
        _playYoutube: function (youtubeId, $appendView, endCallback) {

            // 内容の初期化
            $appendView.html('');

            // 閉じるボタンを追加
            var $closeBtn = $('<a href="#" class="closeBtn">×</a>');
            $closeBtn.on('click', _.bind(this.close, this));
            $appendView.append($closeBtn);


            // 小さくするボタン
            var $minimizeBtn = $('<a href="#" class="minimizeBtn">-</a>');
            $minimizeBtn.on('click', _.bind(this.minimize, this));
            $appendView.append($minimizeBtn);


            // Youtubeエリア
            var $player = $('<div id="player"/>');
            $player.css(this.movieSize);
            $appendView.append($player);



            var self = this;
            // window.mb.windowResize2 = function () {
            //     self.$blackout.css({
            //         width: $(document).width(),
            //         height: $(document).height()
            //     });
            //     var moviePos = {x: (self.$blackout.width() - self.movieSize.width) / 2, y: ($(window).height() - self.movieSize.height) / 2};
            //     baseView.$previewArea.css({
            //         position: 'fixed',
            //         top: moviePos.y,
            //         left: moviePos.x,
            //     });
            // };
            // window.addEventListener('resize', _.bind(mb.windowResize2, this));
            // mb.windowResize2();

            // if (baseView.pocket) {
            //     var $pocketBtn = $('<div class="btn btn-large btn-inverse btn-primary mlra mt20">');
            //     $pocketBtn.text('Pocket').css({
            //         display: 'block',
            //         'max-width': '200px',
            //     });
            //     $pocketBtn.on('click', _.bind(baseView.pocket, baseView));
            //     baseView.$previewArea.append($pocketBtn);
            // }

            // youtubeをダウンロード
            var player;
            function startYoutube () {
                var anId = youtubeId;
                player = new window.YT.Player('player', {
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

            };
            window.onPlayerStateChange = function (event) {
                console.log('onPlayerStateChange');
                if (event.data === YT.PlayerState.ENDED) {
                    console.log('youtube end');

                    if (endCallback) {
                        endCallback();
                    }
                    // if (self.youtubeIdArray.length > 0) {
                    //     var anId = self.youtubeIdArray[0];
                    //     self.youtubeIdArray = self.youtubeIdArray.slice(1, self.youtubeIdArray.length);
                    //     player.cueVideoById(anId);
                    //     if (!_.isIphone && !_.isAndroid) {
                    //         player.playVideo();
                    //     }
                    // } else {
                    //     setTimeout(function () {
                    //         self.$blackout.transition({opacity: 0}, 200, function () {
                    //             self.$el.remove();
                    //             if (mb.windowResize2) {
                    //                 window.removeEventListener('resize', mb.windowResize2);
                    //             }
                    //         });
                    //     }, 2000);
                    // }
                }
            };




        },
















        /**
         * 終了処理
         */
        dealloc: function () {
            this.$el.remove();
        },



    });

    return YoutubeView;
});


/*
 *  TopView
 */
define('views/top',[
    'models/common/user_storage',
    'models/feeling/feeling_list',
    'models/pop/pop_list',
    'models/pop/like',
    'models/pop/dislike',
    'views/common/youtube'
], function (
    UserStorage,
    FeelingList,
    PopList,
    LikeModel,
    DislikeModel,
    YoutubeView
) {


    var TopView = Backbone.View.extend({

        // 表示タイプ
        displayType: 'new', // 'new', 'hot'

        // 表示Pop情報
        displayPopListMap: {},

        // fields.
        userStorage: new UserStorage(),
        collection: null,
        newPopList: null,
        popularPopList: null,
        hotPopList: null,
        userLikeArray: [],
        feelingFilterOfNewPopList: 0,
        feelingFilterOfPopularPopList: 0,
        feelingFilterOfHotPopList: 0,
        youtubeView: null,



        initialize: function () {

            // 自動イベントバインド
            _.bindEvents(this);


            _.bindAll(this,
                'render',
                'renderFeelingList',
                'renderNewPopList',
                'renderPopularPopList',
                'renderHotPopList',
                'filterNewPopList',
                'filterPopularPopList',
                'filterHotPopList',
                'likePop',
                'dislikePop',
                'playSong',
                'playAll');

            this.collection = new FeelingList();
            this.collection.bind('reset', this.renderFeelingList);
            this.newPopList = new PopList();
            this.newPopList.bind('reset', this.renderNewPopList);
            this.popularPopList = new PopList();
            this.popularPopList.bind('reset', this.renderPopularPopList);
            this.hotPopList = new PopList();
            this.hotPopList.bind('reset', this.renderHotPopList);

            var user = _.mbStorage.getUser();
            if (user && user.like_pop) {
                this.likeArray = JSON.parse(user.like_pop) || [];
            } else {
                this.likeArray = [];
            }

        },

        events: {
            'click [data-event="showPopList"]': 'showPopList',
            'change #newPopListFilter': 'filterNewPopList',
            'change #popularPopListFilter': 'filterPopularPopList',
            'change #hotPopListFilter': 'filterHotPopList',
            'click [data-event="likePop"]': 'likePop',
            'click [data-event="dislikePop"]': 'dislikePop',
            'click [data-event="playSong"]': 'playSong',
            'click [data-event="playAll"]': 'playAll',
        },

        render: function () {

            var feelingList = _.mbStorage.getCommon().feelings;
            var template = $('#page_top').html();
            var snipet = _.template(template, {feelingList:feelingList});
            this.$el.html(snipet);
        },


        renderFeelingList: function () {

        },


        renderNewPopList: function () {
            console.log('renderNewPopList. popList: ', this.newPopList, this.filterFeelings);
            var template = $('#page_top_poplist').html();
            var popList = this.newPopList.models;
            if (this.filterFeelings) {
                popList = _.filter(popList, _.bind(function (model) {
                    return _.contains(this.filterFeelings, model.attributes.feeling_id);
                    // return model.attributes.feeling_id === this.feelingFilterOfNewPopList;
                }, this));
            }
            this.displayPopListMap['new'] = popList;
            var snipet = _.template(template, {popList:popList, likeArray:this.likeArray});
            this.$el.find('#newPopList').html(snipet);
        },


        renderPopularPopList: function () {
            console.log('renderPopularPopList. popList: ', this.popularPopList);
            var template = $('#page_top_poplist').html();
            var popList = this.popularPopList.models;
            if (this.filterFeelings) {
                popList = _.filter(popList, _.bind(function (model) {
                    return _.contains(this.filterFeelings, model.attributes.feeling_id);
                    // return model.attributes.feeling_id === this.feelingFilterOfNewPopList;
                }, this));
            }
            this.displayPopListMap['popular'] = popList;
            var snipet = _.template(template, {popList:popList, likeArray:this.likeArray});
            this.$el.find('#popularPopList').html(snipet);
        },


        renderHotPopList: function () {
            console.log('renderHotPopList. popList: ', this.hotPopList);
            var template = $('#page_top_poplist').html();
            var popList = this.hotPopList.models;
            if (this.filterFeelings) {
                popList = _.filter(popList, _.bind(function (model) {
                    return _.contains(this.filterFeelings, model.attributes.feeling_id);
                    // return model.attributes.feeling_id === this.feelingFilterOfNewPopList;
                }, this));
            }
            this.displayPopListMap['hot'] = popList;
            var snipet = _.template(template, {popList:popList, likeArray:this.likeArray});
            this.$el.find('#hotPopList').html(snipet);
        },


        filterNewPopList: function (e) {
            var feelingId = $(e.currentTarget).val();
            this.feelingFilterOfNewPopList = parseInt(feelingId, 10);
            this.renderNewPopList();
        },

        filterPopularPopList: function (e) {
            var feelingId = $(e.currentTarget).val();
            this.feelingFilterOfPopularPopList = parseInt(feelingId, 10);
            this.renderPopularPopList();
        },

        filterHotPopList: function (e) {
            var feelingId = $(e.currentTarget).val();
            this.feelingFilterOfHotPopList = parseInt(feelingId, 10);
            this.renderHotPopList();
        },




        likePop: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.log('likePop: ', popId);

            _.likePop(popId, _.bind(function () {

                // 表示制御
                $li.find('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');

                // 情報更新
                _.mbStorage.refreshUser();

            }, this));

            return false;
        },



        dislikePop: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.debug('dislikePop: ', popId);

            _.dislikePop(popId, _.bind(function () {

                console.log('success dilike.');

                // 表示制御
                $li.find('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');

                // 情報更新
                _.mbStorage.refreshUser();

            }, this));

            return false;
        },



        playSong: function (e) {

            var $this = $(e.currentTarget);
            var $li = $this.parents('[data-pop-id]');
            var type = $this.parents('[data-type]').data('type');
            var popId = parseInt($li.data('pop-id'), 10);
            var displayPopList = this.displayPopListMap[this.displayType];
            console.debug('playSong: ', popId, displayPopList);


            // もしPause中の場合には、再開のみを行う
            if ($li.data('nowpausing')) {
                $li.removeAttr('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            // 表示オプションを作成
            var options = {};

            // プレイリスト名
            if (type === 'new') {
                options.playlistName = '新着Drop';
            } else if (type === 'popular') {
                options.playlistName = '人気Drop';
            } else if (type === 'hot') {
                options.playlistName = '急上昇Drop';
            }

            // 一意特定キー
            options.identifier = 'top_' + type;

            // 再生曲と開始位置
            options.musicArray = [];
            _.each(displayPopList, function (pop, idx) {
                if (pop.attributes.id === popId) {
                    options.startPos = idx;
                }
                options.musicArray.push(pop.attributes);
            });


            // 開始前コールバック
            options.callbackWhenWillStart = function (pop) {
                console.debug('callbackWhenWillStart is called.');

                // 表示をリセット
                $('[data-btn="pause"]').addClass('hidden');
                $('[data-btn="play"]').removeClass('hidden');

                // 今回再生分をフォーカス
                var $li = $('[data-type="'+type+'"] [data-pop-id="'+pop.id+'"]');
                $li.find('[data-btn="pause"]').removeClass('hidden');
                $li.find('[data-btn="play"]').addClass('hidden');


            };

            // 終了時コールバック、Pause時コールバック
            options.callbackWhenPause = options.callbackWhenEnd = function () {
                // 表示をリセット
                $('[data-btn="pause"]').addClass('hidden');
                $('[data-btn="play"]').removeClass('hidden');
            };


            // 再生開始
            console.debug('play music. options=', options);
            mb.musicPlayer.playMusics(options);

        },



        /**
            再生を一時停止する
        */
        pauseSong: function (e) {
            mb.musicPlayer.pauseMusic();
            $(e.currentTarget).parents('[data-pop-id]').attr('data-nowpausing', 'true');
        },









        playAll: function (e) {
            var target = $(e.currentTarget).data('target');
            console.log('playAll: ', target);

            var array = [];
            this.$el.find('#' + target + ' [data-event="playSong"]').each(function () {

                var $this = $(this);

                array.push({
                    musicId: $this.data('music-id'),
                    popId: $this.data('pop-id'),
                    songUrl: $this.data('song-url'),
                    youtubeId: $this.data('youtube-id')
                });
            });
            console.debug('targets: ', array);


            // create parameters.
            var params = {
                musicArray: array,
                callbackWhenWillStart: function (music) {
                    var $area = $('#' + target);
                    $area.find('tr').removeClass('success');
                    $area.find('tr[data-pop-id="'+music.popId+'"]').addClass('success');

                    // add play count.
                    _.addMusicPlayCount(music.musicId);
                }
            };


            // play
            this.youtubeView = new YoutubeView();
            this.youtubeView.playMusics(params);

        },





        /**
            タブ変化（変化自体は、Bootstrapで行うが、現在の状況のみ知りたいのでイベントを貼る）
        */
        changeTab: function (e) {
            this.displayType = $(e.currentTarget).data('tab-type');
            console.debug('changeTab: ', this.displayType);
        },




        /**
            キモチでのPocket絞り込み
        */
        filterWithFeelings: function (e) {
            console.debug('filterWithFeelings');

            var $this = $(e.currentTarget);

            // もしAllの場合には、ALLらしい動きをさせる
            if ($this.data('feeling-id') === 0) {
                $this.toggleClass('is-active');

                if ($this.hasClass('is-active')) {
                    this.$el.find('#feelingFilter li').addClass('is-active');
                } else {
                    this.$el.find('#feelingFilter li').removeClass('is-active');
                }

            // ALL以外
            } else {

                // もし全部がONの場合には、特別にそれのみを選択状態にする
                if (this.$el.find('#feelingFilter li').length === this.$el.find('#feelingFilter .is-active').length) {
                    this.$el.find('#feelingFilter li').removeClass('is-active');
                    $this.addClass('is-active');


                // 上記の特別仕様以外の場合
                } else {

                    $this.toggleClass('is-active');

                    // もし全部アクティブなら、ALLもアクティブにする
                    if ( this.$el.find('#feelingFilter .is-active:not([data-feeling-id="0"])').length === _.mbStorage.getCommon().feelings.length) {
                        this.$el.find('#feelingFilter [data-feeling-id="0"]').addClass('is-active');
                    } else {
                        this.$el.find('#feelingFilter [data-feeling-id="0"]').removeClass('is-active');
                    }

                }


            }


            // レンダリング
            var self = this;
            this.filterFeelings = [];
            this.$el.find('#feelingFilter .is-active').each(function () {
                self.filterFeelings.push($(this).data('feeling-id'));
            });

            console.debug('filterFeelings: ', this.filterFeelings);
            this.renderHotPopList();
            this.renderPopularPopList();
            this.renderNewPopList();


        },

















        show: function () {

            // render.
            this.render();

            // Load Datas.
            this.collection.fetch({reset: true});
            this.newPopList.loadNewList();
            this.popularPopList.loadPopularList();
            this.hotPopList.loadHotList();

        },


        showPopList: function (e) {
            var id = $(e.currentTarget).data('id');
            mb.router.navigate('poplist/' + id, true);
            return false;
        },


        dealloc: function () {
            this.$el.empty();
        },

    });

    return TopView;
});

/*
 * PopListView
 */
define('views/pop/list',[
    'models/pop/pop_list'
], function (
    PopList
) {
    var PopListView = Backbone.View.extend({

        initialize: function () {
            this.collection = new PopList();
            _.bindAll(this, 'render', 'showMusicPage', 'dealloc');
            this.collection.bind('reset', this.render);
        },

        events: {
            'click [data-event="showMusicPage"]': 'showMusicPage',
        },

        render: function () {
            console.log('render', this.collection);
            this.$el.html($('#page_popList').html());

            var data = {
                popList: this.collection.models
            };
            var popListHtml = _.template($('#page_popList_data').html(), data);
            this.$el.find('#popListBody').html(popListHtml);
        },


        showMusicPage: function (e) {
            console.log('showMusicPage');
            var music_id = $(e.currentTarget).data('music-id');
            mb.router.navigate('music/' + music_id, true);
        },

        show: function (feelingId) {
            this.collection.refreshDataWithFeelingId(feelingId);
        },

        dealloc: function () {

        },

    });

    return PopListView;
});


/**
 * Model: Music Link
 */
define('models/music/music_link',[], function () {

    var MusicLinkModel = Backbone.Model.extend({
        defaults: {
            id: null,
            music_id: null,
            user_id: null,
            comment: null,
            link: null,
            youtube_id: null,
            nico_id: null,
            create_at: null,
            update_at: null
        },


        urlRoot: '/api/v1/music_links',


        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: localStorage.getItem('uid')},
                success: _.bind(function () {
                }, this),
                error: _.bind(function (jqXHR, status) {
                    console.log('Pop save failed. reson: ', arguments);
                    if (status.status === 403) {
                        mb.router.appView.authErrorHandler();
                    }
                }, this),
            });
        },
    });

    return MusicLinkModel;
});


/**
 *  Collection: Music Link List
 */
define('models/music/music_link_list',['models/music/music_link'], function (MusicLink) {

    var PopList = Backbone.Collection.extend({

        model: MusicLink,

        url: function () {
            return '/api/v1/music_links2';
        },

        refreshDataWithMusicId: function (musicId) {
            this.fetch({reset: true, data: {music_id: musicId}});
        },

    });


    return PopList;
});


/*
 * Model: User Pocket
 */
define('models/user/user_pocket',[], function () {
    console.debug('load: model:user_pocket');

    var UserPocketModel = Backbone.Model.extend({

        defaults: {
            id: null,
            user_id: null,
            music_id: null,
            feeling_id: 0,
            tags: null,
            youtube_id: null,
            music_link_id: null,
            create_at: null,
            update_at: null
        },


        urlRoot: '/api/v1/user_pockets/',


        load: function (id) {
            this.set('id', id);
            this.fetch();
        },

        create: function () {
            console.log('create');
            this.save(this.attributes, {
                // headers: {uid: localStorage.getItem('uid')},
                error: _.bind(function (jqXHR, statusObject, err) {
                    console.log('Pop save failed. reson: ', arguments);
                    if (statusObject.status === 403) {
                        mb.router.appView.authErrorHandler();
                    }
                }, this),
            });
        },
    });


    // static method.
    UserPocketModel.createInstance = function (data) {

        var userPocket = new UserPocketModel();
        userPocket.set('id', data.id);
        userPocket.set('user_id', data.user_id);
        userPocket.set('music_id', data.music_id);
        userPocket.set('youtube_id', data.youtube_id);
        userPocket.set('music_link_id', data.music_link_id);
        userPocket.set('create_at', data.create_at);
        userPocket.set('update_at', data.update_at);
        return userPocket;
    };




    return UserPocketModel;
});


/**
 *  View: Music
 */
define('views/music/index',[
    'views/common/youtube',
    'views/pop/index',
    'models/music/music',
    'models/pop/pop_list',
    'models/music/music_link',
    'models/music/music_link_list',
    'models/user/user_pocket',
    'models/common/user_storage'
], function (
    YoutubeView,
    PopView,
    Music,
    PopList,
    MusicLink,
    MusicLinkList,
    UserPocket,
    UserStorage
) {

    var MusicDetailView = Backbone.View.extend({

        music_id: null,
        userStorage: new UserStorage(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            this.musicLinkCollection = new MusicLinkList();
            _.bindAll(this, 'addLink', 'render', 'renderMusicInfo', 'renderPopList', 'renderMusicLinkList', 'finishUserAddMusicLink', 'show', 'dealloc');
            this.musicLinkCollection.bind('reset', this.renderMusicLinkList);
        },

        events: {
            'click #addLink': 'addLink',
        },

        render: function () {
            console.log('render');
            // reset
            this.$el.empty();
            // add frame
            var frame = _.template($('#page_music_detail').html(), {music_id: this.music_id});
            this.$el.append(frame);
        },



        renderMusicInfo: function () {
            console.log('renderMusicInfo', this.music.attributes);

            var musicInfo = _.template($('#page_music_detail_info').html(), _.extend({
                repPop: this.repPop
            }, this.music.attributes, _.mbStorage.getCommon()));
            this.$el.find('#musicInfoArea').html(musicInfo);
        },



        renderPopList: function () {
            console.log('renderPopList');
            var html = _.template($('#page_music_detail_poplist').html(), {popList: this.popList.models});
            this.$el.find('#popListArea').html(html);
        },



        renderMusicLinkList: function () {
            var template = $('#page_music_detail_music_links').html();
            var snipet = _.template(template, {musicLinkList: this.musicLinkCollection.models});
            this.$el.find('#musicLinkListArea').html(snipet);

        },


        addLink: function (e) {
            var $this = $(e.currentTarget);
            var $container = $this.parents('.add-musicLink');
            var comment = $container.find('[data-type="comment"]').val();
            var link = $container.find('[data-type="link"]').val();

            // データチェック
            if (comment.length === 0) {
                alert('コメントは必須です');
                return;
            }
            if (link.length === 0) {
                alert('動画のリンクは必須です。');
                return;
            }
            if (link.toLowerCase().indexOf('http://') !== 0
                    && link.toLowerCase().indexOf('https://') !== 0) {
                alert('動画リンクのURLが正しくありません。. \nURLには、 http:// または https:// を付けてください。');
                return;
            }

            // データ保存
            this.userAddMusicLink = new MusicLink();
            this.userAddMusicLink.attributes.music_id = this.music.attributes.id;
            this.userAddMusicLink.attributes.comment = comment;
            this.userAddMusicLink.attributes.link = link;
            this.userAddMusicLink.bind('sync', this.finishUserAddMusicLink);
            this.userAddMusicLink.create();
        },

        finishUserAddMusicLink: function () {
            alert('success');
            window.location.reload();
        },


        /**
         * 曲をPocketする
         */
        addPocket: function (e) {
            console.log('addPocket', this.music.id);

            var $this = $(e.currentTarget);
            var data = {
                music_id: this.music.id,
                youtube_id: $this.data('youtube-id'),
                music_link_id: $this.data('link-id')
            };

            _.addPocket(data, _.bind(function () {
                this.$el.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            }, this));


            return false;
        },


        /**
            Pocketを解除する
        */
        deletePocket: function () {

            var pocketId = _.selectPocketId(this.music.id);
            _.deletePocket(pocketId, _.bind(function () {
                this.$el.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            }, this));

        },



        /**
            Popを追加するUIを表示する
        */
        addPop: function () {

            // show PopView.
            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(this.music_id, undefined, 'modal');
        },



        /**
            曲を再生する
        */
        playMusic: function (e) {
            var $this = $(e.currentTarget);
            var self = this;
            var options = {};

            // Pause中ならそれを再生する
            if ($('#playBtnArea').hasClass('nowpausing')) {
                $('#playBtnArea').removeClass('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            // プレイリスト名、特定子
            options.playlistName = this.music.attributes.title;
            options.identifier = 'music_detail ' + this.music.id;

            // 開始位置と内容
            options.startPos = 0;
            var aMusicInfo = this.music.attributes;
            aMusicInfo.music_id = this.music.id;
            options.musicArray = [aMusicInfo];

            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {

                this.$el.find('#musicInfoArea [data-event-click="playMusic"]').addClass('hidden');
                this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').removeClass('hidden');

            }, this);
            options.callbackWhenEnd = _.bind(function () {

                this.$el.find('#musicInfoArea [data-event-click="playMusic"]').removeClass('hidden');
                this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').addClass('hidden');

            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);


        },


        /**
            曲の再生を行う
        */
        playYoutube: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var musicLinkId = $(e.currentTarget).data('musiclink-id');
            console.debug('playYoutube.', musicLinkId);

            var options = {};

            // プレイリスト名、特定子
            options.playlistName = this.music.attributes.title;
            options.identifier = 'music_detail ' + this.music.id;

            // 開始位置と内容
            options.startPos = 0;
            var aMusicInfo = this.music.attributes;
            aMusicInfo.music_id = this.music.id;
            aMusicInfo.youtube_id = this.musicLinkCollection.get(musicLinkId).attributes.youtube_id;
            options.musicArray = [aMusicInfo];

            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);

            // リンクの再生回数を通知
            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            _.addMusicLinkPlayCount(this.music.id, musicLinkId);


            return false;
        },









        /**
            曲を一時停止する
        */
        pauseMusic: function () {
            $('#playBtnArea').addClass('nowpausing');
            mb.musicPlayer.pauseMusic();

            this.$el.find('#musicInfoArea [data-event-click="playMusic"]').removeClass('hidden');
            this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').addClass('hidden');

        },



        /**
            ユーザーフォロー
        */
        followUser: function () {
            var userId = this.repPop.attributes.user_id;
            _.followUser(userId, function () {
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
            });
        },


        /**
            ユーザーフォロー解除
        */
        unfollowUser: function () {
            var userFollowId = _.selectUserFollowId(this.repPop.attributes.user_id);
            _.unfollowUser(userFollowId, function () {
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
            });
        },


        /**
            Popに対するLike
        */
        likePop: function () {
            _.likePop(this.repPop.attributes.id, function () {
                $('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');
            });
        },


        /**
            PopのLike解除
        */
        dislikePop: function () {
            _.dislikePop(this.repPop.attributes.id, function () {
                $('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');
            });
        },


        /**
            Popに対するLike（その他リンク向け）
        */
        likePop2: function (e) {
            e.preventDefault();
            e.stopPropagation();            

            var $parent = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $parent.data('pop-id');

            _.likePop(popId, function () {
                $parent.find('[data-event-click="likePop2"], [data-event-click="dislikePop2"]').toggleClass('hidden');
            });

            return false;
        },


        /**
            PopのLike解除（その他リンク向け）
        */
        dislikePop2: function (e) {
            e.preventDefault();
            e.stopPropagation();            

            var $parent = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $parent.data('pop-id');

            _.dislikePop(popId, function () {
                $parent.find('[data-event-click="likePop2"], [data-event-click="dislikePop2"]').toggleClass('hidden');
            });

            return false;
        },








        /**
         * Youtube APIを利用してYoutubeを再生する
         */
        showYoutube: function (e) {
            var youtubeId = $(e.currentTarget).data('youtube-id');
            console.log('showYoutube', youtubeId);

            mb.youtubeView = new YoutubeView();
            mb.youtubeView.showScreen(youtubeId, this);



            // aタグ機能は無効化
            return false;
        },



        /**
            Link削除
        */
        deleteLink: function (e) {
            e.preventDefault();
            e.stopPropagation();            

            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            console.debug('deleteLink.', musicLinkId);

            if (window.confirm('リンクを削除しますか')) {

                var musicLink = this.musicLinkCollection.get(musicLinkId);
                musicLink.set('id', musicLinkId);
                musicLink.bind('sync', _.bind(function () {

                    this.musicLinkCollection.remove(musicLink);
                    this.renderMusicLinkList();

                }, this));
                musicLink.destroy();

            }

            return false;
        },



        /**
            レポート機能
        */
        report: function (e) {
            e.preventDefault();
            e.stopPropagation();            

            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            console.debug('report.', musicLinkId);

            // 今はリンク切れだけ
            $.ajax({
                url: '/api/v1/reports',
                method: 'post',
                data: {
                    type: 1,
                    music_link_id: musicLinkId
                },
                success: function () {
                    alert('報告ありがとうございます');
                },
                error: function (xhr) {
                    if (xhr.status === 403) {
                        mb.router.appView.authErrorHandler();
                        return;
                    } else {
                        alert('エラーが発生しました。ブラウザのリロードをお願いします。');
                        console.log('error: ', arguments);
                    }
                },
            });



            return false;
        },
        













        show: function (musicId) {
            this.music_id = musicId;
            this.render();

            // 音楽を取得する
            this.music = new Music();
            this.music.set('id', musicId);
            this.music.bind('sync', _.bind(function () {

                this.music.loaded = true;

                // デフォルト値を設定する
                this.music.attributes.feeling_id = this.music.attributes.feeling_id || 1;

                if (this.popList.loaded) {
                    this.renderMusicInfo();
                    this.renderPopList();
                }


            }, this));
            this.music.fetch();


            // Popを取得する
            this.popList = new PopList();
            this.popList.bind('reset', _.bind(function () {

                this.popList.loaded = true;


                // Like数が多い順に並び替える
                this.popList.models = _.sortBy(this.popList.models, function (pop) {
                    return (pop.like_count_speed || 0) * -1;
                });

                // 一番Likeされているものを代表Popとする
                this.repPop = (this.popList.length > 0 ? this.popList.models[0] : null);



                if (this.music.loaded) {
                    this.renderMusicInfo();
                    this.renderPopList();
                }

            }, this));
            this.popList.fetch({reset:true, data:{music_id:musicId}});


            // this.popList.refreshDataWithMusicId(musicId);
            this.musicLinkCollection.refreshDataWithMusicId(musicId);
        },







        dealloc: function () {
            this.$el.empty();
        },
    });

    return MusicDetailView;
});


























/*
 * Model: iTuens Ranking 
 */
define('models/search/itunes_ranking',[],function () {

    var ITunesRanking = Backbone.Model.extend({
        defaults: {
            id: null,
            ranking: null,
            genre_id: null,
            genre_name: null,
            music_id: null,
            title: null,
            artwork_url: null,
            song_url: null,
            artist_name: null,
            itunes_url: null,
            create_at: null,
            update_at: null
        },
    });

    return ITunesRanking;
});

/**
 *  Collection: iTunes Ranking List
 */
define('models/search/itunes_ranking_list',['models/search/itunes_ranking'], function (ITunesRanking) {

    var ITunesRankingList = Backbone.Collection.extend({
        model: ITunesRanking,
        url: function () {
            return '/api/v1/itunes_rankings';
        },
        refreshDataWithGenre: function (genreId) {
            this.fetch({reset: true, data: {genre_id: genreId}});
        },
    });


    return ITunesRankingList;
});


/*
 * ITunesRankingListView
 */
define('views/music/itunes_ranking',[
    'models/common/user_storage',
    'models/search/itunes_ranking_list'
], function (
    UserStorage,
    ITunesRankingList
) {
    var ITunesRankingListView = Backbone.View.extend({

        // fields.
        userStorage: new UserStorage(),
        currentPage: 0,
        numOfContentPerPage: 40,


        initialize: function () {
            this.iTunesRankingList = new ITunesRankingList();
            _.bindAll(this, 'render', 'renderResult', 'addPop', 'changeGenre', 'paging');
            this.iTunesRankingList.bind('reset', this.renderResult);
        },

        events: {
            'click [data-event="addPop"]': 'addPop',
            'change #genreSelect': 'changeGenre',
            'click [data-event="paging"]': 'paging'
        },

        render: function () {
            console.log('render');
            var codes = this.userStorage.getCommon().codes;
            var genres = _.filter(codes, function (code) {return code.key1 === 'genre';});
            genres = _.sortBy(genres, function (genre) {return genre.key2;});
            console.log(genres);
            this.$el.html(_.template($('#page_search_itunes_ranking').html(), {genres: genres}));
        },

        renderResult: function () {
            console.log('renderResult');
            console.log(this.iTunesRankingList, this);
            this.iTunesRankingList.models = _.sortBy(this.iTunesRankingList.models, function (obj) {
                return obj.attributes.ranking;
            });

            var totalPage;
            if ((this.iTunesRankingList.models.length / this.numOfContentPerPage) === Math.floor(this.iTunesRankingList.models.length / this.numOfContentPerPage)) {
                totalPage = Math.floor(this.iTunesRankingList.models.length / this.numOfContentPerPage);
            } else {
                totalPage = Math.floor(this.iTunesRankingList.models.length / this.numOfContentPerPage) + 1;
            }

            var html = _.template($('#music_search_result').html(), {
                currentPage: this.currentPage, 
                numOfContentPerPage: this.numOfContentPerPage,
                totalPage: totalPage,
                results: this.iTunesRankingList.models,
                startPos: this.currentPage * this.numOfContentPerPage,
                endPos : Math.min((this.currentPage+1) * this.numOfContentPerPage, this.iTunesRankingList.models.length)
            });
            console.log('totalPage: ', Math.floor(this.iTunesRankingList.models.length / this.numOfContentPerPage),this.iTunesRankingList.models.length,this.numOfContentPerPage );
            this.$el.find('#searchResult').html(html);
        },

        addPop: function (e) {
            var musicId = $(e.currentTarget).data('music-id');
            console.log('addPop: music_id=', musicId);
            mb.router.navigate('music/' + musicId + '/pop/add', true);
        },


        changeGenre: function (e) {
            var genreId = $(e.currentTarget).val();
            this.currentPage = 0;
            this.iTunesRankingList.refreshDataWithGenre(genreId);
        },


        paging: function (e) {
            this.currentPage = $(e.currentTarget).data('page-num');
            this.renderResult();

            return false;
        },


        show: function () {
            this.render();
            console.log(this.iTunesRankingList);
            console.log(ITunesRankingList);
            this.iTunesRankingList.refreshDataWithGenre(-1);
        },

        dealloc: function () {

        },

    });

    return ITunesRankingListView;
});


/**
 * View: iTunes Search View
 */
define('views/music/itunes_search',[], function () {

    var ITunesSearchView = Backbone.View.extend({

        // 検索結果
        results: null,
    
        initialize: function () {

            _.bindAll(this, 'render', 'searchWhenKeyUp', 'search', 'musicDetail', 'show', 'dealloc');
        },


        events: {
            'keyup #searchTerm': 'searchWhenKeyUp',
            'click #searchBtn': 'search',
            'click [data-event="goDetail"]': 'musicDetail',
        },


        render: function () {
            console.log('ITunesSearchView#render');
            var template = $('#page_itunes_search').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },

        searchWhenKeyUp: function (e) {
            if (e.keyCode === 13) {
                this.search();
            }
        },

        search: function () {
            var terms = $('#searchTerm').val() || '';
            var country = $('#searchCountry').val();
            console.log('search', terms, country);

            
            // 検索ワードを分ける
            var words = [];
            var strs = terms.split(' ');
            _.each(strs, function (str) {
                var strs2 = str.split('　');
                _.each(strs2, function (str2) {
                    if (str2.length !== 0) {
                        words.push(str2);
                    }
                });
            });
            console.log(words); 

            // 必須チェック
            if (words.length === 0) {
                alert('検索条件は必須です');
                $('#searchTerm').val('');
                return false;
            }

            // 検索結果を初期化する
            this.$el.find('#search_result').html();

            // iTunes APIを使って検索する
            var self = this;
            $.ajax({
                url: 'https://itunes.apple.com/search?',
                data: {
                    term: words.join('+'),
                    country: 'JP', //country,
                    media: 'music',
                    entity: 'song',
                },
                dataType: 'jsonp',
                success: function (json) {
                    var results = json.results;

                    // 同じ曲が複数存在するので、間引く
                    var newResults = [];
                    _.each(results, function (result) {
                        var found = false;
                        for (var i = 0; i < newResults.length; i++) {
                            var newResult = newResults[i];
                            if (result.trackName === newResult.trackName && result.artistName === newResult.artistName) {
                                found = true;
                                break;
                            }
                        }
                        if (found === false) {
                            newResults.push(result);
                        }
                    });
                    self.results = newResults;



                    self.showResult();
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('API ERROR');
                }
            
            });

        },


        showResult: function () {
            console.log('showResult:', this.results);
            var template = $('#page_itunes_search_result').html();
            var snipet = _.template(template, {results: this.results});
            this.$el.find('#search_result').html(snipet);
        },


        musicDetail: function (e) {
            var pos = $(e.currentTarget).data('pos');
            pos = parseInt(pos, 10);
            console.log('musicDetail', pos);

            var result = this.results[pos];
            console.log('result: ', result);


            // 検索して、MusicIdを受け取る
            $.ajax({
                url: '/api/v1/musics/search_with_itunes',
                method: 'POST',
                data: result,
                dataType: 'json',
                success: function (json) {
                    console.log('json: ', json);

                    // 曲詳細へ遷移
                    mb.router.navigate('music/' + json.music_id, true);
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('ERROR');
                },
            });




            return false;
        },


        show: function () {
            this.render();
        },


        dealloc: function () {

        },
    
    });

    return ITunesSearchView;
});

/**
 * View: Music - Search
 */
define('views/music/search',[
    'views/pop/index',
    'views/music/itunes_ranking',
    'views/music/itunes_search',
], function (
    PopView,
    ITunesRankingView,
    ITunesSearchView

) {

    var SearchView = Backbone.View.extend({


        // 検索結果
        iTunesSearchResultList: [],

        // fields.
        iTunesRankingView: null,
        iTunesSearchView: null,


        initialize: function () {

            // auto event bind.
            _.bindEvents(this);

            this.iTunesRankingView = new ITunesRankingView();
            this.iTunesSearchView = new ITunesSearchView();

            _.bindAll(this, 'showITunesRanking', 'showITunesSearch');
        },

        events: {
            'click [data-event="showITunesRanking"]': 'showITunesRanking',
            'click [data-event="showITunesSearch"]': 'showITunesSearch',
        },

        render: function () {
            var html = _.template($('#page_search').html());
            this.$el.html(html);

            // 初期表示でiTunes検索を表示
            this.showITunesSearch();
        },


        /**
            iTunes検索結果を表示する
        */
        renderSearchResult: function () {
            console.debug('renderSearchResult: ', this.iTunesSearchResultList);

            var snipet = _.mbTemplate('page_search_itunes_results', {results: this.iTunesSearchResultList});
            this.$el.find('#resultList').html(snipet);

            // 件数も更新する
            this.$el.find('#numOfResult').text(this.iTunesSearchResultList.length);
        },





        /**
            iTunes検索
        */
        searchByItunes: function () {

            // 検索ワード
            var ws = this.$el.find('#conditionInput').val().split(/\s/);
            var words = [];
            _.each(ws, function (w) {
                w = _.trim(w);
                if (w && w.length > 0) {
                    words.push(w);
                }
            });

            // なしの場合にはだめ
            if (words.length === 0) {
                alert('検索条件を入力してください');
                $('#conditionInput').val('');
                return;
            }
            console.debug('conditions=', words);


            // 検索結果を初期化する
            this.$el.find('#numOfResult').text('0');
            this.$el.find('#resultList').html('');


            // iTunes APIを使って検索する
            var self = this;
            $.ajax({
                url: 'https://itunes.apple.com/search?',
                data: {
                    term: words.join('+'),
                    country: 'JP', //country,
                    media: 'music',
                    entity: 'song',
                },
                dataType: 'jsonp',
                success: function (json) {
                    var results = json.results;

                    // 同じ曲が複数存在するので、間引く
                    var newResults = [];
                    _.each(results, function (result) {
                        var found = false;
                        for (var i = 0; i < newResults.length; i++) {
                            var newResult = newResults[i];
                            if (result.trackName === newResult.trackName && result.artistName === newResult.artistName) {
                                found = true;
                                break;
                            }
                        }
                        if (found === false) {
                            newResults.push(result);
                        }
                    });
                    self.iTunesSearchResultList = newResults;

                    self.renderSearchResult();
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('エラーが発生しました。再読み込みしてください。');
                }
            });
        },



        /**
            曲詳細ページへ行く
        */
        goMusicDetail: function (e) {

            var pos = $(e.currentTarget).parents('li').data('pos');
            this._loadMusicInfo(pos, _.bind(function (music) {
                // 曲詳細へ遷移
                mb.router.navigate('music/' + music.id, true);
            }, this));

        },




        /**
            Dropを書く
        */
        writeDrop: function (e) {

            var pos = $(e.currentTarget).parents('li').data('pos');
            this._loadMusicInfo(pos, _.bind(function (music) {

                // show PopView.
                this.popView = new PopView();
                this.$el.append(this.popView.$el);
                this.popView.show(this.music_id, undefined, 'modal');

            }, this));

        },




        /**
            該当曲情報をサーバーから取得する
        */
        _loadMusicInfo: function (pos, callback) {

            pos = parseInt(pos, 10);
            var result = this.iTunesSearchResultList[pos];
            console.log('result: ', result);


            // 検索して、MusicIdを受け取る
            $.ajax({
                url: '/api/v1/musics/search_with_itunes',
                method: 'POST',
                data: result,
                dataType: 'json',
                success: function (json) {
                    console.log('json: ', json);
                    callback(json);
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('ERROR');
                },
            });

        },













        show: function () {
            this.render();
        },


        showITunesRanking: function () {
            // iTunesランキング検索画面を表示
            this.$el.find('#searchArea').html(this.iTunesRankingView.$el);
            this.iTunesRankingView.show();
            return false;
        },

        showITunesSearch: function () {
            // iTunes検索画面を表示
            this.$el.find('#searchArea').html(this.iTunesSearchView.$el);
            this.iTunesSearchView.show();
            return false;
        },



        dealloc: function () {},
    });

    return SearchView;
});


/**
 * Model: User
 */
define('models/user/user',[], function () {

    var User = Backbone.Model.extend({

        defaults: {
            id: null,
            user_id: null,
            password: null,
            name: null,
            thumb_url: null,
            sex: null,
            birthday: null,
            pocket_filter: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/users',
    });

    return User;
});


/**
 * View: Login
 */
define('views/login',[
    'models/user/user',
    'models/common/user_storage',
], function (
    UserModel,
    UserStorage
) {

    var LoginView = Backbone.View.extend({

        // Fields.
        type: null,
        successCallback: null,
        userStorage: new UserStorage(),



        initialize: function () {
            this.model = new UserModel();
            _.bindAll(this, 'render', 'renderForMordal', 'show', 'login', 'dealloc');
        },
        events: {
            'click #loginBtn': 'login',
        },
        template: $('#page_login').html(),

        render: function () {
            var html = _.template(this.template, {color: undefined});
            this.$el.html(html);

            var userInfo = this.userStorage.getUser();
            if (userInfo) {
                $('#userId').text(userInfo.user_id);
            }

            $('#userId').focus();
        },

        renderForMordal: function () {

            var self = this;

            var $clickArea = $('<div id="clickArea"/>');
            $clickArea.css({
                width: '100%',
                height: '100%',
                position: 'fixed',
                top: 0,
                left: 0,
                'background-color': 'rgba(255,255,255,.2)',
                'z-index': 100,
            }).on('click', function (e) {
                console.log('remove modal dialog.', e);
                if (e.target.id !== 'clickArea') {
                    return false;
                }
                self.$el.remove();
                return;
            });
            this.$el.html($clickArea);

            var $blackout = $('<div/>');
            $blackout.css({
                width: '80%',
                padding: '20px 0',
                'background-color': 'rgba(0,0,0,.85)',
                position: 'fixed',
                top: '25%',
                left: '10%',
            });
            $clickArea.html($blackout);

            var snipet = _.template(this.template, {color: 'white'});
            $blackout.html(snipet);


            var userInfo = this.userStorage.getUser();
            if (userInfo) {
                $('#userId').val(userInfo.user_id);
                $('#password').focus();
            } else {
                $('#userId').focus();
            }


            $('#loginBtn').off().on('click', _.bind(this.login, this));

        },




        login: function () {
            console.log('login btn');
            var userId = $('#userId').val();
            var password = $('#password').val();
            this.model.set('user_id', userId);
            this.model.set('password', password);

            // TODO make HTTPS
            var self = this;
            $.ajax({
                url: '/api/v1/login',
                method: 'post',
                data: {user_id: userId, password: password},
                success: function (info) {
                      alert('login successed');

                      // Storage保存
                      _.mbStorage.setUser(info.user);

                      if (self.successCallback) {
                        self.successCallback();
                      } else {
                        if (info.isNew) {
                            mb.router.navigate('#', true);
                        } else {
                            mb.router.navigate('#mypage', true);

                        }
                      }
                },
                 error: function () {
                     console.log('login error', arguments);
                     alert('login error');
                 },
            });

            return false;
        },


        show: function (type, successCallback) {
            this.type = type;
            this.successCallback = successCallback;
            if (type === 'modal') {
                this.renderForMordal();
            } else {
                this.render();
            }
        },
        dealloc: function () {},

    });

    return LoginView;
});

/**
 *	View: Confirm Dialog
 */
 define('views/common/confirmDialog',[], function () {

 	var ConfirmDialog = Backbone.View.extend({

 		// fields.
 		message: '',
 		yesButtonLabel: 'OK',
 		noButtonLabel: 'Cancel',
 		yesButtonCallback: function () {},
 		noButtonCallback: function () {},


 		initialize: function () {

 			// auto event bind.
 			_.bindEvents(this);

 			// bind.
 			_.bindAll(this, 'show', 'render', 'close', 'dealloc');
 		},


 		render: function () {
 			var snipet = _.mbTemplate('confirmDialog', this);
 			this.$el.html(snipet);
 			$('body').append(this.$el);
 		},


 		yesAction: function () {
 			this.yesButtonCallback();
 			this.close();
 		},


 		noAction: function () {
 			this.noButtonCallback();
 			this.close();
 		},


 		show: function (options) {

 			// set data.
 			this.message = options.message || this.message;
 			this.yesButtonLabel = options.yesButtonLabel || this.yesButtonLabel;
 			this.noButtonLabel = options.noButtonLabel || this.noButtonLabel;
 			this.yesButtonCallback = options.yesButtonCallback || this.yesButtonCallback;
 			this.noButtonCallback = options.noButtonCallback || this.noButtonCallback;

 			// reder.
 			this.render();

 		},


 		close: function () {

 			var self = this;
 			this.$el.transit({opacity: 0}, 200, function () {
 				self.dealloc();
 			});
 		},


 		dealloc: function () {
 			this.$el.remove();
 		},

 	});

 	return ConfirmDialog;
 });

/**
 * Collection: User Pocket Collection
 */
define('models/user/user_pocket_list',['models/user/user_pocket'], function (UserPocket) {

    var UserPocketCollection = Backbone.Collection.extend({

        model: UserPocket,

        url: function () {
            return '/api/v1/user_pockets2';
        },

        refreshDataWithUserId: function (userId) {
            this.fetch({
                reset: true,
                data: {
                    user_id: userId
                },
            });
        },
    });

    // static method.
    UserPocketCollection.createList = function (pockets) {
        var collection = new UserPocketCollection();
        _.each(pockets, function (pocket) {

            var model = new UserPocket();
            model.attributes = pocket;

            collection.add(model);
        });
        return collection;
    }


    return UserPocketCollection;
});



/*
 * Model: User Playlist
 */
define('models/user/user_playlist',[], function () {

    var UserPlaylistModel = Backbone.Model.extend({
    
        defaults: {
            id: null,
            user_id: null,
            type: null,
            title: null,
            seq: null,
            user_pocket_ids: '[]',
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_playlists/',


    });

    return UserPlaylistModel;
});


/**
 * Collection: User Pocket Collection
 */
define('models/user/user_playlist_list',['models/user/user_playlist'], function (UserPlaylist) {

    var UserPlaylistCollection = Backbone.Collection.extend({

        model: UserPlaylist,

        url: function () {
            return '/api/v1/user_playlists';
        },


        fetchFollowPlaylist: function (userId) {
            this.fetch({
                reset: true,
                url: '/api/v1/follow_playlists',
                data: {
                    user_id: userId
                }
            });
        },

    });

    return UserPlaylistCollection;
});



/**
 * Model: User Follow
 */
define('models/user/user_follow',[], function () {
    
    var UserFollowModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            user_id: null,
            dest_user_id: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_follows/',
    });

    return UserFollowModel;
});

/**
 * Collection: User Follow
 */
define('models/user/user_follow_list',['models/user/user_follow'], function (UserFollow) {

    var UserFollowCollection = Backbone.Collection.extend({

        model: UserFollow,

        url: '/api/v1/user_follows',
    });

    return UserFollowCollection;
});


/**
 * Model: User Artist Follow
 */
define('models/user/user_artist_follow',[], function () {
    
    var UserArtistFollowModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            user_id: null,
            artist_id: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_artist_follows/',
    });

    return UserArtistFollowModel;
});

/**
 * Collection: User Follow
 */
define('models/user/user_artist_follow_list',['models/user/user_artist_follow'], function (UserArtistFollow) {

    var UserArtistFollowCollection = Backbone.Collection.extend({

        model: UserArtistFollow,

        url: '/api/v1/user_artist_follows',
    });

    return UserArtistFollowCollection;
});


/**
 * View: Mypage
 */
define('views/mypage',[
    'views/common/youtube',
    'views/common/confirmDialog',
    'views/pop/index',
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_playlist',
    'models/user/user_playlist_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/user/user_artist_follow',
    'models/user/user_artist_follow_list',
    'models/pop/pop',
    'models/pop/pop_list',
    'models/common/user_storage',
], function (
    YoutubeView,
    ConfirmDialogView,
    PopView,
    User,
    UserPocket,
    UserPocketList,
    UserPlaylist,
    UserPlaylistList,
    UserFollow,
    UserFollowList,
    UserArtistFollow,
    UserArtistFollowList,
    Pop,
    PopList,
    UserStorage
) {

    var MypageView = Backbone.View.extend({

        currentPlaylist: null,
        userStorage:  new UserStorage(),
        displayPocketListModel: new UserPocketList(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this,
                'render',
                'renderMyDrops',
                'renderCheckArtists',
                'renderFollowUsers',
                'renderFollowedUsers',
                '_filterUserPocketList',
                'renderUserPocketListArea',
                'renderUserPocketList',
                'renderPlaylist',
                'renderUserFollowPlaylist',
                'deletePocket',
                'filterPockets',
                'show',
                'dealloc');

            this.userPlaylistList = new UserPlaylistList();
            this.userPlaylistList.bind('reset', this.renderPlaylist);
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);
            this.userArtistFollowList = new UserArtistFollow();
            this.userArtistFollowList.bind('reset', this.renderUserArtistFollow);


        },



        // マイページ表示
        render: function () {
            var snipet = _.mbTemplate('page_mypage', {user:this.user});
            this.$el.append(snipet);
        },


        // マイDrop表示
        renderMyDrops: function () {
            var snipet = _.mbTemplate('page_mypage_mypop_list', {popList:this.myPopList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfMyDrops').text('(' + this.myPopList.length + ')');
        },


        // チェックアーティスト表示
        renderCheckArtists: function () {
            var snipet = _.mbTemplate('page_mypage_check_artists', {checkArtists:this.checkArtists.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfCheckArtists').text('(' + this.checkArtists.length + ')');
        },


        // フォローしているユーザー表示
        renderFollowUsers: function () {
            var snipet = _.mbTemplate('page_mypage_follow_users', {followUsers: this.followUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfFollowUsers').text('(' + this.followUsers.length + ')');
        },


        // フォローされているユーザー表示
        renderFollowedUsers: function () {
            var snipet = _.mbTemplate('page_mypage_followed_users', {followedUsers: this.followedUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfFollowedUsers').text('(' + this.followedUsers.length + ')');
        },


        // Pocketリスト表示（displayUserPocketをrendering）
        renderUserPocketListArea: function (options) {

            // Option系
            options = options || {};
            options.nowPlaylist = (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1);
            options.filterWords = this.filterWords || [];

            var feelings = _.mbStorage.getCommon().feelings;
            var snipet = _.mbTemplate('page_mypage_user_pocket_list_area', {feelings:feelings, options:options});
            this.$el.find('[data-type="dataArea"]').html(snipet);

            // 中身もレンダリング
            this.renderUserPocketList(options);
        },

        // Pocketリスト表示
        renderUserPocketList: function (options) {

            // 表示情報
            this.filteredPocketList = this._filterUserPocketList();

            // Option系
            options = options || {};
            options.nowPlaylist = (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1);
            options.filterWords = this.filterWords || [];

            var feelings = _.mbStorage.getCommon().feelings;
            var snipet = _.mbTemplate('page_mypage_user_pocket_list', {pocketList:this.filteredPocketList.models, feelings:feelings, options:options});
            this.$el.find('#pocketListArea').html(snipet);

            // 件数更新
            this.$el.find('#numOfPockets').text(this.filteredPocketList.length);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
        },


        // 表示Pocketをフィルタリング
        _filterUserPocketList: function () {

            var self = this;
            var filteredPocketList = new UserPocketList();
            var models = [];

            // word絞り込み
            if (self.filterWords && self.filterWords.length > 0) {
                console.debug('aaaa', self.displayUserPocketList.models.length);
                _.each(self.displayUserPocketList.models, function (pocket) {
                    var good = false;
                    _.each(self.filterWords, function (word) {
                        if (pocket.attributes.title.indexOf(word) !== -1
                            || pocket.attributes.artist_name.indexOf(word) !== -1) {
                            good = true;
                        }
                    });
                    if (good) {
                        models.push(pocket);
                    }
                });

            } else {
                models = self.displayUserPocketList.models;
            }

            // feeling絞り込み
            if (self.filterFeelingId) {
                console.debug('feelingId: ', self.filterFeelingId);
                models = _.filter(models, function (model) {
                    return model.attributes.feeling_id === self.filterFeelingId;
                });
            }

            filteredPocketList.models = models;
            return filteredPocketList;
        },


        // フィルター情報を削除
        _clearFilter: function () {
            this.filterWords = [];
            $('#filterByNameInput').val('');
            $('#filterByFeelingSelect option:eq(0)').select();
        },



        // Playlistを表示
        renderPlaylist: function () {
            var playlists = _.filter(this.userPlaylistList.models, function (playlist) {
                return playlist.attributes.type !== 3; // フォロープレイリストではない。
            });
            var snipet = _.mbTemplate('page_mypage_playlist', {playlists: playlists});
            this.$el.find('#playlistList').html(snipet);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
        },


        /**
            フォローしているプレイリストを表示
        */
        renderUserFollowPlaylist: function () {
            var snipet = _.mbTemplate('page_mypage_follow_playlist', {playlists: this.userFollowPlaylistList.models});
            this.$el.find('#followPlaylist').html(snipet);
        },






        // マイドロップ一覧を表示
        showMyDrops: function (e) {
            console.debug('showMyDrops');
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');


            // 既にあれば、それを表示
            if (this.myPopList && this.myPopList.length > 0) {
                this.renderMyDrops();
                return;
            }

            // 無ければロードして、表示
            this.myPopList = new PopList();
            this.myPopList.bind('reset', this.renderMyDrops);
            this.myPopList.fetch({reset:true, data:{user_id:this.user.id}});

            return false;
        },


        /**
            チェックアーティストを表示
        */
        showCheckArtists: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');


            // 既にあればそれを表示
            if (this.checkArtists && this.checkArtists.length > 0) {
                this.renderCheckArtists();

            } else {
                // 無ければロードして表示
                this.checkArtists = new UserArtistFollowList();
                this.checkArtists.bind('reset',this.renderCheckArtists);
                this.checkArtists.fetch({reset:true, data:{user_id:this.user.id}});
            }


            return false;
        },


        /**
            フォローしているユーザー表示
        */
        showFollowUsers: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // 既にあればそれを表示
            if (this.followUsers && this.followUsers.length > 0) {
                this.renderFollowUsers();

            } else {
                // なければロードして表示
                this.followUsers = new UserFollowList();
                this.followUsers.bind('reset', this.renderFollowUsers);
                this.followUsers.fetch({reset:true, data:{user_id:this.user.id}});
            }


            return false;
        },


        /**
            フォローされているユーザー表示
        */
        showFollowedUsers: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // 既にあればそれを表示
            if (this.followedUsers && this.followedUsers.length > 0) {
                this.renderFollowedUsers();

            } else {
                // なければロードして表示
                this.followedUsers = new UserFollowList();
                this.followedUsers.bind('reset', this.renderFollowedUsers);
                this.followedUsers.fetch({reset:true, data:{dest_user_id:this.user.id}});
            }


            return false;
        },



        /**
         * 曲を再生する
         */
         playMusic: function (e) {
            var pocketId = $(e.currentTarget).parents('[data-pocket-id]').data('pocket-id');
            pocketId = parseInt(pocketId, 10);

            var options = {};

            // playlist name.
            options.playlistName = (this.currentPlaylist ? this.currentPlaylist.attributes.title : 'すべてのPocket');
            options.identifier = 'mylist ' + options.playlistName;


            // startPos, playlist.
            options.startPos = 0;
            options.musicArray = [];
            for (var i = 0; i < this.filteredPocketList.models.length; i++) {
                var model = this.filteredPocketList.models[i];
                options.musicArray.push(model.attributes);
                if (model.attributes.id === pocketId) {
                    options.startPos = i;
                }
            }


            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {
                // TODO ボタンをPlayとPauseの切替する
            }, this);
            options.callbackWhenEnd = _.bind(function () {
                // TODO ボタンをすべてPlayにする
            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);
         },





         // Playlistの中身を表示する
         showPlaylist: function (e) {
            var playlistId = $(e.currentTarget).data('playlist-id');
            var playlist = this.userPlaylistList.get(playlistId);

            // 無い場合には、何もしない
            if (!playlist) {
                return false;
            }

            this.currentPlaylist = playlist;

            // 絞り込み条件はクリア
            this._clearFilter();

            // 表示するPocketリストを作る
            var pocketIds = JSON.parse(playlist.attributes.user_pocket_ids);

            // ALLの場合のみ、最新順とする
            if (playlist.attributes.type === 1) {
                pocketIds.reverse();
            }

            this.displayUserPocketList = new UserPocketList();
            _.each(pocketIds, _.bind(function (pocketId) {
                this.displayUserPocketList.add(this.userPocketList.get(pocketId));
            }, this));

            this.renderUserPocketListArea();
         },




         // Playlistの編集表示・非表示を切り替える
         switchPlaylistEditStyle: function (e) {
            e.preventDefault();
            $('#playlistEditArea').toggleClass('edit');
            return false;
         },




         // プレイリスト追加
         addPlaylist: function () {
            console.debug('addPlaylist');

            // check not blank.
            var title = _.trim($('#playlistTitle').val());
            if (!title || title.length === 0) {
                alert('プレイリスト名を入力してください');
                $('#playlistTitle').val('');
                return;
            }

            // check max size.
            if (this.userPlaylistList.length >= 10) {
                alert('プレイリスト登録は最大10件までです。新規に登録する場合には、先にプレイリストを削除してください');
                return;
            }


            // 登録する
            this.userPlaylist = new UserPlaylist();
            this.userPlaylist.set('title', title);
            this.userPlaylist.bind('sync', _.bind(function () {

                // プレイリスト再読み込み
                this.userPlaylistList.fetch({reset:true, data:{user_id:this.user.id}});

                // 入力欄は初期化
                $('#playlistTitle').val('');

            }, this));
            this.userPlaylist.save();
         },



         // プレイリスト削除
         deletePlaylist: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var playlistId = $(e.currentTarget).parents('[data-playlist-id]').data('playlist-id');
            console.debug('deletePlaylist: ', playlistId);

            // 削除処理
            var fn = _.bind(function () {
                var userPlaylist = this.userPlaylistList.get(playlistId);
                userPlaylist.bind('sync', _.bind(function () {
                    this.userPlaylistList.remove(userPlaylist);
                    this.renderPlaylist();
                }, this));
                userPlaylist.destroy();
            }, this);


            // 確認ダイアログ
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: 'Playlistを削除しますか？',
            //     yesButtonCallback: fn
            // });
            if (window.confirm('プレイリストを削除しますか？')) {
                fn();
            }

            return false;
         },




         /**
            ドラッグ＆ドロップ機能を追加
         */
         addDragAndDropFacility: function () {

            var self = this;
            var pocketId;
            var playlistId;

            // Dragするもの
            this.$el.find('#pocketListArea li')
                .attr('draggable', 'true')
                .off('dragstart').on('dragstart', function (e) {
                    pocketId = $(e.currentTarget).data('pocket-id');
                    console.debug('drag start. ', pocketId);

                    // 自分のプレイリストの曲をDragDropの場合には、全ては反応させない
                    if (!self.currentPlaylist || self.currentPlaylist.attributes.type === 2) {
                        self.$el.find('[data-pleylist-type="1"]').addClass('noAction');
                    }

                    // 自分自身のプレイリストにもDragDropさせない
                    if (self.currentPlaylist) {
                        self.$el.find('#playlistList [data-playlist-id="'+self.currentPlaylist.attributes.id+'"]').addClass('noAction');
                    }



                }).off('dragend').on('dragend', function (e) {
                    console.debug('dragend');

                    // Drag開始時に付与した制約を解除する
                    self.$el.find('#playlistList li').removeClass('noAction');
                });

            // Drop先
            this.$el.find('[data-drop-target="playlist"]')
                .css('-khtml-user-drag', 'element')
                .off('dragenter').on('dragenter', function (e) {
                    $(e.currentTarget).addClass('dropTarget');
                    playlistId = $(e.currentTarget).data('playlist-id');
                    console.debug('dragenter: ', playlistId);
                    e.preventDefault();
                    e.stopPropagation();

                }).off('dragover').on('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                }).off('dragleave').on('dragleave', function (e) {
                    console.debug('dragleave', e);
                    $(e.currentTarget).removeClass('dropTarget');
                    playlistId = null;
                    e.preventDefault();
                    e.stopPropagation();

                }).off('drop').on('drop', function (e) {
                    console.debug('drop', pocketId, playlistId);
                    e.preventDefault();
                    e.stopPropagation();


                    // 他人のプレイリストからのドラッグドロップは色々と面倒なため、別対応する
                    if (self.currentPlaylist && self.currentPlaylist.attributes.type === 3) {
                        self._treatDragDropFromOtherPlaylist(pocketId, playlistId);
                        return;
                    }



                    // プレイリストにまだ存在しないPocketIdの場合は、追加処理をする。
                    var playlist = self.userPlaylistList.get(playlistId);
                    var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                    if (!_.contains(pocketIds, pocketId)) {

                        // プレイリストの更新
                        pocketIds.push(pocketId);
                        playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                        playlist.bind('sync', function () {
                            self.renderPlaylist();
                        });
                        playlist.save();

                    } else {
                        console.debug('既に登録済みのPocketです。 pocketId=', pocketId);
                    }
                });

         },



         /**
            他人のプレイリストからのドラッグドロップに対応する
         */
         _treatDragDropFromOtherPlaylist: function (pocketId, playlistId) {

            var self = this;

            // 対象のPocketと同一曲が自分のPocketに無い場合には、まずはPocket追加する
            var pocket = this.followPlaylistPocketsMap[this.currentPlaylist.attributes.id].get(pocketId);
            if (!pocket) {
                alert('エラーが発生しました');
                return;
            }

            // 同一曲のPocketがあるかを探す
            var userPocket = _.filter(this.userPocketList.models, function (userPocket) {
                return userPocket.attributes.music_id === pocket.attributes.music_id;
            });


            // 同一曲のPocketがある場合
            if (userPocket.length > 0) {
                pocketId = userPocket[0].attributes.id;

                // プレイリストにまだ存在しないPocketIdの場合は、追加処理をする。
                var playlist = self.userPlaylistList.get(playlistId);
                var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                if (!_.contains(pocketIds, pocketId)) {

                    // プレイリストの更新
                    pocketIds.push(pocketId);
                    playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                    playlist.bind('sync', function () {
                        self.renderPlaylist();
                    });
                    playlist.save();

                } else {
                    console.debug('既に登録済みのPocketです。 pocketId=', pocketId);
                }

                return;
            }


            // 存在しない曲の場合、Pocketを新規作成してからそれをプレイリストに登録する
            $.ajax({
                url: '/api/v1/copy_pockets/' + pocketId,
                method: 'post',
                dataType: 'json',
                success: function (json) {
                    console.debug('copy pocket successed.');

                    // UserPocketListに追加しておく
                    console.debug('userPocketList.length: ', self.userPocketList.length);
                    // var userPocket = UserPocket.createInstance(json);
                    var userPocket = new UserPocket();
                    userPocket.set('id', json.id);
                    userPocket.attributes = json;
                    self.userPocketList.add(userPocket);
                    console.debug('userPocketList.length: ', self.userPocketList.length);


                    pocketId = json.id;


                    // Drop先のプレイリスト
                    var playlist = self.userPlaylistList.get(playlistId);
                    var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                    pocketIds.push(pocketId);
                    playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                    playlist.bind('sync', function () {
                        self.renderPlaylist();
                    });
                    playlist.save();

                    // Allのプレイリスト（該当プレイリストがALLでは無い場合）
                    if (playlist.attributes.type !== 1) {
                        var allPlaylistId;
                        _.each(self.userPlaylistList.models, function (playlist) {
                            if (playlist.attributes.type === 1) {
                                allPlaylistId = playlist.attributes.id;
                            }
                        });
                        var playlistAll = self.userPlaylistList.get(allPlaylistId);
                        var pocketIds = JSON.parse(playlistAll.get('user_pocket_ids'));
                        pocketIds.push(pocketId);
                        playlistAll.set('user_pocket_ids', JSON.stringify(pocketIds));
                        playlistAll.bind('sync', function () {
                            self.renderPlaylist();
                        });
                        playlistAll.save();
                    }





                },
                error: function (xhr) {
                    if (xhr.status === 403) {
                        mb.router.appView.authErrorHandler();
                        return;
                    } else {
                        alert('api error');
                        console.log('error: ', arguments);
                    }
                },
            });


         },







         /**
            Pocketリストの編集状態を切り替える
         */
         editPocketList: function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.$el.find('#pocketListArea').hasClass('editStyle')) {

                if (!this.currentPlaylist || this.currentPlaylist.attributes.type === 1) {
                    $(e.currentTarget).text('Pocket編集');
                } else {
                    $(e.currentTarget).text('playlist編集');
                }
                $('#pocketDeleteArea').addClass('hidden');

                // ソート機能を解除
                try {
                    $('#pocketListArea').sortable('destroy');
                } catch(e) {}

                // ドラッグ再開
                $('#pocketListArea li').attr('draggable', 'true');


                // ソート結果をサーバーへPushする
                if (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1) {

                    var ids = [];
                    $('#pocketListArea li').each(function () {
                        ids.push($(this).data('pocket-id'));
                    });
                    console.debug('ids: ', ids);
                    this.currentPlaylist.set('user_pocket_ids', JSON.stringify(ids));
                    this.currentPlaylist.save();
                }


            } else {
                $(e.currentTarget).text('完了');

                // ドラッグ停止
                $('#pocketListArea li').attr('draggable', 'false');

                // プレイリスト編集の場合は、並び替えをサポートする
                if (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1) {
                    $('#pocketListArea').sortable();
                }

            }

            this.$el.find('#pocketListArea').toggleClass('editStyle');
         },






        /**
         * Pocketを削除する
         */
        deletePocket: function (e) {

            // 確認ダイアログを表示
            var message;
            var callback;
            this.deleteTargetPocketId = $(e.currentTarget).parents('[data-pocket-id]').data('pocket-id');
            if (!this.currentPlaylist || this.currentPlaylist.attributes.type === 1) { // ALL
                message = 'Pocketを削除しますか？';
                callback = _.bind(this._deletePocket, this);
            } else {
                message = 'プレイリストから削除しますか？';
                callback = _.bind(this._deletePocketFromPlaylist, this);
            }
            var confirmDialog = new ConfirmDialogView();
            confirmDialog.show({
                message: message,
                yesButtonCallback: callback
            });

        },


        // Pocketを削除
        _deletePocket: function () {

            var pocketId = this.deleteTargetPocketId;
            console.log('deletePocket', pocketId);

            var aPocket = this.userPocketList.get(pocketId);
            aPocket.bind('sync', _.bind(function () {

                // Pocketリストから削除
                this.userPocketList.remove(aPocket);

                // 各プレイリストからも削除
                _.each(this.userPlaylistList.models, function (model) {
                    var oldIds = JSON.parse(model.attributes.user_pocket_ids);
                    var newIds = _.filter(oldIds, function (id) {return id !== pocketId});

                    if (oldIds.length != newIds.length) {
                        model.attributes.user_pocket_ids = JSON.stringify(newIds);
                        model.save();
                    }
                });

                // 表示中のPocketsからも削除
                var aModel = this.displayUserPocketList.get(pocketId);
                if (aModel) {
                    this.displayUserPocketList.remove(aModel);
                }


                // プレイリストを再レンダリング
                this.renderPlaylist();

                // Pocketsを再レンダリング
                this.renderUserPocketList({edit:true});


                // Localデータも更新
                _.loadUserPockets({force: true});

            }, this));
            aPocket.destroy({wait: true});

        },

        // playlistから削除
        _deletePocketFromPlaylist: function () {

            var pocketId = this.deleteTargetPocketId;
            console.log('deletePocketFromPlaylist', pocketId);

            var model = this.currentPlaylist;
            var oldIds = JSON.parse(model.attributes.user_pocket_ids);
            var newIds = _.filter(oldIds, function (id) {return id !== pocketId});
            model.attributes.user_pocket_ids = JSON.stringify(newIds);
            model.bind('sync', _.bind(function () {

                // 表示中のPocketsからも削除
                var aModel = this.displayUserPocketList.get(pocketId);
                if (aModel) {
                    this.displayUserPocketList.remove(aModel);
                }

                // プレイリストを再レンダリング
                this.renderPlaylist();

                // Pocketsを再レンダリング
                this.renderUserPocketList({edit:true});


            }, this));
            model.save();

        },




        /**
            Pocket絞り込み（フリーワード）
        */
        filterPockets: function () {

            // 検索ワード
            var conditions = [];
            _.each($('#filterByNameInput').val().split(/\s/), function (word) {
                word = _.trim(word);
                if (word.length > 0) {
                    conditions.push(word);
                }
            });
            console.debug('conditions: ', conditions);


            // 検索条件がある場合、または前に検索条件があった場合には、レンダリング
            if (conditions.length > 0 || (this.filterWords && this.filterWords.length > 0)) {
                this.filterWords = conditions;
                this.renderUserPocketList();
            }

        },


        /**
            Pocketしぼり込み（気分）
        */
        filterPockets2: function () {
            console.debug('filterPockets2');
            this.filterFeelingId = parseInt($('#filterByFeelingSelect option:selected').val());
            this.renderUserPocketList();
        },





        /**
            フォローしているプレイリストの中身を表示する
        */
        showFollowPlaylist: function (e) {
            var playlistId = $(e.currentTarget).data('playlist-id');
            console.debug('showFollowPlaylist: ', playlistId);

            // 現在のプレイリストを設定する
            this.currentPlaylist = this.userFollowPlaylistList.get(playlistId);

            // キャッシュがあればそれを表示する
            if (this.followPlaylistPocketsMap && this.followPlaylistPocketsMap[playlistId]) {
                this.displayUserPocketList = this.followPlaylistPocketsMap[playlistId];
                this.renderUserPocketListArea({noEdit:true});
            }


            // キャッシュが無ければ、ロードして表示する
            var userPocketList = new UserPocketList();
            userPocketList.bind('sync', _.bind(function () {
                console.debug('suerPocketList: ', userPocketList);

                this.followPlaylistPocketsMap = this.followPlaylistPocketsMap || {};
                this.followPlaylistPocketsMap[playlistId] = userPocketList;

                this.displayUserPocketList = userPocketList;
                this.renderUserPocketListArea({noEdit:true});

            }, this));
            console.debug('current: ', this.currentPlaylist.attributes.user_pocket_ids);
            userPocketList.fetch({reset:true, data:{targets:this.currentPlaylist.attributes.user_pocket_ids}});

        },



        /**
            フォロープレイリストの編集表示、非表示
        */
        editFollowPlaylistButton: function (e) {
            console.debug('editFollowPlaylistButton');
            e.preventDefault();

            if ($('#followPlaylist').hasClass('edit')) {
                $(e.currentTarget).text('編集');
            } else {
                $(e.currentTarget).text('完了');
            }

            $('#followPlaylist').toggleClass('edit');

            return false;
        },




        /**
            フォロー中のプレイリストを削除
        */
        deleteFollowPlaylist: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var playlistId = $(e.currentTarget).parents('[data-playlist-id]').data('playlist-id');
            console.debug('deleteFollowPlaylist: ', playlistId);

            // 削除処理
            var fn = _.bind(function () {
                var userPlaylist = this.userPlaylistList.get(playlistId);
                userPlaylist.bind('sync', _.bind(function () {
                    this.userPlaylistList.remove(userPlaylist);

                    // もう一個のリストからも削除
                    var model = this.userFollowPlaylistList.get(playlistId);
                    this.userFollowPlaylistList.remove(model);

                    // レンダリング
                    this.renderUserFollowPlaylist();

                    // Storageも更新
                    _.mbStorage.refreshUser({target:'playlist'});


                }, this));
                userPlaylist.destroy();
            }, this);


            // 確認ダイアログ
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: 'フォローしているPlaylistを削除しますか？',
            //     yesButtonCallback: fn
            // });
            if (window.confirm('フォローしているプレイリストを削除しますか？')) {
                fn();
            }
            






            return false;

        },



        /**
            ユーザーフォローする
        */
        followUser: function (e) {
            console.debug('followUser');

            var $li = $(e.currentTarget).parents('li');
            var userId = $li.data('user-id');
            _.followUser(userId, _.bind(function () {

                $li.find('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

            }, this));

        },



        /**
            ユーザーフォロー解除する
        */
        unfollowUser: function (e) {
            console.debug('unfollowUser');

            var $li = $(e.currentTarget).parents('li');
            var userId = $li.data('user-id');

            // userFollowIdを探す
            var id = _.selectUserFollowId(userId);
            if (id) {
                _.unfollowUser(id, _.bind(function () {

                    $li.find('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

                }, this));

            } else {
                // IDが特定できない場合には、ログインを促す。
                mb.router.appView.authErrorHandler();

            }

        },




        /**
            アーティストフォローする
        */
        followArtist: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var artistId = $li.data('artist-id');
            console.debug('followArtist:', artistId);

            // フォロー
            _.followArtist(artistId, function () {
                $li.find('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },


        /**
            アーティストフォローを解除する
        */
        unfollowArtist: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var artistId = $li.data('artist-id');
            console.debug('unfollowArtist:', artistId);

            // idを取得
            var id = _.selectArtistFollowId(artistId);
            // アンフォロー
            _.unfollowArtist(id, function () {
                $li.find('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });

        },




        /**
            Popを編集する
        */
        editPop: function (e) {
            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.debug('editPop', popId);

            var pop = this.myPopList.get(popId);

            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(pop.attributes.music_id, popId, 'modal');

        },


        /**
            Popを削除する
        */
        deletePop: function (e) {
            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.debug('deletePop', popId);

            // OKの場合のみ削除する
            if (window.confirm('Popを削除しますか？')) {

                var pop = this.myPopList.get(popId);
                pop.bind('sync', _.bind(function () {

                    this.myPopList.remove(pop);
                    this.renderMyDrops();

                }, this));
                pop.destroy({wait:true});
            }
        },





























        show: function () {
            console.log('show mypage');

            // session storageに該当情報が無い場合には、フォワード
            if (!_.isLogedIn()) {
                mb.router.navigate('login', true);
                return;
            } else {
                this.user = JSON.parse(localStorage.getItem('user'));
            }


            // 画面表示
            this.render();

            // ユーザーPocketリストを取得
            this.userPocketList = new UserPocketList();
            this.userPocketList.bind('reset', _.bind(function () {

                // 日付の新しい順に並び替える
                this.userPocketList.models = _.sortBy(this.userPocketList.models, function (model) {
                    return model.attributes.create_at * -1;
                });


                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketListArea();
                // ついでにStorageにも保存しておく
                _.mbStorage.setUserPocketsWithBackboneCollection(this.userPocketList);

            }, this));
            this.userPocketList.fetch({reset:true, data:{user_id:this.user.id}});

            // ユーザーのプレイリストを取得
            this.userPlaylistList.fetch({reset:true, data:{user_id:this.user.id}});


            // フォローしているプレイリスト
            this.userFollowPlaylistList = new UserPlaylistList();
            this.userFollowPlaylistList.bind('sync', this.renderUserFollowPlaylist);
            this.userFollowPlaylistList.fetchFollowPlaylist(this.user.id);

        },

        dealloc: function () {

        },

    });

    return MypageView;

});


/**
 * View: User
 */
define('views/user/index',[
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/common/user_storage',
    'views/common/youtube',
    'models/pop/pop_list',
    'models/user/user_artist_follow_list',
    'models/user/user_playlist',
    'models/user/user_playlist_list',
], function (
    User,
    UserPocket,
    UserPocketList,
    UserFollow,
    UserFollowList,
    UserStorage,
    YoutubeView,
    PopList,
    UserArtistFollowList,
    UserPlaylist,
    UserPlaylistList
) {

    var UserView = Backbone.View.extend({
   
        // fields.
        user: null,
        userPocketList: null,
        displayUserPocketList: null,
        filteredUserPocketList: null,
        popList: null,
        userFollowList: null,
        userFollowedList: null,
        checkArtists: null,
        userPlaylistList: null,



        userFollow: null,
        userStorage: new UserStorage(),


        /**
         * 初期化処理
         */
        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this, 
                'render', 
                'renderUserPocketListArea', 
                'renderUserPocketList', 
                'renderUserPlaylistList',
                'show', 
                'dealloc'
                );


            // User情報
            this.user = new User();
            this.user.bind('sync', this.render);

            // Pocket一覧
            this.userPocketList = new UserPocketList();

        },



        /**
            ページ骨格＋ユーザー情報表示
        */
        render: function () {
            var snipet = _.mbTemplate('page_user', {user: this.user.attributes});
            this.$el.html(snipet);
        },



        /**
            Pocket一覧を表示（displayUserPocketListを利用します）
        */
        renderUserPocketListArea: function () {

            // 表示オプション
            var options = {};
            if (this.currentPlaylist) {
                options.playlistId = this.currentPlaylist.attributes.id;
            }


            var snipet = _.mbTemplate('page_user_user_pocket_list_area', {
                feelings: _.mbStorage.getCommon().feelings,
                options: options
            });
            this.$el.find('[data-type="dataArea"]').html(snipet);


            // 中身表示
            this.renderUserPocketList();
        },


        /**
            Pocketリストを表示
        */
        renderUserPocketList: function () {

            // 絞り込み結果を考慮する
            this.filteredPocketList = this._filterUserPocketList();

            console.log('renderPocketList.', this.filteredPocketList);
            var snipet = _.mbTemplate('page_user_user_pocket_list', {
                pocketList: this.filteredPocketList.models
            });
            this.$el.find('#pocketListArea').html(snipet);

            // 件数も更新する
            this.$el.find('#numOfPockets').text(this.displayUserPocketList.length);
        },





        /**
            Pop数を表示する
        */
        renderPopCount: function () {
            this.$el.find('#numOfMyDrops').text('(' + this.popList.length + ')');
        },


        /**
            フォローしているユーザー数を表示  
        */
        renderUserFollowCount: function () {
            this.$el.find('#numOfFollowUsers').text('(' + this.userFollowList.length + ')');
        },


        /**
            フォローされているユーザー数を表示
        */
        renderUserFollowedCount: function () {
            this.$el.find('#numOfFollowedUsers').text('(' + this.userFollowedList.length + ')');
        },


        /**
            チェックアーティスト数を表示
        */
        renderCheckArtistsCount: function () {
            this.$el.find('#numOfCheckArtists').text('(' + this.userFollowedList.length + ')');
        },


        // マイDrop表示
        renderMyDrops: function () {
            var snipet = _.mbTemplate('page_user_mypop_list', {popList:this.popList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // チェックアーティスト表示
        renderCheckArtists: function () {
            var snipet = _.mbTemplate('page_user_check_artists', {checkArtists:this.checkArtists.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローしているユーザー表示
        renderFollowUsers: function () {
            var snipet = _.mbTemplate('page_user_follow_users', {followUsers: this.userFollowList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローされているユーザー表示
        renderFollowedUsers: function () {
            var snipet = _.mbTemplate('page_user_followed_users', {followedUsers: this.userFollowedList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        /**
            プレイリスト一覧を表示
        */
        renderUserPlaylistList: function () {

            // 表示内容は、通常とALLのみ（フォロープレイリストは省く）
            var playlists = _.filter(this.userPlaylistList.models, function (playlist) {
                return playlist.attributes.type !== 3; // フォロープレイリストではない。
            });


            var snipet = _.mbTemplate('page_mypage_playlist', {playlists:playlists});
            this.$el.find('#playlistList').html(snipet);
        },





        /**
            Pop一覧を表示する
        */
        showMyDrops: function () {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.popList.loaded) {
                setTimeout(this.showMyDrops, 100);
                return;
            }

            // 表示する
            this.renderMyDrops();
        },


        /**
            チェックアーティスト一覧を表示する
        */
        showCheckArtists: function () {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.checkArtists.loaded) {
                setTimeout(this.showCheckArtists, 100);
                return;
            }

            // 表示する
            this.renderCheckArtists();
        },


        /**
            フォローしているユーザー表示
        */
        showFollowUsers: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.userFollowList.loaded) {
                setTimeout(this.showFollowUsers, 100);
                return;
            }

            // 表示する
            this.renderFollowUsers();
        },


        /**
            フォローされているユーザー表示
        */
        showFollowedUsers: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.userFollowedList.loaded) {
                setTimeout(this.showFollowedUsers, 100);
                return;
            }

            // 表示する
            this.renderFollowedUsers();
        },        






        /**
            Pocketを再生する
        */
        // TODO ここの機能は、Mypageとほとんど同じ実装なので、綺麗に共通化したいなぁ。
        playMusic: function (e) {
            var pocketId = parseInt($(e.currentTarget).parents('[data-pocket-id]').data('pocket-id'), 10);
            console.debug('playMusic: ', pocketId);


            var options = {};

            // playlist name.
            options.playlistName = (this.currentPlaylist ? this.currentPlaylist.attributes.title : 'すべてのPocket');
            options.identifier = 'user' + this.user.id + (this.currentPlaylist ? this.currentPlaylist.attributes.id : 'すべてのPocket');


            // startPos, playlist.
            options.startPos = 0;
            options.musicArray = [];
            for (var i = 0; i < this.filteredPocketList.models.length; i++) {
                var model = this.filteredPocketList.models[i];
                options.musicArray.push(model.attributes);
                if (model.attributes.id === pocketId) {
                    options.startPos = i;
                }
            }

            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {
                // TODO ボタンをPlayとPauseの切替する
            }, this);
            options.callbackWhenEnd = _.bind(function () {
                // TODO ボタンをすべてPlayにする
            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);



        },



        /**
            プレイリストの中身を表示
        */
        showPlaylist: function (e) {
            var playlistId = $(e.currentTarget).data('playlist-id');
            var playlist = this.userPlaylistList.get(playlistId);

            // 無い場合には、何もしない
            if (!playlist) {
                return false;
            }

            this.currentPlaylist = playlist;

            // 絞り込み条件はクリア
            this._clearFilter();

            // 表示するPocketリストを作る
            var pocketIds = JSON.parse(playlist.attributes.user_pocket_ids);
            this.displayUserPocketList = new UserPocketList();
            _.each(pocketIds, _.bind(function (pocketId) {
                this.displayUserPocketList.add(this.userPocketList.get(pocketId));
            }, this));

            this.renderUserPocketListArea();
        },



        // 表示Pocketをフィルタリング
        _filterUserPocketList: function () {

            var self = this;
            var filteredPocketList = new UserPocketList();
            var models = [];

            // word絞り込み
            if (self.filterWords && self.filterWords.length > 0) {
                console.debug('aaaa', self.displayUserPocketList.models.length);
                _.each(self.displayUserPocketList.models, function (pocket) {
                    var good = false;
                    _.each(self.filterWords, function (word) {
                        if (pocket.attributes.title.indexOf(word) !== -1
                            || pocket.attributes.artist_name.indexOf(word) !== -1) {
                            good = true;
                        }
                    });
                    if (good) {
                        models.push(pocket);
                    }
                });

            } else {
                console.debug('bbb', self.displayUserPocketList.models.length);
                models = self.displayUserPocketList.models;
            }

            // feeling絞り込み
            if (self.filterFeelingId) {
                console.debug('feelingId: ', self.filterFeelingId);
                models = _.filter(models, function (model) {
                    return model.attributes.feeling_id === self.filterFeelingId;
                });
            }

            filteredPocketList.models = models;
            return filteredPocketList;
        },




        // フィルター情報を削除
        _clearFilter: function () {
            this.filterWords = [];
            $('#filterByNameInput').val('');
            $('#filterByFeelingSelect option:eq(0)').select();
        },





        /**
            ユーザーをフォローする。
        */
        followUser: function () {

            var userFollow = new UserFollow();
            userFollow.set('dest_user_id', this.user.id);
            userFollow.bind('sync', function () {
                // 表示きりかえ
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
                // Storage情報も更新する
                _.mbStorage.refreshUser();
            });
            userFollow.save();
        },


        /**
            ユーザーフォローを解除する。
        */
        unfollowUser: function () {

            $.ajax({
                url: '/api/v1/user_follows',
                method: 'delete',
                data: {dest_user_id: this.user.id},
                success: function () {
                    // 表示きりかえ
                    $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
                    // Storage情報も更新する
                    _.mbStorage.refreshUser();
                },
                error: function () {
                    alert('エラーが発生しました。リロードしてください。')
                },
            })
        },



        /**
            プレイリストをフォローする
        */
        followPlaylist: function (e) {
            e.preventDefault();
            console.debug('followPlaylist:', this.currentPlaylist.attributes.id);

            // プレイリスト追加
            var aPlaylist = new UserPlaylist();
            aPlaylist.set('user_id', this.user.id);
            aPlaylist.set('title', this.currentPlaylist.attributes.title);
            aPlaylist.set('dest_playlist_id', this.currentPlaylist.attributes.id);
            aPlaylist.set('type', 3);
            aPlaylist.bind('sync', _.bind(function () {

                // 表示きりかえ
                $('[data-event-click="followPlaylist"],[data-event-click="unfollowPlaylist"]').toggleClass('hidden');

                // Storage更新
                _.mbStorage.refreshUser({target:'userFollowPlaylistList', type:'add'});
            }, this));
            aPlaylist.save();




            return false;
        },


        /**
            プレイリストのフォローを解除する
        */
        unfollowPlaylist: function (e) {
            e.preventDefault();
            console.debug('unfollowPlaylist:', this.currentPlaylist.attributes.id);


            // 削除
            $.ajax({
                url: '/api/v1/user_playlists',
                method: 'delete',
                data: {dest_playlist_id: this.currentPlaylist.attributes.id},
                success: function () {

                    // 表示きりかえ
                    $('[data-event-click="followPlaylist"],[data-event-click="unfollowPlaylist"]').toggleClass('hidden');

                    // Storage更新
                    _.mbStorage.refreshUser({target:'userFollowPlaylistList', type:'delete'});

                },
                error: function () {
                    alert('エラーが発生しました。リロードしてください。');
                },
            });

            return false;
        },




        /**
            Pocket絞り込み（フリーワード）
        */
        filterPockets: function () {

            // 検索ワード
            var conditions = [];
            _.each($('#filterByNameInput').val().split(/\s/), function (word) {
                word = _.trim(word);
                if (word.length > 0) {
                    conditions.push(word);
                }
            });
            console.debug('conditions: ', conditions);


            // 検索条件がある場合、または前に検索条件があった場合には、レンダリング
            if (conditions.length > 0 || (this.filterWords && this.filterWords.length > 0)) {
                this.filterWords = conditions;
                this.renderUserPocketList();
            }

        },


        /**
            Pocketしぼり込み（気分）
        */
        filterPockets2: function () {
            console.debug('filterPockets2');
            this.filterFeelingId = parseInt($('#filterByFeelingSelect option:selected').val());
            this.renderUserPocketList();
        },


























        /**
            ページ表示
        */
        show: function (userId) {
         
            // ユーザーデータ取得
            this.user.set('id', userId);
            this.user.fetch({reset: true});

            // Pocketリスト取得
            this.userPocketList.bind('sync', _.bind(function () {
                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketListArea();
            }, this));
            this.userPocketList.fetch({reset: true, data: {user_id: userId}});


            // Drop一覧
            this.popList = new PopList();
            this.popList.bind('sync', _.bind(function () {
                this.popList.loaded = true;
                this.renderPopCount();
            }, this));
            this.popList.fetch({reset: true, data:{user_id:userId}});


            // チェックアーティスト一覧
            this.checkArtists = new UserArtistFollowList();
            this.checkArtists.bind('sync', _.bind(function () {
                this.checkArtists.loaded = true;
                this.renderCheckArtistsCount();
            }, this));
            this.checkArtists.fetch({reset:true, data:{user_id:userId}});


            // // フォローしているユーザー一覧
            this.userFollowList = new UserFollowList();
            this.userFollowList.bind('sync', _.bind(function () {
                this.userFollowList.loaded = true;
                this.renderUserFollowCount();
            }, this));
            this.userFollowList.fetch({reset:true, data: {user_id:userId}});


            // // フォローされているユーザー一覧取得
            this.userFollowedList = new UserFollowList();
            this.userFollowedList.bind('sync', _.bind(function () {
                this.userFollowedList.loaded = true;
                this.renderUserFollowedCount();
            }, this));
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:userId}});
            

            // プレイリスト一覧取得
            this.userPlaylistList = new UserPlaylistList();
            this.userPlaylistList.bind('sync', this.renderUserPlaylistList);
            this.userPlaylistList.fetch({reset:true, data:{user_id:userId}});

        },


        /**
         * 終了処理
         */
        dealloc: function () {},
    
    });



    return UserView;

});


/*
 * View: User Regist
 */
define('views/user/regist',[
    'models/user/user'
], function (
    User
) {

    var UserRegistView = Backbone.View.extend({
    
        // fields.
        user: null,


        /**
         * 初期化処理
         */
        initialize: function () {
        
            this.user = new User();

            _.bindAll(this, 'render', 'show', 'dealloc');
        },


        /**
         * Event定義
         */
        events: {},


        /*
         * 表示
         */
        render: function () {
            var template = $('#page_user_regist').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },


        /*
         * AppViewからのエントリーポイント
         */
        show: function () {
            this.render();
        },


        /*
         * 終了処理
         */
        dealloc: function () {},

    
    
    
    });


    return UserRegistView;

});

/**
 * Model: User Notification
 */
define('models/user/user_notification',[], function () {

    var UserNotificationModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            type: null,
            json: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_notifications/',
    });

    return UserNotificationModel;

});


/**
 * Collection: User Notification
 */
define('models/user/user_notification_list',['models/user/user_notification'], function (UserNotification) {

    var UserNotificationCollection = Backbone.Collection.extend({

        model: UserNotification,

        url: '/api/v1/user_notifications',
    });


    return UserNotificationCollection;

});

/**
	タイムラインView
*/
define('views/user/timeline',[
	"models/user/user_notification_list"
], function (
	UserNotificationList
) {

	var TimelineView = Backbone.View.extend({


		// お知らせ一覧
		userNotificationList: null,

		// 表示タイプ
		displayType: -1,  // -1:all



		initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this, 'render');

		},


		/**
			ページ骨格の表示
		*/
		render: function () {
			console.debug('render: ', this.userNotificationList);

			// 新しい順に並べる
			var models = _.sortBy(this.userNotificationList.models, function (model) {
				return model.attributes.create_at * -1;
			});

			var snipet = _.mbTemplate('page_timeline', {notifications: models});
			this.$el.html(snipet);

			// 件数も更新
			var numOfLike = 0;
			var numOfFollowUser = 0;
			var numOfFollowArtist = 0;
			_.each(this.userNotificationList.models, function (notif) {
				if (notif.attributes.type === 1 || notif.attributes.type === 2) {
					numOfFollowUser++;
				} else if (notif.attributes.type === 3 || notif.attributes.type === 4) {
					numOfLike++;
				} else if (notif.attributes.type === 5 || notif.attributes.type === 6) {
					numOfFollowArtist++;
				}
			});
			this.$el.find('#numOfLike').text('(' + numOfLike + ')');
			this.$el.find('#numOfFollowUser').text('(' + numOfFollowUser + ')');
			this.$el.find('#numOfFollowArtist').text('(' + numOfFollowArtist + ')');
		},



		/**
			お知らせを全件表示
		*/
		showAllNotif: function () {
			this.$el.find('#timelineArea li').removeClass('hidden');
		},


		/**
			いいね系お知らせ表示
		*/
		showLikeNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="3"],[data-notif-type="4"]').removeClass('hidden');
		},


		/**
			フォローユーザー系お知らせ表示
		*/
		showFollowUserNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="1"],[data-notif-type="2"]').removeClass('hidden');
		},


		/**
			フォローアーティスト系お知らせ表示
		*/
		showFollowArtistNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="5"],[data-notif-type="6"]').removeClass('hidden');
		},






		/**
			ページ表示
		*/
		show: function () {

			// ログインチェック
			if (!_.isLogedIn()) {
				mb.router.navigate('#');
				mb.router.appView.authErrorHandler();
				return;
			}


			// お知らせを取得する
			this.userNotificationList = new UserNotificationList();
			this.userNotificationList.bind('sync', this.render);
			this.userNotificationList.fetch({reset: true, data: {user_id: _.mbStorage.getUser().id}});
		},


		/**
			終了処理
		*/
		dealloc: function () {

		},

	});

	return TimelineView;

});



























/**
	ユーザー設定画面
*/
define('views/user/setting',[
    'views/common/confirmDialog',
	'models/user/user',
], function (
	ConfirmDialogView,
	UserModel
) {

	var UserSettingView = Backbone.View.extend({

		initialize: function () {

            // auto event bind.
            _.bindEvents(this);


		},

		render: function () {
			var snipet = _.mbTemplate('page_user_setting', {user: _.mbStorage.getUser()});
			this.$el.html(snipet);
		},


		/**
			名前変更処理
		*/
		changeName: function () {
			console.debug('changeName');

			var newName = _.trim($('#userNameInput').val());
			if (!newName || newName.length === 0) {
				alert('名前が未入力です。');
				return;

            } else if (newName.length > 16) {
                alert('名前は16文字以内でお願いします。');
                return;
            }

			// 更新
			var user = new UserModel();
			user.set('id', _.mbStorage.getUser().id);
			user.set('name', newName);
			user.bind('sync', function () {
				alert('ユーザー名変更が完了しました');
				location.reload();
			});
			user.save();

		},



		/**
			ログアウト
		*/
		logout: function () {

            // 確認ダイアログ
            if (window.confirm('ログアウトしますか？')) {
            	_.mbStorage.removeUser();
            	$.removeCookie('uid', null);
            	alert('ログアウトしました。');
            	location.href = '#';
            	
            }
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: '本当にログアウトしてもよろしいですか？',
            //     yesButtonCallback: function () {

            //     	_.mbStorage.removeUser();
            //     	$.removeCookie('uid', null);
            //     	alert('ログアウトしました。');
            //     	location.href = '#';
            //     }
            // });



		},








		show: function () {
			console.debug('usersetting show');


			// もしもログインしていない場合には、TOPへ
			if (!_.isLogedIn()) {
				mb.router.navigate('#', true);
				return;
			}


			this.render();
		},

		dealloc: function () {

		},

	});

	return UserSettingView;

});

/**
 * Model: Artist
 */
define('models/artist/artist',[], function () {

    var ArtistModel = Backbone.Model.extend({

        defaults: {
            id: null,
            name: null,
            create_at: null,
            update_at: null,
        },

        urlRoot: '/api/v1/artists',

    });

    return ArtistModel;

});

/**
 *  Collection: Music
 */
define('models/music/music_list',['models/music/music'], function (MusicModel) {

    var MusicCollection = Backbone.Collection.extend({
        
        model: MusicModel,

        url: '/api/v1/musics'
    });

    return MusicCollection;
});


/**
 *  View: Artist
 */
define('views/artist/index',[
    'models/artist/artist',
    'models/music/music_list',
    'models/user/user_pocket',
    'views/common/youtube',
    'models/common/user_storage'
], function (
    Artist,
    MusicList,
    UserPocket,
    YoutubeView,
    UserStorage
) {

    var ArtistView = Backbone.View.extend({

        // fields.
        artistId: null,
        artist: new Artist(),
        userStorage: new UserStorage(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            // _.bindAll(this, 
            //     'renderArtistInfo', 
            //     'renderMusicList', 
            //     'playYoutube', 
            //     'pocket', 
            //     'deletePocket');

            // this.artist.bind('change', this.renderArtistInfo);
            // this.musicList.bind('reset', this.renderMusicList);
        },

        // events: {
        //     'click [data-event="playYoutube"]': 'playYoutube',
        //     'click [data-event="pocket"]': 'pocket',
        //     'click [data-event="deletePocket"]': 'deletePocket',
        // },


        /**
            画面を表示する
        */
        render: function () {
            var data = {
                repFeelingId: this.repFeelingId,
                repMusic: this.repMusic,
                musicList: this.musicList.models
            };
            var snipet = _.mbTemplate('page_artist', data);
            this.$el.html(snipet);
        },




        /**
            アーティストフォロー
        */
        followArtist: function () {
            _.followArtist(this.artistId, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },



        /**
            アーティストフォロー解除
        */
        unfollowArtist: function () {
            var followArtistId = _.selectArtistFollowId(this.artistId);
            _.unfollowArtist(followArtistId, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },



        /**
            Pocketを追加する
        */
        addPocket: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var musicId = $li.data('music-id');

            _.addPocket({music_id: musicId}, function () {
                $li.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            });
        },


        /**
            Pocketを削除する
        */
        deletePocket: function (e) {

            var $li = $(e.currentTarget).parents('li');
            var musicId = $li.data('music-id');
            var pocketId = _.selectPocketId(musicId);

            _.deletePocket(pocketId, function () {
                $li.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            });

        },



        /**
            音楽を再生する
        */
        playMusic: function (e) {

            var $li = $(e.currentTarget).parents('li');
            var idx = $li.data('idx');


            // もしPause中の場合には、再開のみを行う
            if ($li.data('nowpausing')) {
                $li.removeAttr('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            // 表示オプションを作成
            var options = {};
            options.playlistName = this.repMusic.attributes.artist_name + 'の曲';
            options.identifier = 'artist_page' + this.artistId;
            options.musicArray = _.map(this.musicList.models, function (music) {
                music.attributes.music_id = music.attributes.id;
                return music.attributes;
            });
            options.startPos = $li.data('idx');
            options.callbackWhenWillStart = _.bind(function (music) {
                // 表示をリセット
                $('[data-event-click="pauseMusic"]').addClass('hidden');
                $('[data-event-click="playMusic"]').removeClass('hidden');
                // 次の曲をアクティブに
                var $li = this.$el.find('[data-music-id="'+music.id+'"]');
                $li.find('[data-event-click="pauseMusic"]').removeClass('hidden');
                $li.find('[data-event-click="playMusic"]').addClass('hidden');
            }, this);
            options.callbackWhenPause = options.callbackWhenEnd = function () {
                // 表示をリセット
                $('[data-event-click="pauseMusic"]').addClass('hidden');
                $('[data-event-click="playMusic"]').removeClass('hidden');
            };

            console.log('playMusic: ', options);
            mb.musicPlayer.playMusics(options);
        },



        /**
            再生を一時停止する
        */
        pauseMusic: function (e) {
            mb.musicPlayer.pauseMusic();

            var $li = $(e.currentTarget).parents('li');
            $li.find('[data-event-click="pauseMusic"]').addClass('hidden');
            $li.find('[data-event-click="playMusic"]').removeClass('hidden');
            $li.attr('data-nowpausing', 'true');
        },





















        /**
            代表的なキモチを計算する
        */
        _calcRepresentativeFeeling: function () {

            var feelingMap = {};
            _.each(this.musicList.models, function (music) {

                var feelingId = music.attributes.feeling_id;
                var popCount = music.attributes.pop_count;

                if (feelingId && popCount > 0) {
                    feelingMap[feelingId] = (feelingMap[feelingId] || 0) + popCount;
                }
            });
            console.debug('feelingMap: ', feelingMap);

            var mostFeelingId = 1;
            var maxScore = 0;
            _.each(feelingMap, function (val, key) {
                if (maxScore < val) {
                    mostFeelingId = key;
                }
            });

            return mostFeelingId;

        },




        show: function (artistId) {
            this.artistId = artistId;


            // 該当アーティストの曲を全曲取得する
            this.musicList = new MusicList();
            this.musicList.bind('sync', _.bind(function () {

                // Pop数順に並び替える
                this.musicList.models = _.sortBy(this.musicList.models, function (music) {
                    return music.attributes.pop_count * -1 || 0;
                });

                // 代表曲を取得する
                this.repMusic = this.musicList.models[0];

                // 代表的なキモチを計算する
                this.repFeelingId = this._calcRepresentativeFeeling();

                // 描画
                this.render();

            }, this));
            this.musicList.fetch({reset: true, data: {artist_id: artistId}});

        },




        dealloc: function () {

        },

    });

    return ArtistView;

});

/**
	ユーザー設定画面
*/
define('views/rules/index',[
], function (
) {

	var RulesView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_rules');
			this.$el.html(snipet);
		},








		show: function () {

			this.render();
		},

		dealloc: function () {

		},

	});

	return RulesView;

});

/**
 * Header
 */
define('views/common/footer',[], function () {

    var FooterView = Backbone.View.extend({

        initialize: function () {
            this.$el = $('footer');
            _.bindAll(this, 'show');
        },

        events: {

        },

        render: function () {
            var template = $('#component_footer').html();
            this.$el.html(template);
        },

        show: function () {
            this.render();
        },

        dealloc: function () {

        },



    });

    return FooterView;
});


/*
 *  Application View
 */
define('views/app',[
    'views/common/header',
    'views/common/music_player',
    'views/top',
    'views/pop/index',
    'views/pop/list',
    'views/music/index',
    'views/music/search',
    'views/login',
    'views/mypage',
    'views/user/index',
    'views/user/regist',
    'views/user/timeline',
    'views/user/setting',
    'views/artist/index',
    'views/rules/index',
    'views/common/footer',
    'models/common/user_storage',
], function (
    HeaderView,
    MusicPlayerView,
    TopView,
    PopView,
    PopListView,
    MusicView,
    MusicSearchView,
    LoginView,
    MypageView,
    UserView,
    UserRegistView,
    TimelineView,
    UserSettingView,
    ArtistView,
    RulesView,
    FooterView,
    UserStorage
) {

    // AppView
    var ApplicationView = Backbone.View.extend({

        // Field
        currentPageView: null,
        userStorage: new UserStorage(),
        $mainArea: null,

        initialize: function() {
            this.$el = $('#stage');
            this.$mainArea = $('#main');
            mb.$playArea = $('#playArea');
            _.bindAll(this, 'authErrorHandler');

            // Add Header
            this.headerView = new HeaderView();
            this.headerView.show();

            // Add Footer
            this.footerView = new FooterView();
            this.footerView.show();

            // Music Player.
            // 各ページから使いたいので、グローバル変数へ代入する。
            this.musicPlayer = new MusicPlayerView();
            mb.musicPlayer = this.musicPlayer;

            // ログイン処理のバインド
            this.$el.on('click', '[data-event-click="login"]', _.bind(this.authErrorHandler, this));

        },

        events: {
            'authError': 'authErrorHandler',
        },

        authErrorHandler: function () {
            var loginView = new LoginView();
            this.$mainArea.append(loginView.$el);
            loginView.show('modal', function () {
                loginView.$el.transition({opacity:0}, 200, function () {
                    loginView.$el.remove();
                });
            });
        },


        toTop: function () {
            this._prepareStage(TopView, function () {
                $('#pageTitle').text('Top');
                this.currentPageView.show();
            });
        },

        toPopList: function (feelingId) {
            this._prepareStage(PopListView, function () {
                $('#pageTitle').text('Drop List');
                this.currentPageView.show(feelingId);
            });
        },

        toMusicDetail: function (musicId) {
            this._prepareStage(MusicView, function () {
                $('#pageTitle').text('Music');
                this.currentPageView.show(musicId);
            });
        },

        toMusicSearch: function () {
            this._prepareStage(MusicSearchView, function () {
                $('#pageTitle').text('Music Search');
                this.currentPageView.show();
            });
        },

        toAddPop: function (musicId) {
            this._prepareStage(PopView, function () {
                $('#pageTitle').text('Add Drop');
                this.currentPageView.show(musicId);
            });
        },

        toLogin: function () {
            this._prepareStage(LoginView, function () {
                $('#pageTitle').text('Login');
                this.currentPageView.show();
            });
        },

        toMypage: function () {
            this._prepareStage(MypageView, function () {
                 $('#pageTitle').text('My List');
               this.currentPageView.show();
            });
        },

        toUserPage: function (userId) {
            this._prepareStage(UserView, function () {
                $('#pageTitle').text('User List');
                this.currentPageView.show(userId);
            });
        },

        toRegistUserPage: function () {
            this._prepareStage(UserRegistView, function () {
                $('#pageTitle').text('Regist');
                this.currentPageView.show();
            });
        },

        toTimeline: function () {
            this._prepareStage(TimelineView, function () {
                $('#pageTitle').text('Timeline');
                this.currentPageView.show();
            });
        },

        toUserSetting: function () {
            this._prepareStage(UserSettingView, function () {
                $('#pageTitle').text('Setting');
                this.currentPageView.show();
            });
        },

        toArtist: function (artistId) {
            this._prepareStage(ArtistView, function () {
                 $('#pageTitle').text('Artist Page');
               this.currentPageView.show(artistId);
            });
        },

        toRules: function () {
            this._prepareStage(RulesView, function () {
                $('#pageTitle').text('Rules');
                this.currentPageView.show();
            });
        },

        _prepareStage: function (ViewClass, callback) {

            // setting
            callback = _.bind(callback, this);

            // 表示中のお掃除
            var old$el = (this.currentPageView ? this.currentPageView.$el : $('#dummy'));
            if (this.currentPageView) {
                this.currentPageView.dealloc();
                this.currentPageView = null;
            }


            // 今のページはfadeoutをする
            var duration = 200;
            var delay = 300;
            var self = this;
            $('body').transition({opacity: 0}, duration, function() {
                old$el.remove();
                window.scrollTo(0,0);
            });



            // もしローカルキャッシュが無い場合には、キャッシュを取得してから表示を行う
            var showPage = function () {
                self.currentPageView = new ViewClass();
                self.currentPageView.$el.css('opacity', 0);
                self.$mainArea.append(self.currentPageView.$el);
                $('body').transition({opacity: 1, delay: delay});
                self.currentPageView.$el.transition({opacity: 1, delay: delay});
            };
            if (!this.userStorage.getCommon()) {
                this.userStorage.loadCommonInfo({callback: function () {
                    showPage();
                    callback();
                }});
            } else {
                showPage();
                callback();
            }


            // ユーザー情報が無い場合に、認証情報があれば、ユーザー情報を取得しておく。
            if (!this.userStorage.getUser()) {
                if ($.cookie('uid')) {

                    $.ajax({
                        url: '/api/v1/userInfo',
                        dataType: 'json',
                        success: function (user) {
                            self.userStorage.setUser(user);

                            // ユーザーにひもづく各種情報も取得しておく
                            _.loadUserPockets({force:true});
                            _.loadUserArtistFollow({force:true});
                        },
                        error: function () {
                            // console.debug('/api/v1/userinfo error: ', arguments);
                        },
                    });

                }
            } else {

                // ユーザーにひもづく各種情報も取得しておく
                _.loadUserPockets();
                _.loadUserArtistFollow();

            }


            // ログイン状況に合わせて、左上のモジュールを切り替える
            if (_.isLogedIn()) {
                $('#appLoginModule').addClass('hidden');
                $('#gotoUserSetting').removeClass('hidden');

                var user = _.mbStorage.getUser();
                $('#gotoUserSetting').html('<i class="ico-font ico-user mr5"></i>' + user.name);

            } else {
                $('#appLoginModule').removeClass('hidden').text('ログイン');
                $('#gotoUserSetting').addClass('hidden');
            }




        },

    });

    return ApplicationView;
});






























/*
 *  Main.js
 */

// namespace
window.mb = window.mb || {};


// require config.
require.config({
    baseUrl: '/javascripts'
});


// start point.
require([
    'views/app',
], function (
   AppView
) {


    // Router
    var AppRouter = Backbone.Router.extend({

        initialize: function () {
            this.appView = new AppView();
        },

        routes: {
            '': 'top',
            'top': 'top',
            'poplist/:feeling_id':  'poplist',
            'music/detail/:id': 'musicDetail',  // duplicate, instad to "music/:id"
            'music/search': 'musicSearch',
            'music/:id': 'musicDetail',
            'music/:id/pop/add': 'addPop',
            'music/:id/pop/edit/:pop_id': 'editPop',
            'login': 'login',
            'mypage': 'mypage',
            'user/new': 'registUser',
            'user/:id': 'userPage',
            'artist/:id': 'artist',
            'timeline': 'timeline',
            'usersetting': 'usersetting',
            'rules': 'rules',
            '*path': 'defaultRoute'
        },

        top: function () {
            this.sendAction('/#');
            this.appView.toTop();
            _gaq.push(['_trackPageview', '/']);
        },

        poplist: function (feelingId) {
            this.sendAction('/#poplist/' + feelingId);
            this.appView.toPopList(feelingId);
            _gaq.push(['_trackPageview', '/#poplist/' + feelingId]);
        },

        musicDetail: function (musicId) {
            this.sendAction('/#music/' + musicId);
            this.appView.toMusicDetail(musicId);
            _gaq.push(['_trackPageview', '/#music/' + musicId]);
        },

        defaultRoute: function () {
            this.top();
            _gaq.push(['_trackPageview', '/']);
        },

        musicSearch: function () {
            this.sendAction('/#music/search');
            this.appView.toMusicSearch();
            _gaq.push(['_trackPageview', '/#music/search']);
        },

        addPop: function (musicId) {
            this.sendAction('/#music/' + musicId + '/pop/add');
            this.appView.toAddPop(musicId);
            _gaq.push(['_trackPageview', '/#music/' + musicId + '/pop/add']);
        },

        login: function () {
            this.sendAction('/#login');
            this.appView.toLogin();
            _gaq.push(['_trackPageview', '/#login']);
        },

        mypage: function () {
            this.sendAction('/#mypage');
            this.appView.toMypage();
            _gaq.push(['_trackPageview', '/#mypage']);
        },

        userPage: function (userId) {

            // もし自分のIDの場合は、マイページを表示する
            var user = _.mbStorage.getUser();
            if (user && user.id === parseInt(userId, 10)) {
                mb.router.navigate('#mypage', true);
                return;
            }

            this.sendAction('/#user/' + userId);
            this.appView.toUserPage(userId);
            _gaq.push(['_trackPageview', '/#user/' + userId]);
        },

        registUser: function () {
            this.sendAction('/#user/new');
            this.appView.toRegistUserPage();
            _gaq.push(['_trackPageview', '/#user/new']);
        },

        artist: function (artistId) {
            this.sendAction('/#artist/' + artistId);
            this.appView.toArtist(artistId);
            _gaq.push(['_trackPageview', '/#artist/' + artistId]);
        },

        timeline: function () {
            this.sendAction('/#timeline');
            this.appView.toTimeline();
            _gaq.push(['_trackPageview', '/#timeline']);
        },

        usersetting: function () {
            this.sendAction('/#usersetting');
            this.appView.toUserSetting();
            _gaq.push(['_trackPageview', '/#usersetting']);
        },

        rules: function () {
            this.sendAction('/#rules');
            this.appView.toRules();
            _gaq.push(['_trackPageview', '/#rules']);
        },

    
        // ページ遷移を通知
        sendAction: function (anUrl) {
            console.log('route: ', anUrl);
            _.sendActionLog(anUrl);
        },


    });




    $(function () {
        mb.router = new AppRouter();
        Backbone.history.start();
    });




});

define("main", function(){});
