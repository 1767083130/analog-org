//Obsolete by xdq 2013-07-12 Reason:unified to use dnn js
(function ($, undefined) {
    //2012-12-06 第二次整理！
    if ($.X) return;
    $.X = { Modified: '2013-03-01', Editor: 'XDQ', Creater: 'XDQ', created: '2012-10-01' }
    //枚举

    $.enumNodeType = { Window: undefined, Element: 1, Attribute: 2, Text: 3, Comments: 8, Document: 9 };
    $.enumTipType = { Tip: 1, Msg: 2, Error: 3 };
    $.enumKeyCode = { Enter: 13, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74,
        K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86,
        W: 87, X: 88, Y: 89, Z: 90, CtrlA: 1
    };
    $.enumBroswerType = { UnKnown: 0, Ie: 1, Firefox: 2, Safari: 4, Gecko: 8, Other: 128 };


    //Fn
    $.fn.Tip = function (tipType, msg, delay_Int, offsetX_Int, offsetY_Int) {
        var tips = [];
        this.each(function () {
            var _t = this, _p, _b;
            _p = $("<span/>").css('display', 'inline-block').html(msg != null ? msg : "");
            _b = $(_t).GetParentWithNodeType($.enumNodeType.Document)[0];
            $(_b.body).append(_p[0]);
            _p.MoveTo(_t, offsetX_Int, offsetY_Int, true);
            switch (tipType) {
                case $.enumTipType.Error:
                    _p.css({ 'backgroundColor': '#f00' });
                    break;
                case $.enumTipType.Tip:
                    _p.css({ 'backgroundColor': '#ff0' });
                    break;
                default:
                    _p.css({ 'backgroundColor': '#0080ff' });
                    break;
            }
            tips[tips.length] = _p[0];
        })
        var _s = setInterval(function () {
            $(tips).remove();
            clearInterval(_s);
        }, delay_Int * 1000);
        return $(tips);
    }
    $.fn.CoverIt = function (nameAlias_Str, isCovering, backColor_Str, visib_Float, needZindex, offsetX_Int, offsetY_Int) {
        var cps = [];
        var _args = $.extend({ _n: "XDQCover", _c: true, _b: "#000", _v: 0.5, _z: true, _x: 0, _y: 0 },
            { _n: nameAlias_Str, _c: isCovering, _b: backColor_Str, _v: visib_Float, _z: needZindex, _x: offsetX_Int, _y: offsetY_Int });
        this.each(function () {
            var _t = this, _name, _cp;
            if (!_args._n) _name = _t.id ? _t.id : _t.name ? _t.name : _t.tagName ? _t.tagName : "";
            _name = "xCover_" + _name;
            _cp = $("[xName=" + _name + "]")[0];
            if (!_cp) {
                _cp = $("<div/>").
                        attr({ xName: _name }).
                        css({ 'backgroundColor': _args._b, 'position': "absolute",
                            'width': _t.offsetWidth + 2 * _args._x,
                            'height': _t.offsetHeight + 2 * _args._y,
                            'opacity': visib_Float
                        });
                _cp = _cp[0];
            }
            if (isCovering) { $(_cp).show(); $(_cp).MoveTo(_t, _args._x, _args._y, _args._z); }
            else { $(_cp).hide(); }
            cps[cps.length] = _cp;
        });
        return $(cps);
    }
    $.fn.MoveTo = function (targetElement, offsetX_Int, offsetY_Int, needZindex) {
        if (targetElement) {
            if (offsetX_Int == null) offsetX_Int = 0; if (offsetY_Int == null) offsetY_Int = 0;
            var off = $(targetElement).offset();
            this.each(function () {
                $(this).attr({ _position: $(this).css("position"), _left: $(this).offset().left, _top: $(this).offset().top, _zIndex: $(this).css("zIndex") });
                $(this).css({ 'position': "absolute", 'left': off.left + offsetX_Int, 'top': off.top + offsetY_Int });
                if (needZindex)
                    $(this).css({ 'zIndex': $(targetElement).GetHighestZindex() });
            })
        }
        return this;
    }
    $.fn.Recovery = function () {
        this.each(function () {
            var a = this.attributes;
            for (var x in a) {
                if (x.name && x.name.indexOf("_") == 0) {
                    var y = x.name.substring(1, x.name.length);
                    $(this).css(y, x.value);
                    $(this).removeAttr(x.name);
                }
            }
        })
        return this;
    }
    $.fn.GetParent = function () {
        var r = [];
        this.each(function () {
            var t = null;
            if (this.parentNode)//HTML 节点
                t = this.parentNode;
            //            else if (this.frameElement)//HTML window
            //                t = this.frameElement;
            else if (this.parent)//HTML window
                t = this.parent;
            else if (this.defaultView)//FireFox document
                t = this.defaultView;
            else if (this.parentWindow)
                t = this.parentWindow; //IE document
            else
                t = null;
            r[r.length] = t;
        })
        return $(r);
    }
    $.fn.GetHighestZindex = function () {
        var zIndex = 0;
        this.find("*").each(function () {
            var i = $(this).css("zIndex");
            if (i > zIndex) {
                zIndex = i;
            }
        });
        return ++zIndex;
    }
    $.fn.ScrollToThis = function (offsetX_Int, offsetY_Int) {
        if (offsetX_Int == null) offsetX_Int = 0; if (offsetY_Int == null) offsetY_Int = 0;
        this.each(function () {
            if (!this.nodeType) {
                this.scrollTo(offsetX_Int, offsetY_Int);
            }
            else {
                var w = $(this);
                var t = $(this);
                while (w.length && w[0].nodeType) {
                    w = w.GetParent();
                }
                w = w[0];
                var _sH = w.document.documentElement.scrollHeight - w.document.documentElement.clientHeight - w.document.documentElement.scrollTop;
                var _sW = w.document.documentElement.scrollWidth - w.document.documentElement.clientWidth - w.document.documentElement.scrollLeft;
                var _Y = t.offset().top;
                var _X = t.offset().left;
                w.scrollTo(Math.min(_X, _sW), Math.min(_Y, _sH));
            }
        });
        return this;
    }
    $.fn.GetParentWithNodeType = function (nodeType) {
        var _s = $(this[0]).GetParent();
        while (_s[0].nodeType != nodeType) {
            _s = _s.GetParent();
        }
        return _s;
    }
    $.fn.ScrollParentIframeTo = function (offsetX_Int, offsetY_Int) {
        if (offsetX_Int == null) offsetX_Int = 0; if (offsetY_Int == null) offsetY_Int = 0;
        this.each(function () {
            var w = $(this).GetParentWithNodeType($.enumNodeType.Window), f = this;
            if (!f.nodeType)
                f = f.frameElement;
            while (f) {
                var r = $(f).offset(); r = r ? r : { left: 0, top: 0 };
                w.ScrollToThis(r.left + offsetX_Int, r.top + offsetY_Int);
                f = w[0].frameElement;
                w = w.GetParentWithNodeType($.enumNodeType.Window);
            }
        })
        return this;
    }
    $.fn.MoveToCenter = function (offsetX_Int, offsetY_Int, needScrollOuterFrame) {
        if (offsetX_Int == null) offsetX_Int = 0; if (offsetY_Int == null) offsetY_Int = 0;
        var t = null; var w = null;
        this.each(function () {
            $(this).attr({ _display: $(this).css("display"), _position: $(this).css("position"),
                _left: $(this).css("left"), _top: $(this).css("top")
            });
            t = $(this); t.show(); w = $(this);
            while (w.length && w[0].nodeType)
                w = w.GetParent();
            if (needScrollOuterFrame)
                w.ScrollParentIframeTo();
            w = w[0]; var _t = t[0];
            var _x, _y, _cw, _ch, _sw = 0, _sh = 0, _dw, _dh, _d = w.document, _th, _tw;
            if (window.outerWidth) {
                _cw = Math.min(w.outerWidth, w.innerWidth);
                _ch = Math.min(w.outerHeight, w.innerHeight);
            } else {
                var vRect = $(w).GetVisibleRect();
                _cw = vRect.Width, _ch = vRect.Height;
            }
            var _w = w;
            while (_w.parent) {
                var _offset = $(_t).offset();
                _d = _w.document;
                _offset = _offset ? _offset : { left: 0, top: 0 };
                _sh += _offset.top - _d.documentElement ? _d.documentElement.scrollTop : _d.body.scrollTop;
                _sw += _offset.left - _d.documentElement ? _d.documentElement.scrollLeft : _d.body.scrollLeft;
                if (_w === _w.parent) break;
                _w = _w.parent; _t = _w.frameElement;
            }
            _d = w.document; _d = _d.documentElement ? _d.documentElement : _d.body;
            _dw = _d.offsetWidth; _dh = _d.offsetHeight;
            _t = t[0]; _tw = _t.offsetWidth; _th = _t.offsetHeight;
            if (isNaN(_sh) || typeof (_sh) != "number") { _sh = 0; _sw = 0; }
            _x = Math.min(Math.max(0, (_dw - _tw) / 2 - _sw), Math.max(_sw, _sw + (_cw - _tw) / 2));
            _y = Math.min(Math.max(0, (_dh - _th) / 2 - _sh), Math.max(_sh, _sh + (_ch - _th) / 2));
            t.css({ 'position': "absolute",
                'left': _x + "px",
                'top': _y + "px"
            });
        });
        return this;
    }
    $.fn.GetVisibleRect = function () {
        var _w = null;
        var _t = this[0];
        var result;
        while (_t && _t !== _w) {
            _w = _t;
            if (!_t.nodeType || _t.nodeType == $.enumNodeType.Element) {
                var _x, _y;
                if (_t.nodeType == $.enumNodeType.Element) {
                    _x = _t.clientWidth;
                    _y = _t.clientHeight;
                    if (_x == 0 && _y == 0) {//IE7 client有问题
                        _x = _t.offsetWidth; _y = _t.offsetHeight;
                    }
                } else if (!_t.nodeType) {
                    if (document.documentElement) {
                        _x = _t.document.documentElement.clientWidth;
                        _y = _t.document.documentElement.clientHeight;
                    } else {
                        _x = _t.document.body.clientWidth;
                        _y = _t.document.body.clientHeight;
                    }
                }
                if (!result) result = { Width: _x, Height: _y };
                else {
                    result.Width = Math.min(result.Width, _x);
                    result.Height = Math.min(result.Height, _y);
                }
            }
            _t = $(_t).GetParent()[0];
        }
        return result ? result : { Width: 0, Height: 0 };
    }
    $.fn.ShowDialog = function (nameAlias, offsetX, okFunction, cancelFunction, canDrag, width) {
        var _arg = $.extend({ _n: "XDQDialog", _x: 0, _o: null, _c: null, _d: false, _w: 0 },
            { _n: nameAlias, _x: offsetX, _o: okFunction, _c: cancelFunction, _d: canDrag, _w: width });
        var _dialogs = [];
        this.each(function () {
            var _t = this, _w, _dom, _n;
            if (!_arg._n) _arg._n = _t.id ? _t.id : _t.name ? _t.name : _t.tagName ? _t.tagName : "";
            _n = "xDialog_" + _arg._n;
            _dom = $("[xName=" + _n + "]");
            if (_dom.length > 1) {
                for (var x in _dom) {
                    if (x.Close) x.Close();
                }
                $(_t).ShowDialog(arguments);
            } else if (_dom[0]) {
                $(_dom[0]).show("slow");
            } else {
                _dom = $("<div/>").attr({ xName: _n, 'class': "xDialog" }).css({ 'float': "right" });
                $(_t).before(_dom);
                _dom[0].OK = function () {
                    var dom = _dom;
                    //                    if (!dom) dom = $(this).GetParentWithNodeType($.enumNodeType.Document).find(".xDialog");
                    dom.hide();
                    if (typeof (_arg._o) == "function") _arg._o();
                }
                _dom[0].Cancel = function () {
                    var dom = _dom;
                    //                    if (!dom) dom = $(this).GetParentWithNodeType($.enumNodeType.Document).find(".xDialog");
                    dom.hide();
                    if (typeof (_arg._c) == "function") _arg._c();
                }
                _dom[0].Close = function () {
                    var dom = _dom;
                    //                    if (!dom) dom = $(this).GetParentWithNodeType($.enumNodeType.Document).find(".xDialog");
                    var _n = dom.attr("xName");
                    dom.find("[did=" + _n + "]").remove();
                    var _s = dom.find("[sid=" + _n + "]");
                    dom.before(_s); dom.remove();
                    while (_s[0] && _s[0].tagName) {
                        _s.Recovery(); _s = _s.GetParent();
                    }
                }
                _w = $(_t); _w.attr({ sid: _n });
                while (_w[0] && _w[0].tagName) {
                    _w.attr({ _display: _w.css("display") });
                    _w.show(); _w = _w.GetParent();
                }
                var _head = $("<p/>").attr({ did: _n, head: "head" }).append(
                 $("<span/>").attr({ 'class': "btnAction" }).css({ 'margin': "5px", 'float': "right" }).
                                append($("<a/>").html("X")).click(_dom[0].Cancel)
                //                    $("<a/>").attr({ 'class': "imgbtn" }).css({ 'margin': "5px", 'float': "right" }).append(
                //                        $("<span/>").attr({ 'class': "close" }).css({ 'display': "inline-block", height: "16px" })
                //                        ).click(_dom.Cancel)
                    );
                if (_arg._d && $.fn.easydrag) {
                    _head.easydrag();
                }
                var _bottom = $("<p/>").attr({ did: _n }).css({ 'textAlign': "center" });
                if (typeof (_arg._o) == "function") {
                    _bottom.append(
                            $("<span/>").attr({ 'class': "btnAction" }).css({ 'margin': "5px" }).
                                append($("<a/>").html("确定")).click(_dom[0].OK));
                }
                if (typeof (_arg._c) == "function") {
                    _bottom.append(
                            $("<span/>").attr({ 'class': "btnAction" }).css({ 'margin': "5px" }).
                                append($("<a/>").html("取消")).click(_dom[0].Cancel));
                }
                _t = $(_t);
                _dom.append(_head).append(_t.attr("_clear", _t.css("clear")).css("clear", "both")).append(_bottom);
                var _width = Math.max(0, _t.GetVisibleRect().Width - _arg._x);
                _width = Math.min(_width, _t.width());
                if (_arg._w) _width = _arg._w;
                _dom.css({ width: _arg._w ? _arg._w : _width });
            }
            _dialogs[_dialogs.length] = _dom[0];
        });
        return $(_dialogs);
    }

    //Function
    $.GetTopestWindow = function () {
        var w = window;
        while (w.parent && w.parent !== w)
            w = w.parent;
        return $(w);
    }

    $.GetExplorerType = function () {
        var result = { Type: null, Version: null };
        if (navigator.userAgent.indexOf("MSIE") > 0) {
            result.Type = this.enumBroswerType.Ie;
            result.Version = navigator.userAgent.match(/MSIE[\s\/]+[0-9\.]+/g)[0].match(/[0-9\.]+/g)[0]
        } else if (navigator.userAgent.indexOf("Firefox") > 0) {
            result.Type = this.enumBroswerType.Firefox;
            result.Version = navigator.userAgent.match(/Firefox[\s\/]+[0-9\.]+/g)[0].match(/[0-9\.]+/g)[0]
        } else if (navigator.userAgent.indexOf("Safari") > 0) {
            result.Type = this.enumBroswerType.Safari;
            result.Version = navigator.userAgent.match(/Safari[\s\/]+[0-9\.]+/g)[0].match(/[0-9\.]+/g)[0]
        } else if (navigator.userAgent.indexOf("Camino") > 0) {
            result.Type = this.enumBroswerType.Camino;
            result.Version = navigator.userAgent.match(/Camino[\s\/]+[0-9\.]+/g)[0].match(/[0-9\.]+/g)[0]
        } else if (navigator.userAgent.indexOf("Gecko") > 0) {
            result.Type = this.enumBroswerType.Gecko;
            result.Version = navigator.userAgent.match(/Gecko[\s\/]+[0-9\.]+/g)[0].match(/[0-9\.]+/g)[0]
        } else {
            result.Type = this.enumBroswerType.UnKnown;
            result.Version = "undefine";
        }
        return result;
    }
    $.Page_Load = function (func) {
        if (typeof (func) == "function") {
            if (window.onload == null) {
                window.onload = func;
            }
            else {
                var o = window.onload;
                window.onload = function () {
                    o();
                    func();
                }
            }
        }
        return this;
    }
    $.JsonToString = function (json) {
        var r = "";
        var type = Object.prototype.toString.apply(json);
        if (type === '[object Array]') {
            r += "[";
            for (var i = 0; i < json.length; i++) {
                r += $.JsonToString(json[i]);
                r += ",";
            }
            if (r.charAt(r.length - 1) == ",")
                r = r.substr(0, r.length - 1);
            r += "]";
        }
        else if (type === '[object Object]') {
            r += "{";
            for (var i in json) {
                r += i + ":";
                r += $.JsonToString(json[i]);
                r += ",";
            }
            if (r.charAt(r.length-1) == ",")
                r = r.substr(0, r.length - 1);
            r += "}";
        }
        else if (type === '[object String]') {
            r += "\"" + json + "\"";
        }
        else if (type === '[object Number]') {
            r += json;
        }
        else {//Null
            r = "\"\"";
        }
        return r;
    }
})(jQuery);

String.prototype.GetNStr = function (nLen, nStr, fillChar) {
    if (nLen == null || typeof (nLen) != "number") n = 2;
    if (!fillChar) fillChar = '0';
    if (!nStr) nStr = ".";
    var str = this;
    if (this.indexOf(nStr) < 0)
        str = str + nStr;
    var strs = str.split(nStr);
    var tmp = "";
    for (var i = 0; i < nLen; i++) {
        if (strs[1].length <= tmp.length)
            tmp += fillChar;
        else
            tmp += strs[1].substring(i, i + 1);
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