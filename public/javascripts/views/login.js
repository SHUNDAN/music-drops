"use strict";
/**
 * View: Login
 */
define([
    'models/user/user',
    'models/common/user_storage',
], function (
    UserModel,
    UserStorage
) {

    var LoginView = Backbone.View.extend({

        // Fields.
        type: null,
        successCallback: null,
        userStorage: new UserStorage(),



        initialize: function () {
            this.model = new UserModel();
            _.bindAll(this, 'render', 'renderForMordal', 'show', 'login', 'dealloc');
        },
        events: {
            'click #loginBtn': 'login',
        },
        template: $('#page_login').html(),

        render: function () {
            var html = _.template(this.template, {color: undefined});
            this.$el.html(html);

            var userInfo = this.userStorage.getUser();
            if (userInfo) {
                $('#userId').text(userInfo.user_id);
            }

            $('#userId').focus();
        },

        renderForMordal: function () {

            var self = this;

            var $clickArea = $('<div id="clickArea"/>');
            $clickArea.css({
                width: '100%',
                height: '100%',
                position: 'fixed',
                top: 0,
                left: 0,
                'background-color': 'rgba(255,255,255,.2)',
            }).on('click', function (e) {
                console.log('remove modal dialog.', e);
                if (e.target.id !== 'clickArea') {
                    return false;
                }
                self.$el.remove();
                return;
            });
            this.$el.html($clickArea);

            var $blackout = $('<div/>');
            $blackout.css({
                width: '80%',
                padding: '20px 0',
                'background-color': 'rgba(0,0,0,.85)',
                position: 'fixed',
                top: '25%',
                left: '10%',
            });
            $clickArea.html($blackout);

            var snipet = _.template(this.template, {color: 'white'});
            $blackout.html(snipet);


            var userInfo = this.userStorage.getUser();
            if (userInfo) {
                $('#userId').val(userInfo.user_id);
                $('#password').focus();
            } else {
                $('#userId').focus();
            }


            $('#loginBtn').off().on('click', _.bind(this.login, this));

        },




        login: function () {
            console.log('login btn');
            var userId = $('#userId').val();
            var password = $('#password').val();
            this.model.set('user_id', userId);
            this.model.set('password', password);

            // TODO make HTTPS
            var self = this;
            $.ajax({
                url: '/api/v1/login',
                method: 'post',
                data: {user_id: userId, password: password},
                success: function (json) {
                      alert('login successed');

                      // TODO とりあえずの実装なので直す
                      localStorage.setItem('user', JSON.stringify(json.info));

                      if (self.successCallback) {
                        self.successCallback();
                      } else {
                        mb.router.navigate('#', true);
                      }
                },
                 error: function () {
                     console.log('login error', arguments);
                     alert('login error');
                 },
            });

            return false;
        },


        show: function (type, successCallback) {
            this.type = type;
            this.successCallback = successCallback;
            if (type === 'modal') {
                this.renderForMordal();
            } else {
                this.render();
            }
        },
        dealloc: function () {},

    });

    return LoginView;
});
