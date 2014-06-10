/// <reference path='../../node_modules/uproxy-build-tools/third_party/DefinitelyTyped/jasmine/jasmine.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />
/// <reference path='logger.ts' />

describe("Logger", function() {
  beforeEach(function() {
    Logger.reset();
  });

  it('format string', function() {
    expect(Logger.format('D', 'tag', 'simple string', []))
        .toMatch(/.*\|tag\|D\|simple string/);
    expect(Logger.format('I', 'test-module', 'second string', []))
        .toMatch(/.*\|test-module\|I\|second string/);

    expect(Logger.format('W', 'test', '%1 pinged %2 with id=%3', [
                         'Bob', 'Alice', 123456]))
        .toMatch(/.*\|test\|W\|Bob pinged Alice with id=123456/);

  });

  it('grab logs', function() {
    Logger.debug('tag', 'simple string');
    Logger.info('test-module', 'second string');
    expect(Logger.getLogs())
        .toMatch(/.*\|tag\|D\|simple string\n.*\|test-module\|I\|second string/);
  });

  it('format message like printf', function(){
    Logger.error('test', '%1 pinged %2 with id=%3', 'Bob', 'Alice', 123456);
    expect(Logger.getLogs())
        .toMatch(/.*\|test\|E\|Bob pinged Alice with id=123456/);
  });

});



