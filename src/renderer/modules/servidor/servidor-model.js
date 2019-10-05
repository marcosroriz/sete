function GetServidorForm() {
    return {
        "ID_SERVIDOR": _servidor.ID_SERVIDOR, //int primary key autoincrement
        "LATITUDE": $("#LATITUDE").val(), //real
        "LONGITUDE": $("#LONGITUDE").val(), //real
        "ENDERECO": $("#ENDERECO").val(), //text
        "CEP": $("#CEP").val(), //int
        "NOME": $("#NOME").val(), //text
        "DATA_NASCIMENTO": $("#DATA_NASCIMENTO").val(), //text
        "SEXO": $("#SEXO").val(), //int
        "TELEFONE": $("#TELEFONE").val(), //int
        "TURNO": $("#TURNO").val() //int
    };
}

function ObterServidores() {
    return knex.select('*').from('Servidor');
}

function ObterServidor(id) {
    return knex.select('*').where('ID_SERVIDOR', '=', id).from('Servidor');
}

function InserirServidor(data) {

    if (data.ID_SERVIDOR > 0)
        AtualizarServidor(data);
    else {
        data.ID_SERVIDOR = undefined;
        const servidor = [data];
        knex('Servidor').insert(servidor).then(() => { SuccessServidor(); })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }
}

function AtualizarServidor(servidor) {
    knex('Servidor')
        .where('ID_SERVIDOR', '=', servidor.ID_SERVIDOR)
        .update(servidor).then(() => { SuccessServidor(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteServidor(row, id) {
    knex('Servidor')
        .where('ID_SERVIDOR', '=', id)
        .del().then(() => {
            DeleteRow(row);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}