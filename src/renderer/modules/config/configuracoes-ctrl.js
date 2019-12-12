// Variáveis para baixar a malha
var http = require('http');
var fs = require('fs');

var cidadesAtuais = new Map();
var cidadesNovas = new Map();

// Variável armazendo o estado do formulário
var validadorFormulario;

// Localização do Usuário
var localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    new dgCidadesEstados({
        cidade: document.getElementsByName('novomunicipio')[0],
        estado: document.getElementsByName('novoestado')[0]
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
    });

    BuscarDadoEspecificoPromise("Municipios", "ID_USUARIO", userID).then((userData) => {
        $("#temRodoviario").prop("checked", userData[0]["TEM_RODOVIARIO"]);
        $("#temAquaviario").prop("checked", userData[0]["TEM_AQUAVIARIO"]);
        $("input[name='temBicicleta'][value='" + Boolean(userData[0]["TEM_BICICLETA"]) + "']").prop('checked', true);
        $("input[name='temMonitor'][value='" + Boolean(userData[0]["TEM_MONITOR"]) + "']").prop('checked', true);
        $("input[name='temOutrasCidades'][value='" + Boolean(userData[0]["TEM_OUTRAS_CIDADES"]) + "']").prop('checked', true);
        $("input[name='distMinima']").val([userData[0]["DIST_MINIMA"]]);

        if (userData[0]["TEM_OUTRAS_CIDADES"]) {
            $("#possuiOutrasCidades").trigger("change");
        }
    });

    BuscarDadoEspecificoPromise("FazTransporte", "ID_USUARIO", userData["ID"]).then((cidadesData) => {
        cidadesData.forEach((cidade) => {
            if (cidade["COD_CIDADE_DESTINO"] != userData["COD_CIDADE"]) {
                var cidadeDestino = cidade["COD_CIDADE_DESTINO"];
                var estadoDestino = cidade["COD_ESTADO_DESTINO"];
                addRowDirect(estadoDestino, cidadeDestino);
            
                cidadesAtuais.set(cidadeDestino.toString(), cidade);
            }
        });
    });

    // Inicia máscaras de telefone e cpf do registro
    $(".telmask").mask(telmaskbehaviour, teloptions);
    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // Especifica o validador
    validadorFormulario = $("#wizardConfigForm").validate({
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
            var $valid = $('#wizardConfigForm').valid();
            if (!$valid) {
                validadorFormulario.focusInvalid();
                return false;
            }
        },

        onTabClick: function (tab, navigation, index) {
            var $valid = $('#wizardConfigForm').valid();
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
});


