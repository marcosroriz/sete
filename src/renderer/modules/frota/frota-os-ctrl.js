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
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },    
            { data: 'DATA', width: "90px" },
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
            { targets: 1,  render: renderAtMostXCharacters(50) }
        ],
        dom: 'r<"addOS">tilp<"clearfix m-2">B',
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Veículos cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['30%', '15%', '20%', '20%', '15%'];
                    doc.images = doc.images || {};
                    doc.images["logo"] = baseImages.get("logo");
                    doc.content.splice(1, 0, {
                        alignment: 'center',
                        margin: [0, 0, 0, 12],
                        image: "logo"
                    });
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

$("div.addOS").html(`
<button id="addOS" type="button" class="btn btn-success">
    <i class="fa fa-plus"></i> Cadastrar nova OS
</button>`);

$("#addOS").on('click', () => {
    action = "cadastrarOS";
    navigateDashboard("./modules/frota/frota-os-cadastrar-view.html");
});

dataTablesOS.on('click', '.osDone', function () {
    var $tr = getRowOnClick(this);
    var rowidx = dataTablesOS.row($tr).index();
    estadoOS = dataTablesOS.row($tr).data();

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
    }).then((result) => {
        if (result.value) {
            estadoOS["TERMINO"] = !estadoOS["TERMINO"];
            if (estadoOS["TERMINO"]) {
                dataTablesOS.row($tr).data()["TERMINOSTR"] = "Sim";
            } else {
                dataTablesOS.row($tr).data()["TERMINOSTR"] = "Não";
            }
            
            let idOS = estadoOS["ID"]
            dbAtualizarPromise(DB_TABLE_ORDEM_DE_SERVICO, estadoOS, idOS)
            .then(() => dbAtualizaVersao())
            .then(() => {
                Swal2.fire(
                    'Pronto!',
                    'Estado da ordem de serviço atualizado com sucesso.',
                    'success'
                )
                dataTablesOS.row(rowidx).data(estadoOS).draw();
                dataTablesOS.draw();
            })
            .catch((err) => errorFn("Erro ao atualizar o veículo.", err))
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
    confirmDialog("Remover essa ordem de serviço?","Deseja prosseguir?")
    .then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ORDEM_DE_SERVICO, "ID", idOS));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesOS.row($tr).remove();
            dataTablesOS.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Veículo removido com sucesso!",
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
.catch((err) => errorFn("Erro ao listar os motoristas!", err))

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
    debugger
    for (let osRaw of res) {
        let osJSON = parseOSDB(osRaw);
        osJSON["VEICULOSTR"] = listaDeVeiculos.get(osJSON["ID_VEICULO"])["VEICULOSTR"];
        osJSON["FORNECEDORSTR"] = listaDeFornecedores.get(osJSON["ID_FORNECEDOR"])["NOME"];
        listaDeOS.push(osJSON);
    }

    return listaDeOS;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((os) => {
        dataTablesOS.row.add(os);
    });

    dataTablesOS.draw();
}

action = "listarOS";