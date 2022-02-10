// Lista de cidades atuais
var listaCidadesAtuais = new Array();

// Variável armazendo o estado do formulário
var validadorFormulario;

// Localização do Usuário
var localizacao;

// Dados do usuário
var usuarioJSON = JSON.parse(userconfig.get("DADO_USUARIO"));

// Dados atuais de acesso
var emailAtual = usuarioJSON["EMAIL"];
var senhaAtual = usuarioJSON["PASSWORD"];

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(function () {
    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    // Carrega dados da base local
    $("#regnome").val(usuarioJSON["NOME"]);
    $("#regemail").val(usuarioJSON["EMAIL"]);
    $("#regcpf").val(usuarioJSON["CPF"]);
    $("#regtel").val(usuarioJSON["TELEFONE"]);
    $("#regestado").val(usuarioJSON["COD_ESTADO"]);
    $("#regestado").trigger("change");
    $("#regcidade").val(usuarioJSON["COD_CIDADE"]);
    $("#regcidade").trigger("change");
    $("#emailAtual").val(usuarioJSON["EMAIL"])
    $("#senhaAtual").val(usuarioJSON["PASSWORD"]);

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
    $("input[type=radio][name=temOutrasCidades]").on('change', () => {
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

        // Ler Variáveis Básicas do Formulário
        let dadosUsuario = {
            "nome": $("#regnome").val(),
            "email": $("#regemail").val().trim(),
            "cpf": String($("#regcpf").val()).replace(/\D/g, ''),
            "telefone": $("#regtel").val(),
            "tipo_permissao": userconfig.get("TIPO_PERMISSAO")
        };
        
        if ($("#regpassword").val() != senhaAtual) {
            // Precisa mudar a senha
            dadosUsuario["password"] = MD5($("#regpassword").val());
        } else {
            dadosUsuario["password"] = MD5(senhaAtual);
        }

        restImpl.dbPUT(DB_TABLE_USUARIOS, "/" + userconfig.get("ID"), dadosUsuario)
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
