// mapa.js
// Este arquivo contém um conjunto de script para controlar as operações 
// relacionados a criação e interação com mapas

// Função para retornar um Mapa Clicável e Simples do OpenLayers
var mapaCores = ["#E58606", "#5D69B1", "#52BCA3", "#99C945", "#CC61B0",
    "#24796C", "#DAA51B", "#2F8AC4", "#764E9F", "#ED645A",
    "#CC3A8E", "#A5AA99"];

var mapaCoresRGB = [
    [229, 134, 6],
    [93, 105, 177],
    [82, 188, 163],
    [153, 201, 69],
    [204, 97, 176],
    [36, 121, 108],
    [218, 165, 27],
    [47, 138, 196],
    [118, 78, 159],
    [237, 100, 90],
    [204, 58, 142],
    [165, 170, 153]
]
var cor = 0;

function proximaCor() {
    return mapaCores[++cor % mapaCores.length];
}

function proximaCorComOpacity(opacity = 1) {
    let corEscolhida = mapaCoresRGB[++cor % mapaCoresRGB.length];
    corEscolhida.push(opacity);
    return corEscolhida;
}
function novoMapaOpenLayers(target, latitude, longitude) {
    let mapa = {};

    let vectorSource = new ol.source.Vector();
    let vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        displayInLayerSwitcher: false,
    });

    let olMap = new ol.Map({
        "controls": ol.control.defaults().extend([
            new ol.control.FullScreen({
                tipLabel: "Ativar/Desativar tela cheia"
            }),
            new ol.control.CanvasScaleLine()
        ]),
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
            maxZoom: 18,
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

    mapa["addLayer"] = function (lname, displayInLayerSwitcher = false) {
        let vs = new ol.source.Vector();
        let vl = new ol.layer.Vector({
            source: vs,
            "displayInLayerSwitcher": displayInLayerSwitcher
        });
        vl.set("name", lname);

        let lyr = {
            "name": lname,
            "source": vs,
            "layer": vl,
            "displayInLayerSwitcher": displayInLayerSwitcher,
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

    mapa["addHiddenGroupLayer"] = function (title, lyrs) {
        let groupLayer = new ol.layer.Group({
            "title": title,
            "type": "base",
            "visible": false,
            "displayInLayerSwitcher": true,
            "layers": lyrs
        });

        mapa["groupLayer"] = groupLayer;
        olMap.addLayer(groupLayer);
    };

    mapa["createLayer"] = function (lname, title, displayInLayerSwitcher = false) {
        let vs = new ol.source.Vector();
        let vl = new ol.layer.Vector({
            "title": title,
            "source": vs,
            "displayInLayerSwitcher": displayInLayerSwitcher
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
                trash: false,
            });
            olMap.addControl(switcher);
            mapa["layerSwitcherActivated"] = true;

            return switcher;
        }
    };

    mapa["activateImageLayerSwitcher"] = function () {
        if (mapa["layerSwitcherActivated"] == false) {
            var switcher = new ol.control.LayerSwitcherImage({
                reordering: false,
                drawDelay: 1000,
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
        geocoder.getSource().set("displayInLayerSwitcher", false);
        geocoder.getLayer().set("displayInLayerSwitcher", false);
        olMap.addControl(geocoder);
    };

    mapa["activatePrinting"] = function () {
        var printControl = new ol.control.PrintDialog(({ lang: 'pt' }));
        printControl.setSize('A4');
        olMap.addControl(printControl);

        /* On print > save image file */
        printControl.on(['print', 'error'], function (e) {
            // Print success
            if (e.image) {
                if (e.pdf) {
                    // Export pdf using the print info
                    var pdf = new jsPDF({
                        orientation: e.print.orientation,
                        unit: e.print.unit,
                        format: e.print.size
                    });
                    pdf.addImage(e.image, 'JPEG', e.print.position[0], e.print.position[0], e.print.imageWidth, e.print.imageHeight);
                    pdf.save(e.print.legend ? 'legend.pdf' : 'map.pdf');
                } else {
                    // Save image as file
                    e.canvas.toBlob(function (blob) {
                        var name = (e.print.legend ? 'legend.' : 'map.') + e.imageType.replace('image/', '');
                        saveAs(blob, name);
                    }, e.imageType, e.quality);
                }
                $($(".ol-ext-buttons button[type='button']")[0]).trigger('click')
            } else {
                errorFn("Problema ao gerar o arquivo de impressão. ")
                $($(".ol-ext-buttons button[type='button']")[0]).trigger('click')
            }
        });
    }

    mapa["activatePrinting"]();
    return mapa;
}

var mapPNGExportOptions = {
    filter: function (element) {
        return element.className ? element.className.indexOf('ol-control') === -1 : true;
    }
};

var gerarMarcador = (lat, lng, icon, anchorX = 12, anchorY = 37) => {
    let p = new ol.Feature({
        "geometry": new ol.geom.Point(ol.proj.fromLonLat([lng, lat]))
    });
    p.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [anchorX, anchorY],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: icon
        })
    }));

    return p;
}

var selectPonto = (tipo) => {
    return new ol.interaction.Select({
        hitTolerance: 5,
        multi: false,
        condition: ol.events.condition.singleClick,
        filter: (feature, layer) => {
            if (feature.getGeometry().getType() == "Point" &&
                feature.getProperties()["TIPO"] == tipo) {
                return true;
            } else {
                return false;
            }
        }
    });
}

// Converts geojson-vt data to GeoJSON
var osmMapReplacer = function (key, value) {
    if (value.geometry) {
        var type;
        var rawType = value.type;
        var geometry = value.geometry;

        if (rawType === 1) {
            type = 'MultiPoint';
            if (geometry.length == 1) {
                type = 'Point';
                geometry = geometry[0];
            }
        } else if (rawType === 2) {
            type = 'MultiLineString';
            if (geometry.length == 1) {
                type = 'LineString';
                geometry = geometry[0];
            }
        } else if (rawType === 3) {
            type = 'Polygon';
            if (geometry.length > 1) {
                type = 'MultiPolygon';
                geometry = [geometry];
            }
        }

        return {
            'type': 'Feature',
            'geometry': {
                'type': type,
                'coordinates': geometry,
            },
            'properties': value.tags,
        };
    } else {
        return value;
    }
};

// Openlayers impressão
ol.control.PrintDialog.prototype.formats = [{
    title: 'Copiar para a área de transferência',
    imageType: 'image/png',
    clipboard: true
}, {
    title: 'Salvar como JPEG (qualité média)',
    imageType: 'image/jpeg',
    quality: .8
}, {
    title: 'Salvar como JPEG (qualidade máxima)',
    imageType: 'image/jpeg',
    quality: 1
}, {
    title: 'Salvar como PNG',
    imageType: 'image/png',
    quality: .92
}, {
    title: 'Salvar como PDF',
    imageType: 'image/jpeg',
    quality: 1,
    pdf: true
}
];
