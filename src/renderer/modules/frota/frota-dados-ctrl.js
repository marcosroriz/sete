var idVeiculo = estadoVeiculo["ID_VEICULO"];

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
            title: "Motorista",
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
                Swal2.fire({
                    title: 'Remover esse veículo?',
                    text: "Ao remover esse veículo ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    cancelButtonText: "Cancelar",
                    confirmButtonText: 'Sim, remover'
                }).then((result) => {
                    if (result.value) {
                        RemoverPromise("Veiculos", "ID_VEICULO", idMotorista)
                        .then(() => {
                            Swal2.fire({
                                type: 'success',
                                title: "Sucesso!",
                                text: "Motorista removido com sucesso!",
                                confirmButtonText: 'Retornar a página de administração'
                            }).then(() => {
                                navigateDashboard("./modules/motorista/motorista-listar-view.html");
                            });
                        })
                        .catch((err) => errorFn("Erro ao remover o motorista. ", err));
                    }
                })
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
    dataTableVeiculo.row.add(["Capacidade máxima", estadoVeiculo["CAPACIDADE"] + " passageiros"]);
    dataTableVeiculo.row.add(["Quilometragem inicial", estadoVeiculo["KM_INICIAL"] + " km"]);
    dataTableVeiculo.row.add(["Quilometragem atual", estadoVeiculo["KM_ATUAL"] + " km"]);
    dataTableVeiculo.row.add(["Estado", estadoVeiculo["ESTADO"]]);
    dataTableVeiculo.draw();
}

popularTabelaVeiculo();

$("#detalheInitBtn").click();

action = "detalharVeiculo";