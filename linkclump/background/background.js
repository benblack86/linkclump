Array.prototype.unique =
	function() {
	var a = [];
	var l = this.length;
	for(var i=0; i<l; i++) {
		for(var j=i+1; j<l; j++) {
			if (this[i].url == this[j].url)
				j = ++i;
		}
		a.push(this[i]);
	}
	return a;
};

function openTab(urls, delay, window_id, tab_position, close_time) {
	var obj = {
			windowId: window_id,
			url: urls.shift().url,
			selected: false
	}

	if(tab_position != null) {
		obj.index = tab_position
		tab_position++;
	}

	chrome.tabs.create(obj, function(tab) {
		if(close_time > 0) {
			window.setTimeout(function() {
				chrome.tabs.remove(tab.id);
			}, close_time*1000);
		}
	});

	if(urls.length > 0) {
		window.setTimeout(function() {openTab(urls, delay, window_id, tab_position, close_time)}, delay*1000);
	}

}

function copyToClipboard( text ){
    var copyDiv = document.createElement('textarea');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}

chrome.extension.onMessage.addListener(function(request, sender, callback){
	switch(request.message) {
	case 'activate':
		if(request.setting.options.block) {
			request.urls = request.urls.unique();
		}

		if(request.urls.length == 0) {
			return;
		}

		if(request.setting.options.reverse) {
			request.urls.reverse();
		}

		switch(request.setting.action) {
		case 'copy':
			var text = "";
			for (i = 0; i < request.urls.length; i++) {
				switch(request.setting.options.copy) {
				case "0":
					text += request.urls[i].title+"\t"+request.urls[i].url+"\n";
					break;
				case "1": 
					text += request.urls[i].url+"\n";
					break;
				case "2":
					text += request.urls[i].title+"\n";
					break;
				case "3":
					text += '<a href="'+request.urls[i].url+'">'+request.urls[i].title+'</a>\n';
					break;
				case "4":
					text += '<li><a href="'+request.urls[i].url+'">'+request.urls[i].title+'</a></li>\n';
				}
			}
			
			if(request.setting.options.copy == 4) {
				text = '<ul>\n'+text+'</ul>\n'
			}
			
			copyToClipboard(text);
			break;
		case 'bm':
			chrome.bookmarks.getTree(
					function(bookmarkTreeNodes) {
						for(var i in bookmarkTreeNodes[0].children) {
							if(bookmarkTreeNodes[0].children[i].title.toLowerCase() == "other bookmarks") {
								chrome.bookmarks.create({'parentId': bookmarkTreeNodes[0].children[i].id, 'title': 'Linkclump-'+Date.now()},
										function(newFolder) {
									for (j = 0; j < request.urls.length; j++) {
										chrome.bookmarks.create({'parentId': newFolder.id,
											'title': request.urls[j].title,
											'url': request.urls[j].url});
									}
								}
								);
							}

						}
					}
			);


			break;
		case 'win':
			chrome.windows.getCurrent(function(current_window){

				chrome.windows.create({url: request.urls.shift().url, "focused" : !request.setting.options.unfocus}, function(window){
					if(request.urls.length > 0) {
						openTab(request.urls, request.setting.options.delay, window.id, null, 0);
					}
				});

				if(request.setting.options.unfocus) {
					chrome.windows.update(current_window.id, {"focused": true});
				}
			});
			break;
		case 'tabs':
			chrome.tabs.get(sender.tab.id, function(tab) {
				chrome.windows.getCurrent(function(window){
					var tab_index = null;

					if(!request.setting.options.end) {
						tab_index = tab.index+1;
					}

					openTab(request.urls, request.setting.options.delay, window.id, tab_index, request.setting.options.close);
				})
			});
			break;
		}

		break;
	case 'init':
		var settings = new Object();
		settings.settings = JSON.parse(localStorage['settings'])
		var sites = localStorage['sites'];
		if(sites == undefined) {
			sites = [];
		} else {
			sites = sites.split("\n");
		}

		settings.sites = sites;
		callback(settings);
		break;
	}
});



//chrome.runtime.onInstalled.addListener(function() {
	if (localStorage['version'] == undefined) {
		function showSetup() {
			chrome.windows.create({
				url: document.location.protocol + '//' + document.location.host + '/pages/options.html?init',
				width: 800,
				height: 850,
				left: screen.width / 2 - 800 / 2,
				top: screen.height / 2 - 700 / 2
			});
		}

		// create default settings for new user
		var settings = {"101": {
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
		}};

		// if not windows then use different mouse/key
		if (navigator.appVersion.indexOf("Win") == -1) {
			settings[101].mouse = 0;
			settings[101].key = 16;
		}

		// save settings to store
		localStorage['sites'] = "";
		localStorage['settings'] = JSON.stringify(settings);

		showSetup();
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
			settings[key].ignore.unshift(0);
			
			localStorage['settings'] = JSON.stringify(settings);
			localStorage['version'] = '4';
		}
	}
//});