// escola-listar-ctrl.js
// Este arquivo contém o script de controle da tela escola-listar-view. O memso
// apresenta as escoladas cadastras em uma tabela. Para tal, é feito uma consulta
// das escolas no banco de dados. Também é feito consultas nos dados de alunos para
// correlacionar o quantitativo de alunos por escola

// Variável que armazena as escolas que serão apresentadas (será preenchida)
var listaDeEscolas = new Map();

// Configura o DataTables
var dataTableEscolas = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadraoFem("escola"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "20%" },
            { data: 'LOCALIZACAO',  width: "15%" },
            { data: 'GEOREF', width: "250px" },
            { data: 'ENSINO', width: "10%" },
            { data: 'HORARIO', width: "250px" },
            { data: 'NUM_ALUNOS', width: "250px" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-info escolaStudent"><i class="fa fa-user"></i></a>' +
                                '<a href="#" class="btn btn-link btn-primary escolaView"><i class="fa fa-search"></i></a>' +
                                '<a href="#" class="btn btn-link btn-warning escolaEdit"><i class="fa fa-edit"></i></a>' +
                                '<a href="#" class="btn btn-link btn-danger escolaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1, type: 'locale-compare', render: renderAtMostXCharacters(50) },
        ],
        buttons: [
            {
                text: 'Remover escolas',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTableEscolas.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos uma escola a ser removida.", "",
                                "Nenhuma escola selecionada")
                    } else {
                        let msg = `Você tem certeza que deseja remover as ${rawDados.length} escolas selecionadas?`;
                        let msgConclusao = "As escolas foram removidas com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover a escola selecionada?`;
                            msgConclusao = "A escola foi removida com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then((res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removendo as escolas da base de dados...",
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

                                rawDados.forEach(escola => {
                                    promiseArray.push(dbRemoverDadoPorIDPromise(DB_TABLE_ESCOLA, "ID_ESCOLA", escola["ID"])
                                        .then(() => updateProgress())
                                    );

                                    // Remove o vínculo com os alunos
                                    remotedb.collection("municipios")
                                    .doc(codCidade)
                                    .collection(DB_TABLE_ESCOLA_TEM_ALUNOS)
                                    .where("ID_ESCOLA", "==", escola["ID"])
                                    .get({ source: "cache" })
                                    .then((snapshotDocumentos) => {
                                        updateProgress()
                                        snapshotDocumentos.forEach(doc => { promiseArray.push(doc.ref.delete()) })
                                    })

                                    // Remove a escola das rotas
                                    remotedb.collection("municipios")
                                    .doc(codCidade)
                                    .collection(DB_TABLE_ROTA_PASSA_POR_ESCOLA)
                                    .where("ID_ESCOLA", "==", escola["ID"])
                                    .get({ source: "cache" })
                                    .then((snapshotDocumentos) => {
                                        updateProgress()
                                        snapshotDocumentos.forEach(doc => { promiseArray.push(doc.ref.delete()) })
                                    })
                                })

                                promiseArray.push(dbAtualizaVersao().then(() => updateProgress()));

                                Promise.all(promiseArray)
                                .then(() => {
                                    successDialog(text = msgConclusao);
                                    dataTableEscolas.rows('.selected').remove();
                                    dataTableEscolas.draw();
                                })
                            }
                        })
                        .catch((err) => {
                            Swal2.close()
                            errorFn("Erro ao remover as escolas", err)
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
                title: "Escolas cadastradas",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
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
});

$("#datatables_filter input").on('keyup', function () {
    dataTableEscolas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

dataTableEscolas.on('click', '.escolaStudent', function () {
    var $tr = getRowOnClick(this);
    
    estadoEscola = dataTableEscolas.row($tr).data();
    action = "gerirAlunosEscola";
    navigateDashboard("./modules/escola/escola-gerir-alunos-view.html");
});

dataTableEscolas.on('click', '.escolaView', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "visualizarEscola";
    navigateDashboard("./modules/escola/escola-dados-view.html");
});

dataTableEscolas.on('click', '.escolaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "editarEscola";
    navigateDashboard("./modules/escola/escola-cadastrar-view.html");
});

dataTableEscolas.on('click', '.escolaRemove', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "apagarEscola";
    confirmDialog('Remover essa escola?',
                  "Ao remover uma escola os alunos remanescentes da mesma " + 
                  "deverão ser alocados novamente a outra(s) escola(s)."
    ).then((result) => {
        let listaPromisePraRemover = []
        if (result.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ESCOLA, "ID_ESCOLA", estadoEscola["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", estadoEscola["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", estadoEscola["ID"]));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTableEscolas.row($tr).remove();
            dataTableEscolas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Aluno(a) removido(a) com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a escola", err))
});


dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA)
.then(res => preprocessarEscolas(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA_TEM_ALUNOS))
.then((res) => preprocessarRelacaoEscolaAluno(res))
.then((res) => adicionaDadosTabela(res))
.catch((err) => errorFn("Erro ao listar as escolas!", err))

// Preprocessa alunos
var preprocessarEscolas = (res) => {
    $("#totalNumEscolas").text(res.length);
    for (let escolaRaw of res) {
        let escolaJSON = parseEscolaDB(escolaRaw);
        escolaJSON["NUM_ALUNOS"] = 0;
        listaDeEscolas.set(escolaJSON["ID"], escolaJSON);
    }
    return listaDeEscolas;
}

// Preprocessa relação de escolas e alunos para pegar o quantitativo entre eles
var preprocessarRelacaoEscolaAluno = (res) => {
    for (let relEscolaAluno of res) {
        let eID = relEscolaAluno["ID_ESCOLA"];
        if (listaDeEscolas.has(eID)) {
            let escolaJSON = listaDeEscolas.get(eID);
            escolaJSON["NUM_ALUNOS"] = escolaJSON["NUM_ALUNOS"] + 1;
            listaDeEscolas.set(eID, escolaJSON);
        }
    }

    return listaDeEscolas;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((escola) => {
        escola["SELECT"] = i++;
        dataTableEscolas.row.add(escola);
    });

    dataTableEscolas.draw();
    dtInitFiltros(dataTableEscolas, [2, 3, 4, 5, 6]);
}

action = "listarEscola"