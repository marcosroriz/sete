function GetVeiculoFromForm() {
    return {
        "MODO": $("input[name='tipoModal']:checked").val(), // int
        "MARCA": $("#tipoMarca").val(), // int
        "TIPO": $("#tipoVeiculo").val(), // int
        "MODELO": $("#listamodelo").val(),
        "ANO": $("#reganoaquisicao").val(),
        "ORIGEM": $("input[name='origemVeiculo']:checked").val(),

        "PLACA": $("#regplaca").val().toUpperCase(),
        "RENAVAM": $("#regrenavam").val(),
        "KM_INICIAL": $("#regkm").val(),
        "KM_ATUAL": $("#regkm").val(),
        "CAPACIDADE": $("#capacidade").val(),
        "MANUTENCAO": Boolean(parseInt($("input[name='manutencao']:checked").val())), // boolean
    };
}

function GetOSFromForm() {
    return {
        "TIPO_SERVICO": $("#tipoServico").val(), // int
        "DATA": $("#regdata").val(), // boolean
        "ID_VEICULO": $("#tipoVeiculo").val(), // int
        "ID_FORNECEDOR": $("#tipoFornecedor").val(), // int
        "COMENTARIO": $("#comentario").val(),
    };
}

function PopulateOSFromState(estadoOSJSON) {
    $(".pageTitle").html("Atualizar Ordem de Serviço");
    $("#tipoServico").val(estadoOSJSON["TIPO_SERVICO"]);
    $("#regdata").val(estadoOSJSON["DATA"]);
    $("#tipoVeiculo").val(estadoOSJSON["ID_VEICULO"]);
    $("#tipoFornecedor").val(estadoOSJSON["ID_FORNECEDOR"]);
    $("#comentario").val(estadoOSJSON["COMENTARIO"]);
}

function PopulateVeiculoFromState(estadoVeiculoJSON) {
    $(".pageTitle").html("Atualizar Veículo");
    $(".tipoNeutro").hide();

    $("input[name='tipoModal']").val([estadoVeiculoJSON["MODO"]]);

    if (estadoVeiculoJSON["MODO"] == false) {
        $(".tipoAqua").hide();
        $(".tipoRodo").show();
    } else {
        $(".tipoRodo").hide();
        $(".tipoAqua").show();
    }

    $("#tipoVeiculo").val(estadoVeiculoJSON["TIPO"]);
    $("#tipoMarca").val(estadoVeiculoJSON["MARCA"]);

    $("#listamodelo").val(estadoVeiculoJSON["MODELO"]);
    $("#reganoaquisicao").val(estadoVeiculoJSON["ANO"]);
    $("input[name='origemVeiculo']").val([estadoVeiculoJSON["ORIGEM"]]);

    $("#regplaca").val(estadoVeiculoJSON["PLACA"]);
    $("#regrenavam").val(estadoVeiculoJSON["RENAVAM"]);
    $("#regkm").val(estadoVeiculoJSON["KM_INICIAL"]);
    $("#capacidade").val(estadoVeiculoJSON["CAPACIDADE"]);
    if (estadoVeiculoJSON["MANUTENCAO"]) {
        $("input[name='manutencao'][value='1']").prop('checked', true)
    } else {
        $("input[name='manutencao'][value='0']").prop('checked', true)
    }
}

// Transformar linha do DB para JSON
var parseOSDB = function (osRaw) {
    var osJSON = Object.assign({}, osRaw);
    if (osJSON["TERMINO"]) {
        osJSON["TERMINOSTR"] = "Sim";
    } else {
        osJSON["TERMINOSTR"] = "Não";
    }

    switch (osRaw["TIPO_SERVICO"]) {
        case 1: osJSON["TIPOSTR"] = "Combustível"; break;
        case 2: osJSON["TIPOSTR"] = "Óleo e lubrificantes"; break;
        case 3: osJSON["TIPOSTR"] = "Seguro"; break;
        case 4: osJSON["TIPOSTR"] = "Manutenção Preventiva"; break;
        case 5: osJSON["TIPOSTR"] = "Manutenção"; break;
        default: osJSON["TIPOSTR"] = "Combustível";
    }

    return osJSON;
}

