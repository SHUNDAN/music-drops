"use strict";

// namespace.
window.mb = window.mb || {};



/*! sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */(function(e){function r(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}function i(e,t){for(var n=[];t>0;n[--t]=e);return n.join("")}var t=function(){return t.cache.hasOwnProperty(arguments[0])||(t.cache[arguments[0]]=t.parse(arguments[0])),t.format.call(null,t.cache[arguments[0]],arguments)};t.format=function(e,n){var s=1,o=e.length,u="",a,f=[],l,c,h,p,d,v;for(l=0;l<o;l++){u=r(e[l]);if(u==="string")f.push(e[l]);else if(u==="array"){h=e[l];if(h[2]){a=n[s];for(c=0;c<h[2].length;c++){if(!a.hasOwnProperty(h[2][c]))throw t('[sprintf] property "%s" does not exist',h[2][c]);a=a[h[2][c]]}}else h[1]?a=n[h[1]]:a=n[s++];if(/[^s]/.test(h[8])&&r(a)!="number")throw t("[sprintf] expecting number but found %s",r(a));switch(h[8]){case"b":a=a.toString(2);break;case"c":a=String.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=h[7]?a.toExponential(h[7]):a.toExponential();break;case"f":a=h[7]?parseFloat(a).toFixed(h[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=String(a))&&h[7]?a.substring(0,h[7]):a;break;case"u":a>>>=0;break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(h[8])&&h[3]&&a>=0?"+"+a:a,d=h[4]?h[4]=="0"?"0":h[4].charAt(1):" ",v=h[6]-String(a).length,p=h[6]?i(d,v):"",f.push(h[5]?a+p:p+a)}}return f.join("")},t.cache={},t.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw"[sprintf] huh?";if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw"[sprintf] huh?";s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw"[sprintf] huh?";s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";r.push(n)}t=t.substring(n[0].length)}return r};var n=function(e,n,r){return r=n.slice(0),r.splice(0,0,e),t.apply(null,r)};e.sprintf=t,e.vsprintf=n})(typeof exports!="undefined"?exports:window);


// String Formatter.
_.sprintf = sprintf;


// UserAgent.
_.isIphone = navigator.userAgent.toLowerCase().indexOf('iphone') + 1;
_.isAndroid = navigator.userAgent.toLowerCase().indexOf('android') + 1;


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

    var feelings = JSON.parse(sessionStorage.getItem('common')).feelings || [];

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
    return sessionStorage.getItem('user') !== null;
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
















