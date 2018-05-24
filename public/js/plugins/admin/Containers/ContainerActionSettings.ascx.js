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
        
        var _this = this;
        this.actionsContainer = $get("acionItems");
        $(this.actionsContainer).sortable({opacity: 0.7});
        
        $addHandler($get("btnSubmitAction"),"click", Function.createDelegate(this,this.btnSubmitActionHandle));
        $addHandler($get("btnCancelAction"),"click", Function.createDelegate(this,this.btnCancelActionHandle));
      
        //,"a[name='lnkDeleteAction']"
        $("a[name='lnkEditAction']").each(function(index, domEle) {
            $(this).click(function() {
                var row = $(this).parent().parent();
                _this.editAction(row);
            });
        });
//$("p").insertAfter("#btn1");

        $("a[name='lnkDeleteAction']").each(function(index, domEle) {
            $(this).click(function() {
                _this.deleteAction(this);
            });
        });
        
//        $("div[classf=1]").click(function(){ 
//	       if( $(this).parent().attr("class") == 'partopen'){
//	           $(this).parent().attr("class","partclose");
//	       }
//	       else{ 
//	            $(this).parent().attr("class","partopen"); 
//	       }
//        });
        
        $("span[classf=2]").click(function(){ 
            var row = $(this).parent().parent(); //获取行容器元素
            _this.toggleRow(row);
            
            //隐藏添加面板
            $("#pnlAddLinker").hide();
        }); 
        $("a[classf=3]").click(function(){
            var row = $(this).parent().parent().parent();  //获取行容器元素
            _this.toggleRow(row);
            
            //隐藏添加面板
            $("#pnlAddLinker").hide();
        });
            
        $("a[name='btnAddLinker']").click(function(){
            $("div[lei=1]",$(this).parent().parent().parent()).attr('class','lineclose');
//            $("#editPane").hide();
//               
            $("#editPane").show();
            $("#pnlAddLinker").append($("#editPane"));
            
            $("#btnSubmitAction").val("添加");
            
            //清空
            $("#" + _this.prefixID + "txtActionTitle").val('');
            $("#" + _this.prefixID + "txtActionUrl").val('');
            //$("#cboActionTargets").val(actionUrl); todo
            $("#" + _this.prefixID + "txtActionClassName").val('');
            $("#" + _this.prefixID + "cboTabs").val("-1");
            $("#cboActionTargets").val("_self");
            
            _this._tempNode = null;
            
            $("#pnlAddLinker").slideToggle("normal");
        });

