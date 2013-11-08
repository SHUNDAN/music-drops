"use strict";
/**
 * Module dependencies.
 */
var fs = require('fs');
var http = require('http');
var path = require('path');
var uuid = require('node-uuid');
global.log4js = require('log4js');




// 最終的なエラーハンドリング
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});




// load settings.
global.log4js.configure('settings/log4js_setting.json');
var json = fs.readFileSync('./settings/setting.json', 'utf-8');
global.mbSetting = JSON.parse(json);
global.db_path = global.mbSetting.db_path;
console.log('mbSetting: ', global.mbSetting);

var userModel = require('./models/user');
var userPlaylistModel = require('./models/user_playlist');
var onlineBatch = require('./util/online_batch');




// 起動時にUIDをDBから復元する、キャッシュをする
global.sessionMap = global.sessionMap || {};
userModel.selectUIDUser(function (users) {
    users.forEach(function (user) {
        global.sessionMap[user.uid] = user.id;
    });


    // メモリーキャッシュ
    onlineBatch.refreshMemCache();
});





// OAuth - Google
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
passport.use(new GoogleStrategy({
    returnURL: global.mbSetting.OAuth.google.returnURL,
    realm: global.mbSetting.OAuth.google.realm
}, function (identifier, profile, done) {
    console.log('identifier,profile,done: ', identifier, profile, done);

    // 既に存在するユーザーか？
    userModel.selectObject2({google_identifier:identifier}, function (user) {


        // 存在する場合には、ログイン成功ということでSessionMapに追加して、Cookieを返す。
        if (user) {
            done(null, user);
            return;
        }


        // 存在しない場合には、ユーザーを作成して、その後ログイン済みとして扱う。
        userModel.insertObject({name:profile.displayName, google_identifier:identifier}, function () {

            userModel.selectObject2({google_identifier:identifier}, function (user) {

                user.isNew = true;
                done(null, user);


                // Playlistのデフォルトも作っておく。
                var data = {
                    user_id: user.id,
                    type: 1,
                    title: '全てのPocket',
                    seq: 999,
                    user_pocket_ids: '[]'
                };
                userPlaylistModel.insertObject(data, function () {});



            });

        });

    });
}));



// OAuth - Facebook
var FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
    clientID: global.mbSetting.OAuth.facebook.clientID,
    clientSecret: global.mbSetting.OAuth.facebook.clientSecret,
    callbackURL: global.mbSetting.OAuth.facebook.callbackURL
}, function (accessToken, refreshToken, profile, done) {

        console.log('accessToken: ', accessToken);
        console.log('refreshToken: ', refreshToken);
        console.log('profile: ', profile);

        // ユーザーは存在するか？
        userModel.selectObject2({facebook_id:profile.id}, function (user) {

            // 存在すれば、その情報を持って次へ
            if (user) {
                done(null, user);
                return;
            }

            // 存在しなければ、ユーザー作成して、次へ
            userModel.insertObject({name:profile.displayName, facebook_access_token:accessToken, facebook_id:profile.id}, function () {

                // 作った情報を取得する
                userModel.selectObject2({facebook_id:profile.id}, function (user) {

                    user.isNew = true;
                    done(null, user);

                    // Playlistのデフォルトも作っておく。
                    var data = {
                        user_id: user.id,
                        type: 1,
                        title: '全てのPocket',
                        seq: 999,
                        user_pocket_ids: '[]'
                    };
                    userPlaylistModel.insertObject(data, function () {});

                });
            });
        });
    }));



// OAuth - Twitter
var TwitterStrategy = require('passport-twitter').Strategy;
passport.use(new TwitterStrategy({
    consumerKey: global.mbSetting.OAuth.twitter.consumerKey,
    consumerSecret: global.mbSetting.OAuth.twitter.consumerSecret,
    callbackURL: global.mbSetting.OAuth.twitter.callbackURL
}, function (token, tokenSecret, profile, done) {

    console.log('token: ', token);
    console.log('tokenSecret: ', tokenSecret);
    console.log('profile: ', profile);

    // 既に存在するユーザーか？
    userModel.selectObject2({twitter_token:token, twitter_token_secret:tokenSecret}, function (user) {

        // 既に存在する
        if (user) {
            done(null, user);
            return;
        }

        // 存在しない場合は、登録してから次へ
        userModel.insertObject({name:profile.displayName, twitter_token:token, twitter_token_secret:tokenSecret}, function () {

            userModel.selectObject2({twitter_token:token, twitter_token_secret:tokenSecret}, function (user) {

                user.isNew = true;
                done(null, user);

                // Playlistのデフォルトも作っておく。
                var data = {
                    user_id: user.id,
                    type: 1,
                    title: '全てのPocket',
                    seq: 999,
                    user_pocket_ids: '[]'
                };
                userPlaylistModel.insertObject(data, function () {});

            });
        });


    });

}));









