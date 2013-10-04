"use strict";
/*
 *  Feeling
 */
define(function () {

    var Feeling = Backbone.Model.extend({
        defaults: {
            id: null,
            name: null,
            create_at: null,
            update_at: null
        },
    });

    return Feeling;
});

