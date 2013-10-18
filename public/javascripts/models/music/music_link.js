"use strict";
/**
 * Model: Music Link
 */
define([], function () {

    var MusicLinkModel = Backbone.Model.extend({
        defaults: {
            id: null,
            music_id: null,
            user_id: null,
            comment: null,
            link: null,
            youtube_id: null,
            nico_id: null,
            create_at: null,
            update_at: null
        },


        url: function () {
            return '/api/v1/music_links';
        },


        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: localStorage.getItem('uid')},
                success: _.bind(function () {
                }, this),
                error: _.bind(function (jqXHR, status) {
                    console.log('Pop save failed. reson: ', arguments);
                    if (status.status === 403) {
                        mb.router.appView.authErrorHandler();
                    }
                }, this),
            });
        },
    });

    return MusicLinkModel;
});
