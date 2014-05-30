var Log;
(function (Log) {
    var logger = freedom['logger'] ? freedom['logger']() : freedom;
    var tag = '';

    function setTag(t) {
        tag = t;
    }
    Log.setTag = setTag;

    function debug(m) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        logger.emit('logger.debug', { tag: tag, msg: m, args: args });
    }
    Log.debug = debug;

    function info(m) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        logger.emit('logger.info', { tag: tag, msg: m, args: args });
    }
    Log.info = info;

    function warn(m) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        logger.emit('logger.warn', { tag: tag, msg: m, args: args });
    }
    Log.warn = warn;

    function error(m) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        logger.emit('logger.error', { tag: tag, msg: m, args: args });
    }
    Log.error = error;

    function getLog(m) {
        logger.emit('logger.getLog', m);
    }
    Log.getLog = getLog;

    freedom['reflectEvents'] = false;

    freedom.on('logger.debug', function (m) {
        logger.emit('logger.debug', m);
    });

    freedom.on('logger.info', function (m) {
        logger.emit('logger.info', m);
    });

    freedom.on('logger.warn', function (m) {
        logger.emit('logger.warn', m);
    });

    freedom.on('logger.error', function (m) {
        logger.emit('logger.error', m);
    });

    freedom.on('logger.getLog', function (m) {
        logger.emit('logger.getLog', m);
    });

    logger.on('logger.report', function (m) {
        freedom.emit('print', m);
    });
})(Log || (Log = {}));
