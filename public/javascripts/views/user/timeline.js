/**
	タイムラインView
*/
define([], function () {

	var TimelineView = Backbone.View.extend({

		initialize: function () {

		},


		/**
			ページ骨格の表示
		*/
		render: function () {
			var snipet = _.mbTemplate('page_timeline', {});
			this.$el.html(snipet);
		},



		/**
			ページ表示
		*/
		show: function () {

			// TODO ログインしていない場合は、だめよん♪

			this.render();
		},


		/**
			終了処理
		*/
		dealloc: function () {

		},

	});

	return TimelineView;

});