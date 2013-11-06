"use strict";
/*
 * User.
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var userModel = require('../models/user');
var userFollowModel = require('../models/user_follow');

/**
 * Select
 */
exports.select = function(req, res){

    userModel.selectObjects(req.params, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};


/**
 * SelectObject
 */
exports.selectObject = function(req, res){

    userModel.selectObjects(req.params, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
            return;
        }

        var result = (rows.length > 0 ? rows[0] : {});

        // 検索結果が無い場合には、そのまま返す
        if (rows.length === 0) {
            res.json(result);
            return;
        }


        // ログインユーザーを特定する。
        var userId = '-';
        var uid = req.cookies.uid;
        if (uid) {
            if (!global.sessionMap) {
                global.sessionMap = {};
            }
            var anUserId = global.sessionMap[uid];
            if (anUserId) {
                userId = anUserId;
            }
        }

        // もしログインしていない場合には、フォロー可能ユーザーとして返す。
        if (!userId) {
            result.followed = false;
            res.json(result);
            return;
        }

        // 対象ユーザーをフォローしているか確認する
        userFollowModel.selectObjects({user_id: userId, dest_user_id: result.id}, function (err, rows) {

            // フォロー結果が無い場合には、フォロー可能とする。
            if (rows.length === 0) {
                result.followed = false;
                res.json(result);
                return;
            }

            // フォロー済み
            result.followed = true;
            result.user_follow_id = rows[0].id;
            res.json(result);
        });

    });

};

/**
 * Get User Info from UID.
 */
exports.userinfo = function (req, res) {

    // uidからユーザー情報を取得する
    var uid = req.cookies.uid;
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        res.json({});
        return;
    }

    userModel.selectObject2({id:user_id}, function (user) {
        res.json(user || {});
    });

};






/**
 *  Add
 */
// 現在はサポートしていない
// exports.add = function(req, res) {

//     // TODO check params.

//     // execute.
//     userModel.insertObject(req.body, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



/**
 *  Update
 */
exports.update = function(req, res) {

    // いまのところは名前変更だけ受付可能
    var name = req.body.name;
    if (!name || name.length === 0) {
        res.json(400, 'name must be set.');
        return;
    } else if (name.length > 16) {
        res.json(400, 'name max length 16. actual=' + name.length);
        return;
    }


    // param
    var param = {
        name: name
    };


    // execute
    userModel.updateObject(param, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    userModel.deleteObject(req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};



















