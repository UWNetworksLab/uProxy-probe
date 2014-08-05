TaskManager = require('uproxy-lib/tools/taskmanager');
Rule = require('uproxy-lib/tools/common-grunt-rules');

module.exports = (grunt) ->
  # path = require('path');
  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json')

    symlink: {
      typescriptSrc: {
        files: [ {
          expand: true,
          overwrite: true,
          cwd: 'src',
          src: ['*'],
          dest: 'build/typescript-src/'
        } ]
      },

      uproxyLibTypescriptSrc: {
        files: [ {
          expand: true,
          overwrite: true,
          cwd: 'node_modules/uproxy-lib/src/',
          src: ['*'],
          dest: 'build/typescript-src/'
        } ]
      },

      uproxyLibThirdPartyTypescriptSrc: {
        overwrite: true,
        src: 'node_modules/uproxy-lib/third_party/',
        dest: 'build/typescript-src/third_party/'
      },

      thirdPartyTypeScript: {
        files: [
          # Copy any typescript from the third_party directory
          {
            expand: true,
            overwrite: true,
            cwd: 'third_party',
            src: ['*']
            dest: 'build/typescript-src/'
          },
          # freedom-typescript-api interfaces.
          {
            expand: true,
            overwrite: true,
            cwd: 'node_modules/freedom-typescript-api/interfaces'
            src: ['*']
            dest: 'build/typescript-src/freedom-typescript-api/'
          }
        ]}
    },

    copy: {
      uproxyLib: {
        files: [ {
          expand: true, cwd: 'node_modules/uproxy-lib/build',
          src: ['**', '!**/typescript-src/**'],
          dest: 'build',
          onlyIf: 'modified',
        } ]
      },

      crypto: { files: [ {
          expand: true, cwd: 'node_modules/crypto/'
          src: ['**']
          dest: 'build/crypto' 
          onlyIf: 'modified'
        } ] }

      es6Promise: { files: [ {
          expand: true, cwd: 'node_modules/es6-promise/dist/'
          src: ['**']
          dest: 'build/third_party/typings/es6-promise/' 
          onlyIf: 'modified'
        } ] }

      chromeAppLib: {
        files: [
          {  # Copy all modules in the build directory to the chromeApp
            expand: true, cwd: 'build'
            # src: ['**/*', '!typescript-src/**', '!chrome-app/**']
            src: [
              'diagnose/**',
              'arraybuffers/**',
              'logger/**'
            ]
            dest: 'build/chrome-app'
            onlyIf: 'modified'
          }
        ]
      },
      chromeAppFreedom: {
        expand: true,
        cwd: 'node_modules/uproxy-lib/build/freedom/',
        src: ['freedom-for-chrome-for-uproxy.js*'],
        dest: 'build/chrome-app/'
        onlyIf: 'modified'
      },

      # Copy any JavaScript from the third_party directory
      e2eCompiledJavaScript: { files: [ {
          src: ['end-to-end.build/build/library/end-to-end.compiled.js']
          dest: 'build/diagnose/end-to-end.compiled.js'
          onlyIf: 'modified'
        } ] }


      # Individual modules.
      diagnose: Rule.copyModule('diagnose')
      chromeApp: Rule.copyModule('chrome-app')
    }  # copy

    #-------------------------------------------------------------------------
    # All typescript compiles to locations in `build/`
    typescript: {
      # From build-tools
      arraybuffers: Rule.typescriptSrc('arraybuffers')
      logger: Rule.typescriptSrc('logger')

      # Modules
      diagnose: Rule.typescriptSrc('diagnose')
      chromeApp: Rule.typescriptSrc('chrome-app')
    } # typescript

    clean: ['build/**']
  }  # grunt.initConfig

  #-------------------------------------------------------------------------
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-env'
  grunt.loadNpmTasks 'grunt-contrib-symlink'

  #-------------------------------------------------------------------------
  # Define the tasks
  taskManager = new TaskManager.Manager();

  taskManager.add 'base', [
    'copy:uproxyLib',
    'symlink:typescriptSrc',
    'symlink:uproxyLibTypescriptSrc',
    'symlink:thirdPartyTypeScript',
    'symlink:uproxyLibThirdPartyTypescriptSrc',

    'copy:e2eCompiledJavaScript'
    'copy:crypto'
    'copy:es6Promise'

    # Copy all source modules non-ts files
    'copy:diagnose' 
    'copy:chromeApp'
  ]

  taskManager.add 'diagnose', [
    'base'
    'typescript:diagnose'
    'typescript:chromeApp'
    'copy:chromeAppLib'
    'copy:chromeAppFreedom'
  ]

  #-------------------------------------------------------------------------
  taskManager.add 'build', [
    'base'
    # Modules in uprobe
    'diagnose'
  ]

  taskManager.add 'test', [
    'build'
  ]

  taskManager.add 'default', [
    'build'
  ]

  #-------------------------------------------------------------------------
  # Register the tasks
  taskManager.list().forEach((taskName) =>
    grunt.registerTask taskName, (taskManager.get taskName)
  );

module.exports.Rule = Rule;

