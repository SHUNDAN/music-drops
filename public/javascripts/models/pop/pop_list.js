"use strict";
/**
 *  PopList
 */
define(['models/pop/pop'], function (Pop) {

    var PopList = Backbone.Collection.extend({
        model: Pop,
        url: function () {
            return '/api/v1/poplist';
        },


        refreshDataWithFeelingId: function (feelingId) {
            console.log('fetchOption: ', {reset: true, data: {feeling_id: feelingId}});
            this.fetch({reset: true, data: {feeling_id: feelingId}});
        },


        refreshDataWithMusicId: function (musicId) {
            this.fetch({reset: true, data: {music_id: musicId}});
        },


        loadNewList: function () {
            this.fetch({reset: true, data: {type: 'new'}});
        },


        loadPopularList: function () {
            this.fetch({reset: true, data: {type: 'popular'}});
        },


        loadHotList: function () {
            this.fetch({reset: true, data: {type: 'hot'}});
        },



    });


    return PopList;
});
