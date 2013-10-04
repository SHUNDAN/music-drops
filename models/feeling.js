"use strict";
/*******************************************
 *  Model: Feeling 
 *******************************************/
var _ = require('underscore');
// var util = require('util');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database("./db/mockbu.db");


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







