/**
	パッチ：曲のPOP数を設定するパッチ
*/
global.db_path = './db/mockbu.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);
var onlineBatch = require('../util/online_batch');


console.log('start');


// 曲を検索する
var musicIds = [];
db.all('select id from music', function (err, rows) {

	musicIds = rows.map(function (row) {return row.id});
	console.log('musicIds.length=', musicIds.length);

	refreshPopCount();
});


// Pop数を更新する
var exeCount = 0;
var refreshPopCount = function () {

	if (exeCount % 100 === 0 && exeCount > 0) {
		console.log(exeCount + '曲処理した');
	}

	// 終了
	if (musicIds.length === 0) {
		console.log('finish');
		return;
	}

	var id = musicIds.shift();


	// 更新
	onlineBatch.updatePopCountAtMusic(id, refreshPopCount);
};



