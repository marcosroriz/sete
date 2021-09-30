// Instanciação 
emailjs.init("user_319iA49jzZ51Sa7qehcii");
var SERVICE_ID = 'service_ij3p8cb';
var TEMPLATE_ID = 'template_5mqem8f';

// Localização do Usuário
var localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega o rodapé
    $("#footer").load("https://cdn.jsdelivr.net/gh/marcosroriz/sete@master/src/renderer/footer.html", function (response, status) {
        if (status == "error") {
            $("#footer").load("footer.html");
        }
    });

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

    // Popula o campo de proxy se tiver
    let usaproxy = userconfig.get('PROXY_USE');
    if (usaproxy) {
        let tipoProxy = userconfig.get('PROXY_TYPE');
        let enderecoProxy = userconfig.get('PROXY_ADDRESS');
        let portaProxy = userconfig.get('PROXY_PORT');
        let temAutenticacao = userconfig.get('PROXY_HASAUTENTICATION');
        let usuarioProxy = userconfig.get('PROXY_USER');
        let senhaProxy = userconfig.get('PROXY_PASSWORD');

        $("#chk-usarproxy").prop("checked", true);
        $("#tipo-proxy").val(tipoProxy);
        $("#endereco-proxy").val(enderecoProxy);
        $("#porta-proxy").val(portaProxy);

        if (temAutenticacao) {
            $("#chk-autenticarproxy").prop("checked", true);
            $("#proxy-user").val(usuarioProxy)
            $("#proxy-password").val(senhaProxy);
        } else {
            $("#proxyUserFields").hide();
        }
    } else {
        $("#chk-usarproxy").prop('disabled', true);
        $("#tipo-proxy").prop('disabled', true);
        $("#endereco-proxy").prop('disabled', true);
        $("#porta-proxy").prop('disabled', true);
        $("#chk-autenticarproxy").prop('disabled', true);
        $("#proxy-user").prop('disabled', true);
        $("#proxy-password").prop('disabled', true);
        $("#proxyUserFields").hide();
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
                repetirEmail: {
                    required: true,
                    email: true,
                    equalTo: "#regemail"
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
                repetirEmail: {
                    equalTo: "Os e-mails são diferentes"
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

    $("#proxyform").validate({
        ...configMostrarResultadoValidacao(),
        ...{
            rules: {
                "endereco-proxy": {
                    required: true,
                },
                "porta-proxy": {
                    required: true
                },
                "proxy-user": {
                    required: {
                        depends: function () {
                            return $('#chk-autenticarproxy').is(':checked');
                        }
                    }
                },
                "proxy-password": {
                    required: {
                        depends: function () {
                            return $('#chk-autenticarproxy').is(':checked');
                        }
                    }
                }
            },
            messages: {
                "endereco-proxy": {
                    required: "Por favor digite o endereço do servidor proxy",
                },
                "porta-proxy": {
                    required: "Por favor digite a porta do servidor proxy",
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
        var md5password = md5(password);
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

            axios.post(BASE_URL + "/authenticator/sete", {
                usuario: email,
                senha: md5password
            }).then((seteUser) => {
                debugger
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

                userconfig.set("CIDADE", seteUser.data.data.cidade)
                userconfig.set("ESTADO", seteUser.data.data.estado)
                userconfig.set("COD_CIDADE", String(seteUser.data.data.codigo_cidade))
                userconfig.set("COD_ESTADO", (seteUser.data.data.codigo_cidade + "").slice(0, 2))
                userconfig.set("ID", String(seteUser.data.data.id_usuario))
                userconfig.set("TIPO_PERMISSAO", String(seteUser.data.data.tipo_permissao))
                dadoUsuario = {
                    "ID": String(seteUser.data.data.id_usuario),
                    "NOME": seteUser.data.data.nome,
                    "EMAIL": seteUser.data.data.email,
                    "CPF": seteUser.data.data.cpf,
                    "TELEFONE": seteUser.data.data.telefone,
                    "CIDADE": seteUser.data.data.cidade,
                    "ESTADO": seteUser.data.data.estado,
                    "PASSWORD": password,
                    "COD_CIDADE": Number(seteUser.data.data.codigo_cidade),
                    "COD_ESTADO": Number((seteUser.data.data.codigo_cidade + "").slice(0, 2))
                }
                userconfig.set("DADO_USUARIO", dadoUsuario)

                return dadoUsuario;
            }).then(() => {
                return knex("IBGE_Municipios")
                    .select()
                    .where("codigo_ibge", userconfig.get("COD_CIDADE"))
            }).then((res) => {
                debugger
                userconfig.set("LATITUDE", res[0]["latitude"])
                userconfig.set("LONGITUDE", res[0]["longitude"])
                document.location.href = "./dashboard.html"
            }).catch((err) => {
                if (err?.response?.data?.messages) {
                    errorFn(err.response.data.messages);
                } else {
                    errorFn("Ocorreu um erro ao tentar fazer o login")
                }
            })

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

    $("#chk-usarproxy").on('click', function () {
        var checado = false;
        if ($(this).is(':checked'))
            checado = true;

        if (checado) {
            $('#tipo-proxy').prop('disabled', false);
            $('#endereco-proxy').prop('disabled', false);
            $('#endereco-proxy').prop('disabled', false);
            $('#porta-proxy').prop('disabled', false);
            $('#chk-autenticarproxy').prop('disabled', false);
            $("#proxy-user").prop('disabled', false);
            $("#proxy-password").prop('disabled', false);
        } else {
            $('#endereco-proxy').val('');
            $('#porta-proxy').val('');
            $('#tipo-proxy').prop('disabled', true);
            $('#endereco-proxy').prop('disabled', true);
            $('#porta-proxy').prop('disabled', true);
            $('#chk-autenticarproxy').prop('disabled', true);
            $('#chk-autenticarproxy').prop('checked', false);
            $("#proxy-user").prop('disabled', true);
            $("#proxy-password").prop('disabled', true);
            $("#proxyUserFields").hide();
        }
    });

    $("#chk-autenticarproxy").on('click', function () {
        $("#proxyUserFields").toggle();
    });

    $("#proxy-tab").on('click', function () {
        Swal2.fire({
            title: "Cuidado",
            text: `A utilização de um proxy altera a forma com que o SETE
                   se conecta à Internet. Antes de fazer alterações, 
                   consulte a equipe técnica do seu setor. Tem certeza que 
                   deseja prosseguir?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            cancelButtonText: "Cancelar",
            confirmButtonText: 'Sim'
        }).then((res) => {
            if (!res.value) {
                // Usuário não tem certeza, voltamos pra tela de login
                $("#login-tab").trigger('click');
            } else {
                $("#chk-usarproxy").prop('disabled', false);
            }
        })
    });

    $("#proxysubmit").on('click', function () {
        var checado = $("#chk-usarproxy").is(':checked')

        if (!checado) {
            // Remove Proxy
            userconfig.set("PROXY_USE", false);
            successDialog("Parabéns",
                "Operação executado com sucesso. Por favor, feche e " +
                " reabra o software para as alterações surtirem efeitos.")

        } else {
            let proxyValido = $("#proxyform").valid();
            if (proxyValido) {
                userconfig.set("PROXY_USE", true);
                userconfig.set('PROXY_TYPE', $("#tipo-proxy").val());
                userconfig.set('PROXY_ADDRESS', $("#endereco-proxy").val());
                userconfig.set('PROXY_PORT', $("#porta-proxy").val());

                let temAutenticacao = $("#chk-autenticarproxy").is(':checked');
                if (temAutenticacao) {
                    // TODO: fazer md5/sha1
                    userconfig.set('PROXY_HASAUTENTICATION', true);
                    userconfig.set('PROXY_USER', $("#proxy-user").val());
                    userconfig.set('PROXY_PASSWORD', $("#proxy-password").val());
                } else {
                    userconfig.set('PROXY_HASAUTENTICATION', false);
                }

                successDialog("Parabéns",
                    "Operação executado com sucesso. Por favor, feche e " +
                    " reabra o software para as alterações surtirem efeitos.")
            }
        }
    });

    $("#proxycancel").on('click', function () {
        // Usuário não tem certeza, voltamos pra tela de login
        $("#login-tab").trigger('click');
    })

});

// Indica que o script terminou seu carregamento
window.loadedLoginControl = true;
