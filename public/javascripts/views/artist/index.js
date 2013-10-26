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


















        renderArtistInfo: function () {
            console.log('renderArtistInfo');
            var template = $('#page_artist_info').html();
            var snipet = _.template(template, this.artist.attributes);
            this.$el.find('#artist_info').html(snipet);
        },

        renderMusicList: function () {
            console.log('renderMusicList');
            var template = $('#page_artist_music_list').html();
            var snipet = _.template(template, {musics: this.musicList.models});
            this.$el.find('#music_list').html(snipet);

        },



        /**
            アーティストフォロー
        */
        followArtist: function () {
            _.followArtist(this.artist.attributes.id, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },



        /**
            アーティストフォロー解除
        */
        unfollowArtist: function () {
            var followArtistId = _.selectArtistFollowId(this.artist.attributes.id);
            _.unfollowArtist(followArtistId, function () {
                $('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },
























        playYoutube: function (e) {
            var $this = $(e.currentTarget);
            var youtubeId = $this.data('youtube-id');
            var pos = $this.data('pos');
            console.log('playYoutube', youtubeId, pos);

            // 再生リストを作成
            var ids = [];
            _.each(this.musicList.models, function (model) {
                if (model.attributes.youtube_id) {
                    ids.push(model.attributes.youtube_id);
                }
            });
            console.log(ids);

            var playList = [];
            playList = [].concat(ids.slice(pos, ids.length)).concat(ids.slice(0,pos));
            console.log('playlist: ', playList);
            

            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(playList, this);


        },

        pocket: function (e) {
            var musicId = $(e.currentTarget).data('music-id');
            console.log('pocket', musicId);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', musicId);
            this.userPocket.bind('sync', function () {

                // UIとイベントを変更する
                $(e.currentTarget)
                    .text('Pocket解除')
                    .addClass('btn-primary')
                    .attr('data-event', 'deletePocket');

                // Localデータも更新
                _.loadUserPockets({force: true});

            });
            this.userPocket.create();
        },

        
        deletePocket: function (e) {

            var musicId = $(e.currentTarget).data('music-id');

            // 対象を探して、削除
            $.ajax({
                url: '/api/v1/user_pockets',
                data: {
                    user_id: this.userStorage.getUser().id,
                    music_id: musicId 
                },  
                dataType: 'json',
                success: function (pockets) {
                    console.debug('delete target pockets: ', pockets);

                    var count = pockets.length;
                    var doneCount = 0;

                    // 1個ずつ削除
                    for (var i = 0; i < pockets.length; i++) {
                        var id = pockets[i].id;
                        var pocket = new UserPocket();
                        pocket.set('id', id);
                        pocket.bind('sync', function () {
                            if (++doneCount === count) {
    
                                // UIとイベントを変更する
                                $(e.currentTarget)
                                    .text('Pocketする')
                                    .removeClass('btn-primary')
                                    .attr('data-event', 'pocket');

                                // Localデータも更新
                                _.loadUserPockets({force:true});
                            }   
                        }); 
                        pocket.destroy({wait:true});
                    }

                    // UIとイベントを変更する
                    if (count === doneCount) {
                        $(e.currentTarget)
                            .text('Pocketする')
                            .removeClass('btn-primary')
                            .attr('data-event', 'addPocket');

                        // Localデータも更新
                        _.loadUserPockets({force:true});
                    }

                }
            });


        },




        /**
            代表的なキモチを計算する
        */
        _calcRepresentativeFeeling: function () {

            var feelingMap = {};
            _.each(this.musicList.models, function (music) {

                var feelingId = music.feeling_id;
                var popCount = music.popCount;

                if (feelingId && popCount > 0) {
                    feelingMap[feelingId] = (feelingMap[feelingId] || 0) + popCount;
                }
            });

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





            // this.render();

            // load artist.
            // this.artist.set('id', artistId, {silent: true});
            // this.artist.fetch();

            // load music list.
            // this.musicList.fetch({reset: true, data: {artist_id: artistId}});
        },

        dealloc: function () {

        },

    });

    return ArtistView;

});
