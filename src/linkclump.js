console.log("LinkClump loaded");

const END_KEYCODE = 35;
const HOME_KEYCODE = 36;
const Z_INDEX = 2147483647;
const OS_WIN = 1;
const OS_LINUX = 0;
const LEFT_BUTTON = 0;
const EXCLUDE_LINKS = 0;
const INCLUDE_LINKS = 1;

var settings = null;
var setting = -1;
var key_pressed = 0;
var mouse_button = null;
var stop_menu = false;
var box_on = false;
var smart_select = false;
var mouse_x = -1;
var mouse_y = -1;
var scroll_id = 0;
var links = [];
var box = null;
var count_label = null;
var overlay = null;
var scroll_bug_ignore = false;
var os = ((navigator.appVersion.indexOf("Win") === -1) ? OS_LINUX : OS_WIN);
var timer = 0;

var init = browser.runtime.sendMessage({
	message: "init"
});

init.then((response) => {
	if (response === null) {
		console.log("Unable to load linkclump due to null response");
	} else {
		if (response.hasOwnProperty("error")) {
			console.log("Unable to properly load linkclump, returning to default settings: " + JSON.stringify(response));
		}

		settings = response.actions;

		var allowed = true;
		for (var i in response.blocked) {
			if (response.blocked[i] == "") continue;
			var re = new RegExp(response.blocked[i], "i");

			if (re.test(window.location.href)) {
				allowed = false;
				console.log("Linkclump is blocked on this site: " + response.blocked[i] + "~" + window.location.href);
			}
		}

		if (allowed) {
			window.addEventListener("mousedown", mousedown, true);
			window.addEventListener("keydown", keydown, true);
			window.addEventListener("keyup", keyup, true);
			window.addEventListener("blur", blur, true);
			window.addEventListener("contextmenu", contextmenu, true);
		}
	}
});

browser.runtime.onMessage.addListener(function (request, sender, callback) {
	if (request.message === "update") {
		settings = request.settings.actions;
	}
});

function mousemove(event) {
	prevent_escalation(event);

	if (allow_selection() || scroll_bug_ignore) {
		scroll_bug_ignore = false;
		update_box(event.pageX, event.pageY);

		// while detect keeps on calling false then recall the method
		while (!detech(event.pageX, event.pageY, false)) {
			// empty
		}
	} else {
		// only stop if the mouseup timer is no longer set
		if (timer === 0) {
			stop();
		}
	}
}

function clean_up() {
	// remove the box
	box.style.visibility = "hidden";
	count_label.style.visibility = "hidden";
	box_on = false;

	// remove the link boxes
	for (var i = 0; i < links.length; i++) {
		if (links[i].box !== null) {
			document.body.removeChild(links[i].box);
			links[i].box = null;
		}
	}
	links = [];

	// wipe clean the smart select
	smart_select = false;
	mouse_button = -1;
	key_pressed = 0;
}

function mousedown(event) {
	mouse_button = event.button;

	// turn on menu for windows
	if (os === OS_WIN) {
		stop_menu = false;
	}

	if (allow_selection()) {
		// don't prevent for windows right click as it breaks spell checker
		// do prevent for left as otherwise the page becomes highlighted
		if (os === OS_LINUX || (os === OS_WIN && mouse_button === LEFT_BUTTON)) {
			prevent_escalation(event);
		}

		// if mouse up timer is set then clear it as it was just caused by bounce
		if (timer !== 0) {
			//console.log("bounced!");
			clearTimeout(timer);
			timer = 0;

			// keep menu off for windows
			if (os === OS_WIN) {
				stop_menu = true;
			}
		} else {
			// clean up any mistakes
			if (box_on) {
				console.log("box wasn't removed from previous operation");
				clean_up();
			}

			// create the box
			if (box === null) {
				box = document.createElement("span");
				box.style.margin = "0px auto";
				box.style.border = "2px dotted" + settings[setting].color;
				box.style.position = "absolute";
				box.style.zIndex = Z_INDEX;
				box.style.visibility = "hidden";

				count_label = document.createElement("span");
				count_label.style.zIndex = Z_INDEX;
				count_label.style.position = "absolute";
				count_label.style.visibility = "hidden";
				count_label.style.left = "10px";
				count_label.style.width = "50px";
				count_label.style.top = "10px";
				count_label.style.height = "20px";
				count_label.style.fontSize = "10px";
				count_label.style.font = "Arial, sans-serif";
				count_label.style.color = "black";

				if (document.body != null) {
					document.body.appendChild(box);
					document.body.appendChild(count_label);
				} else {
					console.log("Body is null");
				}

			}

			// update position
			box.x = event.pageX;
			box.y = event.pageY;
			update_box(event.pageX, event.pageY);

			// setup mouse move and mouse up
			window.addEventListener("mousemove", mousemove, true);
			window.addEventListener("mouseup", mouseup, true);
			window.addEventListener("mousewheel", mousewheel, true);
			window.addEventListener("mouseout", mouseout, true);
		}
	}
}

