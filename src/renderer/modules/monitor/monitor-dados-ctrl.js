// monitor-dados-ctrl.js
// Este arquivo contém o script de controle da tela monitor-dados-view. 
// O mesmo serve para detalhar os dados de um monitor

var idMonitor = estadoMonitor["CPF"];

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableDadosMonitor = $("#dataTableDadosMonitor").DataTable({
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
            filename: "Monitor" + estadoMonitor["NOME"],
            title: appTitle,
            messageTop: "Dados do Monitor: " + estadoMonitor["NOME"],
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
            title: "Monitor",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[3].table.widths = ['30%', '70%'];
                doc.content[2].text = estadoMonitor["NOME"];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function(e, dt, node, config) {
                action = "editarMonitor";
                navigateDashboard("./modules/monitor/monitor-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function(e, dt, node, config) {
                action = "apagarMonitor";
                confirmDialog('Remover esse monitor?',
                               "Ao remover esse monitor ele será retirado do sistema das  " + 
                               "rotas que possuir vínculo."
                ).then(async (res) => {
                    debugger
                    let listaPromisePraRemover = []
                    if (res.value) {
                        // Workaround
                        await removeTodasAsRotasDoMonitor(idMonitor);

                        listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_MONITOR, `/${idMonitor}`))
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        Swal2.fire({
                            title: "Sucesso!",
                            icon: "success",
                            text: "Monitor removido com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        }).then(() => {
                            navigateDashboard("./modules/monitor/monitor-listar-view.html");
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover o monitor", err))
            }
        },
    ]
});

function popularTabelaMonitor() {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeMonitor").html(estadoMonitor["NOME"]);

    dataTableDadosMonitor.row.add(["Nome do monitor", estadoMonitor["NOME"]]);
    dataTableDadosMonitor.row.add(["CPF", $(`<div>${estadoMonitor["CPF"]}</div>`).mask("000.000.000-00").text()]);
    dataTableDadosMonitor.row.add(["Data de nascimento", estadoMonitor["DATA_NASCIMENTO"]]);
    
    if (estadoMonitor["TELEFONE"] != "") {
        dataTableDadosMonitor.row.add(["Telefone", estadoMonitor["TELEFONE"]]);
    } else {
        dataTableDadosMonitor.row.add(["Telefone", "Telefone não informado"]);
    }

    dataTableDadosMonitor.row.add(["Turnos de trabalhos", estadoMonitor["TURNOSTR"]]);
    
    if (estadoMonitor["VINCULO"] != "") {
        dataTableDadosMonitor.row.add(["Vínculo", estadoMonitor["VINCULOSTR"]]);
    } else {
        dataTableDadosMonitor.row.add(["Número do doc. de Antecedentes Criminais", "Não informado"]);
    }

    if (estadoMonitor["SALARIO"] && estadoMonitor["SALARIO"] != "" && estadoMonitor["SALARIO"] != NaN) {
        dataTableDadosMonitor.row.add(["Salário", "R$ " + numberToMoney(estadoMonitor["SALARIO"])]);
    } else {
        dataTableDadosMonitor.row.add(["Salário", "Não informado"]);
    }

    if (estadoMonitor["ROTAS"] && estadoMonitor["ROTAS"].length > 0) {
        dataTableDadosMonitor.row.add(["Rotas que monitora", ""]);
        for (let rota of estadoMonitor["ROTAS"]) {
            dataTableDadosMonitor.row.add(["Rota: ", rota.nome]);
        }
    }

    dataTableDadosMonitor.draw();
}


restImpl.dbGETEntidade(DB_TABLE_MONITOR, `/${estadoMonitor.ID}`)
.then((monitorRaw) => {
    let detalhesDoMonitor = parseMonitorREST(monitorRaw);
    Object.assign(estadoMonitor, detalhesDoMonitor);
    return getRotasDoMonitor(estadoMonitor.ID);
}).then((rotas) => {
    if (rotas.length > 0) {
        estadoMonitor["ROTAS"] = rotas;
    }
    return rotas;
}).then(() => popularTabelaMonitor())
.catch((err) => errorFn("Erro ao detalhadar a ficha do monitor", err))

$("#detalheInitBtn").click();

action = "detalharMonitor";