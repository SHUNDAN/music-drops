"use strict";
/*******************************************
 *  Model: Music
 *******************************************/
var _ = require('underscore');
// var util = require('util');


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
        'feeling_id',
        'play_count',
        'play_count_speed',
        'pop_count',
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
     * 再生数追加
     */
    addPlayCount: function (musicId, callback) {

        musicId = parseInt(musicId, 10);
        if (isNaN(musicId)) {
            console.log('model#music#addPlayCount musicId is not number.');
            callback({message: 'musicId is invalid.'});
        }

        var sql = 'update music set play_count = (case when play_count is null then 1 else play_count + 1 end), play_count_speed = (case when play_count_speed is null then 1 else play_count_speed + 1 end) where id=' + musicId;

        // execute.
        this._executeQuery(sql, null, callback);
    },
    





});







