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

    var lib1self = function(config) {
        this.OBJECT_TAGS = [];
        this.ACTION_TAGS = [];

        if(!window.localStorage.config) {
            window.localStorage.config = "{}";
        }

        var saved_config = JSON.parse(window.localStorage.config);
        if(typeof config === 'object') {
            var keys = Object.keys(config);
            for(var i = 0; i < keys.length; i++){
                var key = keys[i];
                saved_config[key] = config[key];
            }   
        }

        window.localStorage.config = JSON.stringify(saved_config);
        this.config = saved_config;
        return this;
    };

    lib1self.prototype.saveConfig = function(){
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
                self.configure({'streamid': response.streamid});
                self.configure({'readToken': response.readToken});
                self.configure({'writeToken': response.writeToken});

                callback(response);
            } else {
                throw (new Error(req.statusText));
            }
        };
        req.onerror = function() {
            throw (Error("Network Error"));
        };
        req.send();
        return this;
    };

    lib1self.prototype.send = function(event, callback) {

        var self = this;
        var sendEvent = function() {
            if (!event.dateTime) {
                event.dateTime = (new Date()).toISOString();
            }

            if(!event.actionTags && this.ACTION_TAGS.length > 0) {
                event.actionTags = this.ACTION_TAGS;
            }

            if(!event.objectTags && this.OBJECT_TAGS.length > 0) {
                event.objectTags = this.OBJECT_TAGS;
            }

            if(typeof window.latitude !== 'undefined'){
                event.location = {
                    "lat": window.latitude,
                    "long": window.longitude
                };
            }

            var req = new XMLHttpRequest();
            var url = API_ENDPOINT + "/v1/streams/" + self.config.streamid + "/events/";

            req.open("POST", url, true);
            req.setRequestHeader("Authorization", self.config.writeToken);
            req.setRequestHeader("Content-Type", "application/json");

            req.onload = function() {
                if (req.readyState == 4 && req.status == 200) {
                    if(callback){
                        callback(req.responseText);
                    }
                } else {
                    throw (new Error(req.statusText));
                }
            };
            req.onerror = function() {
                throw (Error("Network Error"));
            };

            req.send(JSON.stringify(event));
        };

        var streamid = this.config.streamid;
        if (!streamid) {
            this.registerStream(function(response) {
                streamid = response.streamid;
                sendEvent();
            })
        } else {
            sendEvent();
        }
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
        if(this.OBJECT_TAGS.length == 0 || this.ACTION_TAGS.length == 0 || !this.config.streamid || !this.FUNCTION_TYPE || !this.CHART_TYPE) {
            throw (new Error("Can't construct URL"));
        }

        var stringifyTags = function(tags) {
            var str = "";
            tags.forEach(function(tag){
                str += tag + ',';
            });
            return str.slice(0,-1);
        }

        var object_tags_str = stringifyTags(this.OBJECT_TAGS);
        var action_tags_str = stringifyTags(this.ACTION_TAGS);

        var url = API_ENDPOINT + "/v1/streams/" + this.config.streamid + "/events/" + object_tags_str + "/" + action_tags_str + "/" + this.FUNCTION_TYPE + "/daily/" + this.CHART_TYPE;
        return url;
    };

    return lib1self;
}));