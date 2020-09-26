# SETE
<img src="https://files.cercomp.ufg.br/weby/up/767/o/setepretoPrancheta_1_4x.png" 
     alt="SETE Logo"
     width="400">

O Sistema Eletrônico de Gestão do Transporte Escolar (SETE) é um software de e-governança desenvolvido pelo CECATE UFG voltado a auxiliar na gestão do transporte escolar dos municípios brasileiros considerados suas singularidades. O sistema é distribuído gratuitamente sob a licença de software livre MIT que possibilita o compartilhamento e modificação do código do mesmo por terceiros, por exemplo, por agências públicas, empresas e equipes tecnológicas dos municípios. O sistema foi projeto com intuito de não depender de nenhum software proprietário, desta forma é possível utilizá-lo sem ter de licenciar programas dependentes.


## Construindo (*building*) o SETE

O SETE é construído em cima do *framework*  [Electron](https://github.com/electron/electron), um arcabouço para codificação de aplicações desktop modernas baseado no ecosistema Node. 

O SETE utiliza bibliotecas nativas, a saber o SQLite, para possibilitar o uso e armazenamento de informações de forma *offline*. 

Considerando estes fatores, para construir o **SETE** assume-se as seguintes dependências básicas:
* NodeJS v12 LTS (*ex* 12.18.3)
* Python 2.7 (muitos módulos nativos ainda usam o Python 2)
* [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) (para compilação dos módulos no Windows)
* [Wix Toolset](https://wixtoolset.org) (para gerar binários .msi e .exe para o Windows)

Para compilar o código execute os seguintes passos.

### 1 - Instalação das dependências básicas
Instale o NodeJS v12. Você pode utilizar os binários disponbilizados no site nodejs.org ou utilizar uma ferramenta de versionamento para instalação (_e.g._, NVM).

Caso queira compilar para o Windows, instale o Wix Toolset e coloque o diretório `bin` do mesmo na variável PATH. Por exemplo, adicionando `C:\Program Files (x86)\WiX Toolset v3.11\bin` a variável de ambiente PATH.

No caso do Windows ainda é necessário instalar o pacote global [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) para compilação dos módulos nativos. Como administrado execute o seguinte comando:
`npm install --global windows-build-tools`
04/06/2019 - Realizando Teste Feliz no Módulo de Cadastro
05/06/2019 - Erro de Ambiente : Remove node, npm, electron, delete folder / continuou erro / reinstalou ubuntu / 

nilson@ncamaraljr:~$ nodejs -v
v12.4.0
nilson@ncamaraljr:~$ npm -v
6.9.0
nilson@ncamaraljr:~$ node
Welcome to Node.js v12.4.0.

Testei Node com um Javascript code Básico -> Funcional
https://nodejs.org/en/about/





Help Links

NodeSource Node.js Binary Distributions
https://github.com/nodesource/distributions/blob/master/README.md#debinstall
https://www.vivaolinux.com.br/topico/Iniciantes-no-Linux/Pacote-python-support-nao-instalado
sudo npm install -g electron --unsafe-perm=true --allow-root (Não Funcionou com o usuário root nem nilson)
sudo npm install electron --unsafe-perm=true -> (funcionou)

-> apt-get install paraview-python 
https://github.com/npm/npm/issues/17268

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04

Limpar Código -> Cadastro_transporte 