// Validação de Outros Municípios
window.$.validator.addMethod("outros", function (value, element) {
    var possuiOutros = $("input[name=temOutrasCidades]:checked").val() == "true";
    var valid = true;

    if (possuiOutros) {
        var linhas = $("tr.novodado");
        var numlinhas = linhas.length;

        // Verifica todas as linhas
        for (var i = 0; i < numlinhas; i++) {
            var adicionouLinha = $($("tr.novodado")[i]).find("img")[0].src.includes("remove");

            if (adicionouLinha) {
                var campos = $($("tr.novodado")[i]).find("select").filter((e, h) => h.name.includes("novoestado") || h.name.includes("novomunicipio"));
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
var munAdicionais = 0;

var addtr = jQuery.parseHTML(`
<tr class="novodado">
    <td>
        <select name="novoestado" class="form-control"></select>
    </td>
    <td>
        <select name="novomunicipio" class="form-control"></select>
    </td>
    <td class="tbl-add-rm">
        <a href="#" onclick="addrow(this); return false;" class="addbtn">
            <img src="./img/icones/add.png" />
        </a>
    </td>
</tr>
`);


function addRowDirect(codEstado, codCidade) {
    munAdicionais++;

    var newrow = $(addtr).clone();
    newrow.find("select[name=novoestado]").attr("name", "novoestado" + munAdicionais);
    newrow.find("select[name=novomunicipio]").attr("name", "novomunicipio" + munAdicionais);
    newrow.find("a").attr("onclick", "rmrow(this); return false;");
    newrow.find("img").attr("src", "./img/icones/remove.png");

    $("table").find("tbody").prepend(newrow);
    new dgCidadesEstados({
        cidade: document.getElementsByName('novomunicipio' + munAdicionais)[0],
        estado: document.getElementsByName('novoestado' + munAdicionais)[0]
    });

    $("select[name=novoestado" + munAdicionais + "]").val([codEstado]);
    $("select[name=novoestado" + munAdicionais + "]").trigger("change");

    $("select[name=novomunicipio" + munAdicionais + "]").val([codCidade]);
    $("select[name=novomunicipio" + munAdicionais + "]").trigger("change");
}



// Função para adicionar uma linha na tabela de municípios
function addrow(element) {
    var row = $(element.parentElement.parentElement);

    var htmlEstado = row.find("select").filter((e, h) => h.name.includes("novoestado"));
    var htmlMunicipio = row.find("select").filter((e, h) => h.name.includes("novomunicipio"));

    var pEstado = htmlEstado.find("option:selected");
    var codEstado = pEstado.val();
    var strEstado = pEstado.text();

    var pMunicipio = htmlMunicipio.find("option:selected");
    var codMunicipio = pMunicipio.val();
    var strMunicipio = pMunicipio.text();

    if (strEstado == " " || strEstado == "" || strMunicipio == " " || strMunicipio == "") {
        Swal2.fire({
            title: "Ops... tivemos um problema!",
            text: "Selecione um Estado/Cidade válido",
            icon: "error",
            type: "error",
            button: "Fechar"
        });
        return;
    } else {
        munAdicionais++;
        
        $(element).attr("onclick", "rmrow(this)");
        $(element.children).attr("src", "./img/icones/remove.png");

        var newrow = $(addtr).clone();
        newrow.find("select[name=novoestado]").attr("name", "novoestado" + munAdicionais);
        newrow.find("select[name=novomunicipio]").attr("name", "novomunicipio" + munAdicionais);
        $("table").find("tbody").append(newrow);

        new dgCidadesEstados({
            cidade: document.getElementsByName('novomunicipio' + munAdicionais)[0],
            estado: document.getElementsByName('novoestado' + munAdicionais)[0]
        });
    }
    return false;
}

// Função para remover uma linha na tabela de municípios
function rmrow(element) {
    var row = $(element.parentElement.parentElement);
    $(row).remove();

    return false;
}

function pegarOutrasCidades() {
    var cidadeOrigem = $(localizacao.cidade).find("option:selected").text();
    var codCidadeOrigem = localizacao.cidade.value;
    var estadoOrigem = $(localizacao.estado).find("option:selected").text();
    var codEstadoOrigem = localizacao.estado.value;

    // Por padrão a cidade faz transporte dentro dela mesmo
    var cidades = [
        {
            "ID_USUARIO": userconfig.get("ID"),
            "COD_CIDADE_ORIGEM": codCidadeOrigem,
            "COD_CIDADE_DESTINO": codCidadeOrigem,
            "CIDADE_ORIGEM": cidadeOrigem,
            "CIDADE_DESTINO": cidadeOrigem,
            "COD_ESTADO_ORIGEM": codEstadoOrigem,
            "COD_ESTADO_DESTINO": codEstadoOrigem,
            "ESTADO_ORIGEM": estadoOrigem,
            "ESTADO_DESTINO": estadoOrigem
        }
    ]
    var linhas = $("tr.novodado");
    var numlinhas = linhas.length;

    // Verifica todas as linhas de cidades adicionadas
    for (var i = 0; i < numlinhas; i++) {
        var adicionouLinha = $($("tr.novodado")[i]).find("img")[0].src.includes("remove");

        if (adicionouLinha) {
            var campoCidade = $($($("tr.novodado")[i]).find("select")[1]).find("option:selected");
            var campoEstado = $($($("tr.novodado")[i]).find("select")[0]).find("option:selected");

            cidades.push({
                "ID_USUARIO": userconfig.get("ID"),
                "COD_CIDADE_ORIGEM": codCidadeOrigem,
                "CIDADE_ORIGEM": cidadeOrigem,
                "COD_ESTADO_ORIGEM": codEstadoOrigem,
                "ESTADO_ORIGEM": estadoOrigem,
                "COD_CIDADE_DESTINO": campoCidade.val(),
                "CIDADE_DESTINO": campoCidade.text(),
                "COD_ESTADO_DESTINO": campoEstado.val(),
                "ESTADO_DESTINO": campoEstado.text()
            });
        }
    }

    return cidades;
}

function processConfig(promisseArray) {
    var dadosPessoais = {
        "ID": userconfig.get("ID"),
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

    var dadosMunicipio = {
        "ID_USUARIO": userconfig.get("ID"),
        "COD_CIDADE": localizacao.cidade.value,
        "TEM_RODOVIARIO": $("#temRodoviario").is(":checked"),
        "TEM_AQUAVIARIO": $("#temAquaviario").is(":checked"),
        "TEM_BICICLETA": JSON.parse($("input[name='temBicicleta']:checked").val()),
        "TEM_MONITOR": JSON.parse($("input[name='temMonitor']:checked").val()),
        "DIST_MINIMA": $("input[name='distMinima']:checked").val(),
        "TEM_OUTRAS_CIDADES": JSON.parse($("input[name='temOutrasCidades']:checked").val()),
    };

    var dadosDestinosTransportes = pegarOutrasCidades();

    // Armazena algumas variáveis localmente
    userconfig.set(dadosPessoais);
    userconfig.set(dadosMunicipio);

    // Salva na base sqlite
    promisseArray.push(AtualizarPromise("Usuarios", dadosPessoais, "ID", userconfig.get("ID")));
    promisseArray.push(AtualizarPromise("Municipios", dadosMunicipio, "ID", userconfig.get("ID")));
    dadosDestinosTransportes.forEach((cidadeData) => {
        promisseArray.push(ReplaceTransportePromise("FazTransporte", cidadeData));
    });

    Promise.all(promisseArray)
        .then(() => {
            console.log("OK");
            document.location.href = "./dashboard.html";
        });
}

function baixarMalha() {
    return new Promise((resolve, reject) => {
        knex("IBGE_Municipios")
            .select()
            .where("codigo_ibge", $("#regcidade").val())
            .then(res => {
                var latitude = res[0]["latitude"];
                var longitude = res[0]["longitude"];

                var latmin = latitude - 0.25;
                var lngmin = longitude - 0.25;
                var latmax = latitude + 0.25;
                var lngmax = longitude + 0.25;

                var latstr = `${latmin},${lngmin},${latmax},${lngmax}`;

                var arqOrigem = path.join(userDataDir, "malha.osm");
                var url = `http://overpass-api.de/api/interpreter?data=[out:xml][timeout:25];
            (node['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});
            way['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});
            relation['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});)
            ;(._;>;);out meta;`

                console.log(arqOrigem);
                var file = fs.createWriteStream(arqOrigem);
                http.get(url, function (response) {
                    if (response.statusCode != 200) {
                        reject();
                    } else {
                        response.pipe(file);
                        resolve();
                    }
                });
            })
    });


}

// Função de conclusão do formulário
$("#finishconfig").click(() => {
    // Verifica se está válido
    var valido = validadorFormulario.valid();

    if (valido) {
        // Ler Variáveis Básicas do Formulário
        var codEstado = localizacao.estado.value;
        var codCidade = localizacao.cidade.value;

        // Verifica se precisamos importar dados
        var importarOpt = JSON.parse($("input[name='importarDados']:checked").val());
        var baixarOpt = JSON.parse($("input[name='baixarMalha']:checked").val());

        Swal2.fire({
            title: "Terminando o cadastro...",
            text: "Espere um minutinho...",
            imageUrl: "img/icones/processing.gif",
            icon: "img/icones/processing.gif",
            buttons: false,
            showSpinner: true,
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: false
        });

        var promisseArray = new Array();

        promisseArray.push(baixarMalha());
        processConfig(promisseArray);
    }
});
