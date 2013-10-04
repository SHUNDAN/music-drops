/*
 *  Mockbu2 Master JS
 *
 */
window.mb = window.mb || {};



/*! sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */(function(e){function r(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}function i(e,t){for(var n=[];t>0;n[--t]=e);return n.join("")}var t=function(){return t.cache.hasOwnProperty(arguments[0])||(t.cache[arguments[0]]=t.parse(arguments[0])),t.format.call(null,t.cache[arguments[0]],arguments)};t.format=function(e,n){var s=1,o=e.length,u="",a,f=[],l,c,h,p,d,v;for(l=0;l<o;l++){u=r(e[l]);if(u==="string")f.push(e[l]);else if(u==="array"){h=e[l];if(h[2]){a=n[s];for(c=0;c<h[2].length;c++){if(!a.hasOwnProperty(h[2][c]))throw t('[sprintf] property "%s" does not exist',h[2][c]);a=a[h[2][c]]}}else h[1]?a=n[h[1]]:a=n[s++];if(/[^s]/.test(h[8])&&r(a)!="number")throw t("[sprintf] expecting number but found %s",r(a));switch(h[8]){case"b":a=a.toString(2);break;case"c":a=String.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=h[7]?a.toExponential(h[7]):a.toExponential();break;case"f":a=h[7]?parseFloat(a).toFixed(h[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=String(a))&&h[7]?a.substring(0,h[7]):a;break;case"u":a>>>=0;break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(h[8])&&h[3]&&a>=0?"+"+a:a,d=h[4]?h[4]=="0"?"0":h[4].charAt(1):" ",v=h[6]-String(a).length,p=h[6]?i(d,v):"",f.push(h[5]?a+p:p+a)}}return f.join("")},t.cache={},t.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw"[sprintf] huh?";if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw"[sprintf] huh?";s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw"[sprintf] huh?";s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";r.push(n)}t=t.substring(n[0].length)}return r};var n=function(e,n,r){return r=n.slice(0),r.splice(0,0,e),t.apply(null,r)};e.sprintf=t,e.vsprintf=n})(typeof exports!="undefined"?exports:window);









(function() {

    mb.$stage = $('#main');



    // 最初にテーブル定義を取得
    $.ajax({
        url: '/ap1/v1.1/master/all_tables',
        dataType: 'json',
        success: function (json) {

            mb.allTables = json;
            _.each(_.keys(json), function (tableName) {
                var columns = json[tableName];
                loadData(tableName, columns);
            });

        },
        error: function () {
            alert('error');
            console.log('load all_tables error', arguments);
        }

    });



    // 各テーブルの情報を取得する 
    var loadData = function (table, columns) {
        console.log('createTable:', table, columns);
        var $area = $('<div class="mb30"/>');
        mb.$stage.append($area);


        // マスタ情報を取得する
        $.ajax({
            url: '/api/v1/' + table + 's',
            dataType: 'json',
            success: function (json) {
                showData($area, table, columns, json);
            },
            error: function () {
                console.log('/api/v1/' + table + 's error.', arguments);
            },
        });
    };


    // テーブル表示
    var showData = function ($area, table, columns, json) {

        $area.append(sprintf('<h3>%s</h3>', table));
        var $table = $('<table class="table"/>');
        $area.append($table);
        var $tr = $('<tr/>');
        $table.append($tr);
        _.each(columns, function (col) {
            var $td = $(sprintf('<th>%s</th>', col));
            $tr.append($td);
        });
        $tr.append('<th>Action</th>');
        _.each(json, function (row) {
            var $tr = $(sprintf('<tr data-table="%s"/>', table));
            $table.append($tr);
            _.each(columns, function (col) {
                var $td = $(sprintf('<td contenteditable="true" data-column="%s" data-event="update">%s</td>', col, row[col]));
                $tr.append($td);
            });
            $tr.append('<td><div class="btn btn-danger" data-event="delete">D</div></td>');
        });

        // 追加用の行
        var $tr = $(sprintf('<tr data-table="%s"/>', table));
        $table.append($tr);
        _.each(columns, function (col) {
            var $td = $(sprintf('<td contenteditable="true" data-column="%s"></td>', col));
            $tr.append($td);
        });
        $tr.append('<td><div class="btn btn-primary" data-event="add">A</div></td>');



        bindEvent();
    };


    // イベントバインド
    var bindEvent = function () {
        $('[data-event="update"]').off().on('blur', updateObject);
        $('[data-event="delete"]').off().on('click', deleteObject);
        $('[data-event="add"]').off().on('click', addObject);
    };


    // 更新処理
    var updateObject = function (e) {
        var $tr = $(e.currentTarget).parents('tr');
        var table = $tr.data('table');
        var data = createPostData($tr);
        var url = '/api/v1.1/' + table + 's/' + data.id + '/update';
        console.log('update', table, data, url);

        $.ajax({
            url: url,
            data: data,
            method: 'post',
            dataType: 'json',
            success: function (json) {
                console.log('success: ', url);
            },
            error: function () {
                console.log('error: ', url, arguments);
            }
        });

    };


    // 削除処理
    var deleteObject = function (e) {
        console.log('delete');
    };


    // 追加処理
    var addObject = function (e) {
        console.log('add');
    };


    // Postデータ作成
    var createPostData = function ($tr) {
        
        var data = {};
        
        $tr.find('[data-column]').each(function () {
            var key = $(this).data('column');
            var val = $(this).text();
            data[key] = val;
        });

        return data;
    };

























/**
 *  ページ開いた時の処理
 */
$(function() {
    refreshTable('feeling');
    refreshTable('music');
    refreshTable('pop');
    refreshTable('user');
});


/*
 *  マスタデータをロードする
 */
function loadData(url, params, callback) {

    $.ajax({
        url: url,
        data: params,
        dataType: 'json',
        success: callback,
        error: function() {
            alert('エラー！');
            console.log('load master error', url, params, arguments);
        },
    });

};


/**
    Feelingテーブルの表示を最新化する
*/
var refreshTable = function(table) {

    
    // Feelingテーブル一覧を取得
    if (table === 'feeling') {
        loadData('/api/v1/feelings', null, function(json) {
            $tbody = $('#feelingTableBody').empty();
            for (var i = 0; i < json.data.length; i++) {
                var feeling = json.data[i];
                var $tr = $('<tr/>');
                $tr.append('<td data-col="id">'+feeling.id+'</td>');
                $tr.append('<td data-col="name">'+feeling.name+'</td>');
                $tr.append('<td><div class="btn mr5 btn-warning" data-event="update" data-type="feeling">U</div><div class="btn btn-danger" data-event="delete" data-type="feeling">D</div></td>');
                $tbody.append($tr);
            }
            // 追加用のカラムを置く
            var $tr = $('<tr/>');
            $tr.append('<td data-col="id"></td>');
            $tr.append('<td data-col="name"></td>');
            $tr.append('<td><div id="addFeeling" class="btn mr5 btn-success" contenteditable="false">A</div></td>');
            $tbody.append($tr);
        
            bindEvent();
        });
    }

    // Pop
    if (table == 'pop') {
        loadData('/api/v1/pops', null, function(json) {
          console.log('/api/v1/pops', json);
          var $body = $('#popTableBody').empty();
          for (var i = 0; i < json.data.length; i++) {
            var data = json.data[i];
            var $tr = $('<tr/>');
            $tr.append('<td data-col="id">'+data.id+'</td>');
            $tr.append('<td data-col="feeling_id">'+data.feeling_id+'</td>');
            $tr.append('<td data-col="music_id">'+data.music_id+'</td>');
            $tr.append('<td data-col="user_id">'+data.user_id+'</td>');
            $tr.append('<td data-col="comment">'+data.comment+'</td>');
                $tr.append('<td><div class="btn mr5 btn-warning" data-event="update" data-type="pop">U</div><div class="btn btn-danger" data-event="delete" data-type="pop">D</div></td>');
            $body.append($tr);
          }
          // 追加用のカラムを置く
          var $tr = $('<tr/>');
          $tr.append('<td data-col="id"></td>');
          $tr.append('<td data-col="feeling_id"></td>');
          $tr.append('<td data-col="music_id"></td>');
          $tr.append('<td data-col="user_id"></td>');
          $tr.append('<td data-col="comment"></td>');
          $tr.append('<td><div id="addPop" class="btn mr5 btn-success" contenteditable="false">A</div></td>');
          $body.append($tr);
          bindEvent();
        });
    }

    // Music
    if (table === 'music') {
        loadData('/api/v1/musics', null, function(json) {
          console.log('/api/v1/musics', json);
          var $body = $('#musicTableBody').empty();
          for (var i = 0; i < json.data.length; i++) {
            var data = json.data[i];
            var $tr = $('<tr/>');
            $tr.append('<td data-col="id">'+data.id+'</td>');
            $tr.append('<td data-col="title">'+data.title+'</td>');
            $tr.append('<td data-col="artist_name">'+data.artist_name+'</td>');
            $tr.append('<td data-col="artwork_url">'+data.artwork_url+'</td>');
            $tr.append('<td data-col="song_url">'+data.song_url+'</td>');
            $tr.append('<td data-col="itunes_url">'+data.itunes_url+'</td>');
                $tr.append('<td><div class="btn mr5 btn-warning" data-event="update" data-type="music">U</div><div class="btn btn-danger" data-event="delete" data-type="music">D</div></td>');
            $body.append($tr);
          }
          // 追加用のカラムを置く
          var $tr = $('<tr/>');
          $tr.append('<td data-col="id"></td>');
          $tr.append('<td data-col="title"></td>');
          $tr.append('<td data-col="artist_name"></td>');
          $tr.append('<td data-col="artwork_url"></td>');
          $tr.append('<td data-col="song_url"></td>');
          $tr.append('<td data-col="itunes_url"></td>');
          $tr.append('<td><div id="addMusic" class="btn mr5 btn-success" contenteditable="false">A</div></td>');
          $body.append($tr);
        
            bindEvent();
        });
    }


    // User
    if (table === 'user') {
        loadData('/api/v1/users', null, function(json) {
          console.log('/api/v1/users', json);
          var $body = $('#userTableBody').empty();
          for (var i = 0; i < json.data.length; i++) {
            var data = json.data[i];
            var $tr = $('<tr/>');
            $tr.append('<td data-col="id">'+data.id+'</td>');
            $tr.append('<td data-col="name">'+data.name+'</td>');
            $tr.append('<td data-col="thumb_url">'+data.thumb_url+'</td>');
                $tr.append('<td><div class="btn mr5 btn-warning" data-event="update" data-type="user">U</div><div class="btn btn-danger" data-event="delete" data-type="user">D</div></td>');
            $body.append($tr);
          }
          // 追加用のカラムを置く
          var $tr = $('<tr/>');
          $tr.append('<td data-col="id"></td>');
          $tr.append('<td data-col="name"></td>');
          $tr.append('<td data-col="thumb_url"></td>');
          $tr.append('<td><div id="addUser" class="btn mr5 btn-success" contenteditable="false">A</div></td>');
          $body.append($tr);
          bindEvent();
        });
    }
};


// 各種ボタンにイベントを割り当て得る
var bindEventAAAA = function() {
    
    // Feelingの追加ボタン
    $('#addFeeling').off().on('click', function(e) {

        var $tr = $(e.currentTarget).parents('tr');
        var id = $tr.find('[data-col="id"]').text();
        var name = $tr.find('[data-col="name"]').text();
        console.log(id, name);

        $.ajax({
            url: '/api/v1.1/feelings', 
            method: 'post',
            data: {id:id, name:name},
            success: function() {
                console.log('/api/v1/feelings post successed');
                refreshTable('feeling');
            },
            error: function() {console.log('/api/v1/feelings post error');}
        });
    });


    // Musicの追加ボタン
    $('#addMusic').off().on('click', function(e) {

        var $tr = $(e.currentTarget).parents('tr');
        var data = {
            title: $tr.find('[data-col="title"]').text(),
            artist_name: $tr.find('[data-col="artist_name"]').text(),
            artwork_url: $tr.find('[data-col="artwork_url"]').text(),
            song_url: $tr.find('[data-col="song_url"]').text(),
            itunes_url: $tr.find('[data-col="itunes_url"]').text(),
        };
        console.log(data);

        $.ajax({
            url: '/api/v1.1/musics', 
            method: 'post',
            data: data,
            success: function() {
                console.log('/api/v1/musics post successed');
                refreshTable('music');
            },
            error: function() {console.log('/api/v1/musics post error');}
        });
    });

    // Popの追加ボタン
    $('#addPop').off().on('click', function(e) {

        var $tr = $(e.currentTarget).parents('tr');
        var data = {
            feeling_id: $tr.find('[data-col="feeling_id"]').text(),
            music_id: $tr.find('[data-col="music_id"]').text(),
            user_id: $tr.find('[data-col="user_id"]').text(),
            comment: $tr.find('[data-col="comment"]').text(),
        };
        console.log(data);

        $.ajax({
            url: '/api/v1.1/pops', 
            method: 'post',
            data: data,
            success: function() {
                console.log('/api/v1/pops post successed');
                refreshTable('pop');
            },
            error: function() {console.log('/api/v1/pops post error');}
        });
    });

    // Userの追加ボタン
    $('#addUser').off().on('click', function(e) {

        var $tr = $(e.currentTarget).parents('tr');
        var data = {
            name: $tr.find('[data-col="name"]').text(),
            thumb_url: $tr.find('[data-col="thumb_url"]').text(),
        };
        console.log(data);

        $.ajax({
            url: '/api/v1.1/users', 
            method: 'post',
            data: data,
            success: function() {
                console.log('/api/v1/users post successed');
                refreshTable('user');
            },
            error: function() {console.log('/api/v1/user post error');}
        });
    });


    
    // 更新系ボタン
    $('[data-event="updateAAA"]').off().on('click', function(e) {

        var $this = $(e.currentTarget);
        var type = $this.data('type');
        var $tr = $this.parents('tr');
        var id = $tr.children('[data-col="id"]').text();

        var postData = {};
        $tr.children('[data-col]').each(function() {
            var prop  = $(this).data('col');
            var value = $(this).text();
            postData[prop] = value;
        });
        console.log(postData);

        // APIコール
        $.ajax({
            url: sprintf('/api/v1.1/%ss/%s/update', type, id),
            method: 'POST',
            data: postData,
            dataType: 'json',
            success: function(json) {
                console.log('post successed.', type, json);
                refreshTable(type);
            },
            error: function() {console.log('update error.', type, postData);}
        });
    });


    // 削除系ボタン
    $('[data-event="deleteAAA"]').off().on('click', function(e) {

        var $this = $(e.currentTarget);
        var type = $this.data('type');
        var $tr = $this.parents('tr');
        var id = $tr.children('[data-col="id"]').text();

        // APIコール
        $.ajax({
            url: sprintf('/api/v1/%ss/%s', type, id),
            method: 'DELETE',
            dataType: 'json',
            success: function(json) {
                console.log('delete successed.', type, json);
                refreshTable(type);
            },
            error: function() {console.log('delete error.', type);}
        });
    });








};
bindEvent();


















})();

