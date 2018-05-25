/*
Copyright 2012, KISSY UI Library v1.30rc
MIT Licensed
build time: Sep 12 15:25
*/
KISSY.add("anim",function(b,c,f){c.Easing=f;b.mix(b,{Anim:c,Easing:c.Easing});return c},{requires:["anim/base","anim/easing","anim/color","anim/background-position"]});
KISSY.add("anim/background-position",function(b,c,f,h){function a(a){a=a.replace(/left|top/g,"0px").replace(/right|bottom/g,"100%").replace(/([0-9\.]+)(\s|\)|$)/g,"$1px$2");a=a.match(/(-?[0-9\.]+)(px|%|em|pt)\s(-?[0-9\.]+)(px|%|em|pt)/);return[parseFloat(a[1]),a[2],parseFloat(a[3]),a[4]]}function e(){e.superclass.constructor.apply(this,arguments)}b.extend(e,h,{load:function(){e.superclass.load.apply(this,arguments);this.unit=["px","px"];if(this.from){var b=a(this.from);this.from=[b[0],b[2]]}else this.from=
[0,0];this.to?(b=a(this.to),this.to=[b[0],b[2]],this.unit=[b[1],b[3]]):this.to=[0,0]},interpolate:function(a,b,c){var f=this.unit,h=e.superclass.interpolate;return h(a[0],b[0],c)+f[0]+" "+h(a[1],b[1],c)+f[1]},cur:function(){return c.css(this.anim.config.el,"backgroundPosition")},update:function(){var a=this.prop,b=this.anim.config.el,e=this.interpolate(this.from,this.to,this.pos);c.css(b,a,e)}});return h.Factories.backgroundPosition=e},{requires:["dom","./base","./fx"]});
KISSY.add("anim/base",function(b,c,f,h,a,e,r,g){function d(a,e,i,g,f){if(a.el)return i=a.el,e=a.props,delete a.el,delete a.props,new d(i,e,a);if(a=c.get(a)){if(!(this instanceof d))return new d(a,e,i,g,f);e=b.isString(e)?b.unparam(""+e,";",":"):b.clone(e);b.each(e,function(a,c){var i=b.trim(o(c));i?c!=i&&(e[i]=e[c],delete e[c]):delete e[c]});i=b.isPlainObject(i)?b.clone(i):{duration:parseFloat(i)||void 0,easing:g,complete:f};i=b.merge(y,i);i.el=a;i.props=e;this.config=i;this._duration=1E3*i.duration;
this.domEl=a;this._backupProps={};this._fxs={};this.on("complete",n)}}function n(a){var e,i,g=this.config;b.isEmptyObject(e=this._backupProps)||c.css(g.el,e);(i=g.complete)&&i.call(this,a)}function t(){var g=this.config,f=this._backupProps,i=g.el,d,p,j,n=g.specialEasing||{},t=this._fxs,l=g.props;q(this);if(!1===this.fire("beforeStart"))this.stop(0);else{if(i.nodeType==w.ELEMENT_NODE)for(j in p="none"===c.css(i,"display"),l)if(l.hasOwnProperty(j)&&(d=l[j],"hide"==d&&p||"show"==d&&!p)){this.stop(1);
return}if(i.nodeType==w.ELEMENT_NODE&&(l.width||l.height))d=i.style,b.mix(f,{overflow:d.overflow,"overflow-x":d.overflowX,"overflow-y":d.overflowY}),d.overflow="hidden","inline"===c.css(i,"display")&&"none"===c.css(i,"float")&&(a.ie?d.zoom=1:d.display="inline-block");b.each(l,function(a,c){if(l.hasOwnProperty(c)){var e;b.isArray(a)?(e=n[c]=a[1],l[c]=a[0]):e=n[c]=n[c]||g.easing;b.isString(e)&&(e=n[c]=h[e]);n[c]=e||h.easeNone}});b.each(x,function(a,e){var d,g;if(g=l[e])d={},b.each(a,function(a){d[a]=
c.css(i,a);n[a]=n[e]}),c.css(i,e,g),b.each(d,function(a,b){l[b]=c.css(i,b);c.css(i,b,a)}),delete l[e]});for(j in l)if(l.hasOwnProperty(j)){d=b.trim(l[j]);var o,k,s={prop:j,anim:this,easing:n[j]},m=r.getFx(s);b.inArray(d,z)?(f[j]=c.style(i,j),"toggle"==d&&(d=p?"show":"hide"),"hide"==d?(o=0,k=m.cur(),f.display="none"):(k=0,o=m.cur(),c.css(i,j,k),c.show(i)),d=o):(o=d,k=m.cur());d+="";var v="",u=d.match(A);if(u){o=parseFloat(u[2]);if((v=u[3])&&"px"!==v)c.css(i,j,d),k*=o/m.cur(),c.css(i,j,k+v);u[1]&&(o=
("-="===u[1]?-1:1)*o+k)}s.from=k;s.to=o;s.unit=v;m.load(s);t[j]=m}this._startTime=b.now();e.start(this)}}function q(a){var e=a.config.el,d=c.data(e,k);d||c.data(e,k,d={});d[b.stamp(a)]=a}function j(a){var e=a.config.el,d=c.data(e,k);d&&(delete d[b.stamp(a)],b.isEmptyObject(d)&&c.removeData(e,k))}function p(a,e,d){a=c.data(a,"resume"==d?m:k);a=b.merge(a);b.each(a,function(a){if(void 0===e||a.config.queue==e)a[d]()})}function s(a,e,d,f){d&&!1!==f&&g.removeQueue(a,f);a=c.data(a,k);a=b.merge(a);b.each(a,
function(a){a.config.queue==f&&a.stop(e)})}var o=c._camelCase,w=c.NodeType,z=["hide","show","toggle"],x={background:["backgroundPosition"],border:["borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth"],borderBottom:["borderBottomWidth"],borderLeft:["borderLeftWidth"],borderTop:["borderTopWidth"],borderRight:["borderRightWidth"],font:["fontSize","fontWeight"],margin:["marginBottom","marginLeft","marginRight","marginTop"],padding:["paddingBottom","paddingLeft","paddingRight","paddingTop"]},
y={duration:1,easing:"easeNone"},A=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i;d.SHORT_HANDS=x;d.prototype={constructor:d,isRunning:function(){var a=c.data(this.config.el,k);return a?!!a[b.stamp(this)]:0},isPaused:function(){var a=c.data(this.config.el,m);return a?!!a[b.stamp(this)]:0},pause:function(){if(this.isRunning()){this._pauseDiff=b.now()-this._startTime;e.stop(this);j(this);var a=this.config.el,d=c.data(a,m);d||c.data(a,m,d={});d[b.stamp(this)]=this}return this},resume:function(){if(this.isPaused()){this._startTime=
b.now()-this._pauseDiff;var a=this.config.el,d=c.data(a,m);d&&(delete d[b.stamp(this)],b.isEmptyObject(d)&&c.removeData(a,m));q(this);e.start(this)}return this},_runInternal:t,run:function(){!1===this.config.queue?t.call(this):g.queue(this);return this},_frame:function(){var a,e=this.config,d=1,b,c,g=this._fxs;for(a in g)if(g.hasOwnProperty(a)&&!(c=g[a]).finished)e.frame&&(b=e.frame(c)),1==b||0==b?(c.finished=b,d&=b):(d&=c.frame())&&e.frame&&e.frame(c);(!1===this.fire("step")||d)&&this.stop(d)},stop:function(a){var d=
this.config,b=d.queue,c,f,p=this._fxs;if(!this.isRunning())return!1!==b&&g.remove(this),this;if(a){for(c in p)if(p.hasOwnProperty(c)&&!(f=p[c]).finished)d.frame?d.frame(f,1):f.frame(1);this.fire("complete")}e.stop(this);j(this);!1!==b&&g.dequeue(this);return this}};b.augment(d,f.Target);var k=b.guid("ks-anim-unqueued-"+b.now()+"-"),m=b.guid("ks-anim-paused-"+b.now()+"-");d.stop=function(a,d,e,f){if(null===f||b.isString(f)||!1===f)return s.apply(void 0,arguments);e&&g.removeQueues(a);var j=c.data(a,
k),j=b.merge(j);b.each(j,function(a){a.stop(d)})};b.each(["pause","resume"],function(a){d[a]=function(d,e){if(null===e||b.isString(e)||!1===e)return p(d,e,a);p(d,void 0,a)}});d.isRunning=function(a){return(a=c.data(a,k))&&!b.isEmptyObject(a)};d.isPaused=function(a){return(a=c.data(a,m))&&!b.isEmptyObject(a)};d.Q=g;return d},{requires:"dom,event,./easing,ua,./manager,./fx,./queue".split(",")});
KISSY.add("anim/color",function(b,c,f,h){function a(a){var a=a+"",e;if(e=a.match(n))return[parseInt(e[1]),parseInt(e[2]),parseInt(e[3])];if(e=a.match(t))return[parseInt(e[1]),parseInt(e[2]),parseInt(e[3]),parseInt(e[4])];if(e=a.match(q)){for(a=1;a<e.length;a++)2>e[a].length&&(e[a]+=e[a]);return[parseInt(e[1],r),parseInt(e[2],r),parseInt(e[3],r)]}return d[a=a.toLowerCase()]?d[a]:[255,255,255]}function e(){e.superclass.constructor.apply(this,arguments)}var r=16,g=Math.floor,d={black:[0,0,0],silver:[192,
192,192],gray:[128,128,128],white:[255,255,255],maroon:[128,0,0],red:[255,0,0],purple:[128,0,128],fuchsia:[255,0,255],green:[0,128,0],lime:[0,255,0],olive:[128,128,0],yellow:[255,255,0],navy:[0,0,128],blue:[0,0,255],teal:[0,128,128],aqua:[0,255,255]},n=/^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,t=/^rgba\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+),\s*([0-9]+)\)$/i,q=/^#?([0-9A-F]{1,2})([0-9A-F]{1,2})([0-9A-F]{1,2})$/i,c=f.SHORT_HANDS;c.background=c.background||[];c.background.push("backgroundColor");
c.borderColor=["borderBottomColor","borderLeftColor","borderRightColor","borderTopColor"];c.border.push("borderBottomColor","borderLeftColor","borderRightColor","borderTopColor");c.borderBottom.push("borderBottomColor");c.borderLeft.push("borderLeftColor");c.borderRight.push("borderRightColor");c.borderTop.push("borderTopColor");b.extend(e,h,{load:function(){e.superclass.load.apply(this,arguments);this.from&&(this.from=a(this.from));this.to&&(this.to=a(this.to))},interpolate:function(a,d,b){var c=
e.superclass.interpolate;if(3==a.length&&3==d.length)return"rgb("+[g(c(a[0],d[0],b)),g(c(a[1],d[1],b)),g(c(a[2],d[2],b))].join(", ")+")";if(4==a.length||4==d.length)return"rgba("+[g(c(a[0],d[0],b)),g(c(a[1],d[1],b)),g(c(a[2],d[2],b)),g(c(a[3]||1,d[3]||1,b))].join(", ")+")"}});b.each("backgroundColor,borderBottomColor,borderLeftColor,borderRightColor,borderTopColor,color,outlineColor".split(","),function(a){h.Factories[a]=e});return e},{requires:["dom","./base","./fx"]});
KISSY.add("anim/easing",function(){var b=Math.PI,c=Math.pow,f=Math.sin,h={swing:function(a){return-Math.cos(a*b)/2+0.5},easeNone:function(a){return a},easeIn:function(a){return a*a},easeOut:function(a){return(2-a)*a},easeBoth:function(a){return 1>(a*=2)?0.5*a*a:0.5*(1- --a*(a-2))},easeInStrong:function(a){return a*a*a*a},easeOutStrong:function(a){return 1- --a*a*a*a},easeBothStrong:function(a){return 1>(a*=2)?0.5*a*a*a*a:0.5*(2-(a-=2)*a*a*a)},elasticIn:function(a){return 0===a||1===a?a:-(c(2,10*(a-=
1))*f((a-0.075)*2*b/0.3))},elasticOut:function(a){return 0===a||1===a?a:c(2,-10*a)*f((a-0.075)*2*b/0.3)+1},elasticBoth:function(a){return 0===a||2===(a*=2)?a:1>a?-0.5*c(2,10*(a-=1))*f((a-0.1125)*2*b/0.45):0.5*c(2,-10*(a-=1))*f((a-0.1125)*2*b/0.45)+1},backIn:function(a){1===a&&(a-=0.0010);return a*a*(2.70158*a-1.70158)},backOut:function(a){return(a-=1)*a*(2.70158*a+1.70158)+1},backBoth:function(a){var e,b=(e=2.5949095)+1;return 1>(a*=2)?0.5*a*a*(b*a-e):0.5*((a-=2)*a*(b*a+e)+2)},bounceIn:function(a){return 1-
h.bounceOut(1-a)},bounceOut:function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+0.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+0.9375:7.5625*(a-=2.625/2.75)*a+0.984375},bounceBoth:function(a){return 0.5>a?0.5*h.bounceIn(2*a):0.5*h.bounceOut(2*a-1)+0.5}};return h});
KISSY.add("anim/fx",function(b,c,f){function h(a){this.load(a)}function a(a,b){return(!a.style||null==a.style[b])&&null!=c.attr(a,b,f,1)?1:0}h.prototype={constructor:h,load:function(a){b.mix(this,a);this.pos=0;this.unit=this.unit||""},frame:function(a){var c=this.anim,g=0;if(this.finished)return 1;var d=b.now(),f=c._startTime,c=c._duration;a||d>=c+f?g=this.pos=1:this.pos=this.easing((d-f)/c);this.update();this.finished=this.finished||g;return g},interpolate:function(a,c,g){return b.isNumber(a)&&b.isNumber(c)?
(a+(c-a)*g).toFixed(3):f},update:function(){var b=this.prop,h=this.anim.config.el,g=this.to,d=this.interpolate(this.from,g,this.pos);d===f?this.finished||(this.finished=1,c.css(h,b,g)):(d+=this.unit,a(h,b)?c.attr(h,b,d,1):c.css(h,b,d))},cur:function(){var b=this.prop,h=this.anim.config.el;if(a(h,b))return c.attr(h,b,f,1);var g,b=c.css(h,b);return isNaN(g=parseFloat(b))?!b||"auto"===b?0:b:g}};h.Factories={};h.getFx=function(a){return new (h.Factories[a.prop]||h)(a)};return h},{requires:["dom"]});
KISSY.add("anim/manager",function(b){var c=b.stamp;return{interval:15,runnings:{},timer:null,start:function(b){var h=c(b);this.runnings[h]||(this.runnings[h]=b,this.startTimer())},stop:function(b){this.notRun(b)},notRun:function(f){delete this.runnings[c(f)];b.isEmptyObject(this.runnings)&&this.stopTimer()},pause:function(b){this.notRun(b)},resume:function(b){this.start(b)},startTimer:function(){var b=this;b.timer||(b.timer=setTimeout(function(){b.runFrames()?b.stopTimer():(b.timer=0,b.startTimer())},
b.interval))},stopTimer:function(){var b=this.timer;b&&(clearTimeout(b),this.timer=0)},runFrames:function(){var b=1,c=this.runnings,a;for(a in c)c.hasOwnProperty(a)&&(b=0,c[a]._frame());return b}}});
KISSY.add("anim/queue",function(b,c){function f(b,d,f){var d=d||e,h,q=c.data(b,a);!q&&!f&&c.data(b,a,q={});q&&(h=q[d],!h&&!f&&(h=q[d]=[]));return h}function h(g,d){var d=d||e,f=c.data(g,a);f&&delete f[d];b.isEmptyObject(f)&&c.removeData(g,a)}var a=b.guid("ks-queue-"+b.now()+"-"),e=b.guid("ks-queue-"+b.now()+"-"),r={queueCollectionKey:a,queue:function(a){var b=f(a.config.el,a.config.queue);b.push(a);"..."!==b[0]&&r.dequeue(a);return b},remove:function(a){var c=f(a.config.el,a.config.queue,1);c&&(a=
b.indexOf(a,c),-1<a&&c.splice(a,1))},removeQueues:function(b){c.removeData(b,a)},removeQueue:h,dequeue:function(a){var b=a.config.el,a=a.config.queue,c=f(b,a,1),e=c&&c.shift();"..."==e&&(e=c.shift());e?(c.unshift("..."),e._runInternal()):h(b,a)}};return r},{requires:["dom"]});