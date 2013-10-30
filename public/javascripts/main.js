"use strict";
/*
 *  Main.js
 */

// namespace
window.mb = window.mb || {};


// require config.
require.config({
    baseUrl: '/javascripts'
});


// start point.
require([
    'views/app',
], function (
   AppView
) {


    // Router
    var AppRouter = Backbone.Router.extend({

        initialize: function () {
            this.appView = new AppView();
        },

        routes: {
            '': 'top',
            'top': 'top',
            'poplist/:feeling_id':  'poplist',
            'music/detail/:id': 'musicDetail',  // duplicate, instad to "music/:id"
            'music/search': 'musicSearch',
            'music/:id': 'musicDetail',
            'music/:id/pop/add': 'addPop',
            'music/:id/pop/edit/:pop_id': 'editPop',
            'login': 'login',
            'mypage': 'mypage',
            'user/new': 'registUser',
            'user/:id': 'userPage',
            'artist/:id': 'artist',
            'timeline': 'timeline',
            'usersetting': 'usersetting',
            'rules': 'rules',
            '*path': 'defaultRoute'
        },

        top: function () {
            this.sendAction('/#');
            this.appView.toTop();
            _gaq.push(['_trackPageview', '/']);
        },

        poplist: function (feelingId) {
            this.sendAction('/#poplist/' + feelingId);
            this.appView.toPopList(feelingId);
            _gaq.push(['_trackPageview', '/#poplist/' + feelingId]);
        },

        musicDetail: function (musicId) {
            this.sendAction('/#music/' + musicId);
            this.appView.toMusicDetail(musicId);
            _gaq.push(['_trackPageview', '/#music/' + musicId]);
        },

        defaultRoute: function () {
            this.top();
            _gaq.push(['_trackPageview', '/']);
        },

        musicSearch: function () {
            this.sendAction('/#music/search');
            this.appView.toMusicSearch();
            _gaq.push(['_trackPageview', '/#music/search']);
        },

        addPop: function (musicId) {
            this.sendAction('/#music/' + musicId + '/pop/add');
            this.appView.toAddPop(musicId);
            _gaq.push(['_trackPageview', '/#music/' + musicId + '/pop/add']);
        },

        login: function () {
            this.sendAction('/#login');
            this.appView.toLogin();
            _gaq.push(['_trackPageview', '/#login']);
        },

        mypage: function () {
            this.sendAction('/#mypage');
            this.appView.toMypage();
            _gaq.push(['_trackPageview', '/#mypage']);
        },

        userPage: function (userId) {

            // もし自分のIDの場合は、マイページを表示する
            var user = _.mbStorage.getUser();
            if (user && user.id === parseInt(userId, 10)) {
                mb.router.navigate('#mypage', true);
                return;
            }

            this.sendAction('/#user/' + userId);
            this.appView.toUserPage(userId);
            _gaq.push(['_trackPageview', '/#user/' + userId]);
        },

        registUser: function () {
            this.sendAction('/#user/new');
            this.appView.toRegistUserPage();
            _gaq.push(['_trackPageview', '/#user/new']);
        },

        artist: function (artistId) {
            this.sendAction('/#artist/' + artistId);
            this.appView.toArtist(artistId);
            _gaq.push(['_trackPageview', '/#artist/' + artistId]);
        },

        timeline: function () {
            this.sendAction('/#timeline');
            this.appView.toTimeline();
            _gaq.push(['_trackPageview', '/#timeline']);
        },

        usersetting: function () {
            this.sendAction('/#usersetting');
            this.appView.toUserSetting();
            _gaq.push(['_trackPageview', '/#usersetting']);
        },

        rules: function () {
            this.sendAction('/#rules');
            this.appView.toRules();
            _gaq.push(['_trackPageview', '/#rules']);
        },

    
        // ページ遷移を通知
        sendAction: function (anUrl) {
            console.log('route: ', anUrl);
            _.sendActionLog(anUrl);
        },


    });




    $(function () {
        mb.router = new AppRouter();
        Backbone.history.start();
    });




});
