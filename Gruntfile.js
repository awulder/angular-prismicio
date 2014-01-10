'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-zip');

  grunt.renameTask("bower", "bowerInstall");

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/**\n' +
        ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @author <%= pkg.author %>\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
        ' */\n'
    },
    dirs: {
      dest: 'dist'
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['src/*.js'],
        dest: '<%= dirs.dest %>/<%= pkg.name %>.js'
      }
    },
    zip: {
      '<%= dirs.dest %>/angular-prismicio.zip': ['<%= dirs.dest %>/<%= pkg.name %>.js', '<%= dirs.dest %>/<%= pkg.name %>.min.js']
    },
    bowerInstall: {
      install: {
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: '<%= dirs.dest %>/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        curly: false,
        browser: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        expr: true,
        node: true,
        globals: {
          exports: true,
          angular: false,
          $: false
        }
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      build: {
        singleRun: true,
        autoWatch: false
      },
      travis: {
        singleRun: true,
        autoWatch: false,
        browsers: ['PhantomJS']
      },
      dev: {
        autoWatch: true
      }
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }
  });

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['bowerInstall', 'karma:build', 'jshint', 'concat', 'uglify', 'zip']);
  grunt.registerTask('quality', ['bowerInstall', 'karma:build', 'jshint']);
  grunt.registerTask('test', ['karma:build']);
  grunt.registerTask('testDebug', ['karma:dev']);
  grunt.registerTask('travis', ['karma:travis']);
  grunt.registerTask('bump', 'Increment version number', function() {
    var versionType = grunt.option('type');

    function bumpVersion(version, versionType) {
      var type = {patch: 2, minor: 1, major: 0},
        parts = version.split('.'),
        idx = type[versionType || 'patch'];

      parts[idx] = parseInt(parts[idx], 10) + 1;

      while (++idx < parts.length) {
        parts[idx] = 0;
      }
      return parts.join('.');
    }

    var version;

    function updateFile(file) {
      var json = grunt.file.readJSON(file);
      version = json.version = bumpVersion(json.version, versionType || 'patch');
      grunt.file.write(file, JSON.stringify(json, null, '  '));
    }

    updateFile('package.json');
    updateFile('bower.json');
    grunt.log.ok('Version bumped to ' + version);
  });

};