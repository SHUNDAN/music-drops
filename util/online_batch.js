"use strict";
/****************************************
 *  Online Batch
 ****************************************/
var fs = require('fs');
// var _ = require('underscore');
// var util = require('util');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(global.db_path);
var glob = require('glob');
var musicModel = require('../models/music');
var popModel = require('../models/pop');
var feelingModel = require('../models/feeling');
var userPocketModel = require('../models/user_pocket');
var userFollowModel = require('../models/user_follow');
var userNotificationModel = require('../models/user_notification');
var musicModel = require('../models/music');
var userModel = require('../models/user');


module.exports = {


    /**
        MusicのFeelingを計算して設定するバッチ
    */
    setMusicFeeling: function (musicId) {

        // 対象Popを取得する
        popModel.selectObjects({music_id: musicId}, function (err, rows) {

            // 検索結果なしの場合は終わり
            if (rows.length === 0) {
                console.log('検索結果なし');
                return;
            }

            // 集計する
            var scoreMap = {};
            rows.forEach(function (row) {
                scoreMap[row.feeling_id] = row.create_at + (scoreMap[row.feeling_id] || 0);
            });

            // 最大値を見つける
            var feelingId = 0;
            var max = 0;
            for (var feeling_id in scoreMap) {
                if (scoreMap.hasOwnProperty(feeling_id)) {
                    if (max < scoreMap[feeling_id]) {
                        feelingId = feeling_id;
                        max = scoreMap[feeling_id];
                    }
                }
            }

            console.log('result: ', musicId, feelingId, max, scoreMap);


            // 反映する
            musicModel.updateObject({feeling_id:feelingId}, {id:musicId}, function (err) {
                console.log('finish');
            });

        });


    },



    /**
        メモリ上の情報を最新化する
    */
    refreshMemCache: function (callback) {
        console.log('refreshMemCache start.');

        // いったん初期化
        var mb = {};


        // 設定ファイル
        var json = fs.readFileSync('./settings/setting.json', 'utf-8');
        global.mbSetting = JSON.parse(json);


        // アプリケーションバージョン
        var appVersion = fs.readFileSync('./settings/app_version.txt', 'utf-8');
        mb.appVersion = appVersion.replace(/(\s|\n)/g, '');


        // Templateファイル
        var template = '';
        glob('./public/template/**/*.html', function (err, files) {
            files.forEach(function (file) {
                template += fs.readFileSync(file, 'utf-8');
            });
            mb.htmlTemplate = template;

            // 感情
            feelingModel.selectObjects({}, function (err, rows) {
                mb.feelings = rows;


                // キャッシュ更新
                global.mb = mb;


                console.log('refreshMemCache finished.');
                if (callback) {
                    callback();
                }


            }); // end feeling model select
        }); // end glob.

    },




    /**
        お知らせ追加：フォローユーザーがPocketを追加した
    */
    addUserNotificationWhenFollowUserAddPocket: function (userId, musicId) {

        // このユーザーの情報を取得する。
        userModel.selectObjects({id:userId}, function (err, rows) {

            // 検索が失敗したら、何もしない。
            if (err || rows.length === 0) {
                return;
            }

            // ユーザー情報
            var user = rows[0];
            delete user.password;
            delete user.uid;
            delete user.sex;
            delete user.google_identifier;
            delete user.facebook_access_token;
            delete user.twitter_token;
            delete user.twitter_token_secret;


            // 曲の詳細を取得する。
            musicModel.selectObjects({id: musicId}, function (err, rows) {

                // 検索失敗の場合は何もしない
                if (err || rows.length === 0) {
                    return;
                }

                // 曲詳細を取得する
                var music = rows[0];

                // フォローユーザーを取得する
                userFollowModel.selectObjects({dest_user_id: userId}, function (err, rows) {

                    rows.forEach(function (row) {
                        // console.log('row: ', row);

                        var jsonText = JSON.stringify({
                            user: user,
                            music: music
                        });

                        // 追加処理
                        var data = {
                            user_id: row.user_id,
                            type: 1,
                            json: jsonText
                        };

                        // 保存する
                        userNotificationModel.insertObject(data);

                    });
                });
            });
        });
    },



    /**
        お知らせ追加：フォローユーザーがDropを追加した
    */
    addUserNotificationWhenFollowUserAddDrop: function (userId, popId) {

        // このユーザーの情報を取得する。
        userModel.selectObjects({id:userId}, function (err, rows) {

            // 検索が失敗したら、何もしない。
            if (err || rows.length === 0) {
                return;
            }

            // ユーザー情報
            var user = rows[0];
            delete user.password;
            delete user.uid;
            delete user.sex;
            delete user.google_identifier;
            delete user.facebook_access_token;
            delete user.twitter_token;
            delete user.twitter_token_secret;


            // TODO 実装する
        });
    },














};





































