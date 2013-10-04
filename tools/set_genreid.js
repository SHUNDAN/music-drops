"use strict";
/**
 * Genre未設定の曲にジャンルを設定する処理
 *
 *
 */


/*==========================================
 * Modules 
 ==========================================*/
var http = require('http');
var util = require('util');
global.db_path = '../db/mockbu.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);
var musicModel = require('../models/music');
var codeModel = require('../models/code');





/*==========================================
 * Variables
 ==========================================*/
var musics = [];







/*==========================================
 * Task Process
 ==========================================*/
console.log('start.');



// 処理対象を取得する
db.all('select * from music where genre_id is null limit 20', function (err, rows) {

    // 処理対象が無ければ終わり
    if (!rows || rows.length === 0) {
        console.log('finish');
        return;
    } else {
        console.log('target count: ', rows.length);

        musics = rows;

        // 処理する
        doWork();
    }
});



// ジャンルを設定する
var doWork = function () {

    // 終了チェック
    if (musics.length === 0) {
        console.log('finish');
        return;
    }

    // 1件取り出す
    var music = musics.shift();

    
    // iTunes Searchで該当曲を検索する
    searchMusic(music);

};


// 該当曲をiTunes APIで探す
var searchMusic = function (music) {

    var url = util.format('http://itunes.apple.com/search?media=music&entity=song&country=jp&term=%s', encodeURI(music.title)); 
    console.log('url: ', url);

    // search
    var jsonString = ''; 
    var req = http.get(url, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (text) {
            jsonString += text;
        }); 
        res.on('end', function () {
            // console.log('jsonString: ', jsonString);
            parseJson(jsonString, music);
        }); 
    });
    req.on('error', function (err) {
        console.log('HTTP Error: ', err); 
        return;
    });
};


// iTunes Searchの結果JSONから値を取得する。
var parseJson = function (jsonString, music) {

    var results = JSON.parse(jsonString).results; 
    // console.log('results: ', results);

    // 検索結果が無ければ、ワーニング
    if (results.length === 0) {
        console.log('WARN NO ITUNES API RESULT: ', music.id, music.title, music.artist_name);
        // 次へ
        doWork();
        return;
    }

    // アーティスト名が一致する曲を探す
    var result;
    results.forEach(function (r) {
        if (r.artistName === music.artist_name) {
            result = r;
        }
    });
    if (result === undefined) {
        console.log('WARN NO ITUNES API RESULT2: ', music.id, music.title, music.artist_name);
        // 次へ
        doWork();
        return;
    }



    // ジャンル名から、ジャンルIDを取得する
    var genreName = result.primaryGenreName;
    codeModel.selectObjects({key1:'genre',value:genreName}, function (err, rows) {

        // 検索結果無ければ、ワーニング
        if (rows.length === 0) {
            console.log('WARN: NO GENRE IN CODE TABLE: ', genreName);
            // 次へ
            doWork();
            return;
        }

        // ジャンルIDを取得
        var genreId = rows[0].key2;

        // Musicテーブルに設定する
        musicModel.updateObject({genre_id: genreId}, {id: music.id}, function () {
            // 次へ
            doWork();
        });


    });




};

