// monitor-listar-ctrl.js
// Este arquivo contém o script de controle da tela monitor-listar-view. 
// O mesmo apresenta os monitores cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeMonitores = new Map();

// DataTables
var dataTablesMonitores = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("monitor"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "25%" },
            { data: 'TELEFONE', width: "25%" },
            { data: 'TURNOSTR', width: "25%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary monitorView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning monitorEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger monitorRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1,  render: renderAtMostXCharacters(50) }
        ],
        buttons: [
            {
                text: 'Remover monitores',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesMonitores.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um monitor a ser removido.", "",
                                "Nenhum monitor selecionado")
                    } else {
                        let msg = `Você tem certeza que deseja remover os ${rawDados.length} monitores selecionados?`;
                        let msgConclusao = "Os monitores foram removidos com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover o monitor selecionado?`;
                            msgConclusao = "O monitor foi removido com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then(async (res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removendo os monitores da base de dados...",
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
                                // Removendo cada monitor
                                debugger
                                for (let monitor of rawDados) {
                                    let idmonitor = monitor["ID"];
                                    // Workaround
                                    await removeTodasAsRotasDoMonitor(idmonitor);

                                    promiseArray.push(restImpl.dbDELETE(DB_TABLE_MONITOR, `/${idmonitor}`).then(() => updateProgress()));
                                }

                                Promise.all(promiseArray)
                                .then(() => {
                                    successDialog(text = msgConclusao);
                                    dataTablesMonitores.rows('.selected').remove();
                                    dataTablesMonitores.draw();
                                })
                            }
                        })
                        .catch((err) => {
                            Swal2.close()
                            errorFn("Erro ao remover os monitors", err)
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
                    columns: [ 1, 2, 3, 4, 5, 6]
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
                title: "monitors cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4, 5, 6]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['25%', '15%', '10%', '20%', '15%', '15%'];
                    doc = docReport(doc);
                    
                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    doc.content[2].text = listaDeMonitores?.size +  " " + doc.content[2].text;
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

dataTablesMonitores.on('click', '.monitorView', function () {
    var $tr = getRowOnClick(this);

    estadoMonitor = dataTablesMonitores.row($tr).data();
    action = "visualizarMonitor";
    navigateDashboard("./modules/monitor/monitor-dados-view.html");
});

dataTablesMonitores.on('click', '.monitorEdit', function () {
    var $tr = getRowOnClick(this);

    estadoMonitor = dataTablesMonitores.row($tr).data();
    action = "editarMonitor";
    navigateDashboard("./modules/monitor/monitor-cadastrar-view.html");
});

dataTablesMonitores.on('click', '.monitorRemove', function () {
    var $tr = getRowOnClick(this);
    estadoMonitor = dataTablesMonitores.row($tr).data();
    var idMonitor = estadoMonitor["CPF"];

    action = "apagarMonitor";
    confirmDialog('Remover esse monitor?',
                  "Ao remover esse monitor ele será retirado do sistema das  " + 
                  "rotas e das escolas que possuir vínculo."
    ).then(async (res) => {
        let listaPromisePraRemover = [];
        if (res.value) {
            // Workaround
            await removeTodasAsRotasDoMonitor(idMonitor);

            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_MONITOR, `/${idMonitor}`));
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesMonitores.row($tr).remove();
            dataTablesMonitores.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "monitor removido com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => {
        errorFn("Erro ao remover a escola", err)
    })
});

restImpl.dbGETColecao(DB_TABLE_MONITOR)
.then(res => processarMonitores(res))
.then(res => adicionaDadosTabela(res))
.catch((err) => {
    console.log(err)
    errorFn("Erro ao listar os monitors!", err)
})

// Processar monitors
var processarMonitores = (res) => {
    $("#totalNumMonitores").text(res.length);
    for (let monitorRaw of res) {
        let monitorJSON = parseMonitorREST(monitorRaw);
        listaDeMonitores.set(monitorJSON["ID"], monitorJSON);
    }
    return listaDeMonitores;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((monitor) => {
        monitor["SELECT"] = i++;
        dataTablesMonitores.row.add(monitor);
    });

    dataTablesMonitores.draw();
    dtInitFiltros(dataTablesMonitores, [3]);
}


$("#datatables_filter input").on('keyup', function () {
    dataTablesMonitores.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

action = "listarMonitores";