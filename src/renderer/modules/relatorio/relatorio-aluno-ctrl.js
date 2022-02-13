// relatorio-aluno-ctrl.js
// Este arquivo contém o script de controle da tela relatorio-aluno-view. 

// Preenchimento da Tabela via SQL
var listaDeAlunos = new Map();
var totalNumEscolas = 0;
var totalNumRotas = 0;

// Grafico atual
var graficoAtual;

// Dados para serem plotados
var dataEscola = { series: [], labels: [] };
var dataEscolaFilter = { series: [], labels: [] };
var dataAtendimento = { series: [], labels: ["Sem rota cadastrada", "Com rota cadastrada"] };
var dataRota = { series: [], labels: [] };
var dataRotaFilter = { series: [], labels: [] };
var dataNivel = { series: [], labels: ["Creche", "Fundamental", "Médio", "Superior", "Outro"] };
var dataTurno = { series: [], labels: ["Manhã", "Tarde", "Integral", "Noturno"] };
var dataResidencia = { series: [], labels: ["Área Urbana", "Área Rural"] };
var dataCor = { series: [], labels: ["Não informado", "Branco", "Preto", "Pardo", "Amarelo", "Indígena"] };
var dataGenero = { series: [], labels: ["Masculino", "Feminino", "Não Informado"] };
var dataResponsavel = { series: [], labels: ["Pai, Mãe, Padrasto ou Madrasta", "Avô ou Avó", "Irmão ou Irmã", "Outro Parente"] };

// DataTables
var defaultTableConfig = GetTemplateDataTableConfig();
defaultTableConfig["columns"] = [
    { data: 'NOME', width: "20%" },
    { data: 'SEXOSTR' },
    { data: 'CORSTR' },
    { data: 'NOME_RESPONSAVEL' },
    { data: 'GRAUSTR' },
    { data: 'LOCALIZACAO', width: "15%" },
    { data: 'ESCOLA', width: "20%" },
    { data: 'NIVELSTR', width: "140px" },
    { data: 'TURNOSTR', width: "140px" },
    { data: 'ROTA', width: "200px" },
    {
        data: "ACOES",
        width: "120px",
        sortable: false,
        defaultContent: '<a href="#" class="btn btn-link btn-primary alunoView"><i class="fa fa-search"></i></a>' +
            '<a href="#" class="btn btn-link btn-warning alunoEdit"><i class="fa fa-edit"></i></a>' +
            '<a href="#" class="btn btn-link btn-danger alunoRemove"><i class="fa fa-times"></i></a>'
    }
]

defaultTableConfig["columnDefs"] = [
    {
        "targets": [1, 2, 3, 4],
        "visible": false,
        "searchable": true
    },
    { targets: 0, render: renderAtMostXCharacters(50) },
    { targets: 5, render: renderAtMostXCharacters(50) }
];

var dataTablesRelatorio = $("#datatables").DataTable(defaultTableConfig)


