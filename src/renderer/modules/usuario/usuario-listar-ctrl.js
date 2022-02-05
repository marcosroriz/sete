// usuario-listar-ctrl.js
// Este arquivo contém o script de controle da tela usuario-listar-view. 
// O mesmo apresenta os usuários cadastrados em uma tabela. 

// Preenchimento da Tabela via SQL
var listaDeTodosOsUsuarios = new Map();
var papelAdmin = false;

// Por padrão não mostra opções de admin, somente se for o caso
$("#btIncluirUsuario").hide();
$(".ul-dica").hide();

// DataTables
var dataTablesUsuario = $("#datatables").DataTable({
    ...dtConfigPadrao("usuário"),
    ...{
        columns: [
            { data: 'nome', width: "30%" },
            { data: 'cpf', width: "15%" },
            { data: 'email', width: "40%" },
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
        order: [[0, "asc"]],
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

    action = "apagarUsuario";
    confirmDialog('Remover esse usuário?',
                  "Ao confirmar essa operação não será mais possível desfazer a exclusão.",
    ).then((result) => {
        let listaPromisePraRemover = []
        if (result.value) {
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
    }).catch((err) => errorFn("Erro ao remover o usuário", err))
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

restImpl.dbGETColecao(DB_TABLE_USUARIOS)
.then((usuarios) => processaUsuarios(usuarios))
.then((listaDeTodosOsUsuarios) => adicionaDadosTabela(listaDeTodosOsUsuarios))
.then(() => mostraCamposAdmin())
.then(() => Swal2.close())
.catch((err) => {
    debugger
    errorFn("Erro ao acessar os dados dos usuários cadastrados", err)
})

// Processa os usuários permitidos
function processaUsuarios(usuarios) {
    let numUsuarios = 0;

    usuarios.forEach(usuario => {
        if (usuario["is_ativo"] == "S") {
            numUsuarios++;
        }

        if (String(usuario["id_usuario"]) == userconfig.get("ID") && 
            usuario["nivel_permissao"] == "admin") {
            papelAdmin = true;
        }

        usuario["PAPEL"] = usuario["nivel_permissao"]?.toUpperCase();

        listaDeTodosOsUsuarios.set(String(usuario.id_usuario), usuario);
    });

    $("#totalNumUsuarios").text(numUsuarios);
    return listaDeTodosOsUsuarios;
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