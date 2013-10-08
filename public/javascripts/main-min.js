

/**
 * Header
 */
define('views/common/header',[], function () {

    var HeaderView = Backbone.View.extend({

        initialize: function () {
            this.$el = $('#header');
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
            return (type === 'ls' ? localStorage : sessionStorage);
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

        url: function () {
            return '/api/v1/pops';
        },

        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: sessionStorage.getItem('uid')},
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

            var user = this.userStorage.getUser();
            if (user) {
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

            var feelingList = this.userStorage.getCommon().feelings;
            var template = $('#page_top').html();
            var snipet = _.template(template, {feelingList:feelingList});
            this.$el.html(snipet);
        },


        renderFeelingList: function () {

            /*
            // buttons.
            var renderData = {
                feelings: this.collection.models,
                btnClasses: ["", "btn-primary", "btn-info", "btn-success", "btn-warning", "btn-danger", "btn-inverse"],
            };
            var btnsHtml = _.template($('#page_top_btn_list').html(), renderData);
            this.$el.append(btnsHtml);
            */

        },


        renderNewPopList: function () {
            console.log('renderNewPopList. popList: ', this.newPopList);
            var template = $('#page_top_poplist').html();
            var popList = this.newPopList.models;
            if (this.feelingFilterOfNewPopList) {
                popList = _.filter(popList, _.bind(function (model) {
                    return model.attributes.feeling_id === this.feelingFilterOfNewPopList;
                }, this));
            }
            var snipet = _.template(template, {popList:popList, likeArray:this.likeArray});
            this.$el.find('#newPopList').html(snipet);
        },


        renderPopularPopList: function () {
            console.log('renderPopularPopList. popList: ', this.popularPopList);
            var template = $('#page_top_poplist').html();
            var popList = this.popularPopList.models;
            if (this.feelingFilterOfPopularPopList) {
                popList = _.filter(popList, _.bind(function (model) {
                    return model.attributes.feeling_id === this.feelingFilterOfPopularPopList;
                }, this));
            }
            var snipet = _.template(template, {popList:popList, likeArray:this.likeArray});
            this.$el.find('#popularPopList').html(snipet);
        },


        renderHotPopList: function () {
            console.log('renderHotPopList. popList: ', this.hotPopList);
            var template = $('#page_top_poplist').html();
            var popList = this.hotPopList.models;
            if (this.feelingFilterOfHotPopList) {
                popList = _.filter(popList, _.bind(function (model) {
                    return model.attributes.feeling_id === this.feelingFilterOfHotPopList;
                }, this));
            }
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
            var popId = $(e.currentTarget).data('pop-id');
            console.log('likePop: ', popId);

            _.likePop(popId, _.bind(function () {

                // change visual.
                var $btns = this.$el.find('[data-pop-id="'+popId+'"].btn');
                $btns.addClass('btn-primary');
                $btns.attr('data-event', 'dislikePop');

                // save to local.
                this.likeArray.push(popId);
                var user = this.userStorage.getUser();
                user.like_pop = JSON.stringify(this.likeArray);
                this.userStorage.setUser(user);

            }, this));

        },



        dislikePop: function (e) {
            var popId = $(e.currentTarget).data('pop-id');
            console.debug('dislikePop: ', popId);


            _.dislikePop(popId, _.bind(function () {

                console.log('success dilike.');

                // change visual.
                var $btns = this.$el.find('[data-pop-id="'+popId+'"].btn');
                $btns.removeClass('btn-primary');
                $btns.attr('data-event', 'likePop');

                // save to local.
                this.likeArray = _.without(this.likeArray, popId);
                var user = this.userStorage.getUser();
                user.like_pop = JSON.stringify(this.likeArray);
                this.userStorage.setUser(user);

            }, this));

        },



        playSong: function (e) {
            var $this = $(e.currentTarget);
            var youtubeId = $this.data('youtube-id');
            var songUrl = $this.data('song-url');
            var musicId = $this.data('music-id');
            console.log('playSong: ', youtubeId, songUrl);


            // play.
            this.youtubeView = new YoutubeView();
            if (youtubeId) {
                this.youtubeView.show(youtubeId, this);

            } else {
                this.youtubeView.playSampleMusic(songUrl, this);
            }

            // add play count.
            _.addMusicPlayCount(musicId);

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
        music_id:       null,
        pop_id:         null,
        feelingList:    null,
        popModel:       new PopModel(),

        // functional field. 
        userStorage: new UserStorage(),
        


        initialize: function () {

            // intialize data.
            this.feelingList = this.userStorage.getCommon().feelings;

            // bind event.
            _.bindAll(this, 'render', 'show', 'showMusicInfo', 'showPopInfo', 'refreshFeelingSelect', 'addOrUpdate', 'popSaveSuccess', 'dealloc');
            this.popModel.bind('change', this.ShowPopInfo);
            this.popModel.bind('sync', _.bind(this.popSaveSuccess, this));
        },



        template: $('#page_pop').html(),



        events: {
            'click #updatePopBtn': 'addOrUpdate'
        },



        render: function () {
            this.$el.append(_.template(this.template, {type: this.type}));

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
                    this.destory();
                }, this));
                this.$el.prepend($blackout);

                // display as modal.
                this.$el.find('#pagePop').css({
                    position: 'fixed',
                    top: '100px',
                    left: '10%',
                    width: '80%',
                    'background-color': 'rgba(255,255,255,.9)',
                });
            }
        },

        showMusicInfo: function () {
            console.log('showMusicInfo');
            var musicInfo = _.template($('#page_music_detail_info').html(), this.musicModel.attributes);
            this.$el.find('#musicInfoArea').html(musicInfo);
        },


        showPopInfo: function () {
            console.log('showPopInfo');
            var popInfo = _.template($('#pop_info').html(), this.popModel.attributes);
            console.log(popInfo);
            this.$el.find('#popInfoArea').html(popInfo);
            console.log(this, this.$el, this.$el.find('#musicInfoArea'));
            console.log('feelingList: ', this.feelingList);
            if (this.feelingList.length > 0) {
                this.refreshFeelingSelect();
            }
        },


        refreshFeelingSelect: function () {
            console.log('refreshFeelingSelect', this.feelingList.models);
            var html = _.template($('#pop_page_feeling_list_options').html(), {feelings: this.feelingList, pop: this.popModel.attributes});
            this.$el.find('#feeling_select').html(html);
        },

        addOrUpdate: function () {
            console.log('addOrUpdate');
            this.popModel.attributes.feeling_id = $('#feeling_select').val();
            this.popModel.attributes.music_id = this.music_id;
            this.popModel.attributes.comment = $('[name="comment"]').val();

            // TODO Validate


            if (this.type === 'add') {
                this.popModel.create();
            } else {
                this.popModel.update();
            }

        },

        popSaveSuccess: function () {
            alert('save successed');

            if (this.displayType === 'modal') {
                this.$el.remove();
                this.destory();
            }

            mb.router.navigate('/music/' + this.music_id, true);
        },




        show: function (musicId, popId, displayType) {
            console.log('pop:show: ', musicId, popId);

            // set data.
            this.type = (popId ? 'update' : 'add');
            this.music_id = musicId;
            this.pop_id = popId;
            this.displayType = displayType;

            // render base.
            this.render();

            // show Pop.
            if (popId) {
                this.popModel.loadData(popId);
            } else {
                this.showPopInfo();
            }

        },



        dealloc: function () {},
    });

    return popView;
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


        url: function () {
            return '/api/v1/music_links';
        },


        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: sessionStorage.getItem('uid')},
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
                // headers: {uid: sessionStorage.getItem('uid')},
                error: _.bind(function (jqXHR, statusObject, err) {
                    console.log('Pop save failed. reson: ', arguments);
                    if (statusObject.status === 403) {
                        mb.router.appView.authErrorHandler();
                    }
                }, this),
            });
        },

    });

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
            this.model = new Music();
            this.collection = new PopList();
            this.musicLinkCollection = new MusicLinkList();
            _.bindAll(this, 'addLink', 'render', 'renderMusicInfo', 'renderPopList', 'renderMusicLinkList', 'finishUserAddMusicLink', 'addPop', 'pocket', 'deletePocket', 'show', 'showYoutube', 'dealloc');
            this.model.bind('change', this.renderMusicInfo);
            this.collection.bind('reset', this.renderPopList);
            this.musicLinkCollection.bind('reset', this.renderMusicLinkList);
        },

        events: {
            'click #addLink': 'addLink',
            'click [data-event="addPocket"]': 'pocket',
            'click [data-event="deletePocket"]': 'deletePocket',
            'click [data-event="addPop"]': 'addPop',
            'click [data-event="playYoutube"]': 'showYoutube',
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
            console.log('renderMusicInfo', this.model.attributes);
            var musicInfo = _.template($('#page_music_detail_info').html(), _.extend({}, this.model.attributes, this.userStorage.getCommon()));
            this.$el.find('#musicInfoArea').html(musicInfo);
        },

        renderPopList: function () {
            console.log('renderPopList');
            var html = _.template($('#page_music_detail_poplist').html(), {popList: this.collection.models});
            this.$el.find('#popListArea').html(html);
        },

        renderMusicLinkList: function () {
            var template = $('#page_music_detail_music_links').html();
            var snipet = _.template(template, {musicLinkList: this.musicLinkCollection.models});
            this.$el.find('#musicLinkListArea').html(snipet);

        },

        show: function (musicId) {
            this.music_id = musicId;
            this.render();

            // 情報を取得する
            this.model.loadData(musicId);
            this.collection.refreshDataWithMusicId(musicId);
            this.musicLinkCollection.refreshDataWithMusicId(musicId);
        },

        addLink: function (e) {
            var $this = $(e.currentTarget);
            var $tr = $this.parents('tr');
            var comment = $tr.find('[data-type="comment"]').text();
            var link = $tr.find('[data-type="link"]').text();

            // データチェック
            if (comment.length === 0) {
                alert('Comment is required');
                return;
            }
            if (link.length === 0) {
                alert('Link is required');
                return;
            }
            if (link.toLowerCase().indexOf('http://') !== 0
                    && link.toLowerCase().indexOf('https://') !== 0) {
                alert('Link is invalid url. \nUrl must be http:// or https://');
                return;
            }

            // データ保存
            this.userAddMusicLink = new MusicLink();
            this.userAddMusicLink.attributes.music_id = this.music_id;
            this.userAddMusicLink.attributes.comment = comment;
            this.userAddMusicLink.attributes.link = link;
            this.userAddMusicLink.bind('sync', this.finishUserAddMusicLink);
            this.userAddMusicLink.create();
        },

        finishUserAddMusicLink: function () {
            alert('success');
            // mb.router.navigate('music/' + this.music_id, true);
            window.location.reload();
        },


        /**
         * 曲をPocketする
         */
        pocket: function (e) {
            console.log('pocket', this.music_id);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', this.music_id);
            this.userPocket.set('feeling_id', $(e.currentTarget).data('feeling-id'));
            this.userPocket.set('youtube_id', $(e.currentTarget).data('youtube-id'));
            this.userPocket.set('music_link_id', $(e.currentTarget).data('link-id'));
            this.userPocket.bind('sync', _.bind(this.pocketSuccessed, this));
            this.userPocket.create();

            return false;
        },

        /**
         * Pocket成功時
         */
        pocketSuccessed: function () {

            // LocalDataを更新
            _.loadUserPockets({force: true});


            // UIとイベントを変更
            $('[data-event="addPocket"]')
                .text('Pocket解除')
                .addClass('btn-primary')
                .attr('data-event', 'deletePocket');


            // 通知
            // alert('pocket successed');
        },


        deletePocket: function () {

            // 対象を探して、削除
            $.ajax({
                url: '/api/v1/user_pockets',
                data: {
                    user_id: this.userStorage.getUser().id,
                    music_id: this.music_id
                },
                dataType: 'json',
                success: function (pockets) {
                    console.debug('delete target pockets: ', pockets);

                    var count = pockets.length;
                    var doneCount = 0;

                    // 1個ずつ削除
                    for (var i = 0; i < pockets.length; i++) {
                        var id = pockets[i].id;
                        var pocket = new UserPocket();
                        pocket.set('id', id);
                        pocket.bind('sync', function () {
                            if (++doneCount === count) {
        
                                // UIとイベントを変更する
                                $('[data-event="deletePocket"]')
                                    .text('Pocketする')
                                    .removeClass('btn-primary')
                                    .attr('data-event', 'addPocket');

                                // Localデータも更新
                                _.loadUserPockets({force:true});
                            }
                        });
                        pocket.destroy({wait:true});
                    }

                    // UIとイベントを変更する
                    if (count === doneCount) {
                        $('[data-event="deletePocket"]')
                            .text('Pocketする')
                            .removeClass('btn-primary')
                            .attr('data-event', 'addPocket');

                        // Localデータも更新
                        _.loadUserPockets({force:true});
                    }

                }
            });

        },



        addPop: function () {

            // show PopView.
            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(this.music_id, undefined, 'modal');
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
    'views/music/itunes_ranking',
    'views/music/itunes_search',
], function (
    ITunesRankingView,
    ITunesSearchView

) {

    var SearchView = Backbone.View.extend({
    
        // fields.
        iTunesRankingView: null,
        iTunesSearchView: null,
        

        initialize: function () {

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
                success: function (json) {
                      alert('login successed');

                      // TODO とりあえずの実装なので直す
                      sessionStorage.setItem('user', JSON.stringify(json.info));

                      if (self.successCallback) {
                        self.successCallback();
                      } else {
                        mb.router.navigate('#', true);
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

    return UserPocketCollection;
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

        url: '/api/v1/user_follows/',
    });

    return UserFollowCollection;
});


/**
 * View: Mypage
 */
define('views/mypage',[
    'views/common/youtube',
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_notification_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/common/user_storage',
], function (
    YoutubeView,
    User,
    UserPocket,
    UserPocketList,
    UserNotificationList,
    UserFollow,
    UserFollowList,
    UserStorage
) {

    var MypageView = Backbone.View.extend({

        userStorage:  new UserStorage(),
        displayPocketListModel: new UserPocketList(),

        initialize: function () {
            _.bindAll(this, 'render', 'renderSavedFilter', 'renderUserFollowedList', 'renderUserFollowList',  'showUserPocketList', 'showUserNotificationList', 'showYoutube', 'deletePocket', 'deleteNofitication', 'changeTags', 'filterPockets', 'saveFilter', 'useFilter', 'clearFilter', 'deleteFilter', 'show', 'dealloc');
            this.userPocketList = new UserPocketList();
            this.userPocketList.bind('reset', this.showUserPocketList);
            this.userNotifitactionList = new UserNotificationList();
            this.userNotifitactionList.bind('reset', this.showUserNotificationList);
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);

            if (_.isIphone || _.isAndroid) {
                $(document).off().on('blur', '[data-event="filterPockets"]', this.filterPockets);
            } else {
                $(document).off().on('keyup', '[data-event="filterPockets"]', this.filterPockets);
            }
        },

        events: {
            'click [data-event="showYoutube"]': 'showYoutube',
            'click [data-event="deletePocket"]' : 'deletePocket',
            'click [data-event="deleteNotification"]': 'deleteNofitication',
            'blur [data-event="changeTags"]': 'changeTags',
            // 'keyup [data-event="filterPockets"]': 'filterPockets',
            'click [data-event="saveFilter"]': 'saveFilter',
            'click [data-event="useFilter"]': 'useFilter',
            'click [data-event="clearFilter"]': 'clearFilter',
            'click [data-event="deleteFilter"]': 'deleteFilter',
        },

        render: function () {
            console.log('render', this.user);
            var template = $('#page_mypage').html();
            var snipet = _.template(template, this.user);
            this.$el.append(snipet);

            this.renderSavedFilter();


            // bind event.
            // if (_.isIPhone || _.isAndroid) {
            //     $(document).off().on('blur', '[data-event="filterPockets"]', this.filterPockets);
            // } else {
            //     $(document).off().on('keyup', '[data-event="filterPockets"]', this.filterPockets);
            // }




        },

        renderSavedFilter: function () {
            var template = $('#page_mypage_saved_filter').html();
            if (this.user.pocket_filter) {
                this.user.pocket_filter_object = JSON.parse(this.user.pocket_filter);
            } else {
                this.user.pocket_filter_object = [];
            }
            var snipet = _.template(template, this.user);
            this.$el.find('#savedFilter').html(snipet);
        },


        renderUserFollowedList: function () {
            console.log('renderUserFollowedList', this.userFollowedList);
            var template = $('#page_common_followed_list').html();
            var snipet = _.template(template, {users: this.userFollowedList.models});
            this.$el.find('#followedUserList').html(snipet);
        },

        renderUserFollowList: function () {
            console.log('renderUserFollowList', this.userFollowList);
            var template = $('#page_common_follow_list').html();
            var snipet = _.template(template, {users: this.userFollowList.models});
            this.$el.find('#followUserList').html(snipet);

        },





        /**
         * ユーザーPocket一覧を表示
         */
        showUserPocketList: function () {
            console.log('showUserPocketList');
            var template = $('#page_mypage_poplist').html();
            console.log(this.userPocketList.models);
            this.displayPocketListModel = _.sortBy(this.userPocketList.models, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {pocketList: this.displayPocketListModel, feelings: this.userStorage.getCommon().feelings});
            $('#poplist').html(snipet);
        },


        /**
         * ユーザーPocket一覧を表示2
         */
        showUserPocketList2: function () {
            console.log('showUserPocketList2');
            var template = $('#page_mypage_poplist').html();
            this.displayPocketListModel = _.sortBy(this.displayPocketListModel, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {pocketList: this.displayPocketListModel, feelings: this.userStorage.getCommon().feelings});
            $('#poplist').html(snipet);
        },

        /**
         * ユーザーお知らせ一覧の表示
         */
        showUserNotificationList: function () {
            console.log('showUserNotificationList');
            var template = $('#page_common_notification_list').html();
            var models = _.sortBy(this.userNotifitactionList.models, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {notificationList: models});
            this.$el.find('#notification_list').html(snipet);
        },




        /**
         * Youtube再生
         */
        showYoutube: function (e) {
            var pos = $(e.currentTarget).data('pos');
            console.log('showYoutube:', pos);


            // YoutubeId一覧を取得
            var ids = [];
            _.each(this.displayPocketListModel, function (model) {
                if (model.attributes.youtube_id) {
                    ids.push(model.attributes.youtube_id);
                }
            });
            console.log('ids', ids);

            // 再生順に並び替える
            var youtubeIds = [].concat(ids.slice(pos, ids.length)).concat(ids.slice(0,pos));
            console.debug('youtubeIds: ', youtubeIds);


            // Youtubeを再生する
            if (mb.youtubeView) {
                mb.youtubeView.dealloc();
            }
            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(youtubeIds, this);
        },


        /**
         * Pocket削除
         */
        deletePocket: function (e) {
            var pocketId = $(e.currentTarget).data('pocket-id');
            console.log('deletePocket', pocketId);

            var aPocket = this.userPocketList.get(pocketId);
            aPocket.bind('sync', _.bind(function () {
                this.showUserPocketList();

                // Localデータも更新
                _.loadUserPockets({force: true});

            }, this));
            aPocket.destroy({wait: true});
        },


        /**
         * お知らせ削除
         */
        deleteNofitication: function (e) {
            var notifId = $(e.currentTarget).data('notification-id');
            console.log('deleteNotification: ', notifId);

            var notification = this.userNotifitactionList.get(notifId);
            notification.bind('sync', _.bind(function () {
                this.showUserNotificationList();
            }, this));
            notification.destroy({wait: true});
        },


        changeTags: function (e) {
            var id = $(e.currentTarget).data('pocket-id');
            var tagString = $(e.currentTarget).text();
            console.log('changeTags', id, tagString);

            var tags = [];
            _.each(tagString.split(','), function (tag) {
                tag = _.trim(tag);
                if (tag.length !== 0) {
                    tags.push(tag);
                }
            });
            console.log('tags: ', tags);

            
            // サーバーへ保存する
            var anUserPocket = new UserPocket();
            anUserPocket.set('id', id);
            anUserPocket.set('tags', tags.join(','));
            anUserPocket.bind('sync', function () {
                console.log('update tags: ', id, tags);
            });
            anUserPocket.save();


            // 表示中のPocketにも反映します。
            var pocket = this.userPocketList.get(id);
            pocket.set('tags', tags.join(','));


        },



        filterPockets: function () {
            var title = $('#titleCondition').val();
            var artist = $('#artistCondition').val();
            var tagString = $('#tagsCondition').val();
            console.log('filterPockets', title, artist, tagString);


            // async process.
            setTimeout(_.bind(function () {

                // defaults.
                var displayPocketListModel = this.userPocketList.models;

                // filter by title.
                title = _.trim(title);
                console.log('title: ', title);
                if (title.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {
                        return model.attributes.title.indexOf(title) + 1;
                    });
                }


                // filter by artist
                artist = _.trim(artist);
                console.log('artist: ', artist);
                if (artist.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {
                        return model.attributes.artist_name.indexOf(artist) + 1;
                    });
                }


                // filter by tags.
                var tags = [];
                _.each(tagString.split(','), function (tag) {
                    tag = _.trim(tag);
                    if (tag.length !== 0) {
                        tags.push(tag);
                    }
                });
                console.log('tags: ', tags);
                if (tags.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {

                        var aTagString = model.attributes.tags;
                        if (!aTagString || aTagString.length === 0) {
                            return false; 
                        }

                        var aTags = aTagString.split(',');
                        var found = false;
                        _.each(aTags, function (tag) {
                            if (_.contains(tags, tag)) {
                                found = true; 
                            }
                        });
                        return found;
                    });
                }


                // render
                this.displayPocketListModel = displayPocketListModel;
                this.showUserPocketList2();


            }, this), 50);



        },



        saveFilter: function () {
            var title = $('#titleCondition').val();
            var artist = $('#artistCondition').val();
            var tagString = $('#tagsCondition').val();
            console.log('saveFilter: ', title, artist, tagString);


            var tags = [];
            _.each(tagString.split(','), function (tag) {
                tag = _.trim(tag);
                if (tag.length !== 0) {
                    tags.push(tag);
                }
            });


            // trim.
            title = _.trim(title);
            artist = _.trim(artist);

            // empty check.
            if (title.length === 0 && artist.length === 0 && tags.length === 0) {
                alert('empty condition not allowed');
                return;
            }


            // create condition.
            var condition = {
                title: title,
                artist: artist,
                tags: tags
            };
            

            // concat condition.
            var conditions = this.user.pocket_filter || '[]';
            conditions = JSON.parse(conditions);
            conditions.push(condition);
            this.user.pocket_filter = JSON.stringify(conditions);
            this.userStorage.setUser(this.user);


            // Update by API
            var anUser = new User();
            anUser.set('id', this.user.id);
            anUser.set('pocket_filter', JSON.stringify(conditions));
            anUser.bind('sync', _.bind(function () {
                alert('save filter successed');

                // update UI
                this.renderSavedFilter();
            }, this));
            anUser.save();

            


        },




        useFilter: function (e) {
            var $this = $(e.currentTarget);
            var title  = $this.data('title');
            var artist = $this.data('artist');
            var tags = $this.data('tags');
            console.debug('useFilter: ', title, artist, tags);

            
            // 表示きりかえ
            $('#savedFilter').children('div').removeClass('btn-warning');
            $this.addClass('btn-warning');


            // set data. 
            $('#titleCondition').val(title);
            $('#artistCondition').val(artist);
            $('#tagsCondition').val(tags);

            // action.
            this.filterPockets();

        },



        clearFilter: function () {

            // reset UI.
            $('#titleCondition').val('');
            $('#artistCondition').val('');
            $('#tagsCondition').val('');
            $('#savedFilter>div').removeClass('btn-warning');

            // action.
            this.filterPockets();
        },



        deleteFilter: function () {
            var $target = $('#savedFilter .btn-warning');
            if ($target.length === 0) {
                alert('Filterが選択されていません');
                return;
            }

            // 対象データを削除
            var title = $target.data('title');
            var artist = $target.data('artist');
            var tags = $target.data('tags');
            
            var pocketFilter = JSON.parse(this.user.pocket_filter);
            var newPocketFilter = [];
            for (var i = 0; i < pocketFilter.length; i++ ) {
                var filter = pocketFilter[i];    
                console.debug(filter, title, artist, tags);
                if (title && title === filter.title || !title && !filter.title) {
                    if (artist && artist === filter.artist || !artist && !filter.artist) {
                        if (!tags && !filter.tags) {
                            continue;
                        }
                        if (!tags && !filter.tags.length) {
                            continue;
                        }
                        if (tags.length === filter.tags.length) {
                            var equal = true;
                            for (var jj = 0; jj < tags.length; jj++) {
                                if (tags[jj] !== filter.tags[jj]) {
                                    equal = false;
                                    break;
                                }
                            }
                            if (equal) {
                                continue;
                            }
                        }
                    }
                }
                newPocketFilter.push(filter);
            }

            console.debug('old: ', pocketFilter);
            console.debug('new: ', newPocketFilter);


            this.user.pocket_filter = JSON.stringify(newPocketFilter);
            this.userStorage.setUser(this.user);


            // save to API.
            var anUser = new User();
            anUser.set('id', this.user.id);
            anUser.set('pocket_filter', this.user.pocket_filter);
            anUser.bind('sync', _.bind(function () {
                alert('success');

                // update UI
                this.renderSavedFilter();
                this.clearFilter();

            }, this));
            anUser.save();

        },










        show: function () {
            console.log('show mypage');

            // session storageに該当情報が無い場合には、フォワード
            if (!sessionStorage.getItem('user')) {
                mb.router.navigate('/', true);
                return;
            } else {
                this.user = JSON.parse(sessionStorage.getItem('user'));
            }

            // 画面表示
            this.render();

            // ユーザーPopリストを取得
            this.userPocketList.refreshDataWithUserId(this.user.id);

            // お知らせ一覧の取得
            this.userNotifitactionList.fetch({reset: true, data: {user_id: this.user.id}});

            // フォローされているユーザー一覧取得
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:this.user.id}});

            // フォローしているユーザー一覧
            this.userFollowList.fetch({reset:true, data: {user_id:this.user.id}});

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
    'views/common/youtube'
], function (
    User,
    UserPocket,
    UserPocketList,
    UserFollow,
    UserFollowList,
    UserStorage,
    YoutubeView
) {

    var UserView = Backbone.View.extend({
   
        // fields.
        userId: null,
        user: null,
        userPocketList: null,
        userFollow: null,
        userFollowedList: null,
        userFollowList: null,
        userStorage: new UserStorage(),


        /**
         * 初期化処理
         */
        initialize: function () {

            this.user = new User();
            this.userPocketList = new UserPocketList();
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();

            _.bindAll(this, 'render', 'renderUserInfo', 'renderPocketList', 'renderUserFollowedList', 'renderUserFollowList', 'showYoutube', 'addPocket', 'deletePocket', 'followUser', 'unfollowUser', 'show', 'dealloc');

            this.user.bind('change', this.renderUserInfo);
            this.userPocketList.bind('reset', this.renderPocketList);
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);
        },

        events: {
            'click [data-event="showYoutube"]': 'showYoutube',
            'click [data-event="addPocket"]': 'addPocket',
            'click [data-event="deletePocket"]': 'deletePocket',
            'click [data-event="followUser"]': 'followUser',
            'click [data-event="unfollowUser"]': 'unfollowUser'
        },

        render: function () {
            console.log('userView#render');
            var template = $('#page_user').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },

        renderUserInfo: function () {
            console.log('renderUserInfo', this.user);
            var template = $('#page_user_info').html();
            var snipet = _.template(template, _.extend({targetUserId: this.userId}, this.user.attributes));
            this.$el.find('#userInfoArea').html(snipet);
        },

        renderPocketList: function () {
            console.log('renderPocketList');
            var template = $('#page_user_pocketlist').html();
            var snipet = _.template(template, {pocketList:this.userPocketList.models, feelings:this.userStorage.getCommon().feelings});
            this.$el.find('#pocketlist').html(snipet);

        },

        renderUserFollowedList: function () {
            console.log('renderUserFollowedList', this.userFollowedList);
            var template = $('#page_common_followed_list').html();
            var snipet = _.template(template, {users: this.userFollowedList.models});
            this.$el.find('#followedUserList').html(snipet);
        },

        renderUserFollowList: function () {
            console.log('renderUserFollowList', this.userFollowList);
            var template = $('#page_common_follow_list').html();
            var snipet = _.template(template, {users: this.userFollowList.models});
            this.$el.find('#followUserList').html(snipet);
            
        },


        showYoutube: function (e) {
            var youtubeId = $(e.currentTarget).data('youtube-id');
            console.log('showYoutube', youtubeId);


            // 1曲だけにしようかと思ったけど、やっぱり全曲聞き回しがいいので作り直し。
            var youtubeIdx = $(e.currentTarget).data('youtube-idx');
            var youtubeIds = [];
            $('[data-youtube-id][data-event="showYoutube"]').each(function () {
                youtubeIds.push($(this).data('youtube-id'));
            });
            youtubeIds = [].concat(youtubeIds.slice(youtubeIdx, youtubeIds.length)).concat(youtubeIds.slice(0,youtubeIdx));
            console.log('youtubeId,idx: ', youtubeIds, youtubeIdx);



            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(youtubeIds, this);

        },

        addPocket: function (e) {
            var $this = $(e.currentTarget);
            var musicId = $this.data('music-id');
            var youtubeId = $this.data('youtube-id');
            console.log('addPocket', musicId, youtubeId);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', musicId);
            this.userPocket.bind('sync', function () {

                // UIとイベントを変更する
                $('[data-event="addPocket"][data-music-id="'+musicId+'"]')
                    .text('Pocket解除')
                    .addClass('btn-primary')
                    .attr('data-event', 'deletePocket');

                // Localデータ更新
                _.loadUserPockets({force: true});

            });
            this.userPocket.create();

        },



        deletePocket: function (e) {

            var musicId = $(e.currentTarget).data('music-id');

            // 対象を探して、削除
            $.ajax({
                url: '/api/v1/user_pockets',
                data: {
                    user_id: this.userStorage.getUser().id,
                    music_id: musicId 
                },  
                dataType: 'json',
                success: function (pockets) {
                    console.debug('delete target pockets: ', pockets);

                    var count = pockets.length;
                    var doneCount = 0;

                    // 1個ずつ削除
                    for (var i = 0; i < pockets.length; i++) {
                        var id = pockets[i].id;
                        var pocket = new UserPocket();
                        pocket.set('id', id);
                        pocket.bind('sync', function () {
                            if (++doneCount === count) {
            
                                // UIとイベントを変更する
                                $('[data-event="deletePocket"][data-music-id="'+musicId+'"]')
                                    .text('Pocketする')
                                    .removeClass('btn-primary')
                                    .attr('data-event', 'addPocket');

                                // Localデータも更新
                                _.loadUserPockets({force:true});
                            }   
                        }); 
                        pocket.destroy({wait:true});
                    }
 
                    // UIとイベントを変更する
                    if (count === doneCount) {
                        $('[data-event="deletePocket"][data-music-id="'+musicId+'"]')
                            .text('Pocketする')
                            .removeClass('btn-primary')
                            .attr('data-event', 'addPocket');

                        // Localデータも更新
                        _.loadUserPockets({force:true});
                    }

                }
            });
        },




        followUser: function () {
            console.log('followUser', this.userId);

            this.userFollow = new UserFollow();
            this.userFollow.set('dest_user_id', this.userId);
            this.userFollow.bind('sync', function () {
                alert('success');
                location.reload();
            });
            this.userFollow.bind('error', function () {
                alert('error');
                console.log('user follow error.', arguments);
            });
            this.userFollow.save();
        },


        unfollowUser: function () {
            console.log('unfollow');

            this.userFollow = new UserFollow();
            this.userFollow.set('id', this.user.attributes.user_follow_id);
            this.userFollow.bind('sync', function () {
                alert('success');
                location.reload();
            });
            this.userFollow.bind('error', function () {
                alert('error');
            });
            this.userFollow.destroy();

        },

        show: function (userId) {
            console.log('show: user_id: ', userId);
            this.userId = userId;
            this.render();
         
            // ユーザーデータ取得
            this.user.set('id', userId);
            this.user.fetch();

            // Pocketリスト取得
            this.userPocketList.fetch({reset: true, data: {user_id: userId}});

            // フォローされているユーザー一覧取得
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:userId}});
            
            // フォローしているユーザー一覧
            this.userFollowList.fetch({reset:true, data: {user_id:userId}});
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
        musicList: new MusicList(),
        userStorage: new UserStorage(),

        initialize: function () {

            _.bindAll(this, 'renderArtistInfo', 'renderMusicList', 'playYoutube', 'pocket', 'deletePocket');

            this.artist.bind('change', this.renderArtistInfo);
            this.musicList.bind('reset', this.renderMusicList);
        },

        events: {
            'click [data-event="playYoutube"]': 'playYoutube',
            'click [data-event="pocket"]': 'pocket',
            'click [data-event="deletePocket"]': 'deletePocket',
        },

        render: function () {
            console.log('artistview render');
            var template = $('#page_artist').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },

        renderArtistInfo: function () {
            console.log('renderArtistInfo');
            var template = $('#page_artist_info').html();
            var snipet = _.template(template, this.artist.attributes);
            this.$el.find('#artist_info').html(snipet);
        },

        renderMusicList: function () {
            console.log('renderMusicList');
            var template = $('#page_artist_music_list').html();
            var snipet = _.template(template, {musics: this.musicList.models});
            this.$el.find('#music_list').html(snipet);

        },

        playYoutube: function (e) {
            var $this = $(e.currentTarget);
            var youtubeId = $this.data('youtube-id');
            var pos = $this.data('pos');
            console.log('playYoutube', youtubeId, pos);

            // 再生リストを作成
            var ids = [];
            _.each(this.musicList.models, function (model) {
                if (model.attributes.youtube_id) {
                    ids.push(model.attributes.youtube_id);
                }
            });
            console.log(ids);

            var playList = [];
            playList = [].concat(ids.slice(pos, ids.length)).concat(ids.slice(0,pos));
            console.log('playlist: ', playList);
            

            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(playList, this);


        },

        pocket: function (e) {
            var musicId = $(e.currentTarget).data('music-id');
            console.log('pocket', musicId);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', musicId);
            this.userPocket.bind('sync', function () {

                // UIとイベントを変更する
                $(e.currentTarget)
                    .text('Pocket解除')
                    .addClass('btn-primary')
                    .attr('data-event', 'deletePocket');

                // Localデータも更新
                _.loadUserPockets({force: true});

            });
            this.userPocket.create();
        },

        
        deletePocket: function (e) {

            var musicId = $(e.currentTarget).data('music-id');

            // 対象を探して、削除
            $.ajax({
                url: '/api/v1/user_pockets',
                data: {
                    user_id: this.userStorage.getUser().id,
                    music_id: musicId 
                },  
                dataType: 'json',
                success: function (pockets) {
                    console.debug('delete target pockets: ', pockets);

                    var count = pockets.length;
                    var doneCount = 0;

                    // 1個ずつ削除
                    for (var i = 0; i < pockets.length; i++) {
                        var id = pockets[i].id;
                        var pocket = new UserPocket();
                        pocket.set('id', id);
                        pocket.bind('sync', function () {
                            if (++doneCount === count) {
    
                                // UIとイベントを変更する
                                $(e.currentTarget)
                                    .text('Pocketする')
                                    .removeClass('btn-primary')
                                    .attr('data-event', 'pocket');

                                // Localデータも更新
                                _.loadUserPockets({force:true});
                            }   
                        }); 
                        pocket.destroy({wait:true});
                    }

                    // UIとイベントを変更する
                    if (count === doneCount) {
                        $(e.currentTarget)
                            .text('Pocketする')
                            .removeClass('btn-primary')
                            .attr('data-event', 'addPocket');

                        // Localデータも更新
                        _.loadUserPockets({force:true});
                    }

                }
            });


        },

        show: function (artistId) {
            this.artistId = artistId;
            this.render();

            // load artist.
            this.artist.set('id', artistId, {silent: true});
            this.artist.fetch();

            // load music list.
            this.musicList.fetch({reset: true, data: {artist_id: artistId}});
        },

        dealloc: function () {

        },

    });

    return ArtistView;

});


