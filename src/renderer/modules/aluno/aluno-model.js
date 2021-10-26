function GetAlunoFromForm() {
    let data = {
        "nome": $("#regnome").val(), // string
        "data_nascimento": $("#regdata").val(), // string
        "sexo": parseInt($("input[name='modoSexo']:checked").val()), // int
        "cor": parseInt($("input[name='corAluno']:checked").val()), // int
        "def_caminhar": $("#temDeCaminhar").is(":checked") ? "S" : "N", // str
        "def_ouvir": $("#temDeOuvir").is(":checked") ? "S" : "N", // str
        "def_enxergar": $("#temDeEnxergar").is(":checked") ? "S" : "N", // str
        "def_mental": $("#temDefMental").is(":checked") ? "S" : "N", // str
        "mec_tp_localizacao": parseInt($("input[name='areaUrbana']:checked").val()), // int
        "turno": parseInt($("input[name='turnoAluno']:checked").val()), // int
        "nivel": parseInt($("input[name='nivelAluno']:checked").val()), // int
        "da_porteira": $("#temPorteira").is(":checked") ? "S" : "N", // str
        "da_mataburro": $("#temMataBurro").is(":checked") ? "S" : "N", // str
        "da_colchete": $("#temColchete").is(":checked") ? "S" : "N", // str
        "da_atoleiro": $("#temAtoleiro").is(":checked") ? "S" : "N", // str
        "da_ponterustica": $("#temPonte").is(":checked") ? "S" : "N", // str
    }

    if ($("#reglat").val()) data["loc_latitude"] = $("#reglat").val();
    if ($("#reglon").val()) data["loc_longitude"] = $("#reglon").val();
    if ($("#regend").val()) data["loc_endereco"] = $("#regend").val();
    if ($("#regcep").val()) data["loc_cep"] = $("#regcep").val();

    if ($("#regnomeresp").val() != "") data["nome_responsavel"] = $("#regnomeresp").val();

    if ($("#regcpf").val()) data["cpf"] = String($("#regcpf").val()).replace(/\D/g, '');
    if ($("#regtelresp").val()) data["telefone_responsavel"] = $("#regtelresp").val()
    if ($("#listareggrauresp").val() != "-1") {
        data["grau_responsavel"] = Number($("#listareggrauresp").val());
    } else {
        data["grau_responsavel"] = 0;
    }

    return data
}

function PopulateAlunoFromState(estadoAlunoJSON) {
    if (estadoAlunoJSON["LOC_LATITUDE"]) $("#reglat").val(estadoAlunoJSON["LOC_LATITUDE"]);
    if (estadoAlunoJSON["LOC_LONGITUDE"]) $("#reglon").val(estadoAlunoJSON["LOC_LONGITUDE"]);
    if (estadoAlunoJSON["LOC_ENDERECO"]) $("#regend").val(estadoAlunoJSON["LOC_ENDERECO"]);
    if (estadoAlunoJSON["LOC_CEP"]) $("#regcep").val(estadoAlunoJSON["LOC_CEP"]);

    $("input[name='areaUrbana']").filter(`[value="${estadoAlunoJSON["MEC_TP_LOCALIZACAO"]}"]`).prop("checked", true);
    if (estadoAlunoJSON["DA_PORTEIRA"]) $("#temPorteira").prop("checked", estadoAlunoJSON["DA_PORTEIRA"]);
    if (estadoAlunoJSON["DA_MATABURRO"]) $("#temMataBurro").prop("checked", estadoAlunoJSON["DA_MATABURRO"]);
    if (estadoAlunoJSON["DA_COLCHETE"]) $("#temColchete").prop("checked", estadoAlunoJSON["DA_COLCHETE"]);
    if (estadoAlunoJSON["DA_ATOLEIRO"]) $("#temAtoleiro").prop("checked", estadoAlunoJSON["DA_ATOLEIRO"]);
    if (estadoAlunoJSON["DA_PONTERUSTICA"]) $("#temPonte").prop("checked", estadoAlunoJSON["DA_PONTERUSTICA"]);

    $("#regnome").val(estadoAlunoJSON["NOME"]);
    $("#regcpf").val(estadoAlunoJSON["CPF"]);
    $("#regdata").val(estadoAlunoJSON["DATA_NASCIMENTO"]);
    if (estadoAlunoJSON["NOME_RESPONSAVEL"]) $("#regnomeresp").val(estadoAlunoJSON["NOME_RESPONSAVEL"]);
    if (estadoAlunoJSON["TELEFONE_RESPONSAVEL"]) $("#regtelresp").val(estadoAlunoJSON["TELEFONE_RESPONSAVEL"]);
    if (estadoAlunoJSON["GRAU_RESPONSAVEL"]) $("#listareggrauresp").val(estadoAlunoJSON["GRAU_RESPONSAVEL"]);

    $("input[name='modoSexo']").val([estadoAlunoJSON["SEXO"]]);
    $("input[name='corAluno']").val([estadoAlunoJSON["COR"]]);
    if (estadoAlunoJSON["DEF_CAMINHAR"]) $("#temDeCaminhar").prop("checked", estadoAlunoJSON["DEF_CAMINHAR"]);
    if (estadoAlunoJSON["DEF_OUVIR"]) $("#temDeOuvir").prop("checked", estadoAlunoJSON["DEF_OUVIR"]);
    if (estadoAlunoJSON["DEF_ENXERGAR"]) $("#temDeEnxergar").prop("checked", estadoAlunoJSON["DEF_ENXERGAR"]);
    if (estadoAlunoJSON["DEF_MENTAL"]) $("#temDefMental").prop("checked", estadoAlunoJSON["DEF_MENTAL"]);

    $("input[name='turnoAluno']").val([estadoAlunoJSON["TURNO"]]);
    $("input[name='nivelAluno']").val([estadoAlunoJSON["NIVEL"]]);

    if (estadoAlunoJSON["ID_ESCOLA"]) {
        $("#listaescola").val(estadoAlunoJSON["ID_ESCOLA"]);
    }

    if (estadoAlunoJSON["ID_ROTA"]) {
        $("#listarota").val(estadoAlunoJSON["ID_ROTA"]);
    }
}

