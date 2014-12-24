/**
    MySQLからMongoDBへの移行プログラム
*/
var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var mysql = require('mysql');


// connect to MySQL
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'mockbu',
    password: 'mockbu',
    database: 'mockbu'
});
connection.connect();
console.log('success to connect MySQL');


// 移行対象
/*
+--------------------+
| Tables_in_mockbu   |
+--------------------+
| artist             |
| code               |
| feeling            |
| itunes_ranking     |
| music              |
| music_link         |
| pop                |
| report             |
| user               |
| user_artist_follow |
| user_follow        |
| user_notification  |
| user_playlist      |
| user_pocket        |
+--------------------+
*/
var targets = [
    'artist',
    'code',
    'feeling',
    'itunes_ranking',
    'music',
    'music_link',
    'pop',
    'report',
    'user',
    'user_artist_follow',
    'user_notification',
    'user_playlist',
    'user_pocket'
];

// 移行プログラム
var migrate = function (name, sql, callback) {
    connection.query(sql, function (err, rows) {
        var datas = [];
        for (var i = 0; i < rows.length; i++) {

            var row = rows[i];
            var data = {};

            // add data.
            for (var field in row) {
                if (row.hasOwnProperty(field)) {
                    data[field] = row[field];
                }
            }
            datas.push(data);
        }

        console.log('migration data count: ', datas.length);

        // Delete and Insert at MongoDB
        var collection = db.collection(name);
        collection.remove({}, function (err) {
            console.log('MongoDB_delete: ' + name);
            collection.insert(datas, function (err) {
                console.log('MongoDB_insert: ' + name);
                callback();
            });
        });


    });
};



var callerIko = function () {

    if (targets.length === 0) {
        db.close();
        connection.end();
        return console.log('finish successfully');
    }

    var target = targets.shift();
    var sql = util.format('select * from %s', target);
    migrate(target, sql, callerIko);
};




// MongoDBに接続
var db;
var url = 'mongodb://localhost:27017/music-drops';
MongoClient.connect(url, function (err, aDb) {
    console.log('connected to mongodb');
    db = aDb;
    callerIko();
});


























