// xhrIoManager for Ajax requests
xhrIoManager = new goog.net.XhrManager(
	1,		// Max. number of retries (Default: 1).
	null,	// Map of default headers to add to every request.
	1,		// Min. number of objects (Default: 1).
	10,		// Max. number of objects (Default: 10).
	2000	// Timeout (in ms) before aborting an attempt.
);

// setup TzTimes
originTime = null;
resultTime = null;

originTime = new filiph.TzTime();
originTime.registerXhrIoManager(xhrIoManager);
originTime.bindDomObjects(
	goog.dom.getElement("origin_time"), 
	goog.dom.getElement("origin_zone")
);

resultTime = new filiph.TzTime();
resultTime.registerXhrIoManager(xhrIoManager);
resultTime.bindDomObjects(
	goog.dom.getElement("result_time"), 
	goog.dom.getElement("result_zone")
);

// bind to each other
originTime.bindToOtherTzTime(resultTime);
resultTime.bindToOtherTzTime(originTime);
resultTime.isBoundSlave = true;

// dispose of event listeners on unload
goog.events.listen(window, goog.events.EventType.UNLOAD, function() {
	if (originTime) {
		originTime.dispose();
		originTime = null;
	}
	if (resultTime) {
		resultTime.dispose();
		resultTime = null;
	}
});

// start the page
goog.events.listen(window, goog.events.EventType.LOAD, function() {
	if (originTime && resultTime) {
		originTime.enableDomObjects();
		resultTime.enableDomObjects();
		
		//resultTime.tzOffset.el.focus();
		document.getElementById("loading").style.display = "none";
	}
});

goog.events.listen(document.getElementById("more-info-link"), goog.events.EventType.CLICK, function() {
	var moreinfoDiv = document.getElementById('more-info');
	var moreinfoArrow = document.getElementById('more-info-arrow');
    if (moreinfoDiv.clientHeight) {
		moreinfoDiv.style.height = 0;
		moreinfoArrow.innerHTML = "&darr;";
    } else {
    	var wrapper = document.getElementById('more-info-measuringWrapper');
    	moreinfoDiv.style.height = (wrapper.clientHeight + 20) + "px";
		moreinfoArrow.innerHTML = "&uarr;";
    }
});