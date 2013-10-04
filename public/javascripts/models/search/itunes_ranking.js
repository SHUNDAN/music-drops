/*
 * Model: iTuens Ranking 
 */
define(function () {

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
