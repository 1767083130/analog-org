﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Nov 22 22:06
*/
/**
 * @ignore
 * @fileOverview dom-attr
 * @author yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add('dom/attr', function (S, DOM, UA, undefined) {

    var doc = S.Env.host.document,
        NodeType=DOM.NodeType,
        docElement = doc.documentElement,
        IE_VERSION = UA.ie && (doc.documentMode || UA.ie),
        TEXT = docElement.textContent === undefined ?
            'innerText' : 'textContent',
        EMPTY = '',
        HREF = 'href',
        nodeName = DOM.nodeName,
        R_BOOLEAN = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
        R_FOCUSABLE = /^(?:button|input|object|select|textarea)$/i,
        R_CLICKABLE = /^a(?:rea)?$/i,
        R_INVALID_CHAR = /:|^on/,
        R_RETURN = /\r/g,
        attrFix = {
        },
        attrFn = {
            val: 1,
            css: 1,
            html: 1,
            text: 1,
            data: 1,
            width: 1,
            height: 1,
            offset: 1,
            scrollTop: 1,
            scrollLeft: 1
        },
        attrHooks = {
            // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
            tabindex: {
                get: function (el) {
                    // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                    var attributeNode = el.getAttributeNode('tabindex');
                    return attributeNode && attributeNode.specified ?
                        parseInt(attributeNode.value, 10) :
                        R_FOCUSABLE.test(el.nodeName) || R_CLICKABLE.test(el.nodeName) && el.href ?
                            0 :
                            undefined;
                }
            },
            // 在标准浏览器下，用 getAttribute 获取 style 值
            // IE7- 下，需要用 cssText 来获取
            // 统一使用 cssText
            style: {
                get: function (el) {
                    return el.style.cssText;
                },
                set: function (el, val) {
                    el.style.cssText = val;
                }
            }
        },
        propFix = {
            'hidefocus': 'hideFocus',
            tabindex: 'tabIndex',
            readonly: 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            maxlength: 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            rowspan: 'rowSpan',
            colspan: 'colSpan',
            usemap: 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        },
    // Hook for boolean attributes
    // if bool is false
    //  - standard browser returns null
    //  - ie<8 return false
    //   - so norm to undefined
        boolHook = {
            get: function (elem, name) {
                // 转发到 prop 方法
                return DOM.prop(elem, name) ?
                    // 根据 w3c attribute , true 时返回属性名字符串
                    name.toLowerCase() :
                    undefined;
            },
            set: function (elem, value, name) {
                var propName;
                if (value === false) {
                    // Remove boolean attributes when set to false
                    DOM.removeAttr(elem, name);
                } else {
                    // 直接设置 true,因为这是 bool 类属性
                    propName = propFix[ name ] || name;
                    if (propName in elem) {
                        // Only set the IDL specifically if it already exists on the element
                        elem[ propName ] = true;
                    }
                    elem.setAttribute(name, name.toLowerCase());
                }
                return name;
            }
        },
        propHooks = {},
    // get attribute value from attribute node , only for ie
        attrNodeHook = {
        },
        valHooks = {
            option: {
                get: function (elem) {
                    // 当没有设定 value 时，标准浏览器 option.value === option.text
                    // ie7- 下，没有设定 value 时，option.value === '', 需要用 el.attributes.value 来判断是否有设定 value
                    var val = elem.attributes.value;
                    return !val || val.specified ? elem.value : elem.text;
                }
            },
            select: {
                // 对于 select, 特别是 multiple type, 存在很严重的兼容性问题
                get: function (elem) {
                    var index = elem.selectedIndex,
                        options = elem.options,
                        one = elem.type === 'select-one';

                    // Nothing was selected
                    if (index < 0) {
                        return null;
                    } else if (one) {
                        return DOM.val(options[index]);
                    }

                    // Loop through all the selected options
                    var ret = [], i = 0, len = options.length;
                    for (; i < len; ++i) {
                        if (options[i].selected) {
                            ret.push(DOM.val(options[i]));
                        }
                    }
                    // Multi-Selects return an array
                    return ret;
                },

                set: function (elem, value) {
                    var values = S.makeArray(value),
                        opts = elem.options;
                    S.each(opts, function (opt) {
                        opt.selected = S.inArray(DOM.val(opt), values);
                    });

                    if (!values.length) {
                        elem.selectedIndex = -1;
                    }
                    return values;
                }
            }};

    if (IE_VERSION && IE_VERSION < 8) {

        // get attribute value from attribute node for ie
        attrNodeHook = {
            get: function (elem, name) {
                var ret;
                ret = elem.getAttributeNode(name);
                // Return undefined if attribute node specified by user
                return ret && (
                    // fix #100
                    ret.specified
                        // input.attr('value')
                        || ret.nodeValue) ?
                    ret.nodeValue :
                    undefined;
            },
            set: function (elem, value, name) {
                // Check form objects in IE (multiple bugs related)
                // Only use nodeValue if the attribute node exists on the form
                var ret = elem.getAttributeNode(name);
                if (ret) {
                    ret.nodeValue = value;
                } else {
                    try {
                        var attr = elem.ownerDocument.createAttribute(name);
                        attr.value = value;
                        elem.setAttributeNode(attr);
                    }
                    catch (e) {
                        // It's a real failure only if setAttribute also fails.
                        // http://msdn.microsoft.com/en-us/library/ms536739(v=vs.85).aspx
                        // 0 : Match sAttrName regardless of case.
                        return elem.setAttribute(name, value, 0);
                    }
                }
            }
        };


        // ie6,7 不区分 attribute 与 property
        attrFix = propFix;
        // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
        attrHooks.tabIndex = attrHooks.tabindex;
        // fix ie bugs
        // 不光是 href, src, 还有 rowspan 等非 mapping 属性，也需要用第 2 个参数来获取原始值
        // 注意 colSpan rowSpan 已经由 propFix 转为大写
        S.each([ HREF, 'src', 'width', 'height', 'colSpan', 'rowSpan' ], function (name) {
            attrHooks[ name ] = {
                get: function (elem) {
                    var ret = elem.getAttribute(name, 2);
                    return ret === null ? undefined : ret;
                }
            };
        });
        // button 元素的 value 属性和其内容冲突
        // <button value='xx'>zzz</button>
        valHooks.button = attrHooks.value = attrNodeHook;
    }

    if (IE_VERSION && IE_VERSION < 9) {
        // https://github.com/kissyteam/kissy/issues/198
        // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/aa6bf9a5-0c0b-4a02-a115-c5b85783ca8c
// http://gabriel.nagmay.com/2008/11/javascript-href-bug-in-ie/
        // https://groups.google.com/group/jquery-dev/browse_thread/thread/22029e221fe635c6?pli=1
        var hrefFix = attrHooks[HREF] = attrHooks[HREF] || {};
        hrefFix.set = function (el, val, name) {
            var childNodes = el.childNodes,
                b,
                len = childNodes.length,
                allText = len > 0;

            for (len = len - 1; len >= 0; len--) {
                if (childNodes[len].nodeType != NodeType.TEXT_NODE) {
                    allText = 0;
                }
            }

            if (allText) {
                b = el.ownerDocument.createElement('b');
                b.style.display = 'none';
                el.appendChild(b);
            }

            el.setAttribute(name, EMPTY + val);

            if (b) {
                el.removeChild(b);
            }
        };
    }

    // Radios and checkboxes getter/setter

    S.each([ 'radio', 'checkbox' ], function (r) {
        valHooks[ r ] = {
            get: function (elem) {
                // Handle the case where in Webkit '' is returned instead of 'on' if a value isn't specified
                return elem.getAttribute('value') === null ? 'on' : elem.value;
            },
            set: function (elem, value) {
                if (S.isArray(value)) {
                    return elem.checked = S.inArray(DOM.val(elem), value);
                }
            }

        };
    });

    function getProp(elem, name) {
        name = propFix[ name ] || name;
        var hook = propHooks[ name ];
        if (hook && hook.get) {
            return hook.get(elem, name);

        } else {
            return elem[ name ];
        }
    }

    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {
            /**
             * Get the value of a property for the first element in the set of matched elements.
             * or
             * Set one or more properties for the set of matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector matched elements
             * @param {String|Object} name
             * The name of the property to set.
             * or
             * A map of property-value pairs to set.
             * @param [value] A value to set for the property.
             * @return {String|undefined|Boolean}
             */
            prop: function (selector, name, value) {
                var elems = DOM.query(selector);

                // supports hash
                if (S.isPlainObject(name)) {
                    S.each(name, function (v, k) {
                        DOM.prop(elems, k, v);
                    });
                    return undefined;
                }

                // Try to normalize/fix the name
                name = propFix[ name ] || name;
                var hook = propHooks[ name ];
                if (value !== undefined) {
                    for (var i = elems.length - 1; i >= 0; i--) {
                        var elem = elems[i];
                        if (hook && hook.set) {
                            hook.set(elem, value, name);
                        } else {
                            elem[ name ] = value;
                        }
                    }
                } else {
                    if (elems.length) {
                        return getProp(elems[0], name);
                    }
                }
                return undefined;
            },

            /**
             * Whether one of the matched elements has specified property name
             * @param {HTMLElement[]|String|HTMLElement} selector 元素
             * @param {String} name The name of property to test
             * @return {Boolean}
             */
            hasProp: function (selector, name) {
                var elems = DOM.query(selector);
                for (var i = 0; i < elems.length; i++) {
                    var el = elems[i];
                    if (getProp(el, name) !== undefined) {
                        return true;
                    }
                }
                return false;
            },

            /**
             * Remove a property for the set of matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector matched elements
             * @param {String} name The name of the property to remove.
             */
            removeProp: function (selector, name) {
                name = propFix[ name ] || name;
                var elems = DOM.query(selector);
                for (var i = elems.length - 1; i >= 0; i--) {
                    var el = elems[i];
                    try {
                        el[ name ] = undefined;
                        delete el[ name ];
                    } catch (e) {
                        // S.log('delete el property error : ');
                        // S.log(e);
                    }
                }
            },

            /**
             * Get the value of an attribute for the first element in the set of matched elements.
             * or
             * Set one or more attributes for the set of matched elements.
             * @param {HTMLElement[]|HTMLElement|String} selector matched elements
             * @param {String|Object} name The name of the attribute to set. or A map of attribute-value pairs to set.
             * @param [val] A value to set for the attribute.
             * @return {String}
             */
            attr: function (selector, name, val, pass) {
                /*
                 Hazards From Caja Note:

                 - In IE[67], el.setAttribute doesn't work for attributes like
                 'class' or 'for'.  IE[67] expects you to set 'className' or
                 'htmlFor'.  Caja use setAttributeNode solves this problem.

                 - In IE[67], <input> elements can shadow attributes.  If el is a
                 form that contains an <input> named x, then el.setAttribute(x, y)
                 will set x's value rather than setting el's attribute.  Using
                 setAttributeNode solves this problem.

                 - In IE[67], the style attribute can only be modified by setting
                 el.style.cssText.  Neither setAttribute nor setAttributeNode will
                 work.  el.style.cssText isn't bullet-proof, since it can be
                 shadowed by <input> elements.

                 - In IE[67], you can never change the type of an <button> element.
                 setAttribute('type') silently fails, but setAttributeNode
                 throws an exception.  caja : the silent failure. KISSY throws error.

                 - In IE[67], you can never change the type of an <input> element.
                 setAttribute('type') throws an exception.  We want the exception.

                 - In IE[67], setAttribute is case-sensitive, unless you pass 0 as a
                 3rd argument.  setAttributeNode is case-insensitive.

                 - Trying to set an invalid name like ':' is supposed to throw an
                 error.  In IE[678] and Opera 10, it fails without an error.
                 */

                var els = DOM.query(selector);

                // supports hash
                if (S.isPlainObject(name)) {
                    pass = val;
                    for (var k in name) {
                        if (name.hasOwnProperty(k)) {
                            DOM.attr(els, k, name[k], pass);
                        }
                    }
                    return undefined;
                }

                if (!(name = S.trim(name))) {
                    return undefined;
                }

                // attr functions
                if (pass && attrFn[name]) {
                    return DOM[name](selector, val);
                }

                // scrollLeft
                name = name.toLowerCase();

                if (pass && attrFn[name]) {
                    return DOM[name](selector, val);
                }

                // custom attrs
                name = attrFix[name] || name;

                var attrNormalizer,
                    el = els[0],
                    ret;

                if (R_BOOLEAN.test(name)) {
                    attrNormalizer = boolHook;
                }
                // only old ie?
                else if (R_INVALID_CHAR.test(name)) {
                    attrNormalizer = attrNodeHook;
                } else {
                    attrNormalizer = attrHooks[name];
                }


                if (val === undefined) {
                    if (el && el.nodeType === NodeType.ELEMENT_NODE) {
                        // browsers index elements by id/name on forms, give priority to attributes.
                        if (nodeName(el) == 'form') {
                            attrNormalizer = attrNodeHook;
                        }
                        if (attrNormalizer && attrNormalizer.get) {
                            return attrNormalizer.get(el, name);
                        }

                        ret = el.getAttribute(name);

                        // standard browser non-existing attribute return null
                        // ie<8 will return undefined , because it return property
                        // so norm to undefined
                        return ret === null ? undefined : ret;
                    }
                } else {
                    for (var i = els.length - 1; i >= 0; i--) {
                        el = els[i];
                        if (el && el.nodeType === NodeType.ELEMENT_NODE) {
                            if (nodeName(el) == 'form') {
                                attrNormalizer = attrNodeHook;
                            }
                            if (attrNormalizer && attrNormalizer.set) {
                                attrNormalizer.set(el, val, name);
                            } else {
                                // convert the value to a string (all browsers do this but IE)
                                el.setAttribute(name, EMPTY + val);
                            }
                        }
                    }
                }
                return undefined;
            },

            /**
             * Remove an attribute from each element in the set of matched elements.
             * @param {HTMLElement[]|String} selector matched elements
             * @param {String} name An attribute to remove
             */
            removeAttr: function (selector, name) {
                name = name.toLowerCase();
                name = attrFix[name] || name;
                var els = DOM.query(selector), el, i;
                for (i = els.length - 1; i >= 0; i--) {
                    el = els[i];
                    if (el.nodeType == NodeType.ELEMENT_NODE) {
                        var propName;
                        el.removeAttribute(name);
                        // Set corresponding property to false for boolean attributes
                        if (R_BOOLEAN.test(name) && (propName = propFix[ name ] || name) in el) {
                            el[ propName ] = false;
                        }
                    }
                }
            },

            /**
             * Whether one of the matched elements has specified attribute
             * @method
             * @param {HTMLElement[]|String} selector matched elements
             * @param {String} name The attribute to be tested
             * @return {Boolean}
             */
            hasAttr: !docElement.hasAttribute ?
                function (selector, name) {
                    name = name.toLowerCase();
                    var elems = DOM.query(selector);
                    // from ppk :http://www.quirksmode.org/dom/w3c_core.html
                    // IE5-7 doesn't return the value of a style attribute.
                    // var $attr = el.attributes[name];
                    for (var i = 0; i < elems.length; i++) {
                        var el = elems[i];
                        var $attr = el.getAttributeNode(name);
                        if ($attr && $attr.specified) {
                            return true;
                        }
                    }
                    return false;
                }
                :
                function (selector, name) {
                    var elems = DOM.query(selector);
                    for (var i = 0; i < elems.length; i++) {
                        var el = elems[i];
                        //使用原生实现
                        if (el.hasAttribute(name)) {
                            return true;
                        }
                    }
                    return false;
                },

            /**
             * Get the current value of the first element in the set of matched elements.
             * or
             * Set the value of each element in the set of matched elements.
             * @param {HTMLElement[]|String} selector matched elements
             * @param {String|String[]} [value] A string of text or an array of strings corresponding to the value of each matched element to set as selected/checked.
             * @return {undefined|String|String[]|Number}
             */
            val: function (selector, value) {
                var hook, ret;

                //getter
                if (value === undefined) {

                    var elem = DOM.get(selector);

                    if (elem) {
                        hook = valHooks[ nodeName(elem) ] || valHooks[ elem.type ];

                        if (hook && 'get' in hook && (ret = hook.get(elem, 'value')) !== undefined) {
                            return ret;
                        }

                        ret = elem.value;

                        return typeof ret === 'string' ?
                            // handle most common string cases
                            ret.replace(R_RETURN, '') :
                            // handle cases where value is null/undefined or number
                            ret == null ? '' : ret;
                    }

                    return undefined;
                }

                var els = DOM.query(selector), i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    if (elem.nodeType !== 1) {
                        return undefined;
                    }

                    var val = value;

                    // Treat null/undefined as ''; convert numbers to string
                    if (val == null) {
                        val = '';
                    } else if (typeof val === 'number') {
                        val += '';
                    } else if (S.isArray(val)) {
                        val = S.map(val, function (value) {
                            return value == null ? '' : value + '';
                        });
                    }

                    hook = valHooks[ nodeName(elem)] || valHooks[ elem.type ];

                    // If set returns undefined, fall back to normal setting
                    if (!hook || !('set' in hook) || hook.set(elem, val, 'value') === undefined) {
                        elem.value = val;
                    }
                }
                return undefined;
            },

            _propHooks: propHooks,

            /**
             * Get the combined text contents of each element in the set of matched elements, including their descendants.
             * or
             * Set the content of each element in the set of matched elements to the specified text.
             * @param {HTMLElement[]|HTMLElement|String} selector matched elements
             * @param {String} [val] A string of text to set as the content of each matched element.
             * @return {String|undefined}
             */
            text: function (selector, val) {
                // getter
                if (val === undefined) {
                    // supports css selector/Node/NodeList
                    var el = DOM.get(selector);

                    // only gets value on supported nodes
                    if (el.nodeType == NodeType.ELEMENT_NODE) {
                        return el[TEXT] || EMPTY;
                    }
                    else if (el.nodeType == NodeType.TEXT_NODE) {
                        return el.nodeValue;
                    }
                    return undefined;
                }
                // setter
                else {
                    var els = DOM.query(selector), i;
                    for (i = els.length - 1; i >= 0; i--) {
                        el = els[i];
                        if (el.nodeType == NodeType.ELEMENT_NODE) {
                            el[TEXT] = val;
                        }
                        else if (el.nodeType == NodeType.TEXT_NODE) {
                            el.nodeValue = val;
                        }
                    }
                }
                return undefined;
            }
        });

    return DOM;
}, {
    requires: ['./base', 'ua']
});
/*
  NOTES:
  yiminghe@gmail.com：2011-06-03
   - 借鉴 jquery 1.6,理清 attribute 与 property
 
  yiminghe@gmail.com：2011-01-28
   - 处理 tabindex，顺便重构
 
  2010.03
   - 在 jquery/support.js 中，special attrs 里还有 maxlength, cellspacing,
     rowspan, colspan, useap, frameboder, 但测试发现，在 Grade-A 级浏览器中
     并无兼容性问题。
   - 当 colspan/rowspan 属性值设置有误时，ie7- 会自动纠正，和 href 一样，需要传递
     第 2 个参数来解决。jQuery 未考虑，存在兼容性 bug.
   - jQuery 考虑了未显式设定 tabindex 时引发的兼容问题，kissy 里忽略（太不常用了）
   - jquery/attributes.js: Safari mis-reports the default selected
     property of an option 在 Safari 4 中已修复。
 
 *//**
 * @ignore
 * @fileOverview dom
 * @author yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add('dom/base', function (S, UA, undefined) {

    var WINDOW = S.Env.host;

    /**
     * DOM Element node type.
     * @enum {Number} KISSY.DOM.NodeType
     */
    var NodeType = {
        /**
         * element type
         */
        ELEMENT_NODE: 1,
        /**
         * attribute node type
         */
        'ATTRIBUTE_NODE': 2,
        /**
         * text node type
         */
        TEXT_NODE: 3,
        /**
         * cdata node type
         */
        'CDATA_SECTION_NODE': 4,
        /**
         * entity reference node type
         */
        'ENTITY_REFERENCE_NODE': 5,
        /**
         * entity node type
         */
        'ENTITY_NODE': 6,
        /**
         * processing instruction node type
         */
        'PROCESSING_INSTRUCTION_NODE': 7,
        /**
         * comment node type
         */
        COMMENT_NODE: 8,
        /**
         * document node type
         */
        DOCUMENT_NODE: 9,
        /**
         * document type
         */
        'DOCUMENT_TYPE_NODE': 10,
        /**
         * document fragment type
         */
        DOCUMENT_FRAGMENT_NODE: 11,
        /**
         * notation type
         */
        'NOTATION_NODE': 12
    };
    /**
     * KISSY DOM Utils.
     * Provides DOM helper methods.
     * @class KISSY.DOM
     * @singleton
     */
    var DOM = {

        /**
         * Whether has been set a custom domain,
         * @param {window} [win] Test window. Default current window.
         * @return {Boolean}
         */
        isCustomDomain: function (win) {
            win = win || WINDOW;
            var domain = win.document.domain,
                hostname = win.location.hostname;
            return domain != hostname &&
                domain != ( '[' + hostname + ']' );	// IPv6 IP support
        },

        /**
         * Get appropriate src for new empty iframe.
         * Consider custom domain.
         * @param {window} [win] Window new iframe will be inserted into.
         * @return {String} Src for iframe.
         */
        getEmptyIframeSrc: function (win) {
            win = win || WINDOW;
            if (UA['ie'] && DOM.isCustomDomain(win)) {
                return  'javascript:void(function(){' + encodeURIComponent(
                    'document.open();' +
                        "document.domain='" +
                        win.document.domain
                        + "';" +
                        'document.close();') + '}())';
            }
            return undefined;
        },

        NodeType: NodeType,

        /**
         * Return corresponding window if elem is document or window or undefined.
         * Else return false.
         * @private
         * @param {undefined|window|HTMLDocument} elem
         * @return {window|Boolean}
         */
        _getWin: function (elem) {
            if (elem == null) {
                return WINDOW;
            }
            return ('scrollTo' in elem && elem['document']) ?
                elem : elem.nodeType == NodeType.DOCUMENT_NODE ?
                elem.defaultView || elem.parentWindow :
                false;
        },

        // Ref: http://lifesinger.github.com/lab/2010/nodelist.html
        _isNodeList: function (o) {
            // 注1：ie 下，有 window.item, typeof node.item 在 ie 不同版本下，返回值不同
            // 注2：select 等元素也有 item, 要用 !node.nodeType 排除掉
            // 注3：通过 namedItem 来判断不可靠
            // 注4：getElementsByTagName 和 querySelectorAll 返回的集合不同
            // 注5: 考虑 iframe.contentWindow
            return o && !o.nodeType && o.item && !o.setTimeout;
        },

        /**
         * Get node 's nodeName in lowercase.
         * @param {HTMLElement[]|String|HTMLElement} selector Matched elements.
         * @return {String} el 's nodeName in lowercase
         */
        nodeName: function (selector) {
            var el = DOM.get(selector),
                nodeName = el.nodeName.toLowerCase();
            // http://msdn.microsoft.com/en-us/library/ms534388(VS.85).aspx
            if (UA['ie']) {
                var scopeName = el['scopeName'];
                if (scopeName && scopeName != 'HTML') {
                    nodeName = scopeName.toLowerCase() + ':' + nodeName;
                }
            }
            return nodeName;
        }
    };

    S.mix(DOM, NodeType);

    return DOM;

}, {
    requires: ['ua']
});

