// rota-malha-ctrl.js
// Este arquivo contém o script de controle da tela rota-malha-view. O memso
// permite importar os dados de uma rota no formato OSM

$("#baixarMalha").click(() => {
    let arqDestino = dialog.showSaveDialogSync(win, {
        title: "Salvar Malha OSM",
        buttonLabel: "Salvar Malha",
        filters: [
            { name: "OSM", extensions: ["osm"] }
        ]
    });

    if (arqDestino != "" && arqDestino != undefined) {
        let arqOrigem = path.join(userDataDir, "malha.osm");
        console.log("Copiando de: ", arqOrigem, arqDestino)
        fs.copySync(arqOrigem, arqDestino)
        Swal2.fire({
            icon: "success",
            title: "Malha baixada com sucesso!",
            text: "Arquivo localizado em: " + arqDestino
        })
    } else {
        errorFn("Erro ao copiar arquivo OSM")
    }
});

$('#rota-malha-salvarNovaMalha').on('click', () => {
    loadingFn("Processando a malha...")

    let osmFilePath = $("#novaMalhaOSM")[0].files[0].path;
    ipcRenderer.send('start:malha-update', osmFilePath);
});


ipcRenderer.on("end:malha-update", function (event, status) {
    debugger;
    if (status) {
        successDialog("Malha atualizada com sucesso", 
                      "Clique em OK para retornar a visão geral do sistema.")
    } else {
        errorFn("Erro ao atualizar a malha")
    } 
});

// Wizard
$('.card-wizard').bootstrapWizard(configWizardBasico("", usarValidador = false))