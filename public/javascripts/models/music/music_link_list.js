"use strict";
/**
 *  Collection: Music Link List
 */
define(['models/music/music_link'], function (MusicLink) {

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
