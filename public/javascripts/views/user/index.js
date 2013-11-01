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
    'models/user/user_playlist',
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
    UserPlaylist,
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
                'renderUserPocketListArea',
                'renderUserPocketList',
                'renderUserPlaylistList',
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
        renderUserPocketListArea: function () {

            // 表示オプション
            var options = {
                playlist: this.currentPlaylist
            };

            var snipet = _.mbTemplate('page_user_user_pocket_list_area', {
                feelings: _.mbStorage.getCommon().feelings,
                options: options
            });
            this.$el.find('[data-type="dataArea"]').html(snipet);


            // 中身表示
            this.renderUserPocketList();
        },


        /**
            Pocketリストを表示
        */
        renderUserPocketList: function () {

            // 絞り込み結果を考慮する
            this.filteredPocketList = this._filterUserPocketList();

            console.log('renderPocketList.', this.filteredPocketList);
            var snipet = _.mbTemplate('page_user_user_pocket_list', {
                pocketList: this.filteredPocketList.models
            });
            this.$el.find('#pocketListArea').html(snipet);

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


            var snipet = _.mbTemplate('page_mypage_playlist', {playlists:playlists});
            this.$el.find('#playlistList').html(snipet);
        },





        /**
            Pop一覧を表示する
        */
        showMyDrops: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.popList.loaded) {
                setTimeout(this.showMyDrops, 100);
                return;
            }

            // 表示する
            this.renderMyDrops();

            // サイドバーで自分のメニューをアクティブにする
            this._activeMenuAtSidebar($(e.currentTarget));

        },


        /**
            チェックアーティスト一覧を表示する
        */
        showCheckArtists: function (e) {

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // まだロードされていなければ待つ。
            if (!this.checkArtists.loaded) {
                setTimeout(this.showCheckArtists, 100);
                return;
            }

            // 表示する
            this.renderCheckArtists();

            // サイドバーで自分のメニューをアクティブにする
            this._activeMenuAtSidebar($(e.currentTarget));
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

            // サイドバーで自分のメニューをアクティブにする
            this._activeMenuAtSidebar($(e.currentTarget));
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

            // サイドバーで自分のメニューをアクティブにする
            this._activeMenuAtSidebar($(e.currentTarget));
        },






        /**
            Pocketを再生する
        */
        // TODO ここの機能は、Mypageとほとんど同じ実装なので、綺麗に共通化したいなぁ。
        playMusic: function (e) {
            var $li = $(e.currentTarget).parents('[data-pocket-id]');
            var pocketId = $li.data('pocket-id');
            console.debug('playMusic: ', pocketId);


            // もしPause中の場合には、再開のみを行う
            if ($li.data('nowpausing')) {
                $li.removeAttr('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            var options = {};

            // playlist name.
            options.playlistName = (this.currentPlaylist ? this.currentPlaylist.attributes.title : 'すべてのPocket');
            options.identifier = 'user' + this.user.id + (this.currentPlaylist ? this.currentPlaylist.attributes.id : 'すべてのPocket');


            // startPos, playlist.
            options.startPos = 0;
            options.musicArray = [];
            for (var i = 0; i < this.filteredPocketList.models.length; i++) {
                var model = this.filteredPocketList.models[i];
                options.musicArray.push(model.attributes);
                if (model.attributes.id === pocketId) {
                    options.startPos = i;
                }
            }

            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {

                this.$el.find('#pocketListArea').find('[data-event-click="stopMusic"]').addClass('hidden');
                this.$el.find('#pocketListArea').find('[data-event-click="playMusic"]').removeClass('hidden');
                this.$el.find('#pocketListArea [data-pocket-id="'+music.id+'"]').find('[data-event-click="playMusic"], [data-event-click="stopMusic"]').toggleClass('hidden');

            }, this);
            options.callbackWhenEnd = options.callbackWhenPause = _.bind(function () {
                this.$el.find('#pocketListArea').find('[data-event-click="stopMusic"]').addClass('hidden');
                this.$el.find('#pocketListArea').find('[data-event-click="playMusic"]').removeClass('hidden');
            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);



        },



         /**
            一時停止する
         */
         stopMusic: function (e) {
            mb.musicPlayer.pauseMusic();
            $(e.currentTarget).parents('[data-pocket-id]').attr('data-nowpausing', 'true');
         },




        /**
            プレイリストの中身を表示
        */
        showPlaylist: function (e) {
            var $this = $(e.currentTarget);
            var playlistId = $this.data('playlist-id');
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
            this.renderUserPocketListArea();

            // サイドバーで自分のメニューをアクティブにする
            this._activeMenuAtSidebar($this);

        },



        // 表示Pocketをフィルタリング
        _filterUserPocketList: function () {

            var self = this;
            var filteredPocketList = new UserPocketList();
            var models = [];

            // word絞り込み
            if (self.filterWords && self.filterWords.length > 0) {
                console.debug('aaaa', self.displayUserPocketList.models.length);
                _.each(self.displayUserPocketList.models, function (pocket) {
                    var good = false;
                    _.each(self.filterWords, function (word) {
                        if (pocket.attributes.title.indexOf(word) !== -1
                            || pocket.attributes.artist_name.indexOf(word) !== -1) {
                            good = true;
                        }
                    });
                    if (good) {
                        models.push(pocket);
                    }
                });

            } else {
                console.debug('bbb', self.displayUserPocketList.models.length);
                models = self.displayUserPocketList.models;
            }

            // feeling絞り込み
            if (self.filterFeelingId) {
                console.debug('feelingId: ', self.filterFeelingId);
                models = _.filter(models, function (model) {
                    return model.attributes.feeling_id === self.filterFeelingId;
                });
            }

            filteredPocketList.models = models;
            return filteredPocketList;
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



        /**
            プレイリストをフォローする
        */
        followPlaylist: function (e) {
            e.preventDefault();
            console.debug('followPlaylist:', this.currentPlaylist.attributes.id);

            // 上限チェック
            var user = _.mbStorage.getUser();
            if (user) {
                if (user.userFollowPlaylistList.length >= 7) {
                    alert('プレイリストフォローは最大7件までです。新規に登録する場合には、先にプレイリストを削除してください');
                    return;
                }
            }


            // プレイリスト追加
            var aPlaylist = new UserPlaylist();
            aPlaylist.set('user_id', this.user.id);
            aPlaylist.set('title', this.currentPlaylist.attributes.title);
            aPlaylist.set('dest_playlist_id', this.currentPlaylist.attributes.id);
            aPlaylist.set('type', 3);
            aPlaylist.bind('sync', _.bind(function () {

                // 表示きりかえ
                $('[data-event-click="followPlaylist"],[data-event-click="unfollowPlaylist"]').toggleClass('hidden');

                // Storage更新
                _.mbStorage.refreshUser({target:'userFollowPlaylistList', type:'add'});
            }, this));
            aPlaylist.save();




            return false;
        },


        /**
            プレイリストのフォローを解除する
        */
        unfollowPlaylist: function (e) {
            e.preventDefault();
            console.debug('unfollowPlaylist:', this.currentPlaylist.attributes.id);


            // 削除
            $.ajax({
                url: '/api/v1/user_playlists',
                method: 'delete',
                data: {dest_playlist_id: this.currentPlaylist.attributes.id},
                success: function () {

                    // 表示きりかえ
                    $('[data-event-click="followPlaylist"],[data-event-click="unfollowPlaylist"]').toggleClass('hidden');

                    // Storage更新
                    _.mbStorage.refreshUser({target:'userFollowPlaylistList', type:'delete'});

                },
                error: function () {
                    alert('エラーが発生しました。リロードしてください。');
                },
            });

            return false;
        },




        /**
            Pocket絞り込み（フリーワード）
        */
        filterPockets: function () {

            // 検索ワード
            var conditions = [];
            _.each($('#filterByNameInput').val().split(/\s/), function (word) {
                word = _.trim(word);
                if (word.length > 0) {
                    conditions.push(word);
                }
            });
            console.debug('conditions: ', conditions);


            // 検索条件がある場合、または前に検索条件があった場合には、レンダリング
            if (conditions.length > 0 || (this.filterWords && this.filterWords.length > 0)) {
                this.filterWords = conditions;
                this.renderUserPocketList();
            }

        },


        /**
            Pocketしぼり込み（気分）
        */
        filterPockets2: function () {
            console.debug('filterPockets2');
            this.filterFeelingId = parseInt($('#filterByFeelingSelect option:selected').val());
            this.renderUserPocketList();
        },



         /**
            サイドバーの指定されたメニューをアクティブ化する
         */
         _activeMenuAtSidebar: function ($target) {
            var $sidebar = this.$el.find('#leftArea');
            $sidebar.find('li').removeClass('is-active');
            $target.addClass('is-active');
         },

























        /**
            ページ表示
        */
        show: function (userId) {

            // わくを表示
            this.render();

            // ユーザーデータ取得
            this.user.set('id', userId);
            this.user.fetch({reset: true});

            // Pocketリスト取得
            this.userPocketList.bind('sync', _.bind(function () {
                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketListArea();
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
