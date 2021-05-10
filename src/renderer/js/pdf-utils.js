var baseImages = new Map();

function saveImgCallback(imgName, base64Output) {
    baseImages.set(imgName, base64Output);
}

function getBase64Image(imgName, imgURI, outputFormat, callback) {
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(imgName, dataURL);
    };
    img.src = imgURI;
    if (img.complete || img.complete === undefined) {
        img.src = src;
    }
}

// getBase64Image("logo", "./img/icones/tempo-rota.svg", "image/svg+xml", saveImgCallback);
getBase64Image("logo", "./img/icones/setelogopequeno.png", "image/png", saveImgCallback);
getBase64Image("logosete", "./img/icones/setelogogrande.png", "image/png", saveImgCallback);
getBase64Image("rodape", "./img/rodape.png", "image/png", saveImgCallback);

function docReport(doc) {
    doc.styles = doc.styles || {};
    doc.styles["title"] = {
        fontSize: 18,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 10]
    }
    doc.styles["tableInfo"] = {
        fontSize: 12,
        margin: [0, 0, 0, 10]
    }
    doc.styles["tableInfoHeader"] = {
        fontSize: 13,
        bold: true,
    }
    doc.styles["tableHeader"] = {
        ...doc.styles["tableHeader"],
        alignment: "left"
    }
    doc.images = doc.images || {};
    doc.images["logo"] = baseImages.get("logosete");

    doc.content.splice(0, 0, {
        columns: [
            {
                width: 'auto',
                stack: [
                    {
                        image: baseImages.get("logosete"),
                        width: 150
                    }
                ]
            },
            {
                width: '*',
                alignment: 'left',
                stack: [
                    {
                        style: 'titulo',
                        text: 'SISTEMA ELETRÔNICO DE GESTÃO DO TRANSPORTE ESCOLAR'
                    },
                    {
                        style: 'h1',
                        text: "Versão do SETE: " + versao,
                    },
                    // {
                    //     style: 'h1',
                    //     text: "Município de " + userData.CIDADE + " (" + userData.ESTADO + ")"
                    // },
                    {
                        style: 'h1',
                        text: "Data do Relatório " + new Date().toLocaleDateString()
                    }
                ]
            }
        ]
    })

    doc.content.splice(1, 0, {
        "text": userData.CIDADE + " (" + userData.ESTADO + ")",
        "style": "tituloPrincipal",
    })

    doc["pageMargins"] = [ 40, 40, 40, 48 ]

    doc.footer = function (currentPage, pageCount) {
        return {
            table: {
                widths: [ '*', 'auto'],
                body: [
                    [
                        { 
                            image: baseImages.get("rodape"), 
                            alignment: 'center', 
                            width: 300,
                            margin: [0, 5, 0, 15] 
                        },
                        { 
                            text: currentPage.toString(),
                            alignment: 'center', 
                            margin: [15, 12, 20, 10],
                            style: 'rodape', 
                        }
                    ],
                ]
            },
            layout: 'noBorders'
        };
    }

    doc.content[3].table.dontBreakRows = true; 
    
    doc.styles["rodape"] = {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        fillColor: "#CCCCCC"
    }

    doc.styles["tituloPrincipal"] = {
        alignment: 'center', 
        margin: [0, 10, 0, 12],
        fontSize: 20,
        bold: true
    }
    
    doc.styles["titulo"] = {
        margin: [10, 8, 0, 0],
        fontSize: 16,
        bold: true
    }

    doc.styles["h1"] = {
        fontSize: 10,
        margin: [10, 8, 0, 0],
    }
    
    doc.styles.tableHeader.fontSize = 12;
    doc.styles.tableHeader.alignment = "left";
    doc.styles.tableHeader.margin = [10, 2, 5, 2];
    doc.styles.tableBodyOdd.margin = [10, 2, 5, 2];
    doc.styles.tableBodyEven.margin = [10, 2, 5, 2];
    
    return doc;
}

