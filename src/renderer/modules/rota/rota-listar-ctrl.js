// rota-listar-ctrl.js
// Este arquivo contém o script de controle da tela rota-listar-view. O mesmo
// apresenta as rotas cadastradas em uma tabela. Também é feito uma busca nas
// base de dados de alunos e escolas para conhecer o quantitativo atendido por rota.

// Preenchimento da Tabela via SQL
var listaDeRotas = new Map();

// DataTables
var dataTablesRotas = $("#datatables").DataTable({
    ...dtConfigPadraoFem("rota"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[1, "asc"]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "20%" },
            { data: 'TURNOSTR', width: "10%" },
            { data: 'GPS', width: "300px" },
            { data: 'KMSTR', width: "18%" },
            { data: 'NUMALUNOS', width: "12%" },
            { data: 'NUMESCOLAS', width: "12%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary rotaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning rotaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger rotaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            {
                targets: 1,
                render: {
                    "filter": data => data,
                    "display": renderAtMostXCharacters(50)
                }
            }
        ],
        buttons: [
            {
                text: 'Remover rotas',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesRotas.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos uma rota a ser removida.", "",
                            "Nenhuma rota selecionada")
                    } else {
                        let msg = `Você tem certeza que deseja remover as ${rawDados.length} rotas selecionadas?`;
                        let msgConclusao = "As rotas foram removidas com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover a rota selecionada?`;
                            msgConclusao = "A rota foi removida com sucesso";
                        }

                        goaheadDialog(msg, "Esta operação é irreversível. Você tem certeza?")
                            .then((res) => {
                                if (res.isConfirmed) {
                                    Swal2.fire({
                                        title: "Removendo as rotas da base de dados...",
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

                                    rawDados.forEach(rota => {
                                        promiseArray.push(
                                            restImpl.dbDELETE(DB_TABLE_ROTA, `/${rota.ID}`)
                                                .then(() => updateProgress())
                                        );
                                    })

                                    Promise.all(promiseArray)
                                        .then(() => {
                                            successDialog(text = msgConclusao);
                                            dataTablesRotas.rows('.selected').remove();
                                            dataTablesRotas.draw();
                                        })
                                }
                            })
                            .catch((err) => {
                                Swal2.close()
                                console.log(err)
                                errorFn("Erro ao remover as rotas", err)
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
                    columns: [1, 2, 3, 4, 5, 6]
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
                title: "Rotas cadastradas",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4, 5, 6]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['50%', '10%', '10%', '10%', '10%', '10%'];
                    doc = docReport(doc);

                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    doc.content[2].text = listaDeRotas?.size + " " + doc.content[2].text;
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ],
    }
});

dataTablesRotas.on('click', '.rotaView', function () {
    let $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "visualizarRota";
    navigateDashboard("./modules/rota/rota-dados-view.html");
});

dataTablesRotas.on('click', '.rotaEdit', function () {
    let $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "editarRota";
    navigateDashboard("./modules/rota/rota-cadastrar-view.html");
});

dataTablesRotas.on('click', '.rotaRemove', function () {
    let $tr = getRowOnClick(this);
    estadoRota = dataTablesRotas.row($tr).data();
    action = "apagarRota";
    confirmDialog("Remover essa rota?",
        "Ao remover essa rota ela será retirado do sistema e os alunos e "
        + "escolas que possuir vínculo deverão ser rearranjadas novamente."
    ).then((res) => {
        let listaPromisePraRemover = [];
        if (res?.value) {
            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_ROTA, `/${estadoRota.ID}`));
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesRotas.row($tr).remove();
            dataTablesRotas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Rota removida com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a rota", err))
});


restImpl.dbGETColecao(DB_TABLE_ROTA)
.then(res => processarRotas(res))
.then((res) => adicionaDadosTabela(res))
.catch((err) => {
    console.log(err)
    errorFn("Erro ao listar as rotas!", err)
})

// .then((res) => adicionaDadosTabela(res))
// .catch((err) => errorFn("Erro ao listar as escolas!", err))
// dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
// .then(res => processarRotas(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO"))
// .then((res) => processarAlunosPorRota(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
// .then((res) => processarEscolasPorRota(res))
// .then((res) => adicionaDadosTabela(res))
// .catch((err) => errorFn("Erro ao listar as escolas!", err))

// Processar rotas
var processarRotas = (res) => {
    for (let rotaRaw of res) {
        let rotaJSON = parseRotaDBREST(rotaRaw);
        rotaJSON["STRESCOLAS"] = "Não cadastrado";
        rotaJSON["STRALUNOS"] = "Não cadastrado";
        rotaJSON["ALUNOS"] = [];
        rotaJSON["ESCOLAS"] = [];
        rotaJSON["ID_ROTA"] = rotaJSON["ID"];
        listaDeRotas.set(rotaJSON["ID"], rotaJSON);
    }
    return listaDeRotas;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((rota) => {
        rota["SELECT"] = i++;
        dataTablesRotas.row.add(rota);
    });

    dataTablesRotas.draw();
    dtInitFiltros(dataTablesRotas, [1, 2, 3, 4, 5, 6]);
    // dtInitFiltros(dataTablesRotas, [1, 2, 3, 4]);
}


$("#datatables_filter input").on('keyup', function () {
    dataTablesRotas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})


action = "listarRotas";