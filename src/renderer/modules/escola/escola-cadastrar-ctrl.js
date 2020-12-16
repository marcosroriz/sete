// escola-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela escola-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de uma escola.

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
    
    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat.toPrecision(8));
    $("#reglon").val(lon.toPrecision(8));
    $("#reglat").valid();
    $("#reglon").valid();

    posicaoEscola = gerarMarcador(lat, lon, "img/icones/escola-marcador.png", 25, 50);
    vectorSource.addFeature(posicaoEscola);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoEscola])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(lat.toPrecision(8));
        $("#reglon").val(lon.toPrecision(8));
    }, posicaoEscola);

    mapaOL.addInteraction(translate);
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
                required: "Por favor selecione ou digite a latitude da escola"
            },
            reglon: {
                required: "Por favor selecione ou digite a longitude da escola",
            },
            regestado: {
                required: "Por favor selecione o Estado da escola"
            },
            regcidade: {
                required: "Por favor selecione o Município da escola"
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
    }
});

// Salva a aba atual (para voltar para página anterior)
var tabIndex = 0;

$('.card-wizard').bootstrapWizard({
    ...configWizardBasico('#wizardCadastrarEscolaForm'),
    ...{
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
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Escola salva com sucesso",
        text: "A escola " + $("#nomeEscola").val() + " foi salva com sucesso. " +
              "Clique abaixo para retornar ao painel.",
        icon: "success",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    })
    .then(() => {
        navigateDashboard("./modules/escola/escola-listar-view.html");
    });
}

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

$("#salvarescola").on('click', () => {
    $("[name='temRegime[]']").valid();
    $("[name='temNivel[]']").valid();
    $("[name='temHorario[]']").valid();

    var $valid = $('#wizardCadastrarEscolaForm').valid();
    if (!$valid) {
        return false;
    } else {
        var escolaJSON = GetEscolaFromForm();
        if (action == "editarEscola") {
            AtualizarEscola(estadoEscola["ID_ESCOLA"], escolaJSON, onSaveCallBack);
        } else {
            loadingFn("Cadastrando a escola ...")

            dbInserirPromise(DB_TABLE_ESCOLA, escolaJSON)
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao salvar a escola.", err))
        }
        return true;
    }
});

