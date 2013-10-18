"use strict";
/*
 * Pop.
 */
var util = require('util');
var _ = require('underscore');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var popModel = require('../models/pop');
var userModel = require('../models/user');
var onlineBatch = require('../util/online_batch');


/**
 * Select 
 */
exports.select = function(req, res){

    popModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};


/**
 *  Select：Popリスト
 */
exports.selectPopList = function(req, res) {

    // create condition.
    var condition = req.query;
    if (req.query.type === 'new') {
        condition.sortKey = 'create_at';
        condition.sortOrder = 'desc';
    } else if (req.query.type === 'popular') {
        condition.sortKey = 'like_count';
        condition.sortOrder = 'desc';
    } else if (req.query.type === 'hot') {
        condition.sortKey = 'like_count_speed';
        condition.sortOrder = 'desc';
    }
    if (req.query.user_id) {
        condition.user_id = req.query.user_id;
    }


    // select DB.
    popModel.selectPopsWithMusic(condition, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};




/**
 *  Add
 */
exports.add = function(req, res) {

    // TODO check params.
    if (!req.body.music_id || !req.body.feeling_id) {
        res.json(400, {message: 'music_id or feeling_id are required.'});
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

    // execute.
    popModel.insertObject(req.body, function (err) {
        appUtil.basicResponse(res, err);

        // 曲のFeelingを再計算する
        onlineBatch.setMusicFeeling(req.body.music_id);

    });

};


/**
 *  Add（マスタ用API）
 */
exports.add1_1 = function(req, res) {

    // TODO check params.

    // execute.
    popModel.insertObject(req.body, function (err) {
        appUtil.basicResponse(res, err);
    });

};


/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO check params.

    // execute.
    popModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);

        // 曲のFeelingを再計算する
        popModel.selectObjects(req.params, function (err, rows) {
            if (rows.length > 0) {
                onlineBatch.setMusicFeeling(rows[0].music_id);
            }
        });

    });

};



/**
 * Like Pop.
 */
exports.likePop = function (req, res) {

    // target.
    var popId = parseInt(req.params.id || req.body.id, 10);
    if (isNaN(popId)) {
        appUtil.basicResponse(res, {message: 'parameter is not currect'});
        return;
    }

    // 対象存在チェックは要るかな？

    // user
    appUtil.getUserFromRequest(req, function (err, user) {
        
        // auth error.
        if (!user) {
            appUtil.response403(res);
            return;
        }

        // 既にlike済みはだめ。
        var likePopArray = JSON.parse(user.like_pop) || [];
        var alreadyLiked = _.contains(likePopArray, popId);
        if (alreadyLiked) {
            appUtil.basicResponse(res, {message: 'already liked'});
            return;
        }
        likePopArray.push(popId);


        // Update Pop.
        popModel.incrementLike(popId);

        // Update User.
        userModel.updateObject({like_pop:JSON.stringify(likePopArray)}, {id:user.id});

        // response.
        res.json('success');
    });

};


/**
 *  Dislike Pop.
 */
exports.dislikePop = function (req, res) {

    // target.
    var popId = parseInt(req.params.id || req.body.id, 10);
    if (isNaN(popId)) {
        appUtil.basicResponse(res, {message: 'parameter is not currect'});
        return;
    }

    // 対象存在チェックは要るかな？

    // user
    appUtil.getUserFromRequest(req, function (err, user) {
        
        // auth error.
        if (!user) {
            appUtil.response403(res);
            return;
        }

        // LikeしていないPopIdはだめ 
        var likePopArray = JSON.parse(user.like_pop) || [];
        var alreadyLiked = _.contains(likePopArray, popId);
        if (!alreadyLiked) {
            appUtil.basicResponse(res, {message: 'already not liked'});
            return;
        }
        likePopArray = _.without(likePopArray, popId);


        // Update Pop.
        popModel.decrementLike(popId);

        // Update User.
        userModel.updateObject({like_pop:JSON.stringify(likePopArray)}, {id:user.id});

        // response.
        res.json('success');
    });

};











/**
 *  Delete
 */
exports.delete = function(req, res) {

    popModel.deleteObject(req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





























