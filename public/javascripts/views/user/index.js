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
    'views/common/youtube'
], function (
    User,
    UserPocket,
    UserPocketList,
    UserFollow,
    UserFollowList,
    UserStorage,
    YoutubeView
) {

    var UserView = Backbone.View.extend({
   
        // fields.
        userId: null,
        user: null,
        userPocketList: null,
        userFollow: null,
        userFollowedList: null,
        userFollowList: null,
        userStorage: new UserStorage(),


        /**
         * 初期化処理
         */
        initialize: function () {

            this.user = new User();
            this.userPocketList = new UserPocketList();
            this.userFollowedList = new UserFollowList();
            this.userFollowList = new UserFollowList();

            _.bindAll(this, 'render', 'renderUserInfo', 'renderPocketList', 'renderUserFollowedList', 'renderUserFollowList', 'showYoutube', 'addPocket', 'followUser', 'unfollowUser', 'show', 'dealloc');

            this.user.bind('change', this.renderUserInfo);
            this.userPocketList.bind('reset', this.renderPocketList);
            this.userFollowedList.bind('reset', this.renderUserFollowedList);
            this.userFollowList.bind('reset', this.renderUserFollowList);
        },

        events: {
            'click [data-event="showYoutube"]': 'showYoutube',
            'click [data-event="addPocket"]': 'addPocket',
            'click [data-event="followUser"]': 'followUser',
            'click [data-event="unfollowUser"]': 'unfollowUser'
        },

        render: function () {
            console.log('userView#render');
            var template = $('#page_user').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },

        renderUserInfo: function () {
            console.log('renderUserInfo', this.user);
            var template = $('#page_user_info').html();
            var snipet = _.template(template, _.extend({targetUserId: this.userId}, this.user.attributes));
            this.$el.find('#userInfoArea').html(snipet);
        },

        renderPocketList: function () {
            console.log('renderPocketList');
            var template = $('#page_user_pocketlist').html();
            var snipet = _.template(template, {pocketList:this.userPocketList.models, feelings:this.userStorage.getCommon().feelings});
            this.$el.find('#pocketlist').html(snipet);

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
                alert('success');
            });
            this.userPocket.create();

        },

        followUser: function () {
            console.log('followUser', this.userId);

            this.userFollow = new UserFollow();
            this.userFollow.set('dest_user_id', this.userId);
            this.userFollow.bind('sync', function () {
                alert('success');
                location.reload();
            });
            this.userFollow.bind('error', function () {
                alert('error');
                console.log('user follow error.', arguments);
            });
            this.userFollow.save();
        },


        unfollowUser: function () {
            console.log('unfollow');

            this.userFollow = new UserFollow();
            this.userFollow.set('id', this.user.attributes.user_follow_id);
            this.userFollow.bind('sync', function () {
                alert('success');
                location.reload();
            });
            this.userFollow.bind('error', function () {
                alert('error');
            });
            this.userFollow.destroy();

        },

        show: function (userId) {
            console.log('show: user_id: ', userId);
            this.userId = userId;
            this.render();
         
            // ユーザーデータ取得
            this.user.set('id', userId);
            this.user.fetch();

            // Pocketリスト取得
            this.userPocketList.fetch({reset: true, data: {user_id: userId}});

            // フォローされているユーザー一覧取得
            this.userFollowedList.fetch({reset:true, data: {dest_user_id:userId}});
            
            // フォローしているユーザー一覧
            this.userFollowList.fetch({reset:true, data: {user_id:userId}});
        },


        /**
         * 終了処理
         */
        dealloc: function () {},
    
    });



    return UserView;

});
