"use strict";
/****************************************
 *  Online Batch
 ****************************************/
// var _ = require('underscore');
// var util = require('util');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(global.db_path);
var musicModel = require('../models/music');
var popModel = require('../models/pop');

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














};
