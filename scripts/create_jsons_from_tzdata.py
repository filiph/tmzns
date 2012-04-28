#!/usr/bin/env python
# encoding: utf-8
"""
create_jsons_from_tzdata.py

Created by Filip Hracek on 2011-05-12.
"""

import sys
import os
import json

def main():
	pathToTzJSON = "../static/tzdata_2011j/tzdata/json"
	timezones = []
	
	print("### CRAWL START ###")
	
	# find all files in specified tzdata directory and create an array
	# of objects for autocomplete
	for root, dirs, files in os.walk(pathToTzJSON):
		#print(root)
		path = root
		continent = None
		for fname in files:
			#print("F- " + fname)
			(place_name, extension) = os.path.splitext(fname)
			if (extension == ".json"):
				place_name = place_name.replace("_", " ")
				
				tzone = {}
				tzone["place"] = place_name
				directory_name = os.path.basename(root)
				if directory_name == 'json':
					continent = None
				else:
					continent = directory_name
				
				filepath = os.path.join(path, fname)
				
				tzone["filepath"] = filepath[len(pathToTzJSON)+1:]	
				tzone["continent"] = continent
				tzone["placeFull"] = place_name if continent == None else place_name + " (" + continent + ")"
				
				
				#print(filename)
				f = open(filepath, "r")
				
				tzJson = json.load(f)
				
				tzone["json"] = tzJson
				
				timezones.append(tzone)
				
				
	print("### CRAWL COMPLETE ###")
	
	
	# debug: print one of the obects as a JSON			
	# print(json.dumps(timezones[50], sort_keys=True, indent=4))
	
	
	if True:
		# make a dictionary of only names => paths
		timezoneNames = {}
		for tzDic in timezones:
			tzPlace = tzDic["place"]
			if tzPlace != "":
				timezoneNames[tzPlace] = tzDic["filepath"]
				for tzZone in tzDic["json"]["zone"]:
					tzPlace = tzZone["name"]

					if not tzPlace in timezoneNames and tzPlace != "":
						timezoneNames[tzPlace] = tzDic["filepath"]
					# elif tzDic["filepath"] != timezoneNames[tzPlace]:
					# 	print(tzPlace + " already among timezoneNames. New entry: " + tzDic["filepath"] + " vs old entry: " + timezoneNames[tzPlace])
		
		timezoneNames_lowercase = {}
		for key in timezoneNames.keys():
			timezoneNames_lowercase[key.lower()] = timezoneNames[key]
				
		print("\n\n// names => paths directory")				
		print("filiph.tzdata.timezoneUrls = " + json.dumps(timezoneNames_lowercase, sort_keys=True) + ";")	
	
		timezoneNamesArray = timezoneNames.keys();
		timezoneNamesArray.sort()
		timezoneNamesArray.insert(0, "here")
	
		print("\n\n// names array")
		print("filiph.tzdata.timezonePossibilities = " + json.dumps(timezoneNamesArray, sort_keys=True) + ";")	
		
		# timezoneNamesArray_lowercase = []
		# 		for name in timezoneNamesArray:
		# 			timezoneNamesArray_lowercase.append(name.lower())
		# 		
		# 		print("\n\n// lowercase names array")
		# 		print("timezonePossibilitiesLowerCase = " + json.dumps(timezoneNamesArray_lowercase, sort_keys=True) + ";")
		

if __name__ == '__main__':
	main()

