var ArrayBuffers;
(function (ArrayBuffers) {
    function arrayBufferToString(buffer) {
        var bytes = new Uint8Array(buffer);
        var a = [];
        for (var i = 0; i < bytes.length; ++i) {
            a.push(String.fromCharCode(bytes[i]));
        }
        return a.join('');
    }
    ArrayBuffers.arrayBufferToString = arrayBufferToString;

    function stringToArrayBuffer(s) {
        var buffer = new ArrayBuffer(s.length);
        var bytes = new Uint8Array(buffer);
        for (var i = 0; i < s.length; ++i) {
            bytes[i] = s.charCodeAt(i);
        }
        return buffer;
    }
    ArrayBuffers.stringToArrayBuffer = stringToArrayBuffer;

    function arrayBufferToHexString(buffer) {
        var bytes = new Uint8Array(buffer);
        var a = [];
        for (var i = 0; i < buffer.byteLength; ++i) {
            a.push(bytes[i].toString(16));
        }
        return a.join('.');
    }
    ArrayBuffers.arrayBufferToHexString = arrayBufferToHexString;

    function hexStringToArrayBuffer(hexString) {
        if (hexString === '') {
            return new ArrayBuffer(0);
        }
        var hexChars = hexString.split('.');
        var buffer = new ArrayBuffer(hexChars.length);
        var bytes = new Uint8Array(buffer);
        for (var i = 0; i < hexChars.length; ++i) {
            bytes[i] = parseInt('0x' + hexChars[i]);
        }
        return buffer;
    }
    ArrayBuffers.hexStringToArrayBuffer = hexStringToArrayBuffer;
})(ArrayBuffers || (ArrayBuffers = {}));
