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

			// 件数も更新
			var numOfLike = 0;
			var numOfFollowUser = 0;
			var numOfFollowArtist = 0;
			_.each(this.userNotificationList.models, function (notif) {
				if (notif.attributes.type === 1 || notif.attributes.type === 2) {
					numOfFollowUser++;
				} else if (notif.attributes.type === 3 || notif.attributes.type === 4) {
					numOfLike++;
				} else if (notif.attributes.type === 5 || notif.attributes.type === 6) {
					numOfFollowArtist++;
				}
			});
			this.$el.find('#numOfLike').text('(' + numOfLike + ')');
			this.$el.find('#numOfFollowUser').text('(' + numOfFollowUser + ')');
			this.$el.find('#numOfFollowArtist').text('(' + numOfFollowArtist + ')');
		},



		/**
			お知らせを全件表示
		*/
		showAllNotif: function () {
			this.$el.find('#timelineArea li').removeClass('hidden');
		},


		/**
			いいね系お知らせ表示
		*/
		showLikeNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="3"],[data-notif-type="4"]').removeClass('hidden');
		},


		/**
			フォローユーザー系お知らせ表示
		*/
		showFollowUserNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="1"],[data-notif-type="2"]').removeClass('hidden');
		},


		/**
			フォローアーティスト系お知らせ表示
		*/
		showFollowArtistNotif: function () {
			this.$el.find('#timelineArea li').addClass('hidden');
			this.$el.find('#timelineArea').find('[data-notif-type="5"],[data-notif-type="6"]').removeClass('hidden');
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


























