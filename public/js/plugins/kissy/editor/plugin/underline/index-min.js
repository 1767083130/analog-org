/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
KISSY.add("editor/plugin/underline/index",function(c,g,e,f){function d(){}c.augment(d,{renderUI:function(a){f.init(a);a.addButton("underline",{cmdType:"underline",tooltip:"下划线 "},e.Button);a.docReady(function(){a.get("document").on("keydown",function(b){b.ctrlKey&&b.keyCode==c.Node.KeyCodes.U&&(a.execCommand("underline"),b.preventDefault())})})}});return d},{requires:["editor","../font/ui","./cmd"]});
