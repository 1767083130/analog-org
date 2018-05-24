/**
* TabView 配置参数
* 
* @return
*/
var TabOption = function() {
};
/**
* TabView 配置参数
*/
TabOption.prototype = {
    containerId: '', // 容器ID,
    pageid: '', // pageId 页面 pageID
    cid: '', // 指定tab的id
    position: top, // tab位置，可为top和bottom，默认为top
    activateDelegate: null, //当前活动页面改变事件处理函数
    closeDelegate: null, //页面关闭处理函数

    action: function(e, p) {

    }
};
/**
* Tab Item 配置参数
* 
* @return
*/
var TabItemOption = function() {
}
/**
* Tab Item 配置参数
*/
TabItemOption.prototype = {
    id: 'tab_', // tabId
    title: '', // tab标题
    url: '', // 该tab链接的URL
    isClosed: true
    // 该tab是否可以关闭
}
/**
* @param {}
*            option option 可选参数 containerId tab 容器ID pageid pageId 页面 pageID
*            cid cid tab ID
*/
function TabView(option) {
    var tab_context = {
        current: null,
        current_index: 0,
        current_page: null
    };
    var op = new TabOption();
    $.extend(op, option);
    var bottom = op.position == "bottom" ? "_bottom" : "";
    this.id = op.cid;
    this.pid = op.pageid;
    this.tabs = null;
    this.tabContainer = null;

    var tabTemplate = '<table class="tab_item"  id="{0}" border="0" cellpadding="0" cellspacing="0"><tr>' + '<td class="tab_item1"></td>'
			+ '<td class="tab_item2 tab_title">{1}</td>' + '<td class="tab_item2"><div class="tab_close"></div></td>' + '<td class="tab_item3"></td>'
			+ '</tr></table>';
    var tabContainerTemplate = '<div class="benma_ui_tab" id="{0}"><div class="tab_hr"></div></div>';
    var page = '<iframe id="{0}" frameborder="0" width="100%" height="100%" src="{1}"></iframe>';
    if (op.position == "bottom") {
        tabTemplate = '<table class="tab_item_bottom"  id="{0}" border="0" cellpadding="0" cellspacing="0"><tr>' + '<td class="tab_item1_bottom"></td>'
				+ '<td class="tab_item2_bottom tab_title">{1}</td>' + '<td class="tab_item2_bottom"><div class="tab_close tab_close_bottom"></div></td>'
				+ '<td class="tab_item3_bottom"></td>' + '</tr></table>';
        tabContainerTemplate = '<div class="benma_ui_tab benma_ui_tab_bottom" id="{0}"><div class="tab_hr tab_hr_bottom"></div></div>';
    }
    $("#" + op.containerId).append(tabContainerTemplate.replace("{0}", this.id));
    function initTab(el) {
        var theTab = $(el);
        var tab_item1 = $(theTab).find(".tab_item1" + bottom);
        var tab_item2 = $(theTab).find(".tab_item2" + bottom);
        var tab_item3 = $(theTab).find(".tab_item3" + bottom);
        if (tab_context.current == null || tab_context.current != this) {
            $(theTab).mouseover(function() {
                tab_item1.addClass("tab_item1_mouseover" + bottom);
                tab_item2.addClass("tab_item2_mouseover" + bottom);
                tab_item3.addClass("tab_item3_mouseover" + bottom);
            }).mouseout(function() {
                tab_item1.removeClass("tab_item1_mouseover" + bottom);
                tab_item2.removeClass("tab_item2_mouseover" + bottom);
                tab_item3.removeClass("tab_item3_mouseover" + bottom);
                //updated by webNuke 增加一个operate参数,1--添加；2--修改；0--一般。
            }).click(function(event, operate) {
                if (operate == null) operate = 0;
                //end updated
                if (tab_context.current != null) {
                    $(tab_context.current).find(".tab_item1" + bottom).removeClass("tab_item1_selected" + bottom);
                    $(tab_context.current).find(".tab_item2" + bottom).removeClass("tab_item2_selected" + bottom);
                    $(tab_context.current).find(".tab_item3" + bottom).removeClass("tab_item3_selected" + bottom);
                    $(tab_context.current).find(".tab_close").addClass("tab_close_noselected");
                }
                tab_item1.addClass("tab_item1_selected" + bottom);
                tab_item2.addClass("tab_item2_selected" + bottom);
                tab_item3.addClass("tab_item3_selected" + bottom);
                tab_context.current = this;
                $(tab_context.current).find(".tab_close").removeClass("tab_close_noselected");
                activate($(this).attr("id"), operate);
            });
            var tab_close = $(theTab).find(".tab_close").mouseover(function() {
                $(this).addClass("tab_close_mouseover");
            }).mouseout(function() {
                $(this).removeClass("tab_close_mouseover");
            }).click(function() {
                close(theTab.attr("id"));
            });
        }
    }

    //Updated by webnuke 添加一个参数               
    //operate参数,1--添加；2--修改；0-- 一般。
    //activate page 此函数激活page
    function activate(id, operate) {
        //end updated
        if (tab_context.current_page) {
            tab_context.current_page.hide();
        }
        tab_context.current_page = $("#page_" + id);
        tab_context.current_page.show();
        op.action($("#" + id), tab_context.current_page);

        if (operate != 2) { //修改不会引起当前Tab的转移
            if (op.activateDelegate != null) {
                var oldTab = this.tab_context;
                var e = new wnk.TabContainer.activeEventArgs(id, operate);
                op.activateDelegate(this, e);
            }
        }
        //end updated
    }

    //Updated by webNuke
    //添加下面两个方法
    this.getTab = function(id) {
        var tabs = this.tabs;
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (tab.id == id) {
                return tab;
            }
        }
    }

    this.setActivateDelegate = function(handler) {
        this.activateDelegate = handler;
        op.activateDelegate = handler;
    }
    //end updated

    function close(id) {
        var close_page = $("#page_" + id);
        var close_tab = $("#" + id);
        if ($(tab_context.current).attr("id") == close_tab.attr("id")) {
            var next = close_tab.next();
            if (next.attr("id")) {
                //activate(next.attr("id"));
                $("#" + next.attr("id")).trigger("click", 0);
            }
            else {
                var pre = close_tab.prev();
                if (pre.attr("id")) {
                    //activate(pre.attr("id"));
                    $("#" + pre.attr("id")).trigger("click", 0);
                }
            }
        }
        else {
        }
        // close_page.find("iframe").remove();
        close_page.remove();
        close_tab.remove();

        if (op.closeDelegate != null) {
            op.closeDelegate(id);
        }
    }
    this.init = function() {
        this.tabContainer = $("#" + this.id);
        this.tabs = this.tabContainer.find(".tab_item" + bottom);
        this.tabs.each(function() {
            initTab(this);
        });
    }
    this.add = function(option) {
        var op1 = new TabItemOption();
        $.extend(op1, option);
        if (op1.title.length > 10) {
            op1.title = op1.title.substring(0, 10);
        }
        if (op1.title.length < 4) {
            op1.title = "&nbsp;&nbsp;" + op1.title + "&nbsp;";
        }
        var pageHtml = page.replace("{0}", "page_" + op1.id).replace("{1}", op1.url);
        $("#" + this.pid).append(pageHtml);
        var html = tabTemplate.replace("{0}", op1.id).replace("{1}", op1.title);
        this.tabContainer.append(html);
        initTab($("#" + op1.id));
        if (!op1.isClosed) {
            $($("#" + op1.id)).find(".tab_close").hide();
        }
        // this.init();
        this.activate(op1.id);
    }
    this.update = function(option) {
        var id = option.id;
        // alert(option.url);
        $("#" + id).find(".tab_title").html(option.title);
        $("#" + id).trigger("click", [2]);
        // $("#page_" + id).find("iframe").attr("src", option.url);
        $("#page_" + id).attr("src", option.url);
        // document.getElementById()
    }
    this.activate = function(id) {
        // $("#" + id).trigger("click");
        // activate(id, 1);
        $("#" + id).trigger("click", 1);

    }
    this.close = function(id) {
        close(id);
    }

    this.init();
}


