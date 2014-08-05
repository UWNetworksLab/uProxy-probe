uproxy-probe
=========

uproxy-probe is a testing app to diagnose uProxy connection process in case of failure.

This is built on top of [freedom](https://github.com/UWNetworksLab/freedom).

At the moment this only supports chrome.

### Overview

Probe itself is implemented as a Chrome App. Most of the work is done in freedom module Diagnose.

#### Requirements

- node + npm
- grunt `npm install -g grunt-cli`

Please also reference to the end-to-end code section for additional step to bring e2e code to picture.

#### Build

- Run `npm install` from the base directory to obtain all prerequisites.
- Running `grunt` compiles all the typescript into javascript which goes into the `build` directory.

Please also reference to the end-to-end code section for additional step to buid e2e.

#### Usage

Install this app to Chrome. 

### Run the Jasmine Tests

 - run Jasmine tests with `grunt test`

### End-to-End Test

- end-to-end code is brought in through following command run in uproxy-probe 
root directory.

  git clone https://code.google.com/p/end-to-end.build/
  
- Before start grunt, please run following to build end-to-end

  cd end-to-end.build/

  ./do.sh install_deps

  ./do.sh build_library  

  The above process will install all necessary dependency, and build the compiled js binary (don't be fooled by the term if you are new to Closure, it is still js code). 

  The grunt process will grab the compiled library and copy it to where it is needed.

  In src/chrome-app/uprobe.js, the following lines call the pgp testing code. 
  pgpEncrypt.setup();
  pgpEncrypt.testPgpEncryption('asdfasdf');

  pgpEncrypt module is implemented in logencrypt.ts, with a little need from "googstorage.js" in the same directory. The actual work is done through "end-to-end.compiled.js".


#### Manual

- Run `grunt build` to build the chrome app in the `build/chrome-app/` directory.
- For Chrome, go to `chrome://extensions`, ensure developer mode is enabled, 
and load unpacked extension the `build/chrome-app` directory.
- Click "reload" to load the app. You might need to click "uprobe.html" for output.

