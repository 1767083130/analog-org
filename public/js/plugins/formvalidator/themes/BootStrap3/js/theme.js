var onShowHtml = "<span class='help-block'>$data$</span>";
var onFocusHtml = "<span class='help-block'>$data$</span>";
var onErrorHtml = "<span class='help-block' style='color:red;'>$data$</span>";
var onCorrectHtml = "<span class='help-block'>$data$</span>";
var onShowClass = "form-control";
var onFocusClass = "form-control";
var onErrorClass = "form-control";
var onCorrectClass = "form-control";

var onFormValidatorError = function (target) {
    //alert("onError");

    var controlGroup = target.parents('.form-group');
    controlGroup.removeClass('has-success has-feedback');
    controlGroup.addClass('has-error has-feedback');
};
var onFormValidatorFocus = function (target) {
    var controlGroup = target.parents('.form-group');
    controlGroup.removeClass('has-error has-success');
};
var onFormValidatorCorrect = function (target) {
    var controlGroup = target.parents('.form-group');
    controlGroup.removeClass('has-error has-feedback');
    controlGroup.addClass('has-success has-feedback');
};