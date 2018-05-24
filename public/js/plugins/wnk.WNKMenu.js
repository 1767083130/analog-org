/// <reference name="MicrosoftAjax.debug.js" />
/// <reference name="MicrosoftAjaxTimer.debug.js" />
/// <reference name="MicrosoftAjaxWebForms.debug.js" />
/// <reference path="../ExtenderBase/BaseScripts.js" />
/// <reference path="../Common/Common.js" />
/// <reference path="../ExtenderBase/dnn.controls.js" />
//references:mNode-WNKMenuNode;jNode-JsonNode; dNode-DNNNode

///======
//copyright by WebNuke
//因为系统原有的菜单控件不容易修改成想要的样式，需要重新开发。
///======
Type.registerNamespace('wnk');
wnk.Menu = function(element) {

    wnk.Menu.initializeBase(this, [element]);

    //样式
    this._container = null;
    this._containerCss = null;

    this._topCss = null;
    this._topHoverCss = null;
    this._topSelCss = null;

    this._subCss = null;
    this._subHoverCss = null;
    this._subSelCss = null;

    //action
    this._target = null;
    this._defaultJS = null;
    this._postBack = null;
    this._callBack = null;

    //events
    this._attachedHandlers = [];
    this._onsubmitDelegate = null;
    this._hideMenusDelegate = null;
    this.expandNodeDelegate = null;
    this.nodeClickDelegate = null;
    this._isLazyMode = false;  //是否为懒加载模式

    //目录数据
    this._jsonData = "";
    this._menuNodes = null;

    this.IsNodesExpended = false; //加载时节点是否全部展开
}

