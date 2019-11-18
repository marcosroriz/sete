// Posição da Escola (no Mapa)
var posicaoEscola;

var mapa = novoMapaOpenLayers("mapCadastroEscola", cidadeLatitude, cidadeLongitude);
var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca
mapa["activateGeocoder"]();

// Ativa camadas
mapa["activateImageLayerSwitcher"]();

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoEscola != null) {
        try {
            vectorSource.removeFeature(posicaoEscola);
        } catch (err) {
            console.log(err);
        }
    }
    
    posicaoEscola = new ol.Feature(
        new ol.geom.Point(evt.coordinate)
    );
    posicaoEscola.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 50],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/escola-marker.png"
        })
    }));
    vectorSource.addFeature(posicaoEscola);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoEscola])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(parseFloat(lat).toFixed(10));
        $("#reglon").val(parseFloat(lon).toFixed(10));
    }, posicaoEscola);

    mapaOL.addInteraction(translate);

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(parseFloat(lat).toFixed(10));
    $("#reglon").val(parseFloat(lon).toFixed(10));
    $("#reglat").valid();
    $("#reglon").valid();
});

// Dados cadastrais
var localizacao;

// Máscaras
$('.cep').mask('00000-000');
$(".telmask").mask(telmaskbehaviour, teloptions);

// Inicia o campo de estados/cidade na aba de localizacao
localizacao = new dgCidadesEstados({
    cidade: document.getElementById('regcidade'),
    estado: document.getElementById('regestado')
});

$("#regestado").val(codEstado);
$("#regestado").trigger("change");
$("#regcidade").val(codCidade);
$("#regcidade").trigger("change");

// Validador
var validadorFormulario = $("#wizardCadastrarEscolaForm").validate({
    rules: {
        reglat: {
            required: true,
            posicao: true
        },
        reglon: {
            required: true,
            posicao: true
        },
        regestado: {
            required: true,
            pickstate: true
        },
        regcidade: {
            required: true,
            pickcity: true
        },
        regcep: {
            required: false,
            cep: true
        },
        regend: {
            required: false,
        },
        areaUrbana: {
            required: true,
        },
        locDif: {
            required: true,
        },
        nomeEscola: {
            required: true,
            minlength: 3
        },
        telContato: {
            minlength: 10
        },
        tipoDependencia: {
            required: true
        },
        'temRegime[]': {
            required: true,
            minlength: 1
        },
        'temNivel[]': {
            required: true,
            minlength: 1
        },
        'temHorario[]': {
            required: true,
            minlength: 1
        },
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
        regestado: {
            required: "Por favor selecione seu Estado"
        },
        regcidade: {
            required: "Por favor selecione seu Município"
        },
        areaUrbana: {
            required: "Por favor selecione a localização da escola",
        },
        locDif: {
            required: "Por favor informe se a escola está situada em área diferenciada"
        },
        telContato: {
            required: "Por favor digite um telefone válido com DDD"
        },
        "temRegime[]": {
            required: "Por favor selecione os regimes de ensino desta escola",
            minlength: "Por favor selecione pelo menos um regime de ensino"
        },
        "temNivel[]": {
            required: "Por favor selecione os níveis de ensino desta escola",
            minlength: "Por favor selecione pelo menos um nível de ensino"
        },
        "temHorario[]": {
            required: "Por favor selecione os horários de funcionamento da escola",
            minlength: "Por favor selecione pelo menos um horário de funcionamento"
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
        console.log(error);
        console.log(element);
        $(element).closest('.form-group').append(error).addClass('has-error');
    },
    submitHandler: function (form) {
        console.log("oiiii");
    }
});

// Salva a aba atual (para voltar para página anterior)
var tabIndex = 0;

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarEscolaForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarEscolaForm').valid();
        if (!$valid) {
            return false;
        } else {
            window.scroll(0, 0);
            return true;
        }
    },

    onTabShow: function (tab, navigation, index) {
        tabIndex = index;
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

        if (action == "editarEscola") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }
    }
});

var onSaveCallBack = (err, result) => {
    if (err) {
        errorFn("Erro ao salvar a escola!", err);
    } else {
        Swal2.fire({
            title: "Escola salva com sucesso",
            text: "A escola " + $("#nomeEscola").val() + " foi salva com sucesso. " +
                  "Clique abaixo para retornar ao painel.",
            type: "success",
            icon: "success",
            showCancelButton: false,
            confirmButtonClass: "btn-success",
            confirmButtonText: "Retornar ao painel",
            closeOnConfirm: false,
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: true
        })
        .then(() => {
            navigateDashboard("./modules/escola/escola-listar-view.html");
        });
    }
};

if (action == "editarEscola") {
    PopulateEscolaFromState(estadoEscola); 
    posicaoEscola = new ol.Feature(
        new ol.geom.Point(ol.proj.fromLonLat([estadoEscola["LOC_LONGITUDE"],
                                              estadoEscola["LOC_LATITUDE"]]))
    );
    posicaoEscola.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 40],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/escola-marker.png"
        })
    }));
    vectorSource.addFeature(posicaoEscola);
    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados da escola.",
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

$("#salvarescola").click(() => {
    $("[name='temRegime[]']").valid();
    $("[name='temNivel[]']").valid();
    $("[name='temHorario[]']").valid();

    var $valid = $('#wizardCadastrarEscolaForm').valid();
    if (!$valid) {
        console.log("Não é Válido");
        return false;
    } else {
        var schoolJSON = GetEscolaFromForm();
        InserirEscola(schoolJSON, onSaveCallBack);
        console.log(schoolJSON);
        return true;
    }
});

