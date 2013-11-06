"use strict";
/*
 * Artist.
 */
// var util = require('util');
var appUtil = require('../util/utility');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database("./db/mockbu.db");
var reportModel = require('../models/report');


/**
 * Select 
 */
exports.select = function(req, res){

    reportModel.selectObjects(req.query, function (err, rows) {
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

    var param = {};    

    // 必須：Type
    if (!req.body.type) {
        res.json(400, {message: 'type must be set.'});
        return;
    } else {
        param.type = parseInt(req.body.type, 10);
    }



    // uidからユーザー情報を取得する
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        res.json(403, {message: 'authentication error.'});
        return;
    }

    param.user_id = user_id;


    // Type1: リンク切れ
    if (param.type === 1) {

        if (!req.body.music_link_id) {
            res.json(400, 'music_link_id must be set.');
            return;
        }

        param.json = {};
        param.json.music_link_id = req.body.music_link_id;
        param.json = JSON.stringify(param.json);
    
    } else {
        res.json(400, 'type !== 1 not supported.');
        return;
    }

    // execute.
    reportModel.insertObject(param, function (err) {
        appUtil.basicResponse(res, err);
    });

};



/**
 *  Update
 */
// exports.update = function(req, res) {

//     // TODO check params.

//     // execute.
//     reportModel.updateObject(req.body, req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };





/**
 *  Delete
 */
// exports.delete = function(req, res) {

//     reportModel.deleteObject(req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



















