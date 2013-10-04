"use strict";
// Music, iTunes RankingのAsciiアンエスケープ


// Settings.
global.db_path = '../../db/mockbu.db';


// Load Module.
var musicModel = require('../../models/music');
var itunesRankingModel = require('../../models/itunes_ranking');
var appUtil = require('../../util/utility');



// Music
var musicList = [];
var func1 = function () {

    if (musicList.length === 0) {
        console.log('finish: music table');
        return;
    }

    var row = musicList.shift();
    var title = appUtil.unescapeAscii(row.title);
    var artistName = appUtil.unescapeAscii(row.artist_name);

    if (title !== row.title || artistName !== row.artist_name) {
        console.log('unescape music');
        musicModel.updateObject({title:title, artist_name:artistName}, {id:row.id}, function () {
            func1();
        });

    } else {
        func1();
    }
};


musicModel.selectObjects({}, function (err, rows) {
    musicList = rows;
    func1();
});









// iTunes
var iTunesRankingList = [];
var func2 = function () {

    if (iTunesRankingList.length === 0) {
        console.log('finish: iTunesRanking table');
        return;
    }

    var row = iTunesRankingList.shift();
    var title = appUtil.unescapeAscii(row.title);
    var artistName = appUtil.unescapeAscii(row.artist_name);

    if (title !== row.title || artistName !== row.artist_name) {
        console.log('unescape music');
        itunesRankingModel.updateObject({title:title, artist_name:artistName}, {id:row.id}, function () {
            func2();
        });

    } else {
        func2();
    }
};


itunesRankingModel.selectObjects({}, function (err, rows) {
    iTunesRankingList = rows;
    func2();
});






