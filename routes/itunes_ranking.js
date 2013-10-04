"use strict";
/*
 * Router: iTunes Ranking 
 */
var _ = require('underscore');
var appUtil = require('../util/utility');
var iTunesRankingModel = require('../models/itunes_ranking');



/**
 * Select 
 */
exports.select = function(req, res) {

    // create select condition.
    var conditions = _.extend({}, req.params, req.query);

    // search
    iTunesRankingModel.selectObjects(conditions, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err);
        } else {
            res.json((rows.length === 1 ? rows[0] : rows));
            // res.json(rows);
        }
    });
};



/**
 *  Add
 */
exports.add = function(req, res) {

    // TODO Check Parameters.

    // execute.
    iTunesRankingModel.insertObject(req.body, function (err) {
        appUtil.basicResponse(res, err); 
    });

};



/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO Check Parameters.

    // update data.
    var data = req.body;

    // condition param.
    var condition = {id: req.params.id};

    // execute.
    iTunesRankingModel.updateObject(data, condition, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    // TODO Check Parameters.

    // execute.
    iTunesRankingModel.deleteObject(req.params.id, function (err) {
        appUtil.basicResponse(res, err);
    });

};























