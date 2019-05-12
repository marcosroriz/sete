// Função para retornar um Mapa Clicável do OpenLayers

function novoMapaOpenLayers(target, latitude, longitude) {
    let mapa = {};
    
    let vectorSource = new ol.source.Vector();
    let vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    
    let olMap = new ol.Map({
        "target": target,
        "layers": [
            new ol.layer.Tile({
                source: new ol.source.BingMaps({
                    key: "ciN5QAQYiHzOFNabIODf~b61cOBWqj2nmKSuoyjuyKA~AiShqLNGsToztBeSE2Tk8Pb1cUdr4nikxL24hlMRaHCJkIpKaYtdBXoxaDEgFhQv",
                    imagerySet: "AerialWithLabels"
                })
            }),
            vectorLayer
        ],
        "view": new ol.View({
            center: ol.proj.fromLonLat([longitude, latitude]),
            zoom: 15
        })
    });

    mapa["vectorSource"] = vectorSource;
    mapa["vectorLayer"] = vectorLayer;
    mapa["map"] = olMap;

    return mapa;
}
