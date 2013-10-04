"use strict";
/*
 * ITunesRankingListView
 */
define([
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
