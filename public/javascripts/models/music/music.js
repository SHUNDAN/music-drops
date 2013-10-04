/*
 * Music
 */
define(function () {
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
