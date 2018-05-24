function createMask() {
    try {

        //´´½¨±³¾°
        var rootEl = document.documentElement || document.body;
        var docHeight = ((rootEl.clientHeight > rootEl.scrollHeight) ? rootEl.clientHeight : rootEl.scrollHeight) + "px";
        var docWidth = ((rootEl.clientWidth > rootEl.scrollWidth) ? rootEl.clientWidth : rootEl.scrollWidth) + "px";
        var shieldStyle = "position:absolute;top:0px;left:0px;width:" + docWidth + ";height:" + docHeight + ";background:#cccccc;z-index:10000;filter:alpha(opacity=0);opacity:0";
        var _shield = document.createElement("div");
        _shield.id = "shield";
        _shield.style.cssText = shieldStyle;
        document.body.appendChild(_shield);
    } catch (e) { }
}

if (typeof MTPS == "undefined" || !MTPS) var MTPS = {};
if (typeof MTPS.Controls == "undefined" || !MTPS.Controls) MTPS.Controls = {};
//CreateResizeableArea('ctl00_LibFrame', 'ctl00_raSplitter', 'ctl00_raLeft', 'ctl00_raRight', 'tocwidth', 'toccollapsed', '173');
MTPS.Controls.CreateResizeableArea = function(resizeableareaid, splitterid, leftid, rightid, TOCWidthCookieName, TOCIsCollapsedCookieName, IE6Offset) {
    this.ResizeableAreaselector = "#" + resizeableareaid;
    this.ResizeableArea = jQuery(this.ResizeableAreaselector).get(0);
    this.leftselector = "#" + leftid;
    this.leftSection = jQuery(this.leftselector).get(0);
    this.splitterselector = "#" + splitterid;
    this.splitter = jQuery(this.splitterselector).get(0);
    this.rightselector = "#" + rightid;
    this.rightSection = jQuery(this.rightselector).get(0);
    this.CollapsedCookieName = TOCIsCollapsedCookieName;
    this.WidthCookieName = TOCWidthCookieName;
    this.ie6Offset = IE6Offset;
    this.useParentOffsetHeight = !(this.ResizeableArea.parentNode.offsetHeight == document.documentElement.clientHeight);
    this.minWidth = 30;
    this.rightSectionMinWidth = 200;
    this.dragging = false;
    this.ToggleEvent = function(iscurrentlyCollapsed) {
        if (iscurrentlyCollapsed && this.leftSection.style.display == "block" || !iscurrentlyCollapsed && this.leftSection.style.display == "none")
            if (this.ClientCollapseEvents) this.ClientCollapseEvents(!iscurrentlyCollapsed)
    };
    this.Redraw = function(width) {

        var date = new Date;
        date.setYear(date.getFullYear() + 1);
        if (width <= this.minWidth) {
            this.leftSection.style.display = "none";
            document.cookie = this.CollapsedCookieName + "=true; expires=" + date.toGMTString(); +"; path=/";
            this.splitter.style.left = "0px"
        } else {
            this.leftSection.style.display = "block";
            this.splitter.style.left = width + "px";
            this.leftSection.style.width = width + "px";
            document.cookie = this.CollapsedCookieName + "=false; expires=" + date.toGMTString(); +"; path=/";
            document.cookie = this.WidthCookieName + "=" + width + "; expires=" + date.toGMTString(); +"; path=/"
        }
        if (jQuery.browser.msie) {
            var ver = parseInt(jQuery.browser.version);
            if (ver != NaN && ver == 6) jQuery(window).trigger("resize", this)
        }
    };
    this.isCurrentlyCollapsed = function() {
        return jQuery(this.leftselector).css("display") == "none"
    };
    this.OpenCollapse = function(open) {
        var currentCollapseState = this.isCurrentlyCollapsed();
        if (open != undefined && open != currentCollapseState) return;
        if (this.leftSection.style.display == "none") this.Redraw(parseInt(jQuery(this.leftselector).width()));
        else this.Redraw(0);
        this.ToggleEvent(currentCollapseState)
    };
    this.OnDoubleClick = function(e) {
        e.data.OpenCollapse()
    };
    this.OnKeyPress = function(e) {
        if (e.which == 116 && e.target.tagName.toLowerCase() != "input" && e.target.tagName.toLowerCase() != "textarea") e.data.OpenCollapse();
        e.cancelBubble = true
    };
    this.resizeStart = function(e) {
        createMask();

        e.data.dragging = true;
        var i = e.data.GetX(e.data.splitter.parentNode) + e.clientX - e.data.GetX(e.data.splitter);
        e.data.splitter.parentOffsetX = i;
        jQuery(document).bind("mousemove", e.data, e.data.mouseMove);
        jQuery(document).bind("mouseup", e.data, e.data.resizeStop);
        document.body.ondrag = function() {
            return !e.data.dragging
        };
        document.body.onselectstart = function() {
            return !e.data.dragging
        };
        return false
    };
    this.resizeStop = function(e) {
        jQuery(document).unbind("mousemove", e.data.mouseMove);
        jQuery(document).unbind(e);
        var iscurrentlyCollapsed = e.data.leftSection.style.display == "none";
        e.data.Redraw(e.data.splitter.offsetLeft);
        e.data.dragging = false;
        e.data.ToggleEvent(iscurrentlyCollapsed);

        document.body.removeChild(jQuery("#shield").get(0));
    };
    this.GetX = function(oElement) {
        var x = 0;
        while (oElement != null) {
            x += oElement.offsetLeft;
            oElement = oElement.offsetParent
        }
        return x
    };
    this.mouseMove = function(e) {
        x = e.clientX - e.data.splitter.parentOffsetX;
        if (x <= e.data.minWidth) x = 0;
        else if (x >= e.data.splitter.parentNode.offsetWidth - e.data.splitter.offsetWidth - e.data.rightSectionMinWidth) x = e.data.splitter.parentNode.offsetWidth - e.data.splitter.offsetWidth - e.data.rightSectionMinWidth;
        e.data.splitter.style.left = x + "px";
        return false
    };
    this.IE6Only = function(e) {

        while (e.data.rightSection.offsetWidth != e.data.ResizeableArea.offsetWidth - e.data.splitter.offsetWidth - e.data.leftSection.offsetWidth - 6) e.data.rightSection.style.width = e.data.ResizeableArea.offsetWidth - e.data.splitter.offsetWidth - e.data.leftSection.offsetWidth - 6 + "px";
        e.data.ResizeableArea.style.height = document.documentElement.clientHeight - e.data.ie6Offset; //todo
    };
    this.IE7Only = function(e) {
        if (e.data.useParentOffsetHeight) e.data.ResizeableArea.style.height = e.data.ResizeableArea.parentNode.offsetHeight;
        else e.data.ResizeableArea.style.height = document.documentElement.clientHeight;
    };
    this.InitDisplay = function() {
        this.rightSection.style.width = document.body.clientWidth - 4 - this.leftSection.offsetWidth - 4 + "px"
    };
    jQuery(this.splitterselector).bind("mousedown", this, this.resizeStart);
    jQuery(document).bind("keypress", this, this.OnKeyPress);
    jQuery(this.splitterselector).bind("dblclick", this, this.OnDoubleClick);
    if (jQuery.browser.msie) {
        var ver = parseInt(jQuery.browser.version);
        if (ver != NaN && ver > 7) return;
        if (ver != NaN && ver == 6) {
            jQuery(window).bind("resize", this, this.IE6Only);
            this.InitDisplay()

            this.ResizeableArea.style.height = document.documentElement.clientHeight - this.ie6Offset;
        }
        else if (ver != NaN && ver >= 7) jQuery(window).bind("resize", this, this.IE7Only); //todo
        jQuery(window).trigger("resize", this);
    }
    return this;
}

