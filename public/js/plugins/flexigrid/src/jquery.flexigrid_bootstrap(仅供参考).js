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
            height: 'auto', //flexigrid插件的高度，单位为px
            minHeight: '50',
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
            autoload: false, //自动加载
            blockOpacity: 0.5, //透明度设置

            showcheckbox: false, //是否显示checkbox    
            singleselected: false, //是否单选
            rowhandler: false, //是否启用行的扩展事情功能
            colResizable: true,

            rowbinddata: true,
            selectedonclick: false, //点击行是否选中
            showOperateCell: true,  //是否显示操作列
            operateCellPosition: 'right', //显示操作列的位置。左边或右边。
            showContentMenu: true,
            extParam: [], //updated by webnuke {} ----> []
            //Style
            gridClass: "table",

            autoPager: true,  //是否自动生成分页控件
            autoToolBar: true, //是否自动生成工具栏
            columnsFixed: true,  //列是否是固定的，如果是固定的，不能通过给colmodels赋值来重设列

            mutilRowMessage: false, //是否需要显示多行的可折叠信息
            showMessageOnRowClicked: true, //在单击行时显示或隐藏可折叠信息？

            onInit: false, //开始初始化事件 //updated by webnuke 添加加载时执行的函数，可用于重新设置参数值。
            onInited: false, //初始化完成事件,此时数据还没进行加载

            onSubmit: false, // 在获取数据之前触发
            preProcess: false, //数据加载处理开始事件
            onLoaded: false, //数据加载处理完毕事件
            onSuccess: false, //数据加载处理完毕事件，与onLoaded基本相同，位于其后执行

            onCommand: false, //操作按钮点击事件
            onCommanded: false, //回发执行完毕事件

            onChangeCells: false, //显示或隐藏列时触发
            rowClicked: false, //行点击事件
            onRowChecked: false, //复选框选中事件
            onToggleCol: false, //当在行之间转换时
            onChangeSort: false  //当改变排序时

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

                    //toto
                    $('div:eq(' + n + ')', g.cDrag).css({ 'left': cdpos + 'px' }).show();

                    cdleft = cdpos;
                    i++;
                });
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
           

            //updated by webnuke 2010.06.05 
            changeHeadItemCheckStatus: function () {
                var $ck = $("input.itemchk", this.g);
                var $headck = $("input[name='headcheck']", this.g);
                //var p = this[0].p;

                var isAllChecked = true;
                for (var j = 0; j < $ck.length; j++) {
                    if (!$($ck[j]).prop("checked")) {
                        isAllChecked = false;
                        break;
                    }
                }
                if (isAllChecked) {
                    $headck.attr("checked", true);
                }
                else {
                    $headck.attr("checked", false);
                }
            },

            showLoading: function (hideOnSubmit) {//多次使用，用一个函数

                this.loading = true;
                if (!p.url) return false;
                $('.pPageStat', this.pDiv).html(p.procmsg);
                $('.pReload', this.pDiv).addClass('loading');
                $(g.block).css({ top: g.bDiv.offsetTop });
                $(g.block).height($(g.bDiv).height());
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

                if (!p.columnsFixed) {
                    var colModel = { name: 'colModel', value: this.getColModels() };
                    param.push(colModel);
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

                        if (p.onCommanded) {
                            p.onCommanded(data);
                        }
                    },
                    error: function (data) {
                        try {
                            if (p.onError) {
                                p.onError(data);
                            }
                            else {
                                alert("获取数据发生异常，请尝试重新登录系统。")
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

                    if (p.usepager && p.autoPager) {
                        this.buildpager();
                        $('.pPageStat', this.pDiv).html(p.nomsg);
                        if (p.hideOnSubmit) $(g.block).remove();
                    }
                    return false;
                }

                p.pages = Math.ceil(p.total / p.rp);

                if (p.dataType == 'xml')
                { p.page = +$('rows page', data).text(); }
                else
                { p.page = data.page; }

                if (p.autoPager) {
                    this.buildpager();
                }

                //var ths = $('thead tr:first th',ttg.hDiv);
                //var thsdivs = $('thead tr:first th div', g.hDiv);
                var ths = $('thead tr:first th', t);
                var thsdivs = $('thead tr:first th', t);
                var tbhtml = [];
                tbhtml.push("<tbody>");
                if (p.dataType == 'json') {
                    
                    if (data.rows != null && data.rows.length > 0) {
                        $.each(data.rows, function (i, row) {
                            tbhtml.push("<tr type='dataRow' id='", "row", row.id, "'", "key='", row.id, "' ");

                            if (i % 2 && p.striped) {
                                tbhtml.push(" class='erow'");
                            }
                            if (p.rowbinddata) {
                                tbhtml.push("ch='", row.cell.join("_FG$SP_"), "'");
                            }

                            if (row.attrs) {
                                if (row.attrs) {
                                    for (var i = 0; i < row.attrs.length; i++) {
                                        var attr = this.attrs[i];
                                        tbhtml.push(' ', attr.key, '=', '"', attr.value, '" ');
                                    }
                                }
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

                                tbhtml.push("<td  align='", this.align, "'");

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

                                var cellType = "field";
                                div.push("'>");
                                if (idx == "-1") { //checkbox
                                    div.push("<input type='checkbox' id='chk_", row.id, "' class='itemchk' dataValue='", row.id, "'/>");
                                    if (tdclass != "") {
                                        tdclass += " chboxtd";
                                    } else {
                                        tdclass += "chboxtd";
                                    }

                                    cellType = "checkbox";
                                }
                                //updated by webnuke
                                else if (idx == "-2") { //操作列
                                    if (row.operateCell) {
                                        
                                        div.push('<span class="flexiGrid_operateCell" ');
                                        div.push('>');

                                        $(row.operateCell).each(function (i, operateBtn) {
                                            var cssClass = operateBtn.cssClass ? operateBtn.cssClass : "obutton";
                                            var disabledAttr = operateBtn.disabled ? ' disabled="disabled" ':'';
                                            if (operateBtn.disabled) {
                                                cssClass += " disabled ";
                                            }
                                            div.push('<span class="flexiGrid_operate ', '" ', disabledAttr, ' commandName="', this.commandName, '"', ' dataValue="', row.id, '"');

                                            //div.push('<span class="flexiGrid_operate obutton" commandName="', this.commandName, '"', ' dataValue="', row.id, '"');
                                            div.push(' eventType=', this.eventType);
                                            div.push(' autoConfirm=', this.autoConfirm);
                                            if (this.action) div.push(' action=', this.action)
                                            if (this.redirectPageUrl) div.push(' redirectPageUrl=', this.redirectPageUrl);

                                            if (this.attrs) {
                                                for (var i = 0; i < this.attrs.length; i++) {
                                                    var attr = this.attrs[i];
                                                    div.push(' ',attr.key,'=','"',attr.value,'" ');
                                                }
                                            }

                                            div.push(">");

                                            if (this.icon && $.trim(this.icon) != "") {
                                                div.push('<span><img src="', this.icon, '" border=0 /></span>');
                                            }
                                            div.push('<span><a class="', cssClass, '"', disabledAttr , '>', this.text, '</a></span></span>');
                                        });

                                        div.push("</span>");//操作列结束
                                    }
                                    else {
                                        div.push("<span></span>");
                                    }

                                    cellType = "operate";
                                }
                                else {
                                    var cell = row.cell[idx];
                                    var divInner = cell.cellHtml || "&nbsp;";
                                    if (this.process) {
                                        divInner = this.process(divInner, trid);
                                    }

                                    if (col.type == 1) { //如果是状态列 //public enum FlexiGridViewFieldType { Bound = 0,Status = 1,TextBox = 2}
                                        div.push('<span class="flexiGrid_operate" commandName="', col.commandName, '"', ' dataValue="', row.id, '"');
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
                                        div.push('<span class="flexiGrid_edit oEdit" commandName="', col.commandName, '"', ' dataValue="', row.id, '"');
                                        div.push(' eventType=2 ', ' isReadOnly= ', isReadOnly, ' regexValue="', col.regexValue, '"  showEmptyMessage="'
                                                   , col.showEmptyMessage, '" showUnValidMessage="', col.showUnValidMessage, '" isRequiredField="', col.isRequiredField, '"'); //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                                        div.push(">");
                                        div.push(divInner);
                                        div.push("</span>");
                                    }
                                    else { //绑定列
                                        div.push(divInner);
                                    }

                                    cellType = "field";
                                    //end updated
                                }

                                div.push("</div>");
                                if (tdclass != "") {
                                    tbhtml.push(" class='", tdclass, "'");
                                }

                                tbhtml.push(" cellType='", cellType, "'");
                                tbhtml.push(">", div.join(""), "</td>");
                            });
                            tbhtml.push("</tr>");

                            //添加rowMessage
                            //tbhtml.push("<tr><td></td><td colspan=", $(ths).length - 2, " class='", tdclass, "' >");
                            if (row.itemMessage) {
                                //toto
                                tbhtml.push("<tr type='itemMessage' style='display:none;' id='", "message", row.id, "'", "key='", row.id, "' ", ">");
                                if (p.showcheckbox) {
                                    tbhtml.push("<td class='chboxtd'></td>");
                                }
                                tbhtml.push("<td colspan=1000>");
                                tbhtml.push(row.itemMessage);
                                tbhtml.push("</td></tr>");
                            }

                        }); //$.each(data.rows, function (i, row) {
                    } //if (data.rows != null && data.rows.length > 0) {

                    //禁用操作列 这样禁止不了
                    $('.flexiGrid_operate a[disabled="disabled"]').removeAttr("href");
                }
              
                tbhtml.push("</tbody>");

                debugger
                //$(t).html(tbhtml.join(""));
                //$(g.hTable).append(tbhtml.join(""));
                $(t).append(tbhtml.join(""));

                //this.rePosDrag();
                this.addRowProp();
                if (p.onSuccess) p.onSuccess();
                if (p.hideOnSubmit) $(g.block).remove(); //$(t).show();
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                if ($.browser.opera) $(t).css('visibility', 'visible');

                setLoadingBlock();

                $("input.itemchk", g.bDiv).click(function (e) {
                    e.stopPropagation();
                });

                $("tr[type='dataRow']", g.bDiv).click(function () {
                    var id = $(this).attr("key");
                    var elementId = "message" + id;

                    if (p.showMessageOnRowClicked) {
                        $("#" + elementId, g.bDiv).toggle();

                        if (!p.mutilRowMessage) {
                            $("tr[type='itemMessage']:not(#" + elementId + ")", g.bDiv).hide();
                        }
                    }
                });

            },
        
            getColModels: function () {
                var cols = [];
                for (var i = 0; i < p.colModel.length; i++) {
                    var column = p.colModel[i];
                    cols.push(column.name + "," + column.type);
                }
                var str = cols.join(";");
                return str;
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

                //隐藏列表为空时显示的信息
                //$(".flexiGridEmpty", g.bDiv).hide();

                if (p.showLoading) {  
                    g.showLoading(p.hideOnSubmit);
                }

                if (!p.newp || p.newp < 1) p.newp = 1;
                if (p.newp > p.pages) p.newp = p.pages;
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
                if (!p.columnsFixed) {
                    var colModel = { name: 'colModel', value: this.getColModels() };
                    param.push(colModel);
                }

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
                            if (p.onError) {
                                p.onError(data);
                                if (p.showLoading) { 
                                    g.hideLoading();
                                }
                            }
                        }
                        else {
                            if (p.showLoading) {
                                g.hideLoading();
                            }
                            $(".flexiGridEmpty", g.bDiv).remove();
                            //$(g.hTable).show();
                            $("table:first", g.bDiv).show();

                            g.addData(data);
                            if (data.total == 0) {
                                //$(".hDiv,.cDray,.pDiv, .hGrip", ".bbit-grid").hide();
                                //$(".cDray,.pDiv, .hGrip", ".bbit-grid").hide();
                                var emptyHtml = [];
                                emptyHtml.push("<div class='flexiGridEmpty'>", data.emptyHtml, "</div>");
                                $(g.bDiv).append(emptyHtml.join(""));
                                //$(g.hTable).hide();
                                $("table:first", g.bDiv).hide();
                                //$(".hDiv,.cDray,.pDiv, .hGrip", ".bbit-grid").show();
                                //alert(data.emptyHtml);
                            }
                            else {
                                $(".hDiv,.cDray,.pDiv, .hGrip", g.bDiv).show();
                            }
                        }
                        //updated by webnuke
                        //if (isInit && p.onLoaded) {
                        if (p.onLoaded) {
                            var newp = p.onLoaded(p);
                            if (newp) {
                                p = newp;
                            }
                        }
                        //end updated

                        var headcheck = $("input[name='headcheck']").get(0);
                        if (headcheck) {
                            $("input[name='headcheck']").get(0).checked = false; //清除头部复选框选中状态
                        }

                    },
                    error: function (data) {
                        try {
                            if (p.onError) {
                                p.onError(data);
                            }
                            else {
                                alert("获取数据发生异常。")
                            }
                            if (p.showLoading) {
                                g.hideLoading();
                            }
                        }
                        catch (e) { }
                    }
                });
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
                //2013-02-18 修改参数的翻页 开始 
                //由XDQ添加 
                if (p.PageChanegdWithArgs) {
                    p.PageChanegdWithArgs(p.extParam);
                    this.populate();
                }
                //2013-02-18 修改参数的翻页 结束
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
                    $(this).change(function () {
                        if (this.checked) {
                            $(ptr).addClass("trSelected");
                        }
                        else {
                            $(ptr).removeClass("trSelected");
                        }

                        //                        debugger
                        //                        if (p.onRowChecked) {
                        //                            p.onRowChecked(this);
                        //                        }
                    });
                    $(this).click(function (e) {

                    });

                    //$(this).changeHeadCheckStatus();
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

                //                if ($.browser.msie && $.browser.version < 7.0) {
                //                    $(this).hover(function () { $(this).addClass('trOver'); }, function () { $(this).removeClass('trOver'); });
                //                }
            },

           
            handleButtonEvent: function (operateBtn) {
                var eventType = $(operateBtn).attr("eventType");
                var redirectPageUrl = $(operateBtn).attr("redirectPageUrl");
                var btnValue = $(operateBtn).attr("dataValue");
                var commandName = $(operateBtn).attr("commandName");
                var action = $(operateBtn).attr("action");
                var autoConfirm = ($(operateBtn).attr("autoConfirm") == "true");


                var isSure = true;
                if (autoConfirm) {
                    if (!btnValue || btnValue.length < 1) {
                        alert("请选择要操作的项。");
                        return;
                    }

                    if (commandName == "delete") {
                        isSure = confirm("您确认要删除吗?")
                    }
                }

                if (eventType == 2) { //public enum ButtonEventType { CustomJavascript = 0, RedirectPage = 1,CallBack = 2 }
                    if (isSure && action) {
                        isSure = action.call(g)
                    }
                    if (isSure) {
                        g.operateCallBack(commandName, btnValue);
                    }
                }
                else if (isSure && eventType == 0) {
                    if (action) {
                        action = eval(action);
                        action.call(this, operateBtn);
                    }
                    //                    if (p.onCommand) {
                    //                        p.onCommand(operateBtn, 1);
                    //                    }
                }
                else if (isSure && eventType == 1 && redirectPageUrl) {
                    document.location.href = redirectPageUrl;
                }
            },
            //end updated

            checkhandler: function (thsChk) {
                var $t = $(this);
                var $ck = $("input.itemchk", this);
                if (p.singleselected) {
                    $t.parent().find("tr.trSelected").each(function (e) {
                        if (this != $t[0]) {
                            $(this).removeClass("trSelected");
                        }
                    });

                    $("input.itemchk", this.gDiv).each(function (e) {
                        if ($t[0] != this) {
                            this.checked = false;
                        }
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

                if (p.onRowChecked) {
                    p.onRowChecked($ck, p);
                }
            },
            addRowProp: function () {
                var $gF = this.rowProp;
                var $cf = this.checkhandler;
                var ths = this;
                $('tbody tr[type="dataRow"]', g.bDiv).each(function (i) {
                    $("input.itemchk", this).change(function () {
                        if (p.onRowChecked) {
                            p.onRowChecked(this);
                        }

                        //$cf.call(this);
                        ths.changeHeadItemCheckStatus();
                    });

                    $(this).click(function () {
                        if (p.selectedonclick) { //点击切换选中状态
                            $cf.call(this);
                            ths.changeHeadItemCheckStatus();
                        }
                        if (p.rowClicked) {
                            p.rowClicked(this, p);
                        }
                    });

                    $gF.call(this);

                    //updated by webnuke  

                    //处理操作列
                    $("span.flexiGrid_operate", this).each(function () {
                        $(this).click(function (e) {
                            //p.extParam = []; //updated by webnuke {} ----------->[]
                            if ($(this).attr("disabled")) {
                                return false;
                            }

                            var isContinue = true;
                            if (p.onCommand) {
                                isContinue = p.onCommand(this, 2);
                            }

                            //考虑到以前使用时很多地方没有返回值，为了兼容以前，为undefined时，也进行处理
                            if (isContinue || isContinue == undefined) {
                                g.handleButtonEvent(this);
                            }
                            e.stopPropagation();
                        })
                    });

                    $("span.flexiGrid_edit", this).each(function () {
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
            refreshColModel: function () {
                createColModel();
            },
            fixGridWidth: function () {
                var i = 0;
                $('th:visible div', this.hDiv).each(function () {

                    var cellType = $(this).parent().attr("cellType");
                    if (cellType == "field") {
                        var cm = p.colModel[i];
                        var cmWidth = g.getPixWidth(cm.width);
                        $(this).css('width', cmWidth);

                        i++;
                    }
                    else if (cellType == "checkbox") {

                    }
                    else if (cellType == "operate") {
                        var cm = p.operateCell;
                        var cmWidth = g.getPixWidth(cm.width);
                        $(this).css('width', cmWidth);
                    }
                });


                $('tr', this.bDiv).each(function () {
                    //$('td:visible div:eq(' + n + ')', this).css('width', nw);
                    //$('td:visible:eq(' + n + ') div', this).css('width', nw);
                    //$('td:visible div', this).css('width', nw);
                    i = 0;
                    $('td:visible div', this).each(function () {
                        var cellType = $(this).parent().attr("cellType");
                        if (cellType == "field") {
                            var cm = p.colModel[i];
                            var cmWidth = g.getPixWidth(cm.width);
                            $(this).css('width', cmWidth);

                            i++;
                        }
                        else if (cellType == "checkbox") {

                        }
                        else if (cellType == "operate") {
                            var cm = p.operateCell;
                            var cmWidth = g.getPixWidth(cm.width);
                            $(this).css('width', cmWidth);
                        }
                    });
                });
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                //$('div:eq(' + n + ')', this.cDrag).siblings().show();
                $('.dragging', this.cDrag).removeClass('dragging');
                this.rePosDrag();
                this.fixHeight();
                this.colresize = false;
            },
            getPixWidth: function (width) {
                var cmWidth = width;
                var index = width.indexOf("%");
                if (index > 0) {
                    var strWidth = width.substring(0, index);
                    if (!p.showcheckbox) {
                        cmWidth = strWidth / 100 * $(g.hDiv).width();
                        cmWidth = parseInt(cmWidth) - 10;
                    }
                    else {
                        var checkCellWidth = p.checkCell.width;
                        cmWidth = (strWidth / 100) * ($(g.hDiv).width() - checkCellWidth);
                        cmWidth = parseInt(cmWidth) - 10;
                    }
                }
                else {
                    cmWidth = parseInt(width);
                }
                return cmWidth;
            },

            checkAllOrNot: function (ths) {
                var ischeck = $(ths).prop("checked");
                $('tbody tr', g.bDiv).each(function () {
                    if (ischeck) {
                        $(ths).addClass("trSelected");
                    }
                    else {
                        $(ths).removeClass("trSelected");
                    }
                });
                $("input.itemchk", g.bDiv).each(function () {
                    this.checked = ischeck;
                    //Raise Event
                    if (p.onRowChecked) {
                        p.onRowChecked(this);
                    }
                });

                var $headck = $("input[name='headcheck']", this.g);
                $headck.attr("checked", ischeck);
            },
            pager: 0
        };

        if (p.onInit) {
            var newP = p.onInit(p);
            if (newP) {
                p = newP;
            }
        }

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
        //g.gDiv.className = p.gridClass;
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

        if (!p.autoToolBar) {
            var tDiv2 = document.createElement('div');

            var toolBar = $("div[name='customToolBar'][for='" + t.id + "']");
            $(toolBar).show();
            $(tDiv2).append(toolBar);

            $(g.tDiv).append(tDiv2);
            $(g.tDiv).append("<div style='clear:both'></div>");
            $(g.gDiv).prepend(g.tDiv);
        }

        //set toolbar
        //button参数描述:  by webnuke
        //separator:是否为分割;text:显示文本;title:相当于altertext;
        //bclass:样式类;onpress:点击时触发的事件;alias:名称标识;
        //webnuke新添加的参数:commandname:事件名称;eventType:需要执行的事件类型。
        if (p.buttons && p.autoToolBar) {
            g.tDiv.className = 'tDiv';
            var tDiv2 = document.createElement('div');
            tDiv2.className = 'tDiv2';

            for (i = 0; i < p.buttons.length; i++) {
                var btn = p.buttons[i];
                if (!btn.separator) {
                    var arrToolBar = [];
                    var btnDiv = document.createElement('div');
                    btnDiv.className = 'fbutton';
                    //btnDiv.innerHTML = "<div><span>" + btn.text + "</span></div>";
                    arrToolBar.push('<span><a class="', btn.cssClass, '">', btn.text, '</a></span>');
                    btnDiv.innerHTML = arrToolBar.join("");

                    if (btn.icon && $.trim(btn.icon)) {
                        btnDiv.innerHTML = '<span><img src="' + btn.icon + '" border=0 /></span>' + btnDiv.innerHTML;
                    }


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
                        //p.extParam = []; //updated by webnuke {} -----> {}
                        g.handleButtonEvent(operateBtn);

                        //todo 注释掉，待确认合理性
                        //if (this.onpress) {
                        //    this.onpress(this.name, g.gDiv);
                        //}
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
                $(th).attr("cellType", "operate");
                $(th).attr('isoper', true);
                if (cm.align) th.align = cm.align;
                if (cm.toggle != undefined) th.toggle = cm.toggle;
                if (cm.process) th.process = cm.process;

                //if (cm.width) $(th).attr('width', cm.width);
                if (cm.width) {
                    var cmWidth = g.getPixWidth(cm.width);
                    $(th).attr('width', cmWidth);
                }

                return th;
            }

            return null;
        }
        //end updated

        //set hDiv
        g.hDiv.className = 'hDiv';

        $(t).before(g.hDiv);

        createColModel();
        function createColModel() {
            $(g.hDiv).html("");
            $(t).html("")
            $(g.bDiv).html("");
            $(g.hTable).html("");

            //create model if any
            if (p.colModel) {
                thead = document.createElement('thead');
                tr = document.createElement('tr');
                //p.showcheckbox ==true;
                if (p.showcheckbox) {
                    var cth = jQuery('<th/>');
                    var cthch = "";
                    if (p.checkCell.showCheckAll) {
                        cthch = jQuery('<input type="checkbox" name="headcheck"/>');
                        cthch.addClass("noborder");
                        if (p.singleselected) {
                            cthch.attr("disabled", true).css("visibility", "hidden");
                        }
                    }

                    cth.addClass("cth").attr({ 'axis': "col-1", 'axis0': "col-1", width: "15", "isch": true }).append(cthch);
                    $(cth).attr("cellType", "checkbox");
                    $(tr).append(cth);
                }

                //updated by webnuke 2010.6.6
                if (p.operateCell && p.operateCell.position == "left") {
                    var th = generateOperateCell();
                    if (th) $(tr).append(th);
                }
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

                    //toto
                    if (cm.name && cm.sortable) {
                        $(th).attr('abbr', cm.name);
                    }

                    th.idx = i;
                    $(th).attr('axis', 'col' + i);
                    $(th).attr('axis0', 'col' + i);
                    $(th).attr("cellType", "field");

                    if (cm.align)
                        th.align = cm.align;

                    if (cm.width) {
                        //$(th).attr('width', cm.width);

                        var cmWidth = g.getPixWidth(cm.width);
                        $(th).attr('width', cmWidth);
                    }

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

                if (p.operateCell && p.operateCell.position == "right") {
                    var th = generateOperateCell();
                    if (th) $(tr).append(th);
                }

                $(thead).append(tr);
                $(t).prepend(thead);

            } // end if p.colmodel	

            debugger
            //set hTable
            g.hTable.cellPadding = 0;
            g.hTable.cellSpacing = 0;
            $(g.hDiv).append('<div class="hDivBox"></div>');
            $('div', g.hDiv).append(g.hTable);
            var thead = $("thead:first", t).get(0);
            //if (thead) $(g.hTable).append(thead);
            if (thead) $(t).append(thead);
            thead = null;
            

            if (!p.colmodel) var ci = 0;

            //set bDiv
            g.bDiv.className = 'bDiv';
            $(t).before(g.bDiv);
            $(g.bDiv)
		.css({ height: (!p.height || p.height == 'auto' || p.height <= 0) ? 'auto' : p.height + "px" })
		.scroll(function (e) { g.scroll(); })
		.append(t);

            if (p.height == 'auto') {
                $('table', g.bDiv).addClass('autoht ');
            }
            $('table', g.bDiv).addClass(p.gridClass);

            //add td properties
            if (p.url == false || p.url == "") {
                g.addCellProp();
                //add row properties
                g.addRowProp();
            }

            //add strip		
            if (p.striped) {
                $('tbody tr:odd', g.bDiv).addClass('erow');
            }

            //toto
            // add column control
            if ($('th', g.hDiv).length) {
                g.nDiv.className = 'nDiv';
                g.nDiv.innerHTML = "<table cellpadding='0' cellspacing='0'><tbody></tbody></table>";
                $(g.nDiv).css({
                    marginBottom: (gh * -1),
                    display: 'none',
                    top: gtop
                }).noSelect();

                var cn = 0;

                $('th div', g.hDiv).each(function () {
                    var kcol = $("th[axis='col" + cn + "']", g.hDiv)[0];
                    if (kcol == null) return;

                    var chkall = $("input[type='checkbox']", this);
                    if (chkall.length > 0) {
                        chkall.change(function () {
                            g.checkAllOrNot(this);
                        });
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

                    if (p.onChangeCells) {
                        p.onChangeCells(p);
                    }
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


            g.rePosDrag();
            g.fixHeight();

        } // function createColModel() {


        //2013-7-20 
        //添加自定义分页
        if (p.usepager && !p.autoPager) {
            g.pDiv.innerHTML = '<div></div>';
            $(g.bDiv).after(g.pDiv);

            var pager = $("div[name='customPager'][for='" + t.id + "']");
            $(pager).show();
            $('div', g.pDiv).append(pager);
        }

        //if (p.resizable && p.height != 'auto') {
        if (p.resizable) {
            g.vDiv.className = 'vGrip';
            $(g.vDiv)
		.html('<span></span>');
            $(g.bDiv).after(g.vDiv);
        }

        if (p.resizable && p.width != 'auto' && !p.nohresize) {
            g.rDiv.className = 'hGrip';
            $(g.rDiv)
		             .html('<span></span>')
		             .css('height', $(g.gDiv).height());
            if ($.browser.msie && $.browser.version < 7.0) {
                $(g.rDiv).hover(function () { $(this).addClass('hgOver'); }, function () { $(this).removeClass('hgOver'); });
            }
            $(g.gDiv).append(g.rDiv);
        }

        // add pager
        if (p.usepager && p.autoPager) {
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
            $('.pcontrol input', g.pDiv).keydown(function (e) {
                if (e.keyCode == 13) {
                    g.changePage('input');
                    e.preventDefault();
                }
            });
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

        var gh = $(g.bDiv).height();
        var gtop = g.bDiv.offsetTop;
        g.block.className = 'gBlock';
        var blockloading = $("<div/>");
        blockloading.addClass("loading");
        $(g.block).append(blockloading);

        setLoadingBlock();

        //add block
        function setLoadingBlock() {

            gh = $(g.bDiv).height();
            gtop = g.bDiv.offsetTop;
            $(g.block).css({
                width: g.bDiv.style.width,
                height: gh,
                position: 'relative',
                marginBottom: (gh * -1),
                zIndex: 1,
                top: gtop,
                left: '0px'
            });
        }
        $(g.block).fadeTo(0, p.blockOpacity);

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


        //browser adjustments
        if ($.browser.msie && $.browser.version < 7.0) {
            $('.hDiv,.bDiv,.mDiv,.pDiv,.vGrip,.tDiv, .sDiv', g.gDiv)
			.css({ width: '100%' });
            $(g.gDiv).addClass('ie6');
            if (p.width != 'auto') $(g.gDiv).addClass('ie6fullwidthbug');
        }

        //make grid functions accessible
        t.p = p;
        t.grid = g;

        if (p.onInited) {
            var newP = p.onInited(p);
            if (newP) {
                p = newP;
            }
        }

        // load data
        if (p.url && p.autoload) {
            g.populate(true);
        }
        else {
            if (!p.data) {
                p.data = { page: 1, rows: [], total: 0 };
            }
            g.addData(p.data);

            if (p.data.rows.length == 0) {
                var emptyHtml = [];
                emptyHtml.push("<div class='flexiGridEmpty'>", p.data.emptyHtml, "</div>");
                $(g.bDiv).append(emptyHtml.join(""));
            }

            if (p.onLoaded) {
                var newp = p.onLoaded(p);
                if (newp) {
                    p = newp;
                }
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
    $.fn.changePage = function (type) {
        return this.each(function () {
            if (this.grid) {
                this.grid.changePage(type);
            }
        })
    };
    //不要再使用此方法，请使用changePage
    $.fn.ChangePage = function (type) {
        return this.each(function () {
            if (this.grid) {
                this.grid.changePage(type);
            }
        })
    };

    //切换行消息的显示/隐藏状态
    $.fn.toggleRowMessage = function (id) {
        var elementId = "message" + id;
        $("#" + elementId, this[0].grid.bDiv).toggle();

        if (!this[0].p.mutilRowMessage) {
            $("tr[type='itemMessage']:not(#" + elementId + ")", this[0].grid.bDiv).hide();
        }
    };

    $.fn.showLoading = function () {
        this.each(function () {
            if (this.grid) {
                this.grid.showLoading(true);
            }
        });
    };
    $.fn.hideLoading = function () {
        this.each(function () {
            if (this.grid) {
                this.grid.hideLoading();
            }
        });
    };

    $.fn.flexOptions = function (p) { //function to update general options

        return this.each(function () {
            if (this.grid) $.extend(this.p, p);
        });

    }; //end flexOptions
    //不要再使用此方法，请使用getOptions
    $.fn.GetOptions = function () {
        if (this[0].grid) {
            return this[0].p;
        }
        return null;
    };
    $.fn.getOptions = function () {
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
    // 执行命令
    $.fn.command = function (commandName) {
        if (this[0].grid) {
            var checkedRows = this[0].grid.getCheckedRows();
            var rowIndexs = checkedRows.join(",")
            this[0].grid.operateCallBack(commandName, rowIndexs);
        }
    };
    //切换指定行换中状态
    $.fn.setRowsCheckStatus = function (selItems, status, raiseEvent) {
        var $ck = $("input.itemchk", this);
        var p = this[0].p;
        for (var i = 0; i < selItems.length; i++) {
            for (var j = 0; j < $ck.length; j++) {
                var chkValue = $($ck[j]).attr("dataValue");
                var $t = $($ck[j]).parent().parent().parent();
                if (chkValue == selItems[i]) {
                    //选中
                    $($ck[j]).attr("checked", status);

                    if ($t.hasClass("trSelected") && !status) {
                        //$ck.length > 0 && ($ck[0].checked = false);
                        $t.removeClass("trSelected");
                    }
                    else if (!$t.hasClass("trSelected") && status) {
                        //$ck.length > 0 && ($ck[0].checked = true);
                        $t.addClass("trSelected");
                    }

                    if (p.onRowChecked && raiseEvent) {
                        p.onRowChecked($ck);
                    }

                    break;
                }
            }
        }

        $(this).changeHeadCheckStatus();
    };

    $.fn.refreshColModel = function () {
        this[0].grid.refreshColModel();
    };

    //切换全部行换中状态 
    $.fn.setAllRowsCheckStatus = function (status, raiseEvent) {
        var $ck = $("input.itemchk", this);
        var p = this[0].p;

        for (var j = 0; j < $ck.length; j++) {
            var chkValue = $($ck[j]).attr("dataValue");
            var $t = $($ck[j]).parent().parent().parent();

            //选中
            $($ck[j]).attr("checked", status);
            if ($t.hasClass("trSelected") && !status) {
                $t.removeClass("trSelected");
            }
            else if (!$t.hasClass("trSelected") && status) {
                $t.addClass("trSelected");
            }

            if (p.onRowChecked && raiseEvent) {
                p.onRowChecked($ck);
            }
        }

        $("input[name='headcheck']", this.g).attr("checked", status);
    };

    //根据每行选中状态，更换“全选”复选框状态
    $.fn.changeHeadCheckStatus = function () {
        this[0].grid.changeHeadItemCheckStatus();
    }
    $.fn.getRow = function (keyValue) {
        var row = null;
        if (this[0].p.data && this[0].p.data.rows) {
            for (var i = 0; i < this[0].p.data.rows.length; i++) {
                var temp = this[0].p.data.rows[i];
                if (temp.id == keyValue) {
                    row = temp;
                }
            }
        }
        return row;
    }


    // 获取选中的行，返回选中行的所有数据
    $.fn.getSelectedRows = function () {
        if (this[0].grid) {
            return this[0].grid.getSelectedRows();
        }
        return [];
    };

    //设置单元格内容。rowId，行主键值；cellIndex，第几个单元格；cellHtml：单元格内容
    $.fn.setCellHtml = function (rowId, cellIndex, cellHtml) {
        var option = this[0].p;
        var _ths = this;
        if (option && option.data && option.data.rows && option.data.rows.length > 0) {
            $(option.data.rows).each(function () {
                if (this.id == rowId) {
                    this.cell[cellIndex].cellHtml = cellHtml;
                    var selector = "tr[key='" + rowId + "'] td:eq(" + cellIndex + ")";
                    $(selector, _ths[0].grid.bDiv).html(cellHtml);
                    return;
                }
            });
        }
        this.p = option;
    };

    $.fn.flexToggleCol = function (cid, visible) { // function to reload grid

        return this.each(function () {
            if (this.grid) this.grid.toggleCol(cid, visible);
        });

    }; //end flexToggleCol

    $.fn.flexAddData = function (data) { // function to add data to grid
        return this.each(function () {
            $(".flexiGridEmpty", this.grid.bDiv).remove();
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

    $.fn.fixGridWidth = function () {
        this[0].grid.fixGridWidth();
    };

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
