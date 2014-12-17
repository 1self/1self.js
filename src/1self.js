(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.OneSelf = factory();
    }
}(this, function(context) {
    'use strict';

    var API_ENDPOINT = "http://api-staging.1self.co";

    var lib1self = function(config) {
        this.TYPE_COUNT = 0;
        this.TYPE_SUM = 1;
        this.config = config || {
            'eventData': {}
        };
        return this;
    };

    lib1self.prototype.configure = function(data) {
        var self = this;
        if (typeof data !== 'undefined') {
            Object.keys(data).forEach(function(key) {
                self.config[key] = data[key];
            });
        }
        return this.config;
    };

    lib1self.prototype.registerStream = function() {
        if (!this.config.appId || !this.config.appSecret) {
            throw new Error("Set appId and appSecret");
        }

        var self = this;

        var promise = new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();

            req.open("POST", API_ENDPOINT + "/v1/streams", true);
            req.setRequestHeader("Authorization", self.config.appId + ":" + self.config.appSecret);
            req.onload = function() {
                if (req.readyState == 4 && req.status == 200) {
                    var response = JSON.parse(req.response);
                    self.config['streamid'] = response.streamid;
                    self.config['readToken'] = response.readToken;
                    self.config['writeToken'] = response.writeToken;

                    resolve(req.responseText);
                } else {
                    reject(new Error(req.statusText));
                }
            };
            req.onerror = function() {
                reject(Error("Network Error"));
            };

            req.send();
        });
        return promise;
    };

    lib1self.prototype.setObjectTags = function(object_tags) {
        if (!object_tags.length) {
            throw new Error("Invalid tag specification");
        }
        if(!this.config.eventData) this.config.eventData = {};
        this.config.eventData.object_tags = object_tags;
    }

    lib1self.prototype.setActionTags = function(action_tags) {
        if (!action_tags.length) {
            throw new Error("Invalid tag specification");
        }
        if(!this.config.eventData) this.config.eventData = {};
        this.config.eventData.action_tags = action_tags;
    }

    lib1self.prototype.sendEvent = function(data, ISOdateTimeString) {
        if (!this.config.streamid || !this.config.eventData || !this.config.eventData.action_tags || !this.config.eventData.object_tags) {
            throw new Error("Requires streamid, object tags and action tags to be set");
        }

        if (!ISOdateTimeString) {
            ISOdateTimeString = (new Date()).toISOString();
        }

        var self = this;
        var promise = new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            var url = API_ENDPOINT + "/v1/streams/" + self.config.streamid + "/events/";

            var event = {
                "dateTime": ISOdateTimeString,
                "source": self.config.appName,
                "version": self.config.appVersion,
                "objectTags": self.config.eventData.object_tags,
                "actionTags": self.config.eventData.action_tags,
                "properties": data
            };

            req.open("POST", url, true);
            req.setRequestHeader("Authorization", self.config.writeToken);
            req.setRequestHeader("Content-Type", "application/json");

            req.onload = function() {
                if (req.readyState == 4 && req.status == 200) {
                    resolve(req.responseText);
                } else {
                    reject(new Error(req.statusText));
                }
            };
            req.onerror = function() {
                reject(Error("Network Error"));
            };

            req.send(JSON.stringify(event));
        });
        return promise;
    }

    lib1self.prototype.getBarchartURL = function(operation, property) {
        if (!this.config.streamid || !this.config.eventData.action_tags || !this.config.eventData.object_tags) {
            throw new Error("Requires streamid, object tags and action tags to be set");
        }

        var stringifyTags = function(tags) {
            var str = "";
            tags.forEach(function(tag){
                str += tag + ',';
            });
            return str.slice(0,-1);
        }

        var object_tags_str = stringifyTags(this.config.eventData.object_tags);
        var action_tags_str = stringifyTags(this.config.eventData.action_tags);

        if(operation === this.TYPE_COUNT) {
            return API_ENDPOINT + "/v1/streams/" + this.config.streamid + "/events/" + object_tags_str + "/" + action_tags_str + "/count/daily/barchart";
        } else if(operation === this.TYPE_SUM) {
            if (typeof property === 'undefined') {
                throw new Error("property not specified");
            }
            return API_ENDPOINT + "/v1/streams/" + this.config.streamid + "/events/" + object_tags_str + "/" + action_tags_str + "/sum("+ property +")/daily/barchart";
        }
    }

    return lib1self;
}));