async function CalcularEstatisticas() {
    var totalAlunos = listaDeAlunos.size;
    var statNumAtendidos = 0;
    var statEscolas = {};
    var statRotas = {};
    var statTurno = { 1: 0, 2: 0, 3: 0, 4: 0 }
    var statLocalizacao = { 1: 0, 2: 0 }
    var statNivel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    var statCor = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    var statGenero = { 1: 0, 2: 0, 3: 0 }
    var statResponsavel = { 0: 0, 1: 0, 2: 0, 4: 0 }

    for (let alunoRaw of listaDeAlunos.values()) {
        // let aluno = parseAlunoREST(await restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${alunoRaw.id_aluno}`))
        let aluno = alunoRaw;
        statTurno[aluno["turno"]] = statTurno[aluno["turno"]] + 1;
        statLocalizacao[aluno["mec_tp_localizacao"]] = statLocalizacao[aluno["mec_tp_localizacao"]] + 1;
        statNivel[aluno["nivel"]] = statNivel[aluno["nivel"]] + 1;
        statCor[aluno["cor"]] = statCor[aluno["cor"]] + 1;
        statGenero[aluno["sexo"]] = statGenero[aluno["sexo"]] + 1;
        // statResponsavel[aluno["GRAU_RESPONSAVEL"]] = statResponsavel[aluno["GRAU_RESPONSAVEL"]] + 1;

        if (statRotas[aluno["rota"]] == null || statRotas[aluno["rota"]] == undefined) {
            statRotas[aluno["rota"]] = 0;
        }
        statRotas[aluno["rota"]] = statRotas[aluno["rota"]] + 1;

        if (aluno["rota"] != "Não Informada") {
            statNumAtendidos++;
        }

        // 
        if (aluno["escola"] != "Não Informada") {
            if (statEscolas[aluno["escola"]] == null || statEscolas[aluno["escola"]] == undefined) {
                statEscolas[aluno["escola"]] = 0;
            }
            statEscolas[aluno["escola"]] = statEscolas[aluno["escola"]] + 1;
        }
    }

    for (let i in statRotas) {
        dataRotaFilter["series"].push(statRotas[i]);
        dataRotaFilter["labels"].push(i);
    }
    if (totalNumRotas != 0) {
        dataRota["series"].push(statNumAtendidos / totalNumRotas);
    } else {
        dataRota["series"].push(0);
    }
    dataRota["labels"].push("Número médio de alunos transportados por rota");

    for (let i in statEscolas) {
        dataEscolaFilter["series"].push(statEscolas[i]);
        dataEscolaFilter["labels"].push(i);
    }
    if (totalNumEscolas != 0) {
        dataEscola["series"].push(statNumAtendidos / totalNumEscolas);
    } else {
        dataEscola["series"].push(0);
    }
    dataEscola["labels"].push("Número médio de alunos transportados por escola");

    dataAtendimento["series"] = [(totalAlunos - statNumAtendidos), statNumAtendidos]
    dataNivel["series"] = [statNivel[1], statNivel[2], statNivel[3], statNivel[4], statNivel[5]]
    dataTurno["series"] = [statTurno[1], statTurno[2], statTurno[3], statTurno[4]]
    dataResidencia["series"] = [statLocalizacao[1], statLocalizacao[2]]
    dataCor["series"] = [statCor[0], statCor[1], statCor[2], statCor[3], statCor[4], statCor[5]]
    dataGenero["series"] = [statGenero[1], statGenero[2], statGenero[3]]
    dataResponsavel["series"] = [statResponsavel[0], statResponsavel[1], statResponsavel[2], statResponsavel[4]]


    $("#listaTipoRelatorio").val("atendimento").trigger("change");
    $("#menuRelatorio :first-child").click();
}

function filtroAtendimento() {
    $("#listaFiltroRelatorio").append(`<option value="Sem rota cadastrada">Sem Atendimento</option>`);
    $("#listaFiltroRelatorio").append(`<option value="ROTA">Com Atendimento</option>`);
}

function filtroEscola() {
    var labels = dataEscolaFilter["labels"];
    for (let i = 0; i < labels.length; i++) {
        $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
    }
}

function filtroRota() {
    var labels = dataRotaFilter["labels"];
    for (let i = 0; i < labels.length; i++) {
        $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
    }
}

