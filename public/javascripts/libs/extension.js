"use strict";

// namespace.
window.mb = window.mb || {};



/*! sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */(function(e){function r(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}function i(e,t){for(var n=[];t>0;n[--t]=e);return n.join("")}var t=function(){return t.cache.hasOwnProperty(arguments[0])||(t.cache[arguments[0]]=t.parse(arguments[0])),t.format.call(null,t.cache[arguments[0]],arguments)};t.format=function(e,n){var s=1,o=e.length,u="",a,f=[],l,c,h,p,d,v;for(l=0;l<o;l++){u=r(e[l]);if(u==="string")f.push(e[l]);else if(u==="array"){h=e[l];if(h[2]){a=n[s];for(c=0;c<h[2].length;c++){if(!a.hasOwnProperty(h[2][c]))throw t('[sprintf] property "%s" does not exist',h[2][c]);a=a[h[2][c]]}}else h[1]?a=n[h[1]]:a=n[s++];if(/[^s]/.test(h[8])&&r(a)!="number")throw t("[sprintf] expecting number but found %s",r(a));switch(h[8]){case"b":a=a.toString(2);break;case"c":a=String.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=h[7]?a.toExponential(h[7]):a.toExponential();break;case"f":a=h[7]?parseFloat(a).toFixed(h[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=String(a))&&h[7]?a.substring(0,h[7]):a;break;case"u":a>>>=0;break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(h[8])&&h[3]&&a>=0?"+"+a:a,d=h[4]?h[4]=="0"?"0":h[4].charAt(1):" ",v=h[6]-String(a).length,p=h[6]?i(d,v):"",f.push(h[5]?a+p:p+a)}}return f.join("")},t.cache={},t.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw"[sprintf] huh?";if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw"[sprintf] huh?";s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw"[sprintf] huh?";s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";r.push(n)}t=t.substring(n[0].length)}return r};var n=function(e,n,r){return r=n.slice(0),r.splice(0,0,e),t.apply(null,r)};e.sprintf=t,e.vsprintf=n})(typeof exports!="undefined"?exports:window);


// String Formatter.
_.sprintf = sprintf;


// UserAgent.
_.isIphone = navigator.userAgent.toLowerCase().indexOf('iphone') + 1;
_.isAndroid = navigator.userAgent.toLowerCase().indexOf('android') + 1;



// 自動イベントバインドするメソッド
_.bindEvents = function (view, options) {
    options = options || {};

    // 対象エリア
    var $el = options.$el || view.$el;

    _.each([
        'click',
        'blur',
        'change',
        'keyup'
        ], function (type) {
            $el.on(type, '[data-event-' + type + ']', function (e) {
                var $this = $(this);
                var fnName = $this.data('event-' + type);
                if (view[fnName]) {
                    view[fnName].call(view, e);
                } else {
                    console.warn('cannot event bind. type=' + type + ', fnName=' + fnName);
                }
            });
        });
};


// 指定されたIDのテンプレートからHTMLを生成する
_.mbTemplate = function (id, data) {
    return _.template($('#' + id).html(), data);
}



// Timestamp Formatter.
_.formatTimestamp = function (timestamp) {

    var now  = new Date().getTime();
    var diff = now - timestamp;

    // 秒表示
    if (diff < (60 * 1000)) {
        return Math.floor(diff / 1000) + '秒前';
    }

    // 分表示
    if (diff < (60 * 60 * 1000)) {
        return Math.floor(diff / (60 * 1000)) + '分前';
    }

    // 時表示
    if (diff < (24 * 60 * 60 * 1000)) {
        return Math.floor(diff / (60 * 60 * 1000)) + '時間前';
    }

    // 日付表示
    var numOfDate = Math.floor(diff / (24 * 60 * 60 * 1000));
    return numOfDate + '日前';
};


// Feeling Name.
_.getFeelingName = function (feelingId) {

    var feelings = JSON.parse(localStorage.getItem('common')).feelings || [];

   for (var i = 0; i < feelings.length; i++) {
        var feeling = feelings[i];
        if (feeling.id === feelingId) {
            return feeling.name;
        }
   }

   return '';
};


// Login Check.
_.isLogedIn = function () {
    return localStorage.getItem('user') !== null;
};





// Local Storage.
var storage = window.localStorage;
_.mbStorage = {

    getUser: function () {
        return JSON.parse(storage.getItem('user'));
    },
    setUser: function (user) {
        storage.setItem('user', JSON.stringify(user));
    },
    refreshUser: function () {
        $.ajax({
            url: '/api/v1/userInfo',
            dataType: 'json',
            success: function (user) {
                _.mbStorage.setUser(user);
            }
        });
    },
    getCommon: function () {
        return JSON.parse(storage.getItem('common'));
    },
    setCommon: function (common) {
        storage.setItem('common', JSON.stringify(common));
    },
    getUserPockets: function () {
        return JSON.parse(storage.getItem('userPockets'));
    },
    setUserPockets: function (pockets) {
        storage.setItem('userPockets', JSON.stringify(pockets));
    },
    setUserPocketsWithBackboneCollection: function (pocketCollection) {
        var pockets = [];
        _.each(pocketCollection.models, function (model) {
            pockets.push(model.attributes);
        });
        this.setUserPockets(pockets);
    },
};














// Trim
_.trim = function (str) {

    while (1) {

        if (str.length === 0) {
            break;
        }

        if (/^[\s]/.test(str)) {
            str = str.substring(1, str.length);
            continue;
        }

        if (/[\s]$/.test(str)) {
            str = str.substring(0, str.length-1);
            continue;
        }

        break;
    }

    return str;
};



// Backboneの機能拡張
_.extend(Backbone.Model.prototype, {

    // uidをHeaderへ付与する
    sync: function (method, model, options) {

        options = options || {};

        // var uid = mb.userStorage.getUid();
        // if (uid) {
        //     var headers = options.headers || {};
        //     headers.uid = uid;
        //     options.headers = headers;
        // }

        console.log('options: ', options);
        var errorFnc = options.error;
        options.error = function (xhr, statusObject, error) {
            console.log('api error', arguments);
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            }

            if (errorFnc && typeof errorFnc === 'function') {
                errorFnc(xhr, statusObject, error);
            }
        };

        console.log('options: ', options);

        Backbone.sync(method, model, options);

    },


    dummy: function () {},


});



// Send Action Log.
_.sendActionLog = function (anUrl, params) {

      $.ajax({
          method: 'post',
          url: '/api/v1/action',
          data: {
              url: anUrl,
              actionParam: params,
          }
      });




};



// Action: Like Pop
_.likePop = function (popId, callback) {

    $.ajax({
        url: '/api/v1/likepop/' + popId,
        method: 'POST',
        success: function () {
            console.debug('likepop success. ', popId);
            if (callback) {
                callback();
            }
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('api error');
                console.log('error: ', arguments);
            }
        },
    });
};



// Action: Dislike Pop
_.dislikePop = function (popId, callback) {

    $.ajax({
        url: '/api/v1/dislikepop/' + popId,
        method: 'POST',
        success: function () {
            console.debug('dislikepop success. ', popId);
            if (callback) {
                callback();
            }
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('api error');
                console.log('error: ', arguments);
            }
        },
    });
};



// SessionStorageのUserPocketを更新するメソッド
_.loadUserPockets = function (options) {

    options = options || {};

    // ユーザー情報を取得
    var userString = localStorage.getItem('user');
    if (!userString) {
        return;
    }

    // ユーザーPocketsを取得
    var userPocketsString = localStorage.getItem('userPockets');
    if (userPocketsString && !options.force) {
        return;
    }

    // 取得して、Storageに保存
    var userId = JSON.parse(userString).id;
    $.ajax({
        url: '/api/v1/user_pockets',
        data: {user_id: userId},
        dataType: 'json',
        success: function (pocketArray) {
            console.debug('user pockets loaded. count = ', pocketArray.length);
            localStorage.setItem('userPockets', JSON.stringify(pocketArray));
        },
    });

};




// SessionStorageのArtistFollowを更新するメソッド
_.loadUserArtistFollow = function (options) {

    options = options || {};

    // ユーザー情報を取得
    var userString = localStorage.getItem('user');
    if (!userString) {
        return;
    }

    // ユーザーPocketsを取得
    var userPocketsString = localStorage.getItem('userArtistFollow');
    if (userPocketsString && !options.force) {
        return;
    }

    // 取得して、Storageに保存
    var userId = JSON.parse(userString).id;
    $.ajax({
        url: '/api/v1/user_artist_follows',
        data: {user_id: userId},
        dataType: 'json',
        success: function (pocketArray) {
            console.debug('user artist follow loaded. count = ', pocketArray.length);
            localStorage.setItem('userArtistFollow', JSON.stringify(pocketArray));
        },
    });

};






// 既にPocket済みの曲かを判断する
_.alreadyPocket = function (musicId) {

    // UserPocketを把握していない場合は、false
    var userPocketString = localStorage.getItem('userPockets');
    if (!userPocketString) {
        return false;
    }

    var userPockets = JSON.parse(userPocketString);
    for (var i = 0; i < userPockets.length; i++) {
        if (userPockets[i].music_id === musicId) {
            return true;
        }
    }


    return false;

};



/**
    指定されたUserIdが既にフォロー済みかを調べる
*/
_.alreadyUserFollow = function (userId) {

    var retValue = false;

    var user = _.mbStorage.getUser();
    if (user) {
        _.each(user.userFollows, function (follow) {
            if (follow.dest_user_id === userId) {
                retValue = true;
            }
        });
    }
    return retValue;
};


/**
    指定されたPlaylistIdが既にフォロー済みかを調べる
*/
_.alreadyPlaylistFollow = function (playlistId) {

    var retValue = false;

    var user = _.mbStorage.getUser();
    if (user) {

        _.each(user.userFollowPlaylistList, function (playlist) {
            if (playlist.dest_playlist_id === playlistId) {
                retValue = true;
            }
        });        
    }

    return retValue;
};








/**
 * Add Play Count for Music.
 */
_.addMusicPlayCount = function (musicId) {

    if (_.isLogedIn()) {

        $.ajax({
            url: '/api/v1/add_music_play_count/' + musicId,
            method: 'post',
            dataType: 'json',
            success: function () {
                console.debug('add music play count successed. id=', musicId);
            },
            error: function () {
                console.debug('add music play count failed. reason=', arguments);
            },
        });

    }

};


/**
 * Add Play Count for Music Link.
 */
_.addMusicLinkPlayCount = function (musicId, linkId) {

    if (_.isLogedIn()) {

        $.ajax({
            url: '/api/v1/add_music_link_play_count/' + musicId + '/' + linkId,
            method: 'post',
            dataType: 'json',
            success: function () {
                console.debug('add music play count successed. id=', musicId);
            },
            error: function () {
                console.debug('add music play count failed. reason=', arguments);
            },
        });

    }

};



/**
    MusicIdから、ユーザーの保持するPocketIdを検索する
*/
_.selectPocketId = function (musicId) {

    var pocketId;

    var user = _.mbStorage.getUser();
    if (user) {
        _.each(user.userPockets, function (pocket) {
            if (pocket.music_id === musicId) {
                pocketId = pocket.id;
            }
        });
    }

    return pocketId;
};





/**
    Pocketを追加する
*/
_.addPocket = function (data, callback) {

    $.ajax({
        url: '/api/v1/user_pockets',
        method: 'post',
        data: data,
        success: function () {
            console.debug('_.addPocket success.');
            if (callback) {
                callback();
            }
            _.mbStorage.refreshUser();
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('エラーが発生しました。お手数ですが再読み込みしてください。');
                console.log('error: ', arguments);
            }
        },
    });
};


