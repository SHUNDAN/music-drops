/**
	ユーザー設定画面
*/
define([], function () {

	var UserSettingView = Backbone.View.extend({

		initialize: function () {

		},

		render: function () {
			var snipet = _.mbTemplate('page_user_setting', {});
			this.$el.html(snipet);
		},

		show: function () {
			console.debug('usersetting show');
			this.render();
		},

		dealloc: function () {

		},

	});

	return UserSettingView;

});