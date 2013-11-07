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


            this.musicLinkCollection = new MusicLinkList();
            _.bindAll(this, 'addLink', 'render', 'renderMusicInfo', 'renderPopList', 'renderMusicLinkList', 'finishUserAddMusicLink', 'show', 'dealloc');
            this.musicLinkCollection.bind('reset', this.renderMusicLinkList);
        },

        events: {
            'click #addLink': 'addLink',
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
            console.log('renderMusicInfo', this.music.attributes);

            var musicInfo = _.template($('#page_music_detail_info').html(), _.extend({
                repPop: this.repPop
            }, this.music.attributes, _.mbStorage.getCommon()));
            this.$el.find('#musicInfoArea').html(musicInfo);
        },



        renderPopList: function () {
            console.log('renderPopList');
            var html = _.template($('#page_music_detail_poplist').html(), {popList: this.popList.models});
            this.$el.find('#popListArea').html(html);

            // 件数も更新する
            this.$el.find('#numOfOtherPop').text('(' + this.popList.models.length + ')件');
        },



        renderMusicLinkList: function () {
            var template = $('#page_music_detail_music_links').html();
            var snipet = _.template(template, {musicLinkList: this.musicLinkCollection.models});
            this.$el.find('#musicLinkListArea').html(snipet);

        },


        addLink: function (e) {
            var $this = $(e.currentTarget);
            var $container = $this.parents('.add-musicLink');
            var comment = $container.find('[data-type="comment"]').val();
            var link = $container.find('[data-type="link"]').val();

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
            this.userAddMusicLink.attributes.music_id = this.music.attributes.id;
            this.userAddMusicLink.attributes.comment = comment;
            this.userAddMusicLink.attributes.link = link;
            this.userAddMusicLink.bind('sync', this.finishUserAddMusicLink);
            this.userAddMusicLink.create();
        },

        finishUserAddMusicLink: function () {
            alert('リンク追加ありがとうございます！');
            window.location.reload();
        },


        /**
         * 曲をPocketする
         */
        addPocket: function (e) {
            console.log('addPocket', this.music.id);

            var $this = $(e.currentTarget);
            var data = {
                music_id: this.music.id,
                youtube_id: $this.data('youtube-id'),
                music_link_id: $this.data('link-id')
            };

            _.addPocket(data, _.bind(function () {
                this.$el.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            }, this));


            return false;
        },


        /**
            Pocketを解除する
        */
        deletePocket: function () {

            var pocketId = _.selectPocketId(this.music.id);
            _.deletePocket(pocketId, _.bind(function () {
                this.$el.find('[data-event-click="addPocket"], [data-event-click="deletePocket"]').toggleClass('hidden');
            }, this));

        },



        /**
            Popを追加するUIを表示する
        */
        addPop: function (e) {

            e.preventDefault();
            e.stopPropagation();

            // show PopView.
            this.popView = new PopView();
            this.$el.append(this.popView.$el);
            this.popView.show(this.music_id, undefined, 'modal');

            return false;
        },



        /**
            曲を再生する
        */
        playMusic: function (e) {
            var $this = $(e.currentTarget);
            var self = this;
            var options = {};

            // Pause中ならそれを再生する
            if ($('#playBtnArea').hasClass('nowpausing')) {
                $('#playBtnArea').removeClass('nowpausing');
                mb.musicPlayer.startMusic();
                return;
            }


            // プレイリスト名、特定子
            options.playlistName = this.music.attributes.title;
            options.identifier = 'music_detail ' + this.music.id;

            // 開始位置と内容
            options.startPos = 0;
            var aMusicInfo = this.music.attributes;
            aMusicInfo.music_id = this.music.id;
            options.musicArray = [aMusicInfo];

            // callback.
            options.callbackWhenWillStart = _.bind(function (music) {

                this.$el.find('#musicInfoArea [data-event-click="playMusic"]').addClass('hidden');
                this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').removeClass('hidden');

            }, this);
            options.callbackWhenEnd = _.bind(function () {

                this.$el.find('#musicInfoArea [data-event-click="playMusic"]').removeClass('hidden');
                this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').addClass('hidden');

            }, this);


            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);


        },


        /**
            曲の再生を行う
        */
        playYoutube: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var musicLinkId = $(e.currentTarget).data('musiclink-id');
            console.debug('playYoutube.', musicLinkId);

            var options = {};

            // プレイリスト名、特定子
            options.playlistName = this.music.attributes.title;
            options.identifier = 'music_detail ' + this.music.id;

            // 開始位置と内容
            options.startPos = 0;
            var aMusicInfo = this.music.attributes;
            aMusicInfo.music_id = this.music.id;
            aMusicInfo.youtube_id = this.musicLinkCollection.get(musicLinkId).attributes.youtube_id;
            options.musicArray = [aMusicInfo];

            // play
            console.log('play music. arraycount=', options.musicArray.length, ',startPos=', options.startPos);
            mb.musicPlayer.playMusics(options);

            // リンクの再生回数を通知
            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            _.addMusicLinkPlayCount(this.music.id, musicLinkId);


            return false;
        },









        /**
            曲を一時停止する
        */
        pauseMusic: function () {
            $('#playBtnArea').addClass('nowpausing');
            mb.musicPlayer.pauseMusic();

            this.$el.find('#musicInfoArea [data-event-click="playMusic"]').removeClass('hidden');
            this.$el.find('#musicInfoArea [data-event-click="pauseMusic"]').addClass('hidden');

        },



        /**
            ユーザーフォロー
        */
        followUser: function () {
            var userId = this.repPop.attributes.user_id;
            _.followUser(userId, function () {
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

                _.mbStorage.refreshUser({type: 'followUser'});
            });
        },


        /**
            ユーザーフォロー解除
        */
        unfollowUser: function () {
            var userFollowId = _.selectUserFollowId(this.repPop.attributes.user_id);
            _.unfollowUser(userFollowId, function () {
                $('[data-event-click="followUser"], [data-event-click="unfollowUser"]').toggleClass('hidden');

                _.mbStorage.refreshUser({type: 'followUser'});
            });
        },


        /**
            Popに対するLike
        */
        likePop: function () {
            _.likePop(this.repPop.attributes.id, function () {
                $('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');

                _.mbStorage.refreshUser({type: 'likePop'});
            });
        },


        /**
            PopのLike解除
        */
        dislikePop: function () {
            _.dislikePop(this.repPop.attributes.id, function () {
                $('[data-event-click="likePop"], [data-event-click="dislikePop"]').toggleClass('hidden');

                _.mbStorage.refreshUser({type: 'likePop'});
            });
        },


        /**
            Popに対するLike（その他リンク向け）
        */
        likePop2: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $parent = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $parent.data('pop-id');

            _.likePop(popId, function () {
                $parent.find('[data-event-click="likePop2"], [data-event-click="dislikePop2"]').toggleClass('hidden');
            });

            return false;
        },


        /**
            PopのLike解除（その他リンク向け）
        */
        dislikePop2: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $parent = $(e.currentTarget).parents('[data-pop-id]');
            var popId = $parent.data('pop-id');

            _.dislikePop(popId, function () {
                $parent.find('[data-event-click="likePop2"], [data-event-click="dislikePop2"]').toggleClass('hidden');
            });

            return false;
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



        /**
            Link削除
        */
        deleteLink: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            console.debug('deleteLink.', musicLinkId);

            if (window.confirm('リンクを削除しますか')) {

                var musicLink = this.musicLinkCollection.get(musicLinkId);
                musicLink.set('id', musicLinkId);
                musicLink.bind('sync', _.bind(function () {

                    this.musicLinkCollection.remove(musicLink);
                    this.renderMusicLinkList();

                }, this));
                musicLink.destroy();

            }

            return false;
        },



        /**
            レポート機能
        */
        report: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var musicLinkId = $(e.currentTarget).parents('[data-musiclink-id]').data('musiclink-id');
            console.debug('report.', musicLinkId);

            // 今はリンク切れだけ
            $.ajax({
                url: '/api/v1/reports',
                method: 'post',
                data: {
                    type: 1,
                    music_link_id: musicLinkId
                },
                success: function () {
                    alert('報告ありがとうございます');
                },
                error: function (xhr) {
                    if (xhr.status === 403) {
                        mb.router.appView.authErrorHandler();
                        return;
                    } else {
                        alert('エラーが発生しました。ブラウザのリロードをお願いします。');
                        console.log('error: ', arguments);
                    }
                },
            });



            return false;
        },














        show: function (musicId) {
            this.music_id = musicId;
            this.render();

            // 音楽を取得する
            this.music = new Music();
            this.music.set('id', musicId);
            this.music.bind('sync', _.bind(function () {

                this.music.loaded = true;

                // デフォルト値を設定する
                this.music.attributes.feeling_id = this.music.attributes.feeling_id || 1;

                if (this.popList.loaded) {
                    this.renderMusicInfo();
                    this.renderPopList();
                }


            }, this));
            this.music.fetch();


            // Popを取得する
            this.popList = new PopList();
            this.popList.bind('reset', _.bind(function () {

                this.popList.loaded = true;


                // Like数が多い順に並び替える
                this.popList.models = _.sortBy(this.popList.models, function (pop) {
                    return (pop.like_count_speed || 0) * -1;
                });

                // 一番Likeされているものを代表Popとする
                this.repPop = (this.popList.length > 0 ? this.popList.models[0] : null);
                if (this.repPop) {
                    this.popList.remove(this.repPop);
                }



                if (this.music.loaded) {
                    this.renderMusicInfo();
                    this.renderPopList();
                }

            }, this));
            this.popList.fetch({reset:true, data:{music_id:musicId}});


            // this.popList.refreshDataWithMusicId(musicId);
            this.musicLinkCollection.refreshDataWithMusicId(musicId);
        },







        dealloc: function () {
            this.$el.empty();
        },
    });

    return MusicDetailView;
});

























