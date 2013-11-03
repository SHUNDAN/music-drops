/**
	古くなったお知らせを削除するバッチ
*/
global.db_path = './db/mockbu.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);
var userNotification = require('../models/user_notification');


console.log('start');

// 開始前の全体数
userNotification.countObjects(null, function (err, cnt) {

	console.log('before count: ', cnt);


	// 削除処理
	var now = new Date().getTime();
	var targetTimestamp = now - 4 * 24 * 60 * 60 * 1000;  // 4日前
	var sql = 'delete from user_notification where create_at <= ' + targetTimestamp;
	db.run(sql, function (err) {


		// 処理後の全体数
		userNotification.countObjects(null, function (err, cnt) {

			console.log('after count: ', cnt);
			console.log('finish');
		});

	});

});

