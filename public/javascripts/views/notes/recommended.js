/**
	推奨環境ページ
*/
define([
], function (
) {

	var RecommendedView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_recommended');
			this.$el.html(snipet);
		},


		show: function () {

			this.render();
		},

		dealloc: function () {

		},

	});

	return RecommendedView;

});