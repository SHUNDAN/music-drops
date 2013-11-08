"use strict";
/*******************************************
 *  Model: User Artist Follow
 *******************************************/
var _ = require('underscore');
// var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_artist_follow',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'artist_id',
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
     * 色々と情報を付与した情報を得る
     */
    selectObjects2: function (condition, callback) {

        // build conditions.
        var querys = [];
        var values = [];
        if (condition.user_id) {
            querys.push('a.user_id=?');
            values.push(condition.user_id);
        }
        if (condition.artist_id) {
            querys.push('a.artist_id=?');
            values.push(condition.artist_id);
        }
        var query = '';
        if (querys.length > 0) {
            query = ' where ' + querys.join(' and ');
        }


        // build sql.
        var sql = [
            'select',
            'a.id, a.user_id, b.name user_name, a.artist_id, c.name artist_name, a.create_at, a.update_at',
            'from user_artist_follow a',
            'left outer join user b on a.user_id = b.id',
            'left outer join artist c on a.artist_id = c.id',
            query,
            'limit 300',
        ].join(' ');


        // execute.
        this._executeQuery(sql, values, callback);
    },










































});






