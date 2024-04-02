var settingsManager = new SettingsManager();

Array.prototype.unique = function() {
	var a = [];
	var l = this.length;
	for(var i=0; i<l; i++) {
		for(var j=i+1; j<l; j++) {
			if (this[i].url === this[j].url)
				j = ++i;
		}
		a.push(this[i]);
	}
	return a;
};

function openTab(urls, delay, windowId, openerTabId, tabPosition, closeTime) {
	const obj = {
			windowId,
			url: urls.shift().url,
			active: false
	};

	// only add tab ID if delay feature is not being used as if tab with openerTabId is closed, the links stop opening
	if (!delay) {
		obj.openerTabId = openerTabId;
	}

	if(tabPosition != null) {
		obj.index = tabPosition;
		tabPosition++;
	}

	chrome.tabs.create(obj, function(tab) {
		if(closeTime > 0) {
			window.setTimeout(function() {
				chrome.tabs.remove(tab.id);
			}, closeTime*1000);
		}
	});

	if(urls.length > 0) {
		window.setTimeout(function() {openTab(urls, delay, windowId, openerTabId, tabPosition, closeTime)}, delay*1000);
	}

}

function copyToClipboard( text ){
    var copyDiv = document.createElement("textarea");
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand("SelectAll");
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}

function pad(number, length) {
	var str = "" + number;
	while (str.length < length) {
		str = "0" + str;
	}

	return str;
}

function timeConverter(a){
	var year = a.getFullYear();
	var month = pad(a.getMonth()+1, 2)
	var day = pad(a.getDate(), 2);
	var hour = pad(a.getHours(),2);
	var min = pad(a.getMinutes(),2);
	var sec = pad(a.getSeconds(),2);
	var time = year+"-"+month+"-"+day+" "+hour+":"+min+":"+sec;
	return time;
}

// Link copy formats
const URLS_WITH_TITLES = 0
const URLS_ONLY = 1
const URLS_ONLY_SPACE_SEPARATED = 2
const TITLES_ONLY = 3
const AS_LINK_HTML = 4
const AS_LIST_LINK_HTML = 5
const AS_MARKDOWN = 6

function formatLink({url, title}, copyFormat) {
	switch(parseInt(copyFormat)) {
	case URLS_WITH_TITLES:
		return title+"\t"+url+"\n";
	case URLS_ONLY: 
		return url+"\n";
	case URLS_ONLY_SPACE_SEPARATED: 
		return url+" ";
	case TITLES_ONLY:
		return title+"\n";
	case AS_LINK_HTML:
		return '<a href="'+url+'">'+title+"</a>\n";
	case AS_LIST_LINK_HTML:
		return '<li><a href="'+url+'">'+title+"</a></li>\n";
	case AS_MARKDOWN:
		return "["+title+"]("+url+")\n";
	}
}

function handleRequests(request, sender, callback){
	switch(request.message) {
	case "activate":
		if(request.setting.options.block) {
			request.urls = request.urls.unique();
		}

		if(request.urls.length === 0) {
			return;
		}

		if(request.setting.options.reverse) {
			request.urls.reverse();
		}

		switch(request.setting.action) {
		case "copy":
			var text = "";
			for (let i = 0; i < request.urls.length; i++) {
				text += formatLink(request.urls[i], request.setting.options.copy);
			}
			
			if(request.setting.options.copy == AS_LIST_LINK_HTML) {
				text = "<ul>\n"+text+"</ul>\n"
			}
			
			copyToClipboard(text);
			break;
		case "bm":
			chrome.bookmarks.getTree(
				function(bookmarkTreeNodes) {
					// make assumption that bookmarkTreeNodes[0].children[1] refers to the "other bookmarks" folder
					// as different languages will not use the english name to refer to the folder
					chrome.bookmarks.create({"parentId": bookmarkTreeNodes[0].children[1].id, "title": "Linkclump "+timeConverter(new Date())},
						function(newFolder) {
							for (let j = 0; j < request.urls.length; j++) {
								chrome.bookmarks.create({"parentId": newFolder.id,
									"title": request.urls[j].title,
									"url": request.urls[j].url});
							}
						}
					);
				}
			);

			break;
		case "win":
			chrome.windows.getCurrent(function(currentWindow){

				chrome.windows.create({url: request.urls.shift().url, "focused" : !request.setting.options.unfocus}, function(window){
					if(request.urls.length > 0) {
						openTab(request.urls, request.setting.options.delay, window.id, undefined, null, 0);
					}
				});

				if(request.setting.options.unfocus) {
					chrome.windows.update(currentWindow.id, {"focused": true});
				}
			});
			break;
		case "tabs":
			chrome.tabs.get(sender.tab.id, function(tab) {
				chrome.windows.getCurrent(function(window){
					var tab_index = null;

					if(!request.setting.options.end) {
						tab_index = tab.index+1;
					}

					openTab(request.urls, request.setting.options.delay, window.id, tab.id, tab_index, request.setting.options.close);
				})
			});
			break;
		}

		break;
	case "init":
		callback(settingsManager.load());
		break;
	case "update":
		settingsManager.save(request.settings);
	
		chrome.windows.getAll({
			populate: true
		}, function(windowList){
			windowList.forEach(function(window){
				window.tabs.forEach(function(tab){
					chrome.tabs.sendMessage(tab.id, {
						message: "update",
						settings: settingsManager.load()
					}, null);
				})
			})
		});
	
		break;
	}
}

chrome.extension.onMessage.addListener(handleRequests)


if (!settingsManager.isInit()) {
	// initialize settings manager with defaults and to stop this appearing again
	settingsManager.init();
	
	// inject Linkclump into windows currently open to make it just work
	chrome.windows.getAll({ populate: true }, function(windows) {
		for (var i = 0; i < windows.length; ++i) {
			for (var j = 0; j < windows[i].tabs.length; ++j) {
				if (!/^https?:\/\//.test(windows[i].tabs[j].url)) continue;
				chrome.tabs.executeScript(windows[i].tabs[j].id, { file: "linkclump.js" });
			}
		}
	});
	
	// pop up window to show tour and options page
	chrome.windows.create({
		url: document.location.protocol + "//" + document.location.host + "/pages/options.html?init=true",
		width: 800,
		height: 850,
		left: screen.width / 2 - 800 / 2,
		top: screen.height / 2 - 700 / 2
	});
} else if (!settingsManager.isLatest()) {
	settingsManager.update();
}


