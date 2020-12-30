// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);



var completeForm = () => {
    Swal2.fire({
        title: "Aluno salvo com sucesso",
        text: "O aluno " + $("#regnome").val() + " foi salvo com sucesso. " +
            "Clique abaixo para retornar ao painel.",
        type: "info",
        icon: "info",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    })
        .then(() => {
            navigateDashboard("./modules/usuario/usuario-listar-view.html");
        });
}

$("#btCancelarCadastroUsuario").click(() => {
    navigateDashboard(lastPage);
})

$("#registerform").validate({
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
    },
    highlight: function (element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function (element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function (error, element) {
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});


$("#regsubmit").click(() => {
    $("#registerform").validate();

    if ($("#registerform").valid()) {

        Swal2.fire({
            title: "Cadastrando...",
            text: "Espere um minutinho...",
            imageUrl: "img/icones/processing.gif",
            icon: "img/icones/processing.gif",
            buttons: false,
            showSpinner: true,
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: false
        });

        var email = $("#regemail").val();
        var password = $("#regpassword").val();
        var nome = $("#regnome").val();
        var cpf = $("#regcpf").val();
        var telefone = $("#regtel").val();
        var cidade = userconfig.get('CIDADE');
        var estado = userconfig.get('ESTADO');
        var cod_cidade = userconfig.get('COD_CIDADE');
        var cod_estado = userconfig.get('COD_ESTADO');

        UsuarioExistePorCPF(cpf).then((result) => {
            if (result.length === 0) {
                //Guarda o uid do usuário logado para depois realizar a autenticação novamente
                var user = firebase.auth().currentUser;
                var UIDLogado = user.uid;

                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then((fbuser) => {
                        var newUserData = {
                            "ID": fbuser.user.uid,
                            "NOME": nome,
                            "EMAIL": email,
                            "PASSWORD": password,
                            "CPF": cpf,
                            "TELEFONE": telefone,
                            "CIDADE": cidade,
                            "ESTADO": estado,
                            "COD_CIDADE": cod_cidade,
                            "COD_ESTADO": cod_estado
                        };
                        //Grava os dados do novo usuário para inserir na lista config posteriormente
                        userconfig.set("dadosNovoUsuario", newUserData);
                        var promiseArray = new Array();
                        promiseArray.push(remotedb.collection("users").doc(fbuser.user.uid).set(newUserData));
                        promiseArray.push(InserirUsuario(newUserData));
                        Promise.all(promiseArray).then(() => {
                            //Desloga o usuario que acabou de ser criado
                            firebase.auth().signOut().then(function () {
                                RecuperarUsuario(UIDLogado).then((resultUserBD) => {
                                    //Efetua login novamente do usuario que estava logado
                                    firebase.auth().signInWithEmailAndPassword(resultUserBD[0].EMAIL, resultUserBD[0].PASSWORD)
                                        .then((user) => {
                                            Swal2.close();
                                            Swal2.fire({
                                                title: "Sucesso!",
                                                text: "Usuário criado com sucesso.",
                                                icon: "success",
                                                type: "success",
                                                button: "Fechar"
                                            }).then(() => {
                                                navigateDashboard(lastPage);
                                            });
                                        })
                                        .catch((error) => {
                                            var errorCode = error.code;
                                            var errorMessage = error.message;
                                        });


                                })
                            }).catch(function (error) {
                                errorFn("Não foi possível concluir o cadasto. Feche o software e abra novamente!");
                                return;
                            });
                        })
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
                                    return;
                                }
                            });
                    })
            } else {
                Swal2.close();
                Swal2.fire({
                    title: "Atenção!",
                    text: "CPF já cadastrado. Verifique e tente novamente!",
                    icon: "warning",
                    type: "warning",
                    button: "Fechar"
                });
            }
        })

    }
});