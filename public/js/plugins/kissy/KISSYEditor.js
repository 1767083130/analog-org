
window.__InitEditor = function () {
    KISSY.use(["editor"], function (S, Editor) {
        if (window.Sys) {
            if (window.Sys && window.Sys.WebForms && window.Sys.WebForms.PageRequestManager) {
                with (window.Sys.WebForms.PageRequestManager) {
                    var msAjax = getInstance();
                    msAjax.remove_endRequest(window.__InitEditor);
                    msAjax.add_endRequest(window.__InitEditor);
                }
            }
        }
        if (!window.myEditorPost) {
            window.myEditorPost = function (clientId, mode) {
                if (window.__doPostBack) {
                    window.window.__doPostBack(clientId, mode);
                }
                else {
                    S.one("form")[0].submit();
                }
            }
        }
        if (window.__WebNukeKissyEditors) {
            for (var ke in window.__WebNukeKissyEditors) {
                var tp = S.one(".dnnTextPanel");
                if (!S.one("#" + ke)) return;
                var keCfg = window.__WebNukeKissyEditors[ke];
                var plugins = keCfg.plugins.split(",");
                var fullPlugins = [];
                S.each(plugins, function (p, i) {
                    fullPlugins[i] = "editor/plugin/" + p + "/";
                });
                S.use(fullPlugins, function (S) {
                    var args = S.makeArray(arguments);
                    args.shift();
                    var cfg = S.mix({
                        // 是否初始聚焦
                        focused: false,
                        attachForm: true,
                        baseZIndex: 1,
                        srcNode: '#' + ke,
                        width: keCfg.width,
                        height: keCfg.height,
                        textarea: "<textarea name='MP_" + ke + "' style='max-width:100%;width:auto;height:auto;" + keCfg.style + "'>" + keCfg.content + "</textarea>",
                        plugins: args,
                        customStyle: keCfg.style
                        // mode: keCfg.mode
                    }, window.EDITOR_CFG);
                    var editor = new Editor(cfg);
                    editor.render();
                    window.kissyEditor = editor;
                    editor.docReady(function () {
                        keCfg.editor = editor;
                        var $editorDom = $(editor.get("textarea")[0]).parentsUntil(".ks-editor").last().parent();
                        $editorDom.css({ height: "auto" });
                        if (keCfg.onDocReady) {
                            keCfg.onDocReady(keCfg);
                        }
                        if (cfg.$load) {
                            cfg.$load.remove();
                            cfg.$load = null;
                        }
                    });
                    if (keCfg.autoPost) {
                        editor.on("wysiwygMode", function () {
                            window.myEditorPost(ke, "1");
                        })
                        editor.on("sourceMode", function () {
                            window.myEditorPost(ke, "0");
                        })
                    }
                });
            }
        }
    });
};
KISSY.ready(window.__InitEditor);