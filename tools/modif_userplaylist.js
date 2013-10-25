/**
    ユーザープレイリストのバグを修正
*/
global.db_path = '../db/mockbu.db';
var _ = require('underscore');
var userModel = require('../models/user');
var userPocketModel = require('../models/user_pocket');
var userPlaylistModel = require('../models/user_playlist');


console.log('start');


// 全ユーザーを取得
var users;
userModel.selectObjects({}, function (err, rows) {
    users = rows;
    modifyUserPlayList();
});



// プレイリスト修正
var modifyUserPlayList = function () {


    // 対象が無ければ終わり
    if (users.length === 0) {
        console.log('end');
        return;
    }

    // 対象を取得する
    var user = users.pop();

    // ポケット一覧を取得する
    userPocketModel.selectObjects({user_id: user.id}, function (err, pockets) {

        var pocketIds = _.map(pockets, function (pocket) {return pocket.id;});

        // プレイリスト一覧を取得する
        userPlaylistModel.selectObjects({user_id: user.id}, function (err, playlists) {

            var count = playlists.length;
            var doneCount = 0;


            // 1件ずつチェックする
            playlists.forEach(function (playlist) {
                var ids = JSON.parse(playlist.user_pocket_ids);


                // 全件Playlistの場合
                if (playlist.type === 1) {
                    if (ids.length !== pocketIds.length) {
                        console.log('ALLのPlaylistを更新します。 userId=', playlist.user_id);
                        userPlaylistModel.updateObject({user_pocket_ids: JSON.stringify(pocketIds)}, {id: playlist.id}, function () {

                            doneCount++;
                            if (count === doneCount) {
                                modifyUserPlayList();
                            }
                        });

                    } else {
                        doneCount++;
                        if (count === doneCount) {
                            modifyUserPlayList();
                        }
                    }
                }






                var newIds = _.filter(ids, function (id) {
                    return _.contains(pocketIds, id);
                });

                if (ids.length !== newIds.length) {

                    console.log('さくじょされたPocketがあるのでPlaylistを更新します。 userId=', playlist.user_id);
                    userPlaylistModel.updateObject({user_pocket_ids: JSON.stringify(newIds)}, {id: playlist.id}, function () {

                        doneCount++;
                        if (count === doneCount) {
                            modifyUserPlayList();
                        }
                    });

                } else {
                    doneCount++;
                    if (count === doneCount) {
                        modifyUserPlayList();
                    }
                }

            });

        });
    });

};



