"use strict";
/***************************************************
 *  Mockbu Utility Library
 ***************************************************/

var uuid = require('node-uuid');
var commonModel = require('../models/common');


if (global.log4js) {
    var loggerAction = global.log4js.getLogger('action');
}


module.exports = {


    /**
     *  処理のレスポンス
     */
    basicResponse: function (res, err, data) {
        if (err) {
            res.json(400, err.message || 'error');
        } else {
            var retValue = {
                status: 200,
                message: 'success',
            };
            if (data) {
                retValue.data = data;
            }
            res.json(retValue);
        }
    },


    /*
     * 403エラーを返す
     */
    response403: function (res) {
        res.json(403, {message: 'auth error'});
    },



    /**
     * Requestヘッダに含まれるUIDからユーザーIDへ変換する
     */
    getUserIdFromRequest: function (req) {
        var uid = req.cookies.uid;
        var user_id = (uid && global.sessionMap ? global.sessionMap[uid] : undefined);
        return user_id;
    },


    /**
     * RequestヘッダのUIDからユーザーを特定し、User情報を返却する
     */
    getUserFromRequest: function (request, callback) {

        var userId = this.getUserIdFromRequest(request);
        console.log('userId: ', userId);
        if (!userId) {
            callback(null, null);
        }


        // execute.
        commonModel._executeQuery('select * from user where id = ' + userId, null, function (err,rows) {

            if (err && callback) {
                return callback(err);
            }

            if ((!rows || rows.length === 0) && callback) {
                return callback(null, null);
            }

            callback(null, rows[0]);

        });

    },


    /**
     * Login Check.
     */
    isLogedIn: function (req) {
        return this.getUserIdFromRequest(req);
    },




    /**
     * 日付Format
     */
    formatDate: function (date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();
        var sss = date.getMilliseconds();
        return year + '/' + month + '/' + day + ' ' + hh + ':' + mm + ':' + ss + '.' + sss;
    },


    /**
     * urid設定
     */
    setUrid: function (res) {
        var urid = uuid.v4();
        res.cookie('urid', urid, {maxAge: 903600 * 3 * 1000, httpOnly:false});
    },


    /**
     *  userId取得
     */
    getUserIdFromUid: function (req) {
        var userId = null;
        var uid = req.cookies.uid;
        if (uid) {
            if (!global.sessionMap) {
                global.sessionMap = {};
            }
            var anUserId = global.sessionMap[uid];
            if (anUserId) {
                userId = anUserId;
            }
        }

        return userId;
    },


    /**
     *  Action Logの出力
     */
    actionLog: function (req, messages) {

        if (typeof messages === 'string') {
            messages = [messages];
        }

        loggerAction.info([
            req.cookies.urid,
            this.getUserIdFromUid(req) || '-',
        ].concat(messages).join('\t'));

    },


    /**
     *  ASCII Unescape
     */
    unescapeAscii: function (text) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&#35;/g, '#');
        text = text.replace(/&#40;/g, '(');
        text = text.replace(/&#41;/g, ')');
        text = text.replace(/&apos;/g, "'");
        return text;
    },





















};
