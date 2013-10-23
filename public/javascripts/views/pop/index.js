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
        music_id:       null,
        pop_id:         null,
        feelingList:    null,
        popModel:       new PopModel(),

        // functional field. 
        userStorage: new UserStorage(),
        


        initialize: function () {

            // intialize data.
            this.feelingList = this.userStorage.getCommon().feelings;

            // bind event.
            _.bindAll(this, 'render', 'show', 'showMusicInfo', 'showPopInfo', 'refreshFeelingSelect', 'addOrUpdate', 'popSaveSuccess', 'dealloc');
            this.popModel.bind('change', this.ShowPopInfo);
            this.popModel.bind('sync', _.bind(this.popSaveSuccess, this));
        },



        template: $('#page_pop').html(),



        events: {
            'click #updatePopBtn': 'addOrUpdate'
        },



        render: function () {
            this.$el.append(_.template(this.template, {type: this.type}));

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
                    this.destory();
                }, this));
                this.$el.prepend($blackout);

                // display as modal.
                this.$el.find('#pagePop').addClass('popUp');
            }
        },

        showMusicInfo: function () {
            console.log('showMusicInfo');
            var musicInfo = _.template($('#page_music_detail_info').html(), this.musicModel.attributes);
            this.$el.find('#musicInfoArea').html(musicInfo);
        },


        showPopInfo: function () {
            console.log('showPopInfo');
            var popInfo = _.template($('#pop_info').html(), this.popModel.attributes);
            console.log(popInfo);
            this.$el.find('#popInfoArea').html(popInfo);
            console.log(this, this.$el, this.$el.find('#musicInfoArea'));
            console.log('feelingList: ', this.feelingList);
            if (this.feelingList.length > 0) {
                this.refreshFeelingSelect();
            }
        },


        refreshFeelingSelect: function () {
            console.log('refreshFeelingSelect', this.feelingList.models);
            var html = _.template($('#pop_page_feeling_list_options').html(), {feelings: this.feelingList, pop: this.popModel.attributes});
            this.$el.find('#feeling_select').html(html);
        },

        addOrUpdate: function () {
            console.log('addOrUpdate');
            this.popModel.attributes.feeling_id = $('#feeling_select').val();
            this.popModel.attributes.music_id = this.music_id;
            this.popModel.attributes.comment = $('[name="comment"]').val();

            // TODO Validate


            if (this.type === 'add') {
                this.popModel.create();
            } else {
                this.popModel.update();
            }

        },

        popSaveSuccess: function () {
            alert('save successed');

            if (this.displayType === 'modal') {
                this.$el.remove();
                this.destory();
            }

            mb.router.navigate('/music/' + this.music_id, true);
        },




        show: function (musicId, popId, displayType) {
            console.log('pop:show: ', musicId, popId);

            // set data.
            this.type = (popId ? 'update' : 'add');
            this.music_id = musicId;
            this.pop_id = popId;
            this.displayType = displayType;

            // render base.
            this.render();

            // show Pop.
            if (popId) {
                this.popModel.loadData(popId);
            } else {
                this.showPopInfo();
            }

        },



        dealloc: function () {},
    });

    return popView;
});


















