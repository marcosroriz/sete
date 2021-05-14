function GetEscolaFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "MEC_CO_UF": parseInt($("#regestado").val()), // int
        "MEC_CO_MUNICIPIO": parseInt($("#regcidade").val()), // int
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "MEC_TP_LOCALIZACAO": parseInt($("input[name='areaUrbana']:checked").val()), // int
        "MEC_TP_LOCALIZACAO_DIFERENCIADA": parseInt($("input[name='locDif']:checked").val()), // int
        "NOME": $("#nomeEscola").val(), // string
        "MEC_NO_ENTIDADE": $("#nomeEscola").val(), // string
        "CONTATO_RESPONSAVEL": $("#nomeContato").val(), // string
        "CONTATO_TELEFONE": $("#telContato").val(), // string
        "CONTATO_EMAIL": $("#emailContato").val(), // string
        "MEC_TP_DEPENDENCIA": parseInt($("input[name='tipoDependencia']:checked").val()), // int
        "MEC_IN_REGULAR": $("#temEnsinoRegular").is(":checked"), // bool
        "MEC_IN_EJA": $("#temEnsinoEJA").is(":checked"), // bool
        "MEC_IN_PROFISSIONALIZANTE": $("#temEnsinoProf").is(":checked"), // bool
        "ENSINO_PRE_ESCOLA": $("#temEnsinoInfantil").is(":checked"), // bool
        "ENSINO_FUNDAMENTAL": $("#temEnsinoFundamental").is(":checked"), // bool
        "ENSINO_MEDIO": $("#temEnsinoMedio").is(":checked"), // bool
        "ENSINO_SUPERIOR": $("#temEnsinoUniversitario").is(":checked"), // bool
        "HORARIO_MATUTINO": $("#temHorarioManha").is(":checked"), // bool
        "HORARIO_VESPERTINO": $("#temHorarioTarde").is(":checked"), // bool
        "HORARIO_NOTURNO": $("#temHorarioNoite").is(":checked"), // bool
    };
}

function PopulateEscolaFromState(estadoEscolaJSON) {
    $(".pageTitle").html("Atualizar Escola");
    $("#reglat").val(estadoEscolaJSON["LOC_LATITUDE"]);
    $("#reglon").val(estadoEscolaJSON["LOC_LONGITUDE"]);
    $("#regestado").val(estadoEscolaJSON["MEC_CO_UF"]);
    $("#regestado").trigger("change");
    $("#regcidade").val(estadoEscolaJSON["MEC_CO_MUNICIPIO"]);
    $("#regcidade").trigger("change");
    $("#regend").val(estadoEscolaJSON["LOC_ENDERECO"]);
    $("#regcep").val(estadoEscolaJSON["LOC_CEP"]);
    $("input[name='areaUrbana']").filter(`[value="${estadoEscolaJSON["MEC_TP_LOCALIZACAO"]}"]`).prop("checked", true);
    $("input[name='locDif']").filter(`[value="${estadoEscolaJSON["MEC_TP_LOCALIZACAO_DIFERENCIADA"]}"]`).prop("checked", true);

    $("#nomeEscola").val(estadoEscolaJSON["MEC_NO_ENTIDADE"]);
    $("#nomeContato").val(estadoEscolaJSON["CONTATO_RESPONSAVEL"]);
    $("#telContato").val(estadoEscolaJSON["CONTATO_TELEFONE"]);
    $("#emailContato").val(estadoEscolaJSON["CONTATO_EMAIL"]);
    $("input[name='tipoDependencia']").filter(`[value="${estadoEscolaJSON["MEC_TP_DEPENDENCIA"]}"]`).prop("checked", true);

    $("#temEnsinoRegular").prop("checked", estadoEscolaJSON["MEC_IN_REGULAR"]);
    $("#temEnsinoEJA").prop("checked", estadoEscolaJSON["MEC_IN_EJA"]);
    $("#temEnsinoProf").prop("checked", estadoEscolaJSON["MEC_IN_PROFISSIONALIZANTE"]);
    $("#temEnsinoFundamental").prop("checked", estadoEscolaJSON["ENSINO_FUNDAMENTAL"]);
    $("#temEnsinoFundamental").prop("checked", estadoEscolaJSON["ENSINO_PRE_ESCOLA"]);
    $("#temEnsinoMedio").prop("checked", estadoEscolaJSON["ENSINO_MEDIO"]);
    $("#temEnsinoUniversitario").prop("checked", estadoEscolaJSON["MEC_IN_PROFIENSINO_SUPERIORSSIONALIZANTE"]);
    $("#temHorarioManha").prop("checked", estadoEscolaJSON["HORARIO_MATUTINO"]);
    $("#temHorarioTarde").prop("checked", estadoEscolaJSON["HORARIO_VESPERTINO"]);
    $("#temHorarioNoite").prop("checked", estadoEscolaJSON["HORARIO_NOTURNO"]);
}

