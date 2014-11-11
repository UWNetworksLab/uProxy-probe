TaskManager = require 'uproxy-lib/tools/taskmanager'
Rule = require 'uproxy-lib/tools/common-grunt-rules'

path = require('path');

uproxyLibPath = path.dirname(require.resolve('uproxy-lib/package.json'))

module.exports = (grunt) ->
  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json')

    symlink:
      # Symlink each source file under src/ under build/.
      build:
        files: [
          expand: true
          cwd: 'src/'
          src: ['**/*']
          filter: 'isFile'
          dest: 'build/'
        ]

      # Symlink each file under uproxy-lib's dist/ under build/.
      # Exclude the samples/ directory.
      uproxyLibBuild:
        files: [
          expand: true
          cwd: path.join(uproxyLibPath, 'dist/')
          src: ['**/*', '!samples/**']
          filter: 'isFile'
          dest: 'build/'
        ]

      # Symlink each directory under uproxy-lib's third_party/ under build/third_party/.
      uproxyLibThirdParty:
        files: [
          expand: true
          cwd: path.join(uproxyLibPath, 'third_party/')
          src: ['*']
          filter: 'isDirectory'
          dest: 'build/third_party/'
        ]

      # Symlink the Chrome build of Freedom under build/freedom/.
      freedom:
        files: [ {
          expand: true
          cwd: path.dirname(require.resolve('freedom-for-chrome/Gruntfile'))
          src: ['freedom-for-chrome.js']
          dest: 'build/freedom/'
        } ]

    copy:
      arraybuffers: Rule.copyModule 'arraybuffers'
      logging: Rule.copyModule 'logging'

      freedomTypings: Rule.copyModule 'freedom/typings'

      diagnose: Rule.copyModule 'diagnose'
      chromeApp: Rule.copyModule 'chrome-app'
      chromeAppLib: Rule.copySampleFiles 'chrome-app'

    ts:
      # freedom/typings only contains specs and declarations.
      freedomTypingsSpecDecl: Rule.typescriptSpecDecl 'freedom/typings'

      arraybuffers: Rule.typescriptSrc 'arraybuffers'
      arraybuffersSpecDecl: Rule.typescriptSpecDecl 'arraybuffers'

      logging: Rule.typescriptSrc 'logging'
      loggingSpecDecl: Rule.typescriptSpecDecl 'logging'

      diagnose: Rule.typescriptSrc('diagnose')
      chromeApp: Rule.typescriptSrc('chrome-app')

    clean: ['build/', 'dist/', '.tscache/']

  }  # grunt.initConfig

  #-------------------------------------------------------------------------
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-symlink'
  grunt.loadNpmTasks 'grunt-ts'

  #-------------------------------------------------------------------------
  # Define the tasks
  taskManager = new TaskManager.Manager();

  taskManager.add 'base', [
    'symlink:build',
    'symlink:uproxyLibBuild',
    'symlink:uproxyLibThirdParty',
    'symlink:freedom'
  ]

  taskManager.add 'freedom', [
    'base'
    'ts:freedomTypingsSpecDecl'
    'copy:freedomTypings'
  ]

  taskManager.add 'arraybuffers', [
    'base'
    'ts:arraybuffers'
    'ts:arraybuffersSpecDecl'
    'copy:arraybuffers'
  ]

  taskManager.add 'logging', [
    'base'
    'ts:logging'
    'ts:loggingSpecDecl'
    'copy:logging'
  ]

  taskManager.add 'diagnose', [
    'base'
    'logging'
    'freedom'
    'ts:diagnose'
    'ts:chromeApp'
    'copy:diagnose'
    'copy:chromeApp'
    'copy:chromeAppLib'
  ]

  #-------------------------------------------------------------------------
  taskManager.add 'build', [
    'base'
    # Modules in uprobe
    'diagnose'
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

