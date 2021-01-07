var usuarioVisualizado = null;
var listaDeUsuarios = new Map();

// Função para relatar erro
var errorFnUsuario = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar os alunos! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

$("#uid").val(estadoUsuario.ID);
$("#regnome").val(estadoUsuario.NOME);
$("#regcpf").val(estadoUsuario.CPF);
$("#regtel").val(estadoUsuario.TELEFONE);
$("#regemail").val(estadoUsuario.EMAIL);

$("#btVoltarListaUsuario").click(function () {
    navigateDashboard(lastPage);
})

action = "visualizarUsuario";