﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
/**
 * Add ul/ol button.
 * @author yiminghe@gmail.com
 */
KISSY.add("editor/plugin/unordered-list/index", function (S, Editor, ListButton, ListCmd) {

    function unorderedList() {
    }

    S.augment(unorderedList, {
        renderUI:function (editor) {
            ListCmd.init(editor);

            editor.addButton("unorderedList", {
                cmdType:"insertUnorderedList",
                mode:Editor.WYSIWYG_MODE
            }, ListButton);
        }
    });

    return unorderedList;
}, {
    requires:['editor', '../list-utils/btn', './cmd']
});
