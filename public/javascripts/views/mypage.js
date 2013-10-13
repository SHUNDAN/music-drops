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
    'models/user/user_notification_list',
    'models/user/user_follow',
    'models/user/user_follow_list',
    'models/user/user_artist_follow',
    'models/user/user_artist_follow_list',
    'models/common/user_storage',
], function (
    YoutubeView,
    ConfirmDialogView,
    User,
    UserPocket,
    UserPocketList,
    UserNotificationList,
    UserFollow,
    UserFollowList,
    UserArtistFollow,
    UserArtistFollowList,
    UserStorage
) {

    var MypageView = Backbone.View.extend({

        userStorage:  new UserStorage(),
        displayPocketListModel: new UserPocketList(),

        initialize: function () {

            // auto event bind.
            _.bindEvents(this);


            _.bindAll(this, 
                'render', 
                'renderSavedFilter', 
                'renderUserFollowedList', 
                'renderUserFollowList',
                'renderUserArtistFollow',
                'showUserPocketList', 
                'renderUserPocketList',
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

            this.userPocketList = new UserPocketList();
            this.userPocketList.bind('reset', this.showUserPocketList);
            this.userPocketList.bind('reset', this.renderUserPocketList);
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
            // 'keyup [data-event="filterPockets"]': 'filterPockets',
            'click [data-event="saveFilter"]': 'saveFilter',
            'click [data-event="useFilter"]': 'useFilter',
            'click [data-event="clearFilter"]': 'clearFilter',
            'click [data-event="deleteFilter"]': 'deleteFilter',
        },

        render: function () {
            console.log('render', this.user);
            var template = $('#page_mypage').html();
            var snipet = _.template(template, this.user);
            this.$el.append(snipet);

            this.renderSavedFilter();


            // bind event.
            // if (_.isIPhone || _.isAndroid) {
            //     $(document).off().on('blur', '[data-event="filterPockets"]', this.filterPockets);
            // } else {
            //     $(document).off().on('keyup', '[data-event="filterPockets"]', this.filterPockets);
            // }




        },

        renderSavedFilter: function () {
            var template = $('#page_mypage_saved_filter').html();
            if (this.user.pocket_filter) {
                this.user.pocket_filter_object = JSON.parse(this.user.pocket_filter);
            } else {
                this.user.pocket_filter_object = [];
            }
            var snipet = _.template(template, this.user);
            this.$el.find('#savedFilter').html(snipet);
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

        renderUserArtistFollow: function () {
            console.log('renderUserArtistFollow', this.userArtistFollowList);
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
         * ユーザーPocketを表示する（並び替えとかする新しいやつ）
         */
        renderUserPocketList: function () {
            var template = $('#page_mypage_user_pocket_list').html();
            var snipet = _.template(template, {pocketList:this.userPocketList.models});
            this.$el.find('#pocketListArea').html(snipet);


            // Drag & Dropを実装する
            // var pocketId;
            // $('[data-event="dragPocket"]').each(function () {
            //     pocketId = $(this).data('pocket-id');
            //     $(this).on('dragstart', function (e) {
            //         $(this).css('opacity', 0);
            //         console.log('aaa');
            //     });
            // });

            // $('#pocketListArea').on('dragover', function (e) {
            //     console.log('bbb', e);
            // });


            // Drag & Dropを実装する
            // var delta = $('#pocketListArea').position();
            // var dragging = false;
            // var pocketId;
            // $('[data-event="dragPocket"]').on('mousedown', function (e) {
            //     dragging = true;
            //     var $this = $(this);
            //     pocketId = $this.data('pocket-id');
            //     $this.css({position:'absolute', top: (e.clientY - delta.top - 30) + 'px', left: (e.clientX - delta.left - 440) + 'px',});
            //     console.log(e);

            // }).on('mousemove', function (e) {

            //     if (dragging) {
            //         var $this = $(this);
            //         $this.css({top: (e.clientY - delta.top - 30) + 'px', left: (e.clientX - delta.left - 440) + 'px',});
            //     }

            // }).on('mouseup', function (e) {
            //     dragging = false;
            //     var $this = $(this);
            //     $this.css('position', 'static');
            // });
            // $('body').on('mouseup', function (e) {
            //     $('#pocketListArea [data-pocket-id="'+pocketId+'"]').css('position', 'static');
            // });



            // Drag & Dropを実装する
            var self = this;
            var fn = function () {
                $('#pocketListArea').sortable({
                    update: function (event, ui) {
                        console.log('update');
                        // $('#pocketListArea').sortable('destroy');
                        // fn();
                    }
                }).disableSelection();                
            };
            fn();




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
         * Pocket削除
         */
        deletePocket: function (e) {

            var $this = $(e.currentTarget);

            // Pocket削除処理
            var delFn = _.bind(function () {

                var pocketId = $(e.currentTarget).data('pocket-id');
                console.log('deletePocket', pocketId);

                var aPocket = this.userPocketList.get(pocketId);
                aPocket.bind('sync', _.bind(function () {

                    // 再表示（古いやつ）
                    this.showUserPocketList();
                    // this.renderUserPocketList();

                    // 削除アニメーション
                    $this.parent().transit({opacity: 0, height: 0}, 200, 'ease', function () {
                        $this.parent().remove();
                    });


                    // Localデータも更新
                    _.loadUserPockets({force: true});

                }, this));
                aPocket.destroy({wait: true});

            }, this);



            // 確認ダイアログを表示
            var confirmDialog = new ConfirmDialogView();
            confirmDialog.show({
                message: 'Pocketを削除しますか？',
                yesButtonCallback: delFn
            });

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
            if (!sessionStorage.getItem('user')) {
                mb.router.navigate('/', true);
                return;
            } else {
                this.user = JSON.parse(sessionStorage.getItem('user'));
            }

            // 画面表示
            this.render();

            // ユーザーPopリストを取得
            this.userPocketList.refreshDataWithUserId(this.user.id);

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
