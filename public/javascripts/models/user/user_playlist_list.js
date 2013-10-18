"use strict";
/**
 * Collection: User Pocket Collection
 */
define(['models/user/user_playlist'], function (UserPlaylist) {

    var UserPlaylistCollection = Backbone.Collection.extend({

        model: UserPlaylist,

        url: function () {
            return '/api/v1/user_playlists';
        },


        fetchFollowPlaylist: function (userId) {
            this.fetch({
                reset: true,
                url: '/api/v1/follow_playlists',
                data: {
                    user_id: userId
                }
            });
        },

    });

    return UserPlaylistCollection;
});

