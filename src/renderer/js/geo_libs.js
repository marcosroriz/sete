// Esse aquivo contem requires de bibliotecas em node que não possuem versão compatível para browser.
// A idéia é agrupar essas bibliotecas aqui e transformá-las para browser
// usando o comando browserify

// var togeojson = require("@mapbox/togeojson");
var GPXDOMParser = require("xmldom").DOMParser;
var simplify = require("simplify-geojson");
// window.togeojson = togeojson;
// window.GPXDOMParser = GPXDOMParser;
// window.simplify = simplify;
