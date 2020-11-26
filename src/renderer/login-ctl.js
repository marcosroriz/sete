// Localização do Usuário
var localizacao;

function errorFn(msg) {
    Swal2.fire({
        icon: 'error',
        type: 'error',
        title: 'Oops...',
        text: msg,
        confirmButtonClass: "btn btn-danger",
        buttonsStyling: false
    })
}

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega o rodapé
    $("#footer").load("./footer.html");

    // Ativa a aba de login por padrão
    $("#login-tab").click();
    $("#reglink").click(() => $("#registrar-tab").click());
    // Popula o campo de email e senha se o usuário tiver logado previamente
    // Para isso, vamos ver se exite a chave / valor lembrar no arquivo de configuração local do usuário
    if (userconfig.get("LEMBRAR")) {
        $("#loginemail").val(userconfig.get("EMAIL"));
        $("#loginpassword").val(userconfig.get("PASSWORD"));
    }

    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    // Inicia máscaras de telefone e cpf do registro
    $('.telmask').mask(telmaskbehaviour, teloptions);
    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // Cria a validação para os formulários
    $("#loginform").validate({
        rules: {
            loginemail: {
                required: true,
                email: true
            },
            loginpassword: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            loginemail: {
                required: "Por favor digite seu endereço de e-mail",
                email: "Por favor digite um endereço de e-mail válido"
            },
            loginpassword: {
                required: "Por favor digite sua senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres"
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

    $("#recoveryform").validate({
        rules: {
            recoveremail: {
                required: true,
                email: true
            }
        },
        messages: {
            recoveremail: {
                required: "Por favor digite seu endereço de e-mail",
                email: "Por favor digite um endereço de e-mail válido"
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
                required: "Por favor digite seu endereço de e-mail",
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
            },
            regestado: {
                required: "Por favor selecione seu Estado"
            },
            regcidade: {
                required: "Por favor selecione seu Município"
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

    // Ações de teclado para Login (pressionar Enter para logar)

    $("#loginemail").keypress((e) => {
        if(e.which === 13) {
            $("#loginsubmit").click();
        }
    })
    $("#loginpassword").keypress((e) => {
        if(e.which === 13) {
            $("#loginsubmit").click();
        }
    })
    $("#recoveremail").keypress((e) => {
        if(e.which === 13) {
            $("#recoversubmit").click();
        }
    })
    
    // Ações para cada click

    // No caso de login iremos fazer o login com o Firebase as preferências
    // do usuário no arquivo local (userconfig)
    $("#loginsubmit").click(() => {
        var email = $("#loginemail").val();
        var password = $("#loginpassword").val();
        var lembrarlogin = $("#loginlembrar").is(":checked");

        $("#loginform").validate();

        if ($("#loginform").valid()) {
            Swal2.fire({
                title: "Carregando...",
                text: "Fazendo login...",
                type: "info",
                icon: 'info',
                buttons: false,
                closeOnClickOutside: false,
                allowOutsideClick: false,
                showConfirmButton: false
            });

            firebase.auth()
                .signInWithEmailAndPassword(email, password)
                .then((firebaseUser) => {
                    // Set local config 
                    if (loginlembrar) {
                        userconfig.set("LEMBRAR", true);
                        userconfig.set("EMAIL", email);
                        userconfig.set("PASSWORD", password);
                    } else {
                        userconfig.delete("LEMBRAR");
                        userconfig.delete("EMAIL");
                        userconfig.delete("PASSWORD");
                    }
                    userconfig.set("ID", firebaseUser.user.uid);

                    // Checar se o usuário já fez a configuração inicial
                    RecuperarUsuario(firebaseUser.user.uid).then((userData) => {
                        if (userData.length == 0) {
                            var remoteUserData = remotedb.collection("users").doc(firebaseUser.user.uid);
                            remoteUserData.get().then((remoteDoc) => {
                                var remoteData = remoteDoc.data();
                                remoteData["INIT"] = false;
                                InserirUsuario(remoteData).then(() => {
                                    document.location.href = "./initconfig-view.html";
                                });
                            });
                        } else {
                            var hasInit = JSON.parse(userData[0]["INIT"]);
                            var urldestino = "./initconfig-view.html";
                            if (hasInit) {
                                urldestino = "./dashboard.html";
                            }
                            document.location.href = urldestino;
                        }
                    });
                })
                .catch((err) => {
                    if (err != null) {
                        console.log(err.message);
                        errorFn(`Login inválido! ${err}`)
                        return;
                    }
                });
        }
    });

    // recoversubmit
    $("#recoversubmit").click(() => {
        var email = $("#recoveremail").val();
        $("#recoveryform").validate();

        if ($("#recoveryform").valid()) {
            console.log("email valido")
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    Swal2.fire({
                        title: "E-mail enviado!",
                        text: "Enviamos um e-mail para o endereço " + email + " contendo um link para modificar sua senha",
                        type: "success",
                        icon: "success",
                        confirmButtonClass: "btn-success",
                        confirmButtonText: "Retornar ao sistema",
                    })
                })
                .catch((err) => {
                    if (err != null) {
                        errorFn(`Tivemos um problema ao tentar recupear o e-mail ${email}`)
                    }
                });
        } else {
            errorFn(`O e-mail ${email} não foi encontrado`)
        }
    });

    // No caso de registro temos que fazer a validação do formulário
    // e criar os documentos básicos (/users e /data) 
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
            var cidade = $(localizacao.cidade).find("option:selected").text();
            var estado = $(localizacao.estado).find("option:selected").text();

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((fbuser) => {
                    var userData = {
                        "ID": fbuser.user.uid,
                        "NOME": nome,
                        "EMAIL": email,
                        "PASSWORD": password,
                        "CPF": cpf,
                        "TELEFONE": telefone,
                        "CIDADE": cidade,
                        "ESTADO": estado,
                        "COD_CIDADE": localizacao.cidade.value,
                        "COD_ESTADO": localizacao.estado.value
                    };

                    var promiseArray = new Array();
                    promiseArray.push(remotedb.collection("users").doc(fbuser.user.uid).set(userData));
                    promiseArray.push(remotedb.collection("data").doc(fbuser.user.uid).set({
                        "alunos": [], "escolatemalunos": [], "escolas": [], "faztransporte": [], "fornecedores": [],
                        "garagem": [], "garagemtemveiculo": [], "motoristas": [], "municipios": [], "ordemdeservico": [],
                        "rotaatendealuno": [], "rotadirigidapormotorista": [], "rotapassaporescolas": [], "rotapossuiveiculo": [],
                        "rotas": [], "veiculos": [],
                        "INIT": false
                    }));
                    promiseArray.push(InserirUsuario(userData));

                    Promise.all(promiseArray).then(() => {
                        Swal2.close();
                        Swal2.fire({
                            title: "Parabéns!",
                            text: "Sua conta foi criada com sucesso. Você já pode fazer o login.",
                            icon: "success",
                            type: "success",
                            button: "Fechar"
                        });

                        $("#loginemail").val($("#regemail").val());
                        $("#loginpassword").val($("#regpassword").val());
                        $("#login-tab").click();
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
        }
    });

    $("#regpassword").change(() => {
        $("#regpassword").valid();
    })

    $("#regpasswordrepeat").change(() => {
        $("#regpasswordrepeat").valid();
    });

});