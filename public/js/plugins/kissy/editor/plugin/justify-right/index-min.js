/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
KISSY.add("editor/plugin/justify-right/index",function(c,d,f){function g(){var a=this.get("editor");a.execCommand("justifyRight");a.focus()}function e(){}c.augment(e,{renderUI:function(a){f.init(a);a.addButton("justifyRight",{tooltip:"右对齐",checkable:!0,listeners:{click:g,afterSyncUI:function(){var b=this;a.on("selectionChange",function(){a.get("mode")!=d.SOURCE_MODE&&(a.queryCommandValue("justifyRight")?b.set("checked",!0):b.set("checked",!1))})}},mode:d.WYSIWYG_MODE});a.docReady(function(){a.get("document").on("keydown",
function(b){b.ctrlKey&&b.keyCode==c.Node.KeyCodes.R&&(a.execCommand("justifyRight"),b.preventDefault())})})}});return e},{requires:["editor","./cmd"]});
