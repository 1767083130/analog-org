/*
* Flexigrid for jQuery - New Wave Grid
*
* Copyright (c) 2008 Paulo P. Marinas (webplicity.net/flexigrid)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
*
* $Date: 2008-07-14 00:09:43 +0800 (Tue, 14 Jul 2008) $
*/
/// <reference path="../intellisense/jquery-1.2.6-vsdoc-cn.js" />
/// <reference path="../lib/blackbird.js" /> 
(function ($) {
    $.addFlex = function (t, p) {
        if (t.grid) return false; //如果Grid已经存在则返回
        // 引用默认属性
        p = $.extend({
            height: 300, //flexigrid插件的高度，单位为px
            width: 'auto', //宽度值，auto表示根据每列的宽度自动计算
            striped: true, //是否显示斑纹效果，默认是奇偶交互的形式
            novstripe: false,
            minwidth: 0, //列的最小宽度
            minheight: 80, //列的最小高度
            resizable: true, //resizable table是否可伸缩
            url: false, //ajax url,ajax方式对应的url地址
            method: 'POST', // data sending method,数据发送方式
            dataType: 'json', // type of data loaded,数据加载的类型，xml,json
            errormsg: '发生错误', //错误信息
            usepager: false, //是否分页
            nowrap: true, //是否不换行
            page: 1, //current page,默认当前页
            total: 1, //total pages,总页面数
            useRp: true, //use the results per page select box,是否可以动态设置每页显示的结果数
            rp: 25, // results per page,每页默认的结果数
            rpOptions: [10, 15, 20, 25, 40, 100], //可选择设定的每页结果数
            title: false, //是否包含标题
            pagestat: '显示记录从{from}到{to}，总数 {total} 条', //显示当前页和总页面的样式
            procmsg: '正在处理数据，请稍候 ...', //正在处理的提示信息
            query: '', //搜索查询的条件
            qtype: '', //搜索查询的类别
            qop: "Eq", //搜索的操作符
            nomsg: '没有符合条件的记录存在', //没有记录时的提示信息
            minColToggle: 1, //minimum allowed column to be hidden
            showToggleBtn: true, //show or hide column toggle popup
            hideOnSubmit: true, //显示遮盖
            showTableToggleBtn: true, //显示隐藏Grid 
            autoload: true, //自动加载
            blockOpacity: 0.5, //透明度设置
            onToggleCol: false, //当在行之间转换时
            onChangeSort: false, //当改变排序时
            onSuccess: false, //成功后执行
            onSubmit: false, // using a custom populate function,调用自定义的计算函数
            onInit: false, //初始化事件 //updated by webnuke 添加加载时执行的函数，可用于重新设置参数值。
            onLoaded: false, //加载完毕事件
            onCommand: false, //操作按钮点击事件
            showcheckbox: false, //是否显示checkbox    
            singleselected: false, //是否单选
            rowhandler: false, //是否启用行的扩展事情功能
            rowbinddata: true,
            selectedonclick: false, //点击行是否选中
            showOperateCell: true,  //是否显示操作列
            operateCellPosition: 'left', //显示操作列的位置。左边或右边。
            showContentMenu: true,
            extParam: [], //updated by webnuke {} ----> []
            //Style
            gridClass: "bbit-grid",
            onrowchecked: false
        }, p);


        $(t)
		.show() //show if hidden
		.attr({ cellPadding: 0, cellSpacing: 0, border: 0 })  //remove padding and spacing
		.removeAttr('width') //remove width properties	
		;

        //create grid class
        var g = {
            hset: {},
            rePosDrag: function () {

                var cdleft = 0 - this.hDiv.scrollLeft;
                if (this.hDiv.scrollLeft > 0) cdleft -= Math.floor(p.cgwidth / 2);

                $(g.cDrag).css({ top: g.hDiv.offsetTop + 1 });
                var cdpad = this.cdpad;

                $('div', g.cDrag).hide();
                //update by xuanye ,避免jQuery :visible 无效的bug
                var i = 0;
                $('thead tr:first th:visible', this.hDiv).each(function () {
                    if ($(this).css("display") == "none") {
                        return;
                    }
                    var n = i;
                    //var n = $('thead tr:first th:visible', g.hDiv).index(this);			 	  
                    var cdpos = parseInt($('div', this).width());
                    var ppos = cdpos;
                    if (cdleft == 0)
                        cdleft -= Math.floor(p.cgwidth / 2);

                    cdpos = cdpos + cdleft + cdpad;

                    $('div:eq(' + n + ')', g.cDrag).css({ 'left': cdpos + 'px' }).show();

                    cdleft = cdpos;
                    i++;
                }
				);

            },
            fixHeight: function (newH) {
                newH = false;
                if (!newH) newH = $(g.bDiv).height();
                var hdHeight = $(this.hDiv).height();
                $('div', this.cDrag).each(
						function () {
						    $(this).height(newH + hdHeight);
						}
					);

                var nd = parseInt($(g.nDiv).height());

                if (nd > newH)
                    $(g.nDiv).height(newH).width(200);
                else
                    $(g.nDiv).height('auto').width('auto');

                $(g.block).css({ height: newH, marginBottom: (newH * -1) });

                var hrH = g.bDiv.offsetTop + newH;
                if (p.height != 'auto' && p.resizable) hrH = g.vDiv.offsetTop;
                $(g.rDiv).css({ height: hrH });

            },
            dragStart: function (dragtype, e, obj) { //default drag function start

                if (dragtype == 'colresize') //column resize
                {
                    $(g.nDiv).hide(); $(g.nBtn).hide();
                    var n = $('div', this.cDrag).index(obj);
                    //var ow = $('th:visible div:eq(' + n + ')', this.hDiv).width();
                    var ow = $('th:visible:eq(' + n + ') div', this.hDiv).width();
                    $(obj).addClass('dragging').siblings().hide();
                    $(obj).prev().addClass('dragging').show();

                    this.colresize = { startX: e.pageX, ol: parseInt(obj.style.left), ow: ow, n: n };
                    $('body').css('cursor', 'col-resize');
                }
                else if (dragtype == 'vresize') //table resize
                {
                    var hgo = false;
                    $('body').css('cursor', 'row-resize');
                    if (obj) {
                        hgo = true;
                        $('body').css('cursor', 'col-resize');
                    }
                    this.vresize = { h: p.height, sy: e.pageY, w: p.width, sx: e.pageX, hgo: hgo };

                }

                else if (dragtype == 'colMove') //column header drag
                {
                    $(g.nDiv).hide(); $(g.nBtn).hide();
                    this.hset = $(this.hDiv).offset();
                    this.hset.right = this.hset.left + $('table', this.hDiv).width();
                    this.hset.bottom = this.hset.top + $('table', this.hDiv).height();
                    this.dcol = obj;
                    this.dcoln = $('th', this.hDiv).index(obj);

                    this.colCopy = document.createElement("div");
                    this.colCopy.className = "colCopy";
                    this.colCopy.innerHTML = obj.innerHTML;
                    if ($.browser.msie) {
                        this.colCopy.className = "colCopy ie";
                    }


                    $(this.colCopy).css({ position: 'absolute', float: 'left', display: 'none', textAlign: obj.align });
                    $('body').append(this.colCopy);
                    $(this.cDrag).hide();

                }

                $('body').noSelect();

            },
            reSize: function () {
                this.gDiv.style.width = p.width;
                this.bDiv.style.height = p.height;
            },
            dragMove: function (e) {

                if (this.colresize) //column resize
                {
                    var n = this.colresize.n;
                    var diff = e.pageX - this.colresize.startX;
                    var nleft = this.colresize.ol + diff;
                    var nw = this.colresize.ow + diff;
                    if (nw > p.minwidth) {
                        $('div:eq(' + n + ')', this.cDrag).css('left', nleft);
                        this.colresize.nw = nw;
                    }
                }
                else if (this.vresize) //table resize
                {
                    var v = this.vresize;
                    var y = e.pageY;
                    var diff = y - v.sy;
                    if (!p.defwidth) p.defwidth = p.width;
                    if (p.width != 'auto' && !p.nohresize && v.hgo) {
                        var x = e.pageX;
                        var xdiff = x - v.sx;
                        var newW = v.w + xdiff;
                        if (newW > p.defwidth) {
                            this.gDiv.style.width = newW + 'px';
                            p.width = newW;
                        }
                    }
                    var newH = v.h + diff;
                    if ((newH > p.minheight || p.height < p.minheight) && !v.hgo) {
                        this.bDiv.style.height = newH + 'px';
                        p.height = newH;
                        this.fixHeight(newH);
                    }
                    v = null;
                }
                else if (this.colCopy) {
                    $(this.dcol).addClass('thMove').removeClass('thOver');
                    if (e.pageX > this.hset.right || e.pageX < this.hset.left || e.pageY > this.hset.bottom || e.pageY < this.hset.top) {
                        //this.dragEnd();
                        $('body').css('cursor', 'move');
                    }
                    else
                        $('body').css('cursor', 'pointer');

                    $(this.colCopy).css({ top: e.pageY + 10, left: e.pageX + 20, display: 'block' });
                }

            },
            dragEnd: function () {
                if (this.colresize) {
                    var n = this.colresize.n;
                    var nw = this.colresize.nw;
                    //$('th:visible div:eq(' + n + ')', this.hDiv).css('width', nw);
                    $('th:visible:eq(' + n + ') div', this.hDiv).css('width', nw);

                    $('tr', this.bDiv).each(
									function () {
									    //$('td:visible div:eq(' + n + ')', this).css('width', nw);
									    $('td:visible:eq(' + n + ') div', this).css('width', nw);
									}
								);
                    this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                    $('div:eq(' + n + ')', this.cDrag).siblings().show();
                    $('.dragging', this.cDrag).removeClass('dragging');
                    this.rePosDrag();
                    this.fixHeight();
                    this.colresize = false;
                }
                else if (this.vresize) {
                    this.vresize = false;
                }
                else if (this.colCopy) {
                    $(this.colCopy).remove();
                    if (this.dcolt != null) {
                        if (this.dcoln > this.dcolt)
                        { $('th:eq(' + this.dcolt + ')', this.hDiv).before(this.dcol); }
                        else
                        { $('th:eq(' + this.dcolt + ')', this.hDiv).after(this.dcol); }
                        this.switchCol(this.dcoln, this.dcolt);
                        $(this.cdropleft).remove();
                        $(this.cdropright).remove();
                        this.rePosDrag();
                    }
                    this.dcol = null;
                    this.hset = null;
                    this.dcoln = null;
                    this.dcolt = null;
                    this.colCopy = null;
                    $('.thMove', this.hDiv).removeClass('thMove');
                    $(this.cDrag).show();
                }
                $('body').css('cursor', 'default');
                $('body').noSelect(false);
            },
            toggleCol: function (cid, visible) {
                var ncol = $("th[axis='col" + cid + "']", this.hDiv)[0];
                var n = $('thead th', g.hDiv).index(ncol);
                var cb = $('input[value=' + cid + ']', g.nDiv)[0];
                if (visible == null) {
                    visible = ncol.hide;
                }
                if ($('input:checked', g.nDiv).length < p.minColToggle && !visible) return false;
                if (visible) {
                    ncol.hide = false;
                    $(ncol).show();
                    cb.checked = true;
                }
                else {
                    ncol.hide = true;
                    $(ncol).hide();
                    cb.checked = false;
                }
                $('tbody tr', t).each
							(
								function () {
								    if (visible)
								        $('td:eq(' + n + ')', this).show();
								    else
								        $('td:eq(' + n + ')', this).hide();
								}
							);
                this.rePosDrag();
                if (p.onToggleCol) p.onToggleCol(cid, visible);
                return visible;
            },
            switchCol: function (cdrag, cdrop) { //switch columns
                $('tbody tr', t).each
					(
						function () {
						    if (cdrag > cdrop)
						        $('td:eq(' + cdrop + ')', this).before($('td:eq(' + cdrag + ')', this));
						    else
						        $('td:eq(' + cdrop + ')', this).after($('td:eq(' + cdrag + ')', this));
						}
					);
                //switch order in nDiv
                if (cdrag > cdrop)
                    $('tr:eq(' + cdrop + ')', this.nDiv).before($('tr:eq(' + cdrag + ')', this.nDiv));
                else
                    $('tr:eq(' + cdrop + ')', this.nDiv).after($('tr:eq(' + cdrag + ')', this.nDiv));
                if ($.browser.msie && $.browser.version < 7.0) $('tr:eq(' + cdrop + ') input', this.nDiv)[0].checked = true;
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
            },
            scroll: function () {
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                this.rePosDrag();
            },

            //updated by webnuke 2010.06.05 
            showLoading: function (hideOnSubmit) {//多次使用，用一个函数
                this.loading = true;
                if (!p.url) return false;
                $('.pPageStat', this.pDiv).html(p.procmsg);
                $('.pReload', this.pDiv).addClass('loading');
                $(g.block).css({ top: g.bDiv.offsetTop });
                if (hideOnSubmit) $(this.gDiv).prepend(g.block); //$(t).hide();
                if ($.browser.opera) $(t).css('visibility', 'hidden');
            },
            //end updated
            operateCallBack: function (commandName, rowIndexs) {
                g.showLoading(true);

                var param = [
					                 { name: 'page', value: p.newp }
					                , { name: 'rp', value: p.rp }
					                , { name: 'sortname', value: p.sortname }
					                , { name: 'sortorder', value: p.sortorder }
					                , { name: 'query', value: p.query }
					                , { name: 'qtype', value: p.qtype }
					                , { name: 'qop', value: p.qop }
					                , { name: 'oper', value: commandName }
					                , { name: 'id', value: rowIndexs }
					            ];
                //param = jQuery.extend(param, p.extParam);
                if (p.extParam) {
                    for (var pi = 0; pi < p.extParam.length; pi++) param[param.length] = p.extParam[pi];
                }

                var purl = p.url + (p.url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();
                $.ajax({
                    type: p.method,
                    url: purl,
                    data: param,
                    dataType: p.dataType,
                    success: function (data) {
                        g.hideLoading();
                        g.populate();

                        var headcheck = $("input[name='headcheck']").get(0);
                        if (headcheck) {
                            $("input[name='headcheck']").get(0).checked = false; //清除头部复选框选中状态
                        }
                    },
                    error: function (data) {
                        debugger
                        try {
                            if (p.onError) {
                                p.onError(data);
                            }
                            g.hideLoading();
                        }
                        catch (e) { }
                    }
                });
            },

            hideLoading: function () {
                $('.pReload', this.pDiv).removeClass('loading');
                if (p.hideOnSubmit) $(g.block).remove();
                $('.pPageStat', this.pDiv).html(p.errormsg);
                this.loading = false;
            }
            ,
            addData: function (data) { //parse data    
                if (p.preProcess)
                { data = p.preProcess(data); }
                $('.pReload', this.pDiv).removeClass('loading');
                this.loading = false;

                //updated by webnuke
                p.data = data;
                //end updated

                if (!data) {
                    $('.pPageStat', this.pDiv).html(p.errormsg);
                    return false;
                }
                var temp = p.total;
                if (p.dataType == 'xml') {
                    p.total = +$('rows total', data).text();
                }
                else {
                    p.total = data.total;
                }
                if (p.total < 0) {
                    p.total = temp;
                }
                if (p.total == 0) {
                    $('tr, a, td, div', t).unbind();
                    $(t).empty();
                    p.pages = 1;
                    p.page = 1;
                    this.buildpager();
                    $('.pPageStat', this.pDiv).html(p.nomsg);
                    if (p.hideOnSubmit) $(g.block).remove();
                    return false;
                }

                p.pages = Math.ceil(p.total / p.rp);

                if (p.dataType == 'xml')
                { p.page = +$('rows page', data).text(); }
                else
                { p.page = data.page; }
                this.buildpager();



                var ths = $('thead tr:first th', g.hDiv);
                var thsdivs = $('thead tr:first th div', g.hDiv);
                var tbhtml = [];
                tbhtml.push("<tbody>");
                if (p.dataType == 'json') {
                    if (data.rows != null) {
                        $.each(data.rows, function (i, row) {
                            tbhtml.push("<tr id='", "row", row.id, "'");

                            if (i % 2 && p.striped) {
                                tbhtml.push(" class='erow'");
                            }
                            if (p.rowbinddata) {
                                tbhtml.push("ch='", row.cell.join("_FG$SP_"), "'");
                            }
                            tbhtml.push(">");
                            var trid = row.id;
                            $(ths).each(function (j) {
                                var tddata = "";
                                var tdclass = "";
                                var idx = $(this).attr('axis0').substr(3);

                                //updated by webnuke
                                var col = p.colModel[idx]; //单元格所属列
                                if (col && !col.visible) {
                                    return;
                                }
                                //end updated

                                tbhtml.push("<td align='", this.align, "'");

                                if (p.sortname && p.sortname == $(this).attr('abbr')) {
                                    tdclass = 'sorted';
                                }
                                if (this.hide) {
                                    tbhtml.push(" style='display:none;'");
                                }
                                var width = thsdivs[j].style.width;
                                var div = [];
                                div.push("<div style='text-align:", this.align, ";width:", width, ";");
                                if (p.nowrap == false) {
                                    div.push("white-space:normal");
                                }

                                div.push("'>");
                                if (idx == "-1") { //checkbox
                                    div.push("<input type='checkbox' id='chk_", row.id, "' class='itemchk' dataValue='", row.id, "'/>");
                                    if (tdclass != "") {
                                        tdclass += " chboxtd";
                                    } else {
                                        tdclass += "chboxtd";
                                    }
                                }
                                //updated by webnuke
                                else if (idx == "-2") { //操作列
                                    if (row.operateCell) {
                                        $(row.operateCell).each(function (i, operateBtn) {
                                            div.push('<span class="obutton" commandName="', this.commandName, '"', ' dataValue="', row.id, '"');
                                            div.push(' eventType=', this.eventType);
                                            if (this.action) div.push(' action=', this.action)
                                            if (this.redirectPageUrl) div.push(' redirectPageUrl=', this.redirectPageUrl);
                                            div.push(">");

                                            if (this.icon && $.trim(this.icon) != "") {
                                                div.push('<span><img src="', this.icon, '" border=0 /></span>');
                                            }
                                            div.push('<span><a>', this.text, '</a></span></span>');
                                        });
                                    }
                                    else {
                                        div.push("<span></span>");
                                    }
                                }

                                else {
                                    var cell = row.cell[idx];
                                    var divInner = cell.cellHtml || "&nbsp;";
                                    if (this.process) {
                                        divInner = this.process(divInner, trid);
                                    }

                                    if (col.type == 1) { //如果是状态列 //public enum FlexiGridViewFieldType { Bound = 0,Status = 1,TextBox = 2}
                                        div.push('<span class="obutton" commandName="', col.commandName, '"', ' dataValue="', row.id, '"');
                                        div.push(' eventType=2 '); //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                                        div.push(">");

                                        var icon = (cell.status == 1) ? col.trueStatusIcon : col.falseStatusIcon;
                                        if (icon && col.showIcon && $.trim(icon) != "") {
                                            div.push('<span><img src="', icon, '" alt="', cell.cellHtml, '" border=0 /></span>');
                                        }
                                        if (cell.cellHtml && col.showInnerHtml && $.trim(cell.cellHtml) != "") {
                                            div.push('<span><a>', cell.cellHtml, '</a></span>');
                                        }

                                        div.push('</span>');
                                    }
                                    else if (col.type == 2) { //可编辑的TextBox列
                                        var isReadOnly = (col.isReadOnly ? 1 : 0);
                                        if (!isReadOnly) {
                                            isReadOnly = cell.isReadOnly ? 1 : 0;
                                        }

                                        var isRequiredField = (col.isRequiredField ? 1 : 0);
                                        //isReadOnly,regexValue,showEmptyMessage,showUnValidMessage
                                        div.push('<span class="oEdit" commandName="', col.commandName, '"', ' dataValue="', row.id, '"');
                                        div.push(' eventType=2 ', ' isReadOnly= ', isReadOnly, ' regexValue="', col.regexValue, '"  showEmptyMessage="'
                                                   , col.showEmptyMessage, '" showUnValidMessage="', col.showUnValidMessage, '" isRequiredField="', col.isRequiredField, '"'); //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                                        div.push(">");
                                        div.push(divInner);
                                        div.push("</span>");
                                    }
                                    //                                    else if (col.type = 3) {  //图片列 todo
                                    //                                        div.push('<span class="obutton" commandName="', col.commandName, '"', ' dataValue="', row.id, '"');
                                    //                                        div.push(' eventType=2 '); //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                                    //                                        div.push(">");

                                    //                                        var icon = col.imageUrl;
                                    //                                        if (icon && col.showImage && $.trim(icon) != "") {
                                    //                                            div.push('<span><img src="', icon, '" alt="', cell.cellHtml, '" border=0 /></span>');
                                    //                                        }
                                    //                                        if (cell.cellHtml && col.showInnerHtml && $.trim(cell.cellHtml) != "") {
                                    //                                            div.push('<span><a>', cell.cellHtml, '</a></span>');
                                    //                                        }

                                    //                                        div.push('</span>');
                                    //                                    }
                                    else { //绑定列
                                        div.push(divInner);
                                    }

                                    //end updated
                                }

                                div.push("</div>");
                                if (tdclass != "") {
                                    tbhtml.push(" class='", tdclass, "'");
                                }
                                tbhtml.push(">", div.join(""), "</td>");
                            });
                            tbhtml.push("</tr>");
                        });
                    }
                }
                else if (p.dataType == 'xml') { //todo 暂不支持xml 
                    i = 1;
                    $("rows row", data).each(function () {
                        i++;
                        var robj = this;
                        var arrdata = new Array();
                        $("cell", robj).each(function () {
                            arrdata.push($(this).text());
                        });
                        var nid = $(this).attr('id');
                        tbhtml.push("<tr id='", "row", nid, "'");
                        if (i % 2 && p.striped) {
                            tbhtml.push(" class='erow'");
                        }
                        if (p.rowbinddata) {
                            tbhtml.push("ch='", arrdata.join("_FG$SP_"), "'");
                        }
                        tbhtml.push(">");
                        var trid = nid;
                        $(ths).each(function (j) {
                            tbhtml.push("<td align='", this.align, "'");
                            if (this.hide) {
                                tbhtml.push(" style='display:none;'");
                            }
                            var tdclass = "";
                            var tddata = "";
                            var idx = $(this).attr('axis0').substr(3);

                            if (p.sortname && p.sortname == $(this).attr('abbr')) {
                                tdclass = 'sorted';
                            }
                            var width = thsdivs[j].style.width;

                            var div = [];
                            div.push("<div style='text-align:", this.align, ";width:", width, ";");
                            if (p.nowrap == false) {
                                div.push("white-space:normal");
                            }
                            div.push("'>");

                            if (idx == "-1") { //checkbox
                                div.push("<input type='checkbox' id='chk_", nid, "' class='itemchk' value='", nid, "'/>");
                                if (tdclass != "") {
                                    tdclass += " chboxtd";
                                } else {
                                    tdclass += "chboxtd";
                                }
                            }
                            else {
                                var divInner = arrdata[idx] || "&nbsp;";
                                if (p.rowbinddata) {
                                    tddata = arrdata[idx] || "";
                                }
                                if (this.process) {
                                    divInner = this.process(divInner, trid);
                                }
                                div.push(divInner);
                            }
                            div.push("</div>");
                            if (tdclass != "") {
                                tbhtml.push(" class='", tdclass, "'");
                            }
                            tbhtml.push(" axis='", tddata, "'", ">", div.join(""), "</td>");
                        });
                        tbhtml.push("</tr>");
                    }
				);

                }
                tbhtml.push("</tbody>");
                $(t).html(tbhtml.join(""));

                //this.rePosDrag();
                this.addRowProp();
                if (p.onSuccess) p.onSuccess();
                if (p.hideOnSubmit) $(g.block).remove(); //$(t).show();
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                if ($.browser.opera) $(t).css('visibility', 'visible');

            },
            changeSort: function (th) { //change sortorder

                if (this.loading) return true;

                $(g.nDiv).hide(); $(g.nBtn).hide();

                if (p.sortname == $(th).attr('abbr')) {
                    if (p.sortorder == 'asc') p.sortorder = 'desc';
                    else p.sortorder = 'asc';
                }

                $(th).addClass('sorted').siblings().removeClass('sorted');
                $('.sdesc', this.hDiv).removeClass('sdesc');
                $('.sasc', this.hDiv).removeClass('sasc');
                $('div', th).addClass('s' + p.sortorder);
                p.sortname = $(th).attr('abbr');

                if (p.onChangeSort)
                    p.onChangeSort(p.sortname, p.sortorder);
                else
                    this.populate();

            },
            buildpager: function () { //rebuild pager based on new properties

                $('.pcontrol input', this.pDiv).val(p.page);
                $('.pcontrol span', this.pDiv).html(p.pages);

                var r1 = (p.page - 1) * p.rp + 1;
                var r2 = r1 + p.rp - 1;

                if (p.total < r2) r2 = p.total;

                var stat = p.pagestat;

                stat = stat.replace(/{from}/, r1);
                stat = stat.replace(/{to}/, r2);
                stat = stat.replace(/{total}/, p.total);
                $('.pPageStat', this.pDiv).html(stat);
            },
            populate: function (isInit) { //get latest data  //updated by webnuke  add param

                if (this.loading) return true;
                if (p.onSubmit) {
                    var gh = p.onSubmit();
                    if (!gh) return false;
                }

                g.showLoading(p.hideOnSubmit);

                if (!p.newp) p.newp = 1;
                if (p.page > p.pages) p.page = p.pages;
                //var param = {page:p.newp, rp: p.rp, sortname: p.sortname, sortorder: p.sortorder, query: p.query, qtype: p.qtype};
                var param = [
					 { name: 'page', value: p.newp }
					, { name: 'rp', value: p.rp }
					, { name: 'sortname', value: p.sortname }
					, { name: 'sortorder', value: p.sortorder }
					, { name: 'query', value: p.query }
					, { name: 'qtype', value: p.qtype }
					, { name: 'qop', value: p.qop }
				];
                //param = jQuery.extend(param, p.extParam);
                if (p.extParam) {
                    for (var pi = 0; pi < p.extParam.length; pi++) param[param.length] = p.extParam[pi];
                }
                var purl = p.url + (p.url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();
                $.ajax({
                    type: p.method,
                    url: purl,
                    data: param,
                    dataType: p.dataType,
                    success: function (data) {
                        if (data != null && data.error != null) {
                            if (p.onError) { p.onError(data); g.hideLoading(); }
                        }
                        else {
                            g.addData(data);
                        }
                        //updated by webnuke
                        if (isInit && p.onLoaded) {
                            p = p.onLoaded(p);
                        }
                        //end updated
                    },
                    error: function (data) {
                        try {
                            if (p.onError) {
                                p.onError(data);
                            }
                            g.hideLoading();
                        }
                        catch (e) { }
                    }
                });
            },
            doSearch: function () {
                var queryType = $('select[name=qtype]', g.sDiv).val();
                var qArrType = queryType.split("$");
                var index = -1;
                if (qArrType.length != 3) {
                    p.qop = "Eq";
                    p.qtype = queryType;
                }
                else {
                    p.qop = qArrType[1];
                    p.qtype = qArrType[0];
                    index = parseInt(qArrType[2]);
                }
                p.query = $('input[name=q]', g.sDiv).val();
                //添加验证代码
                if (p.query != "" && p.searchitems && index >= 0 && p.searchitems.length > index) {
                    if (p.searchitems[index].reg) {
                        if (!p.searchitems[index].reg.test(p.query)) {
                            alert("您的输入不符合要求!");
                            return;
                        }
                    }
                }
                p.newp = 1;
                this.populate();
            },
            changePage: function (ctype) { //change page

                if (this.loading) return true;

                switch (ctype) {
                    case 'first': p.newp = 1; break;
                    case 'prev': if (p.page > 1) p.newp = parseInt(p.page) - 1; break;
                    case 'next': if (p.page < p.pages) p.newp = parseInt(p.page) + 1; break;
                    case 'last': p.newp = p.pages; break;
                    case 'input':
                        var nv = parseInt($('.pcontrol input', this.pDiv).val());
                        if (isNaN(nv)) nv = 1;
                        if (nv < 1) nv = 1;
                        else if (nv > p.pages) nv = p.pages;
                        $('.pcontrol input', this.pDiv).val(nv);
                        p.newp = nv;
                        break;
                }

                if (p.newp == p.page) return false;

                if (p.onChangePage)
                    p.onChangePage(p.newp);
                else
                    this.populate();

            },
            cellProp: function (n, ptr, pth) {
                var tdDiv = document.createElement('div');
                if (pth != null) {
                    if (p.sortname == $(pth).attr('abbr') && p.sortname) {
                        this.className = 'sorted';
                    }
                    $(tdDiv).css({ textAlign: pth.align, width: $('div:first', pth)[0].style.width });
                    if (pth.hide) $(this).css('display', 'none');
                }
                if (p.nowrap == false) $(tdDiv).css('white-space', 'normal');

                if (this.innerHTML == '') this.innerHTML = '&nbsp;';

                //tdDiv.value = this.innerHTML; //store preprocess value
                tdDiv.innerHTML = this.innerHTML;

                var prnt = $(this).parent()[0];
                var pid = false;
                if (prnt.id) pid = prnt.id.substr(3);
                if (pth != null) {
                    if (pth.process)
                    { pth.process(tdDiv, pid); }
                }
                $("input.itemchk", tdDiv).each(function () {
                    $(this).click(function () {
                        if (this.checked) {
                            $(ptr).addClass("trSelected");
                        }
                        else {
                            $(ptr).removeClass("trSelected");
                        }
                        if (p.onrowchecked) {
                            p.onrowchecked.call(this);
                        }
                    });
                });
                $(this).empty().append(tdDiv).removeAttr('width'); //wrap content
                //add editable event here 'dblclick',如果需要可编辑在这里添加可编辑代码 
            },
            addCellProp: function () {
                var $gF = this.cellProp;

                $('tbody tr td', g.bDiv).each
					(
						function () {
						    var n = $('td', $(this).parent()).index(this);
						    var pth = $('th:eq(' + n + ')', g.hDiv).get(0);
						    var ptr = $(this).parent();
						    $gF.call(this, n, ptr, pth);
						}
					);
                $gF = null;
            },
            getCheckedRows: function () {
                var ids = [];
                $("input.itemchk:checked", g.bDiv).each(function () {
                    ids.push($(this).attr("dataValue"));
                });
                return ids;
            },
            getSelectedRows: function () {
                var items = [];
                //if (!p.rowbinddata) {
                //    alert("请将属性rowbinddata设置为true");
                //}
                //$("tr.trSelected", g.bDiv).each(function () {
                //    debugger
                //    items.push($(this).attr("CH").split('_FG$SP_'));
                //});

                var checkedRows = this.getCheckedRows();
                $(p.data.rows).each(function () {
                    for (var i = 0; i < checkedRows.length; i++) {
                        if (checkedRows[i] == this.id) {
                            items.push(this);
                        }
                    }
                });

                return items;
            },
            getCellDim: function (obj) // get cell prop for editable event
            {
                var ht = parseInt($(obj).height());
                var pht = parseInt($(obj).parent().height());
                var wt = parseInt(obj.style.width);
                var pwt = parseInt($(obj).parent().width());
                var top = obj.offsetParent.offsetTop;
                var left = obj.offsetParent.offsetLeft;
                var pdl = parseInt($(obj).css('paddingLeft'));
                var pdt = parseInt($(obj).css('paddingTop'));
                return { ht: ht, wt: wt, top: top, left: left, pdl: pdl, pdt: pdt, pht: pht, pwt: pwt };
            },
            rowProp: function () {
                if (p.rowhandler) {
                    p.rowhandler(this);
                }

                //updated by webnuke 2010.6.6 添加菜单项 todo
                //if (p.menu) {
                //    $(this).contextmenu(p.menu);
                //}
                //end updated 

                if ($.browser.msie && $.browser.version < 7.0) {
                    $(this).hover(function () { $(this).addClass('trOver'); }, function () { $(this).removeClass('trOver'); });
                }
            },

            //updated by webnuke 2010.6.6 菜单项点击事件 todo
            menuItemClick: function (target, e) {
                var operateBtn;
                var rowIndex = $(target).attr("id").substr(3);

                if (p.data && p.data.rows && p.data.rows[rowIndex] && p.data.rows[rowIndex].contextMenu) {
                    var items = p.data.rows[rowIndex].contextMenu;
                    for (var j = 0; j < items.length; j++) {
                        var item = items[j];
                        if (item.commandName == this.data.commandName && item.alias == this.data.alias) {
                            operateBtn = item;
                            operateBtn.value = rowIndex;
                            break;
                        }
                    }
                }

                if (operateBtn) {
                    p.extParam = []; //updated by webnuke {} ----> []
                    g.handleButtonEvent(operateBtn);
                }
            },

            handleButtonEvent: function (operateBtn) {
                var eventType = $(operateBtn).attr("eventType");
                var redirectPageUrl = $(operateBtn).attr("redirectPageUrl");
                var btnValue = $(operateBtn).attr("dataValue");
                var commandName = $(operateBtn).attr("commandName");
                var action = $(operateBtn).attr("action");

                if (eventType == 2) { //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                    var isSure = true;
                    if (!btnValue || btnValue.length < 1) {
                        alert("请选择要操作的项。");
                        return;
                    }

                    if (commandName == "delete") {
                        isSure = confirm("您确认要删除吗?")
                    }

                    if (isSure) {
                        g.operateCallBack(commandName, btnValue);
                    }
                }
                else if (eventType == 0) {
                    if (action) {
                        action.call(g);
                    }
                    //                    if (p.onCommand) {
                    //                        p.onCommand(operateBtn, 1);
                    //                    }
                }
                else if (eventType == 1 && redirectPageUrl) {
                    document.location.href = redirectPageUrl;
                }
            },
            //end updated
            checkhandler: function () {
                var $t = $(this);
                var $ck = $("input.itemchk", this);
                if (p.singleselected) {
                    $t.parent().find("tr.trSelected").each(function (e) {
                        if (this != $t[0]) {
                            $(this).removeClass("trSelected");
                        }
                        $("input.itemchk", this).each(function (e) { this.checked = false; });
                    });
                }
                if ($t.hasClass("trSelected")) {
                    $ck.length > 0 && ($ck[0].checked = false);
                    $t.removeClass("trSelected");
                }
                else {
                    $ck.length > 0 && ($ck[0].checked = true);
                    $t.addClass("trSelected");
                }
            },
            addRowProp: function () {
                var $gF = this.rowProp;
                var $cf = this.checkhandler;
                $('tbody tr', g.bDiv).each(function (i) {
                    if (p.showcheckbox) {
                        $("input.itemchk", this).each(function () {
                            $(this).click(function (e) {
                                var ptr = $(this).parent().parent().parent();
                                $cf.call(ptr);
                                if (p.onrowchecked) {
                                    p.onrowchecked.call(this);
                                }
                                e.stopPropagation();
                            });
                        });
                    }
                    if (p.selectedonclick) //点击切换选中状态
                    {
                        $(this).click($cf);
                    }
                    $gF.call(this);

                    //updated by webnuke  

                    //处理操作列
                    $("span.obutton", this).each(function () {
                        $(this).click(function (e) {
                            p.extParam = []; //updated by webnuke {} ----------->[]
                            g.handleButtonEvent(this);
                            //updated by webnuke 添加点击事件外部处理
                            if (p.onCommand) {
                                p.onCommand(this, 2);
                            }
                            //end updated
                            e.stopPropagation();
                        })
                    });

                    $("span.oEdit", this).each(function () {
                        $(this).click(function (e) { //TODO
                            var isReadOnly = $(this).attr("isReadOnly");
                            if (isReadOnly == 1) { return; } //如果只读则返回

                            var _this = this;
                            var eventType = $(this).attr("eventType");
                            var commandName = $(this).attr("commandName");
                            var dataValue = $(this).attr("dataValue");
                            var txtValue = $(this).html();
                            if (txtValue == "&nbsp;") {
                                txtValue = "";
                            }

                            var isReadOnly = ($(this).attr("isReadOnly") == 1);
                            var regexValue = $(this).attr("regexValue");
                            var showEmptyMessage = $(this).attr("showEmptyMessage");
                            var showUnValidMessage = $(this).attr("showUnValidMessage");
                            var isRequiredField = $(this).attr("isRequiredField");

                            var builder = [];
                            builder.push('<input type="text" class="oTextBox" eventType=', eventType) //value="1234"
                            builder.push(' value="', txtValue, '" ');
                            builder.push(' commandName="', commandName, '" ');
                            builder.push(' dataValue="', dataValue, '" ');
                            builder.push(' oldValue="', txtValue, '" ');
                            builder.push(' isReadOnly="', isReadOnly, '" ');
                            builder.push(' regexValue="', regexValue, '" ');
                            builder.push(' showEmptyMessage="', showEmptyMessage, '" ');
                            builder.push(' showUnValidMessage="', showUnValidMessage, '" ');
                            builder.push(' isRequiredField="', isRequiredField, '" ');
                            builder.push('/>');
                            var ctlEdit = builder.join("");
                            $(this).html(ctlEdit);
                            $("input.oTextBox", this).focus();

                            $("input.oTextBox", this).blur(function (e) {
                                var newValue = $.trim($(this).val());
                                var oldValue = $(this).attr("oldValue");

                                if (newValue != oldValue) { //如果已作更改，则提交
                                    //数据校验
                                    //isReadOnly,regexValue,showEmptyMessage,showUnValidMessage
                                    var isReadOnly = ($(this).attr("isReadOnly") == 1);
                                    var regexValue = $(this).attr("regexValue");
                                    var showEmptyMessage = $(this).attr("showEmptyMessage");
                                    var showUnValidMessage = $(this).attr("showUnValidMessage");
                                    var isRequiredField = $(this).attr("isRequiredField");
                                    var blnIsOk = true;
                                    if (isRequiredField) {
                                        blnIsOk = (newValue && newValue != "");
                                        if (!blnIsOk) {
                                            if (showEmptyMessage) {
                                                alert(showEmptyMessage);
                                            }

                                            var divInner = oldValue || "&nbsp;";
                                            $(_this).html(divInner);
                                            return;
                                        }
                                    }

                                    if (regexValue) {
                                        blnIsOk = (new RegExp(regexValue, "i")).test(newValue);
                                        if (!blnIsOk) {
                                            if (showUnValidMessage) {
                                                alert(showUnValidMessage);
                                            }

                                            var divInner = oldValue || "&nbsp;";
                                            $(_this).html(divInner);
                                            return;
                                        }
                                    }

                                    p.extParam = [
					                     { name: 'newArgs', value: newValue }
                                    //, { name: 'oldArgs', value: p.rp }
					                ];
                                    //执行服务器方法
                                    g.handleButtonEvent(this);
                                }

                                var divInner = newValue || "&nbsp;";
                                $(_this).html(divInner);

                            }).dblclick(function (e) {
                                e.stopPropagation();
                            }).click(function (e) {
                                e.stopPropagation();
                            });
                            //g.handleButtonEvent(this);
                            e.stopPropagation();
                        }).click(function (e) {
                            e.stopPropagation();
                        }).mouseover(function (e) {
                            e.stopPropagation();
                            var isReadOnly = ($(this).attr("isReadOnly") == 1);
                            if (!isReadOnly) {//如果只读则返回
                                this.className += ' oEditHover';
                            }
                        }).mouseout(function (e) {
                            e.stopPropagation();
                            var isReadOnly = ($(this).attr("isReadOnly") == 1);
                            if (!isReadOnly) {//如果只读则返回
                                this.className = this.className.replace(/\s*oEditHover\s*/, '');
                            }
                        });
                    });

                    //浮动菜单
                    if (p.data && p.data.rows && p.data.rows[i] && p.data.rows[i].contextMenu) {
                        var menu = new Object();
                        menu.alias = "menu_" + i;
                        menu.items = p.data.rows[i].contextMenu;
                        if (p.menu && p.menu.width) { //宽度
                            menu.width = p.menu.width;
                        }

                        if (menu.items) {
                            $(menu.items).each(function () {
                                this.oldAction = this.action;
                                this.action = g.menuItemClick;
                            });
                        }

                        $(this).contextmenu(menu);
                    }
                    //end updated
                });

                $gF = null;
            },
            checkAllOrNot: function (parent) {
                var ischeck = $(this).attr("checked");
                $('tbody tr', g.bDiv).each(function () {
                    if (ischeck) {
                        $(this).addClass("trSelected");
                    }
                    else {
                        $(this).removeClass("trSelected");
                    }
                });
                $("input.itemchk", g.bDiv).each(function () {
                    this.checked = ischeck;
                    //Raise Event
                    if (p.onrowchecked) {
                        p.onrowchecked.call(this);
                    }
                });
            },
            pager: 0
        };

        if (p.onInit) {
            p = p.onInit(p);
        }

        //create model if any
        if (p.colModel) {
            thead = document.createElement('thead');
            tr = document.createElement('tr');
            //p.showcheckbox ==true;
            if (p.showcheckbox) {
                var cth = jQuery('<th/>');
                var cthch = jQuery('<input type="checkbox" name="headcheck"/>');
                cthch.addClass("noborder");
                if (p.singleselected) {
                    cthch.attr("disabled", true).css("visibility", "hidden");
                }
                cth.addClass("cth").attr({ 'axis': "col-1", 'axis0': "col-1", width: "15", "isch": true }).append(cthch);
                $(tr).append(cth);
            }

            //updated by webnuke 2010.6.6
            //            if (p.operateCell && p.operateCell.position == "left") {
            //                var th = generateOperateCell();
            //                if (th) $(tr).append(th);
            //            }
            //end updated

            for (i = 0; i < p.colModel.length; i++) {
                var cm = p.colModel[i];

                //updated by webnuke
                if (cm && !cm.visible) {
                    continue;
                }
                //end updated 

                var th = document.createElement('th');

                th.innerHTML = cm.display;

                if (cm.name && cm.sortable)
                    $(th).attr('abbr', cm.name);

                //th.idx = i;
                $(th).attr('axis', 'col' + i);
                $(th).attr('axis0', 'col' + i);

                if (cm.align)
                    th.align = cm.align;

                if (cm.width)
                    $(th).attr('width', cm.width);

                if (cm.hide) {
                    th.hide = true;
                }
                if (cm.toggle != undefined) {
                    th.toggle = cm.toggle;
                }
                if (cm.process) {
                    th.process = cm.process;
                }

                $(tr).append(th);
            }

            $(thead).append(tr);
            $(t).prepend(thead);
        } // end if p.colmodel	

        //init divs
        g.gDiv = document.createElement('div'); //create global container
        g.mDiv = document.createElement('div'); //create title container
        g.hDiv = document.createElement('div'); //create header container
        g.bDiv = document.createElement('div'); //create body container
        g.vDiv = document.createElement('div'); //create grip
        g.rDiv = document.createElement('div'); //create horizontal resizer
        g.cDrag = document.createElement('div'); //create column drag
        g.block = document.createElement('div'); //creat blocker
        g.nDiv = document.createElement('div'); //create column show/hide popup
        g.nBtn = document.createElement('div'); //create column show/hide button
        g.iDiv = document.createElement('div'); //create editable layer
        g.tDiv = document.createElement('div'); //create toolbar
        g.sDiv = document.createElement('div');

        if (p.usepager) g.pDiv = document.createElement('div'); //create pager container
        g.hTable = document.createElement('table');

        //set gDiv
        g.gDiv.className = p.gridClass;
        if (p.width != 'auto') g.gDiv.style.width = p.width + 'px';

        //add conditional classes
        if ($.browser.msie)
            $(g.gDiv).addClass('ie');

        if (p.novstripe)
            $(g.gDiv).addClass('novstripe');

        $(t).before(g.gDiv);
        $(g.gDiv)
		.append(t)
		;

        //set toolbar
        //button参数描述:  by webnuke
        //separator:是否为分割;text:显示文本;title:相当于altertext;
        //bclass:样式类;onpress:点击时触发的事件;alias:名称标识;
        //webnuke新添加的参数:commandname:事件名称;eventType:需要执行的事件类型。
        if (p.buttons) {
            g.tDiv.className = 'tDiv';
            var tDiv2 = document.createElement('div');
            tDiv2.className = 'tDiv2';

            for (i = 0; i < p.buttons.length; i++) {
                var btn = p.buttons[i];
                if (!btn.separator) {
                    var btnDiv = document.createElement('div');
                    btnDiv.className = 'fbutton';
                    btnDiv.innerHTML = "<div><span>" + btn.text + "</span></div>";
                    if (btn.title) {
                        btnDiv.title = btn.title;
                    }
                    if (btn.bclass) $('span', btnDiv).addClass(btn.cssClass);
                    btnDiv.onpress = btn.action;
                    btnDiv.name = btn.alias;

                    //updated by webnuke 2010.6.5
                    btnDiv.dataValue = btn;
                    $(btnDiv).attr("eventType", btn.eventType);

                    $(btnDiv).click(function () {
                        var operateBtn = this.dataValue;
                        operateBtn.dataValue = g.getCheckedRows();
                        p.extParam = []; //updated by webnuke {} -----> {}
                        g.handleButtonEvent(operateBtn);

                        if (this.onpress) {
                            this.onpress(this.name, g.gDiv);
                        }
                    });
                    //end updated

                    $(tDiv2).append(btnDiv);
                    if ($.browser.msie && $.browser.version < 7.0) {
                        $(btnDiv).hover(function () { $(this).addClass('fbOver'); }, function () { $(this).removeClass('fbOver'); });
                    }

                } else {
                    $(tDiv2).append("<div class='btnseparator'></div>");
                }
            }
            $(g.tDiv).append(tDiv2);
            $(g.tDiv).append("<div style='clear:both'></div>");
            $(g.gDiv).prepend(g.tDiv);
        }

        //updated by webnuke 2010.6.6 
        function generateOperateCell() {
            if (p.operateCell && p.operateCell.items && p.operateCell.items > 0) {  //操作列
                cm = p.operateCell;
                var th = document.createElement('th');
                th.innerHTML = cm.display;
                $(th).attr('axis', 'col-2');
                $(th).attr('axis0', 'col-2');
                $(th).attr('isoper', true);
                if (cm.align) th.align = cm.align;
                if (cm.width) $(th).attr('width', cm.width);
                if (cm.toggle != undefined) th.toggle = cm.toggle;
                if (cm.process) th.process = cm.process;

                return th;
            }

            return null;
        }

        if (p.operateCell && p.operateCell.position == "right") {
            var th = generateOperateCell();
            if (th) $(tr).append(th);
        }

        //end updated

        //set hDiv
        g.hDiv.className = 'hDiv';

        $(t).before(g.hDiv);

        //set hTable
        g.hTable.cellPadding = 0;
        g.hTable.cellSpacing = 0;
        $(g.hDiv).append('<div class="hDivBox"></div>');
        $('div', g.hDiv).append(g.hTable);
        var thead = $("thead:first", t).get(0);
        if (thead) $(g.hTable).append(thead);
        thead = null;

        if (!p.colmodel) var ci = 0;

        //setup thead			
        $('thead tr:first th', g.hDiv).each(function () {
            var thdiv = document.createElement('div');
            if ($(this).attr('abbr')) {
                $(this).click(function (e) {
                    if (!$(this).hasClass('thOver')) return false;
                    var obj = (e.target || e.srcElement);
                    if (obj.href || obj.type) return true;
                    g.changeSort(this);
                });

                if ($(this).attr('abbr') == p.sortname) {
                    this.className = 'sorted';
                    thdiv.className = 's' + p.sortorder;
                }
            }

            if (this.hide) $(this).hide();

            if (!p.colmodel && !$(this).attr("isch") && !$(this).attr("isoper")) {
                $(this).attr('axis', 'col' + ci++);
            }

            $(thdiv).css({ textAlign: this.align, width: this.width + 'px' });
            thdiv.innerHTML = this.innerHTML;

            $(this).empty().append(thdiv).removeAttr('width');
            if (!$(this).attr("isch") && !$(this).attr("isoper")) {
                $(this).mousedown(function (e) {
                    g.dragStart('colMove', e, this);
                }).hover(function () {
                    if (!g.colresize && !$(this).hasClass('thMove') && !g.colCopy) $(this).addClass('thOver');

                    if ($(this).attr('abbr') != p.sortname && !g.colCopy && !g.colresize && $(this).attr('abbr')) $('div', this).addClass('s' + p.sortorder);
                    else if ($(this).attr('abbr') == p.sortname && !g.colCopy && !g.colresize && $(this).attr('abbr')) {
                        var no = '';
                        if (p.sortorder == 'asc') no = 'desc';
                        else no = 'asc';
                        $('div', this).removeClass('s' + p.sortorder).addClass('s' + no);
                    }

                    if (g.colCopy) {

                        var n = $('th', g.hDiv).index(this);

                        if (n == g.dcoln) return false;

                        if (n < g.dcoln) $(this).append(g.cdropleft);
                        else $(this).append(g.cdropright);

                        g.dcolt = n;

                    }
                    else if (!g.colresize) {
                        var thsa = $('th:visible', g.hDiv);
                        var nv = -1;
                        for (var i = 0, j = 0, l = thsa.length; i < l; i++) {
                            if ($(thsa[i]).css("display") != "none") {
                                if (thsa[i] == this) {
                                    nv = j;
                                    break;
                                }
                                j++;
                            }
                        }
                        // var nv = $('th:visible', g.hDiv).index(this);
                        var onl = parseInt($('div:eq(' + nv + ')', g.cDrag).css('left'));
                        var nw = parseInt($(g.nBtn).width()) + parseInt($(g.nBtn).css('borderLeftWidth'));
                        nl = onl - nw + Math.floor(p.cgwidth / 2);

                        $(g.nDiv).hide(); $(g.nBtn).hide();

                        $(g.nBtn).css({ 'left': nl, top: g.hDiv.offsetTop }).show();

                        var ndw = parseInt($(g.nDiv).width());

                        $(g.nDiv).css({ top: g.bDiv.offsetTop });

                        if ((nl + ndw) > $(g.gDiv).width())
                            $(g.nDiv).css('left', onl - ndw + 1);
                        else
                            $(g.nDiv).css('left', nl);


                        if ($(this).hasClass('sorted'))
                            $(g.nBtn).addClass('srtd');
                        else
                            $(g.nBtn).removeClass('srtd');

                    }

                },
				function () {
				    $(this).removeClass('thOver');
				    if ($(this).attr('abbr') != p.sortname) $('div', this).removeClass('s' + p.sortorder);
				    else if ($(this).attr('abbr') == p.sortname) {
				        var no = '';
				        if (p.sortorder == 'asc') no = 'desc';
				        else no = 'asc';

				        $('div', this).addClass('s' + p.sortorder).removeClass('s' + no);
				    }
				    if (g.colCopy) {
				        $(g.cdropleft).remove();
				        $(g.cdropright).remove();
				        g.dcolt = null;
				    }
				}); //wrap content
            }
        });
        //set bDiv
        g.bDiv.className = 'bDiv';
        $(t).before(g.bDiv);
        $(g.bDiv)
		.css({ height: (p.height == 'auto') ? 'auto' : p.height + "px" })
		.scroll(function (e) { g.scroll(); })
		.append(t)
		;

        if (p.height == 'auto') {
            $('table', g.bDiv).addClass('autoht');
        }

        //add td properties
        if (p.url == false || p.url == "") {
            g.addCellProp();
            //add row properties
            g.addRowProp();
        }

        //set cDrag

        var cdcol = $('thead tr:first th:first', g.hDiv).get(0);

        if (cdcol != null) {
            g.cDrag.className = 'cDrag';
            g.cdpad = 0;

            g.cdpad += (isNaN(parseInt($('div', cdcol).css('borderLeftWidth'))) ? 0 : parseInt($('div', cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('borderRightWidth'))) ? 0 : parseInt($('div', cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('paddingLeft'))) ? 0 : parseInt($('div', cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('paddingRight'))) ? 0 : parseInt($('div', cdcol).css('paddingRight')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderLeftWidth'))) ? 0 : parseInt($(cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderRightWidth'))) ? 0 : parseInt($(cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingLeft'))) ? 0 : parseInt($(cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingRight'))) ? 0 : parseInt($(cdcol).css('paddingRight')));

            $(g.bDiv).before(g.cDrag);

            var cdheight = $(g.bDiv).height();
            var hdheight = $(g.hDiv).height();

            $(g.cDrag).css({ top: -hdheight + 'px' });

            $('thead tr:first th', g.hDiv).each
			(
			 	function () {
			 	    var cgDiv = document.createElement('div');
			 	    $(g.cDrag).append(cgDiv);
			 	    if (!p.cgwidth) p.cgwidth = $(cgDiv).width();
			 	    $(cgDiv).css({ height: cdheight + hdheight })
						.mousedown(function (e) { g.dragStart('colresize', e, this); })
						;
			 	    if ($.browser.msie && $.browser.version < 7.0) {
			 	        g.fixHeight($(g.gDiv).height());
			 	        $(cgDiv).hover(
								function () {
								    g.fixHeight();
								    $(this).addClass('dragging');
								},
								function () { if (!g.colresize) $(this).removeClass('dragging'); }
							);
			 	    }
			 	}
			);

            //g.rePosDrag();
        }


        //add strip		
        if (p.striped)
            $('tbody tr:odd', g.bDiv).addClass('erow');


        if (p.resizable && p.height != 'auto') {
            g.vDiv.className = 'vGrip';
            $(g.vDiv)
		.mousedown(function (e) { g.dragStart('vresize', e); })
		.html('<span></span>');
            $(g.bDiv).after(g.vDiv);
        }

        if (p.resizable && p.width != 'auto' && !p.nohresize) {
            g.rDiv.className = 'hGrip';
            $(g.rDiv)
		.mousedown(function (e) { g.dragStart('vresize', e, true); })
		.html('<span></span>')
		.css('height', $(g.gDiv).height())
		;
            if ($.browser.msie && $.browser.version < 7.0) {
                $(g.rDiv).hover(function () { $(this).addClass('hgOver'); }, function () { $(this).removeClass('hgOver'); });
            }
            $(g.gDiv).append(g.rDiv);
        }

        // add pager
        if (p.usepager) {
            g.pDiv.className = 'pDiv';
            g.pDiv.innerHTML = '<div class="pDiv2"></div>';
            $(g.bDiv).after(g.pDiv);
            var html = '<div class="pGroup"><div class="pFirst pButton" title="转到第一页"><span></span></div><div class="pPrev pButton" title="转到上一页"><span></span></div> </div><div class="btnseparator"></div> <div class="pGroup"><span class="pcontrol">当前 <input type="text" size="1" value="1" /> ,总页数 <span> 1 </span></span></div><div class="btnseparator"></div><div class="pGroup"> <div class="pNext pButton" title="转到下一页"><span></span></div><div class="pLast pButton" title="转到最后一页"><span></span></div></div><div class="btnseparator"></div><div class="pGroup"> <div class="pReload pButton" title="刷新"><span></span></div> </div> <div class="btnseparator"></div><div class="pGroup"><span class="pPageStat"></span></div>';
            $('div', g.pDiv).html(html);

            $('.pReload', g.pDiv).click(function () { g.populate(); });
            $('.pFirst', g.pDiv).click(function () { g.changePage('first'); });
            $('.pPrev', g.pDiv).click(function () { g.changePage('prev'); });
            $('.pNext', g.pDiv).click(function () { g.changePage('next'); });
            $('.pLast', g.pDiv).click(function () { g.changePage('last'); });
            $('.pcontrol input', g.pDiv).keydown(function (e) { if (e.keyCode == 13) g.changePage('input'); });
            if ($.browser.msie && $.browser.version < 7) $('.pButton', g.pDiv).hover(function () { $(this).addClass('pBtnOver'); }, function () { $(this).removeClass('pBtnOver'); });

            if (p.useRp) {
                var opt = "";
                for (var nx = 0; nx < p.rpOptions.length; nx++) {
                    if (p.rp == p.rpOptions[nx]) sel = 'selected="selected"'; else sel = '';
                    opt += "<option value='" + p.rpOptions[nx] + "' " + sel + " >" + p.rpOptions[nx] + "&nbsp;&nbsp;</option>";
                };
                $('.pDiv2', g.pDiv).prepend("<div class='pGroup'>每页 <select name='rp'>" + opt + "</select>条</div> <div class='btnseparator'></div>");
                $('select', g.pDiv).change(
					function () {
					    if (p.onRpChange)
					        p.onRpChange(+this.value);
					    else {
					        p.newp = 1;
					        p.rp = +this.value;
					        g.populate();
					    }
					}
				);
            }

            //add search button
            if (p.searchitems) {
                $('.pDiv2', g.pDiv).prepend("<div class='pGroup'> <div class='pSearch pButton'><span></span></div> </div>  <div class='btnseparator'></div>");
                $('.pSearch', g.pDiv).click(function () { $(g.sDiv).slideToggle('fast', function () { $('.sDiv:visible input:first', g.gDiv).trigger('focus'); }); });
                //add search box
                g.sDiv.className = 'sDiv';

                sitems = p.searchitems;
                var sopt = "";
                var op = "Eq";
                for (var s = 0; s < sitems.length; s++) {
                    if (p.qtype == '' && sitems[s].isdefault == true) {
                        p.qtype = sitems[s].name;
                        sel = 'selected="selected"';
                    } else sel = '';
                    //if (sitems[s].operater == "Like") {
                    //    op = "Like";
                    //}
                    //else {
                    //    op = "Eq";
                    //}
                    op = sitems[s].operater;
                    sopt += "<option value='" + sitems[s].name + "$" + op + "$" + s + "' " + sel + " >" + sitems[s].display + "&nbsp;&nbsp;</option>";
                }

                if (p.qtype == '') p.qtype = sitems[0].name;

                $(g.sDiv).append("<div class='sDiv2'>快速检索：<input type='text' size='30' name='q' class='qsbox' /> <select name='qtype'>" + sopt + "</select> <input type='button' name='qclearbtn' value='清空' /></div>");

                $('input[name=q],select[name=qtype]', g.sDiv).keydown(function (e) {
                    if (e.keyCode == 13) {
                        g.doSearch();
                        event.returnValue = false;
                    }
                });
                $('input[name=qclearbtn]', g.sDiv).click(function () { $('input[name=q]', g.sDiv).val(''); p.query = ''; g.doSearch(); });
                $(g.bDiv).after(g.sDiv);

            }

        }
        $(g.pDiv, g.sDiv).append("<div style='clear:both'></div>");

        // add title
        if (p.title) {
            g.mDiv.className = 'mDiv';
            g.mDiv.innerHTML = '<div class="ftitle">' + p.title + '</div>';
            $(g.gDiv).prepend(g.mDiv);
            if (p.showTableToggleBtn) {
                $(g.mDiv).append('<div class="ptogtitle" title="Minimize/Maximize Table"><span></span></div>');
                $('div.ptogtitle', g.mDiv).click(function () {
                    $(g.gDiv).toggleClass('hideBody');
                    $(this).toggleClass('vsble');
                });
            }
            //g.rePosDrag();
        }

        //setup cdrops
        g.cdropleft = document.createElement('span');
        g.cdropleft.className = 'cdropleft';
        g.cdropright = document.createElement('span');
        g.cdropright.className = 'cdropright';

        //add block
        g.block.className = 'gBlock';
        var blockloading = $("<div/>");
        blockloading.addClass("loading");
        $(g.block).append(blockloading);
        var gh = $(g.bDiv).height();
        var gtop = g.bDiv.offsetTop;
        $(g.block).css(
		{
		    width: g.bDiv.style.width,
		    height: gh,
		    position: 'relative',
		    marginBottom: (gh * -1),
		    zIndex: 1,
		    top: gtop,
		    left: '0px'
		}
		);
        $(g.block).fadeTo(0, p.blockOpacity);

        // add column control
        if ($('th', g.hDiv).length) {
            g.nDiv.className = 'nDiv';
            g.nDiv.innerHTML = "<table cellpadding='0' cellspacing='0'><tbody></tbody></table>";
            $(g.nDiv).css(
			{
			    marginBottom: (gh * -1),
			    display: 'none',
			    top: gtop
			}
			).noSelect()
			;

            var cn = 0;

            $('th div', g.hDiv).each(function () {
                var kcol = $("th[axis='col" + cn + "']", g.hDiv)[0];
                if (kcol == null) return;
                var chkall = $("input[type='checkbox']", this);
                if (chkall.length > 0) {
                    chkall[0].onclick = g.checkAllOrNot;
                    return;
                }

                if ($(this)[0] && $(this)[0].parentNode && $(this)[0].parentNode.isoper) { //判断是否为操作列
                    cn++;
                    return;
                }

                if (kcol.toggle == false || this.innerHTML == "") {
                    cn++;
                    return;
                }
                var chk = 'checked="checked"';
                if (kcol.style.display == 'none') chk = '';

                $('tbody', g.nDiv).append('<tr><td class="ndcol1"><input type="checkbox" ' + chk + ' class="togCol noborder" value="' + cn + '" /></td><td class="ndcol2">' + this.innerHTML + '</td></tr>');
                cn++;
            });

            if ($.browser.msie && $.browser.version < 7.0)
                $('tr', g.nDiv).hover(function () { $(this).addClass('ndcolover'); },
					                  function () { $(this).removeClass('ndcolover'); });

            $('td.ndcol2', g.nDiv).click(function () {
                if ($('input:checked', g.nDiv).length <= p.minColToggle && $(this).prev().find('input')[0].checked) return false;
                return g.toggleCol($(this).prev().find('input').val());
            });

            $('input.togCol', g.nDiv).click(function () {

                if ($('input:checked', g.nDiv).length < p.minColToggle && this.checked == false) return false;
                $(this).parent().next().trigger('click');
                //return false;
            });


            $(g.gDiv).prepend(g.nDiv);

            $(g.nBtn).addClass('nBtn')
			.html('<div></div>')
            //.attr('title', 'Hide/Show Columns')
			.click(function () {
			    $(g.nDiv).toggle(); return true;
			});

            if (p.showToggleBtn)
                $(g.gDiv).prepend(g.nBtn);

        }

        // add date edit layer
        $(g.iDiv)
		.addClass('iDiv')
		.css({ display: 'none' })
		;
        $(g.bDiv).append(g.iDiv);

        // add flexigrid events
        $(g.bDiv)
		.hover(function () { $(g.nDiv).hide(); $(g.nBtn).hide(); }, function () { if (g.multisel) g.multisel = false; })
		;
        $(g.gDiv)
		.hover(function () { }, function () { $(g.nDiv).hide(); $(g.nBtn).hide(); })
		;

        //add document events
        $(document)
		.mousemove(function (e) { g.dragMove(e); })
		.mouseup(function (e) { g.dragEnd(); })
		.hover(function () { }, function () { g.dragEnd(); })
		;

        //browser adjustments
        if ($.browser.msie && $.browser.version < 7.0) {
            $('.hDiv,.bDiv,.mDiv,.pDiv,.vGrip,.tDiv, .sDiv', g.gDiv)
			.css({ width: '100%' });
            $(g.gDiv).addClass('ie6');
            if (p.width != 'auto') $(g.gDiv).addClass('ie6fullwidthbug');
        }

        g.rePosDrag();
        g.fixHeight();

        //make grid functions accessible
        t.p = p;
        t.grid = g;

        // load data
        if (p.url && p.autoload) {
            g.populate(true);
        }
        else {
            if (p.onLoaded) {
                p = p.onLoaded(p);
            }
        }

        return t;

    };


    var docloaded = false;

    $(document).ready(function () { docloaded = true });

    $.fn.flexigrid = function (p) {

        return this.each(function () {
            if (!docloaded) {
                $(this).hide();
                var t = this;
                $(document).ready
					(
						function () {
						    $.addFlex(t, p);
						}
					);
            } else {
                $.addFlex(this, p);
            }
        });

    }; //end flexigrid

    $.fn.flexReload = function (p) { // function to reload grid

        return this.each(function () {
            if (this.grid && this.p.url) this.grid.populate();
        });

    }; //end flexReload
    //重新指定宽度和高度
    $.fn.flexResize = function (w, h) {
        var p = { width: w, height: h };
        return this.each(function () {
            if (this.grid) {
                $.extend(this.p, p);
                this.grid.reSize();
            }
        });
    };
    $.fn.ChangePage = function (type) {
        return this.each(function () {
            if (this.grid) {
                this.grid.changePage(type);
            }
        })
    };
    $.fn.flexOptions = function (p) { //function to update general options

        return this.each(function () {
            if (this.grid) $.extend(this.p, p);
        });

    }; //end flexOptions
    $.fn.GetOptions = function () {
        if (this[0].grid) {
            return this[0].p;
        }
        return null;
    };
    // 获取选中的行，返回选中行的主键
    $.fn.getCheckedRows = function () {
        if (this[0].grid) {
            return this[0].grid.getCheckedRows();
        }
        return [];
    };
    //    $.fn.getAllRows = function () {

    //    };
    // 获取选中的行，返回选中行的所有数据
    $.fn.getSelectedRows = function () {
        if (this[0].grid) {
            return this[0].grid.getSelectedRows();
        }
        return [];
    };
    $.fn.flexToggleCol = function (cid, visible) { // function to reload grid

        return this.each(function () {
            if (this.grid) this.grid.toggleCol(cid, visible);
        });

    }; //end flexToggleCol

    $.fn.flexAddData = function (data) { // function to add data to grid
        return this.each(function () {
            if (this.grid) this.grid.addData(data);
        });

    };

    $.fn.noSelect = function (p) { //no select plugin by me :-)
        if (p == null)
            prevent = true;
        else
            prevent = p;

        if (prevent) {

            return this.each(function () {
                if ($.browser.msie || $.browser.safari) $(this).bind('selectstart', function () { return false; });
                else if ($.browser.mozilla) {
                    $(this).css('MozUserSelect', 'none');
                    $('body').trigger('focus');
                }
                else if ($.browser.opera) $(this).bind('mousedown', function () { return false; });
                else $(this).attr('unselectable', 'on');
            });

        } else {


            return this.each(function () {
                if ($.browser.msie || $.browser.safari) $(this).unbind('selectstart');
                else if ($.browser.mozilla) $(this).css('MozUserSelect', 'inherit');
                else if ($.browser.opera) $(this).unbind('mousedown');
                else $(this).removeAttr('unselectable', 'on');
            });

        };

    }; //end noSelect

    //updated by webnuke 
    //为Options设置新的ExtParams (HuaLei)
    $.fn.setNewExtParam = function (np) {
        this.each(function () {
            if (this.grid) {
                var op = this.p;
                var $extParam = $(op.extParam);
                var curr;
                $(np).each(function () {
                    var has = false;
                    curr = this;
                    $extParam.each(function () {
                        if (curr.name == this.name) {
                            this.value = curr.value;
                            has = true;
                            return false; //重新赋值后跳出循环
                        }
                    });
                    if (!has) {
                        //增加新的值
                        op.extParam.push({ name: curr.name, value: curr.value });
                        has = false;
                    }
                });
            }
            $.extend(this.p, op);
        });
    };
    //end updated 

})(jQuery);