function update_box(x, y) {
	var width = Math.max(document.documentElement["clientWidth"], document.body["scrollWidth"], document.documentElement["scrollWidth"], document.body["offsetWidth"], document.documentElement["offsetWidth"]); // taken from jquery
	var height = Math.max(document.documentElement["clientHeight"], document.body["scrollHeight"], document.documentElement["scrollHeight"], document.body["offsetHeight"], document.documentElement["offsetHeight"]); // taken from jquery
	x = Math.min(x, width - 7);
	y = Math.min(y, height - 7);

	if (x > box.x) {
		box.x1 = box.x;
		box.x2 = x;
	} else {
		box.x1 = x;
		box.x2 = box.x;
	}
	if (y > box.y) {
		box.y1 = box.y;
		box.y2 = y;
	} else {
		box.y1 = y;
		box.y2 = box.y;
	}

	box.style.left = box.x1 + "px";
	box.style.width = box.x2 - box.x1 + "px";
	box.style.top = box.y1 + "px";
	box.style.height = box.y2 - box.y1 + "px";

	count_label.style.left = x - 15 + "px";
	count_label.style.top = y - 15 + "px";
}

function mousewheel() {
	scroll_bug_ignore = true;
}

function mouseout(event) {
	mousemove(event);
	// the mouse wheel event might also call this event
	scroll_bug_ignore = true;
}

function prevent_escalation(event) {
	event.stopPropagation();
	event.preventDefault();
}

function mouseup(event) {
	prevent_escalation(event);

	if (box_on) {
		// all the detection of the mouse to bounce
		if (allow_selection() && timer === 0) {
			timer = setTimeout(function () {
				update_box(event.pageX, event.pageY);
				detech(event.pageX, event.pageY, true);

				stop();
				timer = 0;
			}, 100);
		}
	} else {
		// false alarm
		stop();
	}
}

function getXY(element) {
	var x = 0;
	var y = 0;

	var parent = element;
	var style;
	var matrix;
	do {
		style = window.getComputedStyle(parent);
		matrix = new WebKitCSSMatrix(style.webkitTransform);
		x += parent.offsetLeft + matrix.m41;
		y += parent.offsetTop + matrix.m42;
	} while (parent = parent.offsetParent);

	parent = element;
	while (parent && parent !== document.body) {
		if (parent.scrollleft) {
			x -= parent.scrollLeft;
		}
		if (parent.scrollTop) {
			y -= parent.scrollTop;
		}
		parent = parent.parentNode;
	}

	return {
		x: x,
		y: y
	};
}

function start() {
	// stop user from selecting text/elements
	document.body.style.khtmlUserSelect = "none";

	// turn on the box
	box.style.visibility = "visible";
	count_label.style.visibility = "visible";

	// find all links (find them each time as they could have moved)
	var page_links = document.links;

	// create RegExp once
	var re1 = new RegExp("^javascript:", "i");
	var re2 = new RegExp(settings[setting].options.ignore.slice(1).join("|"), "i");
	var re3 = new RegExp("^H\\d$");

	for (var i = 0; i < page_links.length; i++) {
		// reject javascript: links
		if (re1.test(page_links[i].href)) {
			continue;
		}

		// reject href="" or href="#"
		if (!page_links[i].getAttribute("href") || page_links[i].getAttribute("href") === "#") {
			continue;
		}

		// include/exclude links
		if (settings[setting].options.ignore.length > 1) {
			if (re2.test(page_links[i].href) || re2.test(page_links[i].innerHTML)) {
				if (settings[setting].options.ignore[0] == EXCLUDE_LINKS) {
					continue;
				}
			} else if (settings[setting].options.ignore[0] == INCLUDE_LINKS) {
				continue;
			}
		}

		// attempt to ignore invisible links (can't ignore overflow)
		var comp = window.getComputedStyle(page_links[i], null);
		if (comp.visibility == "hidden" || comp.display == "none") {
			continue;
		}

		var pos = getXY(page_links[i]);
		var width = page_links[i].offsetWidth;
		var height = page_links[i].offsetHeight;

		// attempt to get the actual size of the link
		for (var k = 0; k < page_links[i].childNodes.length; k++) {
			if (page_links[i].childNodes[k].nodeName == "IMG") {
				const pos2 = getXY(page_links[i].childNodes[k]);
				if (pos.y >= pos2.y) {
					pos.y = pos2.y;

					width = Math.max(width, page_links[i].childNodes[k].offsetWidth);
					height = Math.max(height, page_links[i].childNodes[k].offsetHeight);
				}
			}
		}

		page_links[i].x1 = pos.x;
		page_links[i].y1 = pos.y;
		page_links[i].x2 = pos.x + width;
		page_links[i].y2 = pos.y + height;
		page_links[i].height = height;
		page_links[i].width = width;
		page_links[i].box = null;
		page_links[i].important = settings[setting].options.smart == 0 && page_links[i].parentNode != null && re3.test(page_links[i].parentNode.nodeName);

		links.push(page_links[i]);
	}

	box_on = true;

	// turn off menu for windows so mouse up doesn't trigger context menu
	if (os === OS_WIN) {
		stop_menu = true;
	}
}

