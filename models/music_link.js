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
            if (conditionParam.hasOwnProperty(prop)) {
                columnNames.push(prop);
                conditions.push(util.format('a.%s=?', prop));
            }   
        }   

        var sql = 'select a.id, a.music_id, a.user_id, b.name user_name, a.comment, a.link, a.youtube_id, a.nico_id, ' + 
                    ' a.create_at, a.update_at from music_link as a left outer join user as b on a.user_id = b.id ';
        if (conditions.length > 0) {
            sql = sql + ' where ' + conditions.join(' and ');
        }
        console.log('sql!!!!!', sql); 


        // create params.
        var params = []; 
        columnNames.forEach(function (column) {
            params.push(conditionParam[column]);
        }); 

    
        // execute sql
        var stmt = db.prepare(sql, params);
        console.log('stmt: ', stmt, params);
        stmt.all(function(err, rows) {
            if (err) {
                console.log(err);
            }   
    
            callback(err, (rows || []));
        }); 





    },
    





});







