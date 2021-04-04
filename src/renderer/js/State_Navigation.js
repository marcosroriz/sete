// FUNÇÃO RESPONSAVEL POR VERIFICAR O ESTADO DA CONEXÃO DE INTERNET
function StateNetwork(){
    if (navigator.onLine) {
        return true;
    } else {
        return false;
    }
}

// FUNÇÃO RESPONSAVEL POR VOLTAR PARA A PÁGINA INICIAL SE A MESMA FOR INSTANCIADA
function return_dashboard (){
    if (StateNetwork() == false && module_name.includes("dashboard.html") == false) {
        document.querySelector("#logosete").click();
        module_name = 'dashboard.html';
        errorFn("Internet não está funcionando. Verifique a rede.");
    }
    try {
        clearInterval(timerId);
    } catch(error){
        console.log(error)
    }
}

// FUNÇÃO RESPONSAVEL POR DESABILITAR OS BOTÕES DE EDITAR
function disable_edit (){
    var b;
    for (b = 0; b < $('i[class="fa fa-edit"]').length; b++) {
        try {
            $('i[class="fa fa-edit"]')[b].removeAttribute('class')
        } catch(error){        
            console.log(error)
        }
    }
}