//对以上代码重新封装，与其它控件访问方法保持一致
Type.registerNamespace('wnk');
wnk.TabContainer = function(element) {
    wnk.TabContainer.initializeBase(this, [element]);

    this._tab = null;
    this.activedTab = null;
    this._activateDelegate = null;

    this.containerId = 'tab_menu';
    this.pageid = 'page';
    this.cid = 'tab_po';
}

//关闭页面时执行的函数
function TabCloseHandler(id) {
    var tab = this.getTab(id);
    if (tab == null) {
        var exception = Error.create("the tab is not exist!", { tabid: id });
        throw exception;
    }

    Array.remove(this._tabs, tab);
}

wnk.TabContainer.prototype = {
    initialize: function() {

        //获取容器
        this._container = this.get_element();
        this._tabs = [];

        //初始化
        this._initTabContainer();
    },


    _initTabContainer: function() {
        var closeHandler = Function.createDelegate(this, TabCloseHandler);

        this._tabView = new TabView({
            containerId: this.containerId,
            pageid: this.pageid,
            cid: this.cid,
            activateDelegate: this.get_activateDelegate(),
            closeDelegate: closeHandler
        });

    },
    add: function(tab) {
        if (this.getTab(tab.id) != null) {
            var exception = Error.create("the tab is exiting!", { tabid: tab.id });
            throw exception;
        }

        var option = tab.convertToJson()
        Array.add(this._tabs, tab);
        this._tabView.add(option);

        this.activedTab = tab;
    },
    update: function(tab) {
        var option = tab.convertToJson()
        this._tabView.update(option);

        var index = Array.indexOf(this._tabs, tab, 0);
        if (index >= 0) {
            this._tabs[index] = tab;
        }

    },

    activate: function(id, isAdd) {
        this._tabView.activate(id, isAdd);
        this.activedTab = this.getTab(id);
    },
    close: function(id) {
        this._tabView.close(id);
        tabCloseHandler(id);
    },
    getTabs: function() {
        return this._tabs;
    },
    getTab: function(id) {
        for (var a = 0, f = this._tabs.length; a < f; a++) {
            if (this._tabs[a].id == id) {
                return this._tabs[a];
            }
        }
    },
    getCurrentTab: function() {
        return this.activedTab;
        //        var tabId = this._tabView.getCurrentTab();
        //        return this.getTab(tabId);
    },
    get_activateDelegate: function() {
        return this.activateDelegate;
    },
    set_activateDelegate: function(value) {
        this.activateDelegate = value;
        this._tabView.setActivateDelegate(value);
    },
    dispose: function() {
        this._tab = null;
        this.activedTab = null;
        this._activateDelegate = null;

        this.containerId = null;
        this.pageid = null;
        this.cid = null;
        wnk.TabContainer.callBaseMethod(this, 'dispose');
    }


}
wnk.TabContainer.registerClass("wnk.TabContainer", AjaxControlToolkit.ControlBase);

