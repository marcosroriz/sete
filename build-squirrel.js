const path = require('path');
const electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: path.resolve(__dirname, 'out', 'sete-win32-x64'),
    outputDirectory: path.resolve(__dirname, 'out'),
    name: "SETE",
    description: 'Software de Gestao do Transporte Escolar',
    authors: 'CECATE UFG',
    version: "0.1",
    exe: 'sete.exe',
    noMsi: false,
    setupExe: "SETEEXE.exe",
    setupMsi: "SETEMSI.msi"
});

resultPromise.then(() => console.log("Criamos o binário windows com sucesso!"),
    (e) => console.log(`Erro ao criar o binário windows: ${e.message}`));
