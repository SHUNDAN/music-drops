"use strict";
/****************************************
 *  Online Batch
 ****************************************/
var fs = require('fs');
var _ = require('underscore');
// var util = require('util');
var glob = require('glob');
var commonModel = require('../models/common');
var musicModel = require('../models/music');
var musicLinkModel = require('../models/music_link');
var userModel = require('../models/user');
var popModel = require('../models/pop');
var feelingModel = require('../models/feeling');
var userPocketModel = require('../models/user_pocket');
var userFollowModel = require('../models/user_follow');
var userNotificationModel = require('../models/user_notification');
var userArtistFollowModel = require('../models/user_artist_follow');
var userPlaylistModel = require('../models/user_playlist');


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
        Pop追加/削除時に、曲のPop数を再集計する
    */
    updatePopCountAtMusic: function (musicId, callback) {

        // 該当曲のPop数を計算する
        var sql = 'select count(1) cnt from pop where music_id = ' + musicId;
        commonModel._executeQuery(sql, null, function (err,rows) {

            if (err && callback) {
                return callback(err);
            }

            // Pop数
            var numOfPop = rows[0].cnt;

            // 曲を更新する
            musicModel.updateObject({pop_count: numOfPop}, {id: musicId}, function () {
                if (callback) {
                    callback();
                }
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


                // sessionの更新もやる
                userModel.selectUIDUser(function (err, users) {
                    users.forEach(function (user) {
                        global.sessionMap[user.uid] = user.id;
                    });


                    console.log('refreshMemCache finished.');
                    if (callback) {
                        callback();
                    }

                });


            }); // end feeling model select
        }); // end glob.
    },



    /**
        お知らせ追加：フォローしているユーザーがDropを追加
    */
    addNotificationWhenFollowUserAddDrop: function (musicId, userId) {

        // 対象のPopを検索する
        popModel.selectObjects({music_id: musicId}, function (err, rows) {

            // 0件の場合は終了
            if (rows.length === 0) {
                console.log('addNotificationWhenFollowUserAddDrop: no pop found. musicId=', musicId);
                return;
            }

            // 最新のものを対象とする
            var pop = rows[rows.length-1];

            // 曲の詳細情報を取得する
            musicModel.selectObjects({id: musicId}, function (err, rows) {

                // 0件の場合は終了
                if (rows.length === 0) {
                    console.log('addNotificationWhenFollowUserAddDrop: no music found. musicId=', musicId);
                    return;
                }

                var music = rows[0];


                // Dropを書いた人の情報を取得する
                userModel.selectObjects({id: userId}, function (err, rows) {

                    // 0件の場合は終了
                    if (rows.length === 0) {
                        console.log('addNotificationWhenFollowUserAddDrop: no user found. userId=', userId);
                        return;
                    }

                    var followUser = rows[0];


                    // 該当アーティストをフォローしている人を捜す
                    userFollowModel.selectObjects({dest_user_id:userId}, function (err, rows) {

                        // 誰もいなければ終わり
                        if (rows.length === 0) {
                            console.log('addNotificationWhenAddDropToFollowArtistMusic: no dest_user. userId = ', userId);
                            return;
                        }

                        // 1人ずつ通知を登録する
                        rows.forEach(function (follow) {

                            // 自分以外のみ
                            if (follow.user_id !== userId) {

                                // 通知情報を作って、登録
                                var jsonText = JSON.stringify({
                                    music: music,
                                    pop: pop,
                                    followUser: followUser
                                });


                                // 追加処理
                                var data = {
                                    user_id: follow.user_id,
                                    type: 2,
                                    json: jsonText
                                };

                                // 保存する
                                userNotificationModel.insertObject(data);
                            }

                        });
                    });

                });





            });
        });
    },

















    /**
        お知らせ追加：自分のドロップがLikeされた
    */
    addNotificationWhenMyDropLiked: function (popId, fromUserId) {

        // Popを検索します
        popModel.selectObjects({id:popId}, function (err, rows) {

            // 存在しなければ終了
            if (rows.length === 0) {
                console.warn('addNotificationWhenMyDropLiked: not found pop. id=', popId);
                return;
            }

            // 自分のPopの場合には終了
            if (rows[0].user_id === fromUserId) {
                console.log('like pop of mine.');
                return;
            }

            var pop = rows[0];

            // 曲名を取得します
            musicModel.selectObjects({id: pop.music_id}, function (err, rows) {

                // 存在しなければ終わり
                if (rows.length === 0) {
                    console.warn('addNotificationWhenMyDropLiked: not found music. id=', pop.music_id);
                    return;
                }

                var music = rows[0];


                // Likeしたユーザー名を取得します
                userModel.selectObjects({id: fromUserId}, function (err, rows) {

                    // なければ終わり
                    if (rows.length === 0) {
                        console.warn('addNotificationWhenMyDropLiked: not found like user. id=', fromUserId);
                        return;
                    }

                    var fromUser = rows[0];


                    // 通知情報を作って、登録
                    var jsonText = JSON.stringify({
                        pop: pop,
                        music: music,
                        fromUser: fromUser
                    });


                    // 追加処理
                    var data = {
                        user_id: pop.user_id,
                        type: 3,
                        json: jsonText
                    };

                    // 保存する
                    userNotificationModel.insertObject(data);

                });

            });

        });
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
        お知らせ追加：フォローアーティストにリンク追加（該当曲に新規の場合のみ）
    */
    addNotificationWhenAddLinkToFollowArtistMusic: function (musicId, userId) {
        console.log('addNotificationWhenAddLinkToFollowArtistMusic starts');

        // 前の処理で登録されたリンクを探す
        musicLinkModel.selectObjects({music_id: musicId}, function (err, rows) {

            // 存在しない or 2個以上ある場合には、パス
            if (rows.length !== 1) {
                console.log('addNotificationWhenAddLinkToFollowArtistMusic: no need. link count = ', rows.length);
                return;
            }

            var musicLink = rows[0];


            // アーティスト情報を取得する
            musicModel.selectObjects({id: musicId}, function (err, rows) {

                // 無い場合には終わり
                if (rows.length === 0) {
                    console.warn('addNotificationWhenAddLinkToFollowArtistMusic: not found music. musicId=', musicId);
                    return;
                }

                var music = rows[0];

                // 該当アーティストをフォローしている人を捜す
                userArtistFollowModel.selectObjects({artist_id: music.artist_id}, function (err, rows) {

                    // 誰もいなければ終わり
                    if (rows.length === 0) {
                        console.log('addNotificationWhenAddLinkToFollowArtistMusic: no need. follow count = ', rows.length);
                        return;
                    }


                    // 1人ずつ通知を登録する
                    rows.forEach(function (follow) {

                        // 自分以外のみ
                        if (follow.user_id !== userId) {

                            // 通知情報を作って、登録
                            var jsonText = JSON.stringify({
                                music: music,
                                musicLink: musicLink
                            });


                            // 追加処理
                            var data = {
                                user_id: follow.user_id,
                                type: 5,
                                json: jsonText
                            };

                            // 保存する
                            userNotificationModel.insertObject(data);

                        }

                    });
                });

            });
        });
    },



    /**
        お知らせ追加：フォローアーティストにDrop追加
    */
    addNotificationWhenAddDropToFollowArtistMusic: function (musicId, userId) {

        // 対象のPopを検索する
        popModel.selectObjects({music_id: musicId}, function (err, rows) {

            // 0件の場合は終了
            if (rows.length === 0) {
                console.log('addNotificationWhenAddDropToFollowArtistMusic: no pop found. musicId=', musicId);
                return;
            }

            // 最新のものを対象とする
            var pop = rows[rows.length-1];

            // 曲の詳細情報を取得する
            musicModel.selectObjects({id: musicId}, function (err, rows) {

                // 0件の場合は終了
                if (rows.length === 0) {
                    console.log('addNotificationWhenAddDropToFollowArtistMusic: no music found. musicId=', musicId);
                    return;
                }

                var music = rows[0];

                // 該当アーティストをフォローしている人を捜す
                userArtistFollowModel.selectObjects({artist_id: music.artist_id}, function (err, rows) {

                    // 誰もいなければ終わり
                    if (rows.length === 0) {
                        console.log('addNotificationWhenAddDropToFollowArtistMusic: no need. follow count = ', rows.length);
                        return;
                    }

                    // 1人ずつ通知を登録する
                    rows.forEach(function (follow) {

                        // 自分以外のみ
                        if (follow.user_id !== userId) {

                            // 通知情報を作って、登録
                            var jsonText = JSON.stringify({
                                music: music,
                                pop: pop
                            });


                            // 追加処理
                            var data = {
                                user_id: follow.user_id,
                                type: 6,
                                json: jsonText
                            };

                            // 保存する
                            userNotificationModel.insertObject(data);
                        }

                    });
                });
            });
        });
    },




    /**
        Pocket追加に合わせて、ユーザーPlaylistを最新化する
    */
    refreshUserPlaylistByAddingPocket: function (userId, musicId) {

        // Pocketデータを取得する
        userPocketModel.selectObjects({user_id: userId, music_id: musicId}, function (err, rows) {

            // なぜか見つからなければ終わり
            if (rows.length === 0) {
                console.log('refreshUserPlaylistByAddingPocket: pocket not found. userId=' + userId + ', musicId=' + musicId);
                return;
            }

            // 最新のものが今回追加されたPocketを判断する。
            var pocket = rows[rows.length-1];

            // ユーザープレイリスト（ALLのみ）を取得する
            userPlaylistModel.selectObjects({user_id: userId, type: 1}, function (err, rows) {

                // なぜか無い場合には終わり
                if (rows.length === 0) {
                    console.log('refreshUserPlaylistByAddingPocket: userPlaylist not found. userId=' + userId + ', type=1');
                    return;
                }

                // 今回Pocketされたものを追加する
                var playlist = rows[0];
                var pocketIds = JSON.parse(playlist.user_pocket_ids);
                pocketIds.push(pocket.id);

                // DBへ保存する
                userPlaylistModel.updateObject({user_pocket_ids: JSON.stringify(pocketIds)}, {id: playlist.id});

            });

        });
    },


    /**
        Pocket削除に合わせて、ユーザーPlaylistを最新化する
    */
    refreshUserPlaylistByDeletingPocket: function (userId, userPocketId) {
        userPocketId = parseInt(userPocketId, 10);

        // ユーザーのプレイリストを全て取得する
        userPlaylistModel.selectObjects({user_id: userId}, function (err, rows) {

            // プレイリストが無ければ終わり
            if (rows.length === 0) {
                console.log('refreshUserPlaylistByDeletingPocket: playlist not found. userId=', userId);
                return;
            }


            // 該当のPocketがあればプレイリストから削除してDBを更新する
            rows.forEach(function (playlist) {

                var pocketIds = JSON.parse(playlist.user_pocket_ids);
                var newPocketIds = _.filter(pocketIds, function (id) {
                    return id != userPocketId;
                });

                if (pocketIds.length !== newPocketIds.length) {
                    console.log('refreshUserPlaylistByDeletingPocket works. userId=' + userId + ', playlistId=' + playlist.id);
                    userPlaylistModel.updateObject({user_pocket_ids: JSON.stringify(newPocketIds)}, {id: playlist.id});
                }
            });

        });
    },




















};





































