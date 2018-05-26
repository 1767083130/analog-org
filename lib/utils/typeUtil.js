'use strict';

let typeUtil = new class{

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
    isFunction(obj){
        return this.type(obj) === "function";
    }

    isArray(obj) {
        if(Array.isArray){
            return Array.isArray(obj);
        }

        return this.type(obj) === "array";
    }

    isNumeric(obj) {
        return !isNaN( parseFloat(obj) ) && isFinite( obj );
    }

    isWindow(obj) {
        return obj != null && obj == obj.window;
    }

    isPlainObject(obj) {
        var core_hasOwn = Object.prototype.hasOwnProperty;

        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if ( !obj || this.type(obj) !== "object" || obj.nodeType || this.isWindow( obj ) ) {
            return false;
        }

        try {
            // Not own constructor property must be Object
            if ( obj.constructor &&
                !core_hasOwn.call(obj, "constructor") &&
                !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                return false;
            }
        } catch ( e ) {
            // IE8,9 Will throw exceptions on certain host objects #9897
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for ( key in obj ) {}

        return key === undefined || core_hasOwn.call( obj, key );
    }

    type(obj) {
        var class2type = {};
        var core_toString = Object.prototype.toString;

        // Populate the class2type map
        "Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name){
            class2type[ "[object " + name + "]" ] = name.toLowerCase();
        });

        return obj == null ?
            String( obj ) :
            class2type[ core_toString.call(obj) ] || "object";
    }


}();

module.exports = typeUtil;