// Transformar linha do DB para JSON
var parseEscolaDB = function (escolaRaw) {
    var escolaJSON = Object.assign({}, escolaRaw);
    escolaJSON["NOME"] = escolaJSON["NOME"];

    if (escolaRaw["LOC_LONGITUDE"] != "" && escolaRaw["LOC_LONGITUDE"] != undefined &&
        escolaRaw["LOC_LATITUDE"] != "" && escolaRaw["LOC_LATITUDE"] != undefined) {
        escolaJSON["GEOREF"] = "Sim";
    } else {
        escolaJSON["GEOREF"] = "Não";
    }

    switch (escolaRaw["MEC_TP_LOCALIZACAO"]) {
        case 1:
            escolaJSON["LOCALIZACAO"] = "Urbana";
            break;
        case 2:
            escolaJSON["LOCALIZACAO"] = "Rural";
            break;
        default:
            escolaJSON["LOCALIZACAO"] = "Urbana";
    }

    switch (escolaRaw["TP_DEPENDENCIA"]) {
        case 1:
            escolaJSON["DEPENDENCIA"] = "Federal";
            break;
        case 2:
            escolaJSON["DEPENDENCIA"] = "Estadual";
            break;
        case 3:
            escolaJSON["DEPENDENCIA"] = "Municipal";
            break;
        case 4:
            escolaJSON["DEPENDENCIA"] = "Privada";
            break;
        default:
            escolaJSON["DEPENDENCIA"] = "Municipal";
    }

    var tipoEnsino = new Array();
    if (escolaRaw["ENSINO_PRE_ESCOLA"]) tipoEnsino.push("Infantil")
    if (escolaRaw["ENSINO_FUNDAMENTAL"]) tipoEnsino.push("Fundamental");
    if (escolaRaw["ENSINO_MEDIO"]) tipoEnsino.push("Médio");
    if (escolaRaw["ENSINO_SUPERIOR"]) tipoEnsino.push("Superior");
    escolaJSON["ENSINO"] = tipoEnsino.join(", ");

    var horarioEnsino = new Array();
    if (escolaRaw["HORARIO_MATUTINO"]) horarioEnsino.push("Manhã");
    if (escolaRaw["HORARIO_VESPERTINO"]) horarioEnsino.push("Tarde");
    if (escolaRaw["HORARIO_NOTURNO"]) horarioEnsino.push("Noite");

    if (horarioEnsino != 0)
        escolaJSON["HORARIO"] = horarioEnsino.join(", ");
    else
        escolaJSON["HORARIO"] = "Não informado"

    var regimeEnsino = new Array();
    if (escolaRaw["MEC_IN_REGULAR"]) regimeEnsino.push("Regular");
    if (escolaRaw["MEC_IN_EJA"]) regimeEnsino.push("EJA");
    if (escolaRaw["MEC_IN_PROFISSIONALIZANTE"]) regimeEnsino.push("Profissionalizante");
    escolaJSON["REGIME"] = regimeEnsino.join(", ");


    escolaJSON["NUM_ALUNOS"] = 0;

    return escolaJSON;
};


