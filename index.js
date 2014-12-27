'use strict';

var $ = require('jquery'),
	_ = require('underscore'),
	BB = require('backbone'),
	socketConnecting = 1,
	socketConnected = 2,
	socketDisconnected = 3,
	socketSubscriptions = {},
	restoreSubscriptionsTimeout,
	originalAJAX = BB.ajax;

exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.connectSocket = connectSocket;
exports.get = curryMethod('get');
exports.post = curryMethod('post');
exports.put = curryMethod('put');
exports.remove = curryMethod('remove');

BB.ajax = _wrappedAJAX;

// Handle hangup on unload to prevent possible halt condition in IE.
window.onbeforeunload = function(e) {
	window.socketStatus && window.socketStatus == socketConnected && socket.disconnect();
};

/**
 * handle the connect and disconnect from socket.io
 *
 * @author Tim Golen 2014-12-25
 *
 * @return {void}
 */
function connectSocket(cb) {
	window.socketStatus = socketConnecting;

	var socket = window.socket = io.connect(window.location.origin, { secure: !!~window.location.protocol.indexOf('https') });
	socket.on('connect', function() {
		window.socketStatus = socketConnected;
		// Reconnected? Sweet! Restore our subscriptions.
		restoreSubscriptionsTimeout = setTimeout(_restoreSubscriptions, 1);
		cb && cb();
	});
	socket.on('message.published', _message);
	socket.on('disconnect', function() {
		restoreSubscriptionsTimeout && clearTimeout(restoreSubscriptionsTimeout);
		window.socketStatus = socketDisconnected;
	});
}

function _wrappedAJAX(options) {
	// Pass cross domain requests on to the original handler.
	if (options.url.indexOf('/') !== 0) {
		return originalAJAX.apply(BB, arguments);
	}

	var method = (options.type || 'GET').toLowerCase(),
		data = options.data;

	if (options.dataType === 'json' && data && typeof data === 'string') {
		data = JSON.parse(data);
	}

	return module.exports[method](options.url, data, null, function(evt) {
		var fakeXHR = { setRequestHeader: function() {} }
		if (evt.success) {
			options.success(evt.result, 'success', fakeXHR);
		} else {
			fakeXHR.evt = evt;
			options.error(fakeXHR, evt.description, evt);
		}
	});
}

function _ensureSocketConnected(context, method, args) {
	if (window.socketStatus !== socketConnected) {
		setTimeout(function() {
			method.apply(context, args);
			context = method = args = null;
		}, 250);
		return false;
	}
	return true;
}

function _restoreSubscriptions() {
	restoreSubscriptionsTimeout = null;
	for (var key in socketSubscriptions) {
		if (socketSubscriptions.hasOwnProperty(key)) {
			var tuple = key.split('&&'),
				where = tuple[0],
				event = tuple[1],
				callback = socketSubscriptions[key];
			callback && subscribe(where, event, callback);
		}
	}
}

function subscribe(where, event, callback) {
	if (!_ensureSocketConnected(this, subscribe, arguments)) {
		// try again after a little bit
		setTimeout(function() {
			subscribe(where, event, callback);
		}.bind(this), 1000);
		return;
	}

	socketSubscriptions[where + '&&' + event] = callback;
	window.socket.emit('subscribe', {
		where: where,
		event: event
	});
}

function _message(args) {
	var fn = socketSubscriptions[args.where + '&&' + args.event];
	fn && fn();
}

function unsubscribe(where, event) {
	if (!_ensureSocketConnected(this, unsubscribe, arguments)) {
		return;
	}

	socketSubscriptions[where + '&&' + event] = null;
	window.socket.emit('unsubscribe', {
		where: where,
		event: event
	});
}

/**
 * this is the method that every request will go through
 *
 * @author Tim Golen 2014-12-25
 *
 * @param  {string} method the HTTP method we are making to the API
 *
 * @return {void}
 */
function curryMethod(method) {
	return function (url, data, options, callback) {
		if (_.isFunction(options)) {
			callback = options;
			options = undefined;
		}
		if (!options) {
			options = {};
		}
		if (_.isFunction(data)) {
			callback = data;
			data = undefined;
		}

		if (!options.disallowSocket && window.socketStatus === socketConnected) {
			// We've got a socket! Emit to it.
			window.socket.emit('api', {
				method: method,
				url: url,
				data: data
			}, function(data) {
				if (callback) {
					callback(data);
				}
			});
			// And stop execution.
			return;
		}

		var req = {
			type: method,
			url: url,
			data: data,
			headers: {}
		};
		if (!callback) {
			req.headers['use-bare-response'] = true;
		}

		var ajax = $.ajax(req);
		if (callback) {
			ajax.done(function(data) {
				if (data.jsonh) {
					data.result = jsonh.unpack(data.result);
				}
				callback(data);
			});
			ajax.fail(function(data) {
				try {
					data = {
						success: false,
						code: data.status,
						result: JSON.parse(data.responseText).message
					};
				}
				catch (e) {}
				callback(data);
			});
		}
	};
}