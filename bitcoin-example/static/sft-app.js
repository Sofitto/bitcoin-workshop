'use strict';

function SftApp(blockChain) {
    var listeners = {};
    var utxos;
    var card;
    var cardProperties;
    var currentTransaction;
    var balanceBTC;
    var self = this;

    this.fetchCardBalance = fetchCardBalance;
    this.isTestNet = true;

    this.on = function (eventName, callback) {
      listeners[eventName] = callback;
    };

    this.insertCard = function (insertedCard) {
        card = insertedCard;
        if (!card.isInitialized()) {
            return;
        }

        fetchCardBalance();
        dispatchEvent("cardAdded", card);
    };

    this.initializeCard = function () {
        card.init();
        var cardPubKey = card.getPublicKey();
        var address = blockChain.generateSingleAddress(cardPubKey, self.isTestNet);

        card.setAddress(address);
        dispatchEvent("cardInitialized", card);

        fetchCardBalance();
    };

    this.createTransaction = function (toAddress, amountBTC) {
        var transaction = blockChain.createTransactionFromUtxos(toAddress, card.getAddress(), amountBTC, utxos, balanceBTC);
        if (!transaction) {
            return;
        }
        
        /* Simple flow. Part 1 */
        currentTransaction = blockChain.signTransaction(transaction, card.getPrivateKey());

        /* Advanced flow. Part 2
        var challenges = blockChain.getCryptoChallenges(transaction);

        var serialized = challenges.map(card.sign);
        var derSignatures = serialized.map(blockChain.fromBufferToSignature);

        currentTransaction = blockChain.applyDerSignatures(transaction, derSignatures, card.getPublicKey());
        */
    };

    this.withdraw = function (amountEUR) {

    };

    this.broadcastCurrentTransaction = function () {
        if (!currentTransaction) {
            return;
        }

        blockChain.broadcastTransaction(currentTransaction, self.isTestNet, onBroadcasted);        
    };

    this.getBalance = function () {
        return balanceBTC;
    };

    function onBroadcasted(txId) {
        currentTransaction = null;

        fetchCardBalance();
    }

    function onCardProperties(properties) {
        cardProperties = properties;
    }

    function fetchCardBalance() {
        blockChain.getUnspentUtxos(card.getAddress(), onUtxosReceived)
    }

    function onUtxosReceived(unspent, balance) {
        utxos = unspent;
        balanceBTC = balance;
        dispatchBalance();
    }

    function dispatchBalance() {
        if (balanceBTC == undefined){
            return;
        }
        dispatchEvent("balanceUpdated", balanceBTC);
    }

    function dispatchEvent(eventName) {
        if (!(eventName in listeners)) {
            return;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        listeners[eventName].apply(this, args);
    }
}