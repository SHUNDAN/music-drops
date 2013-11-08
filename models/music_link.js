"use strict";
/*******************************************
 *  Model: Music_Link
 *******************************************/
var _ = require('underscore');
var util = require('util');


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


        // execute.
        this._executeQuery(sql, params, callback);
    },



    /**
     * Add Play Count
     */
    addPlayCount: function (id, callback) {

        id = parseInt(id, 10);
        if (isNaN(id)) {
            console.log('model#music_link#addPlayCount id is not number.');
            callback({message: 'id is invalid.'});
        }

        var sql = 'update music_link set play_count = (case when play_count is null then 1 else play_count + 1 end), play_count_speed = (case when play_count_speed is null then 1 else play_count_speed + 1 end) where id=' + id;

        // execute.
        this._executeQuery(sql, null, callback);
    },
















});







