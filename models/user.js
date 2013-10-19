"use strict";
/*******************************************
 *  Model: User
 *******************************************/
var _ = require('underscore');
// var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);
var userPocketModel = require('./user_pocket');
var userFollowModel = require('./user_follow');
var userArtistFollowModel = require('./user_artist_follow');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'password',
        'name',
        'sex',
        'birthday',
        'thumb_url',
        'pocket_filter',    // JSON: JavaScript Array of User Pocket Filter.
        'like_pop',         // JSON: JavaScript Array of User like Pop Id.
        'uid',
        'google_identifier',
        'facebook_access_token',
        'twitter_token',
        'twitter_token_secret',
        'create_at',
        'update_at',
    ],


    /**
     *  Insertしないカラム
     */
    excludeInsColumns: [
        'id'
    ],



    /**
     * UID保持ユーザーを取得する
     */
    selectUIDUser: function (callback) {

        var sql = 'select id, uid from user where uid is not null';
        db.all(sql, function (err, rows) {
            callback(rows || []);
        });

    },
    


    /**
        ログイン時に返却するユーザーの色々な情報を取得する
    */
    selectObject2: function (condition, callback) {

        var userId;

        // ユーザー情報
        var user;
        this.selectObjects(condition, function (err, rows) {

            // ユーザー情報が無ければ終わり。
            if (rows.length === 0) {
                callback(null);
                return;
            } else {
                userId =rows[0].id;
            }

            // ユーザー情報、Like一覧GET
            user = rows[0];
            delete user.password;
            delete user.uid;
            delete user.sex;
            delete user.google_identifier;
            delete user.facebook_access_token;
            delete user.twitter_token;
            delete user.twitter_token_secret;


            // Pocket一覧
            userPocketModel.selectObjects({user_id:userId}, function (err, rows) {
                user.userPockets = rows;

                // ユーザーフォロー一覧
                userFollowModel.selectObjects({user_id:userId}, function (err, rows) {
                    user.userFollows = rows;

                    // フォローアーティスト一覧
                    userArtistFollowModel.selectObjects({user_id:userId}, function (err, rows) {
                        user.userArtistFollows = rows;

                        // 返却
                        callback(user);
                    });

                });

            })




        });




    },












});







