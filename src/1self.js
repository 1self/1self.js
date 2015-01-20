(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.Lib1self = factory();
    }
}(this, function (context) {
    'use strict';

    var API_ENDPOINT = "http://sandbox.1self.co";
    var endpoints = {
        'sandbox': "http://sandbox.1self.co",
        'production': "https://api.1self.co"
    };
    var lock = false;
    var config = {};

    function showPosition(position) {
        window.latitude = position.coords.latitude;
        window.longitude = position.coords.longitude;
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.info("Geolocation is not supported by this browser.");
        }
    }

    var loadJSON = function (key) {
        return JSON.parse(window.localStorage[key] || '{}');
    };

    var queue = function () {
        var stored = loadJSON('1self');
        if (typeof stored.events === 'undefined') {
            stored.events = [];
        }
        return stored;
    }();

    var saveJSON = function (key, obj) {
        window.localStorage[key] = JSON.stringify(obj);
    };

    var constructEvent = function (event) {

        if (!event.dateTime) {
            event.dateTime = (new Date()).toISOString();
        }

        event.source = config.appName;
        event.version = config.appVersion;

        if (!event.actionTags && ACTION_TAGS.length > 0) {
            event.actionTags = ACTION_TAGS;
        }

        if (!event.objectTags && OBJECT_TAGS.length > 0) {
            event.objectTags = OBJECT_TAGS;
        }

        if (typeof window.latitude !== 'undefined') {
            event.location = {
                "lat": window.latitude,
                "long": window.longitude
            };
        }
        return event;
    };

    var queueEvent = function (event) {
        queue.events.push(event);
        saveJSON('1self', queue);
    };

    var sendEventQueue = function (successCallback, failureCallback) {
        if (!lock) {
            var queuelength = 0;

            if (typeof config.streamid !== 'undefined') {
                var event_api_endpoint = API_ENDPOINT + "/v1/streams/" + config.streamid + "/events/batch";

                var req = new XMLHttpRequest();
                req.open("POST", event_api_endpoint, true);

                var headers = {
                    "Authorization": config.writeToken,
                    "Content-Type": "application/json"
                };
                var keys = Object.keys(headers);
                keys.forEach(function (key) {
                    req.setRequestHeader(key, headers[key]);
                });

                req.onload = function () {
                    if (req.readyState == 4 && req.status == 200) {
                        queue.events = queue.events.slice(queuelength);
                        saveJSON('1self', queue);
                        if (successCallback) {
                            successCallback();
                        }
                    } else {
                        if (failureCallback) {
                            failureCallback();
                        }
                        //console.log(new Error(req.statusText + "\n" + req.responseText));
                    }
                    lock = false;
                };

                req.onerror = function () {
                    //console.log(new Error("Network Error"));
                    lock = false;
                    if (failureCallback) {
                        failureCallback();
                    }
                };

                queuelength = queue.events.length;
                if (queuelength > 0) {
                    lock = true;
                    req.send(JSON.stringify(queue.events.slice(0, queuelength)));
                } else {
                    // if (failureCallback) {
                    //     failureCallback();
                    // }
                }
            }
        }
    };

    var poller = function (self) {
        var initialTimeout = 1000,
            delta = 1 * 1000,
            interval = null;

        var timeout = initialTimeout;
        var poll = function () {
            sendEventQueue(function () {
                clearInterval(interval);
                timeout = initialTimeout;
                interval = setInterval(poll, timeout);
                if (self.onsendsuccess) {
                    self.onsendsuccess();
                }
            }, function () {
                clearInterval(interval);
                timeout = timeout + delta;
                interval = setInterval(poll, timeout);
                if (self.onsenderror) {
                    self.onsenderror();
                }
            });
        };
        interval = setInterval(poll, initialTimeout);
    };

    var Lib1self = function (_config, endpoint) {

        if (typeof _config.appName === 'undefined') {
            throw (new Error("appName not configured"));
        }

        if (typeof _config.appVersion === 'undefined') {
            throw (new Error("appVersion not configured"));
        }

        if (typeof _config.appId === 'undefined') {
            throw (new Error("appId not configured"));
        }

        if (typeof _config.appSecret === 'undefined') {
            throw (new Error("appSecret not configured"));
        }

        if (endpoint) {
            if (endpoints[endpoint]) {
                API_ENDPOINT = endpoints[endpoint];
            }
        }

        config = _config;
        this.OBJECT_TAGS = [];
        this.ACTION_TAGS = [];
        this.BACKGROUND_COLOR = "";
        this.onsendsuccess = null;
        this.onsenderror = null;
        if (!window.localStorage['1self']) {
            saveJSON('1self', {'events': []});
        }

        var storedConfig = loadJSON('config');
        if (storedConfig.streamid) {
            config.streamid = storedConfig.streamid;
        }
        if (storedConfig.writeToken) {
            config.writeToken = storedConfig.writeToken;
        }


        window.addEventListener('load', getLocation, false);
        poller(this);
        return this;
    };

    Lib1self.prototype.registerStream = function (callback) {

        if (!config.appId || !config.appSecret) {
            throw new Error("Set appId and appSecret");
        }

        var req = new XMLHttpRequest();

        req.open("POST", API_ENDPOINT + "/v1/streams", true);
        req.setRequestHeader("Authorization", config.appId + ":" + config.appSecret);
        req.onload = function () {
            if (req.readyState == 4 && req.status == 200) {
                var response = JSON.parse(req.response);
                callback(response);

            } else {
                //console.log(new Error(req.statusText));
                callback(null);
            }
        };
        req.onerror = function () {
            //console.log(Error("Network Error"));
            callback(null);
        };
        req.send();
        return this;
    };

    Lib1self.prototype.sendEvent = function (event, streamid, writeToken, callback) {
        if (!writeToken || !streamid) {
            console.log(new Error("streamid, writeToken needs to be specified"));
            callback(false);
            return this;
        }

        if (typeof event !== 'object' || typeof event.length === 'number') {
            console.log(new Error("Event type error"));
            callback(false);
            return this;
        }

        config.streamid = streamid;
        config.writeToken = writeToken;
        saveJSON('config', config);
        constructEvent(event);
        queueEvent(event);

        sendEventQueue(this.onsendsuccess, this.onsenderror);
        callback(true);
        return this;
    };

    Lib1self.prototype.backgroundColor = function (backgroundColor) {
        this.BACKGROUND_COLOR = backgroundColor;
        return this;
    };

    Lib1self.prototype.sendEvents = function (events, streamid, writeToken, callback) {
        if (!writeToken) {
            console.log(new Error("streamid, writeToken needs to be specified"));
            callback(false);
            return this;
        }

        if (typeof events !== 'object' || typeof events.length === 'undefined') {
            console.log(new Error("Event type error"));
            callback(false);
            return this;
        }

        events.forEach(function (event) {
            constructEvent(event, config);
            queueEvent(event);
        });

        config.streamid = streamid;
        config.writeToken = writeToken;
        saveJSON('config', config);
        sendEventQueue(this.onsendsuccess, this.onsenderror);
        callback(true);
        return this;
    };

    Lib1self.prototype.synchronize = function () {
        sendEventQueue(this.onsendsuccess, this.onsenderror);
        return this;
    };

    Lib1self.prototype.pendingEventsCount = function () {
        return loadJSON('1self').events.length;
    };

    Lib1self.prototype.visualize = function (streamid, readToken) {
        config.streamid = streamid;
        config.readToken = readToken;
        return this;
    };

    Lib1self.prototype.objectTags = function (tags) {
        this.OBJECT_TAGS = tags;
        return this;
    };

    Lib1self.prototype.actionTags = function (tags) {
        this.ACTION_TAGS = tags;
        return this;
    };

    Lib1self.prototype.sum = function (property) {
        this.FUNCTION_TYPE = 'sum(' + property + ')';
        this.SELECTED_PROP = property;
        return this;
    };

    Lib1self.prototype.mean = function (property) {
        this.FUNCTION_TYPE = 'mean(' + property + ')';
        this.SELECTED_PROP = property;
        return this;
    };

    Lib1self.prototype.count = function () {
        this.FUNCTION_TYPE = 'count';
        return this;
    };

    Lib1self.prototype.barChart = function () {
        this.CHART_TYPE = 'barchart';
        return this;
    };

    Lib1self.prototype.json = function () {
        this.CHART_TYPE = 'type/json';
        return this;
    };

    Lib1self.prototype.url = function () {
        //Check
        if (this.OBJECT_TAGS.length == 0 || this.ACTION_TAGS.length == 0 || !config.streamid || !this.FUNCTION_TYPE || !this.CHART_TYPE) {
            throw (new Error("Can't construct URL"));
        }

        var stringifyTags = function (tags) {
            var str = "";
            tags.forEach(function (tag) {
                str += tag + ',';
            });
            return str.slice(0, -1);
        };

        var object_tags_str = stringifyTags(this.OBJECT_TAGS);
        var action_tags_str = stringifyTags(this.ACTION_TAGS);

        var url = API_ENDPOINT + "/v1/streams/" + config.streamid + "/events/" + object_tags_str + "/" + action_tags_str + "/" + this.FUNCTION_TYPE + "/daily/" + this.CHART_TYPE;

        if ((this.BACKGROUND_COLOR !== undefined) || (this.BACKGROUND_COLOR !== "")) {
            url = url + "?bgColor=" + this.BACKGROUND_COLOR;
        }

        return url;
    };

    return Lib1self;
}));
