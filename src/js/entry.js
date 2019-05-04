// Localização do Usuário
let localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega o rodapé
    $("#footer").load("./footer.html");

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
                required: "Por favor digite sua senha"
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

    // Ações para cada click

    // No caso de login iremos fazer o login com o Firebase as preferências
    // do usuário no arquivo local (userconfig)
    $("#loginsubmit").click(() => {
        let email = $("#loginemail").val();
        let password = $("#loginpassword").val();
        let lembrarlogin = $("#loginlembrar").is(":checked");

        $("#loginform").validate();

        if ($("#loginform").valid()) {
            var loadingWin = swal({
                title: "Carregando...",
                text: "Fazendo login...",
                icon: "info",
                buttons: false
            });

            firebase.auth().signInWithEmailAndPassword(email, password)
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
                    Users.where({ ID: firebaseUser.user.uid }).fetch().then((userData) => {
                        let hasInit = JSON.parse(userData.attributes["INIT"]);
                        let urldestino = "./initconfig.html";
                        if (hasInit) {
                            //urldestino = "./dashboard.html";
                        	urldestino = "./cadastrar_escola.html";
                        }
                        document.location.href = urldestino;
                    });
                })
                .catch((err) => {
                    if (err != null) {
                        // TODO: Fazer alertas com as mensagens
                        console.log(err.message);
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: err.message,
                            icon: "error",
                            button: "Fechar"
                        });
                        return;
                    }
                });
        }
    });

    // recoversubmit
    $("#recoversubmit").click(() => {
        let email = $("#recoveremail").val();

        $("#recoveryform").validate();

        if ($("#recoveryform").valid()) {
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    swal({
                        title: "E-mail enviado!",
                        text: "Enviamos um e-mail para o endereço " + email + " contendo um link para modificar sua senha",
                        icon: "success",
                        button: "Fechar"
                    });
                })
                .catch((err) => {
                    if (err != null) {
                        console.log(err.message);
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: err.message,
                            icon: "error",
                            button: "Fechar"
                        });
                        return;
                    }
                });
        }
    });

    // No caso de registro temos que fazer a validação do formulário
    // e criar os documentos básicos (/users e /data) 
    $("#regsubmit").click(() => {
        $("#registerform").validate();

        if ($("#registerform").valid()) {
            let processingModalWin = swal({
                title: "Processando...",
                text: "Espere um minutinho...",
                icon: "info",
                buttons: false
            });

            let email = $("#regemail").val();
            let password = $("#regpassword").val();
            let nome = $("#regnome").val();
            let cpf = $("#regcpf").val();
            let telefone = $("#regtel").val();
            let cidade = $(localizacao.cidade).find("option:selected").text();
            let estado = $(localizacao.estado).find("option:selected").text();

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((fbuser) => {
                    let userData = {
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

                    let remoteUser = remotedb.collection("users").doc(fbuser.user.uid).set(userData);
                    let remoteUserData = remotedb.collection("data").doc(fbuser.user.uid).set({ "INIT": false });
                    let localUser = new Users(userData).save(null, { method: "insert" });

                    Promise.all([localUser, remoteUser, remoteUserData]).then(() => {
                        swal.close();
                        swal({
                            title: "Parabéns!",
                            text: "Sua conta foi criada com sucesso. Você já pode fazer o login.",
                            icon: "success",
                            button: "Fechar"
                        });

                        $("#login-tab").click();
                    });
                })
                .catch((err) => {
                    console.log(err);

                    if (err != null) {
                        let errmsg = err.message;
                        if (err.code == "auth/email-already-in-use") {
                            errmsg = "O e-mail informado já foi cadastrado."
                        } else if (err.code == "auth/network-request-failed") {
                            errmsg = "Erro de conexão com a Internet."
                        }
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: errmsg,
                            icon: "error",
                            button: "Fechar"
                        });

                        return;
                    }
                });
        } else {
            alert("Algum erro no formulário");
        }
    });
});
