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
            '*path': 'defaultRoute'
        },

        top: function () {
            this.sendAction('/#');
            this.appView.toTop();
        },

        poplist: function (feelingId) {
            this.sendAction('/#poplist/' + feelingId);
            this.appView.toPopList(feelingId);
        },

        musicDetail: function (musicId) {
            this.sendAction('/#music/' + musicId);
            this.appView.toMusicDetail(musicId);
        },

        defaultRoute: function () {
            this.top();
        },

        musicSearch: function () {
            this.sendAction('/#music/search');
            this.appView.toMusicSearch();
        },

        addPop: function (musicId) {
            this.sendAction('/#music/' + musicId + '/pop/add');
            this.appView.toAddPop(musicId);
        },

        login: function () {
            this.sendAction('/#login');
            this.appView.toLogin();
        },

        mypage: function () {
            this.sendAction('/#mypage');
            this.appView.toMypage();
        },

        userPage: function (userId) {
            this.sendAction('/#user/' + userId);
            this.appView.toUserPage(userId);
        },

        registUser: function () {
            this.sendAction('/#user/new');
            this.appView.toRegistUserPage();
        },

        artist: function (artistId) {
            this.sendAction('/#artist/' + artistId);
            this.appView.toArtist(artistId);
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
