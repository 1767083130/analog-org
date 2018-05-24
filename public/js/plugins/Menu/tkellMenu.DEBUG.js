/*
2013-09-26 XDQ 创建
2013-10-21 XDQ 重构


*/

(function (jQuery, undefined) {
    if (window.TkellMenu) return;
    window.console = window.console || function (exp) { };
    function forEach(arr, func) {
        var l = arr.length, c = null;
        for (var i = 0; i < l; i++) { c = arr[i]; if (func(c, i) === true) return c; }
    };
    function shift(arr) { return Array.prototype.shift.call(arr) };
    function Menu(selector, option) {
        var s = this, $dom = $(selector)
            , _class = { menuClass: "menu", topMenuClass: "topMenu", subMenuClass: "subMenu", itemClass: "item", contextClass: "context", textClass: "text", iconClass: "icon", menuIconClass: "menuIcon", openClass: "open", selectClass: "current", disableClass: "disable" }
            , _other = { autoRender: false, data: [], menuOpenEvent: "mousemove", menuCloseEvent: "mouseout", itemSelectEvent: "click", isSingleSelectMode: true, isSelectOnly: false, isAutoSelectParent: true, isAutoSelectFirstChild: true }
            , _render = { menuTag: "ul", itemTag: "li", contextTag: "a", textTag: "span", iconTag: "i", menuIconTag: "i" };
        Menu.Item.call(s, null, null);
        s.option = $.extend({}, _class, _other, _render, option);
        function init() {
            s.data("dom", $dom).prop("id", "myMenu_" + new Date().valueOf());
            Menu.menus.push(s);
            s.prop("initData", initData).prop("topMenu", s, s);
            var dt, eR = s.render;
            if ((dt = s.option.data) && dt.length) {
                initData(dt, s);
            }
            s.prop("autoRender");
            s.render(true);
            initEvent();
            return s
        };
        function initEvent() {
            var o = s.option
            , S = { item: o.itemTag + "." + o.itemClass, context: o.contextTag + "." + o.contextClass, text: o.textTag + "." + o.textClass };
            $dom.on(o.menuOpenEvent, S.item, function () {
                var _s = this["_menu"];
                if (_s.enable() && _s.isMenu()) {
                    _s.data("inMenu", true);
                    if (!_s.open()) _s.open(true, true)
                }
            });
            $dom.on(o.menuCloseEvent, S.item, function () {
                var _s = this["_menu"];
                if (_s.open()) {
                    _s.data("inMenu", false);
                    if (!_s.data("isIn")) {
                        _s.data("isIn", true);
                        setTimeout(function () {
                            if (!_s.data("inMenu"))
                                _s.open(false, true);
                            _s.data("isIn", false);
                        }, 1);
                    }
                }
            });
            $dom.on(o.itemSelectEvent, S.text, function () {
                var dom = $(this).parent().parent()[0], _s = dom["_menu"];
                if (_s.enable()) {
                    var sv = s.isSelectOnly() ? true : !_s.select();
                    _s.select(sv, true);
                    if (s.isSingleSelectMode())
                        _s.parent().open(false, true);
                }
            });
        };
        function initData(dt, st) {
            return forEach(dt, function (o) {
                var i = new Menu.Item();
                forEach(Menu.propertyKeys, function (k) { i.prop(k, o[k], false) });
                var c = o["children"];
                st.add(i, false) && c && c.length && initData(c, i)
            })
        };
        var event = new Menu.Event();
        s.on = function (name, handler) { event.add(name, handler); return s };
        s.fire = function (name, object, arg) { return event.fire(name, object, arg) };
        s.after = function (name, func, key) { event.after(name, func, key); return s };
        s.isSingleSelectMode = function (value) { if (value === undefined) return s.option.isSingleSelectMode; s.option.isSingleSelectMode = value; return s };
        s.isSelectOnly = function (value) { if (value === undefined) return s.option.isSelectOnly; s.option.isSelectOnly = value; return s };
        s.isAutoSelectParent = function (value) { if (value === undefined) return s.option.isAutoSelectParent; s.option.isAutoSelectParent = value; return s };
        s.isAutoSelectFirstChild = function (value) { if (value === undefined) return s.option.isAutoSelectFirstChild; s.option.isAutoSelectFirstChild = value; return s };
        return init()
    };
    Menu.propertyKeys = ["text", "select", "enable", "visible", "value", "url", "icon", "position"];
    Menu.SelectMode = { Single: 1, Multi: 2 };
    Menu.SelectEffect = { Parent: 1, FirstChild: 2 };
    Menu.SelectType = { SelectOnly: 1, SelectOrCancel: 2 };
    Menu.Event = function () {
        var s = this, eves = {}, aft = {};
        //触发事件 n:事件名称,o:事件涉及对象,e:事件参数
        s.fire = function (n, o, e) { var a = eves[n], r; a && forEach(a, function (f) { r = f(o, e); }); after(n, o, e); return r || r == null; };
        //添加事件处理 n:事件名称,func:事件发生时需要执行的方法
        s.add = function (n, func) { var a = eves[n] || (eves[n] = []); a && forEach(a, function (o, i) { return o == func; }) || a.push(func); };
        //删除事件处理 
        s.rem = function (n, func) { var a = eves[n]; if (!a) return; func == null ? eves[n] = [] : forEach(a, function (o, i) { return func == o && (a.splice(i, 1)); }); };
        //在事件发生完之后发生
        s.after = function (after, func, key) { var a = aft[after] || (aft[after] = []); if (!forEach(a, function (o, i) { return o.key == key; })) { func.key = key; a.push(func) } };
        s.clear = function () { eves = {}; aft = {}; $(s).remove() };
        function after(n, o, e) { var a = aft[n]; if (a && a.length) { forEach(a, function (f) { f(o, e); }); aft[n] = [] } };
        return s
    };

    Menu.menus = [];
    function delay(k, f) { if (delay.__delays[k]) return; delay.__delays[k] = true; setTimeout(function () { delay.__delays[k] = false; f() }, 1) };
    delay.__delays = {};
    function render(s) { s.topMenu() && delay("render", function () { s.topMenu().render() }); return s };
    function trig(s, name) {
        var t = s.topMenu();
        t.fire(name, s, null);
        t.after("render", function () { t.fire("after" + name, s, null) }, s.key());
        s.data("render", true);
        return render(s)
    }
    Menu.Item = function () {
        var s = this, $dom
            , p = { parent: null, children: [], topMenu: null, count: 0, select: false, enable: true, text: "", value: "", url: "", visible: true, icon: "", open: false }
            , k = { before: "before", after: "after", select: "select", enable: "enable", render: "render", add: "add", remove: "remove", destory: "destory", visible: "visible", open: "open" };
        p.data = { icon: null, menu: null, dom: null, text: null, menuIcon: null, context: null, render: true };
        function unkownItem() { throw "unkown item" };
        function isMenu() { return p.children.length && true };
        function isTopMenu() { return s == p.topMenu };
        s.isTopMenu = isTopMenu;
        s.isMenu = isMenu;
        s.data = function (name, value) { var d = name, v = value; if (v !== undefined) p.data[d] = v; else return p.data[d]; return s };
        s.prop = function (name, value) { var d = name, v = value, a = arguments; if (v !== undefined) s[d] ? (shift(a) && s[d].apply(s, a)) : p[d] = v; else return p[d]; return s };
        s.topMenu = function () { var a = arguments; if (a.length == 2 && a[1] === s) { p.topMenu = a[0]; forEach(p.children, function (o) { o.topMenu(p.topMenu, o) }) }; return p.topMenu };
        s.children = function (index) { var d = index, c = p.children; if (d === undefined) return c; return c[d] };
        s.count = function () { return p.count };
        s.parent = function () { var a = arguments; if (a.length == 2 && a[1] === s) { p.parent = a[0]; p.topMenu = p.parent.topMenu(); forEach(p.children, function (o) { o.parent(s, o) }) } return p.parent };
        s.open = function (isOpen, trigEvent) {
            var d = isOpen;
            if (d == null) return p.open;
            d = d && true;
            if (p.open != d && isMenu()) {
                var e = trigEvent !== false, t = p.topMenu;
                if (!e || !t || t.fire(k.before + k.open, s, d)) {
                    p.open = d;
                    e && t && trig(s, k.open)
                }
            }
            return s
        };
        s.add = function (item, trigEvent) {
            var d = item, e = trigEvent !== false, t = p.topMenu;
            if (d instanceof Menu.Item) {
                if (!e || !t || t.fire(k.before + k.add, s, d)) {
                    p.children.push(d);
                    p.count++;
                    d.parent(s, d);
                    e && t && trig(s, k.add)
                }
            }
            else {
                unkownItem()
            }
            return s
        };
        s.remove = function (item, trigEvent) {
            if (isTopMenu()) return s;
            var b, c = p.children, d = item, e = trigEvent !== false, t = p.topMenu;
            if (d instanceof Menu.Item) {
                b = forEach(c, function (o, i) { if (o == d) return i });
                if (b !== true) {
                    if (!e || !t || t.fire(k.before + k.remove, s, d)) {
                        (b = c.splice(b, 1)) && p.count--;
                        b[0].prop(k.destory, e);
                        e && t && trig(s, k.remove);
                    }
                }
            }
            else {
                unkownItem()
            }
            return s
        };
        //1 延伸至所有子 2 延伸至第一个子 3 延伸至父 4不延伸
        s.select = function (isSelect, trigEvent) {
            var a = arguments, d = isSelect, e = trigEvent !== false, t = p.topMenu, b = a.length > 2 ? a[2] : null;
            if (d == null) return p.select;
            d = d && true;
            if (b !== null && (!e || t.fire(k.before + k.select, s, d))) {
                switch (b) {
                    case 1: forEach(p.children, function (o) { o.select(d, e, 1) }) || (p.select = d);
                        break;
                    case 2:
                        p.select = d;
                        if (isMenu()) p.children[0].select(d, e, 2);
                        break;
                    case 3:
                        !isTopMenu() && p.parent.select(d, e, 3) && (p.select = d);
                        break;
                    case 4: !isTopMenu() && (p.select = d);
                        break;
                    default:
                        console.log("无效的动作附加值");
                        break;
                }
            }
            else if (!isTopMenu()) {
                if (p.enable && p.select != d) {
                    //如果已经是未选择状态则无视“取消选中”动作
                    if (!e || !t || t.fire(k.before + k.select, s, d)) {
                        if (d && t) {
                            //单选模式则先行取消所有项的选择
                            t.isSingleSelectMode() && t.select(false, false, 1);
                            t.isAutoSelectParent() && p.parent.select(true, e, 3);
                            t.isAutoSelectFirstChild() && isMenu() && p.children[0].select(true, e, 2);
                        }
                        s.select(d, false, 4)
                    }
                }
            }
            e && t && isTopMenu() || trig(s, k.select);
            return s
        };
        s.key = function () {
            if (!p.key && s.topMenu()) {
                var k = null, c = s.isTopMenu() ? null : p.parent.children();
                if (c) {
                    forEach(c, function (o, i) { if (o == s) { k = i.toString(); return true } });
                    k = p.parent.key() + "_" + k;
                }
                else {
                    k = "0"
                }
                p.key = k
            }
            return p.key
        };
        s.enable = function (isEnable, trigEvent) {
            if (isTopMenu()) return s;
            var d = isEnable, e = trigEvent !== false, t = p.topMenu;
            if (d == null) return p.enable;
            d = d && true;
            if (p.enable != d) {
                if (!e || !t || t.fire(k.before + k.enable, s, d)) {
                    p.enable = d;
                    e && t && trig(s, k.enable);
                }
            }
            return s
        };
        s.visible = function (isVisible, trigEvent) {
            var d = isVisible, e = trigEvent !== false, t = p.topMenu;
            if (d == null) return p.visible;
            d = d && true;
            if (d != p.visible) {
                if (!e || !t || t.fire(k.before + k.visible, s, d)) {
                    p.visible = d;
                    e && t && trig(s, k.enable);
                }
            }
        };
        p.destroy = function (trigEvent) {
            if (isTopMenu()) return;
            var e = trigEvent !== false, t = p.topMenu;
            forEach(p.children, function (o) { o.prop(k.destory, false) });
            if (!e || !t || t.fire(k.before + k.destory, s, null)) {
                var d = p.data;
                d.icon && d.icon.unbind().remove() && (d.icon = null);
                d.menuIcon && d.menuIcon.unbind().remove() && (d.menuIcon = null);
                d.menu && d.menu.unbind().remove() && (d.menu = null);
                d.text && d.text.unbind().remove() && (d.text = null);
                d.context && d.context.unbind().remove() && (d.context = null);
                d.dom && d.dom.unbind().remove() && (d.dom = null);
                e && t && t.fire(k.destory, s, null);
            }
        };
        s.render = function (trigEvent) {
            var e = trigEvent !== false, l = "<", r = ">", o = p.topMenu.option, t = p.topMenu;
            if (p.data.render) {
                if (!e || !t || t.fire(k.before + k.render, s, null)) {
                    if (isTopMenu()) {
                        if (!p.data.menu) (p.data.menu = $(l + o.menuTag + r).addClass(o.menuClass).addClass(o.topMenuClass).attr("id", p.id)) && p.data.dom.append(p.data.menu);
                    }
                    else {
                        var menu = p.parent.data("menu"), dt = p.data, d = dt.dom, c = dt.context;
                        d || (d = $(l + o.itemTag + r).addClass(o.itemClass)) && menu.append(d) && (dt.dom = d);
                        c || (c = $(l + o.contextTag + r).addClass(o.contextClass)) && d.append(c) && (dt.context = c);
                        dt.text || (dt.text = $(l + o.textTag + r).addClass(o.textClass)) && c.append(dt.text);
                        dt.icon || (dt.icon = $(l + o.iconTag + r).addClass(o.iconClass)) && c.append(dt.icon);
                        p.icon && dt.icon.css("background-image", "url('" + p.icon + "')");
                        c.attr("_url", p.url).attr("_val", p.value);
                        d.attr("_key", s.key());
                        dt.text.text(p.text);
                        d[0]["_menu"] = s;
                        if (p.visible) d.show(); else d.hide();
                        if (isMenu()) {
                            dt.menuIcon || (dt.menuIcon = $(l + o.menuIconTag + r).addClass(o.menuIconClass)) && c.append(dt.menuIcon);
                            dt.menu || (dt.menu = $(l + o.menuTag + r).addClass(o.menuClass)) && d.append(dt.menu);
                            dt.menuIcon.show() && c.addClass(o.subMenuClass) && dt.menu.addClass(o.subMenuClass)
                        }
                        else {
                            dt.menuIcon && dt.menuIcon.hide();
                            dt.menu && dt.menu.hide();
                            c.removeClass(o.subMenuClass) && dt.menu && dt.menu.removeClass(o.subMenuClass)
                        }
                        if (p.enable) {
                            d.removeClass(o.disableClass) && (p.open ? d.addClass(o.openClass) : d.removeClass(o.openClass)) && (p.select ? d.addClass(o.selectClass) : d.removeClass(o.selectClass))
                        }
                        else {
                            d.addClass(o.disableClass) && d.removeClass(o.openClass)
                        }
                    }
                }
            }
            p.data.render = false;
            if (isMenu()) forEach(p.children, function (o) { o.render(false) });
            if (isTopMenu()) t.fire(k.render, t, null);
            return s
        };
        return s;
    };
    window.TkellMenu = Menu;
})(jQuery || $);