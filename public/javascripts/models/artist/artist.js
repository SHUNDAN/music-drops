"use strict";
/**
 * Model: Artist
 */
define([], function () {

    var ArtistModel = Backbone.Model.extend({

        defaults: {
            id: null,
            name: null,
            create_at: null,
            update_at: null,
        },

        urlRoot: '/api/v1/artists',

    });

    return ArtistModel;

});
