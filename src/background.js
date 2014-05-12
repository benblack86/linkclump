var OS_WIN = 1;
var OS_LINUX = 0;
var os = ((navigator.appVersion.indexOf("Win") == -1) ? OS_LINUX : OS_WIN);
var settingsManager = new SettingsManager(os);

Array.prototype.unique = function() {
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

function timeConverter(a){
	var year = a.getFullYear();
	var month = pad(a.getMonth()+1, 2)
	var day = pad(a.getDate(), 2);
	var hour = pad(a.getHours(),2);
	var min = pad(a.getMinutes(),2);
	var sec = pad(a.getSeconds(),2);
	var time = year+'-'+month+'-'+day+' '+hour+':'+min+':'+sec;
	return time;
}

function pad(number, length) {
	var str = '' + number;
	while (str.length < length) {
		str = '0' + str;
	}
   
	return str;
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
					// make assumption that bookmarkTreeNodes[0].children[1] refers to the "other bookmarks" folder
					// as different languages will not use the english name to refer to the folder
					chrome.bookmarks.create({'parentId': bookmarkTreeNodes[0].children[1].id, 'title': 'Linkclump '+timeConverter(new Date())},
						function(newFolder) {
							for (j = 0; j < request.urls.length; j++) {
								chrome.bookmarks.create({'parentId': newFolder.id,
									'title': request.urls[j].title,
									'url': request.urls[j].url});
							}
						}
					);
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
		callback(settingsManager.load());
		break;
	case 'update':
		settingsManager.save(request.settings);
	
		chrome.windows.getAll({
			populate: true
		}, function(windowList){
			windowList.forEach(function(window){
				window.tabs.forEach(function(tab){
					chrome.tabs.sendMessage(tab.id, {
						message: 'update',
						settings: settingsManager.load()
					}, null);
				})
			})
		});
	
		break;
	}
});


if (!settingsManager.isInit()) {
	// initialize settings manager with defaults and to stop this appearing again
	settingsManager.init();
	
	// inject Linkclump into windows currently open to make it just work
	chrome.windows.getAll({ populate: true }, function(windows) {
		for (var i = 0; i < windows.length; ++i) {
			for (var j = 0; j < windows[i].tabs.length; ++j) {
				if (!/^https?:\/\//.test(windows[i].tabs[j].url)) continue;
				chrome.tabs.executeScript(windows[i].tabs[j].id, { file: 'linkclump.js' });
			}
		}
	});
	
	// pop up window to show tour and options page
	chrome.windows.create({
		url: document.location.protocol + '//' + document.location.host + '/pages/options.html?init=true',
		width: 800,
		height: 850,
		left: screen.width / 2 - 800 / 2,
		top: screen.height / 2 - 700 / 2
	});
} else if (!settingsManager.isLatest()) {
	settingsManager.update();
}


