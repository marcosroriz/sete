function GetMotoristaForm() {
    return {
        "ID_MOTORISTA": _motorista.ID_MOTORISTA, //int primarykey
        //"LATITUDE": $("#LATITUDE").val(), //real
        //"LONGITUDE": $("#").val(), //real
        "NOME": $("#NOME").val(), //string
        "DATA_NASCIMENTO": $("#DATA_NASCIMENTO").val(), //string
        "NACIONALIDADE": $("#NACIONALIDADE").val(), //string
        "DOC_IDENTIFICACAO": $("#DOC_IDENTIFICACAO").val(), //int
        "ORGAO_EMISSOR": $("#ORGAO_EMISSOR").val(), //string
        "CPF": $("#CPF").val(), //int
        "SEXO": $("input[name=sexo]:checked").val(), //int
        "COR": $("input[name=cor]:checked").val(), //$("#regemail").val(), //int
        "DEF_CAMINHAR": $("#DEF_CAMINHAR").is(":checked"), //bool
        "DEF_OUVIR": $("#DEF_OUVIR").is(":checked"), //bool
        "DEF_ENXERGAR": $("#DEF_ENXERGAR").is(":checked"), //bool
        "DEF_MENTAL": $("#DEF_MENTAL").is(":checked"), //bool
        //"AT_CRIMINAL": $("#").val() //BLOB
    };
}

function ObterMotoristas() {
    return knex.select('*').from('Motorista');
}

function ObterMotorista(id) {
    return knex.select('*').from('Motorista').where('ID_MOTORISTA', '=', id);
}

function InserirMotorista(motorista) {
    console.log(motorista);
    if (motorista.ID_MOTORISTA > 0)
        AtualizarMotorista(motorista);
    else {
        motorista.ID_MOTORISTA = undefined;
        const motoristas = [motorista];
        knex('Motorista').insert(motoristas).then(() => { SuccessMotorista(); })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }
}

function AtualizarMotorista(motorista) {
    knex('Motorista')
        .where('ID_MOTORISTA', '=', motorista.ID_MOTORISTA)
        .update(motorista).then(() => { SuccessMotorista(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteMotorista(row, id) {
    knex('Motorista')
        .where('ID_MOTORISTA', '=', id)
        .del().then(() => { DeleteRow(row); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}