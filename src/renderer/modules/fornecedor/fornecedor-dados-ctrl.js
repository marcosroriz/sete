var idFornecedor = estadoFornecedor["ID_FORNECEDOR"];

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
                Swal2.fire({
                    title: 'Remover esse fornecedor?',
                    text: "Ao remover esse fornecedor ele será retirado do sistema e dos serviços que possuir vínculo.",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    cancelButtonText: "Cancelar",
                    confirmButtonText: 'Sim, remover'
                }).then((result) => {
                    if (result.value) {
                        RemoverPromise("Fornecedores", "ID_FORNECEDOR", idFornecedor)
                            .then(() => {
                                Swal2.fire({
                                    type: 'success',
                                    title: "Sucesso!",
                                    text: "Fornecedor removido com sucesso!",
                                    confirmButtonText: 'Retornar a página de administração'
                                }).then(() => {
                                    navigateDashboard("./modules/fornecedor/fornecedor-listar-view.html");
                                });
                            })
                            .catch((err) => errorFn("Erro ao remover o fornecedor. ", err));
                    }
                })
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

$("#detalheInitBtn").click();

action = "detalharFornecedor";