# SETE
<a href="#">
<img src="https://files.cercomp.ufg.br/weby/up/767/o/setepretoPrancheta_1_4x.png" alt="SETE Logo" width="400">
</a>


[![Build status](https://ci.appveyor.com/api/projects/status/3b989hf236b2i47d?svg=true)](https://ci.appveyor.com/project/marcosroriz/sete)


O Sistema Eletrônico de Gestão do Transporte Escolar (SETE) é um software de _e-governança_ desenvolvido pelo [CECATE UFG](https://transportes.fct.ufg.br/p/31447-apresentacao-do-cecate-ufg) voltado a auxiliar na gestão do transporte escolar dos municípios brasileiros considerados suas singularidades.  O sistema foi projeto com intuito de não depender de nenhum software proprietário, desta forma é possível utilizá-lo sem ter de licenciar programas dependentes.


## Baixando o Sete
Para baixar o _software_, basta clicar na versão abaixo do seu sistema operacional.

<a href="https://github.com/marcosroriz/sete/releases/download/v1.4.1/sete_1.4.1_windows64.msi"><img src="https://files.cercomp.ufg.br/weby/up/767/o/baixarwindows.png" alt="baixar sete para windows" width="279" height="114" /></a>&nbsp; &nbsp; &nbsp;&nbsp;<a href="https://github.com/marcosroriz/sete/releases/download/v1.4.1/sete_1.4.1_mac64.dmg"><img src="https://files.cercomp.ufg.br/weby/up/767/o/baixarmac.png" alt="baixar sete para mac" width="282" height="115" /></a>&nbsp; &nbsp; &nbsp;&nbsp;<a href="https://github.com/marcosroriz/sete/releases/download/v1.4.1/sete_1.4.1_linux64.deb"><img src="https://files.cercomp.ufg.br/weby/up/767/o/baixarlinux.png" alt="baixar sete para linux" width="274" height="112" /></a></p>



## Construindo (*building*) o SETE

O SETE é construído em cima do *framework*  [Electron](https://github.com/electron/electron), um arcabouço para codificação de aplicações desktop modernas baseado no ecosistema Node.js. 

O SETE utiliza bibliotecas nativas, a saber o SQLite, para possibilitar o uso e armazenamento de informações de forma *offline*. 

Considerando estes fatores, para construir o **SETE** assume-se as seguintes dependências básicas:
* Node.js v12 LTS (*e.g.*, Node.js v12.18.3)
* Yarn v1.22. (utilizado pelo electron para empacotar os binários)
* Python 2.7 (muitos módulos nativos ainda usam o Python 2)
* fakeroot, dpkg e rpm para compilar pacotes para GNU/Linux
* [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) (para compilação dos módulos no Windows)
* [Wix Toolset](https://wixtoolset.org) (para gerar binários .msi e .exe para o Windows)

Para compilar o código execute os seguintes passos.

### 1: Instalação das dependências básicas
Instale o NodeJS v12. Você pode utilizar os binários disponbilizados no site [nodejs.org](nodejs.org) ou utilizar uma ferramenta de versionamento para instalação (_e.g._, [Node Version Manager - NVM](https://github.com/nvm-sh/nvm)).

Semelhantemente, instale o gerenciador de pacotes Yarn v1.22. Você pode utilizar os binários disponiblizados no site [https://yarnpkg.com/](https://yarnpkg.com/). O yarn é utilizado pelo electron-forge para gerar os binários.

Caso queira compilar para GNU/Linux, instale os pacotes `fakeroot`, `dpkg` e `rpm`. 
Por exemplo, no Ubuntu 18.04, você deve executar o seguinte comando:
```sh
sudo apt-get install fakeroot dpkg rpm
```

Caso queira compilar para o Windows, instale o Wix Toolset e coloque o diretório `bin` do mesmo na variável PATH. Por exemplo, adicionando `C:\Program Files (x86)\WiX Toolset v3.11\bin` a variável de ambiente PATH.

No caso da plataforma Windows ainda é necessário instalar o pacote global [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) para compilação dos módulos nativos. Como administrador instale este pacote executando o seguinte comando:
```sh
npm install --global windows-build-tools
```

Por fim, o Windows ainda requer que o `npm` especifique a versão do compilador do Visual Studio, no caso 2017, e o caminho do binário do Python (instalado pelo `windows-build-tools`). Por exemplo, os comando abaixos especificam a versão 2017 e um caminho do Python (modifique para ser condizente com sua máquina). 

```sh
npm config set msvs_version "2017"
npm config set python "C:\\Python27-x64\\pythonw.exe"
```

### 2: Baixe o código fonte

```sh
git clone https://github.com/marcosroriz/sete/
```

Depois instale as dependência:

```sh
npm install
```

Por fim, recompile a dependência nativa.
```sh
npm install sqlite3 --build-from-source --runtime=electron --target=8.5.2 --dist-url=https://electronjs.org/headers
```

### 3: Executando o projeto

Para executar o projeto basta utilizar o seguinte comando:
```sh
npm run start
```

### 4: Geração de Binários

A geração de binários é feita utilizando o utilitário `electron-forge`. Especificamente, para gerar os binários, que ficarão na pasta `out`, execute o seguinte comando:

```sh
npm run make
```

## Licença de Uso
O sistema é distribuído gratuitamente sob a licença de software livre [MIT](https://github.com/marcosroriz/sete/blob/master/LICENSE) que possibilita o compartilhamento e modificação do código do mesmo por terceiros, por exemplo, por agências públicas, empresas e equipes tecnológicas dos municípios.
