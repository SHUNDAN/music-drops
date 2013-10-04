"use strict";
/**
 *  各Modelのベース機能
 */
define(['models/common/user_storage'], function (UserStorage) {

    var userStorage = new UserStorage();


    return {
        
        // uidをHeaderへ付与する
        sync: function (method, model, options) {

            var uid = userStorage.getUid();
            if (uid) {
                options = options || {};
                var headers = options.headers || {};
                headers.uid = uid;
                options.headers = headers;
            }

            Backbone.sync(method, model, options);

        },

    };

});
