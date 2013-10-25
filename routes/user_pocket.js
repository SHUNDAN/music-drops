"use strict";
/*
 * User.
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var userPocketModel = require('../models/user_pocket');
var userFollowModel = require('../models/user_follow');
var userNotificationModel = require('../models/user_notification');
var musicModel = require('../models/music');
var userModel = require('../models/user');
var onlineBatch = require('../util/online_batch');
var appUtil = require('../util/utility');
var onlineBatch = require('../util/online_batch');

/**
 * Select
 */
exports.select = function(req, res){

    userPocketModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};


/**
 * Select (User_Pocket + Music)
 */
exports.selectWithMusicInfo = function (req, res) {

    userPocketModel.selectObjectsIncludeMusic(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {

            // バージョンチェック追加して返却
            res.setHeader('appVersion', global.mb.appVersion);
            res.json(rows);
        }
    });
};





/**
 *  Add
 */
exports.add = function(req, res) {

    // check params.
    if (!req.body.music_id) {
        appUtil.actionLog(req, 'add pocket failed. music_is is missing.');
        res.json(400, {message: 'music_id is required.'});
        return;
    }

    // uidからユーザー情報を取得する
    var uid = req.cookies.uid;
    var user_id = (global.sessionMap ? global.sessionMap[uid] : undefined);
    if (!user_id) {
        appUtil.actionLog(req, 'add pocket failed. no authentication.');
        res.json(403, {message: 'authentication error.'});
        return;
    }

    req.body.user_id = user_id;
    console.log('req.body', req.body);


    // execute.
    userPocketModel.insertObject(req.body, function (err) {
        appUtil.actionLog(req, ['add pocket.', JSON.stringify({music_id: req.body.music_id, feeling_id: req.body.feeling_id, youtube_id: req.body.youtube_id})]);

        // バージョンチェック追加して返却
        res.setHeader('appVersion', global.mb.appVersion);

        appUtil.basicResponse(res, err);
    });


    // ユーザーのプレイリスト更新
    onlineBatch.refreshUserPlaylistByAddingPocket(user_id, req.body.music_id);




    // フォローユーザーへお知らせを追加する。
    onlineBatch.addUserNotificationWhenFollowUserAddPocket(user_id, req.body.music_id);

};



/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO check params.


    // execute
    userPocketModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {


    // パラメータチェック
    if (!req.params.id && !req.body.id) {
        appUtil.actionLog(req, 'delete pocket failed. id is missing');
        res.json(400, {message: 'id is required.'});
        return;
    }


    // 認証チェック＆ユーザーID取得
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'delete pocket failed. no authentication');
        appUtil.response403(res);
        return;
    }

    // 自分の以外は消せないようにする。
    var param = (req.params.id ? req.params : req.body);
    param.user_id = user_id;
    console.log('param: ', param);

    userPocketModel.deleteObject(param, function (err) {
        appUtil.actionLog(req, ['delete pocket', JSON.stringify({id: param.id})]);

        // バージョンチェック追加して返却
        res.setHeader('appVersion', global.mb.appVersion);

        appUtil.basicResponse(res, err);


        // プレイリストを更新する
        onlineBatch.refreshUserPlaylistByDeletingPocket(user_id, req.params.id);

    });

};



















