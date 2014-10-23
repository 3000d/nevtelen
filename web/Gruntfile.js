'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    less: {
      dev: {
        files: {
          'public_html/assets/css/main.css': [
            'public_html/assets/less/main.less'
          ]
        },
        options: {
          compress: false,
          sourceMap: true,
          sourceMapFilename: 'main.css.map',
          sourceMapRootpath: '/css/'
        }
      },
      build: {
        files: {
          'public_html/assets/css/main.min.css': [
            'public_html/assets/less/main.less'
          ]
        },
        options: {
          compress: true
        }
      }
    },

    watch: {
      less: {
        files: [
          'public_html/assets/less/*.less',
          'public_html/assets/less/**/*.less'
        ]
      }
    }
  });

  grunt.registerTask('default', ['dev']);
  grunt.registerTask('dev', ['less:dev']);
  grunt.registerTask('build', ['less:build']);
};