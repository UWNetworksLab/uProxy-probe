TaskManager = require 'uproxy-lib/build/taskmanager/taskmanager'

#-------------------------------------------------------------------------
# Rule-making helper function that assume expected directory layout.
#
# Function to make a copy rule for a module directory, assuming standard
# layout. Copies all non (ts/sass) compiled files into the corresponding
# build directory.
Rule = require('uproxy-lib/Gruntfile.coffee').Rule;

# Copy all source that is not typescript to the module's build directory.
Rule.copySrcModule = (name, dest) ->
  expand: true, cwd: 'src/'
  src: [name + '/**', '!' + name + '/**/*.ts', '!' + name + '/**/*.sass']
  dest: 'build'
  onlyIf: 'modified'

# Copy all libraries (but not samples and typescript src) into the desitination
# directory (typically a sample app)
Rule.copyAllModulesTo = (dest) ->
  files: [
    {  # Copy all modules in the build directory to the sample
      expand: true, cwd: 'build'
      src: ['**/*', '!samples/**', '!typescript-src/**',
            '!samples', '!typescript-src', '!chrome-app']
      dest: 'build/' + dest
      onlyIf: 'modified'
    }
    {  # Useful to support the map files
      expand: true, cwd: 'build'
      src: ['typescript-src/**/*']
      dest: 'build/' + dest
      onlyIf: 'modified'
    }
  ]

# HACK: this overrides Rule's |noImplicitAny=false| to deal with inability to
# refer to `core.XXX` providers as members in JavaScript. See:
# https://github.com/freedomjs/freedom/issues/57
Rule.typeScriptSrc = (name) ->
  src: ['build/typescript-src/' + name + '/**/*.ts', '!**/*.d.ts']
  dest: 'build/'
  options:
    basePath: 'build/typescript-src/'
    ignoreError: false
    noImplicitAny: false
    sourceMap: true


module.exports = (grunt) ->
  path = require('path');

  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json')

    copy: {
      uproxyLib: { files: [ {
          expand: true, cwd: 'node_modules/uproxy-lib/build'
          src: ['**']
          dest: 'build'
          onlyIf: 'modified'
        } ] }

      freedomForChrome: { files: [ {
          expand: true, cwd: 'node_modules/freedom-for-chrome/'
          src: ['freedom-for-chrome.js']
          dest: 'build/freedom-for-chrome' 
          onlyIf: 'modified'
        } ] }

      freedomProviders: { files: [ {
          expand: true, cwd: 'node_modules/freedom/providers/transport/webrtc/'
          src: ['**']
          dest: 'build/freedom-providers' 
          onlyIf: 'modified'
        } ] }

      # Copy any JavaScript from the third_party directory
      e2eCompiledJavaScript: { files: [ {
          src: ['end-to-end.build/build/library/end-to-end.compiled.js']
          dest: 'build/chrome-app/end-to-end.compiled.js'
          onlyIf: 'modified'
        } ] }

      thirdPartyTypeScript: { files: [
          # Copy any typescript from the third_party directory
          {
            expand: true,
            src: ['third_party/**/*.ts']
            dest: 'build/typescript-src/'
            onlyIf: 'modified'
          },
          # freedom-typescript-api interfaces.
          {
            expand: true, cwd: 'node_modules/freedom-typescript-api'
            src: ['interfaces/**/*.ts']
            dest: 'build/typescript-src/freedom-typescript-api/'
            onlyIf: 'modified'
          }
        ]}

      # All module's typescript should be in the standard place for all
      # typescript code: build/typescript-src/
      typeScriptSrc: { files: [ {
          expand: true, cwd: 'src/'
          src: ['**/*.ts']
          dest: 'build/typescript-src/' 
        } ] }

      # Individual modules.
      diagnose: Rule.copySrcModule 'diagnose'
      chromeApp: Rule.copySrcModule 'chrome-app'
      libForChromeApp: Rule.copyAllModulesTo 'chrome-app'
    }  # copy

    #-------------------------------------------------------------------------
    # All typescript compiles to locations in `build/`
    typescript: {
      # From build-tools
      arraybuffers: Rule.typeScriptSrc 'arraybuffers'
      logger: Rule.typeScriptSrc 'logger'
      # Modules
      diagnose: Rule.typeScriptSrc 'diagnose'
      chromeApp: Rule.typeScriptSrc 'chrome-app'
    } # typescript

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

  taskManager.add 'copyModulesSrc', [
    'copy:diagnose'
  ]

  taskManager.add 'base', [
    'copy:uproxyLib'
    'copy:thirdPartyTypeScript'
    'copy:typeScriptSrc'
    'copy:e2eCompiledJavaScript'
    'copy:freedomProviders'
    'copy:freedomForChrome'
    'copy:chromeApp'

    # Copy all source modules non-ts files
    'copyModulesSrc'

  ]

  taskManager.add 'diagnose', [
    'base'
    'typescript:diagnose'
    'typescript:chromeApp'
    'copy:chromeApp'
    'copy:libForChromeApp'
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

