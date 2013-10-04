"use strict";
/*******************************************
 *  Model: User
 *******************************************/
var _ = require('underscore');
// var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);


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
    





});







