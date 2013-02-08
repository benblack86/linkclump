TestSettingsManager = new TestCase("Settings Manager");

TestSettingsManager.prototype.setUp = function() {
	// clear storage each time
	localStorage.clear();
}

TestSettingsManager.prototype.testInitWindows = function() {
	var sm = new SettingsManager(OS_WIN);
	
	assertUndefined(localStorage['settings']);
	assertUndefined(localStorage['version'])
	
	var good_settings = {
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
	}
	
	var settings = sm.init();

	assertEquals('5', localStorage['version']);
	assertEquals(good_settings, settings);
	assertUndefined(settings.error);
}

TestSettingsManager.prototype.testInitLinux = function() {
	var sm = new SettingsManager(OS_LINUX);
	
	assertUndefined(localStorage['settings']);
	assertUndefined(localStorage['version'])
	assertTrue(!sm.isInit());
	
	var good_settings = {
		"actions": {
			"101": {
				"mouse": 0,
				"key": 16,
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
	}
	
	var settings = sm.init();

	assertEquals('5', localStorage['version']);
	assertEquals(good_settings, settings);
	assertUndefined(settings.error);
	assertTrue(sm.isInit());
}

TestSettingsManager.prototype.testSave = function() {
	var sm = new SettingsManager(OS_LINUX);
	
	var settings = sm.init();
	
	assertEquals(0, settings.actions[101].options.smart)
	
	settings.actions[101].options.smart = 1;
	
	sm.save(settings);
	
	var new_settings = sm.load();
	
	assertEquals(1, new_settings.actions[101].options.smart)
}

TestSettingsManager.prototype.testError = function() {
	var sm = new SettingsManager(OS_WIN);
	
	var good_settings = {
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
		}
	
	var settings = sm.load();
	assertEquals("Error: SyntaxError: Unexpected token u|Data:undefined", settings.error);
	assertEquals(good_settings.actions, settings.actions);
	
	// load again and there should be no error
	var settings = sm.load();
	assertUndefined(settings.error);
	assertEquals(good_settings, settings);
}


TestSettingsManager.prototype.testUpgradeV3toV5 = function() {
	var sm = new SettingsManager(OS_WIN);
	
	var old_settings = {
		"101" : {
			"mouse" : 2,
			"key" : 0,
			"action" : "tabs",
			"color" : "#FFA500",
			"options" : {
				"smart" : 0,
				"ignore" : [ 'here', 'the' ],
				"delay" : 0,
				"close" : 0,
				"block" : true,
				"reverse" : false,
				"end" : false
			}
		},
		"102" : {
			"mouse" : 2,
			"key" : 0,
			"action" : "tabs",
			"color" : "#FFA500",
			"options" : {
				"smart" : 0,
				"ignore" : [],
				"delay" : 0,
				"close" : 0,
				"block" : true,
				"reverse" : false,
				"end" : false
			}
		}
	};

	localStorage['sites'] = "";
	localStorage['settings'] = JSON.stringify(old_settings);
	localStorage['version'] = '3';

	sm.update();
	
	var settings = sm.load();

	assertEquals(JSON.stringify([ 0, 'here', 'the' ]), JSON.stringify(settings.actions["101"].options.ignore));
	assertEquals(JSON.stringify([ 0 ]), JSON.stringify(settings.actions["102"].options.ignore));
	assertEquals('5', localStorage['version']);
	assertUndefined(localStorage['sites']);
	assertUndefined(JSON.parse(localStorage['settings']).error);
};

TestSettingsManager.prototype.testUpgradeV4toV5 = function() {
	var sm = new SettingsManager(OS_WIN);
	
	var old_settings = {
			"101" : {
				"mouse" : 2,
				"key" : 0,
				"action" : "tabs",
				"color" : "#FFA500",
				"options" : {
					"smart" : 0,
					"ignore" : [ 0, 'here', 'the' ],
					"delay" : 0,
					"close" : 0,
					"block" : true,
					"reverse" : false,
					"end" : false
				}
			},
			"102" : {
				"mouse" : 2,
				"key" : 0,
				"action" : "tabs",
				"color" : "#FFA500",
				"options" : {
					"smart" : 0,
					"ignore" : [0],
					"delay" : 0,
					"close" : 0,
					"block" : true,
					"reverse" : false,
					"end" : false
				}
			}
	};

	localStorage['sites'] = "";
	localStorage['settings'] = JSON.stringify(old_settings);
	localStorage['version'] = '4';
	
	sm.update();

	var settings = sm.load();

	assertEquals(JSON.stringify([ 0, 'here', 'the' ]), JSON.stringify(settings.actions["101"].options.ignore));
	assertEquals(JSON.stringify([ 0 ]), JSON.stringify(settings.actions["102"].options.ignore));
	assertEquals(0, settings.blocked.length)
	assertEquals('5', localStorage['version']);
	assertUndefined(localStorage['sites']);
	assertUndefined(JSON.parse(localStorage['settings']).error);
}