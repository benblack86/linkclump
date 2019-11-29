/* eslint no-undef: 0 */

var TestSettingsManager = new TestCase("Settings Manager");

TestSettingsManager.prototype.setUp = function() {
	// clear storage each time
	localStorage.clear();
};

TestSettingsManager.prototype.testInitWindows = function() {
	var sm = new SettingsManager();
	
	assertUndefined(localStorage["settings"]);
	assertUndefined(localStorage["version"]);
	
	var good_settings = {
		"actions": {
			"101": {
				"mouse": 0,
				"key": 90,
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
	
	var settings = sm.init();

	assertEquals("5", localStorage["version"]);
	assertEquals(good_settings, settings);
	assertUndefined(settings.error);
};

TestSettingsManager.prototype.testInitLinux = function() {
	var sm = new SettingsManager();
	
	assertUndefined(localStorage["settings"]);
	assertUndefined(localStorage["version"]);
	assertTrue(!sm.isInit());
	
	var good_settings = {
		"actions": {
			"101": {
				"mouse": 0,
				"key": 90,
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
	
	var settings = sm.init();

	assertEquals("5", localStorage["version"]);
	assertEquals(good_settings, settings);
	assertUndefined(settings.error);
	assertTrue(sm.isInit());
};

TestSettingsManager.prototype.testSave = function() {
	var sm = new SettingsManager();
	
	var settings = sm.init();
	
	assertEquals(0, settings.actions[101].options.smart);
	
	settings.actions[101].options.smart = 1;
	
	sm.save(settings);
	
	var new_settings = sm.load();
	
	assertEquals(1, new_settings.actions[101].options.smart)
};

TestSettingsManager.prototype.testError = function() {
	var sm = new SettingsManager();
	
	var good_settings = {
			"actions": {
				"101": {
					"mouse": 0,
					"key": 90,
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
	
	var settings = sm.load();
	assertEquals("Error: SyntaxError: Unexpected token u in JSON at position 0|Data:undefined", settings.error);
	assertEquals(good_settings.actions, settings.actions);
	
	// load again and there should be no error
	settings = sm.load();
	assertUndefined(settings.error);
	assertEquals(good_settings, settings);
};
