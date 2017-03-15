/**
 * @fileoverview Defines class TzTime that supports time conversion between
 * timezones and makes it easy to update form fields according to this.
 * Uses closure-library.
 *
 *
 * Live on http://tmzns.com

 * TODO: implicitní am/pm? (když člověk napíše "3")
 */


goog.provide('filiph.TzTime');

goog.require('filiph.tzdata');

goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.async.Delay');
goog.require('goog.ui.AutoComplete');
goog.require('goog.ui.AutoComplete.ArrayMatcher');
goog.require('goog.ui.AutoComplete.InputHandler');
goog.require('goog.ui.AutoComplete.Renderer');
goog.require('goog.net.XhrManager');

// init


// class TzTime

filiph.TzTime = function() {
	// Variables
	
	// string id
	this.idString = goog.string.getRandomString();
	
	// The time, in false local time. Ex.: If it's 9am in Prague (GMT+1), locTime will be 9am GMT.
	// This is because we do the timezone conversion ourselves, so we don't care about the "GMT+1" part.
	this.locTime = {
		"val" : null,			// false local time
		"inputVal" : null,		// current operating value
		"el" : null,			// DOM object
		"highlighter" : null	// class for highlighting
	};
	// Timezone offset, in minutes.
	this.tzOffset = {
		"val" : null,			// Timezone offset, in minutes
		"inputVal" : null,		// current operating value
		"el" : null,			// DOM object
		"highlighter" : null	// class for highlighting
	};
	
	// timezone data for the currently selected timezone and current time
	// previous and next are there so that we don't call for new Json every time the user changes dates

	this.timezone = {
		"previous" : null,
		"current" : null,
		/*	{
				"from": null,
				"to": null,
				"dst": null,
				"offset": null,
				"name": null
			} */
		"next" : null
	}

	// setup the current Date. Defaults to today, but can be changed to see time differences
	// in the future or in the past
	this.currentDate = new Date();
	this.currentDateValue = this.currentDate.valueOf();
	
	// references to other TzTime objects that need to be synchronized
	this.boundTzTimes = [];
	this.boundToOthers = false;
	// if set to True, changes to this TzT's timezone will not update the bound TzT, but instead update this TzT's time
	this.isBoundSlave = false;
	
	// XhrIo Manager to use for Ajax requests
	this.xhrIoManager = null;
	
	// TzTime has Eventhandler capability
	goog.events.EventHandler.call(this);
	
}
goog.inherits(filiph.TzTime, goog.events.EventHandler);


// TODO: make it more universal
filiph.TzTime.JSONSLOCATION = /*document.location.href +*/ "tzdata_2011j/tzdata/json/";

filiph.TzTime.MILLISECS_IN_HOUR = 1000 * 60 * 60;
filiph.TzTime.MILLISECS_IN_SECS = 1000;
filiph.TzTime.SECS_IN_HOUR = 60 * 60;
filiph.TzTime.MILLISECS_IN_MINUTE = 1000 * 60;

/**
 * Regular expression used for splitting a string into substrings of
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 */
filiph.TzTime.NUM_REGEX = /(\d+)|(\D+)/g;
	
// Lower case and trim whitespace. Util function.
filiph.TzTime.lowerCaseAndTrim = function(str) {
	return goog.string.collapseWhitespace(str.toLowerCase());
}
	
// gets human-provided time string and tries to convert to actual time
// returns null if string cannot be converted
filiph.TzTime.prototype.getLocTimeFromHumanInput = function(humanTime) {
	humanTime = filiph.TzTime.lowerCaseAndTrim(humanTime);
	
	var time = new Date();
	
	if (humanTime == "now") {
		// this is buggy!
		time.setTime(time.valueOf() - (time.getTimezoneOffset() * filiph.TzTime.MILLISECS_IN_MINUTE));
		// TODO: start updating the time periodically
	} else {
		var hours = null; var minutes = null; 
		if (humanTime == "noon") {
			hours = 12; minutes = 0;
		} else if (humanTime == "midnight") {
			hours = 0; minutes = 0;
		} else {
			var tokens = humanTime.match(filiph.TzTime.NUM_REGEX);
			
			// TODO: learn from human input - make the output similar
			
			if (tokens) {
				for (var i = 0; i < tokens.length; i++) {
					if (goog.string.isNumeric(tokens[i])) {
						if (hours == null) {
							hours = goog.string.toNumber(tokens[i]);
						} else if (minutes == null) {
							minutes = goog.string.toNumber(tokens[i]);
							break;
						}
					}
				}
			}
			
			if (goog.string.caseInsensitiveEndsWith(humanTime, "am") || goog.string.caseInsensitiveEndsWith(humanTime, "a.m.")) {
				if (hours == 12) {
					hours = 0;
				}
			} else if (goog.string.caseInsensitiveEndsWith(humanTime, "pm") || goog.string.caseInsensitiveEndsWith(humanTime, "p.m.")) {
				if (hours != 12) {
					hours = hours + 12;
				}
			}
		}
		
		// console.log("Hour: " + hours + " Minutes: " + minutes);
		
		// return null if invalid
		if (hours == null || hours > 24 || hours < 0 || minutes > 59 || minutes < 0) {
			return null;
		}
		
		if (minutes == null) { minutes = 0;	}

		time.setUTCHours(hours);
		time.setUTCMinutes(minutes);
		time.setUTCSeconds(0);
		time.setUTCMilliseconds(0);
	}
	return time;
}

