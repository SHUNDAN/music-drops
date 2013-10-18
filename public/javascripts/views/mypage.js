"use strict";
/**
 * View: Mypage
 */
define([
    'views/common/youtube',
    'views/common/confirmDialog',
    'models/user/user',
    'models/user/user_pocket',
    'models/user/user_pocket_list',
    'models/user/user_playlist',
    'models/user/user_playlist_list',
    'models/user/user_notification_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/user/user_artist_follow',
    'models/user/user_artist_follow_list',
    'models/pop/pop_list',
    'models/common/user_storage',
], function (
    YoutubeView,
    ConfirmDialogView,
    User,
    UserPocket,
    UserPocketList,
    UserPlaylist,
    UserPlaylistList,
    UserNotificationList,
    UserFollow,
    UserFollowList,
    UserArtistFollow,
    UserArtistFollowList,
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

                'showUserPocketList',
                'renderUserPocketList',
                'renderPlaylist',
                'showUserNotificationList',
                'showYoutube',
                'deletePocket',
                'deleteNofitication',
                'changeTags',
                'filterPockets',
                'saveFilter',
                'useFilter',
                'clearFilter',
                'deleteFilter',
                'show',
                'dealloc');

            this.userPlaylistList = new UserPlaylistList();
            this.userPlaylistList.bind('reset', this.renderPlaylist);
            this.userNotifitactionList = new UserNotificationList();
            this.userNotifitactionList.bind('reset', this.showUserNotificationList);
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);
            this.userArtistFollowList = new UserArtistFollow();
            this.userArtistFollowList.bind('reset', this.renderUserArtistFollow);

            if (_.isIphone || _.isAndroid) {
                $(document).off().on('blur', '[data-event="filterPockets"]', this.filterPockets);
            } else {
                $(document).off().on('keyup', '[data-event="filterPockets"]', this.filterPockets);
            }
        },

        events: {
            'click [data-event="showYoutube"]': 'showYoutube',
            'click [data-event="deletePocket"]' : 'deletePocket',
            'click [data-event="deleteNotification"]': 'deleteNofitication',
            'blur [data-event="changeTags"]': 'changeTags',
            'click [data-event="saveFilter"]': 'saveFilter',
            'click [data-event="useFilter"]': 'useFilter',
            'click [data-event="clearFilter"]': 'clearFilter',
            'click [data-event="deleteFilter"]': 'deleteFilter',
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
        },


        // チェックアーティスト表示
        renderCheckArtists: function () {
            var snipet = _.mbTemplate('page_mypage_check_artists', {checkArtists:this.checkArtists.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローしているユーザー表示
        renderFollowUsers: function () {
            var snipet = _.mbTemplate('page_mypage_follow_users', {followUsers: this.followUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // フォローされているユーザー表示
        renderFollowedUsers: function () {
            var snipet = _.mbTemplate('page_mypage_followed_users', {followedUsers: this.followedUsers.models});
            this.$el.find('[data-type="dataArea"]').html(snipet);
        },


        // Pocketリスト表示（displayUserPocketをrendering）
        renderUserPocketList: function (options) {
            options = options || {};
            options.nowPlaylist = (this.currentPlaylist && this.currentPlaylist.attributes.type !== 1);
            console.debug('options: ', options, this.currentPlaylist);
            var feelings = _.mbStorage.getCommon().feelings;
            var snipet = _.mbTemplate('page_mypage_user_pocket_list', {pocketList:this.displayUserPocketList.models, feelings:feelings, options:options});
            this.$el.find('[data-type="dataArea"]').html(snipet);

            // 件数更新
            this.$el.find('#numOfPockets').text(this.displayUserPocketList.length);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
        },


        // Playlistを表示
        renderPlaylist: function () {
            var snipet = _.mbTemplate('page_mypage_playlist', {playlists: this.userPlaylistList.models});
            this.$el.find('#playlistList').html(snipet);

            // ドラッグ＆ドロップ機能を追加
            this.addDragAndDropFacility();
        },






        // マイドロップ一覧を表示
        showMyDrops: function (e) {
            console.debug('showMyDrops');
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


            return false;
        },



        /**
         * 曲を再生する
         */
         playMusic: function (e) {
            var pocketId = $(e.currentTarget).parents('[data-pocket-id]').data('pocket-id');
            pocketId = parseInt(pocketId, 10);

            var options = {};

            // playlist name.
            options.playlistName = 'すべてのPocket';


            // startPos, playlist.
            options.startPos = 0;
            options.musicArray = [];
            for (var i = 0; i < this.displayUserPocketList.models.length; i++) {
                var model = this.displayUserPocketList.models[i];
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




         // Playlistの中身を表示する
         showPlaylist: function (e) {
            var playlistId = $(e.currentTarget).data('playlist-id');
            var playlist = this.userPlaylistList.get(playlistId);

            // 無い場合には、何もしない
            if (!playlist) {
                return false;
            }

            this.currentPlaylist = playlist;

            var pocketIds = JSON.parse(playlist.attributes.user_pocket_ids);
            this.displayUserPocketList = new UserPocketList();
            _.each(pocketIds, _.bind(function (pocketId) {
                this.displayUserPocketList.add(this.userPocketList.get(pocketId));
            }, this));

            this.renderUserPocketList();
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
            if (this.userPlaylistList.length >= 10) {
                alert('プレイリスト登録は最大10件までです。新規に登録する場合には、先にプレイリストを削除してください');
                return;
            }


            // 登録する
            this.userPlaylist = new UserPlaylist();
            this.userPlaylist.set('title', title);
            this.userPlaylist.bind('sync', _.bind(function () {
                this.userPlaylistList.add(this.userPlaylist);
                this.renderPlaylist();
                $('#playlistTitle').val('');
            }, this));
            this.userPlaylist.save();
         },



         // プレイリスト削除
         deletePlaylist: function (e) {
            e.preventDefault();
            var playlistId = $(e.currentTarget).parents('[data-playlist-id]').data('playlist-id');
            console.debug('deletePlaylist: ', playlistId);


            var userPlaylist = this.userPlaylistList.get(playlistId);
            userPlaylist.bind('sync', _.bind(function () {
                this.userPlaylistList.remove(userPlaylist);
                this.renderPlaylist();
            }, this));
            userPlaylist.destroy();

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


                }).off('dragend').on('dragend', function (e) {
                    console.debug('dragend');
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

                    // プレイリストにまだ存在しないPocketIdの場合は、追加処理をする。
                    var playlist = self.userPlaylistList.get(playlistId);
                    var pocketIds = JSON.parse(playlist.get('user_pocket_ids'));
                    if (!_.contains(pocketIds, pocketId)) {

                        pocketIds.push(pocketId);
                        playlist.set('user_pocket_ids', JSON.stringify(pocketIds));
                        playlist.bind('sync', function () {
                            self.renderPlaylist();
                        });
                        playlist.save();

                    } else {
                        console.debug('既に登録済みのPocketです。 pocketId=', pocketId);
                    }
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
                }
                $('#pocketDeleteArea').addClass('hidden');

                // ソート機能を解除
                $('#pocketListArea').sortable('destroy');
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
            var confirmDialog = new ConfirmDialogView();
            confirmDialog.show({
                message: message,
                yesButtonCallback: callback
            });

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
         * ユーザーPocket一覧を表示
         */
        showUserPocketList: function () {
            console.log('showUserPocketList');
            var template = $('#page_mypage_poplist').html();
            console.log(this.userPocketList.models);
            this.displayPocketListModel = _.sortBy(this.userPocketList.models, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {pocketList: this.displayPocketListModel, feelings: this.userStorage.getCommon().feelings});
            $('#poplist').html(snipet);
        },




        /**
         * ユーザーPocket一覧を表示2
         */
        showUserPocketList2: function () {
            console.log('showUserPocketList2');
            var template = $('#page_mypage_poplist').html();
            this.displayPocketListModel = _.sortBy(this.displayPocketListModel, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {pocketList: this.displayPocketListModel, feelings: this.userStorage.getCommon().feelings});
            $('#poplist').html(snipet);
        },

        /**
         * ユーザーお知らせ一覧の表示
         */
        showUserNotificationList: function () {
            console.log('showUserNotificationList');
            var template = $('#page_common_notification_list').html();
            var models = _.sortBy(this.userNotifitactionList.models, function (model) {return model.attributes.create_at * -1;});
            var snipet = _.template(template, {notificationList: models});
            this.$el.find('#notification_list').html(snipet);
        },




        /**
         * Youtube再生
         */
        showYoutube: function (e) {
            var pos = $(e.currentTarget).data('pos');
            console.log('showYoutube:', pos);


            // YoutubeId一覧を取得
            var ids = [];
            _.each(this.displayPocketListModel, function (model) {
                if (model.attributes.youtube_id) {
                    ids.push(model.attributes.youtube_id);
                }
            });
            console.log('ids', ids);

            // 再生順に並び替える
            var youtubeIds = [].concat(ids.slice(pos, ids.length)).concat(ids.slice(0,pos));
            console.debug('youtubeIds: ', youtubeIds);


            // Youtubeを再生する
            if (mb.youtubeView) {
                mb.youtubeView.dealloc();
            }
            mb.youtubeView = new YoutubeView();
            mb.youtubeView.show(youtubeIds, this);
        },








         /**
          * プレイリスト編集
          */
        editPlayList: function () {
            console.debug('editPlayList');
        },













        /**
         * お知らせ削除
         */
        deleteNofitication: function (e) {
            var notifId = $(e.currentTarget).data('notification-id');
            console.log('deleteNotification: ', notifId);

            var notification = this.userNotifitactionList.get(notifId);
            notification.bind('sync', _.bind(function () {
                this.showUserNotificationList();
            }, this));
            notification.destroy({wait: true});
        },


        changeTags: function (e) {
            var id = $(e.currentTarget).data('pocket-id');
            var tagString = $(e.currentTarget).text();
            console.log('changeTags', id, tagString);

            var tags = [];
            _.each(tagString.split(','), function (tag) {
                tag = _.trim(tag);
                if (tag.length !== 0) {
                    tags.push(tag);
                }
            });
            console.log('tags: ', tags);


            // サーバーへ保存する
            var anUserPocket = new UserPocket();
            anUserPocket.set('id', id);
            anUserPocket.set('tags', tags.join(','));
            anUserPocket.bind('sync', function () {
                console.log('update tags: ', id, tags);
            });
            anUserPocket.save();


            // 表示中のPocketにも反映します。
            var pocket = this.userPocketList.get(id);
            pocket.set('tags', tags.join(','));


        },



        filterPockets: function () {
            var title = $('#titleCondition').val();
            var artist = $('#artistCondition').val();
            var tagString = $('#tagsCondition').val();
            console.log('filterPockets', title, artist, tagString);


            // async process.
            setTimeout(_.bind(function () {

                // defaults.
                var displayPocketListModel = this.userPocketList.models;

                // filter by title.
                title = _.trim(title);
                console.log('title: ', title);
                if (title.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {
                        return model.attributes.title.indexOf(title) + 1;
                    });
                }


                // filter by artist
                artist = _.trim(artist);
                console.log('artist: ', artist);
                if (artist.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {
                        return model.attributes.artist_name.indexOf(artist) + 1;
                    });
                }


                // filter by tags.
                var tags = [];
                _.each(tagString.split(','), function (tag) {
                    tag = _.trim(tag);
                    if (tag.length !== 0) {
                        tags.push(tag);
                    }
                });
                console.log('tags: ', tags);
                if (tags.length !== 0) {
                    displayPocketListModel = _.filter(displayPocketListModel, function (model) {

                        var aTagString = model.attributes.tags;
                        if (!aTagString || aTagString.length === 0) {
                            return false;
                        }

                        var aTags = aTagString.split(',');
                        var found = false;
                        _.each(aTags, function (tag) {
                            if (_.contains(tags, tag)) {
                                found = true;
                            }
                        });
                        return found;
                    });
                }


                // render
                this.displayPocketListModel = displayPocketListModel;
                this.showUserPocketList2();


            }, this), 50);



        },



        saveFilter: function () {
            var title = $('#titleCondition').val();
            var artist = $('#artistCondition').val();
            var tagString = $('#tagsCondition').val();
            console.log('saveFilter: ', title, artist, tagString);


            var tags = [];
            _.each(tagString.split(','), function (tag) {
                tag = _.trim(tag);
                if (tag.length !== 0) {
                    tags.push(tag);
                }
            });


            // trim.
            title = _.trim(title);
            artist = _.trim(artist);

            // empty check.
            if (title.length === 0 && artist.length === 0 && tags.length === 0) {
                alert('empty condition not allowed');
                return;
            }


            // create condition.
            var condition = {
                title: title,
                artist: artist,
                tags: tags
            };


            // concat condition.
            var conditions = this.user.pocket_filter || '[]';
            conditions = JSON.parse(conditions);
            conditions.push(condition);
            this.user.pocket_filter = JSON.stringify(conditions);
            this.userStorage.setUser(this.user);


            // Update by API
            var anUser = new User();
            anUser.set('id', this.user.id);
            anUser.set('pocket_filter', JSON.stringify(conditions));
            anUser.bind('sync', _.bind(function () {
                alert('save filter successed');

                // update UI
                this.renderSavedFilter();
            }, this));
            anUser.save();




        },




        useFilter: function (e) {
            var $this = $(e.currentTarget);
            var title  = $this.data('title');
            var artist = $this.data('artist');
            var tags = $this.data('tags');
            console.debug('useFilter: ', title, artist, tags);


            // 表示きりかえ
            $('#savedFilter').children('div').removeClass('btn-warning');
            $this.addClass('btn-warning');


            // set data.
            $('#titleCondition').val(title);
            $('#artistCondition').val(artist);
            $('#tagsCondition').val(tags);

            // action.
            this.filterPockets();

        },



        clearFilter: function () {

            // reset UI.
            $('#titleCondition').val('');
            $('#artistCondition').val('');
            $('#tagsCondition').val('');
            $('#savedFilter>div').removeClass('btn-warning');

            // action.
            this.filterPockets();
        },



        deleteFilter: function () {
            var $target = $('#savedFilter .btn-warning');
            if ($target.length === 0) {
                alert('Filterが選択されていません');
                return;
            }

            // 対象データを削除
            var title = $target.data('title');
            var artist = $target.data('artist');
            var tags = $target.data('tags');

            var pocketFilter = JSON.parse(this.user.pocket_filter);
            var newPocketFilter = [];
            for (var i = 0; i < pocketFilter.length; i++ ) {
                var filter = pocketFilter[i];
                console.debug(filter, title, artist, tags);
                if (title && title === filter.title || !title && !filter.title) {
                    if (artist && artist === filter.artist || !artist && !filter.artist) {
                        if (!tags && !filter.tags) {
                            continue;
                        }
                        if (!tags && !filter.tags.length) {
                            continue;
                        }
                        if (tags.length === filter.tags.length) {
                            var equal = true;
                            for (var jj = 0; jj < tags.length; jj++) {
                                if (tags[jj] !== filter.tags[jj]) {
                                    equal = false;
                                    break;
                                }
                            }
                            if (equal) {
                                continue;
                            }
                        }
                    }
                }
                newPocketFilter.push(filter);
            }

            console.debug('old: ', pocketFilter);
            console.debug('new: ', newPocketFilter);


            this.user.pocket_filter = JSON.stringify(newPocketFilter);
            this.userStorage.setUser(this.user);


            // save to API.
            var anUser = new User();
            anUser.set('id', this.user.id);
            anUser.set('pocket_filter', this.user.pocket_filter);
            anUser.bind('sync', _.bind(function () {
                alert('success');

                // update UI
                this.renderSavedFilter();
                this.clearFilter();

            }, this));
            anUser.save();

        },










        show: function () {
            console.log('show mypage');

            // session storageに該当情報が無い場合には、フォワード
            if (!_.mbStorage.getUser()) {
                mb.router.navigate('login', true);
                return;
            } else {
                this.user = JSON.parse(sessionStorage.getItem('user'));
            }


            // 画面表示
            this.render();

            // ユーザーPocketリストを取得
            this.userPocketList = new UserPocketList();
            this.userPocketList.bind('reset', _.bind(function () {
                this.displayUserPocketList = this.userPocketList;
                this.renderUserPocketList();
                // ついでにStorageにも保存しておく
                _.mbStorage.setUserPocketsWithBackboneCollection(this.userPocketList);

            }, this));
            this.userPocketList.fetch({reset:true, data:{user_id:this.user.id}});

            // ユーザーのプレイリストを取得
            this.userPlaylistList.fetch({reset:true, data:{user_id:this.user.id}});

            // お知らせ一覧の取得
            this.userNotifitactionList.fetch({reset: true, data: {user_id: this.user.id}});

            // フォローされているユーザー一覧取得
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:this.user.id}});

            // フォローしているユーザー一覧
            this.userFollowList.fetch({reset:true, data: {user_id:this.user.id}});

            // フォローしているアーティスト
            this.userArtistFollowList.fetch({reset:true, data:{user_id:this.user.id}});

        },

        dealloc: function () {

        },

    });

    return MypageView;

});
