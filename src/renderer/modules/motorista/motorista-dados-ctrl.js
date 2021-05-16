// motorista-dados-ctrl.js
// Este arquivo contém o script de controle da tela motorista-dados-view. 
// O mesmo serve para detalhar os dados de um motorista

var idMotorista = estadoMotorista["CPF"];

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableMotorista = $("#dataTableDadosMotorista").DataTable({
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
            filename: "Motorista" + estadoMotorista["NOME"],
            title: appTitle,
            messageTop: "Dados do Motorista: " + estadoMotorista["NOME"],
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
                action = "editarMotorista";
                navigateDashboard("./modules/motorista/motorista-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function(e, dt, node, config) {
                action = "apagarMotorista";
                confirmDialog('Remover esse motorista?',
                               "Ao remover esse motorista ele será retirado do sistema das  " + 
                               "rotas e das escolas que possuir vínculo."
                ).then((res) => {
                    let listaPromisePraRemover = []
                    if (res.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_MOTORISTA, "ID_MOTORISTA", estadoMotorista["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_MOTORISTA", estadoMotorista["ID"]));
                        listaPromisePraRemover.push(dbAtualizaVersao());
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        Swal2.fire({
                            title: "Sucesso!",
                            icon: "success",
                            text: "Motorista removido com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        }).then(() => {
                            navigateDashboard("./modules/motorista/motorista-listar-view.html");
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover a escola", err))
            }
        },
    ]
});

var popularTabelaMotorista = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeMotorista").html(estadoMotorista["NOME"]);

    dataTableMotorista.row.add(["Nome do motorista", estadoMotorista["NOME"]]);
    dataTableMotorista.row.add(["CPF", estadoMotorista["CPF"]]);
    dataTableMotorista.row.add(["Data de nascimento", estadoMotorista["DATA_NASCIMENTO"]]);
    
    if (estadoMotorista["TELEFONE"] != "") {
        dataTableMotorista.row.add(["Telefone", estadoMotorista["TELEFONE"]]);
    } else {
        dataTableMotorista.row.add(["Telefone", "Telefone não informado"]);
    }

    if (estadoMotorista["CNH"] != "") {
        dataTableMotorista.row.add(["CNH", estadoMotorista["CNH"]]);
    } else {
        dataTableMotorista.row.add(["CNH", "Não informada"]);
    }

    if (estadoMotorista["DATA_VALIDADE_CNH"] != "") {
        dataTableMotorista.row.add(["Validade da CNH", estadoMotorista["DATA_VALIDADE_CNH"]]);
    } else {
        dataTableMotorista.row.add(["Validade da CNH", "Não informada"]);
    }

    dataTableMotorista.row.add(["Categorias de CNH", estadoMotorista["CATEGORIAS"]]);
    dataTableMotorista.row.add(["Turnos de trabalhos", estadoMotorista["TURNOSTR"]]);
    
    if (estadoMotorista["ANT_CRIMINAIS"] != "") {
        dataTableMotorista.row.add(["Número do doc. de Antecedentes Criminais", estadoMotorista["ANT_CRIMINAIS"]]);
    } else {
        dataTableMotorista.row.add(["Número do doc. de Antecedentes Criminais", "Não informado"]);
    }

    if (estadoMotorista["ARQUIVO_DOCPESSOAIS_ANEXO"] != null &&
        estadoMotorista["ARQUIVO_DOCPESSOAIS_ANEXO"] != "" &&
        estadoMotorista["ARQUIVO_DOCPESSOAIS_ANEXO"] != undefined) {
        dataTableMotorista.row.add(["Anexo dos documentos pessoais", 
        `<button type="button" id="docAnexos" class="btn btn-primary btn-sm">
                Ver documentos em anexos (PDF)
        </button>`])
    } else {
        dataTableMotorista.row.add(["Anexo dos documentos pessoais", "Não enviado"]);
    }

    dataTableMotorista.draw();

    $("#docAnexos").click(() => {
        shell.openItem(estadoMotorista["ARQUIVO_DOCPESSOAIS_ANEXO"]);
    })
}

popularTabelaMotorista();

$("#detalheInitBtn").click();

action = "detalharMotorista";