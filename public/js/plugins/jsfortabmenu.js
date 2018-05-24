/*Obsolete by xdq 2013-07-12 Reason:unified to use dnn js*/
/*But it's using in emailmarket*/
var XDQ_TabMenu_Form = null;
var XDQ_TabMenu_UnSelClass = "TabMenu_Item_Normal";
var XDQ_TabMenu_SelClass = "TabMenu_Item_Selected";
var TabMenu = new Function();
TabMenu.Items = null;
TabMenu.SelectedChanged = function (eventArgs) { };
TabMenu.FindItem = null;
$(function () {
    XDQ_TabMenu_Form = $("form");
    //[tab1:{IndexObj:null,IsAutoPostback:'true',SelStyle:'color:#111;',UnSelStyle:'color:#666;'},tab2:{IndexObj:null}]
    var strForIds = "[";
    var menus = $("div.TabMenu");
    var l = menus.length;
    menus.each(function (k, v) {
        v = $(v).attr("id");
        strForIds = strForIds + "{";
        strForIds = strForIds + "ID:'" + v + "',";
        strForIds = strForIds + "IndexObj:null,";
        strForIds = strForIds + "IsAutoPostback:'" + $("input[name=" + v + "_isautopostback]").val() + "',";
        strForIds = strForIds + "SelStyle:'" + $("input[name=" + v + "_selstyle]").val() + "',";
        strForIds = strForIds + "UnSelStyle:'" + $("input[name=" + v + "_unselstyle]").val() + "'}";
        strForIds = strForIds + (l == k + 1 ? "]" : ",");
    });
    strForIds = strForIds + (l == 0 ? "]" : "");
    TabMenu.Items = eval("(" + strForIds + ")");
    $(TabMenu.Items).each(function (i, o) {
        o.IndexObj = $("input[name=" + o.ID + "_index]")[0];
    });
    TabMenu.FindItem = function (ID) {
        var result = { ID: null, IndexObj: null, Index: 0, IsAutoPostback: false, SelStyle: null, UnSelStyle: null };
        $(TabMenu.Items).each(function (k, v) {
            if (v.ID == ID) {
                result.ID = v.ID;
                result.IndexObj = v.IndexObj;
                result.IsAutoPostback = v.IsAutoPostback;
                result.SelStyle = v.SelStyle;
                result.UnSelStyle = v.UnSelStyle;
                result.Index = parseInt($(result.IndexObj).val());
                return result;
            };
        });
        return result;
    };
    $("span.TabMenu_Item_Normal").click(function () {
        var obj = $(this);
        var ID = obj.attr("tab");
        var item = TabMenu.FindItem(ID);
        var XDQ_TabMenu_SelStyle = item.SelStyle;
        var XDQ_TabMenu_UnSelStyle = item.UnSelStyle;
        item.Index = parseInt(obj.attr("index"));
        $(item.IndexObj).val(item.Index);
        if (item.IsAutoPostback == "true") {
            XDQ_TabMenu_Form.submit();
        }
        else {
            $("span.TabMenu_Item_Selected[tab=" + ID + "]").attr("class", XDQ_TabMenu_UnSelClass);
            $("span.TabMenu_Item_Selected[tab=" + ID + "]").attr("style", XDQ_TabMenu_UnSelStyle);
            obj.attr("class", XDQ_TabMenu_SelClass);
            obj.attr("style", XDQ_TabMenu_SelStyle);
        }
        if (TabMenu.SelectedChanged)
            TabMenu.SelectedChanged(item);
    });
});