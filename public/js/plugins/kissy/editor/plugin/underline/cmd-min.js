/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
KISSY.add("editor/plugin/underline/cmd",function(d,a,b){var c=new a.Style({element:"u",overrides:[{element:"span",attributes:{style:"text-decoration: underline;"}}]});return{init:function(a){b.addButtonCmd(a,"underline",c)}}},{requires:["editor","../font/cmd"]});
