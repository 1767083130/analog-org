//2013-10-14 XDQ创建
(function (jQuery, undefined) {
    //判断是否已经加载过本脚本
    if (window.popDialog) return;
    // 初始化浏览器记录器
    window.console = window.console || { log: function (exp) { } };
    if (!$ || !$.fn || !$.fn.dialog) throw "本插件需要原生的jQuery.UI.dialog插件支持";
    //简易遍历
    function forEach(arr, func) {
        var l = arr.length, c = null;
        for (var i = 0; i < l; i++) { c = arr[i]; if (func(c, i) === true) return c; };
    };
    //事件处理
    function MyEvent() {
        var s = this, eves = {}, aft = {};
        //触发事件 n:事件名称,o:事件涉及对象,e:事件参数
        s.fire = function (n, o, e) { var a = eves[n], r; a && forEach(a, function (o, i) { r = o(o, e); }); after(n, o, e); return r || r == null; };
        //添加事件处理 n:事件名称,func:事件发生时需要执行的方法
        s.add = function (n, func) { var a = eves[n] || (eves[n] = []); a && forEach(a, function (o, i) { return o == func; }) || a.push(func); };
        //删除事件处理 
        s.rem = function (n, func) { var a = eves[n]; if (!a) return; func == null ? eves[n] = [] : forEach(a, function (o, i) { return func == o && (a.splice(i, 1)); }); };
        s.after = function (after, func) { var a = aft[after] || (aft[after] = []); a && forEach(a, function (o, i) { return o == func; }) || a.push(func); };
        s.clear = function () { eves = {}; aft = {}; $(s).remove() };
        function after(n, o, e) { var a = aft[n]; if (a && a.length) { forEach(a, function (o, i) { o(o, e); }); aft[n] = []; } };
    };
    //弹出框基类[私有]
    function MyDialog(buttons, size, events, $dom, config) {
        var s = this, prop = {}, data = {}, eve = new MyEvent(), $dialog, $head, $over;
        s.prop = function (name, value) {
            if (value == null)
                return prop[name];
            else
                prop[name] = value;
            return s;
        };
        s._data = function (name, value) {
            if (value == null)
                return data[name];
            else data[name] = value;
            return s;
        };
        function MyHandler(e, ui) {
            if (e && e.type) {
                var t = e.type, l = t.length;
                t = t.substr(6, l - 6);
                eve.fire(t, $dom.get(0), e);
            }
        };
        //DNN头部 
        function dnnBar() {
            var $ctr = $('<span class="dnnModalCtrl"></span>')
                            , $max = $('<button class="dnnToggleMax ui-button "><span class="ui-button-text">Max</span></button>')
                            , $close = $head.find(".ui-dialog-titlebar-close");
            $close.wrap($ctr).before($max);
            $max.mouseenter(function () {
                $max.addClass("ui-state-hover");
            });
            $max.mouseleave(function () {
                $max.removeClass("ui-state-hover");
            });
            $max.click(function (e) {
                e.preventDefault();
                eve.fire("resizestart", $dom.get(0), e);
                var nH, nW, nP;
                if (s._data("max")) {
                    nH = s._data("eH");
                    nW = s._data("eW");
                    nP = s._data("eP");
                    s._data("max", false);
                }
                else {
                    s._data("eH", $dialog.innerHeight())._data("eW", $dom.innerWidth())._data("eP", $dom.dialog("option", "position"));
                    nH = $dom.dialog("option", "maxHeight");
                    nW = $dom.dialog("option", "maxWidth");
                    s._data("max", true);
                }
                eve.fire("resize", $dom.get(0), e);
                eve.fire("resizestop", $dom.get(0), e);
                $dom.dialog({ height: nH, width: nW });
            });
        };
        //DNN Bar END
        //由脚本自行设置弹出框高度宽度
        function resize() {
            var st = s.prop("status");
            if (st == MyDialog.Status.Inited && !s._data("_needResize")) return;
            else if ((st & MyDialog.Status.Opening) == 0) return;
            $dom.hide();
            var w = $dialog.outerWidth(), h = $dialog.outerHeight();
            $dom.show();
            if (s instanceof IfmDialog) {
                var wind = s.prop("window");
                try {
                    var body = wind.document.body, html = body.parentNode;
                    //                    $dialog.width(10); 
                    //在谷歌浏览器下如果一开始宽度大于实际宽度则取不到实际宽度
                    //即便是缩小了弹出框宽度 依然无法正确获取页面宽度,故不再缩小弹出框
                    $dom.height(10);
                    //额外加权1，因为四舍五入的原因，会导致出现滚动条
                    w = Math.max(body.scrollWidth, html.scrollWidth) + 1;
                    h += Math.max(body.scrollHeight, html.scrollHeight) + 1;
                    $dom.dialog("option", { height: h, width: w });
                }
                catch (exp) {
                    console.log(exp);
                }
            }
            else if (s instanceof PopDialog) {
                w = Math.max($dom.dialog("option", "minWidth"), $dom.outerWidth(true));
                h += Math.max($dom.dialog("option", "minHeight"), $dom.outerHeight(true));
                $dom.dialog("option", { height: h, width: w });
            }
            else {

            }
        };
        //初始化
        function init() {
            eve.after("close", function (o, e) { clear(); eve.fire("afterclose", o, e); });
            s.prop("status", MyDialog.Status.Inited).prop("event", eve).prop("dom", $dom).prop("id", new Date().valueOf()).prop("window", window);
            var defaultEvents = ["beforeClose", "close", "create", "drag", "dragStart", "dragStop", "focus", "open", "resize", "resizeStart", "resizeStop"];
            var de = {};
            forEach(defaultEvents, function (o, i) { de[o] = MyHandler; });
            var _op = { autoOpen: false, positon: "center", modal: true, draggable: true, resizable: false, buttons: buttons };
            $.extend(_op, de, size, config);
            $(events).each(function () { $.extend(_op, this); });
            $dom.attr("id", s.prop("id")).attr("__myPop", "1017");
            $dom.dialog(_op);
            $("[__myPop='1017'][closed='true']").parent().remove();
            $("[__myPop='1017'][closed='true']").remove();
            s.theme("");
            return s;
        };
        //清除某些状态
        function clear() {
            if (s instanceof PopDialog) {
                var p = s._data("__p");
                var next = p.parent.children().eq(p.index);
                if (next.length && next[0] !== p.dom[0]) {
                    next.before(p.dom);
                } else {
                    p.parent.append(p.dom);
                }
            }
            $dom.attr("closed", "true");
        };
        s.showDialog = function () {
            if (!$dialog) {
                $dom.dialog("open");
                $dialog = $dom.parent();
                $head = $dialog.children(".ui-dialog-titlebar");
                $over = $dialog.prev(".ui-widget-overlay").css("zIndex", MyDialog.zIndex);
                $dialog.css("zIndex", MyDialog.zIndex + 1);
                dnnBar();
            }
            else {
                $dialog.show();
            }
            if (s._data("_needResize")) {
                s._data("_needResize", false);
                resize()
            }
            return s.prop("status", MyDialog.Status.Opening);
        };
        s.closeDialog = function (data, args) {
            if (eve.fire("beforeclose", $dom.get(0), args)) {
                s.data = data;
                s.prop("status", MyDialog.Status.Closed);
                $dom.dialog("close");
            }
            return s;
        };
        var colors = ["white", "blue"];
        s.theme = function (theme) {
            if (theme !== undefined) {
                theme = theme || "";
                var tms = theme.split(' ')
                , tkell = "tkellDialog"
                , color = forEach(colors, function (o) {
                    return $.inArray(o, tms) >= 0;
                });
                if (!color) {
                    theme += " " + colors[0];
                };
                if (theme.indexOf(tkell) < 0)
                    theme += " " + tkell;
                s.prop("theme", theme);
                $dom.dialog("option", { "minHeight": 21, "dialogClass": "salesPowerPopup " + theme });
            }
            else {
                return s.prop("theme");
            }
            return s;
        };
        s.show = function () { if ($dialog) { $dialog.show(); s.prop("status", MyDialog.Status.Showing); } return s; };
        s.hide = function () { if ($dialog) { $dialog.hide(); s.prop("status", MyDialog.Status.Hiding); } return s; };
        s.onClose = function (func) { eve.add("close", func); return s; };
        s.addListener = function (eventName, funcO_E) { eve.add(eventName, funcO_E); return s; };
        s.removeListener = function (eventName, funcO_E) { eve.rem(eventName, funcO_E); return s; };
        s.lock = function (isLock) { $over && (isLock ? $over.show() : $over.hide()); return s; };
        s.title = function (text) {
            if ($head) {
                var title = $head.find(".ui-dialog-title");
                if (text !== undefined) title.html(text);
                else return title.html();
            }
            else {
                if (text === undefined) return $dom.dialog("option", "title");
                else $dom.dialog("option", "title", text);
            }
            return s;
        };
        s.width = function (x) { if (x !== undefined) $dom.dialog({ width: x }); else return $dialog.width(); return s; };
        s.height = function (y) { if (y !== undefined) $dom.dialog({ height: y }); else return $dialog.height(); return s; };
        s.position = function (loc) { if (loc !== undefined) $dom.dialog("option", "position", loc); else return $dom.dialog("option", "position"); return s; };
        s.autoSize = function () { var st = s.prop("status"); if ((st & MyDialog.Status.Opening) > 0) resize(); else s._data("_needResize", true); return s; };
        s.data = null;
        s.time = function (interval) { setTimeout(s.closeDialog, interval) };
        s.draggable = function (enable) { if (enable !== undefined) $dom.dialog("option", "draggable", enable); else return $dom.dialog("option", "draggable"); return s; };
        return init();
    };
    MyDialog.findFrmdlg = function (wind) {
        var dlgs = parent.MyDialog;
        return forEach(dlgs.dialogs, function (o, i) { return o.prop("window") == wind });
    };
    MyDialog.dialogs = [];
    MyDialog.closeDialog = function (data) {
        var dlg = MyDialog.findFrmdlg(this);
        if (dlg) setTimeout(function () {
            var index = 0, dlgs = parent.MyDialog.dialogs;
            forEach(dlgs, function (o, i) { if (o == dlg) { index = i; return true } });
            dlgs.splice(index, 1);
            dlg.closeDialog(data);
        }, 1);
    };
    MyDialog.Status = { Opening: 1, Closed: 2, Inited: 4, Showing: 8, Hiding: 16 };
    //弹出框的zIndex值
    MyDialog.zIndex = 1001;
    function PopDialog(selector, buttonsJson, size, eventsArray) {
        var $dom = $(selector), s = this, $con = $("<div>");
        var $p = $dom.parent(), i = $p.children().index($dom);
        $con.append($dom);
        $(document.body).append($con);
        MyDialog.call(s, buttonsJson, size, eventsArray, $con);
        return s._data("__p", { parent: $p, index: i, dom: $dom });
    };
    function MsgDialog(title, content, buttonsJson, size, eventsArray) {
        var $dom = $("<div>"), $con = $("<div>"), s = this, auto = { height: "auto", width: "300" }
        , op = { color: "#333", backgroundColor: "#fff", fontSize: "14px" };
        //2013-10-26 取消Size
        //        if (size != null) { op = $.extend(op, size) } else { op = $.extend(op, auto) }
        op = $.extend(op, auto);
        $dom.append($con.addClass("msgContent")) && $(document.body).append($dom);
        MyDialog.call(s, buttonsJson, null, eventsArray, $dom, $.extend({}, op, { title: title }));
        s.content = function (html) {
            if (html !== null) {
                if (typeof (content) == "string") $con.html(content);
                else $con.append(html);
            }
            else {
                return $dom.children();
            }
            return s;
        };
        return s.content(content);
    };
    function IfmDialog(url, buttonsJson, size, eventsArray, autoResize) {
        var s = this, $load, iFL, $dom = $("<div>")
                , $frm = $("<iframe src=\"about:blank\" scrolling=\"none\" frameborder=\"0\" style=\"width:100%;height:100%;\"></iframe>");
        if (!size) autoResize = true;
        $(document.body).append($dom.append($frm));
        MyDialog.call(s, buttonsJson, size, eventsArray, $dom, {});
        function init() {
            s.prop("frm", $frm);
            MyDialog.dialogs.push(s);
            s.addListener("close", function () {
                $dom.parent().css("display", "none");
                $(s.prop("window")).unbind();
                $frm.unbind();
                $frm.attr("src", "").remove();
                s.prop("frm", null).prop("window", null);
            });
            return s;
        }
        function show() {
            if (!$load) {
                var html = "<div class='loadContent'><span class=\"dnnLoading\"></span></div>";
                $load = $(html);
            }
            return $frm.hide().before($load);
        };
        function hide() { $load && $load.hide(); $load = null; $frm.show(); }
        function load() { iFL = false; if (autoResize) s.autoSize(); }
        var eSD = s.showDialog;
        s.showDialog = function () {
            eSD() && show() && (iFL = true);
            $frm.load(function () {
                hide();
                var w = $frm.get(0).contentWindow;
                s.prop("window", w);
                with (w.location) {
                    if (pathname != "/blank") {
                        if (iFL) { var p = pathname + search; }
                        load();
                        s.prop("event").fire("loadcomplete", $dom.get(0), null);
                    }
                }
            });
            $frm.attr("src", url);
            return s;
        };
        return init();
    };
    //暴露弹出框类
    window.popDialog = PopDialog;
    window.msgDialog = MsgDialog;
    window.ifmDialog = IfmDialog;
    window.MyDialog = MyDialog;
    window.closeMyPopDialog = window.closeMyDialog = MyDialog.closeDialog;
    window.findFrmdlg = MyDialog.findFrmdlg;
    MyDialog.find = MyDialog.findFrmdlg;
    window.findDialog = MyDialog.find;
    window.iframeDialog = IfmDialog;
})(jQuery);
