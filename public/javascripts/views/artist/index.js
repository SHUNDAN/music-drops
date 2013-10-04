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
        musicList: new MusicList(),
        userStorage: new UserStorage(),

        initialize: function () {

            _.bindAll(this, 'renderArtistInfo', 'renderMusicList', 'playYoutube', 'pocket', 'deletePocket');

            this.artist.bind('change', this.renderArtistInfo);
            this.musicList.bind('reset', this.renderMusicList);
        },

        events: {
            'click [data-event="playYoutube"]': 'playYoutube',
            'click [data-event="pocket"]': 'pocket',
            'click [data-event="deletePocket"]': 'deletePocket',
        },

        render: function () {
            console.log('artistview render');
            var template = $('#page_artist').html();
            var snipet = _.template(template, {});
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

        show: function (artistId) {
            this.artistId = artistId;
            this.render();

            // load artist.
            this.artist.set('id', artistId, {silent: true});
            this.artist.fetch();

            // load music list.
            this.musicList.fetch({reset: true, data: {artist_id: artistId}});
        },

        dealloc: function () {

        },

    });

    return ArtistView;

});
