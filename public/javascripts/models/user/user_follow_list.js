/**
 * Collection: User Follow
 */
define(['models/user/user_follow'], function (UserFollow) {

    var UserFollowCollection = Backbone.Collection.extend({

        model: UserFollow,

        url: '/api/v1/user_follows/',
    });

    return UserFollowCollection;
});
