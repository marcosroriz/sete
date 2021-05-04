// INDENTIFICANDO MODULO COMPATIVEL COM NAVEGDOR ATUAL
window.indexedDB = window.indexedDB || 
                   window.mozIndexedDB || 
                   window.webkitIndexedDB ||
                   window.msIndexedDB;

// DEFINIÇÕES DATABASE
let NameDatabase = 'SeteElectron'; // NOME DO DATASET
let tabela = 'Personal_Notes'; // TABELA A SER CRIADA PARA ARMAZENAR AS INFORMAÇÕES
let NameIndexDatabase = 'Zoom_Lat_Long'; // NO NOME NÃO ACEITA - /
let VersionDB = 1; // VERSÃO DO DATASET

// ACESSANDO DE EXISTIR O BANCO DE DADOS, CASO NÃO O MESMO É CRIADO
let request = window.indexedDB.open(NameDatabase,VersionDB),
    db,
    tx,
    store,
    index,
    value_request;

// OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
request.onsuccess = function(event) {
    db = event.target.result; // DEFINA ACESSO A bd
};

// CASO ACESSO GERE UM ERRO DEMOSTRE
request.onerror = function(event) {
    console.log("Error: "+event.target.errorCode);
};

// This event is only implemented in recent browsers
request.onupgradeneeded = function(event) {
    // Save the IDBDatabase interface
    db = event.target.result;
  
    // Create an objectStore for this database
    // store = db.createObjectStore(tabela, {keyPath: "qID"});
    tabela_ = db.createObjectStore(tabela, {autoIncrement: true});
    index_ = tabela_.createIndex(NameIndexDatabase, NameIndexDatabase, {unique: false});
};

// RESPONSAVEL POR ESCREVER OS DADOS
async function dbwrite(note) {

    tx = db.transaction(tabela,"readwrite");
    store = tx.objectStore(tabela);
    
    try {
        // store.add(note) é store.put(note) Ambos Códigos adicionam ao banco de dados
        await store.add(note);
    } catch (e) {
        console.log(e);
        return null;
    };
};

// FUNÇÃO PARA FAZER REQUISIÇÃO COM PROMISSE PARA VOLTAR VALORES CORRETAMENTE
function aux_result(modo,value) {

    tx = db.transaction(tabela,"readonly");
    store = tx.objectStore(tabela);
    index = store.index(NameIndexDatabase);

    if (modo == 1) { // MODO 1 É POR ID
        try {
            return store.get(value);
        } catch (e) {
            console.log(e);
            return null;
        };
    } else if (modo == 2) { // MODO 2 É POR INDEX STRING
        try {
            return index.get(value);
        } catch (e) {
            console.log(e);
            return null;
        };
    };
};

// RESPONSAVEL POR OBTER OS DADOS POR ID
function dbread_id(id) {

    const result = aux_result(1,id);

    // OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
    result.onsuccess = function(event) {
        value_request = event.target.result;
    };

    // CASO ACESSO GERE UM ERRO VOLTE VALOR PARA NULL
    result.onerror = function(event) {
        console.log("Error: "+event.target.errorCode);
        value_request = null;
    };

    return value_request;
};

// RESPONSAVEL POR OBTER OS DADOS POR INDEX
function dbread_index(index_) {

    const result = aux_result(2,index_)

    // OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
    result.onsuccess = function(event) {
        value_request = event.target.result;
    };

    // CASO ACESSO GERE UM ERRO VOLTE VALOR PARA NULL
    result.onerror = function(event) {
        value_request = null;
    };

    return value_request;

};