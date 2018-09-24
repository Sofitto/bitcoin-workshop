'use strict';

function SftCard(blockChain, storage, cardNumber) {
    var PREFIX = cardNumber + ".";
    var PRIVATE_KEY = PREFIX + "PrivateKey";
    var ADDRESS = PREFIX + "Address";

    // properties
    var _cardNumber = cardNumber;
    var _address;
    var _privateKey;
    var _publicKey;

    if (PRIVATE_KEY in storage) {
        _privateKey = storage[PRIVATE_KEY];
        _publicKey = blockChain.toPublicKeyString(_privateKey);
    }
    if (ADDRESS in storage) {
        _address = storage[ADDRESS];
    }

    this.getCardNumber = function () {
        return _cardNumber;
    };

    this.getAddress = function () {
        return _address;
    };

    this.setAddress = function (address) {
        _address = address;
        storage[ADDRESS] = address.toString();
    };

    this.getPublicKey = function () {
        return _publicKey.toString();
    };

    this.getPrivateKey = function () {
        return blockChain.toPrivateKey(_privateKey);
    };

    this.isInitialized = function () {
        return PRIVATE_KEY in storage;
    };

    this.init = function () {
        initBlockchainKeys();
        return _publicKey;
    };

    this.sign = function (hash) {
        return blockChain.signDigest(_privateKey, hash);
    };

    function initBlockchainKeys() {
        _privateKey = blockChain.generatePrivateKey();
        _publicKey = _privateKey.publicKey.toString();
        storage[PRIVATE_KEY] = _privateKey.toString();
    }

    function toString(x) {
        return x.toString();
    }

}