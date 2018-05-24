/*
暂时废弃不用。
*/
if (typeof MTPS == "undefined" || !MTPS) var MTPS = {};
if (typeof MTPS.Controls == "undefined" || !MTPS.Controls) MTPS.Controls = {};
//CreateResizeableArea('ctl00_LibFrame', 'ctl00_raSplitter', 'ctl00_raLeft', 'ctl00_raRight', 'tocwidth', 'toccollapsed', '173');
MTPS.Controls.CreateVResizeableArea = function(splitterid, topid, bottomid, heightCookieName, isCollapsedCookieName, IE6Offset) {
    //    this.ResizeableAreaselector = "#" + resizeableareaid;
    //    this.ResizeableArea = jQuery(this.ResizeableAreaselector).get(0);
    this.topselector = "#" + topid;
    this.topSection = jQuery(this.topselector).get(0);
    this.splitterselector = "#" + splitterid;
    this.splitter = jQuery(this.splitterselector).get(0);
    this.bottomselector = "#" + bottomid;
    this.bottomSection = jQuery(this.bottomselector).get(0);
    this.CollapsedCookieName = isCollapsedCookieName;
    this.HeightCookieName = heightCookieName;
    this.ie6Offset = IE6Offset;
    //    this.useParentOffsetHeight = !(this.ResizeableArea.parentNode.offsetHeight == document.documentElement.clientHeight);
    this.minHeight = 0;

    this.bottomSectionminHeight = 200;
    this.dragging = false;

    this.ToggleEvent = function(iscurrentlyCollapsed) {
        if (iscurrentlyCollapsed && this.topSection.style.display == "block" || !iscurrentlyCollapsed && this.topSection.style.display == "none")
            if (this.ClientCollapseEvents) this.ClientCollapseEvents(!iscurrentlyCollapsed)
    };
    this.Redraw = function(height) {
        var date = new Date;
        date.setYear(date.getFullYear() + 1);
        if (height <= this.minHeight) {
            this.bottomSection.style.padding = "4px 0 0 0";
            //this.bottomSection.style.padding-top = "4px";
            this.bottomSection.style.height = "100%";
            this.topSection.style.display = "none";
            document.cookie = this.CollapsedCookieName + "=true; expires=" + date.toGMTString(); +"; path=/";
            this.splitter.style.top = "0px";

            $("#libFrame").get(0).style.height = document.documentElement.clientHeight;

        } else {
            this.bottomSection.style.padding = "128px 0 0 0";

            this.topSection.style.display = "block";
            this.splitter.style.top = height + "px";
            this.topSection.style.height = height + "px";
            document.cookie = this.CollapsedCookieName + "=false; expires=" + date.toGMTString(); +"; path=/";
            document.cookie = this.HeightCookieName + "=" + height + "; expires=" + date.toGMTString(); +"; path=/"
        }
        if (jQuery.browser.msie) {
            var ver = parseInt(jQuery.browser.version);
            if (ver != NaN && ver == 6) jQuery(window).trigger("resize", this);

        }
    };
    this.isCurrentlyCollapsed = function() {
        return jQuery(this.topselector).css("display") == "none"
    };
    this.OpenCollapse = function(open) {
        var currentCollapseState = this.isCurrentlyCollapsed();
        if (open != undefined && open != currentCollapseState) return;
        if (this.topSection.style.display == "none") this.Redraw(parseInt(jQuery(this.topselector).height()));
        else this.Redraw(0);
        this.ToggleEvent(currentCollapseState)
    };
    this.OnDoubleClick = function(e) {
        e.data.OpenCollapse()
    };
    this.OnKeyPress = function(e) {
        if (e.which == 104 && e.target.tagName.toLowerCase() != "input" && e.target.tagName.toLowerCase() != "textarea") e.data.OpenCollapse();
        e.cancelBubble = true
    };
    this.resizeStart = function(e) {
        e.data.OpenCollapse();
    };

    this.IE6Only = function(e) {
        while (e.data.bottomSection.offsetWidth != e.data.ResizeableArea.offsetWidth - e.data.splitter.offsetWidth - e.data.topSection.offsetWidth - 6) e.data.bottomSection.style.width = e.data.ResizeableArea.offsetWidth - e.data.splitter.offsetWidth - e.data.topSection.offsetWidth - 6 + "px";
        e.data.ResizeableArea.style.height = document.documentElement.clientHeight - e.data.ie6Offset
    };
    this.IE7Only = function(e) {
        if (e.data.useParentOffsetHeight) e.data.ResizeableArea.style.height = e.data.ResizeableArea.parentNode.offsetHeight;
        else e.data.ResizeableArea.style.height = document.documentElement.clientHeight
    };
    this.InitDisplay = function() {
        this.bottomSection.style.width = document.body.clientWidth - 4 - this.topSection.offsetWidth - 4 + "px"
    };
    jQuery(this.splitterselector).bind("mousedown", this, this.resizeStart);
    jQuery(document).bind("keypress", this, this.OnKeyPress);
    jQuery(this.splitterselector).bind("dblclick", this, this.OnDoubleClick);
    return this;
}

