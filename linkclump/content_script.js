var z_index = 2147483647
var doc = document.body
var properties = {
    mouse_button: null,
    key_code: null,
    os: null,
	smart_select: null
}
var state = {
    key_pressed: null,
    stop_menu: false,
    clump_on: false,
	smart_select: false
}
var links = new Array()
var clump = null

chrome.extension.sendRequest({
    message: 'init'
}, function(state){
    update_status(state)
});

chrome.extension.onRequest.addListener(function(request, sender, callback){
    if (request.message == 'update') {
        update_status(request)
    }
});

function update_status(properties){
    this.properties.os = properties.os
	this.properties.smart_select = properties.smart_select
    
    if (properties.mouse_button != null) {
        this.properties.mouse_button = properties.mouse_button
    }
    if (properties.key_code != null) {
        this.properties.key_code = properties.key_code.toUpperCase()
    }
    
    console.log(this.properties.mouse_button + "|" + this.properties.key_code + "|"+this.properties.smart_select)
}

function mousedown(event){
    if (allow_selection(event)) {
        prevent_escalation(event)
        
        // stop user from selecting text/elements
        doc.style.khtmlUserSelect = "none"
        
        // clean up any mistakes
        if (state.clump_on) {
            console.log("box wasn't removed from previous opertion")
            clean_up()
        }
        
        // create the box but don't add to document
        if (clump == null) {
            clump = document.createElement("span")
            clump.style.margin = "0px auto"
            clump.style.border = "2px dotted orange"
            clump.style.position = "absolute"
            clump.style.zIndex = z_index
            clump.style.visibility = "visible"
        }
        
		// update position
        clump.x1 = event.pageX
        clump.y1 = event.pageY
        clump.x2 = 0
        clump.y2 = 0
        clump.style.top = clump.y1 + "px"
        clump.style.left = clump.x1 + "px"
        clump.style.width = "0px"
        clump.style.height = "0px"
        
		// turn on menu for windows
        if (properties.os == 1) {
            state.stop_menu = false
        }
        
        // setup mouse move and mouse up
        window.addEventListener("mousemove", mousemove, true)
        window.addEventListener("mouseup", mouseup, true)
    }
}


function mousemove(event){
    prevent_escalation(event)
    
    if (allow_selection(event)) {
        // update box and possibly swap coordinates
        if (event.pageX > clump.x1) {
            clump.style.width = event.pageX - clump.x1 + "px"
        } else {
            clump.style.width = clump.x1 - event.pageX + "px"
            clump.style.left = event.pageX + "px"
        }
        if (event.pageY > clump.y1) {
            clump.style.height = event.pageY - clump.y1 + "px"
        } else {
            clump.style.height = clump.y1 - event.pageY + "px"
            clump.style.top = event.pageY + "px"
        }
        
		// while detect keeps on calling false then recall the method
        while(!detech(event, false)) {}
    } else {
       terminate()
    }
}


function mouseup(event){
    prevent_escalation(event)
    
    if (allow_selection(event)) {
        detech(event, true)
    }
    
    terminate()
}

function setup(){
    doc.appendChild(clump)
    
    // find all links (find them each time as they could have moved)
    var page_links = document.links;
    outerloop: for (var i = 0; i < page_links.length; i++) {
        var y = 0;
        var x = 0;
        var link = page_links[i];
        while (link != null) {
            if (window.getComputedStyle(link, null).display == 'none') {
                continue outerloop
            }
            if (window.getComputedStyle(link, null).visibility == 'hidden') {
                continue outerloop
            }
            if (parseInt(window.getComputedStyle(link, null).zIndex) < 0) {
                continue outerloop
            }
            
            y += link.offsetTop;
            x += link.offsetLeft;
            link = link.offsetParent;
        }
        
        link = page_links[i];
        while (link && link != document.body && link != document.documentElement) {
            if (link.scrollLeft) {
                x -= link.scrollLeft
            }
            if (link.scrollTop) {
                y -= link.scrollTop
            }
            link = link.parentNode
        }
        
        page_links[i].x1 = x
        page_links[i].y1 = y
        page_links[i].x2 = x + (page_links[i].offsetWidth)
        page_links[i].y2 = y + page_links[i].offsetHeight
        page_links[i].box = null
        
        links.push(page_links[i])
		
		if(properties.smart_select && page_links[i].parentNode != null && page_links[i].parentNode.nodeName.match(/H\d/i)) {
			page_links[i].important = true
		} else {
			page_links[i].important = false
		}
    }
    
    state.clump_on = true
	
	// turn off menu for windows
	if(properties.os == 1) {
		state.stop_menu = true
	}
}

