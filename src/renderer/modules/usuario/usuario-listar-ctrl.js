// Preenchimento da Tabela via SQL
var listaDeTodosOsUsuarios = new Map();
var listaDeUsuarios = new Map();
var papelAdmin = false;

// Por padrão não mostra opções de admin, somente se for o caso
$("#btIncluirUsuario").hide();

// DataTables
var dataTablesUsuario = $("#datatables").DataTable({
    ...dtConfigPadrao("usuário"),
    ...{
        columns: [
            { data: 'NOME', width: "30%" },
            { data: 'CPF', width: "15%" },
            { data: 'EMAIL', width: "40%" },
            { data: 'PAPEL', width: "15%", defaultContent: "EDITOR" },
            {
                data: "ACOES",
                width: "140px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary usuarioView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning usuarioEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger usuarioRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) },
                    { targets: 2,  render: renderAtMostXCharacters(50) }],
        dom: 'lfrtip',
    }
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

// Botão para tratar caso de inserção de usuário
$("#btIncluirUsuario").on('click', () => navigateDashboard("./modules/usuario/usuario-cadastrar-view.html"))

loadingFn("Buscando os usuários...")

dbBuscarTodosUsuarios()
.then((resUsuarios) => {
    resUsuarios.forEach(usuario => listaDeTodosOsUsuarios.set(usuario.id, usuario.data()))
    return listaDeTodosOsUsuarios
})
.then(() => dbBuscarUsuariosDoMunicipioPromise())
.then((relUsuariosPermitidos) => processaUsuariosPermitidos(relUsuariosPermitidos))
.then((listaDeUsuarios) => adicionaDadosTabela(listaDeUsuarios))
.then(() => removeAcoesCasoUsuarioNaoAdmin())
.then(() => Swal2.close())
.catch((err) => errorFn("Erro ao acessar os dados dos usuários cadastrados", err))

// Processa os usuários permitidos
processaUsuariosPermitidos = (relUsuariosPermitidos) => {
let usuariosPermitidos = relUsuariosPermitidos.data()
    usuariosPermitidos.users.forEach(idUsuario => listaDeUsuarios.set(idUsuario, listaDeTodosOsUsuarios.get(idUsuario)))
    
    $("#totalNumUsuarios").text(usuariosPermitidos.users.length);
    
    usuariosPermitidos.admin.forEach(idUsuarioAdmin => {
        let usuarioAdmin = listaDeUsuarios.get(idUsuarioAdmin);
        usuarioAdmin["PAPEL"] = "ADMINISTRADOR";
        listaDeUsuarios.set(idUsuarioAdmin, usuarioAdmin);

        if (idUsuarioAdmin == userconfig.get("ID")) {
            papelAdmin = true;
        }
        
    })
    return listaDeUsuarios
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((usuario) => {
        if (!papelAdmin) {
            usuario["ACOES"] = "NÃO POSSUI PERMISSÃO PARA ALTERAR"
        }
        dataTablesUsuario.row.add(usuario);
    });

    dataTablesUsuario.draw();
}

// Remove campos de inserção de usuário caso o mesmo não seja admin
mostraCamposAdmin = () => {
    if (papelAdmin) $("#btIncluirUsuario").show();
    return true;
}

action = "listarUsuario";