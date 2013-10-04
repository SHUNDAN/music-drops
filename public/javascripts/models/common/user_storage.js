'use strict';
/**
 * Model: LocalStorage and SessionStorage
 */
define([], function () {

    var UserStorage = Backbone.Model.extend({


        /**
         * Low Level API
         */
        getStorage: function (type) {
            return (type === 'ls' ? localStorage : sessionStorage);
        },
        setItem: function (key, value, type) {
            this.getStorage(type).setItem(key, value);
        },
        getItem: function (key, type) {
            return this.getStorage(type).getItem(key);
        },
        setObject: function (key, value, type) {
            this.setItem(key, JSON.stringify(value), type);
        },
        getObject: function (key, type) {
            return JSON.parse(this.getItem(key, type)); 
        },


        // API: uid
        setUid: function (uid) {this.setItem('uid', uid);},
        getUid: function () {return this.getItem('uid');},

        // API: common
        setCommon: function (common) {this.setObject('common', common);},
        getCommon: function () {return this.getObject('common');},
        loadCommonInfo: function () {
            var common = this.getCommon();
            // if (!common || (new Date().getTime() - common.lastRequestTime > 5 * 60 * 1000)) {
                var self = this;
                $.ajax({
                    url: '/api/v1/common',
                    dataType: 'json',
                    success: function (json) {
                        json.lastRequestTime = new Date().getTime();
                        self.setCommon(json);
                    },
                    error: function () {
                        console.error('/api/v1/common error: ', arguments);
                    },
                });
            // }
        },

        // API: user
        setUser: function (user) {this.setObject('user', user);},
        getUser: function () {return this.getObject('user');},


    
    
    
    
    
    });


    // ちょっとズル
    mb.userStorage = new UserStorage();



    return UserStorage;
});
