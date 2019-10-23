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

getBase64Image("logo", "./img/icones/tempo-rota.svg", "image/svg+xml", saveImgCallback);
