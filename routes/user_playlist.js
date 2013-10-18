"use strict";
/*
 * User.
 */
var util = require('util');
var appUtil = require('../util/utility');
var userPlaylistModel = require('../models/user_playlist');

/**
 * Select
 */
exports.select = function(req, res){

    userPlaylistModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });
};


/**
 * フォローしている他人のプレイリスト取得
 */
exports.selectFollowPlaylists = function (req, res) {

    // check params.
    if (!req.query.user_id) {
        res.json(400, 'user_id must be set');
        return;
    }

    // select db.
    userPlaylistModel.selectFollowPlaylists(req.query, function (err, rows) {
        res.json(rows);
    });

};













/**
 *  Add
 */
exports.add = function(req, res) {

    // check params.
    if (!req.body.title) {
        res.json(400, 'title must be set.');
        return;
    }

    // defaults設定
    req.body.user_pocket_ids = req.body.user_pocket_ids || '[]';
    if (!req.body.type) {
        req.body.type = 2; // user custom playlist.
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
    userPlaylistModel.insertObject(req.body, function (err) {
        appUtil.basicResponse(res, err);
    });

};



/**
 *  Update
 */
exports.update = function(req, res) {


    // login check.
    if (!appUtil.isLogedIn(req)) {
        appUtil.response403(res);
        return;
    }


    // execute
    userPlaylistModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {


    // パラメータチェック
    if (!req.params.id && !req.body.id) {
        res.json(400, 'id must be identified.');
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

    userPlaylistModel.deleteObject(param, function (err) {
        appUtil.basicResponse(res, err);
    });

};



















