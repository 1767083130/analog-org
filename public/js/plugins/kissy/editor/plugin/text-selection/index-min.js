///////////////////////////////////////////////////////////////
/// 选择文本时 弹出快捷 工具条
/// 更新日志：
/// 2013-04-28 XDQ创建 遗留BUG至少一个：当双击文本行时 有时候不会选中任何文本，但是浮动工具条依然会显示
/// 2013-05-04 9月份发布的KISSY库 与 12月份的发布的版本存在大量差异！之后修改并重构！
///////////////////////////////////////////////////////////////
KISSY.add("editor/plugin/text-selection/index", function (S, OverLay, Editor, Button) {
    function MyPlugin() {
        this.id = new Date().valueOf();
    };
    S.extend(MyPlugin, S.Base);
    MyPlugin.prototype.__replaceEdtior = function () {
        var self = this, e = self.get("editor");
        e.set("toolBarEl", self.get("toolBarEl"));
    };
    MyPlugin.prototype.__replaceEdtiorBack = function () {
        var self = this, e = self.get("editor");
        e.set("toolBarEl", self.get("_toolBar"));
    };
    MyPlugin.prototype.docReady = function (func) {
        this.get("editor").docReady(func);
    }
    MyPlugin.prototype.pluginRenderUI = function (editor) {
        var self = this,
                contentEl = new OverLay(
                {
                    elStyle: {
                        border: "1px solid #eee"
                        , lineHeight: 0
                        , display: "inline-block"
                        , position: "absolute"
                        , padding: "2px"
                        , margin: "0px"
                    }, height: 25
                    , effect: {
                        effect: "slide", //"fade",
                        duration: 0.5
                    }
                });
        self.addition = 20;
        self.set("editor", editor);
        editor.set("selectedText", { ex: 0, ey: 0, sx: 0, sy: 0 });
        contentEl.render();
        var el = contentEl.get("el");
        el.addClass(editor.get("prefixCls") + "editor-tools"); //将样式与工具栏统一
        self.set("toolBarEl", el);
        self.set("canShow", editor.get("mode") == Editor.WYSIWYG_MODE);
        editor.docReady(function () {
            var doc = editor.get("document"), html = S.one(doc[0].documentElement), iframe = editor.get("iframe");
            self.addition += iframe[0].offsetTop; //弹出菜单呈现位置偏移+=编辑器偏移
            self.set("__toolBar", editor.get("toolBarEl"));
            self.set("document", doc); //为某些特定插件添加
            html.on("mouseup", function (e) {
                with (editor.get("selectedText")) {
                    ex = e.pageX;
                    ey = e.pageY;
                }
            });
            html.on("mousedown", function (e) {
                contentEl.hide();
                with (editor.get("selectedText")) {
                    sx = e.pageX;
                    sy = e.pageY;
                }
            });
            html.on("dblclick", function (e) {//双击显示浮动菜单
                with (editor.get("selectedText")) {
                    ex = e.pageX;
                    ey = e.pageY;
                    sx = -5;
                    sy = -5;
                }
            });
        });
        var plugins = [
        "editor/plugin/fore-color/"
        , "editor/plugin/back-color/"
        , "editor/plugin/bold/"
        , "editor/plugin/italic/"
        , "editor/plugin/strike-through/"
        , "editor/plugin/underline/"
        , "editor/plugin/font-family/"
        , "editor/plugin/font-size/"
                            ];
        S.use(plugins, function () {
            var plugins = S.makeArray(arguments);
            plugins.shift();
            S.each(plugins, function (plugin) {
                var ctr = new plugin();
                var render = ctr.pluginRenderUI == undefined ? ctr.renderUI : ctr.pluginRenderUI;
                render.call(ctr, self);
            });
        });
        //所见即所得模式 可以显示菜单
        editor.on("wysiwygMode", function () { self.set("canShow", true); });
        //代码模式 绝不显示菜单
        editor.on("sourceMode", function () { self.set("canShow", false); contentEl.hide(); });
        editor.on("selectedText", function (e) {
            var t = S.all(e.target);
            e.halt();
            setTimeout(function () {
                if (self.get("canShow")) {
                    contentEl.set("xy", [e.ex, e.ey + self.addition]);
                    contentEl.show();
                }
            }, 0)
        });
    };
    MyPlugin.prototype.renderUI = function (editor) { this.pluginRenderUI(editor); };
    MyPlugin.prototype.addButton = function () {
        var self = this, e = self.get("editor");
        self.__replaceEdtior();
        var r = e.addButton.apply(e, arguments);
        self.__replaceEdtiorBack();
        return r;
    }
    MyPlugin.prototype.addSelect = function (id, cfg, SelectType) {
        var self = this, e = self.get("editor");
        self.__replaceEdtior();
        var r = e.addSelect.apply(e, arguments);
        self.__replaceEdtiorBack();
        return r;
    };
    MyPlugin.prototype.hasCommand = function () { var e = this.get("editor"); return e.hasCommand.apply(e, arguments); }
    MyPlugin.prototype.execCommand = function () { var e = this.get("editor"); return e.execCommand.apply(e, arguments); };
    MyPlugin.prototype.addCommand = function () { var e = this.get("editor"); return e.addCommand.apply(e, arguments); };
    var MyCheckText = function (self, selection) {
        with (self.get("selectedText")) {
            if (Math.abs(sx - ex) > 5 || Math.abs(sy - ey) > 5) {
                self.fire(
                                "selectedText",
                                {
                                    selection: selection
                                    , sx: sx
                                    , sy: sy
                                    , ex: ex
                                    , ey: ey
                                });
            }
        }
        var ranges = selection.getRanges();
        //        if (ranges && ranges[0]) {
        //            ranges = ranges[0];
        //            if (ranges.startOffset !== ranges.endOffset) {
        //                with (self.get("selectedText")) {
        //                    self.fire(
        //                                "selectedText",
        //                                {
        //                                    selection: selection
        //                                    , sx: sx
        //                                    , sy: sy
        //                                    , ex: ex
        //                                    , ey: ey
        //                                });
        //                }
        //            }
        //        }
    };
    if (Editor.prototype.checkSelectionIsText === undefined) {
        //添加selectedText事件
        var checkSelectedIsText = function (selection) {
            var self = this, type = selection.getType();
            if (type === 2) {//这里 有没有枚举？
                setTimeout(function () { MyCheckText(self, selection); }, 0)
            }
        };
        var checkSelectionChangeId = function () {
            var self = this;
            if (self.__checkSelectionChangeId) {
                clearTimeout(self.__checkSelectionChangeId);
            }
            self.__checkSelectionChangeId = setTimeout(function () {
                var selection = self.getSelection();
                if (selection && !selection.isInvalid) {
                    var startElement = selection.getStartElement(),
                                currentPath = new Editor.ElementPath(startElement);
                    self.checkSelectionIsText(selection);
                    if (!self.__previousPath || !self.__previousPath.compare(currentPath)) {
                        self.__previousPath = currentPath;
                        self.fire("selectionChange",
                                    {
                                        selection: selection,
                                        path: currentPath,
                                        element: startElement,
                                        IsText: false
                                    });
                    }
                }
            }, 100);
        };
        Editor.prototype.checkSelectionIsText = checkSelectedIsText
        Editor.prototype.checkSelectionChange = checkSelectionChangeId;
    }
    return MyPlugin;
},
        {
            requires:
            [
                "overlay"
                , "editor"
                , "button"
            ]
        })
