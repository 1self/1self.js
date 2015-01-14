(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.lib1self = factory();
    }
}(this, function(context) {
    'use strict';

    var API_ENDPOINT = "https://api-staging.1self.co";

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    function showPosition(position) {
        window.latitude = position.coords.latitude;
        window.longitude = position.coords.longitude;
    }

    window.addEventListener('load', getLocation, false);

    var loadConfig = function() {
        return JSON.parse(window.localStorage.config);
    };

    var loadJSON = function(key) {
        try {
            return JSON.parse(window.localStorage[key]);
        } catch (e) {
            return {};
        }
    };

    var queue = function() {
        var stored = loadJSON('1self');
        if (typeof stored.events === 'undefined') {
            stored.events = [];
        }
        return stored;
    }();

    var saveJSON = function(obj, key) {
        window.localStorage[key] = JSON.stringify(obj);
    };

    var queueEvent = function(event) {
        queue.events.push(event);
        saveJSON(queue, '1self');
    };

    var lock = false;
    var sendEventQueue = function(callback) {
        var doCallback = function(e){
            if(callback) callback(e);
        };

        if (!lock) {
            var queuelength = 0;
            var config = loadConfig();

            if (typeof config.streamid !== 'undefined') {
                var event_api_endpoint = API_ENDPOINT + "/v1/streams/" + config.streamid + "/events/batch";

                var req = new XMLHttpRequest();
                req.open("POST", event_api_endpoint, true);

                var headers = {
                    "Authorization": config.writeToken,
                    "Content-Type": "application/json"
                };
                var keys = Object.keys(headers);
                keys.forEach(function(key) {
                    req.setRequestHeader(key, headers[key]);
                });

                req.onload = function() {
                    if (req.readyState == 4 && req.status == 200) {
                        queue.events = queue.events.slice(queuelength);
                        saveJSON(queue, '1self');
                        doCallback(true);
                    } else {
                        doCallback(false);
                        console.log(new Error(req.statusText + "\n" + req.responseText));
                    }
                    lock = false;
                };

                req.onerror = function() {
                    console.log(new Error("Network Error"));
                    lock = false;
                    doCallback(false);
                };

                queuelength = queue.events.length;
                if (queuelength > 0) {
                    lock = true;
                    req.send(JSON.stringify(queue.events.slice(0,queuelength)));
                } else {
                    doCallback(false);
                }
            }
        }
    };

    var poller = function() {
        console.log("Start poller");
        var initialTimeout = 1000,
            delta = 1 * 1000,
            interval = null;

        var timeout = initialTimeout;
        var poll = function() {
            sendEventQueue(function(sent) {
                if (sent) {
                    clearInterval(interval);
                    timeout = initialTimeout;
                    console.log("Sent!");
                } else {
                    clearInterval(interval);
                    timeout = timeout + delta;
                    console.log("Not sent :(");
                }
                console.log("Timeout: " + timeout);
                interval = setInterval(poll, timeout);
            })
        };
        interval = setInterval(poll, initialTimeout);
    };

    var lib1self = function(config) {
        this.OBJECT_TAGS = [];
        this.ACTION_TAGS = [];

        if (!window.localStorage.config) {
            window.localStorage.config = "{}";
        }

        var saved_config = loadConfig();
        if (typeof config === 'object') {
            var keys = Object.keys(config);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                saved_config[key] = config[key];
            }
        }

        window.localStorage.config = JSON.stringify(saved_config);
        this.config = saved_config;

        poller();
        return this;
    };

    lib1self.prototype.loadConfig = function() {
        this.config = loadConfig();
        return this.config;
    };

    lib1self.prototype.saveConfig = function() {
        window.localStorage.config = JSON.stringify(this.config);
        return this;
    }

    lib1self.prototype.configure = function(data) {
        var self = this;
        if (typeof data !== 'undefined') {
            Object.keys(data).forEach(function(key) {
                self.config[key] = data[key];
            });
        }
        this.saveConfig();
        return this;
    };

    lib1self.prototype.registerStream = function(callback) {
        if (typeof this.config.streamid !== 'undefined') {
            callback(this.config);
            return this;
        }

        if (!this.config.appId || !this.config.appSecret) {
            throw new Error("Set appId and appSecret");
        }

        var self = this;

        var req = new XMLHttpRequest();

        req.open("POST", API_ENDPOINT + "/v1/streams", true);
        req.setRequestHeader("Authorization", self.config.appId + ":" + self.config.appSecret);
        req.onload = function() {
            if (req.readyState == 4 && req.status == 200) {
                var response = JSON.parse(req.response);
                self.configure({
                    'streamid': response.streamid
                });
                self.configure({
                    'readToken': response.readToken
                });
                self.configure({
                    'writeToken': response.writeToken
                });

                if (callback) {
                    callback(response);
                }

            } else {
                console.log(new Error(req.statusText));
                callback(null);
            }
        };
        req.onerror = function() {
            console.log(Error("Network Error"));
            callback(null);
        };
        req.send();
        return this;
    };


    lib1self.prototype.sendEvent = function(event, callback) {

        if (!event.dateTime) {
            event.dateTime = (new Date()).toISOString();
        }

        if(typeof this.config.appName === 'undefined') {
            callback(new Error("appName not configured"));
            return this;
        }

        if(typeof this.config.appVersion === 'undefined') {
            callback(new Error("appVersion not configured"));
            return this;
        }

        event.source = this.config.appName;
        event.version = this.config.appVersion;

        if (!event.actionTags && this.ACTION_TAGS.length > 0) {
            event.actionTags = this.ACTION_TAGS;
        }

        if (!event.objectTags && this.OBJECT_TAGS.length > 0) {
            event.objectTags = this.OBJECT_TAGS;
        }

        if (typeof window.latitude !== 'undefined') {
            event.location = {
                "lat": window.latitude,
                "long": window.longitude
            };
        }


        var headers = {
            "Authorization": this.config.writeToken,
            "Content-Type": "application/json"
        };

        queueEvent(event);
        sendEventQueue(callback);

        return this;
    };

    lib1self.prototype.objectTags = function(tags) {
        this.OBJECT_TAGS = tags;
        return this;
    };

    lib1self.prototype.actionTags = function(tags) {
        this.ACTION_TAGS = tags;
        return this;
    };

    lib1self.prototype.sum = function(property) {
        this.FUNCTION_TYPE = 'sum(' + property + ')';
        this.SELECTED_PROP = property;
        return this;
    };

    lib1self.prototype.count = function() {
        this.FUNCTION_TYPE = 'count';
        return this;
    };

    lib1self.prototype.barChart = function() {
        this.CHART_TYPE = 'barchart';
        return this;
    }

    lib1self.prototype.json = function() {
        this.CHART_TYPE = 'type/json';
        return this;
    };

    lib1self.prototype.url = function() {
        //Check
        if (this.OBJECT_TAGS.length == 0 || this.ACTION_TAGS.length == 0 || !this.config.streamid || !this.FUNCTION_TYPE || !this.CHART_TYPE) {
            throw (new Error("Can't construct URL"));
        }

        var stringifyTags = function(tags) {
            var str = "";
            tags.forEach(function(tag) {
                str += tag + ',';
            });
            return str.slice(0, -1);
        }

        var object_tags_str = stringifyTags(this.OBJECT_TAGS);
        var action_tags_str = stringifyTags(this.ACTION_TAGS);

        var url = API_ENDPOINT + "/v1/streams/" + this.config.streamid + "/events/" + object_tags_str + "/" + action_tags_str + "/" + this.FUNCTION_TYPE + "/daily/" + this.CHART_TYPE;
        return url;
    };

    return lib1self;
}));