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
getBase64Image("logosete", "./img/icones/setelogopequeno.png", "image/png", saveImgCallback);

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

    doc.images = doc.images || {};
    doc.images["logo"] = baseImages.get("logosete");
    doc.content.splice(1, 0, {
        alignment: 'center',
        margin: [0, 0, 0, 12],
        image: "logo"
    });
    doc.styles.tableHeader.fontSize = 12;

    return doc;
}
