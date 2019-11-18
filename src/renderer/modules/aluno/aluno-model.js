function GetAlunoFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "MEC_TP_LOCALIZACAO": $("input[name='areaUrbana']:checked").val(), // int
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

function PopulateAlunoFromState(estadoAlunoJSON) {
    $(".pageTitle").html("Atualizar Aluno");
    $("#reglat").val(estadoAlunoJSON["LOC_LATITUDE"]);
    $("#reglon").val(estadoAlunoJSON["LOC_LONGITUDE"]);
    $("#regend").val(estadoAlunoJSON["LOC_ENDERECO"]);
    $("#regcep").val(estadoAlunoJSON["LOC_CEP"]);

    $("input[name='areaUrbana']").filter(`[value="${estadoAlunoJSON["MEC_TP_LOCALIZACAO"]}"]`).prop("checked", true);
    $("#temPorteira").prop("checked", estadoAlunoJSON["DA_PORTEIRA"]);
    $("#temMataBurro").prop("checked", estadoAlunoJSON["DA_MATABURRO"]);
    $("#temColchete").prop("checked", estadoAlunoJSON["DA_COLCHETE"]);
    $("#temAtoleiro").prop("checked", estadoAlunoJSON["DA_ATOLEIRO"]);
    $("#temPonte").prop("checked", estadoAlunoJSON["DA_PONTERUSTICA"]);

    $("#regnome").val(estadoAlunoJSON["NOME"]);
    $("#regcpf").val(estadoAlunoJSON["CPF"]);
    $("#regdata").val(estadoAlunoJSON["DATA_NASCIMENTO"]);
    $("#regnomeresp").val(estadoAlunoJSON["NOME_RESPONSAVEL"]);
    $("#regtelresp").val(estadoAlunoJSON["TELEFONE_RESPONSAVEL"]);
    $("#listareggrauresp").val(estadoAlunoJSON["GRAU_RESPONSAVEL"]);
    $("input[name='modoSexo']").val([estadoAlunoJSON["SEXO"]]);
    $("input[name='corAluno']").val([estadoAlunoJSON["COR"]]);
    $("#temDeCaminhar").prop("checked", estadoAlunoJSON["DEF_CAMINHAR"]);
    $("#temDeOuvir").prop("checked", estadoAlunoJSON["DEF_OUVIR"]);
    $("#temDeEnxergar").prop("checked", estadoAlunoJSON["DEF_ENXERGAR"]);
    $("#temDefMental").prop("checked", estadoAlunoJSON["DEF_MENTAL"]);

    $("input[name='turnoAluno']").val([estadoAlunoJSON["TURNO"]]);
    $("input[name='nivelAluno']").val([estadoAlunoJSON["NIVEL"]]);
    $("#listaescola").val(estadoAlunoJSON["ID_ESCOLA"]);
}

// Transformar linha do DB para JSON
var parseAlunoDB = function (alunoRaw) {
    var alunoJSON = Object.assign({}, alunoRaw);
    alunoJSON["ESCOLA"] = "Aluno sem escola";
    alunoJSON["ID_ESCOLA"] = 0;

    switch (alunoRaw["MEC_TP_LOCALIZACAO"]) {
        case 1:
            alunoJSON["LOCALIZACAO"] = "Urbana";
            break;
        case 2:
            alunoJSON["LOCALIZACAO"] = "Rural";
            break;
        default:
            alunoJSON["LOCALIZACAO"] = "Urbana";
    }

    switch (alunoRaw["TURNO"]) {
        case 1:
            alunoJSON["TURNOSTR"] = "Manhã";
            break;
        case 2:
            alunoJSON["TURNOSTR"] = "Tarde";
            break;
        case 3:
            alunoJSON["TURNOSTR"] = "Integral";
            break;
        case 4:
            alunoJSON["TURNOSTR"] = "Noturno";
            break;
        default:
            alunoJSON["TURNOSTR"] = "Manhã";
    }

    switch (alunoRaw["NIVEL"]) {
        case 1:
            alunoJSON["NIVELSTR"] = "Infantil (Creche)";
            break;
        case 2:
            alunoJSON["NIVELSTR"] = "Fundamental";
            break;
        case 3:
            alunoJSON["NIVELSTR"] = "Médio";
            break;
        case 4:
            alunoJSON["NIVELSTR"] = "Superior";
            break;
        case 5:
            alunoJSON["NIVELSTR"] = "Outro";
            break;
        default:
            alunoJSON["NIVELSTR"] = "Fundamental";
    }

    return alunoJSON;
};

function InserirAlunoPromise(alunoJSON) {
    return knex("Alunos").insert(alunoJSON);
}

function InserirAlunoEscolaPromise(alunoJSON) {
    return knex("Alunos").insert(alunoJSON);
}

function BuscarTodosAlunosPromise() {
    return knex("Alunos").select()
}

function BuscarTodosAlunos(callbackFn) {
    return BuscarTodosAlunosPromise()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        });
}

function ListarEscolasDeAlunosPromise() {
    return knex("Escolas")
          .join("EscolaTemAlunos", "Escolas.ID_ESCOLA", "=", "EscolaTemAlunos.ID_ESCOLA")
}

function ListarEscolasDeAlunos(callbackFn) {
    return ListarEscolasDeAlunosPromise()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        });
}

function RemoverAluno(idAluno, callbackFn) {
    knex("Alunos")
        .where("ID_ALUNO", idAluno)
        .del()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
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
            .finally(() => { });
    }
}

function AtualizarAluno(aluno) {
    knex('Aluno')
        .where('ID_ALUNO', '=', aluno.ID_ALUNO)
        .update(aluno).then(() => { SuccessAluno(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => { });
}

function DeleteAluno(row, id) {
    knex('Aluno')
        .where('ID_ALUNO', '=', id)
        .del().then(() => { DeleteRow(row); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => { });
}