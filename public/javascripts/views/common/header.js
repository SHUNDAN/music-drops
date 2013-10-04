"use strict";
/**
 * Header
 */
define([], function () {

    var HeaderView = Backbone.View.extend({

        initialize: function () {
            this.$el = $('#header');
            _.bindAll(this, 'show');
        },

        events: {

        },

        render: function () {
            var template = $('#component_header').html();
            this.$el.html(template);
        },

        show: function () {
            this.render();
        },

        dealloc: function () {

        },



    });

    return HeaderView;
});
