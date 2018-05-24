// FlexiGrid使用Pagination分页
/* 使用说明：
var option = { pagerContainer: $("#pagerContainer") };
$("#<%=FlexiGrid.ContentTableID %>").flexiGridPager(option); //初始化
$("#<%=FlexiGrid.ContentTableID %>").changePageSize(20); //修改每页大小
$("#<%=FlexiGrid.ContentTableID %>").changePageIndex(2); //修改当前页
特别注意：FlexiGrid的preProcess事件（服务器控件中的LoadJsFunction）已被此处占用，不能再在别处使用
使用实例：
var option = { pagerContainer: $("#pagerContainer") };
$("#<%=FlexiGrid.ContentTableID %>").flexiGridPager(option);

$("#selPageSize").change(function () {
var pageSize = $(this).val();
$("#<%=FlexiGrid.ContentTableID %>").changePageSize(pageSize);
});
options参数说明
pagerContainer: null, //分页的界面元素
pageSize: 10, //每页大小
pageIndex: 0, //当前页
numDisplayEntries: 3, //分页时，页面导航中间显示几个链接
numEdgeEntries: 3 //分页时，页面导航两边显示几个链接
autoPager:true //是否全部自动生成，否则，只生成Pagination中的界面

*/
(function () {

    $.fn.flexiGridPager = function (options) {
        var _options;
        var _grid = null;
        var _pager = null;

        // build main options before element iteration  
        options = $.extend({}, $.fn.flexiGridPager.defaults, options);
        _options = options;
        //options.recordsCount = $(_grid).getOptions().total;
        _grid = this;

        if (options.autoPager) {
            if (options.autoPagerInfo) {
                renderPager();
            }
            _pager = $("#Pagination", _grid[0].grid.gDiv);
        }
        else {
            _pager = $(options.pagerContainer);
        }

        var gridOptions = $(this).getOptions();
        initPagination(options);
        gridOptions.preProcess = function (data) {
            gridOptions = $(_grid).getOptions();

            var recordsCount = data.total;
            options.recordsCount = recordsCount;
            options.pageIndex = gridOptions.newp - 1;
            options.pageSize = gridOptions.rp;
            if (options.pageIndex < 0) {
                options.pageIndex = 0;
            }
            initPagination(options);

            var pageNo = options.pageIndex + 1;
            $("#txtPageNo", _grid[0].grid.gDiv).val(pageNo);
            $("#lblTotalRecords", _grid[0].grid.gDiv).html(recordsCount);
            return data; //必须返回，否则数据丢失
        }
        $(this).flexOptions(gridOptions);


        function renderPager() {
            gridOptions = $(_grid).getOptions();
            var sHtml = [];
            sHtml.push('<div class="rightPager" id="Pagination"></div>');
            sHtml.push('            <div class="leftPager">');

            sHtml.push('               <select class="chosen-select" id="selPageSize">');
            if (gridOptions && gridOptions.rpOptions) {
                for (var i = 0; i < gridOptions.rpOptions.length; i++) {
                    var pageSize = gridOptions.rpOptions[i];
                    sHtml.push('<option value="', pageSize, '">每页', pageSize, '行</option>');
                }
            }
            sHtml.push('              </select>');

            sHtml.push('               &nbsp; 转至第');
            sHtml.push('                <input id="txtPageNo" value="1" type="text" size="2" />页');
            sHtml.push('               总计<span id="lblTotalRecords" style="font:bold"></span>条');
            sHtml.push('            </div>');
            $(_options.pagerContainer, _grid).html(sHtml.join(""));

            $("#selPageSize", _grid[0].grid.gDiv).change(function () {
                var pageSize = $(this).val();
                $(_grid).changePageSize(pageSize);
            });

            $("#txtPageNo", _grid[0].grid.gDiv).keydown(function (e) {
                if (e.keyCode == 13) {
                    var reg = /^(-|\+)?\d+$/;
                    var pageNo = $(this).val();
                    if (!reg.test(pageNo)) {
                        pageNo = 1;
                    }
                    else {
                        pageNo = parseInt(pageNo);
                    }

                    var pageIndex = pageNo - 1;
                    $(_grid).changePageIndex(pageIndex);
                    e.preventDefault();
                }
            });
        }

        function pageSelectCallback(page_index, jq) {
            var p = $(_grid).getOptions();
            var arr = p.colModel;
            p.newp = page_index + 1;
            $(_grid).flexOptions(p);
            $(_grid).flexReload();

            return false;
        }

        function initPagination(options) {

            var pageSize = options.pageSize;
            var recordsCount = options.recordsCount;
            var pageCount = parseInt(recordsCount / pageSize);
            pageCount = (pageCount * pageSize < recordsCount) ? pageCount + 1 : pageCount;
            if (pageCount < 2) {
                $(options.pagerContainer).hide();
            }
            else {
                $(options.pagerContainer).show();
            }

            var opt = {
                callback: pageSelectCallback,
                items_per_page: options.pageSize // Show only one item per page
            };
            opt.num_display_entries = options.numDisplayEntries;
            opt.num_edge_entries = options.numEdgeEntries;
            opt.prev_text = "上一页";
            opt.next_text = "下一页";
            opt.current_page = options.pageIndex;
            $(_pager).pagination(recordsCount, opt);
        }

    };

    $.fn.changePageSize = function (pageSize) {
        var p = $(this).getOptions();
        var recordsCount = p.total;
        var pageCount = parseInt(recordsCount / pageSize);
        pageCount = (pageCount * pageSize < recordsCount) ? pageCount + 1 : pageCount;

        var extParam = p.extParam;
        p.rp = pageSize;
        p.pages = pageCount;
        $(this).flexOptions(p);
        $(this).flexReload();
    };

    $.fn.changePageIndex = function (pageIndex) {
        var p = $(this).GetOptions();
        var extParam = p.extParam;

        p.newp = pageIndex + 1;
        $(this).flexOptions(p);
        $(this).flexReload();
    };

    $.fn.getPagerOptions = function () {
        return _options;
    }

    // 插件的defaults  
    $.fn.flexiGridPager.defaults = {
        pagerContainer: null,
        pageSize: 10, //每页大小
        pageIndex: 0, //当前页
        recordsCount: 0, //数据总行数,只读，请不要给它赋值
        numDisplayEntries: 3, //分页时，页面导航中间显示几个链接
        numEdgeEntries: 2, //分页时，页面导航两边显示几个链接
        autoPager: true, //是否输出分页的界面元素
        autoPagerInfo: true //当autoPager=true时，是否输出分页的一些信息，如总共多少页。值为false时，只输出页导航
    };
    
})();  