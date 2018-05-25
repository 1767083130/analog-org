﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 19 17:17
*/
/**
 * Set up editor constructor
 * @author yiminghe@gmail.com
 */
KISSY.add("editor/core/base", function (S, HtmlParser, Component) {

    /**
     * @class
     * KISSY Editor.
     * xclass: 'editor'.
     * @extends Component.Controller
     * @name Editor
     */
    var Editor = Component.Controller.extend(
        /**
         * @lends Editor#
         */
        {
            initializer:function () {
                var self = this;
                self.__commands = {};
                self.__controls = {};
            }
        },

        {
            Config:{},
            XHTML_DTD:HtmlParser['DTD'],
            ATTRS:/**
             * @lends Editor#
             */
            {
                /**
                 * textarea
                 * @type {KISSY.NodeList}
                 */
                textarea:{},
                /**
                 * iframe
                 * @type {KISSY.NodeList}
                 */
                iframe:{},
                /**
                 * iframe 's contentWindow.
                 * @type {KISSY.NodeList}
                 */
                window:{
                    // ie6 一旦中途设置了 domain
                    // 那么就不能从 document _getWin 获取对应的 window
                    // 所以一开始设置下，和 document 有一定的信息冗余

                },
                /**
                 * iframe 's document
                 * @type {KISSY.NodeList}
                 */
                document:{},
                /**
                 * toolbar element
                 * @type {KISSY.NodeList}
                 */
                toolBarEl:{},
                /**
                 * status bar element
                 * @type {KISSY.NodeList}
                 */
                statusBarEl:{},
                handleMouseEvents:{
                    value:false
                },
                focusable:{
                    value:false
                },
                /**
                 * editor mode.
                 * wysiswyg mode:1
                 * source mode:0
                 * @default wysiswyg mode
                 */
                mode:{
                    value:1
                },
                /**
                 * Current editor's content
                 * @type {String}
                 */
                data:{
                    getter:function () {
                        return this._getData();
                    },
                    setter:function (v) {
                        return this._setData(v);
                    }
                },
                /**
                 *  Current editor's format content
                 * @type {String}
                 */
                formatData:{
                    getter:function () {
                        return this._getData(1);
                    },
                    setter:function (v) {
                        return this._setData(v);
                    }
                },

                /**
                 * Custom style for editor.
                 * @type {String}
                 */
                customStyle:{
                    value:""
                },

                /**
                 * Custom css link url for editor.
                 * @type {String[]}
                 */
                customLink:{
                    value:[]
                }
            }
        }, {
            xclass:'editor'
        });


    Editor.HTML_PARSER = {

        textarea:function (el) {
            return el.one("."+this.get('prefixCls')+"editor-textarea");
        }

    };

    S.mix(Editor, S.EventTarget);

    KISSY.Editor = Editor;

    return Editor;
}, {
    requires:['htmlparser', 'component', 'core']
});