var parseVeiculoDB = function (veiculoRaw) {
    var veiculoJSON = Object.assign({}, veiculoRaw);
    veiculoJSON["CAPACIDADE_ATUAL"] = 0;
    veiculoJSON["CAPACIDADE"] = Number(veiculoJSON["CAPACIDADE"]);

    if (veiculoJSON["MANUTENCAO"]) {
        veiculoJSON["ESTADO"] = "Manutenção";
    } else {
        veiculoJSON["ESTADO"] = "Operação";
    }

    if (veiculoJSON["ORIGEM"] == "1") {
        veiculoJSON["ORIGEMSTR"] = "Frota própria";
    } else {
        veiculoJSON["ORIGEMSTR"] = "Frota terceirizada";
    }

    switch (Number(veiculoRaw["TIPO"])) {
        case 1: veiculoJSON["TIPOSTR"] = "Ônibus"; break;
        case 2: veiculoJSON["TIPOSTR"] = "Micro-ônibus"; break;
        case 3: veiculoJSON["TIPOSTR"] = "Van"; break;
        case 4: veiculoJSON["TIPOSTR"] = "Kombi"; break;
        case 5: veiculoJSON["TIPOSTR"] = "Caminhão"; break;
        case 6: veiculoJSON["TIPOSTR"] = "Caminhonete"; break;
        case 7: veiculoJSON["TIPOSTR"] = "Motocicleta"; break;
        case 8: veiculoJSON["TIPOSTR"] = "Animal de tração"; break;
        case 9: veiculoJSON["TIPOSTR"] = "Lancha/Voadeira"; break;
        case 10: veiculoJSON["TIPOSTR"] = "Barco de madeira"; break;
        case 11: veiculoJSON["TIPOSTR"] = "Barco de alumínio"; break;
        case 12: veiculoJSON["TIPOSTR"] = "Canoa motorizada"; break;
        case 13: veiculoJSON["TIPOSTR"] = "Canoa a remo"; break;
        default: veiculoJSON["TIPOSTR"] = "Ônibus";
    }

    switch (Number(veiculoRaw["MARCA"])) {
        case 1: veiculoJSON["MARCASTR"] = "IVECO"; break;
        case 2: veiculoJSON["MARCASTR"] = "MERCEDES-BENZ"; break;
        case 3: veiculoJSON["MARCASTR"] = "RENAULT"; break;
        case 4: veiculoJSON["MARCASTR"] = "VOLKSWAGEN"; break;
        case 5: veiculoJSON["MARCASTR"] = "VOLARE"; break;
        case 10: veiculoJSON["MARCASTR"] = "OUTRA"; break;
        default: veiculoJSON["MARCASTR"] = "OUTRA";
    }

    switch (Number(veiculoRaw["MODELO"])) {
        case 1: veiculoJSON["MODELOSTR"] = "ORE 1"; break;
        case 2: veiculoJSON["MODELOSTR"] = "ORE 1 (4x4)"; break;
        case 3: veiculoJSON["MODELOSTR"] = "ORE 2"; break;
        case 4: veiculoJSON["MODELOSTR"] = "ORE 3"; break;
        case 5: veiculoJSON["MODELOSTR"] = "ORE 4"; break;
        case 6: veiculoJSON["MODELOSTR"] = "ONUREA"; break;
        case 7: veiculoJSON["MODELOSTR"] = "Lancha a Gasolina"; break;
        case 8: veiculoJSON["MODELOSTR"] = "Lancha a Diesel"; break;
        default: veiculoJSON["MODELOSTR"] = "Não se aplica";
    }

    return veiculoJSON;
};

function AtualizarOSPromise(table, data, c1, id1, c2, id2, c3, id3) {
    return knex(table).where(c1, '=', id1).andWhere(c2, '=', id2).andWhere(c3, '=', id3).update(data);
}

function RemoverOSPromise(table, c1, id1, c2, id2, c3, id3) {
    return knex(table).where(c1, id1).andWhere(c2, id2).andWhere(c3, '=', id3).del();
}


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

function NumeroDeVeiculosFuncionamentoPromise() {
    return knex("Veiculos").count("ID_VEICULO AS NUMVEICULOS").where("MANUTENCAO", 0);
}

function NumeroDeVeiculosEmManutencaoPromise() {
    return knex("Veiculos").count("ID_VEICULO AS NUMVEICULOS").where("MANUTENCAO", 1);
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

function AtualizarEscolaPromise(idAluno, alunoJSON) {
    return knex("Alunos")
        .where('ID_ALUNO', '=', idAluno)
        .update(alunoJSON)
}

function PegarCapacidadeAtualPromise() {
    return knex.raw(`Select COUNT(RA.ID_ALUNO) AS NUM_ALUNOS, RP.ID_VEICULO AS ID_VEICULO
    FROM RotaPossuiVeiculo AS RP
    JOIN RotaAtendeAluno AS RA ON RA.ID_ROTA = RP.ID_ROTA
    GROUP BY RP.ID_VEICULO 
     `);
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