wnk.Menu.prototype = {
    initialize: function() {

        //获取容器，并创建DNNControl对象
        this._container = this.get_element();
        //this = new dnn.controls.control(this._container);
        
        this._jsonData = dnn.getVar("DNNNodes");
        //初始化        this._initMenu(this._jsonData);
    },

    _initMenu: function(jsonNodes) {
        this._jsonData = jsonNodes;
        this._loadNodes();
        this.generateMenuHTML();
    },

    //加载数据并初始化封装处理
    _loadNodes: function() {
        if(!this._jsonData){
            this._jsonData = "";
        }
        
        var json = dnn.evalJSON("{" + this._jsonData + "}");
        if (json) {
            this.nodes = json.nodes;
            this.rootNode = {};
            this.rootNode.nodes = this.nodes;
            this.rootNode.id = this.ns;
            this.rootNode = new dnn.controls.JSONNode(this.rootNode, 'root', 0);
        }
    },

    //树目录结构比较复杂：可把每个节点看作由一个横幅（bar，显示它的名称）
    //和它的子菜单组成（subMenu，每个节点可能有多个子节点），子菜单包含节点
    //的多个子节点，而这些子节点的结构和它的父节点结构是一样的，如此反复。
    //这里暂时只支持两级目录结构，如果有必要，可以扩展到多级。
    generateMenuHTML: function() {
        this._container.className = this._containerCss;
        dnn.dom.disableTextSelect(this._container);
        
        //先清空
        this._container.innerHTML = "";
        
        var subMenu = this._container;   //menuBuilder.newSubMenu();

        //生成目录
        for (var i = 0; i < this.rootNode.childNodeCount(); i++) {
            //var menu = this.getChildControl(this.rootNode.childNodes(i).id, 'row');
            this.renderTopNode(subMenu, this.rootNode.childNodes(i));

            //获取row
            var row = this.getChildControl(this.rootNode.childNodes(i).id, 'row');

            //获取subMenu
            var menu = this.getChildControl(this.rootNode.childNodes(i).id, 'sub');
        }

    },
    invokeNodeClickDelegate: function(addNavigateDelegate, mNode) {
        addNavigateDelegate(mNode);
    },

    renderTopNode: function(container, node) {
        var mNode = new dnn.controls.WNKMenuNode(node);
        if (mNode.selected) {
            this.selMNode = mNode;
        }

        var menuBuilder = this._getMenuBuilder(container, mNode);
        var row = menuBuilder.newRow();
        var bar = menuBuilder.newBar(false);
        bar.className = bar.className + ' head';
        bar.innerHTML = mNode.text;

        if (mNode.enabled) {
            this.addHandlers(bar, { "click": this._nodeTextClick }, this);
        }
    
        if (mNode.hasNodes || mNode.hasPendingNodes)	//if node has children render _container and hide if necessary
        {
            var subMenu = menuBuilder.newSubMenu();
            if(!this.IsNodesExpended){
                subMenu.style.display = 'none';
            }
            
            //container.appendChild(subMenu);
            if (!this._isLazyMode) {
                for (var i = 0; i < mNode.childNodeCount(); i++) {
                    if(this.IsNodesExpended){ //全部展开节点时，需要更改节点状态
                        //var tempNode = new dnn.controls.WNKMenuNode(mNode);
                        mNode.selected = true;
                        mNode.update('selected');
                    }
                    
                    this.renderSubNode(subMenu, mNode.childNodes(i));
                }
            }
        }
        else{
            this.addHandlers(bar, { "click": this._subNodeTextClick }, this);
        }
    },

    _subMenuRowMOver: function(evt, element) {
        //注意，不能用下面注释的方法，evt是事件源，而不一定是row
        //evt.target.parentNode.className = 'row rowMouseOver';
        
        var node = this._findEventNode(evt);
        if (node != null) {
            mNode = new dnn.controls.WNKMenuNode(node);
            var ctl = this.getChildControl(mNode.id, 'row');
            ctl.className = 'menu_row menu_rowMouseOver';
        }
    },
    _subMenuRowMOut: function(evt, element) {
        var node = this._findEventNode(evt);
        if (node != null) {
            mNode = new dnn.controls.WNKMenuNode(node);
            var ctl = this.getChildControl(mNode.id, 'row');
            ctl.className = 'menu_row';
        }
    },

    renderSubNode: function(container, mNode) {
        var menuBuilder = this._getMenuBuilder(container, mNode);
        if (menuBuilder.alreadyRendered == false) {
            var row = menuBuilder.newRow();
            this.addHandlers(row, { "mouseover": this._subMenuRowMOver,
                "mouseout": this._subMenuRowMOut
            }, this);

            menuBuilder.newIcon(mNode);
            var bar = menuBuilder.newBar(true);
            bar.innerHTML = mNode.text;
        
            if (mNode.enabled) {
                this.addHandlers(row, { "click": this._subNodeTextClick }, this);
            }
        }
    },
    _nodeTextClick: function(evt) {
        var node = this._findEventNode(evt);
        if (node != null) {
            mNode = new dnn.controls.WNKMenuNode(node);

            if (mNode.selected == null || mNode.selected == false) {
                this.expandNode(mNode);
            }
            else {
                this.collapseNode(mNode);
            }
        }
        evt.stopPropagation();
    },

    _subNodeTextClick: function(evt) {
        var node = this._findEventNode(evt);
        var mNode;
     
        if (node != null) {
            mNode = new dnn.controls.WNKMenuNode(node);
            this.selectNode(mNode);
        }

        evt.stopPropagation();
    },
    _findEventNode: function(evt) {
        if (dnn.dom.isNonTextNode(evt.target))
            return this.rootNode.findNode(this.getChildControlBaseId(evt.target));
    },
    selectNode: function(mNode) {
        var arg = new dnn.controls.DNNNodeEventArgs(mNode);
        this.invoke_handler('click', arg);
        if (arg.get_cancel()) return;

        //always select node (we aren't supporting checkboxes yet)
        //mNode.selected = true; //(mNode.selected ? null : true);
        //mNode.update('selected');

        //回调服务器方法        //if (this._callBack.indexOf('[NODEXML]') > -1) {
        //    eval(this._callBack.replace('[NODEXML]', dnn.escapeForEval(mNode.node.getXml())));
        //}
        //else {
        //    eval(this._callBack.replace('[NODEID]', mNode.id));
        //}

        //执行委托方法
        if (this.nodeClickDelegate != null) {
            this.invokeNodeClickDelegate(this.nodeClickDelegate, mNode);
        }

        if (mNode.hasNodes || mNode.hasPendingNodes) {
            if (mNode.selected == null || mNode.selected == false) {
                this.expandNode(mNode);
            }
            else {
                this.collapseNode(mNode);
            }
        }

        if (mNode.selected) {
            var sJS = this.defaultJS;
            if (mNode.js.length > 0)
                sJS = mNode.js;
        }
        return true;
    },
    
    //刷新
    refresh:function(jsonNodes){
        //if (this._callBack.indexOf('[NODEXML]') > -1) {
        //    eval(this._callBack.replace('[NODEXML]', ''));
        //}
        //else {
        //    eval(this._callBack.replace('[NODEID]', ''));
        //}
        this._initMenu(jsonNodes);
    },
    
    callBackSuccess: function(result, ctx, req) {

    },
    callBackFail: function(result, ctx, req) {
        alert(result);
    },

    callBackStatus: function(result, ctx, req) {
    },
    expandAllNodes:function(){
        for (var i = 0; i < this.rootNode.childNodeCount(); i++) {
            var mNode = new dnn.controls.WNKMenuNode(this.rootNode.childNodes(i));
            this.expandNode(mNode);
        } 
    },
    collapseAllNodes:function(){
        for (var i = 0; i < this.rootNode.childNodeCount(); i++) {
            var mNode = new dnn.controls.WNKMenuNode(this.rootNode.childNodes(i));
            this.collapseNode(mNode);
        } 
    },

    //展开节点
    expandNode: function(mNode) {
        subMenu = this.getChildControl(mNode.id, 'sub');
        if (subMenu != null) {
            subMenu.style.display = 'block';
            mNode.selected = true;
            mNode.update('selected');

            //执行委托方法
            if (this.expandNodeDelegate != null) {
                this.invokeNodeClickDelegate(this.expandNodeDelegate, mNode);
            }
        }
    },

    //收拢节点
    collapseNode: function(mNode) {
        var subMenu = this.getChildControl(mNode.id, 'sub');
        if (subMenu != null) {
            subMenu.style.display = 'none';
            mNode.selected = null;
            mNode.update('selected');
        }
    },

    renderSubMenu: function(mNode) {
        var menuBuilder = this._getMenuBuilder(mNode, null);
        var subMenu = menuBuilder.createSubMenu();
        //subMenu.style.position = 'absolute';
        var css = this.mcss;
        css += ' m m' + mNode.level;
        css += ' mid' + mNode.id;

        subMenu.className = css;
        return subMenu;
    },

    //---- Methods ---//
    //this._getMenuBuilder(mNode, container);
    // function(container, mNode, control) 
    _getMenuBuilder: function(container, mNode) {
        var menuBuilder = new wnk.Menu.MenuBuilder(container, mNode, this)
        return menuBuilder;
    },

    dispose: function() {
        this._onsubmitDelegate = null;
        this._hideMenusDelegate = null;
        this._expandNodeDelegate = null;
        this.nodeClickDelegate = null;
        //this.dispose();
        wnk.Menu.callBaseMethod(this, 'dispose');
        //dnn.controls.WNKMenu.callBaseMethod(this, 'dispose');
    },

    //properties begin
    //style
    get_TopCss: function() {return this._topCss;},
    set_TopCss: function(value) {this._topCss = value;},

    get_TopHoverCss: function() {return this._topHoverCss;},
    set_TopHoverCss: function(value) {this._topHoverCss = value;},

    get_TopSelCss: function() {return this._topSelCss;},
    set_TopSelCss: function(value) {this._topSelCss = value;},

    get_SubCss: function() { return this._subCss;},
    set_SubCss: function(value) { this._subCss = value;},
    
    get_SubHoverCss: function() {return this._subHoverCss;},
    set_SubSelCss: function(value) {this._subHoverCss = value;},
    
    get_SubSelCss: function() {return this._subSelCss;},
    set_SubSelCss: function(value) {this._subSelCss = value;},
    
    get_IsLazyMode: function() {return this._isLazyMode;},
    set_IsLazyMode: function(value) {this._isLazyMode = value;},

    get_JsonData: function() {return this._jsonData;},
    set_JsonData: function(value) {this._jsonData = value;},

    get_CallBack: function() {return this._callBack;},
    set_CallBack: function(value) {this._callBack = value;},

    get_MenuNodes: function() {return this._menuNodes;},
    set_MenuNodes: function(value) {this._menuNodes = value; }
}

