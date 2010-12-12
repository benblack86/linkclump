var z_index = 2147483647
var params = {
    mouse_button: null,
    key_code: null,
    os: null,
    smart_select: null,
    exclude_words: null,
    new_window: null
}
var state = {
	allowed: false,
    key_pressed: null,
	mouse_button: null,
    stop_menu: false,
    clump_on: false,
    smart_select: false,
	mouse_x: -1,
	mouse_y: -1,
	scroll_id: 0
}
var links = new Array()
var clump = null

chrome.extension.sendRequest({
    message: 'init'
}, function(state){
    update_param(state)
});

chrome.extension.onRequest.addListener(function(request, sender, callback){
    if (request.message == 'update') {
        update_param(request.params)
    }
});

function update_param(params){
    this.params = params
    var str = "";
    for (param in params) {
        str += param + ":" + params[param] + "|"
    };
    console.log(str)
}

function mousedown(event){
	state.mouse_button = event.button
	
    if (allow_selection()) {
        prevent_escalation(event)
        
        // stop user from selecting text/elements
        document.body.style.khtmlUserSelect = "none"
        
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
        if (params.os == 1) {
            state.stop_menu = false
        }
        
        // setup mouse move and mouse up
        window.addEventListener("mousemove", mousemove, true)
        window.addEventListener("mouseup", mouseup, true)
    }
}


function mousemove(event){
    prevent_escalation(event)
    
    if (allow_selection()) {
        update_box(event.pageX, event.pageY)
        
        // while detect keeps on calling false then recall the method
        while (!detech(event.pageX, event.pageY, false)) {
        }
    }
    else {
        stop()
    }
}

function update_box(x, y) {
	if(x > $(document).width()) {
		x = $(document).width()-5
	}
	
	if(y > $(document).height()) {
		y = $(document).height()-5
	}
	
	if (x > clump.x1) {
            clump.style.width = x - clump.x1 + "px"
        }
        else {
            clump.style.width = clump.x1 - x + "px"
            clump.style.left = x + "px"
        }
        if (y > clump.y1) {
            clump.style.height = y - clump.y1 + "px"
        }
        else {
            clump.style.height = clump.y1 - y + "px"
            clump.style.top = y + "px"
     }
}


function mouseup(event){
    prevent_escalation(event)
    
    if (allow_selection()) {
        detech(event.pageX, event.pageY, true)
    }
    
    stop()
}

function start(){
    document.body.appendChild(clump)
    
    // find all links (find them each time as they could have moved)
    var page_links = document.links;
    outerloop: for (var i = 0; i < page_links.length; i++) {
        if (page_links[i].href.match(/javascript\:/i)) {
            continue
        }
        
        if (params.exclude_words.length > 0) {
            for (var k = 0; k < params.exclude_words.length; k++) {
                if (page_links[i].innerHTML.toLowerCase().indexOf(params.exclude_words[k]) > -1) {
                    continue outerloop
                }
            }
        }
        
        var use_el;
        if (page_links[i].childNodes.length == 1 && page_links[i].childNodes[0].nodeName == "IMG") {
            use_el = page_links[i].childNodes[0];
        }
        else {
            use_el = page_links[i];
        }
		var link = use_el
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
            link = link.offsetParent;
        }
		

        var pos = $(use_el).offset()
		
		page_links[i].x1 = pos.left
        page_links[i].y1 = pos.top
        page_links[i].x2 = pos.left + use_el.offsetWidth
        page_links[i].y2 = pos.top + use_el.offsetHeight
		page_links[i].height = use_el.offsetHeight
		page_links[i].width = use_el.offsetWidth
		page_links[i].box = null
        
        if (params.smart_select && page_links[i].parentNode != null && page_links[i].parentNode.nodeName.match(/H\d/i)) {
            page_links[i].important = true
        }
        else {
            page_links[i].important = false
        }
		
		links.push(page_links[i])
    }
    
    state.clump_on = true
    
    // turn off menu for windows
    if (params.os == 1) {
        state.stop_menu = true
    }
}