// returns human readable String
filiph.TzTime.prototype.getHumanLocTime = function() {
	var hours = this.locTime.val.getUTCHours();
	var minutes = this.locTime.val.getUTCMinutes();
	var str = "";
	
	if (hours == 0 && minutes == 0) {
		return "midnight";
	}
	
	if (hours == 12 && minutes == 0) {
		return "noon";
	}
	
	var pm = (hours >= 12);
	
	if (pm) {
		hours = hours - 12;
	}
	
	if (hours == 0) { hours = 12; }
	
	str = str + hours;
	
	if (minutes > 0) {
		str = str + ":";
		if (minutes < 10) {	str = str + "0"; }
		str = str + minutes;
	}
	
	if (pm) {
		str = str + "pm";
	} else {
		str = str + "am";
	}
	
	return str;
}


filiph.TzTime.prototype.updateDomObjects = function() {
	var newHumanLocTime = this.getHumanLocTime();
	this.locTime.el.value = newHumanLocTime;
	this.locTime.inputVal = newHumanLocTime;
}

filiph.TzTime.prototype.updateFromTzTime = function(otherTzT) {
	var tzDifference = otherTzT.tzOffset.val - this.tzOffset.val;
	if (!goog.isDef(this.locTime.val) || goog.isNull(this.locTime.val)) {
		this.locTime.val = new Date();
	}
	this.locTime.val.setTime(otherTzT.locTime.val.valueOf() - (tzDifference * filiph.TzTime.MILLISECS_IN_SECS));
	
	this.updateDomObjects();
	filiph.TzTime.updateDomObjectStyle(this.locTime.el, true);
	if (goog.isDefAndNotNull(this.locTime.highlighter)) {
		this.locTime.highlighter.enable();
		this.locTime.highlighter.highlight();
	}
}

filiph.TzTime.prototype.updateBoundTzTimes = function() {
	if (this.boundToOthers) {
		for (var i=0; i < this.boundTzTimes.length; i++) {
			this.boundTzTimes[i].updateFromTzTime(this);
		}
	}
}

filiph.TzTime.prototype.updateThisSlaveTzT = function() {
	if (this.boundToOthers) {
		for (var i=0; i < this.boundTzTimes.length; i++) {
			if (!this.boundTzTimes[i].isBoundSlave) {
				this.updateFromTzTime(this.boundTzTimes[i]);
			}
		}
	}		
}

filiph.TzTime.CSS_VALID = "valid";
filiph.TzTime.CSS_INVALID = "invalid";

filiph.TzTime.updateDomObjectStyle = function(domObject, validity) {
	if (validity) {
		if (goog.dom.classes.has(domObject, filiph.TzTime.CSS_INVALID)) {
			goog.dom.classes.swap(domObject, filiph.TzTime.CSS_INVALID, filiph.TzTime.CSS_VALID);
		} else {
			goog.dom.classes.add(domObject, filiph.TzTime.CSS_VALID);
		}
	} else {
		if (goog.dom.classes.has(domObject, filiph.TzTime.CSS_VALID)) {
			goog.dom.classes.swap(domObject, filiph.TzTime.CSS_VALID, filiph.TzTime.CSS_INVALID);
		} else {
			goog.dom.classes.add(domObject, filiph.TzTime.CSS_INVALID);
		}
	}
}

// TODO: This is a hack. Make it using a class.

filiph.TzTime.CSS_COLOR_HILITE = "#59a074";
filiph.TzTime.CSS_COLOR_NORMAL = "#d0f9d5";

