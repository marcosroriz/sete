// Bibliotecas Básicas
window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');
require("jquery-validation");
require("jquery-mask-plugin");
require("sweetalert");

// Arquivo de configuração local
const Store = require('electron-store');
const userconfig = new Store();

// Google Firebase
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
require('firebase/firestore');

// Init Firebase
let dbconfig = {
    apiKey: "AIzaSyDOHCjGDkv-tsIjVhHxOcEt0rzusFJwQxc",
    authDomain: "softwareter.firebaseapp.com",
    databaseURL: "https://softwareter.firebaseio.com",
    projectId: "softwareter",
    storageBucket: "softwareter.appspot.com",
    messagingSenderId: "881352897273"
};
firebase.initializeApp(dbconfig);

// Base de dados Firestore
let database = firebase.firestore();