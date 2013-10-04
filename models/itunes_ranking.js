"use strict";
/*******************************************
 *  Model:iTunes Ranking 
 *******************************************/
var _ = require('underscore');

module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'itunes_ranking',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'ranking',
        'genre_id',
        'genre_name',
        'music_id',
        'title',
        'artwork_url',
        'song_url',
        'artist_id',
        'artist_name',
        'itunes_url',
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







