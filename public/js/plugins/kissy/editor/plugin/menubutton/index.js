﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
/**
 * select component for kissy editor.
 * @author yiminghe@gmail.com
 */
KISSY.add("editor/plugin/menubutton/index", function (S, Editor, MenuButton) {
    /**
     * 将button ui 和点击功能分离
     * 按钮必须立刻显示出来，功能可以慢慢加载
     */
    Editor.prototype.addSelect = function (id, cfg, SelectType) {

        SelectType = SelectType || MenuButton.Select;

        var self = this, prefixCls = self.get("prefixCls") + "editor-";

        if (cfg) {
            cfg.editor = self;
            if (cfg.menu) {
                cfg.menu.zIndex = Editor.baseZIndex(Editor.zIndexManager.SELECT);
                cfg.menu.xclass = 'popupmenu';
                S.each(cfg.menu.children, function (child) {
                    child.xclass = 'option';
                });
            }
        }

        var s = new SelectType(S.mix({
            render:self.get("toolBarEl"),
            prefixCls:prefixCls,
            autoRender:true
        }, cfg));

        s.get("el").unselectable();

        if (cfg.mode == Editor.WYSIWYG_MODE) {
            self.on("wysiwygMode", function () {
                s.set('disabled', false);
            });
            self.on("sourceMode", function () {
                s.set('disabled', true);
            });
        }
        self.addControl(id + "/select", s);
        return s;

    };

    return MenuButton;
}, {
    requires:['editor', 'menubutton']
});
