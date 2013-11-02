"use strict";
/*
 *  TopView
 */
define([
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

            // もしnewbeの場合には、Welcomeメッセージを表示する
            if ($.cookie('isNewUser')) {
                $.removeCookie('isNewUser');
                var snipet = _.mbTemplate('page_top_welcome');
                $('body').append(snipet);
            }
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
