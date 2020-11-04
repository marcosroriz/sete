// Firebase user
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        firebaseUser = user;
    }
});

// Variáveis para baixar a malha
var http = require('http');
var fs = require('fs');

// Variável armazendo o estado do formulário
let validadorFormulario;

// Janela modular de processamento (ao término do formulário)
let processingModalWin;

// Localização do Usuário
let localizacao;

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
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

    // Carrega dados da base local
    let userID = userconfig.get("ID");

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
        <a href="#" onclick="addrow(this); return false;" class="addbtn">
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

        $(element).attr("onclick", "rmrow(this); return false;");
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
    let cidadeOrigem = $(localizacao.cidade).find("option:selected").text();
    let codCidadeOrigem = localizacao.cidade.value;
    let estadoOrigem = $(localizacao.estado).find("option:selected").text();
    let codEstadoOrigem = localizacao.estado.value;

    // Por padrão a cidade faz transporte dentro dela mesmo
    let cidades = [
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
    let linhas = $("tr.novodado");
    let numlinhas = linhas.length;

    // Verifica todas as linhas de cidades adicionadas
    for (let i = 0; i < numlinhas; i++) {
        let adicionouLinha = $($("tr.novodado")[i]).find("img")[0].src.includes("remove");

        if (adicionouLinha) {
            let campoCidade = $($($("tr.novodado")[i]).find("select")[1]).find("option:selected");
            let campoEstado = $($($("tr.novodado")[i]).find("select")[0]).find("option:selected");

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

function getDadosPessoais() {
    return {
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
}

function getDadosMunicipio() {
    return {
        "ID_USUARIO": userconfig.get("ID"),
        "COD_CIDADE": localizacao.cidade.value,
        "TEM_RODOVIARIO": $("#temRodoviario").is(":checked"),
        "TEM_AQUAVIARIO": $("#temAquaviario").is(":checked"),
        "TEM_BICICLETA": JSON.parse($("input[name='temBicicleta']:checked").val()),
        "TEM_MONITOR": JSON.parse($("input[name='temMonitor']:checked").val()),
        "DIST_MINIMA": $("input[name='distMinima']:checked").val(),
        "TEM_OUTRAS_CIDADES": JSON.parse($("input[name='temOutrasCidades']:checked").val()),
    };
}

function finishConfig() {
    Swal2.fire({
        title: "Sucesso!",
        text: "Perfil configurado com sucesso. Entrando no painel de gestão.",
        icon: "success",
        type: "success",
        showConfirmButton: false,
        closeOnClickOutside: false,
        allowOutsideClick: false,
    })
    setTimeout(() => {
        document.location.href = "./dashboard.html";
    }, 1000)
}

function processConfig(promisseArray) {
    let dadosPessoais = getDadosPessoais();
    let dadosMunicipio = getDadosMunicipio();

    // Armazena algumas variáveis localmente
    userconfig.set(dadosPessoais);
    userconfig.set(dadosMunicipio);

    let dadosDestinosTransportes = pegarOutrasCidades();

    // Salva na base sqlite
    promisseArray.push(AtualizarPromise("Usuarios", dadosPessoais, "ID", userconfig.get("ID")));
    promisseArray.push(InserirPromise("Municipios", dadosMunicipio));
    dadosDestinosTransportes.forEach((cidadeData) => {
        promisseArray.push(InserirPromise("FazTransporte", cidadeData));
    });

    Promise.all(promisseArray).then(() => { finishConfig(); });
}

function baixarMalha() {
    return new Promise((resolve, reject) => {
        knex("IBGE_Municipios")
            .select()
            .where("codigo_ibge", localizacao.cidade.value)
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
                        console.log("ERRO AO BAIXAR MALHA")
                    } else {
                        response.pipe(file);
                    }
                    resolve();
                });
            })
    });


}

// Função de conclusão do formulário
$("#finishconfig").click(() => {
    // Verifica se está válido
    let valido = validadorFormulario.valid();

    if (valido) {
        // Ler Variáveis Básicas do Formulário
        let codEstado = localizacao.estado.value;
        let codCidade = localizacao.cidade.value;

        // Verifica se precisamos importar dados
        let importarOpt = JSON.parse($("input[name='importarDados']:checked").val());
        let baixarOpt = JSON.parse($("input[name='baixarMalha']:checked").val());

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

        if (firebaseUser != null && importarOpt) {
            // Limpa db
            promisseArray = clearDBPromises();

            // Armazena algumas variáveis localmente
            userconfig.set(getDadosPessoais());
            userconfig.set(getDadosMunicipio());
            promisseArray.push(AtualizarPromise("Usuarios", getDadosPessoais(), "ID", userconfig.get("ID")));

            // Baixa malha
            if (baixarOpt) { promisseArray.push(baixarMalha()) }

            // Pega documento remoto
            promisseArray.push(remotedb.collection("data").doc(firebaseUser.uid).get());

            Promise.all(promisseArray)
                .then((res) => {
                    // Reconstrói o bd
                    var remoteDocumento = res[res.length - 1].data();
                    var basicDBs = ["alunos", "escolas", "fornecedores", "garagem",
                        "motoristas", "rotas", "veiculos"]
                    var basicDBPromises = new Array();

                    for (let i = 0; i < basicDBs.length; i++) {
                        var dbname = basicDBs[i];
                        var dbdata = remoteDocumento[dbname];

                        dbdata.forEach(data => basicDBPromises.push(InserirPromise(dbname, data)))
                    }

                    Promise.all(basicDBPromises)
                        .then(() => {
                            console.log("DADOS BÁSICOS DO BANCO RECRIADOS");

                            var relDBs = ["escolatemalunos", "municipios",
                                "garagemtemveiculo", "ordemdeservico", "faztransporte",
                                "rotaatendealuno", "rotadirigidapormotorista",
                                "rotapassaporescolas", "rotapossuiveiculo"]
                            var relDBPromises = new Array();

                            for (let i = 0; i < basicDBs.length; i++) {
                                var dbname = relDBs[i];
                                var dbdata = remoteDocumento[dbname];


                                if (dbname == "municipios" || dbname == "faztransporte") {
                                    dbdata.forEach(data => {
                                        if (data["ID_USUARIO"] == firebaseUser.uid) {
                                            relDBPromises.push(InserirPromise(dbname, data))
                                        }
                                    })
                                } else {
                                    dbdata.forEach(data => relDBPromises.push(InserirPromise(dbname, data)))
                                }
                            }

                            Promise.all(relDBPromises)
                                .then(() => {
                                    console.log("RELAÇÕES DO BANCO RECRIADAS");
                                    finishConfig();
                                })
                                .catch((err) => {
                                    // TODO: Arrumar isso
                                    finishConfig();
                                })
                        })
                        .catch((err) => {
                            console.log(err);
                            console.log("ERRO")
                            finishConfig();
                        })
                })
        } else {
            if (baixarOpt) { promisseArray.push(baixarMalha()) }

            processConfig(promisseArray);
        }
    }
});

$("#ano").val(new Date().getYear() + 1900)