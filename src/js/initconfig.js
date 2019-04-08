// Callback a ser chamado quando o Firebase detectar o usuário logado
let firebaseUser;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        firebaseUser = user;
        let usersRegDoc = database.collection("users").doc(firebaseUser.uid);
        usersRegDoc.get().then(function(doc) {
            if (doc.exists) {
                $("#regnome").val(doc.data()["nome"]);
                $("#regemail").val(doc.data()["email"]);
                $("#regcpf").val(doc.data()["cpf"]);
                $("#regtel").val(doc.data()["telefone"]);
                $("#regestado").val(doc.data()["cod_estado"]);
                $("#regestado").trigger("change");
                $("#regcidade").val(doc.data()["cod_cidade"]);
                $("#regcidade").trigger("change");
            }
        }).catch(function(err) {
            if (err != null) {
                swal({
                    title: "Ops... tivemos um problema!",
                    text: err.message,
                    icon: "error",
                    button: "Fechar"
                });
            }
        });
    } else {
        // User not logged in or has just logged out.
        document.location.href = "./entry.html"
    }
});

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Carrega o rodapé
    $("#footer").load("./footer.html");

    // Inicia o campo de estados/cidade na aba de registro
    new dgCidadesEstados({
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
    var $validator = $("#wizardForm").validate({
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
                digits:true,
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
                $validator.focusInvalid();
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
        let campos = $("select").filter((e, h) => h.name.includes("novoestado") || h.name.includes("novomunicipio"));
        campos.each(function(_, e) { 
            if (e.value == " " || e.value == "") {
                valid = false;
            }
        });
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
