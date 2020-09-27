const path = require('path');
const electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: path.resolve(__dirname, 'out', 'SETE-win32-x64'),
    outputDirectory: path.resolve(__dirname, 'out'),
    name: "SETE",
    description: 'Software de Gestao do Transporte Escolar',
    authors: 'CECATE UFG',
    version: "1.0.1",
    exe: 'SETE.exe',
    noMsi: false,
    iconUrl: "https://wikiportes.com.br/setelogo.ico",
    //setupIcon: "C:\\Desenvolvimento\\Javascript\\sete\\src\\renderer\\img\\icones\\instalador.ico",
    setupIcon: "C:\\projects\\sete\\src\\renderer\\img\\icones\\instalador.ico",
    setupExe: "SETEEXE.exe",
    setupMsi: "SETEMSI.msi"
});

resultPromise.then(() => console.log("Criamos o binário windows com sucesso!"),
    (e) => console.log(`Erro ao criar o binário windows: ${e.message}`));
