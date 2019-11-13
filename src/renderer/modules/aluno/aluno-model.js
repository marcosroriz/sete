function GetAlunoFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "DA_PORTEIRA": $("#temPorteira").is(":checked"), // bool
        "DA_MATABURRO": $("#temMataBurro").is(":checked"), // bool
        "DA_COLCHETE": $("#temColchete").is(":checked"), // bool
        "DA_ATOLEIRO": $("#temAtoleiro").is(":checked"), // bool
        "DA_PONTERUSTICA": $("#temPonte").is(":checked"), // bool
        
        "NOME": $("#regnome").val(), // string
        "CPF": $("#regcpf").val(), // number
        "DATA_NASCIMENTO": $("#regdata").val(), // string
        "NOME_RESPONSAVEL": $("#regnomeresp").val(), // string
        "TELEFONE_RESPONSAVEL": $("#regtelresp").val(), // string
        "GRAU_RESPONSAVEL": $("#listareggrauresp").val(),
        "SEXO": $("input[name='modoSexo']:checked").val(), // int
        "COR": $("input[name='corAluno']:checked").val(), // int
        "DEF_CAMINHAR": $("#temDeCaminhar").is(":checked"), // bool
        "DEF_OUVIR": $("#temDeOuvir").is(":checked"), // bool
        "DEF_ENXERGAR": $("#temDeEnxergar").is(":checked"), // bool
        "DEF_MENTAL": $("#temDefMental").is(":checked"), // bool

        "TURNO": $("input[name='turnoAluno']:checked").val(), // int
        "NIVEL": $("input[name='nivelAluno']:checked").val(), // int
    };
}

function InserirAlunoPromise(alunoJSON) {
    return knex("Alunos").insert(alunoJSON);
}

function InserirAlunoEscolaPromise(alunoJSON) {
    return knex("Alunos").insert(alunoJSON);
}

function GetAlunoForm() {
    return {
        "ID_ALUNO": _aluno.ID_ALUNO, //int primary key
        "LATITUDE": $("#reglat").val(), //real
        "LONGITUDE": $("#reglon").val(), //real
        "ENDERECO": $("#regend").val(), //string
        "CEP": $("#regcep").val(), //int
        "DA_PORTEIRA": $("#temPorteira").is(":checked"), //bool
        "DA_MATABURRO": $("#temMataBurro").is(":checked"), //bool
        "DA_COLCHETE": $("#temColchete").is(":checked"), //bool
        "DA_ATOLEIRO": $("#temAtoleiro").is(":checked"), //bool
        "DA_PONTERUSTICA": $("#temPonte").is(":checked"), //bool
        "NOME": $("#regnome").val(), //string
        "DATA_NASCIMENTO": $("#regdata").val(), //string
        "SEXO": $("input[name=sexo]:checked").val(), //int
        "COR": $("input[name=cor]:checked").val(), //$("#regemail").val(), //int
        "NOME_RESPONSAVEL": $("#regnomeresp").val(), //string
        "GRAU_RESPONSAVEL": $("#reggrau").val(), //int
        "TELEFONE RESPONSÁVEL": $("#regfoneresponsavel").val(), //int
        "DEF_CAMINHAR": $("#temDeCaminhar").is(":checked"), //bool
        "DEF_OUVIR": $("#temDeOuvir").is(":checked"), //bool
        "DEF_ENXERGAR": $("#temDeEnxergar").is(":checked"), //bool
        "DEF_MENTAL": $("#temDeMentalIntelec").is(":checked"), //bool
        "ID_ESCOLA": $("#regescola").val(), //int
        "TURNO": $("input[name=turno]:checked").val(), //int
        "NIVEL": $("input[name=nivel]:checked").val() //int
    };
}


function ObterAlunos() {
    return knex.select('*').from('Aluno');
}

function ObterAluno(id) {
    return knex.select('*').from('Aluno').where('ID_ALUNO', '=', id);
}

function InserirAluno(aluno) {
    if (aluno.ID_ALUNO > 0)
        AtualizarAluno(aluno);
    else {
        aluno.ID_ALUNO = undefined;
        const alunos = [aluno];
        knex('Aluno').insert(alunos).then(() => { SuccessAluno(); })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }
}

function AtualizarAluno(aluno) {
    knex('Aluno')
        .where('ID_ALUNO', '=', aluno.ID_ALUNO)
        .update(aluno).then(() => { SuccessAluno(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteAluno(row, id) {
    knex('Aluno')
        .where('ID_ALUNO', '=', id)
        .del().then(() => { DeleteRow(row); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}