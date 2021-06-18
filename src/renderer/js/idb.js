// INDENTIFICANDO MODULO COMPATIVEL COM NAVEGDOR ATUAL
window.indexedDB = window.indexedDB || 
                   window.mozIndexedDB || 
                   window.webkitIndexedDB ||
                   window.msIndexedDB;
indexedDB = window.indexedDB

// DEFINIÇÕES DATABASE
const NameDatabase = 'SeteElectron'; // NOME DO DATASET
const store_name = 'Map_Cache'; // table A SER CRIADA PARA ARMAZENAR AS INFORMAÇÕES
const table = 'Zoom_Lat_Long' // table A SER SALVA OS DADOS
const keyPath = 'qID'; // SE CASO DEFINIR UM KEYPATH MANUAL
const VersionDB = 1; // VERSÃO DO DATASET
const days_data_expires = 7; // TEMPO QUE OS DADOS EXPIRAM E DEVEM SEREM SUBSTITUIDOS

// ACESSANDO DE EXISTIR O BANCO DE DADOS, CASO NÃO O MESMO É CRIADO
let connection = indexedDB.open(NameDatabase, VersionDB),
    db, 
    value_request;

// OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
connection.onsuccess = function() {
    db = connection.result; // DEFINA ACESSO A bd
};

// CASO ACESSO GERE UM ERRO DEMOSTRE
connection.onerror = function(event) {
    console.log("Error: "+event.target.errorCode);
};

// This event is only implemented in recent browsers
connection.onupgradeneeded = function() {
    // Save the IDBDatabase interface
    db = connection.result;
  
    // Create an objectStore for this database
    var store = db.createObjectStore(store_name, {keyPath: keyPath, autoIncrement: true});
    var index = store.createIndex(table, table, {unique: true});
};

// RESPONSAVEL POR ESCREVER OS DADOS
async function dbremove(index) {

    var tx = db.transaction(store_name,"readwrite");
    var store = tx.objectStore(store_name);
    var requestRemove = await store.delete(index);

    requestRemove.onsuccess = function(event) {
        console.log('Data Removed!');
    };
    requestRemove.onerror = function(event) {
        console.log("Data Not Removed! (ERROR): "+event.target.errorCode);
    };

};

// RESPONSAVEL POR ESCREVER OS DADOS
async function dbwrite(note,mode=1) {

    var tx = db.transaction(store_name,"readwrite");

    // Faz algo após a inserção dos dados.
    tx.oncomplete = function(event) {
        console.log('Transaction OK!');
    };
    tx.onerror = function(event) {
        console.log('Transaction Not OK!: '+event.target.errorCode);
    };

    var store = tx.objectStore(store_name);
    note['expires_timestamp'] = Date.now() + days_data_expires*24*60*60*60*16 // TIMESTEMPO EQUIVALENTE A 1 DIA * X DIAS
    var requestSave;
    console.log('Note: ',note);
    // store.add(note) é store.put(note) Ambos Códigos adicionam ao banco de dados
    if (mode === 1) { // MODO 1 SO ADICIONA NOVO DADO AO BANCO DE DADOS
        requestSave = await store.add(note);
        requestSave.onsuccess = function(event) {
            console.log('Data Saved!');
        };
        requestSave.onerror = function(event) {
            console.log("Data Not Saved! (ERROR): "+event.target.errorCode);
        };
    } else if (mode === 2) { // MODO 2 ADICIONA OU ATUALIZA OS DADOS
        requestSave = await store.put(note);
        requestSave.onsuccess = function(event) {
            console.log('Data Saved!');
        };
        requestSave.onerror = function(event) {
            console.log("Data Not Saved! (ERROR): "+event.target.errorCode);
        };
    }
};

// RESPONSAVEL POR OBTER OS DADOS POR ID
function dbread_id(id) {
    //value_request = undefined;

    var tx = db.transaction(store_name, 'readonly');
    var store = tx.objectStore(store_name);
    var request = store.get(id);

    // Faz algo após a inserção dos dados.
    tx.oncomplete = function(event) {
        console.log('Transaction OK!');
    };
    tx.onerror = function(event) {
        console.log('Transaction Not OK!: '+event.target.errorCode);
    };
    
    // OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
    request.onsuccess = function() {
        value_request = request.result;
        // CASO O DADO PASSOU DA DATA DE VALIDADE O MESMO DEVE SER DESTRUIDO
        if (value_request !== undefined) {
            var time_now = Date.now();
            if (value_request.expires_timestamp <= time_now) {
                dbremove(id); // REMOVENDO O DADO
                value_request = undefined; // DEFININDO QUE O DADO NÃO EXISTE
                console.log('Dado Expirado!');
            }
        }
        //console.log(value_request);
    }; 
    // CASO ACESSO GERE UM ERRO VOLTE VALOR PARA NULL
    request.onerror = function(event) {
        console.log("Data Not Read Id! (ERROR): "+event.target.errorCode);
        value_request = undefined;
    };

    return value_request;
};

// RESPONSAVEL POR OBTER OS DADOS POR INDEX
function dbread_index(index_search) {
    //value_request = undefined;

    var tx = db.transaction(store_name, 'readonly');
    var store = tx.objectStore(store_name);
    var index = store.index(table);
    var request = index.get(index_search);

    // Faz algo após a inserção dos dados.
    tx.oncomplete = function(event) {
        console.log('Transaction OK!');
    };
    tx.onerror = function(event) {
        console.log('Transaction Not OK!: '+event.target.errorCode);
    };

    // OBTENDO FUNÇÕES DE MANUPULAÇÃO DO BANCO DE DADOS
    request.onsuccess = function() {
        value_request = request.result;
        // CASO O DADO PASSOU DA DATA DE VALIDADE O MESMO DEVE SER DESTRUIDO
        if (value_request !== undefined) {
            var time_now = Date.now();
            if (value_request.expires_timestamp <= time_now) {
                dbremove(value_request[keyPath]); // REMOVENDO O DADO
                value_request = undefined; // DEFININDO QUE O DADO NÃO EXISTE
                console.log('Dado Expirado!');
            }
        }
        //console.log(value_request);
    };
    // CASO ACESSO GERE UM ERRO VOLTE VALOR PARA NULL
    request.onerror = function(event) {
        console.log("Data Not Read index! (ERROR): "+event.target.errorCode);
        value_request = undefined;
    };
    
    return value_request;
};