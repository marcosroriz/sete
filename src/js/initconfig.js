// Variável de comunicação com o processo main
const { ipcRenderer } = require('electron')

// Variável armazendo o estado do formulário
let validadorFormulario;

// Janela modular de processamento (ao término do formulário)
let processingModalWin;

// Localização do Usuário
let localizacao;

// Callback a ser chamado quando o Firebase detectar o usuário logado
let firebaseUser;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        firebaseUser = user;
    } else {
        // User not logged in or has just logged out.
        document.location.href = "./entry.html"
    }
});

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega dados da base local
    let userEmail = userconfig.get("email");

    Users.where({ "EMAIL": userEmail }).fetch().then((userData) => {
        $("#regnome").val(userData.attributes["NOME"]);
        $("#regemail").val(userData.attributes["EMAIL"]);
        $("#regcpf").val(userData.attributes["CPF"]);
        $("#regtel").val(userData.attributes["TELEFONE"]);
        $("#regestado").val(userData.attributes["COD_ESTADO"]);
        $("#regestado").trigger("change");
        $("#regcidade").val(userData.attributes["COD_CIDADE"]);
        $("#regcidade").trigger("change");
    });

    // Carrega o rodapé
    $("#footer").load("./footer.html");

    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    new dgCidadesEstados({
        cidade: document.getElementsByName('novomunicipio')[0],
        estado: document.getElementsByName('novoestado')[0]
    });

    // Inicia máscaras de telefone e cpf do registro
    $(".telmask").mask(telmaskbehaviour, teloptions);
    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // Especifica o validador
    validadorFormulario = $("#wizardForm").validate({
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
            "modoTransporte[]": {
                required: true,
                minlength: 1
            },
            temBicicleta: {
                required: true
            },
            temMonitor: {
                required: true
            },
            distMinima: {
                required: true
            },
            temOutrasCidades: {
                required: true,
                outros: true
            },
            importarDados: {
                required: true
            },
            ano: {
                required: true,
                digits: true,
                minlength: 4,
                maxlength: 4
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
            regestado: {
                required: "Por favor selecione seu Estado"
            },
            regcidade: {
                required: "Por favor selecione seu Município"
            },
            "modoTransporte[]": {
                required: "Por favor selecione pelo menos um modo de transporte",
                minlength: "Por favor selecione pelo menos um modo de transporte"
            },
            temBicicleta: {
                required: "Por favor informe se o município possui bicicletas do programa Caminho da Escola"
            },
            temMonitor: {
                required: "Por favor informe se o município possui monitores dentro dos veículos"
            },
            distMinima: {
                required: "Por favor informe a distância mínima"
            },
            temOutrasCidades: {
                required: "Por favor informe se o município transporta alunos para outras cidades"
            },
            importarDados: {
                required: "Por favor preencha se deseja importar os dados do CENSO escolar"
            },
            ano: {
                required: "Por favor digite um ano válido",
                digits: "Por favor digite um ano válido",
                minlength: "Por favor digite um ano válido",
                maxlength: "Por favor digite um ano válido",
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


    // Cria o Wizard
    $('.card-wizard').bootstrapWizard({
        'tabClass': 'nav nav-pills',
        'nextSelector': '.btn-next',
        'previousSelector': '.btn-back',

        onNext: function (tab, navigation, index) {
            var $valid = $('#wizardForm').valid();
            if (!$valid) {
                validadorFormulario.focusInvalid();
                return false;
            }
        },

        onTabClick: function (tab, navigation, index) {
            var $valid = $('#wizardForm').valid();
            if (!$valid) {
                return false;
            } else {
                return true;
            }
        },

        onTabShow: function (tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;

            var $wizard = navigation.closest('.card-wizard');

            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                $($wizard).find('.btn-next').hide();
                $($wizard).find('.btn-finish').show();
            } else {
                $($wizard).find('.btn-next').show();

                $($wizard).find('.btn-finish').hide();
            }

            let button_text = navigation.find('li:nth-child(' + $current + ') a').html();

            setTimeout(function () {
                $('.moving-tab').text(button_text);
            }, 150);

            var checkbox = $('.footer-checkbox');

            if (!index == 0) {
                $(checkbox).css({
                    'opacity': '0',
                    'visibility': 'hidden',
                    'position': 'absolute'
                });
            } else {
                $(checkbox).css({
                    'opacity': '1',
                    'visibility': 'visible'
                });
            }
        }
    });

    // Configura o formulário de outros municípios para aparecer apenas 
    // quando o usuário dizer que faz transporte para outros municípios
    $("input[type=radio][name=temOutrasCidades]").change(function () {
        if (this.value == "true") {
            $("#outrosMunicipios").removeClass('d-none');
        } else {
            $("#outrosMunicipios").addClass('d-none');
        }
    });

    $("#regsubmit").click(() => {
        console.log("terminou");
    });
});


// Validação de Outros Municípios
window.$.validator.addMethod("outros", function (value, element) {
    let possuiOutros = $("input[name=temOutrasCidades]:checked").val() == "true";
    let valid = true;

    if (possuiOutros) {
        let linhas = $("tr.novodado");
        let numlinhas = linhas.length;

        // Verifica todas as linhas
        for (let i = 0; i < numlinhas; i++) {
            let adicionouLinha = $($("tr.novodado")[i]).find("img")[0].src.includes("remove");

            if (adicionouLinha) {
                let campos = $($("tr.novodado")[i]).find("select").filter((e, h) => h.name.includes("novoestado") || h.name.includes("novomunicipio"));
                campos.each(function (_, e) {
                    if (e.value == " " || e.value == "") {
                        valid = false;
                    }
                });
            }
        }
    }
    return valid;
}, "Informe Municípios válidos");

// Funções para adicionar/remover municipios adicionais para o qual os alunos são transportados
let munAdicionais = 0;

var addtr = jQuery.parseHTML(`
<tr class="novodado">
    <td>
        <select name="novoestado" class="form-control"></select>
    </td>
    <td>
        <select name="novomunicipio" class="form-control"></select>
    </td>
    <td class="tbl-add-rm">
        <a href="#" onclick="addrow(this)" class="addbtn">
            <img src="./img/icones/add.png" />
        </a>
    </td>
</tr>
`);

// Função para adicionar uma linha na tabela de municípios
function addrow(element) {
    let row = $(element.parentElement.parentElement);

    let htmlEstado = row.find("select").filter((e, h) => h.name.includes("novoestado"));
    let htmlMunicipio = row.find("select").filter((e, h) => h.name.includes("novomunicipio"));

    let pEstado = htmlEstado.find("option:selected");
    let codEstado = pEstado.val();
    let strEstado = pEstado.text();

    let pMunicipio = htmlMunicipio.find("option:selected");
    let codMunicipio = pMunicipio.val();
    let strMunicipio = pMunicipio.text();

    if (strEstado == " " || strEstado == "" || strMunicipio == " " || strMunicipio == "") {
        swal({
            title: "Ops... tivemos um problema!",
            text: "Selecione um Estado/Cidade válido",
            icon: "error",
            button: "Fechar"
        });
        return;
    } else {
        munAdicionais++;

        $(element).attr("onclick", "rmrow(this)");
        $(element.children).attr("src", "./img/icones/remove.png");

        let newrow = $(addtr).clone();
        newrow.find("select[name=novoestado]").attr("name", "novoestado" + munAdicionais);
        newrow.find("select[name=novomunicipio]").attr("name", "novomunicipio" + munAdicionais);
        $("table").find("tbody").append(newrow);

        new dgCidadesEstados({
            cidade: document.getElementsByName('novomunicipio' + munAdicionais)[0],
            estado: document.getElementsByName('novoestado' + munAdicionais)[0]
        });
    }
}

// Função para remover uma linha na tabela de municípios
function rmrow(element) {
    let row = $(element.parentElement.parentElement);
    $(row).remove();
}

function pegarOutrasCidades() {
    let cidades = []
    let linhas = $("tr.novodado");
    let numlinhas = linhas.length;

    // Verifica todas as linhas de cidades adicionadas
    for (let i = 0; i < numlinhas; i++) {
        let adicionouLinha = $($("tr.novodado")[i]).find("img")[0].src.includes("remove");

        if (adicionouLinha) {
            let campoCidade = $($($("tr.novodado")[i]).find("select")[0]).find("option:selected");
            let campoEstado = $($($("tr.novodado")[i]).find("select")[1]).find("option:selected");

            cidades[i] = {
                "cidade": campoCidade.text(),
                "estado": campoEstado.text(),
                "cod_cidade": campoCidade.val(),
                "cod_estado": campoEstado.val()
            }
        }
    }

    return cidades
}


function processConfig() {
    let dados_pessoais = {
        "nome": $("#regnome").val(),
        "email": $("#regemail").val(),
        "cpf": $("#regcpf").val(),
        "telefone": $("#regtel").val(),
        "cidade": $(localizacao.cidade).find("option:selected").text(),
        "estado": $(localizacao.estado).find("option:selected").text(),
        "cod_cidade": localizacao.cidade.value,
        "cod_estado": localizacao.estado.value
    };
    let dados_transporte = {
        "tem_rodoviario": $("#temRodoviario").is(":checked"),
        "tem_aquaviario": $("#temAquaviario").is(":checked"),
        "tem_bicicleta": JSON.parse($("input[name='temBicicleta']:checked").val()),
        "tem_monitor": JSON.parse($("input[name='temMonitor']:checked").val()),
        "dist_minima": $("input[name='distMinima']:checked").val(),
        "tem_outras_cidades": JSON.parse($("input[name='temOutrasCidades']:checked").val()),
        "outras_cidades": pegarOutrasCidades()
    };
    let dados_escolares = {
        "importar_escolas": $("input[name='importarDados']:checked").val(),
        "ano_base": $("#ano").val()
    };

    let configRef = remotedb.collection("data").doc(firebaseUser.uid).collection("config");
    let dadosPessoaisDoc = configRef.doc("dados_pessoais");
    let dadosTransporteDoc = configRef.doc("dados_transporte");
    let dadosEscolaresDoc = configRef.doc("dados_escolares");

    let promiseDadosPessoais = dadosPessoaisDoc.set(dados_pessoais, { merge: true });
    let promiseDadosTrasporte = dadosTransporteDoc.set(dados_transporte, { merge: true });
    let promiseDadosEscolares = dadosEscolaresDoc.set(dados_escolares, { merge: true });

    let rootDoc = remotedb.collection("data").doc(firebaseUser.uid);
    let promiseInitDone = rootDoc.set({ "init": true }, { merge: true });

    Promise.all([promiseDadosPessoais, promiseDadosTrasporte, promiseDadosEscolares, promiseInitDone])
        .then(() => {
            console.log("OK");
            document.location.href = "./dashboard.html";
        });
}


// Função de conclusão do formulário
$("#finishconfig").click(() => {
    // Verifica se está válido
    let valido = validadorFormulario.valid();

    if (valido) {
        // Inicia janela de processamento
        processingModalWin = swal({
            title: "Processando...",
            text: "Espere um minutinho...",
            icon: "info",
            buttons: false
        });

        let importar = JSON.parse($("input[name='importarDados']:checked").val());
        let codEstado = localizacao.estado.value;
        let codCidade = localizacao.cidade.value;

        if (importar) {
            ipcRenderer.send("import:censo", codEstado, codCidade);
        } else {
            processConfig();
        }
    }
});