//remark
wnk.Menu.registerClass("wnk.Menu", dnn.controls.control);

//For rootNode: new MemuBuilder(this._container,rootNode,this)
//WNKMenuBuilder object
wnk.Menu.MenuBuilder = function(container, mNode, control) {
    this.container = container;
    this.mNode = mNode;
    this.control = control;
    this.row = null;
    this.bar = null;
    this.subMenu = null;
    this.alreadyRendered = false;
}
//  <ul id="navigation">
//    <li><a class="head" href="?p=1.1.1">Guitar</a>
//        <ul>
//            <li><a href="#">Electric</a></li>
//            <li><a href="?p=1.1.1.2">Acoustic</a></li>
//            <li><a href="?p=1.1.1.3">Amps</a></li>
//            <li><a href="?p=1.1.1.4.1">Effects A</a></li>
//            <li><a href="?p=1.1.1.4.2">Effects B</a></li>
//            <li><a href="?p=1.1.1.4.3">Effects C</a></li>
//            <li><a href="?p=1.1.1.4.4">Effects D</a></li>
//            <li><a href="?p=1.1.1.5">Accessories</a></li>
//        </ul>
//    </li>
//  </ul>
//WNKMenuBuilder specific methods
wnk.Menu.MenuBuilder.prototype =
{
    appendChild: function(ctl, isNewCell) {
        this.row.appendChild(ctl);
    },

    newRow: function() {
        this.row = this.control.createChildControl('li', this.mNode.id, 'row'); //row that it's includes one Bar and one subMenu
        this.row.className = 'row';
        this.container.appendChild(this.row);
        return this.row;
    },

    newBar: function(blnNeedHref) {
        this.bar = this.control.createChildControl('a', this.mNode.id, 'bar'); //Bar
        this.bar.style.cursor = 'pointer';
        this.bar.className = 'menu_bar';
        //if (blnNeedHref) this.bar.href = '#';
        this.row.appendChild(this.bar);
        return this.bar;
    },
    newIcon: function(mNode) {
        var ctl = dnn.dom.createElement('span');
        if (mNode.imageIndex > -1 || mNode.image != '') {
            var img = this.control.createChildControl('img', mNode.id, 'icn');
            img.src = (mNode.image.length > 0 ? mNode.image : this.imageList[mNode.imageIndex]);
            ctl.appendChild(img);

            img.className = 'menu_icon';
        }

        ctl.className = 'menu_iconSpan';
        this.row.appendChild(ctl);
        return ctl;
    },


    newSubMenu: function() {
        this.subMenu = this.control.createChildControl('ul', this.mNode.id, 'sub'); //subMenu
        this.subMenu.className = 'menu_subMenu';
        this.row.appendChild(this.subMenu);
        return this.subMenu;
    }
}

