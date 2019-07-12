function GetMotoristaForm() {
    return {
        "ID_MOTORISTA": $("#").val(), //int primarykey
        "LATITUDE": $("#").val(), //real
        "LONGITUDE": $("#").val(), //real
        "NOME": $("#").val(), //string
        "DATA_NASCIMENTO": $("#").val(), //string
        "SEXO": $("#").val(), //int
        "NACIONALIDADE": $("#").val(), //string
        "DOC_IDENTIFICACAO": $("#").val(), //int
        "ORGAO_EMISSOR": $("#").val(), //string
        "CPF": $("#").val(), //int
        "COR": $("#").val(), //int
        "DEF_CAMINHAR": $("#").val(), //bool
        "DEF_OUVIR": $("#").val(), //bool
        "DEF_ENXERGAR": $("#").val(), //bool
        "DEF_MENTAL": $("#").val(), //bool
        "AT_CRIMINAL": $("#").val() //BLOB
    };
}


function ObterMotoristas() {
    knex.select('*').from('Mototista').then((rows) => {
            if (rows.length > 0) {
                rows.forEach(c => {
                    console.log(c);
                });
            } else
                console.log("não à registro");

        }).catch((err) => { console.log(err); throw err })
        .finally(() => {
            //knex.destroy();
        });
}

function InserirMotorista() {
    const mototistas = [GetMototistaForm()];
    console.log(mototistas);
    knex('mototista').insert(mototistas).then(() => console.log("Inserido!"))
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            //knex.destroy();
        });
}

function AtualizarMotorista() {
    const mototista = GetMototistaForm();
    console.log(mototista);
    knex('mototista')
        .where('id', '=', "1")
        .update(motorista).then(() => console.log("Atualizado!"))
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            //knex.destroy();
        });
}

function DeleteMotorista() {

}
s