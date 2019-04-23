const path = require("path");

// Google Firebase
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");

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
let remotedb = firebase.firestore();

// Base de dados Local (sqlite)
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: path.join(__dirname, "db", "local.db"),
    },
    useNullAsDefault: true
});

const bookshelf = require('bookshelf')(knex);

const Users = bookshelf.Model.extend(
    {
        tableName: "Usuarios",
        idAttribute: "ID"
    });

const Escolas = bookshelf.Model.extend(
    {
        tableName: "Escolas",
        idAttribute: "ID_ESCOLA"
    },
    {
        comTransporte: function () {
            return this.forge().query({ where: { TEM_TRANSPORTE: 1 } }).fetch();
        },
        ativas: function () {
            return this.forge().query({ where: { ATIVA: 1 } }).fetch();
        }
    }
);