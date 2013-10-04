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
            console.log('playSong: ', youtubeId, songUrl);


            // play.
            this.youtubeView = new YoutubeView();
            if (youtubeId) {
                this.youtubeView.show(youtubeId, this);

            } else {
                this.youtubeView.playSampleMusic(songUrl, this);
            }

        },


        playAll: function (e) {
            var target = $(e.currentTarget).data('target');
            console.log('playAll: ', target);

            var array = [];
            this.$el.find('#' + target + ' [data-event="playSong"]').each(function () {

                var $this = $(this);

                array.push({
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
                }
            };

            // change row color.
            // var music = array.length !== 0 ? array[0] : {};
            // $('#' + target).find('tr[data-pop-id="'+music.popId+'"]').addClass('success');

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
