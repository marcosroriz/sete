var os = require('os');

// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    $("#appVersion").text(app.getVersion());
    $("#archVersion").text(os.arch() + " bits")
    var releaseOS = os.release();
    switch (process.platform) {
        case "win32":
            $("#osVersion").text("Windows ") + releaseOS;
            break;
        case "darwin":
            $("osVersion").text("MAC OS ") + releaseOS;
            break;
        case "linux":
            $("osVersion").text("GNU/Linux ") + releaseOS;
            break;
        default:
            $("#osVersion").text("Windows ") + releaseOS;
            break;
    }

});
