"use strict";
/**
 * Gruntfile.js
 */
var fs = require('fs');
module.exports = function(grunt) {

    // load tasks.
    var cwd = process.cwd();
    process.chdir('../../');
    grunt.loadNpmTasks('grunt-compass-multiple');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-webfont');
    process.chdir(cwd);
    
    grunt.initConfig({

        watch: {
            css: {
                files: ['scss/**/*'],
                tasks: ['compassMultiple:main']
            }

        },

        compassMultiple: {
            options: {
                imagesDir: '../images/',
            },
            main: {
                options: {
                    sassDir: 'scss',
                    cssDir: '../stylesheets/'
                }
            }
        },

        webfont: {
            icon: {
                src: '../images/fonts/svg/*.svg',
                dest: '../images/fonts/',
                destCss: 'scss/fonts/',
                htmlDemo: false,
                options: {
                    stylesheet: 'scss',
                    template: '../stylesheets/webfont-template.css',
                    relativeFontPath: '../images/fonts/'
                }
            }
        },


        requirejs: {
            dev: {
                options: {
                    name: 'main',
                    baseUrl: '../javascripts',
                    out: '../javascripts/main-min.js',
                    optimize: 'none',
                }
            },
            production: {
                options: {
                    name: 'main',
                    baseUrl: '../javascripts',
                    out: '../javascripts/main-min.js',
                }
            }
        },

       //  concat: {
       //      options: {
       //          separator: ';',
       //      },
       //      libs: {
       //          src: [
       //                  '../javascripts/libs/jquery-2.0.3.min.js',
       //                  '../javascripts/libs/jquery.transit.0.1.3.min.js',
       //                  '../javascripts/libs/underscore-min.js',
       //                  '../javascripts/libs/backbone-min.js',
       //                  '../javascripts/libs/bootstrap.js',
       //                  '../javascripts/libs/require-2.1.8.min.js',
       //                  '../javascripts/libs/extension.js'
       //              ],
       //          dest: '../javascripts/libs/all-libs.js'
       //      }
       //  }


    });


    // サーバービルドで使います。
    grunt.registerTask('dev', ['compassMultiple:main', 'requirejs:dev']);
    grunt.registerTask('production', ['compassMultiple:main', 'requirejs:production']);



    // libJSをconcatするタスク
    grunt.registerTask('concatLibJs', 'description', function () {
        console.log('concatLibJS');

        var dest = '../javascripts/libs/all-libs.js';
        var targets = [
            '../javascripts/libs/jquery-2.0.3.min.js',
            '../javascripts/libs/jquery.transit.0.1.3.min.js',
            '../javascripts/libs/underscore-min.js',
            '../javascripts/libs/backbone-min.js',
            '../javascripts/libs/bootstrap.js',
            '../javascripts/libs/require-2.1.8.min.js',
            '../javascripts/libs/extension.js'
        ];



        // output
        var src = '';

        // reads.
        targets.forEach(function (path) {
            src += fs.readFileSync(path, 'utf-8') + '\n';
        });

        // write.
        fs.writeFileSync(dest, src, 'utf-8');

        console.log('finish concat lib js');

    });












};