/**
    Pocketを削除する
*/
_.deletePocket = function (pocketId, callback) {

    $.ajax({
        url: '/api/v1/user_pockets/' + pocketId,
        method: 'delete',
        success: function () {
            console.debug('_.deletePocket success.');
            if (callback) {
                callback();
            }
            _.mbStorage.refreshUser();
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('エラーが発生しました。お手数ですが再読み込みしてください。');
                console.log('error: ', arguments);
            }
        },
    });
};





/**
    UserIdから、フォローIDを取得する
*/
_.selectUserFollowId = function (userId) {

    var userFollowId;

    var user = _.mbStorage.getUser();
    if (user) {
        _.each(user.userFollows, function (userFollow) {
            if (userFollow.dest_user_id === userId) {
                userFollowId = userFollow.id;
            }
        });
    }

    return userFollowId;
};





/**
    ユーザーフォローを行う
*/
_.followUser = function (userId, callback) {

    $.ajax({
        url: '/api/v1/user_follows',
        method: 'post',
        data: {dest_user_id: userId},
        success: function () {
            console.debug('_.followUser success.');
            if (callback) {
                callback();
            }
            _.mbStorage.refreshUser();
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('エラーが発生しました。お手数ですが再読み込みしてください。');
                console.log('error: ', arguments);
            }
        },

    });
};



/**
    ユーザーフォロー解除を行う
*/
_.unfollowUser = function (userFollowId, callback) {

    $.ajax({
        url: '/api/v1/user_follows/' + userFollowId,
        method: 'delete',
        success: function () {
            console.debug('_.unfollowUser success.');
            if (callback) {
                callback();
            }
            _.mbStorage.refreshUser();
        },
        error: function (xhr) {
            if (xhr.status === 403) {
                mb.router.appView.authErrorHandler();
                return;
            } else {
                alert('エラーが発生しました。お手数ですが再読み込みしてください。');
                console.log('error: ', arguments);
            }
        },

    });
};
































