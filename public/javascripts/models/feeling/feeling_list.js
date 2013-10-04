"use strict";
/**
 * FeelingList
 */
define([
    'models/common/base',
    'models/feeling/feeling'
], function (
    BaseModel,
    Feeling
) {

    var FeelingList = Backbone.Collection.extend({
    
        model: Feeling,

        url: function () {
            return '/api/v1/feelings';
        },
    });

    return FeelingList;
});
