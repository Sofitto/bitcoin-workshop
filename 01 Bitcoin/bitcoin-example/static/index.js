'use strict';
// DOM stuff
var $ = function(id) { return window.document.getElementById(id)};

function show(id) {
    $(id).style.display = 'block';
}

function hide(id) {
    $(id).style.display = 'none';
}

// App objects

var blockChain = new BitcoinBlockchain({});
var utils = new SftUtils();
var app = new SftApp(blockChain);
var cards = {};
var activeLink, activeCard;

app.on("cardAdded", onCardAdded);
app.on("cardInitialized", onCardInitialized);
app.on("balanceUpdated", onBalanceReceived);

window.onload = function() {
    initCards();

    $('txBtn').addEventListener('click', createTransaction);
    $('withdrawBtn').addEventListener('click', withdraw);
    $('broadcastTxBtn').addEventListener('click', broadcastTransaction);
    $('createCardBtn').addEventListener('click', createCard);
    $('initBtn').addEventListener('click', app.initializeCard);
    $('refreshBalanceBtn').addEventListener('click', app.fetchCardBalance);
    $('testnetSwitch').addEventListener('click', updateNetwork);
    $('copyToClipboardBtn').addEventListener('click', copyCardNumber);
    $('allBtn').addEventListener('click', selectAllBalance);
};

function updateNetwork() {
    app.isTestNet = $('testnetSwitch').checked;
    showCardDetails(activeCard);
    app.fetchCardBalance();
}

function onCardSelected(event) {
    show('mainContent');
    if (activeLink) {
        activeLink.className = 'mdl-navigation__link';
    }

    var a = activeLink = event.target;
    var cardNumber = a.getAttribute('href').slice(1);
    var card = activeCard = cards[cardNumber];
    a.className = 'mdl-navigation__link mdl-navigation__link--current';

    app.insertCard(card);

    if (!card.isInitialized()) {
        show('initDiv');
        hide('cardInfo');
    } else {
        hide('initDiv');
        show('cardInfo');
    }
}

function addCardToAList(cardNumber) {
    var a = document.createElement('a');
    a.className = 'mdl-navigation__link';
    a.setAttribute('href', '#'+ cardNumber);
    a.addEventListener('click', onCardSelected);
    var txt = document.createTextNode(cardNumber);
    a.appendChild(txt);

    componentHandler.upgradeElement(a);
    $('cardsList').appendChild(a);

    cards[cardNumber] = new SftCard(blockChain, localStorage, cardNumber);
}

function createCard() {
    var num = generateRandomCardNumber();
    addCardToAList(num);

    if (!('cards' in localStorage) || localStorage.cards === '') {
        localStorage.cards = num;
        return;
    }
    localStorage.cards += ',' + num;
}

function generateRandomCardNumber() {
    var randomNum = Math.random().toString().slice(2);
    var num = '92331000';
    for (var i = 0; i<2; i++) {
        num += randomNum.substr(i*4, 4);
    }
    return num;
}

function initCards() {
    if (!localStorage.cards)
        return;

    var cards = localStorage.cards.split(',');
    cards.forEach(addCardToAList);
}

function onCardAdded(card) {
    showCardDetails(card);
    $('balance').innerHTML = 0;
}

function showCardDetails(card) {
    var address, url;
    address = card.getAddress();
    url = (app.isTestNet) ?  'https://test-insight.bitpay.com/address/' : 'https://insight.bitpay.com/address/';

    $('cardAddress').innerHTML = address;
    $('cardAddress').href = url + address;
    $('cardNumber').innerHTML = card.getCardNumber();
    $('qr').innerHTML = createQRCode(address);
}

function onCardInitialized(card) {
    hide('initDiv');
    show('cardInfo');
    onCardAdded(card);
}

function onBalanceReceived(balance) {
    $('balance').innerHTML = balance;
    show('txBtn');

    $('transferAmount').value = null;
    $('withdrawAmount').value = '0.002';
    $('toAddress').value = null;
    $('isBTC').checked = false;
}

function createQRCode(text) {
    var qr = qrcode(4, 'M');
    qr.addData(text);
    qr.make();
    return qr.createImgTag();
}

function createTransaction() {
    var amount = $('transferAmount').value;
    var toAddress = $('toAddress').value;

    console.log('Create transaction to '+ toAddress + ' amount: ' + amount);
    app.createTransaction(toAddress, amount);

    show('broadcastTxBtn');
}

function withdraw() {
    // var amountEUR = $('withdrawAmount').value;

    // app.withdraw(amountEUR);
}

function copyCardNumber() {
    var range = document.createRange();
    range.selectNode($('cardNumber'));
    window.getSelection().addRange(range);

    document.execCommand('copy');
    window.getSelection().removeAllRanges();
}

function selectAllBalance() {
    $('isBTC').parentNode.MaterialCheckbox.check();
    $('transferAmount').parentNode.MaterialTextfield.change(app.getBalance());
}

function broadcastTransaction() {
    app.broadcastCurrentTransaction();
}
