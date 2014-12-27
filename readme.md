# Skelenode API

This is a common js library that will allow you to make standard HTTP requests using either XHR or web sockets (socket.io) to a skelenode server. The library will make web sockets requests by default and will patch Backbone to use this same request library. If the socket connection drops, the library will fall back to XHR. This is an easy way to get Backbone models and collections to communicate with the server with web sockets, without having to maintain a separate API structure on the server (one for XHR requests and one for socket requests).

In addition to making standard HTTP requests to the server, you can also use this to subscribe to server emitted events. For example, if you have a list of notifications, you can listen to an event called 'change:notification'. When a new notification is added on the server, it will emit the 'change:notification' event. The client will receive the event and can then pull a new list of notifications from the server.

# Requirements
* You must have a server running with the Skelenode Socket package.
* Your server API will need to respond to all requests in the same format. You get this for free if you are using Skelenode Models.
```
{
  success: true|false,
  code: 200|404|ect.,
  result: { ...whatever... }
}
```

# Usage
Include the library and create a connection:
```
API = require('skelenode-xhr-socket');

API.connect(function() {
	console.log('socket connected!');
});
```

Make a GET request to your API
```
API.get('/api/v1/hello/world', function(data) {
	console.log(data);
});
```