filiph.TzTime.highlightableDomObject = function(domObject) {
	this.obj = domObject;
	
	
	this.highlight = function() {
		this.obj.style.borderColor = filiph.TzTime.CSS_COLOR_HILITE;
		var delay = new goog.async.Delay(this.unHighlight, 100, this);
		delay.start();
	}
	
	this.unHighlight = function() {
		this.obj.style.borderColor = filiph.TzTime.CSS_COLOR_NORMAL;
	}
	
	this.disable = function() {
		this.obj.disabled = true;
	}
	
	this.enable = function() {
		this.obj.disabled = false;
	}
}

filiph.TzTime.prototype.updateLocTimeFromDomObject = function(e) {
	
	// only recalculate if value was changed by event
	if (this.locTime.inputVal != this.locTime.el.value) {
		this.locTime.inputVal = this.locTime.el.value;
		
		var timeVal = this.getLocTimeFromHumanInput(this.locTime.inputVal);
		if (timeVal) {
			this.locTime.val = timeVal;
			this.updateBoundTzTimes();

			filiph.TzTime.updateDomObjectStyle(this.locTime.el, true);
		} else {
			filiph.TzTime.updateDomObjectStyle(this.locTime.el, false);
		}
	}
}

filiph.TzTime.prototype.updateTzOffsetFromDomObject = function(e) {
	
	// only recalculate if value was changed by event
	if (this.tzOffset.inputVal != this.tzOffset.el.value) {
		this.tzOffset.inputVal = this.tzOffset.el.value;
		var normalizedInput = filiph.TzTime.lowerCaseAndTrim(this.tzOffset.inputVal);
		
		if (goog.object.containsKey(filiph.tzdata.timezoneUrls, normalizedInput)) {
			// TODO check if we have the same timezone now to usetrit one ajax call
			
			filiph.TzTime.updateDomObjectStyle(this.tzOffset.el, true);
			
			this.sendForTimezoneJson();
		} else {
			filiph.TzTime.updateDomObjectStyle(this.tzOffset.el, false);
		}
	}
}

filiph.TzTime.prototype.attachInputHandlers = function() {
	this.listen(this.locTime.el, 
				[goog.events.EventType.KEYUP, goog.events.EventType.CHANGE],
				this.updateLocTimeFromDomObject);
				
	this.listen(this.tzOffset.el, 
				[goog.events.EventType.KEYUP, goog.events.EventType.CHANGE],
				this.updateTzOffsetFromDomObject);
}

/**
 * TODO: This is a HACK!!! Make a subclass?

 * Sets the value of the current active element.
 * @param {string} value The new value.
 */
goog.ui.AutoComplete.InputHandler.prototype.setValue = function(value) {
  this.activeElement_.value = value;

  // we are adding
  var evt = document.createEvent("UIEvents");
  evt.initUIEvent("change", false, false, window, 1);
  this.activeElement_.dispatchEvent(evt);
};

filiph.TzTime.prototype.attachAutoComplete = function() {
	/*this.tzOffsetAutocomplete = new goog.ui.AutoComplete.Basic(
	 		        filiph.tzdata.timezonePossibilities, this.tzOffset.el, false);*/
	
	this.matcher = new goog.ui.AutoComplete.ArrayMatcher(filiph.tzdata.timezonePossibilities, false);
	this.renderer = new goog.ui.AutoComplete.Renderer();
	this.inputhandler =
		new goog.ui.AutoComplete.InputHandler(null, null, false);

	this.tzOffsetAutocomplete = new goog.ui.AutoComplete(this.matcher, this.renderer, this.inputhandler);

	this.inputhandler.attachAutoComplete(this.tzOffsetAutocomplete);
	this.inputhandler.attachInputs(this.tzOffset.el);
	
	
	/*
	this.locTimeAutocomplete = new goog.ui.AutoComplete.Basic(
					timePossibilities, this.locTime.el, false);
	*/
}

filiph.TzTime.prototype.bindDomObjects = function(inLocTimeField, inTzOffsetField) {
	this.locTime.el = inLocTimeField;
	this.tzOffset.el = inTzOffsetField;
	
	if (typeof(this.locTime.el) == "undefined" || typeof(this.tzOffset.el) == "undefined") {
		throw "DOM objects to be bound were not found.";
	}
	
	if (this.locTime.el.value === "undefined") {
		throw "DOM object locTime doesn't have property .value.";
	}
	
	if (this.tzOffset.el.value === "undefined") {
		throw "DOM object doesn't have property .value";
	}
	
	this.attachInputHandlers();
	this.attachAutoComplete();
	
	// first time call
	this.updateLocTimeFromDomObject();
	this.updateTzOffsetFromDomObject();
}

