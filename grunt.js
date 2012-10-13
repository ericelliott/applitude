/*global module*/
module.exports = function(grunt) {
  'use strict';
  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      all: ['./grunt.js', './src/**/*.js', './test/test.js']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        nonew: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        eqnull: true,
        browser: true,
        strict: true,
        boss: false
      }
    },
    concat: {
      dist: {
        src: ['src/applitude.js'],
        dest: 'dist/applitude.js'
      },
      odotjs: {
        src: ['node_modules/odotjs/dist/o.js'],
        dest: 'lib/o.js'
      },
      eventemitter2: {
        src: ['node_modules/eventemitter2/lib/eventemitter2.js'],
        dest: 'lib/eventemitter2.js'
      },
      bundle: {
        src: ['node_modules/eventemitter2/lib/eventemitter2.js', 'node_modules/odotjs/dist/o.js', 'dist/applitude.js'],
        dest: 'dist/applitude.bundle.js'
      }
    },
    qunit: {
      index: ['test/index.html']
    },
    watch: {
      files: ['<config:lint.all>'],
      tasks: ['lint', 'concat,', 'qunit']
    }
  });
  grunt.registerTask('default', 'lint concat');
  grunt.registerTask('test', 'qunit');
};