// Transformar linha do DB para JSON
var parseEscolaMECDB = function (escolaRaw) {
    var escolaJSON = {}; // Object.assign({}, escolaRaw);
    escolaJSON["NOME"] = escolaRaw["NO_ENTIDADE"];
    escolaJSON["MEC_NO_ENTIDADE"] = escolaRaw["NO_ENTIDADE"];
    escolaJSON["ID_ESCOLA"] = Number(escolaRaw["CO_ENTIDADE"]);
    escolaJSON["MEC_CO_ENTIDADE"] = Number(escolaRaw["CO_ENTIDADE"]);
    escolaJSON["MEC_CO_UF"] = Number(escolaRaw["CO_UF"]);
    escolaJSON["MEC_CO_MUNICIPIO"] = Number(escolaRaw["CO_MUNICIPIO"]);
    escolaJSON["MEC_TP_LOCALIZACAO"] = Number(escolaRaw["TP_LOCALIZACAO"]);
    
    switch (Number(escolaRaw["TP_LOCALIZACAO"])) {
        case 1:
            escolaJSON["LOCALIZACAO"] = "Urbana";
            break;
        case 2:
            escolaJSON["LOCALIZACAO"] = "Rural";
            break;
        default:
            escolaJSON["LOCALIZACAO"] = "Urbana";
    }

    escolaJSON["MEC_TP_DEPENDENCIA"] = Number(escolaRaw["TP_DEPENDENCIA"]);
    switch (Number(escolaRaw["TP_DEPENDENCIA"])) {
        case 1:
            escolaJSON["DEPENDENCIA"] = "Federal";
            break;
        case 2:
            escolaJSON["DEPENDENCIA"] = "Estadual";
            break;
        case 3:
            escolaJSON["DEPENDENCIA"] = "Municipal";
            break;
        case 4:
            escolaJSON["DEPENDENCIA"] = "Privada";
            break;
        default:
            escolaJSON["DEPENDENCIA"] = "Municipal";
    }

    var tipoEnsino = new Array();
    if (Boolean(Number(escolaRaw["IN_COMUM_CRECHE"])) ||
        Boolean(Number(escolaRaw["IN_COMUM_PRE"]))) {
        tipoEnsino.push("Pré-escola");
        escolaJSON["ENSINO_PRE_ESCOLA"] = true;
    } else {
        escolaJSON["ENSINO_PRE_ESCOLA"] = false;
    }

    if (Boolean(Number(escolaRaw["IN_COMUM_FUND_AI"])) ||
        Boolean(Number(escolaRaw["IN_COMUM_FUND_AF"]))) {
        tipoEnsino.push("Fundamental");
        escolaJSON["ENSINO_FUNDAMENTAL"] = true;
    } else {
        escolaJSON["ENSINO_FUNDAMENTAL"] = false;
    }

    if (Boolean(Number(escolaRaw["IN_COMUM_MEDIO_MEDIO"])) ||
        Boolean(Number(escolaRaw["IN_COMUM_MEDIO_INTEGRADO"])) ||
        Boolean(Number(escolaRaw["IN_COMUM_MEDIO_INTEGRADO"])) ||
        Boolean(Number(escolaRaw["IN_COMUM_MEDIO_NORMAL"]))) {
        tipoEnsino.push("Médio");
        escolaJSON["ENSINO_MEDIO"] = true;
    } else {
        escolaJSON["ENSINO_MEDIO"] = false;
    }
    escolaJSON["ENSINO"] = tipoEnsino.join(", ");

    var regimeEnsino = new Array();
    escolaJSON["MEC_IN_REGULAR"] = Boolean(Number(escolaRaw["IN_REGULAR"]))
    if (escolaJSON["MEC_IN_REGULAR"]) regimeEnsino.push("Regular")

    escolaJSON["MEC_IN_EJA"] = Boolean(Number(escolaRaw["IN_EJA"]))
    if (escolaJSON["MEC_IN_EJA"]) regimeEnsino.push("EJA");

    escolaJSON["MEC_IN_PROFISSIONALIZANTE"] = Boolean(Number(escolaRaw["IN_PROFISSIONALIZANTE"]))
    if (escolaJSON["MEC_IN_PROFISSIONALIZANTE"]) regimeEnsino.push("Profissionalizante");

    escolaJSON["REGIME"] = regimeEnsino.join(", ");
    return escolaJSON;
};


