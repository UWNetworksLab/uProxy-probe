TaskManager = require './node_modules/uproxy-build-tools/build/taskmanager/taskmanager'

module.exports = (grunt) ->

  path = require('path');

  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json')

    copy: {
      freedomChrome: { files: [ {
        expand: true, cwd: 'node_modules/freedom-for-chrome/'
        src: ['freedom-for-chrome.js']
        dest: 'build/chrome-app/' } ] }
      freedomProvidersChrome: { files: [ {
        expand: true, cwd: 'node_modules/freedom/providers/transport/webrtc/'
        src: ['*']
        dest: 'build/chrome-app/freedom-providers' } ] }

      # User should include the compiled source directly from:
      diagnose: { files: [ {
        expand: true, cwd: 'src/'
        src: ['diagnose/**/*.json']
        dest: 'build/' } ] }
      logger: { files: [ {
        expand: true, cwd: 'src/'
        src: ['logger/**/*.json']
        dest: 'build/' } ] }
      pidCrypt: { files: [ {
        expand: true, cwd: 'src/'
        src: ['pidCrypt/**/*.js']
        dest: 'build/' } ] }
      chromeApp: { files: [ {
          expand: true, cwd: 'src/chrome-app'
          src: ['**/*.json', '**/*.js', '**/*.html', '**/*.css']
          dest: 'build/chrome-app/'
        }, {
          expand: true, cwd: 'build/diagnose',
          src: ['**/*.js', '**/*.json'],
          dest: 'build/chrome-app/diagnose'
        }, {
          expand: true, cwd: 'build/logger',
          src: ['**/*.js', '**/*.json'],
          dest: 'build/chrome-app/logger'
        }, {
          expand: true, cwd: 'build/pidCrypt',
          src: ['**/*.js', '**/*.json'],
          dest: 'build/chrome-app/pidCrypt'
        }, {
          expand: true, cwd: 'build/common',
          src: ['**/*.js'],
          dest: 'build/chrome-app/common'
        } ] }
    }

    #-------------------------------------------------------------------------
    # All typescript compiles to build/ initially.
    typescript: {
      diagnose:
        src: ['src/diagnose/**/*.ts']
        dest: 'build/'
        options: { basePath: 'src', ignoreError: false }
      logger:
        src: ['src/logger/**/*.ts']
        dest: 'build/'
        options: { basePath: 'src', ignoreError: false }
      common:
        src: ['src/common/**/*.ts']
        dest: 'build/'
        options: { basePath: 'src', ignoreError: false }
      chromeApp:
        src: ['src/chrome-app/**/*.ts']
        dest: 'build/'
        options: { basePath: 'src/', ignoreError: false }
    }

    clean: ['build/**']
  }  # grunt.initConfig

  #-------------------------------------------------------------------------
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-env'

  #-------------------------------------------------------------------------
  # Define the tasks
  taskManager = new TaskManager.Manager();

  taskManager.add 'build', [
    'typescript:diagnose'
    'typescript:logger'
    'typescript:common'
    'typescript:chromeApp'
    'copy:freedomChrome'
    'copy:freedomProvidersChrome'
    'copy:diagnose'
    'copy:logger'
    'copy:pidCrypt'
    'copy:chromeApp'
  ]

  # This is the target run by Travis. Targets in here should run locally
  # and on Travis/Sauce Labs.
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