var express = require('express');
var routes = require('./routes');
var appUtil = require('./util/utility');
var feeling = require('./routes/feeling');
var music = require('./routes/music');
var musicLink = require('./routes/music_link');
var artist = require('./routes/artist');
var pop = require('./routes/pop');
var user = require('./routes/user');
var userPocket = require('./routes/user_pocket');
var userPlaylist = require('./routes/user_playlist');
var userFollow = require('./routes/user_follow');
var userArtistFollow = require('./routes/user_artist_follow');
var userNotification = require('./routes/user_notification');
var iTunesRanking = require('./routes/itunes_ranking');
var report = require('./routes/report');
var master = require('./routes/master');

var app = express();


// sample
var loggerRequest = log4js.getLogger('request');
var loggerAction = log4js.getLogger('action');


// Basic認証
if (global.mbSetting.basicAuth) {
    app.use(express.basicAuth('mockbu', 'mockbu'));
}





// all environments
app.set('port', process.env.PORT ||global.mbSetting.port || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
// app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO, format: ':method :url' }));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.cookieSession({secret:'mockbu'}));
app.use(express.session({secret: '1234567890QWERTY'}));
// access log.
app.use(function (req, res, next) {

    // ユーザーの一意特定
    var urid = req.cookies.urid;
    if (!urid) {
        appUtil.setUrid(res);
    }

    // ユーザーIDが分かれば特定する
    var userId = appUtil.getUserIdFromUid(req) || '-';


    // request log.
    if (req.url.indexOf('/javascripts/') === -1 && req.url.indexOf('/stylesheets/') === -1 && req.url.indexOf('.map') === -1) {
        loggerRequest.info([
            req.headers['x-forwarded-for'] || req.client.remoteAddress,
            urid,
            userId,
            req.method,
            req.url,
            res.statusCode,
        ].join('\t'));
    }


    // action log(page)
    if (req.url.indexOf('/api/v1/action') === 0 && req.method.toLowerCase() === 'post') {

        appUtil.actionLog(req, [
            'page:',
            req.body.url,
            'params:',
            JSON.stringify(req.body.actionParam) || 'null',
            req.headers['user-agent'] || '-',
        ]);


        res.json({});
        return;
    }


    next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));




// エラーハンドラー
app.use(function (err, req, res, next) {
    console.error('err:', err);
    next(err);
});
app.use(function (err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
});
app.use(function (err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});
// 404対策
app.use(function (req, res, next) {
    if (req.xhr) {
        res.json(404, {});
    } else {
        res.render('notfound');
    }
});



// OAuth - Google
var oauthCallback = function (err, user, req, res) {

    if (err) {
        res.json(403, {message: 'error'});
        return;
    }

    global.sessionMap = global.sessionMap || {};

    // 既に存在するCookieがあればそれを使う。
    var uid = user.uid;
    global.sessionMap[uid] = user.id;

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

    // Cookieの設定
    // res.cookie('uid', uid, {maxAge:365*24*60*60, httpOnly:false});
    res.cookie('uid', uid, {maxAge: 903600 * 3 * 1000, httpOnly:false});
    if (user.isNew) {
        res.cookie('isNewUser', 'true');
    }

    // とりあえず保存
    // global.tmpMap = global.tmpMap || {};
    // global.tmpMap[uid] = user;

    return res.redirect('/');

};
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return', function (req, res, next) {
    passport.authenticate('google', function (err, user) {
        oauthCallback(err, user, req, res);
    })(req, res, next);
});

// OAuth - Facebook
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', function (req, res, next) {
    passport.authenticate('facebook', function (err, user) {
        oauthCallback(err, user, req, res);
    })(req, res, next);
});

// OAuth - Twitter
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', function (req, res, next) {
    passport.authenticate('twitter', function (err, user) {
        oauthCallback(err, user, req, res);
    })(req, res, next);
});






// Root
app.get('/', routes.index);
// Login
app.post('/api/v1/login', routes.login);
// Common
app.get('/api/v1/common', routes.common);
// Async Log
app.get('/api/v1/action', routes.log);
// Cache Baster
app.get('/api/v1/clearMemCache', routes.clearMemCache);

// Feeling
app.get('/api/v1/feelings', feeling.select);
// app.post('/api/v1.1/feelings', feeling.add);
// app.post('/api/v1.1/feelings/:id/update', feeling.update);
// app.delete('/api/v1.1/feelings/:id', feeling.delete);

// Music
app.post('/api/v1/musics/search_with_itunes', music.searchWithITunes);
app.get('/api/v1/musics', music.select);
app.get('/api/v1/musics/:id', music.select);
app.post('/api/v1/musics', music.add);
app.post('/api/v1/musics/:id/update', music.update);
app.delete('/api/v1/musics/:id', music.delete);
app.post('/api/v1/add_music_play_count/:id', music.addMusicPlayCount);


