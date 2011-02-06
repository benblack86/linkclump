var linkclump = {
	z_index : 2147483647,
	params : null,
	allowed: false,
	key_pressed: null,
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
	
	initialize : function () {
		chrome.extension.sendRequest({
		    message: 'init'
		}, function(state){
		    linkclump.update_param(state)
		});

		chrome.extension.onRequest.addListener(function(request, sender, callback){
		    if (request.message == 'update') {
		        linkclump.update_param(request.params)
		    }
		});
		
		window.addEventListener("mousedown", linkclump.mousedown, true)
		window.addEventListener("keydown", linkclump.keydown, true)
		window.addEventListener("keyup", linkclump.keyup, true)
		document.addEventListener("contextmenu", linkclump.contextmenu, true)
    },

	update_param : function(params){
	    linkclump.params = params
	    var str = "";
	    for (param in params) {
	        str += param + ":" + params[param] + "|"
	    };
	    console.log(str)
	},

	mousedown : function(event){
		linkclump.mouse_button = event.button

	    if (linkclump.allow_selection()) {
	        linkclump.prevent_escalation(event)

	        // stop user from selecting text/elements
	        document.body.style.khtmlUserSelect = "none"

	        // clean up any mistakes
	        if (linkclump.box_on) {
	            console.log("box wasn't removed from previous opertion")
	            linkclump.clean_up()
	        }

	        // create the box
	        if (linkclump.box == null) {
				linkclump.box = $('<span id="linkclump-box" />');
	            linkclump.box.css('zIndex', linkclump.z_index);
				linkclump.box.hide().appendTo($('body'));
	        }

	        // update position
			linkclump.box.x = event.pageX;
			linkclump.box.y = event.pageY;
			linkclump.update_box(event.pageX, event.pageY);

	        // setup mouse move and mouse up
	        window.addEventListener("mousemove", linkclump.mousemove, true)
	        window.addEventListener("mouseup", linkclump.mouseup, true)
	    }

		// turn on menu for windows
	    if (linkclump.params.os == 1) {
			linkclump.stop_menu = false
	    }
	},


	mousemove : function(event){
	    linkclump.prevent_escalation(event)

	    if (linkclump.allow_selection()) {
	        linkclump.update_box(event.pageX, event.pageY)

	        // while detect keeps on calling false then recall the method
	        while (!linkclump.detech(event.pageX, event.pageY, false)) {
	        }
	    }
	    else {
	        linkclump.stop()
	    }
	},

	update_box : function(x, y) {
		x = Math.min(x, $(document).width()-7);
		y = Math.min(y, $(document).height()-7);
	
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
		
		linkclump.box.css('left', linkclump.box.x1+"px");
		linkclump.box.css('width', linkclump.box.x2-linkclump.box.x1+"px");
		linkclump.box.css('top', linkclump.box.y1+"px");
		linkclump.box.css('height', linkclump.box.y2-linkclump.box.y1+"px");
	},


	mouseup : function (event) {
	    linkclump.prevent_escalation(event)

	    if (linkclump.allow_selection()) {
			linkclump.update_box(event.pageX, event.pageY);
	        linkclump.detech(event.pageX, event.pageY, true);
	    }

	    linkclump.stop()
	},

	start : function () {
	    linkclump.box.show();

	    // find all links (find them each time as they could have moved)
	    var page_links = document.links;
	    outerloop: for (var i = 0; i < page_links.length; i++) {
	        if (page_links[i].href.match(/javascript\:/i)) {
	            continue
	        }

	        if (linkclump.params.exclude_words.length > 0) {
	            for (var k = 0; k < linkclump.params.exclude_words.length; k++) {
	                if (page_links[i].innerHTML.toLowerCase().indexOf(linkclump.params.exclude_words[k]) > -1) {
	                    continue outerloop
	                }
	            }
	        }

			// attempt to ignore invisible links (can't ignore overflow)
			var comp = window.getComputedStyle(page_links[i], null);
			if (comp.visibility == 'hidden' || comp.display == 'none') {
				continue outerloop
	        }

			var link = $(page_links[i]);
			var left = link.offset().left
			var top = link.offset().top
			var width = link.outerWidth()
			var height = link.outerHeight();

			// attempt to get the actual size of the link
			for(var k = 0; k < page_links[i].childNodes.length; k++) {
				if(page_links[i].childNodes[k].nodeName == "IMG") {
					inside = $(page_links[i].childNodes[k]);
					left = Math.min(left, inside.offset().left);
					top = Math.min(top, inside.offset().top);
					width = Math.max(width, inside.outerWidth());
					height = Math.max(height, inside.outerHeight());
				}
			}
	
			page_links[i].x1 = left
	        page_links[i].y1 = top
	        page_links[i].x2 = left + width
	        page_links[i].y2 = top + height
			page_links[i].height = height
			page_links[i].width = width
			page_links[i].box = null

	        if (linkclump.params.smart_select && page_links[i].parentNode != null && page_links[i].parentNode.nodeName.match(/H\d/i)) {
	            page_links[i].important = true
	        }
	        else {
	            page_links[i].important = false
	        }

			linkclump.links.push(page_links[i])
	    }

	    linkclump.box_on = true

	    // turn off menu for windows
	    if (linkclump.params.os == 1) {
	        linkclump.stop_menu = true
	    }
	},

	stop : function () {
	    // allow user to select text/elements
	    document.body.style.khtmlUserSelect = ""

	    // turn off mouse move and mouse up
	    window.removeEventListener("mousemove", linkclump.mousemove, true)
	    window.removeEventListener("mouseup", linkclump.mouseup, true)

	    if (linkclump.box_on) {
	        linkclump.clean_up()
	    }

	    // turn on menu for linux
	    if (linkclump.params.os == 0 && linkclump.params.key_code != linkclump.key_pressed) {
	        linkclump.stop_menu == false
	    }
	},

	clean_up : function () {
	    // remove the box
	    linkclump.box.hide();
	    linkclump.box_on = false

	    // remove the link boxes
	    for (var i = 0; i < linkclump.links.length; i++) {
	        if (linkclump.links[i].box != null) {
	            linkclump.links[i].box.remove()
	            linkclump.links[i].box = null
	        }
	    }
	    linkclump.links = []

	    // wipe clean the smart select
	    linkclump.smart_select = false
		linkclump.mouse_button = -1
	},

	scroll : function() {
		if (linkclump.allow_selection()) {
			var y = linkclump.mouse_y-window.scrollY;
			var win_height = $(window).height();

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
	                open_tabs.push(linkclump.links[i].href)
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
					link_box = $('<span id="linkclump-link" />');
		            link_box.css('zIndex', linkclump.z_index);
		            link_box.css('width', linkclump.links[i].width + "px");
	                link_box.css('height', linkclump.links[i].height + "px");
	                link_box.css('top', linkclump.links[i].y1 + "px");
	                link_box.css('left', linkclump.links[i].x1 + "px");
					link_box.appendTo($('body'));

	                linkclump.links[i].box = link_box
	            }
	            else {
	                linkclump.links[i].box.show();
	            }
	        }
	        else {
	            if (linkclump.links[i].box != null) {
	                linkclump.links[i].box.hide();
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
	            message: 'openLink',
	            urls: open_tabs,
	            new_window: linkclump.params.new_window
	        });
	    }

	    return true
	},



	keydown : function(event){
	    linkclump.key_pressed = event.keyCode
	    if (linkclump.params.os == 0 && linkclump.params.key_code == linkclump.key_pressed) {
	        linkclump.stop_menu = true
	    }
	},

	keyup : function(event){
	    // turn off menu for linux
	    if (linkclump.params.os == 0) {
	        linkclump.stop_menu = false
	    }
	    linkclump.key_pressed = null
	},


	allow_selection : function(){
	    if ((linkclump.params.key_code == '' || linkclump.params.key_code == linkclump.key_pressed) && linkclump.mouse_button == linkclump.params.mouse_button) {
			return true
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