// Transformar linha da API REST para JSON
var parseAlunoREST = function (alunoRaw) {
    let alunoJSON = Object.assign({}, alunoRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(alunoJSON)) {
        alunoJSON[attr.toUpperCase()] = alunoJSON[attr];
    }

    // Fixa o ID
    alunoJSON["ID"] = alunoJSON["id_aluno"];

    return parseAlunoDB(alunoJSON);
};

// Transformar linha do DB para JSON
var parseAlunoDB = function (alunoRaw) {
    var alunoJSON = Object.assign({}, alunoRaw);
    if (!alunoJSON["escola"]) alunoJSON["ESCOLA"] = "Sem escola cadastrada";
    if (!alunoJSON["rota"]) alunoJSON["ROTA"] = "Sem rota cadastrada";
    
    alunoJSON["ID_ESCOLA"] = 0;

    if (alunoJSON["da_porteira"] == "S") alunoJSON["DA_PORTEIRA"] = true;
    else alunoJSON["DA_PORTEIRA"] = false;

    if (alunoJSON["da_mataburro"] == "S") alunoJSON["DA_MATABURRO"] = true;
    else alunoJSON["DA_MATABURRO"] = false;

    if (alunoJSON["da_colchete"] == "S") alunoJSON["DA_COLCHETE"] = true;
    else alunoJSON["DA_COLCHETE"] = false;

    if (alunoJSON["da_atoleiro"] == "S") alunoJSON["DA_ATOLEIRO"] = true;
    else alunoJSON["DA_ATOLEIRO"] = false;

    if (alunoJSON["da_ponterustica"] == "S") alunoJSON["DA_PONTERUSTICA"] = true;
    else alunoJSON["DA_PONTERUSTICA"] = false;

    if (alunoJSON["def_caminhar"] == "S") alunoJSON["DEF_CAMINHAR"] = true;
    else alunoJSON["DEF_CAMINHAR"] = false;

    if (alunoJSON["def_ouvir"] == "S") alunoJSON["DEF_OUVIR"] = true;
    else alunoJSON["DEF_OUVIR"] = false;

    if (alunoJSON["def_enxergar"] == "S") alunoJSON["DEF_ENXERGAR"] = true;
    else alunoJSON["DEF_ENXERGAR"] = false;

    if (alunoJSON["def_mental"] == "S") alunoJSON["DEF_MENTAL"] = true;
    else alunoJSON["DEF_MENTAL"] = false;

    if (alunoRaw["NOME_RESPONSAVEL"] == undefined ||
        alunoRaw["NOME_RESPONSAVEL"] == null) {
        alunoJSON["NOME_RESPONSAVEL"] = "Não informado";
    }

    if (alunoRaw["LOC_LONGITUDE"] != "" && alunoRaw["LOC_LONGITUDE"] != undefined &&
        alunoRaw["LOC_LATITUDE"] != "" && alunoRaw["LOC_LATITUDE"] != undefined) {
        alunoJSON["GEOREF"] = "Sim";
    } else {
        alunoJSON["GEOREF"] = "Não";
    }

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

    switch (alunoRaw["SEXO"]) {
        case 1:
            alunoJSON["SEXOSTR"] = "Masculino";
            break;
        case 2:
            alunoJSON["SEXOSTR"] = "Feminino";
            break;
        default:
            alunoJSON["SEXOSTR"] = "Não Informado";
    }

    switch (alunoRaw["COR"]) {
        case 1:
            alunoJSON["CORSTR"] = "Branco";
            break;
        case 2:
            alunoJSON["CORSTR"] = "Preto";
            break;
        case 3:
            alunoJSON["CORSTR"] = "Pardo";
            break;
        case 4:
            alunoJSON["CORSTR"] = "Amarelo";
            break;
        case 5:
            alunoJSON["CORSTR"] = "Indígena";
            break;
        default:
            alunoJSON["CORSTR"] = "Não informado";
            break;
    }

    switch (alunoRaw["GRAU_RESPONSAVEL"]) {
        case 0:
            alunoJSON["GRAUSTR"] = "Pai, Mãe, Padrasto ou Madrasta";
            break;
        case 1:
            alunoJSON["GRAUSTR"] = "Avô ou Avó";
            break;
        case 2:
            alunoJSON["GRAUSTR"] = "Irmão ou Irmã";
            break;
        case 3:
            alunoJSON["GRAUSTR"] = "Outro Parente";
            break;
        case 4:
            alunoJSON["GRAUSTR"] = "Outro Parente";
            break;
        default:
            alunoJSON["GRAUSTR"] = "Não informado";
            break;
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
            alunoJSON["NIVELSTR"] = "Infantil";
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

function NumeroDeAlunosAtendidosPromise() {
    return knex("EscolaTemAlunos").count("ID_ALUNO AS NUMALUNOS");
}

function ListarEscolasDeAlunosPromise() {
    return knex("Escolas")
        .join("EscolaTemAlunos", "Escolas.ID_ESCOLA", "=", "EscolaTemAlunos.ID_ESCOLA")
}

function ListarRotasDeAlunosPromise() {
    return knex("Rotas AS R")
        .join("RotaAtendeAluno AS RA", "R.ID_ROTA", "=", "RA.ID_ROTA")
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

function BuscarTodosAlunosREST() {
    return restImpl.dbGETColecao(DB_TABLE_ALUNO);
}

function BuscarAlunosREST(id) {
    return restImpl.dbGETEntidade(DB_TABLE_ALUNO, "/" + id);
}

function InserirAlunoREST(alunoJSON, idEscola, idRota) {
    return restImpl.dbPOST(DB_TABLE_ALUNO, "", alunoJSON)
        .then((res) => {
            let promisses = [];

            if (res?.data?.messages?.id) {
                let idAluno = res.data.messages.id;

                if (idEscola != 0) {
                    promisses.push(restImpl.dbPOST(DB_TABLE_ALUNO, "/" + idAluno + "/escola", {
                        "id_escola": Number(idEscola),
                    }))
                }
    
                if (idRota != 0) {
                    promisses.push(restImpl.dbPOST(DB_TABLE_ALUNO, "/" + idAluno + "/rota", {
                        "id_rota": Number(idRota),
                    }))
                }
            }

            return Promise.all(promisses)
        })
}

function AtualizarAlunoREST(alunoJSON, idAluno, idEscola, idEscolaAnterior, idRota, idRotaAnterior) {
    let promessasBasicas = [];

    // Atualiza aluno
    promessasBasicas.push(restImpl.dbPUT(DB_TABLE_ALUNO, "/" + idAluno, alunoJSON))

    // Muda escola se mudou
    if (idEscola != idEscolaAnterior && idEscolaAnterior != 0) {
        promessasBasicas.push(restImpl.dbDELETE(DB_TABLE_ALUNO, "/" + idAluno + "/escola"));
    }

    // Mesma lógica da entidade escola para rota
    if (idRota != idRotaAnterior && idRotaAnterior != 0) {
        promessasBasicas.push(restImpl.dbDELETE(DB_TABLE_ALUNO, "/" + idAluno + "/rota"));
    }

    return Promise.all(promessasBasicas)
        .then(() => {
            let promessasNovasRelacoes = [];

            // Muda escola se mudou 
            // Insere caso seja dif de 0 (sem escola)
            if (idEscola != idEscolaAnterior && idEscola != 0) {
                promessasNovasRelacoes.push(restImpl.dbPOST(DB_TABLE_ALUNO, "/" + idAluno + "/escola", {
                    id_escola: Number(idEscola)
                }));
            }

            // Mesma lógica da entidade escola para rota
            if (idRota != idRotaAnterior && idRota != 0) {
                promessasNovasRelacoes.push(restImpl.dbPOST(DB_TABLE_ALUNO, "/" + idAluno + "/rota", {
                    id_rota: Number(idRota)
                }))
            }
            return Promise.all(promessasNovasRelacoes)
        })
}
