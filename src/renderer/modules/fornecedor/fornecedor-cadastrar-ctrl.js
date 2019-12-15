// Máscaras
$('.cep').mask("00000-000");
$(".telmask").mask(telmaskbehaviour, teloptions);
// $(".cnpj").mask("00.000.000/0000-00", { reverse: true });

// Posição da Escola (no Mapa)
var posicaoFornecedor;
var mapa = novoMapaOpenLayers("mapCadastroFornecedor", cidadeLatitude, cidadeLongitude);
var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoFornecedor != null) {
        try {
            vectorSource.removeFeature(posicaoFornecedor);
        } catch (err) {
            console.log(err);
        }
    }

    posicaoFornecedor = new ol.Feature(
        new ol.geom.Point(evt.coordinate)
    );
    posicaoFornecedor.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [25, 50],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/fornecedor-marcador.png"
        })
    }));
    vectorSource.addFeature(posicaoFornecedor);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoFornecedor])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(parseFloat(lat).toFixed(10));
        $("#reglon").val(parseFloat(lon).toFixed(10));
    }, posicaoFornecedor);

    mapaOL.addInteraction(translate);

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(parseFloat(lat).toFixed(10));
    $("#reglon").val(parseFloat(lon).toFixed(10));
    $("#reglat").valid();
    $("#reglon").valid();
});

var validadorFormulario = $("#wizardCadastrarFornecedorForm").validate({
    rules: {
        regnome: {
            required: true
        },
        regcnpj: {
            required: true,
            cpfcnpj: true
        },
        'temServico[]': {
            required: true,
            minlength: 1
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

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarFornecedorForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarFornecedorForm').valid();
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

        if (action == "editarFornecedor") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }

    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Fornecedor salvo com sucesso",
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
            $("a[name='fornecedor/fornecedor-listar-view']").click();
        });
}

$("#salvarfornecedor").click(() => {
    $("#regnome").valid();
    $("#regcnpj").valid();
    $("[name='temServico[]']").valid();

    var fornecedorJSON = GetFornecedorFromForm();

    var $valid = $('#wizardCadastrarFornecedorForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (action == "editarFornecedor") {
            AtualizarPromise("Fornecedores", fornecedorJSON, "ID_FORNECEDOR", estadoFornecedor["ID_FORNECEDOR"])
                .then((res) => {
                    completeForm();
                })
                .catch((err) => {
                    errorFn("Erro ao atualizar o fornecedor!", err);
                });
        } else {
            InserirPromise("Fornecedores", fornecedorJSON)
                .then((res) => {
                    completeForm();
                })
                .catch((err) => {
                    errorFn("Erro ao salvar o fornecedor!", err);
                });
        }
    }
});


if (action == "editarFornecedor") {
    PopulateFornecedorFromState(estadoFornecedor);
    if (estadoFornecedor["LOC_LATITUDE"] != null && estadoFornecedor["LOC_LATITUDE"] != "" && 
        estadoFornecedor["LOC_LONGITUDE"] != null && estadoFornecedor["LOC_LONGITUDE"] != "") {
        posicaoFornecedor = new ol.Feature(
            new ol.geom.Point(ol.proj.fromLonLat(
                [estadoFornecedor["LOC_LONGITUDE"], estadoFornecedor["LOC_LATITUDE"]])
            )
        );
        posicaoFornecedor.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [25, 40],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/fornecedor-marcador.png"
            })
        }));
        vectorSource.addFeature(posicaoFornecedor);
    }

    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados do fornecedor.",
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