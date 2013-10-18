"use strict";
/*******************************************
 *  Model: Pop
 *******************************************/
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);

module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'pop',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'feeling_id',
        'music_id',
        'comment',
        'user_id',
        'like_count',
        'like_count_speed',
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
     * Pop + Music
     */
    selectPopsWithMusic: function (params, callback) {

        // create conditions.
        var conditions = [];
        var values = [];
        if (params.feeling_id) {
            conditions.push('pop.feeling_id = ?');
            values.push(params.feeling_id);
        }
        if (params.music_id) {
            conditions.push('pop.music_id = ?');
            values.push(params.music_id);
        }
        if (params.user_id) {
            conditions.push('pop.user_id = ?');
            values.push(params.user_id);
        }
        var conditionSql = conditions.join(' and ');
        if (conditions.length > 0) {
            conditionSql = ' where ' + conditionSql;
        }


        // create limit.
        var limit = 300;
        if (params.limit) {
            limit = Math.min(limit, params.limit);
            if (isNaN(limit)) {
                limit = 300;
            }
        }

        // create offset.
        var offset = 0;
        if (params.offset) {
            offset = parseInt(params.offset, 10);
            if (isNaN(offset) || offset < 0) {
                offset = 0;
            }
        }


        // order.
        var sortKey = 'create_at';
        var sortOrder = 'desc';
        if (params.sortKey && this.hasColumn(params.sortKey)) {
            sortKey = params.sortKey;
        }
        if (params.sortOrder && (params.sortOrder === 'desc' || params.sortOrder === 'asc')) {
            sortOrder = params.sortOrder;
        }


        var sql = [
            'select',

            'pop.music_id, music.title, music.artist_name, music.artist_id, pop.create_at, ',
            'music.artwork_url, music.song_url, music.itunes_url, music.youtube_id,',
            'pop.id, pop.feeling_id, pop.comment, pop.user_id, pop.like_count, pop.like_count_speed, user.name user_name',

            'from pop',
            'left outer join music on pop.music_id = music.id',
            'left outer join user on pop.user_id = user.id',

            conditionSql,

            'order by pop.' + sortKey + ' ' + sortOrder,
            'limit ' + limit,
            'offset ' + offset
        ].join(' ');


        // execute
        var stmt = db.prepare(sql, values);
        console.log('stmt: ', stmt);
        stmt.all(function (err, rows) {
            if (err) {
                console.log('err: ', err);
            }
            if (callback) {
                callback(err, rows || []);
            }
        });


    },


    /**
     * Like Pop
     */
    incrementLike: function (popId, callback) {

        var sql = util.format('update pop set like_count = (case when like_count is null then 1 else like_count+1 end), like_count_speed = (case when like_count_speed is null then 1 else like_count_speed+1 end) where id = %d', popId); 
        console.log('sql: ', sql);

        db.run(sql, function (err) {
            
            if (callback) {
                callback(err);
            }
        });

    },


    /**
     * Dislike Pop
     */
    decrementLike: function (popId, callback) {

        var sql = util.format('update pop set like_count = (case when like_count <= 0  then 0 else like_count-1 end) where id = %d', popId); 
        console.log('sql: ', sql);

        db.run(sql, function (err) {
            
            if (callback) {
                callback(err);
            }
        });

    },











});






























