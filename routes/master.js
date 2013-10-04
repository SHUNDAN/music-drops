/**
 *  マスタ管理画面
 */
var _ = require('underscore');
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);


exports.index = function(req, res) {
  res.render('master', { title: 'Nanairo Master Maintanance' });
};



exports.allTables = function (req, res) {

        var sql = 'select tbl_name, sql from sqlite_master';
        db.all(sql, function (err, rows) {


            var retObject = {};
            for (var i = 0; i < rows.length; i++) {

                var row = rows[i];
                var columns = [];
                var tableName = row.tbl_name;
                var sql = row.sql;

                // defaultであるやつは無視
                if (tableName === 'sqlite_sequence' || !sql) {
                    continue; 
                }

                retObject[tableName] = columns;
                console.log('sql: ', sql);

                var sql = sql.split('(')[1].split(')')[0].replace(/\n/g, '');
                console.log(sql);

                var cols = sql.split(',');
                for (var jj = 0; jj < cols.length; jj++) {
                    var col = cols[jj];
                    // trimLeft
                    while (col.indexOf(' ') === 0) {
                        col = col.substring(1, col.length);
                    }
                    console.log('col:', col);
                    columns.push(col.split(' ')[0]);
                }

            };

            console.log(retObject);



            res.json(retObject);

        }); 


};