// Musici Link
app.get('/api/v1/music_links', musicLink.select);
app.get('/api/v1/music_links2', musicLink.select2);
app.get('/api/v1/music_links/:id', musicLink.select);
app.post('/api/v1/music_links', musicLink.add);
app.post('/api/v1/music_links/:id/update', musicLink.update);
app.delete('/api/v1/music_links/:id', musicLink.delete);
app.post('/api/v1/add_music_link_play_count/:music_id/:link_id', musicLink.addMusicLinkPlayCount);

// Artist
app.get('/api/v1/artists', artist.select);
app.get('/api/v1/artists/:id', artist.selectObject);
// app.post('/api/v1/artists', artist.add);
// app.post('/api/v1/artists/:id/update', artist.update);
// app.delete('/api/v1/artists/:id', artist.delete);

// Pop
app.get('/api/v1/pops', pop.select);
app.get('/api/v1/pops/:id', pop.select);
app.get('/api/v1/poplist', pop.selectPopList);
app.put('/api/v1/likepop', pop.likePop);
app.post('/api/v1/likepop/:id', pop.likePop);
app.put('/api/v1/dislikepop', pop.dislikePop);
app.post('/api/v1/dislikepop/:id', pop.dislikePop);
app.post('/api/v1/pops', pop.add);
app.put('/api/v1/pops/:id', pop.update);
app.post('/api/v1/pops/:id/update', pop.update);
app.delete('/api/v1/pops/:id', pop.delete);
app.delete('/api/v1/pops', pop.delete);
// app.post('/api/v1.1/pops', pop.add1_1);
// app.post('/api/v1.1/pops/:id/update', pop.update1_1);
// app.delete('/api/v1.1/pops/:id', pop.delete1_1);

// User
app.get('/api/v1/users', user.select);
app.get('/api/v1/users/:id', user.selectObject);
app.get('/api/v1/userInfo', user.userinfo);
// app.post('/api/v1/users', user.add);
app.post('/api/v1/users/:id/update', user.update);
app.put('/api/v1/users/:id', user.update);
app.delete('/api/v1/users/:id', user.delete);

// User Pocket
app.get('/api/v1/user_pockets', userPocket.select);
app.get('/api/v1/user_pockets2', userPocket.selectWithMusicInfo);
app.post('/api/v1/user_pockets', userPocket.add);
app.put('/api/v1/user_pockets/:id', userPocket.update);
app.post('/api/v1/user_pockets/:id/update', userPocket.update);
app.post('/api/v1/copy_pockets/:id', userPocket.copy);
app.delete('/api/v1/user_pockets/:id', userPocket.delete);
app.delete('/api/v1/user_pockets', userPocket.delete);

// User Playlist
app.get('/api/v1/user_playlists', userPlaylist.select);
app.get('/api/v1/follow_playlists', userPlaylist.selectFollowPlaylists);
app.post('/api/v1/user_playlists', userPlaylist.add);
app.put('/api/v1/user_playlists/:id', userPlaylist.update);
app.post('/api/v1/user_playlists/:id/update', userPlaylist.update);
app.delete('/api/v1/user_playlists/:id', userPlaylist.delete);
app.delete('/api/v1/user_playlists', userPlaylist.delete);

// User Follow
app.get('/api/v1/user_follows', userFollow.select);
app.post('/api/v1/user_follows', userFollow.add);
app.delete('/api/v1/user_follows/:id', userFollow.delete);
app.delete('/api/v1/user_follows', userFollow.delete);

// User Artist Follow
app.get('/api/v1/user_artist_follows', userArtistFollow.select);
app.post('/api/v1/user_artist_follows', userArtistFollow.add);
app.post('/api/v1/user_artist_follows/:id/update', userArtistFollow.update);
app.delete('/api/v1/user_artist_follows/:id', userArtistFollow.delete);

// User Notification
app.get('/api/v1/user_notifications', userNotification.select);
app.post('/api/v1/user_notifications', userNotification.add);
app.post('/api/v1/user_notifications/:id/update', userNotification.update);
app.delete('/api/v1/user_notifications/:id', userNotification.delete);

// iTunesRanking
app.get('/api/v1/itunes_rankings', iTunesRanking.select);
app.post('/api/v1/itunes_rankings', iTunesRanking.add);
app.post('/api/v1/itunes_rankings/:id/update', iTunesRanking.update);
app.delete('/api/v1/itunes_rankings/:id', iTunesRanking.delete);

// レポート機能
app.get('/api/v1/reports', report.select);
app.post('/api/v1/reports', report.add);
// app.post('/api/v1/itunes_rankings/:id/update', iTunesRanking.update);
// app.delete('/api/v1/itunes_rankings/:id', iTunesRanking.delete);



// Master
// app.get('/master', master.index);
// app.get('/ap1/v1.1/master/all_tables', master.allTables);



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});




// テスト用のAPI（エラーが起きる）
app.get('/error_sync', function (req, res) {
    throw "aaa";
});
app.get('/error_async', function (req, res) {
    setTimeout(function () {
        throw "aaa";
    }, 100);
});




