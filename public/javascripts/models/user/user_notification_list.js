"use strict";
/**
 * Collection: User Notification
 */
define(['models/user/user_notification'], function (UserNotification) {

    var UserNotificationCollection = Backbone.Collection.extend({

        model: UserNotification,

        url: '/api/v1/user_notifications',
    });


    return UserNotificationCollection;

});
