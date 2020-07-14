/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
;(function(){
	var Contructor = function( target ){
		this._target = target;
		this._events = this._events || [];
		this._maxListeners = this._maxListeners || Contructor.defaultMaxListeners;
		this._id = Math.random()
	}
	
	Contructor.prototype._events = undefined;
    Contructor.prototype._maxListeners = undefined;
    Contructor.defaultMaxListeners = 10;
	Contructor.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
    };

    Contructor.prototype.emit = function(event) {
	    var args = Array.prototype.slice.call(arguments);
	    args.shift();
	    var self = this;
	    var funcs = this._events[event] || [];
	    this._events[event] = funcs;
	    funcs.forEach(function(func){
	    	func.apply( self._target , args)
	    });
    };
    Contructor.prototype.addListener = function(event, listener) {
        var events = this._events;
	    if (events[event] && events[event].length >= this._maxListeners) {
	        throw console.error('监听器的最大数量是%d,您已超出限制', this._maxListeners)
	    }
	    if (events[event] instanceof Array) {
	        if (events[event].indexOf( listener ) === -1) {
	            events[event].push( listener );
	        }
	    } else {
	        events[event] = [].concat( listener );
	    }
        return this;
    };

    Contructor.prototype.on = Contructor.prototype.addListener;
    Contructor.prototype.once = function( event, listener) {
        var self = this;
		function fn() {
		    var args = Array.prototype.slice.call(arguments);
		    listener.apply( self._target, args);
		    self.removeListener(event, fn);
		}
		this.on(event, fn)
    };

    Contructor.prototype.removeListener = function (event, listener) {
	    var events = this._events;
	    var arr = events[event] || [];
	    var i = arr.indexOf(listener);
	    if (i >= 0) {
	        events[event].splice(i, 1);
	    }
	}

    Contructor.prototype.removeAllListeners = function(event) {
        this._events[event] = [];
        return this;
    };

    Contructor.prototype.listeners = function(event) {
        return this._events[event];
    };
    Contructor.prototype.setMaxListeners = function (num) {
	    this._maxListeners = num;
	}
	
	
    var isFunction = function(arg) {
        return typeof arg === 'function';
    }

    var isNumber = function(arg) {
        return typeof arg === 'number';
    }

    var isObject = function(arg) {
    	//babel7 ???
    	if( arg && typeof arg.hasOwnProperty =='function'){
    		return true;
    	}
    	return false;
        //return typeof arg === 'object' && arg !== null;
    }

    var isUndefined = function(arg) {
        return arg == undefined
    }

	var EventEmitter = function( target ){		
		EventEmitter.prototype = new Contructor( target );
		['on','once','off','emit'].forEach( function( name ){
			var func = EventEmitter.prototype[name]||function(){};
			Object.defineProperty( target, name, {
				value:func.bind( EventEmitter.prototype  )
			})
		})
	}

	
	//兼容CommonJs规范
	if (typeof module !== 'undefined' && module.exports) {
    	module.exports = EventEmitter;
    	return;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
    	define(function() { return EventEmitter; });
    	return;
    }
})( self );