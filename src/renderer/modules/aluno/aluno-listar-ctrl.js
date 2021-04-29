// aluno-listar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-listar-view. O memso
// apresenta os alunos cadastrados em uma tabela. Para tal, é feito uma consulta
// dos alunos no banco de dados. Também é feito consultas nos dados de escolas e
// coleções para apresentar dados adicionais na tabela dos alunos

// Variável que armazena os alunos apresentados (será preenchida)
var listaDeAlunos = new Map();

// Configura o DataTables
var defaultTableConfig = {
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("aluno"),
    ...{
        // dom: 'rtilpB',
        dom: "rti<'row'<'col-6 mt-3'l><'col-6 mt-3'´p>><'row'<'col-12 mt-2'B>>",
        select: {
            style: 'multi',
            info: false
        },
        buttons: [
            {
                text: 'Remover alunos',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesAlunos.rows('.selected').data().toArray();
                    debugger
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um aluno a ser removido.", "",
                            "Nenhum aluno selecionado")
                    } else {
                        goaheadDialog('Você tem certeza que deseja remover os alunos selecionados?',
                            "Você irá apagar " + rawDados.length + " alunos do banco de dados.")
                            .then((res) => {
                                debugger
                                if (res.isConfirmed) {
                                    Swal2.fire({
                                        title: "Removendo os alunos do sistema...",
                                        imageUrl: "img/icones/processing.gif",
                                        closeOnClickOutside: false,
                                        allowOutsideClick: false,
                                        showConfirmButton: false,
                                        html: `
                                    <br />
                                    <div class="progress" style="height: 20px;">
                                        <div id="pbar" class="progress-bar" role="progressbar" 
                                             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
                                             style="width: 0%;">
                                        </div>
                                    </div>
                                    `
                                    })

                                    var progresso = 0;
                                    var max = rawDados.length * 3 + 1;

                                    function updateProgress() {
                                        progresso++;
                                        var progressPorcentagem = Math.round(100 * (progresso / max))

                                        $('.progress-bar').css('width', progressPorcentagem + "%")
                                    }

                                    var promiseArray = new Array();

                                    rawDados.forEach(a => {
                                        promiseArray.push(dbRemoverDadoPorIDPromise(DB_TABLE_ALUNO, "ID_ALUNO", a["ID"])
                                            .then(() => updateProgress())
                                        );
                                        promiseArray.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ALUNO", a["ID"])
                                            .then(() => updateProgress())
                                        );
                                        promiseArray.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", a["ID"])
                                            .then(() => updateProgress())
                                        );
                                    })


                                    promiseArray.push(dbAtualizaVersao().then(() => updateProgress()));

                                    Promise.all(promiseArray)
                                    .then(() => {
                                        successDialog(text = "Os alunos foram removidos com sucesso.");
                                        dataTablesAlunos.rows('.selected').remove();
                                        dataTablesAlunos.draw();
                                    })
                                }
                            })
                            .catch((err) => {
                                Swal2.close()
                                errorFn("Erro ao remover os alunos", err)
                            })
                    }
                }
            },
            {
                extend: 'excel',
                className: 'btnExcel',
                filename: "Relatorio",
                title: appTitle,
                text: 'Exportar para Planilha',
                customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];
                    $('row c[r^="A"]', sheet).attr('s', '2');
                    $('row[r="1"] c[r^="A"]', sheet).attr('s', '27');
                    $('row[r="2"] c[r^="A"]', sheet).attr('s', '3');
                }
            },
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Alunos cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 4, 5, 6, 7, 8]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['30%', '15%', '20%', '20%', '15%'];
                    doc.images = doc.images || {};
                    doc.images["logo"] = baseImages.get("logo");
                    doc.content.splice(1, 0, {
                        alignment: 'center',
                        margin: [0, 0, 0, 12],
                        image: "logo"
                    });
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
}

defaultTableConfig["columns"] = [
    { data: "SELECT", width: "5%" },
    { data: 'NOME', width: "20%" },
    { data: 'SEXOSTR' },
    { data: 'CORSTR' },
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
        "targets": [2, 3],
        "visible": false,
        "searchable": true
    },
    { targets: 0, 'checkboxes': { 'selectRow': true } },
    { targets: 1, render: renderAtMostXCharacters(50) },
    { targets: 5, render: renderAtMostXCharacters(50) },
];

var dataTablesAlunos = $("#datatables").DataTable(defaultTableConfig)

function filtroAtendimento() {
    $("#listaFiltroRelatorio").append(`<option value="Sem rota cadastrada">Sem Atendimento</option>`);
    $("#listaFiltroRelatorio").append(`<option value="ROTA">Com Atendimento</option>`);
}

function filtroEscola() {
    var labels = listaDeOpcoesFiltro["escolas"]["LABELS"];
    for (let i = 0; i < labels.length; i++) {
        $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
    }
}

function filtroRota() {
    var labels = listaDeOpcoesFiltro["rota"]["LABELS"];
    for (let i = 0; i < labels.length; i++) {
        $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
    }
}

