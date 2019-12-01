// Preenchimento da Tabela via SQL
var listaDeAlunos = new Map();

// Dados para serem plotados
var dataEscola = { series: [], labels: [] };
var dataAtendimento = { series: [], labels: ["Sem atendimento", "Atendidos"] };
var dataRota = { series: [], labels: [] };
var dataNivel = { series: [], labels: ["Creche", "Fundamental", "Médio", "Superior", "Outro"] };
var dataTurno = { series: [], labels: ["Manhã", "Tarde", "Integral", "Noturno"] };
var dataResidencia = { series: [], labels: ["Área Urbana", "Área Rural"] };
var dataCor = { series: [], labels: ["Amarelo", "Branco", "Indígena", "Pardo", "Preto"] };
var dataGenero = { series: [], labels: ["Masculino", "Feminino"] };
var dataResponsavel = { series: [], labels: ["Pai, Mãe, Padrasto ou Madrasta", "Avô ou Avó", "Irmão ou Irmã", "Outrou Parente"] };

function CalcularEstatisticas() {
    var totalAlunos = listaDeAlunos.size;
    var statNumAtendidos = 0;
    var statEscolas = {};
    var statRotas = {};
    var statTurno = { 1: 0, 2: 0, 3: 0, 4: 0 }
    var statLocalizacao = { 1: 0, 2: 0 }
    var statNivel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    var statCor = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    var statGenero = { 1: 0, 2: 0, 3: 0 }
    var statResponsavel = { 0: 0, 1: 0, 2: 0, 4: 0 }

    listaDeAlunos.forEach((aluno) => {
        statTurno[aluno["TURNO"]] = statTurno[aluno["TURNO"]] + 1;
        statLocalizacao[aluno["MEC_TP_LOCALIZACAO"]] = statLocalizacao[aluno["MEC_TP_LOCALIZACAO"]] + 1;
        statNivel[aluno["NIVEL"]] = statNivel[aluno["NIVEL"]] + 1;
        statCor[aluno["COR"]] = statCor[aluno["COR"]] + 1;
        statGenero[aluno["SEXO"]] = statGenero[aluno["SEXO"]] + 1;
        statResponsavel[aluno["GRAU_RESPONSAVEL"]] = statResponsavel[aluno["GRAU_RESPONSAVEL"]] + 1;

        if (statRotas[aluno["ROTA"]] == null || statRotas[aluno["ROTA"]] == undefined) {
            statRotas[aluno["ROTA"]] = 0;
        }
        statRotas[aluno["ROTA"]] = statRotas[aluno["ROTA"]] + 1;

        if (aluno["ROTA"] != "Sem rota cadastrada") {
            statNumAtendidos++;
        }

        if (statEscolas[aluno["ESCOLA"]] == null || statEscolas[aluno["ESCOLA"]] == undefined) {
            statEscolas[aluno["ESCOLA"]] = 0;
        }
        statEscolas[aluno["ESCOLA"]] = statEscolas[aluno["ESCOLA"]] + 1;
    })

    for (let i in statEscolas) {
        dataEscola["series"].push(statEscolas[i]);
        dataEscola["labels"].push(i);
    }

    dataAtendimento["series"] = [(totalAlunos - statNumAtendidos), statNumAtendidos]
    dataNivel["series"] = [statNivel[1], statNivel[2], statNivel[3], statNivel[4], statNivel[5]]
    dataTurno["series"] = [statTurno[1], statTurno[2], statTurno[3], statTurno[4]]
    dataResidencia["series"] = [statLocalizacao[1], statLocalizacao[2]]
    dataCor["series"] = [statCor[1], statCor[2], statCor[3], statCor[4], statCor[5]]
    dataGenero["series"] = [statGenero[1], statGenero[2], statGenero[3]]
    dataResponsavel["series"] = [statResponsavel[0], statResponsavel[1], statResponsavel[2], statResponsavel[4]]
}

var listaDeOpcoesRelatorio = {
    "atendimento": {
        TXTMENU: "Atendimento",
        SERIE: dataAtendimento,
        TITULO: "Número de Alunos Atendidos (Cadastrados no Sistema)",
        TIPO: "pizza",
        FILTER: "ESCOLA"
    },
    "escolas": {
        TXTMENU: "Escolas",
        SERIE: dataEscola,
        TITULO: "Número de Alunos por Escola",
        TIPO: "barra"
    },
    "rota": {
        TXTMENU: "Rota",
        SERIE: dataRota,
        TITULO: "Número de Alunos por Rota",
        TIPO: "barra"
    },
    "nivel": {
        TXTMENU: "Nível de Escolaridade",
        SERIE: dataNivel,
        TITULO: "Distribuição de Alunos por Nível de Escolaridade",
        TIPO: "barra"
    },
    "turno": {
        TXTMENU: "Turno de Aula",
        SERIE: dataTurno,
        TITULO: "Distribuição de Alunos por Turno de Ensino",
        TIPO: "pizza"
    },
    "residencia": {
        TXTMENU: "Área de Residência",
        SERIE: dataResidencia,
        TITULO: "Númedro de Alunos por Localização",
        TIPO: "pizza"
    },
    "cor": {
        TXTMENU: "Cor",
        SERIE: dataCor,
        TITULO: "Número de Alunos por Cor/Raça",
        TIPO: "pizza"
    },
    "genero": {
        TXTMENU: "Gênero",
        TITULO: "Número de Alunos por Sexo",
        SERIE: dataGenero,
        TIPO: "pizza"
    },
    "responsavel": {
        TXTMENU: "Responsável",
        SERIE: dataResponsavel,
        TITULO: "Número de Alunos por Categoria de Responsável",
        TIPO: "pizza",
        LEGENDA_GRANDE: true
    },
}

