1self.js Documentation
----------------------

###Include 1self.js

We need to include the 1self.js library on the page. The library occupies a global variable of `Lib1self`.

```html
<script src="1self.js"></script>
```
###Creating a library instance

First, we need to provide the initial configuration the 1self needs. **All fields are compulsory**. 

Example:
```javascript
var config = {
    "appName": 'Hello, 1self',
    "appVersion": '1.0.0',
    "appId": "[As provided]",
    "appSecret": "[As provided]"
}
```

```javascript
var oneself = new Lib1self(config);
```

### Registering a stream
Streams are a logical collection of events on the 1self API. They provide a place to read and write events for applications and integrations. They control event access and coordinate integration synchronization.

```javascript
Method: registerStream(callback)
Params: callback(response): function
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
```javascript
Method: objectTags(tags)
Params: tags: array of strings
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
```javascript
Method: actionTags(tags)
Params: tags: array of strings
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
Method: sendEvent(event, streamid, writeToken, callback)
Params: event: JSON object
		streamid: String
		writeToken: String
		callback: function
Return: self
```

```
Method: sendEvents(events, streamid, writeToken, callback)
Params: events: array of event JSON object
		streamid: String
		writeToken: String
		callback: function
Return: self
```

**Event Handlers**

Property:  ```onsendsuccess```
Called when events are successfully sent to the platform.

Property: ```onsenderror```
Called when event sending to the platform failed.

Example:
```javascript
oneself.onsendsuccess = function() {
	console.log("Events sent!");
}

oneself.onsenderror = function() {
	console.log("Events not sent :-( ");
}

oneself.sendEvent(event);
```

####Pending Events
1self.js will attempt to resend all failed attempts when a connection is restored. The ```pendingEventsCount``` method may be used to get a count of events queued up for the next send attempt.

```javascript
Method: pendingEventsCount()
Params: none
Return: Count of unsent events: Integer
```

Example:
```javascript
oneself.onsenderror = function() {
	var unsent = oneself.pendingEventsCount();
	console.log("Unsent count: " + unsent);
}
```

###Visualizing the data
####Setting a streamid and read token
The ```visualize``` method needs to be called in order to set parameters necessary for viewing a visualization.

```javascript
Method: visualize(streamid, readToken)
Params: streamid: string
		readToken: string
Return: Count of unsent events: Integer
```
####Setting object and action tags
Refer to the Events section.

####Selecting and operation
Use one of the following methods: ```sum```, ```mean```and ```count```

Set the visualization URL for a sum operation:
```javascript
Method: sum(property)
Params: property: string
Return: self
```
Set the visualization URL for a mean(average) operation:
```javascript
Method: mean(property)
Params: property: string
Return: self
```
Set the visualization URL for a count operation:
```javascript
Method: count()
Params: none
Return: self
```

####Selecting the URL type
Use one of the following: ```barChart``` or ```json```

To display a bar chart of the events:
```javascript
Method: barChart()
Params: none
Return: self
```

To display JSON data of the events:
```javascript
Method: json()
Params: none
Return: self
```

####Generating the URL
Use the ```url``` method to get the URL for the visualization 

```javascript
Method: url()
Params: none
Return: URL: String
```

###Using chaining to generate a URL
The above methods may be chained together for a convenient way to build a URL

Example:
```javascript
var vizUrl = oneself
         .visualize(streamid, readToken)
         .objectTags(helloWorldObjectTags)
         .actionTags(helloWorldActionTags)
         .sum("linesOfCode")
         .barChart()
         .url();
``` 