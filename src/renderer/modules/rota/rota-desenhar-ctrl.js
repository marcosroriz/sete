var mapaDesenho = novoMapaOpenLayers("mapaDesenho", -16.8152409, -49.2756642);

window.onresize = function () {
    setTimeout(function () { 
        console.log("resize");
        if (mapaDesenho != null) { mapaDesenho["map"].updateSize(); }
    }, 200);
}
