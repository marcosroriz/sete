// db_firebase.js
// Este arquivo implementa as funções do banco de dados utilizando o sqlite

// Calcula o caminho até o db
var dbPath = path.join(userDataDir, "db", "local.db");

// Inicia o knex
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

// Faz log das consultas do knex
knex.on('query', function (queryData) {
    console.log(queryData);
});

module.exports = {
    knex: knex,
    
    BuscarTodosDadosPromise: (tabela) => {
        return knex.select('*').from(tabela);
    },

    BuscarDadosEspecificosPromise: (tabela, coluna, valor, operador = "==") => {
        return knex.select('*').where(coluna, '=', valor).from(tabela);
    },

    InserirPromise: (tabela, dado) => {
        return knex(tabela).insert(dado);
    }
}
