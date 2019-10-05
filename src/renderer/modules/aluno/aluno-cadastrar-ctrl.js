// Posição do Aluno (Mapa)
var posicaoAluno;

var mapa = novoMapaOpenLayers("mapCadastroAluno", -16.8152409, -49.2756642)
var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

mapaOL.on('singleclick', function (evt) {
    if (posicaoAluno == null) {
        posicaoAluno = new ol.Feature(
            new ol.geom.Point(evt.coordinate)
        );
        posicaoAluno.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [12, 37],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/casamarker.png"
            })
        }));
        vectorSource.addFeature(posicaoAluno);
    } else {
        posicaoAluno.getGeometry().setCoordinates(evt.coordinate);
    }

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat);
    $("#reglon").val(lon);
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
        regnomeresp: {
            required: true,
            lettersonly: true
        },
        listareggrauresp: {
            required: true,
            pickselect: true
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

        var button_text = navigation.find('li:nth-child(' + $current + ') a').html();

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