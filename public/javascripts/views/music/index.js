"use strict";
/**
 *  View: Music
 */
define([
    'views/common/youtube',
    'views/pop/index',
    'models/music/music',
    'models/pop/pop_list',
    'models/music/music_link',
    'models/music/music_link_list',
    'models/user/user_pocket',
    'models/common/user_storage'
], function (
    YoutubeView,
    PopView,
    Music,
    PopList,
    MusicLink,
    MusicLinkList,
    UserPocket,
    UserStorage
) {

    var MusicDetailView = Backbone.View.extend({

        music_id: null,
        userStorage: new UserStorage(),

        initialize: function () {
            this.model = new Music();
            this.collection = new PopList();
            this.musicLinkCollection = new MusicLinkList();
            _.bindAll(this, 'addLink', 'render', 'renderMusicInfo', 'renderPopList', 'renderMusicLinkList', 'finishUserAddMusicLink', 'addPop', 'show', 'showYoutube', 'dealloc');
            this.model.bind('change', this.renderMusicInfo);
            this.collection.bind('reset', this.renderPopList);
            this.musicLinkCollection.bind('reset', this.renderMusicLinkList);
        },

        events: {
            'click #addLink': 'addLink',
            'click [data-event="addPocket"]': 'pocket',
            'click [data-event="addPop"]': 'addPop',
            'click [data-event="playYoutube"]': 'showYoutube',
        },

        render: function () {
            console.log('render');
            // reset
            this.$el.empty();
            // add frame
            var frame = _.template($('#page_music_detail').html(), {music_id: this.music_id});
            this.$el.append(frame);
        },

        renderMusicInfo: function () {
            console.log('renderMusicInfo', this.model.attributes);
            var musicInfo = _.template($('#page_music_detail_info').html(), _.extend({}, this.model.attributes, this.userStorage.getCommon()));
            this.$el.find('#musicInfoArea').html(musicInfo);
        },

        renderPopList: function () {
            console.log('renderPopList');
            var html = _.template($('#page_music_detail_poplist').html(), {popList: this.collection.models});
            this.$el.find('#popListArea').html(html);
        },

        renderMusicLinkList: function () {
            var template = $('#page_music_detail_music_links').html();
            var snipet = _.template(template, {musicLinkList: this.musicLinkCollection.models});
            this.$el.find('#musicLinkListArea').html(snipet);

        },

        show: function (musicId) {
            this.music_id = musicId;
            this.render();

            // 情報を取得する
            this.model.loadData(musicId);
            this.collection.refreshDataWithMusicId(musicId);
            this.musicLinkCollection.refreshDataWithMusicId(musicId);
        },

        addLink: function (e) {
            var $this = $(e.currentTarget);
            var $tr = $this.parents('tr');
            var comment = $tr.find('[data-type="comment"]').text();
            var link = $tr.find('[data-type="link"]').text();

            // データチェック
            if (comment.length === 0) {
                alert('Comment is required');
                return;
            }
            if (link.length === 0) {
                alert('Link is required');
                return;
            }
            if (link.toLowerCase().indexOf('http://') !== 0
                    && link.toLowerCase().indexOf('https://') !== 0) {
                alert('Link is invalid url. \nUrl must be http:// or https://');
                return;
            }

            // データ保存
            this.userAddMusicLink = new MusicLink();
            this.userAddMusicLink.attributes.music_id = this.music_id;
            this.userAddMusicLink.attributes.comment = comment;
            this.userAddMusicLink.attributes.link = link;
            this.userAddMusicLink.bind('sync', this.finishUserAddMusicLink);
            this.userAddMusicLink.create();
        },

        finishUserAddMusicLink: function () {
            alert('success');
            // mb.router.navigate('music/' + this.music_id, true);
            window.location.reload();
        },


        /**
         * 曲をPocketする
         */
        pocket: function (e) {
            console.log('pocket', this.music_id);

            this.userPocket = new UserPocket();
            this.userPocket.set('music_id', this.music_id);
            this.userPocket.set('feeling_id', $(e.currentTarget).data('feeling-id'));
            this.userPocket.set('youtube_id', $(e.currentTarget).data('youtube-id'));
            this.userPocket.set('music_link_id', $(e.currentTarget).data('link-id'));
            this.userPocket.bind('sync', _.bind(this.pocketSuccessed, this));
            this.userPocket.create();

            return false;
        },

        /**
         * Pocket成功時
         */
        pocketSuccessed: function () {
            alert('pocket successed');
        },



        addPop: function () {

            // show PopView.
            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(this.music_id, undefined, 'modal');
        },



        /**
         * Youtube APIを利用してYoutubeを再生する
         */
        showYoutube: function (e) {
            var youtubeId = $(e.currentTarget).data('youtube-id');
            console.log('showYoutube', youtubeId);

            mb.youtubeView = new YoutubeView();
            mb.youtubeView.showScreen(youtubeId, this);



            // aタグ機能は無効化
            return false;
        },



        dealloc: function () {
            this.$el.empty();
        },
    });

    return MusicDetailView;
});

























