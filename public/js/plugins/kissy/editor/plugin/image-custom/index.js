closeImageEditor = function () {
    $(".ts_imagePC_iframe").hide();
    $("html,body").animate({ scrollTop: $("#editorStart").offset().top - 120 }, 500);//1000是ms,也可以用slow代替
};
showImageEditor = function () {
    $(".ts_imagePC_iframe").show();
    $("html,body").animate({ scrollTop: $("#editorEnd").offset().top - 120 }, 500);//1000是ms,也可以用slow代替
};
adjustImageEditorHeight = function (height) {
    $(".ts_imagePC_iframe").show().height(height);
};

KISSY.add("editor/plugin/image-custom/index", function (S, Editor, Button, Bubble, ContextMenu, DialogLoader) {

    function ImagePlugin(config) {
        this.config = config || {};
    }

    S.augment(ImagePlugin, {
        renderUI: function (editor) {
            var self = this;
            // 重新采用form提交，不采用flash，国产浏览器很多问题
            editor.addButton("image", {
                tooltip: "插入图片",
                listeners: {
                    click: function () {
                        showImageEditor();
                    }
                },
                mode: Editor.WYSIWYG_MODE
            });

            var portalAlias = _portalAlias || '';
            var url = '//' + _portalAlias + '/desktopModules/webnuke/Services/Media/PicturesNav.aspx?proxy=/desktopModules/webnuke/Services/Media/image_proxy.htm';
            $(".ks-editor").before('<div id="editorStart"></div>');
            $(".ks-editor").after('<br /><iframe class="ts_imagePC_iframe"'
                        + ' src="' + portalAlias + '"' +
                        'height="660" width="700" scrolling="no" frameborder="0" style="display: none;"></iframe>')
                .after('<div id="editorEnd"></div>');

            $(".ks-editor").before('<div id="editorStart"></div>');
            $(".ks-editor").after('<br /><iframe class="ts_imagePC_iframe"'
                        + ' src="' + url + '"' +
                        'height="660" width="700" scrolling="no" frameborder="0" style="display: none;"></iframe>')
                .after('<div id="editorEnd"></div>');
        }
    });

    return ImagePlugin;
}, {
    requires: ['editor']
});

