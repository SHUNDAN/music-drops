"use strict";
/**
 * Model: User Artist Follow
 */
define([], function () {
    
    var UserArtistFollowModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            user_id: null,
            artist_id: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_artist_follows/',
    });

    return UserArtistFollowModel;
});
