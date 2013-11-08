"use strict";
/*******************************************
 *  Model: User Notification
 *******************************************/
var _ = require('underscore');
var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_notification',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'type',
        'json',
        'read',
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







