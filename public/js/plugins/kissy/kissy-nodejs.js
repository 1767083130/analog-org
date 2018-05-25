﻿/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Sep 12 15:29
*/
/**
 * patch for nodejs
 * @author yiminghe@gmail.com
 * @require jsdom (npm install jsdom) ,path
 * @description emulate browser environment and rewrite loader
 */

/**
 * emulate browser and exports kissy
 */
(function () {
    var jsdom = require("jsdom").jsdom;
    document = jsdom("<html><head></head><body></body></html>");
    window = document.createWindow();
    location = window.location;
    navigator = window.navigator;
    window.document = document;
    /**
     * note : this === exports !== global
     */
    KISSY = exports.KISSY = window.KISSY = exports;
    KISSY.Env = {
        host: window
    };
})();

/**
 * rewrite loader
 */
(function (S) {
    var path = require("path");

    function mix(d, s) {
        for (var i in s) {
            if (s.hasOwnProperty(i)) {
                d[i] = s[i];
            }
        }
    }

    S.Env.mods = {};

    mix(S, {
        configs: {
            packages: function (cfgs) {
                var ps = S.__packages = S.__packages || {}, cfg, p, i;
                if (S.isArray(cfgs)) {
                    for (i = 0; i < cfgs.length; i++) {
                        cfg = cfgs[i];
                        ps[cfg.name] = cfg;
                        if ((p = (cfg.path || cfg.base)) && !p.match(/\/$/)) {
                            p += "/";
                        }
                        cfg.base = p;
                    }
                } else {
                    for (i in cfgs) {
                        cfg = cfgs[i];
                        ps[i] = cfg;
                        cfg.name = i;
                        if ((p = (cfg.path || cfg.base)) && !p.match(/\/$/)) {
                            p += "/";
                        }
                        cfg.base = p;
                    }
                }
            }
        }
    });

    var mods = S.Env.mods;

    mix(S, {

        Config: {
            base: __dirname.replace(/\\/g, "/") + "/"
        },

        getLoader: function () {
            if (S.__loader) {
                return S.__loader;
            }
            return S.__loader = S.merge(S.Loader.Target);
        },

        add: function (name, def, cfg) {
            if (S.isFunction(name)) {
                cfg = def;
                def = name;
                name = this.currentModName;
            }
            mods[name] = {
                name: name,
                fn: def
            };
            S.mix(mods[name], cfg);
        },

        _getPath: function (modName) {
            this.__packages = this.__packages || {};
            var packages = this.__packages;
            var pName = "";
            for (var p in packages) {
                if (packages.hasOwnProperty(p)) {
                    if (startsWith(modName, p)) {
                        if (p.length > pName) {
                            pName = p;
                        }
                    }
                }
            }
            var base = (packages[pName] && packages[pName].path) || this.Config.base;
            return base + modName;
        },

        require: function (moduleName) {
            var mod = mods[moduleName];
            return mod && mod.value;
        },

        _attach: function (modName) {
            var modPath = this._getPath(modName);
            var mod = mods[modName];
            if (!mod) {
                this.currentModName = modName;
                if (endsWith(modPath, ".css")) {
                    var link = document.createElement("link");
                    link.href = modPath;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                    mods[modName] = {
                        attached: 1
                    };
                } else {
                    require(modPath);
                }
            }
            mod = mods[modName];
            mod.name = modName;
            if (mod.attached) {
                return;
            }
            mod.requires = mod.requires || [];
            var requires = mod.requires;
            normalDepModuleName(modName, requires);
            var deps = [this];
            for (var i = 0; i < requires.length; i++) {
                this._attach(requires[i]);
                deps.push(this.require(requires[i]));
            }
            mod.value = mod.fn.apply(null, deps);
            mod.attached = true;
            S.getLoader().fire("afterModAttached", {
                mod: mod
            });
        },

        use: function (modNames, callback) {
            modNames = modNames.replace(/\s+/g, "").split(',');
            indexMapping(modNames);
            var self = this;
            var deps = [this];
            S.each(modNames, function (modName) {
                self._attach(modName);
                deps.push(self.require(modName));
            });
            callback && callback.apply(null, deps);
        }
    });

    //http://wiki.commonjs.org/wiki/Packages/Mappings/A
    //如果模块名以 / 结尾，自动加 index
    function indexMapping(names) {
        for (var i = 0; i < names.length; i++) {
            if (names[i].match(/\/$/)) {
                names[i] += "index";
            }
        }
        return names;
    }

    function startsWith(str, prefix) {
        return str.lastIndexOf(prefix, 0) == 0;
    }

    function endsWith(str, suffix) {
        var ind = str.length - suffix.length;
        return ind >= 0 && str.indexOf(suffix, ind) == ind;
    }

    function normalDepModuleName(moduleName, depName) {
        if (!depName) {
            return depName;
        }
        if (S.isArray(depName)) {
            for (var i = 0; i < depName.length; i++) {
                depName[i] = normalDepModuleName(moduleName, depName[i]);
            }
            return depName;
        }
        var ret;
        if (startsWith(depName, "../") || startsWith(depName, "./")) {
            var anchor = moduleName.replace(/[^/]*$/, "");
            if (!endsWith(anchor, "/")) {
                anchor += "/";
            }
            // x/y/z -> x/y/
            // note in window:
            // path.normalize("x/./y") == "x\\y\\"
            ret = path.normalize(anchor + depName);
        } else if (depName.indexOf("./") != -1
            || depName.indexOf("../") != -1) {
            ret = path.normalize(depName);
        } else {
            ret = depName;
        }
        return ret.replace(/\\/g, "/");
    }

})(KISSY);
