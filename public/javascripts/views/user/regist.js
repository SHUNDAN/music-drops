"use strict";
/*
 * View: User Regist
 */
define([
    'models/user/user'
], function (
    User
) {

    var UserRegistView = Backbone.View.extend({
    
        // fields.
        user: null,


        /**
         * 初期化処理
         */
        initialize: function () {
        
            this.user = new User();

            _.bindAll(this, 'render', 'show', 'dealloc');
        },


        /**
         * Event定義
         */
        events: {},


        /*
         * 表示
         */
        render: function () {
            var template = $('#page_user_regist').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },


        /*
         * AppViewからのエントリーポイント
         */
        show: function () {
            this.render();
        },


        /*
         * 終了処理
         */
        dealloc: function () {},

    
    
    
    });


    return UserRegistView;

});
