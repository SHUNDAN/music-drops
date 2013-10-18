"use strict";
/*
 * Router: User Follow
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var userFollowModel = require('../models/user_follow');
var appUtil = require('../util/utility');

/**
 * Select 
 */
exports.select = function(req, res){

    console.log('select user_follow: ', req);

    userFollowModel.selectObjects2(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
            return;
        }


        res.json(rows);
    });

};





/**
 *  Add
 */
exports.add = function(req, res) {

    // check params.
    if (!req.body.dest_user_id) {
        appUtil.actionLog(req, 'user follow failed. dest_user_id is missing');
        res.json(400, {message: 'dest_user_id is required.'});
        return;
    }   

    // uidからユーザー情報を取得する
    var uid = req.cookies.uid;
    var user_id = (global.sessionMap ? global.sessionMap[uid] : undefined);
    if (!user_id) {
        appUtil.actionLog(req, 'user follow failed. no authentication');
        res.json(403, {message: 'authentication error.'});
        return;
    }   

    req.body.user_id = user_id; 
    console.log('req.body', req.body);


    // 既に存在する場合は、エラーにする
    userFollowModel.selectObjects({user_id:user_id, dest_user_id:req.body.dest_user_id}, function (err, rows) {

        if (rows.length !== 0) {
            appUtil.actionLog(req, ['user follow failed. already followed', JSON.stringify({dest_user_id: req.body.dest_user_id})]);
            res.json(400, {message: 'already followed'});
            return;
        }

        // execute.
        userFollowModel.insertObject(req.body, function (err) {
            appUtil.actionLog(req, ['user follow', JSON.stringify({dest_user_id: req.body.dest_user_id})]);
            appUtil.basicResponse(res, err);
        });

    });

};



/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO check params.


    // execute
    userFollowModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    
    // パラメータチェック
    if (!req.params.id && !req.body.id) {
        appUtil.actionLog(req, 'unfollow user failed. id is missing');
        res.json(400, {message: 'id is required.'});
        return;
    }


    // 認証チェック＆ユーザーID取得
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'unfollow user failed. no authentication');
        appUtil.response403(res);
        return;
    } 

    // 自分の以外は消せないようにする。
    var param = (req.params.id ? req.params : req.body);
    param.user_id = user_id;
    console.log('param: ', param);

    userFollowModel.deleteObject(param, function (err) {
        appUtil.actionLog(req, ['unfollow user', JSON.stringify({id: param.id})]);
        appUtil.basicResponse(res, err);
    });

};



