/*
 2011-08
 - 添加键盘枚举值，方便依赖程序清晰
 */
/**
 * @ignore
 * @fileOverview dom-class
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/class', function (S, DOM, undefined) {

    var SPACE = ' ',
        NodeType=DOM.NodeType,
        REG_SPLIT = /[\.\s]\s*\.?/,
        REG_CLASS = /[\n\t]/g;

    function norm(elemClass) {
        return (SPACE + elemClass + SPACE).replace(REG_CLASS, SPACE);
    }

    S.mix(DOM,

        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {
            /**
             * Determine whether any of the matched elements are assigned the given classes.
             * @param {HTMLElement|String|HTMLElement[]} selector matched elements
             * @param {String} className One or more class names to search for.
             * multiple class names is separated by space
             * @return {Boolean}
             */
            hasClass:function (selector, className) {
                return batch(selector, className, function (elem, classNames, cl) {
                    var elemClass = elem.className;
                    if (elemClass) {
                        var className = norm(elemClass),
                            j = 0,
                            ret = true;
                        for (; j < cl; j++) {
                            if (className.indexOf(SPACE + classNames[j] + SPACE) < 0) {
                                ret = false;
                                break;
                            }
                        }
                        if (ret) {
                            return true;
                        }
                    }
                }, true);
            },

            /**
             * Adds the specified class(es) to each of the set of matched elements.
             * @param {HTMLElement|String|HTMLElement[]} selector matched elements
             * @param {String} className One or more class names to be added to the class attribute of each matched element.
             * multiple class names is separated by space
             */
            addClass:function (selector, className) {
                batch(selector, className, function (elem, classNames, cl) {
                    var elemClass = elem.className;
                    if (!elemClass) {
                        elem.className = className;
                    } else {
                        var normClassName = norm(elemClass),
                            setClass = elemClass,
                            j = 0;
                        for (; j < cl; j++) {
                            if (normClassName.indexOf(SPACE + classNames[j] + SPACE) < 0) {
                                setClass += SPACE + classNames[j];
                            }
                        }
                        elem.className = S.trim(setClass);
                    }
                }, undefined);
            },

            /**
             * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
             * @param {HTMLElement|String|HTMLElement[]} selector matched elements
             * @param {String} className One or more class names to be removed from the class attribute of each matched element.
             * multiple class names is separated by space
             */
            removeClass:function (selector, className) {
                batch(selector, className, function (elem, classNames, cl) {
                    var elemClass = elem.className;
                    if (elemClass) {
                        if (!cl) {
                            elem.className = '';
                        } else {
                            var className = norm(elemClass),
                                j = 0,
                                needle;
                            for (; j < cl; j++) {
                                needle = SPACE + classNames[j] + SPACE;
                                // 一个 cls 有可能多次出现：'link link2 link link3 link'
                                while (className.indexOf(needle) >= 0) {
                                    className = className.replace(needle, SPACE);
                                }
                            }
                            elem.className = S.trim(className);
                        }
                    }
                }, undefined);
            },

            /**
             * Replace a class with another class for matched elements.
             * If no oldClassName is present, the newClassName is simply added.
             * @param {HTMLElement|String|HTMLElement[]} selector matched elements
             * @param {String} oldClassName One or more class names to be removed from the class attribute of each matched element.
             * multiple class names is separated by space
             * @param {String} newClassName One or more class names to be added to the class attribute of each matched element.
             * multiple class names is separated by space
             */
            replaceClass:function (selector, oldClassName, newClassName) {
                DOM.removeClass(selector, oldClassName);
                DOM.addClass(selector, newClassName);
            },

            /**
             * Add or remove one or more classes from each element in the set of
             * matched elements, depending on either the class's presence or the
             * value of the switch argument.
             * @param {HTMLElement|String|HTMLElement[]} selector matched elements
             * @param {String} className One or more class names to be added to the class attribute of each matched element.
             * multiple class names is separated by space
             * @param [state] {Boolean} optional boolean to indicate whether class
             *        should be added or removed regardless of current state.
             */
            toggleClass:function (selector, className, state) {
                var isBool = S.isBoolean(state), has;

                batch(selector, className, function (elem, classNames, cl) {
                    var j = 0, className;
                    for (; j < cl; j++) {
                        className = classNames[j];
                        has = isBool ? !state : DOM.hasClass(elem, className);
                        DOM[has ? 'removeClass' : 'addClass'](elem, className);
                    }
                }, undefined);
            }
        });

    function batch(selector, value, fn, resultIsBool) {
        if (!(value = S.trim(value))) {
            return resultIsBool ? false : undefined;
        }

        var elems = DOM.query(selector),
            len = elems.length,
            tmp = value.split(REG_SPLIT),
            elem,
            ret;

        var classNames = [];
        for (var i = 0; i < tmp.length; i++) {
            var t = S.trim(tmp[i]);
            if (t) {
                classNames.push(t);
            }
        }
        for (i = 0; i < len; i++) {
            elem = elems[i];
            if (elem.nodeType==NodeType.ELEMENT_NODE) {
                ret = fn(elem, classNames, classNames.length);
                if (ret !== undefined) {
                    return ret;
                }
            }
        }

        if (resultIsBool) {
            return false;
        }
        return undefined;
    }

    return DOM;
}, {
    requires:['dom/base']
});

/*
  NOTES:
    - hasClass/addClass/removeClass 的逻辑和 jQuery 保持一致
    - toggleClass 不支持 value 为 undefined 的情形（jQuery 支持）
 */
