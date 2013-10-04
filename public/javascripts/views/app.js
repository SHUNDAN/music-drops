"use strict";
/*
 *  Application View 
 */
define([
    'views/common/header',
    'views/top',
    'views/pop/index',
    'views/pop/list',
    'views/music/index',
    'views/music/search',
    'views/login',
    'views/mypage',
    'views/user/index',
    'views/user/regist',
    'views/artist/index',
    'models/common/user_storage',
], function (
    HeaderView,
    TopView,
    PopView,
    PopListView,
    MusicView,
    MusicSearchView,
    LoginView,
    MypageView,
    UserView,
    UserRegistView,
    ArtistView,
    UserStorage
) {

    // AppView
    var ApplicationView = Backbone.View.extend({
   
        // Field 
        currentPageView: null,
        userStorage: new UserStorage(),
        $mainArea: null,

        initialize: function() {
            this.$el = $('#stage');
            this.$mainArea = $('#main');
            mb.$playArea = $('#playArea');
            _.bindAll(this, 'authErrorHandler');



            // Add Header
            this.headerView = new HeaderView();
            this.headerView.show(); 


        },

        events: {
            'authError': 'authErrorHandler',
        },

        authErrorHandler: function () {
            var loginView = new LoginView();
            this.$mainArea.append(loginView.$el);
            loginView.show('modal', function () {
                loginView.$el.transition({opacity:0}, 200, function () {
                    loginView.$el.remove();
                });
            });
        },


        toTop: function () {
            this._prepareStage(TopView);
            this.currentPageView.show();
        },

        toPopList: function (feelingId) {
            this._prepareStage(PopListView);
            this.currentPageView.show(feelingId);
        },

        toMusicDetail: function (musicId) {
            this._prepareStage(MusicView);
            this.currentPageView.show(musicId);
        },

        toMusicSearch: function () {
            this._prepareStage(MusicSearchView);
            this.currentPageView.show();
        },

        toAddPop: function (musicId) {
            console.log('toAddPop');
            this._prepareStage(PopView);
            this.currentPageView.show(musicId);
        },

        toLogin: function () {
            console.log('toLogin');
            this._prepareStage(LoginView);
            this.currentPageView.show();
        },

        toMypage: function () {
            console.log('toMypage');
            this._prepareStage(MypageView);
            this.currentPageView.show();
        },

        toUserPage: function (userId) {
            this._prepareStage(UserView);
            this.currentPageView.show(userId);
        },

        toRegistUserPage: function () {
            this._prepareStage(UserRegistView);
            this.currentPageView.show();
        },

        toArtist: function (artistId) {
            this._prepareStage(ArtistView);
            this.currentPageView.show(artistId);
        },

        _prepareStage: function (ViewClass) {

            var old$el = (this.currentPageView ? this.currentPageView.$el : $('#dummy'));
            if (this.currentPageView) {
                this.currentPageView.dealloc();
                this.currentPageView = null;
            }


            // 今のページはfadeoutをする
            var duration = 200;
            var delay = 300;
            var self = this;
            $('body').transition({opacity: 0}, duration, function() {
                old$el.remove(); 
                window.scrollTo(0,0);
            });

            // 次のページを表示する
            self.currentPageView = new ViewClass();
            self.currentPageView.$el.css('opacity', 0);
            self.$mainArea.append(self.currentPageView.$el);
            $('body').transition({opacity: 1, delay: delay});
            self.currentPageView.$el.transition({opacity: 1, delay: delay});

            // アプリ共通情報を取得する
            this.userStorage.loadCommonInfo();


            // ユーザー情報が無い場合に、認証情報があれば、ユーザー情報を取得しておく。
            if (!this.userStorage.getUser()) {
                if ($.cookie('uid')) {

                    $.ajax({
                        url: '/api/v1/userInfo',
                        dataType: 'json',
                        success: function (user) {
                            self.userStorage.setUser(user); 

                            // Pocket情報も取得しておく
                            _.loadUserPockets({force:true});
                        },
                        error: function () {
                            // console.debug('/api/v1/userinfo error: ', arguments);
                        },
                    });

                }
            } else {

                // UserPockets情報をロードしておく
                _.loadUserPockets();

            }




        },
    
    });

    return ApplicationView;
});

