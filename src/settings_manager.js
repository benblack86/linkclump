var OS_WIN = 1;
var OS_LINUX = 0;
var CURRENT_VERSION = '5';

function SettingsManager(environment) {
	this.environment = environment;
}

SettingsManager.prototype.load = function() {
	// load data from local storage
	var data = localStorage["settings"];
	
	try {
		// attempt to parse, if unable then make the assumption it has been corrupted
		return JSON.parse(data)
	} catch(error) {
		var settings = this.init();
		settings.error = "Error: "+error+"|Data:"+data;
		return settings;
	}
}

SettingsManager.prototype.save = function(settings) {
	// remove any error messages from object (shouldn't be there)
	if (settings.hasOwnProperty("error")) {
		delete settings.error;
	}
	
	localStorage["settings"] = JSON.stringify(settings);
}

SettingsManager.prototype.isInit = function() {
	return (localStorage['version'] != undefined);
}

SettingsManager.prototype.isLatest = function() {
	return (localStorage['version'] == CURRENT_VERSION);
}

SettingsManager.prototype.init = function() {
	// create default settings for first time user
	var settings = {
			"actions": {
				"101": {
					"mouse": 2,
					"key": 0,
					"action": "tabs",
					"color": "#FFA500",
					"options": {
						"smart": 0,
						"ignore": [0],
						"delay": 0,
						"close": 0,
						"block": true,
						"reverse": false,
						"end": false
					}
				}
			},
			"blocked": []
		};
	
	// if not windows then use different mouse/key
	if (this.environment != OS_WIN) {
		settings.actions[101].mouse = 0;
		settings.actions[101].key = 16;
	}
	
	// save settings to store
	localStorage['settings'] = JSON.stringify(settings);
	localStorage['version'] = 5;
	
	return settings;
}


SettingsManager.prototype.update = function() {
	if (!this.isInit()) {
		this.init();
	}

	if(localStorage['version'] == '2.0') {
		var settings = JSON.parse(localStorage['settings'])

		for(var key in settings) {
			if(settings[key].action == "tabs") {
				settings[key].options.end = false;
				settings[key].options.close = 0;
			}

			if(settings[key].action == "win") {
				settings[key].options.unfocus = false;
			}
		}

		console.log(settings);

		localStorage['sites'] = "";
		localStorage['settings'] = JSON.stringify(settings);
		localStorage['version'] = '3';
	}
	
	if(localStorage['version'] == '3') {
		var settings = JSON.parse(localStorage['settings'])
		
		for(var key in settings) {
			// set option as zero (important for people who do have words setup)
			if(settings[key].options.ignore != undefined) {
				settings[key].options.ignore.unshift(0);
			} else {
				settings[key].options.ignore = [0];
			}
			
			localStorage['settings'] = JSON.stringify(settings);
			localStorage['version'] = '4';
		}
	}
	
	if (localStorage['version'] == '4') {
		var old_settings = JSON.parse(localStorage['settings'])
		var sites = localStorage['sites'];
		if(sites == undefined) {
			sites = [];
		} else {
			sites = sites.split("\n");
		}
		
		// if sites is empty then set to empty array
		if (sites.length == 1) {
			sites[0] == "";
			sites = [];
		}
		
		var settings = {"actions" : old_settings, "blocked" : sites};
		
		localStorage['settings'] = JSON.stringify(settings);
		localStorage['version'] = CURRENT_VERSION;
		localStorage.removeItem('sites');
	}
}