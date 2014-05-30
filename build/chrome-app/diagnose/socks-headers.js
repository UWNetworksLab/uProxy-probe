var Socks;
(function (Socks) {
    Socks.VERSION5 = 0x05;

    (function (AUTH) {
        AUTH[AUTH["NOAUTH"] = 0x00] = "NOAUTH";
        AUTH[AUTH["GSSAPI"] = 0x01] = "GSSAPI";
        AUTH[AUTH["USERPASS"] = 0x02] = "USERPASS";

        AUTH[AUTH["NONE"] = 0xFF] = "NONE";
    })(Socks.AUTH || (Socks.AUTH = {}));
    var AUTH = Socks.AUTH;

    (function (REQUEST_CMD) {
        REQUEST_CMD[REQUEST_CMD["CONNECT"] = 0x01] = "CONNECT";
        REQUEST_CMD[REQUEST_CMD["BIND"] = 0x02] = "BIND";
        REQUEST_CMD[REQUEST_CMD["UDP_ASSOCIATE"] = 0x03] = "UDP_ASSOCIATE";
    })(Socks.REQUEST_CMD || (Socks.REQUEST_CMD = {}));
    var REQUEST_CMD = Socks.REQUEST_CMD;

    (function (ATYP) {
        ATYP[ATYP["IP_V4"] = 0x01] = "IP_V4";
        ATYP[ATYP["DNS"] = 0x03] = "DNS";
        ATYP[ATYP["IP_V6"] = 0x04] = "IP_V6";
    })(Socks.ATYP || (Socks.ATYP = {}));
    var ATYP = Socks.ATYP;

    (function (RESPONSE) {
        RESPONSE[RESPONSE["SUCCEEDED"] = 0x00] = "SUCCEEDED";
        RESPONSE[RESPONSE["FAILURE"] = 0x01] = "FAILURE";
        RESPONSE[RESPONSE["NOT_ALLOWED"] = 0x02] = "NOT_ALLOWED";
        RESPONSE[RESPONSE["NETWORK_UNREACHABLE"] = 0x03] = "NETWORK_UNREACHABLE";
        RESPONSE[RESPONSE["HOST_UNREACHABLE"] = 0x04] = "HOST_UNREACHABLE";
        RESPONSE[RESPONSE["CONNECTION_REFUSED"] = 0x05] = "CONNECTION_REFUSED";
        RESPONSE[RESPONSE["TTL_EXPIRED"] = 0x06] = "TTL_EXPIRED";
        RESPONSE[RESPONSE["UNSUPPORTED_COMMAND"] = 0x07] = "UNSUPPORTED_COMMAND";
        RESPONSE[RESPONSE["ADDRESS_TYPE"] = 0x08] = "ADDRESS_TYPE";
        RESPONSE[RESPONSE["RESERVED"] = 0x09] = "RESERVED";
    })(Socks.RESPONSE || (Socks.RESPONSE = {}));
    var RESPONSE = Socks.RESPONSE;

    

    function interpretSocksRequest(byteArray, result) {
        if (byteArray.length < 9) {
            throw new Error('SOCKS request too short');
        }

        result.version = byteArray[0];
        if (result.version !== Socks.VERSION5) {
            throw new Error('must be SOCKS5');
        }

        result.cmd = byteArray[1];

        if (result.cmd != 1 /* CONNECT */ && result.cmd != 3 /* UDP_ASSOCIATE */) {
            throw new Error('unsupported SOCKS command (CMD): ' + result.cmd);
        }

        result.protocol = result.cmd == 1 /* CONNECT */ ? 'tcp' : 'udp';

        interpretSocksAddress(byteArray.subarray(3), result);
    }
    Socks.interpretSocksRequest = interpretSocksRequest;

    

    function interpretUdpRequest(byteArray, result) {
        if (byteArray.length < 10) {
            throw new Error('UDP request too short');
        }

        result.frag = byteArray[2];
        if (result.frag !== 0) {
            throw new Error('fragmentation not supported');
        }

        var addressLength = interpretSocksAddress(byteArray.subarray(3), result);

        result.data = byteArray.subarray(3 + addressLength);
    }
    Socks.interpretUdpRequest = interpretUdpRequest;

    

    function interpretSocksAddress(byteArray, result) {
        var portOffset;
        result.atyp = byteArray[0];
        if (1 /* IP_V4 */ == result.atyp) {
            var addressSize = 4;
            var address = byteArray.subarray(1, 1 + addressSize);
            result.addressString = Array.prototype.join.call(address, '.');
            portOffset = addressSize + 1;
        } else if (3 /* DNS */ == result.atyp) {
            var addressSize = byteArray[1];
            result.addressString = '';
            for (var i = 0; i < addressSize; ++i) {
                result.addressString += String.fromCharCode(byteArray[2 + i]);
            }
            portOffset = addressSize + 2;
        } else if (4 /* IP_V6 */ == result.atyp) {
            var addressSize = 16;
            var uint16View = new Uint16Array(byteArray.buffer, 1, 5);
            result.addressString = Array.prototype.map.call(uint16View, function (i) {
                return (((i & 0xFF) << 8) | ((i >> 8) & 0xFF)).toString(16);
            }).join(':');
            portOffset = addressSize + 1;
        } else {
            throw new Error('unsupported SOCKS address type (ATYP): ' + result.atyp);
        }

        var portByte1 = byteArray[portOffset];
        var portByte2 = byteArray[portOffset + 1];
        result.port = byteArray[portOffset] << 8 | byteArray[portOffset + 1];

        return portOffset + 2;
    }
    Socks.interpretSocksAddress = interpretSocksAddress;
})(Socks || (Socks = {}));
