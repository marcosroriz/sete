function GetEscolaFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "MEC_CO_UF": $("#regestado").val(), // int
        "MEC_CO_MUNICIPIO": $("#regcidade").val(), // int
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "MEC_TP_LOCALIZACAO": $("input[name='areaUrbana']:checked").val(), // int
        "MEC_TP_LOCALIZACAO_DIFERENCIADA": $("input[name='locDif']:checked").val(), // int
        "NOME": $("#nomeEscola").val(), // string
        "MEC_NO_ENTIDADE": $("#nomeEscola").val(), // string
        "CONTATO_RESPONSAVEL": $("#nomeContato").val(), // string
        "CONTATO_TELEFONE": $("#telContato").val(), // string
        "MEC_TP_DEPENDENCIA": $("input[name='tipoDependencia']:checked").val(), // int
        "MEC_IN_REGULAR": $("#temEnsinoRegular").is(":checked"), // bool
        "MEC_IN_EJA": $("#temEnsinoEJA").is(":checked"), // bool
        "MEC_IN_PROFISSIONALIZANTE": $("#temEnsinoProf").is(":checked"), // bool
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
    $("input[name='tipoDependencia']").filter(`[value="${estadoEscolaJSON["MEC_TP_DEPENDENCIA"]}"]`).prop("checked", true);
    
    $("#temEnsinoRegular").prop("checked", estadoEscolaJSON["MEC_IN_REGULAR"]);
    $("#temEnsinoEJA").prop("checked", estadoEscolaJSON["MEC_IN_EJA"]);
    $("#temEnsinoProf").prop("checked", estadoEscolaJSON["MEC_IN_PROFISSIONALIZANTE"]);
    $("#temEnsinoFundamental").prop("checked", estadoEscolaJSON["ENSINO_FUNDAMENTAL"]);
    $("#temEnsinoMedio").prop("checked", estadoEscolaJSON["ENSINO_MEDIO"]);
    $("#temEnsinoUniversitario").prop("checked", estadoEscolaJSON["MEC_IN_PROFIENSINO_SUPERIORSSIONALIZANTE"]);
    $("#temHorarioManha").prop("checked", estadoEscolaJSON["HORARIO_MATUTINO"]);
    $("#temHorarioTarde").prop("checked", estadoEscolaJSON["HORARIO_VESPERTINO"]);
    $("#temHorarioNoite").prop("checked", estadoEscolaJSON["HORARIO_NOTURNO"]);
}



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