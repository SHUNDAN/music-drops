/**
	古くなったお知らせを削除するバッチ

 * ########### Project Rootで実行すること ##############
*/
var fs = require('fs');

// mysql setting.
var json = fs.readFileSync('./settings/setting.json', 'utf-8');
global.mbSetting = JSON.parse(json);
var mysql = require('mysql');
global.dbConnectionPool = mysql.createPool(global.mbSetting.mysql);

// load module.
var userNotification = require('../models/user_notification');


console.log('start');

// 開始前の全体数
userNotification.countObjects(null, function (err, cnt) {

	console.log('before count: ', cnt);


	// 削除処理
	var now = new Date().getTime();
	var targetTimestamp = now - 4 * 24 * 60 * 60 * 1000;  // 4日前
	var sql = 'delete from user_notification where create_at <= ' + targetTimestamp;


	userNotification._executeQuery(sql, null, function (err) {

		if (err) {
			console.error(err);
			console.log('ERROR!!');
			return;
		}

		// 処理後の全体数
		userNotification.countObjects(null, function (err, cnt) {

			console.log('after count: ', cnt);
			console.log('finish');
		});

	});

});

