// Instanciação 
emailjs.init("user_319iA49jzZ51Sa7qehcii");
const SERVICE_ID = 'service_ij3p8cb';
const TEMPLATE_ID = 'template_5mqem8f';

// Localização do Usuário
var localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega o rodapé
    $("#footer").load("./footer.html");

    // Ativa a aba de login por padrão
    $("#login-tab").trigger('click');

    // Vincula o click do botão de registrar a aba de registro
    $("#reglink").on('click', () => $("#registrar-tab").trigger('click'));

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
        ...configMostrarResultadoValidacao(),
        ...{
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
            }
        }
    });

    $("#recoveryform").validate({
        ...configMostrarResultadoValidacao(),
        ...{
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
        }
    });

    $("#registerform").validate({
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
        }
    });

    // Ações do teclado para Login (pressionar Enter para logar)
    $("#loginemail, #loginpassword").keypress((e) => {
        if (e.which === 13) {
            $("#loginsubmit").click();
        }
    });
    $("#recoveremail").keypress((e) => {
        if (e.which === 13) {
            $("#recoversubmit").click();
        }
    });

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
                    if (lembrarlogin) {
                        userconfig.set("LEMBRAR", true);
                        userconfig.set("EMAIL", email);
                        userconfig.set("PASSWORD", password);
                    } else {
                        userconfig.delete("LEMBRAR");
                        userconfig.delete("EMAIL");
                        userconfig.delete("PASSWORD");
                    }
                    userconfig.set("ID", firebaseUser.user.uid);
                    return firebaseUser.user.uid
                })
                .then((uid) => dbObterPerfilUsuario(uid)) // Obtém o perfil remoto do usuário
                .then((remoteData) => {
                    userconfig.set("CIDADE", String(remoteData.CIDADE))
                    userconfig.set("ESTADO", String(remoteData.ESTADO))
                    userconfig.set("COD_CIDADE", String(remoteData.COD_CIDADE))
                    userconfig.set("COD_ESTADO", String(remoteData.COD_ESTADO))
                    userconfig.set("ID", remoteData["ID"])

                    dadoUsuario = {
                        "ID": remoteData["ID"],
                        "NOME": remoteData["NOME"],
                        "EMAIL": remoteData["EMAIL"],
                        "CPF": remoteData["CPF"],
                        "TELEFONE": remoteData["TELEFONE"],
                        "CIDADE": remoteData["CIDADE"],
                        "ESTADO": remoteData["ESTADO"],
                        "PASSWORD": remoteData["PASSWORD"],
                        "COD_CIDADE": parseInt(remoteData["COD_CIDADE"]),
                        "COD_ESTADO": parseInt(remoteData["COD_ESTADO"])
                    }
                    userconfig.set("DADO_USUARIO", dadoUsuario)
                    return dadoUsuario;
                }).then((dadoUsuario) => {
                    let cod_cidade = String(dadoUsuario["COD_CIDADE"]);
                    return remotedb.collection("config").doc(cod_cidade).get({ source: "server" });
                }).then((docConfig) => {
                    let acessoLiberado = false;
                    if (docConfig.exists) {
                        arDataConfig = docConfig.data();
                        let idUsuario = userconfig.get("ID");
                        if (arDataConfig.users.indexOf(idUsuario) > -1) {
                            acessoLiberado = true;
                            // TODO: Checar o campo INIT posteriormente
                        }
                    } else {
                        throw new Exception("Acesso ainda não foi liberado pela equipe do CECATE-UFG");
                    }
                    return acessoLiberado;
                }).then(() => {
                    let dadoUsuario = userconfig.get("DADO_USUARIO");
                    return RecuperarUsuario(dadoUsuario["ID"]).then(userData => {
                        if (userData.length == 0) {
                            return InserirUsuario(dadoUsuario)
                        } else {
                            return true;
                        }
                    })
                }).then(() => document.location.href = "./dashboard.html")
                .catch((err) => {
                    if (err != null) {
                        if (err.code == "auth/wrong-password") {
                            errorFn("Senha incorreta")
                        } else if (err.code == "auth/user-not-found") {
                            errorFn("Usuário não encontrado")
                        } else if (err.code == "auth/network-request-failed") {
                            errorFn("Internet não está funcionando. Verifique a rede")
                        } else if (err.code == "permission-denied") {
                            errorFn(`Usuário ainda não foi ativado pela equipe do CECATE-UFG. 
                                    Aguarde mais um pouquinho ou entre em contato com a
                                    equipe do CECATE-UFG através do email (cecateufg@gmail.com).`)
                        } else {
                            errorFn("Erro ao tentar realizar login. Contate a equipe de suporte do CECATE (cecateufg@gmail.com)")
                        }
                    }
                });
        }
    });

    // Recuperar senha
    $("#recoversubmit").on('click', () => {
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
    $("#regsubmit").on('click', () => {
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

                    emailjs.send(SERVICE_ID, TEMPLATE_ID, userData)
                        .then(function (response) {
                            console.log('SUCCESS!', response.status, response.text);
                        }, function (error) {
                            console.log('FAILED...', error);
                        });
                    //Alimenta a coleção config com os documentos do municipio
                    var dataConfig = remotedb.collection("config").doc(localizacao.cidade.value);
                    dataConfig.get().then(function (doc) {
                        if (!doc.exists) {
                            remotedb.collection("config")
                                .doc(localizacao.cidade.value)
                                .set({ "admin": [], "users": [], "readers": [] })
                                .then(() => criarColecaoMunicipio(localizacao.cidade.value))
                        }
                    })


                    var promiseArray = new Array();
                    promiseArray.push(remotedb.collection("users").doc(fbuser.user.uid).set(userData));
                    promiseArray.push(InserirUsuario(userData));

                    Promise.all(promiseArray).then(() => {
                        Swal2.close();
                        Swal2.fire({
                            title: "Parabéns!",
                            text: "Sua conta foi criada com sucesso. Ela será analisada pela equipe do CECATE e em breve você já poderá realizar o login.",
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

    function criarColecaoMunicipio(codMunicipio) {
        //Cria a coleção dos dados para o municipio caso não tenha sido criado ainda
        var dataFirebase = remotedb.collection("municipios").doc(codMunicipio);
        dataFirebase.get().then(function (doc) {
            if (!doc.exists) {
                //console.log("Cidade Não existe");
                remotedb.collection("municipios").doc(codMunicipio).set({
                    "alunos": [], "escolatemalunos": [], "escolas": [], "faztransporte": [], "fornecedores": [],
                    "garagem": [], "garagemtemveiculo": [], "motoristas": [], "municipios": [], "ordemdeservico": [],
                    "rotaatendealuno": [], "rotadirigidapormotorista": [], "rotapassaporescolas": [], "rotapossuiveiculo": [],
                    "rotas": [], "veiculos": [],
                    "INIT": false
                });
            }
        })

    }

    $("#chk-usarproxy").click(function () {
        var checado = false;
        if ($(this).is(':checked'))
            checado = true;

        if (checado) {
            $('#endereco-proxy').prop('disabled', false);
            $('#porta-proxy').prop('disabled', false);
        } else {
            $('#endereco-proxy').val('');
            $('#porta-proxy').val('');
            $('#endereco-proxy').prop('disabled', true);
            $('#porta-proxy').prop('disabled', true);
        }
    });

    $("#proxy-tab").click(function () {
        var proxy = userconfig.get('proxy');
        if (proxy.is_usa_proxy === 1) {
            $('#chk-usarproxy').prop('checked', true);
            $('#endereco-proxy').val(proxy.servidor);
            $('#porta-proxy').val(proxy.porta);
            $('#endereco-proxy').prop('disabled', false);
            $('#porta-proxy').prop('disabled', false);
        } else {
            $('#endereco-proxy').prop('disabled', true);
            $('#porta-proxy').prop('disabled', true);
        }
    });

    $("#proxysubmit").click(function () {
        var checado = $("#chk-usarproxy").is(':checked')
        var endereco = $("#endereco-proxy").val()
        var porta = $("#porta-proxy").val()
        if (checado && (endereco === "" || porta === "")) {
            errorFn("Preencha o endereço e porta corretamente!");
        } else {
            AtualizarProxy(checado, endereco, porta)
        }
        if (!checado) {
            AtualizarProxy(checado, endereco, porta);
        }
    });

});