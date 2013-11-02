/**
	Music Dropsとは？ページ
*/
define([
], function (
) {

	var AboutView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_about');
			this.$el.html(snipet);
		},


		show: function () {

			this.render();
		},

		dealloc: function () {

		},

	});

	return AboutView;

});