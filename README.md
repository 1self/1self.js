1self.js Documentation
----------------------

###Include 1self.js

We need to include the 1self.js library on the page. The library occupies a global variable of `Lib1selfClient`.

```html
<script src="1self.js"></script>
```
###Creating a library instance

First, we need to provide the initial configuration the 1self needs, and specify an ```endpoint```. **All fields are compulsory**. 

Example:
```javascript
var config = {
    "appName": 'Hello, 1self',
    "appVersion": '1.0.0',
    "appId": "[As provided]",
    "appSecret": "[As provided]"
}
```
```
var endpoint = 'sandbox'
```
OR
```
var endpoint = 'production'
```

```javascript
var oneself = new Lib1selfClient(config, endpoint);
```

### Fetching a stream
Streams are a logical collection of events on the 1self API. They provide a place to read and write events for applications and integrations. They control event access and coordinate integration synchronization.

```javascript
Method: fetchStream(callback)
Params: callback(error, response): function
Return: self
```
```javascript
var stream;
oneself.fetchStream(function(error, response){
	if (!error) {
          stream = response;
          renderVizUrl(stream);
        } else {
	        //Handle error
        }
});
```

The response stream object needs to be saved as they are needed for API calls. A `null` is returned in case of an error.

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
Method: sendEvent(event, stream)
Params: event: JSON object
		stream: Stream object obtained from 'fetchStream'
Return: self or throws Error
```

```
Method: sendEvents(events, stream)
Params: events: array of event JSON object
		stream: Stream object obtained from 'fetchStream'
Return: self or throws Error
```

**Event Handlers**

Event handlers may be registered using the ```on``` method.

```
Method: on(event, eventHandler)
Params: event: Either 'senderror' or 'sendsuccess'
		eventHandler: function()
Return: none
```

Example:
```javascript
oneself.on('sendsuccess', function() {
	console.log("Events sent!");
});

oneself.on('senderror', function() {
	console.log("Events not sent :-( ");
});

oneself.sendEvent(event, stream);
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
OR

Set the visualization URL for a mean(average) operation:
```javascript
Method: mean(property)
Params: property: string
Return: self
```
OR

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

OR

To display JSON data of the events:
```javascript
Method: json()
Params: none
Return: self
```


####Setting the background color for the visualisation
Use the ```backgroundColor``` method to set the backgroundColor of visualization. 

```javascript
Method: backgroundColor(color)
Params: color: String (HEX code for the color without initial #)
Return: self
```

####Generating the URL
Use the ```url``` method to get the URL for the visualization 

```javascript
Method: url(stream)
Params: stream: stream object obtained from 'fetchStream'
Return: URL: String
```

###Using chaining to generate a URL
The above methods may be chained together for a convenient way to build a URL

Example:
```javascript
var vizUrl = oneself
         .objectTags(helloWorldObjectTags)
         .actionTags(helloWorldActionTags)
         .sum("linesOfCode")
         .barChart()
         .backgroundColor("99CC99")
         .url(stream);
``` 
