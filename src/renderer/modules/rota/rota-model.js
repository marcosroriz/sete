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
    rotaJSON["TURNOSTR"] = turno.join(", ");

    return rotaJSON;
};

function GetForm() {
    var data = new Date();
    return {
        "id": _rota.id, //int primarykey
        "nome": $("#nome").val(), // string
        "quilometragem": $("#quilometragem").val(), // string
        "funcionamento": ContactFuncionamento(), //integer
        "hora_inicio": $("#hora_inicio").val(), //sring
        "hora_retorno": $("#hora_retorno").val(), //sring
        "motorista_id": $("#motorista_id").val(), //int
        "data_criacao": data.getDate() + '/' + (data.getMonth() + 1) + '/' + data.getFullYear(),
        "garagem_id_partida": $("#garagem_id_partida").val(), //int
        "garagem_id_terminio": $("#garagem_id_terminio").val(), //int
        "dificuldade_acesso": ContactDificuldadeAcesso() //int
    };
}

function OfForm() {
    $("#nome").val("");
    $("#quilometragem").val("");
    $("#hora_inicio").val("");
    $("#hora_retorno").val("");
    $("#motorista_id").val("");
    $("#garagem_id_partida").val("");
    $("#garagem_id_terminio").val("");
    OnOfContactFuncionamento("");
    OnOfContactDificuldadeAcesso("");
}

function OnForm(data) {
    $("#nome").val(data.nome);
    $("#quilometragem").val(data.quilometragem);
    $("#hora_inicio").val(data.hora_inicio);
    $("#hora_retorno").val(data.hora_retorno);
    $("#motorista_id").val(data.motorista_id);
    $("#garagem_id_partida").val(data.garagem_id_partida);
    $("#garagem_id_terminio").val(data.garagem_id_terminio);

    OnOfContactFuncionamento(data.funcionamento);
    OnOfContactDificuldadeAcesso(data.dificuldade_acesso);

    ShowCadastro();
}

function BuscarDadosVeiculoRotaPromise(idRota) {
    return knex("RotaPossuiVeiculo AS R")
        .select("V.*")
        .leftJoin("Veiculos AS V", "R.ID_VEICULO", "=", "V.ID_VEICULO")
        .where("ID_ROTA", "=", idRota)
}

function BuscarDadosMotoristaRotaPromise(idRota) {
    return knex("RotaDirigidaPorMotorista AS R")
        .select("M.*")
        .leftJoin("Motoristas AS M", "R.ID_MOTORISTA", "=", "M.ID_MOTORISTA")
        .where("ID_ROTA", "=", idRota)
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