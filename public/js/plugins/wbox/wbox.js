/**
* jQuery wBox plugin
* wBox是一个轻量级的弹出窗口jQuery插件，基于jQuery1.4.2开发，
* 主要实现弹出框的效果，并且加入了很多有趣的功能，比如可img灯箱效果，callback函数，显示隐藏层，Ajax页面，iframe嵌入页面等功能
* @name wBox
* @url http://www.linzl.com
*/
(function ($) {
    //class为.wBox_close为关闭
    $.fn.wBox = function (options) {
        var defaults = {
            wBoxURL: "wbox/",
            opacity: 0.5, //背景透明度
            callBack: null,
            noTitle: false,
            show: false,
            timeout: 0,
            target: null,
            requestType: null, //iframe,ajax,img
            title: "wBox Title",
            drag: true,
            showMark: true,
            showMinimize: true,
            closeAnimate: false, //关闭时的动画style。如{height: "50px", width: "50px", bottom: 900 },具体设置请参照jquery的animate方法
            autoPosition: true,
            status: 1, //初始状态，1，为正常；0为关闭；2为最小化
            position: {
                my: "center",
                at: "center",
                of: window,
                collision: "fit",
                // Ensure the titlebar is always visible
                using: function (pos) {
                    var topOffset = $(this).css(pos).offset().top;
                    if (topOffset < 0) {
                        $(this).css("top", pos.top - topOffset);
                    }
                }
            },
            onLoaded: null,
            beforeClose: null,
            onClose: null,
            onMinimizeWin: null,
            onRestoreWin: null,
            iframeWH: {//iframe 设置高宽
                width: 400,
                height: 300
            },
            html: ''//wBox内容
        }, _this = this;
        this.YQ = $.extend(defaults, options);

        var titleHtml = '<table class="wBox_title"><tr><td class="wBox_dragTitle"><div class="wBox_itemTitle">' + _this.YQ.title + '</div></td>';
        if (defaults.showMinimize) {
            titleHtml += '<td title="还原" style="display:none;" width="20"><div class="wBox_reset"></div></td><td title="最小化" width="20"><div class="wBox_minimize"></div></td>';
        }
        titleHtml += '<td width="20px" title="关闭"><div class="wBox_close"></div></td></tr></table>';

        var wBoxHtml = '<div id="wBox"><div class="wBox_popup"><table><tbody><tr><td class="wBox_tl"/><td class="wBox_b"/><td class="wBox_tr"/></tr><tr><td class="wBox_b"><div style="width:4px;">&nbsp;</div></td><td><div class="wBox_body">' + (_this.YQ.noTitle ? '' : titleHtml) +
        '<div class="wBox_content" id="wBoxContent"></div></div></td><td class="wBox_b"><div style="width:4px;">&nbsp;</div></td></tr><tr><td class="wBox_bl"/><td class="wBox_b"/><td class="wBox_br"/></tr></tbody></table></div></div>';
        var B = null, C = null, $win = $(window), $t = $(this); //B背景，C内容jquery div   
        this.showBox = function () {
            $("#wBox_overlay").remove();
            $("#wBox").remove();

            B = $("<div id='wBox_overlay' class='wBox_hide'></div>").hide().addClass('wBox_overlayBG').css('opacity', _this.YQ.opacity).dblclick(function () {
                //_this.close();
            }).appendTo('body').fadeIn(300);
            C = $(wBoxHtml).appendTo('body');
            handleClick();

            if (!defaults.showMark) {
                $("#wBox_overlay").remove();
            }

            $("#wBox .wBox_title .wBox_reset").click(function () {
                setStatus(1, true);
            });
            $("#wBox .wBox_title .wBox_minimize").click(function () {
                setStatus(2, true);
            });

            if (defaults.onLoaded) {
                defaults.onLoaded();
            }
            setStatus(defaults.status, false);
        }

        function setStatus(status, handleEvent) {
            if (status == 0) { //关闭
                if (defaults.beforeClose && handleEvent) {
                    defaults.beforeClose();
                }
                if (C) {
                    B.remove();
                    C.stop().fadeOut(300, function () {
                        //C.remove();
                    })
                }
                if (defaults.onClose && handleEvent) {
                    defaults.onClose();
                }
            }
            else if (status == 2) { //最小化
                $("#wBoxContent").slideUp("normal", function () {
                    $("#wBox .wBox_title .wBox_minimize").parent().hide();
                    $("#wBox .wBox_title .wBox_reset").parent().show();
                });

                if (defaults.onMinimizeWin && handleEvent) {
                    defaults.onMinimizeWin();
                }
            }
            else { //正常
                $("#wBoxContent").slideDown("normal", function () {
                    $("#wBox .wBox_title .wBox_reset").parent().hide();
                    $("#wBox .wBox_title .wBox_minimize").parent().show();
                });

                if (defaults.onRestoreWin && handleEvent) {
                    defaults.onRestoreWin();
                }
            }
        }

        /*
        * 处理点击
        * @param {string} what
        */
        function handleClick() {
            var con = C.find("#wBoxContent");
            if (_this.YQ.requestType && $.inArray(_this.YQ.requestType, ['iframe', 'ajax', 'img']) != -1) {
                con.html("<div class='wBox_load'><div id='wBox_loading'><img src='" + _this.YQ.wBoxURL + "loading.gif' /></div></div>");
                if (_this.YQ.requestType === "img") {
                    var img = $("<img />");
                    img.attr("src", _this.YQ.target);
                    img.load(function () {
                        img.appendTo(con.empty());
                        setPosition();
                    });
                }
                else
                    if (_this.YQ.requestType === "ajax") {
                        $.get(_this.YQ.target, function (data) {
                            con.html(data);
                            C.find('.wBox_close').click(_this.close);
                            setPosition();
                        })

                    }
                    else {
                        ifr = $("<iframe name='wBoxIframe' style='width:" + _this.YQ.iframeWH.width + "px;height:" + _this.YQ.iframeWH.height + "px;' scrolling='auto' frameborder='0' src='" + _this.YQ.target + "'></iframe>");
                        ifr.appendTo(con.empty());
                        ifr.load(function () {
                            try {
                                $it = $(this).contents();
                                $it.find('.wBox_close').click(_this.close);
                                fH = $it.height(); //iframe height
                                fW = $it.width();
                                w = $win;
                                newW = Math.min(w.width() - 40, fW);
                                newH = w.height() - 25 - (_this.YQ.noTitle ? 0 : 30);
                                newH = Math.min(newH, fH);
                                if (!newH)
                                    return;
                                var lt = calPosition(newW);
                                C.css({
                                    left: lt[0],
                                    top: lt[1]
                                });

                                $(this).css({
                                    height: newH,
                                    width: newW
                                });
                            }
                            catch (e) {
                            }
                        });
                    }

            }
            else {
                if (_this.YQ.target) {
                    $(_this.YQ.target).clone(true).show().appendTo(con.empty());

                }
                else {
                    if (_this.YQ.html) {
                        con.html(_this.YQ.html);
                    }
                    else {
                        //$t.clone(true).show().appendTo(con.empty());
                        $t.appendTo(con.empty());
                    }
                }
            }
            afterHandleClick();
        }
        /*
        * 处理点击之后的处理
        */
        function afterHandleClick() {
            setPosition();
            C.show().find('.wBox_close').click(_this.close).hover(function () {
                $(this).addClass("on");
            }, function () {
                $(this).removeClass("on");
            });
            $(document).unbind('keydown.wBox').bind('keydown.wBox', function (e) {
                if (e.keyCode === 27)
                    _this.close();
                return true
            });
            typeof _this.YQ.callBack === 'function' ? _this.YQ.callBack() : null;
            !_this.YQ.noTitle && _this.YQ.drag ? drag() : null;
            if (_this.YQ.timeout) {
                setTimeout(_this.close, _this.YQ.timeout);
            }

        }
        /*
        * 设置wBox的位置
        */
        function setPosition() {
            if (!C) {
                return false;
            }

            var width = C.width(), lt = calPosition(width);

            if ($(C).position) {
                $(C).position(defaults.position);
            }
            else {
                C.css({
                    left: lt[0],
                    top: lt[1]
                });
            }
            var $h = $("body").height(), $wh = $win.height(), $hh = $("html").height();
            $h = Math.max($h, $wh);
            B.height($h).width($win.width())
        }
        /*
        * 计算wBox的位置
        * @param {number} w 宽度
        */
        function calPosition(w) {
            l = ($win.width() - w) / 2;
            t = $win.scrollTop() + $win.height() / 9;
            return [l, t];
        }
        /*
        * 拖拽函数drag
        */
        function drag() {
            var dx, dy, moveout;
            var T = C.find('.wBox_dragTitle').css('cursor', 'move');
            T.bind("selectstart", function () {
                return false;
            });

            T.mousedown(function (e) {
                dx = e.clientX - parseInt(C.css("left"));
                dy = e.clientY - parseInt(C.css("top"));
                C.mousemove(move).mouseout(out).css('opacity', 0.8);
                T.mouseup(up);
            });
            /*
            * 移动改变生活
            * @param {Object} e 事件
            */
            function move(e) {
                moveout = false;
                if (e.clientX - dx < 0) {
                    l = 0;
                }
                else
                    if (e.clientX - dx > $win.width() - C.width()) {
                        l = $win.width() - C.width();
                    }
                    else {
                        l = e.clientX - dx
                    }
                C.css({
                    left: l,
                    top: e.clientY - dy
                });

            }
            /*
            * 你已经out啦！
            * @param {Object} e 事件
            */
            function out(e) {
                moveout = true;
                setTimeout(function () {
                    moveout && up(e);
                }, 10);
            }
            /*
            * 放弃
            * @param {Object} e事件
            */
            function up(e) {
                C.unbind("mousemove", move).unbind("mouseout", out).css('opacity', 1);
                T.unbind("mouseup", up);
            }
        }

        /*
        * 关闭弹出框就是移除还原
        */
        this.close = function () {
            setStatus(0, true);
        };

        /*
        * 触发click事件
        */
        $win.resize(function () {
            if (defaults.autoPosition) {
                setPosition();
            }
        });

        //        _this.YQ.show ? _this.showBox() : $t.click(function () {
        //            _this.showBox();
        //            return false;
        //        });

        $.fn.showBox = function () {
            _this.showBox();
            return false;
        };
        $.fn.close = function () {
            _this.close();
        };
        $.fn.setStatus = function (status) {
            _this.setStatus(status, true);
            return false;
        }
        return this;
    };
})(jQuery);
