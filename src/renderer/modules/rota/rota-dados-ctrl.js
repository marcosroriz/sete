// rota-dados-ctrl.js
// Este arquivo contém o script de controle da tela rota-dados-view. O mesmo
// apresenta os dados de uma determinada rota cadastrada. Também é feito uma busca nas
// base de dados de alunos e escolas para conhecer o quantitativo atendido por rota
// e o traçado da rotas.

var idRota = estadoRota["ID"];
var listaDeAlunos = new Map();
var listaDeEscolas = new Map();

// Variáveis de Mapas
var geojson = new ol.format.GeoJSON();
var mapMalhas = {};
var mapa = novoMapaOpenLayers("mapDetalheRota", cidadeLatitude, cidadeLongitude);

// Malha
var malha = mapa["addLayer"]("Malha");
var malhaSource = malha["source"];
var malhaLayer = malha["layer"];

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

var estilos = {}
estilos["Pavimentada"] = new ol.style.Stroke({ color: "#00cca7", width: 4 })
estilos["NaoPavimentada"] = new ol.style.Stroke({ color: '#ff6f00', width: 4 })
estilos["Hidrovia"] = new ol.style.Stroke({ color: "#1ebafc", width: 4 })

var modoSelecionado = "Pavimentada";

var estilosIcones = {
    inicio: "img/icones/inicio-icone.png",
    mataburro: "img/icones/mataburro-marcador.png",
    colchete: "img/icones/porteira-marcador.png"
}

var gerarMarcadorIcone = (imgPath) => {
    return new ol.style.Icon({
        anchor: [16, 16],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: imgPath
    })
}

var getGeomStyle = function (feature) {
    var tipoLinha = feature.get("estilo");
    if (tipoLinha == undefined) {
        tipoLinha = "Pavimentada";
    }
    var styles = new Array();

    if (feature.getGeometry() instanceof ol.geom.LineString) {
        styles.push(new ol.style.Style({
            stroke: estilos[tipoLinha]
        }));

        var numFeatures = feature.getGeometry().getCoordinates().length;
        var simplify = false;
        if (numFeatures > 100) {
            simplify = true;
        }

        feature.getGeometry().forEachSegment(function (start, end) {
            var rnd = Math.floor(Math.random() * 10 + 1);

            var dx = end[0] - start[0];
            var dy = end[1] - start[1];
            var rotation = Math.atan2(dy, dx);

            if (simplify && rnd <= 9) {
                return;
            }

            // arrows
            styles.push(new ol.style.Style({
                geometry: new ol.geom.Point(end),
                image: new ol.style.Icon({
                    src: 'img/icones/arrow.png',
                    anchor: [0.75, 0.5],
                    rotateWithView: true,
                    rotation: -rotation
                })
            }));
        });
    }
    return styles;
}

malhaLayer.setStyle((feature) => {
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        feature.setStyle(getGeomStyle(feature));
    } else if (feature.getGeometry() instanceof ol.geom.Point) {
        var tipoIcone = feature.get("estiloIcone");
        feature.setStyle(new ol.style.Style({
            image: gerarMarcadorIcone(estilosIcones[tipoIcone])
        }))
    }
})

// Plot
var plotarAluno = (alunoRaw) => {
    let lat = alunoRaw["LOC_LATITUDE"];
    let lng = alunoRaw["LOC_LONGITUDE"];
    let icon = "img/icones/aluno-marcador.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", alunoRaw["NOME"]);
    marcador.set("content", alunoRaw["NOME"]);
    malhaSource.addFeature(marcador);
}

var plotarEscola = (escolaRaw) => {
    let lat = escolaRaw["LOC_LATITUDE"];
    let lng = escolaRaw["LOC_LONGITUDE"];
    let icon = "img/icones/escola-marker.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", escolaRaw["NOME"]);
    marcador.set("content", escolaRaw["NOME"]);
    malhaSource.addFeature(marcador);
}

