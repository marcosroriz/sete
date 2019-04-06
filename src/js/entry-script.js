window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');
require("jquery-validation");
require("jquery-mask-plugin");

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

$(document).ready(function () {
    var telmaskbehaviour = function (val) {
        return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
    };
    var teloptions = {
        onKeyPress: function (val, e, field, options) {
            field.mask(telmaskbehaviour.apply({}, arguments), options);
        }
    };

    $('.telmask').mask(telmaskbehaviour, teloptions);

    $(".cpfmask").mask('000.000.000-00', { reverse: true });

    // $("#loginform").validate({
    //     rules: {
    //         loginemail: {
    //             required: true,
    //             email: true
    //         },
    //         loginpassword: {
    //             required: true
    //         }
    //     },
    //     messages: {
    //         loginemail: {
    //             required: "Por favor digite seu endereço de e-mail",
    //             email: "Por favor digite um endereço de e-mail válido"
    //         },
    //         loginpassword: {
    //             required: "Por favor digite sua senha"
    //         }
    //     },
    //     highlight: function (element) {
    //         $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
    //         $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    //     },
    //     success: function (element) {
    //         $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
    //         $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    //     },
    //     errorPlacement: function (error, element) {
    //         $(element).closest('.form-group').append(error).addClass('has-error');
    //     }
    // });

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
                required: true
            },
            regpasswordrepeat: {
                required: true,
                equalTo: "#regpassword"
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
                required: "Por favor digite uma senha"
            },
            regpasswordrepeat: {
                required: "Por favor confirme sua senha",
                equalTo: "As senhas são diferentes"
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
});
