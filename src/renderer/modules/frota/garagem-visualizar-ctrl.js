var posicaoGaragem;
var idGaragem;

var mapa = novoMapaOpenLayers("mapVizGaragem", cidadeLatitude, cidadeLongitude);
var vSource = mapa["vectorSource"];
var vLayer = mapa["vectorSource"];
var mapaOL = mapa["map"];

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoGaragem != null) {
        try {
            vSource.removeFeature(posicaoGaragem);
        } catch (err) {
            console.log(err);
        }
    }

    posicaoGaragem = new ol.Feature(
        new ol.geom.Point(evt.coordinate)
    );
    posicaoGaragem.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 50],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/garagem-icone.png"
        })
    }));
    vSource.addFeature(posicaoGaragem);

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat);
    $("#reglon").val(lon);
    $("#reglat").valid();
    $("#reglon").valid();
});

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

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

// Callback para pegar dados da garagem
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao visualizar a garagem!", err);
    } else {
        for (let garagemRaw of result) {
            action = "editarGaragem";
            idGaragem = garagemRaw["ID_GARAGEM"];
            $("#reglat").val(garagemRaw["LOC_LATITUDE"]);
            $("#reglon").val(garagemRaw["LOC_LONGITUDE"]);
            $("#regcep").val(garagemRaw["LOC_CEP"]);
            $("#regend").val(garagemRaw["LOC_ENDERECO"]);

            posicaoGaragem = new ol.Feature(
                new ol.geom.Point(ol.proj.fromLonLat([garagemRaw["LOC_LONGITUDE"],
                garagemRaw["LOC_LATITUDE"]]))
            );
            posicaoGaragem.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [25, 40],
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    opacity: 1,
                    src: "img/icones/garagem-icone.png"
                })
            }));
            vSource.addFeature(posicaoGaragem);
        }
    }
};

BuscarTodosDados("Garagem", listaInicialCB);

var validadorFormulario = $("#wizardCadastrarGaragemForm").validate({
    rules: {
        reglat: {
            required: true,
            posicao: true
        },
        reglon: {
            required: true,
            posicao: true
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
    }
});


// Botões
var completeForm = () => {
    Swal2.fire({
        title: "Garagaem salva com sucesso",
        text: "Clique abaixo para retornar ao painel.",
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
        navigateDashboard("./modules/frota/frota-listar-view.html");
    });
}

$("#salvargaragem").click(() => {
    var $valid = $('#wizardCadastrarGaragemForm').valid();

    $("#reglat").valid();
    $("#reglon").valid();

    var $valid = $('#wizardCadastrarGaragemForm').valid();
    if (!$valid) {
        return false;
    } else {
        var garagemJSON = {};
        garagemJSON["LOC_LATITUDE"] = $("#reglat").val();
        garagemJSON["LOC_LONGITUDE"] = $("#reglon").val();
        garagemJSON["LOC_ENDERECO"] = $("#regend").val();
        garagemJSON["LOC_CEP"] = $("#regcep").val();
        
        if (action == "editarGaragem") {
            AtualizarPromise("Garagem", garagemJSON, "ID_GARAGEM", idGaragem)
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao atualizar a garagem!", err);
            });
        } else {
            InserirPromise("Garagem", garagemJSON)
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao salvar a garagem!", err);
            });
        }
    }
});

$("#cancelarAcao").click(() => {
    Swal2.fire({
        title: 'Cancelar Edição?',
        text: "Se você cancelar nenhum alteração será feita nos dados da garagem.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Voltar a editar",
        confirmButtonText: 'Sim, cancelar'
    }).then((result) => {
        if (result.value) {
            action = "visualizarGaragem";
            navigateDashboard("./modules/frota/frota-listar-view.html");
        }
    })
});