/*
 *  Application View 
 */
define('views/app',[
    'views/common/header',
    'views/top',
    'views/pop/index',
    'views/pop/list',
    'views/music/index',
    'views/music/search',
    'views/login',
    'views/mypage',
    'views/user/index',
    'views/user/regist',
    'views/artist/index',
    'models/common/user_storage',
], function (
    HeaderView,
    TopView,
    PopView,
    PopListView,
    MusicView,
    MusicSearchView,
    LoginView,
    MypageView,
    UserView,
    UserRegistView,
    ArtistView,
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
                this.currentPageView.show();
            });
        },

        toPopList: function (feelingId) {
            this._prepareStage(PopListView, function () {
                this.currentPageView.show(feelingId);
            });
        },

        toMusicDetail: function (musicId) {
            this._prepareStage(MusicView, function () {
                this.currentPageView.show(musicId);
            });
        },

        toMusicSearch: function () {
            this._prepareStage(MusicSearchView, function () {
                this.currentPageView.show();
            });
        },

        toAddPop: function (musicId) {
            this._prepareStage(PopView, function () {
                this.currentPageView.show(musicId);
            });
        },

        toLogin: function () {
            this._prepareStage(LoginView, function () {
                this.currentPageView.show();
            });
        },

        toMypage: function () {
            this._prepareStage(MypageView, function () {
                this.currentPageView.show();
            });
        },

        toUserPage: function (userId) {
            this._prepareStage(UserView, function () {
                this.currentPageView.show(userId);
            });
        },

        toRegistUserPage: function () {
            this._prepareStage(UserRegistView, function () {
                this.currentPageView.show();
            });
        },

        toArtist: function (artistId) {
            this._prepareStage(ArtistView, function () {
                this.currentPageView.show(artistId);
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

                            // Pocket情報も取得しておく
                            _.loadUserPockets({force:true});
                        },
                        error: function () {
                            // console.debug('/api/v1/userinfo error: ', arguments);
                        },
                    });

                }
            } else {

                // UserPockets情報をロードしておく
                _.loadUserPockets();

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
            '*path': 'defaultRoute'
        },

        top: function () {
            this.sendAction('/#');
            this.appView.toTop();
        },

        poplist: function (feelingId) {
            this.sendAction('/#poplist/' + feelingId);
            this.appView.toPopList(feelingId);
        },

        musicDetail: function (musicId) {
            this.sendAction('/#music/' + musicId);
            this.appView.toMusicDetail(musicId);
        },

        defaultRoute: function () {
            this.top();
        },

        musicSearch: function () {
            this.sendAction('/#music/search');
            this.appView.toMusicSearch();
        },

        addPop: function (musicId) {
            this.sendAction('/#music/' + musicId + '/pop/add');
            this.appView.toAddPop(musicId);
        },

        login: function () {
            this.sendAction('/#login');
            this.appView.toLogin();
        },

        mypage: function () {
            this.sendAction('/#mypage');
            this.appView.toMypage();
        },

        userPage: function (userId) {
            this.sendAction('/#user/' + userId);
            this.appView.toUserPage(userId);
        },

        registUser: function () {
            this.sendAction('/#user/new');
            this.appView.toRegistUserPage();
        },

        artist: function (artistId) {
            this.sendAction('/#artist/' + artistId);
            this.appView.toArtist(artistId);
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
