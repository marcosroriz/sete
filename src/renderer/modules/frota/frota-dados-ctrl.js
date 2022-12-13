// frota-dados-ctrl.js
// Este arquivo contém o script de controle da tela frota-dados-view. 
// O mesmo serve para detalhar os dados de um veículo

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableVeiculo = $("#dataTableDadosVeiculo").DataTable({
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
            action: function(e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "Veiculo",
            title: appTitle,
            messageTop: "Dados do Veículo: ",
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
            title: "Veículo: " + estadoVeiculo["TIPOSTR"],
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[3].table.widths = ['30%', '70%'];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function(e, dt, node, config) {
                action = "editarVeiculo";
                navigateDashboard("./modules/frota/frota-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function(e, dt, node, config) {
                action = "apagarVeiculo";
                confirmDialog("Remover esse veículo?",
                  "Ao remover esse veículo ele será retirado do sistema das "
                + "rotas e das escolas que possuir vínculo."
                ).then((res) => {
                    let listaPromisePraRemover = []
                    if (res.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_VEICULO, "ID_VEICULO", estadoVeiculo["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_VEICULO", estadoVeiculo["ID"]));
                        listaPromisePraRemover.push(dbAtualizaVersao());
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        Swal2.fire({
                            icon: 'success',
                            title: "Sucesso!",
                            text: "Veículo removido com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        }).then(() => {
                            navigateDashboard("./modules/frota/frota-listar-view.html");
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover o veículo", err))
            }
        },
    ]
});

var popularTabelaVeiculo = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeVeiculo").html(estadoVeiculo["TIPOSTR"]);
    
    dataTableVeiculo.row.add(["Marca", estadoVeiculo["MARCASTR"]]);

    if (estadoVeiculo["MODELO"] != "") {
        dataTableVeiculo.row.add(["Modelo", estadoVeiculo["MODELOSTR"]]);
    }
    dataTableVeiculo.row.add(["Origem", estadoVeiculo["ORIGEMSTR"]]);
    dataTableVeiculo.row.add(["Ano de aquisição", estadoVeiculo["ANO"]]);
    dataTableVeiculo.row.add(["Placa", estadoVeiculo["PLACA"]]);
    dataTableVeiculo.row.add(["RENAVAM", estadoVeiculo["RENAVAM"]]);
    dataTableVeiculo.row.add(["Tipo", estadoVeiculo["TIPOSTR"]]);
    dataTableVeiculo.row.add(["Capacidade máxima", estadoVeiculo["CAPACIDADE"] + " passageiros"]);
    dataTableVeiculo.row.add(["Quilometragem inicial", estadoVeiculo["KM_INICIAL"] + " km"]);
    dataTableVeiculo.row.add(["Quilometragem atual", estadoVeiculo["KM_ATUAL"] + " km"]);
    dataTableVeiculo.row.add(["Estado", estadoVeiculo["ESTADO"]]);
    dataTableVeiculo.draw();
}

restImpl.dbGETEntidade(DB_TABLE_VEICULO, `/${estadoVeiculo.ID}`)
.then((veiculoRaw) => {
    debugger
    let detalhesDoVeiculo = parseVeiculoREST(veiculoRaw);
    Object.assign(estadoVeiculo, detalhesDoVeiculo);
    return estadoVeiculo;
}).then(() => popularTabelaVeiculo())
.catch((err) => {
    debugger
    console.log(err)
})
$("#detalheInitBtn").click();

action = "detalharVeiculo";