(function ($, win) {
    if (typeof ($) == 'undefined') {
        alert('jQuery插件加载失败,请刷新页面!\r\n如反复出现本提示，请联系网站管理员！');
        return;
    }
    if (win.msgTemplateBoxJsReged)
        return;
    else
        win.msgTemplateBoxJsReged = 1;
    $('[ct=xdqMsgTmpBox]').live('focus', function () {
        if (this.msgTemplateBoxJsReged)
            return;
        var MyPost = function (e) {
            var obj = e.target;
            var uid = $(obj).attr('uid');
            if (!obj.value) {
                $('select[command=item][uid=' + uid + ']').val('');
                $('select[command=item][uid=' + uid + ']').attr('disabled', 'disabled');
                $('input[type=button][uid=' + uid + ']').attr('disabled', 'disabled');
            }
            else {
                if (typeof (win.__doPostBack) != 'function') {
                    win.__doPostBack = function (target, args) {
                        var mF = $(win.document).find('form').get(0);
                        if (!mF.__EVENTTARGET) $(mF).append($('<input type=&#39;hidden&#39; name=&#39;__EVENTTARGET&#39; id=&#39;__EVENTTARGET&#39;/>'));
                        if (!mF.__EVENTARGUMENT) $(mF).append($('<input type=&#39;hidden&#39; name=&#39;__EVENTARGUMENT&#39; id=&#39;__EVENTARGUMENT&#39;/>'));
                        if (!mF.onsubmit || (mF.onsubmit() != false)) {
                            mF.__EVENTTARGET.value = obj.attributes['uid'].value;
                            mF.__EVENTARGUMENT.value = obj.attributes['command'].value
                            mF.submit();
                        }
                    }
                }
                win.__doPostBack(obj.attributes['uid'].value, obj.attributes['command'].value);
            }
        };
        var MyChangeItem = function (e) {
            var obj = e.target;
            var uid = $(obj).attr('uid');
            if (!obj.value) {
                $('input[type=button][uid=' + uid + ']').attr('disabled', 'disabled');
            }
            else {
                $('input[type=button][uid=' + uid + ']').removeAttr('disabled');
            }
        }
        $(this).children('select[command=group]').bind('change', MyPost);
        $(this).children('select[command=item]').bind('change', MyChangeItem);
        $(this).children('input[type=button]').bind('click', MyPost);
        this.msgTemplateBoxJsReged = 1;
    });
})(jQuery || $, window);