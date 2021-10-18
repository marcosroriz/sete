function GetRotaFromForm() {
    return {
        "TIPO": $("input[name='tipoRota']:checked").val(), // int
        "NOME": $("#regnome").val(), // string
        "HORA_IDA_INICIO": $("#reginicioida").val(), // text
        "HORA_IDA_TERMINO": $("#regterminoida").val(), // text
        "HORA_VOLTA_INICIO": $("#reginiciovolta").val(), // text
        "HORA_VOLTA_TERMINO": $("#regterminovolta").val(), // text
        "KM": $("#regkm").val(), // text
        "TEMPO": $("#regtempo").val(), // text

        "DA_PORTEIRA": $("#temPorteira").is(":checked"), // bool
        "DA_MATABURRO": $("#temMataBurro").is(":checked"), // bool
        "DA_COLCHETE": $("#temColchete").is(":checked"), // bool
        "DA_ATOLEIRO": $("#temAtoleiro").is(":checked"), // bool
        "DA_PONTERUSTICA": $("#temPonte").is(":checked"), // bool

        "TURNO_MATUTINO": $("#temHorarioManha").is(":checked"), // bool
        "TURNO_VESPERTINO": $("#temHorarioTarde").is(":checked"), // bool
        "TURNO_NOTURNO": $("#temHorarioNoite").is(":checked"), // bool
    }
}

function PopulateRotaFromState(estadoRotaJSON) {
    $("#regnome").val(estadoRotaJSON["NOME"]);
    $("input[name='tipoRota']").val([estadoRotaJSON["TIPO"]]);
    $("#reginicioida").val(estadoRotaJSON["HORA_IDA_INICIO"]);
    $("#regterminoida").val(estadoRotaJSON["HORA_IDA_TERMINO"]);
    $("#reginiciovolta").val(estadoRotaJSON["HORA_VOLTA_INICIO"]);
    $("#regterminovolta").val(estadoRotaJSON["HORA_VOLTA_TERMINO"]);
    $("#regkm").val(estadoRotaJSON["KM"]);
    $("#regtempo").val(estadoRotaJSON["TEMPO"]);

    $("#temPorteira").prop("checked", estadoRotaJSON["DA_PORTEIRA"]);
    $("#temMataBurro").prop("checked", estadoRotaJSON["DA_MATABURRO"]);
    $("#temColchete").prop("checked", estadoRotaJSON["DA_COLCHETE"]);
    $("#temAtoleiro").prop("checked", estadoRotaJSON["DA_ATOLEIRO"]);
    $("#temPonte").prop("checked", estadoRotaJSON["DA_PONTERUSTICA"]);

    $("#temHorarioManha").prop("checked", estadoRotaJSON["TURNO_MATUTINO"]);
    $("#temHorarioTarde").prop("checked", estadoRotaJSON["TURNO_VESPERTINO"]);
    $("#temHorarioNoite").prop("checked", estadoRotaJSON["TURNO_NOTURNO"]);
}


// Transformar linha da API REST para JSON
var parseRotaDBREST = function (rotaRaw) {
    let rotaJSON = Object.assign({}, rotaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(rotaJSON)) {
        rotaJSON[attr.toUpperCase()] = rotaJSON[attr];
    }

    // Fixa o ID
    rotaJSON["ID"] = rotaJSON["id_rota"];

    return parseRotaDB(rotaJSON);
};

