/**
	ユーザー設定画面
*/
define([
], function (
) {

	var RulesView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_rules');
			this.$el.html(snipet);
		},








		show: function () {

			this.render();
		},

		dealloc: function () {

		},

	});

	return RulesView;

});