/**
 * @ignore
 * @fileOverview dom-create
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/create', function (S, DOM, UA, undefined) {

        var doc = S.Env.host.document,
            NodeType=DOM.NodeType,
            ie = UA['ie'],
            isString = S.isString,
            DIV = 'div',
            PARENT_NODE = 'parentNode',
            DEFAULT_DIV = doc.createElement(DIV),
            R_XHTML_TAG = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
            RE_TAG = /<([\w:]+)/,
            R_TBODY = /<tbody/i,
            R_LEADING_WHITESPACE = /^\s+/,
            lostLeadingWhitespace = ie && ie < 9,
            R_HTML = /<|&#?\w+;/,
            supportOuterHTML = 'outerHTML' in doc.documentElement,
            RE_SIMPLE_TAG = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;

        // help compression
        function getElementsByTagName(el, tag) {
            return el.getElementsByTagName(tag);
        }

        function cleanData(els) {
            var Event = S.require('event');
            if (Event) {
                Event.detach(els);
            }
            DOM.removeData(els);
        }

        S.mix(DOM,
            /**
             * @override KISSY.DOM
             * @class
             * @singleton
             */
            {

                /**
                 * Creates DOM elements on the fly from the provided string of raw HTML.
                 * @param {String} html A string of HTML to create on the fly. Note that this parses HTML, not XML.
                 * @param {Object} [props] An map of attributes on the newly-created element.
                 * @param {HTMLDocument} [ownerDoc] A document in which the new elements will be created
                 * @return {DocumentFragment|HTMLElement}
                 */
                create:function (html, props, ownerDoc, _trim/*internal*/) {

                    var ret = null;

                    if (!html) {
                        return ret;
                    }

                    if (html.nodeType) {
                        return DOM.clone(html);
                    }


                    if (!isString(html)) {
                        return ret;
                    }

                    if (_trim === undefined) {
                        _trim = true;
                    }

                    if (_trim) {
                        html = S.trim(html);
                    }


                    var creators = DOM._creators,
                        holder,
                        whitespaceMatch,
                        context = ownerDoc || doc,
                        m,
                        tag = DIV,
                        k,
                        nodes;

                    if (!R_HTML.test(html)) {
                        ret = context.createTextNode(html);
                    }
                    // 简单 tag, 比如 DOM.create('<p>')
                    else if ((m = RE_SIMPLE_TAG.exec(html))) {
                        ret = context.createElement(m[1]);
                    }
                    // 复杂情况，比如 DOM.create('<img src='sprite.png' />')
                    else {
                        // Fix 'XHTML'-style tags in all browsers
                        html = html.replace(R_XHTML_TAG, '<$1><' + '/$2>');

                        if ((m = RE_TAG.exec(html)) && (k = m[1])) {
                            tag = k.toLowerCase();
                        }

                        holder = (creators[tag] || creators[DIV])(html, context);
                        // ie 把前缀空白吃掉了
                        if (lostLeadingWhitespace && (whitespaceMatch = html.match(R_LEADING_WHITESPACE))) {
                            holder.insertBefore(context.createTextNode(whitespaceMatch[0]), holder.firstChild);
                        }
                        nodes = holder.childNodes;

                        if (nodes.length === 1) {
                            // return single node, breaking parentNode ref from 'fragment'
                            ret = nodes[0][PARENT_NODE].removeChild(nodes[0]);
                        }
                        else if (nodes.length) {
                            // return multiple nodes as a fragment
                            ret = nodeListToFragment(nodes);
                        } else {
                            S.error(html + ' : create node error');
                        }
                    }

                    return attachProps(ret, props);
                },

                _creators:{
                    div:function (html, ownerDoc) {
                        var frag = ownerDoc && ownerDoc != doc ? ownerDoc.createElement(DIV) : DEFAULT_DIV;
                        // html 为 <style></style> 时不行，必须有其他元素？
                        frag['innerHTML'] = 'm<div>' + html + '<' + '/div>';
                        return frag.lastChild;
                    }
                },

                /**
                 * Get the HTML contents of the first element in the set of matched elements.
                 * or
                 * Set the HTML contents of each element in the set of matched elements.
                 * @param {HTMLElement|String|HTMLElement[]} selector matched elements
                 * @param {String} htmlString  A string of HTML to set as the content of each matched element.
                 * @param {Boolean} [loadScripts=false] True to look for and process scripts
                 */
                html:function (selector, htmlString, loadScripts, callback) {
                    // supports css selector/Node/NodeList
                    var els = DOM.query(selector),
                        el = els[0];
                    if (!el) {
                        return
                    }
                    // getter
                    if (htmlString === undefined) {
                        // only gets value on the first of element nodes
                        if (el.nodeType == NodeType.ELEMENT_NODE) {
                            return el.innerHTML;
                        } else {
                            return null;
                        }
                    }
                    // setter
                    else {

                        var success = false, i, elem;
                        htmlString += '';

                        // faster
                        // fix #103,some html element can not be set through innerHTML
                        if (!htmlString.match(/<(?:script|style|link)/i) &&
                            (!lostLeadingWhitespace || !htmlString.match(R_LEADING_WHITESPACE)) &&
                            !creatorsMap[ (htmlString.match(RE_TAG) || ['', ''])[1].toLowerCase() ]) {

                            try {
                                for (i = els.length - 1; i >= 0; i--) {
                                    elem = els[i];
                                    if (elem.nodeType == NodeType.ELEMENT_NODE) {
                                        cleanData(getElementsByTagName(elem, '*'));
                                        elem.innerHTML = htmlString;
                                    }
                                }
                                success = true;
                            } catch (e) {
                                // a <= '<a>'
                                // a.innerHTML='<p>1</p>';
                            }

                        }

                        if (!success) {
                            var valNode = DOM.create(htmlString, 0, el.ownerDocument, 0);
                            DOM.empty(els);
                            DOM.append(valNode, els, loadScripts);
                        }
                        callback && callback();
                    }
                },

                /**
                 * Get the outerHTML of the first element in the set of matched elements.
                 * or
                 * Set the outerHTML of each element in the set of matched elements.
                 * @param {HTMLElement|String|HTMLElement[]} selector matched elements
                 * @param {String} htmlString  A string of HTML to set as outerHTML of each matched element.
                 * @param {Boolean} [loadScripts=false] True to look for and process scripts
                 */
                outerHTML:function (selector, htmlString, loadScripts) {
                    var els = DOM.query(selector),
                        holder,
                        i,
                        valNode,
                        length = els.length,
                        el = els[0];
                    if (!el) {
                        return
                    }
                    // getter
                    if (htmlString === undefined) {
                        if (supportOuterHTML) {
                            return el.outerHTML
                        } else {
                            holder = el.ownerDocument.createElement('div');
                            holder.appendChild(DOM.clone(el, true));
                            return holder.innerHTML;
                        }
                    } else {
                        htmlString += '';
                        if (!htmlString.match(/<(?:script|style|link)/i) && supportOuterHTML) {
                            for (i = length - 1; i >= 0; i--) {
                                el = els[i];
                                if (el.nodeType == NodeType.ELEMENT_NODE) {
                                    cleanData(el);
                                    cleanData(getElementsByTagName(el, '*'));
                                    el.outerHTML = htmlString;
                                }
                            }
                        } else {
                            valNode = DOM.create(htmlString, 0, el.ownerDocument, 0);
                            DOM.insertBefore(valNode, els, loadScripts);
                            DOM.remove(els);
                        }
                    }
                },

                /**
                 * Remove the set of matched elements from the DOM.
                 * @param {HTMLElement|String|HTMLElement[]} selector matched elements
                 * @param {Boolean} [keepData=false] whether keep bound events and jQuery data associated with the elements from removed.
                 */
                remove:function (selector, keepData) {
                    var el, els = DOM.query(selector), i;
                    for (i = els.length - 1; i >= 0; i--) {
                        el = els[i];
                        if (!keepData && el.nodeType == NodeType.ELEMENT_NODE) {
                            // 清理数据
                            var elChildren = getElementsByTagName(el, '*');
                            cleanData(elChildren);
                            cleanData(el);
                        }

                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    }
                },

                /**
                 * Create a deep copy of the first of matched elements.
                 * @param {HTMLElement|String|HTMLElement[]} selector matched elements
                 * @param {Boolean|Object} [deep=false] whether perform deep copy or copy config.
                 * @param {Boolean} [deep.deep] whether perform deep copy
                 * @param {Boolean} [deep.withDataAndEvent=false] A Boolean indicating
                 * whether event handlers and data should be copied along with the elements.
                 * @param {Boolean} [deep.deepWithDataAndEvent=false]
                 * A Boolean indicating whether event handlers and data for all children of the cloned element should be copied.
                 * if set true then deep argument must be set true as well.
                 * @param {Boolean} [withDataAndEvent=false] A Boolean indicating
                 * whether event handlers and data should be copied along with the elements.
                 * @param {Boolean} [deepWithDataAndEvent=false]
                 * A Boolean indicating whether event handlers and data for all children of the cloned element should be copied.
                 * if set true then deep argument must be set true as well.
                 * @see https://developer.mozilla.org/En/DOM/Node.cloneNode
                 * @return {HTMLElement}
                 * @member KISSY.DOM
                 */
                clone:function (selector, deep, withDataAndEvent, deepWithDataAndEvent) {

                    if (typeof deep === 'object') {
                        deepWithDataAndEvent = deep['deepWithDataAndEvent'];
                        withDataAndEvent = deep['withDataAndEvent'];
                        deep = deep['deep'];
                    }

                    var elem = DOM.get(selector);

                    if (!elem) {
                        return null;
                    }

                    // TODO
                    // ie bug :
                    // 1. ie<9 <script>xx</script> => <script></script>
                    // 2. ie will execute external script
                    var clone = elem.cloneNode(deep);

                    if (elem.nodeType == NodeType.ELEMENT_NODE ||
                        elem.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
                        // IE copies events bound via attachEvent when using cloneNode.
                        // Calling detachEvent on the clone will also remove the events
                        // from the original. In order to get around this, we use some
                        // proprietary methods to clear the events. Thanks to MooTools
                        // guys for this hotness.
                        if (elem.nodeType == NodeType.ELEMENT_NODE) {
                            fixAttributes(elem, clone);
                        }

                        if (deep) {
                            processAll(fixAttributes, elem, clone);
                        }
                    }
                    // runtime 获得事件模块
                    if (withDataAndEvent) {
                        cloneWithDataAndEvent(elem, clone);
                        if (deep && deepWithDataAndEvent) {
                            processAll(cloneWithDataAndEvent, elem, clone);
                        }
                    }
                    return clone;
                },

                /**
                 * Remove(include data and event handlers) all child nodes of the set of matched elements from the DOM.
                 * @param {HTMLElement|String|HTMLElement[]} selector matched elements
                 */
                empty:function (selector) {
                    var els = DOM.query(selector), el, i;
                    for (i = els.length - 1; i >= 0; i--) {
                        el = els[i];
                        DOM.remove(el.childNodes);
                    }
                },

                nodeListToFragment:nodeListToFragment
            });

        function processAll(fn, elem, clone) {
            if (elem.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
                var eCs = elem.childNodes,
                    cloneCs = clone.childNodes,
                    fIndex = 0;
                while (eCs[fIndex]) {
                    if (cloneCs[fIndex]) {
                        processAll(fn, eCs[fIndex], cloneCs[fIndex]);
                    }
                    fIndex++;
                }
            } else if (elem.nodeType == NodeType.ELEMENT_NODE) {
                var elemChildren = getElementsByTagName(elem, '*'),
                    cloneChildren = getElementsByTagName(clone, '*'),
                    cIndex = 0;
                while (elemChildren[cIndex]) {
                    if (cloneChildren[cIndex]) {
                        fn(elemChildren[cIndex], cloneChildren[cIndex]);
                    }
                    cIndex++;
                }
            }
        }


        // 克隆除了事件的 data
        function cloneWithDataAndEvent(src, dest) {
            var Event = S.require('event');

            if (dest.nodeType == NodeType.ELEMENT_NODE && !DOM.hasData(src)) {
                return;
            }

            var srcData = DOM.data(src);

            // 浅克隆，data 也放在克隆节点上
            for (var d in srcData) {
                DOM.data(dest, d, srcData[d]);
            }

            // 事件要特殊点
            if (Event) {
                // remove event data (but without dom attached listener) which is copied from above DOM.data
                Event._removeData(dest);
                // attach src's event data and dom attached listener to dest
                Event._clone(src, dest);
            }
        }

        // wierd ie cloneNode fix from jq
        function fixAttributes(src, dest) {

            // clearAttributes removes the attributes, which we don't want,
            // but also removes the attachEvent events, which we *do* want
            if (dest.clearAttributes) {
                dest.clearAttributes();
            }

            // mergeAttributes, in contrast, only merges back on the
            // original attributes, not the events
            if (dest.mergeAttributes) {
                dest.mergeAttributes(src);
            }

            var nodeName = dest.nodeName.toLowerCase(),
                srcChilds = src.childNodes;

            // IE6-8 fail to clone children inside object elements that use
            // the proprietary classid attribute value (rather than the type
            // attribute) to identify the type of content to display
            if (nodeName === 'object' && !dest.childNodes.length) {
                for (var i = 0; i < srcChilds.length; i++) {
                    dest.appendChild(srcChilds[i].cloneNode(true));
                }
                // dest.outerHTML = src.outerHTML;
            } else if (nodeName === 'input' && (src.type === 'checkbox' || src.type === 'radio')) {
                // IE6-8 fails to persist the checked state of a cloned checkbox
                // or radio button. Worse, IE6-7 fail to give the cloned element
                // a checked appearance if the defaultChecked value isn't also set
                if (src.checked) {
                    dest['defaultChecked'] = dest.checked = src.checked;
                }

                // IE6-7 get confused and end up setting the value of a cloned
                // checkbox/radio button to an empty string instead of 'on'
                if (dest.value !== src.value) {
                    dest.value = src.value;
                }

                // IE6-8 fails to return the selected option to the default selected
                // state when cloning options
            } else if (nodeName === 'option') {
                dest.selected = src.defaultSelected;
                // IE6-8 fails to set the defaultValue to the correct value when
                // cloning other types of input fields
            } else if (nodeName === 'input' || nodeName === 'textarea') {
                dest.defaultValue = src.defaultValue;
            }

            // Event data gets referenced instead of copied if the expando
            // gets copied too
            // 自定义 data 根据参数特殊处理，expando 只是个用于引用的属性
            dest.removeAttribute(DOM.__EXPANDO);
        }

        // 添加成员到元素中
        function attachProps(elem, props) {
            if (S.isPlainObject(props)) {
                if (elem.nodeType == NodeType.ELEMENT_NODE) {
                    DOM.attr(elem, props, true);
                }
                // document fragment
                else if (elem.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
                    DOM.attr(elem.childNodes, props, true);
                }
            }
            return elem;
        }

        // 将 nodeList 转换为 fragment
        function nodeListToFragment(nodes) {
            var ret = null,
                i,
                ownerDoc,
                len;
            if (nodes && (nodes.push || nodes.item) && nodes[0]) {
                ownerDoc = nodes[0].ownerDocument;
                ret = ownerDoc.createDocumentFragment();
                nodes = S.makeArray(nodes);
                for (i = 0, len = nodes.length; i < len; i++) {
                    ret.appendChild(nodes[i]);
                }
            } else {
                S.log('Unable to convert ' + nodes + ' to fragment.');
            }
            return ret;
        }

        // only for gecko and ie
        // 2010-10-22: 发现 chrome 也与 gecko 的处理一致了
        // if (ie || UA['gecko'] || UA['webkit']) {
        // 定义 creators, 处理浏览器兼容
        var creators = DOM._creators,
            create = DOM.create,
            creatorsMap = {
                option:'select',
                optgroup:'select',
                area:'map',
                thead:'table',
                td:'tr',
                th:'tr',
                tr:'tbody',
                tbody:'table',
                tfoot:'table',
                caption:'table',
                colgroup:'table',
                col:'colgroup',
                legend:'fieldset' // ie 支持，但 gecko 不支持
            };

        for (var p in creatorsMap) {
            (function (tag) {
                creators[p] = function (html, ownerDoc) {
                    return create('<' + tag + '>' + html + '<' + '/' + tag + '>', null, ownerDoc);
                };
            })(creatorsMap[p]);
        }


        // IE7- adds TBODY when creating thead/tfoot/caption/col/colgroup elements
        if (ie < 8) {
            // fix #88
            // https://github.com/kissyteam/kissy/issues/88 : spurious tbody in ie<8
            creators.table = function (html, ownerDoc) {
                var frag = creators[DIV](html, ownerDoc),
                    hasTBody = R_TBODY.test(html);
                if (hasTBody) {
                    return frag;
                }
                var table = frag.firstChild,
                    tableChildren = S.makeArray(table.childNodes);
                S.each(tableChildren, function (c) {
                    if (DOM.nodeName(c) == 'tbody' && !c.childNodes.length) {
                        table.removeChild(c);
                    }
                });
                return frag;
            };
        }
        //}
        return DOM;
    },
    {
        requires:['./base', 'ua']
    });

/*
  2012-01-31
  remove spurious tbody

  2011-10-13
  empty , html refactor

  2011-08-22
  clone 实现，参考 jq

  2011-08
   remove 需要对子孙节点以及自身清除事件以及自定义 data
   create 修改，支持 <style></style> ie 下直接创建
   TODO: jquery clone ,clean 实现

  TODO:
   - 研究 jQuery 的 buildFragment 和 clean
   - 增加 cache, 完善 test cases
   - 支持更多 props
   - remove 时，是否需要移除事件，以避免内存泄漏？需要详细的测试。
 */
/**
 * @ignore
 * @fileOverview dom-data
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/data', function (S, DOM, undefined) {

    var win = S.Env.host,
        EXPANDO = '__ks_data_' + S.now(), // 让每一份 kissy 的 expando 都不同
        dataCache = { }, // 存储 node 节点的 data
        winDataCache = { };    // 避免污染全局


    // The following elements throw uncatchable exceptions if you
    // attempt to add expando properties to them.
    var noData = {
    };
    noData['applet'] = 1;
    noData['object'] = 1;
    noData['embed'] = 1;

    var commonOps = {
        hasData: function (cache, name) {
            if (cache) {
                if (name !== undefined) {
                    if (name in cache) {
                        return true;
                    }
                } else if (!S.isEmptyObject(cache)) {
                    return true;
                }
            }
            return false;
        }
    };

    var objectOps = {
        hasData: function (ob, name) {
            // 只判断当前窗口，iframe 窗口内数据直接放入全局变量
            if (ob == win) {
                return objectOps.hasData(winDataCache, name);
            }
            // 直接建立在对象内
            var thisCache = ob[EXPANDO];
            return commonOps.hasData(thisCache, name);
        },

        data: function (ob, name, value) {
            if (ob == win) {
                return objectOps.data(winDataCache, name, value);
            }
            var cache = ob[EXPANDO];
            if (value !== undefined) {
                cache = ob[EXPANDO] = ob[EXPANDO] || {};
                cache[name] = value;
            } else {
                if (name !== undefined) {
                    return cache && cache[name];
                } else {
                    cache = ob[EXPANDO] = ob[EXPANDO] || {};
                    return cache;
                }
            }
        },
        removeData: function (ob, name) {
            if (ob == win) {
                return objectOps.removeData(winDataCache, name);
            }
            var cache = ob[EXPANDO];
            if (name !== undefined) {
                delete cache[name];
                if (S.isEmptyObject(cache)) {
                    objectOps.removeData(ob);
                }
            } else {
                try {
                    // ob maybe window in iframe
                    // ie will throw error
                    delete ob[EXPANDO];
                } catch (e) {
                    ob[EXPANDO] = undefined;
                }
            }
        }
    };

    var domOps = {
        hasData: function (elem, name) {
            var key = elem[EXPANDO];
            if (!key) {
                return false;
            }
            var thisCache = dataCache[key];
            return commonOps.hasData(thisCache, name);
        },

        data: function (elem, name, value) {
            if (noData[elem.nodeName.toLowerCase()]) {
                return undefined;
            }
            var key = elem[EXPANDO], cache;
            if (!key) {
                // 根本不用附加属性
                if (name !== undefined &&
                    value === undefined) {
                    return undefined;
                }
                // 节点上关联键值也可以
                key = elem[EXPANDO] = S.guid();
            }
            cache = dataCache[key];
            if (value !== undefined) {
                // 需要新建
                cache = dataCache[key] = dataCache[key] || {};
                cache[name] = value;
            } else {
                if (name !== undefined) {
                    return cache && cache[name];
                } else {
                    // 需要新建
                    cache = dataCache[key] = dataCache[key] || {};
                    return cache;
                }
            }
        },

        removeData: function (elem, name) {
            var key = elem[EXPANDO], cache;
            if (!key) {
                return;
            }
            cache = dataCache[key];
            if (name !== undefined) {
                delete cache[name];
                if (S.isEmptyObject(cache)) {
                    domOps.removeData(elem);
                }
            } else {
                delete dataCache[key];
                try {
                    delete elem[EXPANDO];
                } catch (e) {
                    elem[EXPANDO] = undefined;
                    //S.log('delete expando error : ');
                    //S.log(e);
                }
                if (elem.removeAttribute) {
                    elem.removeAttribute(EXPANDO);
                }
            }
        }
    };


    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {

            __EXPANDO: EXPANDO,

            /**
             * Determine whether an element has any data or specified data name associated with it.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String} [name] A string naming the piece of data to set.
             * @return {Boolean}
             */
            hasData: function (selector, name) {
                var ret = false,
                    elems = DOM.query(selector);
                for (var i = 0; i < elems.length; i++) {
                    var elem = elems[i];
                    if (elem.nodeType) {
                        ret = domOps.hasData(elem, name);
                    } else {
                        // window
                        ret = objectOps.hasData(elem, name);
                    }
                    if (ret) {
                        return ret;
                    }
                }
                return ret;
            },

            /**
             * If name set and data unset Store arbitrary data associated with the specified element. Returns undefined.
             * or
             * If name set and data unset returns value at named data store for the element
             * or
             * If name unset and data unset returns the full data store for the element.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String} [name] A string naming the piece of data to set.
             * @param [data] The new data value.
             * @return {Object|undefined}
             */
            data: function (selector, name, data) {

                var elems = DOM.query(selector), elem = elems[0];

                // supports hash
                if (S.isPlainObject(name)) {
                    for (var k in name) {
                        if (name.hasOwnProperty(k)) {
                            DOM.data(elems, k, name[k]);
                        }
                    }
                    return undefined;
                }

                // getter
                if (data === undefined) {
                    if (elem) {
                        if (elem.nodeType) {
                            return domOps.data(elem, name);
                        } else {
                            // window
                            return objectOps.data(elem, name);
                        }
                    }
                }
                // setter
                else {
                    for (var i = elems.length - 1; i >= 0; i--) {
                        elem = elems[i];
                        if (elem.nodeType) {
                            domOps.data(elem, name, data);
                        } else {
                            // window
                            objectOps.data(elem, name, data);
                        }
                    }
                }
                return undefined;
            },

            /**
             * Remove a previously-stored piece of data from matched elements.
             * or
             * Remove all data from matched elements if name unset.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String} [name] A string naming the piece of data to delete.
             */
            removeData: function (selector, name) {
                var els = DOM.query(selector), elem, i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    if (elem.nodeType) {
                        domOps.removeData(elem, name);
                    } else {
                        // window
                        objectOps.removeData(elem, name);
                    }
                }
            }
        });

    return DOM;

}, {
    requires: ['./base']
});
/*
 承玉：2011-05-31
 - 分层 ，节点和普通对象分开处理
 *//**
 * @ignore
 * @fileOverview dom
 * @author yiminghe@gmail.com
 */