var listaDeOpcoesFiltro = {
    "atendimento": {
        TXTMENU: "Atendimento",
        CUSTOM: true,
        CUSTOMFN: filtroAtendimento,
        LABELS: ["Sem rota cadastrada", "Com rota cadastrada"]
    },
    "escolas": {
        TXTMENU: "Escolas",
        CUSTOM: true,
        CUSTOMFN: filtroEscola,
        LABELS: []
    },
    "rota": {
        TXTMENU: "Rota",
        CUSTOM: true,
        CUSTOMFN: filtroRota,
        LABELS: []
    },
    "nivel": {
        TXTMENU: "Nível de Escolaridade",
        FILTRO: "NIVELSTR",
        LABELS: ["Creche", "Fundamental", "Médio", "Superior", "Outro"]
    },
    "turno": {
        TXTMENU: "Turno de Aula",
        FILTRO: "TURNOSTR",
        LABELS: ["Manhã", "Tarde", "Integral", "Noturno"]
    },
    "residencia": {
        TXTMENU: "Área de Residência",
        FILTRO: "LOCALIZACAO",
        LABELS: ["Área Urbana", "Área Rural"]
    },
    "cor": {
        TXTMENU: "Cor",
        LABELS: ["Não informado", "Branco", "Preto", "Pardo", "Amarelo", "Indígena"]
    },
    "genero": {
        TXTMENU: "Gênero",
        LABELS: ["Masculino", "Feminino", "Não Informado"]
    },
}

$("#campoFiltro").on('keyup', (e) => {
    dataTablesAlunos.search(e.target.value, false, true, true).draw()
})

$("#listaTipoRelatorio").on('change', (e) => {
    var $that = $(e.target);
    var optName = $that.val();
    var opt = listaDeOpcoesFiltro[optName];

    $("#listaFiltroRelatorio").empty();
    $("#listaFiltroRelatorio").append(`<option value="">Selecione uma opção ...</option>`);
    var labels = opt["LABELS"];

    if (opt["CUSTOM"]) {
        opt["CUSTOMFN"]();
    } else {
        for (let i = 0; i < labels.length; i++) {
            $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
        }
    }

    dataTablesAlunos.search("", false, true, false).draw();

    $("#listaFiltroRelatorio").on('change', (e) => {
        var filtroValue = $(e.currentTarget).val();
        var optValue = listaDeOpcoesFiltro[$("#listaTipoRelatorio").val()];

        if (optValue["CUSTOM"]) {
            dataTablesAlunos.search(filtroValue).draw();
        } else {
            dataTablesAlunos.search(filtroValue, false, true, false).draw();
        }
    })
})


function SetMainFilterMenu(selectID, items) {
    for (let i in items) {
        if (items[i]["FILTRO"] != "") {
            $(selectID).append(`<option value="${i}">${items[i]["TXTMENU"]}</option>`);
        }
    }
}

SetMainFilterMenu("#listaTipoRelatorio", listaDeOpcoesFiltro);

$("#datatables_filter input").on('keyup', function () {
    dataTablesAlunos.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

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


dbBuscarTodosDadosPromise(DB_TABLE_ALUNO)
    .then(res => preprocessarAlunos(res))
    .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA))
    .then(res => preprocessarEscolas(res))
    .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ROTA))
    .then(res => preprocessarRotas(res))
    .then(() => dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
    .then(res => preprocessarEscolasTemAlunos(res))
    .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", DB_TABLE_ROTA, "ID_ROTA"))
    .then(res => preprocessarRotaTemAlunos(res))
    .then((res) => adicionaDadosTabela(res))
    .catch((err) => errorFn(err))

// Preprocessa alunos
var preprocessarAlunos = (res) => {
    $("#totalNumAlunos").text(res.length);
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoDB(alunoRaw);
        listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
    }
    return listaDeAlunos;
}

// Preprocessa escolas (adiciona nos filtros)
var preprocessarEscolas = (res) => {
    for (let escolaRaw of res) {
        listaDeOpcoesFiltro["escolas"]["LABELS"].push(escolaRaw["NOME"])
    }

    return listaDeOpcoesFiltro;
}

// Preprocessa rotas (adiciona nos filtros)
var preprocessarRotas = (res) => {
    for (let rotaRaw of res) {
        listaDeOpcoesFiltro["rota"]["LABELS"].push(rotaRaw["NOME"])
    }

    return listaDeOpcoesFiltro;
}

// Preprocessa escolas tem aluno
var preprocessarEscolasTemAlunos = (res) => {
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

// Preprocessa rota tem aluno
var preprocessarRotaTemAlunos = (res) => {
    res.forEach((rota) => {
        let aID = rota["ID_ALUNO"];
        let alunoJSON = listaDeAlunos.get(aID);

        alunoJSON["ROTA"] = "ROTA " + rota["NOME"];
        listaDeAlunos.set(aID, alunoJSON);
    })

    return listaDeAlunos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((aluno) => {
        aluno["SELECT"] = i++;
        dataTablesAlunos.row.add(aluno);
    });

    dataTablesAlunos.draw();
    $("#listaTipoRelatorio").val("atendimento").trigger("change");
}

action = "listarAluno";