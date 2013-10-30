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

            // auto event bind.
            _.bindEvents(this);


            this.model = new Music();
            this.collection = new PopList();
            this.musicLinkCollection = new MusicLinkList();
            _.bindAll(this, 'addLink', 'render', 'renderMusicInfo', 'renderPopList', 'renderMusicLinkList', 'finishUserAddMusicLink', 'pocket', 'deletePocket', 'show', 'showYoutube', 'dealloc');
            this.model.bind('change', this.renderMusicInfo);
            this.collection.bind('reset', this.renderPopList);
            this.musicLinkCollection.bind('reset', this.renderMusicLinkList);
        },

        events: {
            'click #addLink': 'addLink',
            'click [data-event="addPocket"]': 'pocket',
            'click [data-event="deletePocket"]': 'deletePocket',
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


        addLink: function (e) {
            var $this = $(e.currentTarget);
            var $container = $this.parents('.add-musicLink');
            var comment = $container.find('[data-type="comment"]').text();
            var link = $container.find('[data-type="link"]').text();

            // データチェック
            if (comment.length === 0) {
                alert('コメントは必須です');
                return;
            }
            if (link.length === 0) {
                alert('動画のリンクは必須です。');
                return;
            }
            if (link.toLowerCase().indexOf('http://') !== 0
                    && link.toLowerCase().indexOf('https://') !== 0) {
                alert('動画リンクのURLが正しくありません。. \nURLには、 http:// または https:// を付けてください。');
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

            // LocalDataを更新
            _.loadUserPockets({force: true});


            // UIとイベントを変更
            $('[data-event="addPocket"]')
                .text('Pocket解除')
                .addClass('btn-primary')
                .attr('data-event', 'deletePocket');


            // 通知
            // alert('pocket successed');
        },


        deletePocket: function () {

            // 対象を探して、削除
            $.ajax({
                url: '/api/v1/user_pockets',
                data: {
                    user_id: this.userStorage.getUser().id,
                    music_id: this.music_id
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
                                $('[data-event="deletePocket"]')
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
                        $('[data-event="deletePocket"]')
                            .text('Pocketする')
                            .removeClass('btn-primary')
                            .attr('data-event', 'addPocket');

                        // Localデータも更新
                        _.loadUserPockets({force:true});
                    }

                }
            });

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





        show: function (musicId) {
            this.music_id = musicId;
            this.render();

            // 情報を取得する
            this.music = new Music();
            this.music.set('id', musicId);
            this.music.bind('sync', _.bind(function () {

                // デフォルト値を設定する
                this.music.attributes.feeling_id = this.music.attributes.feeling_id || 1;
                this.renderMusicInfo();
            }, this));

            this.model.loadData(musicId);
            this.collection.refreshDataWithMusicId(musicId);
            this.musicLinkCollection.refreshDataWithMusicId(musicId);
        },







        dealloc: function () {
            this.$el.empty();
        },
    });

    return MusicDetailView;
});

























