(function() {
    var f = YAHOO.util.Dom,
    b = YAHOO.util.Event,
    d = '<button type="button">role: none</button>',
    c = '<button id="body-button" type="button">role: none</button>',
    a = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Maecenas sit amet metus. Nunc quam elit, posuere nec, auctor in, rhoncus quis, dui. Aliquam erat volutpat. Ut dignissim, massa sit amet dignissim cursus, quam lacus feugiat.",
    g, e, h;
    YAHOO.util.GridBuilder = {
        init: function() {
            this.toolBox = new YAHOO.widget.Panel("toolBoxHolder", {
                close: false,
                visible: false,
                xy: [10, 10],
                width: "235px"
            });
            this.toolBox.render(document.body);
            this.hd = f.get("hd");
            this.bd = f.get("bd");
            this.ft = f.get("ft");
            this.headerStr = this.hd.firstChild.innerHTML;
            this.footerStr = this.ft.firstChild.innerHTML;
            this.headerDefault = this.headerStr;
            this.footerDefault = this.footerStr;
            this.type = "yui-t7";
            this.docType = "doc";
            this.rows = [];
            this.rows[0] = f.get("splitBody0");
            this.storeCode = false;
            this.sliderData = false;
            this.doc = f.get("doc");
            
            //updated by webnuke
            this.prefixID = dnn.getVar("PrefixID");
            var portalId = dnn.getVar("PortalID");
            var k = new YAHOO.widget.Button("save_skin");
            k.on("click", YAHOO.util.GridBuilder.saveSkin, YAHOO.util.GridBuilder, true);
            //end updated
            this.template = f.get("which_grid");
            b.on(this.template, "change", YAHOO.util.GridBuilder.changeType, YAHOO.util.GridBuilder, true);
//            b.on("splitBody0", "change", YAHOO.util.GridBuilder.splitBody, YAHOO.util.GridBuilder, true);
//            b.on("which_doc", "change", YAHOO.util.GridBuilder.changeDoc, YAHOO.util.GridBuilder, true);
//            b.on(this.bd, "mouseover", YAHOO.util.GridBuilder.mouseOver, YAHOO.util.GridBuilder, true);
             
//            this.template = f.get(this.prefixID + "ddlWhichDoc");
//            b.on(this.template, "change", YAHOO.util.GridBuilder.changeType, YAHOO.util.GridBuilder, true);
//            b.on("splitBody0", "change", YAHOO.util.GridBuilder.splitBody, YAHOO.util.GridBuilder, true);
//            b.on("which_doc", "change", YAHOO.util.GridBuilder.changeDoc, YAHOO.util.GridBuilder, true);
//            b.on(this.bd, "mouseover", YAHOO.util.GridBuilder.mouseOver, YAHOO.util.GridBuilder, true);
            
            var m = new YAHOO.widget.Button("setHeader");
            m.on("click", YAHOO.util.GridBuilder.setHeader, YAHOO.util.GridBuilder, true);
            var l = new YAHOO.widget.Button("setFooter");
            l.on("click", YAHOO.util.GridBuilder.setFooter, YAHOO.util.GridBuilder, true);
            var k = new YAHOO.widget.Button("show_code");
            k.on("click", YAHOO.util.GridBuilder.showCode, YAHOO.util.GridBuilder, true);
            var j = new YAHOO.widget.Button("resetBuilder");
            j.on("click", YAHOO.util.GridBuilder.reset, YAHOO.util.GridBuilder, true);
            var i = new YAHOO.widget.Button("addRow");
            i.on("click", YAHOO.util.GridBuilder.addRow, YAHOO.util.GridBuilder, true);
            var n = new YAHOO.widget.Button("doc_return");
            n.on("click",
            function(o) {
                location.href = "http://developer.yahoo.com/yui/grids/";
                b.stopEvent(o)
            });

            this.tooltip = new YAHOO.widget.Tooltip("classPath", {
                context: "bd",
                showDelay: 500
            });
            this.tooltip.subscribe("contextMouseOver",
            function(r, q) {
                var p = q[1],
                o = b.getTarget(p);
                return ! (f.hasClass(o, "yui-button") || f.getAncestorByClassName(o, "yui-button") || f.hasClass(o, "yuimenu") || f.getAncestorByClassName(o, "yuimenu") || f.hasClass(o, "order-indicator"))
            });
            this.ariaCheckbox = f.get("use-aria");
            this.useARIA = this.ariaCheckbox.checked;
            if (this.useARIA) {
                this.initARIA()
            }
            b.on("use-aria", "click", this.toggleARIA, null, this);
            this.orderCheckbox = f.get("show-order");
            this.showOrder = this.orderCheckbox.checked;
            if (this.showOrder) {
                this.createReadingOrderBadges()
            }
            b.on("show-order", "click", this.toggleOrderBadges, null, this);
            this.toolBox.show();
            this.splitBody();
        },
        initARIA: function() {
            this.hd.setAttribute("role", "banner");
            this.bd.setAttribute("role", "main");
            this.ft.setAttribute("role", "contentinfo");
            this.createRoleButtons()
        },
        toggleARIA: function(i) {
            this.useARIA = this.ariaCheckbox.checked;
            if (this.showOrder) {
                this.removeReadingOrderBadges()
            }
            if (this.useARIA) {
                this.createRoleButtons()
            } else {
                this.destroyRoleButtons()
            }
            if (this.showOrder) {
                this.createReadingOrderBadges()
            }
        },
        setRole: function(k) {
            var l = k.newValue,
            j = l.cfg.getProperty("text"),
            i = f.getAncestorByTagName(this.get("element"), "div");
            this.set("label", ("role: " + j));
            this.set("value", j);
            if (j === "none") {
                i.removeAttribute("role")
            } else {
                if (j) {
                    i.setAttribute("role", j)
                }
            }
        },
        createRoleButton: function(n) {
            var m = ["none", "application", "banner", "complementary", "contentinfo", "main", "navigation", "search"];
            var o = new YAHOO.widget.Button(n, {
                type: "menu",
                menu: m,
                lazyloadmenu: false
            });
            o.on("selectedMenuItemChange", this.setRole);
            var l = f.getAncestorByTagName(o.get("element"), "div").getAttribute("role");
            if (l) {
                o.set("value", l)
            }
            var j = m.length,
            k = j - 1;
            do {
                if (l === m[k]) {
                    o.set("selectedMenuItem", o.getMenu().getItem(k));
                    break
                }
            } while ( k --);
            return o
        },
        createHeaderRoleButton: function() {
            this.hd.innerHTML = '<button id="header-button" type="button">role: banner</button>' + this.hd.innerHTML;
            g = this.createRoleButton("header-button")
        },
        createFooterRoleButton: function() {
            this.ft.innerHTML = '<button id="footer-button" type="button">role: contentinfo</button>' + this.ft.innerHTML;
            h = this.createRoleButton("footer-button")
        },
        createBodyRoleButtons: function() {
            var n = this.bd.getElementsByTagName("p");
            if (n.length > 1) {
                f.batch(n,
                function(i) {
                    i.innerHTML = d + i.innerHTML
                })
            }
            this.bd.innerHTML = (c + this.bd.innerHTML);
            var l = this.bd.getElementsByTagName("button"),
            j = l.length,
            k = [],
            m;
            if (j > 0) {
                for (m = 0; m < j; m++) {
                    k.push(this.createRoleButton(l[m]))
                }
            }
            e = YAHOO.widget.Button.getButton("body-button");
            this.bodyRoleButtons = k
        },
        destroyBodyRoleButtons: function() {
            var l = this.bodyRoleButtons,
            j, k;
            if (l) {
                j = l.length;
                if (j > 0) {
                    k = j - 1;
                    do {
                        l[k].destroy()
                    } while ( k --)
                }
                this.bodyRoleButtons = null
            }
        },
        createRoleButtons: function() {
            this.createHeaderRoleButton();
            this.createBodyRoleButtons();
            this.createFooterRoleButton()
        },
        destroyRoleButtons: function() {
            g.destroy();
            this.destroyBodyRoleButtons();
            h.destroy()
        },
        applyRolesToBody: function(j) {
            this.destroyBodyRoleButtons();
            var n = f.getElementsBy(function(i) {
                return ! (i.id && i.id.indexOf("gridBuilder") === 0)
            },
            "div", this.bd);
            var k = j,
            m = 0;
            var l = function(q) {
                var o = n[m],
                i,
                p = q;
                if (o) {
                    i = o.getAttribute("role");
                    if (i) {
                        p = q + 'role="' + i + '" '
                    }
                }
                m++;
                return p
            };
            if (n && n.length > 0) {
                k = k.replace(/<div /gi, l)
            }
            this.createBodyRoleButtons();
            return k
        },
        saveLandmarksState: function() {
            var n = this.bodyRoleButtons,
            m = n.length,
            l, k = [],
            j;
            for (j = 0; j < m; j++) {
                l = n[j].get("selectedMenuItem");
                k.push(l ? l.index: 0)
            }
            this.bodyLandmarks = k
        },
        restoreLandmarksState: function() {
            var l, k = this.bodyLandmarks,
            m = k.length,
            j;
            if (k) {
                for (j = 0; j < m; j++) {
                    l = this.bodyRoleButtons[j];
                    if (l) {
                        l.set("selectedMenuItem", l.getMenu().getItem(k[j]))
                    }
                }
            }
        },
        toggleOrderBadges: function(i) {
            this.showOrder = this.orderCheckbox.checked;
            if (this.showOrder) {
                this.createReadingOrderBadges()
            } else {
                this.removeReadingOrderBadges()
            }
        },
        createReadingOrderBadges: function() {
            var n = this.bd.getElementsByTagName("p"),
            j = n.length,
            m = document.createElement("div");
            var k = function(i, o) {
                m.innerHTML = '<div class="order-indicator"> Order ' + i + "</div>";
                o.appendChild(m.firstChild)
            };
            k(1, this.hd);
            k(j + 2, this.ft);
            for (var l = 0; l < j; l++) {
                k((l + 2), n[l])
            }
        },
        removeReadingOrderBadges: function() {
            f.getElementsByClassName("order-indicator", "div", this.doc,
            function(i) {
                i.parentNode.removeChild(i)
            })
        },
        reset: function(k) {
            for (var j = 1; j < this.rows.length; j++) {
                if (this.rows[j]) {
                    if (f.get("splitBody" + j)) {
                        f.get("splitBody" + j).parentNode.parentNode.removeChild(f.get("splitBody" + j).parentNode)
                    }
                }
            }
            this.rows = [];
            this.rows[0] = f.get("splitBody0");
            f.get("which_doc").options.selectedIndex = 0;
            f.get("which_grid").options.selectedIndex = 0;
            f.get("splitBody0").options.selectedIndex = 0;
            this.hd.innerHTML = "<h1>" + this.headerDefault + "</h1>";
            this.ft.innerHTML = "<p>" + this.footerDefault + "</p>";
            this.headerStr = this.headerDefault;
            this.footerStr = this.footerDefault;
            this.changeDoc();
            this.changeType();
            this.splitBody();
            if (this.useARIA) {
                this.destroyBodyRoleButtons();
                this.initARIA()
            }
            b.stopEvent(k)
        },
        addRow: function(l) {
            if (this.useARIA) {
                this.saveLandmarksState()
            }
            var k = f.get("splitBody0").cloneNode(true);
            k.id = "splitBody" + this.rows.length;
            this.rows[this.rows.length] = k;
            this.rowCounter++;
            var j = document.createElement("div");
            j.innerHTML = '<button type="button" class="rowDel" id="gridRowDel' + this.rows.length + '">Remove this row</button><label>Row:</label>';
            j.lastChild.appendChild(k);
            var i = f.get("splitBody0").parentNode.parentNode.parentNode;
            i.insertBefore(j, f.get("addRow"));
            b.on(k, "change", YAHOO.util.GridBuilder.splitBody, YAHOO.util.GridBuilder, true);
            b.on("gridRowDel" + this.rows.length, "click", YAHOO.util.GridBuilder.delRow, YAHOO.util.GridBuilder, true);
            this.splitBody();
            if (this.useARIA) {
                if (this.template.selectedIndex > 0 && this.bodyLandmarks.length > 1) {
                    this.bodyLandmarks.splice((this.bodyLandmarks.length - 1), 0, 0)
                }
                this.restoreLandmarksState()
            }
            if (YAHOO.env.ua.ie) {
                this.toolBox.sizeUnderlay()
            }
            b.stopEvent(l)
        },
        delRow: function(j) {
            if (this.useARIA) {
                this.saveLandmarksState()
            }
            var i = b.getTarget(j);
            var k = i.id.replace("gridRowDel", "");
            f.get("splitBody0").parentNode.parentNode.parentNode.removeChild(i.parentNode);
            this.rows[k] = false;
            this.splitBody();
            if (this.useARIA) {
                this.restoreLandmarksState()
            }
            if (YAHOO.env.ua.ie) {
                this.toolBox.sizeUnderlay()
            }
            b.stopEvent(j)
        },
        changeDoc: function(i) {
            if (this.useARIA) {
                this.saveLandmarksState()
            }
            this.prevDocType = this.currentDocType;
            this.currentDocType = f.get("which_doc").selectedIndex;
            this.docType = f.get("which_doc").options[this.currentDocType].value;
            if (this.docType == "custom-doc") {
                this.showSlider()
            } else {
                this.doc.style.width = "";
                this.doc.style.minWidth = "";
                this.sliderData = false;
                this.doc.id = this.docType;
                this.doTemplate()
            }
            if (i) {
                b.stopEvent(i)
            }
            if (this.useARIA) {
                this.restoreLandmarksState()
            }
        },
        changeType: function() {
            if (this.useARIA) {
                this.saveLandmarksState()
            }
            this.type = this.template.options[this.template.selectedIndex].value;
            this.doc.className = this.type;
            this.doTemplate();
            if (this.useARIA) {
                this.restoreLandmarksState()
            }
        },
        doTemplate: function(k) {
            if (this.storeCode) {
                this.splitBody()
            }
            var j = "";
            var l = "<p>" + a + "</p>";
            var i = '<p class="nav">' + a + "</p>";
            if (k) {
                l = a;
                i = a
            } else {
                if (this.storeCode) {
                    l = "<!-- YOUR DATA GOES HERE -->";
                    i = "<!-- YOUR NAVIGATION GOES HERE -->"
                }
            }
            if (this.bodySplit) {
                if (k) {
                    l = this.bodySplit.replace(/\{0\}/g, a)
                } else {
                    if (this.storeCode) {
                        l = this.bodySplit.replace(/\{0\}/g, "\t<!-- YOUR DATA GOES HERE -->\n\t")
                    } else {
                        l = this.bodySplit.replace(/\{0\}/g, "<p>" + a + "</p>")
                    }
                }
            }
            if (this.type === "yui-t7") {
                j = l
            } else {
                j = '<div id="yui-main">\n\t<div class="yui-b" runat="server">' + l + '</div>\n\t</div>\n\t<div class="yui-b" runat="server">' + i + "</div>\n\t"
            }
            if (this.storeCode) {
                return j
            } else {
                if (this.showOrder) {
                    this.removeReadingOrderBadges()
                }
                if (this.useARIA) {
                    this.destroyBodyRoleButtons()
                }
                this.bd.innerHTML = j;
                if (this.useARIA) {
                    this.createBodyRoleButtons()
                }
                if (this.showOrder) {
                    YAHOO.lang.later(0, this, this.createReadingOrderBadges)
                }
            }
        },
        PixelToEmStyle: function(i, l) {
            var j = "";
            l = ((l) ? l.toLowerCase() : "width");
            var k = (i / 13);
            j += l + ":" + (Math.round(k * 100) / 100) + "em;";
            j += "*" + l + ":" + (Math.round((k * 0.9759) * 100) / 100) + "em;";
            if ((l == "width") || (l == "height")) {
                j += "min-" + l + ":" + i + "px;"
            }
            return j
        },
        getCode: function(n) {
            if (this.showOrder) {
                this.removeReadingOrderBadges()
            }
            this.storeCode = true;
            var l = false;
            if (this.sliderData) {
                if (this.sliderData.indexOf("px") != -1) {
                    l = "#custom-doc { " + this.PixelToEmStyle(parseInt(this.sliderData, 10)) + " margin:auto; text-align:left; }"
                } else {
                    l = "#custom-doc { width: " + this.sliderData + "; min-width: 250px; }"
                }
            }
            var i = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n "http://www.w3.org/TR/html4/strict.dtd">\n';
            i += "<html>\n";
            i += "<head>\n";
            i += "   <title>YUI Base Page</title>\n";
            i += '   <link rel="stylesheet" href="http://yui.yahooapis.com/' + YAHOO.VERSION + '/build/reset-fonts-grids/reset-fonts-grids.css" type="text/css">\n';
            if (l) {
                i += '   <style type="text/css">\n';
                i += "   " + l + "\n";
                i += "   </style>\n"
            }
            i += "</head>\n";
            i += "<body>\n";
            i += '<div id="' + this.docType + '" class="' + this.type + '">\n';
            var q, r = "",
            j, o = "",
            m, k = "",
            p = this.doTemplate(n);
            if (this.useARIA) {
                q = g.get("value");
                r = q === "none" ? "": ' role="' + g.get("value") + '"';
                j = e.get("value");
                o = j === "none" ? "": ' role="' + e.get("value") + '"';
                m = h.get("value");
                k = m === "none" ? "": ' role="' + h.get("value") + '"';
                p = this.applyRolesToBody(p)
            }
            i += '   <div id="hd"' + r + "><h1>" + this.headerStr + "</h1></div>\n";
            i += '   <div id="bd"' + o + ">\n\t" + p + "\n\t</div>\n";
            i += '   <div id="ft"' + k + "><p>" + this.footerStr + "</p></div>\n";
            i += "</div>\n";
            i += "</body>\n";
            i += "</html>\n";
            this.storeCode = false;
            if (this.showOrder) {
                this.createReadingOrderBadges()
            }
            return i
        },
        getSkinCode:function(n){
            if (this.showOrder) {
                this.removeReadingOrderBadges()
            }
            this.storeCode = true;
            var l = false;
            if (this.sliderData) {
                if (this.sliderData.indexOf("px") != -1) {
                    l = "#custom-doc { " + this.PixelToEmStyle(parseInt(this.sliderData, 10)) + " margin:auto; text-align:left; }"
                } else {
                    l = "#custom-doc { width: " + this.sliderData + "; min-width: 250px; }"
                }
            }
            var i = '<%@ Control language="vb" AutoEventWireup="false" Explicit="True" Inherits="DotNetNuke.UI.Skins.Skin" %>\n';
            i += '<div id="' + this.docType + '" class="' + this.type + '">\n';
            var q, r = "",
            j, o = "",
            m, k = "",
            p = this.doTemplate(n);
            if (this.useARIA) {
                q = g.get("value");
                r = q === "none" ? "": ' role="' + g.get("value") + '"';
                j = e.get("value");
                o = j === "none" ? "": ' role="' + e.get("value") + '"';
                m = h.get("value");
                k = m === "none" ? "": ' role="' + h.get("value") + '"';
                p = this.applyRolesToBody(p)
            }
            i += '   <div id="hd"' + r + "><h1>" + this.headerStr + "</h1></div>\n";
            i += '   <div id="bd"' + o + ">\n\t" + p + "\n\t</div>\n";
            i += '   <div id="ft"' + k + "><p>" + this.footerStr + "</p></div>\n";
            i += "</div>\n";
            this.storeCode = false;
            if (this.showOrder) {
                this.createReadingOrderBadges()
            }
            return i  
        },
        showCode: function(i) {
            var j = this.codePanel;
            if (!j) {
                j = new YAHOO.widget.Panel("showCode", {
                    close: true,
                    draggable: true,
                    modal: true,
                    visible: false,
                    fixedcenter: true,
                    height: "382px",
                    width: "650px"
                });
                j.setHeader("CSSGridBuilder Code");
                j.setBody("placeholder");
                j.setFooter('<input type="checkbox" id="includeLorem" value="1"> <label for="includeLorem">Include Lorem Ipsum text</label>');
                j.body.style.overflow = "auto";
                j.render(document.body);
                b.on("includeLorem", "click",
                function(o) {
                    var k = f.get("includeLorem");
                    var l = f.get("codeHolder");
                    var n = l.previousSibling;
                    n.parentNode.removeChild(n);
                    var m = this.getCode(k.checked);
                    l.style.visibility = "hidden";
                    l.style.display = "block";
                    l.value = m;
                    window.setTimeout(function() {
                        j.body.style.overflow = "";
                        dp.SyntaxHighlighter.HighlightAll("code");
                        j.body.style.overflow = "auto"
                    },
                    5)
                },
                this, true);
                this.codePanel = j;
                j.showEvent.subscribe(function() {
                    setTimeout(function() {
                        dp.SyntaxHighlighter.HighlightAll("code")
                    },
                    100)
                })
            }
            j.setBody('<form><textarea name="code" id="codeHolder" class="HTML">' + this.getCode() + "</textarea></form>");
            j.show();
            b.stopEvent(i)
        },
        setHeader: function(i) {
            var j = prompt("Set header value to: ", this.headerStr);
            if (j !== null) {
                if (this.showOrder) {
                    this.removeReadingOrderBadges()
                }
                if (this.useARIA) {
                    g.destroy()
                }
                this.headerStr = j;
                this.hd.innerHTML = "<h1>" + j + "</h1>";
                if (this.useARIA) {
                    this.createHeaderRoleButton()
                }
                if (this.showOrder) {
                    this.createReadingOrderBadges()
                }
            }
            b.stopEvent(i)
        },
        setFooter: function(i) {
            var j = prompt("Set footer value to: ", this.footerStr);
            if (j !== null) {
                if (this.showOrder) {
                    this.removeReadingOrderBadges()
                }
                if (this.useARIA) {
                    h.destroy()
                }
                this.footerStr = j;
                this.ft.innerHTML = "<p>" + j + "</p>";
                if (this.useARIA) {
                    this.createFooterRoleButton()
                }
                if (this.showOrder) {
                    this.createReadingOrderBadges()
                }
            }
            b.stopEvent(i)
        },
        splitBody: function() {
            this.bodySplit = "";
            for (var j = 0; j < this.rows.length; j++) {
                this.splitBodyTemplate(f.get("splitBody" + j))
            }
            if (!this.storeCode) {
                this.doTemplate()
            }
        },
        splitBodyTemplate: function(i) {
            var isFirstRow = (i.id == "splitBody0");
            if (i) {
                var j = i.options[i.selectedIndex].value;
                var k = "";
                switch (j) {
                case "1":
                    if(isFirstRow){
                        k += '<div class="yui-g" id="ContentPane" runat="server">\n';
                    }
                    k += "{0}";
                    k += "</div>\n";
                    break;
                case "2":
                    k += '<div class="yui-g">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first"  id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "3":
                    k += '    <div class="yui-gb">\n';
                    if(isFirstRow){
                        k += '        <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '        <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += "    </div>\n";
                    break;
                case "4":
                    k += '<div class="yui-g">\n';
                    k += '    <div class="yui-g first">\n';
                    if(isFirstRow){
                        k += '        <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '        <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += "    </div>\n";
                    k += '    <div class="yui-g">\n';
                    k += '        <div class="yui-u first" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "5":
                    k += '<div class="yui-g">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-g">\n';
                    k += '        <div class="yui-u first" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "6":
                    k += '<div class="yui-g">\n';
                    k += '    <div class="yui-g first" >\n';
                    if(isFirstRow){
                        k += '        <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '        <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "        </div>\n";
                    k += '        <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "        </div>\n";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "7":
                    k += '<div class="yui-gc">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "8":
                    k += '<div class="yui-gd">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "9":
                    k += '<div class="yui-ge">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break;
                case "10":
                    k += '<div class="yui-gf">\n';
                    if(isFirstRow){
                        k += '    <div class="yui-u first" id="ContentPane" runat="server">\n';
                    }
                    else{
                        k += '    <div class="yui-u first" runat="server">\n';
                    }
                    k += "{0}";
                    k += "    </div>\n";
                    k += '    <div class="yui-u" runat="server">\n';
                    k += "{0}";
                    k += "    </div>\n";
                    k += "</div>\n";
                    break
                }
                if (!this.storeCode) {
                    this.bodySplit += '<div id="gridBuilder' + (this.rows.length - 1) + '">' + k + "</div>"
                } else {
                    this.bodySplit += k
                }
            }
        },
        mouseOver: function(j) {
            var l = b.getTarget(j);
            var k = [];
            var i = true;
            while (i) {
                if (l.tagName.toLowerCase() == "body") {
                    i = false;
                    break
                }
                if (l.className) {
                    k[k.length] = l.className
                }
                if (l.parentNode) {
                    l = l.parentNode
                } else {
                    i = false
                }
            }
            this.tooltip.cfg.setProperty("text", "body." + document.body.className + " #" + this.docType + ": " + k.reverse().join(" : "))
        },
        //updated by webnuke
        saveSkin:function(){
            var params = {skinName:'123', skinCode: this.getSkinCode(),operate:1};
            var callSuccessDelegate = Function.createDelegate(this,function(payload, ctx, req){
                if(payload == -1){
                    alert("����ʧ�ܡ�ϵͳ���ִ���");
                }
                else if(payload == -2){
                    alert("�Ѵ�����ͬ���Ƶ�Ƥ������������ơ�");
                }
                else{
                    alert("����ɹ���");
                }
            });
            var callFailDelegate = Function.createDelegate(this,function(payload, ctx, req){
                alert(payload);
            });
            dnn.xmlhttp.callControlMethod('wnk.gridBuilder', 'SaveSkin', params, callSuccessDelegate, callFailDelegate, null);
        },
        //end updated
        showSlider: function() {
            var n = this.customWidthDialog,
            j = this.customWidthSlider;
            var l = function() {
                this.sliderData = f.get("sliderValue").value;
                n.hide()
            };
            var o = function() {
                f.get("which_doc").selectedIndex = this.prevDocType;
                this.changeDoc();
                n.hide()
            };
            var k = function(r) {
                var p, q;
                if (typeof r == "object") {
                    r = j.getValue()
                }
                if (f.get("moveTypePercent").checked) {
                    p = Math.round(r / 2);
                    f.get("custom-doc").style.width = p + "%";
                    f.get("sliderValue").value = p + "%"
                } else {
                    p = Math.round(r / 2);
                    q = Math.round(f.getViewportWidth() * (p / 100));
                    f.get("custom-doc").style.width = q + "px";
                    f.get("sliderValue").value = q + "px"
                }
                f.get("custom-doc").style.minWidth = "250px"
            };
            var m = function() {
                var p = f.get("sliderValue").value;
                if (p.indexOf("%") != -1) {
                    f.get("moveTypePercent").checked = true;
                    p = (parseInt(p, 10) * 2)
                } else {
                    if (p.indexOf("px") != -1) {
                        f.get("moveTypePixel").checked = true;
                        p = (((parseInt(p, 10) / f.getViewportWidth()) * 100) * 2)
                    } else {
                        f.get("sliderValue").value = "100%";
                        p = 200
                    }
                }
                j.setValue(p)
            };
            if (!n) {
                n = new YAHOO.widget.Dialog("showSlider", {
                    close: true,
                    draggable: true,
                    modal: true,
                    visible: false,
                    fixedcenter: true,
                    width: "275px",
                    postmethod: "none"
                });
                n.cfg.queueProperty("buttons", [{
                    text: "Save",
                    handler: {
                        fn: l,
                        scope: this
                    },
                    isDefault: true
                },
                {
                    text: "Cancel",
                    handler: {
                        fn: o,
                        scope: this
                    }
                }]);
                n.setHeader("CSSGridBuilder Custom Body Size");
                var i = "<p>Adjust the slider below to adjust your body size or set it manually with the text input. <i>(Be sure to include the % or px in the text input)</i></p>";
                i += '<form name="customBodyForm" method="POST" action="">';
                i += '<p>Current Setting: <input type="text" id="sliderValue" value="100%" size="8" onfocus="this.select()" /></p>';
                i += "<span>Unit: ";
                i += '<input type="radio" name="movetype" id="moveTypePercent" value="percent" checked> <label for="moveTypePercent">Percent</label>&nbsp;';
                i += '<input type="radio" name="movetype" id="moveTypePixel" value="pixel"> <label for="moveTypePixel">Pixel</label></span>';
                i += "</form>";
                i += '<div id="sliderbg"><div id="sliderthumb"><img src="thumb-n.gif" /></div>';
                i += "</div>";
                n.setBody(i);
                n.render(document.body);
                j = YAHOO.widget.Slider.getHorizSlider("sliderbg", "sliderthumb", 0, 200, 1);
                j.onChange = k;
                this.customWidthSlider = j;
                b.on(["moveTypePercent", "moveTypePixel"], "click", k);
                b.on("sliderValue", "blur", m);
                this.customWidthDialog = n
            }
            this.customWidthSlider.setValue(200);
            n.show();
            this.doc.id = this.docType;
            this.doc.style.width = "100%";
            this.doTemplate()
        }
    }
})();
YAHOO.register("gridbuilder", YAHOO.util.GridBuilder, {
    version: "@VERSION@",
    build: "@BUILD@"
});