// Transformar linha do DB para JSON
var parseRotaDB = function (rotaRaw) {
    var rotaJSON = Object.assign({}, rotaRaw);
    rotaJSON["ROTAS"] = 0;

    if (rotaRaw["KM"] == 0) {
        rotaJSON["KMSTR"] = "Não informado";
    } else {
        rotaJSON["KMSTR"] = rotaRaw["KM"] + " km";
    }
    var turno = new Array();
    if (rotaRaw["TURNO_MATUTINO"]) turno.push("Manhã");
    if (rotaRaw["TURNO_VESPERTINO"]) turno.push("Tarde");
    if (rotaRaw["TURNO_NOTURNO"]) turno.push("Noite");
    if (turno.length == 0) {
        rotaJSON["TURNOSTR"] = "Não informado"
    } else {
        rotaJSON["TURNOSTR"] = turno.join(", ");
    }

    if (rotaRaw["SHAPE"] != "" && rotaRaw["SHAPE"] != undefined) {
        rotaJSON["GEOREF"] = "Sim";
    } else {
        rotaJSON["GEOREF"] = "Não";
    }

    var dificuldadesAcesso = new Array();
    if (rotaRaw["DA_PORTEIRA"]) { dificuldadesAcesso.push("Porteira"); }
    if (rotaRaw["DA_MATABURRO"]) { dificuldadesAcesso.push("Mata-Burro"); }
    if (rotaRaw["DA_COLCHETE"]) { dificuldadesAcesso.push("Colchete"); }
    if (rotaRaw["DA_ATOLEIRO"]) { dificuldadesAcesso.push("Atoleiro"); }
    if (rotaRaw["DA_PONTERUSTICA"]) { dificuldadesAcesso.push("Ponte Rústica"); }
    rotaJSON["DIFICULDADESTR"] = dificuldadesAcesso.join(", ");

    return rotaJSON;
};

function BuscarDadosVeiculoRotaPromise(idRota) {
    return knex("RotaPossuiVeiculo AS R")
        .select("V.*")
        .leftJoin("Veiculos AS V", "R.ID_VEICULO", "=", "V.ID_VEICULO")
        .where("ID_ROTA", "=", idRota)
}

function BuscarDadosMotoristaRotaPromise(idRota) {
    return knex("RotaDirigidaPorMotorista AS R")
        .select("M.*")
        .leftJoin("Motoristas AS M", "R.CPF_MOTORISTA", "=", "M.CPF")
        .where("ID_ROTA", "=", idRota)
}

function ListarParesDeAlunoEscolasPromise() {
    return knex("Alunos AS A")
           .select("A.ID_ALUNO", "E.ID_ESCOLA", "A.LOC_LATITUDE AS ALAT", "A.LOC_LONGITUDE AS ALNG",
                   "E.LOC_LATITUDE AS ELAT", "E.LOC_LONGITUDE AS ELNG")
           .innerJoin("EscolaTemAlunos AS R", "R.ID_ALUNO", "=", "A.ID_ALUNO")
           .innerJoin("Escolas AS E", "E.ID_ESCOLA", "=", "R.ID_ESCOLA")
}

function ListarTodasAsEscolasPromise() {
    return knex("Escolas AS E")
        .select("R.ID_ROTA", "E.*")
        .leftJoin("RotaPassaPorEscolas AS R", "E.ID_ESCOLA", "=", "R.ID_ESCOLA")
}

function ListarTodasAsEscolasAtendidasPorRotaPromise(idRota) {
    return ListarTodasAsEscolasPromise()
        .where("R.ID_ROTA", idRota)
}

function ListarTodasAsEscolasNaoAtendidasPorRotaPromise(idRota) {
    // select ID_ESCOLA FROM `RotaPassaPorEscolas` WHERE ID_ROTA = 21
    var subquery = knex("RotaPassaPorEscolas").select("ID_ESCOLA").where("ID_ROTA", "=", idRota)
    return knex("Escolas AS E")
        .select("E.*")
        .leftJoin("RotaPassaPorEscolas AS R", "E.ID_ESCOLA", "=", "R.ID_ESCOLA")
        .whereNotIn("E.ID_ESCOLA", subquery)
        .orWhereNull("R.ID_ROTA")
}

function ListarTodosOsAlunosPromise() {
    return knex("Alunos AS A")
        .select("R.ID_ROTA", "A.*")
        .leftJoin("RotaAtendeAluno AS R", "A.ID_ALUNO", "=", "R.ID_ALUNO")
}

