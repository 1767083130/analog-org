/*更新记录
2013-08-16  取消对jQuery的linq支持





*/
(function (win, $) {
    win.Web = win.Web || {}; //定义Web名称空间
    win.console = win.console || { log: function () { } };
    with (win) {
        /**************************************************************
        //Web Linq
        **************************************************************/
        Web.Linq = Web.Linq || {};
        Web.Linq.ForEach = function (actionKV) {
            if (actionKV != null && typeof (actionKV) == "function") {
                if (this.length != null) {
                    var l = this.length;
                    var i = -1;
                    while (++i < l) {
                        actionKV(i, this[i]);
                    }
                }
                else {
                    for (var x in this) {
                        actionKV(x, this[x]);
                    }
                }
            }
            return this;
        }; //End ForEach
        Web.Linq.Where = function (predicateKV) {
            var rs = [];
            Web.Linq.ForEach.call(this, function (k, v) {
                if (predicateKV == null || predicateKV(k, v))
                    rs.push(v);
            });
            return rs;
        }; //End Where
        Web.Linq.First = function (predicateKV) {
            var rs = null;
            var l = this.length;
            if (l != null) {
                var i = -1;
                while (++i < l) {
                    var tmp = this[i];
                    if (predicateKV == null || predicateKV(i, tmp)) {
                        rs = tmp;
                        break;
                    }
                }
            }
            else {
                var it = this;
                for (var x in it) {
                    if (predicateKV == null || predicateKV(x, it[x])) {
                        rs = x;
                        break;
                    }
                }
            }
            return rs;
        }; //End First
        Web.Linq.Last = function (predicateKV) {
            var rs = null;
            var l = this.length;
            if (l != null) {
                while (--l >= 0) {
                    var tmp = this[l];
                    if (predicateKV == null || predicateKV(l, tmp)) {
                        rs = tmp;
                        break;
                    }
                }
            } else {
                var it = this;
                for (var x in it) {
                    if (predicateKV == null || predicateKV(x, it[x])) {
                        rs = x;
                        break;
                    }
                }
            }
            return rs;
        }; //End Last
        Web.Linq.RemoveAll = function (predicateKV) {
            var array = [], json = {};
            var isArray = _IsArray(this);
            var rs = Web.Linq.Where.call(this, function (k, v) { return !predicateKV(k, v); });
            if (isArray) {
                rs.ForEach(function (k, v) {
                    array.push(v);
                });
                return array;
            }
            else {
                rs.ForEach(function (k, v) {
                    json[k] = v;
                });
                return json;
            }
        }
        var _IsArray = function (obj) { return obj && Object.prototype.toString.call(obj) == "[object Array]"; };
        var _IsJson = function (obj) { return obj && Object.prototype.toString.call(obj) == "[object Object]"; };
        //        var _MyPush = function (obj) { this[this.length] = obj; };
        var _MyJsonPush = function (json, obj) { $.extend(json, obj); };
        var _MyArrayPush = function (array, json) {
            for (var x in json) {
                array.push(json[x]);
            }
        };
        Web.Linq.AddRange = function (array) {
            if (_IsArray(array)) {
                this.push = this.push;
                var l = array.length;
                for (var i = 0; i < l; i++) {
                    this.push(array[i]);
                }
            }
            else {
                var push = null;
                if (_IsArray(this))
                    push = _MyArrayPush;
                else
                    push = _MyJsonPush;
                push(this, array);
            }
            return this;
        };
        Web.Linq.SelectMany = function (predicateKV) {
            var rs = [];
            Web.Linq.ForEach.call(this, function (k, v) {
                Web.Linq.ForEach.call(v, function (x, y) {
                    if (predicateKV == null || predicateKV(x, y))
                        rs.push(y);
                });
            });
            return rs;
        };

        Array.prototype.Where = Web.Linq.Where;
        Array.prototype.First = Web.Linq.First;
        Array.prototype.Last = Web.Linq.Last;
        Array.prototype.ForEach = Web.Linq.ForEach;
        Array.prototype.AddRange = Web.Linq.AddRange;
        Array.prototype.SelectMany = Web.Linq.SelectMany;
        Array.prototype.RemoveAll = Web.Linq.RemoveAll;
        /**************************************************************
        //Web Ajax
        **************************************************************/
        function MyAjax(action, josnData, funcT, url, refreshedDom) {
            var self = this, $dom;
            self.Url = url || window.location.href;
            if (refreshedDom && (refreshedDom.length || refreshedDom.tagName))
                $dom = $(refreshedDom);
            self.request = function () {
                showLoading($dom, true);
                $.ajax({
                    url: self.Url,
                    data: $.extend({ _action: action }, josnData, { _isAjax: true }),
                    type: "post",
                    datatype: "json",
                    success: function (e) {
                        showLoading($dom, false);
                        if (funcT)
                            return funcT(e);
                    },
                    error: function (e) {
                        showLoading($dom, false);
                        window.console.log("请求错误 ，" + action);
                    }
                }); //aJax End
                return self;
            };
            function showLoading($dom, isShow) {
                if ($dom && $dom.length > 0) {
                    //TODO
                    var $p = $dom.parent(), $sp = $p.children(".salesPower"), $cover, $load;
                    if ($sp.length == 0) {
                        $cover = $("<div class='ui-widget-overlay salesPower'>")
                            .css("position", "absolute")
                            .width($dom.outerWidth())
                            .height($dom.outerHeight())
                            .position({ of: $dom, my: "left top", at: "left top" });
                        $p.append($cover);
                        var w = $cover.outerWidth()
                        , h = $cover.outerHeight()
                        , oL = $cover.offset().left
                        , oT = $cover.offset().top;
                        $load = $("<div class='dnnLoading salesPower'>")
                            .css({
                                "position": "absolute"
                                , "top": (oT + (h - 50) / 2)
                                , "left": (oL + (w - 50) / 2)
                            })
                        $p.append($load);
                    }
                    if (!isShow) {
                        $sp.hide();
                    }
                }
            }
            return self;
        }
        Web.AjaxHelper = {
            GetData: function (action, josnData, funcT, url, refreshedDom) {
                return new MyAjax(action, josnData, funcT, url, refreshedDom).request();
            }
        };
        /**************************************************************
        //Web Object Helper
        **************************************************************/

        Web.ObjectHelper = Web.ObjectHelper || {};
        Web.ObjectHelper.Clone = function (source) {
            var rs;
            if (source instanceof Array) {
                rs = [];
                source.ForEach(function (k, v) {
                    rs.push(Web.ObjectHelper.Clone(v));
                });
            }
            else if (source instanceof String) {
                rs = source;
            }
            else if (source instanceof Date) {
                rs = new Date(source);
            }
            else if (source instanceof Object) {
                rs = {};
                Web.Linq.ForEach.call(source, function (k, v) {
                    rs[k] = Web.ObjectHelper.Clone(v);
                });
            }
            else {
                rs = source;
            }
            return rs;
        }
        //End Web
    }

})(window, jQuery || $);

