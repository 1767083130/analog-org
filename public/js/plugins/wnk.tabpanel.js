//对以上代码重新封装，与其它控件访问方法保持一致Type.registerNamespace('wnk');
wnk.TabContainer = function(element) {
    wnk.TabContainer.initializeBase(this, [element]);

    this._tab = null;
    this.activedTab = null;
    this.activateDelegate = null;

    this.containerId = 'tab_menu';
    this.pageid = 'page';
    this.cid = 'tab_po';
}


wnk.TabContainer.prototype = {
    initialize: function () {

        //获取容器
        this._container = this.get_element();
        this._tabs = [];
    },
    initTabContainer: function () {
        var json = dnn.getVar("WNKTabPanel_DNNNodes");
        var dnnNodes = dnn.evalJSON("{" + json + "}");

        //初始化
        this._initTabContainer(dnnNodes);
    },
    /*初始化*/
    _initTabContainer: function (dnnNodes) {
        //        var closeHandler = Function.createDelegate(this, TabCloseHandler);

        //        this._tabView = new TabView({
        //            containerId: this.containerId,
        //            pageid: this.pageid,
        //            cid: this.cid,
        //            activateDelegate: this.get_activateDelegate(),
        //            closeDelegate: closeHandler
        //        });
        var items = [];

        var closeHandler = Function.createDelegate(this, this._tabCloseHandler);
        $(this._container).tabpanel({ items: items, closeDelegate: closeHandler });

        //添加默认tab
        if (dnnNodes && dnnNodes.nodes) {
            for (var i = 0; i < dnnNodes.nodes.length; i++) {
                var node = dnnNodes.nodes[i];
                //var item = {id: node.id, text: node.txt, isactive: true, closeable: true,url: node.url,onactive:this.activateDelegate};
                //Array.add(items, item);
                var nodeUrl = node.url;
                var option = {
                    id: node.id,
                    title: node.txt,
                    url: nodeUrl, //applicationURL(sender.key),
                    isClosed: true,
                    pageMode: 0
                };

                var tab = new wnk.Tab(option);
                //Array.add(this._tabs, tab);

                this.add(tab);

                //最后一项加载时才触发激活Tab改变事件
                //if(i == dnnNodes.nodes.length -1 && this.activateDelegate){ 
                //     var e = new wnk.TabContainer.activeEventArgs(node.id, 1);
                //     this.activateDelegate(this,e);
                //}
            }
        }


        //如果没有任何打开的tab，则隐藏
        if (!this._tabs || this._tabs.length < 1) {
            $(this._container).css({ "display": "none" });
        }
        else {
            $(this._container).css({ "display": "block" });
        }
    },

    //关闭页面时执行的函数
    _tabCloseHandler: function (oldTabId, newTabId) {
        var oldTab = this.getTab(oldTabId);
        if (oldTab == null) {
            var exception = Error.create("the tab is not exist!", { tabid: id });
            throw exception;
        }

        Array.remove(this._tabs, oldTab);

        //触发激活tab改变事件
        //        if(this.activateDelegate){
        //            var e = new wnk.TabContainer.activeEventArgs(newTabId, 0);
        //            this.activateDelegate(this,e);
        //        }

        //如果没有任何打开的tab，则隐藏
        if (!this._tabs || this._tabs.length < 1) {
            $(this._container).css({ "display": "none" });
        }
        else {
            $(this._container).css({ "display": "block" });
        }
    },

    /*添加Tab（打开）*/
    add: function (tab) {
        //        if (this.getTab(tab.id) != null) {
        //            var exception = Error.create("the tab is exiting!", { tabid: tab.id });
        //            throw exception;
        //        }

        //        var option = tab.convertToJson()
        //        Array.add(this._tabs, tab);
        //        this._tabView.add(option);

        //        this.activedTab = tab;
        var option = tab.convertToJson();

        Array.add(this._tabs, tab);
        this.activedTab = tab;

        //          var tabtitle = "tab" + l;
        var onActiveDelegate = Function.createDelegate(this, function (sender, e) {
            //触发激活tab改变事件
            if (this.activateDelegate) {
                //var e = new wnk.TabContainer.activeEventArgs(tabId, 1);
                this.activateDelegate(sender, e);
            }
        });
        $(this._container).addtabitem({ id: tab.id, text: tab.title, isactive: true, closeable: true, url: tab.url, onactive: onActiveDelegate });

        $(this._container).css({ "display": "block" });

        //触发激活tab改变事件
        //        if(this.activateDelegate){
        //            var e = new wnk.TabContainer.activeEventArgs(tab.id, 1);
        //            this.activateDelegate(this,e);
        //        }
    },

    /*更新*/
    update: function (tab) {
        //var option = tab.convertToJson()
        //this._tabView.update(option);
        $(this._container).refreshtab(tab.id, tab.url);

        //TODO 下面代码有问题
        var index = Array.indexOf(this._tabs, tab, 0);
        if (index >= 0) {
            this._tabs[index] = tab;
        }
    },

    /*激活Tab*/
    activate: function (id, isAdd) {
        //        this._tabView.activate(id, isAdd);
        //        this.activedTab = this.getTab(id);
        $(this._container).opentabitem({ id: id });

    },
    /*关闭Tab*/
    close: function (id) {
        this._tabView.close(id);

        tabCloseHandler(id);
    },
    /*获取所有的Tab*/
    getTabs: function () {
        return this._tabs;
    },
    /*根据ID获取Tab*/
    getTab: function (id) {
        for (var a = 0, f = this._tabs.length; a < f; a++) {
            if (this._tabs[a].id == id) {
                return this._tabs[a];
            }
        }
    },
    /*获取当前激活的Tab*/
    getCurrentTab: function () {
        return $(this._container).getactiveitem();
    },

    get_activateDelegate: function () {
        return this.activateDelegate;
    },
    set_activateDelegate: function (value) {
        this.activateDelegate = value;
    },

    dispose: function () {
        this._tab = null;
        this.activedTab = null;
        this.activateDelegate = null;

        this.containerId = null;
        this.pageid = null;
        this.cid = null;
        wnk.TabContainer.callBaseMethod(this, 'dispose');
    }
}
wnk.TabContainer.registerClass("wnk.TabContainer",  Sys.UI.Behavior);

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



