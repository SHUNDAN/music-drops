"use strict";
/**
 * iTunes RSSをロードするツール
 *
 * ########### Project Rootで実行すること ##############
 */
var fs = require('fs');
var http = require('http');
var util = require('util');
var xml2json = require('xml2json');

// mysql setting.
var json = fs.readFileSync('./settings/setting.json', 'utf-8');
global.mbSetting = JSON.parse(json);
var mysql = require('mysql');
global.dbConnectionPool = mysql.createPool(global.mbSetting.mysql);

// load model.
var artistModel = require('../models/artist');
var iTunesRankingModel = require('../models/itunes_ranking');
var musicModel = require('../models/music');
var codeModel = require('../models/code');
var appUtil = require('../util/utility');


console.log('start.');


// 引数からジャンルIDを受け取る
global.genreId;
process.argv.forEach(function (val, index) {
    if (index === 2) {
        global.genreId = parseInt(val, 10);
    }
});
if (!global.genreId) {
    console.log('no genreId specified. execute like this: $ node load_itunes_rss.js 11');
    return;
}



// start loading rss.
console.log('start loading rss feed.');
var url;
if (global.genreId === -1) { // All
    url = util.format('http://itunes.apple.com/jp/rss/topsongs/limit=200/xml');
} else {
    url = util.format('http://itunes.apple.com/jp/rss/topsongs/limit=200/genre=%s/xml', global.genreId);
}
console.log(url);
var xmlString = '';
var req = http.get(url, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (xml) {
        xmlString += xml;
    });
    res.on('end', function () {
        console.log('finish loading rss feed.');
        parseRss(xmlString);
    });
});
req.on('error', function (err) {
    console.log('Error: ', err); return;
});



// Parse RSS.
var parseRss = function (xmlString) {
    var jsonString = xml2json.toJson(xmlString);
    insert(JSON.parse(jsonString));
};



// Insert Data to Table.
var dataArray = [];
var entryCount;
var insert = function (rssJson) {
    console.log('start inserting rss feed.');
    var entries = rssJson.feed.entry;
    entryCount = entries.length;
    console.log('rss count: ', entries.length);


    // ランキングテーブルのデータを全部削除する
    iTunesRankingModel.deleteObject({genre_id: global.genreId}, function () {


        var ranking = 1;
        var genreId;
        var genreName;
        if (global.genreId === -1) {
            genreId = -1;
            genreName = 'All';
        }
        entries.forEach(function (entry) {

            var data = {};

            // ranking
            data.ranking = ranking++;

            // カテゴリ
            // TODO DBへ保存したい
            if (global.genreId !== -1) {
                genreId = entry.category['im:id'];
                genreName = entry.category['term'];
            }
            data.genre_id = genreId;
            data.genre_name = genreName;

            // 曲名
            data.title = appUtil.unescapeAscii(entry['im:name']);

            // アーティスト名
            data.artist_name = appUtil.unescapeAscii(entry['im:artist']['$t']);

            // artwork
            entry['im:image'].forEach(function(image) {
                if (image.height >= 170) {
                    data.artwork_url = image['$t'];
                }
            });

            // song_url
            entry.link.forEach(function (link) {
                if (link.href.indexOf('.m4a') !== -1) {
                   data.song_url = link.href;
                }
            });

            // itunes_url
            data.itunes_url = entry.id['$t'].replace('&amp;', '&');

            console.log(data.ranking, data.title, data.artist_name);


            // 登録データ登録
            dataArray.push(data);

        });


        // DBへの登録処理開始
        insertData();


        // 最後に、Codeテーブルの情報を最新化する
        codeModel.selectObjects({key1:'genre', key2:genreId}, function (err, rows) {

            // ある場合には、ラベルのみ更新する
            if (rows.length > 0) {
                codeModel.updateObject({value:genreName}, {id:rows[0].id}, function () {
                    console.log('update genre');
                });

            } else {
                // 無い場合には、新規登録する
                codeModel.insertObject({key1: 'genre', key2: genreId, value: genreName}, function () {
                    console.log('genre refreshed');
                });
            }

        });





    });

};




/**
 *  データ登録
 */
var insertData = function () {

    if (dataArray.length === 0) {
        console.log('finish');
        process.exit();
        return;
    }

    var data = dataArray.shift();
    insertDataToArtist(data);

};







/**
 *  Artistテーブルへ登録
 */
function insertDataToArtist (data) {

    // 検索する
    console.log('artist select: ', data.artist_name);
    artistModel.selectObjects({name: data.artist_name}, function (err, rows) {

        // 存在すれば次へ
        if (rows.length !== 0) {
            data.artist_id = rows[0].id;
            insertDataToMusic(data);
            return;
        }

        // 無ければ登録する
        artistModel.insertObject({name: data.artist_name}, function () {

            // ArtistIdを取得する
            artistModel.selectObjects({name: data.artist_name}, function (err, rows) {

                // 次へ
                data.artist_id = rows[0].id;
                insertDataToMusic(data);
            });

        });

    });

}



/**
 * Musicテーブルへ登録
 */
function insertDataToMusic (data) {

    // 検索する
    musicModel.selectObjects({title: data.title, artist_name: data.artist_name}, function (err, rows) {

        if (rows.length !== 0) {
            // 存在すれば、次に進む
            data.music_id = rows[0].id;
            insertDataToITunesRanking(data);
            return;
        }

        // 存在しなければ登録
        musicModel.insertObject(data, function () {
            // MusicIdを取得して、次に進む
            musicModel.selectObjects({title: data.title, artist_name: data.artist_name}, function (err, rows) {
                data.music_id = rows[0].id;
                insertDataToITunesRanking(data);
            });
        });

    });
}



/**
 * iTunesRankingテーブルへ登録
 */
var insCount = 0;
function insertDataToITunesRanking (data) {
    iTunesRankingModel.insertObject(data, function () {
        // 次の処理へ
        insertData();
    });
}





























