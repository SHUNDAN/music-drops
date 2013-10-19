"use strict";
/**
 * View: User
 */
define([
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/common/user_storage',
    'views/common/youtube',
    'models/pop/pop_list',
    'models/user/user_artist_follow_list',
    'models/user/user_playlist_list',
], function (
    User,
    UserPocket,
    UserPocketList,
    UserFollow,
    UserFollowList,
    UserStorage,
    YoutubeView,
    PopList,
    UserArtistFollowList,
    UserPlaylistList
) {

    var UserView = Backbone.View.extend({
   
        // fields.
        user: null,
        userPocketList: null,
        displayUserPocketList: null,
        filteredUserPocketList: null,
        popList: null,
        userFollowList: null,
        userFollowedList: null,
        checkArtists: null,
        userPlaylistList: null,



        userFollow: null,
        userStorage: new UserStorage(),


        /**
         * 初期化処理
         */
        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this, 
                'render', 
                'renderUserPocketList', 
                'renderUserPlaylistList',


                'renderUserFollowedList', 
                'renderUserFollowList', 
                'showYoutube', 
                'addPocket', 
                'deletePocket', 
                'followUser', 
                'unfollowUser', 
                'show', 
                'dealloc'
                );


            // User情報
            this.user = new User();
            this.user.bind('sync', this.render);

            // Pocket一覧
            this.userPocketList = new UserPocketList();

        },



        /**
            ページ骨格＋ユーザー情報表示
        */
        render: function () {
            var snipet = _.mbTemplate('page_user', {user: this.user.attributes});
            this.$el.html(snipet);
        },



        /**
            Pocket一覧を表示（displayUserPocketListを利用します）
        */
        renderUserPocketList: function () {

            // TODO あとで絞り込みを実装する
            this.filteredUserPocketList = this.displayUserPocketList;

            console.log('renderPocketList.', this.filteredUserPocketList);
            var snipet = _.mbTemplate('page_user_user_pocket_list_area', {
                pocketList: this.filteredUserPocketList.models,
                feelings: _.mbStorage.getCommon().feelings
            });
            this.$el.find('[data-type="dataArea"]').html(snipet);

            // 件数も更新する
            this.$el.find('#numOfPockets').text(this.displayUserPocketList.length);
        },



        /**
            Pop数を表示する
        */
        renderPopCount: function () {
            this.$el.find('#numOfMyDrops').text('(' + this.popList.length + ')');
        },


        /**
            フォローしているユーザー数を表示  
        */
        renderUserFollowCount: function () {
            this.$el.find('#numOfFollowUsers').text('(' + this.userFollowList.length + ')');
        },


        /**
            フォローされているユーザー数を表示
        */
        renderUserFollowedCount: function () {
            this.$el.find('#numOfFollowedUsers').text('(' + this.userFollowedList.length + ')');
        },


        /**
            チェックアーティスト数を表示
        */
        renderCheckArtistsCount: function () {
            this.$el.find('#numOfCheckArtists').text('(' + this.userFollowedList.length + ')');
        },


        // マイDrop表示
        renderMyDrops: function () {
            var snipet = _.mbTemplate('page_user_mypop_list', {popList:this.popList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // チェックアーティスト表示
        renderCheckArtists: function () {
            var snipet = _.mbTemplate('page_user_check_artists', {checkArtists:this.checkArtists.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローしているユーザー表示
        renderFollowUsers: function () {
            var snipet = _.mbTemplate('page_user_follow_users', {followUsers: this.userFollowList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローされているユーザー表示
        renderFollowedUsers: function () {
            var snipet = _.mbTemplate('page_user_followed_users', {followedUsers: this.userFollowedList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        /**
            プレイリスト一覧を表示
        */
        renderUserPlaylistList: function () {

            // 表示内容は、通常とALLのみ（フォロープレイリストは省く）
            var playlists = _.filter(this.userPlaylistList.models, function (playlist) {
                return playlist.attributes.type !== 3; // フォロープレイリストではない。
            });

            var snipet = _.mbTemplate('page_mypage_playlist', {playlists: playlists});
            this.$el.find('#playlistList').html(snipet);
        },





        /**
            Pop一覧を表示する
        */
        showMyDrops: function () {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.popList.loaded) {
                setTimeout(this.showMyDrops, 100);
                return;
            }

            // 表示する
            this.renderMyDrops();
        },


        /**
            チェックアーティスト一覧を表示する
        */
        showCheckArtists: function () {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.checkArtists.loaded) {
                setTimeout(this.showCheckArtists, 100);
                return;
            }

            // 表示する
            this.renderCheckArtists();
        },


        /**
            フォローしているユーザー表示
        */
        showFollowUsers: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.userFollowList.loaded) {
                setTimeout(this.showFollowUsers, 100);
                return;
            }

            // 表示する
            this.renderFollowUsers();
        },


        /**
            フォローされているユーザー表示
        */
        showFollowedUsers: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.userFollowedList.loaded) {
                setTimeout(this.showFollowedUsers, 100);
                return;
            }

            // 表示する
            this.renderFollowedUsers();
        },        






        /**
            Pocketを再生する
        */
        // TODO ここの機能は、Mypageとほとんど同じ実装なので、綺麗に共通化したいなぁ。
        playMusic: function (e) {
            var pocketId = parseInt($(e.currentTarget).parents('[data-pocket-id]').data('pocket-id'), 10);
            console.debug('playMusic: ', pocketId);


            var options = {};

            // playlist name.
            // TODO 後でプレイリスト名とかユーザー名とか変更できるようにする。
            options.playlistName = 'すべてのPocket';


            // startPos, playlist.
            options.startPos = 0;
            options.musicArray = [];
            for (var i = 0; i < this.filteredUserPocketList.models.length; i++) {
                var model = this.filteredUserPocketList.models[i];
                options.musicArray.push(model.attributes);
                if (model.attributes.id === pocketId) {
                    options.startPos = i;
                }
            }

            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {
                // TODO ボタンをPlayとPauseの切替する
            }, this);
            options.callbackWhenEnd = _.bind(function () {
                // TODO ボタンをすべてPlayにする
            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);



        },



        /**
            プレイリストの中身を表示
        */
        showPlaylist: function (e) {
            var playlistId = $(e.currentTarget).data('playlist-id');
            var playlist = this.userPlaylistList.get(playlistId);

            // 無い場合には、何もしない
            if (!playlist) {
                return false;
            }

            this.currentPlaylist = playlist;

            // 絞り込み条件はクリア
            this._clearFilter();

            // 表示するPocketリストを作る
            var pocketIds = JSON.parse(playlist.attributes.user_pocket_ids);
            this.displayUserPocketList = new UserPocketList();
            _.each(pocketIds, _.bind(function (pocketId) {
                this.displayUserPocketList.add(this.userPocketList.get(pocketId));
            }, this));

            this.renderUserPocketList();
        },




        // フィルター情報を削除
        _clearFilter: function () {
            this.filterWords = [];
            $('#filterByNameInput').val('');
            $('#filterByFeelingSelect option:eq(0)').select();
        },





        /**
            ユーザーをフォローする。
        */
        followUser: function () {

            var userFollow = new UserFollow();
            userFollow.set('dest_user_id', this.user.id);
            userFollow.bind('sync', function () {
                // 表示きりかえ
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
                // Storage情報も更新する
                _.mbStorage.refreshUser();
            });
            userFollow.save();
        },


        /**
            ユーザーフォローを解除する。
        */
        unfollowUser: function () {

            $.ajax({
                url: '/api/v1/user_follows',
                method: 'delete',
                data: {dest_user_id: this.user.id},
                success: function () {
                    // 表示きりかえ
                    $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');
                    // Storage情報も更新する
                    _.mbStorage.refreshUser();
                },
                error: function () {
                    alert('エラーが発生しました。リロードしてください。')
                },
            })
        },




















        renderUserFollowedList: function () {
            console.log('renderUserFollowedList', this.userFollowedList);
            var template = $('#page_common_followed_list').html();
            var snipet = _.template(template, {users: this.userFollowedList.models});
            this.$el.find('#followedUserList').html(snipet);
        },

        renderUserFollowList: function () {
            console.log('renderUserFollowList', this.userFollowList);
            var template = $('#page_common_follow_list').html();
            var snipet = _.template(template, {users: this.userFollowList.models});
            this.$el.find('#followUserList').html(snipet);
            
        },


        showYoutube: function (e) {
            var youtubeId = $(e.currentTarget).data('youtube-id');
            console.log('showYoutube', youtubeId);


            // 1曲だけにしようかと思ったけど、やっぱり全曲聞き回しがいいので作り直し。
            var youtubeIdx = $(e.currentTarget).data('youtube-idx');
            var youtubeIds = [];
            $('[data-youtube-id][data-event="showYoutube"]').each(function () {
                youtubeIds.push($(this).data('youtube-id'));
            });
            youtubeIds = [].concat(youtubeIds.slice(youtubeIdx, youtubeIds.length)).concat(youtubeIds.slice(0,youtubeIdx));
            console.log('youtubeId,idx: ', youtubeIds, youtubeIdx);



            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(youtubeIds, this);

        },

        addPocket: function (e) {
            var $this = $(e.currentTarget);
            var musicId = $this.data('music-id');
            var youtubeId = $this.data('youtube-id');
            console.log('addPocket', musicId, youtubeId);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', musicId);
            this.userPocket.bind('sync', function () {

                // UIとイベントを変更する
                $('[data-event="addPocket"][data-music-id="'+musicId+'"]')
                    .text('Pocket解除')
                    .addClass('btn-primary')
                    .attr('data-event', 'deletePocket');

                // Localデータ更新
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
                                $('[data-event="deletePocket"][data-music-id="'+musicId+'"]')
                                    .text('Pocketする')
                                    .removeClass('btn-primary')
                                    .attr('data-event', 'addPocket');

                                // Localデータも更新
                                _.loadUserPockets({force:true});
                            }   
                        }); 
                        pocket.destroy({wait:true});
                    }
 
                    // UIとイベントを変更する
                    if (count === doneCount) {
                        $('[data-event="deletePocket"][data-music-id="'+musicId+'"]')
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
            ページ表示
        */
        show: function (userId) {
         
            // ユーザーデータ取得
            this.user.set('id', userId);
            this.user.fetch({reset: true});

            // Pocketリスト取得
            this.userPocketList.bind('sync', _.bind(function () {
                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketList();
            }, this));
            this.userPocketList.fetch({reset: true, data: {user_id: userId}});


            // Drop一覧
            this.popList = new PopList();
            this.popList.bind('sync', _.bind(function () {
                this.popList.loaded = true;
                this.renderPopCount();
            }, this));
            this.popList.fetch({reset: true, data:{user_id:userId}});


            // チェックアーティスト一覧
            this.checkArtists = new UserArtistFollowList();
            this.checkArtists.bind('sync', _.bind(function () {
                this.checkArtists.loaded = true;
                this.renderCheckArtistsCount();
            }, this));
            this.checkArtists.fetch({reset:true, data:{user_id:userId}});


            // // フォローしているユーザー一覧
            this.userFollowList = new UserFollowList();
            this.userFollowList.bind('sync', _.bind(function () {
                this.userFollowList.loaded = true;
                this.renderUserFollowCount();
            }, this));
            this.userFollowList.fetch({reset:true, data: {user_id:userId}});


            // // フォローされているユーザー一覧取得
            this.userFollowedList = new UserFollowList();
            this.userFollowedList.bind('sync', _.bind(function () {
                this.userFollowedList.loaded = true;
                this.renderUserFollowedCount();
            }, this));
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:userId}});
            

            // プレイリスト一覧取得
            this.userPlaylistList = new UserPlaylistList();
            this.userPlaylistList.bind('sync', this.renderUserPlaylistList);
            this.userPlaylistList.fetch({reset:true, data:{user_id:userId}});

        },


        /**
         * 終了処理
         */
        dealloc: function () {},
    
    });



    return UserView;

});
