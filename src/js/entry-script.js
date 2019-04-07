// Basic libraries
window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');
require("jquery-validation");
require("jquery-mask-plugin");
require("sweetalert");

// Local config
const Store = require('electron-store');
const userconfig = new Store();

// Google Firebase
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
require('firebase/firestore');

// Initialize Firebase
let dbconfig = {
    apiKey: "AIzaSyDOHCjGDkv-tsIjVhHxOcEt0rzusFJwQxc",
    authDomain: "softwareter.firebaseapp.com",
    databaseURL: "https://softwareter.firebaseio.com",
    projectId: "softwareter",
    storageBucket: "softwareter.appspot.com",
    messagingSenderId: "881352897273"
};
firebase.initializeApp(dbconfig);

// Base de dados Firestore
let database = firebase.firestore();

// Localização do Usuário
let localizacao;

// Extra JQuery Validator Functions
window.$.validator.addMethod("cpf", function (value, element) {
    value = jQuery.trim(value);

    value = value.replace('.', '');
    value = value.replace('.', '');
    let cpf = value.replace('-', '');

    while (cpf.length < 11) cpf = "0" + cpf;
    let expReg = /^0+$|^1+$|^2+$|^3+$|^4+$|^5+$|^6+$|^7+$|^8+$|^9+$/;
    let a = [];
    let b = new Number;
    let c = 11;
    for (let i = 0; i < 11; i++) {
        a[i] = cpf.charAt(i);
        if (i < 9) b += (a[i] * --c);
    }
    let x = b % 11;
    if (x < 2) {
        a[9] = 0;
    } else {
        a[9] = 11 - x;
    }
    b = 0;
    c = 11;
    let y = 0;
    for (y = 0; y < 10; y++) {
        b += (a[y] * c--);
    }
    x = b % 11;
    if (x < 2) {
        a[10] = 0;
    } else {
        a[10] = 11 - x;
    }

    let retorno = true;
    if ((cpf.charAt(9) != a[9]) || (cpf.charAt(10) != a[10]) || cpf.match(expReg)) retorno = false;

    return this.optional(element) || retorno;

}, "Informe um CPF válido");

window.$.validator.addMethod("lettersonly", function (value, element) {
    return this.optional(element) || /^[a-z áàäéêëíïóõôöúûüùçñ]+$/i.test(value);
}, "Informe apenas caracteres válidos");

window.$.validator.addMethod("pickstate", function (value, element) {
    return localizacao.estado.value != " ";
}, "Informe um Estado válido");

window.$.validator.addMethod("pickcity", function (value, element) {
    return localizacao.cidade.value != " ";
}, "Informe um Município válido");