//Tab
wnk.Tab = function(option) {
    this.id = "tab_";
    this.title = "Title";
    this.url = "";
    this.enableClose = false;
    this.pageMode = 0;
    this.language = null;

    this.initialize(option);

}

function wnk$Tab$ConvertToJson() {
    var options = {
        id: this.id,
        title: this.title,
        url: this.url,
        enableClose: this.enableClose,
        pageMode: this.pageMode
    }

    return options;
}

wnk.Tab.prototype = {
    convertToJson: wnk$Tab$ConvertToJson,
    initialize: function(option) {
        if (option != null) {
            this.id = (option.id == null) ? this.id : option.id;   //Id
            this.title = (option.title == null) ? this.title : option.title; //标题
            this.url = (option.id == null) ? this.url : option.url;  //链接的Url
            this.enableClose = (option.enableClose == null) ? this.enableClose : option.enableClose; //是否可以关闭
            this.pageMode = (option.pageMode == null) ? this.pageMode : option.pageMode; //页面的显示模式
            this.language = (!option.language) ? this.language : option.language;    //显示的国际化语言
        }
    }
}
wnk.Tab.registerClass("wnk.Tab");


//事件参数
//关于evtType参数的说明：0，一般性点击引起的当前页面的转移；1，新增时引起的页面转移，除此之外都是0
wnk.TabContainer.activeEventArgs = function wnk$TabContainer$activeEventArgs(newTab, changeEvt) {
    wnk.TabContainer.activeEventArgs.initializeBase(this);
    //    this._oldTab = oldTab;
    this._newTab = newTab; //转移后的新页面
    this._changeEvt = 0; //引起页面转移的事件类型，0，一般性点击引起的当前页面的转移；1，新增时引起的页面转移，除此之外都是0
}
//function wnk$TabContainer$activeEventArgs$get_oldTab() {
//     return this._oldTab;
//}
//function wnk$TabContainer$activeEventArgs$set_oldTab(value) {
//    this._oldTab = value;
//}

function wnk$TabContainer$activeEventArgs$get_newTab() {
    return this._newTab;
}
function wnk$TabContainer$activeEventArgs$set_newTab(value) {
    this._newTab = value;
}

function wnk$TabContainer$activeEventArgs$get_ChangeEvt() {
    return this._changeEvt;
}
function wnk$TabContainer$activeEventArgs$set_ChangeEvt(value) {
    this._changeEvt = value;
}

wnk.TabContainer.activeEventArgs.prototype = {
    //    get_oldTab: wnk$TabContainer$activeEventArgs$get_oldTab,
    //    set_oldTab: wnk$TabContainer$activeEventArgs$set_oldTab,
    get_newTab: wnk$TabContainer$activeEventArgs$get_newTab,
    set_newTab: wnk$TabContainer$activeEventArgs$set_newTab,
    get_ChangeEvt: wnk$TabContainer$activeEventArgs$get_ChangeEvt,
    set_ChangeEvt: wnk$TabContainer$activeEventArgs$set_ChangeEvt
}
wnk.TabContainer.activeEventArgs.registerClass('wnk.TabContainer.activeEventArgs', Sys.EventArgs);