KISSY.add('dom', function (S, DOM) {

   S.mix(S,{
        DOM:DOM,
        get:DOM.get,
        query:DOM.query
    });

    return DOM;
}, {
    requires:['dom/attr',
        'dom/class',
        'dom/create',
        'dom/data',
        'dom/insertion',
        'dom/offset',
        'dom/style',
        'dom/selector',
        'dom/style-ie',
        'dom/traversal']
});/**
 * @ignore
 * @fileOverview dom-insertion
 * @author yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add('dom/insertion', function (S, UA, DOM) {

    var PARENT_NODE = 'parentNode',
        NodeType = DOM.NodeType,
        R_FORM_EL = /^(?:button|input|object|select|textarea)$/i,
        getNodeName = DOM.nodeName,
        makeArray = S.makeArray,
        splice = [].splice,
        NEXT_SIBLING = 'nextSibling';

    /*
     ie 6,7 lose checked status when append to dom
     var c=S.all('<input />');
     c.attr('type','radio');
     c.attr('checked',true);
     S.all('#t').append(c);
     alert(c[0].checked);
     */
    function fixChecked(ret) {
        for (var i = 0; i < ret.length; i++) {
            var el = ret[i];
            if (el.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
                fixChecked(el.childNodes);
            } else if (getNodeName(el) == 'input') {
                fixCheckedInternal(el);
            } else if (el.nodeType == NodeType.ELEMENT_NODE) {
                var cs = el.getElementsByTagName('input');
                for (var j = 0; j < cs.length; j++) {
                    fixChecked(cs[j]);
                }
            }
        }
    }

    function fixCheckedInternal(el) {
        if (el.type === 'checkbox' || el.type === 'radio') {
            // after insert , in ie6/7 checked is decided by defaultChecked !
            el.defaultChecked = el.checked;
        }
    }

    var R_SCRIPT_TYPE = /\/(java|ecma)script/i;

    function isJs(el) {
        return !el.type || R_SCRIPT_TYPE.test(el.type);
    }

    // extract script nodes and execute alone later
    function filterScripts(nodes, scripts) {
        var ret = [], i, el, nodeName;
        for (i = 0; nodes[i]; i++) {
            el = nodes[i];
            nodeName = getNodeName(el);
            if (el.nodeType == NodeType.DOCUMENT_FRAGMENT_NODE) {
                ret.push.apply(ret, filterScripts(makeArray(el.childNodes), scripts));
            } else if (nodeName === 'script' && isJs(el)) {
                // remove script to make sure ie9 does not invoke when append
                if (el.parentNode) {
                    el.parentNode.removeChild(el)
                }
                if (scripts) {
                    scripts.push(el);
                }
            } else {
                if (el.nodeType == NodeType.ELEMENT_NODE &&
                    // ie checkbox getElementsByTagName 后造成 checked 丢失
                    !R_FORM_EL.test(nodeName)) {
                    var tmp = [],
                        s,
                        j,
                        ss = el.getElementsByTagName('script');
                    for (j = 0; j < ss.length; j++) {
                        s = ss[j];
                        if (isJs(s)) {
                            tmp.push(s);
                        }
                    }
                    splice.apply(nodes, [i + 1, 0].concat(tmp));
                }
                ret.push(el);
            }
        }
        return ret;
    }

    // execute script
    function evalScript(el) {
        if (el.src) {
            S.getScript(el.src);
        } else {
            var code = S.trim(el.text || el.textContent || el.innerHTML || '');
            if (code) {
                S.globalEval(code);
            }
        }
    }

    // fragment is easier than nodelist
    function insertion(newNodes, refNodes, fn, scripts) {
        newNodes = DOM.query(newNodes);

        if (scripts) {
            scripts = [];
        }

        // filter script nodes ,process script separately if needed
        newNodes = filterScripts(newNodes, scripts);

        // Resets defaultChecked for any radios and checkboxes
        // about to be appended to the DOM in IE 6/7
        if (UA['ie'] < 8) {
            fixChecked(newNodes);
        }
        refNodes = DOM.query(refNodes);
        var newNodesLength = newNodes.length,
            refNodesLength = refNodes.length;
        if ((!newNodesLength && (!scripts || !scripts.length)) || !refNodesLength) {
            return;
        }
        // fragment 插入速度快点
        // 而且能够一个操作达到批量插入
        // refer: http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-B63ED1A3
        var newNode = DOM.nodeListToFragment(newNodes),
            clonedNode;
        //fragment 一旦插入里面就空了，先复制下
        if (refNodesLength > 1) {
            clonedNode = DOM.clone(newNode, true);
            refNodes = S.makeArray(refNodes)
        }
        for (var i = 0; i < refNodesLength; i++) {
            var refNode = refNodes[i];
            if (newNode) {
                //refNodes 超过一个，clone
                var node = i > 0 ? DOM.clone(clonedNode, true) : newNode;
                fn(node, refNode);
            }
            if (scripts && scripts.length) {
                S.each(scripts, evalScript);
            }
        }
    }

    // loadScripts default to false to prevent xss
    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {

            /**
             * Insert every element in the set of newNodes before every element in the set of refNodes.
             * @param {HTMLElement|HTMLElement[]} newNodes Nodes to be inserted
             * @param {HTMLElement|HTMLElement[]|String} refNodes Nodes to be referred
             */
            insertBefore: function (newNodes, refNodes, loadScripts) {
                insertion(newNodes, refNodes, function (newNode, refNode) {
                    if (refNode[PARENT_NODE]) {
                        refNode[PARENT_NODE].insertBefore(newNode, refNode);
                    }
                }, loadScripts);
            },

            /**
             * Insert every element in the set of newNodes after every element in the set of refNodes.
             * @param {HTMLElement|HTMLElement[]} newNodes Nodes to be inserted
             * @param {HTMLElement|HTMLElement[]|String} refNodes Nodes to be referred
             */
            insertAfter: function (newNodes, refNodes, loadScripts) {
                insertion(newNodes, refNodes, function (newNode, refNode) {
                    if (refNode[PARENT_NODE]) {
                        refNode[PARENT_NODE].insertBefore(newNode, refNode[NEXT_SIBLING]);
                    }
                }, loadScripts);
            },

            /**
             * Insert every element in the set of newNodes to the end of every element in the set of parents.
             * @param {HTMLElement|HTMLElement[]} newNodes Nodes to be inserted
             * @param {HTMLElement|HTMLElement[]|String} parents Nodes to be referred as parentNode
             */
            appendTo: function (newNodes, parents, loadScripts) {
                insertion(newNodes, parents, function (newNode, parent) {
                    parent.appendChild(newNode);
                }, loadScripts);
            },

            /**
             * Insert every element in the set of newNodes to the beginning of every element in the set of parents.
             * @param {HTMLElement|HTMLElement[]} newNodes Nodes to be inserted
             * @param {HTMLElement|HTMLElement[]|String} parents Nodes to be referred as parentNode
             */
            prependTo: function (newNodes, parents, loadScripts) {
                insertion(newNodes, parents, function (newNode, parent) {
                    parent.insertBefore(newNode, parent.firstChild);
                }, loadScripts);
            },

            /**
             * Wrap a node around all elements in the set of matched elements
             * @param {HTMLElement|HTMLElement[]|String} wrappedNodes set of matched elements
             * @param {HTMLElement|String} wrapperNode html node or selector to get the node wrapper
             */
            wrapAll: function (wrappedNodes, wrapperNode) {
                // deep clone
                wrapperNode = DOM.clone(DOM.get(wrapperNode), true);
                wrappedNodes = DOM.query(wrappedNodes);
                if (wrappedNodes[0].parentNode) {
                    DOM.insertBefore(wrapperNode, wrappedNodes[0]);
                }
                var c;
                while ((c = wrapperNode.firstChild) && c.nodeType == 1) {
                    wrapperNode = c;
                }
                DOM.appendTo(wrappedNodes, wrapperNode);
            },

            /**
             * Wrap a node around each element in the set of matched elements
             * @param {HTMLElement|HTMLElement[]|String} wrappedNodes set of matched elements
             * @param {HTMLElement|String} wrapperNode html node or selector to get the node wrapper
             */
            wrap: function (wrappedNodes, wrapperNode) {
                wrappedNodes = DOM.query(wrappedNodes);
                wrapperNode = DOM.get(wrapperNode);
                S.each(wrappedNodes, function (w) {
                    DOM.wrapAll(w, wrapperNode);
                });
            },

            /**
             * Wrap a node around the childNodes of each element in the set of matched elements.
             * @param {HTMLElement|HTMLElement[]|String} wrappedNodes set of matched elements
             * @param {HTMLElement|String} wrapperNode html node or selector to get the node wrapper
             */
            wrapInner: function (wrappedNodes, wrapperNode) {
                wrappedNodes = DOM.query(wrappedNodes);
                wrapperNode = DOM.get(wrapperNode);
                S.each(wrappedNodes, function (w) {
                    var contents = w.childNodes;
                    if (contents.length) {
                        DOM.wrapAll(contents, wrapperNode);
                    } else {
                        w.appendChild(wrapperNode);
                    }
                });
            },

            /**
             * Remove the parents of the set of matched elements from the DOM,
             * leaving the matched elements in their place.
             * @param {HTMLElement|HTMLElement[]|String} wrappedNodes set of matched elements
             */
            unwrap: function (wrappedNodes) {
                wrappedNodes = DOM.query(wrappedNodes);
                S.each(wrappedNodes, function (w) {
                    var p = w.parentNode;
                    DOM.replaceWith(p, p.childNodes);
                });
            },

            /**
             * Replace each element in the set of matched elements with the provided newNodes.
             * @param {HTMLElement|HTMLElement[]|String} selector set of matched elements
             * @param {HTMLElement|HTMLElement[]|String} newNodes new nodes to replace the matched elements
             */
            replaceWith: function (selector, newNodes) {
                var nodes = DOM.query(selector);
                newNodes = DOM.query(newNodes);
                DOM.remove(newNodes, true);
                DOM.insertBefore(newNodes, nodes);
                DOM.remove(nodes);
            }
        });
    S.each({
        'prepend': 'prependTo',
        'append': 'appendTo',
        'before': 'insertBefore',
        'after': 'insertAfter'
    }, function (value, key) {
        DOM[key] = DOM[value];
    });
    return DOM;
}, {
    requires: ['ua', './create']
});

/*
 2012-04-05 yiminghe@gmail.com
 - 增加 replaceWith/wrap/wrapAll/wrapInner/unwrap

 2011-05-25
 - 承玉：参考 jquery 处理多对多的情形 :http://api.jquery.com/append/
 DOM.append('.multi1','.multi2');

 */
