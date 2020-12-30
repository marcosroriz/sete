// Preenchimento da Tabela via SQL
var listaDeUsuario = new Map();

// DataTables
var dataTablesUsuario = $("#datatables").DataTable({
    // fixedHeader: true,
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'CPF', width: "20%" },
        { data: 'EMAIL', width: "40%" },
        {
            data: "ACOES",
            width: "90px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-primary usuarioView"><i class="fa fa-search"></i></a>' +
                '<a href="#" class="btn btn-link btn-warning usuarioEdit"><i class="fa fa-edit"></i></a>' +
                '<a href="#" class="btn btn-link btn-danger usuarioRemove"><i class="fa fa-times"></i></a>'
        }
    ],
    columnDefs: [{
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    },
    {
        targets: 2,
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
        "searchPlaceholder": "Procurar usuários",
        "lengthMenu": "Mostrar _MENU_ usuários por página",
        "zeroRecords": "Não encontrei nenhum usuário cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Usuários filtrados a partir do total de _MAX_ usuários)",
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
            title: "Alunos cadastrados",
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

dataTablesUsuario.on('click', '.usuarioView', function () {
    var $tr = getRowOnClick(this);
    estadoUsuario = dataTablesUsuario.row($tr).data();
    action = "visualizarUsuario";
    navigateDashboard("./modules/usuario/usuario-visualizar-view.html");
});

dataTablesUsuario.on('click', '.usuarioEdit', function () {
    var $tr = getRowOnClick(this);

    estadoUsuario = dataTablesUsuario.row($tr).data();
    action = "editarUsuario";
    navigateDashboard("./modules/usuario/usuario-alterar-view.html");
});

dataTablesUsuario.on('click', '.usuarioRemove', function () {
    var $tr = getRowOnClick(this);

    estadoUsuario = dataTablesUsuario.row($tr).data();
    action = "apagarUsuario";
    Swal2.fire({
        title: 'Remover esse usuário?',
        text: "Ao confirmar essa operação não será mais possível desfazer a exclusão.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverUsuario(estadoUsuario["ID"], (err, result) => {

                debugger;
                if (result) {
                    dataTablesUsuario.row($tr).remove();
                    dataTablesUsuario.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Usuário  removido com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    }).then(() => {
                        remotedb.collection("users").doc(estadoUsuario["ID"]).delete().then(function () {
                            console.log("Document successfully deleted!");

                            navigateDashboard(currentPage);

                        }).catch(function (error) {
                            Swal2.fire({
                                type: 'error',
                                title: 'Oops...',
                                text: 'Tivemos algum problema. Por favor, reinicie o software!' + error,
                            });
                        });

                    });
                } else {
                    Swal2.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Tivemos algum problema. Por favor, reinicie o software!' + err,
                    });
                }
            });
        }
    })
});


// Função para relatar erro
var errorFnUsuario = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar os usuários! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}



// Listar Usuarios no datatables
var ListarUsuarios = (result) => {

    result.forEach((usuario) => {
        dataTablesUsuario.row.add(usuario);
    });

    dataTablesUsuario.draw();
};

// Callback para pegar dados inicia dos usuarios
var listaInicialCB = (err, result) => {
    if (err) {
        errorFnUsuario(err);
    } else {
        $("#totalNumUsuarios").text(result.length);

        for (let usuarioRaw of result) {
            let usuarioJSON = parseUsuarioDB(usuarioRaw);
            listaDeUsuario.set(usuarioJSON["ID"], usuarioJSON);
        }
        ListarUsuarios(listaDeUsuario);
    }
};

BuscarTodosUsuarios(listaInicialCB);

action = "listarAluno";

$("#btIncluirUsuario").click(function () {
    navigateDashboard("./modules/usuario/usuario-cadastrar-view.html");
})