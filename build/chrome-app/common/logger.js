var Logger;
(function (Logger) {
    var logBuffer = [];
    var enabled = true;

    function getLog() {
        var tags = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            tags[_i] = arguments[_i + 0];
        }
        return new ArrayBuffer(12);
    }

    freedom.on('logger.reset', function (m) {
        logBuffer = [];
    });

    freedom.on('logger.enable', function (m) {
        enabled = !!m;
    });

    function getTimestamp() {
        var d = new Date();
        return d.getMonth() + '/' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + '.' + d.getMilliseconds();
    }

    function format(level, tag, msg, args) {
        var formatted_msg = msg;
        if (args && args.length) {
            for (var i = 0; i < args.length; i++) {
                formatted_msg = formatted_msg.replace('%' + (i + 1), args[i]);
            }
        }
        var ret = tag + ':' + level + ':' + getTimestamp() + '\t' + formatted_msg;
        console.log(ret);
        return ret;
    }

    function debug(tag, msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        enabled && logBuffer.push(format('D', tag, msg, args));
    }

    function info(tag, msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        enabled && logBuffer.push(format('I', tag, msg, args));
    }

    function warn(tag, msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        enabled && logBuffer.push(format('W', tag, msg, args));
    }

    function error(tag, msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        enabled && logBuffer.push(format('E', tag, msg, args));
    }

    function format2(level, m) {
        enabled && logBuffer.push(format(level, m.tag, m.msg, m.args));
    }

    freedom.on('logger.debug', function (m) {
        format2('D', m);
    });

    freedom.on('logger.info', function (m) {
        format2('I', m);
    });

    freedom.on('logger.warn', function (m) {
        format2('W', m);
    });

    freedom.on('logger.error', function (m) {
        format2('E', m);
    });

    freedom.on('logger.getLog', function () {
        var logs = logBuffer.join('\n');
        freedom.emit('logger.report', logs);
    });
})(Logger || (Logger = {}));
