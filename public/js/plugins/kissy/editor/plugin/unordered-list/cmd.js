﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
/**
 * ol command
 * @author yiminghe@gmail.com
 */
KISSY.add("editor/plugin/unordered-list/cmd", function (S, Editor, listCmd) {

    var insertUnorderedList = "insertUnorderedList",
        ListCommand = listCmd.ListCommand,
        queryActive = listCmd.queryActive,
        ulCmd = new ListCommand("ul");

    return {
        init:function (editor) {
            if (!editor.hasCommand(insertUnorderedList)) {
                editor.addCommand(insertUnorderedList, {
                    exec:function (editor) {
                        editor.focus();
                        ulCmd.exec(editor);
                    }
                });
            }

            var queryUl = Editor.Utils.getQueryCmd(insertUnorderedList);

            if (!editor.hasCommand(queryUl)) {
                editor.addCommand(queryUl, {
                    exec:function (editor) {
                        var selection = editor.getSelection();
                        if (selection && !selection.isInvalid) {
                            var startElement = selection.getStartElement();
                            var elementPath = new Editor.ElementPath(startElement);
                            return queryActive("ul", elementPath);
                        }
                    }
                });
            }
        }
    };

}, {
    requires:['editor', '../list-utils/cmd']
});
