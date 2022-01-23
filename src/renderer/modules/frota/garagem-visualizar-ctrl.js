// garagem-visualizar-ctrl.js
// Este arquivo contém o script de controle da tela garagem-visualizar-view. 
// O mesmo serve para visualizar e salvar a posição da garagem no mapa.

// Posição espacial da garagem
var posicaoGaragem = null;

// ID da garagem
var idGaragem;

// Ação atual
action = "visualizarGaragem"

// Dados básicos do mapa
var mapa = novoMapaOpenLayers("mapVizGaragem", cidadeLatitude, cidadeLongitude);
var vSource = mapa["vectorSource"];
var vLayer = mapa["vectorSource"];
var mapaOL = mapa["map"];

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

window.onresize = function () {
    setTimeout(function () {
        if (mapaViz != null) { mapaViz["map"].updateSize(); }
    }, 200);
}

// Plota garagem na tela
var plotaGaragem = (lat, lon) => {
    posicaoGaragem = gerarMarcador(lat, lon, "img/icones/garagem-icone.png", 25, 50);
    vSource.addFeature(posicaoGaragem);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoGaragem])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(lat.toPrecision(8));
        $("#reglon").val(lon.toPrecision(8));
    }, posicaoGaragem);

    mapaOL.addInteraction(translate);
}

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoGaragem != null && posicaoGaragem != undefined) {
        try {
            vSource.removeFeature(posicaoGaragem);
        } catch (err) {
            console.log(err);
        }
    }

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat.toPrecision(8));
    $("#reglon").val(lon.toPrecision(8));
    $("#reglat").valid();
    $("#reglon").valid();

    plotaGaragem(lat, lon)
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

restImpl.dbGETColecao(DB_TABLE_GARAGEM)
    .then(res => processarGaragem(res))

// Processa garagem
var processarGaragem = async (res) => {
    if (res.length > 0) {
        action = "editarGaragem";
        for (let garagemRaw of res) {
            idGaragem = garagemRaw.id_garagem;
            let garagemJSON = await restImpl.dbGETEntidade(DB_TABLE_GARAGEM, `/${idGaragem}`);
            $("#regcep").val(garagemJSON["loc_cep"]);
            $("#regend").val(garagemJSON["loc_endereco"]);

            if (garagemJSON["loc_longitude"] != null && garagemJSON["loc_longitude"] != undefined &&
                garagemJSON["loc_latitude"] != null && garagemJSON["loc_latitude"] != undefined) {
                $("#reglat").val(garagemJSON["loc_latitude"]);
                $("#reglon").val(garagemJSON["loc_longitude"]);
                plotaGaragem(garagemJSON["loc_latitude"], garagemJSON["loc_longitude"])
            }
        }
    }

    if (!vSource.isEmpty()) {
        mapa["map"].getView().fit(vSource.getExtent());
        mapa["map"].updateSize();
    }
}

var validadorFormulario = $("#wizardCadastrarGaragemForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
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
    }
});

// Botões
var completeForm = () => {
    Swal2.fire({
        title: "Garagem salva com sucesso",
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

$("#salvargaragem").on('click', () => {
    var $valid = $('#wizardCadastrarGaragemForm').valid();

    $("#reglat").valid();
    $("#reglon").valid();

    var $valid = $('#wizardCadastrarGaragemForm').valid();
    if (!$valid) {
        return false;
    } else {
        var garagemJSON = {};
        garagemJSON["nome"] = "GARAGEM";
        garagemJSON["loc_latitude"] = $("#reglat").val();
        garagemJSON["loc_longitude"] = $("#reglon").val();
        garagemJSON["loc_endereco"] = $("#regend").val();
        garagemJSON["loc_cep"] = $("#regcep").val();

        if (action == "editarGaragem") {
            loadingFn("Atualizando os dados da garagem...")

            restImpl.dbPUT(DB_TABLE_GARAGEM, `/${idGaragem}`, garagemJSON)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao atualizar a escola.", err))
        } else {
            loadingFn("Cadastrando a garagem ...")

            restImpl.dbPOST(DB_TABLE_GARAGEM, "", garagemJSON)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao salvar a garagem.", err))
        }
    }
});

$("#cancelarAcao").on('click', () => {
    cancelDialog()
        .then((result) => {
            if (result.value) {
                action = "visualizarGaragem";
                navigateDashboard("./modules/frota/frota-listar-view.html");
            }
        })
});

$("#regcep").mask("00000-000");