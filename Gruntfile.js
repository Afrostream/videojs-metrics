'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
    ' Licensed <%= pkg.license %> */\n',
    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: 'lib/**/*.js',
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: 'test/**/*.html'
    },
    jshint: {
      gruntfile: {
        options: {
          node: true
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['lib/**/*.js']
      },
      test: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      }
    },
    connect: {
      options: {
        port: 8000,
        hostname: 'localhost',//set 0.0.0.0 for external access
        livereload: 35728,
        base: ['']
      },
      dev: {
        options: {
          open: {
            target: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/example.html'
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');


  // Creates the `server` task
  grunt.registerTask('serve', [
    'default',
    'connect',
    'watch'
  ]);

  grunt.registerTask('default',
    ['clean',
      'jshint',
      'concat',
      'uglify']);

  grunt.registerTask('build',
    ['default',
      'qunit']);
};
