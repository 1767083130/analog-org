/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
KISSY.add("editor/plugin/smiley/index",function(e,g,i){function h(){}for(var d="<div class='{prefixCls}editor-smiley-sprite'>",b=0;98>=b;b++)d+="<a href='javascript:void(0)' data-icon='http://a.tbcdn.cn/sys/wangwang/smiley/48x48/"+b+".gif'></a>";d+="</div>";e.augment(h,{renderUI:function(f){var b=f.get("prefixCls");f.addButton("smiley",{tooltip:"插入表情",checkable:!0,listeners:{afterSyncUI:function(){var a=this;a.on("blur",function(){setTimeout(function(){a.smiley&&a.smiley.hide()},150)})},click:function(){var a=
this,c;if(a.get("checked")){if(!(c=a.smiley))c=a.smiley=new i({content:e.substitute(d,{prefixCls:b}),focus4e:!1,width:300,autoRender:!0,elCls:b+"editor-popup",zIndex:g.baseZIndex(g.zIndexManager.POPUP_MENU),mask:!1}),c.get("el").on("click",function(a){var a=new e.Node(a.target),b;if("a"==a.nodeName()&&(b=a.attr("data-icon")))b=new e.Node("<img alt='' src='"+b+"'/>",null,f.get("document")[0]),f.insertElement(b)}),c.on("hide",function(){a.set("checked",!1)});c.set("align",{node:this.get("el"),points:["bl",
"tl"],overflow:{adjustX:1,adjustY:1}});c.show()}else a.smiley&&a.smiley.hide()},destroy:function(){this.smiley&&this.smiley.destroy()}},mode:g.WYSIWYG_MODE})}});return h},{requires:["editor","../overlay/"]});