// Plota garagem na tela
var plotarGaragem = (garagemRaw) => {
    let lat = garagemRaw["LOC_LATITUDE"];
    let lng = garagemRaw["LOC_LONGITUDE"];
    let icon = "img/icones/garagem-icone.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", "GARAGEM");
    marcador.set("content", "GARAGEM");
    malhaSource.addFeature(marcador);
}

// Acrescentando rota existente
if (estadoRota["SHAPE"] != "" && estadoRota["SHAPE"] != null && estadoRota["SHAPE"] != undefined) {
    $("#avisoNaoGeoReferenciada").hide();
    malhaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(estadoRota["SHAPE"]))
} else {
    $("#mapDetalheRota").hide();
}

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

var configTable = {
    columns: [
        { width: "20%", className: "text-right detalheChave" },
        { width: "60%", className: "text-left detalheValor" },
    ],
    autoWidth: false,
    paging: false,
    searching: false,
    ordering: false,
    dom: 't<"detalheToolBar"B>',
    buttons: [
        {
            text: "Voltar",
            className: "btn-info",
            action: function (e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "Rota" + estadoRota["NOME"],
            title: appTitle,
            messageTop: "Dados da Rota: " + estadoRota["NOME"],
            text: 'Exportar para Excel/LibreOffice',
            customize: function (xlsx) {
                var sheet = xlsx.xl.worksheets['sheet1.xml'];

                $('row c[r^="A"]', sheet).attr('s', '2');
                $('row[r="1"] c[r^="A"]', sheet).attr('s', '27');
                $('row[r="2"] c[r^="A"]', sheet).attr('s', '3');
            }
        },
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Rota",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[2].table.widths = ['30%', '70%'];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function (e, dt, node, config) {
                action = "editarRota";
                navigateDashboard("./modules/rota/rota-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function (e, dt, node, config) {
                action = "apagarRota";
                confirmDialog("Remover essa rota?",
                              "Ao remover essa rota ela será retirado do sistema e os alunos e "
                            + "escolas que possuir vínculo deverão ser rearranjadas novamente."
                ).then((res) => {
                    let listaPromisePraRemover = []
                    if (res.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ROTA, "ID_ROTA", idRota));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", idRota));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ROTA", idRota));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_ROTA", idRota));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_ROTA", idRota));
                        listaPromisePraRemover.push(dbAtualizaVersao());
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        dataTablesRotas.row($tr).remove();
                        dataTablesRotas.draw();
                        Swal2.fire({
                            title: "Sucesso!",
                            icon: "success",
                            text: "Rota removida com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover a rota", err))
            }
        },
    ]
}

// Cria DataTables
var dataTableRota = $("#dataTableDadosRota").DataTable(configTable);

var dataTableListaDeEscolas = $("#dataTableListaDeEscolas").DataTable({
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'LOCALIZACAO', width: "15%" },
        { data: 'ENSINO', width: "15%" },
        { data: 'HORARIO', width: "30%" }
    ],
    columnDefs: [{
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    }],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    order: [[0, "asc"]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar escolas",
        "lengthMenu": "Mostrar _MENU_ escolas por página",
        "zeroRecords": "Não encontrei nenhuma escola cadastrada",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Escolas filtradas a partir do total de _MAX_ escolas)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'frtip',
});

