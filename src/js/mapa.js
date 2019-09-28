// Função para retornar um Mapa Clicável e Simples do OpenLayers

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
    
    mapa["layers"] = {
        "base" : {
            "source" : vectorSource,
            "layer"  : vectorLayer
        }
    }

    mapa["addLayer"] = function(lname) {
        let vs = new ol.source.Vector();
        let vl = new ol.layer.Vector({
            source: vs
        });
        
        let lyr = {
            "source" : vs,
            "layer"  : vl
        }

        mapa["layers"][lname] = lyr;
        olMap.addLayer(vl);
        return lyr;
    }


    mapa["rmLayer"] = function(lname) {
        if (mapa["layers"][lname] != null) {
            olMap.removeLayer(mapa["layers"][lname]);
            delete mapa["layers"][lname];
        }
    }

    return mapa;
}

