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

            // auto event bind.
            _.bindEvents(this);


            this.model = new UserModel();
            _.bindAll(this, 'render', 'renderForMordal', 'show', 'login', 'dealloc');
        },
        events: {
            'click #loginBtn': 'login',
        },
        template: $('#page_login').html(),

        render: function () {

            var ruleHtml = _.mbTemplate('#page_rules');
            var html = _.template(this.template, {ruleHtml: ruleHtml});
            this.$el.html(html);

            // var userInfo = this.userStorage.getUser();
            // if (userInfo) {
            //     $('#userId').text(userInfo.user_id);
            // }

            // $('#userId').focus();
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
                'z-index': 100,
            }).on('click', function (e) {
                console.log('remove modal dialog.', e);
                if (e.target.id !== 'clickArea') {
                    // return false;
                    return;
                }
                self.$el.remove();
                return;
            });
            this.$el.html($clickArea);

            var $blackout = $('<div/>');
            $blackout.css({
                width: '520px',
                'margin-left': '-260px',
                padding: '20px 0',
                'background-color': 'rgba(255,255,255, 1.0)',
                position: 'fixed',
                top: '16%',
                left: '50%',
                'border-radius': '4px',
                'box-shadow': '0 0 16px rgba(0,0,0,0.4)'
            });
            $clickArea.html($blackout);

            var ruleHtml = $('#page_rules').html();
            var snipet = _.template(this.template, {ruleHtml: ruleHtml});
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
                success: function (info) {
                      alert('login successed');

                      // Storage保存
                      _.mbStorage.setUser(info.user);

                      if (self.successCallback) {
                        self.successCallback();
                      } else {
                        if (info.isNew) {
                            mb.router.navigate('#', true);
                        } else {
                            mb.router.navigate('#mypage', true);

                        }
                      }
                },
                 error: function () {
                     console.log('login error', arguments);
                     alert('login error');
                 },
            });

            return false;
        },



        /**
            利用規約ページへ
        */
        gotoRulePage: function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.$el.remove();
            mb.router.navigate('rules', true);
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
