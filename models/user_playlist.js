"use strict";
/*******************************************
 *  Model: User Playlist
 *******************************************/
var _ = require('underscore');
// var util = require('util');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(global.db_path);


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


});







