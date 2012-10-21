// Very first test! TODO: refactor current code and make it testable

UpgradeTest = TestCase("Upgrade");

UpgradeTest.prototype.testUpgradeV4 = function() {
	var settings = {
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
	localStorage['settings'] = JSON.stringify(settings);
	localStorage['version'] = '3';

	onUpdate();

	var settings = JSON.parse(localStorage['settings']);

	assertEquals(JSON.stringify(settings["101"].options.ignore), JSON.stringify([ 0, 'here', 'the' ]));
	assertEquals(JSON.stringify(settings["102"].options.ignore), JSON.stringify([ 0 ]));
	assertEquals(localStorage['version'], 4);
};


