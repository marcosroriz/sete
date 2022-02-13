function GetEscolaFromForm() {
    let data = {
        "mec_co_uf": parseInt($("#regestado").val()), // int
        "mec_co_municipio": parseInt($("#regcidade").val()), // int
        "mec_tp_localizacao": parseInt($("input[name='areaUrbana']:checked").val()), // int
        "mec_tp_localizacao_diferenciada": parseInt($("input[name='locDif']:checked").val()), // int
        "mec_no_entidade": $("#nomeEscola").val(), // string
        "nome": $("#nomeEscola").val(), // string
        
        "horario_matutino": $("#temHorarioManha").is(":checked") ? "S" : "N", // str
        "horario_vespertino": $("#temHorarioTarde").is(":checked") ? "S" : "N", // str
        "horario_noturno": $("#temHorarioNoite").is(":checked") ? "S" : "N", // str

        "mec_tp_dependencia": parseInt($("input[name='tipoDependencia']:checked").val()), // int
        "mec_in_regular": $("#temEnsinoRegular").is(":checked") ? "S" : "N", // str
        "mec_in_eja": $("#temEnsinoEJA").is(":checked") ? "S" : "N", // str
        "mec_in_profissionalizante": $("#temEnsinoProf").is(":checked") ? "S" : "N", // str
        "mec_in_especial_exclusiva": $("#temEnsinoEspecial").is(":checked") ? "S" : "N", // str

        "ensino_pre_escola": $("#temEnsinoInfantil").is(":checked") ? "S" : "N", // str
        "ensino_fundamental": $("#temEnsinoFundamental").is(":checked") ? "S" : "N", // str
        "ensino_medio": $("#temEnsinoMedio").is(":checked") ? "S" : "N", // str
        "ensino_superior": $("#temEnsinoUniversitario").is(":checked") ? "S" : "N", // str
    }

    if ($("#reglat").val()) data["loc_latitude"] = $("#reglat").val();
    if ($("#reglon").val()) data["loc_longitude"] = $("#reglon").val();
    if ($("#regend").val()) data["loc_endereco"] = $("#regend").val();
    if ($("#regcep").val()) data["loc_cep"] = $("#regcep").val();

    if ($("#inepEscola").val()) data["mec_co_entidade"] = parseInt($("#inepEscola").val());

    if ($("#nomeContato").val() != "") data["contato_responsavel"] = $("#nomeContato").val();
    if ($("#telContato").val() != "") data["contato_telefone"] = $("#telContato").val();
    if ($("#emailContato").val() != "") data["contato_email"] = $("#emailContato").val();

    return data;
}

function PopulateEscolaFromState(estadoEscolaJSON) {
    $(".pageTitle").html("Atualizar Escola");
    
    if (estadoEscolaJSON["LOC_LATITUDE"]) $("#reglat").val(estadoEscolaJSON["LOC_LATITUDE"]);
    if (estadoEscolaJSON["LOC_LONGITUDE"]) $("#reglon").val(estadoEscolaJSON["LOC_LONGITUDE"]);
    if (estadoEscolaJSON["MEC_CO_ENTIDADE"]) $("#inepEscola").val(estadoEscolaJSON["MEC_CO_ENTIDADE"]);

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
    $("#temEnsinoEspecial").prop("checked", estadoEscolaJSON["MEC_IN_ESPECIAL_EXCLUSIVA"]);
    
    $("#temEnsinoInfantil").prop("checked", estadoEscolaJSON["ENSINO_PRE_ESCOLA"]);
    $("#temEnsinoFundamental").prop("checked", estadoEscolaJSON["ENSINO_FUNDAMENTAL"]);
    $("#temEnsinoMedio").prop("checked", estadoEscolaJSON["ENSINO_MEDIO"]);
    $("#temEnsinoUniversitario").prop("checked", estadoEscolaJSON["ENSINO_SUPERIOR"]);
    
    $("#temHorarioManha").prop("checked", estadoEscolaJSON["HORARIO_MATUTINO"]);
    $("#temHorarioTarde").prop("checked", estadoEscolaJSON["HORARIO_VESPERTINO"]);
    $("#temHorarioNoite").prop("checked", estadoEscolaJSON["HORARIO_NOTURNO"]);
}


// Transformar linha da API REST para JSON
var parseEscolaREST = function (escolaRaw) {
    let escolaJSON = Object.assign({}, escolaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(escolaJSON)) {
        escolaJSON[attr.toUpperCase()] = escolaJSON[attr];
    }

    // Fixa o ID
    escolaJSON["ID"] = escolaJSON["id_escola"];

    // Fixa num de alunos
    if (escolaJSON["qtd_alunos"]) {
        escolaJSON["NUM_ALUNOS"] = escolaJSON["qtd_alunos"];
    }

    return parseEscolaDB(escolaJSON);
};


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

    let propParaTransformar = ["MEC_IN_REGULAR", "MEC_IN_EJA", "MEC_IN_PROFISSIONALIZANTE",  "MEC_IN_ESPECIAL_EXCLUSIVA",
                               "ENSINO_FUNDAMENTAL", "ENSINO_PRE_ESCOLA", "ENSINO_MEDIO", "ENSINO_SUPERIOR", 
                               "HORARIO_MATUTINO", "HORARIO_VESPERTINO", "HORARIO_NOTURNO"];

    for (let prop of propParaTransformar) {
        if (escolaJSON[prop] == "S") {
            escolaJSON[prop.toUpperCase()] = true;
        } else {
            escolaJSON[prop.toUpperCase()] = false;
        }
    }

    var tipoEnsino = new Array();
    if (escolaJSON["ENSINO_PRE_ESCOLA"]) tipoEnsino.push("Infantil")
    if (escolaJSON["ENSINO_FUNDAMENTAL"]) tipoEnsino.push("Fundamental");
    if (escolaJSON["ENSINO_MEDIO"]) tipoEnsino.push("Médio");
    if (escolaJSON["ENSINO_SUPERIOR"]) tipoEnsino.push("Superior");
    escolaJSON["ENSINO"] = tipoEnsino.join(", ");

    var horarioEnsino = new Array();
    if (escolaJSON["HORARIO_MATUTINO"]) horarioEnsino.push("Manhã");
    if (escolaJSON["HORARIO_VESPERTINO"]) horarioEnsino.push("Tarde");
    if (escolaJSON["HORARIO_NOTURNO"]) horarioEnsino.push("Noite");

    if (horarioEnsino != 0)
        escolaJSON["HORARIO"] = horarioEnsino.join(", ");
    else
        escolaJSON["HORARIO"] = "Não informado"

    var regimeEnsino = new Array();
    if (escolaJSON["MEC_IN_REGULAR"]) regimeEnsino.push("Regular");
    if (escolaJSON["MEC_IN_EJA"]) regimeEnsino.push("EJA");
    if (escolaJSON["MEC_IN_PROFISSIONALIZANTE"]) regimeEnsino.push("Profissionalizante");
    escolaJSON["REGIME"] = regimeEnsino.join(", ");

    if (!escolaJSON["NUM_ALUNOS"]) {
        escolaJSON["NUM_ALUNOS"] = 0;
    }

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