"use strict";
/*
 * Router: User Notification
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var userNotificationModel = require('../models/user_notification');
var appUtil = require('../util/utility');

/**
 * Select 
 */
exports.select = function(req, res){

    userNotificationModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {

            // 文字列からオブジェクトへ変換する
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                row.json = JSON.parse(row.json);
            }



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
        res.json(400, {message: 'music_id is required.'});
        return;
    }   

    // uidからユーザー情報を取得する
    var uid = req.cookies.uid;
    var user_id = (global.sessionMap ? global.sessionMap[uid] : undefined);
    if (!user_id) {
        res.json(403, {message: 'authentication error.'});
        return;
    }   

    req.body.user_id = user_id; 
    console.log('req.body', req.body);

    // execute.
    userNotificationModel.insertObject(req.body, function (err) {
        appUtil.basicResponse(res, err);
    });

};



/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO check params.


    // execute
    userNotificationModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    
    // パラメータチェック
    if (!req.params.id && !req.body.id) {
        appUtil.actionLog(req, 'delete user notification failed. id is missing');
        res.json(400, {message: 'id is required.'});
        return;
    }


    // 認証チェック＆ユーザーID取得
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'delete user notification failed. no authentication');
        appUtil.response403(res);
        return;
    } 

    // 自分の以外は消せないようにする。
    var param = (req.params.id ? req.params : req.body);
    param.user_id = user_id;
    console.log('param: ', param);

    userNotificationModel.deleteObject(param, function (err) {
        appUtil.actionLog(req, ['delete user notification', JSON.stringify({id: param.id})]);
        appUtil.basicResponse(res, err);
    });

};



















