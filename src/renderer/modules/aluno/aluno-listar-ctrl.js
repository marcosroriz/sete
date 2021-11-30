// aluno-listar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-listar-view. O memso
// apresenta os alunos cadastrados em uma tabela. Para tal, é feito uma consulta
// dos alunos no banco de dados. Também é feito consultas nos dados de escolas e
// coleções para apresentar dados adicionais na tabela dos alunos

// Variável que armazena os alunos apresentados (será preenchida)
var listaDeAlunos = new Map();

// Variável que armazena o número de alunos
var numAlunos = 0;

// Configura o DataTables
var defaultTableConfig = {
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("aluno"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[ 1, "asc" ]],
        buttons: [
            {
                text: 'Remover alunos',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesAlunos.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um aluno a ser removido.", "",
                                "Nenhum aluno selecionado")
                    } else {
                        let msg = `Você tem certeza que deseja remover os ${rawDados.length} alunos selecionados?`;
                        let msgConclusao = "Os alunos foram removidos com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover o aluno selecionado?`;
                            msgConclusao = "O aluno foi removido com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then((res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removendo os alunos da base de dados...",
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
                                var max = rawDados.length;

                                function updateProgress() {
                                    progresso++;
                                    var progressPorcentagem = Math.round(100 * (progresso / max))

                                    $('.progress-bar').css('width', progressPorcentagem + "%")
                                }

                                var promiseArray = new Array();

                                rawDados.forEach(a => {
                                    promiseArray.push(restImpl.dbDELETE(DB_TABLE_ALUNO, `/${a.ID}`).then(() => updateProgress()));
                                })

                                Promise.all(promiseArray)
                                .then((res) => {
                                    successDialog(text = msgConclusao);
                                    dataTablesAlunos.rows('.selected').remove();
                                    dataTablesAlunos.draw();

                                    numAlunos = numAlunos - rawDados.length;
                                    $("#totalNumAlunos").text(String(numAlunos));
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
                exportOptions: {
                    columns: [ 1, 2, 3, 4, 5, 6, 7 ]
                },
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
                    doc.content[1].table.widths = ['30%', '12%', '8%', '20%', '20%', '10%'];
                    doc = docReport(doc);
                    
                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    // TODO: Melhorar header
                    doc.content[2].text = listaDeAlunos?.size + " " + doc.content[2].text;
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
}

defaultTableConfig["columns"] = [
    { data: "SELECT", width: "60px" },
    { data: 'NOME', width: "15%" },
    { data: 'SEXOSTR' },
    { data: 'CORSTR' },
    { data: 'LOCALIZACAO', width: "200px" },
    { data: 'GEOREF', width: "140px" },
    { data: 'ESCOLA', width: "15%" },
    { data: 'NIVELSTR', width: "140px" },
    { data: 'TURNOSTR', width: "140px" },
    { data: 'ROTA', width: "200px" },
    {
        data: "ACOES",
        width: "80px",
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
        let listaPromisePraRemover = [];
        if (result.value) {
            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_ALUNO, `/${estadoAluno.ID}`));
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
.then(res => adicionaDadosTabela(res))
.catch(err => errorFn(err))

// Preprocessa alunos
var preprocessarAlunos = (res) => {
    $("#totalNumAlunos").text(res.length);

    numAlunos = Number(res.length);

    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoREST(alunoRaw);
        listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
    }
    return listaDeAlunos;
}

// Preprocessa escolas tem aluno
var preprocessarEscolasTemAlunos = (res) => {
    for (let escolaRaw of res) {
        let aID = escolaRaw["ID_ALUNO"];
        let eID = escolaRaw["ID_ESCOLA"];
        let eNome = escolaRaw["NOME"];
        
        let alunoJSON = listaDeAlunos.get(aID);
        if (alunoJSON && eID != undefined && eID != "undefined" && eID != null) {
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
    }
    return listaDeAlunos;
};

// Preprocessa rota tem aluno
var preprocessarRotaTemAlunos = (res) => {
    res.forEach((rota) => {
        let aID = rota["ID_ALUNO"];
        let rID = rota["ID_ROTA"];
        let alunoJSON = listaDeAlunos.get(aID);

        if (alunoJSON) {
            alunoJSON["ROTA"] = "ROTA " + rota["NOME"];
            alunoJSON["ID_ROTA"] = rID;
            listaDeAlunos.set(aID, alunoJSON);
        }
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
    dtInitFiltros(dataTablesAlunos, [1, 4, 5, 6, 7, 8, 9]);
}

action = "listarAluno";