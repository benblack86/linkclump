var CURRENT_VERSION = "5";

function SettingsManager() {}

SettingsManager.prototype.load = async function() {
	try {
		// load data from local storage
		var {settings}	= await chrome.storage.local.get("settings")

		// chrome.storage will return an empty object if it is not defined,
		// so we check for any key to indicate that it is not empty
		if (Object.keys(settings).length === 0) {
			var {settings} = await this.init();
		}
		return settings
	} catch(error) {
		var {settings} = await this.init();
		settings.error = "Error: "+error+"|Data:"+settings;
		return settings;
	}
};

SettingsManager.prototype.save = function(settings) {
	// remove any error messages from object (shouldn't be there)
	if (settings.error !== undefined) {
		delete settings.error;
	}
	
	localStorage["settings"] = JSON.stringify(settings);
};

SettingsManager.prototype.isInit = async function() {
	const version = await chrome.storage.local.get("version");
	return version !== undefined
};

SettingsManager.prototype.isLatest = async function() {
	const version = await chrome.storage.local.get("version");
	return version === CURRENT_VERSION;
};

SettingsManager.prototype.init = function() {
	// create default settings for first time user
	var settings = {
			"actions": {
				"101": {
					"mouse": 0,  // left mouse button
					"key": 90,	 // z key
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

	// save settings to store
	localStorage["settings"] = JSON.stringify(settings);
	localStorage["version"] = CURRENT_VERSION;
	
	return settings;
};


SettingsManager.prototype.update = function() {
	if (!(await this.isInit())) {
		this.init();
	}
};
