"use strict";
/*******************************************
 *  Model: Music_Link
 *******************************************/
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("./db/mockbu.db");


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'music_link',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'music_id',
        'user_id',
        'comment',
        'link',
        'youtube_id',
        'nico_id',
        'play_count',
        'play_count_speed',
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
     * Select: Userテーブルと結合したデータ
     */
    selectWithUser: function (conditionParam, callback) {
        conditionParam = conditionParam || {};


        // build sql.
        var columnNames = [];
        var conditions = [];
        for (var prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop) && this.hasColumn(prop)) {
                columnNames.push(prop);
                conditions.push(util.format('a.%s=?', prop));
            }
        }

        var sql = 'select a.id, a.music_id, a.user_id, b.name user_name, a.comment, a.link, a.youtube_id, a.nico_id, ' +
                    ' a.create_at, a.update_at from music_link as a left outer join user as b on a.user_id = b.id ';
        // var sql = 'select a.id, a.music_id, a.user_id, a.comment, a.link, a.youtube_id, a.nico_id, ' +
        //             ' a.create_at, a.update_at from music_link as a ';
        if (conditions.length > 0) {
            sql = sql + ' where ' + conditions.join(' and ');
            // sql = sql + ' where music_id=9422';
        }


        // create params.
        var params = [];
        columnNames.forEach(function (column) {
            params.push(conditionParam[column]);
        });


        // execute sql
        var stmt = db.prepare(sql, params);
        console.log('stmt: ', stmt, params);
        stmt.all(function(err, rows) {
            rows = rows || [];
            if (err) {
                console.log(err);
            }

            console.log('count=', rows.length);
            callback(err, (rows || []));
        });

    },



    /**
     * Add Play Count
     */
    addPlayCount: function (id, callback) {

        var sql = 'update music_link set play_count = (case when play_count is null then 1 else play_count + 1 end), play_count_speed = (case when play_count_speed is null then 1 else play_count_speed + 1 end) where id=' + id;

        console.log(sql);
        db.run(sql, function () {
            if (callback) {
                callback();
            }
        });

    },
















});







