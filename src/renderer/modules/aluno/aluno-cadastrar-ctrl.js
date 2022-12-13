// aluno-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um aluno.
// Também é feito consultas nos dados de escolas para permitir vincular um aluno
// a uma escola no momento de cadastro ou posteriormente.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
var idAluno = "";
if (action == "editarAluno") {
    idAluno = estadoAluno["ID"];
    estaEditando = true;
}

// Variável armazena o ID da escola do aluno 
// Importante ter para caso o usuário modifique os dados do aluno/escola e aluno/rota
// A princípio, assuma nenhuma escola/rota, isto é, id escola/rota = 0
var idEscolaAnterior = 0;
var idRotaAnterior = [];

// Posição do Aluno (Mapa)
var posicaoAluno;
var mapa = novoMapaOpenLayers("mapCadastroAluno", cidadeLatitude, cidadeLongitude);

window.onresize = function () {
    setTimeout(function () {
        if (mapa != null) { mapa["map"].updateSize(); }
    }, 200);
}

var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca
mapa["activateGeocoder"]();

// Ativa camadas
mapa["activateImageLayerSwitcher"]();

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    // if (evt.originalEvent.path.length > 21) {
    //     return;
    // }

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat.toPrecision(6));
    $("#reglon").val(lon.toPrecision(6));
    $("#reglat").valid();
    $("#reglon").valid();

    triggerMudancaLocalizacao(lat, lon);
});

$("#reglat, #reglon").on("change", () => {
    if ($("#reglat").val() && $("#reglon").val()) {
        triggerMudancaLocalizacao($("#reglat").val(), $("#reglon").val());
        mapaOL.getView().fit(vectorSource.getExtent(), { padding: [40, 40, 40, 40], maxZoom: 14 });
    }
});

function triggerMudancaLocalizacao(lat, lon) {
    if (posicaoAluno != null) {
        try {
            vectorSource.removeFeature(posicaoAluno);
        } catch (err) {
            console.log(err);
        }
    }

    posicaoAluno = gerarMarcador(lat, lon, "img/icones/aluno-marcador.png", 25, 50);
    vectorSource.addFeature(posicaoAluno);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoAluno])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(lat.toPrecision(8));
        $("#reglon").val(lon.toPrecision(8));
    }, posicaoAluno);

    mapaOL.addInteraction(translate);
}

// Máscaras
$(".datanasc").mask('00/00/0000');
$('.cep').mask('00000-000');
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".cpfmask").mask('000.000.000-00', { reverse: true });

// Estrutura de validação do formulário
var validadorFormulario = $("#wizardCadastrarAlunoForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            reglat: {
                required: false,
                posicao: true
            },
            reglon: {
                required: false,
                posicao: true
            },
            regdata: {
                required: true,
                datanasc: true
            },
            regnome: {
                required: true,
                lettersonly: true
            },
            areaUrbana: {
                required: true,
            },
            regnomeresp: {
                required: false,
                lettersonly: true
            },
            listareggrauresp: {
                required: false,
            },
            modoSexo: {
                required: true
            },
            corAluno: {
                required: true
            },
            listaescola: {
                required: true,
            },
            listarota: {
                required: true,
            },
            turnoAluno: {
                required: true
            },
            nivelAluno: {
                required: true
            }
        },
        messages: {
            regdata: {
                required: "Por favor digite a data de nascimento do aluno"
            },
            regnome: {
                required: "Por favor digite um nome válido"
            },
            regnomeresp: {
                required: "Por favor digite um nome válido"
            },
            listareggrauresp: {
                required: "Selecione o grau de parentesco"
            }
        }
    }
});


$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarAlunoForm'),
    ...{
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

            if (estaEditando) {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }

        }
    }
});


var completeForm = () => {
    Swal2.fire({
        title: "Aluno salvo com sucesso",
        text: "O aluno " + $("#regnome").val() + " foi salvo com sucesso. " +
            "Clique abaixo para retornar ao painel.",
        type: "info",
        icon: "info",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    })
        .then(() => {
            navigateDashboard("./modules/aluno/aluno-listar-view.html");
        });
}

$("#salvaraluno").on('click', () => {
    $("[name='turnoAluno']").valid();
    $("[name='nivelAluno']").valid();

    let $valid = $('#wizardCadastrarAlunoForm').valid();
    if (!$valid) {
        return false;
    } else {
        let alunoJSON = GetAlunoFromForm();
        const idEscola = $("#listaescola").val();
        const idRota = $("#listarota").val().map(Number).filter(r => r != -1)

        if (estaEditando) {
            const idAluno = estadoAluno["ID"];
            // delete alunoJSON["cpf"];

            loadingFn("Atualizando os dados do(a) aluno(a) ...");
            AtualizarAlunoREST(alunoJSON, idAluno, idEscola, idEscolaAnterior, idRota, idRotaAnterior)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao atualizar o(a) aluno na escola!", err));
        } else {
            loadingFn("Cadastrando o(a) aluno(a) ...")
            InserirAlunoREST(alunoJSON, idEscola, idRota)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao salvar o aluno.", err))
        }
    }
});

