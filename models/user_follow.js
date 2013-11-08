"use strict";
/*******************************************
 *  Model: User Follow
 *******************************************/
var _ = require('underscore');
var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_follow',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'dest_user_id',
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
     * 色々と不可情報を付与して返却する
     */
    selectObjects2: function (conditionParam, callback) {

        var columnNames = []; 
        var conditions = []; 
        for (var prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop)) {
                columnNames.push(prop);
                conditions.push(util.format('a.%s=?', prop));
            }   
        }   

        var selectFragment = 'a.id, a.user_id, b.name user_name, a.dest_user_id, c.name dest_user_name ';
        var fromFragment = 'user_follow as a left outer join user as b on a.user_id=b.id left outer join user as c on a.dest_user_id=c.id';

        var sql = util.format('select %s from %s ', selectFragment, fromFragment);
        if (conditions.length > 0) {
            sql += ' where ' +  conditions.join(' and ');
        } 

        // create params.
        var params = []; 
        columnNames.forEach(function (column) {
            params.push(conditionParam[column]);
        }); 


        // execute.
        this._executeQuery(sql, params, callback);
    },




});






