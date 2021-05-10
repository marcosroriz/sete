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
        columns: [
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
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) }],
        dom: 'lfrtipB',
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Fornecedores cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1, 2, 3]
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
});

dbBuscarTodosDadosPromise(DB_TABLE_FORNECEDOR)
.then(res => processarFornecedores(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ORDEM_DE_SERVICO))
.then(res => processaOSs(res))
.then(res => adicionaDadosTabela(res))
.catch((err) => errorFn("Erro ao listar os motoristas!", err))

// Processar fornecedores
var processarFornecedores = (res) => {
    $("#totalNumFornecedores").text(res.length);
    for (let fornecedorRaw of res) {
        let fornecedorJSON = parseFornecedorDB(fornecedorRaw);
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
    res.forEach((fornecedor) => {
        dataTablesFornecedores.row.add(fornecedor);
    });

    dataTablesFornecedores.draw();
}

action = "listarFornecedores";