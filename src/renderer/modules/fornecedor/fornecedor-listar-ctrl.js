// Preenchimento da Tabela via SQL
var listaDeFornecedores = new Map();

// DataTables
var dataTablesFornecedores = $("#datatables").DataTable({
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'TELEFONE', width: "25%" },
        { data: 'SERVICOSTR', width: "300px" },
        {
            data: "ACOES",
            width: "110px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-primary fornecedorView"><i class="fa fa-search"></i></a>' +
                '<a href="#" class="btn btn-link btn-warning fornecedorEdit"><i class="fa fa-edit"></i></a>' +
                '<a href="#" class="btn btn-link btn-danger fornecedorRemove"><i class="fa fa-times"></i></a>'
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
        "searchPlaceholder": "Procurar fornecedores",
        "lengthMenu": "Mostrar _MENU_ fornecedores por página",
        "zeroRecords": "Não encontrei nenhum fornecedor cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Fornecedores filtrados a partir do total de _MAX_ fornecedores)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'lfrtipB',
    buttons: [
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Fornecedores cadastrados",
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
    var idFornecedor = estadoFornecedor["ID_FORNECEDOR"];

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
                dataTablesFornecedores.row($tr).remove();
                dataTablesFornecedores.draw();
                Swal2.fire({
                    type: 'success',
                    title: "Sucesso!",
                    text: "Fornecedor removido com sucesso!",
                    confirmButtonText: 'Retornar a página de administração'
                });
            })
            .catch((err) => errorFn("Erro ao remover o fornecedor. ", err));
        }
    })
});

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar os fornecedores", err);
    } else {
        $("#totalNumFornecedores").text(result.length);

        for (let fornecedorRaw of result) {
            let fornecedorJSON = parseFornecedorDB(fornecedorRaw);
            listaDeFornecedores.set(fornecedorJSON["ID_FORNECEDOR"], fornecedorJSON);
        }

        listaDeFornecedores.forEach((fornecedor) => {
            dataTablesFornecedores.row.add(fornecedor);
        });

        dataTablesFornecedores.draw();
    }
};

BuscarTodosDados("Fornecedores", listaInicialCB);

action = "listarFornecedores";