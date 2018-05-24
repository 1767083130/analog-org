/*!
 * jQuery SelectExpand Plugin 1.0 beta
 *
 * 	Copyright 2014 wuxing qq:252629505 email:wuxing2722@qq.com
 *	https://github.com/zhenzhonghouse/SelectExpand/blob/master/README.md
 *	Released under the Apache2 license:
 *  https://github.com/zhenzhonghouse/SelectExpand/blob/master/LICENSE
 *
*/

(function ($) {
    //SelectExpandClass构造函数
    $.SelectExpandClass = function (option, select) {
        this.isRange = false;

        this.settings = $.extend(true, {}, $.SelectExpandClass.defaults, option);
        this.currSelect = select;
        this.currInput = null;
        this.init();
    };

    $.extend($.SelectExpandClass, {
        defaults: {
            selectSize: 15,
            fixValue: false,
            inputClass: ''
        },
        prototype: {
            init: function () {		//类初始化相关操作
                this.createInput();

                var elem_name = $(this.currSelect).attr("name");
                $(this.currSelect).hide();
                $(this.currSelect).attr("size", this.settings.selectSize);
                $(this.currSelect).attr("name", "hide_" + elem_name);
                $(this.currSelect).bind("click", this.__bind(this.onSelectClick, this));
                $(this.currSelect).bind("mouseover", this.__bind(this.onSelectMouseOver, this));
                $(this.currSelect).bind("mouseout", this.__bind(this.onSelectMouseOut, this));
                $(this.currSelect).bind("change", this.__bind(this.onSelectChange, this));

                $(this.currSelect).addClass("SelectExpand_s");

                $(this.currSelect).css({ "position": "absolute", "z-index": 100000 });
                //$(this.currSelect).css("margin", "0");
                //$(this.currSelect).css("padding", "0");
                //$(this.currSelect).css("border", "1px solid #CCC");
                //$(this.currSelect).css("border-top", "0");

                $(this.currSelect).data("inputElement", this.currInput);

                $(this.currInput).attr("name", elem_name);
                $(this.currInput).bind("click", this.__bind(this.onInputClick, this));
                $(this.currInput).bind("keyup", this.__bind(this.onInputKeyup, this));
                $(this.currInput).bind("blur", this.__bind(this.onInputChange, this));

                if (this.settings.inputClass) {
                    $(this.currInput).addClass(this.settings.inputClass);
                }

                debugger
                var defaultValue = $(this.currSelect).val();
                if (defaultValue) {
                    $(this.currSelect).val(defaultValue);

                    var inputText = $(this.currSelect).find("option:selected").text();
                    $(this.currInput).val(inputText);
                }

                $(document).click(function (e) {		//当在文档空白处点击鼠标时隐藏下拉框
                    var elem = $(e.target);
                    if ($(".SelectExpand_s").is(":visible")
                        && elem.attr("class") != "SelectExpand_i"
                        && !elem.parent(".SelectExpand_s").size()) {
                        $('.SelectExpand_s').hide();
                    }
                });
            },
            __bind: function (fn, me) {
                return function () {
                    return fn.apply(me, arguments);
                };
            },
            createInput: function () {
                var input_obj = $('<input type="text" style="padding:0;margin:0;" class="SelectExpand_i" />')
                                .css({ "width": this.currSelect.offsetWidth - 4 })
                                 .insertBefore(this.currSelect);
                this.currInput = input_obj[0];
            },
            onSelectClick: function (evt) {	//当select元素单击时的事件
                //var element=evt.srcElement||evt.target;
                var currValue = $(this.currSelect).find("option:selected").text();

                $(this.currInput).val(currValue);
                $(this.currSelect).hide();
            },
            onSelectMouseOver: function (evt) {
                this.isRange = true;
            },
            onSelectMouseOut: function (evt) {
                this.isRange = false;
            },
            onSelectChange: function () {

                var currValue = $(this.currSelect).find("option:selected").text();
                $(this.currInput).val(currValue);
            },
            onInputClick: function (evt) {	//当input元素单击时的事件

                $(".SelectExpand_s:visible").hide();
                $(this.currSelect).show();

                var scr_left = $(this.currInput).offset().left;
                var scr_top = $(this.currInput).offset().top;

                var rect = this.currInput.getBoundingClientRect();
                var x = scr_left;
                var y = scr_top + $(this.currInput).height() + 4;
                //x = 654; y = 545;
                $(this.currSelect).offset({ top: y, left: x });

            },
            onInputKeyup: function (e) {
                var input = $.trim($(this.currInput).val()).toLowerCase();

                //搜索
                var options = $(this.currSelect).get(0).options;
                for (var i = 0; i < options.length; i++) {
                    var option = options[i];
                    if (i == 0) {
                        option.selected = true;
                    }
                    if ($.trim(option.text).toLowerCase().indexOf(input) != -1) {
                        option.selected = true;
                        break;
                    }
                }
            },
            onInputChange: function (e) {
                if (this.isRange) {
                    return;
                }

                var input = $.trim($(this.currInput).val()).toLowerCase();
                //搜索
                var isFind = false;
                var options = $(this.currSelect).get(0).options;
                for (var i = 0; i < options.length; i++) {
                    var option = options[i];
                    if ($.trim(option.text).toLowerCase() == input) {
                        option.selected = true;
                        isFind = true;
                        break;
                    }
                }

                if (!isFind && this.settings.fixValue) {
                    $(this.currInput).val("");
                    $(this.currSelect).val("");
                }
            },
            getInputElement: function () {
                return this.currInput;
            }
        }
    });

    $.extend($.fn, {
        selectExpand: function (option) {

            //遍历所有选择器元素,支持按类等多元素初始化
            return this.each(function (index, element) {
                //检查select对象是否已经创建扩展对象
                var expand_obj = $.data(this, "SelectExpandObj");
                if (expand_obj) {
                    return expand_obj;
                }
                var expand_obj = new $.SelectExpandClass(option, this);	//初始化select扩展类
                $.data(this, "SelectExpandObj", expand_obj);			//保存类数据到select元素中
            });
        },
        getInputElement: function () {
            var inputElement = null;
            this.each(function (input_field) {
                inputElement = $(this).data('inputElement');
                inputElement = $(inputElement);
            });
            return inputElement;
        },
        setValue: function (value) {
            $(this).val(value);

            var inputElement = $(this).data('inputElement');
            var currValue = $(this).find("option:selected").text();
            $(inputElement).val(currValue);

        }

    });
}(jQuery));
