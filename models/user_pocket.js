"use strict";
/*******************************************
 *  Model: User Pocket
 *******************************************/
var _ = require('underscore');
var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_pocket',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'music_id',
        'feeling_id',
        'tags',
        'music_link_id',
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


    /**
     * Myページとかで使うMusicエンティティと結合したデータ
     */
    selectObjectsIncludeMusic: function (conditionParam, callback) {
        conditionParam = conditionParam || {};


        // build sql.
        var columnNames = [];
        var conditions = [];
        for (var prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop) && this.hasColumn(prop)) {
                if (this.hasColumn(prop)) {
                    columnNames.push(prop);
                    conditions.push(util.format('%s=?', prop));
                }
            }
        }
        // in句
        if (conditionParam.targets) {
            if (typeof conditionParam.targets === 'string') {
                conditionParam.targets = JSON.parse(conditionParam.targets);
            }
            if (_.isArray(conditionParam.targets)) {
                var inFragment = 'user_pocket.id in (' + conditionParam.targets.join(',') + ')';
                conditions.push(inFragment);
            }
        }



        var fragment = 'select user_pocket.id, user_pocket.music_id, user_pocket.feeling_id, user_pocket.tags, user_pocket.youtube_id user_youtube_id, music.title, music.artwork_url, music.youtube_id music_youtube_id, music.itunes_url, music.song_url, music.artist_id, music.artist_name, user_pocket.create_at from user_pocket left outer join music on user_pocket.music_id = music.id ';
        var sql;
        if (conditions.length > 0) {
            sql = util.format('%s where %s', fragment, conditions.join(' and '));
        } else {
            sql = util.format(fragment);
        }


        // create params.
        var params = [];
        columnNames.forEach(function (column) {
            params.push(conditionParam[column]);
        });


        // execute sql
        this._executeQuery(sql, params, function (err, rows) {

            if (err && callback) {
                return callback(err);
            }

            // alias: youtube id.
            rows.forEach(function (row) {
                row.youtube_id = row.user_youtube_id || row.music_youtube_id;
            });

            callback(null, rows);
        });

    },






});