var listaDeOpcoesRelatorio = {
    "atendimento": {
        TXTMENU: "Atendimento",
        SERIE: dataAtendimento,
        TITULO: "Porcentagem de Alunos Atendidos (cadastrados no sistema)",
        TIPO: "pizza",
        FILTRO: "ESCOLA",
        CUSTOM: true,
        CUSTOMFN: filtroAtendimento
    },
    "escolas": {
        TXTMENU: "Escolas",
        SERIE: dataEscola,
        TITULO: "Número Médio de Alunos por Escola",
        TIPO: "total",
        FILTRO: "ESCOLA",
        CUSTOM: true,
        CUSTOMFN: filtroEscola
    },
    "rota": {
        TXTMENU: "Rota",
        SERIE: dataRota,
        TITULO: "Número Médio de Alunos por Rota",
        TIPO: "total",
        FILTRO: "ROTA",
        CUSTOM: true,
        CUSTOMFN: filtroRota
    },
    "nivel": {
        TXTMENU: "Nível de Escolaridade",
        SERIE: dataNivel,
        TITULO: "Distribuição de Alunos por Nível de Escolaridade",
        TIPO: "barra",
        FILTRO: "NIVELSTR"
    },
    "turno": {
        TXTMENU: "Turno de Aula",
        SERIE: dataTurno,
        TITULO: "Distribuição de Alunos por Turno de Ensino",
        FILTRO: "TURNOSTR",
        TIPO: "pizza"
    },
    "residencia": {
        TXTMENU: "Área de Residência",
        SERIE: dataResidencia,
        TITULO: "Porcentagem de Alunos por Localização",
        FILTRO: "LOCALIZACAO",
        TIPO: "pizza"
    },
    "cor": {
        TXTMENU: "Cor",
        SERIE: dataCor,
        TITULO: "Porcentagem de Alunos por Cor/Raça",
        TIPO: "pizza"
    },
    "genero": {
        TXTMENU: "Gênero",
        TITULO: "Porcentagem de Alunos por Sexo",
        SERIE: dataGenero,
        TIPO: "pizza"
    },
    "responsavel": {
        TXTMENU: "Responsável",
        SERIE: dataResponsavel,
        TITULO: "Porcentagem de Alunos por Categoria de Responsável",
        TIPO: "pizza",
        LEGENDA_GRANDE: true
    },
}

GetTemplateMenu("#menuRelatorio", listaDeOpcoesRelatorio);
SetMainFilterMenu("#listaTipoRelatorio", listaDeOpcoesRelatorio);

$("#listaTipoRelatorio").change((e) => {
    var $that = $(e.target);
    var optName = $that.val();
    var opt = listaDeOpcoesRelatorio[optName];

    $("#listaFiltroRelatorio").empty();
    $("#listaFiltroRelatorio").append(`<option value="">Selecione uma opção ...</option>`);
    var labels = opt["SERIE"]["labels"];

    if (opt["CUSTOM"]) {
        opt["CUSTOMFN"]();
    } else {
        for (let i = 0; i < labels.length; i++) {
            $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
        }
    }

    dataTablesRelatorio.search("", false, true, false).draw();
    $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);

    $("#listaFiltroRelatorio").change((e) => {
        var filtroValue = $(e.currentTarget).val();
        var optValue = listaDeOpcoesRelatorio[$("#listaTipoRelatorio").val()];

        if (optValue["CUSTOM"]) {
            dataTablesRelatorio.search(filtroValue).draw();
        } else {
            dataTablesRelatorio.search(filtroValue, false, true, false).draw();
        }
        $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);
    })
})

$("#menuRelatorio a.list-group-item").click((e) => {
    $(".card-report").fadeOut(300, () => {
        e.preventDefault()
        var $that = $(e.target);
        $($that).parent().find('a').removeClass('active');
        $that.addClass('active');

        var optName = $that.attr('name');
        var opt = listaDeOpcoesRelatorio[optName];

        // // Titulo
        // $(".card-title").html(opt["TITULO"]);

        // Grafico
        if (graficoAtual?.destroy) {
            graficoAtual.destroy();
        }
        $("#grafico").empty();
        debugger
        graficoAtual = plotGraphic("#grafico", opt);

        // // Legenda
        // $("#legendPlace").empty();
        // var isLong = false;
        // if (opt["LEGENDA_GRANDE"]) isLong = true;
        // if (opt["TIPO"] != "barra") {
        //     plotLegend("#legendPlace", opt["SERIE"]["labels"], isLong)
        // }
        $(".card-report").fadeIn(300);
    });
});

dataTablesRelatorio.on('click', '.alunoView', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesRelatorio.row($tr).data();
    action = "visualizarAluno";
    navigateDashboard("./modules/aluno/aluno-dados-view.html");
});

