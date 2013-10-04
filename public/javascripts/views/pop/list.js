/*
 * PopListView
 */
define([
    'models/pop/pop_list'
], function (
    PopList
) {
    var PopListView = Backbone.View.extend({

        initialize: function () {
            this.collection = new PopList();
            _.bindAll(this, 'render', 'showMusicPage', 'dealloc');
            this.collection.bind('reset', this.render);
        },

        events: {
            'click [data-event="showMusicPage"]': 'showMusicPage',
        },

        render: function () {
            console.log('render', this.collection);
            this.$el.html($('#page_popList').html());

            var data = {
                popList: this.collection.models
            };
            var popListHtml = _.template($('#page_popList_data').html(), data);
            this.$el.find('#popListBody').html(popListHtml);
        },


        showMusicPage: function (e) {
            console.log('showMusicPage');
            var music_id = $(e.currentTarget).data('music-id');
            mb.router.navigate('music/' + music_id, true);
        },

        show: function (feelingId) {
            this.collection.refreshDataWithFeelingId(feelingId);
        },

        dealloc: function () {

        },

    });

    return PopListView;
});
