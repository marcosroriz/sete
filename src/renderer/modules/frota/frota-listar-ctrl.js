// frota-listar-ctrl.js
// Este arquivo contém o script de controle da tela frota-listar-view. O mesmo
// apresenta os veículos cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeVeiculos = new Map();

// DataTables
var dataTablesVeiculos = $("#datatables").DataTable({
    ...dtConfigPadrao("veículo"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[1, "asc"]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'PLACA', width: "12%" },
            { data: 'TIPOSTR', width: "12%" },
            { data: 'MARCASTR', width: "12%" },
            { data: 'MODELOSTR', width: "12%" },
            { data: 'CAPACIDADE', width: "15%" },
            { data: 'CAPACIDADE_ATUAL', width: "15%" },
            { data: 'ESTADO', width: "10%" },
            { data: 'ORIGEMSTR', width: "10%" },
            {
                data: "ACOES",
                width: "70px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary frotaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning frotaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger frotaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            {
                targets: 1,
                render: {
                    "filter": data => data,
                    "display": renderAtMostXCharacters(50)
                },
                type: 'locale-compare'
            },
        ],
        buttons: [
            {
                text: 'Remover veículos',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesVeiculos.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um veículo a ser removido.", "",
                            "Nenhuma veículo selecionado")
                    } else {
                        let msg = `Você tem certeza que deseja remover os ${rawDados.length} veículos selecionados?`;
                        let msgConclusao = "Os veículos foram removidos com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover o veículo selecionado?`;
                            msgConclusao = "O veículo foi removido com sucesso";
                        }

                        goaheadDialog(msg, "Esta operação é irreversível. Você tem certeza?")
                            .then((res) => {
                                if (res.isConfirmed) {
                                    Swal2.fire({
                                        title: "Removendo os veículos da base de dados...",
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
                                    var max = rawDados.length * 2 + 1;

                                    function updateProgress() {
                                        progresso++;
                                        var progressPorcentagem = Math.round(100 * (progresso / max))

                                        $('.progress-bar').css('width', progressPorcentagem + "%")
                                    }

                                    var promiseArray = new Array();

                                    // Removendo cada motorista
                                    rawDados.forEach(v => {
                                        let idVeiculo = v["ID"];
                                        promiseArray.push(
                                            dbRemoverDadoPorIDPromise(DB_TABLE_VEICULO, "ID_VEICULO", idVeiculo)
                                                .then(() => updateProgress())
                                        );
                                        promiseArray.push(
                                            dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_VEICULO", idVeiculo)
                                                .then(() => updateProgress())
                                        );
                                    })

                                    promiseArray.push(dbAtualizaVersao().then(() => updateProgress()));
                                    Promise.all(promiseArray)
                                        .then(() => {
                                            successDialog(text = msgConclusao);
                                            dataTablesVeiculos.rows('.selected').remove();
                                            dataTablesVeiculos.draw();
                                        })
                                }
                            })
                            .catch((err) => {
                                Swal2.close()
                                errorFn("Erro ao remover os veículos", err)
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
                    columns: [1, 2, 3, 4, 5, 6, 7, 8]
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
                title: "Frota cadastrada",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4, 5, 6, 7, 8]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['10%', '15%', '10%', '15%', '13%', '13%', '12%', '12%'];
                    doc = docReport(doc);

                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    doc.content[2].text = listaDeVeiculos?.size + " " + doc.content[2].text;
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

dataTablesVeiculos.on('click', '.frotaView', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    action = "visualizarVeiculo";
    navigateDashboard("./modules/frota/frota-dados-view.html");
});

dataTablesVeiculos.on('click', '.frotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    action = "editarVeiculo";
    navigateDashboard("./modules/frota/frota-cadastrar-view.html");
});

dataTablesVeiculos.on('click', '.frotaRemove', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    var idVeiculo = estadoVeiculo["ID_VEICULO"];

    action = "apagarVeiculo";
    confirmDialog("Remover esse veículo?",
        "Ao remover esse veículo ele será retirado do sistema das "
        + "rotas e das escolas que possuir vínculo."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_VEICULO, "ID_VEICULO", idVeiculo));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_VEICULO", idVeiculo));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesVeiculos.row($tr).remove();
            dataTablesVeiculos.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Veículo removido com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover o veículo", err))
});

dbBuscarTodosDadosPromise(DB_TABLE_VEICULO)
    .then(res => processarVeiculos(res))
    .then(res => adicionaDadosTabela(res))
    .catch((err) => errorFn("Erro ao listar os veículos!", err))

// Processar motoristas
var processarVeiculos = (res) => {
    $("#totalNumVeiculos").text(res.length);
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
    }
    return listaDeVeiculos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;

    res.forEach((veiculo) => {
        veiculo["SELECT"] = i++;
        dataTablesVeiculos.row.add(veiculo);
    });

    dataTablesVeiculos.draw();
    dtInitFiltros(dataTablesVeiculos, [1, 2, 3, 4, 5, 6, 7, 8]);
}

$("#datatables_filter input").on('keyup', function () {
    dataTablesVeiculos.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

action = "listarVeiculos";