/**
 * @ignore
 * @fileOverview dom-offset
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/offset', function (S, DOM, UA, undefined) {

    var win = S.Env.host,
        doc = win.document,
        NodeType = DOM.NodeType,
        docElem = doc.documentElement,
        getWin = DOM._getWin,
        CSS1Compat = 'CSS1Compat',
        compatMode = 'compatMode',
        MAX = Math.max,
        myParseInt = parseInt,
        POSITION = 'position',
        RELATIVE = 'relative',
        DOCUMENT = 'document',
        BODY = 'body',
        DOC_ELEMENT = 'documentElement',
        OWNER_DOCUMENT = 'ownerDocument',
        VIEWPORT = 'viewport',
        SCROLL = 'scroll',
        CLIENT = 'client',
        LEFT = 'left',
        TOP = 'top',
        isNumber = S.isNumber,
        SCROLL_LEFT = SCROLL + 'Left',
        SCROLL_TOP = SCROLL + 'Top';

    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {

            /**
             * Get the current coordinates of the first element in the set of matched elements, relative to the document.
             * or
             * Set the current coordinates of every element in the set of matched elements, relative to the document.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {Object} [coordinates ] An object containing the properties top and left,
             * which are integers indicating the new top and left coordinates for the elements.
             * @param {Number} [coordinates.left ] the new top and left coordinates for the elements.
             * @param {Number} [coordinates.top ] the new top and top coordinates for the elements.
             * @param {window} [relativeWin] The window to measure relative to. If relativeWin
             *     is not in the ancestor frame chain of the element, we measure relative to
             *     the top-most window.
             * @return {Object|undefined} if Get, the format of returned value is same with coordinates.
             */
            offset: function (selector, coordinates, relativeWin) {
                // getter
                if (coordinates === undefined) {
                    var elem = DOM.get(selector), ret;
                    if (elem) {
                        ret = getOffset(elem, relativeWin);
                    }
                    return ret;
                }
                // setter
                var els = DOM.query(selector), i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    setOffset(elem, coordinates);
                }
                return undefined;
            },

            /**
             * Makes the first of matched elements visible in the container
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|HTMLElement|HTMLDocument} [container=window] Container element
             * @param {Boolean} [top=true] Whether align with top of container.
             * @param {Boolean} [hscroll=true] Whether trigger horizontal scroll.
             * @param {Boolean} [auto=false] Whether adjust element automatically
             * (only scrollIntoView when element is out of view)
             * @see http://www.w3.org/TR/2009/WD-html5-20090423/editing.html#scrollIntoView
             *        http://www.sencha.com/deploy/dev/docs/source/Element.scroll-more.html#scrollIntoView
             *        http://yiminghe.javaeye.com/blog/390732
             */
            scrollIntoView: function (selector, container, top, hscroll, auto) {
                var elem;

                if (!(elem = DOM.get(selector))) {
                    return;
                }

                if (container) {
                    container = DOM.get(container);
                }

                if (!container) {
                    container = elem.ownerDocument;
                }

                if (auto !== true) {
                    hscroll = hscroll === undefined ? true : !!hscroll;
                    top = top === undefined ? true : !!top;
                }

                // document 归一化到 window
                if (container.nodeType == NodeType.DOCUMENT_NODE) {
                    container = getWin(container);
                }

                var isWin = !!getWin(container),
                    elemOffset = DOM.offset(elem),
                    eh = DOM.outerHeight(elem),
                    ew = DOM.outerWidth(elem),
                    containerOffset,
                    ch,
                    cw,
                    containerScroll,
                    diffTop,
                    diffBottom,
                    win,
                    winScroll,
                    ww,
                    wh;

                if (isWin) {
                    win = container;
                    wh = DOM.height(win);
                    ww = DOM.width(win);
                    winScroll = {
                        left: DOM.scrollLeft(win),
                        top: DOM.scrollTop(win)
                    };
                    // elem 相对 container 可视视窗的距离
                    diffTop = {
                        left: elemOffset[LEFT] - winScroll[LEFT],
                        top: elemOffset[TOP] - winScroll[TOP]
                    };
                    diffBottom = {
                        left: elemOffset[LEFT] + ew - (winScroll[LEFT] + ww),
                        top: elemOffset[TOP] + eh - (winScroll[TOP] + wh)
                    };
                    containerScroll = winScroll;
                }
                else {
                    containerOffset = DOM.offset(container);
                    ch = container.clientHeight;
                    cw = container.clientWidth;
                    containerScroll = {
                        left: DOM.scrollLeft(container),
                        top: DOM.scrollTop(container)
                    };
                    // elem 相对 container 可视视窗的距离
                    // 注意边框 , offset 是边框到根节点
                    diffTop = {
                        left: elemOffset[LEFT] - containerOffset[LEFT] -
                            (myParseInt(DOM.css(container, 'borderLeftWidth')) || 0),
                        top: elemOffset[TOP] - containerOffset[TOP] -
                            (myParseInt(DOM.css(container, 'borderTopWidth')) || 0)
                    };
                    diffBottom = {
                        left: elemOffset[LEFT] + ew -
                            (containerOffset[LEFT] + cw +
                                (myParseInt(DOM.css(container, 'borderRightWidth')) || 0)),
                        top: elemOffset[TOP] + eh -
                            (containerOffset[TOP] + ch +
                                (myParseInt(DOM.css(container, 'borderBottomWidth')) || 0))
                    };
                }

                if (diffTop.top < 0 || diffBottom.top > 0) {
                    // 强制向上
                    if (top === true) {
                        DOM.scrollTop(container, containerScroll.top + diffTop.top);
                    } else if (top === false) {
                        DOM.scrollTop(container, containerScroll.top + diffBottom.top);
                    } else {
                        // 自动调整
                        if (diffTop.top < 0) {
                            DOM.scrollTop(container, containerScroll.top + diffTop.top);
                        } else {
                            DOM.scrollTop(container, containerScroll.top + diffBottom.top);
                        }
                    }
                }

                if (hscroll) {
                    if (diffTop.left < 0 || diffBottom.left > 0) {
                        // 强制向上
                        if (top === true) {
                            DOM.scrollLeft(container, containerScroll.left + diffTop.left);
                        } else if (top === false) {
                            DOM.scrollLeft(container, containerScroll.left + diffBottom.left);
                        } else {
                            // 自动调整
                            if (diffTop.left < 0) {
                                DOM.scrollLeft(container, containerScroll.left + diffTop.left);
                            } else {
                                DOM.scrollLeft(container, containerScroll.left + diffBottom.left);
                            }
                        }
                    }
                }
            },
            /**
             * Get the width of document
             * @param {window} [win=window] Window to be referred.
             * @method
             */
            docWidth: 0,
            /**
             * Get the height of document
             * @param {window} [win=window] Window to be referred.
             * @method
             */
            docHeight: 0,
            /**
             * Get the height of window
             * @param {window} [win=window] Window to be referred.
             * @method
             */
            viewportHeight: 0,
            /**
             * Get the width of document
             * @param {window} [win=window] Window to be referred.
             * @method
             */
            viewportWidth: 0,
            /**
             * Get the current vertical position of the scroll bar for the first element in the set of matched elements.
             * or
             * Set the current vertical position of the scroll bar for each of the set of matched elements.
             * @param {HTMLElement[]|String|HTMLElement|window} selector matched elements
             * @param {Number} value An integer indicating the new position to set the scroll bar to.
             * @method
             */
            scrollTop: 0,
            /**
             * Get the current horizontal position of the scroll bar for the first element in the set of matched elements.
             * or
             * Set the current horizontal position of the scroll bar for each of the set of matched elements.
             * @param {HTMLElement[]|String|HTMLElement|window} selector matched elements
             * @param {Number} value An integer indicating the new position to set the scroll bar to.
             * @method
             */
            scrollLeft: 0
        });

    // http://old.jr.pl/www.quirksmode.org/viewport/compatibility.html
    // http://www.quirksmode.org/dom/w3c_cssom.html
    // add ScrollLeft/ScrollTop getter/setter methods
    S.each(['Left', 'Top'], function (name, i) {
        var method = SCROLL + name;

        DOM[method] = function (elem, v) {
            if (isNumber(elem)) {
                return arguments.callee(win, elem);
            }
            elem = DOM.get(elem);
            var ret,
                w = getWin(elem),
                d;
            if (w) {
                if (v !== undefined) {
                    v = parseFloat(v);
                    // 注意多 window 情况，不能简单取 win
                    var left = name == 'Left' ? v : DOM.scrollLeft(w),
                        top = name == 'Top' ? v : DOM.scrollTop(w);
                    w['scrollTo'](left, top);
                } else {
                    //标准
                    //chrome == body.scrollTop
                    //firefox/ie9 == documentElement.scrollTop
                    ret = w[ 'page' + (i ? 'Y' : 'X') + 'Offset'];
                    if (!isNumber(ret)) {
                        d = w[DOCUMENT];
                        //ie6,7,8 standard mode
                        ret = d[DOC_ELEMENT][method];
                        if (!isNumber(ret)) {
                            //quirks mode
                            ret = d[BODY][method];
                        }
                    }
                }
            } else if (elem.nodeType == NodeType.ELEMENT_NODE) {
                if (v !== undefined) {
                    elem[method] = parseFloat(v)
                } else {
                    ret = elem[method];
                }
            }
            return ret;
        }
    });

    // add docWidth/Height, viewportWidth/Height getter methods
    S.each(['Width', 'Height'], function (name) {
        DOM['doc' + name] = function (refWin) {
            refWin = DOM.get(refWin);
            var w = getWin(refWin),
                d = w[DOCUMENT];
            return MAX(
                //firefox chrome documentElement.scrollHeight< body.scrollHeight
                //ie standard mode : documentElement.scrollHeight> body.scrollHeight
                d[DOC_ELEMENT][SCROLL + name],
                //quirks : documentElement.scrollHeight 最大等于可视窗口多一点？
                d[BODY][SCROLL + name],
                DOM[VIEWPORT + name](d));
        };

        DOM[VIEWPORT + name] = function (refWin) {
            refWin = DOM.get(refWin);
            var prop = CLIENT + name,
                win = getWin(refWin),
                doc = win[DOCUMENT],
                body = doc[BODY],
                documentElement = doc[DOC_ELEMENT],
                documentElementProp = documentElement[prop];
            // 标准模式取 documentElement
            // backcompat 取 body
            return doc[compatMode] === CSS1Compat
                && documentElementProp ||
                body && body[ prop ] || documentElementProp;
        }
    });

    function getClientPosition(elem) {
        var box, x , y ,
            doc = elem.ownerDocument,
            body = doc.body;

        // 根据 GBS 最新数据，A-Grade Browsers 都已支持 getBoundingClientRect 方法，不用再考虑传统的实现方式
        box = elem.getBoundingClientRect();

        // 注：jQuery 还考虑减去 docElem.clientLeft/clientTop
        // 但测试发现，这样反而会导致当 html 和 body 有边距/边框样式时，获取的值不正确
        // 此外，ie6 会忽略 html 的 margin 值，幸运地是没有谁会去设置 html 的 margin

        x = box[LEFT];
        y = box[TOP];

        // In IE, most of the time, 2 extra pixels are added to the top and left
        // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
        // IE6 standards mode, this border can be overridden by setting the
        // document element's border to zero -- thus, we cannot rely on the
        // offset always being 2 pixels.

        // In quirks mode, the offset can be determined by querying the body's
        // clientLeft/clientTop, but in standards mode, it is found by querying
        // the document element's clientLeft/clientTop.  Since we already called
        // getClientBoundingRect we have already forced a reflow, so it is not
        // too expensive just to query them all.

        // ie 下应该减去窗口的边框吧，毕竟默认 absolute 都是相对窗口定位的
        // 窗口边框标准是设 documentElement ,quirks 时设置 body
        // 最好禁止在 body 和 html 上边框 ，但 ie < 9 html 默认有 2px ，减去
        // 但是非 ie 不可能设置窗口边框，body html 也不是窗口 ,ie 可以通过 html,body 设置
        // 标准 ie 下 docElem.clientTop 就是 border-top
        // ie7 html 即窗口边框改变不了。永远为 2
        // 但标准 firefox/chrome/ie9 下 docElem.clientTop 是窗口边框，即使设了 border-top 也为 0

        x -= docElem.clientLeft || body.clientLeft || 0;
        y -= docElem.clientTop || body.clientTop || 0;

        return { left: x, top: y };
    }


    function getPageOffset(el) {
        var pos = getClientPosition(el);
        var w = getWin(el[OWNER_DOCUMENT]);
        pos.left += DOM[SCROLL_LEFT](w);
        pos.top += DOM[SCROLL_TOP](w);
        return pos;
    }

    // 获取 elem 相对 elem.ownerDocument 的坐标
    function getOffset(el, relativeWin) {
        var position = {left: 0, top: 0};

        // Iterate up the ancestor frame chain, keeping track of the current window
        // and the current element in that window.
        var currentWin = getWin(el[OWNER_DOCUMENT]);
        var currentEl = el;
        relativeWin = relativeWin || currentWin;
        do {
            // if we're at the top window, we want to get the page offset.
            // if we're at an inner frame, we only want to get the window position
            // so that we can determine the actual page offset in the context of
            // the outer window.
            var offset = currentWin == relativeWin ?
                getPageOffset(currentEl) :
                getClientPosition(currentEl);
            position.left += offset.left;
            position.top += offset.top;
        } while (currentWin && currentWin != relativeWin &&
            (currentEl = currentWin['frameElement']) &&
            (currentWin = currentWin.parent));

        return position;
    }

    // 设置 elem 相对 elem.ownerDocument 的坐标
    function setOffset(elem, offset) {
        // set position first, in-case top/left are set even on static elem
        if (DOM.css(elem, POSITION) === 'static') {
            elem.style[POSITION] = RELATIVE;
        }
        var old = getOffset(elem), ret = { }, current, key;

        for (key in offset) {
            if (offset.hasOwnProperty(key)) {
                current = myParseInt(DOM.css(elem, key), 10) || 0;
                ret[key] = current + offset[key] - old[key];
            }
        }
        DOM.css(elem, ret);
    }

    return DOM;
}, {
    requires: ['./base', 'ua']
});

/*
 2012-03-30
 - refer: http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html
 - http://help.dottoro.com/ljkfqbqj.php
 - http://www.boutell.com/newfaq/creating/sizeofclientarea.html

 2011-05-24
 - 承玉：
 - 调整 docWidth , docHeight ,
 viewportHeight , viewportWidth ,scrollLeft,scrollTop 参数，
 便于放置到 Node 中去，可以完全摆脱 DOM，完全使用 Node


 TODO:
 - 考虑是否实现 jQuery 的 position, offsetParent 等功能
 - 更详细的测试用例（比如：测试 position 为 fixed 的情况）
 */
