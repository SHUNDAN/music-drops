"use strict";
/**
 * Like Model.
 */
define([], function () {

    var LikeModel = Backbone.Model.extend({
    
        defaults: {
            id: null
        },

        url: '/api/v1/likepop',
    });

    return LikeModel;
});
