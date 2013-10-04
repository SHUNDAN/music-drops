"use strict";
/*******************************************
 *  Model: Music
 *******************************************/
var _ = require('underscore');
// var util = require('util');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database("./db/mockbu.db");


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'music',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'title',
        'artwork_url',
        'song_url',
        'artist_id',
        'artist_name',
        'genre_id',
        'itunes_url',
        'youtube_id',
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







