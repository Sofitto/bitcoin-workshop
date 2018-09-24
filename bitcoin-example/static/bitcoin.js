'use strict';
var bitcore = require("bitcore-lib");
var Insight = require('bitcore-explorers').Insight;

function BitcoinBlockchain(config) {
    var sigtype = bitcore.crypto.Signature.SIGHASH_ALL;
    var insight = config.mainnetUrl ? new Insight(config.mainnetUrl, bitcore.Networks.mainnet) : new Insight(bitcore.Networks.mainnet);
    var insightTestnet = config.testnetUrl ? new Insight(config.testnetUrl, bitcore.Networks.testnet): new Insight(bitcore.Networks.testnet);
    var self = this;
    var est_fee = 21000;
    var ECDSA = bitcore.crypto.ECDSA;

    this.generatePrivateKey = function () {
        // TODO: IMPLEMENT
    };

    this.toPublicKeyString = function (privateKeyString) {
        // TODO: IMPLEMENT
    };

    this.toPrivateKey = function (privateKeyString) {
        // TODO: IMPLEMENT
    };

    this.generateSingleAddress = function (publicKey, isTestnet) {
        // TODO: IMPLEMENT
    };

    this.getUnspentUtxos = function (address, callback) {
        // TODO: IMPLEMENT
    };

    this.signTransaction = function (tx, priv) {
        // TODO: IMPLEMENT
    };

    this.broadcastTransaction = function (tx, testnet, callback) {
        // TODO: IMPLEMENT
    };

    this.createTransactionFromUtxos = function (toAddress, fromAddress, amountBTC, utxos, balance) {
        // TODO: IMPLEMENT
    };

    this.getCryptoChallenges = function (transaction) {
        // TODO: IMPLEMENT
    };

    this.applyDerSignatures = function (tx, derSignatures, pub) {
        // TODO: IMPLEMENT
    };

    this.generateMultisigAddress = function (publicKeys, requiredSignaturesCount, isTestnet) {
        // TODO: IMPLEMENT
    };

    this.fromBufferToSignature = function (buf) {
        return bitcore.crypto.Signature.fromBuffer(buf);
    };

    this.isValidAddress = function(address, testnet){
        return bitcore.Address.isValid(address, testnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet);
    };


    this.signDigest = function (privateKey, digest) {
        var bitcorePK = this.toPrivateKey(privateKey);
        var sig = ECDSA.sign(digest, bitcorePK, 'little').set({
            nhashtype: sigtype
        });
 
        return sig.toBuffer();
    }

    function getUtxosForTransaction (utxos, amount) {
        if (!(amount > 0 && amount < 9e15)) {
            console.log("Invalid amount");
            return -1;
        }

        var left = amount;
        utxos.sort(compareConfirmations);

        for (var i in utxos)
            if ((left -= utxos[i].satoshis) < -est_fee)
                break;

        if (left >= 0) {
            console.log("Not enough");
            return -1;
        }

        return utxos.slice(0, Number(i) + 1);
    }

    function convertStringToBitcorePublicKey(pubKey) {
        if (pubKey instanceof bitcore.PublicKey) {
            return pubKey;
        }
        return new bitcore.PublicKey(pubKey);
    }

    function compareConfirmations(a, b) {
        return b.confirmations - a.confirmations;
    }

    function isMainnet(address) {
        return address.charAt(0) == '1' || address.charAt(0) == '3';
    }

}
if (typeof exports === 'object')
    module.exports = BitcoinBlockchain;