try { document.execCommand("BackgroundImageCache", false, true); } catch (e) { }
function getiev() {
    var userAgent = window.navigator.userAgent.toLowerCase();
    $.browser.msie8 = $.browser.msie && /msie 8\.0/i.test(userAgent);
    $.browser.msie7 = $.browser.msie && /msie 7\.0/i.test(userAgent);
    $.browser.msie6 = !$.browser.msie8 && !$.browser.msie7 && $.browser.msie && /msie 6\.0/i.test(userAgent);
    var v;
    if ($.browser.msie8) {
        v = 8;
    }
    else if ($.browser.msie7) {
        v = 7;
    }
    else if ($.browser.msie6) {
        v = 6;
    }
    else { v = -1; }
    return v;
}
$(document).ready(function() {
    var v = getiev()
    if (v > 0) {
        $(document.body).addClass("ie ie" + v);
    }

});/// <reference path="../intellisense/jquery-1.4.1-vsdoc.js" />
; (function ($) {
    $.fn.tabpanel =function(option){
        var dfop ={
               items:[], //选项卡数据项 {id,text,classes,disabled,closeable,content,url,cuscall,onactive}
               width:1000,
               height:400,
               scrollwidth:100,//如果存在滚动条，点击按钮次每次滚动的距离
               autoscroll:true, //当选项卡宽度大于容器时自动添加滚动按钮
               closeDelegate:null //关闭时执行函数
       };
       var headerheight=28;
       $.extend(dfop, option);      
       var me =$(this).addClass("x-tab-panel");   //.width(dfop.width);
       innerwidth = dfop.width-2;
       //构建Tab的Html    
       var tcs= dfop.autoscroll?"x-tab-scrolling-top":"";    
       //updated by webnuke  
       //var header = $("<div class='x-tab-panel-header x-unselectable "+tcs+"' unselectable='on' style='width:"+innerwidth+"px;MozUserSelect:none;KhtmlUserSelect:none;'></div>");
       var header = $("<div class='x-tab-panel-header x-unselectable "+tcs+"' unselectable='on' style='height:5%;width:100%;MozUserSelect:none;KhtmlUserSelect:none;'></div>");
       //end updated
       var stripwrap = $("<div class='x-tab-strip-wrap'/>");
       var scrollerright = $("<div class='x-tab-scroller-right x-unselectable' style='height: 24px; visibility: hidden; mozuserselect: none; khtmluserselect: none;' unselectable='on'/>");
       var scrollerleft = $("<div class='x-tab-scroller-left x-unselectable' style='height: 24px; visibility: hidden; mozuserselect: none; khtmluserselect: none;' unselectable='on'/>");
       var ulwrap = $("<ul class='x-tab-strip x-tab-strip-top' id='tabpanel-header'></ul>");
       var stripspacer = $("<div class='x-tab-strip-spacer'/>");
       var litemp =[];
       for(var i=0,l=dfop.items.length; i<l ;i++)
       {          
           var item =dfop.items[i];
           builditemlihtml(item,litemp);
       }
       litemp.push("<li class='x-tab-edge'/><div class='x-clear'></div>");
       
       ulwrap.html(litemp.join(""));
       litemp =null;
       stripwrap.append(ulwrap);
       if(dfop.autoscroll)
       {
         header.append(scrollerright).append(scrollerleft);
       }
       header.append(stripwrap).append(stripspacer);
       var bodyheight=dfop.height-headerheight;
       var bodywrap = $("<div class='x-tab-panel-bwrap' style='width: 100%;height:95%;'/>");
       //updated by webnuke
       //var body = $("<div class='x-tab-panel-body x-tab-panel-body-top'/>").css({width:innerwidth,height:bodyheight});
       //end updated
       var body = $("<div class='x-tab-panel-body x-tab-panel-body-top' id='tabpanel-body'/>").css({width:'100%',height:'100%'});
       var bodytemp=[];
       for(var i=0,l=dfop.items.length; i<l ;i++){          
          var item =dfop.items[i];
          builditembodyhtml(item,bodytemp);       
       }
       
       body.html(bodytemp.join("")).appendTo(bodywrap);
       me.append(header).append(bodywrap);
       initevents();
       function builditemlihtml(item,parray)
       {           
           parray.push("<li id='tab_li_",item.id,"' class='",item.isactive?"x-tab-strip-active":"",item.disabled?"x-tab-strip-disabled":"",item.closeable?" x-tab-strip-closable":"",item.classes?" x-tab-with-icon":"","'>");
           parray.push("<a class='x-tab-strip-close' onclick='return false;'/>");
           parray.push("<a class='x-tab-right' onclick='return false;' href='#'>");
           parray.push("<em class='x-tab-left'><span class='x-tab-strip-inner'><span class='x-tab-strip-text ",item.classes||"","'>",item.text,"</span></span></em>");
           parray.push("</a></li>");    
       }
       function builditembodyhtml(item,parray)
       { 
          //updated by webnuke
          //parray.push("<div class='x-panel x-panel-noborder",item.isactive?"":" x-hide-display","' id='tab_item_",item.id,"' style='width:",innerwidth,"px'>");
          parray.push("<div class='x-panel x-panel-noborder",item.isactive?"":" x-hide-display","' id='tab_item_",item.id,"' style='width:100%;height:100%;'>");
          parray.push("<div class='x-panel-bwrap' style='width: 100%;height:100%;'>");
          //parray.push("<div class='x-panel-body x-panel-body-noheader x-panel-body-noborder'  id='tab_item_content_",item.id,"' style='position:relative;  width:",innerwidth,"px; height:",bodyheight,"px; overflow: auto;'>");
          parray.push("<div class='x-panel-body x-panel-body-noheader x-panel-body-noborder'  id='tab_item_content_",item.id,"' style=' width:100%; height:100%; overflow: auto;'>");
          //end updated 
          if(item.url){
            parray.push("<iframe name='tab_item_frame_",item.id,"' width='100%' height='100%'  id='tab_item_frame_",item.id,"' src='about:blank' frameBorder='0' />");
          }
          else if(item.cuscall){
            parray.push("<div class='loadingicon'/>");
          }
          else{
            parray.push(item.content);
          }
          parray.push("</div></div></div>");
       }
       function initevents()
       {
            //reset scoller
            resetscoller();
            scollerclick();
            ulwrap.find("li:not(.x-tab-edge)").each(function(e){
              inititemevents(this);
            });
       }
       function inititemevents(liitem)
       {
            liswaphover.call(liitem);
            liclick.call(liitem);
            closeitemclick.call(liitem);
       }
       function scollerclick()
       {
             if(dfop.autoscroll)
            {
                scrollerleft.click(function(e){scolling("left")});
                scrollerright.click(function(e){scolling("right")});
            }
       }
       function resetscoller()
       {
           if(dfop.autoscroll)
           {
               var edge = ulwrap.find("li.x-tab-edge");
               var eleft =edge.position().left;
               var sleft = stripwrap.attr("scrollLeft");              
               if( sleft+eleft>innerwidth )
               {
                    
                    header.addClass("x-tab-scrolling");
                    scrollerleft.css("visibility","visible");
                    scrollerright.css("visibility","visible");
                    if(sleft>0)
                    {
                       scrollerleft.removeClass("x-tab-scroller-left-disabled");
                    }
                    else{
                      scrollerleft.addClass("x-tab-scroller-left-disabled");
                    }
                    if(eleft>innerwidth)
                    {
                       scrollerright.removeClass("x-tab-scroller-right-disabled");
                    }
                    else{
                       scrollerright.addClass("x-tab-scroller-right-disabled");
                    }
                    dfop.showscrollnow =true;
                   
               }
               else
               {
                    header.removeClass("x-tab-scrolling");
                    stripwrap.animate({"scrollLeft":0},"fast");
                    scrollerleft.css("visibility","hidden");
                    scrollerright.css("visibility","hidden");
                    dfop.showscrollnow =false;
               }
           }
       }
       //
       function scolling(type,max)
       {
            if(!dfop.autoscroll || !dfop.showscrollnow)
            {
                return;
            }
            //var swidth = stripwrap.attr("scrollWidth");
            var sleft = stripwrap.attr("scrollLeft");
            var edge = ulwrap.find("li.x-tab-edge");
            var eleft = edge.position().left ;            
            if(type=="left"){
              if(scrollerleft.hasClass("x-tab-scroller-left-disabled"))
              {
                return;
              }           
              if(sleft-dfop.scrollwidth-20>0)
              {
                sleft -=dfop.scrollwidth;                
              }
              else{
                sleft =0;
                scrollerleft.addClass("x-tab-scroller-left-disabled");
              }
              if(scrollerright.hasClass("x-tab-scroller-right-disabled"))
               {
                  scrollerright.removeClass("x-tab-scroller-right-disabled");
               } 
              stripwrap.animate({"scrollLeft":sleft},"fast");
            }
            else{    
               if(scrollerright.hasClass("x-tab-scroller-right-disabled") && !max)
               {
                 return;
               }              
                //left + ;
               if(max || (eleft>innerwidth && eleft-dfop.scrollwidth-20<=innerwidth))
               {         
                 sleft = sleft + eleft-(innerwidth-38) ;
                 scrollerright.addClass("x-tab-scroller-right-disabled");
                 // sleft = eleft-innerwidth;
               }
               else
               {                 
                  sleft +=dfop.scrollwidth;                 
               }
               if(sleft>0)
               {
                  if(scrollerleft.hasClass("x-tab-scroller-left-disabled"))
                  {
                    scrollerleft.removeClass("x-tab-scroller-left-disabled");
                  }
               }              
              stripwrap.animate({"scrollLeft":sleft},"fast");
            }
       }
       function scollingToli(liitem)
       {
            var sleft = stripwrap.attr("scrollLeft");    
            var lleft = liitem.position().left;
            var lwidth = liitem.outerWidth(); 
            var edge = ulwrap.find("li.x-tab-edge");
            var eleft = edge.position().left ; 
            if(lleft<=0)
            {
                sleft +=(lleft-2) ;               
                if(sleft<0)
                {
                    sleft=0;
                    scrollerleft.addClass("x-tab-scroller-left-disabled");
                }   
                if(scrollerright.hasClass("x-tab-scroller-right-disabled"))
                {
                  scrollerright.removeClass("x-tab-scroller-right-disabled");
                }                    
                stripwrap.animate({"scrollLeft":sleft},"fast");
            }
            else{
                if(lleft+lwidth>innerwidth-40)
                {                     
                    sleft = sleft+lleft+lwidth+-innerwidth+40; // 40 =scrollerleft and scrollerrightwidth;
                    if(scrollerleft.hasClass("x-tab-scroller-left-disabled"))
                    {
                      scrollerleft.removeClass("x-tab-scroller-left-disabled");
                    } 
                    //滚到最后一个了，那么就要禁用right;
                    if(eleft-(lleft+lwidth+-innerwidth+40)<=innerwidth)
                    {
                        scrollerright.addClass("x-tab-scroller-right-disabled");
                    }
                    stripwrap.animate({"scrollLeft":sleft},"fast");

                }
            }
            liitem.click();           
            
       }
       function liswaphover()
       {
          $(this).hover(function(e){
              if(!$(this).hasClass("x-tab-strip-disabled"))
              {
                $(this).addClass("x-tab-strip-over");
              }
          },function(e){ 
              if(!$(this).hasClass("x-tab-strip-disabled"))
              {
                $(this).removeClass("x-tab-strip-over");
              }
          });
       }
       function closeitemclick()
       {
         if($(this).hasClass("x-tab-strip-closable"))
         {
            $(this).find("a.x-tab-strip-close").click(function(){
                var domId = $(this).parent().attr("id");
                var tabId = domId.substr(7);
                var newTabId = deleteitembyliid(domId);
                
                //updated by webnuke
                if (dfop.closeDelegate) {
                    dfop.closeDelegate(tabId,newTabId);
                }
                //end updated
            });
         }
       }
       function liclick()
       {
          $(this).click(function(e){
             var itemid = this.id.substr(7);
             var curr = getactiveitem();
             if( curr !=null && itemid == curr.id)
             {
                return;
             }
             var clickitem = getitembyid(itemid);
             if(clickitem && clickitem.disabled)
             {
                 return ;
             }
             if(curr)
             {             
                $("#tab_li_"+curr.id).removeClass("x-tab-strip-active");
                $("#tab_item_"+curr.id).addClass("x-hide-display");
                curr.isactive =false;
             }
             if(clickitem)
             {
                
                $(this).addClass("x-tab-strip-active");
                $("#tab_item_"+clickitem.id).removeClass("x-hide-display");
                if(clickitem.url)
                {
                    var cururl = $("#tab_item_frame_"+clickitem.id).attr("src");
                    if(cururl =="about:blank")
                    {
                        $("#tab_item_frame_"+clickitem.id).attr("src",clickitem.url);
                    }
                }
                else if(clickitem.cuscall && !clickitem.cuscalled)
                {
                   var panel = $("#tab_item_content_"+clickitem.id);
                   var ret = clickitem.cuscall(this,clickitem,panel);
                   clickitem.cuscalled =true;
                   if(ret) //如果存在返回值，且不为空
                   {
                       clickitem.content = ret;
                       panel.html(ret);
                   }
                }
                clickitem.isactive =true;
                if(clickitem.onactive)
                {
                   //updated by webnuke
                   var e = new wnk.TabContainer.activeEventArgs(clickitem.id, 0);
                   clickitem.onactive(this,e);
                   //clickitem.onactive.call(this,clickitem);
                   //end updated 
                }
             }
          });
       }
       //获取当前活跃项
       function getactiveitem()
       {
            for(var i=0,j=dfop.items.length;i<j ;i++)
            {
                if(dfop.items[i].isactive)
                {
                    return dfop.items[i];
                    break;
                }
            }
            return null;
       }
       //根据ID获取Item数据
       function getitembyid(id)
       {
            for(var i=0,j=dfop.items.length;i<j ;i++)
            {
                if(dfop.items[i].id == id)
                {
                    return dfop.items[i];
                    break;
                }
            }
            return null;
       }
       function getIndexbyId(id)
       {
            for(var i=0,j=dfop.items.length;i<j ;i++)
            {
                if(dfop.items[i].id == id)
                {
                    return i;
                    break;
                }
            }
            return -1;
       }
       
       /*
       //添加项
       function addtabitem(item)
       {
          var chkitem =getitembyid(item.id);
          if(!chkitem){
            var isactive =item.isactive;
            item.isactive =false;
            var lastitem = dfop.items[dfop.items.length-1];
            dfop.items.push(item);
            var lastli = $("#tab_li_"+lastitem.id);
            var lastdiv = $("#tab_item_"+lastitem.id);
            var litemp =[];
            var bodytemp = [];
            builditemlihtml(item,litemp);
            builditembodyhtml(item,bodytemp);
            var liitem = $(litemp.join(""));
            var bodyitem= $(bodytemp.join(""));
            lastli.after(liitem);
            lastdiv.after(bodyitem);
            //事件
            var li = $("#tab_li_"+item.id);
            inititemevents(li);           
            if(isactive)
            {                
               li.click();
            }    
            resetscoller(); 
            scolling("right",true);
          }
          else{
            alert("指定的tab项已存在!");
          }
       }
       */
       
       //添加项
       function addtabitem(item)
       {
          var chkitem =getitembyid(item.id);
          if(!chkitem){
            var isactive =item.isactive;
            item.isactive =false;
            var lastitem = dfop.items[dfop.items.length-1];
            dfop.items.push(item);
            //updated by webnuke
            var litemp =[];
            var bodytemp = [];
            builditemlihtml(item,litemp);
            builditembodyhtml(item,bodytemp);
            var liitem = $(litemp.join(""));
            var bodyitem= $(bodytemp.join(""));
                
            var lastli = null;
            var lastdiv = null;
            if(lastitem){
                lastli = $("#tab_li_"+lastitem.id);
                lastdiv = $("#tab_item_"+lastitem.id);
                
                lastli.after(liitem);
                lastdiv.after(bodyitem);
            }
            else{
                $("#tabpanel-header").prepend(liitem);
                $("#tabpanel-body").prepend(bodyitem);
//                $("" + item.id).
//                $(liitem).after(liitem)
                //$("#tabpanel-wrap").prepend(bodyitem);
            }
            //end updated

            
            //事件
            var li = $("#tab_li_"+item.id);
            inititemevents(li);           
            if(isactive)
            {                
               li.click();
            }    
            resetscoller(); 
            scolling("right",true);
          }
          else{
            alert("指定的tab项已存在!");
          }
       }
       function openitemOrAdd(item,allowAdd)
       {
          var checkitem =  getitembyid(item.id);
          if(!checkitem && allowAdd )
          {
            addtabitem(item);
          }
          else{
             var li = $("#tab_li_"+item.id);
             scollingToli(li);
          }
       }
       //移除一个tab 项
       function deleteitembyliid(liid)
       {
          var id= liid.substr(7);
          var newId = null;
          $("#"+liid).remove();    
          $("#tab_item_"+id).remove();
          var index = getIndexbyId(id);
          if(index>=0)
          {
            var nextcur;
            if(index < dfop.items.length -1)
            {
             nextcur = dfop.items[index+1];
            }
            else if(index>0){             
                nextcur = dfop.items[index-1];
            }
            if(nextcur)
            {
                 $("#tab_li_"+nextcur.id).click();
                 newId = nextcur.id;
            }
            dfop.items.splice(index,1);
            resetscoller();           
            scolling("right",true);
          }
          
          return newId;
       }
       function resize(width,height)
       {
        if(width ==dfop.width && height ==dfop.height)
        {
            return;
        }
         if(width){ dfop.width=width};
         if(height){ dfop.height =height;}
         innerwidth = width-2;
         bodyheight=dfop.height-headerheight;
         me.css("width",dfop.width);
         header.css("width",innerwidth);
         body.css({width:innerwidth,height:bodyheight});
         for(var i=0,j=dfop.items.length;i<j;i++)
         {
            var item =dfop.items[i];
            $("#tab_item_"+item.id).css({width:innerwidth});
            $("#tab_item_content_"+item.id).css({width:innerwidth,height:bodyheight});
         }
         resetscoller();
       }
       //设置选项卡项是否disabled
       function setdisabletabitem(itemId,disabled)
       {
             var chitem= getitembyid(itemId);
             if(!chitem || chitem.disabled ==disabled)
             {
                return;
             }
             if(disabled)
             {
                chitem.disabled =true;
                $("#tab_item_"+item.id).addClass("x-tab-strip-disabled");
             }
             else{
               chitem.disabled =false;
               $("#tab_item_"+item.id).removeClass("x-tab-strip-disabled");
             }
       }
       me[0].tab = {
        addtabitem:addtabitem,
        opentabitem:openitemOrAdd,
        resize:resize,
        setdisabletabitem:setdisabletabitem,
        getactiveitem:getactiveitem
       };
    };
    $.fn.refreshtab = function(id,url)
    {
        $("#tab_item_frame_" + id).attr("src", url);
    }
    $.fn.addtabitem =function(item)
    {
        if(this[0].tab)
        {
           return this[0].tab.addtabitem(item);
        }
        return false;
    }
    $.fn.opentabitem =function(item,orAdd)
    {
        if(this[0].tab)
        {
           return this[0].tab.opentabitem(item,orAdd);
        }
        return false;
    }
    $.fn.resizetabpanel =function(w,h)
    {
        if(this[0].tab)
        {
           return this[0].tab.resize(w,h);
        }
        return false;
    }
    $.fn.setdisabletabitem =function(itemId,disabled)
    {
        if(this[0].tab)
        {
           return this[0].tab.setdisabletabitem(itemId,disabled);
        }
        return false;
    }
    
    $.fn.getactiveitem =function()
    {
        if(this[0].tab)
        {
           //return this.getactiveitem();
           return this[0].tab.getactiveitem();
        }
        
        return false;
    }
    
    
})(jQuery);

