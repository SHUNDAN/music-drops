/**
	タイムラインView
*/
define([
	"models/user/user_notification_list"
], function (
	UserNotificationList
) {

	var TimelineView = Backbone.View.extend({


		// お知らせ一覧
		userNotificationList: null,

		// 表示タイプ
		displayType: -1,  // -1:all



		initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this, 'render');

		},


		/**
			ページ骨格の表示
		*/
		render: function () {
			console.debug('render: ', this.userNotificationList);

			// 新しい順に並べる
			var models = _.sortBy(this.userNotificationList.models, function (model) {
				return model.attributes.create_at * -1;
			});

			var snipet = _.mbTemplate('page_timeline', {notifications: models});
			this.$el.html(snipet);
		},



		/**
			ページ表示
		*/
		show: function () {

			// ログインチェック
			if (!_.isLogedIn()) {
				mb.router.navigate('#');
				mb.router.appView.authErrorHandler();
				return;
			}


			// お知らせを取得する
			this.userNotificationList = new UserNotificationList();
			this.userNotificationList.bind('sync', this.render);
			this.userNotificationList.fetch({reset: true, data: {user_id: _.mbStorage.getUser().id}});
		},


		/**
			終了処理
		*/
		dealloc: function () {

		},

	});

	return TimelineView;

});


























