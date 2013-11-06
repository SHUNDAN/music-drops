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
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'add pocket failed. no authentication.');
        res.json(403, {message: 'authentication error.'});
        return;
    }

    req.body.user_id = user_id;
    console.log('req.body', req.body);



    // 上限確認を行います
    userPlaylistModel.countObjects({user_id:user_id, type: req.body.type}, function (err, cnt) {

        console.log('playlist cnt =', cnt);

        // 上限は7
        if (cnt >= 7) {
            res.json(400, 'playlist max count proceeded. max=7, current=' + cnt + ', willAdd=1');
            return;
        }


        // 登録
        userPlaylistModel.insertObject(req.body, function (err) {
            appUtil.basicResponse(res, err);
        });


    });







};



/**
 *  Update
 */
exports.update = function(req, res) {


    // login check.
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'delete pocket failed. no authentication');
        appUtil.response403(res);
        return;
    }

    // 自分のもの以外は削除不可にする
    req.params.user_id = user_id;

    if (req.body.user_pocket_ids) {
        var ids = JSON.parse(req.body.user_pocket_ids);
        console.log('pocket_ids.length = ', ids.length);
        if (ids.length > 30) {
            res.json(400, 'user_playlist_ids must be within 30. actual=', ids.length);
            return;
        }
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


    var condition = {};


    // idの場合
    if (req.params.id || req.body.id) {
        condition.id = req.params.id || req.body.id;
    }

    // 条件の場合
    if (req.body.dest_playlist_id) {
        condition.dest_playlist_id = req.body.dest_playlist_id;
    }


    // パラメータチェック
    if (!condition.id && !condition.dest_playlist_id) {
        res.json(400, 'id or dest_playlist_id must be set.');
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
    condition.user_id = user_id;
    console.log('condition: ', condition);

    userPlaylistModel.deleteObject(condition, function (err) {
        appUtil.basicResponse(res, err);
    });

};



