var dataTableListaDeAlunos = $("#dataTableListaDeAlunos").DataTable({
    columns: [
        { data: 'NOME', width: "25%" },
        { data: 'LOCALIZACAO', width: "15%" },
        { data: 'NIVELSTR', width: "150px" },
        { data: 'TURNOSTR', width: "150px" },
        { data: 'ESCOLA', width: "25%" },
    ],
    columnDefs: [{ targets: 0, render: renderAtMostXCharacters(50) },
                 { targets: 4, render: renderAtMostXCharacters(50) }],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    order: [[0, "asc"]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar alunos",
        "lengthMenu": "Mostrar _MENU_ alunos por página",
        "zeroRecords": "Não encontrei nenhum aluno cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Alunos filtrados a partir do total de _MAX_ alunos)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'frtip',
});

estadoRota["ALUNOS"].forEach(aluno => {
    listaDeAlunos.set(aluno["ID_ALUNO"], aluno)
})

estadoRota["ESCOLAS"].forEach(escola => {
    listaDeEscolas.set(escola["ID_ESCOLA"], escola)
})

dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA")
.then(res => preprocessarRelacaoAlunoEscola(res))
.then(() => adicionarDadosAlunoEscolaTabelaEMapa())

dbBuscarTodosDadosPromise(DB_TABLE_GARAGEM)
.then(res => processarGaragem(res))

// Processa garagem
var processarGaragem = (res) => {
    for (let garagemRaw of res) {
        if (garagemRaw["LOC_LONGITUDE"] != null && garagemRaw["LOC_LONGITUDE"] != undefined &&
            garagemRaw["LOC_LATITUDE"] != null && garagemRaw["LOC_LATITUDE"] != undefined) {
            plotarGaragem(garagemRaw)
        }
    }
}


// Preprocessa relação aluno escola
var preprocessarRelacaoAlunoEscola = (res) => {
    for (let escolaRaw of res) {
        let aID = escolaRaw["ID_ALUNO"];
        if (listaDeAlunos.has(aID)) {
            var aluno = listaDeAlunos.get(aID);
            aluno["ESCOLA"] = escolaRaw["NOME"];
            listaDeAlunos.set(aID, aluno);
        }
    }
    return listaDeAlunos;
};

// Adiciona dados de alunos e escola nas respectivas tabelas e mapa
var adicionarDadosAlunoEscolaTabelaEMapa = ()  => {
    listaDeAlunos.forEach(aluno => {
        if (aluno["LOC_LONGITUDE"] != null && aluno["LOC_LONGITUDE"] != undefined &&
            aluno["LOC_LATITUDE"] != null && aluno["LOC_LATITUDE"] != undefined) {
            plotarAluno(aluno)
        }

        dataTableListaDeAlunos.row.add(aluno);
    })

    listaDeEscolas.forEach(escola => {
        if (escola["LOC_LONGITUDE"] != null && escola["LOC_LONGITUDE"] != undefined &&
            escola["LOC_LATITUDE"] != null && escola["LOC_LATITUDE"] != undefined) {
            plotarEscola(escola)
        }

        dataTableListaDeEscolas.row.add(escola);
    })

    dataTableListaDeAlunos.draw()
    dataTableListaDeEscolas.draw()
    return true;
}

// Plota dados de aluno e escola no mapa
var plotaDadosAlunoEscola = () => {
    listaDeAlunos.forEach(aluno => {
        if (aluno["LOC_A"])
        dataTableListaDeAlunos.row.add(aluno);
    })

    listaDeEscolas.forEach(escola => {
        dataTableListaDeEscolas.row.add(escola);
    })

}

// Popular tabela utilizando rota escolhida
$("#detalheNomeRota").html(estadoRota["NOME"]);
dataTableRota.row.add(["Nome da rota", estadoRota["NOME"]]);

var tipoRota = "";
switch (estadoRota["TIPO"]) {
    case 1: tipoRota = "Rodoviária"; break;
    case 2: tipoRota = "Aquaviária"; break;
    case 3: tipoRota = "Mista"; break;
    default: tipoRota = "Rodoviária";
}
dataTableRota.row.add(["Tipo", tipoRota]);

var dificuldadesAcesso = new Array();
if (estadoRota["DA_PORTEIRA"] != "") { dificuldadesAcesso.push("Porteira"); }
if (estadoRota["DA_MATABURRO"] != "") { dificuldadesAcesso.push("Mata-Burro"); }
if (estadoRota["DA_COLCHETE"] != "") { dificuldadesAcesso.push("Colchete"); }
if (estadoRota["DA_ATOLEIRO"] != "") { dificuldadesAcesso.push("Atoleiro"); }
if (estadoRota["DA_PONTERUSTICA"] != "") { dificuldadesAcesso.push("Ponte Rústica"); }

if (dificuldadesAcesso.length != 0) {
    dataTableRota.row.add(["Dificuldade de acesso", dificuldadesAcesso.join(", ")]);
} else {
    dataTableRota.row.add(["Dificuldade de acesso", "Não informado"]);
}

dataTableRota.row.add(["Número de <br />alunos atendidos", listaDeAlunos.size]);
dataTableRota.row.add(["Número de <br />escolas atendidas", listaDeEscolas.size]);

if (estadoRota["KM"] != "") {
    dataTableRota.row.add(["Quilometragem da Rota", estadoRota["KM"] + " km"]);
} else {
    dataTableRota.row.add(["Quilometragem da Rota", "Não informada"]);
}

if (estadoRota["TEMPO"] != "") {
    dataTableRota.row.add(["Duração da Rota", estadoRota["TEMPO"] + " min"]);
} else {
    dataTableRota.row.add(["Duração da Rota", "Não informada"]);
}
dataTableRota.draw();

// if (veiculo != "") {
//     var veiculoSTR = `${veiculo["TIPOSTR"]} (${veiculo["PLACA"]})`;
//     dataTableRota.row.add(["Veículo", veiculoSTR]);
//     dataTableRota.row.add(["Marca do Veículo", veiculo["MARCASTR"]]);
//     dataTableRota.row.add(["Modelo do Veículo", veiculo["MODELOSTR"]]);
//     dataTableRota.row.add(["Propriedade do Veículo", veiculo["ORIGEMSTR"]]);
// } else {
//     dataTableRota.row.add(["Veículo", "Não informado"]);
// }

// if (motoristas != "") {
//     dataTableRota.row.add(["Motoristas", motoristas]);
// } else {
//     dataTableRota.row.add(["Motoristas", "Não informado"]);
// }


// var veiculosRota = BuscarDadosVeiculoRotaPromise(estadoRota["ID_ROTA"])
// var motoristasRota = BuscarDadosMotoristaRotaPromise(estadoRota["ID_ROTA"])
// var escolasAtendidas = ListarTodasAsEscolasAtendidasPorRotaPromise(estadoRota["ID_ROTA"])
// var alunosAtendidos = ListarTodosOsAlunosAtendidosPorRotaPromise(estadoRota["ID_ROTA"])

// var veiculo = "";
// var motoristas = "";
// Promise.all([veiculosRota, motoristasRota, escolasAtendidas, alunosAtendidos])
//     .then((res) => {
//         var veiculoResult = res[0];
//         if (veiculoResult.length != 0) {
//             veiculo = parseVeiculoDB(veiculoResult[0]);
//         }

//         var listaDeMotoristas = new Array();
//         for (let mRaw of res[1]) {
//             listaDeMotoristas.push(mRaw["NOME"]);
//         }
//         motoristas = listaDeMotoristas.join("<br />");

//         res[2].forEach((e) => {
//             var escolaJSON = parseEscolaDB(e);
//             listaDeEscolas.set(escolaJSON["ID_ESCOLA"], escolaJSON);
//             dataTableListaDeEscolas.row.add(escolaJSON);
//         });
//         dataTableListaDeEscolas.draw();

//         res[3].forEach((a) => {
//             var alunoJSON = parseAlunoDB(a);
//             listaDeAlunos.set(alunoJSON["ID_ALUNO"], alunoJSON);
//         });
//         ListarEscolasDeAlunos((err, result) => {
//             result.forEach((alunoRaw) => {
//                 let aID = alunoRaw["ID_ALUNO"];
//                 let eNome = alunoRaw["NOME"];

//                 if (listaDeAlunos.has(aID)) {
//                     let completAlunoJSON = listaDeAlunos.get(aID);
//                     completAlunoJSON["ESCOLA"] = eNome;
//                     dataTableListaDeAlunos.row.add(completAlunoJSON);
//                 }
//             })
//             dataTableListaDeAlunos.draw();
//         })
//         
//     })


$("#detalheInitBtn").click();

$("#detalheMapa").on('click', () => {
    setTimeout(function () {
        if (mapa != null) {
            if (malhaSource.getFeatures().length != 0) {
                mapa["map"].getView().fit(malhaSource.getExtent());
            }
            mapa["map"].updateSize();
        }
    }, 200);
})
action = "detalharRota";

