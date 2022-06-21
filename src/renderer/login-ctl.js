// Instanciação 
emailjs.init("user_319iA49jzZ51Sa7qehcii");
let SERVICE_ID = 'service_ij3p8cb';
let TEMPLATE_ID = 'template_5mqem8f';

// Localização do Usuário
let localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(() => {
    // Carrega o rodapé
    $("#footer").load("footer.html");

    // Ativa a aba de login por padrão
    $("#login-tab").trigger('click');

    // Vincula o click do botão de registrar a aba de registro
    $("#reglink").on('click', () => $("#registrar-tab").trigger('click'));

    // Popula o campo de email e senha se o usuário tiver logado previamente
    // Para isso, vamos ver se exite a chave / valor lembrar no arquivo de configuração local do usuário
    if (userconfig.get("LEMBRAR")) {
        $("#loginemail").val(userconfig.get("EMAIL"));
        $("#loginpassword").val(userconfig.get("PASSWORD"));
        $("#recoveremail").val(userconfig.get("EMAIL"));
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
    $("#loginemail, #loginpassword").on("keyup", (e) => {
        if (e.code == "Enter" || e.code == "NumpadEnter") {
            $("#loginsubmit").trigger("click");
        }
    });
    
    $("#recoveremail").on("keyup", (e) => {
        if (e.code == "Enter" || e.code == "NumpadEnter") {
            $("#recoversubmit").trigger("click");
        }
    });

    // Ações para cada click

    // No caso de login iremos fazer o login do usuário no arquivo local (userconfig)
    $("#loginsubmit").on("click", () => {
        let email = $("#loginemail").val().trim();
        let password = $("#loginpassword").val();
        let md5password = MD5(password);
        let lembrarlogin = $("#loginlembrar").is(":checked");

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
                userconfig.set("LATITUDE", Number(seteUser.data.data.latitude))
                userconfig.set("LONGITUDE", Number(seteUser.data.data.longitude))
                userconfig.set("ID", String(seteUser.data.data.id_usuario))
                userconfig.set("TIPO_PERMISSAO", String(seteUser.data.data.tipo_permissao))
                userconfig.set("NOME", seteUser.data.data.nome)
                userconfig.set("TOKEN", seteUser.data.access_token.access_token)
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
                    "COD_ESTADO": Number((seteUser.data.data.codigo_cidade + "").slice(0, 2)),
                    "TOKEN": seteUser.data.access_token.access_token
                }
                userconfig.set("DADO_USUARIO", JSON.stringify(dadoUsuario))

                return dadoUsuario;
            }).then(() => {
                if (window.process) { // Electron
                    return knex("IBGE_Municipios")
                        .select()
                        .where("codigo_ibge", userconfig.get("COD_CIDADE"))
                } else { // Browser
                    return []
                }
            }).then((res) => {
                if (res.length > 0) {
                    userconfig.set("LATITUDE", res[0]["latitude"])
                    userconfig.set("LONGITUDE", res[0]["longitude"])
                }

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
        let email = $("#recoveremail").val().trim();
        $("#recoveryform").validate();

        if ($("#recoveryform").valid()) {
            loadingFn("Enviando o e-mail...");

            let recoverURL = BASE_URL + "/acesso/recovery";
            axios.post(recoverURL, {
                "email": email
            }).then(() => Swal2.fire({
                title: "E-mail enviado!",
                text: `Enviamos um e-mail para o endereço ${email} contendo um link para modificar sua senha`,
                type: "success",
                icon: "success",
                confirmButtonClass: "btn-success",
                confirmButtonText: "Retornar ao sistema",
            })
            ).then(() => {
                abrePopupInsercaoRecuperacaoSenha(email);
            }).catch((err) => {
                if (err != null) {
                    errorFn(`Tivemos um problema ao tentar recupear o e-mail ${email}`, err)
                }
            });
        } else {
            errorFn(`O e-mail ${email} não foi encontrado`)
        }

        return false;
    });

    function abrePopupInsercaoRecuperacaoSenha(email = "") {
        Swal2.fire({
            width: '800px',
            title: 'Recuperação da Senha',
            html:
                `<label class="form-check-label col-3 text-right" for="codigo" maxlength=255>E-mail</label>
                <input type="text" id="recuperarEmail" class="swal2-input" placeholder="E-mail" value="${email}"></input>
                <br />
                <label class="form-check-label col-3 text-right" for="codigo" maxlength=255>Código de Recuperação</label>
                <input type="text" id="recuperarCodigo" class="swal2-input" placeholder="Código"></input>
                <br />
                <label class="form-check-label col-3 text-right" for="recuperarSenha">Nova Senha</label>
                <input type="password" id="recuperarSenha" class="swal2-input" placeholder="Senha"></input>
                <br />
                <label class="form-check-label col-3 text-right" for="recuperarSenha">Repetir Nova Senha</label>
                <input type="password" id="recuperarSenhaRepeticao" class="swal2-input" placeholder="Digite a senha novamente"></input>`,
            confirmButtonText: 'Recuperar a Senha',
            focusConfirm: false,
            confirmButtonColor: "#ff9510",
            showCancelButton: true,
            cancelButtonColor: "#797979",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const email = String(Swal2.getPopup().querySelector('#recuperarEmail').value).trim();
                const codigo = String(Swal2.getPopup().querySelector('#recuperarCodigo').value).trim();
                const recuperarSenha = Swal2.getPopup().querySelector('#recuperarSenha').value;
                const recuperarSenhaRepetida = Swal2.getPopup().querySelector('#recuperarSenhaRepeticao').value;

                if (email == null || email == "") {
                    Swal2.showValidationMessage("E-mail vazio");
                } else if (codigo == null || codigo == "") {
                    Swal2.showValidationMessage("Código vazio");
                } else if (recuperarSenha == null || recuperarSenha == undefined && recuperarSenha == "" ||
                    recuperarSenhaRepetida == null || recuperarSenhaRepetida == undefined || recuperarSenhaRepetida == "") {
                    Swal2.showValidationMessage("Pelo menos uma das senhas está vazia");
                } else if (recuperarSenha != recuperarSenhaRepetida) {
                    Swal2.showValidationMessage("As senhas digitadas são diferentes");
                } else if (recuperarSenha.length <= 6 && recuperarSenhaRepetida.length <= 6) {
                    Swal2.showValidationMessage("As senhas devem ter no mínimo seis dígitos");
                }
                return { email, codigo, recuperarSenha, recuperarSenhaRepetida }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let { email, codigo, recuperarSenha } = result.value;
                let senhamd5 = MD5(recuperarSenha);

                return axios.put(BASE_URL + "/acesso/recovery", {
                    "email": email,
                    "key": codigo,
                    "senha": senhamd5
                }).then(() => successDialog())
            }
        }).catch((err) => {
            errorFn("Erro", err)
        })

    }

    $("#inserirCodigoRecuperacaoSenha").on('click', () => {
        abrePopupInsercaoRecuperacaoSenha($("#recoveremail").val());
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

            let email = $("#regemail").val().trim();
            let password = $("#regpassword").val();
            let md5password = MD5(password);
            let nome = $("#regnome").val();
            let cpf = $("#regcpf").val();
            let telefone = $("#regtel").val();
            let cidade = $(localizacao.cidade).find("option:selected").text();
            let estado = $(localizacao.estado).find("option:selected").text();

            axios.post(`${BASE_URL}/registro/${localizacao.cidade.value}`, {
                "nome": nome,
                "cpf": String(cpf).replace(/\D/g, ''),
                "telefone": telefone,
                "email": email,
                "password": md5password,
                "tipo_permissao": "admin"
            }).then(() => {
                let userData = {
                    "NOME": nome,
                    "EMAIL": email,
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

                Swal2.close();
                Swal2.fire({
                    title: "Parabéns!",
                    text: "Sua conta foi criada com sucesso. Ela será analisada pela equipe do CECATE e em breve você já poderá realizar o login.",
                    icon: "success",
                    type: "success",
                    button: "Fechar"
                });
                
                userconfig.set("EMAIL", email);
                userconfig.set("PASSWORD", password);
                $("#loginemail").val($("#regemail").val().trim());
                $("#loginpassword").val($("#regpassword").val());
                $("#login-tab").trigger('click');
            }).catch((err) => {
                let errorMSG = "Não foi possível fazer o registro. Entre em contato com a equipe de suporte."
                if (err?.response?.data?.messages) {
                    errorMSG = err.response.data.messages.join("\n");
                }
                errorFn(errorMSG);
            })
        }
    });

    $("#regpassword, #regpasswordrepeat").on("keyup", () => {
        $("#regpassword").valid();
        $("#regpasswordrepeat").valid();
    });

    $("#chk-usarproxy").on('click', function () {
        let checado = false;
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
        if (isElectron) {
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
        } else {
            Swal2.fire({
                title: "Indisponível",
                text: "A funcionalidade de Proxy está somente disponível na versão desktop.",
                icon: "warning",
            }).then(() => {
                $("#login-tab").trigger('click');
            })
        }
    });

    $("#proxysubmit").on('click', function () {
        let checado = $("#chk-usarproxy").is(':checked')

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

    if (isElectron) {
        mostraSeTemUpdate();
    }
});

// Indica que o script terminou seu carregamento
window.loadedLoginControl = true;
