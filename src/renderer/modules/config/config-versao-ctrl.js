// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(() => {
    // $("#appVersion").text(app.getVersion());
    // $("#archVersion").text(platform?.os?.architecture + " bits");
    fetch("../../package.json")
    .then((res) => res.json())
    .then((pkg) => $("#appVersion").text(pkg.version))

    $("#archVersion").text(platform?.os?.architecture + " bits");
    $("#platformVersion").text(platform?.name + " (" + platform?.version + ")");
    $("#osVersion").text(platform?.os?.family + " " + platform?.os?.version);
});
