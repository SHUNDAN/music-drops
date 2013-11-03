"use strict";
/*
 * Artist.
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var artistModel = require('../models/artist');


/**
 * Select 
 */
exports.select = function(req, res){

    artistModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};


/**
 * Select One 
 */
exports.selectObject = function(req, res){

    artistModel.selectObjects(req.params, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            if (rows.length > 0) {
                res.json(rows[0]);
            } else {
                res.json({});
            }
        }
    });

};


/**
 *  Add
 */
// exports.add = function(req, res) {

//     // TODO check params.
//     if (!req.body.music_id || !req.body.feeling_id) {
//         res.json(400, {message: 'music_id or feeling_id are required.'});
//         return;
//     }



//     // uidからユーザー情報を取得する
//     var uid = req.cookies.uid;
//     var user_id = (global.sessionMap ? global.sessionMap[uid] : undefined);
//     if (!user_id) {
//         res.json(403, {message: 'authentication error.'});
//         return;
//     }

//     req.body.user_id = user_id;

//     // execute.
//     artistModel.insertObject(req.body, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



/**
 *  Update
 */
// exports.update = function(req, res) {

//     // TODO check params.

//     // execute.
//     artistModel.updateObject(req.body, req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };





/**
 *  Delete
 */
// exports.delete = function(req, res) {

//     artistModel.deleteObject(req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



















