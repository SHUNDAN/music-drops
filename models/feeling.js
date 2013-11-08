"use strict";
/*******************************************
 *  Model: Feeling 
 *******************************************/
var _ = require('underscore');
// var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'feeling',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'name',
        'create_at',
        'update_at',
    ],




    





});







