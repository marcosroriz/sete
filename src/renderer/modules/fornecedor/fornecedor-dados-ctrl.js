// fornecedor-dados-ctrl.js
// Este arquivo contém o script de controle da tela fornecedor-dados-view. 
// O mesmo serve para detalhar os dados de um fornecedor (incluindo suas OS)

// Cria mapa na cidade atual
var mapaDetalhe = novoMapaOpenLayers("mapDetalheFornecedor", cidadeLatitude, cidadeLongitude);

// Ativa camada
mapaDetalhe["activateImageLayerSwitcher"]();

// Corrige o bug de resize no mapa
window.onresize = function () {
    setTimeout(function () {
        if (mapaDetalhe != null) { mapaDetalhe["map"].updateSize(); }
    }, 200);
}

// Plota a posição do fornecedor se tiver localização GPS
if (estadoFornecedor["LOC_LONGITUDE"] != "" && estadoFornecedor["LOC_LONGITUDE"] != undefined &&
    estadoFornecedor["LOC_LATITUDE"] != "" && estadoFornecedor["LOC_LATITUDE"] != undefined) {
    // Esconde o campo que diz que o aluno não tem localização
    $("#avisoNaoGeoReferenciada").hide()

    // Desenha marcador da posição atual do fornecedor
    var lat = estadoFornecedor["LOC_LATITUDE"];
    var lon = estadoFornecedor["LOC_LONGITUDE"]

    var posicaoFornecedor = gerarMarcador(lat, lon, "img/icones/fornecedor-marcador.png", 25, 50);

    mapaDetalhe["vectorSource"].addFeature(posicaoFornecedor);
    mapaDetalhe["map"].getView().fit(mapaDetalhe["vectorSource"].getExtent());
    mapaDetalhe["map"].updateSize();
} else {
    // Esconde o mapa do fornecedor e mostra o campo que nao tem localização
    $("#mapDetalheFornecedor").hide()
}

var idFornecedor = estadoFornecedor["ID"];

// Lista de Veiculos e OS
var listaDeOS = new Array();
var listaDeVeiculos = new Map();

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableFornecedor = $("#dataTableDetalhes").DataTable({
    columns: [
        { width: "20%", className: "text-right detalheChave" },
        { width: "60%", className: "text-left detalheValor" },
    ],
    autoWidth: false,
    paging: false,
    searching: false,
    ordering: false,
    dom: 't<"detalheToolBar"B>',
    buttons: [
        {
            text: "Voltar",
            className: "btn-info",
            action: function (e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "Fornecedor" + estadoFornecedor["NOME"],
            title: appTitle,
            messageTop: "Dados do Fornecedor: " + estadoFornecedor["NOME"],
            text: 'Exportar para Excel/LibreOffice',
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
            title: "Fornecedor",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[2].table.widths = ['30%', '70%'];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function (e, dt, node, config) {
                action = "editarFornecedor";
                navigateDashboard("./modules/fornecedor/fornecedor-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function (e, dt, node, config) {
                action = "apagarFornecedor";
                confirmDialog('Remover esse fornecedor?',
                "Ao remover esse fornecedor ele será retirado do sistema e dos " +
                "serviços que possuir vínculo."
                ).then((res) => {
                    let listaPromisePraRemover = []
                    if (res.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_FORNECEDOR, "ID_FORNECEDOR", idFornecedor));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ORDEM_DE_SERVICO, "ID_FORNECEDOR", idFornecedor));
                        listaPromisePraRemover.push(dbAtualizaVersao());
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        dataTablesFornecedores.row($tr).remove();
                        dataTablesFornecedores.draw();
                        Swal2.fire({
                            title: "Sucesso!",
                            icon: "success",
                            text: "Fornecedor removido com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover o fornecedor", err))
            }
        },
    ]
});

var popularTabelaFornecedor = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeFornecedor").html(estadoFornecedor["NOME"]);
    dataTableFornecedor.row.add(["CPF/CNPJ", estadoFornecedor["CNPJ"]]);

    if (estadoFornecedor["TELEFONE"] != "") {
        dataTableFornecedor.row.add(["Telefone", estadoFornecedor["TELEFONE"]]);
    } else {
        dataTableFornecedor.row.add(["Telefone", "Telefone não informado"]);
    }

    dataTableFornecedor.row.add(["Serviços Oferecidos", estadoFornecedor["SERVICOSTR"]]);
    dataTableFornecedor.draw();
}

popularTabelaFornecedor();

var dataTableListaDeServicos = $('#dataTableListaDeServicos').DataTable({
    ...dtConfigPadraoFem("ordem de serviço"),
    ...{
        columns: [
            { data: 'DATA', width: "90px" },
            { data: 'TIPOSTR', width: "150px" },
            { data: 'VEICULOSTR', width: "20%" },
            { data: 'TERMINOSTR', width: "110px" },
            { data: 'COMENTARIO', width: "30%" },
        ],
        // dom: 't<"detalheToolBar"B>',
        columnDefs: [{ targets: 0, render: renderAtMostXCharacters(50), type: 'locale-compare' } ],
        buttons: [
            {
                text: "Voltar",
                className: "btn-info",
                action: function (e, dt, node, config) {
                    navigateDashboard(lastPage);
                }
            },
            {
                extend: 'excel',
                className: 'btnExcel',
                filename: "ServiçosRealizados",
                title: appTitle,
                messageTop: "Serviços realizados pelo Fornecedor: " + estadoFornecedor["NOME"],
                text: 'Exportar para Excel/LibreOffice',
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
                title: appTitle,
                messageTop: "Serviços realizados pelo Fornecedor: " + estadoFornecedor["NOME"],
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1]
                },
                customize: function (doc) {
                    doc = docReport(doc);
                }
            },
        ]
    }
});

dbBuscarTodosDadosPromise(DB_TABLE_VEICULO)
.then(res => processarVeiculos(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ORDEM_DE_SERVICO))
.then(res => processarOS(res))
.then(res => adicionaDadosOSNaTabela(res))

// Processar veículos
var processarVeiculos = (res) => {
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
        veiculoJSON["VEICULOSTR"] = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`;;
        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
    }
    return listaDeVeiculos;
}

// Processar ordem de serviço
var processarOS = (res) => {
    for (let osRaw of res) {
        let osJSON = parseOSDB(osRaw);

        if (osJSON["ID_FORNECEDOR"] == idFornecedor) {
            osJSON["VEICULOSTR"] = listaDeVeiculos.get(osJSON["ID_VEICULO"])["VEICULOSTR"];
            osJSON["COMENTARIO"] = osJSON["COMENTARIO"].length > 50 ? 
                                   osJSON["COMENTARIO"].substr(0, 50) + '…' : 
                                   osJSON["COMENTARIO"];
            listaDeOS.push(osJSON);
        }
    }

    return listaDeOS;
}

// Adiciona dados na tabela
adicionaDadosOSNaTabela = (res) => {
    res.forEach((os) => {
        dataTableListaDeServicos.row.add(os);
    });

    dataTableListaDeServicos.draw();
}

$("#detalheInitBtn").click();
$("#detalheMapa").on('click', (evt) => {
    setTimeout(function () {
        mapaDetalhe["map"].updateSize();
    }, 200);
});

action = "detalharFornecedor";