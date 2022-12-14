function GetVeiculoFromForm() {
    let modo = Number($("input[name='tipoModal']:checked").val());
    let data = {
        "modo": modo,
        "marca": $("#tipoMarca").val(),
        "tipo": $("#tipoVeiculo").val(), 
        "modelo": $("#listamodelo").val(),
        "ano": $("#reganoaquisicao").val(),
        "origem": Number($("input[name='origemVeiculo']:checked").val()),
        "placa": $("#regplaca").val().toUpperCase(),
        "renavam": $("#regrenavam").val(),
        "capacidade": Number($("#capacidade").val()),
        "manutencao": Number($("[name='manutencao']:checked").val()) == 0 ? "N" : "S", // str
        "tipo_combustivel": $("[name='tipoCombustivel']:checked").val()
    }
    
    if (Number($("#tipoVeiculo").val()) == 99) {
        data["outro_tipo_text"] = $("#outroTipoText").val();
    }

    if ($("#regkm").val() != "" && $("#regkm").val() != null) {
        data["km_inicial"] = strToNumber($("#regkm").val());
    }
    if ($("#regkm").val() != "" && $("#regkm").val() != null) {
        data["km_atual"] = strToNumber($("#regkm").val());
    }
    if ($("#numeroDePneus").val() != "" && $("#numeroDePneus").val() != null) {
        data["numero_de_pneus"] = Number($("#numeroDePneus").val());
    }
    if ($("#vidaUtilPneu").val() != "" && $("#vidaUtilPneu").val() != null) {
        data["vida_util_do_pneu"] = Number($("#vidaUtilPneu").val());
    }
    if ($("#numCavalos").val() != "" && $("#numCavalos").val() != null) {
        data["potencia_do_motor"] = Number($("#numCavalos").val());
    }
    if ($("#precoVeiculo").val() != "" && $("#precoVeiculo").val() != null) {
        data["preco"] = strToNumber($("#precoVeiculo").val());
    }
    if ($("#regipva").val() != "" && $("#regipva").val() != null) {
        data["ipva"] = strToNumber($("#regipva").val());
    }
    if ($("#regdpvat").val() != "" && $("#regdpvat").val() != null) {
        data["dpvat"] = strToNumber($("#regdpvat").val());
    }
    if ($("#regseguroanual").val() != "" && $("#regseguroanual").val() != null) {
        data["seguro_anual"] = strToNumber($("#regseguroanual").val());
    }
    if ($("#consumoVeiculo").val() != "" && $("#consumoVeiculo").val() != null) {
        data["consumo"] = strToNumber($("#consumoVeiculo").val());
    }

    return data;
}

function GetOSFromForm() {
    return {
        "tipo_servico": $("#tipoServico").val(), // int
        "data": moment($("#regdata").val()).format("DD/MM/YYYY"),
        "id_veiculo": $("#tipoVeiculo").val(), // int
        "id_fornecedor": $("#tipoFornecedor").val(), // int
        "comentario": $("#comentario").val(),
    };
}

