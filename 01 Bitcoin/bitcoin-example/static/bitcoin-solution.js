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
        return new bitcore.PrivateKey();
    };

    this.generateSingleAddress = function (publicKey, isTestnet) {
        var pk = convertStringToBitcorePublicKey(publicKey);
        var network = isTestnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet;
        var address = bitcore.Address.fromPublicKey(pk, network);
        return address;
    };

    this.getUnspentUtxos = function (address, callback) {
        var ins = isMainnet(address) ? insight : insightTestnet;
        ins.requestGet('/api/addr/'+address.toString() + '/utxo', function(err, res, body) {
            if (err || res.statusCode !== 200) {
                console.log('Insight error: ' + err);
                callback(null);
                return;
            }
            var utxos = JSON.parse(body);
            var balance = utxos.reduce(function (sum, utxo) {
                    return sum + utxo.satoshis;
                }, 0) / 1e8;

            callback(utxos, balance);
        });
    };

    this.signTransaction = function (tx, priv) {
        var transaction = (tx instanceof bitcore.Transaction) ? tx : new bitcore.Transaction(tx);
        var privateKey  = (priv instanceof bitcore.PrivateKey) ? priv : new bitcore.PrivateKey(priv);

        return transaction.sign(privateKey);
    };

    this.broadcastTransaction = function (tx, testnet, callback) {
        var ts = new Date();
        var ins = testnet ? insightTestnet : insight;
        ins.broadcast(tx, function (err, txId) {
            if (err) {
                console.log("insight error " + err);
                callback('-3');
                return;
            }
            console.log("Broadcast callback: txId= " + txId + ', took: ' + (new Date().getTime() - ts.getTime()) + 'ms');

            callback(txId, tx.getFee() / 1e8);
        });
    };

    this.createTransactionFromUtxos = function (toAddress, fromAddress, amountBTC, utxos, balance) {
        var amount = Math.round(Number(amountBTC) * 1e8);

        var txUtxos;
        if (Number(amountBTC) == balance && amount > est_fee) {
            txUtxos = utxos;
            amount -= est_fee;
        } else {
            txUtxos = getUtxosForTransaction(utxos, amount);
        }
        if (txUtxos === -1) {
            return null;
        }

        var tx = new bitcore.Transaction()
            .from(txUtxos)
            .to(toAddress, amount)
            .fee(est_fee)
            .change(fromAddress);

        return tx;
    };

    this.getCryptoChallenges = function (transaction) {
        var challenges = transaction.inputs.map(function (input, index) {
            return bitcore.Transaction.sighash.sighash(transaction, sigtype, index, input.redeemScript);
        });

        return challenges;
    };

    this.applyDerSignatures = function (tx, derSignatures, pub) {
        var publicKey = convertStringToBitcorePublicKey(pub);
        var signatures = tx.inputs.map(function (input, index) {
            return new bitcore.Transaction.Signature({
                    publicKey: publicKey,
                    prevTxId: input.prevTxId,
                    outputIndex: input.outputIndex,
                    inputIndex: index,
                    signature: derSignatures[index],
                    sigtype: sigtype
                });
        });

        signatures.forEach(function (signature) {
            if (!tx.isValidSignature(signature)) {
                console.log("Signature is not valid");
                return;
            }

            tx.applySignature(signature);
        });

        return tx;
    };

    this.generateMultisigAddress = function (publicKeys, requiredSignaturesCount, isTestnet) {
        var bitcorePublicKeys = publicKeys.map(convertStringToBitcorePublicKey);
        var network = isTestnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet;
        var address = bitcore.Address.createMultisig(bitcorePublicKeys, requiredSignaturesCount, network);
        return address;
    };

    this.toPublicKeyString = function (privateKeyString) {
        var privateKey = new bitcore.PrivateKey(privateKeyString);
        return privateKey.publicKey.toString()
    };

    this.toPrivateKey = function (privateKeyString) {
        return new bitcore.PrivateKey(privateKeyString);
    };

    this.fromBufferToSignature = function (buf) {
        return bitcore.crypto.Signature.fromBuffer(buf);
    };

    this.isValidAddress = function(address, testnet){
        return bitcore.Address.isValid(address, testnet ? bitcore.Networks.testnet : bitcore.Networks.mainnet);
    };

    this.convertTxAmount = function (tx) {
        return tx;
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