restImpl.dbGETColecao(DB_TABLE_ESCOLA)
    .then((res) => {
        res.sort((e1, e2) => {
            return ('' + e1["nome"]).localeCompare(e2["nome"]);
        })

        res.forEach((escola) => {
            let eID = escola["id_escola"];
            let eNome = escola["nome"];
            $('#listaescola').append(`<option value="${eID}">${eNome}</option>`);
        });

        if (estaEditando) {
            return restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${idAluno}/escola`);
        } else {
            return false;
        }
    })
    .then((escola) => {
        if (escola && $("#listaescola option[value='" + escola.id_escola + "']").length > 0) {
            $("#listaescola").val(escola.id_escola);

            // ID da escola anterior
            idEscolaAnterior = escola.id_escola;
        }
    })
    .catch((err) => {
        console.log("Aluno sem escola ainda", err);
    })

restImpl.dbGETColecao(DB_TABLE_ROTA)
    .then((rotas) => {
        rotas.sort((e1, e2) => {
            return ('' + e1["nome"]).localeCompare(e2["nome"]);
        })

        rotas.forEach((rota) => {
            var rID = rota["id_rota"];
            var rNome = rota["nome"];
            $('#listarota').append(`<option value="${rID}">${rNome}</option>`);
        });

        $('#listarota').selectpicker({
            noneSelectedText: "Escolher rota depois"
        });

        if (estaEditando) {
            return restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${idAluno}/rota`);
        } else {
            return false;
        }
    })
    .then((rota) => {
        if (rota && rota?.data?.length > 0) {
            rota?.data?.forEach(r => {
                idRotaAnterior.push(r["id_rota"]);
            });
            $("#listarota").selectpicker('val', idRotaAnterior);
        }
    })
    .catch((err) => {
        console.log("Aluno sem rota ainda", err);
    })


$('#listarota').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    // Verificar se quer adicionar depois
    if (clickedIndex == 0) {
        // Ver se não tinha escolhido isso antes
        // previousValue = true se estava ativo antes
        if (!previousValue) {
            // Remover todas as opções escolhidas
            $('.selectpicker').val('-1');
            $('.selectpicker').selectpicker('render');
        }
    } else {
        // Ver se tinha escolhido a opção de escolher depois
        var opcoes = $('.selectpicker').val();
        if (opcoes.includes("-1")) {
            opcoes = opcoes.filter(item => item != '-1')
        }

        $('.selectpicker').val(opcoes);
        $('.selectpicker').selectpicker('render');
    }

    $('.selectpicker').selectpicker('toggle');
});


if (estaEditando) {
    restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${estadoAluno.ID}`)
        .then((alunoRaw) => {
            if (alunoRaw) {
                estadoAluno = parseAlunoREST(alunoRaw);
                preencheDadosParaEdicao()
            }
        })
        .catch((err) => errorFn("Erro ao recuperar os dados do aluno", err))
}


function preencheDadosParaEdicao() {
    $(".pageTitle").html("Atualizar Aluno");
    PopulateAlunoFromState(estadoAluno);

    // Reativa máscaras
    $(".cep").trigger('input')
    $(".datanasc").trigger('input')
    $(".telmask").trigger('input')
    $(".cpfmask").trigger('input')

    // Coloca marcador da casa do aluno caso tenha a localização
    if (estadoAluno["LOC_LONGITUDE"] != null && estadoAluno["LOC_LONGITUDE"] != undefined &&
        estadoAluno["LOC_LATITUDE"] != null && estadoAluno["LOC_LATITUDE"] != undefined) {
        posicaoAluno = gerarMarcador(estadoAluno["LOC_LATITUDE"],
            estadoAluno["LOC_LONGITUDE"],
            "img/icones/aluno-marcador.png", 25, 40);
        vectorSource.addFeature(posicaoAluno);

        mapa["map"].getView().fit(vectorSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
        mapa["map"].updateSize();
    }

    $("#cancelarAcao").on('click', () => {
        cancelDialog()
            .then((result) => {
                if (result.value) {
                    navigateDashboard(lastPage);
                }
            })
    });
}

action = "cadastrarAluno"