/**
 * @ignore
 * @fileOverview selector
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/selector', function (S, DOM, undefined) {

    var doc = S.Env.host.document,
        NodeType = DOM.NodeType,
        filter = S.filter,
        require = function (selector) {
            return S.require(selector);
        },
        isArray = S.isArray,
        isString = S.isString,
        makeArray = S.makeArray,
        isNodeList = DOM._isNodeList,
        getNodeName = DOM.nodeName,
        push = Array.prototype.push,
        SPACE = ' ',
        COMMA = ',',
        trim = S.trim,
        ANY = '*',
        REG_ID = /^#[\w-]+$/,
        REG_QUERY = /^(?:#([\w-]+))?\s*([\w-]+|\*)?\.?([\w-]+)?$/;

    function query_each(f) {
        var self = this, el, i;
        for (i = 0; i < self.length; i++) {
            el = self[i];
            if (f(el, i) === false) {
                break;
            }
        }
    }

    /*
     Accepts a string containing a CSS selector which is then used to match a set of elements.
     @param {String|HTMLElement[]} selector
     A string containing a selector expression.
     or
     array of HTMLElements.
     @param {String|HTMLElement[]|HTMLDocument} [context] context under which to find elements matching selector.
     @return {HTMLElement[]} The array of found HTMLElements
     */
    function query(selector, context) {
        var ret,
            i,
            simpleContext,
            isSelectorString = isString(selector),
        // optimize common usage
            contexts = (context === undefined && (simpleContext = 1)) ?
                [doc] :
                tuneContext(context);
        // 常见的空
        if (!selector) {
            ret = [];
        }
        // 常见的选择器
        // DOM.query('#x')
        else if (isSelectorString) {
            selector = trim(selector);
            // shortcut
            if (simpleContext && selector == 'body') {
                ret = [doc.body]
            } else if (contexts.length == 1 && selector) {
                ret = quickFindBySelectorStr(selector, contexts[0]);
            }
        }
        // 不写 context，就是包装一下
        else if (simpleContext) {
            // 1.常见的单个元素
            // DOM.query(document.getElementById('xx'))
            if (selector['nodeType'] || selector['setTimeout']) {
                ret = [selector];
            }
            // 2.KISSY NodeList 特殊点直接返回，提高性能
            else if (selector['getDOMNodes']) {
                return selector;
            }
            // 3.常见的数组
            // var x=DOM.query('.l');
            // DOM.css(x,'color','red');
            else if (isArray(selector)) {
                ret = selector;
            }
            // 4.selector.item
            // DOM.query(document.getElementsByTagName('a'))
            // note:
            // document.createElement('select').item 已经在 1 处理了
            // S.all().item 已经在 2 处理了
            else if (isNodeList(selector)) {
                ret = S.makeArray(selector);
            } else {
                ret = [ selector ];
            }
        }

        if (!ret) {
            ret = [];
            if (selector) {
                for (i = 0; i < contexts.length; i++) {
                    push.apply(ret, queryByContexts(selector, contexts[i]));
                }
                //必要时去重排序
                if (ret.length > 1 &&
                    // multiple contexts
                    (contexts.length > 1 ||
                        (isSelectorString &&
                            // multiple selector
                            selector.indexOf(COMMA) > -1))) {
                    unique(ret);
                }
            }
        }

        // attach each method
        ret.each = query_each;

        return ret;
    }

    function queryByContexts(selector, context) {
        var ret = [],
            isSelectorString = isString(selector);
        if (isSelectorString && selector.match(REG_QUERY) ||
            !isSelectorString) {
            // 简单选择器自己处理
            ret = queryBySimple(selector, context);
        }
        // 如果选择器有 , 分开递归一部分一部分来
        else if (isSelectorString && selector.indexOf(COMMA) > -1) {
            ret = queryBySelectors(selector, context);
        }
        else {
            // 复杂了，交给 sizzle
            ret = queryBySizzle(selector, context);
        }
        return ret;
    }

    // 交给 sizzle 模块处理
    function queryBySizzle(selector, context) {
        var ret = [],
            sizzle = require('sizzle');
        if (sizzle) {
            sizzle(selector, context, ret);
        } else {
            // 原生不支持
            error(selector);
        }
        return ret;
    }

    // 处理 selector 的每个部分
    function queryBySelectors(selector, context) {
        var ret = [],
            i,
            selectors = selector.split(/\s*,\s*/);
        for (i = 0; i < selectors.length; i++) {
            push.apply(ret, queryByContexts(selectors[i], context));
        }
        // 多部分选择器可能得到重复结果
        return ret;
    }

    function quickFindBySelectorStr(selector, context) {
        var ret, t, match, id, tag, cls;
        // selector 为 #id 是最常见的情况，特殊优化处理
        if (REG_ID.test(selector)) {
            t = getElementById(selector.slice(1), context);
            if (t) {
                // #id 无效时，返回空数组
                ret = [t];
            } else {
                ret = [];
            }
        }
        // selector 为支持列表中的其它 6 种
        else {
            match = REG_QUERY.exec(selector);
            if (match) {
                // 获取匹配出的信息
                id = match[1];
                tag = match[2];
                cls = match[3];
                // 空白前只能有 id ，取出来作为 context
                context = (id ? getElementById(id, context) : context);
                if (context) {
                    // #id .cls | #id tag.cls | .cls | tag.cls | #id.cls
                    if (cls) {
                        if (!id || selector.indexOf(SPACE) != -1) { // 排除 #id.cls
                            ret = [].concat(getElementsByClassName(cls, tag, context));
                        }
                        // 处理 #id.cls
                        else {
                            t = getElementById(id, context);
                            if (t && hasClass(t, cls)) {
                                ret = [t];
                            }
                        }
                    }
                    // #id tag | tag
                    else if (tag) { // 排除空白字符串
                        ret = getElementsByTagName(tag, context);
                    }
                }
                ret = ret || [];
            }
        }
        return ret;
    }

    // 最简单情况了，单个选择器部分，单个上下文
    function queryBySimple(selector, context) {
        var ret,
            isSelectorString = isString(selector);
        if (isSelectorString) {
            ret = quickFindBySelectorStr(selector, context) || [];
        }
        // 传入的 selector 是 NodeList 或已是 Array
        else if (isArray(selector) || isNodeList(selector)) {
            // 只能包含在 context 里面
            // filter 会转换为 nodelist 为数组
            ret = filter(selector, function (s) {
                return testByContext(s, context);
            });
        }
        // 传入的 selector 是 HTMLNode 查看约束
        // 否则 window/document，原样返回
        else if (testByContext(selector, context)) {
            ret = [selector];
        }
        return ret;
    }

    function testByContext(element, context) {
        if (!element) {
            return false;
        }
        // 防止 element 节点还没添加到 document ，但是也可以获取到 query(element) => [element]
        // document 的上下文一律放行
        // context == doc 意味着没有提供第二个参数，到这里只是想单纯包装原生节点，则不检测
        if (context == doc) {
            return true;
        }
        // 节点受上下文约束
        return DOM.contains(context, element);
    }

    var unique = S.noop;
    (function () {
        var sortOrder,
            hasDuplicate,
            baseHasDuplicate = true;

        // Here we check if the JavaScript engine is using some sort of
        // optimization where it does not always call our comparision
        // function. If that is the case, discard the hasDuplicate value.
        // Thus far that includes Google Chrome.
        [0, 0].sort(function () {
            baseHasDuplicate = false;
            return 0;
        });

        // 排序去重
        unique = function (elements) {
            if (sortOrder) {
                hasDuplicate = baseHasDuplicate;
                elements.sort(sortOrder);

                if (hasDuplicate) {
                    var i = 1, len = elements.length;
                    while (i < len) {
                        if (elements[i] === elements[ i - 1 ]) {
                            elements.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                }
            }
            return elements;
        };

        // 貌似除了 ie 都有了...
        if (doc.documentElement.compareDocumentPosition) {
            sortOrder = function (a, b) {
                if (a == b) {
                    hasDuplicate = true;
                    return 0;
                }

                if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
                    return a.compareDocumentPosition ? -1 : 1;
                }

                return a.compareDocumentPosition(b) & 4 ? -1 : 1;
            };

        } else {
            sortOrder = function (a, b) {
                // The nodes are identical, we can exit early
                if (a == b) {
                    hasDuplicate = true;
                    return 0;
                    // Fallback to using sourceIndex (in IE) if it's available on both nodes
                } else if (a.sourceIndex && b.sourceIndex) {
                    return a.sourceIndex - b.sourceIndex;
                }
            };
        }
    })();


    // 调整 context 为合理值
    function tuneContext(context) {
        return query(context, undefined);
    }

    // query #id
    function getElementById(id, context) {
        var doc = context,
            el;
        if (context.nodeType !== NodeType.DOCUMENT_NODE) {
            doc = context.ownerDocument;
        }
        el = doc.getElementById(id);
        if (el && el.id === id) {
            // optimize for common usage
        }
        else if (el && el.parentNode) {
            // ie opera confuse name with id
            // https://github.com/kissyteam/kissy/issues/67
            // 不能直接 el.id ，否则 input shadow form attribute
            if (!idEq(el, id)) {
                // 直接在 context 下的所有节点找
                el = DOM.filter(ANY, '#' + id, context)[0] || null;
            }
            // ie 特殊情况下以及指明在 context 下找了，不需要再判断
            // 如果指定了 context node , 还要判断 id 是否处于 context 内
            else if (!testByContext(el, context)) {
                el = null;
            }
        } else {
            el = null;
        }
        return el;
    }

    // query tag
    function getElementsByTagName(tag, context) {
        return context && makeArray(context.getElementsByTagName(tag)) || [];
    }

    (function () {
        // Check to see if the browser returns only elements
        // when doing getElementsByTagName('*')

        // Create a fake element
        var div = doc.createElement('div');
        div.appendChild(doc.createComment(''));

        // Make sure no comments are found
        if (div.getElementsByTagName(ANY).length > 0) {
            getElementsByTagName = function (tag, context) {
                var ret = makeArray(context.getElementsByTagName(tag));
                if (tag === ANY) {
                    var t = [], i = 0, node;
                    while ((node = ret[i++])) {
                        // Filter out possible comments
                        if (node.nodeType === 1) {
                            t.push(node);
                        }
                    }
                    ret = t;
                }
                return ret;
            };
        }
    })();

    // query .cls
    var getElementsByClassName = doc.getElementsByClassName ? function (cls, tag, context) {
        // query('#id1 xx','#id2')
        // #id2 内没有 #id1 , context 为 null , 这里防御下
        if (!context) {
            return [];
        }
        var els = context.getElementsByClassName(cls),
            ret,
            i = 0,
            len = els.length,
            el;

        if (tag && tag !== ANY) {
            tag = tag.toLowerCase();
            ret = [];
            for (; i < len; ++i) {
                el = els[i];
                if (getNodeName(el) == tag) {
                    ret.push(el);
                }
            }
        } else {
            ret = makeArray(els);
        }
        return ret;
    } : ( doc.querySelectorAll ? function (cls, tag, context) {
        // ie8 return staticNodeList 对象,[].concat 会形成 [ staticNodeList ] ，手动转化为普通数组
        return context && makeArray(context.querySelectorAll((tag ? tag : '') + '.' + cls)) || [];
    } : function (cls, tag, context) {
        if (!context) {
            return [];
        }
        var els = context.getElementsByTagName(tag || ANY),
            ret = [],
            i = 0,
            len = els.length,
            el;
        for (; i < len; ++i) {
            el = els[i];
            if (hasClass(el, cls)) {
                ret.push(el);
            }
        }
        return ret;
    });

    function hasClass(el, cls) {
        var className;
        return (className = el.className) && (' ' + className + ' ').indexOf(' ' + cls + ' ') !== -1;
    }

    // throw exception
    function error(msg) {
        S.error('Unsupported selector: ' + msg);
    }

    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {

            /**
             * Accepts a string containing a CSS selector which is then used to match a set of elements.
             * @param {String|HTMLElement[]} selector
             * A string containing a selector expression.
             * or
             * array of HTMLElements.
             * @param {String|HTMLElement[]|HTMLDocument|HTMLElement} [context] context under which to find elements matching selector.
             * @return {HTMLElement[]} The array of found HTMLElements
             * @method
             */
            query: query,

            /**
             * Accepts a string containing a CSS selector which is then used to match a set of elements.
             * @param {String|HTMLElement[]} selector
             * A string containing a selector expression.
             * or
             * array of HTMLElements.
             * @param {String|HTMLElement[]|HTMLDocument|HTMLElement|window} [context] context under which to find elements matching selector.
             * @return {HTMLElement} The first of found HTMLElements
             */
            get: function (selector, context) {
                return query(selector, context)[0] || null;
            },

            /**
             * Sorts an array of DOM elements, in place, with the duplicates removed.
             * Note that this only works on arrays of DOM elements, not strings or numbers.
             * @param {HTMLElement[]} The Array of DOM elements.
             * @method
             * @return {HTMLElement[]}
             * @member KISSY.DOM
             */
            unique: unique,

            /**
             * Reduce the set of matched elements to those that match the selector or pass the function's test.
             * @param {String|HTMLElement[]} selector Matched elements
             * @param {String|Function} filter Selector string or filter function
             * @param {String|HTMLElement[]|HTMLDocument} [context] Context under which to find matched elements
             * @return {HTMLElement[]}
             * @memeber DOM
             */
            filter: function (selector, filter, context) {
                var elems = query(selector, context),
                    sizzle = require('sizzle'),
                    match,
                    tag,
                    id,
                    cls,
                    ret = [];

                // 默认仅支持最简单的 tag.cls 或 #id 形式
                if (isString(filter) &&
                    (filter = trim(filter)) &&
                    (match = REG_QUERY.exec(filter))) {
                    id = match[1];
                    tag = match[2];
                    cls = match[3];
                    if (!id) {
                        filter = function (elem) {
                            var tagRe = true, clsRe = true;

                            // 指定 tag 才进行判断
                            if (tag) {
                                tagRe = getNodeName(elem) == tag.toLowerCase();
                            }

                            // 指定 cls 才进行判断
                            if (cls) {
                                clsRe = hasClass(elem, cls);
                            }

                            return clsRe && tagRe;
                        }
                    } else if (id && !tag && !cls) {
                        filter = function (elem) {
                            return idEq(elem, id);
                        };
                    }
                }

                if (S.isFunction(filter)) {
                    ret = S.filter(elems, filter);
                }
                // 其它复杂 filter, 采用外部选择器
                else if (filter && sizzle) {
                    ret = sizzle.matches(filter, elems);
                }
                // filter 为空或不支持的 selector
                else {
                    error(filter);
                }

                return ret;
            },

            /**
             * Returns true if the matched element(s) pass the filter test
             * @param {String|HTMLElement[]} selector Matched elements
             * @param {String|Function} filter Selector string or filter function
             * @param {String|HTMLElement[]|HTMLDocument} [context] Context under which to find matched elements
             * @return {Boolean}
             */
            test: function (selector, filter, context) {
                var elements = query(selector, context);
                return elements.length && (DOM.filter(elements, filter, context).length === elements.length);
            }
        });


    function idEq(elem, id) {
        // form !
        var idNode = elem.getAttributeNode('id');
        return idNode && idNode.nodeValue === id;
    }

    return DOM;
}, {
    requires: ['./base']
});

/*
 NOTES:

 2011.08.02
 - 利用 sizzle 重构选择器
 - 1.1.6 修正，原来 context 只支持 #id 以及 document
 1.2 context 支持任意，和 selector 格式一致
 - 简单选择器也和 jquery 保持一致 DOM.query('xx','yy') 支持
 - context 不提供则为当前 document ，否则通过 query 递归取得
 - 保证选择出来的节点（除了 document window）都是位于 context 范围内


 2010.01
 - 对 reg exec 的结果(id, tag, className)做 cache, 发现对性能影响很小，去掉。
 - getElementById 使用频率最高，使用直达通道优化。
 - getElementsByClassName 性能优于 querySelectorAll, 但 IE 系列不支持。
 - instanceof 对性能有影响。
 - 内部方法的参数，比如 cls, context 等的异常情况，已经在 query 方法中有保证，无需冗余“防卫”。
 - query 方法中的条件判断考虑了“频率优先”原则。最有可能出现的情况放在前面。
 - Array 的 push 方法可以用 j++ 来替代，性能有提升。
 - 返回值策略和 Sizzle 一致，正常时，返回数组；其它所有情况，返回空数组。

 - 从压缩角度考虑，还可以将 getElmentsByTagName 和 getElementsByClassName 定义为常量，
 不过感觉这样做太“压缩控”，还是保留不替换的好。

 - 调整 getElementsByClassName 的降级写法，性能最差的放最后。

 2010.02
 - 添加对分组选择器的支持（主要参考 Sizzle 的代码，代去除了对非 Grade A 级浏览器的支持）

 2010.03
 - 基于原生 dom 的两个 api: S.query 返回数组; S.get 返回第一个。
 基于 Node 的 api: S.one, 在 Node 中实现。
 基于 NodeList 的 api: S.all, 在 NodeList 中实现。
 通过 api 的分层，同时满足初级用户和高级用户的需求。

 2010.05
 - 去掉给 S.query 返回值默认添加的 each 方法，保持纯净。
 - 对于不支持的 selector, 采用外部耦合进来的 Selector.

 2010.06
 - 增加 filter 和 test 方法

 2010.07
 - 取消对 , 分组的支持，group 直接用 Sizzle

 2010.08
 - 给 S.query 的结果 attach each 方法

 2011.05
 - 承玉：恢复对简单分组支持

 Ref: http://ejohn.org/blog/selectors-that-people-actually-use/
 考虑 2/8 原则，仅支持以下选择器：
 #id
 tag
 .cls
 #id tag
 #id .cls
 tag.cls
 #id tag.cls
 注 1：REG_QUERY 还会匹配 #id.cls
 注 2：tag 可以为 * 字符
 注 3: 支持 , 号分组


 Bugs:
 - S.query('#test-data *') 等带 * 号的选择器，在 IE6 下返回的值不对。jQuery 等类库也有此 bug, 诡异。

 References:
 - http://ejohn.org/blog/selectors-that-people-actually-use/
 - http://ejohn.org/blog/thoughts-on-queryselectorall/
 - MDC: querySelector, querySelectorAll, getElementsByClassName
 - Sizzle: http://github.com/jeresig/sizzle
 - MINI: http://james.padolsey.com/javascript/mini/
 - Peppy: http://jamesdonaghue.com/?p=40
 - Sly: http://github.com/digitarald/sly
 - XPath, TreeWalker：http://www.cnblogs.com/rubylouvre/archive/2009/07/24/1529640.html

 - http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
 - http://www.quirksmode.org/dom/getElementsByTagNames.html
 - http://ejohn.org/blog/comparing-document-position/
 - http://github.com/jeresig/sizzle/blob/master/sizzle.js
 */
