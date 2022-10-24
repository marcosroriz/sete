// frota-os-ctrl.js
// Este arquivo contém o script de controle da tela frota-os-view. 
// O mesmo serve tanto para cadastrar, listar, alterar e excluir uma OS
// Para tal, é necessário que se tenha cadastro pelo menos um veículo e um fornecedor

// Preenchimento da Tabela via SQL
var listaDeOS = new Array();
var listaDeVeiculos = new Map();
var listaDeFornecedores = new Map();

// DataTables
var dataTablesOS = $("#datatables").DataTable({
    ...dtConfigPadraoFem("ordem de serviço"),
    ...{
        select: {
            style: 'multi',
            info: false
        },
        "order": [[1, "asc"]],
        columns: [
            { data: 'SELECT', width: "60px" },
            { data: 'DATASTR', width: "90px" },
            { data: 'TIPOSTR', width: "14%" },
            { data: 'FORNECEDORSTR', width: "20%" },
            { data: 'VEICULOSTR', width: "20%" },
            { data: 'TERMINOSTR', width: "90px" },
            {
                data: "ACOES",
                width: "150px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-info osDone"><i class="fa fa-check-square"></i></a>' +
                    '<a href="#" class="btn btn-link btn-primary osView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning osEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger osRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1, render: renderAtMostXCharacters(50) }
        ],
        dom: 'r<"addOS">tilp<"clearfix m-2">B',
        buttons: [
            {
                text: 'Remover ordem de serviço',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesOS.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos uma ordem de serviço a ser removida.", "",
                            "Nenhuma OS selecionada")
                    } else {
                        let msg = `Você tem certeza que deseja remover as ${rawDados.length} ordem de serviços selecionadas?`;
                        let msgConclusao = "As ordens de serviço foram removidas com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover a ordem de serviço selecionada?`;
                            msgConclusao = "A ordem de serviço foi removida com sucesso";
                        }

                        goaheadDialog(msg, "Esta operação é irreversível. Você tem certeza?")
                            .then((res) => {
                                if (res.isConfirmed) {
                                    Swal2.fire({
                                        title: "Removendo as ordens de serviço da base de dados...",
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

                                    // Removendo cada veículo
                                    rawDados.forEach(v => {
                                        let idOS = v["ID"];
                                        console.log(DB_TABLE_ORDEM_DE_SERVICO, "/", idOS);
                                        promiseArray.push(restImpl.dbDELETE(DB_TABLE_ORDEM_DE_SERVICO, `/${idOS}`).then(() => updateProgress()));
                                    })

                                    return Promise.all(promiseArray)
                                        .then(() => {
                                            successDialog(text = msgConclusao);
                                            dataTablesOS.rows('.selected').remove();
                                            dataTablesOS.draw();
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
                    columns: [1, 2, 3, 4, 5]
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
                title: "Ordem de Serviços cadastradas",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4, 5]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['15%', '15%', '35%', '20%', '15%'];
                    doc = docReport(doc);

                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    doc.content[2].text = listaDeOS?.length + " " + String(doc.content[2].text).toUpperCase();
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

$("#addOS").on('click', () => {
    action = "cadastrarOS";
    navigateDashboard("./modules/frota/frota-os-cadastrar-view.html");
});

dataTablesOS.on('click', '.osDone', function () {
    var $tr = getRowOnClick(this);
    var rowidx = dataTablesOS.row($tr).index();
    estadoOS = dataTablesOS.row($tr).data();
    debugger

    var qtext = "Marcar ordem de serviço como concluída?";

    if (estadoOS["TERMINO"]) {
        qtext = "Marcar ordem de serviço como NÃO concluída?";
    }

    Swal2.fire({
        title: qtext,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: "Não"
    }).then(async (result) => {
        // ANEXAR UM PDF
        if (result.value) {
            estadoOS["TERMINO"] = estadoOS["TERMINO"] == "S" ? "N" : "S";
            if (estadoOS["TERMINO"] == "S") {
                dataTablesOS.row($tr).data()["TERMINOSTR"] = "Sim";
            } else {
                dataTablesOS.row($tr).data()["TERMINOSTR"] = "Não";
            }

            let idOS = estadoOS["ID"]
            let payload = {
                id_ordem: estadoOS.id_ordem,
                id_veiculo: estadoOS.id_veiculo,
                id_fornecedor: estadoOS.id_fornecedor,
                tipo_servico: estadoOS.tipo_servico,
                comentario: estadoOS.comentario,
                termino: estadoOS.TERMINO,
                data: moment(estadoOS.data).format("DD/MM/YYYY"),
            }

            try {
                await restImpl.dbPUT(DB_TABLE_ORDEM_DE_SERVICO, `/${idOS}`, payload);
                Swal2.fire(
                    'Pronto!',
                    'Estado da ordem de serviço atualizado com sucesso.',
                    'success'
                )
                dataTablesOS.row(rowidx).data(estadoOS).draw();
                dataTablesOS.draw();
            } catch (err) {
                errorFn("Erro ao atualizar a OS.", err)
            }
        }
    })
});

dataTablesOS.on('click', '.osView', function () {
    var $tr = getRowOnClick(this);

    estadoOS = dataTablesOS.row($tr).data();
    action = "visualizarOS";
    Swal2.fire({
        icon: 'info',
        title: "Comentário da Ordem de Serviço",
        text: estadoOS["COMENTARIO"],
        confirmButtonText: 'Retornar a página de administração'
    });
});

dataTablesOS.on('click', '.osEdit', function () {
    var $tr = getRowOnClick(this);

    estadoOS = dataTablesOS.row($tr).data();
    action = "editarOS";
    navigateDashboard("./modules/frota/frota-os-cadastrar-view.html");
});

dataTablesOS.on('click', '.osRemove', function () {
    var $tr = getRowOnClick(this);
    estadoOS = dataTablesOS.row($tr).data();
    var idOS = estadoOS["ID"];

    action = "apagarOS";
    confirmDialog("Remover essa ordem de serviço?", "Deseja prosseguir?")
        .then((res) => {
            let listaPromisePraRemover = []
            if (res.value) {
                listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_ORDEM_DE_SERVICO, `/${idOS}`));
            }

            return Promise.all(listaPromisePraRemover)
        }).then((res) => {
            if (res.length > 0) {
                dataTablesOS.row($tr).remove();
                dataTablesOS.draw();
                Swal2.fire({
                    title: "Sucesso!",
                    icon: "success",
                    text: "Ordem de serviço removida com sucesso!",
                    confirmButtonText: 'Retornar a página de administração'
                });
            }
        }).catch((err) => errorFn("Erro ao remover a ordem de serviço", err))
});

restImpl.dbGETColecao(DB_TABLE_FORNECEDOR)
    .then(res => processarFornecedores(res))
    .then(() => restImpl.dbGETColecao(DB_TABLE_VEICULO))
    .then(res => processarVeiculos(res))
    .then(() => restImpl.dbGETColecao(DB_TABLE_ORDEM_DE_SERVICO))
    .then(res => processarOS(res))
    .then(res => adicionaDadosTabela(res))
    .catch((err) => {
        debugger
        errorFn("Erro ao listar as ordens de serviço!", err)
    })

// Informar não existência de dado
var informarNaoExistenciaDado = (tipoDado, pagCadastroDado) => {
    return Swal2.fire({
        title: "Sem nenhum " + tipoDado + " cadastrado",
        text: "Para utilizar a ferramenta de ordens de serviço é necessário cadastrar pelo menos um " + tipoDado + ".",
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: "Retornar",
        confirmButtonText: 'Registrar um ' + tipoDado
    }).then((result) => {
        if (result.value) {
            $(pagCadastroDado).click();
        } else {
            navigateDashboard(lastPage);
        }
    })
}

// Processar fornecedores
var processarFornecedores = (res) => {
    if (res.length > 0) {
        for (let fornecedorRaw of res) {
            let fornecedorJSON = parseFornecedorREST(fornecedorRaw);
            fornecedorJSON["ID_FORNECEDOR"] = fornecedorJSON["ID"];
            listaDeFornecedores.set(fornecedorJSON["ID"], fornecedorJSON);
        }
        return listaDeFornecedores;
    } else {
        informarNaoExistenciaDado("fornecedor", "a[name='fornecedor/fornecedor-cadastrar-view']")
    }
}

// Processar veículos
var processarVeiculos = (res) => {
    if (res.length > 0) {
        for (let veiculoRaw of res) {
            let veiculoJSON = parseVeiculoREST(veiculoRaw);
            veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
            veiculoJSON["VEICULOSTR"] = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`;;
            listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
        }
        return listaDeVeiculos;
    } else {
        informarNaoExistenciaDado("veiculo", "a[name='frota/frota-cadastrar-view']")
    }
}

// Processar ordem de serviço
var processarOS = (res) => {
    i = 0;
    for (let osRaw of res) {
        let osJSON = parseOSRest(osRaw);
        osJSON["SELECT"] = i++;
        osJSON["VEICULOSTR"] = listaDeVeiculos.get(osJSON["ID_VEICULO"])["VEICULOSTR"];
        osJSON["FORNECEDORSTR"] = listaDeFornecedores.get(osJSON["ID_FORNECEDOR"])["NOME"];
        listaDeOS.push(osJSON);
    }

    return listaDeOS;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    DataTable.datetime('DD/MM/yyyy');
    res.forEach((os) => {
        dataTablesOS.row.add(os);
    });

    dataTablesOS.draw();
    dtInitFiltros(dataTablesOS, [1, 2, 3, 4, 5]);
}

action = "listarOS";