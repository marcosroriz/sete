// usuario-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela usuario-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um 
// usuário no sistema. Também é possível alterar o papel (admin, viewer) do mesmo.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarUsuario") {
    estaEditando = true;
}

// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);

var completeForm = () => {
    Swal2.fire({
        title: "Usuário salvo com sucesso",
        text: "O usuário" + $("#regnome").val() + " foi salvo com sucesso. " +
              "Clique abaixo para retornar ao painel.",
        type: "info",
        icon: "info",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    }).then(() => {
        navigateDashboard("./modules/usuario/usuario-listar-view.html");
    });
}

$("#btCancelarCadastroUsuario").on('click', () => {
    navigateDashboard(lastPage);
})

$("#registerform").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            regnome: {
                required: true,
                lettersonly: true
            },
            regcpf: {
                required: true,
                cpf: true
            },
            regtel: {
                required: true,
                minlength: 10
            },
            regemail: {
                required: true,
                email: true
            },
            regpassword: {
                required: true,
                minlength: 6
            },
            regpasswordrepeat: {
                required: true,
                minlength: 6,
                equalTo: "#regpassword"
            },
            regestado: {
                required: true,
                pickstate: true
            },
            regcidade: {
                required: true,
                pickcity: true
            }
        },
        messages: {
            regnome: {
                required: "Por favor digite o nome do usuário",
            },
            regcpf: {
                required: "Por favor digite um CPF válido"
            },
            regtel: {
                required: "Por favor digite um telefone válido com DDD"
            },
            regemail: {
                required: "Por favor digite um e-mail válido",
                email: "Por favor digite um e-mail válido"
            },
            regpassword: {
                required: "Por favor digite uma senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres"
            },
            regpasswordrepeat: {
                required: "Por favor confirme sua senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres",
                equalTo: "As senhas são diferentes"
            }
        }
    }
});

$("#regsubmit").on('click', () => {
    $("#registerform").validate();

    if ($("#registerform").valid()) {
        loadingFn("Processando...", "Espere um minutinho...")

        if (!estaEditando) {
            cadastraNovoUsuario()
        } else {
            atualizaUsuario()
        }
    }
});

function cadastraNovoUsuario() {
    // Dados do usuario
    let dadosUsuario = {
        "nome": $("#regnome").val(),
        "email": $("#regemail").val().trim(),
        "password": md5($("#regpassword").val()),
        "cpf": String($("#regcpf").val()).replace(/\D/g, ''),
        "telefone": $("#regtel").val(),
        "tipo_permissao": $("#regpapel").val()
    };
    
    console.log(JSON.stringify(dadosUsuario));

    restImpl.dbPOST(DB_TABLE_USUARIOS, "", dadosUsuario)
    .then(() => Swal2.fire({
            title: "Sucesso!",
            text: "Usuário criado com sucesso.",
            icon: "success",
            button: "Fechar"
        }))
    .then(() => navigateDashboard(lastPage))
    .catch((err) => {
        console.log(err);
        if (err != null) {
            var errmsg = err.message;
            if (err.code == "auth/email-already-in-use") {
                errmsg = "O e-mail informado já foi cadastrado."
            } else if (err.code == "auth/network-request-failed") {
                errmsg = "Erro de conexão com a Internet."
            } else if (err.code == "cpf-existente") {
                errmsg = "CPF já cadastrado. Por favor informe outro CPF ou " +
                         "entre em contato com a equipe do CECATE-UFG."
            }
            errorFn(errmsg)
        }
    })
}

function atualizaUsuario() {
    // Dados do usuario
    let dadosUsuario = {
        "nome": $("#regnome").val(),
        "email": $("#regemail").val(),
        "password": md5($("#regpassword").val()),
        "cpf": String($("#regcpf").val()).replace(/\D/g, ''),
        "telefone": $("#regtel").val(),
        "tipo_permissao": $("#regpapel").val()
    };
    console.log(JSON.stringify(dadosUsuario))
    restImpl.dbPUT(DB_TABLE_USUARIOS, "/" + estadoUsuario["ID"], dadosUsuario)
    .then(() => {
        debugger
        Swal2.fire({
        title: "Sucesso!",
        text: "Usuário alterado com sucesso.",
        icon: "success",
        button: "Fechar"
        })
    })
    .then(() => navigateDashboard(lastPage))
    .catch((err) => {
        debugger
        console.log(err);
        if (err != null) {
            var errmsg = err.message;
            if (err.code == "auth/user-not-found") {
                errmsg = "Usuário não encontrado."
            } else if (err.code == "auth/network-request-failed") {
                errmsg = "Erro de conexão com a Internet."
            }
            errorFn(errmsg)
        }
    })
}

if (estaEditando) {
    $(".pageTitle").html("Atualizar Usuário");
    $("#regsubmit").html("Atualizar");
    popularCamposUsuario(estadoUsuario);
    
    // Reativa máscaras
    $(".cep").trigger('input')
    $(".cpfmask").trigger('input')
    $(".telmask").trigger('input')
}