// db.js
// Este arquivo centraliza as chamadas ao banco de dados, permitindo assim
// utilizar diferentes implementações. Atualmente, suportamos as seguintes
// base de dados: SQLite (local) e Firebase (remota)


////////////////////////////////////////////////////////////////////////////////
// INIT FIREBASE 
////////////////////////////////////////////////////////////////////////////////

// Carrega a implementação do banco no Firebase
var firebaseImpl = require("./js/db_firebase.js");

// Usuário do Firebase (começa como vazio)
var firebaseUser = null;

// Instancia o banco Firebase
var remotedb = firebase.firestore();

////////////////////////////////////////////////////////////////////////////////
// END FIREBASE 
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// INIT SQLITE /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Carrega a implementação do banco no SQLite
var sqliteImpl = require("./js/db_sqlite.js");

////////////////////////////////////////////////////////////////////////////////
// END SQLITE //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// Variável que controla a implementação a ser utilizada, por padrão é o Firebase
var dbImpl = firebaseImpl;


////////////////////////////////////////////////////////////////////////////////
// FUNÇÕES DE CONSULTA
////////////////////////////////////////////////////////////////////////////////

// Funções comuns do banco de dados
function InserirPromise(colecao, dado, id = "", merge = false) {
    return dbImpl.InserirPromise(colecao, dado, id, merge);
}

function BuscarTodosDadosPromise(colecao) {
    return dbImpl.BuscarDadosEspecificos(colecao);
}

function BuscarDadosEspecificosPromise(colecao, coluna, valor, operador = "==") {
    return dbImpl.BuscarDadosEspecificosPromise(colecao, coluna, valor, operador);
}


// Clear database
function clearDBPromises() {
    var dbs = ["alunos", "escolas", "escolatemalunos", "fornecedores", "faztransporte",
        "garagem", "garagemtemveiculo", "motoristas", "municipios", "ordemdeservico",
        "rotas", "rotaatendealuno", "rotadirigidapormotorista", "rotapassaporescolas",
        "rotapossuiveiculo", "veiculos"]

    var clearPromises = new Array();
    for (let i = 0; i < dbs.length; i++) {
        clearPromises.push(knex(dbs[i]).del());
    }

    return clearPromises;
}

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

if (codCidade != null) {
    knex("IBGE_Municipios")
        .select()
        .where("codigo_ibge", userconfig.get("COD_CIDADE"))
        .then(res => {
            cidadeLatitude = res[0]["latitude"];
            cidadeLongitude = res[0]["longitude"];

        });
}

// Funções comuns do banco de dados
function InserirPromise(table, data) {
    return knex(table).insert(data);
}

function Inserir(table, data, cb) {
    InserirPromise(table, data)
        .then(res => cb(false, res))
        .catch(err => cb(err));
}

function InserirIgnorarConflitoPromise(table, data) {
    return knex.raw(
        knex(table)
            .insert(data)
            .toString()
            .replace('insert', 'INSERT OR IGNORE')
    );
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