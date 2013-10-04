"use strict";
/**
 * Collection: User Pocket Collection
 */
define(['models/user/user_pocket'], function (UserPocket) {

    var UserPocketCollection = Backbone.Collection.extend({

        model: UserPocket,

        url: function () {
            return '/api/v1/user_pockets2';
        },

        refreshDataWithUserId: function (userId) {
            this.fetch({
                reset: true,
                data: {
                    user_id: userId
                },
            });
        },
    });

    return UserPocketCollection;
});

