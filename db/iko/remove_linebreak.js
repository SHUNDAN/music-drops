/**
    POPの改行を削除する
*/
global.db_path = './db/mockbu.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.db_path);

// 全件取得する
var pops;

db.all('select id, comment from pop', function (err, rows) {
    console.log('target count = ', rows.length);

    pops = rows;
    trimLineBreak();
});


var trimLineBreak = function () {

    // end judge
    if (pops.length === 0) {
        console.log('finish');
        process.exit();
        return;
    }

    var pop = pops.shift();
    var newComment = pop.comment.replace(/\n/g, '');
    if (pop.comment !== newComment) {

        var sql = 'update pop set comment="'+newComment+'" where id=' + pop.id;
        db.run(sql, function (err) {

            if (err) {
                return process.exit(1);
            }

            console.log('remove line break. id=', pop.id);
            trimLineBreak();

        });


    } else {
        trimLineBreak();
    }

}