GetTemplateMenu("#menuRelatorio", listaDeOpcoesRelatorio)

$("#menuRelatorio a.list-group-item").click((e) => {
    e.preventDefault()
    var $that = $(e.target);
    $($that).parent().find('a').removeClass('active');
    $that.addClass('active');

    var optName = $that.attr('name');
    var opt = listaDeOpcoesRelatorio[optName];

    // Titulo
    $(".card-title").html(opt["TITULO"]);

    // Grafico
    plotGraphic("#grafico", opt);

    // Legenda
    $("#legendPlace").empty();
    var isLong = false;
    if (opt["LEGENDA_GRANDE"]) isLong = true;
    if (opt["TIPO"] == "pizza") {
        plotLegend("#legendPlace", opt["SERIE"]["labels"], isLong)
    }
});

// DataTables
var defaultTableConfig = GetTemplateDataTableConfig();
defaultTableConfig["columns"] = [
    { data: 'NOME', width: "25%" },
    { data: 'LOCALIZACAO', width: "18%" },
    { data: 'ROTA', width: "15%" },
    { data: 'ESCOLA', width: "20%" },
    { data: 'NIVELSTR', width: "200px" },
    { data: 'TURNOSTR', width: "200px" },
    // {
    //     data: "ACOES",
    //     width: "200px !important",
    //     sortable: false,
    //     defaultContent: '<a href="#" class="btn btn-link btn-primary alunoView"><i class="fa fa-search"></i></a>' +
    //         '<a href="#" class="btn btn-link btn-warning alunoEdit"><i class="fa fa-edit"></i></a>' +
    //         '<a href="#" class="btn btn-link btn-danger alunoRemove"><i class="fa fa-times"></i></a>'
    // }
]

defaultTableConfig["columnDefs"] = [
    {
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    },
    {
        targets: 2,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    }
];

var dataTablesAlunos = $("#datatables").DataTable(defaultTableConfig)

dataTablesAlunos.on('click', '.alunoView', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "visualizarAluno";
    navigateDashboard("./modules/aluno/aluno-dados-view.html");
});

dataTablesAlunos.on('click', '.alunoEdit', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "editarAluno";
    navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
});

dataTablesAlunos.on('click', '.alunoRemove', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "apagarAluno";
    Swal2.fire({
        title: 'Remover esse aluno?',
        text: "Ao remover esse aluno ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverAluno(estadoAluno["ID_ALUNO"], (err, result) => {
                if (result) {
                    dataTablesAlunos.row($tr).remove();
                    dataTablesAlunos.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Aluno removido com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                } else {
                    Swal2.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Tivemos algum problema. Por favor, reinicie o software!',
                    });
                }
            });
        }
    })
});

// Função para relatar erro
var errorFnAlunos = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar os alunos! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

// Callback para pegar número de alunos da escola
var listarEscolasAlunosCB = (err, result) => {
    if (err) {
        errorFnAlunos(err);
    } else {
        for (let alunoRaw of result) {
            let aID = alunoRaw["ID_ALUNO"];
            let eID = alunoRaw["ID_ESCOLA"];
            let eNome = alunoRaw["NOME"];

            let alunoJSON = listaDeAlunos.get(aID);
            alunoJSON["ID_ESCOLA"] = eID;
            alunoJSON["ESCOLA"] = eNome;
            alunoJSON["ESCOLA_LOC_LATITUDE"] = alunoRaw["LOC_LATITUDE"];
            alunoJSON["ESCOLA_LOC_LONGITUDE"] = alunoRaw["LOC_LONGITUDE"];
            alunoJSON["ESCOLA_MEC_CO_UF"] = alunoRaw["MEC_CO_UF"];
            alunoJSON["ESCOLA_MEC_CO_MUNICIPIO"] = alunoRaw["MEC_CO_MUNICIPIO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO"] = alunoRaw["MEC_TP_LOCALIZACAO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = alunoRaw["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
            alunoJSON["ESCOLA_CONTATO_RESPONSAVEL"] = alunoRaw["CONTATO_RESPONSAVEL"];
            alunoJSON["ESCOLA_CONTATO_TELEFONE"] = alunoRaw["CONTATO_TELEFONE"];

            listaDeAlunos.set(aID, alunoJSON);
        }

        ListarRotasDeAlunosPromise()
            .then((res) => {
                res.forEach((a) => {
                    let aID = a["ID_ALUNO"];
                    let alunoJSON = listaDeAlunos.get(aID);

                    alunoJSON["ROTA"] = a["NOME"];
                    listaDeAlunos.set(aID, alunoJSON);
                })

                listaDeAlunos.forEach((aluno) => {
                    dataTablesAlunos.row.add(aluno);
                });

                dataTablesAlunos.draw();
                CalcularEstatisticas();
            })
    }
};

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFnAlunos(err);
    } else {
        $("#totalNumAlunos").text(result.length);

        for (let alunoRaw of result) {
            let alunoJSON = parseAlunoDB(alunoRaw);
            listaDeAlunos.set(alunoJSON["ID_ALUNO"], alunoJSON);
        }

        ListarEscolasDeAlunos(listarEscolasAlunosCB);
    }
};

BuscarTodosAlunos(listaInicialCB);

action = "relatorioAluno";