filiph.TzTime.prototype.enableDomObjects = function() {
	this.locTime.el.disabled = false;
	this.tzOffset.el.disabled = false;
	
	// enable highlighting of loctime
	this.locTime.highlighter = new filiph.TzTime.highlightableDomObject(this.locTime.el);
}

filiph.TzTime.prototype.bindToOtherTzTime = function(inTzT) {
	if (typeof(inTzT) !== "object") {
		throw "Cannot bind with objects that are not of type TzTime.";
	}
	this.boundTzTimes.push(inTzT);
	this.boundToOthers = true;
} 

filiph.TzTime.prototype.registerXhrIoManager = function(inXhrIoManager) {
	this.xhrIoManager = inXhrIoManager;
	// TODO?
}

filiph.TzTime.prototype.timezoneJsonCallback = function(e) {
	// console.log("Callback:::");
	
	if (!e.target.isSuccess()) {
		console.error("Error: Call for JSON was not successful.")
		return;
	}
	var timezoneEras = e.target.getResponseJson()["zone"];
	var timezoneFound = false;

	for (var i = 0; i < timezoneEras.length; i++) {
		if (timezoneEras[i]["to"] > this.currentDateValue && 
			timezoneEras[i]["from"] < this.currentDateValue) {
				
				// copy info for .timezone["current"] (and ["next"] and ["previous"] if possible)
				this.timezone["current"] = {
						"from": timezoneEras[i]["from"],
						"to": timezoneEras[i]["to"],
						"dst": timezoneEras[i]["dst"],
						"offset": timezoneEras[i]["offset"],
						"name": timezoneEras[i]["name"]
					};
				
				if (i > 0) {
					this.timezone["previous"] = {
						"from": timezoneEras[i-1]["from"],
						"to": timezoneEras[i-1]["to"],
						"dst": timezoneEras[i-1]["dst"],
						"offset": timezoneEras[i-1]["offset"],
						"name": timezoneEras[i-1]["name"]
					};
				} else {
					this.timezone["previous"] = null;
				}
				
				if (i < timezoneEras.length - 1) {
					this.timezone["next"] = {
						"from": timezoneEras[i+1]["from"],
						"to": timezoneEras[i+1]["to"],
						"dst": timezoneEras[i+1]["dst"],
						"offset": timezoneEras[i+1]["offset"],
						"name": timezoneEras[i+1]["name"]
					};
				} else {
					this.timezone["next"] = null;
				}
					
				this.tzOffset.val = this.timezone["current"]["offset"];
				//console.log("New tzOffset for " + this.idString + " = " + this.tzOffset);
				
				if (this.isBoundSlave) {
					this.updateThisSlaveTzT();
				} else {
					this.updateBoundTzTimes();
				}
				
				
				timezoneFound = true
				break;
		}
	}
	if (!timezoneFound) {
		throw "ERROR: Current Date not covered by JSON. Corrupted JSON file?";
	}
}

// takes valid timezone name
filiph.TzTime.prototype.getJsonRequestUrl = function(validTimezoneName) {
	return filiph.TzTime.JSONSLOCATION + filiph.tzdata.timezoneUrls[validTimezoneName];
}


// sends an AJAX request based on current (valid!) tzOffset.el.value
// don't call if tzOffsetField.value is not valid
filiph.TzTime.prototype.sendForTimezoneJson = function() {
	if (this.xhrIoManager == null) {
		throw "No xhrIoManager has been set up. Cannot make Ajax request."
	}
	// abort request if exists
	this.xhrIoManager.abort(this.idString, true);
	
	var validTimezoneName = filiph.TzTime.lowerCaseAndTrim(this.tzOffset.inputVal);
	
	this.xhrIoManager.send(
		this.idString,
		this.getJsonRequestUrl(validTimezoneName),
		"GET",
		null,
		null,
		null, // priority
		goog.bind(this.timezoneJsonCallback, this),
		2 // max retries
		);	
		
		if (this.isBoundSlave && goog.isDefAndNotNull(this.locTime.highlighter)) {
			this.locTime.highlighter.disable();
		} else if (this.boundToOthers) {
			for (var i=0; i < this.boundTzTimes.length; i++) {
				if (goog.isDefAndNotNull(this.boundTzTimes[i].locTime.highlighter)) {
					this.boundTzTimes[i].locTime.highlighter.disable();
				}
			}
		}
}

filiph.TzTime.prototype.disposeInternal = function() {
	filiph.TzTime.superClass_.disposeInternal.call(this);
	goog.dom.removeNode(this.container);
};

goog.exportSymbol('filiph.TzTime', filiph.TzTime);
