"use strict";
/*
 * Model: User Playlist
 */
define([], function () {

    var UserPlaylistModel = Backbone.Model.extend({
    
        defaults: {
            id: null,
            user_id: null,
            type: null,
            title: null,
            seq: null,
            user_pocket_ids: '[]',
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_playlists/',


    });

    return UserPlaylistModel;
});
