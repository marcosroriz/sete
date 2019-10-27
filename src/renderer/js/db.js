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

const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: path.join(__dirname, "..", "db", "local.db"),
    },
    useNullAsDefault: true,
    pool: {
        afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb)
    }
});

// Dados da cidade
// FIXME: Parametrizar isso!
var cidadeLatitude = -16.8152409;
var cidadeLongitude = -49.2756642;
var codCidade = "5201405";
var codEstado = "52";


const bookshelf = require("bookshelf")(knex);

const Users = bookshelf.Model.extend(
    {
        tableName: "Usuarios",
        idAttribute: "ID"
    });

const Municipios = bookshelf.Model.extend(
    {
        tableName: "Municipios",
        usuario: function () {
            return this.hasOne(Users);
        }
    });

const FazTransporte = bookshelf.Model.extend(
    {
        tableName: "FazTransporte"
    },
    {
        cidades: function (cod_cidade_origem) {
            return this.forge().query({ where: { COD_CIDADE_ORIGEM: cod_cidade_origem } }).fetch();
        }
    })

const ColecaoFazTransporte = bookshelf.Collection.extend(
    {
        model: FazTransporte
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