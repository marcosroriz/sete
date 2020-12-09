// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);

// Posição do Aluno (Mapa)
var posicaoAluno;
var mapa = novoMapaOpenLayers("mapCadastroAluno", cidadeLatitude, cidadeLongitude);

var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca
mapa["activateGeocoder"]();

// Ativa camadas
mapa["activateImageLayerSwitcher"]();

mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoAluno != null) {
        try {
            vectorSource.removeFeature(posicaoAluno);
        } catch (err) {
            console.log(err);
        }
    }

    posicaoAluno = new ol.Feature(
        new ol.geom.Point(evt.coordinate)
    );
    posicaoAluno.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 50],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/casamarker.png"
        })
    }));
    vectorSource.addFeature(posicaoAluno);

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat);
    $("#reglon").val(lon);
    $("#reglat").valid();
    $("#reglon").valid();
});


// Máscaras
$(".datanasc").mask('00/00/0000');
$('.cep').mask('00000-000');
$(".telmask").mask(telmaskbehaviour, teloptions);

var validadorFormulario = $("#wizardCadastrarAlunoForm").validate({
    rules: {
        reglat: {
            required: true,
            posicao: true
        },
        reglon: {
            required: true,
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
            required: true,
            lettersonly: true
        },
        listareggrauresp: {
            required: true,
            pickselect: true
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
        turnoAluno: {
            required: true
        },
        nivelAluno: {
            required: true
        }
    },
    messages: {
        reglat: {
            required: "Por favor selecione ou digite a latitude da casa do aluno"
        },
        reglon: {
            required: "Por favor selecione ou digite a longitude da casa do aluno",
        },
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
        console.log(error);
        console.log(element);
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});


$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarAlunoForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarAlunoForm').valid();
        if (!$valid) {
            return false;
        } else {
            window.scroll(0, 0);
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

        if (action == "editarAluno") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }

    }
});

BuscarTodasEscolas((err, result) => {
    result.forEach((escola) => {
        var eID = escola["ID_ESCOLA"];
        var eNome = escola["NOME"];
        $('#listaescola').append(`<option value="${eID}">${eNome}</option>`);
    });
    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
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

$("#salvaraluno").click(() => {
    $("[name='turnoAluno']").valid();
    $("[name='nivelAluno']").valid();

    var alunoJSON = GetAlunoFromForm();
    var idEscola = $("#listaescola").val();

    var $valid = $('#wizardCadastrarAlunoForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (action == "editarAluno") {
            AtualizarEscolaPromise(estadoAluno["ID_ALUNO"], alunoJSON)
                .then((res) => {
                    completeForm();
                })
                .catch((err) => {
                    errorFn("Erro ao inserir o aluno na escola!", err);
                });
        } else {
            InserirAlunoPromise(alunoJSON)
                .then((res) => {
                    if (idEscola != 0) {
                        var idAluno = res[0];
                        AdicionaAlunoEscola(idAluno, idEscola)
                            .then((res) => {
                                completeForm();
                            })
                            .catch((err) => {
                                errorFn("Erro ao inserir o aluno na escola!", err);
                            });
                    } else {
                        completeForm();
                    }
                })
                .catch((err) => {
                    errorFn("Erro ao salvar o aluno!", err);
                });
        }
    }
});


if (action == "editarAluno") {
    PopulateAlunoFromState(estadoAluno);
    posicaoAluno = new ol.Feature(
        new ol.geom.Point(ol.proj.fromLonLat([estadoAluno["LOC_LONGITUDE"],
        estadoAluno["LOC_LATITUDE"]]))
    );
    posicaoAluno.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 40],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/casamarker.png"
        })
    }));
    vectorSource.addFeature(posicaoAluno);
    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados do aluno.",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            cancelButtonText: "Voltar a editar",
            confirmButtonText: 'Sim, cancelar'
        }).then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}