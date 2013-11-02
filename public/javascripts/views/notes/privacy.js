/**
	プライバシーポリシー
*/
define([
], function (
) {

	var PrivacyView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_privacy');
			this.$el.html(snipet);
		},


		show: function () {

			this.render();
		},

		dealloc: function () {

		},

	});

	return PrivacyView;

});