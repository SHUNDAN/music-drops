/**
 * View: Music - Search
 */
define([
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
