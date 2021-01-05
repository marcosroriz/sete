// Variáveis para baixar a malha
var http = require('http');
var fs = require('fs');

// Lista de cidades atuais
var listaCidadesAtuais = new Array();

// Variável armazendo o estado do formulário
var validadorFormulario;

// Localização do Usuário
var localizacao;

// Dados atuais de acesso
var emailAtual;
var senhaAtual;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    // Carrega dados da base local
    var userID = userconfig.get("ID");

    BuscarDadoEspecificoPromise("Usuarios", "ID", userID).then((userData) => {
        $("#regnome").val(userData[0]["NOME"]);
        $("#regemail").val(userData[0]["EMAIL"]);
        $("#regcpf").val(userData[0]["CPF"]);
        $("#regtel").val(userData[0]["TELEFONE"]);
        $("#regestado").val(userData[0]["COD_ESTADO"]);
        $("#regestado").trigger("change");
        $("#regcidade").val(userData[0]["COD_CIDADE"]);
        $("#regcidade").trigger("change");
        
        $("#emailAtual").val(userData[0]["EMAIL"])
        $("#senhaAtual").val(userData[0]["PASSWORD"]);

        emailAtual = userData[0]["EMAIL"];
        senhaAtual = userData[0]["PASSWORD"];
    });

    // Inicia máscaras de telefone e cpf do registro
    $(".telmask").mask(telmaskbehaviour, teloptions);
    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // Especifica o validador
    validadorFormulario = $("#wizardConfigForm").validate({
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
                regestado: {
                    required: true,
                    pickstate: true
                },
                regcidade: {
                    required: true,
                    pickcity: true
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
                regestado: {
                    required: "Por favor selecione seu Estado"
                },
                regcidade: {
                    required: "Por favor selecione seu Município"
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
            },
        }
    });

    // Cria o Wizard
    $('.card-wizard').bootstrapWizard({
        ...configWizardBasico('#wizardConfigForm')
    })

    // Configura o formulário de outros municípios para aparecer apenas 
    // quando o usuário dizer que faz transporte para outros municípios
    $("input[type=radio][name=temOutrasCidades]").change(function () {
        if (this.value == "true") {
            $("#outrosMunicipios").removeClass('d-none');
        } else {
            $("#outrosMunicipios").addClass('d-none');
        }
    });
});


// Função de conclusão do formulário
$("#finishconfig").on('click', () => {
    // Verifica se está válido
    var valido = validadorFormulario.valid();

    if (valido) {
        loadingFn("Atualizando o cadastro...")

        // Pega o ID e usuário do firebase
        let idUsuarioAtualizar = userconfig.get("ID");
        let usuarioVouAlterar = firebaseUser

        // Ler Variáveis Básicas do Formulário
        var dadosPessoais = {
            "ID": idUsuarioAtualizar,
            "NOME": $("#regnome").val(),
            "EMAIL": $("#regemail").val(),
            "CPF": $("#regcpf").val(),
            "TELEFONE": $("#regtel").val(),
            "CIDADE": $(localizacao.cidade).find("option:selected").text(),
            "ESTADO": $(localizacao.estado).find("option:selected").text(),
            "COD_CIDADE": localizacao.cidade.value,
            "COD_ESTADO": localizacao.estado.value,
            "INIT": 1
        };

        let precisaMudarEmail = $("#regemail").val() != emailAtual;
        let precisaMudarSenha = $("#regpassword").val() != senhaAtual;

        var promessas = new Array();
     
        promessas.push(AtualizarPromise("Usuarios", dadosPessoais, "ID", idUsuarioAtualizar))
        promessas.push(dbAtualizaUsuarioFirebasePromise(idUsuarioAtualizar, dadosPessoais))

        if (precisaMudarEmail) {
            promessas.push(usuarioVouAlterar.updateEmail($("#regemail").val()))
            userconfig.set("EMAIL", email);
        }

        if (precisaMudarSenha) {
            promessas.push(usuarioVouAlterar.updatePassword($("#regpassword").val()))
            userconfig.set("PASSWORD", password);
        }

        Promise.all(promessas)
        .then(() => Swal2.fire({
            title: "Sucesso!",
            text: "Usuário alterado com sucesso.",
            icon: "success",
            button: "Fechar"
        }))
        .then(() => navigateDashboard("./dashboard-main.html"))
        .catch((err) => {
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
});
