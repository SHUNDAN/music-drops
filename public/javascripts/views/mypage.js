"use strict";
/**
 * View: Mypage
 */
define([
    'views/common/youtube',
    'views/common/confirmDialog',
    'views/pop/index',
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_playlist',
    'models/user/user_playlist_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/user/user_artist_follow',
    'models/user/user_artist_follow_list',
    'models/pop/pop',
    'models/pop/pop_list',
    'models/common/user_storage',
], function (
    YoutubeView,
    ConfirmDialogView,
    PopView,
    User,
    UserPocket,
    UserPocketList,
    UserPlaylist,
    UserPlaylistList,
    UserFollow,
    UserFollowList,
    UserArtistFollow,
    UserArtistFollowList,
    Pop,
    PopList,
    UserStorage
) {

    var MypageView = Backbone.View.extend({

        currentPlaylist: null,
        userStorage:  new UserStorage(),
        displayPocketListModel: new UserPocketList(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this,
                'render',
                'renderMyDrops',
                'renderCheckArtists',
                'renderFollowUsers',
                'renderFollowedUsers',
                '_filterUserPocketList',
                'renderUserPocketListArea',
                'renderUserPocketList',
                'renderPlaylist',
                'renderUserFollowPlaylist',
                'deletePocket',
                'filterPockets',
                'show',
                'dealloc');

            this.userPlaylistList = new UserPlaylistList();
            this.userPlaylistList.bind('reset', this.renderPlaylist);
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);
            this.userArtistFollowList = new UserArtistFollow();
            this.userArtistFollowList.bind('reset', this.renderUserArtistFollow);


        },



        // マイページ表示
        render: function () {
            var snipet = _.mbTemplate('page_mypage', {user:this.user});
            this.$el.append(snipet);
        },


        // マイDrop表示
        renderMyDrops: function () {
            var snipet = _.mbTemplate('page_mypage_mypop_list', {popList:this.myPopList.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfMyDrops').text('(' + this.myPopList.length + ')');
        },


        // チェックアーティスト表示
        renderCheckArtists: function () {
            var snipet = _.mbTemplate('page_mypage_check_artists', {checkArtists:this.checkArtists.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfCheckArtists').text('(' + this.checkArtists.length + ')');
        },


        // フォローしているユーザー表示
        renderFollowUsers: function () {
            var snipet = _.mbTemplate('page_mypage_follow_users', {followUsers: this.followUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfFollowUsers').text('(' + this.followUsers.length + ')');
        },


        // フォローされているユーザー表示
        renderFollowedUsers: function () {
            var snipet = _.mbTemplate('page_mypage_followed_users', {followedUsers: this.followedUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
            // 件数も
            $('#numOfFollowedUsers').text('(' + this.followedUsers.length + ')');
        },


        // Pocketリスト表示（displayUserPocketをrendering）
        renderUserPocketListArea: function (options) {

            // Option系
            options = options || {};
            options.nowPlaylist = (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1);
            options.filterWords = this.filterWords || [];

            var feelings = _.mbStorage.getCommon().feelings;
            var snipet = _.mbTemplate('page_mypage_user_pocket_list_area', {feelings:feelings, options:options});
            this.$el.find('[data-type="dataArea"]').html(snipet);

            // 中身もレンダリング
            this.renderUserPocketList(options);
        },

        // Pocketリスト表示
        renderUserPocketList: function (options) {

            // 表示情報
            this.filteredPocketList = this._filterUserPocketList();

            // Option系
            options = options || {};
            options.nowPlaylist = (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1);
            options.filterWords = this.filterWords || [];

            var feelings = _.mbStorage.getCommon().feelings;
            var snipet = _.mbTemplate('page_mypage_user_pocket_list', {pocketList:this.filteredPocketList.models, feelings:feelings, options:options});
            this.$el.find('#pocketListArea').html(snipet);

            // 件数更新
            this.$el.find('#numOfPockets').text(this.filteredPocketList.length);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
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



        // Playlistを表示
        renderPlaylist: function () {
            var playlists = _.filter(this.userPlaylistList.models, function (playlist) {
                return playlist.attributes.type !== 3; // フォロープレイリストではない。
            });
            var snipet = _.mbTemplate('page_mypage_playlist', {playlists: playlists});
            this.$el.find('#playlistList').html(snipet);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
        },


        /**
            フォローしているプレイリストを表示
        */
        renderUserFollowPlaylist: function () {
            var snipet = _.mbTemplate('page_mypage_follow_playlist', {playlists: this.userFollowPlaylistList.models});
            this.$el.find('#followPlaylist').html(snipet);
        },






        // マイドロップ一覧を表示
        showMyDrops: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');


            // 既にあれば、それを表示
            if (this.myPopList && this.myPopList.length > 0) {
                this.renderMyDrops();
                return;
            }

            // 無ければロードして、表示
            this.myPopList = new PopList();
            this.myPopList.bind('reset', this.renderMyDrops);
            this.myPopList.fetch({reset:true, data:{user_id:this.user.id}});

            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($(e.currentTarget));

            return false;
        },


        /**
            チェックアーティストを表示
        */
        showCheckArtists: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');


            // 既にあればそれを表示
            if (this.checkArtists && this.checkArtists.length > 0) {
                this.renderCheckArtists();

            } else {
                // 無ければロードして表示
                this.checkArtists = new UserArtistFollowList();
                this.checkArtists.bind('reset',this.renderCheckArtists);
                this.checkArtists.fetch({reset:true, data:{user_id:this.user.id}});
            }

            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($(e.currentTarget));


            return false;
        },


        /**
            フォローしているユーザー表示
        */
        showFollowUsers: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // 既にあればそれを表示
            if (this.followUsers && this.followUsers.length > 0) {
                this.renderFollowUsers();

            } else {
                // なければロードして表示
                this.followUsers = new UserFollowList();
                this.followUsers.bind('reset', this.renderFollowUsers);
                this.followUsers.fetch({reset:true, data:{user_id:this.user.id}});
            }

            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($(e.currentTarget));


            return false;
        },


        /**
            フォローされているユーザー表示
        */
        showFollowedUsers: function (e) {
            e.preventDefault();

            // 表示物は削除
            $('[data-type="dataArea"]').html('');

            // 既にあればそれを表示
            if (this.followedUsers && this.followedUsers.length > 0) {
                this.renderFollowedUsers();

            } else {
                // なければロードして表示
                this.followedUsers = new UserFollowList();
                this.followedUsers.bind('reset', this.renderFollowedUsers);
                this.followedUsers.fetch({reset:true, data:{dest_user_id:this.user.id}});
            }

            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($(e.currentTarget));


            return false;
        },



        /**
         * 曲を再生する
         */
         playMusic: function (e) {
            var $li = $(e.currentTarget).parents('[data-pocket-id]');
            var pocketId = $li.data('pocket-id');
            pocketId = parseInt(pocketId, 10);



            // もしPause中の場合には、再開のみを行う
            if ($li.data('nowpausing')) {
                $li.removeAttr('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }




            var options = {};

            // playlist name.
            options.playlistName = (this.currentPlaylist ? this.currentPlaylist.attributes.title : 'すべてのPocket');
            options.identifier = 'mylist ' + options.playlistName;


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





         // Playlistの中身を表示する
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

            // ALLの場合のみ、最新順とする
            if (playlist.attributes.type === 1) {
                pocketIds.reverse();
            }

            // レンダリング
            this.displayUserPocketList = new UserPocketList();
            _.each(pocketIds, _.bind(function (pocketId) {
                this.displayUserPocketList.add(this.userPocketList.get(pocketId));
            }, this));
            this.renderUserPocketListArea();

            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($this);
         },


         /**
            サイドバーの指定されたメニューをアクティブ化する
         */
         _activeMenuAtSidebar: function ($target) {
            var $sidebar = this.$el.find('#leftArea');
            $sidebar.find('li').removeClass('is-active');
            $target.addClass('is-active');
         },




         // Playlistの編集表示・非表示を切り替える
         switchPlaylistEditStyle: function (e) {
            e.preventDefault();
            $('#playlistEditArea').toggleClass('edit');
            return false;
         },




         // プレイリスト追加
         addPlaylist: function () {
            console.debug('addPlaylist');

            // check not blank.
            var title = _.trim($('#playlistTitle').val());
            if (!title || title.length === 0) {
                alert('プレイリスト名を入力してください');
                $('#playlistTitle').val('');
                return;
            }

            // check max size.
            if (this.userPlaylistList.length >= 8) { // ALL + 最大数(7)
                alert('プレイリスト登録は最大7件までです。新規に登録する場合には、先にプレイリストを削除してください');
                return;
            }


            // 登録する
            this.userPlaylist = new UserPlaylist();
            this.userPlaylist.set('title', title);
            this.userPlaylist.bind('sync', _.bind(function () {

                // プレイリスト再読み込み
                this.userPlaylistList.fetch({reset:true, data:{user_id:this.user.id}});

                // 入力欄は初期化
                $('#playlistTitle').val('');

            }, this));
            this.userPlaylist.save();
         },



         // プレイリスト削除
         deletePlaylist: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var playlistId = $(e.currentTarget).parents('[data-playlist-id]').data('playlist-id');
            console.debug('deletePlaylist: ', playlistId);

            // 削除処理
            var fn = _.bind(function () {
                var userPlaylist = this.userPlaylistList.get(playlistId);
                userPlaylist.bind('sync', _.bind(function () {
                    this.userPlaylistList.remove(userPlaylist);
                    this.renderPlaylist();
                }, this));
                userPlaylist.destroy();
            }, this);


            // 確認ダイアログ
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: 'Playlistを削除しますか？',
            //     yesButtonCallback: fn
            // });
            if (window.confirm('プレイリストを削除しますか？')) {
                fn();
            }

            return false;
         },




         /**
            ドラッグ＆ドロップ機能を追加
         */
         addDragAndDropFacility: function () {

            var self = this;
            var pocketId;
            var playlistId;

            // Dragするもの
            this.$el.find('#pocketListArea li')
                .attr('draggable', 'true')
                .off('dragstart').on('dragstart', function (e) {
                    pocketId = $(e.currentTarget).data('pocket-id');
                    console.debug('drag start. ', pocketId);

                    // 自分のプレイリストの曲をDragDropの場合には、全ては反応させない
                    if (!self.currentPlaylist || self.currentPlaylist.attributes.type === 2) {
                        self.$el.find('[data-pleylist-type="1"]').addClass('noAction');
                    }

                    // 自分自身のプレイリストにもDragDropさせない
                    if (self.currentPlaylist) {
                        self.$el.find('#playlistList [data-playlist-id="'+self.currentPlaylist.attributes.id+'"]').addClass('noAction');
                    }



                }).off('dragend').on('dragend', function (e) {
                    console.debug('dragend');

                    // Drag開始時に付与した制約を解除する
                    self.$el.find('#playlistList li').removeClass('noAction');
                });

            // Drop先
            this.$el.find('[data-drop-target="playlist"]')
                .css('-khtml-user-drag', 'element')
                .off('dragenter').on('dragenter', function (e) {
                    $(e.currentTarget).addClass('dropTarget');
                    playlistId = $(e.currentTarget).data('playlist-id');
                    console.debug('dragenter: ', playlistId);
                    e.preventDefault();
                    e.stopPropagation();

                }).off('dragover').on('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                }).off('dragleave').on('dragleave', function (e) {
                    console.debug('dragleave', e);
                    $(e.currentTarget).removeClass('dropTarget');
                    playlistId = null;
                    e.preventDefault();
                    e.stopPropagation();

                }).off('drop').on('drop', function (e) {
                    console.debug('drop', pocketId, playlistId);
                    e.preventDefault();
                    e.stopPropagation();


                    // 他人のプレイリストからのドラッグドロップは色々と面倒なため、別対応する
                    if (self.currentPlaylist && self.currentPlaylist.attributes.type === 3) {
                        self._treatDragDropFromOtherPlaylist(pocketId, playlistId);
                        $(e.currentTarget).removeClass('dropTarget');
                        return;
                    }



                    // プレイリストにまだ存在しないPocketIdの場合は、追加処理をする。
                    var playlist = self.userPlaylistList.get(playlistId);
                    var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                    if (!_.contains(pocketIds, pocketId)) {


                        // 30曲以上はだめ
                        if (pocketIds.length >= 30) {
                            alert('プレイリストに追加可能な数は30までです。追加する場合には、先にプレイリスト内のPocketを削除してください。');
                            $(e.currentTarget).removeClass('dropTarget');
                            return false;
                        }

                        // プレイリストの更新
                        pocketIds.push(pocketId);
                        playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                        playlist.bind('sync', function () {
                            self.renderPlaylist();
                        });
                        playlist.save();
                        $(e.currentTarget).removeClass('dropTarget');

                    } else {
                        alert('既に登録済みのPocketです。');
                        console.debug('既に登録済みのPocketです。 pocketId=', pocketId);
                        $(e.currentTarget).removeClass('dropTarget');
                        return false;
                    }
                });

         },



         /**
            他人のプレイリストからのドラッグドロップに対応する
         */
         _treatDragDropFromOtherPlaylist: function (pocketId, playlistId) {

            var self = this;

            // 対象のPocketと同一曲が自分のPocketに無い場合には、まずはPocket追加する
            var pocket = this.followPlaylistPocketsMap[this.currentPlaylist.attributes.id].get(pocketId);
            if (!pocket) {
                alert('エラーが発生しました');
                return;
            }

            // 同一曲のPocketがあるかを探す
            var userPocket = _.filter(this.userPocketList.models, function (userPocket) {
                return userPocket.attributes.music_id === pocket.attributes.music_id;
            });


            // 同一曲のPocketがある場合
            if (userPocket.length > 0) {
                pocketId = userPocket[0].attributes.id;

                // プレイリストにまだ存在しないPocketIdの場合は、追加処理をする。
                var playlist = self.userPlaylistList.get(playlistId);
                var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                if (!_.contains(pocketIds, pocketId)) {

                    // プレイリストの更新
                    pocketIds.push(pocketId);
                    playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                    playlist.bind('sync', function () {
                        self.renderPlaylist();
                    });
                    playlist.save();

                } else {
                    console.debug('既に登録済みのPocketです。 pocketId=', pocketId);
                }

                return;
            }


            // 存在しない曲の場合、Pocketを新規作成してからそれをプレイリストに登録する
            $.ajax({
                url: '/api/v1/copy_pockets/' + pocketId,
                method: 'post',
                dataType: 'json',
                success: function (json) {
                    console.debug('copy pocket successed.');

                    // UserPocketListに追加しておく
                    console.debug('userPocketList.length: ', self.userPocketList.length);
                    // var userPocket = UserPocket.createInstance(json);
                    var userPocket = new UserPocket();
                    userPocket.set('id', json.id);
                    userPocket.attributes = json;
                    self.userPocketList.add(userPocket);
                    console.debug('userPocketList.length: ', self.userPocketList.length);


                    pocketId = json.id;


                    // Drop先のプレイリスト
                    var playlist = self.userPlaylistList.get(playlistId);
                    var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                    pocketIds.push(pocketId);
                    playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                    playlist.bind('sync', function () {
                        self.renderPlaylist();
                    });
                    playlist.save();

                    // Allのプレイリスト（該当プレイリストがALLでは無い場合）
                    if (playlist.attributes.type !== 1) {
                        var allPlaylistId;
                        _.each(self.userPlaylistList.models, function (playlist) {
                            if (playlist.attributes.type === 1) {
                                allPlaylistId = playlist.attributes.id;
                            }
                        });
                        var playlistAll = self.userPlaylistList.get(allPlaylistId);
                        var pocketIds = JSON.parse(playlistAll.get('user_pocket_ids'));
                        pocketIds.push(pocketId);
                        playlistAll.set('user_pocket_ids', JSON.stringify(pocketIds));
                        playlistAll.bind('sync', function () {
                            self.renderPlaylist();
                        });
                        playlistAll.save();
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


         },







         /**
            Pocketリストの編集状態を切り替える
         */
         editPocketList: function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.$el.find('#pocketListArea').hasClass('editStyle')) {

                if (!this.currentPlaylist || this.currentPlaylist.attributes.type === 1) {
                    $(e.currentTarget).text('Pocket編集');
                } else {
                    $(e.currentTarget).text('playlist編集');
                    $('[data-type="annotationMessage"]').toggleClass('hidden');
                }
                $('#pocketDeleteArea').addClass('hidden');

                // ソート機能を解除
                try {
                    $('#pocketListArea').sortable('destroy');
                } catch(e) {}

                // ドラッグ再開
                $('#pocketListArea li').attr('draggable', 'true');


                // ソート結果をサーバーへPushする
                if (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1) {

                    var ids = [];
                    $('#pocketListArea li').each(function () {
                        ids.push($(this).data('pocket-id'));
                    });
                    console.debug('ids: ', ids);
                    this.currentPlaylist.set('user_pocket_ids', JSON.stringify(ids));
                    this.currentPlaylist.save();
                }


            } else {
                $(e.currentTarget).text('完了');

                // ドラッグ停止
                $('#pocketListArea li').attr('draggable', 'false');

                // プレイリスト編集の場合は、並び替えをサポートする
                if (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1) {
                    $('#pocketListArea').sortable();
                    $('[data-type="annotationMessage"]').toggleClass('hidden');
                }

            }

            this.$el.find('#pocketListArea').toggleClass('editStyle');
         },






        /**
         * Pocketを削除する
         */
        deletePocket: function (e) {

            // 確認ダイアログを表示
            var message;
            var callback;
            this.deleteTargetPocketId = $(e.currentTarget).parents('[data-pocket-id]').data('pocket-id');
            if (!this.currentPlaylist || this.currentPlaylist.attributes.type === 1) { // ALL
                message = 'Pocketを削除しますか？';
                callback = _.bind(this._deletePocket, this);
            } else {
                message = 'プレイリストから削除しますか？';
                callback = _.bind(this._deletePocketFromPlaylist, this);
            }
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: message,
            //     yesButtonCallback: callback
            // });
            if (window.confirm(message)) {
                callback();
            }

        },


        // Pocketを削除
        _deletePocket: function () {

            var pocketId = this.deleteTargetPocketId;
            console.log('deletePocket', pocketId);

            var aPocket = this.userPocketList.get(pocketId);
            aPocket.bind('sync', _.bind(function () {

                // Pocketリストから削除
                this.userPocketList.remove(aPocket);

                // 各プレイリストからも削除
                _.each(this.userPlaylistList.models, function (model) {
                    var oldIds = JSON.parse(model.attributes.user_pocket_ids);
                    var newIds = _.filter(oldIds, function (id) {return id !== pocketId});

                    if (oldIds.length != newIds.length) {
                        model.attributes.user_pocket_ids = JSON.stringify(newIds);
                        model.save();
                    }
                });

                // 表示中のPocketsからも削除
                var aModel = this.displayUserPocketList.get(pocketId);
                if (aModel) {
                    this.displayUserPocketList.remove(aModel);
                }


                // プレイリストを再レンダリング
                this.renderPlaylist();

                // Pocketsを再レンダリング
                this.renderUserPocketList({edit:true});


                // Localデータも更新
                _.loadUserPockets({force: true});

            }, this));
            aPocket.destroy({wait: true});

        },

        // playlistから削除
        _deletePocketFromPlaylist: function () {

            var pocketId = this.deleteTargetPocketId;
            console.log('deletePocketFromPlaylist', pocketId);

            var model = this.currentPlaylist;
            var oldIds = JSON.parse(model.attributes.user_pocket_ids);
            var newIds = _.filter(oldIds, function (id) {return id !== pocketId});
            model.attributes.user_pocket_ids = JSON.stringify(newIds);
            model.bind('sync', _.bind(function () {

                // 表示中のPocketsからも削除
                var aModel = this.displayUserPocketList.get(pocketId);
                if (aModel) {
                    this.displayUserPocketList.remove(aModel);
                }

                // プレイリストを再レンダリング
                this.renderPlaylist();

                // Pocketsを再レンダリング
                this.renderUserPocketList({edit:true});


            }, this));
            model.save();

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
            フォローしているプレイリストの中身を表示する
        */
        showFollowPlaylist: function (e) {
            var $this = $(e.currentTarget);
            var playlistId = $this.data('playlist-id');
            console.debug('showFollowPlaylist: ', playlistId);

            // 現在のプレイリストを設定する
            this.currentPlaylist = this.userFollowPlaylistList.get(playlistId);

            // キャッシュがあればそれを表示する
            if (this.followPlaylistPocketsMap && this.followPlaylistPocketsMap[playlistId]) {
                this.displayUserPocketList = this.followPlaylistPocketsMap[playlistId];
                this.renderUserPocketListArea({noEdit:true});
            }


            // キャッシュが無ければ、ロードして表示する
            var userPocketList = new UserPocketList();
            userPocketList.bind('sync', _.bind(function () {
                console.debug('suerPocketList: ', userPocketList);

                this.followPlaylistPocketsMap = this.followPlaylistPocketsMap || {};
                this.followPlaylistPocketsMap[playlistId] = userPocketList;

                this.displayUserPocketList = userPocketList;
                this.renderUserPocketListArea({noEdit:true});

            }, this));
            console.debug('current: ', this.currentPlaylist.attributes.user_pocket_ids);
            userPocketList.fetch({reset:true, data:{targets:this.currentPlaylist.attributes.user_pocket_ids}});


            // 選択されたプレイリストを選択状態にする
            this._activeMenuAtSidebar($this);
        },



        /**
            フォロープレイリストの編集表示、非表示
        */
        editFollowPlaylistButton: function (e) {
            console.debug('editFollowPlaylistButton');
            e.preventDefault();

            if ($('#followPlaylist').hasClass('edit')) {
                $(e.currentTarget).text('編集');
            } else {
                $(e.currentTarget).text('完了');
            }

            $('#followPlaylist').toggleClass('edit');

            return false;
        },




        /**
            フォロー中のプレイリストを削除
        */
        deleteFollowPlaylist: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var playlistId = $(e.currentTarget).parents('[data-playlist-id]').data('playlist-id');
            console.debug('deleteFollowPlaylist: ', playlistId);

            // 削除処理
            var fn = _.bind(function () {
                var userPlaylist = this.userPlaylistList.get(playlistId);
                userPlaylist.bind('sync', _.bind(function () {
                    this.userPlaylistList.remove(userPlaylist);

                    // もう一個のリストからも削除
                    var model = this.userFollowPlaylistList.get(playlistId);
                    this.userFollowPlaylistList.remove(model);

                    // レンダリング
                    this.renderUserFollowPlaylist();

                    // Storageも更新
                    _.mbStorage.refreshUser({target:'playlist'});


                }, this));
                userPlaylist.destroy();
            }, this);


            // 確認ダイアログ
            // var confirmDialog = new ConfirmDialogView();
            // confirmDialog.show({
            //     message: 'フォローしているPlaylistを削除しますか？',
            //     yesButtonCallback: fn
            // });
            if (window.confirm('フォローしているプレイリストを削除しますか？')) {
                fn();
            }







            return false;

        },



        /**
            ユーザーフォローする
        */
        followUser: function (e) {
            console.debug('followUser');

            var $li = $(e.currentTarget).parents('li');
            var userId = $li.data('user-id');
            _.followUser(userId, _.bind(function () {

                $li.find('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

            }, this));

        },



        /**
            ユーザーフォロー解除する
        */
        unfollowUser: function (e) {
            console.debug('unfollowUser');

            var $li = $(e.currentTarget).parents('li');
            var userId = $li.data('user-id');

            // userFollowIdを探す
            var id = _.selectUserFollowId(userId);
            if (id) {
                _.unfollowUser(id, _.bind(function () {

                    $li.find('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

                }, this));

            } else {
                // IDが特定できない場合には、ログインを促す。
                mb.router.appView.authErrorHandler();

            }

        },




        /**
            アーティストフォローする
        */
        followArtist: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var artistId = $li.data('artist-id');
            console.debug('followArtist:', artistId);

            // フォロー
            _.followArtist(artistId, function () {
                $li.find('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });
        },


        /**
            アーティストフォローを解除する
        */
        unfollowArtist: function (e) {
            var $li = $(e.currentTarget).parents('li');
            var artistId = $li.data('artist-id');
            console.debug('unfollowArtist:', artistId);

            // idを取得
            var id = _.selectArtistFollowId(artistId);
            // アンフォロー
            _.unfollowArtist(id, function () {
                $li.find('[data-event-click="followArtist"], [data-event-click="unfollowArtist"]').toggleClass('hidden');
            });

        },




        /**
            Popを編集する
        */
        editPop: function (e) {
            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.debug('editPop', popId);

            var pop = this.myPopList.get(popId);

            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(pop.attributes.music_id, popId, 'modal');

        },


        /**
            Popを削除する
        */
        deletePop: function (e) {
            var $li = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $li.data('pop-id');
            console.debug('deletePop', popId);

            // OKの場合のみ削除する
            if (window.confirm('Popを削除しますか？')) {

                var pop = this.myPopList.get(popId);
                pop.bind('sync', _.bind(function () {

                    this.myPopList.remove(pop);
                    this.renderMyDrops();

                }, this));
                pop.destroy({wait:true});
            }
        },





























        show: function () {
            console.log('show mypage');

            // session storageに該当情報が無い場合には、フォワード
            if (!_.isLogedIn()) {
                mb.router.navigate('login', true);
                return;
            } else {
                this.user = JSON.parse(localStorage.getItem('user'));
            }


            // 画面表示
            this.render();

            // ユーザーPocketリストを取得
            this.userPocketList = new UserPocketList();
            this.userPocketList.bind('reset', _.bind(function () {

                // 日付の新しい順に並び替える
                this.userPocketList.models = _.sortBy(this.userPocketList.models, function (model) {
                    return model.attributes.create_at * -1;
                });


                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketListArea();
                // ついでにStorageにも保存しておく
                _.mbStorage.setUserPocketsWithBackboneCollection(this.userPocketList);

            }, this));
            this.userPocketList.fetch({reset:true, data:{user_id:this.user.id}});

            // ユーザーのプレイリストを取得
            this.userPlaylistList.fetch({reset:true, data:{user_id:this.user.id}});


            // フォローしているプレイリスト
            this.userFollowPlaylistList = new UserPlaylistList();
            this.userFollowPlaylistList.bind('sync', this.renderUserFollowPlaylist);
            this.userFollowPlaylistList.fetchFollowPlaylist(this.user.id);

        },

        dealloc: function () {

        },

    });

    return MypageView;

});
