/**
 * Collection: User Follow
 */
define(['models/user/user_artist_follow'], function (UserArtistFollow) {

    var UserArtistFollowCollection = Backbone.Collection.extend({

        model: UserArtistFollow,

        url: '/api/v1/user_artist_follows',
    });

    return UserArtistFollowCollection;
});
