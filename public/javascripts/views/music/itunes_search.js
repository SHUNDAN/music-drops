"use strict";
/**
 * View: iTunes Search View
 */
define([], function () {

    var ITunesSearchView = Backbone.View.extend({

        // 検索結果
        results: null,
    
        initialize: function () {

            _.bindAll(this, 'render', 'searchWhenKeyUp', 'search', 'musicDetail', 'show', 'dealloc');
        },


        events: {
            'keyup #searchTerm': 'searchWhenKeyUp',
            'click #searchBtn': 'search',
            'click [data-event="goDetail"]': 'musicDetail',
        },


        render: function () {
            console.log('ITunesSearchView#render');
            var template = $('#page_itunes_search').html();
            var snipet = _.template(template, {});
            this.$el.html(snipet);
        },

        searchWhenKeyUp: function (e) {
            if (e.keyCode === 13) {
                this.search();
            }
        },

        search: function () {
            var terms = $('#searchTerm').val() || '';
            var country = $('#searchCountry').val();
            console.log('search', terms, country);

            
            // 検索ワードを分ける
            var words = [];
            var strs = terms.split(' ');
            _.each(strs, function (str) {
                var strs2 = str.split('　');
                _.each(strs2, function (str2) {
                    if (str2.length !== 0) {
                        words.push(str2);
                    }
                });
            });
            console.log(words); 

            // 必須チェック
            if (words.length === 0) {
                alert('検索条件は必須です');
                $('#searchTerm').val('');
                return false;
            }

            // 検索結果を初期化する
            this.$el.find('#search_result').html();

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
                    self.results = newResults;



                    self.showResult();
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('API ERROR');
                }
            
            });

        },


        showResult: function () {
            console.log('showResult:', this.results);
            var template = $('#page_itunes_search_result').html();
            var snipet = _.template(template, {results: this.results});
            this.$el.find('#search_result').html(snipet);
        },


        musicDetail: function (e) {
            var pos = $(e.currentTarget).data('pos');
            pos = parseInt(pos, 10);
            console.log('musicDetail', pos);

            var result = this.results[pos];
            console.log('result: ', result);


            // 検索して、MusicIdを受け取る
            $.ajax({
                url: '/api/v1/musics/search_with_itunes',
                method: 'POST',
                data: result,
                dataType: 'json',
                success: function (json) {
                    console.log('json: ', json);

                    // 曲詳細へ遷移
                    mb.router.navigate('music/' + json.music_id, true);
                },
                error: function () {
                    console.log('error: ', arguments);
                    alert('ERROR');
                },
            });




            return false;
        },


        show: function () {
            this.render();
        },


        dealloc: function () {

        },
    
    });

    return ITunesSearchView;
});