// Scripts específicos da página
// Serão rodados quando o DOM tiver terminado de carregar
$(document).ready(function () {
    // Popula o campo de email e senha se o usuário tiver logado previamente
    if (userconfig.get("lembrar")) {
        $("#loginemail").val(userconfig.get("email"));
        $("#loginpassword").val(userconfig.get("password"));
    }

    // Inicia o campo de estados/cidade na aba de registro
    localizacao = new dgCidadesEstados({
        cidade: document.getElementById('regcidade'),
        estado: document.getElementById('regestado')
    });

    // Inicia máscaras de telefone e cpf do registro
    let telmaskbehaviour = function (val) {
        return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
    };
    let teloptions = {
        onKeyPress: function (val, e, field, options) {
            field.mask(telmaskbehaviour.apply({}, arguments), options);
        }
    };

    $('.telmask').mask(telmaskbehaviour, teloptions);
    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // Cria a validação para os formulários
    $("#loginform").validate({
        rules: {
            loginemail: {
                required: true,
                email: true
            },
            loginpassword: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            loginemail: {
                required: "Por favor digite seu endereço de e-mail",
                email: "Por favor digite um endereço de e-mail válido"
            },
            loginpassword: {
                required: "Por favor digite sua senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres"
            }
        },
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
            $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
        },
        success: function (element) {
            $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
            $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
        },
        errorPlacement: function (error, element) {
            $(element).closest('.form-group').append(error).addClass('has-error');
        }
    });

    $("#recoveryform").validate({
        rules: {
            recoveremail: {
                required: true,
                email: true
            }
        },
        messages: {
            recoveremail: {
                required: "Por favor digite seu endereço de e-mail",
                email: "Por favor digite um endereço de e-mail válido"
            }
        },
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
            $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
        },
        success: function (element) {
            $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
            $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
        },
        errorPlacement: function (error, element) {
            $(element).closest('.form-group').append(error).addClass('has-error');
        }
    });

    $("#registerform").validate({
        rules: {
            regnome: {
                required: true,
                lettersonly: true
            },
            regcpf: {
                required: true,
                cpf: true
            },
            regtel: {
                required: true,
                minlength: 10
            },
            regemail: {
                required: true,
                email: true
            },
            regpassword: {
                required: true,
                minlength: 6
            },
            regpasswordrepeat: {
                required: true,
                minlength: 6,
                equalTo: "#regpassword"
            },
            regestado: {
                required: true,
                pickstate: true
            },
            regcidade: {
                required: true,
                pickcity: true
            }
        },
        messages: {
            regnome: {
                required: "Por favor digite seu endereço de e-mail",
            },
            regcpf: {
                required: "Por favor digite sua senha"
            },
            regtel: {
                required: "Por favor digite um telefone válido com DDD"
            },
            regemail: {
                required: "Por favor digite um e-mail válido",
                email: "Por favor digite um e-mail válido"
            },
            regpassword: {
                required: "Por favor digite uma senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres"
            },
            regpasswordrepeat: {
                required: "Por favor confirme sua senha",
                minlength: "Por favor digite uma senha com no mínimo seis caracteres",
                equalTo: "As senhas são diferentes"
            },
            regestado: {
                required: "Por favor selecione seu Estado"
            },
            regcidade: {
                required: "Por favor selecione seu Município"
            }
        },
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
            $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
        },
        success: function (element) {
            $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
            $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
        },
        errorPlacement: function (error, element) {
            $(element).closest('.form-group').append(error).addClass('has-error');
        }
    });

    // Ações para cada click

    // No caso de login iremos fazer o login com o Firebase as preferências
    // do usuário no arquivo local (userconfig)
    $("#loginsubmit").click(() => {
        let email = $("#loginemail").val();
        let password = $("#loginpassword").val();
        let lembrarlogin = $("#loginlembrar").is(":checked");

        $("#loginform").validate();

        if ($("#loginform").valid()) {
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Login deu certo!");
                    // Set local config 
                    if (loginlembrar) {
                        userconfig.set("lembrar", true);
                        userconfig.set("email", email);
                        userconfig.set("password", password);
                    }

                    document.location.href = "./dashboard.html";
                })
                .catch((err) => {
                    if (err != null) {
                        // TODO: Fazer alertas com as mensagens
                        console.log(err.message);
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: err.message,
                            icon: "error",
                            button: "Fechar"
                        });
                        return;
                    }
                });
        }
    });

    // recoversubmit
    $("#recoversubmit").click(() => {
        let email = $("#recoveremail").val();

        $("#recoveryform").validate();

        if ($("#recoveryform").valid()) {
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    swal({
                        title: "E-mail enviado!",
                        text: "Enviamos um e-mail para o endereço " + email + " contendo um link para modificar sua senha",
                        icon: "success",
                        button: "Fechar"
                    });
                })
                .catch((err) => {
                    if (err != null) {
                        console.log(err.message);
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: err.message,
                            icon: "error",
                            button: "Fechar"
                        });
                        return;
                    }
                });
        }
    });

    // No caso de registro temos que fazer a validação do formulário
    // e criar os documentos básicos (/users e /data) 
    $("#regsubmit").click(() => {
        $("#registerform").validate();

        if ($("#registerform").valid()) {
            let email = $("#regemail").val();
            let password = $("#regpassword").val();

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((fbuser) => {
                    database.collection("users").doc(fbuser.user.uid).set({
                        "nome": $("#regnome").val(),
                        "email": email,
                        "password": password,
                        "cpf": $("#regcpf").val(),
                        "telefone": $("#regtel").val(),
                        "cidade": localizacao.cidade.value,
                        "estado": localizacao.estado.value
                    });

                    database.collection("data").doc(fbuser.user.uid).set({
                        "config": {
                            "cidade": localizacao.cidade.value,
                            "estado": localizacao.estado.value
                        },
                        "init": false
                    });

                    $("#login-tab").click();

                    swal({
                        title: "Parabéns!",
                        text: "Sua conta foi criada com sucesso. Você já pode fazer o login.",
                        icon: "success",
                        button: "Fechar"
                    });
                })
                .catch((err) => {
                    console.log(err);

                    if (err != null) {
                        let errmsg = err.message;
                        if (err.code == "auth/email-already-in-use") {
                            errmsg = "O e-mail informado já foi cadastrado."
                        } else if (err.code == "auth/network-request-failed") {
                            errmsg = "Erro de conexão com a Internet."
                        }
                        swal({
                            title: "Ops... tivemos um problema!",
                            text: errmsg,
                            icon: "error",
                            button: "Fechar"
                        });

                        return;
                    }
                });
        } else {
            alert("Algum erro no formulário");
        }
    });
});
