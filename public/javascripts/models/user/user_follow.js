"use strict";
/**
 * Model: User Follow
 */
define([], function () {
    
    var UserFollowModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            user_id: null,
            dest_user_id: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_follows/',
    });

    return UserFollowModel;
});
