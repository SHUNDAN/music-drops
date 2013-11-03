"use strict";
/*
 * Feeling.
 */
var appUtil = require('../util/utility');
var feelingModel = require('../models/feeling');

/**
 * Select 
 */
exports.select = function(req, res){
    console.log('select feelings: ', req.query);
    
    // 今のところ件数が少ないので全件返す
    feelingModel.selectObjects({}, function (err, rows) {
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
// exports.add = function(req, res) {

//     // check params.
//     if (!req.body.id) {
//         res.json(400, {status: 400, message: 'id must not be null.'});
//         return;
//     }

//     // execute.
//     feelingModel.insertObject(req.body, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



/**
 *  Update
 */
// exports.update = function(req, res) {

//     // check params.
//     if (!req.params.id) {
//         res.json(400, {status: 400, message: 'id must not be null.'});
//         return;
//     }

//     // create update data.
//     feelingModel.updateObject(req.body, req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };



/**
 *  Delete
 */
// exports.delete = function(req, res) {

//     // check params.
//     if (!req.params.id) {
//         res.json(400, {status: 400, message: 'id must not be null.'});
//         return;
//     }

//     // execute.
//     feelingModel.deleteObject(req.params, function (err) {
//         appUtil.basicResponse(res, err);
//     });

// };

