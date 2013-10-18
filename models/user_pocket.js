"use strict";
/*******************************************
 *  Model: User Pocket
 *******************************************/
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);


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
            if (conditionParam.hasOwnProperty(prop)) {
                if (this.hasColumn(prop)) {
                    columnNames.push(prop);
                    conditions.push(util.format('%s=?', prop));                    
                }
            }   
        }
        // in句
        console.log('000', conditionParam);
        if (conditionParam.targets) {
            console.log('aaa');
            if (typeof conditionParam.targets === 'string') {
                console.log('bbb');
                conditionParam.targets = JSON.parse(conditionParam.targets);
            }
            if (_.isArray(conditionParam.targets)) {
                console.log('ccc');
                var inFragment = 'user_pocket.id in (' + conditionParam.targets.join(',') + ')';
                conditions.push(inFragment);
            }
        }



        var fragment = 'select user_pocket.id, user_pocket.music_id, user_pocket.feeling_id, user_pocket.tags, user_pocket.youtube_id user_youtube_id, music.title, music.artwork_url, music.youtube_id music_youtube_id, music.song_url, music.artist_id, music.artist_name, user_pocket.create_at from user_pocket left outer join music on user_pocket.music_id = music.id ';
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
        var stmt = db.prepare(sql, params);
        console.log('stmt: ', stmt, params);
        stmt.all(function(err, rows) {
            console.log('rows.length=', rows.length);
            if (err) {
                console.log(err);
            }   

            // alias: youtube id.
            rows.forEach(function (row) {
                row.youtube_id = row.user_youtube_id || row.music_youtube_id;
            });
                    
            callback(err, (rows || []));
        }); 


    },
    





});







