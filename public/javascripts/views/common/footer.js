"use strict";
/**
 * Header
 */
define([], function () {

    var FooterView = Backbone.View.extend({

        initialize: function () {
            this.$el = $('footer');
            _.bindAll(this, 'show');
        },

        events: {

        },

        render: function () {
            var template = $('#component_footer').html();
            this.$el.html(template);
        },

        show: function () {
            this.render();
        },

        dealloc: function () {

        },



    });

    return FooterView;
});
