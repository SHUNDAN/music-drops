"use strict";
/*
 * Model: User Pocket
 */
define([], function () {
    console.debug('load: model:user_pocket');

    var UserPocketModel = Backbone.Model.extend({

        defaults: {
            id: null,
            user_id: null,
            music_id: null,
            feeling_id: 0,
            tags: null,
            youtube_id: null,
            music_link_id: null,
            create_at: null,
            update_at: null
        },


        urlRoot: '/api/v1/user_pockets/',


        load: function (id) {
            this.set('id', id);
            this.fetch();
        },

        create: function () {
            console.log('create');
            this.save(this.attributes, {
                // headers: {uid: localStorage.getItem('uid')},
                error: _.bind(function (jqXHR, statusObject, err) {
                    console.log('Pop save failed. reson: ', arguments);
                    if (statusObject.status === 403) {
                        mb.router.appView.authErrorHandler();
                    }
                }, this),
            });
        },
    });


    // static method.
    UserPocketModel.createInstance = function (data) {

        var userPocket = new UserPocketModel();
        userPocket.set('id', data.id);
        userPocket.set('user_id', data.user_id);
        userPocket.set('music_id', data.music_id);
        userPocket.set('youtube_id', data.youtube_id);
        userPocket.set('music_link_id', data.music_link_id);
        userPocket.set('create_at', data.create_at);
        userPocket.set('update_at', data.update_at);
        return userPocket;
    };




    return UserPocketModel;
});