function ListarTodosOsAlunosAtendidosPorRotaPromise(idRota) {
    return ListarTodosOsAlunosPromise()
        .where("R.ID_ROTA", idRota)
}

function ListaDeAlunosNaoAtendidosPorRotaPromise(idRota) {
    return knex("Alunos AS A")
        .select("A.*")
        .leftJoin("RotaAtendeAluno AS R", "A.ID_ALUNO", "=", "R.ID_ALUNO")
        .where("R.ID_ROTA", "<>", idRota)
        .orWhereNull("R.ID_ROTA")
}

function RemoverRotaRelacaoPromise(table, c1, id1, c2, id2) {
    return knex(table)
        .where(c1, "=", id1)
        .where(c2, "=", id2)
        .del();
}

function ContactFuncionamento() {
    var result = "";
    if ($("#enum_turno_manha").is(":checked"))
        result = ((result != "") ? ":" : "") + $("#enum_turno_manha").val();
    if ($("#enum_turno_tarde").is(":checked"))
        result += ((result != "") ? ":" : "") + $("#enum_turno_tarde").val();
    if ($("#enum_turno_noite").is(":checked"))
        result += ((result != "") ? ":" : "") + $("#enum_turno_noite").val();
    return result;
}

function ContactDificuldadeAcesso() {
    var result = "";
    if ($("#EnumDificultadeAcesso_mata_burro").is(":checked"))
        result = ((result != "") ? ":" : "") + $("#EnumDificultadeAcesso_mata_burro").val();
    if ($("#EnumDificultadeAcesso_porteira").is(":checked"))
        result += ((result != "") ? ":" : "") + $("#EnumDificultadeAcesso_porteira").val();
    if ($("#EnumDificultadeAcesso_colchete").is(":checked"))
        result += ((result != "") ? ":" : "") + $("#EnumDificultadeAcesso_colchete").val();
    return result;
}

function OnOfContactFuncionamento(data) {
    data = String(data);
    $("#enum_turno_manha").attr('checked', (data.match('1')));
    $("#enum_turno_tarde").attr('checked', (data.match('2')));
    $("#enum_turno_noite").attr('checked', (data.match('3')));
}

function OnOfContactDificuldadeAcesso(data) {
    data = String(data);
    $("#EnumDificultadeAcesso_mata_burro").attr('checked', (data.match('1')));
    $("#EnumDificultadeAcesso_porteira").attr('checked', (data.match('2')));
    $("#EnumDificultadeAcesso_colchete").attr('checked', (data.match('3')));
}



function ObterAlunosVinculados(rota_id) {
    return knex.select('*').where('RelacaoRotaAluno.rota_id', '=', rota_id)
        .from('Aluno').innerJoin('RelacaoRotaAluno', 'RelacaoRotaAluno.aluno_id', 'Aluno.ID_ALUNO');
}

function ObterAlunosNaoVinculados() {
    return knex.select('*')
        .from('Aluno').whereNotExists(function () {
            this.select('*').from('RelacaoRotaAluno').whereRaw('RelacaoRotaAluno.aluno_id = Aluno.ID_ALUNO');
        })
}


/**********escola*********/
function ObterEscolasVinculados(rota_id) {
    return knex.select('*').where('RelacaoRotaEscola.rota_id', '=', rota_id)
        .from('Escolas').innerJoin('RelacaoRotaEscola', 'RelacaoRotaEscola.escola_id', 'Escolas.ID_ESCOLA');
}

function ObterEscolasNaoVinculados(rota_id) {
    return knex.select('*')
        .from('Escolas').whereNotExists(function () {
            this.select('*').from('RelacaoRotaEscola')
                .whereRaw('RelacaoRotaEscola.escola_id = Escolas.ID_ESCOLA and RelacaoRotaEscola.rota_id = ' + rota_id);
        })
}