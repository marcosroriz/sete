// Checa se existe algum fornecedor 
BuscarTodosDadosPromise("Fornecedores")
    .then((res) => {
        if (res == null || res.length == 0) {
            Swal2.fire({
                title: 'Sem nenhum fornecedor cadastrado',
                text: "Para utilizar a ferramenta de ordens de serviço é necessário cadastrar pelo menos um fornecedor.",
                type: 'error',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                cancelButtonText: "Retornar",
                confirmButtonText: 'Registrar um fornecedor'
            }).then((result) => {
                if (result.value) {
                    $("a[name='fornecedor/fornecedor-cadastrar-view']").click();
                } else {
                    navigateDashboard(lastPage);
                }
            })
        }
    })

// Checa se existe algum veículo 
BuscarTodosDadosPromise("Veiculos")
    .then((res) => {
        if (res == null || res.length == 0) {
            Swal2.fire({
                title: 'Sem nenhum veículo cadastrado',
                text: "Para utilizar a ferramenta de ordens de serviço é necessário cadastrar pelo menos um veículo.",
                type: 'error',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                cancelButtonText: "Retornar",
                confirmButtonText: 'Registrar um veículo'
            }).then((result) => {
                if (result.value) {
                    $("a[name='frota/frota-cadastrar-view']").click();
                } else {
                    navigateDashboard(lastPage);
                }
            })
        }
    })

// Preenchimento da Tabela via SQL
var listaDeOS = new Array();
var listaDeVeiculos = new Map();
var listaDeFornecedores = new Map();

// DataTables
var dataTablesOS = $("#datatables").DataTable({
    columns: [
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
    columnDefs: [{
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    }],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todos"]],
    pagingType: "full_numbers",
    order: [[0, "asc"]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar ordens de serviços",
        "lengthMenu": "Mostrar _MENU_ ordens de serviços por página",
        "zeroRecords": "Não encontrei nenhuma ordem de serviço cadastrada",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Ordens de serviços filtradas a partir do total de _MAX_ ordens)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'lf<"addOS">rtipB',
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
});

$("div.addOS").html('<button id="addOS" type="button" class="btn btn-success"><i class="fa fa-plus"></i> Cadastrar nova OS</button>');
$("#addOS").click(() => {
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
        type: "question",
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

            AtualizarOSPromise("OrdemDeServico",
                { "TERMINO": estadoOS["TERMINO"] },
                "ID_FORNECEDOR", estadoOS["ID_FORNECEDOR"],
                "ID_VEICULO", estadoOS["ID_VEICULO"],
                "DATA", estadoOS["DATA"])
                .then(() => {
                    Swal2.fire(
                        'Pronto!',
                        'Estado da ordem de serviço atualizado com sucesso.',
                        'success'
                    )
                    dataTablesOS.row(rowidx).data(estadoOS).draw();
                    dataTablesOS.draw();
                });
        }
    })
});

dataTablesOS.on('click', '.osView', function () {
    var $tr = getRowOnClick(this);

    estadoOS = dataTablesOS.row($tr).data();
    action = "visualizarOS";
    Swal2.fire({
        type: 'info',
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
    var idVeiculo = estadoOS["ID_VEICULO"];

    action = "apagarOS";
    Swal2.fire({
        title: 'Remover esse ordem de serviço?',
        text: "Ao remover esse ordem de serviço ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverOSPromise("OrdemDeServico",
                "ID_FORNECEDOR", estadoOS["ID_FORNECEDOR"],
                "ID_VEICULO", estadoOS["ID_VEICULO"],
                "DATA", estadoOS["DATA"])
                .then(() => {
                    dataTablesOS.row($tr).remove();
                    dataTablesOS.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Ordem de serviço removida com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                })
                .catch((err) => errorFn("Erro ao remover a ordem de serviço. ", err));
        }
    })
});

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar as ordens de serviço", err);
    } else {
        $("#totalNumOS").text(result.length);

        for (let osRaw of result) {
            let osJSON = parseOSDB(osRaw);
            osJSON["VEICULOSTR"] = listaDeVeiculos.get(osJSON["ID_VEICULO"])["VEICULOSTR"];
            osJSON["FORNECEDORSTR"] = listaDeFornecedores.get(osJSON["ID_FORNECEDOR"])["NOME"];
            listaDeOS.push(osJSON);
        }

        listaDeOS.forEach((veiculo) => {
            dataTablesOS.row.add(veiculo);
        });

        dataTablesOS.draw();
    }
};

Promise.all([BuscarTodosDadosPromise("Veiculos"), BuscarTodosDadosPromise("Fornecedores")])
    .then((res) => {
        // Resultado
        var veiculosRes = res[0];
        var fornecedoresRes = res[1];

        for (let veiculoRaw of veiculosRes) {
            let veiculoJSON = parseVeiculoDB(veiculoRaw);
            veiculoJSON["VEICULOSTR"] = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`;
            listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
        }

        for (let fornecedorRaw of fornecedoresRes) {
            listaDeFornecedores.set(fornecedorRaw["ID_FORNECEDOR"], fornecedorRaw);
        }

        BuscarTodosDados("OrdemDeServico", listaInicialCB);
    })

action = "listarOS";