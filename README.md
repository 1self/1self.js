---
title: Getting started
anchor: getting-started
---

1self.js Documentation
----------------------

###Include 1self.js

We need to include the 1self.js library on the page. The library occupies a global variable of `Lib1self`.

```html
<script src="1self.js"></script>
```
###Creating a library instance

First, we need to provide the initial configuration the 1self needs. **All fields are compulsory**. 

```javascript
var config = {
    "appName": 'Ex. Hello, 1self',
    "appVersion": 'Ex. 1.0.0',
    "appId": "[As provided]",
    "appSecret": "[As provided]"
}
```

```javascript
var oneself = new Lib1self(config);
```

### Registering a stream
Streams are a logical collection of events on the 1self API. They provide a place to read and write events for applications and integrations. They control event access and coordinate integration synchronization.

```
Method: registerStream
Params: callback(response)
Return: self
```
```javascript
oneself.registerStream(function(response){
	/** 
	response = {
		streamid: '...',
		readToken: '...',
		writeToken: '...'
	}
	OR
	response = null
	*/
})
```

The response object needs to be saved as they are needed for API calls. A `null` is returned in case of an error.

### Events
#### Setting properties
Events are transported as a JSON object. Data to be recorded is sent as properties of an event. 
```javascript
var event = {
	...
	properties: {
		property1: value,
		property2: value,
		...
		}
	}
```

####Setting Object tags
Object tags are specified using a string array of tags. They may set individually for each event, or specified using the ```objectTags``` method.
```
Method: objectTags
Params: array: String
Return: self
```
Example:
```javascript
oneself.objectTags(['self', 'sound'])
```
OR
```javascript
var event = {
	...
	objectTags: [...],
	properties: {
		...
		}
	}
```  

####Setting Action tags
Action tags are specified using a string array of tags. They may set individually for each event, or specified using the ```actionTags``` method.
```
Method: actionTags
Params: array: String
Return: self
```
Example:
```javascript
oneself.actionTags(['measure', 'sample'])
```
OR
```javascript
var event = {
	...
	actionTags: [...],
	properties: {
		...
		}
	}
```  


####Setting event dateTime
The timestamp has to be specified as an ISO 8601 standard string. If not explicitly set as a property of the event JSON object, it will be implicitly set as the time the event was sent.

Example:
```javascript
var event = {
	...
	dateTime: "2015-01-19T08:56:51.559Z",
	objectTags: [...],
	actionTags: [...],
	properties: {
		...
		}
	}
```  

####Sending the event
The ```sendEvent``` or ```sendEvents``` methods may be used to send an event object to the 1self platform. 
If a connection can't be established, the event is queued to be sent when connection is restored. Event handlers (if specified) are triggered on success or failure.

```
Method: sendEvent
Params: event: JSON object
Return: self
```

```
Method: sendEvents
Params: array: event JSON object
Return: self
```

**Event Handlers**

Property:  ```onsendsuccess```
Called when events are successfully sent to the platform.

Property: ```onsenderror```
Called when event sending to the platform failed.