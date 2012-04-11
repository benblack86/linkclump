var linkclump = {
	z_index : 2147483647,
	settings : null,
	setting : -1,
	allowed: false,
	key_pressed: 0,
	mouse_button: null,
	stop_menu: false,
	box_on: false,
	smart_select: false,
	mouse_x: -1,
	mouse_y: -1,
	scroll_id: 0,
	links : [],
	box : null,
	overlay : null,
	scroll_bug_ignore : false,
	os: ((navigator.appVersion.indexOf("Win") == -1) ? 0 : 1),  // 1 = win, 0 = linux/mac
	timer: 0,
	
	initialize : function () {
		chrome.extension.sendRequest({
		    message: 'init'
		}, function(settings){
		    linkclump.settings = settings;
			//console.log(JSON.stringify(settings));
		});
		
		chrome.extension.sendRequest({
		    message: 'block'
		}, function(sites) {
			var allowed = 1;
			for(var i in sites) {
				if(sites[i] == '') continue;
				var re = new RegExp(sites[i],"i");
				
				if(re.test(window.location.href)) {
					allowed = 0;
					console.log("Linkclump is blocked on this site: "+sites[i]+"~"+window.location.href)
				}
			}
				
			if(allowed) {
				window.addEventListener("mousedown", linkclump.mousedown, true)
				window.addEventListener("keydown", linkclump.keydown, true)
				window.addEventListener("keyup", linkclump.keyup, true)
				window.addEventListener("blur", linkclump.blur, true)
				window.addEventListener("contextmenu", linkclump.contextmenu, true)
			}
		});

		chrome.extension.onRequest.addListener(function(request, sender, callback){
		    if (request.message == 'update') {
		        linkclump.settings = request.settings;
		    }
		});
		
    },

	mousedown : function(event){
		linkclump.mouse_button = event.button

		// turn on menu for windows
	    if (linkclump.os == 1) {
			linkclump.stop_menu = false
	    }

	    if (linkclump.allow_selection()) {
	        linkclump.prevent_escalation(event)
	        
	        // if mouse up timer is set then clear it as it was just caused by bounce
	        if(linkclump.timer != 0) {
	        	//console.log("bounced!");
	        	clearTimeout(linkclump.timer);
	        	linkclump.timer = 0;
	        	
	        	// keep menu off for windows
	    		if (linkclump.os == 1) {
					linkclump.stop_menu = true
	    		}
	        } else {
		        // clean up any mistakes
		        if (linkclump.box_on) {
		            console.log("box wasn't removed from previous operation")
		            linkclump.clean_up()
		        }
		      	
		      	// create the box
		        if (linkclump.box == null) {
					linkclump.box = document.createElement("span")
					linkclump.box.style.margin = "0px auto"
					linkclump.box.style.border = "2px dotted"+linkclump.settings[linkclump.setting].color;
					linkclump.box.style.position = "absolute"
					linkclump.box.style.zIndex = linkclump.z_index
					linkclump.box.style.visibility = "hidden"
					document.body.appendChild(linkclump.box)
		        }

		        // update position
				linkclump.box.x = event.pageX;
				linkclump.box.y = event.pageY;
				linkclump.update_box(event.pageX, event.pageY);
	
		        // setup mouse move and mouse up
		        window.addEventListener("mousemove", linkclump.mousemove, true)
		        window.addEventListener("mouseup", linkclump.mouseup, true)
		        window.addEventListener("mousewheel", linkclump.mousewheel, true)
		        window.addEventListener("mouseout", linkclump.mouseout, true)
		    }
	    }
	},


	mousemove : function(event){
		if(!linkclump.scroll_bug_ignore) {
			linkclump.mouse_button = event.button
		}
		
		//linkclump.mouse_button = event.button
	    linkclump.prevent_escalation(event)

	    if (linkclump.allow_selection() || linkclump.scroll_bug_ignore) {
	    	linkclump.scroll_bug_ignore = false;
	        linkclump.update_box(event.pageX, event.pageY)

	        // while detect keeps on calling false then recall the method
	        while (!linkclump.detech(event.pageX, event.pageY, false)) {}
	    } else {
	    	// only stop if the mouseup timer is no longer set
	    	if(linkclump.timer == 0) {
	        	linkclump.stop()
	        }
	    }
	},

	update_box : function(x, y) {
		var width = Math.max(document.documentElement["clientWidth"], document.body["scrollWidth"], document.documentElement["scrollWidth"], document.body["offsetWidth"], document.documentElement["offsetWidth"]);  // taken from jquery
		var height = Math.max(document.documentElement["clientHeight"], document.body["scrollHeight"], document.documentElement["scrollHeight"], document.body["offsetHeight"], document.documentElement["offsetHeight"]);  // taken from jquery
		x = Math.min(x, width-7);
		y = Math.min(y, height-7);
		
		if(x > linkclump.box.x) {
			linkclump.box.x1 = linkclump.box.x;
			linkclump.box.x2 = x;
		} else {
			linkclump.box.x1 = x;
			linkclump.box.x2 = linkclump.box.x;
		}
		if(y > linkclump.box.y) {
			linkclump.box.y1 = linkclump.box.y;
			linkclump.box.y2 = y;
		} else {
			linkclump.box.y1 = y;
			linkclump.box.y2 = linkclump.box.y;
		}
		
		linkclump.box.style.left = linkclump.box.x1+"px";
		linkclump.box.style.width = linkclump.box.x2-linkclump.box.x1+"px";
		linkclump.box.style.top = linkclump.box.y1+"px";
		linkclump.box.style.height = linkclump.box.y2-linkclump.box.y1+"px";
	},
	
	mousewheel : function (event) {
		linkclump.scroll_bug_ignore = true
	},

	mouseout : function (event) {
		linkclump.mousemove(event)
		// the mouse wheel event might also call this event
		linkclump.scroll_bug_ignore = true
	},

	mouseup : function (event) {
		linkclump.prevent_escalation(event)
		
		if(linkclump.box_on) {
			// all the detection of the mouse to bounce
			if (linkclump.allow_selection() && linkclump.timer == 0) {
				linkclump.timer = setTimeout(function () {
					linkclump.update_box(event.pageX, event.pageY);
		    		linkclump.detech(event.pageX, event.pageY, true);
	
		    		linkclump.stop()
		    		linkclump.timer = 0;
				}, 100);
			}
		} else {
			// false alarm
			linkclump.stop();
		}
	},
	
	getXY : function (element) {
		var x = 0;
		var y = 0;
		var parent = element;
		while(parent) {
			x += parent.offsetLeft;
			y += parent.offsetTop;
			parent = parent.offsetParent;
		}
		
		parent = element;
		while(parent && parent != document.body) {
			if(parent.scrollleft) {
				x -= parent.scrollLeft;
			}
			if(parent.scrollTop) {
				y -= parent.scrollTop;
			}
			parent = parent.parentNode;
		}
		
		return {x:x, y:y};
	},

	start : function () {
		// stop user from selecting text/elements
		document.body.style.khtmlUserSelect = "none"
	
		// turn on the box
	    linkclump.box.style.visibility = "visible";

	    // find all links (find them each time as they could have moved)
	    var page_links = document.links;
	    outerloop: for (var i = 0; i < page_links.length; i++) {
	        if (page_links[i].href.match(/javascript\:/i)) {
	            continue
	        }

	        if (linkclump.settings[linkclump.setting].options.ignore.length > 0) {
	            for (var k = 0; k < linkclump.settings[linkclump.setting].options.ignore.length; k++) {
	            	var pattern = new RegExp(linkclump.settings[linkclump.setting].options.ignore[k], 'i');
	                if (page_links[i].innerHTML.match(pattern) || page_links[i].href.match(pattern)) {
	                    continue outerloop
	                }
	            }
	        }

			// attempt to ignore invisible links (can't ignore overflow)
			var comp = window.getComputedStyle(page_links[i], null);
			if (comp.visibility == 'hidden' || comp.display == 'none') {
				continue outerloop
	        }

			var pos = linkclump.getXY(page_links[i])
			var width = page_links[i].offsetWidth
			var height = page_links[i].offsetHeight

			// attempt to get the actual size of the link
			for(var k = 0; k < page_links[i].childNodes.length; k++) {
				if(page_links[i].childNodes[k].nodeName == "IMG") {
					pos2 = linkclump.getXY(page_links[i].childNodes[k]);
					if(pos.y >= pos2.y) {
						pos.y = pos2.y
					
						width = Math.max(width, page_links[i].childNodes[k].offsetWidth);
						height = Math.max(height, page_links[i].childNodes[k].offsetHeight);
					}
				}
			}
	
			page_links[i].x1 = pos.x
	        page_links[i].y1 = pos.y
	        page_links[i].x2 = pos.x + width
	        page_links[i].y2 = pos.y + height
			page_links[i].height = height
			page_links[i].width = width
			page_links[i].box = null

	        if (linkclump.settings[linkclump.setting].options.smart == 0 && page_links[i].parentNode != null && page_links[i].parentNode.nodeName.match(/H\d/i)) {
	            page_links[i].important = true
	        }
	        else {
	            page_links[i].important = false
	        }

			linkclump.links.push(page_links[i])
	    }

	    linkclump.box_on = true

	    // turn off menu for windows so mouse up doesn't trigger context menu
	    if (linkclump.os == 1) {
	        linkclump.stop_menu = true
	    }
	},

	stop : function () {
	    // allow user to select text/elements
	    document.body.style.khtmlUserSelect = ""

	    // turn off mouse move and mouse up
	    window.removeEventListener("mousemove", linkclump.mousemove, true)
	    window.removeEventListener("mouseup", linkclump.mouseup, true)
	    window.removeEventListener("mousewheel", linkclump.mousewheel, true)
		window.removeEventListener("mouseout", linkclump.mouseout, true)

	    if (linkclump.box_on) {
	        linkclump.clean_up()
	    }

	    // turn on menu for linux
	    if (linkclump.os == 0 && linkclump.settings[linkclump.setting].key != linkclump.key_pressed) {
	        linkclump.stop_menu == false
	    }
	},

	clean_up : function () {
	    // remove the box
	    linkclump.box.style.visibility = "hidden"
	    linkclump.box_on = false

	    // remove the link boxes
	    for (var i = 0; i < linkclump.links.length; i++) {
	        if (linkclump.links[i].box != null) {
	            document.body.removeChild(linkclump.links[i].box);
	            linkclump.links[i].box = null
	        }
	    }
	    linkclump.links = []

	    // wipe clean the smart select
	    linkclump.smart_select = false
		linkclump.mouse_button = -1
		linkclump.key_pressed = 0;
	},

	scroll : function() {
		if (linkclump.allow_selection()) {
			var y = linkclump.mouse_y-window.scrollY
			var win_height = window.innerHeight

			if (y > win_height - 20) { //down
				var speed = win_height - y
				if (speed < 2) {
					speed = 60 
				}
				else if (speed < 10) {
					speed = 30;
				}
				else {
					speed = 10;
				}
				window.scrollBy(0, speed)
				linkclump.mouse_y += speed
				linkclump.update_box(linkclump.mouse_x, linkclump.mouse_y)
				linkclump.detech(linkclump.mouse_x, linkclump.mouse_y, false)
				
				linkclump.scroll_bug_ignore = true
				return
			}
			else if(window.scrollY > 0 && y < 20) { //up
				var speed = y
				if (speed < 2) {
					speed = 60
				}
				else if (speed < 10) {
					speed = 30;
				}
				else {
					speed = 10;
				}
				window.scrollBy(0, -speed)
				linkclump.mouse_y -= speed
				linkclump.update_box(linkclump.mouse_x, linkclump.mouse_y)
				linkclump.detech(linkclump.mouse_x, linkclump.mouse_y, false)
				
				linkclump.scroll_bug_ignore = true
				return
			}
		}

		clearInterval(linkclump.scroll_id)
		linkclump.scroll_id = 0
	},


	detech : function(x, y, open){
		linkclump.mouse_x = x
		linkclump.mouse_y = y

	    if (!linkclump.box_on) {
	        if (linkclump.box.x2 - linkclump.box.x1 < 5 && linkclump.box.y2 - linkclump.box.y1 < 5) {
	            return true
	        }
	        else {
	            linkclump.start()
	        }

	    }

		if(!linkclump.scroll_id) {
			linkclump.scroll_id = setInterval("linkclump.scroll()", 100);
		}

	    var count = 0;
	    var open_tabs = [];
	    for (var i = 0; i < linkclump.links.length; i++) {
	        if ((!linkclump.smart_select || linkclump.links[i].important) && !(linkclump.links[i].x1 > linkclump.box.x2 || linkclump.links[i].x2 < linkclump.box.x1 || linkclump.links[i].y1 > linkclump.box.y2 || linkclump.links[i].y2 < linkclump.box.y1)) {
	            if (open) {
	                open_tabs.push({"url": linkclump.links[i].href, "title": linkclump.links[i].innerText})
	            }

	            // check if important links have been selected and possibly redo
	            if (!linkclump.smart_select) {
	                if (linkclump.links[i].important) {
	                    linkclump.smart_select = true
	                    return false
	                }
	            }
	            else {
	                if (linkclump.links[i].important) {
	                    count++
	                }
	            }

	            if (linkclump.links[i].box == null) {
					var link_box = document.createElement("span")
					link_box.style.id = "linkclump-link"; //? link_box = $('<span id="linkclump-link" />');
					link_box.style.margin = "0px auto";
					link_box.style.border = "1px solid red";
					link_box.style.position = "absolute"
					link_box.style.width = linkclump.links[i].width + "px"
					link_box.style.height = linkclump.links[i].height + "px"
					link_box.style.top = linkclump.links[i].y1 + "px"
					link_box.style.left = linkclump.links[i].x1 + "px"
					link_box.style.zIndex = linkclump.z_index
					document.body.appendChild(link_box);
					linkclump.links[i].box = link_box;
	            }
	            else {
	                linkclump.links[i].box.style.visibility = "visible";
	            }
	        }
	        else {
	            if (linkclump.links[i].box != null) {
	                linkclump.links[i].box.style.visibility = "hidden";
	            }
	        }
	    }

	    // important links were found, but not anymore so redo
	    if (linkclump.smart_select && count == 0) {
	        linkclump.smart_select = false
	        return false
	    }

	    if (open_tabs.length > 0) {
	        chrome.extension.sendRequest({
	            message: 'activate',
	            urls: open_tabs,
	            setting: linkclump.settings[linkclump.setting]
	        });
	    }

	    return true
	},

	allow_key : function(keyCode) {
		for(var i in linkclump.settings) {
			if(linkclump.settings[i].key == keyCode) {
				return true;
			}
		}
		return false;
	},


	keydown : function(event){
	    linkclump.key_pressed = event.keyCode
	    // turn menu off for linux
	    if (linkclump.os == 0 && linkclump.allow_key(linkclump.key_pressed)) {
	        linkclump.stop_menu = true
	    }
	},
	
	blur : function() {
		linkclump.keyup();
	},

	keyup : function(event){
	    // turn menu on for linux
	    if (linkclump.os == 0) {
	        linkclump.stop_menu = false
	    }
	    linkclump.key_pressed = 0;
	},


	allow_selection : function(){
		for(var i in linkclump.settings) {
			// need to check if key is 0 as key_pressed might not be accurate
			if(linkclump.settings[i].mouse == linkclump.mouse_button && linkclump.settings[i].key == linkclump.key_pressed) {
				linkclump.setting = i;
				if(linkclump.box != null) {
					linkclump.box.style.border = "2px dotted "+linkclump.settings[i].color;
				}
				return true;
			}
		}
	    return false
	},

	prevent_escalation : function(event){
	    event.stopPropagation();
	    event.preventDefault();
	},

	contextmenu : function(event){
	    if (linkclump.stop_menu) {
	        event.preventDefault()
	    }
	}
	
};

linkclump.initialize();


