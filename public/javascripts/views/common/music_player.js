/**
 * View: MusicPlayerView

    ちょっと責務重すぎにしちゃってるけど、Headerの全機能を担当しています。
    views/common/header.jsは、headerの表示だけなのです。いまのところ実は。。
    理想の責務分担はこれから考えます。

 */
define([], function () {

    var MusicPlayerView = Backbone.View.extend({

        // Playlist内の再生位置
        currentPos: null,

        // 現在のYoutubePlayer
        youtubePlayer: null,

        // 現在のAudioタグPlayer
        audioPlayer: null,

        // timer
        timerId: null,


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


            // set elements.
            this.$playlistTitle = $('#mpPlaylistTitle');
            this.$musicTitle = $('#mpMusicTitle');
            this.$artistName = $('#mpArtistName');


            this.previewSize = {width: 640, height: 500};
            this.movieSize = {width: 640, height: 390};
            this.scaleSize = 200 / this.previewSize.width;

        },


        // header.jsでレンダリングしているので、今のところ何もしてない。
        render: function () {},



        /**
         * YoutubeとiTunes視聴を交えて再生する
         */
        playMusics: function (options) {

            // 表示を初期化する
            this.resetPlayer();

            this.currentPos = options.startPos || 0;
            var musicArray = options.musicArray;
            var callbackWhenWillStart = options.callbackWhenWillStart || function () {};
            var callbackWhenEnd = options.callbackWhenEnd || function () {};
            this.options = options;

            // set playlist name.
            this.$playlistTitle.html(options.playlistName);


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
            if (!_.isIphone && !_.isAndroid) {
                $previewArea.toggleClass('posNotShow'); // 最初は非表示                
            }
            this.$el.html($previewArea);


            // 連続再生の関数
            var self = this;
            var next = function () {
                console.debug('next is called. currentPos=', self.currentPos, 'musicArray.count=', musicArray.length);

                // 初期化
                self.youtubePlayer = null;
                self.audioPlayer = null;
                if (self.timerId) {
                    clearInterval(self.timerId);
                }

                // 終了判定
                if (self.currentPos >= musicArray.length) {
                    console.debug('finish play musics. currentPos=', self.currentPos, 'musicArray.count=', musicArray.length);
                    callbackWhenEnd();
                    return;
                }

                var aMusic = musicArray[self.currentPos++];

                var func = _.bind(aMusic.youtubeId ? self._playYoutube : self._playItunesMusic, self);
                var param = aMusic.youtubeId || aMusic.songUrl;

                // callback.
                if (callbackWhenWillStart) {
                    callbackWhenWillStart(aMusic);
                }

                // set infos.
                self.$musicTitle.html(aMusic.title);
                self.$artistName.html(aMusic.artistName);

                func(param, $previewArea, function () {

                    // next
                    next();

                });
            };
            _.bind(next, this);

            // 再生開始
            next();


            // プレイヤーを再生状態にする
            $('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

        },


        /**
            曲を開始する
        */
        startMusic: function () {
            $('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

            // audioタグの場合
            if (this.audioPlayer) {
                this.audioPlayer.play();
            }

            // Youtubeの場合
            if (this.youtubePlayer) {
                this.youtubePlayer.playVideo();
            }

        },


        /**
            曲を一時停止させる
        */
        pauseMusic: function () {
            $('[data-event-click="startMusic"], [data-event-click="pauseMusic"]').toggleClass('hidden');

            // audioタグの場合
            if (this.audioPlayer) {
                this.audioPlayer.pause();
            }

            // Youtubeの場合
            if (this.youtubePlayer) {
                this.youtubePlayer.pauseVideo();
            }
        },




        /**
         * 閉じる
         */
        close: function () {

            if (this.options.callbackWhenEnd) {
                this.options.callbackWhenEnd();
            }

            this.$el.remove();

            this.resetPlayer();

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
            var $closeBtn = $('<a href="#" class="closeBtn">×</a>');
            $closeBtn.on('click', _.bind(this.close, this));
            $appendView.append($closeBtn);


            // 小さくするボタン
            var $minimizeBtn = $('<a href="#" class="minimizeBtn">-</a>');
            $minimizeBtn.on('click', _.bind(this.minimize, this));
            $appendView.append($minimizeBtn);


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

                    if (!self.youtubePlayer) return;

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
            $(e.currentTarget).toggleClass('is-active');
            $('#previewArea').toggleClass('posNotShow');
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
