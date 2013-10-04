"use strict";
/*
 * GET home page.
 */
var fs = require('fs');
var uuid = require('node-uuid');
var userModel = require('../models/user');
var feelingModel = require('../models/feeling');
var codeModel = require('../models/code');
var appUtil = require('../util/utility.js');

exports.index = function(req, res){

    // load templates.
    var template = '';
    var files = fs.readdirSync('./public/template/page/');
    files.forEach(function (fileName) {
        if (fileName.indexOf('.html') !== -1) {
            template += fs.readFileSync('./public/template/page/' + fileName, 'utf-8'); 
        }
    });
    // console.log(template);

    // response.
    res.render('index', {title: 'Express', htmltemplate: template, mainJs: global.mbSetting.mainJs});
};



/**
 * Login
 */
exports.login = function (req, res) {

    var userId = req.body.user_id;
    var password = req.body.password;
    console.log('login request', userId, password);


    // 検索する
    userModel.selectObjects(req.body, function (err,rows) {
        if (err || rows.length === 0) {
            appUtil.actionLog(req, 'login error');
            res.json(403, {message: 'login error'});
        } else {

            appUtil.actionLog(req, ['login successed', JSON.stringify({id: rows[0].id})]);
    

            // 既に存在するCookieがあればそれを使う。
            var user = rows[0];
            var uid;
            for (var prop in global.sessionMap) {
                if (global.sessionMap.hasOwnProperty(prop)) {
                    if (user.id === global.sessionMap[prop]) {
                        uid = prop;
                        break;
                    }   
                }   
            }   
      
            if (!uid) {
                uid = uuid.v4();
                while (global.sessionMap[uid]) {
                    uid = uuid.v4();
                }   
                global.sessionMap[uid] = user.id;
      
                // DBに保存しておく。次回起動時に利用したいため。
                userModel.updateObject({uid:uid}, {id:user.id}, function () {});
            }   
      
            console.log('sessionMap: ', global.sessionMap);

            // var uid = uuid.v4();
            // global.sessionMap = global.sessionMap || {};
            // while (global.sessionMap[uid]) {
            //     uid = uuid.v4();
            // }
            // global.sessionMap[uid] = rows[0].id;
            // console.log('sessionMap: ', global.sessionMap);
            
            // Request HeaderでUIDを返す
            var userInfo = rows[0];
            delete userInfo.password;


            // Cookieの設定 
            res.cookie('uid', uid, {maxAge:30*24*60*60, httpOnly:false});
            



            res.json({message: 'success', info: userInfo});
        }
    });

};


/**
 * 基本情報を返却する
 */
exports.common = function (req, res) {
    var retValue = {};

    // サーバー時間
    retValue.currentTime = new Date().getTime();

    // 感情一覧
    feelingModel.selectObjects({}, function (err, rows) {

        retValue.feelings = rows;

        // コード一覧
        codeModel.selectObjects({}, function (err, rows) {
            retValue.codes = rows;


            // return
            res.json(retValue);

        });

    });



};



/**
 *  非同期ログ
 */
exports.log = function (req, res) {





    res.json({});

};













































