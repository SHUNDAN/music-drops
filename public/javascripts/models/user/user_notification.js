/**
 * Model: User Notification
 */
define([], function () {

    var UserNotificationModel = Backbone.Model.extend({
   
        defaults: {
            id: null,
            type: null,
            json: null,
            create_at: null,
            update_at: null
        },

        urlRoot: '/api/v1/user_notifications/',
    });

    return UserNotificationModel;

});
