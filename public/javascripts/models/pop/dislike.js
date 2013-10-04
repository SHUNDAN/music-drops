"use strict";
/**
 * Dislike Model.
 */
define([], function () {

    var DislikeModel = Backbone.Model.extend({
    
        defaults: {
            id: null
        },

        url: '/api/v1/dislikepop'
    });

    return DislikeModel; 
});
