const path = require('path');
const { MSICreator } = require('electron-wix-msi');

const msiCreator = new MSICreator({
	appDirectory: path.resolve(__dirname, 'out', 'sete-win32-x64'),
	outputDirectory: path.resolve(__dirname, 'out'),
	exe: 'sete.exe',
	iconUrl: "C:\\Desenvolvimento\\Javascript\\sete\\src\\renderer\\img\\icones\\setelogo.ico",
	setupIcon: "C:\\Desenvolvimento\\Javascript\\sete\\src\\renderer\\img\\icones\\instalador.ico",
	name: 'SETE',
	ui: {
		enabled: true,
		chooseDirectory: true,
		images: {
			background: "C:\\Desenvolvimento\\Javascript\\sete\\src\\renderer\\img\\installer-bg.jpg",
			banner: "C:\\Desenvolvimento\\Javascript\\sete\\src\\renderer\\img\\top-bg.jpg",
		}
	},
	description: 'Software de Gestao do Transporte Escolar',
	manufacturer: 'CECATE UFG',
	language: 1046,
	version: '1.0.0'
});

async function build() {
	await msiCreator.create();
	await msiCreator.compile();
}

build().catch(console.error);
