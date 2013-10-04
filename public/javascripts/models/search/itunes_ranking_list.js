/**
 *  Collection: iTunes Ranking List
 */
define(['models/search/itunes_ranking'], function (ITunesRanking) {

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
