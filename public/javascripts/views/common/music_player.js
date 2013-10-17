/**
 * View: MusicPlayerView
 */
define([], function () {

    var MusicPlayerView = Backbone.View.extend({


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

            // set elements.
            this.$playlistTitle = $('#mpPlaylistTitle');
            this.$musicTitle = $('#mpMusicTitle');
            this.$artistName = $('#mpArtistName');


            this.previewSize = {width: 640, height: 500};
            this.movieSize = {width: 640, height: 390};
            this.scaleSize = 200 / this.previewSize.width;

        },

        render: function () {

        },



        /**
         * YoutubeとiTunes視聴を交えて再生する
         */
        playMusics: function (options) {

            var startPos = options.startPos || 0;
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
            this.$el.html($previewArea);


            // 連続再生の関数
            var self = this;
            var next = function () {
                console.debug('next is called. startPos=', startPos, 'musicArray.count=', musicArray.length);

                // 終了判定
                if (startPos >= musicArray.length) {
                    console.debug('finish play musics. startPos=', startPos, 'musicArray.count=', musicArray.length);
                    callbackWhenEnd();
                    return;
                }

                var aMusic = musicArray[startPos++];

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

            // youtubeをダウンロード
            var player;
            function startYoutube () {
                console.debug('startYoutube is called. id=', youtubeId);
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
