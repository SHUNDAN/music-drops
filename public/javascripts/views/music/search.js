/**
 * View: Music - Search
 */
define([
    'views/pop/index',
    'views/music/itunes_ranking',
    'views/music/itunes_search',
], function (
    PopView,
    ITunesRankingView,
    ITunesSearchView

) {

    var SearchView = Backbone.View.extend({


        // 検索結果
        iTunesSearchResultList: [],

        // fields.
        iTunesRankingView: null,
        iTunesSearchView: null,


        initialize: function () {

            // auto event bind.
            _.bindEvents(this);

            this.iTunesRankingView = new ITunesRankingView();
            this.iTunesSearchView = new ITunesSearchView();

            _.bindAll(this, 'showITunesRanking', 'showITunesSearch');
        },

        events: {
            'click [data-event="showITunesRanking"]': 'showITunesRanking',
            'click [data-event="showITunesSearch"]': 'showITunesSearch',
        },

        render: function () {
            var html = _.template($('#page_search').html());
            this.$el.html(html);

            // 初期表示でiTunes検索を表示
            this.showITunesSearch();
        },


        /**
            iTunes検索結果を表示する
        */
        renderSearchResult: function () {
            console.debug('renderSearchResult: ', this.iTunesSearchResultList);

            var snipet = _.mbTemplate('page_search_itunes_results', {results: this.iTunesSearchResultList});
            this.$el.find('#resultList').html(snipet);

            // 件数も更新する
            this.$el.find('#numOfResult').text(this.iTunesSearchResultList.length);
        },





        /**
            iTunes検索
        */
        searchByItunes: function () {

            // 検索ワード
            var ws = this.$el.find('#conditionInput').val().split(/\s/);
            var words = [];
            _.each(ws, function (w) {
                w = _.trim(w);
                if (w && w.length > 0) {
                    words.push(w);
                }
            });

            // なしの場合にはだめ
            if (words.length === 0) {
                alert('検索条件を入力してください');
                $('#conditionInput').val('');
                return;
            }
            console.debug('conditions=', words);


            // 検索結果を初期化する
            this.$el.find('#numOfResult').text('0');
            this.$el.find('#resultList').html('');


            // iTunes APIを使って検索する
            var self = this;
            $.ajax({
                url: 'https://itunes.apple.com/search?',
                data: {
                    term: words.join('+'),
                    country: 'JP', //country,
                    media: 'music',
                    entity: 'song',
                },
                dataType: 'jsonp',
                success: function (json) {
                    var results = json.results;

                    // 同じ曲が複数存在するので、間引く
                    var newResults = [];
                    _.each(results, function (result) {
                        var found = false;
                        for (var i = 0; i < newResults.length; i++) {
                            var newResult = newResults[i];
                            if (result.trackName === newResult.trackName && result.artistName === newResult.artistName) {
                                found = true;
                                break;
                            }
                        }
                        if (found === false) {
                            newResults.push(result);
                        }
                    });
                    self.iTunesSearchResultList = newResults;

                    self.renderSearchResult();
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('エラーが発生しました。再読み込みしてください。');
                }
            });
        },



        /**
            曲詳細ページへ行く
        */
        goMusicDetail: function (e) {

            var pos = $(e.currentTarget).parents('li').data('pos');
            this._loadMusicInfo(pos, _.bind(function (music) {
                // 曲詳細へ遷移
                mb.router.navigate('music/' + music.id, true);
            }, this));

        },




        /**
            Dropを書く
        */
        writeDrop: function (e) {

            var pos = $(e.currentTarget).parents('li').data('pos');
            this._loadMusicInfo(pos, _.bind(function (music) {

                // show PopView.
                this.popView = new PopView();
                this.$el.append(this.popView.$el);
                this.popView.show(music.id, undefined, 'modal');

            }, this));

        },




        /**
            該当曲情報をサーバーから取得する
        */
        _loadMusicInfo: function (pos, callback) {

            pos = parseInt(pos, 10);
            var result = this.iTunesSearchResultList[pos];
            console.log('result: ', result);


            // 検索して、MusicIdを受け取る
            $.ajax({
                url: '/api/v1/musics/search_with_itunes',
                method: 'POST',
                data: result,
                dataType: 'json',
                success: function (json) {
                    console.log('json: ', json);
                    callback(json);
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('ERROR');
                },
            });

        },













        show: function () {
            this.render();
        },


        showITunesRanking: function () {
            // iTunesランキング検索画面を表示
            this.$el.find('#searchArea').html(this.iTunesRankingView.$el);
            this.iTunesRankingView.show();
            return false;
        },

        showITunesSearch: function () {
            // iTunes検索画面を表示
            this.$el.find('#searchArea').html(this.iTunesSearchView.$el);
            this.iTunesSearchView.show();
            return false;
        },



        dealloc: function () {},
    });

    return SearchView;
});
