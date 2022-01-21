// Preenchimento da Tabela via SQL
var listaDeTodosOsUsuarios = new Map();
var listaDeUsuarios = new Map();
var papelAdmin = false;

// Por padrão não mostra opções de admin, somente se for o caso
$("#btIncluirUsuario").hide();
$(".ul-dica").hide();

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
                defaultContent: '<a href="#" class="btn btn-link btn-warning usuarioEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger usuarioRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) },
                     { targets: 2,  render: renderAtMostXCharacters(50) }],
        dom: 'lfrtip',
        order: [[3, "asc"]],
    }
});

dataTablesUsuario.on('click', '.usuarioEdit', function () {
    var $tr = getRowOnClick(this);

    estadoUsuario = dataTablesUsuario.row($tr).data();
    action = "editarUsuario";
    navigateDashboard("./modules/usuario/usuario-cadastrar-view.html");
});

dataTablesUsuario.on('click', '.usuarioRemove', function () {
    var $tr = getRowOnClick(this);

    estadoUsuario = dataTablesUsuario.row($tr).data();
    if (estadoUsuario["ID"] == userconfig.get("ID")) {
        Swal2.fire({
            title: "Ops.. operação não suportada",
            text: "Não é possível remover o usuário que se encontra logado.",
            icon: "error",
            confirmButtonColor: '#d33',
            confirmButtonText: "Fechar"
        });

        return false;
    }

    // Guarda os dados do usuário logado para depois realizar a autenticação novamente
    // Ao criar um novo usuário o firebase automaticamente faz logout e faz login no novo usuario
    let emailUsuarioLogado = userconfig.get("EMAIL");
    let senhaUsuarioLogado = userconfig.get("PASSWORD");

    action = "apagarUsuario";
    confirmDialog('Remover esse usuário?',
                  "Ao confirmar essa operação não será mais possível desfazer a exclusão.",
    ).then(async (result) => {
        if (result) {
            loadingFn("Apagando o usuário ...");
            await firebase.auth().signOut();
            await firebase.auth().signInWithEmailAndPassword(estadoUsuario["EMAIL"], estadoUsuario["PASSWORD"]);
            const user = firebase.auth().currentUser;
            await user.delete();
            await firebase.auth().signInWithEmailAndPassword(emailUsuarioLogado, senhaUsuarioLogado)
            return true;
        } else {
            return false;
        }
    })
    .then((result) => {
        let listaPromisePraRemover = []
        if (result) {
            listaPromisePraRemover.push(RemoverUsuarioLocalPromise(estadoUsuario["ID"]))
            listaPromisePraRemover.push(dbRemoverUsuarioPromise(estadoUsuario["ID"]))
            listaPromisePraRemover.push(dbDesabilitaUsuarioConfigPromise(estadoUsuario["ID"], estadoUsuario["PAPELNUM"]))
        }
        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesUsuario.row($tr).remove();
            dataTablesUsuario.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Usuário removido(a) com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }

        return res;
    })    
    .catch((err) => errorFn("Erro ao remover o usuário", err))
    .finally(async () => {
        await firebase.auth().signOut();
        await firebase.auth().signInWithEmailAndPassword(emailUsuarioLogado, senhaUsuarioLogado)
        Swal2.close();
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
.then(() => mostraCamposAdmin())
.then(() => Swal2.close())
.catch((err) => {
    debugger
    errorFn("Erro ao acessar os dados dos usuários cadastrados", err)
})

// Processa os usuários permitidos
function processaUsuariosPermitidos(relUsuariosPermitidos) {
    let usuariosPermitidos = relUsuariosPermitidos.data()   
    $("#totalNumUsuarios").text(usuariosPermitidos.users.length);

    insereDadoNaLista(usuariosPermitidos.users, "EDITOR", 1)
    insereDadoNaLista(usuariosPermitidos.admin, "ADMINISTRADOR", 0)
    insereDadoNaLista(usuariosPermitidos.readers, "LEITOR", 2)

    usuariosPermitidos.admin.forEach(idUsuarioAdmin => {
        if (idUsuarioAdmin == userconfig.get("ID")) {
            papelAdmin = true;
        }
    })

    return listaDeUsuarios;
}

function insereDadoNaLista(listaEspecificaDeUsuarios, papelSTR, papelNUM) {
    listaEspecificaDeUsuarios.forEach(idUsuario => {
        let usuarioAlvo = listaDeTodosOsUsuarios.get(idUsuario);
        if (usuarioAlvo) {
            usuarioAlvo["PAPEL"] = papelSTR;
            usuarioAlvo["PAPELNUM"] = papelNUM;
            
            listaDeUsuarios.set(idUsuario, usuarioAlvo);
        }
        
    })
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
    if (papelAdmin) {
        $("#btIncluirUsuario").show();
        $(".ul-dica").show();
    }
    return true;
}

action = "listarUsuario";