/**
 * @ignore
 * @fileOverview style for ie
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/style-ie', function (S, DOM, UA, Style) {

    var HUNDRED = 100;

    // only for ie
    if (!UA['ie']) {
        return DOM;
    }

    var doc = S.Env.host.document,
        docElem = doc.documentElement,
        OPACITY = 'opacity',
        STYLE = 'style',
        FILTER = 'filter',
        CURRENT_STYLE = 'currentStyle',
        RUNTIME_STYLE = 'runtimeStyle',
        LEFT = 'left',
        PX = 'px',
        CUSTOM_STYLES = Style._CUSTOM_STYLES,
        RE_NUM_PX = /^-?\d+(?:px)?$/i,
        RE_NUM = /^-?\d/,
        backgroundPosition = 'backgroundPosition',
        R_OPACITY = /opacity=([^)]*)/,
        R_ALPHA = /alpha\([^)]*\)/i;

    // odd backgroundPosition
    CUSTOM_STYLES[backgroundPosition] = {
        get: function (elem, computed) {
            if (computed) {
                return elem[CURRENT_STYLE][backgroundPosition + 'X'] +
                    ' ' +
                    elem[CURRENT_STYLE][backgroundPosition + 'Y'];
            } else {
                return elem[STYLE][backgroundPosition];
            }
        }
    };

    // use alpha filter for IE opacity
    try {
        if (docElem.style[OPACITY] == null) {

            CUSTOM_STYLES[OPACITY] = {

                get: function (elem, computed) {
                    // 没有设置过 opacity 时会报错，这时返回 1 即可
                    // 如果该节点没有添加到 dom ，取不到 filters 结构
                    // val = elem[FILTERS]['DXImageTransform.Microsoft.Alpha'][OPACITY];
                    return R_OPACITY.test((
                        computed && elem[CURRENT_STYLE] ?
                            elem[CURRENT_STYLE][FILTER] :
                            elem[STYLE][FILTER]) || '') ?
                        ( parseFloat(RegExp.$1) / HUNDRED ) + '' :
                        computed ? '1' : '';
                },

                set: function (elem, val) {
                    val = parseFloat(val);

                    var style = elem[STYLE],
                        currentStyle = elem[CURRENT_STYLE],
                        opacity = isNaN(val) ? '' : 'alpha(' + OPACITY + '=' + val * HUNDRED + ')',
                        filter = S.trim(currentStyle && currentStyle[FILTER] || style[FILTER] || '');

                    // ie  has layout
                    style.zoom = 1;

                    // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute
                    if (val >= 1 && S.trim(filter.replace(R_ALPHA, '')) === '') {

                        // Setting style.filter to null, '' & ' ' still leave 'filter:' in the cssText
                        // if 'filter:' is present at all, clearType is disabled, we want to avoid this
                        // style.removeAttribute is IE Only, but so apparently is this code path...
                        style.removeAttribute(FILTER);

                        // if there is no filter style applied in a css rule, we are done
                        if (currentStyle && !currentStyle[FILTER]) {
                            return;
                        }
                    }

                    // otherwise, set new filter values
                    // 如果 >=1 就不设，就不能覆盖外部样式表定义的样式，一定要设
                    style.filter = R_ALPHA.test(filter) ?
                        filter.replace(R_ALPHA, opacity) :
                        filter + (filter ? ', ' : '') + opacity;
                }
            };
        }
    }
    catch (ex) {
        S.log('IE filters ActiveX is disabled. ex = ' + ex);
    }

    /*
     border fix
     ie 不设置数值，则 computed style 不返回数值，只返回 thick? medium ...
     (default is 'medium')
     */
    var IE8 = UA['ie'] == 8,
        BORDER_MAP = {
        },
        BORDERS = ['', 'Top', 'Left', 'Right', 'Bottom'];
    BORDER_MAP['thin'] = IE8 ? '1px' : '2px';
    BORDER_MAP['medium'] = IE8 ? '3px' : '4px';
    BORDER_MAP['thick'] = IE8 ? '5px' : '6px';

    S.each(BORDERS, function (b) {
        var name = 'border' + b + 'Width',
            styleName = 'border' + b + 'Style';

        CUSTOM_STYLES[name] = {
            get: function (elem, computed) {
                // 只有需要计算样式的时候才转换，否则取原值
                var currentStyle = computed ? elem[CURRENT_STYLE] : 0,
                    current = currentStyle && String(currentStyle[name]) || undefined;
                // look up keywords if a border exists
                if (current && current.indexOf('px') < 0) {
                    // 边框没有隐藏
                    if (BORDER_MAP[current] && currentStyle[styleName] !== 'none') {
                        current = BORDER_MAP[current];
                    } else {
                        // otherwise no border
                        current = 0;
                    }
                }
                return current;
            }
        };
    });

    // getComputedStyle for IE
    if (!(doc.defaultView || { }).getComputedStyle && docElem[CURRENT_STYLE]) {

        DOM._getComputedStyle = function (elem, name) {
            name = DOM._cssProps[name] || name;
            // currentStyle maybe null
            // http://msdn.microsoft.com/en-us/library/ms535231.aspx
            var ret = elem[CURRENT_STYLE] && elem[CURRENT_STYLE][name];

            // 当 width/height 设置为百分比时，通过 pixelLeft 方式转换的 width/height 值
            // 一开始就处理了! CUSTOM_STYLE['height'],CUSTOM_STYLE['width'] ,cssHook 解决@2011-08-19
            // 在 ie 下不对，需要直接用 offset 方式
            // borderWidth 等值也有问题，但考虑到 borderWidth 设为百分比的概率很小，这里就不考虑了

            // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            if ((!RE_NUM_PX.test(ret) &&
                RE_NUM.test(ret)) &&
                // '0px 0px'
                ret.indexOf(' ') == -1) {
                // Remember the original values
                var style = elem[STYLE],
                    left = style[LEFT],
                    rsLeft = elem[RUNTIME_STYLE] && elem[RUNTIME_STYLE][LEFT];

                // Put in the new values to get a computed value out
                if (rsLeft) {
                    elem[RUNTIME_STYLE][LEFT] = elem[CURRENT_STYLE][LEFT];
                }
                style[LEFT] = name === 'fontSize' ? '1em' : (ret || 0);
                ret = style['pixelLeft'] + PX;

                // Revert the changed values
                style[LEFT] = left;
                if (rsLeft) {
                    elem[RUNTIME_STYLE][LEFT] = rsLeft;
                }
            }
            return ret === '' ? 'auto' : ret;
        };
    }
    return DOM;
}, {
    requires: ['./base', 'ua', './style']
});
/*
  NOTES:

  yiminghe@gmail.com: 2011.12.21 backgroundPosition in ie
   - currentStyle['backgroundPosition'] undefined
   - currentStyle['backgroundPositionX'] ok
   - currentStyle['backgroundPositionY'] ok


  yiminghe@gmail.com： 2011.05.19 opacity in ie
   - 如果节点是动态创建，设置opacity，没有加到 dom 前，取不到 opacity 值
   - 兼容：border-width 值，ie 下有可能返回 medium/thin/thick 等值，其它浏览器返回 px 值
   - opacity 的实现，参考自 jquery

 */
/**
 * @ignore
 * @fileOverview dom/style
 * @author yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add('dom/style', function (S, DOM, UA, undefined) {
    var WINDOW = S.Env.host,
        doc = WINDOW.document,
        docElem = doc.documentElement,
        isIE = UA['ie'],
        STYLE = 'style',
        FLOAT = 'float',
        CSS_FLOAT = 'cssFloat',
        STYLE_FLOAT = 'styleFloat',
        WIDTH = 'width',
        HEIGHT = 'height',
        AUTO = 'auto',
        DISPLAY = 'display',
        OLD_DISPLAY = DISPLAY + S.now(),
        NONE = 'none',
        myParseInt = parseInt,
        RE_NUM_PX = /^-?\d+(?:px)?$/i,
        cssNumber = {
            'fillOpacity': 1,
            'fontWeight': 1,
            'lineHeight': 1,
            'opacity': 1,
            'orphans': 1,
            'widows': 1,
            'zIndex': 1,
            'zoom': 1
        },
        rmsPrefix = /^-ms-/,
        RE_DASH = /-([a-z])/ig,
        CAMEL_CASE_FN = function (all, letter) {
            return letter.toUpperCase();
        },
    // 考虑 ie9 ...
        R_UPPER = /([A-Z]|^ms)/g,
        EMPTY = '',
        DEFAULT_UNIT = 'px',
        CUSTOM_STYLES = {},
        cssProps = {},
        defaultDisplay = {};

    // normalize reserved word float alternatives ('cssFloat' or 'styleFloat')
    if (docElem[STYLE][CSS_FLOAT] !== undefined) {
        cssProps[FLOAT] = CSS_FLOAT;
    }
    else if (docElem[STYLE][STYLE_FLOAT] !== undefined) {
        cssProps[FLOAT] = STYLE_FLOAT;
    }

    function camelCase(name) {
        // fix #92, ms!
        return name.replace(rmsPrefix, 'ms-').replace(RE_DASH, CAMEL_CASE_FN);
    }

    var defaultDisplayDetectIframe,
        defaultDisplayDetectIframeDoc;

    // modified from jquery : bullet-proof method of getting default display
    // fix domain problem in ie>6 , ie6 still access denied
    function getDefaultDisplay(tagName) {
        var body,
            elem;
        if (!defaultDisplay[ tagName ]) {
            body = doc.body || doc.documentElement;
            elem = doc.createElement(tagName);
            DOM.prepend(elem, body);
            var oldDisplay = DOM.css(elem, 'display');
            body.removeChild(elem);
            // If the simple way fails,
            // get element's real default display by attaching it to a temp iframe
            if (oldDisplay == 'none' || oldDisplay == '') {
                // No iframe to use yet, so create it
                if (!defaultDisplayDetectIframe) {
                    defaultDisplayDetectIframe = doc.createElement('iframe');

                    defaultDisplayDetectIframe.frameBorder =
                        defaultDisplayDetectIframe.width =
                            defaultDisplayDetectIframe.height = 0;

                    DOM.prepend(defaultDisplayDetectIframe, body);
                    var iframeSrc;
                    if (iframeSrc = DOM.getEmptyIframeSrc()) {
                        defaultDisplayDetectIframe.src = iframeSrc;
                    }
                } else {
                    DOM.prepend(defaultDisplayDetectIframe, body);
                }

                // Create a cacheable copy of the iframe document on first call.
                // IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
                // document to it; WebKit & Firefox won't allow reusing the iframe document.
                if (!defaultDisplayDetectIframeDoc || !defaultDisplayDetectIframe.createElement) {

                    try {
                        defaultDisplayDetectIframeDoc = defaultDisplayDetectIframe.contentWindow.document;
                        defaultDisplayDetectIframeDoc.write(( doc.compatMode === 'CSS1Compat' ? '<!doctype html>' : '' )
                            + '<html><head>' +
                            (UA['ie'] && DOM.isCustomDomain() ?
                                '<script>' +
                                    'document.' +
                                    'domain' +
                                    "= '" +
                                    doc.domain
                                    + "';</script>" : '')
                            +
                            '</head><body>');
                        defaultDisplayDetectIframeDoc.close();
                    } catch (e) {
                        // ie6 need a breath , such as alert(8) or setTimeout;
                        // 同时需要同步，所以无解，勉强返回
                        return 'block';
                    }
                }

                elem = defaultDisplayDetectIframeDoc.createElement(tagName);

                defaultDisplayDetectIframeDoc.body.appendChild(elem);

                oldDisplay = DOM.css(elem, 'display');

                body.removeChild(defaultDisplayDetectIframe);
            }

            // Store the correct default display
            defaultDisplay[ tagName ] = oldDisplay;
        }

        return defaultDisplay[ tagName ];
    }

    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {
            _camelCase: camelCase,
            // _cssNumber:cssNumber,
            _CUSTOM_STYLES: CUSTOM_STYLES,
            _cssProps: cssProps,
            _getComputedStyle: function (elem, name) {
                var val = '',
                    computedStyle,
                    d = elem.ownerDocument;

                name = name.replace(R_UPPER, '-$1').toLowerCase();

                // https://github.com/kissyteam/kissy/issues/61
                if (computedStyle = d.defaultView.getComputedStyle(elem, null)) {
                    val = computedStyle.getPropertyValue(name) || computedStyle[name];
                }

                // 还没有加入到 document，就取行内
                if (val == '' && !DOM.contains(d.documentElement, elem)) {
                    name = cssProps[name] || name;
                    val = elem[STYLE][name];
                }

                return val;
            },

            /**
             *  Get inline style property from the first element of matched elements
             *  or
             *  Set one or more CSS properties for the set of matched elements.
             *  @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             *  @param {String|Object} name A CSS property. or A map of property-value pairs to set.
             *  @param [val] A value to set for the property.
             *  @return {undefined|String}
             */
            style: function (selector, name, val) {
                var els = DOM.query(selector), elem = els[0], i;
                // supports hash
                if (S.isPlainObject(name)) {
                    for (var k in name) {
                        if (name.hasOwnProperty(k)) {
                            for (i = els.length - 1; i >= 0; i--) {
                                style(els[i], k, name[k]);
                            }
                        }
                    }
                    return undefined;
                }
                if (val === undefined) {
                    var ret = '';
                    if (elem) {
                        ret = style(elem, name, val);
                    }
                    return ret;
                } else {
                    for (i = els.length - 1; i >= 0; i--) {
                        style(els[i], name, val);
                    }
                }
                return undefined;
            },

            /**
             * Get the computed value of a style property for the first element in the set of matched elements.
             * or
             * Set one or more CSS properties for the set of matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector 选择器或节点或节点数组
             * @param {String|Object} name A CSS property. or A map of property-value pairs to set.
             * @param [val] A value to set for the property.
             * @return {undefined|String}
             */
            css: function (selector, name, val) {
                var els = DOM.query(selector),
                    elem = els[0],
                    i;
                // supports hash
                if (S.isPlainObject(name)) {
                    for (var k in name) {
                        if (name.hasOwnProperty(k)) {
                            for (i = els.length - 1; i >= 0; i--) {
                                style(els[i], k, name[k]);
                            }
                        }
                    }
                    return undefined;
                }

                name = camelCase(name);
                var hook = CUSTOM_STYLES[name];
                // getter
                if (val === undefined) {
                    // supports css selector/Node/NodeList
                    var ret = '';
                    if (elem) {
                        // If a hook was provided get the computed value from there
                        if (hook && 'get' in hook && (ret = hook.get(elem, true)) !== undefined) {
                        } else {
                            ret = DOM._getComputedStyle(elem, name);
                        }
                    }
                    return ret === undefined ? '' : ret;
                }
                // setter
                else {
                    for (i = els.length - 1; i >= 0; i--) {
                        style(els[i], name, val);
                    }
                }
                return undefined;
            },

            /**
             * Display the matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements.
             */
            show: function (selector) {
                var els = DOM.query(selector), elem, i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    elem[STYLE][DISPLAY] = DOM.data(elem, OLD_DISPLAY) || EMPTY;

                    // 可能元素还处于隐藏状态，比如 css 里设置了 display: none
                    if (DOM.css(elem, DISPLAY) === NONE) {
                        var tagName = elem.tagName.toLowerCase(),
                            old = getDefaultDisplay(tagName);
                        DOM.data(elem, OLD_DISPLAY, old);
                        elem[STYLE][DISPLAY] = old;
                    }
                }
            },

            /**
             * Hide the matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements.
             */
            hide: function (selector) {
                var els = DOM.query(selector), elem, i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    var style = elem[STYLE], old = style[DISPLAY];
                    if (old !== NONE) {
                        if (old) {
                            DOM.data(elem, OLD_DISPLAY, old);
                        }
                        style[DISPLAY] = NONE;
                    }
                }
            },

            /**
             * Display or hide the matched elements.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements.
             */
            toggle: function (selector) {
                var els = DOM.query(selector), elem, i;
                for (i = els.length - 1; i >= 0; i--) {
                    elem = els[i];
                    if (DOM.css(elem, DISPLAY) === NONE) {
                        DOM.show(elem);
                    } else {
                        DOM.hide(elem);
                    }
                }
            },

            /**
             * Creates a stylesheet from a text blob of rules.
             * These rules will be wrapped in a STYLE tag and appended to the HEAD of the document.
             * @param {window} [refWin=window] Window which will accept this stylesheet
             * @param {String} [cssText] The text containing the css rules
             * @param {String} [id] An id to add to the stylesheet for later removal
             */
            addStyleSheet: function (refWin, cssText, id) {
                refWin = refWin || WINDOW;
                if (S.isString(refWin)) {
                    id = cssText;
                    cssText = refWin;
                    refWin = WINDOW;
                }
                refWin = DOM.get(refWin);
                var win = DOM._getWin(refWin),
                    doc = win.document,
                    elem;

                if (id && (id = id.replace('#', EMPTY))) {
                    elem = DOM.get('#' + id, doc);
                }

                // 仅添加一次，不重复添加
                if (elem) {
                    return;
                }

                elem = DOM.create('<style>', { id: id }, doc);

                // 先添加到 DOM 树中，再给 cssText 赋值，否则 css hack 会失效
                DOM.get('head', doc).appendChild(elem);

                if (elem.styleSheet) { // IE
                    elem.styleSheet.cssText = cssText;
                } else { // W3C
                    elem.appendChild(doc.createTextNode(cssText));
                }
            },

            /**
             * Make matched elements unselectable
             * @param {HTMLElement[]|String|HTMLElement} selector  Matched elements.
             */
            unselectable: function (selector) {
                var _els = DOM.query(selector), elem, j;
                for (j = _els.length - 1; j >= 0; j--) {
                    elem = _els[j];
                    if (UA['gecko']) {
                        elem[STYLE]['MozUserSelect'] = 'none';
                    }
                    else if (UA['webkit']) {
                        elem[STYLE]['KhtmlUserSelect'] = 'none';
                    } else {
                        if (UA['ie'] || UA['opera']) {
                            var e, i = 0,
                                els = elem.getElementsByTagName('*');
                            elem.setAttribute('unselectable', 'on');
                            while (( e = els[ i++ ] )) {
                                switch (e.tagName.toLowerCase()) {
                                    case 'iframe' :
                                    case 'textarea' :
                                    case 'input' :
                                    case 'select' :
                                        /* Ignore the above tags */
                                        break;
                                    default :
                                        e.setAttribute('unselectable', 'on');
                                }
                            }
                        }
                    }
                }
            },

            /**
             * Get the current computed width for the first element in the set of matched elements, including padding but not border.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @return {Number}
             */
            innerWidth: 0,
            /**
             * Get the current computed height for the first element in the set of matched elements, including padding but not border.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @return {Number}
             */
            innerHeight: 0,
            /**
             *  Get the current computed width for the first element in the set of matched elements, including padding and border, and optionally margin.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {Boolean} [includeMargin] A Boolean indicating whether to include the element's margin in the calculation.
             * @return {Number}
             */
            outerWidth: 0,
            /**
             * Get the current computed height for the first element in the set of matched elements, including padding, border, and optionally margin.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {Boolean} [includeMargin] A Boolean indicating whether to include the element's margin in the calculation.
             * @return {Number}
             */
            outerHeight: 0,
            /**
             * Get the current computed width for the first element in the set of matched elements.
             * or
             * Set the CSS width of each element in the set of matched elements.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Number} [value]
             * An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
             * @return {Number|undefined}
             */
            width: 0,
            /**
             * Get the current computed height for the first element in the set of matched elements.
             * or
             * Set the CSS height of each element in the set of matched elements.
             * @method
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Number} [value]
             * An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
             * @return {Number|undefined}
             */
            height: 0
        });

    function capital(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    S.each([WIDTH, HEIGHT], function (name) {
        DOM['inner' + capital(name)] = function (selector) {
            var el = DOM.get(selector);
            return el && getWHIgnoreDisplay(el, name, 'padding');
        };

        DOM['outer' + capital(name)] = function (selector, includeMargin) {
            var el = DOM.get(selector);
            return el && getWHIgnoreDisplay(el, name, includeMargin ? 'margin' : 'border');
        };

        DOM[name] = function (selector, val) {
            var ret = DOM.css(selector, name, val);
            if (ret) {
                ret = parseFloat(ret);
            }
            return ret;
        };
    });

    var cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' };

    /*
     css height,width 永远都是计算值
     */
    S.each(['height', 'width'], function (name) {
        /**
         * @ignore
         */
        CUSTOM_STYLES[ name ] = {
            /**
             * @ignore
             */
            get: function (elem, computed) {
                if (computed) {
                    return getWHIgnoreDisplay(elem, name) + 'px';
                }
            },
            set: function (elem, value) {
                if (RE_NUM_PX.test(value)) {
                    value = parseFloat(value);
                    if (value >= 0) {
                        return value + 'px';
                    }
                } else {
                    return value;
                }
            }
        };
    });

    S.each(['left', 'top'], function (name) {

        CUSTOM_STYLES[ name ] = {
            get: function (elem, computed) {
                if (computed) {
                    var val = DOM._getComputedStyle(elem, name), offset;

                    // 1. 当没有设置 style.left 时，getComputedStyle 在不同浏览器下，返回值不同
                    //    比如：firefox 返回 0, webkit/ie 返回 auto
                    // 2. style.left 设置为百分比时，返回值为百分比
                    // 对于第一种情况，如果是 relative 元素，值为 0. 如果是 absolute 元素，值为 offsetLeft - marginLeft
                    // 对于第二种情况，大部分类库都未做处理，属于“明之而不 fix”的保留 bug
                    if (val === AUTO) {
                        val = 0;
                        if (S.inArray(DOM.css(elem, 'position'), ['absolute', 'fixed'])) {
                            offset = elem[name === 'left' ? 'offsetLeft' : 'offsetTop'];

                            // old-ie 下，elem.offsetLeft 包含 offsetParent 的 border 宽度，需要减掉
                            if (isIE && doc['documentMode'] != 9 || UA['opera']) {
                                // 类似 offset ie 下的边框处理
                                // 如果 offsetParent 为 html ，需要减去默认 2 px == documentElement.clientTop
                                // 否则减去 borderTop 其实也是 clientTop
                                // http://msdn.microsoft.com/en-us/library/aa752288%28v=vs.85%29.aspx
                                // ie<9 注意有时候 elem.offsetParent 为 null ...
                                // 比如 DOM.append(DOM.create('<div class='position:absolute'></div>'),document.body)
                                offset -= elem.offsetParent && elem.offsetParent['client' + (name == 'left' ? 'Left' : 'Top')]
                                    || 0;
                            }
                            val = offset - (myParseInt(DOM.css(elem, 'margin-' + name)) || 0);
                        }
                        val += 'px';
                    }
                    return val;
                }
            }
        };
    });

    function swap(elem, options, callback) {
        var old = {};

        // Remember the old values, and insert the new ones
        for (var name in options) {
            if (options.hasOwnProperty(name)) {
                old[ name ] = elem[STYLE][ name ];
                elem[STYLE][ name ] = options[ name ];
            }
        }

        callback.call(elem);

        // Revert the old values
        for (name in options) {
            if (options.hasOwnProperty(name)) {
                elem[STYLE][ name ] = old[ name ];
            }
        }
    }

    function style(elem, name, val) {
        var style;
        if (elem.nodeType === 3 || elem.nodeType === 8 || !(style = elem[STYLE])) {
            return undefined;
        }
        name = camelCase(name);
        var ret, hook = CUSTOM_STYLES[name];
        name = cssProps[name] || name;
        // setter
        if (val !== undefined) {
            // normalize unset
            if (val === null || val === EMPTY) {
                val = EMPTY;
            }
            // number values may need a unit
            else if (!isNaN(Number(val)) && !cssNumber[name]) {
                val += DEFAULT_UNIT;
            }
            if (hook && hook.set) {
                val = hook.set(elem, val);
            }
            if (val !== undefined) {
                // ie 无效值报错
                try {
                    style[name] = val;
                } catch (e) {
                    S.log('css set error :' + e);
                }
                // #80 fix,font-family
                if (val === EMPTY && style.removeAttribute) {
                    style.removeAttribute(name);
                }
            }
            if (!style.cssText) {
                elem.removeAttribute('style');
            }
            return undefined;
        }
        //getter
        else {
            // If a hook was provided get the non-computed value from there
            if (hook && 'get' in hook && (ret = hook.get(elem, false)) !== undefined) {

            } else {
                // Otherwise just get the value from the style object
                ret = style[ name ];
            }
            return ret === undefined ? '' : ret;
        }
    }

    // fix #119 : https://github.com/kissyteam/kissy/issues/119
    function getWHIgnoreDisplay(elem) {
        var val, args = arguments;
        // incase elem is window
        // elem.offsetWidth === undefined
        if (elem.offsetWidth !== 0) {
            val = getWH.apply(undefined, args);
        } else {
            swap(elem, cssShow, function () {
                val = getWH.apply(undefined, args);
            });
        }
        return val;
    }


    /*
      得到元素的大小信息
      @param elem
      @param name
      @param {String} [extra]  'padding' : (css width) + padding
                               'border' : (css width) + padding + border
                               'margin' : (css width) + padding + border + margin
     */
    function getWH(elem, name, extra) {
        if (S.isWindow(elem)) {
            return name == WIDTH ? DOM.viewportWidth(elem) : DOM.viewportHeight(elem);
        } else if (elem.nodeType == 9) {
            return name == WIDTH ? DOM.docWidth(elem) : DOM.docHeight(elem);
        }
        var which = name === WIDTH ? ['Left', 'Right'] : ['Top', 'Bottom'],
            val = name === WIDTH ? elem.offsetWidth : elem.offsetHeight;

        if (val > 0) {
            if (extra !== 'border') {
                S.each(which, function (w) {
                    if (!extra) {
                        val -= parseFloat(DOM.css(elem, 'padding' + w)) || 0;
                    }
                    if (extra === 'margin') {
                        val += parseFloat(DOM.css(elem, extra + w)) || 0;
                    } else {
                        val -= parseFloat(DOM.css(elem, 'border' + w + 'Width')) || 0;
                    }
                });
            }

            return val;
        }

        // Fall back to computed then uncomputed css if necessary
        val = DOM._getComputedStyle(elem, name);
        if (val == null || (Number(val)) < 0) {
            val = elem.style[ name ] || 0;
        }
        // Normalize '', auto, and prepare for extra
        val = parseFloat(val) || 0;

        // Add padding, border, margin
        if (extra) {
            S.each(which, function (w) {
                val += parseFloat(DOM.css(elem, 'padding' + w)) || 0;
                if (extra !== 'padding') {
                    val += parseFloat(DOM.css(elem, 'border' + w + 'Width')) || 0;
                }
                if (extra === 'margin') {
                    val += parseFloat(DOM.css(elem, extra + w)) || 0;
                }
            });
        }

        return val;
    }

    return DOM;
}, {
    requires: ['dom/base', 'ua']
});

