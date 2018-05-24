/*
类目选择器 by XDQ 2013-10-23





*/
(function (Menu, undefined) {
    if (!Menu) throw "菜单未加载";
    if (window.CategoryMenu) return;
    var k = { category: "category" }
    $.prototype.category = function () {
        return this.data(k.category);
    };
    window.console = window.console || function (exp) { };
    function forEach(arr, func) {
        var l = arr.length, c = null;
        for (var i = 0; i < l; i++) { c = arr[i]; if (func(c, i) === true) return c; }
    };
    var option =
                {
                    data: []
                    , autoRender: false
                    , isAutoSelectParent: false
                    , isAutoSelectFirstChild: false
                    , isSingleSelectMode: true
                    , isSelectOnly: true
                    , menuOpenEvent: ""
                    , menuCloseEvent: ""
                    , textTag: "a"
                };
    function CategoryMenu(json) {
        var s = this, menu, Sdom = $("#" + json.clientId)
                , Smenu = Sdom.children(".dropMenu")
                , Scontext = Sdom.children(".valueContent")
                , Stext = Scontext.children(".text");
        function init() {
            Stext.html("请选择类目");
            Scontext.click(function () {
                if (Sdom.hasClass("open"))
                    return Sdom.removeClass("open");
                Sdom.addClass("open");
                setTimeout(function () {
                    $("body").one("click", function () {
                        Sdom.removeClass("open");
                    });
                }, 1);
            });
            menu = new TkellMenu(Smenu, option);
            function initData(_s, a) {
                forEach(a, function (o) {
                    var item = new TkellMenu.Item();
                    item.prop("value", o.id).prop("text", o.text).prop("open", true, false);
                    _s.add(item, false);
                    var c = o.children;
                    if (c && c.length) initData(item, c);
                });
            }
            initData(menu, json.data);
            menu.render();
            menu.on("select", function (o, e) {
                if (o.select()) { menu.data("select", o); Stext.html(o.prop("text")); }
            });
            Sdom.data(k.category, s);
            return s;
        }
        s.getSelectedCid = function () {
            var sI = menu.data("select");
            if (sI) return sI.prop("value");
            return null;
        };
        return init();
    };
    CategoryMenu.menus = [];
    CategoryMenu.initMenu = function (json) {
        var catMenu = new CategoryMenu(json);
        CategoryMenu.menus.push(catMenu);
    };
    window.CategoryMenu = CategoryMenu;
})(TkellMenu);