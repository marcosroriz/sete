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

        // Dados do usuario
        var newUserData = {
            "NOME": $("#regnome").val(),
            "EMAIL": $("#regemail").val(),
            "PASSWORD": $("#regpassword").val(),
            "CPF": $("#regcpf").val(),
            "TELEFONE": $("#regtel").val(),
            "CIDADE": userconfig.get('CIDADE'),
            "ESTADO": userconfig.get('ESTADO'),
            "COD_CIDADE": userconfig.get('COD_CIDADE'),
            "COD_ESTADO": userconfig.get('COD_ESTADO')
        };
        var email = $("#regemail").val();
        var password = $("#regpassword").val();
        var cpf = $("#regcpf").val();
        var papel = $("#papel").val();
        
        // Guarda os dados do usuário logado para depois realizar a autenticação novamente
        // Ao criar um novo usuário o firebase automaticamente faz logout e faz login no novo usuario
        let emailUsuarioLogado = userconfig.get("EMAIL");
        let senhaUsuarioLogado = userconfig.get("PASSWORD");

        // ID do novo usuario
        var idNovoUsuario = null;

        // Ok, vamos cadastrar!
        // Verificar se já existe um usuário com esse CPF
        dbBuscarUsuarioPorCPFPromise(cpf)
        .then((res) => {
            if (res.size != 0) {
                Swal2.fire({
                    title: "Atenção!",
                    text: "CPF já cadastrado. Por favor informe outro CPF ou " +
                          "entre em contato com a equipe do CECATE-UFG.",
                    icon: "warning",
                    button: "Fechar"
                });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(email, password)
            }
        })
        .then((fbuser) => { // Insere os dados do usuário no sqlite e no firebase
            idNovoUsuario = fbuser.user.uid;
            newUserData["ID"] = idNovoUsuario;

            var promiseArray = new Array();
            promiseArray.push(dbInsereUsuarioFirebasePromise(idNovoUsuario, newUserData));
            promiseArray.push(InserirUsuario(newUserData));
            
            return Promise.all(promiseArray)
        })
        .then(() => firebase.auth().signOut()) // Desloga o usuário que acabou de ser criado
        .then(() => firebase.auth().signInWithEmailAndPassword(emailUsuarioLogado, senhaUsuarioLogado)) // Login
        .then(() => { // Habilita o usuário criado
            if (idNovoUsuario != null) {
                return dbHabilitaUsuarioConfigPromise(idNovoUsuario, papel) 
            } else {
                throw Error("Erro ao criar novo usuário no Banco de Dados.")
            }
        })
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
                }
                errorFn(errmsg)
            }
        })
    }
});