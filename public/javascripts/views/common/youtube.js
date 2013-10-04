/**
 * View: Youtube
 */
define([], function () {

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


            // 再生対象なければ何もしない
            if (!musicArray || musicArray.length === 0) {
                console.warn('musicArray is not defined or empty');
                return;
            }


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

                var func = _.bind(aMusic.songUrl ? self._playItunesMusic : self._playYoutube, self);
                var param = aMusic.songUrl ? aMusic.songUrl : aMusic.youtubeId;

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
