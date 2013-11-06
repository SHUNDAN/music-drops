/**
    POPの改行を削除する
*/
global.db_path = './db/mockbu-dev.db';
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












