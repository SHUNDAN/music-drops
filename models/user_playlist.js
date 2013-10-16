"use strict";
/*******************************************
 *  Model: User Playlist
 *******************************************/
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_playlist',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'type',
        'title',
        'seq',
        'user_pocket_ids',
        'dest_playlist_id',
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
     *
     */
    selectFollowPlaylists: function (conditions, callback) {

        var sql = [
            'select a.id, b.title, b.user_pocket_ids, b.user_id, c.name user_name',
            'from user_playlist a',
            'left outer join user_playlist b on a.dest_playlist_id = b.id',
            'left outer join user c on b.user_id = c.id',
            'where a.user_id=?'
        ].join(' ');


        // select.
        var stmt = db.prepare(sql, [conditions.user_id]);
        stmt.all(sql, function (err, rows) {
            callback(err, rows || []);
        });

    },



















});







