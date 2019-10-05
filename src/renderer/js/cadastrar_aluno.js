// Posição do Aluno (Mapa)
let posicaoAluno;

let mapa = novoMapaOpenLayers("mapCadastroAluno", -16.8152409, -49.2756642)
let vectorSource = mapa["vectorSource"];
let vectorLayer = mapa["vectorLayer"];
let mapaOL = mapa["map"];

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

    let [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat);
    $("#reglon").val(lon);
});


// Máscaras
$(".datanasc").mask('00/00/0000');
$('.cep').mask('00000-000');
$(".telmask").mask(telmaskbehaviour, teloptions);

let validadorFormulario = $("#wizardCadastrarAlunoForm").validate({
    rules: {
        reglat: {
            required: true,
            digits: true
        },
        reglon: {
            required: true,
            digits: true
        },
        regdata: {
            required: true,
            datanasc: true
        },
        regcep: {
            required: true
        }
    },
    messages: {
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
        return false;
    },

    onTabClick: function (tab, navigation, index) {
        return true;
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