function stop() {
	// allow user to select text/elements
	document.body.style.khtmlUserSelect = "";

	// turn off mouse move and mouse up
	window.removeEventListener("mousemove", mousemove, true);
	window.removeEventListener("mouseup", mouseup, true);
	window.removeEventListener("mousewheel", mousewheel, true);
	window.removeEventListener("mouseout", mouseout, true);

	if (box_on) {
		clean_up();
	}

	// turn on menu for linux
	if (os === OS_LINUX && settings[setting].key != key_pressed) {
		stop_menu == false;
	}
}

function scroll() {
	if (allow_selection()) {
		var y = mouse_y - window.scrollY;
		var win_height = window.innerHeight;

		if (y > win_height - 20) { //down
			let speed = win_height - y;
			if (speed < 2) {
				speed = 60;
			} else if (speed < 10) {
				speed = 30;
			} else {
				speed = 10;
			}
			window.scrollBy(0, speed);
			mouse_y += speed;
			update_box(mouse_x, mouse_y);
			detech(mouse_x, mouse_y, false);

			scroll_bug_ignore = true;
			return;
		} else if (window.scrollY > 0 && y < 20) { //up
			let speed = y;
			if (speed < 2) {
				speed = 60;
			} else if (speed < 10) {
				speed = 30;
			} else {
				speed = 10;
			}
			window.scrollBy(0, -speed);
			mouse_y -= speed;
			update_box(mouse_x, mouse_y);
			detech(mouse_x, mouse_y, false);

			scroll_bug_ignore = true;
			return;
		}
	}

	clearInterval(scroll_id);
	scroll_id = 0;
}


function detech(x, y, open) {
	mouse_x = x;
	mouse_y = y;

	if (!box_on) {
		if (box.x2 - box.x1 < 5 && box.y2 - box.y1 < 5) {
			return true;
		} else {
			start();
		}

	}

	if (!scroll_id) {
		scroll_id = setInterval(scroll, 100);
	}

	var count = 0;
	var count_tabs = new Set;
	var open_tabs = [];
	for (var i = 0; i < links.length; i++) {
		if ((!smart_select || links[i].important) && !(links[i].x1 > box.x2 || links[i].x2 < box.x1 || links[i].y1 > box.y2 || links[i].y2 < box.y1)) {
			if (open) {
				open_tabs.push({
					"url": links[i].href,
					"title": links[i].innerText
				});
			}

			// check if important links have been selected and possibly redo
			if (!smart_select) {
				if (links[i].important) {
					smart_select = true;
					return false;
				}
			} else {
				if (links[i].important) {
					count++;
				}
			}

			if (links[i].box === null) {
				var link_box = document.createElement("span");
				link_box.style.id = "linkclump-link";
				link_box.style.margin = "0px auto";
				link_box.style.border = "1px solid red";
				link_box.style.position = "absolute";
				link_box.style.width = links[i].width + "px";
				link_box.style.height = links[i].height + "px";
				link_box.style.top = links[i].y1 + "px";
				link_box.style.left = links[i].x1 + "px";
				link_box.style.zIndex = Z_INDEX;

				document.body.appendChild(link_box);
				links[i].box = link_box;
			} else {
				links[i].box.style.visibility = "visible";
			}

			count_tabs.add(links[i].href);
		} else {
			if (links[i].box !== null) {
				links[i].box.style.visibility = "hidden";
			}
		}
	}

	// important links were found, but not anymore so redo
	if (smart_select && count === 0) {
		smart_select = false;
		return false;
	}

	count_label.innerText = count_tabs.size;

	if (open_tabs.length > 0) {
		browser.runtime.sendMessage({
			message: "activate",
			urls: open_tabs,
			setting: settings[setting]
		});
	}

	return true;
}

function allow_key(keyCode) {
	for (var i in settings) {
		if (settings[i].key == keyCode) {
			return true;
		}
	}
	return false;
}


function keydown(event) {
	if (event.keyCode != END_KEYCODE && event.keyCode != HOME_KEYCODE) {
		key_pressed = event.keyCode;
		// turn menu off for linux
		if (os === OS_LINUX && allow_key(key_pressed)) {
			stop_menu = true;
		}
	} else {
		scroll_bug_ignore = true;
	}
}

function blur() {
	remove_key();
}

function keyup(event) {
	if (event.keyCode != END_KEYCODE && event.keyCode != HOME_KEYCODE) {
		remove_key();
	}
}

function remove_key() {
	// turn menu on for linux
	if (os === OS_LINUX) {
		stop_menu = false;
	}
	key_pressed = 0;
}


function allow_selection() {
	for (var i in settings) {
		// need to check if key is 0 as key_pressed might not be accurate
		if (settings[i].mouse == mouse_button && settings[i].key == key_pressed) {
			setting = i;
			if (box !== null) {
				box.style.border = "2px dotted " + settings[i].color;
			}
			return true;
		}
	}
	return false;
}

function contextmenu(event) {
	if (stop_menu) {
		event.preventDefault();
	}
}
