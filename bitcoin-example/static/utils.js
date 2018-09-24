'use strict';

function SftUtils() {
    this.strToUint8Arr = function (str) {
        return new Uint8Array(toArray(str));
    };

    this.strToBuffer = function (str) {
        return new Buffer(toArray(str));
    };

    this.uint8ArrToString = function (arr) {
        var res = '';
        for (var i = 0; i < arr.length; res += toHex(arr[i]), i++);
        return res;
    };

    function toHex (n) {
        if (n < 16) return '0' + n.toString(16);
        return n.toString(16);
    }

    function toArray(str) {
        var arr = [];
        var msg = str.replace(/[^a-z0-9]+/ig, '');
        if (msg.length % 2 !== 0)
            msg = '0' + msg;
        for (var i = 0; i < msg.length; i += 2)
            arr.push(parseInt(msg[i] + msg[i + 1], 16));
        return arr;
    }

}
if (typeof exports === 'object')
    module.exports = SftUtils;