// rota-malha-ctrl.js
// Este arquivo contém o script de controle da tela rota-malha-view. O memso
// permite importar os dados de uma rota no formato OSM

var http;
// Esta ferramenta só funciona no Electron
if (!isElectron) {
    Swal2.fire({
        title: "Funcionalidade indisponível",
        icon: "warning",
        html:
            'Esta funcionalidade está disponível apenas no SETE desktop. ' +
            'Baixe a versão desktop para acessá-la. <br> ' + 
            'Clique ' + 
            '<a target="_blank" href="https://transportes.fct.ufg.br/p/31448-sete-sistema-eletronico-de-gestao-do-transporte-escolar">aqui</a> ' + 
            'para baixar a versão desktop.',
    }).then(() => navigateDashboard(lastPage))
} else {
    // Rodando no electron
    // Biblioteca http para baixar a malha do OSM overpass
    http = require('http');
}

function baixarMalhaDoOSM(arqDestino, latitude = cidadeLatitude, longitude = cidadeLongitude) {
    var latmin = latitude - 0.25;
    var lngmin = longitude - 0.25;
    var latmax = latitude + 0.25;
    var lngmax = longitude + 0.25;

    var latstr = `${latmin},${lngmin},${latmax},${lngmax}`;

    var url = `http://overpass-api.de/api/interpreter?data=[out:xml][timeout:25];
(node['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});
way['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});
relation['highway']['highway'!='footway']['highway'!='pedestrian']['-highway'!='path'](${latstr});)
;(._;>;);out meta;`

    loadingFn("Baixando a malha...", "Aguarde alguns minutinhos...");
    http.get(url, function (response) {
        if (response.statusCode != 200) {
            errorFn("Erro ao baixar a malha")
        } else {
            var file = fs.createWriteStream(arqDestino);
            response.pipe(file);
        }

        response.on('end', () => {
            Swal2.fire({
                icon: "success",
                title: "Malha baixada com sucesso!",
                text: "Arquivo localizado em: " + arqDestino
            })
        });
    });
}


$("#baixarMalha").on('click', () => {
    let arqDestino = dialog.showSaveDialogSync(win, {
        title: "Salvar Malha OSM",
        buttonLabel: "Salvar Malha",
        filters: [
            { name: "OSM", extensions: ["osm"] }
        ]
    });

    if (arqDestino != "" && arqDestino != undefined) {
        let arqOrigem = path.join(userDataDir, "malha.osm");
        console.log("Copiando de: ", arqOrigem, arqDestino);
        baixarMalhaDoOSM(arqDestino);
    }
});

$('#rota-malha-salvarNovaMalha').on('click', () => {
    loadingFn("Processando a malha...")

    let osmFilePath = $("#novaMalhaOSM")[0].files[0].path;
    ipcRenderer.send('start:malha-update', osmFilePath);
});

if (isElectron) {
    ipcRenderer.on("end:malha-update", function (event, status) {
        if (status) {
            successDialog("Malha atualizada com sucesso",
                "Clique em OK para retornar a visão geral do sistema.")
        } else {
            errorFn("Erro ao atualizar a malha")
        }
    });
}

// Wizard
$('.card-wizard').bootstrapWizard(configWizardBasico("", usarValidador = false))