wnk.Menu.MenuBuilder.registerClass('wnk.Menu.MenuBuilder');

dnn.controls.WNKMenuNode = function(jNode) {
    dnn.controls.WNKMenuNode.initializeBase(this, [jNode]);
    this._addAbbr({ breadcrumb: 'bcrumb', clickAction: 'ca', imageIndex: 'iIdx', urlIndex: 'uIdx' });

    //menu specific attributes
    this.hover = false;
    this.expanded = null; //jNode.getAttribute('expanded', '0') == '1' ? true : null;
    this.selected = jNode.getAttribute('selected', '0') == '1' ? true : null;
    this.breadcrumb = jNode.getAttribute('bcrumb', '0') == '1' ? true : null;
    this.clickAction = jNode.getAttribute('ca', dnn.controls.action.postback);
    this.imageIndex = new Number(jNode.getAttribute('iIdx', '-1'));
    this.urlIndex = new Number(jNode.getAttribute('uIdx', '-1'));
    this.lhtml = jNode.getAttribute('lhtml', '');
    this.rhtml = jNode.getAttribute('rhtml', '');
}

//WNKMenuNode specific methods
dnn.controls.WNKMenuNode.prototype =
{
    childNodes: function(iIndex) {
        if (this.node.nodes[iIndex] != null)
            return new dnn.controls.WNKMenuNode(this.node.nodes[iIndex]);

    },
    getUrl: function(menu) {
        if (this.urlIndex > -1)
            return menu.urlList[this.urlIndex] + this.url;
        else
            return this.url;
    }
}
dnn.controls.WNKMenuNode.registerClass('dnn.controls.WNKMenuNode', dnn.controls.DNNNode);