function PopulateOSFromState(estadoOSJSON) {
    $(".pageTitle").html("Atualizar Ordem de Serviço");
    $("#tipoServico").val(estadoOSJSON["TIPO_SERVICO"]);
    $("#regdata").val(moment(estadoOSJSON["DATASTR"]).format("yyyy-MM-DD"));
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
    if (Number(estadoVeiculoJSON["TIPO"])) {
        $("#outroTipoText").val(estadoVeiculoJSON["outro_tipo_text"]);
        $("#outroVeiculoDesc").show();
    }
    $("#tipoMarca").val(estadoVeiculoJSON["MARCA"]);

    $("#listamodelo").val(estadoVeiculoJSON["MODELO"]);
    $("#reganoaquisicao").val(estadoVeiculoJSON["ANO"]);
    $("input[name='origemVeiculo']").val([estadoVeiculoJSON["ORIGEM"]]);

    $("#regplaca").val(estadoVeiculoJSON["PLACA"]);
    $("#regrenavam").val(estadoVeiculoJSON["RENAVAM"]);
    $("#regkm").val(estadoVeiculoJSON["KM_INICIAL"]);
    $("#capacidade").val(estadoVeiculoJSON["CAPACIDADE"]);
    if (estadoVeiculoJSON["MANUTENCAO"] == "S") {
        $("input[name='manutencao'][value='1']").prop('checked', true)
    } else {
        $("input[name='manutencao'][value='0']").prop('checked', true)
    }

    if (estadoVeiculoJSON["tipo_combustivel"]) {
        $(`input[name='tipoCombustivel'][value='${estadoVeiculoJSON["tipo_combustivel"]}']`).prop('checked', true)
    }

    if (estadoVeiculoJSON["km_atual"]) $("#regkm").val(numberToMoney(estadoVeiculoJSON["km_atual"]));
    if (estadoVeiculoJSON["numero_de_pneus"]) $("#numeroDePneus").val(Number(estadoVeiculoJSON["numero_de_pneus"]));
    if (estadoVeiculoJSON["vida_util_do_pneu"]) $("#vidaUtilPneu").val(strToNumber(estadoVeiculoJSON["vida_util_do_pneu"]));
    if (estadoVeiculoJSON["potencia_do_motor"]) $("#numCavalos").val(strToNumber(estadoVeiculoJSON["potencia_do_motor"]));
    if (estadoVeiculoJSON["preco"]) $("#precoVeiculo").val(numberToMoney(estadoVeiculoJSON["preco"]));

    if (estadoVeiculoJSON["ipva"]) $("#regipva").val(numberToMoney(estadoVeiculoJSON["ipva"]));
    if (estadoVeiculoJSON["dpvat"]) $("#regdpvat").val(numberToMoney(estadoVeiculoJSON["dpvat"]));
    if (estadoVeiculoJSON["seguro_anual"]) $("#regseguroanual").val(numberToMoney(estadoVeiculoJSON["seguro_anual"]));
    if (estadoVeiculoJSON["consumo"]) $("#consumoVeiculo").val(strToNumber(estadoVeiculoJSON["consumo"]));

    if ($("#consumoVeiculo").val() != "" && $("#consumoVeiculo").val() != null) {
        estadoVeiculoJSON["consumo"] = strToNumber($("#consumoVeiculo").val());
    }
}

// Transformar linha da API REST para JSON
var parseOSRest = function (osRaw) {
    let osJSON = Object.assign({}, osRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(osJSON)) {
        osJSON[attr.toUpperCase()] = osJSON[attr];
    }

    // Fixa o ID
    osJSON["ID"] = osJSON["id_ordem"];

    return parseOSDB(osJSON);
};

// Transformar linha do DB para JSON

var parseOSDB = function (osRaw) {
    var osJSON = Object.assign({}, osRaw);
    if (osJSON["TERMINO"] == "S") {
        osJSON["TERMINOSTR"] = "Sim";
    } else {
        osJSON["TERMINOSTR"] = "Não";
    }

    switch (Number(osRaw["TIPO_SERVICO"])) {
        case 1: osJSON["TIPOSTR"] = "Combustível"; break;
        case 2: osJSON["TIPOSTR"] = "Óleo e lubrificantes"; break;
        case 3: osJSON["TIPOSTR"] = "Seguro"; break;
        case 4: osJSON["TIPOSTR"] = "Manutenção Preventiva"; break;
        case 5: osJSON["TIPOSTR"] = "Manutenção"; break;
        default: osJSON["TIPOSTR"] = "Combustível";
    }

    if (osRaw.data) {
        osJSON["DATASTR"] = moment(osRaw.data).format("DD/MM/yyyy")
    }

    return osJSON;
}

// Transformar linha da API REST para JSON
var parseVeiculoREST = function (veiculoRaw) {
    let veiculoJSON = Object.assign({}, veiculoRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(veiculoJSON)) {
        veiculoJSON[attr.toUpperCase()] = veiculoJSON[attr];
    }

    // Fixa o ID
    veiculoJSON["ID"] = veiculoJSON["id_veiculo"];

    return parseVeiculoDB(veiculoJSON);
};

var parseVeiculoDB = function (veiculoRaw) {
    var veiculoJSON = Object.assign({}, veiculoRaw);
    veiculoJSON["CAPACIDADE_ATUAL"] = 0;
    veiculoJSON["CAPACIDADE"] = Number(veiculoJSON["CAPACIDADE"]);

    if (veiculoJSON["MANUTENCAO"] == "Sim" || veiculoJSON["MANUTENCAO"] == true) {
        veiculoJSON["ESTADO"] = "Manutenção";
    } else {
        veiculoJSON["ESTADO"] = "Operação";
    }

    if (veiculoJSON["ORIGEM"] == "1" || veiculoJSON["ORIGEM"] == "Próprio") {
        veiculoJSON["ORIGEMSTR"] = "Frota própria";
    } else {
        veiculoJSON["ORIGEMSTR"] = "Frota terceirizada";
    }

    // TODO: Olhar esse parse dos dados
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
        case 99: veiculoJSON["TIPOSTR"] = `Outro (${veiculoJSON.outro_tipo_text})`; break
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