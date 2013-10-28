// 他人のプレイリストからのDragDropでデータ不正となったやつを直すパッチ
global.db_path = '../db/mockbu.db';
var _ = require('underscore');
var userModel = require('../models/user');
var userPocketModel = require('../models/user_pocket');
var userPlaylistModel = require('../models/user_playlist');


console.log('start!');
console.log('target db = ', global.db_path);

// 全ユーザーを取得する
var users;
userModel.selectObjects({}, function (err, rows) {
    users = rows;
    modifPlaylist();
});



// Playlistの修正（Pocketがないものは削除）
var modifPlaylist = function () {

    // 終了判定
    if (users.length === 0) {
        console.log('finish!');
        return;
    }

    var user = users.shift();
    console.log('\nuserId=', user.id);

    // pocketを全件取得
    userPocketModel.selectObjects({user_id: user.id}, function (err, rows) {
        rows = rows || [];
        // pocketが無ければ次へ
        // if (!rows || rows.length === 0) {
        //     console.log('Pocketがないよー。userId=', user.id);
        //     modifPlaylist();
        //     return;
        // }

        // idを配列取得する
        var userPocketIds = rows.map(function (pocket) {return pocket.id});
        console.log('user=', user.id, ', pocketIds.length=', userPocketIds.length);


        // プレイリストを全件取得する
        userPlaylistModel.selectObjects({user_id:user.id}, function (err, rows) {

            // なければ次へ
            if (!rows || rows.length === 0) {
                console.log('プレイリストないよ。 userId=', user.id);
                modifPlaylist();
                return;
            }

            // 1件ずつ処理
            var count = rows.length;
            var doneCount = 0;
            rows.forEach(function (playlist) {

                var ids = JSON.parse(playlist.user_pocket_ids);
                var newIds = ids.filter(function (id) {return _.contains(userPocketIds, id);});
                console.log('ids.length=', ids.length);
                console.log('newIds.length=', newIds.length);

                // 異なるのがあれば、更新
                if (ids.length !== newIds.length) {
                    console.log('違うの発見！更新します。');

                    userPlaylistModel.updateObject({user_pocket_ids: JSON.stringify(newIds)}, {id:playlist.id}, function () {

                        doneCount++
                        if (count === doneCount) {
                            modifPlaylist();
                        }

                    });


                // 問題なければ次へ
                } else {

                    doneCount++
                    if (count === doneCount) {
                        modifPlaylist();
                    }

                }

            });

        });


    });


};






































