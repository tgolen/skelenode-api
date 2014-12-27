# Skelenode API

This is a client-side common js library that will allow you to make standard HTTP requests using either XHR or web sockets (socket.io) to a skelenode server. The library will make web sockets requests by default and will patch Backbone to use this same request library. If the socket connection drops, the library will fall back to XHR. This is an easy way to get Backbone models and collections to communicate with the server with web sockets, without having to maintain a separate API structure on the server (one for XHR requests and one for socket requests).

In addition to making standard HTTP requests to the server, you can also use this to subscribe to server emitted events. For example, if you have a list of notifications, you can listen to an event called 'change:notification'. When a new notification is added on the server, it will emit the 'change:notification' event. The client will receive the event and can then pull a new list of notifications from the server.

Make the same server request using either method and maintain only a single API endpoint on the server.
```
      /---- Web Socket ----\
client                      server
      \---- XHR -----------/
```


# Requirements
* You must have a server running with the Skelenode Socket package.
* Your server API will need to respond to all requests in the same format. You get this for free if you are using Skelenode Models.
```javascript
{
  success: true|false,
  code: 200|404|ect.,
  result: { ...whatever... }
}
```

# Installation
```
bower install skelenode-api
```

# Usage
Include the library and create a connection:
```javascript
API = require('skelenode-xhr-socket');

// connect
API.connect(function() {
	console.log('socket connected!');
});

// make a GET request to your API
API.get('/api/v1/hello/world', function(data) {
	console.log(data);
});
```

## Methods

### connect(callback)
Connects to the web socket. The callback is called after the connection is successful. If the socket drops, it will automatically restore any event subscriptions.

### get(url, [data, options,] callback)
Makes an HTTP `GET` request with the optional `options` object which will be passed through to the jQuery `ajax()` method. The callback is called with a single argument of the data returned from the API. See [options](#options).

The `data` argument is not used for this method, so if you want to pass options, you will need to set the data argument to null.
```javascript
API.get('/api/v1/hello/world2', null, {}, function(data) {
	console.log(data);
});
```

### remove(url, [data, options,] callback)
Makes an HTTP `DELETE` request with the optional `options` object which will be passed through to the jQuery `ajax()` method. The callback is called with a single argument of the data returned from the API. See [options](#options).
```javascript
API.remove('/api/v1/hello/world2', null, {}, function(data) {
	console.log(data);
});
```

### post(url, [data, options,] callback)
Makes an HTTP `POST` request passing the optional `data` object and the optional `options` object which will be passed through to the jQuery `ajax()` method. The callback is called with a single argument of the data returned from the API. See [options](#options).
```javascript
API.post('/api/v1/hello/world2', { name: 'test' }, {}, function(data) {
	console.log(data);
});
```

### put(url, [data, options,] callback)
Makes an HTTP `PUT` request passing the optional `data` object and the optional `options` object which will be passed through to the jQuery `ajax()` method. The callback is called with a single argument of the data returned from the API. See [options](#options).
```javascript
API.put('/api/v1/hello/world2', { name: 'test' }, {}, function(data) {
	console.log(data);
});
```

### subscribe(where, event, callback)
Subscribes to a server emitted event for the client-side location of `where` for the name of the `event`. The callback is called with no arguments when the server emits the same `event` name. `where` needs to be unique and is used so that multiple areas of the client can listen to the same event but receive separate callbacks.
```javascript
API.subscribe('example', 'hello-world-event', function() {
	console.log('recieved hello-world-event!');
});
```

### unsubscribe(where, event)
Unsubscribes for the location of `where` for the name of the `event`.
```javascript
API.unsubscribe('example', 'hello-world-event');
```

## Options
The options are the same as the options passed to [jQuery.ajax()](http://api.jquery.com/jquery.ajax/). There is an additional option that you can set for `{ disallowSocket: true }` in order to force a request to be made via XHR.

Example:
```javascript
// make a request only using XHR
API.get('/api/v1/hello/world2', null, { disallowSocket:true }, function(data) {
	console.log(data);
});
```
