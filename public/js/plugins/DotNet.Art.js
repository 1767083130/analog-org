//Obsolete by xdq 2013-07-12 Reason:unified to use dnn js
(function ($) {
    if ($.Art) return;
    $.Art = {
        enumArtIcon: { Null: "", SuccessIcon: "succeed", WarningIcon: "warning", ErrorIcon: "error" },
        _NewArt: function () {
            return $.extend({}, { title: "", content: "", icon: "",
                ok: function () { }, cancel: null, fixed: false,
                lock: true, opacity: 0.3, esc: true, show: true
            });
        }, ShowDialog: function (option) {
            if (option)
                return $.artDialog(option).show();
        },
        ShowError: function (msg, OkFunction, CancelFunction) {
            var _art = $.Art._NewArt();
            _art.ok = OkFunction || _art.ok;
            _art.cancel = CancelFunction || _art.cancel;
            _art.content = msg;
            _art.icon = $.Art.enumArtIcon.ErrorIcon;
            _art.title = "错误";
            $.Art.ShowDialog(_art);
        }, ShowSuccess: function (msg, OkFunction, CancelFunction) {
            var _art = $.Art._NewArt();
            _art.ok = OkFunction || _art.ok;
            _art.cancel = CancelFunction || _art.cancel;
            _art.content = msg;
            _art.icon = $.Art.enumArtIcon.SuccessIcon;
            _art.title = "恭喜";
            $.Art.ShowDialog(_art);
        }, ShowMessage: function (msg, OkFunction, CancelFunction) {
            var _art = $.Art._NewArt();
            _art.ok = OkFunction || _art.ok;
            _art.cancel = CancelFunction || _art.cancel;
            _art.content = msg;
            _art.icon = $.Art.enumArtIcon.WarningIcon;
            _art.title = "提醒";
            $.Art.ShowDialog(_art);
        }, Loading: null,
        LoadData: function () {
            if (!$.Art.Loading) {
                $.Art.Loading = $.artDialog({ fixed: true, title: "加载中...", lock: true });
            }
            return $.Art.Loading.show();
        }, LoadFinished: function () {
            if ($.Art.Loading) {
                $.Art.Loading.close();
                $.Art.Loading = null;
            }
        }
    };
})(this.jQuery || this.art && (this.art = jQuery));