/*
  2011-12-21
   - backgroundPositionX, backgroundPositionY firefox/w3c 不支持
   - w3c 为准，这里不 fix 了


  2011-08-19
   - 调整结构，减少耦合
   - fix css('height') == auto

  NOTES:
   - Opera 下，color 默认返回 #XXYYZZ, 非 rgb(). 目前 jQuery 等类库均忽略此差异，KISSY 也忽略。
   - Safari 低版本，transparent 会返回为 rgba(0, 0, 0, 0), 考虑低版本才有此 bug, 亦忽略。


   - getComputedStyle 在 webkit 下，会舍弃小数部分，ie 下会四舍五入，gecko 下直接输出 float 值。

   - color: blue 继承值，getComputedStyle, 在 ie 下返回 blue, opera 返回 #0000ff, 其它浏览器
     返回 rgb(0, 0, 255)

   - 总之：要使得返回值完全一致是不大可能的，jQuery/ExtJS/KISSY 未“追求完美”。YUI3 做了部分完美处理，但
     依旧存在浏览器差异。
 */
/**
 * @ignore
 * @fileOverview dom-traversal
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/traversal', function (S, DOM, undefined) {

    var doc = S.Env.host.document,
        NodeType = DOM.NodeType,
        documentElement = doc.documentElement,
        CONTAIN_MASK = 16,
        __contains =
            documentElement.compareDocumentPosition ?
                function (a, b) {
                    return !!(a.compareDocumentPosition(b) & CONTAIN_MASK);
                } :
                documentElement.contains ?
                    function (a, b) {
                        if (a.nodeType == NodeType.DOCUMENT_NODE) {
                            a = a.documentElement;
                        }
                        // !a.contains => a===document || text
                        // 注意原生 contains 判断时 a===b 也返回 true
                        b = b.parentNode;

                        if (a == b) {
                            return true;
                        }

                        // when b is document, a.contains(b) 不支持的接口 in ie
                        if (b && b.nodeType == NodeType.ELEMENT_NODE) {
                            return a.contains && a.contains(b);
                        } else {
                            return false;
                        }
                    } : 0;


    S.mix(DOM,
        /**
         * @override KISSY.DOM
         * @class
         * @singleton
         */
        {

            /**
             * Get the first element that matches the filter,
             * beginning at the first element of matched elements and progressing up through the DOM tree.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} filter Selector string or filter function
             * @param {HTMLElement|String|HTMLDocument|HTMLElement[]} [context] Search bound element
             * @return {HTMLElement}
             */
            closest: function (selector, filter, context, allowTextNode) {
                return nth(selector, filter, 'parentNode', function (elem) {
                    return elem.nodeType != NodeType.DOCUMENT_FRAGMENT_NODE;
                }, context, true, allowTextNode);
            },

            /**
             * Get the parent of the first element in the current set of matched elements, optionally filtered by a selector.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @param {HTMLElement|String|HTMLDocument|HTMLElement[]} [context] Search bound element
             * @return {HTMLElement}
             */
            parent: function (selector, filter, context) {
                return nth(selector, filter, 'parentNode', function (elem) {
                    return elem.nodeType != NodeType.DOCUMENT_FRAGMENT_NODE;
                }, context, undefined);
            },

            /**
             * Get the first child of the first element in the set of matched elements.
             * If a filter is provided, it retrieves the next child only if it matches that filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement}
             */
            first: function (selector, filter, allowTextNode) {
                var elem = DOM.get(selector);
                return nth(elem && elem.firstChild, filter, 'nextSibling',
                    undefined, undefined, true, allowTextNode);
            },

            /**
             * Get the last child of the first element in the set of matched elements.
             * If a filter is provided, it retrieves the previous child only if it matches that filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement}
             */
            last: function (selector, filter, allowTextNode) {
                var elem = DOM.get(selector);
                return nth(elem && elem.lastChild, filter, 'previousSibling',
                    undefined, undefined, true, allowTextNode);
            },

            /**
             * Get the immediately following sibling of the first element in the set of matched elements.
             * If a filter is provided, it retrieves the next child only if it matches that filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement}
             */
            next: function (selector, filter, allowTextNode) {
                return nth(selector, filter, 'nextSibling', undefined,
                    undefined, undefined, allowTextNode);
            },

            /**
             * Get the immediately preceding  sibling of the first element in the set of matched elements.
             * If a filter is provided, it retrieves the previous child only if it matches that filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement}
             */
            prev: function (selector, filter, allowTextNode) {
                return nth(selector, filter, 'previousSibling',
                    undefined, undefined, undefined, allowTextNode);
            },

            /**
             * Get the siblings of the first element in the set of matched elements, optionally filtered by a filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement[]}
             */
            siblings: function (selector, filter, allowTextNode) {
                return getSiblings(selector, filter, true, allowTextNode);
            },

            /**
             * Get the children of the first element in the set of matched elements, optionally filtered by a filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement[]}
             */
            children: function (selector, filter) {
                return getSiblings(selector, filter, undefined);
            },

            /**
             * Get the childNodes of the first element in the set of matched elements (includes text and comment nodes),
             * optionally filtered by a filter.
             * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
             * @param {String|Function} [filter] Selector string or filter function
             * @return {HTMLElement[]}
             */
            contents: function (selector, filter) {
                return getSiblings(selector, filter, undefined, 1);
            },

            /**
             * Check to see if a DOM node is within another DOM node.
             * @param {HTMLElement|String} container The DOM element that may contain the other element.
             * @param {HTMLElement|String} contained The DOM element that may be contained by the other element.
             * @return {Boolean}
             */
            contains: function (container, contained) {
                container = DOM.get(container);
                contained = DOM.get(contained);
                if (container && contained) {
                    return __contains(container, contained);
                }
                return false;
            },

            /**
             * Check to see if a DOM node is equal with another DOM node.
             * @param {HTMLElement|String} n1
             * @param {HTMLElement|String} n2
             * @return {Boolean}
             * @member KISSY.DOM
             */
            equals: function (n1, n2) {
                n1 = DOM.query(n1);
                n2 = DOM.query(n2);
                if (n1.length != n2.length) {
                    return false;
                }
                for (var i = n1.length; i >= 0; i--) {
                    if (n1[i] != n2[i]) {
                        return false;
                    }
                }
                return true;
            }
        });

    // 获取元素 elem 在 direction 方向上满足 filter 的第一个元素
    // filter 可为 number, selector, fn array ，为数组时返回多个
    // direction 可为 parentNode, nextSibling, previousSibling
    // context : 到某个阶段不再查找直接返回
    function nth(elem, filter, direction, extraFilter, context, includeSef, allowTextNode) {
        if (!(elem = DOM.get(elem))) {
            return null;
        }
        if (filter === 0) {
            return elem;
        }
        if (!includeSef) {
            elem = elem[direction];
        }
        if (!elem) {
            return null;
        }
        context = (context && DOM.get(context)) || null;

        if (filter === undefined) {
            // 默认取 1
            filter = 1;
        }
        var ret = [],
            isArray = S.isArray(filter),
            fi,
            flen;

        if (S.isNumber(filter)) {
            fi = 0;
            flen = filter;
            filter = function () {
                return ++fi === flen;
            };
        }

        // 概念统一，都是 context 上下文，只过滤子孙节点，自己不管
        while (elem && elem != context) {
            if ((
                elem.nodeType == NodeType.ELEMENT_NODE ||
                    elem.nodeType == NodeType.TEXT_NODE && allowTextNode
                ) &&
                testFilter(elem, filter) &&
                (!extraFilter || extraFilter(elem))) {
                ret.push(elem);
                if (!isArray) {
                    break;
                }
            }
            elem = elem[direction];
        }

        return isArray ? ret : ret[0] || null;
    }

    function testFilter(elem, filter) {
        if (!filter) {
            return true;
        }
        if (S.isArray(filter)) {
            for (var i = 0; i < filter.length; i++) {
                if (DOM.test(elem, filter[i])) {
                    return true;
                }
            }
        } else if (DOM.test(elem, filter)) {
            return true;
        }
        return false;
    }

    // 获取元素 elem 的 siblings, 不包括自身
    function getSiblings(selector, filter, parent, allowText) {
        var ret = [],
            tmp,
            i,
            el,
            elem = DOM.get(selector),
            parentNode = elem;

        if (elem && parent) {
            parentNode = elem.parentNode;
        }

        if (parentNode) {
            tmp = S.makeArray(parentNode.childNodes);
            for (i = 0; i < tmp.length; i++) {
                el = tmp[i];
                if (!allowText && el.nodeType != NodeType.ELEMENT_NODE) {
                    continue;
                }
                if (el == elem) {
                    continue;
                }
                ret.push(el);
            }
            if (filter) {
                ret = DOM.filter(ret, filter);
            }
        }

        return ret;
    }

    return DOM;
}, {
    requires: ['./base']
});

/*
 2012-04-05 yiminghe@gmail.com
 - 增加 contents 方法


 2011-08 yiminghe@gmail.com
 - 添加 closest , first ,last 完全摆脱原生属性

 NOTES:
 - jquery does not return null ,it only returns empty array , but kissy does.

 - api 的设计上，没有跟随 jQuery. 一是为了和其他 api 一致，保持 first-all 原则。二是
 遵循 8/2 原则，用尽可能少的代码满足用户最常用的功能。

 */
