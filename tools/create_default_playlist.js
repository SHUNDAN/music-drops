"use strict";
/**
 * Userのデフォルトプレイリストを作る 
 *
 *
 */
var util = require('util');
global.db_path = '../db/mockbu.db';
var userModel = require('../models/user');
var userPocketModel = require('../models/user_pocket');
var userPlaylistModel = require('../models/user_playlist');
var appUtil = require('../util/utility');


console.log('start.');



// 全ユーザーを取得する
var users;
userModel.selectObjects({}, function (err, rows) {
    console.log('users: ', rows.length);
    
    if (rows.length === 0) {
        console.log('finish');
        return;
    }

    users = rows;
    createDefaultPlaylist();
});


// ユーザーのデフォルトプレイリストを作る
function createDefaultPlaylist() {

    if (users.length === 0) {
        console.log('finish');
        return;
    }

    var user = users.shift();

    // pocketリストを取得する
    userPocketModel.selectObjects({user_id:user.id}, function (err, rows) {
       
        // リストを作る
        var pockets = [];
        rows.forEach(function (pocket) {
            pockets.push(pocket.id);
        });


        // 今ある物は削除します
        userPlaylistModel.deleteObject({user_id:user.id, type:1}, function () {

            // 登録する
            var data = {
                user_id: user.id,
                type: 1,
                title: '全てのPocket',
                seq: 999,
                user_pocket_ids: JSON.stringify(pockets)
            };
            userPlaylistModel.insertObject(data, function () {

                // 次へ
                createDefaultPlaylist();
            });

        });



    });


};



























