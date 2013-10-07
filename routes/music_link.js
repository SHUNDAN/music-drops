"use strict";
/*
 * Router: Music Link 
 */
var util = require('util');
var appUtil = require('../util/utility');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");
var musicLinkModel = require('../models/music_link');
var musicModel = require('../models/music');
var appUtil = require('../util/utility');

/**
 * Select 
 */
exports.select = function(req, res){
    console.log('select music link', req.params);

    musicLinkModel.selectObjects(req.query, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err, rows);
        } else {
            res.json(rows);
        }
    });

};


/**
 * Select With User
 */
exports.select2 = function (req, res) {
    musicLinkModel.selectWithUser(req.query, function (err, rows) {
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

    // check params.
    if (!req.body.music_id || !req.body.comment || !req.body.link) {
        appUtil.actionLog(req, 'add music link failed. music_id, comment or link are missing');
        res.json(400, {message: 'music_id, comment and link are required.'});
        return;
    } 

    // uidからユーザー情報を取得する
    var user_id = appUtil.getUserIdFromRequest(req);
    if (!user_id) {
        appUtil.actionLog(req, 'add music link failed. no authentication');
        appUtil.response403(res);
        return;
    }


    req.body.user_id = user_id; 


    // iTunesリンクの場合には、itunes_idを取得する
    var youtube_id;
    var url = req.body.link;
    if (url.indexOf('http://www.youtube.com/watch?') !== -1) {
        var querys = url.split('?')[1].split('&');
        querys.forEach(function (q) {
            var fragments = q.split('=');
            if (fragments.length === 2 && fragments[0] === 'v') {
                youtube_id = fragments[1];
            }
        });
    }
    if (url.indexOf('http://youtu.be/') !== -1) {
        youtube_id = url.replace('http://youtu.be/', '');
    }
    if (url.indexOf('http://www.youtube.com/embed/') !== -1) {
        youtube_id = url.replace('http://www.youtube.com/embed/', '');
    }
    if (url.indexOf('http://m.youtube.com/watch?v=') !== -1) {
        youtube_id = url.replace('http://m.youtube.com/watch?v=', '');
    }

    req.body.youtube_id = youtube_id;
    console.log('url, youtube_id', url, youtube_id);



    // execute.
    musicLinkModel.insertObject(req.body, function (err) {
        appUtil.actionLog(req, ['add music link',JSON.stringify(req.body)]);
        appUtil.basicResponse(res, err);
    });

    // YoutubeIdはMusicにも設定する。
    // TODO 設定するアルゴリズムを考える。
    if (youtube_id) {
        console.log('aaaaa: ', req.body, req.body.music_id);
        musicModel.updateObject({youtube_id: youtube_id}, {id: req.body.music_id});
    }

};



/**
 *  Update
 */
exports.update = function(req, res) {

    // TODO check params.

    // execute
    musicLinkModel.updateObject(req.body, req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    musicLinkModel.deleteObject(req.params, function (err) {
        appUtil.basicResponse(res, err);
    });

};




/**
 * Add Music Link Play Count
 */
exports.addMusicLinkPlayCount = function (req, res) {


    // login check.
    if (!appUtil.isLogedIn(req)) {
        appUtil.response403(res);
        return;
    }

    // param check.
    var musicId = parseInt(req.params.music_id, 10);
    var linkId = parseFloat(req.params.link_id, 10);
    if (isNaN(musicId) || isNaN(linkId)) {
        res.json(400, 'bad request.');
        return;
    }

    // update.
    musicModel.addPlayCount(musicId);
    musicLinkModel.addPlayCount(linkId);

    // response.
    res.json({});

};











































