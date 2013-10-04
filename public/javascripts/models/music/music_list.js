/**
 *  Collection: Music
 */
define(['models/music/music'], function (MusicModel) {

    var MusicCollection = Backbone.Collection.extend({
        
        model: MusicModel,

        url: '/api/v1/musics'
    });

    return MusicCollection;
});
