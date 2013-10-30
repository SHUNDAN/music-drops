/*
 *  Pop
 */
define(function () {

    var Pop = Backbone.Model.extend({
        defaults: {
            id: null,
            feeling_id: null,
            artwork_url: null,
            user_name: null,
            comment: null,
            music_id: null,
        },

        urlRoot: '/api/v1/pops',


        create: function () {
            console.log('create');
            this.save(this.attributes, {
                headers: {uid: localStorage.getItem('uid')},
                success: _.bind(function () {
                    // this.trigger('success_save');
                }, this),
                error: _.bind(function () {
                    console.log('Pop save failed. reson: ', arguments);
                    // this.trigger('fail_save');
                }, this),
            });

        },

        update: function () {
            console.log('update');
            throw new '実装する';
        },
    });


    return Pop;
});
