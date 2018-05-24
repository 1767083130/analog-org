/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
KISSY.add("editor/plugin/table/index",function(i,l,s){function t(a){function d(a){!(0<g.length)&&a[0].nodeType==m.NodeType.ELEMENT_NODE&&u.test(a.nodeName())&&!a.data("selected_cell")&&(a._4e_setMarker(e,"selected_cell",!0,void 0),g.push(a))}for(var b=a.createBookmarks(),f=a.getRanges(),g=[],e={},c=0;c<f.length;c++){var h=f[c];if(h.collapsed)h=h.getCommonAncestor(),(h=h.closest("td",void 0)||h.closest("th",void 0))&&g.push(h);else{var h=new Walker(h),k;for(h.guard=d;k=h.next();)if((k=k.parent())&&
u.test(k.nodeName())&&!k.data("selected_cell"))k._4e_setMarker(e,"selected_cell",!0,void 0),g.push(k)}}l.Utils.clearAllMarkers(e);a.selectBookmarks(b);return g}function v(a,d){var b=a.getStartElement().parent("tr");if(b){var f=b.clone(!0);f.insertBefore(b);b=(d?f[0]:b[0]).cells;for(f=0;f<b.length;f++)b[f].innerHTML="",p.ie||(new j(b[f]))._4e_appendBogus(void 0)}}function q(a){if(a instanceof l.Selection){for(var d=t(a),b=d.length,a=[],f,g,e=0;e<b;e++){var c=d[e].parent(),h=c[0].rowIndex;!e&&(f=h-
1);a[h]=c;e==b-1&&(g=h+1)}e=c.parent("table");f=new j(g<e[0].rows.length&&e[0].rows[g]||0<f&&e[0].rows[f]||e[0].parentNode);for(e=a.length;0<=e;e--)a[e]&&q(a[e]);return f}a instanceof j&&(e=a.parent("table"),1==e[0].rows.length?e.remove():a.remove());return 0}function w(a,d){var b=a.getStartElement();if(b=b.closest("td",void 0)||b.closest("th",void 0))for(var f=b.parent("table"),g=b[0].cellIndex,e=0;e<f[0].rows.length;e++){var c=f[0].rows[e];c.cells.length<g+1||(b=new j(c.cells[g].cloneNode(void 0)),
p.ie||b._4e_appendBogus(void 0),c=new j(c.cells[g]),d?b.insertBefore(c):b.insertAfter(c))}}function x(a){if(a instanceof l.Selection){var d=t(a),b,f=[],a=d[0]&&d[0].parent("table"),g,e,c;g=0;for(e=d.length;g<e;g++)f.push(d[g][0].cellIndex);f.sort();g=1;for(e=f.length;g<e;g++)if(1<f[g]-f[g-1]){c=f[g-1]+1;break}c||(c=0<f[0]?f[0]-1:f[f.length-1]+1);f=a[0].rows;g=0;for(e=f.length;g<e&&!(b=f[g].cells[c]);g++);b=b?new j(b):a.prev();for(c=d.length-1;0<=c;c--)d[c]&&x(d[c]);return b}if(a instanceof j){d=a.parent("table");
if(!d)return null;b=a[0].cellIndex;for(c=d[0].rows.length-1;0<=c;c--)a=new j(d[0].rows[c]),!b&&1==a[0].cells.length?q(a):a[0].cells[b]&&a[0].removeChild(a[0].cells[b])}return null}function y(a,d){var b=new l.Range(a[0].ownerDocument);if(!b.moveToElementEditablePosition(a,d?!0:void 0))b.selectNodeContents(a),b.collapse(d?!1:!0);b.select(!0)}function n(a){var d=(a=a.getSelection())&&a.getStartElement(),b=d&&d.closest("table",void 0);if(b)return a=d.closest(function(a){var d=m.nodeName(a);return b.contains(a)&&
("td"==d||"th"==d)},void 0),d=d.closest(function(a){var d=m.nodeName(a);return b.contains(a)&&"tr"==d},void 0),{table:b,td:a,tr:d}}function o(a){return(a=n(a))&&a.td}function r(a){return(a=n(a))&&a.tr}function z(a){this.config=a||{}}var p=i.UA,m=i.DOM,j=i.Node,B=["tr","th","td","tbody","table"],u=/^(?:td|th)$/,A={"表格属性":n,"删除表格":o,"删除列":o,"删除行":r,"在上方插入行":r,"在下方插入行":r,"在左侧插入列":o,"在右侧插入列":o},C=(6===p.ie?["table.%2,","table.%2 td, table.%2 th,","{","border : #d3d3d3 1px dotted","}"]:" table.%2,; table.%2 > tr > td,  table.%2 > tr > th,; table.%2 > tbody > tr > td,  table.%2 > tbody > tr > th,; table.%2 > thead > tr > td,  table.%2 > thead > tr > th,; table.%2 > tfoot > tr > td,  table.%2 > tfoot > tr > th;{;border : #d3d3d3 1px dotted;}".split(";")).join("").replace(/%2/g,
"ke_show_border"),D={tags:{table:function(a){var d=a.getAttribute("class"),b=parseInt(a.getAttribute("border"),10);if(!b||0>=b)a.setAttribute("class",i.trim((d||"")+" ke_show_border"))}}},E={tags:{table:function(a){var d=a.getAttribute("class");d&&((d=i.trim(d.replace("ke_show_border","")))?a.setAttribute("class",d):a.removeAttribute("class"))}}};i.augment(z,{renderUI:function(a){a.addCustomStyle(C);var d=a.htmlDataProcessor,b=d&&d.htmlFilter;(d&&d.dataFilter).addRules(D);b.addRules(E);var f=this,
g={"表格属性":function(){this.hide();var c=n(a);c&&s.useDialog(a,"table",f.config,{selectedTable:c.table,selectedTd:c.td})},"删除表格":function(){this.hide();var c=a.getSelection(),b=c&&c.getStartElement();if(b=b&&b.closest("table",void 0)){a.execCommand("save");c.selectElement(b);var d=c.getRanges()[0];d.collapse();c.selectRanges([d]);c=b.parent();1==c[0].childNodes.length&&"body"!=c.nodeName()&&"td"!=c.nodeName()?c.remove():b.remove();a.execCommand("save")}},"删除行 ":function(){this.hide();a.execCommand("save");
var c=a.getSelection();y(q(c),void 0);a.execCommand("save")},"删除列 ":function(){this.hide();a.execCommand("save");var c=a.getSelection();(c=x(c))&&y(c,!0);a.execCommand("save")},"在上方插入行":function(){this.hide();a.execCommand("save");var c=a.getSelection();v(c,!0);a.execCommand("save")},"在下方插入行":function(){this.hide();a.execCommand("save");var c=a.getSelection();v(c,void 0);a.execCommand("save")},"在左侧插入列":function(){this.hide();a.execCommand("save");var c=a.getSelection();w(c,!0);a.execCommand("save")},
"在右侧插入列":function(){this.hide();a.execCommand("save");var c=a.getSelection();w(c,void 0);a.execCommand("save")}},e=[];i.each(g,function(a,b){e.push({content:b})});a.addContextMenu("table",function(a){if(i.inArray(m.nodeName(a),B))return!0},{width:"120px",children:e,listeners:{click:function(a){a=a.target.get("content");g[a]&&g[a].apply(this)},beforeVisibleChange:function(a){if(a.newVal){var b=this,a=b.get("children"),d=b.get("editor");i.each(a,function(a){var c=a.get("content");!A[c]||A[c].call(b,
d)?a.set("disabled",!1):a.set("disabled",!0)})}}}});a.addButton("table",{mode:l.WYSIWYG_MODE,listeners:{click:function(){s.useDialog(a,"table",f.config,{selectedTable:0,selectedTd:0})}},tooltip:"插入表格"})}});return z},{requires:["editor","../dialog-loader/","../contextmenu/"]});
