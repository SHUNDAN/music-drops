"use strict";
/**
 * View: Pop
 */
define([
    'models/common/user_storage',
    'models/music/music',
    'models/pop/pop'
], function (
    UserStorage,
    MusicModel,
    PopModel
) {

    var popView = Backbone.View.extend({

        // data field.
        displayType:    'normal', // normal or modal
        type:           null, // add or update


        initialize: function () {

            // auto event bind.
            _.bindEvents(this);
        },



        render: function () {

            console.debug('render.', this.pop);

            // レンダリング
            var snipet = _.mbTemplate('page_pop', {
                type: this.type,
                feelingList: _.mbStorage.getCommon().feelings,
                music: this.music,
                pop: this.pop
            });
            this.$el.html(snipet);


            // モーダルの場合の表示制御
            if (this.displayType === 'modal') {

                // expand area.
                this.$el.css({
                    width: '100%',
                    height: '100%',
                });

                // black background.
                var $blackout = $('<div class="blackout"/>').css({opacity:1});
                $blackout.on('click', _.bind(function () {
                    this.$el.remove();
                    this.dealloc();
                }, this));
                this.$el.prepend($blackout);

                // display as modal.
                this.$el.find('#pagePop').addClass('popUp');

                // 文字数の数え上げをしておく
                this.countCharacters();
            }
        },



        /**
            文字数を数える
        */
        countCharacters: function () {
            var length = this.$el.find('#comment').val().length;
            this.$el.find('#numOfCharacters').text(length);
        },


        /**
            POPを投稿する
        */
        addPop: function () {

            // 選択されたキモチ
            var feelingId = this.$el.find('[name="feelingSelect"]:checked').val();
            // コメント
            var comment = this.$el.find('#comment').val();


            // キモチが選択されていない場合はだめ
            if (!feelingId) {
                alert('ドロップの種類を選択してください');
                return;
            }

            // コメントが入力されていない場合はだめ
            if (!comment) {
                alert('感想は１文字以上入力してください');
            }

            // 登録する
            this.pop.set('music_id', this.music.attributes.id);
            this.pop.set('feeling_id', feelingId);
            this.pop.set('comment', comment);
            this.pop.bind('sync', _.bind(function () {

                // ga
                _gaq.push(['_trackEvent', 'addPop', feelingId]);

                if (this.type === 'add') {
                    alert('登録完了しました');
                } else {
                    alert('編集完了しました');
                }

                location.reload();


            }, this));
            this.pop.save();

        },




        show: function (musicId, popId, displayType) {
            console.log('pop:show: ', musicId, popId);

            // set data.
            this.type = (popId ? 'update' : 'add');
            this.displayType = displayType;


            // musicのロード
            this.music = new MusicModel();
            this.music.set('id', musicId);
            this.music.bind('sync', _.bind(function () {

                // 新規の場合には、画面をレンダリング
                if (this.type === 'add') {
                    console.debug('aaaaa');
                    this.render();

                // 変更の場合に既にpopIdがあれば、レンダリング
                } else if (this.pop.attributes.feeling_id) {
                    console.debug('bbbb');
                    this.render();

                } else {
                    // popのロード待ち
                    console.log('cccc');
                }

            }, this));
            this.music.fetch();



            // popのロード
            this.pop = new PopModel();
            this.pop.set('id', popId);
            this.pop.bind('sync', _.bind(function () {

                // 既にMusicがロード済みの場合には、表示
                if (this.music.attributes.title) {
                    console.debug('dddd', this.pop, this.music);
                    this.render();

                } else {
                    // Musicがまだ無ければそれ待ち
                    console.debug('eeee');
                }

            }, this));
            this.pop.fetch();

        },



        dealloc: function () {},
    });

    return popView;
});


















