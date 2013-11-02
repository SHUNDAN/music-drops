"use strict";
/*
 *  Application View
 */
define([
    'views/common/header',
    'views/common/music_player',
    'views/top',
    'views/pop/index',
    'views/pop/list',
    'views/music/index',
    'views/music/search',
    'views/login',
    'views/mypage',
    'views/user/index',
    'views/user/regist',
    'views/user/timeline',
    'views/user/setting',
    'views/artist/index',
    'views/notes/rules',
    'views/notes/privacy',
    'views/notes/recommended',
    'views/notes/about',
    'views/common/footer',
    'models/common/user_storage',
], function (
    HeaderView,
    MusicPlayerView,
    TopView,
    PopView,
    PopListView,
    MusicView,
    MusicSearchView,
    LoginView,
    MypageView,
    UserView,
    UserRegistView,
    TimelineView,
    UserSettingView,
    ArtistView,
    RulesView,
    PrivacyView,
    RecommendedView,
    AboutView,
    FooterView,
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

            // Add Footer
            this.footerView = new FooterView();
            this.footerView.show();

            // Music Player.
            // 各ページから使いたいので、グローバル変数へ代入する。
            this.musicPlayer = new MusicPlayerView();
            mb.musicPlayer = this.musicPlayer;

            // ログイン処理のバインド
            this.$el.on('click', '[data-event-click="login"]', _.bind(this.authErrorHandler, this));

        },

        events: {
            'authError': 'authErrorHandler',
        },

        authErrorHandler: function () {
            console.debug('authErrorHandler.');

            // ダイアログがあれば消す
            $('[data-type="popup"]').remove();

            var loginView = new LoginView();
            this.$mainArea.append(loginView.$el);
            loginView.show('modal', function () {
                loginView.$el.transition({opacity:0}, 200, function () {
                    loginView.$el.remove();
                });
            });
        },


        toTop: function () {
            this._prepareStage(TopView, function () {
                $('#pageTitle').text('Top');
                this.currentPageView.show();
            });
        },

        toPopList: function (feelingId) {
            this._prepareStage(PopListView, function () {
                $('#pageTitle').text('Drop List');
                this.currentPageView.show(feelingId);
            });
        },

        toMusicDetail: function (musicId) {
            this._prepareStage(MusicView, function () {
                $('#pageTitle').text('Music');
                this.currentPageView.show(musicId);
            });
        },

        toMusicSearch: function () {
            this._prepareStage(MusicSearchView, function () {
                $('#pageTitle').text('Music Search');
                this.currentPageView.show();
            });
        },

        toAddPop: function (musicId) {
            this._prepareStage(PopView, function () {
                $('#pageTitle').text('Add Drop');
                this.currentPageView.show(musicId);
            });
        },

        toLogin: function () {
            this._prepareStage(LoginView, function () {
                $('#pageTitle').text('Login');
                this.currentPageView.show();
            });
        },

        toMypage: function () {
            this._prepareStage(MypageView, function () {
                 $('#pageTitle').text('My List');
               this.currentPageView.show();
            });
        },

        toUserPage: function (userId) {
            this._prepareStage(UserView, function () {
                $('#pageTitle').text('User List');
                this.currentPageView.show(userId);
            });
        },

        toRegistUserPage: function () {
            this._prepareStage(UserRegistView, function () {
                $('#pageTitle').text('Regist');
                this.currentPageView.show();
            });
        },

        toTimeline: function () {
            this._prepareStage(TimelineView, function () {
                $('#pageTitle').text('Timeline');
                this.currentPageView.show();
            });
        },

        toUserSetting: function () {
            this._prepareStage(UserSettingView, function () {
                $('#pageTitle').text('Setting');
                this.currentPageView.show();
            });
        },

        toArtist: function (artistId) {
            this._prepareStage(ArtistView, function () {
                 $('#pageTitle').text('Artist Page');
               this.currentPageView.show(artistId);
            });
        },

        toRules: function () {
            this._prepareStage(RulesView, function () {
                $('#pageTitle').text('Rules');
                this.currentPageView.show();
            });
        },

        toPrivacy: function () {
            this._prepareStage(PrivacyView, function () {
                $('#pageTitle').text('Privacy Policy');
                this.currentPageView.show();
            });
        },

        toRecommended: function () {
            this._prepareStage(RecommendedView, function () {
                $('#pageTitle').text('Recommended');
                this.currentPageView.show();
            });
        },

        toAbout: function () {
            this._prepareStage(AboutView, function () {
                $('#pageTitle').text('About');
                this.currentPageView.show();
            });
        },

        _prepareStage: function (ViewClass, callback) {

            // ヘッダーのプレイリスト表示があれば、非表示にする
            $('#playlistPopup').addClass('hidden');

            // setting
            callback = _.bind(callback, this);

            // 表示中のお掃除
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



            // もしローカルキャッシュが無い場合には、キャッシュを取得してから表示を行う
            var showPage = function () {
                self.currentPageView = new ViewClass();
                self.currentPageView.$el.css('opacity', 0);
                self.$mainArea.append(self.currentPageView.$el);
                $('body').transition({opacity: 1, delay: delay});
                self.currentPageView.$el.transition({opacity: 1, delay: delay});
            };
            if (!this.userStorage.getCommon()) {
                this.userStorage.loadCommonInfo({callback: function () {
                    showPage();
                    callback();
                }});
            } else {
                showPage();
                callback();
            }


            // ユーザー情報が無い場合に、認証情報があれば、ユーザー情報を取得しておく。
            if (!this.userStorage.getUser()) {
                if ($.cookie('uid')) {

                    $.ajax({
                        url: '/api/v1/userInfo',
                        dataType: 'json',
                        success: function (user) {
                            self.userStorage.setUser(user);

                            // ユーザーにひもづく各種情報も取得しておく
                            _.loadUserPockets({force:true});
                            _.loadUserArtistFollow({force:true});
                        },
                        error: function () {
                            // console.debug('/api/v1/userinfo error: ', arguments);
                        },
                    });

                }
            } else {

                // ユーザーにひもづく各種情報も取得しておく
                _.loadUserPockets();
                _.loadUserArtistFollow();

            }


            // ログイン状況に合わせて、左上のモジュールを切り替える
            if (_.isLogedIn()) {
                $('#appLoginModule').addClass('hidden');
                $('#gotoUserSetting').removeClass('hidden');

                var user = _.mbStorage.getUser();
                $('#gotoUserSetting').html('<i class="ico-font ico-user mr5"></i>' + user.name);

            } else {
                $('#appLoginModule').removeClass('hidden').text('ログイン');
                $('#gotoUserSetting').addClass('hidden');
            }




        },

    });

    return ApplicationView;
});




























