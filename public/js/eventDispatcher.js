(function () {
    var $, EventDispatcher, tracker, __bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments)
        }
    },
    __slice = [].slice;

    $ = require("jQuery");

    EventDispatcher = function () {
        function EventDispatcher() {
            this.trigger = __bind(this.trigger, this);
            this.onOff = __bind(this.onOff, this);
            this.off = __bind(this.off, this);
            this.on = __bind(this.on, this);
            this.eventCallbacks = {}
        }
        EventDispatcher.prototype.on = function (eventName, callback) {
            var _base; (_base = this.eventCallbacks)[eventName] || (_base[eventName] = []);
            if (this.eventCallbacks[eventName].indexOf(callback) === -1) {
                return this.eventCallbacks[eventName].push(callback)
            }
        };
        EventDispatcher.prototype.off = function (eventName, callback) {
            if (eventName == null) {
                eventName = null
            }
            if (callback == null) {
                callback = null
            }
            if (!eventName) {
                return this.eventCallbacks = {}
            } else if (!callback) {
                return this.eventCallbacks[eventName] = []
            } else if (this.eventCallbacks[eventName] != null) {
                return this.eventCallbacks[eventName] = $.map(this.eventCallbacks[eventName],
                function (cb) {
                    if (cb !== callback) {
                        return cb
                    }
                })
            }
        };
        EventDispatcher.prototype.onOff = function (eventName, callback) {
            var fn;
            fn = function (_this) {
                return function () {
                    _this.off(eventName, fn);
                    return callback.apply(_this, arguments)
                }
            } (this);
            return this.on(eventName, fn)
        };
        EventDispatcher.prototype.trigger = function () {
            var args, callback, callbacks, eventName, _i, _len;
            eventName = arguments[0],
            args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            tracker.trace.trigger(eventName, args);
            callbacks = this.eventCallbacks[eventName];
            if (!callbacks) {
                return
            }
            for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
                callback = callbacks[_i];
                callback.apply(null, args)
            }
            return null
        };
        EventDispatcher.prototype.propagateEvent = function (event, source) {
            return source.on(event,
            function (_this) {
                return function () {
                    var args;
                    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                    return _this.trigger.apply(_this, [event].concat(__slice.call(args)))
                }
            } (this))
        };
        return EventDispatcher
    } ();
    module.exports = EventDispatcher
}).call(this)