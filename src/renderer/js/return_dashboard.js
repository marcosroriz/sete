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