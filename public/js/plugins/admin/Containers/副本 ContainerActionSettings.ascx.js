/// <reference name="MicrosoftAjax.js"/>

Type.registerNamespace("wnk.controls");

wnk.controls.containerActionSettings = function(element) {
    wnk.controls.containerActionSettings.initializeBase(this, [element]);
    
    this.methodID = null;
    this.prefixID = null;
    this.menuNavData = null;
    this.linkBrowserURL = null;
    this.actions = null;
    this.actionsContainer = null;
    this.defaultTemplate = '';
    this.defaultItemTemplate = '';
    
    this._tempNode = null; //临时记录用
}

wnk.controls.containerActionSettings.prototype = {
    initialize: function() {       
        wnk.controls.containerActionSettings.callBaseMethod(this, 'initialize');
        
        var objSelf = this;
        this.actionsContainer = $get(this.prefixID + "ulAcionItems");
        $(this.actionsContainer).sortable({opacity: 0.7});
        
        $addHandler($get("btnSubmitAction"),"click", Function.createDelegate(this,this.btnSubmitActionHandle));
        $addHandler($get("btnCancelAction"),"click", Function.createDelegate(this,this.btnCancelActionHandle));
        
        $("a[name='lnkEditAction']").each(function(index, domEle) {
            $(this).click(function() {
                objSelf.editAction(this);
            });
        });

        $("a[name='lnkDeleteAction']").each(function(index, domEle) {
            $(this).click(function() {
                objSelf.deleteAction(this);
            });
        });
        
        $("#" + this.prefixID + "cmdUpdate").click(function(){
            var builder = new Sys.StringBuilder();
            $("li[name='actionItem']",objSelf.actionsContainer).each(function(index,domEle){
                var actionTitle = $("span[name='actionTitle']",this).html();
                var actionUrl = $("span[name='actionUrl']",this).html();
                var actionTarget = $("#cboActionTargets").val();
                var className = $("span[name='actionClassName']",this).html();
                
                builder.append(String.format("{0},{1},{2},{3}",actionTitle,actionUrl,className,actionTarget));
                builder.append(";");
            })
            var actions = builder.toString();
            dnn.setVar(objSelf.methodID + "actions",actions);
            return true;
        });

        $("#" + this.prefixID + "cboTabs").change(function(){
            var tabID  = $(this).val();
            if(tabID != -1){
                var loadSuccessDelegate = Function.createDelegate(this, function(payload, ctx, req) {
                    $("#" + objSelf.prefixID + "txtActionUrl").val(payload);
                });
                
                var blnTrackClicks = $("#" + objSelf.prefixID + "chkTrackClicks").attr("checked")
                var params = {tabID:tabID,blnTrackClicks:blnTrackClicks};
                dnn.xmlhttp.callControlMethod('wnk.ContainerActionSettings.' + objSelf.methodID, 'GetTabPath', params, loadSuccessDelegate, null, null);
            }
        });
        
        $("#" + this.prefixID + "chkTrackClicks").click(function(){
            var url = $("#" + objSelf.prefixID + "txtActionUrl").val();
            if(url){
                var loadSuccessDelegate = Function.createDelegate(this, function(payload, ctx, req) {
                    $("#" + objSelf.prefixID + "txtActionUrl").val(payload);
                });
                
                var blnTrackClicks = $("#" + objSelf.prefixID + "chkTrackClicks").attr("checked")
                var params = {url:url,blnTrackClicks:blnTrackClicks};
                dnn.xmlhttp.callControlMethod('wnk.ContainerActionSettings.' + objSelf.methodID, 'GetTrackTabPath', params, loadSuccessDelegate, null, null);
            }
        });
        
        $("#" + this.prefixID + "lnkTemplateRestore").click(function(){
            if(confirm("如果恢复默认样式，您的修改将会丢失，继续恢复吗？")){
                $("#" + objSelf.prefixID + "txtTemplate").val(objSelf.defaultTemplate);
            }
        });
        
        $("#" + this.prefixID + "lnkItemTemplateRestore").click(function(){
            if(confirm("如果恢复默认样式，您的修改将会丢失，继续恢复吗？")){
                $("#" + objSelf.prefixID + "txtItemTemplate").val(objSelf.defaultItemTemplate);
            }
        });
    },
    editAction:function(domEle){
        var node = $(domEle).parent().parent();
        
        var actionName = $("[name='actionTitle']",node).html();
        var actionUrl = $("[name='actionUrl']",node).html();
        var actionTarget = $("[name='actionTarget']",node).html();
        var actionClassName = $("[name='actionClassName']",node).html();
   
        $("#" + this.prefixID + "txtActionTitle").val(actionName);
        $("#" + this.prefixID + "txtActionUrl").val(actionUrl);
        //$("#cboActionTargets").val(actionUrl); todo
        $("#" + this.prefixID + "txtActionClassName").val(actionClassName);
        
        $("#" + this.prefixID + "cboTabs").val("-1");
        $("#cboActionTargets").val("_self");
        
        this._tempNode = node;
        $("#btnSubmitAction").val("更改");
    },
    deleteAction:function(domEle){
        if(confirm("您确认要删除吗？")){
            $(domEle).parent().parent().remove();
        }
    },
    btnSubmitActionHandle:function(){
        var objSelf = this;
        var actionTitle = $.trim($("#" + this.prefixID + "txtActionTitle").val());
        var actionUrl =  $.trim($("#" + this.prefixID + "txtActionUrl").val());
        var actionTarget = $("#cboActionTargets").val();
        var actionClassName = $("#" + this.prefixID + "txtActionClassName").val();
        
        if(!actionUrl){
            alert("请输入链接地址!");
            return;
        }
        
//        if(!actionTitle){
//            alert("请输入标题!");
//            return;
//        }

        if(this._tempNode){ //编辑
            $("[name='actionTitle']",this._tempNode).html(actionTitle);
            $("[name='actionUrl']",this._tempNode).html(actionUrl);
            $("[name='actionTarget']",this._tempNode).html(actionTarget); //todo
            $("[name='actionClassName']",this._tempNode).html(actionClassName);
        }
        else{ //添加
            var operateCell = String.format('<a name="lnkEditAction" href="javascript:;">编辑</a><a name="lnkDeleteAction" href="javascript:;">删除</a></span>');
            var itemHtml = String.format("<li name='actionItem'><span name='actionTitle'>{0}</span><span style='width:200px' name='actionUrl'>{1}</span>"  
                                         + "<span name='actionTarget'>{3}</span><span name='actionClassName'>{4}</span><span name='actionOperate'>{2}</span></li>" ,actionTitle,actionUrl,operateCell,actionTarget,actionClassName);
            //$(this.actionsContainer).append(itemHtml);
            var actionItem = $(itemHtml).appendTo(this.actionsContainer);
            $("a[name='lnkEditAction']",actionItem).click(function(){
                 objSelf.editAction(this);
            });
            
            $("a[name='lnkDeleteAction']",actionItem).click(function(){
                objSelf.deleteAction(this); 
            });
        }
    },
    btnCancelActionHandle:function(){
        $("#" + this.prefixID + "txtActionTitle").val("");
        $("#" + this.prefixID + "txtActionUrl").val("");
        $("#" + this.prefixID + "cboTabs").val("-1");
        $("#cboActionTargets").val("_self");
        $("#" + this.prefixID + "txtActionClassName").val("");
        
        this._tempNode = null;
        $("#btnSubmitAction").val("添加");
    },
    get_MethodID:function(){return this.methodID; },
    set_MethodID:function(value){ this.methodID = value;},
    
    get_PrefixID:function(){ return this.prefixID;},
    set_PrefixID:function(value){this.prefixID = value;},
    
    get_LinkBrowserURL:function(){return this.linkBrowserURL;},
    set_LinkBrowserURL:function(value){this.linkBrowserURL = value;},
    
    get_DefaultTemplate:function(){return this.defaultTemplate;},
    set_DefaultTemplate:function(value){this.defaultTemplate = value;},
    
    get_Actions:function(){return this.actions;},
    set_Actions:function(value){this.actions = value;},
    
    get_DefaultItemTemplate:function(){return this.defaultItemTemplate;},
    set_DefaultItemTemplate:function(value){this.defaultItemTemplate = value;},
    
    dispose: function() {        
        //在此处添加自定义释放操作
        wnk.controls.containerActionSettings.callBaseMethod(this, 'dispose');
    }
}
wnk.controls.containerActionSettings.registerClass('wnk.controls.containerActionSettings', Sys.UI.Behavior);

if (typeof(Sys) !== 'undefined') Sys.Application.notifyScriptLoaded();
