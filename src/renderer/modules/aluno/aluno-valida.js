// Posição do Aluno (Mapa)
var posicaoAluno = {};


function mascara(t, mask) {
    var i = t.value.length;
    var saida = mask.substring(1, 0);
    var texto = mask.substring(i)
    if (texto.substring(0, 1) != saida) {
        t.value += texto.substring(0, 1);
    }
}


$("#wizardCadastrarAlunoForm").validate({
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
    messages: {},
    highlight: function(element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function(element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function(error, element) {
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});


$(document).ready(function() {

    $("#wizardCadastrarAlunoForm").submit(function(e) {
        e.preventDefault();
        $("#wizardCadastrarAlunoForm").validate();

        if ($("#wizardCadastrarAlunoForm").valid()) {
            InsertAlunoCTRL();
        }

    });

    // Máscaras
    $(".datanasc").mask('00/00/0000');
    $('.cep').mask('00000-000');
    $(".telmask").mask(telmaskbehaviour, teloptions);

    InitMap()
});

function InitMap() {

    let mapa = novoMapaOpenLayers("mapCadastroAluno", -16.8152409, -49.2756642)
    let vectorSource = mapa["vectorSource"];
    let vectorLayer = mapa["vectorLayer"];
    let mapaOL = mapa["map"];

    mapaOL.on('singleclick', function(evt) {
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
}