function InserirEscola(escolaJSON, onSaveCallBack) {
    knex("Escolas")
        .insert(escolaJSON)
        .then((res) => {
            onSaveCallBack(false, res);
        })
        .catch((err) => {
            onSaveCallBack(err);
        });
}

function AtualizarEscola(idEscola, escolaJSON, onSaveCallBack) {
    knex("Escolas")
        .where('ID_ESCOLA', '=', idEscola)
        .update(escolaJSON)
        .then((res) => {
            onSaveCallBack(false, res);
        })
        .catch((err) => {
            onSaveCallBack(err);
        });
}

function BuscarTodasEscolas(callbackFn) {
    knex("Escolas")
        .select()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        });
}

function NumeroDeAlunosEscolas(callbackFn) {
    knex("EscolaTemAlunos")
        .select("ID_ESCOLA")
        .count("ID_ALUNO as NUM_ALUNOS")
        .groupBy("ID_ESCOLA")
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
}

function ListaDeAlunosPorEscola(idEscola, callbackFn) {
    knex("Alunos")
        .join("EscolaTemAlunos", "Alunos.ID_ALUNO", "=", "EscolaTemAlunos.ID_ALUNO")
        .where("EscolaTemAlunos.ID_ESCOLA", idEscola)
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
}

function ListaDeAlunosNaoAtendidosPorEscola(idEscola, callbackFn) {
    knex("Alunos")
        .select("Alunos.ID_ALUNO", "Alunos.NOME", "Alunos.DATA_NASCIMENTO", "EscolaTemAlunos.ID_ESCOLA")
        .leftJoin("EscolaTemAlunos", "Alunos.ID_ALUNO", "=", "EscolaTemAlunos.ID_ALUNO")
        .where("EscolaTemAlunos.ID_ESCOLA", "<>", idEscola)
        .orWhereNull("EscolaTemAlunos.ID_ESCOLA")
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
}

function NumeroDeEscolasAtendidasPromise() {
    return knex("EscolaTemAlunos").countDistinct("ID_ESCOLA AS NUMESCOLAS");
}

function ListarTodasAsRotasAtendidasPorEscolaPromise() {
    return knex("Escolas AS E")
        .leftJoin("RotaPassaPorEscolas AS R", "E.ID_ESCOLA", "=", "R.ID_ESCOLA")
        .select("E.ID_ESCOLA")
        .count("R.ID_ROTA as NUM_ROTAS")
        .groupBy("E.ID_ESCOLA")
}


function RemoverEscolaPromise(idEscola) {
    return knex("Escolas")
        .where("ID_ESCOLA", idEscola)
        .del()
}

function RemoverEscola(idEscola, callbackFn) {
    knex("Escolas")
        .where("ID_ESCOLA", idEscola)
        .del()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
}

function AdicionaAlunoEscola(idAluno, idEscola) {
    return knex("EscolaTemAlunos")
        .insert({ "ID_ESCOLA": idEscola, "ID_ALUNO": idAluno });
}

function RemoveAlunoEscola(idAluno) {
    return knex("EscolaTemAlunos")
        .where("ID_ALUNO", idAluno)
        .del()
}

function ListarEscolasDoMECPromise(idMunicipio) {
    return knex("Escolas")
        .where("CO_MUNICIPIO", idMunicipio)
        .del()
}