//        $("a[classf=3]").click(function(){ 
//	        if($(this).parents().parents().parents().attr("class") == 'lineopen'){
//               $(this).parents().parents().parents('div[lei=1]').attr('class','lineclose');
//            }
//            else{
//               $(this).parents().parents().parents('div[lei=1]').attr('class','lineopen');    
//            }
//        }); 
        
        $("#" + this.prefixID + "cmdUpdate").click(function(){
            var builder = new Sys.StringBuilder();
            $("div[name='actionItem']",_this.actionsContainer).each(function(index,domEle){
                var actionTitle = _this.filterBlank($("span[name='actionTitle']",this).html());
                var actionUrl = _this.filterBlank($("span[name='actionUrl']",this).html());
                var actionTarget = _this.filterBlank($("span[name='actionTarget']").html());
                var className = _this.filterBlank($("span[name='actionClassName']",this).html());
                
                builder.append(String.format("{0},{1},{2},{3}",actionTitle,actionUrl,className,actionTarget));
                builder.append(";");
            })
            var actions = builder.toString();
            dnn.setVar(_this.methodID + "actions",actions);
            return true;
        });

        $("#" + this.prefixID + "cboTabs").change(function(){
            var tabID  = $(this).val();
            if(tabID != -1){
                var loadSuccessDelegate = Function.createDelegate(this, function(payload, ctx, req) {
                    $("#" + _this.prefixID + "txtActionUrl").val(payload);
                });
                
                var blnTrackClicks = $("#" + _this.prefixID + "chkTrackClicks").prop("checked")
                var params = {tabID:tabID,blnTrackClicks:blnTrackClicks};
                dnn.xmlhttp.callControlMethod('wnk.ContainerActionSettings.' + _this.methodID, 'GetTabPath', params, loadSuccessDelegate, null, null);
            }
        });
        
        $("#" + this.prefixID + "chkTrackClicks").click(function(){
            var url = $("#" + _this.prefixID + "txtActionUrl").val();
            if(url){
                var loadSuccessDelegate = Function.createDelegate(this, function(payload, ctx, req) {
                    $("#" + _this.prefixID + "txtActionUrl").val(payload);
                });
                
                var blnTrackClicks = $("#" + _this.prefixID + "chkTrackClicks").prop("checked")
                var params = {url:url,blnTrackClicks:blnTrackClicks};
                dnn.xmlhttp.callControlMethod('wnk.ContainerActionSettings.' + _this.methodID, 'GetTrackTabPath', params, loadSuccessDelegate, null, null);
            }
        });
        
        $("#" + this.prefixID + "lnkTemplateRestore").click(function(){
            if(confirm("如果恢复默认样式，您的修改将会丢失，继续恢复吗？")){
                $("#" + _this.prefixID + "txtTemplate").val(_this.defaultTemplate);
            }
        });
        
        $("#" + this.prefixID + "lnkItemTemplateRestore").click(function(){
            if(confirm("如果恢复默认样式，您的修改将会丢失，继续恢复吗？")){
                $("#" + _this.prefixID + "txtItemTemplate").val(_this.defaultItemTemplate);
            }
        });
    },
    toggleRow:function(item){
        //$(target).parent().parent().parent()
        if($(item).attr("class") == 'lineopen'){ //如果已经打开，则关闭
           $(item).attr('class','lineclose');
           $("#editPane").hide();
        }
        else { //如果关闭状态，则打开
           //先关闭所有行
           $('div[name="actionItem"]',$(item).parent()).attr('class','lineclose');
           $("#editPane").hide();
           
           //打开当前行
           $(item).attr('class','lineopen');   
           $("#editPane").show();
           $(item).append($("#editPane"));
           this.editAction(item);
        }
        
        $(this.actionsContainer).sortable({opacity: 0.7});
    },
    editAction:function(item){
        var node = item;//$(domEle).parent().parent();
        
        var actionName = $("[name='actionTitle']",node).html();
        var actionUrl = $("[name='actionUrl']",node).html();
        var actionTarget = $("[name='actionTarget']",node).html();
        var actionClassName = $("[name='actionClassName']",node).html();
        
//        var actionName = $(".i1",node).html();
//        var actionUrl = $(".i2",node).html();
//        var actionTarget = $(".i3",node).html();
//        var actionClassName = $(".i4",node).html();
   
        $("#" + this.prefixID + "txtActionTitle").val(this.filterBlank(actionName));
        $("#" + this.prefixID + "txtActionUrl").val(this.filterBlank(actionUrl));
        //$("#cboActionTargets").val(actionUrl); todo
        $("#" + this.prefixID + "txtActionClassName").val(this.filterBlank(actionClassName));
        
        $("#" + this.prefixID + "cboTabs").val("-1");
        $("#cboActionTargets").val("_self");
        
        this._tempNode = node;
        $("#btnSubmitAction").val("更改");
    },
    //过滤掉html空格
    filterBlank:function(value){
        return value.toString().replace("&nbsp;","");
    },
    //清除两端空格，如果为空时添加一空格
    appendBlank:function(value){
        value = value.toString().trim();
        if(value == ""){
            value = "&nbsp;";
        }
        return value;
    },
    deleteAction:function(domEle){
        if(confirm("您确认要删除吗？")){
            //$(domEle).parent().parent().remove();
            $(domEle).parent().parent().next("#editPane").hide();
            $(domEle).parent().parent().remove();
        }
    },
    btnSubmitActionHandle:function(){
        var _this = this;
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
            $("[name='actionTitle']",this._tempNode).html(this.appendBlank(actionTitle));
            $("[name='actionUrl']",this._tempNode).html(this.appendBlank(actionUrl));
            $("[name='actionTarget']",this._tempNode).html(this.appendBlank(actionTarget)); //todo
            $("[name='actionClassName']",this._tempNode).html(this.appendBlank(actionClassName));
        }
        else{ //添加
//            var operateCell = String.format('<a name="lnkEditAction" href="javascript:;">编辑</a><a name="lnkDeleteAction" href="javascript:;">删除</a></span>');
//            var itemHtml = String.format("<li name='actionItem'><span name='actionTitle'>{0}</span><span style='width:200px' name='actionUrl'>{1}</span>"  
//                                         + "<span name='actionTarget'>{3}</span><span name='actionClassName'>{4}</span><span name='actionOperate'>{2}</span></li>" ,actionTitle,actionUrl,operateCell,actionTarget,actionClassName);
            var builder = new Sys.StringBuilder();
            builder.append('          <div name="actionItem" class="lineclose" lei="1">');
            builder.append('              <div class="title2">');
            builder.append('                  <span class="i1" name="actionTitle" classf="2">');
            
            var title = actionTitle;
            if(title == ""){title = "&nbsp;"}
            builder.append(title);
            builder.append('                  </span><span name="actionUrl" class="i2">');
            builder.append(actionUrl == ""?"&nbsp;" : actionUrl);
            builder.append('                  </span><span name="actionTarget" class="i3">');
            builder.append(actionTarget== ""?"&nbsp;" : actionTarget);
            builder.append(String.format('  </span><span name="actionClassName" class="i4">{0}</span>',actionClassName));
            builder.append(' <span class="i5"><a name="lnkEditAction" href="javascript:;" classf="3">编辑</a> <a name="lnkDeleteAction" href="javascript:;">删除</a> </span>');
            builder.append('                  <div class="clear">');
            builder.append('                  </div>');
            builder.append('              </div>');
            builder.append('          </div>');
            
            //$(this.actionsContainer).append(itemHtml);
            var itemHtml = builder.toString();
            var actionItem = $(itemHtml).appendTo(this.actionsContainer);
            $("a[name='lnkEditAction']",actionItem).click(function(){
                 var row = $(this).parent().parent();
                 _this.editAction(row);
            });
            
            $("a[name='lnkDeleteAction']").each(function(index, domEle) {
                $(this).click(function() {
                    _this.deleteAction(this);
                });
            });
    
            $("span[classf=2]",actionItem).click(function(){ 
                var row = $(this).parent().parent(); //获取行容器元素
                _this.toggleRow(row);
                
                //隐藏添加面板
                $("#pnlAddLinker").hide();
            }); 
            $("a[classf=3]",actionItem).click(function(){
                var row = $(this).parent().parent().parent();  //获取行容器元素
                _this.toggleRow(row);
                
                //隐藏添加面板
                $("#pnlAddLinker").hide();
            });
        }
    },
    btnCancelActionHandle:function(){
        if(this._tempNode){ //编辑状态
           $('div[lei=1]',$('#acionItems')).attr('class','lineclose');  
           $("#editPane").hide();
        }
        else{ //添加状态
            $("#" + this.prefixID + "txtActionTitle").val("");
            $("#" + this.prefixID + "txtActionUrl").val("");
            $("#" + this.prefixID + "cboTabs").val("-1");
            $("#cboActionTargets").val("_self");
            $("#" + this.prefixID + "txtActionClassName").val("");
            
            this._tempNode = null;
            $("#btnSubmitAction").val("添加");
        }
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