function terminate(){
    // allow user to select text/elements
    doc.style.khtmlUserSelect = ""
    
    // turn off mouse move and mouse up
    window.removeEventListener("mousemove", mousemove, true)
    window.removeEventListener("mouseup", mouseup, true)
    
    if (state.clump_on) {
        clean_up()
    }
    
	// turn on menu for linux
    if (properties.os == 0 && properties.key_code != state.key_pressed) {
        state.stop_menu == false
    }
}

function clean_up(){
    // remove the box
    doc.removeChild(clump)
    state.clump_on = false
    
    // remove the link boxes
    for (var i = 0; i < links.length; i++) {
        if (links[i].box != null) {
            doc.removeChild(links[i].box);
            links[i].box = null
        }
    }
    links = new Array()
	
	// wipe clean the smart select
	state.smart_select = false
}

function detech(event, open){
    clump.x2 = event.pageX
    clump.y2 = event.pageY
    
    var start_x, start_y, end_x, end_y = 0
    if (clump.x1 > clump.x2) {
        start_x = clump.x2
        end_x = clump.x1
    } else {
        start_x = clump.x1
        end_x = clump.x2
    }
    
    if (clump.y1 > clump.y2) {
        start_y = clump.y2
        end_y = clump.y1
    } else {
        start_y = clump.y1
        end_y = clump.y2
    }
    
    if (!state.clump_on) {
        if (end_x - start_x < 5 && end_y - start_y < 5) {
            return true
        } else {
            setup()
        }
        
    }
    var count = 0
    for (var i = 0; i < links.length; i++) {
        if ((!state.smart_select || links[i].important) && !(links[i].x1 > end_x || links[i].x2 < start_x || links[i].y1 > end_y || links[i].y2 < start_y)) {
            if (open) {
                chrome.extension.sendRequest({
                    message: 'openLink',
                    url: links[i].href
                });
            }
		
			// check if important links have been selected and possibly redo
			if (!state.smart_select) {
				if (links[i].important) {
					state.smart_select = true
					return false
				}
			} else {
				if (links[i].important) {
					count++
				}
			}
            
            if (links[i].box == null) {
                var link_box = document.createElement("span")
                link_box.style.margin = "0px auto";
                link_box.style.border = "1px solid red";
                link_box.style.position = "absolute"
                link_box.style.width = links[i].offsetWidth + "px"
                link_box.style.height = links[i].offsetHeight + "px"
                link_box.style.top = links[i].y1 + "px"
                link_box.style.left = links[i].x1 + "px"
                link_box.style.zIndex = z_index
                doc.appendChild(link_box);
                links[i].box = link_box
            } else {
                links[i].box.style.visibility = "visible"
            }
        } else {
            if (links[i].box != null) {
                links[i].box.style.visibility = "hidden"
            }
        }
    }
	
	// important links were found, but not anymore so redo
	if(state.smart_select && count == 0) {
		state.smart_select = false
		return false
	}
	
	return true
}



function keydown(event){
    state.key_pressed = String.fromCharCode(event.keyCode) // always capital
    if (properties.os == 0 && properties.key_code == state.key_pressed) {
        state.stop_menu = true
    }
}

function keyup(event){
	// turn off menu for linux
    if (properties.os == 0) {
        this.state.stop_menu = false
    }
    state.key_pressed = null
}


function allow_selection(event){
    if ((properties.key_code == '' || properties.key_code == state.key_pressed) && event.button == properties.mouse_button) {
        return true
    }
    return false
}

function prevent_escalation(event){
    event.stopPropagation();
    event.preventDefault();
}

function contextmenu(event){
    if (state.stop_menu) {
        event.preventDefault()
    }
}

window.addEventListener("mousedown", mousedown, true)
window.addEventListener("keydown", keydown, true)
window.addEventListener("keyup", keyup, true)
document.addEventListener("contextmenu", contextmenu, true)
