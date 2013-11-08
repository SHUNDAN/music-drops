/**
    POPの改行を削除する
*/
var fs = require('fs');


// mysql setting.
var json = fs.readFileSync('./settings/setting.json', 'utf-8');
global.mbSetting = JSON.parse(json);
var mysql = require('mysql');
global.dbConnectionPool = mysql.createPool(global.mbSetting.mysql);

var popModel = require('../../models/pop');



// 全件取得する
var pops;
popModel.selectObjects(null, function (err, rows) {
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

        popModel.updateObject({comment:newComment}, {id:pop.id}, function () {
            console.log('remove line break. id=', pop.id);
            trimLineBreak();
        });


    } else {
        trimLineBreak();
    }

}












