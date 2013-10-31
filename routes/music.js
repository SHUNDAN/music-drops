"use strict";
/*
 * Music.
 */
var _ = require('underscore');
var appUtil = require('../util/utility');
var musicModel = require('../models/music');
var artistModel = require('../models/artist');




/**
 * Select
 */
exports.select = function(req, res) {

    // create select condition.
    var conditions = {};
    var id = req.params.id;
    if (id) {
        conditions.id = id;
    }

    if (req.query) {
        _.extend(conditions, req.query);
    }

    console.log('music#search conditions: ', conditions);

    // search
    musicModel.selectObjects(conditions, function (err, rows) {
        if (err) {
            appUtil.basicResponse(res, err);
        } else {
            res.json((rows.length === 1 ? rows[0] : rows));
            // res.json(rows);
        }
    });
};


/**
 * iTunes検索画面で使う曲を探すメソッド。無ければ追加してmusic_idを返す
 */
exports.searchWithITunes = function (req, res) {

    var params = {title: req.body.trackName, artist_name: req.body.artistName};
    console.log('params: ', params);

    // 曲が存在するかを確認する
    var musicFound = false;
    var artistFound = false;
    musicModel.selectObjects(params, function (err, rows) {

        if (rows.length > 0) {
            console.log('find music');
        } else {
            console.log('cannot find music', params.title);
        }
        musicFound = (rows.length !== 0);


        // 次にアーティストが存在するかを確認する
        var params2 = {name: req.body.artistName};
        console.log('params2: ', params2);
        artistModel.selectObjects(params2, function (err, rows2) {
            artistFound = (rows2.length !== 0);
            if (rows.length > 0) {
                console.log('artist found');
            } else {
                console.log('artist not found', req.body.artistName);
            }


            // 曲もアーティストもある場合には、曲のIDを返す。
            if (musicFound && artistFound) {
                res.json(rows[0]);
                return;

            } else if (artistFound) {
                // アーティストが既にある場合には、曲を登録してからそのIDを返す。
                var data = {
                    title: req.body.trackName,
                    artwork_url: req.body.artworkUrl100,
                    song_url: req.body.previewUrl,
                    artist_id: rows2[0].id,
                    artist_name: rows2[0].name,
                    itunes_url: req.body.trackViewUrl
                };
                musicModel.insertObject(data, function () {
                    musicModel.selectObjects(data, function (err, rows) {
                        res.json(rows[0]);
                    });
                });

            } else {
                // 曲もアーティストも無い場合には、どっちも登録する。

                var artistData = {
                    name: req.body.artistName
                };
                artistModel.insertObject(artistData, function () {
                    // アーティストIDを取得したい
                    artistModel.selectObjects(artistData, function (err, rows2) {

                        // Musicを登録
                        var data = {
                            title: req.body.trackName,
                            artwork_url: req.body.artworkUrl100,
                            song_url: req.body.previewUrl,
                            artist_id: rows2[0].id,
                            artist_name: rows2[0].name,
                            itunes_url: req.body.trackViewUrl
                        };
                        musicModel.insertObject(data, function () {
                            musicModel.selectObjects(data, function (err, rows) {
                                res.json(rows[0]);
                            });
                        });


                    });
                });

            }

        });



    });

};






/**
 *  Add
 */
exports.add = function(req, res) {

    // TODO Check Parameters.

    // execute.
    musicModel.insertObject(req.body, function (err) {
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
    musicModel.updateObject(data, condition, function (err) {
        appUtil.basicResponse(res, err);
    });

};





/**
 *  Delete
 */
exports.delete = function(req, res) {

    // TODO Check Parameters.

    // execute.
    musicModel.deleteObject(req.params.id, function (err) {
        appUtil.basicResponse(res, err);
    });

};



/**
 * Add Music Play Count
 */
exports.addMusicPlayCount = function(req, res) {

    // login check.
    // if (!appUtil.isLogedIn(req)) {
    //     appUtil.response403(res);
    //     return;
    // }


    // query check.
    var musicId = parseInt(req.params.id, 10);
    if (isNaN(musicId)) {
        res.json(400, 'bad request.');
        return;
    }


    // add play count.
    musicModel.addPlayCount(musicId, function () {
        res.json({});
    });

};


















































