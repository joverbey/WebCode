function Socket(url) {
    this.events = {};
    var parent = this;

    this.on = function(event, func) {
        parent.events[event] = func;
    };

    var eventHandler = function(event) {
        var data = JSON.parse(event.data);
        if (data.eventType in parent.events) {
            parent.events[data.eventType](data.data);
        }
    };

    this.send = function(type, event) {
        if (parent.ws.readyState == 1) {
            var string = JSON.stringify({'eventType': type, 'data': event});
            parent.ws.send(string);
        }
    };

    this.refresh = function() {
        parent.ws = new WebSocket(url);

        parent.ws.onmessage = eventHandler;

        parent.ws.onclose = function(event) {
            if ('close' in parent.events) {
                parent.events.close({});
            }
        };

        parent.ws.onopen = function(event) {
            if ('open' in parent.events) {
                parent.events.open({});
            }
        };
    };
    this.refresh();
}
