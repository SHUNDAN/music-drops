"use strict";
/*******************************************
 *  Model: Report
 *******************************************/
var _ = require('underscore');
// var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'report',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'type',
        'user_id',
        'json',
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







