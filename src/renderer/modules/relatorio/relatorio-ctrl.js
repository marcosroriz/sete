var categories = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"];
var pickedSeries = [];

var sum = function (a, b) { return a + b };
var chart = {
    "pizza": {
        labelInterpolationFnc: function (value, idx) {
            if (pickedSeries[idx] == 0) {
                return "";
            } else {
                return Math.round(pickedSeries[idx] / pickedSeries.reduce(sum) * 100) + '%';
            }
        },
        height: 300,
        showLabel: true,
    },
    "barra": {
        distributeSeries: true,
        showLabel: true,
        height: 350,
        axisY: {
            onlyInteger: true
        },
        axisX: {
            showGrid: false
        },
        plugins: [
            Chartist.plugins.ctBarLabels({
                labelOffset: {
                    x: 0,
                    y: -10
                },
                labelInterpolationFnc: function (value) {
                    if (pickedSeries.reduce(sum) == 0) {
                        return 0 + "%";
                    } else {
                        return Math.round(value / pickedSeries.reduce(sum) * 100) + '%';
                    }
                }
            })
        ],
    },
    "barraraw": {
        distributeSeries: true,
        showLabel: true,
        height: 350,
        axisY: {
            onlyInteger: true
        },
        axisX: {
            showGrid: false
        },
        plugins: [
            Chartist.plugins.ctBarLabels({
                labelOffset: {
                    x: 0,
                    y: -10
                },
                labelInterpolationFnc: function (value) {
                    return roundToTwo(value);
                }
            })
        ],
    }
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}


var grafico_template = {
    chart: {
        toolbar: {
            show: true,
            offsetX: 0,
            offsetY: 0,
            tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: true,
            },
            export: {
                svg: {
                    filename: "grafico",
                },
                png: {
                    filename: "grafico",
                }
            },
            autoSelected: 'zoom',
            events: {
                mounted: (chart) => {
                    chart.windowResizeHandler();
                }
            }
        },
    },
    legend: {
        show: true,
        position: "bottom"
    },
    title: {
        align: "center"
    },
    theme: {
        palette: 'palette6'
    }
}

function plotarPizza(target, option) {
    var grafico_pizza_opcoes =
    {
        ...grafico_template,
        ...{
            series: option.SERIE.series,
            labels: option.SERIE.labels,
        }
    }

    grafico_pizza_opcoes["chart"]["type"] = "pie";
    grafico_pizza_opcoes["chart"]["width"] = "100%";
    grafico_pizza_opcoes["title"]["text"] = option.TITULO;

    chart = new ApexCharts(document.querySelector(target), grafico_pizza_opcoes);
    setTimeout(() => {
        chart.render();
    }, 200)

    return chart;
}

function plotarBarra(target, option) {
    var grafico_barra_opcoes =
    {
        ...grafico_template,
        ...{
            series: [{
                data: option.SERIE.series
            }],
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true,
                }
            },
            xaxis: {
                categories: option.SERIE.labels
            },
            labels: {
                style: {
                    fontSize: '5px'
                }
            }
    
        }
    }

    grafico_barra_opcoes["chart"]["type"] = "bar";
    grafico_barra_opcoes["chart"]["width"] = "100%";
    grafico_barra_opcoes["chart"]["height"] = 400;
    grafico_barra_opcoes["title"]["text"] = option.TITULO;

    chart = new ApexCharts(document.querySelector(target), grafico_barra_opcoes);
    setTimeout(() => {
        chart.render();
    }, 200)

    return chart;
}


function plotarTotal(target, option) {
    var grafico_barra_opcoes =
    {
        ...grafico_template,
        ...{
            series: [{
                name: option.SERIE.labels[0],
                data: [{
                    x: option.SERIE.labels[0],
                    y: roundToTwo(option.SERIE.series[0])
                }]
            }],
            grid: {
                show: false,
            },
            yaxis: {
                show: false
            },
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '240px',
                }
            }
        }
    }

    grafico_barra_opcoes["chart"]["type"] = "bar";
    grafico_barra_opcoes["chart"]["width"] = "100%";
    grafico_barra_opcoes["title"]["text"] = option.TITULO;

    chart = new ApexCharts(document.querySelector(target), grafico_barra_opcoes);
    setTimeout(() => {
        chart.render();
    }, 200)

    return chart;
}

function plotGraphic(target, option) {
    if (option["TIPO"] == "pizza") {
        return plotarPizza(target, option);
    } else if (option["TIPO"] == "barra") {
        return plotarBarra(target, option);
    } else if (option["TIPO"] == "total") {
        return plotarTotal(target, option);
    } else if (option["TIPO"] == "barraraw") {
        return Chartist.Bar(target, option["SERIE"], chart["barraraw"]);
    }
}

function plotLegend(target, labels, isLong) {
    for (let i = 0; i < labels.length; i++) {
        $(target).append(`<i class="fa fa-circle ct-color-${categories[i % categories.length]}"></i> <span>${labels[i]}</span>`);
        if (isLong && i != 0 && i % 2 == 0) $(target).append("<br>");
    }
}

function SetMainFilterMenu(selectID, items) {
    for (let i in items) {
        if (items[i]["FILTRO"] != "") {
            $(selectID).append(`<option value="${i}">${items[i]["TXTMENU"]}</option>`);
        }
    }
}

function GetTemplateMenu(listID, items) {
    for (let i in items) {
        $(listID).append(`<a href="#" name="${i}" class="list-group-item list-group-item-action">
                            ${items[i]["TXTMENU"]}
                           </a>`);
    }
}

function GetTemplateDataTableConfig() {
    return {
        autoWidth: false,
        bAutoWidth: false,
        lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
        pagingType: "full_numbers",
        order: [[0, "asc"]],
        language: {
            "search": "_INPUT_",
            "searchPlaceholder": "Procurar ",
            "lengthMenu": "Mostrar _MENU_ itens por página",
            "zeroRecords": "Não encontrei nenhum dado cadastrado",
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "Sem registros disponíveis",
            "infoFiltered": "(Dados filtrados a partir do total de _MAX_ dados)",
            "paginate": {
                "first": "Primeira",
                "last": "Última",
                "next": "Próxima",
                "previous": "Anterior"
            },
        },
        dom: 'rtlpB',
        buttons: [
            {
                extend: 'excel',
                className: 'btnExcel',
                filename: "Relatorio",
                title: appTitle,
                text: 'Exportar para Planilha',
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
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['30%', '15%', '20%', '20%', '15%'];
                    doc.images = doc.images || {};
                    doc.images["logo"] = baseImages.get("logo");
                    doc.content.splice(1, 0, {
                        alignment: 'center',
                        margin: [0, 0, 0, 12],
                        image: "logo"
                    });
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
}


$("#btnExpJPEG").on('click', () => {
    Swal2.fire({
        title: "Exportando imagem...",
        imageUrl: "img/icones/processing.gif",
        icon: "img/icones/processing.gif",
        showCancelButton: false,
        closeOnConfirm: false,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    domtoimage.toPng(document.getElementsByClassName("card-report")[0])
        .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'imagemRelatorio.jpeg';
            link.href = dataUrl;
            link.click();
            Swal2.close();
        })
        .catch((err) => errorFn("Erro ao gerar o gráfico." + err));
})

