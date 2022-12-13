// Grafico atual
var graficoAtual;
var chart;

// Helper (arrendondamento)
function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

// Template para os gráficos
var grafico_template = {
    chart: {
        height: 400,
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
            series: option.values,
            labels: option.labels,
        }
    }

    grafico_pizza_opcoes["chart"]["type"] = "pie";
    grafico_pizza_opcoes["chart"]["width"] = "100%";
    grafico_pizza_opcoes["title"]["text"] = option.titulo;

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
                data: option.values
            }],
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true,
                }
            },
            xaxis: {
                categories: option.labels
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
    grafico_barra_opcoes["title"]["text"] = option.titulo;

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
                name: option.labels[0],
                data: [{
                    x: option.labels[0],
                    y: roundToTwo(option.values[0])
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
                    fontSize: '2em',
                }
            }
        }
    }

    grafico_barra_opcoes["chart"]["type"] = "bar";
    grafico_barra_opcoes["chart"]["width"] = "100%";
    grafico_barra_opcoes["title"]["text"] = option.titulo;

    chart = new ApexCharts(document.querySelector(target), grafico_barra_opcoes);
    setTimeout(() => {
        chart.render();
    }, 200)

    return chart;
}

function plotGraphic(target, option) {
    if (option["tipo"] == "pizza") {
        return plotarPizza(target, option);
    } else if (option["tipo"] == "barra") {
        return plotarBarra(target, option);
    } else if (option["tipo"] == "total") {
        return plotarTotal(target, option);
    } else if (option["tipo"] == "barraraw") {
        return Chartist.Bar(target, option["values"], chart["barraraw"]);
    }
}

$("#btnExpJPEG").on('click', async () => {
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

    try {
        let imgConteudo = await graficoAtual.dataURI({ scale: 5 })
        window.saveAs(imgConteudo.imgURI)
        successDialog();

        // let link = document.createElement('a');
        // link.download = 'imagemRelatorio.jpeg';
        // link.href = imgConteudo.imgURI;
        // link.click();
        // Swal2.close()

    } catch (err) {
        errorFn("Erro ao gerar o gráfico." + err)
    }
})

