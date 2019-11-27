var path = require("path");

// Google Firebase
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");

// Init Firebase
var dbconfig = {
    apiKey: "AIzaSyDOHCjGDkv-tsIjVhHxOcEt0rzusFJwQxc",
    authDomain: "softwareter.firebaseapp.com",
    databaseURL: "https://softwareter.firebaseio.com",
    projectId: "softwareter",
    storageBucket: "softwareter.appspot.com",
    messagingSenderId: "881352897273"
};
firebase.initializeApp(dbconfig);

// Base de dados Firestore
var remotedb = firebase.firestore();

var dbPath = path.join(__dirname, "..", "db", "local.db");
var knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true,
    pool: {
        afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb)
    }
});
knex.on( 'query', function( queryData ) {
    console.log( queryData );
});

var spatialite = require("spatialite");
var spatialiteDB = new spatialite.Database(dbPath);

// Dados da cidade
// FIXME: Parametrizar isso!
var cidadeLatitude = -16.8152409;
var cidadeLongitude = -49.2756642;
var codCidade = "5201405";
var codEstado = "52";
var minZoom = 15;

// Funções comuns do banco de dados
function InserirPromise(table, data) {
    return knex(table).insert(data);
}

function Inserir(table, data, cb) {
    InserirPromise(table, data)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

function AtualizarPromise(table, data, column, id) {
    return knex(table).where(column, '=', id).update(data);
}

function Atualizar(table, column, data, id, cb) {
    AtualizarPromise(table, column, data, id)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

function RemoverPromise(table, column, id) {
    return knex(table).where(column, "=", id).del();
}

function Remover(table, column, id, cb) {
    RemoverPromise(table, column, id)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

function BuscarTodosDadosPromise(table) {
    return knex.select('*').from(table);
}

function BuscarTodosDados(table, cb) {
    BuscarTodosDadosPromise(table)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

function BuscarDadoDiferentePromise(table, column, id) {
    return knex.select('*').where(column, '<>', id).from(table);
}

function BuscarDadoDiferente(table, column, id, cb) {
    BuscarDadoDiferentePromise(table, column, id)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

function BuscarDadoEspecificoPromise(table, column, id) {
    return knex.select('*').where(column, '=', id).from(table);
}

function BuscarDadoEspecifico(table, column, id, cb) {
    BuscarDadoEspecificoPromise(table, column, id)
    .then(res => cb(false, res))
    .catch(err => cb(err));
}

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