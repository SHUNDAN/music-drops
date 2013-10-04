/*
 *  mb2 Page JS
 */
window.mb = window.mb || {};
window.mb.cache = window.mb.cache || {};


(function() {


    // Top Page View, Model
    var Feeling = Backbone.Model.extend({
        defaults: {
            id: null,
            name: null,
        },
    });

    var FeelingList = Backbone.Collection.extend({
        model: Feeling,
        url: function () {
            return '/api/v1/feelings';
        },
        refreshData: function () {
            this.fetch({reset: true});
        },
    }); 
    
    var TopView = Backbone.View.extend({
        
        initialize: function () {
            this.collection = new FeelingList();
           _.bindAll(this, 'render');
           this.collection.bind('reset', this.render);
        },

        events: {
            'click [data-event="showPopList"]': 'showPopList',
        },

        render: function () {
            console.log('render');

            // reset.
            this.$el.empty();
            // title.
            this.$el.append($('#page_top').html());
            // btns.
            var renderData = {
                feelings: this.collection.models,
                btnClasses: ["", "btn-primary", "btn-info", "btn-success", "btn-warning", "btn-danger", "btn-inverse"],
            };
            var btnsHtml = _.template($('#page_top_btn_list').html(), renderData);
            this.$el.append(btnsHtml);

            return this;
        },

        show: function () {

            // 表示データを読み込む 
            this.collection.refreshData();

            // 静的部分は最初に表示
            this.$el.append($('#page_top').html());
            console.log($('#page_top').html());
        },


        showPopList: function (e) {
            console.debug('showPopList'); 
            var id = $(e.currentTarget).data('id');
            mb.router.navigate('poplist/' + id, true);
            return false;
        },


        dealloc: function () {
            this.$el.empty();
        },

    });



    
    // PopListのView, Model
    var Pop = Backbone.Model.extend({
        defaults: {
            id: null,
            feeling_id: null,
            artwork_url: null,
            user_name: null,
            comment: null,
            music_id: null,
        },
    });

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
    });

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
            mb.router.navigate('music/detail/' + music_id, true);
        },

        show: function (feelingId) {
            this.collection.refreshDataWithFeelingId(feelingId);
        },
    
        dealloc: function () {

        },
    
    });



    var Music = Backbone.Model.extend({
        defaults: {
            id: null,
            title: null,
            artwork_url: null,
            song_url: null,
            artist_name: null,
            itunes_url: null,
            create_at: null,
            update_at: null,
        },
        urlRoot: '/api/v1/musics/',
        loadData: function (musicId) {
            this.set('id', musicId);
            this.fetch();
        },
    });
    
    var MusicDetailView = Backbone.View.extend({
    
        initialize: function () {
            this.model = new Music();
            this.collection = new PopList();
            _.bindAll(this, 'render', 'renderMusicInfo', 'renderPopList', 'show', 'dealloc');
            this.model.bind('change', this.renderMusicInfo);
            this.collection.bind('reset', this.renderPopList);
        },
        events: {},
        render: function () {
            console.log('render');
            // reset
            this.$el.empty();
            // add frame
            var frame = _.template($('#page_music_detail').html());
            this.$el.append(frame);
        },
        renderMusicInfo: function () {
            var musicInfo = _.template($('#page_music_detail_info').html(), this.model.attributes);
            this.$el.find('#musicInfoArea').html(musicInfo);
        },
        renderPopList: function () {
            console.log('renderPopList');
            var html = _.template($('#page_music_detail_poplist').html(), {popList: this.collection.models});
            this.$el.find('#popListArea').html(html);
        },

        show: function (musicId) {
            this.render();

            // 情報を取得する
            this.model.loadData(musicId);
            this.collection.refreshDataWithMusicId(musicId);
        },
    
        dealloc: function () {
            this.$el.empty();
        },
    });








    // AppView, Model
    var ApplicationModel = Backbone.Model.extend({});
    var ApplicationView = Backbone.View.extend({
   
        // 表示中のPage
        currentPageView: null,


        initialize: function() {
            this.$el = $('#main');
        },


        toTop: function () {
            this._prepareStage(TopView);
            this.currentPageView.show();
        },

        toPopList: function (feelingId) {
            this._prepareStage(PopListView);
            this.currentPageView.show(feelingId);
        },

        toMusicDetail: function (musicId) {
            this._prepareStage(MusicDetailView);
            this.currentPageView.show(musicId);
        },

        _prepareStage: function (ViewClass) {

            this.$el.empty();
            if (this.currentPageView) {
                this.currentPageView.dealloc();
                this.currentPageView = null;
            }

            this.currentPageView = new ViewClass();
            this.$el.append(this.currentPageView.$el);
        },
    
    });
    mb.appView = new ApplicationView({model: new ApplicationModel()});



    // Router
    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'top',
            'top': 'top',
            'poplist/:feeling_id':  'poplist',
            'music/detail/:id': 'musicDetail',
            '*path': 'defaultRoute'
        },

        top: function () {
            console.log('top');
            mb.appView.toTop();
        },

        poplist: function (feelingId) {
            console.log('poplist: ', feelingId);
            mb.appView.toPopList(feelingId);
        },

        musicDetail: function (musicId) {
            console.log('music/detail/' + musicId);
            mb.appView.toMusicDetail(musicId);
        },

        defaultRoute: function () {
            console.warn('default route selected.');
            this.top();
        },


    });
    $(function () {
        mb.router = new AppRouter();
        Backbone.history.start();
    });





})();

