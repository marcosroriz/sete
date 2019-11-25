// Função para retornar um Mapa Clicável e Simples do OpenLayers

var mapaCores = ["#E58606", "#5D69B1", "#52BCA3", "#99C945", "#CC61B0",
    "#24796C", "#DAA51B", "#2F8AC4", "#764E9F", "#ED645A",
    "#CC3A8E", "#A5AA99"];

var cor = 0;

function proximaCor() {
    return mapaCores[++cor % mapaCores.length];
}

function novoMapaOpenLayers(target, latitude, longitude) {
    let mapa = {};

    let vectorSource = new ol.source.Vector();
    let vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        displayInLayerSwitcher: false,
    });

    let olMap = new ol.Map({
        "target": target,
        "layers": [
            new ol.layer.Tile({
                title: "Satélite",
                baseLayer: true,
                displayInLayerSwitcher: true,
                source: new ol.source.BingMaps({
                    key: "ciN5QAQYiHzOFNabIODf~b61cOBWqj2nmKSuoyjuyKA~AiShqLNGsToztBeSE2Tk8Pb1cUdr4nikxL24hlMRaHCJkIpKaYtdBXoxaDEgFhQv",
                    imagerySet: "AerialWithLabels"
                })
            }),
            new ol.layer.Tile({
                title: "Vias",
                baseLayer: true,
                displayInLayerSwitcher: true,
                source: new ol.source.OSM(),
                visible: false
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
    mapa["layerSwitcherActivated"] = false;

    mapa["layers"] = {
        "base": {
            "source": vectorSource,
            "layer": vectorLayer
        }
    };

    mapa["addLayer"] = function (lname) {
        let vs = new ol.source.Vector();
        let vl = new ol.layer.Vector({
            source: vs,
            "displayInLayerSwitcher": false
        });
        vl.set("name", lname);

        let lyr = {
            "name": lname,
            "source": vs,
            "layer": vl,
            "displayInLayerSwitcher": false,
        }

        mapa["layers"][lname] = lyr;
        olMap.addLayer(vl);
        return lyr;
    };

    mapa["addGroupLayer"] = function (title, lyrs) {
        let groupLayer = new ol.layer.Group({
            "title": title,
            "type": "base",
            "displayInLayerSwitcher": true,
            "layers": lyrs
        });

        mapa["groupLayer"] = groupLayer;
        olMap.addLayer(groupLayer);
    };

    mapa["createLayer"] = function (lname, title) {
        let vs = new ol.source.Vector();
        let vl = new ol.layer.Vector({
            "title": title,
            "source": vs
        });

        let lyr = {
            "name": lname,
            "title": title,
            "source": vs,
            "layer": vl
        }

        return lyr;
    };

    mapa["rmLayer"] = function (lname) {
        if (mapa["layers"][lname] != null) {
            mapa["layers"][lname].source.clear();
            olMap.removeLayer(mapa["layers"][lname]);
            delete mapa["layers"][lname];
        }
    };

    mapa["rmGroupLayer"] = function (lname) {
        if (mapa["groupLayer"] != null) {
            olMap.removeLayer(mapa["groupLayer"]);
        }
    };

    mapa["activateSelect"] = function () {
        let select = new ol.interaction.Select({
            hitTolerance: 5,
            multi: false,
            condition: ol.events.condition.singleClick
        });
        olMap.addInteraction(select);

        mapa["select"] = select;
        return select;
    };

    mapa["activateSidebarLayerSwitcher"] = function (elemID) {
        if (mapa["layerSwitcherActivated"] == false) {
            var switcher = new ol.control.LayerSwitcher({
                target: $(elemID).get(0),
                reordering: false,
                extent: true,
                trash: false
            });
            olMap.addControl(switcher);
            mapa["layerSwitcherActivated"] = true;
        }
    };

    mapa["activateImageLayerSwitcher"] = function () {
        if (mapa["layerSwitcherActivated"] == false) {
            var switcher = new ol.control.LayerSwitcherImage({
                reordering: false,
                displayInLayerSwitcher: (l) => {
                    if (l.values_.displayInLayerSwitcher != undefined) {
                        return l.values_.displayInLayerSwitcher;
                    } else if (l.values_.name == undefined) {
                        return true;
                    } else {
                        return !l.values_.name.startsWith("geocoder");
                    }
                }
            });
            olMap.addControl(switcher);
            mapa["layerSwitcherActivated"] = true;
        }
    };

    mapa["activateGeocoder"] = function () {
        var geocoder = new Geocoder('nominatim', {
            provider: 'osm',
            autoComplete: true,
            autoCompleteMinLength: 4,
            lang: 'pt-BR', //en-US, fr-FR
            placeholder: 'Procurar por ...',
            limit: 5,
            countrycodes: "br",
            keepOpen: true
        });
        olMap.addControl(geocoder);
    };

    return mapa;
}

var mapPNGExportOptions = {
    filter: function (element) {
        return element.className ? element.className.indexOf('ol-control') === -1 : true;
    }
};

var gerarMarcador = (lat, lng, icon) => {
    let p = new ol.Feature({
        "geometry": new ol.geom.Point(ol.proj.fromLonLat([lng, lat]))
    });
    p.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [12, 37],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: icon
        })
    }));

    return p;
}
