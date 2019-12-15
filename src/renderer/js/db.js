var path = require("path");

// Google Firebase
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

// Usuário do Firebase
var firebaseUser;

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
knex.on('query', function (queryData) {
    console.log(queryData);
});

// Sync data with Firestore
function fbSync() {
    Swal2.fire({
        title: "Sincronizando os dados com a nuvem...",
        text: "Espere um minutinho...",
        imageUrl: "img/icones/processing.gif",
        icon: "img/icones/processing.gif",
        buttons: false,
        showSpinner: true,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    var dbs = ["alunos", "escolatemalunos", "escolas", "faztransporte", "fornecedores",
        "garagem", "garagemtemveiculo", "motoristas", "municipios", "ordemdeservico",
        "rotaatendealuno", "rotadirigidapormotorista", "rotapassaporescolas", "rotapossuiveiculo",
        "rotas", "veiculos"]

    var localPromisesArray = new Array();
    dbs.forEach((db) => localPromisesArray.push(BuscarTodosDadosPromise(db)));

    Promise.all(localPromisesArray)
        .then((res) => {
            var updateObj = {};
            for (let i = 0; i < res.length; i++) {
                updateObj[dbs[i]] = res[i];
            }

            remotedb.collection("data").doc(firebaseUser.uid).set(updateObj, { merge: true })
                .then(() => {
                    Swal2.fire({
                        title: "Sucesso!",
                        text: "Dados sincronizados com sucesso. Clique em OK para voltar ao painel de gestão.",
                        icon: "success",
                        type: "success",
                        showConfirmButton: true,
                        closeOnClickOutside: true,
                        allowOutsideClick: false,
                    })
                });
        });
}

// Dados da cidade
var cidadeLatitude = -16.8152409;
var cidadeLongitude = -49.2756642;
var codCidade = userconfig.get("COD_CIDADE");
var codEstado = userconfig.get("COD_ESTADO");
var minZoom = 15;

knex("IBGE_Municipios")
    .select()
    .where("codigo_ibge", userconfig.get("COD_CIDADE"))
    .then(res => {
        cidadeLatitude = res[0]["latitude"];
        cidadeLongitude = res[0]["longitude"];

    });

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

function RemoverComposedPromise(table, c1, id1, c2, id2) {
    return knex(table).where(c1, id1).andWhere(c2, id2).del();
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