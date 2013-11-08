"use strict";
/*******************************************
 *  Model: Artist
 *******************************************/
var _ = require('underscore');
// var util = require('util');

module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'artist',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'name',
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







