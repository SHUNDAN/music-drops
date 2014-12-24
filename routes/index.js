"use strict";

/*
 * GET home page.
 */
var fs = require('fs');
var uuid = require('node-uuid');
var glob = require('glob');
var userModel = require('../models/user');
var feelingModel = require('../models/feeling');
var codeModel = require('../models/code');
var appUtil = require('../util/utility.js');
var onlineBatch = require('../util/online_batch');


exports.index = function(req, res){


    // 開発では毎回Templateをロードするようにする。
    var fn;
    if (global.mbSetting.env !== 'production') {
        console.log('load every module for development');
        fn = onlineBatch.refreshMemCache;
    } else {
        fn = function (callback) {callback()};
    }


    fn(function () {



        // 必要情報を取得する
        console.log('aaaaaaaaa');
        var template = global.mb.htmlTemplate;
        var common = {feelings: global.mb.feelings};


        // ユーザー情報あれば取得して表示する
        var userId = appUtil.getUserIdFromUid(req);
        if (userId) {
            userModel.selectObject2({id:userId}, function (user) {

                // response.
                res.render('index', {
                    title: 'Express',
                    htmltemplate: template,
                    mainJs: global.mbSetting.mainJs,
                    common: JSON.stringify(common),
                    user: JSON.stringify(user),
                    appVersion: global.mb.appVersion
                });

            });

        } else {
            res.render('index', {
                title: 'Express',
                htmltemplate: template,
                mainJs: global.mbSetting.mainJs,
                common: JSON.stringify(common),
                user: null,
                appVersion: global.mb.appVersion
            });
        }












    }); // end fn.








};



/**
 * Login
 */
exports.login = function (req, res) {

    var userId = req.body.user_id;
    var password = req.body.password;
    console.log('login request', userId, password);


    // 検索する
    userModel.selectObjects(req.body, function (err,rows) {
        if (err || rows.length === 0) {
            appUtil.actionLog(req, 'login error');
            res.json(403, {message: 'login error'});
        } else {

            appUtil.actionLog(req, ['login successed', JSON.stringify({id: rows[0].id})]);


            // 既に存在するCookieがあればそれを使う。
            var user = rows[0];
            var uid;
            for (var prop in global.sessionMap) {
                if (global.sessionMap.hasOwnProperty(prop)) {
                    if (user.id === global.sessionMap[prop]) {
                        uid = prop;
                        break;
                    }
                }
            }

            if (!uid) {
                uid = uuid.v4();
                while (global.sessionMap[uid]) {
                    uid = uuid.v4();
                }
                global.sessionMap[uid] = user.id;

                // DBに保存しておく。次回起動時に利用したいため。
                userModel.updateObject({uid:uid}, {id:user.id}, function () {});
            }

            console.log('sessionMap: ', global.sessionMap);

            // Request HeaderでUIDを返す
            var userInfo = rows[0];
            delete userInfo.password;


            // Cookieの設定
            res.cookie('uid', uid, {maxAge:30*24*60*60, httpOnly:false});



            userModel.selectObject2({id:userInfo.id}, function (user) {
                res.json({user:user, isNew:false});
            });
        }
    });

};


/**
 * 基本情報を返却する
 */
exports.common = function (req, res) {

    res.json({feelings: global.mb.feelings});
    // loadCommonInfo(function (common) {
    //     res.json(common);
    // });

};



/**
 *  非同期ログ
 */
exports.log = function (req, res) {





    res.json({});

};





// プライベートメソッド
var loadCommonInfo = function (callback) {

    var common = {};

    // サーバー時間
    common.currentTime = new Date().getTime();

    // 感情一覧
    feelingModel.selectObjects({}, function (err, rows) {
        common.feelings = rows;

        // コード一覧
        // codeModel.selectObjects({}, function (err, rows) {
        //     common.codes = rows;

            if (callback) {
                callback(common);
            }

        // });
    });

};






/**
    メモリ上にキャッシュしている内容を更新する
*/
exports.clearMemCache = function (req, res) {

    onlineBatch.refreshMemCache(function () {
        res.json({});

        // セッション情報も表示しておく
        console.log('sessionMap: ', global.sessionMap);

    });

};


































