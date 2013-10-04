"use strict";
/**
 * Model: User
 */
define([], function () {

    var User = Backbone.Model.extend({

        defaults: {
            id: null,
            user_id: null,
            password: null,
            name: null,
            thumb_url: null,
            sex: null,
            birthday: null,
            pocket_filter: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/users',
    });

    return User;
});
