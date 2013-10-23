/**
	ユーザー設定画面
*/
define([
    'views/common/confirmDialog',
	'models/user/user',
], function (
	ConfirmDialogView,
	UserModel
) {

	var UserSettingView = Backbone.View.extend({

		initialize: function () {

            // auto event bind.
            _.bindEvents(this);


		},

		render: function () {
			var snipet = _.mbTemplate('page_user_setting', {user: _.mbStorage.getUser()});
			this.$el.html(snipet);
		},


		/**
			名前変更処理
		*/
		changeName: function () {
			console.debug('changeName');

			var newName = _.trim($('#userNameInput').val());
			if (!newName || newName.length === 0) {
				alert('名前が未入力です。');
				return;
			}

			// 更新
			var user = new UserModel();
			user.set('id', _.mbStorage.getUser().id);
			user.set('name', newName);
			user.bind('sync', function () {
				alert('ユーザー名変更が完了しました');
				location.reload();
			});
			user.save();

		},



		/**
			ログアウト
		*/
		logout: function () {

            // 確認ダイアログ
            var confirmDialog = new ConfirmDialogView();
            confirmDialog.show({
                message: '本当にログアウトしてもよろしいですか？',
                yesButtonCallback: function () {

                	_.mbStorage.removeUser();
                	$.removeCookie('uid', null);
                	alert('ログアウトしました。');
                	location.href = '#';
                }
            });



		},








		show: function () {
			console.debug('usersetting show');


			// もしもログインしていない場合には、TOPへ
			if (!_.isLogedIn()) {
				mb.router.navigate('#', true);
				return;
			}


			this.render();
		},

		dealloc: function () {

		},

	});

	return UserSettingView;

});