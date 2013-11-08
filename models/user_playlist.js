"use strict";
/*******************************************
 *  Model: User Playlist
 *******************************************/
var _ = require('underscore');
var util = require('util');


module.exports = _.extend({}, require('./common'), {

    /**
     *  テーブル名
     */
    tableName: 'user_playlist',


    /*
     *  カラム一覧
     */
    columns : [
        'id',
        'user_id',
        'type',
        'title',
        'seq',
        'user_pocket_ids',
        'dest_playlist_id',
        'create_at',
        'update_at',
    ],


    /**
     *  Insertしないカラム
     */
    excludeInsColumns: [
        'id'
    ],


    /**
     * フォローしているプレイリスト情報を取得する
     */
    selectFollowPlaylists: function (conditions, callback) {

        var sql = [
            'select a.id, a.type, b.title, b.user_pocket_ids, b.user_id, c.name user_name',
            'from user_playlist a',
            'left outer join user_playlist b on a.dest_playlist_id = b.id',
            'left outer join user c on b.user_id = c.id',
            'where a.user_id=? and a.dest_playlist_id is not null'
        ].join(' ');


        // execute.
        this._executeQuery(sql, [conditions.user_id], callback);
    },
















});







