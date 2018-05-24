/*Obsolete by xdq 2013-07-12 Reason:unified to use dnn js*/
(function ($) {
    $.x = { Modified: "2012-11-28", LastEditor: "XDQ" };
    $.fn.GetScrollOffset = function (deepOfWindow_Int) {
        var tObj = $(this).GetEventArgsTarget();
        var w = GetTopWindow();
        if (deepOfWindow_Int == null) deepOfWindow_Int = 1;
        var sl = 0; var st = 0; var lastSl = 0; var lastSt = 0;
        var offsetTop = 0; var offsetLeft = 0;

        while (deepOfWindow_Int > 0 && (tObj.parent && tObj.parent != tObj) || tObj.parentWindow || (tObj.parentNode && tObj.parentNode != tObj)) {
            if (!tObj.nodeType) {//窗体
                if (!tObj.parentWindow && tObj.parent && tObj.parent !== tObj) {
                    offsetLeft += tObj.screenLeft - tObj.parent.screenLeft;
                    offsetTop += tObj.screenTop - tObj.parent.screenTop;
                    deepOfWindow_Int--;
                }
            } else if (tObj.nodeType == 1)//元素
            {
                if (typeof (tObj.scrollTop) != undefined) {
                    sl += tObj.scrollLeft;
                    offsetLeft += (tObj.offsetLeft - (tObj.parentElement ? tObj.parentElement.offsetLeft : 0));
                    st += tObj.scrollTop;
                    offsetTop += (tObj.offsetTop - (tObj.parentElement ? tObj.parentElement.offsetTop : 0));
                }
            } else if (tObj.nodeType == 9) {//文档

            }
            if (deepOfWindow_Int)
                tObj = tObj.parentNode == undefined ? tObj.parentWindow == undefined ? tObj.parent : tObj.parentWindow : tObj.parentNode;
        }
        return { Left: sl, Top: st, OffsetLeft: offsetLeft, OffsetTop: offsetTop, Window: tObj };
    }
    $.fn.GetEventArgsTarget = function () {
        return this.GetTarget();
    }

    $.fn.MoveTo = function (target, offsetTop, offsetLeft) {
        var rect = { Left: 0, Top: 0, Width: 0, Height: 0 };
        if (target && (target.tagName || target.parent || target.nodeType)) {
            rect = $(target).GetElementRect();
        }
        if (!offsetTop)
            offsetTop = 0;
        if (!offsetLeft)
            offsetLeft = 0;
        this.css({ position: "absolute",
            left: rect.Left + offsetLeft + "px",
            top: rect.Top + offsetTop + "px"
        });
    };
    $.fn.GetTarget = function () {
        var eventArgs = this[0];
        if (!eventArgs) eventArgs = this;
        if (eventArgs.target)
            return eventArgs.target;
        else if (eventArgs.srcElement)
            return eventArgs.srcElement;
        else if (eventArgs.currentTarget)
            return eventArgs.currentTarget;
        else if (eventArgs.jquery)
            return eventArgs[0];
        else
            return eventArgs;
    };
    $.fn.GetElementRect = function () {
        var result = { Top: 0, Left: 0, Width: 0, Height: 0 };
        var object = this.GetEventArgsTarget();
        var o = $(object).offset();
        o = o ? o : { top: 0, left: 0 };
        result.Top = o.top;
        result.Left = o.left;
        result.Width = object.offsetWidth;
        result.Height = object.offsetHeight;
        return result;
    };
    $.fn.GetParent = function (times) {
        var target = this.GetEventArgsTarget();
        if (typeof (times) == "undefined") {
            times = 1;
        }
        while (times > 0) {
            if (target.parentNode && target.parentNode !== target) {
                target = target.parentNode;
                times--;
            } else if (target.parentWindow) {
                target = target.parentWindow;
            } else if (target.parent && target.parent !== target) {
                target = target.parent;
                times--;
            } else {
                break;
            }
        }
        return target;
    };
    $.fn.GetParentWithAttr = function (attrSelector) {
        var parent = this.GetEventArgsTarget();
        if (!selector || typeof (attrSelector) != "String") return parent;
        attrSelector = attrSelector.replace("]", "");
        var sts = attrSelector.split("[");
        var selectors = [];
        $(sts).each(function (k, v) {
            var s = v.split("=");
            selectors[k] = { key: s[0], value: s[1] == null ? "" : s[1] };
        });
        while (true) {
            var tparent = $(parent).GetParent();
            if (!tparent || parent === tparent) break;
            var isValid = true;
            $(selectors).each(function (k, v) {
                if ($(tparent).attr(v.key) !== v.value) {
                    isValid = false;
                    return;
                }
            });
            parent = tparent;
            if (isValid)
                break;
        }
        return parent;
    }
    $.fn.GetParentWithTagName = function (tagNameSelector) {
        var parent = this.GetEventArgsTarget();
        if (!tagNameSelector || (typeof (tagNameSelector) != "string" && typeof (tagNameSelector) != "String")) return parent;
        while (true) {
            var tParent = $(parent).GetParent();
            if (tParent === parent) return null;
            else if (tParent.nodeType == undefined) {
                if ($(tParent.document).find(tagNameSelector).length > 0) {
                    parent = $(tParent.document).find(tagNameSelector)[0];
                    break;
                } else
                    parent = tParent;
            } else
                if (!tParent || tParent.tagName == tagNameSelector) { parent = tParent; break; }
                else parent = tParent;
        }
        return parent;
    }


    $.fn.Tip = function (TipType, Message, DelayTime) {
        var panel = $("#XDQ_JS_Tip_Panel");
        if (!panel || panel.length == 0) {
            panel = $("<p id=\"XDQ_JS_Tip_Panel\"></p>")
            .css({ position: absolute, display: "none" });
            $("body").append(panel[0]);
        }
        if (panel.css("display") == "none") {
            if (!TipType)
                TipType = TipTypeEnum.Msg;
            switch (TipType) {
                case TipTypeEnum.Tip:
                    panel.css("background-color", "#ff0");
                    break;
                case TipTypeEnum.Msg:
                    panel.css("background-color", "#0080ff");
                    break;
                default:
                    panel.css("background-color", "#f00");
                    break;
            }
            var rect = this.jquery ? this.GetElementRect() : null;
            rect = rect ? rect : XDQ_JS_Tip_Target ? XDQ_JS_Tip_Target.GetElementRect() : null;
            if (rect) {
                panel.show();
                panel.css("display", "inline-block");
                panel.css("left", rect.Left + "px");
                panel.css("top", rect.Top + TipType == TipTypeEnum.Tip ? -5 : rect.Height + "px");
                panel.html(Message);
            }
            if (DelayTime && (XDQ_JS_Tip_Timer == null || XDQ_JS_Tip_Timer < 0)) {
                XDQ_JS_Tip_Timer = setInterval(this.ClearTip, DelayTime);
            } else
                if (XDQ_JS_Tip_Timer > 0)
                    panel.ClearTip();
        } else {
            panel.css("display", "none");
        }

    };
    var XDQ_JS_Tip_Timer;
    var XDQ_JS_Tip_Target;
    $.fn.ClearTip = function () {
        var panel = $("#XDQ_JS_Tip_Panel");
        panel.hide();
        panel.css("display", "none");
        clearInterval(XDQ_JS_Tip_Timer);
        XDQ_JS_Tip_Timer = -1;
    };
    $.fn.CoverIt = function (isCovereing, backColor, visibilityFloat, needZindex, offset) {
        var target = this.GetTarget();
        var name = "";
        var rect = $(target).GetElementRect();
        offset = offset == null ? 0 : offset;
        if (target.id)
            name = target.id.toLowerCase();
        else if (target.name)
            name = target.name.toLowerCase();
        else if (target.tagName)
            name = target.tagName.toLowerCase();
        else name = "";
        if (isCovereing == null) {
            isCovereing = true;
        }
        var panel = $("#XDQ_JS_Cover_Panel_" + name);
        if (!panel || panel.length == 0) {
            panel = $("<div id='XDQ_JS_Cover_Panel_"
        + name +
        "' style=\"position: absolute;\" ></div>");
        }
        if (backColor) {
            panel.css("background-color", backColor);
            if (!visibilityFloat)
                visibilityFloat = 0.1;
            if (GetExplorerType() == "ie") {
                visibilityFloat = visibilityFloat * 100;
                panel.css("filter", "alpha(opacity=" + visibilityFloat + ")")
            }
            else if (GetExplorerType() == "ff") {
                panel.css("opacity", visibilityFloat);
            }
        }
        panel.css("width", rect.Width + offset + "px");
        panel.css("height", rect.Height + offset + "px");
        if (needZindex) {
            panel.css("zIndex", this.GetHighestZindex());
        }
        panel.css("display", "block");
        this.append(panel);
        if (!isCovereing)
            panel.remove();
        else {
            var ofSet = $(target).offset();
            panel.offset(ofSet); //如果target是body的话 文档初次加载成功就遮罩 则需重设两次偏移
            panel.offset(ofSet);

        }
        return panel;
    }
    $.fn.GetHighestZindex = function () {
        var zIndex = 0;

        $(this).find("*").each(function (k, v) {
            var i = $(v).css("zIndex");
            if (i > zIndex) {
                zIndex = i;
            }
        });
        ++zIndex;
        return zIndex;
    }
    $.fn.MoveToCenter = function (needZindex, zindexProvider, offset, needScrollToThis, scrollDeepth) {
        if (offset == null) offset = 0;
        this.attr({ od: this[0].style.display, op: this[0].style.position, ol: this[0].style.left, ot: this[0].style.top });
        this.css({ display: "block", position: "absolute" });
        if (needScrollToThis)
            this.ScrollToThis(0, scrollDeepth);
        var _x = 0;
        var _y = 0;
        //        var _winTop = GetTopWindow();
        var _This = this.GetElementRect();
        var _Doc = $(window.document.documentElement).GetElementRect();
        var _Scrolled = GetTopWindowScrolled();
        var _Screen = GetScreenRect();
        var _WinOffset = $(window.document.documentElement).GetScrollOffset();
        var _x1 = Math.max(_Scrolled.Left + (Math.min(_Screen.Width, _Doc.Width) - _This.Width) / 2 - _WinOffset.OffsetLeft, 0);
        var _y1 = Math.max(_Scrolled.Top + (Math.min(_Screen.Height, _Doc.Height) - _This.Height) / 2 - _WinOffset.OffsetTop, 0);
        var _x2 = Math.max(_Scrolled.Left + (Math.min(_Screen.Width, _Doc.Width) - _This.Width) - _WinOffset.OffsetLeft, 0);
        var _y2 = Math.max(_Scrolled.Top + (Math.min(_Screen.Height, _Doc.Height) - _This.Height) - _WinOffset.OffsetTop, 0);
        _x = Math.max((_x2 - _x1) / 2 + offset, 0);
        _y = Math.max((_y2 - _y1) / 2 + offset, 0);
        if (needZindex && zindexProvider && zindexProvider.tagName) {
            this.css({ zIndex: $(zindexProvider).GetHighestZindex() })
        }
        this.css({
            left: _x + "px", top: _y + "px"
        });
        return this;
    }
    $.fn.ShowDialog = function (coverOtherObj, coverColor, visibilityFloat, okFunc, cancelFunc, offset, needScroll, scrollDeepth) {
        if (offset == null) offset = 0;
        if (scrollDeepth == null) scrollDeepth = 0;
        if (!this.attr("od"))
            this.attr({ od: this.css("display"), oc: this.css("clear") });
        this.css({ display: "block", clear: "both" });
        var dom = $("<div pid=\"xdq_dialog\" class=\"window\"></div>");
        this.before(dom);
        this.attr("tid", "xdq_dialog");
        dom.append(this);

        var head = $("<p  pid=\"xdq_dialog\" style=\"text-align:right;\"></p>");
        var head_close = $("<span class=\"btnAction\" style=\"float:right;\"></span>")
                 .append($("<a>X</a>")
                 .click(function () { if (cancelFunc) cancelFunc(); _closeXDQDialog(dom, cp); }));
        $(head).append(head_close);
        //        var head = head_close;
        this.before(head);
        var bottom = $("<p style='text-align:center;' pid=\"xdq_dialog\"></p>");
        var bottom_ok = null;
        if (okFunc) {
            bottom_ok = $("<span class=\"btnAction\" style=\"margin:5px;\"></span>")
                 .append($("<a>确定</a>")
                 .click(function () { okFunc(); _closeXDQDialog(dom, cp); }));
        }
        var bottom_cancel = null;
        if (cancelFunc) {
            bottom_cancel = $("<span class=\"btnAction\" style=\"margin:5px;\"></span>")
                 .append($("<a>取消</a>")
                 .click(function () { if (cancelFunc) cancelFunc(); _closeXDQDialog(dom, cp); }));
        }
        $(bottom).append(bottom_ok).append(bottom_cancel);
        $(dom).append(bottom);
        $(dom).css(this[0].clientWidth);
        $(dom).MoveToCenter(true, coverOtherObj, offset, true);
        var cp = null;
        //        var target = this.GetTarget();
        if (coverOtherObj && coverOtherObj.tagName)
            cp = $(coverOtherObj).CoverIt(true, coverColor, visibilityFloat, false, 0);
        if (cp) {
            //            此处滚动存在BUG！
            $(cp).dblclick(function () {
                $(this).ScrollToThis(offset, scrollDeepth);
                $(this).remove();
            })
            .click(function () {
                $(this).ScrollToThis(offset, scrollDeepth);
            });
        }
        if (needScroll)
            $(dom).ScrollToThis(offset, scrollDeepth);
        return this;
    }
    function _closeXDQDialog(dom, cp) {
        if (cp) {
            $(window.document).find("#" + $(cp).attr("id")).remove();
        }
        var source = $(dom).find("[tid=xdq_dialog]");
        $(dom).before(source);
        source.css({ display: source.attr("od"), clear: source.attr("oc") });
        $(dom).parent().find("div[pid=xdq_dialog]").remove();
    }
    $.fn.Scroll = function (offsetX, offsetY) {
        if (offsetX)
            this.scrollLeft(offsetX);
        if (offsetY)
            this.scrollTop(offsetY);
        return this;
    }
    $.fn.ScrollToThis = function (offset, scollDeepth) {
        if (offset == null) offset = 0;
        if (!scollDeepth) scollDeepth = 0;
        var rectW = this.GetScrollOffset(1);
        //        var rectWin = GetScreenRect();
        if (rectW.Window && rectW.Window.frameElement) {
            $(rectW.Window.frameElement).ScrollToThis(offset, scollDeepth - 1);
        }
        if (!scollDeepth) {
            rectW = this.GetScrollOffset(1);
            $(rectW.Window).Scroll(rectW.OffsetLeft - rectW.Left + offset, rectW.OffsetTop - rectW.Top + offset);
        }
        return this;
    }
})(jQuery);