function stop(){
    // allow user to select text/elements
    document.body.style.khtmlUserSelect = ""
    
    // turn off mouse move and mouse up
    window.removeEventListener("mousemove", mousemove, true)
    window.removeEventListener("mouseup", mouseup, true)
    
    if (state.clump_on) {
        clean_up()
    }
    
    // turn on menu for linux
    if (params.os == 0 && params.key_code != state.key_pressed) {
        state.stop_menu == false
    }
}

function clean_up(){
    // remove the box
    document.body.removeChild(clump)
    state.clump_on = false
    
    // remove the link boxes
    for (var i = 0; i < links.length; i++) {
        if (links[i].box != null) {
            document.body.removeChild(links[i].box);
            links[i].box = null
        }
    }
    links = new Array()
    
    // wipe clean the smart select
    state.smart_select = false
	state.mouse_button = -1
}

function scroll() {
	if (allow_selection()) {
		var y = state.mouse_y-window.scrollY

		if (y > window.innerHeight - 20) { //down
			var speed = window.innerHeight - y
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
			state.mouse_y += speed
			update_box(state.mouse_x, state.mouse_y)
			detech(state.mouse_x, state.mouse_y, false)
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
			state.mouse_y -= speed
			update_box(state.mouse_x, state.mouse_y)
			detech(state.mouse_x, state.mouse_y, false)
			return
		}
	}

	clearInterval(state.scroll_id)
	state.scroll_id = 0
}


function detech(x, y, open){
    clump.x2 = x
    clump.y2 = y
	state.mouse_x = x
	state.mouse_y = y
    
    var start_x, start_y, end_x, end_y = 0
    if (clump.x1 > clump.x2) {
        start_x = clump.x2
        end_x = clump.x1
    }
    else {
        start_x = clump.x1
        end_x = clump.x2
    }
    
    if (clump.y1 > clump.y2) {
        start_y = clump.y2
        end_y = clump.y1
    }
    else {
        start_y = clump.y1
        end_y = clump.y2
    }
    
    if (!state.clump_on) {
        if (end_x - start_x < 5 && end_y - start_y < 5) {
            return true
        }
        else {
            start()
        }
        
    }
	
	if(!state.scroll_id) {
		state.scroll_id = setInterval("scroll()", 100);
	}
	
    var count = 0
    var open_tabs = new Array
    for (var i = 0; i < links.length; i++) {
        if ((!state.smart_select || links[i].important) && !(links[i].x1 > end_x || links[i].x2 < start_x || links[i].y1 > end_y || links[i].y2 < start_y)) {
            if (open) {
                open_tabs.push(links[i].href)
            }
            
            // check if important links have been selected and possibly redo
            if (!state.smart_select) {
                if (links[i].important) {
                    state.smart_select = true
                    return false
                }
            }
            else {
                if (links[i].important) {
                    count++
                }
            }
            
            if (links[i].box == null) {
                var link_box = document.createElement("span")
                link_box.style.margin = "0px auto";
                link_box.style.border = "1px solid red";
                link_box.style.position = "absolute"
                link_box.style.width = links[i].width + "px"
                link_box.style.height = links[i].height + "px"
                link_box.style.top = links[i].y1 + "px"
                link_box.style.left = links[i].x1 + "px"
                link_box.style.zIndex = z_index
                document.body.appendChild(link_box);
                links[i].box = link_box
            }
            else {
                links[i].box.style.visibility = "visible"
            }
        }
        else {
            if (links[i].box != null) {
                links[i].box.style.visibility = "hidden"
            }
        }
    }
    
    // important links were found, but not anymore so redo
    if (state.smart_select && count == 0) {
        state.smart_select = false
        return false
    }
    
    if (open_tabs.length > 0) {
        chrome.extension.sendRequest({
            message: 'openLink',
            urls: open_tabs,
            new_window: params.new_window
        });
    }
    
    return true
}



function keydown(event){
    state.key_pressed = event.keyCode
    if (params.os == 0 && params.key_code == state.key_pressed) {
        state.stop_menu = true
    }
}

function keyup(event){
    // turn off menu for linux
    if (params.os == 0) {
        this.state.stop_menu = false
    }
    state.key_pressed = null
}


function allow_selection(){
    if ((params.key_code == '' || params.key_code == state.key_pressed) && state.mouse_button == params.mouse_button) {
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
