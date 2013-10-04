"use strict";
/*******************************************
 *  Model: Code
 *******************************************/
var _ = require('underscore');

module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'code',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'key1',
        'key2',
        'value',
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