var topWindow = null;
function GetTopWindow() {
    if (topWindow == null) {
        topWindow = window;
        while (topWindow.parent && topWindow.parent != topWindow) {
            topWindow = topWindow.parent;
        }
    }
    return topWindow;
}
function GetExplorerType() {
    if (navigator.userAgent.indexOf("MSIE") > 0) {
        return "ie";
    }
    if (navigator.userAgent.indexOf("Firefox") > 0) {
        return "ff";
    }
    return 'uk';
    //    if ( navigator.userAgent.indexOf("Safari") > 0) {
    //        return "Safari";
    //    }
    //    if ( navigator.userAgent.indexOf("Camino") > 0) {
    //        return "Camino";
    //    }
    //    if ( navigator.userAgent.indexOf("Gecko/") > 0) {
    //        return "Gecko";
    //    }
}
function GetExplorerRect() {
    return { Width: window.screen.availWidth, Height: window.screen.availHeight };
}

var enumKeyCode = {
    Enter: 13, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74,
    K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86,
    W: 87, X: 88, Y: 89, Z: 90, CtrlA: 1
};
var enumTipType = {
    Tip: 1, Msg: 2, Error: 3
};
String.prototype.GetNTimesFloatStr = function (n, FillChar) {
    if (!n) n = 2;
    if (!FillChar) FillChar = '0';
    var str = this;
    if (this.indexOf('.') < 0)
        str = str + '.';
    var strs = str.split('.');
    var tmp = "";
    while (n > 0) {
        if (strs[1].length <= tmp.length)
            tmp += FillChar;
        else
            tmp += strs[1][n];
        n--;
    }
    return strs[0] + "." + tmp;
}
String.prototype.GetDate = function () {
    return new Date(this.replace(/-|\./g, "/"));
};
String.prototype.Len = function () {
    var i, str1, str2, str3, nLen;
    str1 = this;
    nLen = 0;
    for (i = 1; i <= str1.length; i++) {
        str2 = str1.substring(i - 1, i)
        str3 = escape(str2);
        if (str3.length > 3) {
            nLen = nLen + 2;
        }
        else {
            nLen = nLen + 1;
        }
    }
    return nLen;
}
String.prototype.GetMaxLengthStr = function (max) {
    if (!max) max = 2147483648;
    if (this.length <= max) return this;
    else return this.substring(0, max);
}
function GetTopWindowScrolled() {
    var w = GetTopWindow();
    return { Left: w.document.documentElement.scrollLeft, Top: w.document.documentElement.scrollTop };
}
function GetScreenRect() {
    return { Width: window.screen.availWidth, Height: window.screen.availHeight };
}