dataTablesRelatorio.on('click', '.alunoEdit', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesRelatorio.row($tr).data();
    action = "editarAluno";
    navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
});

dataTablesRelatorio.on('click', '.alunoRemove', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesRelatorio.row($tr).data();
    action = "apagarAluno";
    confirmDialog('Remover esse aluno?',
                "Ao remover esse aluno ele será retirado do sistema das rotas " + 
                "e das escolas que possuir vínculo."
    ).then((result) => {
        let listaPromisePraRemover = []
        if (result.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }
        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesAlunos.row($tr).remove();
            dataTablesAlunos.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Aluno(a) removido(a) com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover o(a) aluno(a)", err))
});


restImpl.dbGETColecao(DB_TABLE_ALUNO)
.then(res => preprocessarAlunos(res))
.then(() => restImpl.dbGETColecao(DB_TABLE_ESCOLA))
.then(res => totalNumEscolas = res.length)
.then(() => restImpl.dbGETColecao(DB_TABLE_ROTA))
.then(res => totalNumRotas = res.length)
// .then(() => dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
// .then(res => preprocessarEscolasTemAlunos(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", DB_TABLE_ROTA, "ID_ROTA"))
// .then(res => preprocessarRotaTemAlunos(res))
// .then(res => adicionaDadosTabela(res))
.then(() => CalcularEstatisticas())
.catch((err) => errorFn(err))


// Preprocessa alunos
var preprocessarAlunos = (res) => {
    // $("#totalNumAlunos").text(res.length);
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoREST(alunoRaw);
        alunoJSON["LOCALIZACAO"] = "Área " + alunoJSON["LOCALIZACAO"];

        if (alunoJSON["NOME_RESPONSAVEL"] == undefined || 
            alunoJSON["NOME_RESPONSAVEL"] == null) {
            alunoJSON["NOME_RESPONSAVEL"] = "Não informado";
        }

        listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
    }
    return listaDeAlunos;
}

// Preprocessa escolas
var preprocessarEscolasTemAlunos = (res) => {
    totalNumEscolas = res.length;
    for (let escolaRaw of res) {
        let aID = escolaRaw["ID_ALUNO"];
        let eID = escolaRaw["ID_ESCOLA"];
        let eNome = escolaRaw["NOME"];

        let alunoJSON = listaDeAlunos.get(aID);
        alunoJSON["ID_ESCOLA"] = eID;
        alunoJSON["ESCOLA"] = eNome;
        alunoJSON["ESCOLA_LOC_LATITUDE"] = escolaRaw["LOC_LATITUDE"];
        alunoJSON["ESCOLA_LOC_LONGITUDE"] = escolaRaw["LOC_LONGITUDE"];
        alunoJSON["ESCOLA_MEC_CO_UF"] = escolaRaw["MEC_CO_UF"];
        alunoJSON["ESCOLA_MEC_CO_MUNICIPIO"] = escolaRaw["MEC_CO_MUNICIPIO"];
        alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO"] = escolaRaw["MEC_TP_LOCALIZACAO"];
        alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = escolaRaw["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
        alunoJSON["ESCOLA_CONTATO_RESPONSAVEL"] = escolaRaw["CONTATO_RESPONSAVEL"];
        alunoJSON["ESCOLA_CONTATO_TELEFONE"] = escolaRaw["CONTATO_TELEFONE"];

        listaDeAlunos.set(aID, alunoJSON);
    }
    return listaDeAlunos;
};

// Preprocessa rotas
var preprocessarRotaTemAlunos = (res) => {
    totalNumRotas = res.length;
    res.forEach((rota) => {
        let aID = rota["ID_ALUNO"];
        let alunoJSON =  listaDeAlunos.get(aID);
        
        alunoJSON["ROTA"] = rota["NOME"];
        listaDeAlunos.set(aID, alunoJSON);
    })

    return listaDeAlunos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((aluno) => {
        dataTablesRelatorio.row.add(aluno);
    });

    dataTablesRelatorio.draw();

    return res;
}
action = "relatorioAluno";