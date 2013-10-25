"use strict";
/****************************************
 *  Common Model
 ****************************************/
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);

module.exports = {


    /**
     *  テーブル名
     */
    tableName: null,


    /**
     *  Modelで利用するColumnを設定する
     */
    columns: [],


    /**
     *  Insertで利用しないカラム
     */
    excludeInsColumns: [],


    /**
     * 検索で使う特別なパラメータ
     */
    specialParams: ['limit', 'lt', 'lte', 'gt', 'gte', 'sort', 'desc'],


    /**
     *  指定された名前がColumnsに含まれるか
     */
    hasColumn: function (name) {
        return _.contains(this.columns, name);
    },


    /**
     * デフォルトのLimit
     */
    limit: 300,


    /**
     * Select
     */
    selectObjects: function (conditionParam, callback) {
        conditionParam = conditionParam || {};


        // Add Equal Condition.
        var conditions = [];
        var params = [];
        for (var prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop) && this.hasColumn(prop)) {
                conditions.push(util.format('%s=?', prop));
                params.push(conditionParam[prop]);
            }
        }

        // Add Range Condition.
        var ranges = ['lt', 'lte', 'gt', 'gte'];
        var operators = ['<', '<=', '>', '>='];
        for (var i = 0; i < ranges.length; i++) {
            var key = ranges[i];
            if (conditionParam.hasOwnProperty(key)) {
                var columnObject = conditionParam[key];
                for (var column in columnObject) {
                    if (columnObject.hasOwnProperty(column) && _.contains(this.columns, column)) {
                        conditions.push(util.format('%s %s ?', column, operators[i]));
                        params.push(columnObject[column]);
                    }
                }
            }
        }

        // build sql.
        var sql;
        if (conditions.length > 0) {
            sql = util.format('select * from %s where %s', this.tableName, conditions.join(' and '));
        } else {
            sql = util.format('select * from %s', this.tableName);
        }


        // Add Order by.
        if (conditionParam.sort && typeof conditionParam.sort === 'string') {
            sql += util.format(' order by %s %s', conditionParam.sort, (conditionParam.desc ? 'desc' : 'asc'));
        }



        // Add Limit.
        var limit = Math.min((conditionParam.limit || this.limit), this.limit);
        if (typeof limit !== 'number' || isNaN(limit)) {
            console.warn('limit is not number. limit=', conditionParam.limit);
            callback({message: 'bad request'});
            return;
        }
        sql +=　' limit ' + limit;



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



    /**
     * Insert
     */
    insertObject: function(data, callback) {

        // inject common columns.
        var now = new Date();
        data.create_at = now.getTime();
        data.update_at = now.getTime();


        // build sql.
        // Example: insert into music(title, artwork_url, song_url, artist_name, itunes_url, create_at, update_at) values (?, ?, ?, ?, ?, ?, ?)
        var columnNames = [];
        this.columns.forEach(_.bind(function (column) {
            if (_.contains(this.excludeInsColumns, column) === false) {
                columnNames.push(column);
            }
        }, this));
        var queries = [];
        for (var i = 0; i < columnNames.length; i++) {
            queries.push('?');
        }
        var sql = util.format('insert into %s (%s) values (%s)', this.tableName, columnNames.join(','), queries.join(','));


        // build parameters.
        var params = [];
        columnNames.forEach(function (column) {
            params.push(data[column]);
        });


        // execute sql.
        console.log(sql);
        var stmt = db.prepare(sql, params);
        // console.log(stmt, params, data);
        stmt.run(function(err) {
            if (err) {
                console.log(err);                
            }
            if (callback) {
                callback(err);
            }
        });
    },



    /*
     * Update
     */
    updateObject: function (data, conditionParam, callback) {

        // inject common column.
        data.update_at = new Date().getTime();



        // build sql.
        // Example: update music set title=?, artwork_url=?, song_url=?, artist_name=?, itunes_url=?, update_at=? where id=?
        var columnNames = [];
        var targets = [];
        for (var prop in data) {
            if (data.hasOwnProperty(prop) && data[prop]) {
                if (this.hasColumn(prop)) {
                    columnNames.push(prop);
                    targets.push(util.format('%s=?', prop));
                }
            }
        }
        var columnNames2 = [];
        var conditions = [];
        for (prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop)) {
                if (this.hasColumn(prop)) {
                    columnNames2.push(prop);
                    conditions.push(util.format('%s=?', prop));
                }
            }
        }
        var sql = util.format('update %s set %s where %s', this.tableName, targets.join(','), conditions.join(' and '));


        // build parameters.
        var params = [];
        columnNames.forEach(function (column) {
            params.push(data[column]);
        });
        columnNames2.forEach(function (column) {
            params.push(conditionParam[column]);
        });


        // execute sql.
        var stmt = db.prepare(sql, params);
        console.log('stmt: ', stmt, params);
        stmt.run(function (err) {
            console.log(err);
            if (callback) {
                callback(err);
            }
        });

    },



    /**
     * Delete
     */
    deleteObject: function (conditionParam, callback) {

        // build sql.
        // Example: delete from music where id = ?
        var columnNames = [];
        var conditions = [];
        for (var prop in conditionParam) {
            if (conditionParam.hasOwnProperty(prop)) {
                columnNames.push(prop);
                conditions.push(util.format('%s=?', prop));
            }
        }
        var sql = util.format('delete from %s where %s', this.tableName, conditions.join(' and '));


        // build params.
        var params = [];
        columnNames.forEach(function (column) {
            params.push(conditionParam[column]);
        });


        // execute sql.
        var stmt = db.prepare(sql, params);
        console.log(stmt);
        stmt.run(function (err) {
            console.log(err);
            if (callback) {
                callback(err);
            }
        });

    },



    /**
     * Delete All
     */
    deleteObjects: function (callback) {

        var sql = util.format('delete from %s', this.tableName);
        console.log(sql);

        // execute sql.
        db.run(sql, function (err) {
            console.log(err);
            callback(err);
        });

    },








































};
