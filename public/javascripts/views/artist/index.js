"use strict";
/**
 *  View: Artist
 */
define([
    'models/artist/artist',
    'models/music/music_list',
    'models/user/user_pocket',
    'views/common/youtube',
    'models/common/user_storage'
], function (
    Artist,
    MusicList,
    UserPocket,
    YoutubeView,
    UserStorage
) {

    var ArtistView = Backbone.View.extend({

        // fields.
        artistId: null,
        artist: new Artist(),
        userStorage: new UserStorage(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            // _.bindAll(this, 
            //     'renderArtistInfo', 
            //     'renderMusicList', 
            //     'playYoutube', 
            //     'pocket', 
            //     'deletePocket');

            // this.artist.bind('change', this.renderArtistInfo);
            // this.musicList.bind('reset', this.renderMusicList);
        },

        // events: {
        //     'click [data-event="playYoutube"]': 'playYoutube',
        //     'click [data-event="pocket"]': 'pocket',
        //     'click [data-event="deletePocket"]': 'deletePocket',
        // },


        /**
            画面を表示する
        */
        render: function () {
            var data = {
                repFeelingId: this.repFeelingId,
                repMusic: this.repMusic,
                musicList: this.musicList.models
            };
            var snipet = _.mbTemplate('page_artist', data);
            this.$el.html(snipet);
        },




        /**
            アーティストフォロー
        */
        followArtist: function () {
            _.followArtist(this.artistId, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },



        /**
            アーティストフォロー解除
        */
        unfollowArtist: function () {
            var followArtistId = _.selectArtistFollowId(this.artistId);
            _.unfollowArtist(followArtistId, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },



        /**
            Pocketを追加する
        */
        addPocket: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var musicId = $li.data('music-id');

            _.addPocket({music_id: musicId}, function () {
                $li.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            });
        },


        /**
            Pocketを削除する
        */
        deletePocket: function (e) {

            var $li = $(e.currentTarget).parents('li');
            var musicId = $li.data('music-id');
            var pocketId = _.selectPocketId(musicId);

            _.deletePocket(pocketId, function () {
                $li.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            });

        },



        /**
            音楽を再生する
        */
        playMusic: function (e) {

            var $li = $(e.currentTarget).parents('li');
            var idx = $li.data('idx');


            // もしPause中の場合には、再開のみを行う
            if ($li.data('nowpausing')) {
                $li.removeAttr('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            // 表示オプションを作成
            var options = {};
            options.playlistName = this.repMusic.attributes.artist_name + 'の曲';
            options.identifier = 'artist_page' + this.artistId;
            options.musicArray = _.map(this.musicList.models, function (music) {
                music.attributes.music_id = music.attributes.id;
                return music.attributes;
            });
            options.startPos = $li.data('idx');
            options.callbackWhenWillStart = _.bind(function (music) {
                // 表示をリセット
                $('[data-event-click="pauseMusic"]').addClass('hidden');
                $('[data-event-click="playMusic"]').removeClass('hidden');
                // 次の曲をアクティブに
                var $li = this.$el.find('[data-music-id="'+music.id+'"]');
                $li.find('[data-event-click="pauseMusic"]').removeClass('hidden');
                $li.find('[data-event-click="playMusic"]').addClass('hidden');
            }, this);
            options.callbackWhenPause = options.callbackWhenEnd = function () {
                // 表示をリセット
                $('[data-event-click="pauseMusic"]').addClass('hidden');
                $('[data-event-click="playMusic"]').removeClass('hidden');
            };

            console.log('playMusic: ', options);
            mb.musicPlayer.playMusics(options);
        },



        /**
            再生を一時停止する
        */
        pauseMusic: function (e) {
            mb.musicPlayer.pauseMusic();

            var $li = $(e.currentTarget).parents('li');
            $li.find('[data-event-click="pauseMusic"]').addClass('hidden');
            $li.find('[data-event-click="playMusic"]').removeClass('hidden');
            $li.attr('data-nowpausing', 'true');
        },





















        /**
            代表的なキモチを計算する
        */
        _calcRepresentativeFeeling: function () {

            var feelingMap = {};
            _.each(this.musicList.models, function (music) {

                var feelingId = music.attributes.feeling_id;
                var popCount = music.attributes.pop_count;

                if (feelingId && popCount > 0) {
                    feelingMap[feelingId] = (feelingMap[feelingId] || 0) + popCount;
                }
            });
            console.debug('feelingMap: ', feelingMap);

            var mostFeelingId = 1;
            var maxScore = 0;
            _.each(feelingMap, function (val, key) {
                if (maxScore < val) {
                    mostFeelingId = key;
                }
            });

            return mostFeelingId;

        },




        show: function (artistId) {
            this.artistId = artistId;


            // 該当アーティストの曲を全曲取得する
            this.musicList = new MusicList();
            this.musicList.bind('sync', _.bind(function () {

                // Pop数順に並び替える
                this.musicList.models = _.sortBy(this.musicList.models, function (music) {
                    return music.attributes.pop_count * -1 || 0;
                });

                // 代表曲を取得する
                this.repMusic = this.musicList.models[0];

                // 代表的なキモチを計算する
                this.repFeelingId = this._calcRepresentativeFeeling();

                // 描画
                this.render();

            }, this));
            this.musicList.fetch({reset: true, data: {artist_id: artistId}});

        },




        dealloc: function () {

        },

    });

    return ArtistView;

});
