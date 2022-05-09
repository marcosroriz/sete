// fornecedor-listar-ctrl.js
// Este arquivo contém o script de controle da tela fornecedor-listar-view. 
// O mesmo apresenta os fornecedores cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeFornecedores = new Map();

// DataTables
var dataTablesFornecedores = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("fornecedor"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "30%" },
            { data: 'TELEFONE', width: "400px" },
            { data: 'SERVICOSTR', width: "25%" },
            { data: 'NUM_OS', width: "500px" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary fornecedorView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning fornecedorEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger fornecedorRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1,  render: renderAtMostXCharacters(50) }
        ],
        buttons: [
            {
                text: 'Remover fornecedores',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesFornecedores.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um fornecedor a ser removido.", "",
                                "Nenhuma fornecedor selecionado")
                    } else {
                        let msg = `Você tem certeza que deseja remover os ${rawDados.length} fornecedores selecionados?`;
                        let msgConclusao = "Os fornecedores foram removidos com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover o fornecedor selecionado?`;
                            msgConclusao = "O fornecedor foi removido com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then((res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removendo os fornecedores da base de dados...",
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
                                
                                // Removendo cada fornecedor
                                rawDados.forEach(m => {
                                    let idFornecedor = m["ID"];
                                    promiseArray.push(restImpl.dbDELETE(DB_TABLE_FORNECEDOR, `/${idFornecedor}`).then(() => updateProgress()));
                                })

                                Promise.all(promiseArray)
                                .then(() => {
                                    successDialog(text = msgConclusao);
                                    dataTablesFornecedores.rows('.selected').remove();
                                    dataTablesFornecedores.draw();
                                })
                            }
                        })
                        .catch((err) => {
                            Swal2.close()
                            errorFn("Erro ao remover os fornecedores", err)
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
                    columns: [1, 2, 3, 4]
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
                title: "Fornecedores cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['35%', '20%', '25%', '20%'];
                    doc = docReport(doc)
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

dataTablesFornecedores.on('click', '.fornecedorView', function () {
    var $tr = getRowOnClick(this);

    estadoFornecedor = dataTablesFornecedores.row($tr).data();
    action = "visualizarFornecedor";
    navigateDashboard("./modules/fornecedor/fornecedor-dados-view.html");
});

dataTablesFornecedores.on('click', '.fornecedorEdit', function () {
    var $tr = getRowOnClick(this);

    estadoFornecedor = dataTablesFornecedores.row($tr).data();
    action = "editarFornecedor";
    navigateDashboard("./modules/fornecedor/fornecedor-cadastrar-view.html");
});

dataTablesFornecedores.on('click', '.fornecedorRemove', function () {
    var $tr = getRowOnClick(this);
    estadoFornecedor = dataTablesFornecedores.row($tr).data();
    var idFornecedor = estadoFornecedor["ID"];

    action = "apagarFornecedor";
    confirmDialog('Remover esse fornecedor?',
                  "Ao remover esse fornecedor ele será retirado do sistema e dos " +
                  "serviços que possuir vínculo."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_FORNECEDOR, `/${idFornecedor}`));
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
});

restImpl.dbGETColecao(DB_TABLE_FORNECEDOR)
.then(res => processarFornecedores(res))
// .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ORDEM_DE_SERVICO))
// .then(res => processaOSs(res))
.then(res => adicionaDadosTabela(res))
.catch((err) => {
    debugger
    errorFn("Erro ao listar os fornecedores!", err)
})

// Processar fornecedores
var processarFornecedores = (res) => {
    for (let fornecedorRaw of res) {
        let fornecedorJSON = parseFornecedorREST(fornecedorRaw);
        fornecedorJSON["NUM_OS"] = 0;
        listaDeFornecedores.set(fornecedorJSON["ID"], fornecedorJSON);
    }
    return listaDeFornecedores;
}

// Processar OSs
var processaOSs = (res) => {
    for (let osRaw of res) {
        let idFornecedor = osRaw["ID_FORNECEDOR"];
        let fornecedorJSON = listaDeFornecedores.get(idFornecedor);
        fornecedorJSON["NUM_OS"] = fornecedorJSON["NUM_OS"] + 1;
        
        listaDeFornecedores.set(idFornecedor, fornecedorJSON);
    }
    return listaDeFornecedores;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((fornecedor) => {
        fornecedor["SELECT"] = i++;
        dataTablesFornecedores.row.add(fornecedor);
    });

    dataTablesFornecedores.draw();
    dtInitFiltros(dataTablesFornecedores, [3, 4]);
}

action = "listarFornecedores";