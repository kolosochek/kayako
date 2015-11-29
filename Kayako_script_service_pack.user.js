// ==UserScript==
// @name        Kayako script service pack
// @namespace   https://support.mchost.ru/support/staff/*
// @description 31337 mchost ticket system help tools pack, like fast search in predefined replies, fast search into whois or dig and even more.
// @include		https://support.mchost.ru/support/*
// @version     1.2
// ==/UserScript==

//begin
var settings = new Object({
	'request_timeout': 5000, // request timeout 5s
	'refresh_timeout': 15000, // send request every 15 seconds
	'alert_file_url': "https://raw.githubusercontent.com/kolosochek/kayako/master/alert.mp3",
	'alert_file_url_ogg': '',
	'tickets_on_the_page_selector': "#ticketlist td.contenttableborder tr",
	'predefined_replies_url': "https://support.mchost.ru/support/staff/index.php?_m=tickets&_a=managepredreplies",
	// backup trmassaction block because we got wrong encoding in response
	mass_action_backup: document.getElementById('trmassaction'),
});

// inject custom css
var style = document.createElement('style');
style.innerHTML = '.observer_is_set { background: green }' +
'.observer_is_not_set { background: #E3858C }' +
'.observer_timeout { background: yellow }' + 
'#toolbox { padding: 5px; position: fixed; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; margin: 0 0 0 5px; }' +
document.body.appendChild(style);

var observer = new Object({
	tickets_on_the_page: document.querySelectorAll(settings.tickets_on_the_page_selector),
	timer: 0,
	refresh_tickets_on_the_page: function(){
		// don't forget to refresh tickets_on_the_page counter
		this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector);
		var tickets = this.tickets_on_the_page;
		// set target="_blank" to all a elements in the ticket to open new tickets in separate tab and don't break the observer
		for(i=0;i<tickets.length;i++){
			if ((tickets[i].id != '') && (tickets[i].id != "trmassaction")) { 
				var links = tickets[i].querySelectorAll("a"); 
				for (j=0;j<links.length;j++)
					{ links[j].target="_blank"}  
			}
		}
	},
	set_observer: function (){
		// debug
		console.log('the observer sucsessfully set');
		// hilight_area
		highlight_area.add_class("observer_is_set");
		highlight_area.remove_class("observer_is_not_set");
		highlight_area.remove_class("observer_timeout");
		// get page tickets
		this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector);//this.get_page_tickets();		
		// send request
		this.timer = setInterval(function(){
			var url = window.location.href;
			// debug
			console.log('Send request: '+ url);
			var xhr = new XMLHttpRequest();
			// create async request
			xhr.open('GET', url, true);
			xhr.send();
			xhr.onload = function () {
				response = xhr.responseText;
				// debug
				//console.log('response');
				//console.log(response);
				// refresh current tickets counter
				observer.refresh_tickets_on_the_page();					
				// slice tickets dom form string response
				var chunk_form = '<form name="ticketlist" id="ticketlist" action="index.php" method="POST">'
				var chunk_form_end = '</form>';
				var form_html = response.substring(response.search(chunk_form), response.search(chunk_form_end));
				form_html+= chunk_form_end;
				// debug
				//console.log(form_html);
				var dom = document.createElement('div');
				dom.innerHTML = form_html;
				// store new data in dummy html element
				var tickets_in_response = dom.querySelectorAll(settings.tickets_on_the_page_selector);//"tr.rownotes");
				// debug
				console.log('Tickets on the page: ' + (observer.tickets_on_the_page.length - 2));
				console.log('Tickets in response: ' + (tickets_in_response.length - 2));
				// check results
				if (observer.tickets_on_the_page.length < tickets_in_response.length){
					// debug
					console.log('Got new ticket!');
					//
					// play sound
					play_sound();
							// and then just apply new tickets to the page
					document.getElementById('ticketlist').innerHTML = dom.innerHTML;
					// restore trmassaction block from backup
					document.getElementById('trmassaction').innerHTML = settings.mass_action_backup.innerHTML;
				} else if(observer.tickets_on_the_page.length > tickets_in_response.length) {
					// insert loaded tickets
					document.getElementById('ticketlist').innerHTML = dom.innerHTML;
					// restore trmassaction block from backup
					document.getElementById('trmassaction').innerHTML = settings.mass_action_backup.innerHTML;
				} else {
					// debug
					console.log("No new tickets");
				}
				// refresh current tickets counter
				observer.refresh_tickets_on_the_page();
			}
			xhr.ontimeout = function(){
				// debug
				console.log('Timeout');
				// hilight_area
				highlight_area.remove_class("observer_is_set");
				highlight_area.remove_class("observer_is_not_set");
				highlight_area.add_class("observer_timeout");
			}
			// request timeout
			xhr.timeout = settings.request_timeout;
		}, settings.refresh_timeout);
	},
	remove_observer: function(){
		// debug
		console.log('the observer sucsessfully removed');
		clearInterval(this.timer);
	},
});

function play_sound(){   
    document.getElementById("prcachemenu_r").innerHTML='<audio autoplay="autoplay"><source src="' + settings.alert_file_url + '" type="audio/mpeg" /><source src="' + settings.alert_file_url_ogg + '" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + settings.alert_file_url +'" /></audio>';
}
// toolbox feature
var toolbox = document.createElement('div');
toolbox.id = 'toolbox';
toolbox.style.position = 'fixed';
var button_set_observer = '<button id="set_observer">Set observer</button>';
var button_remove_observer = '<button id="remove_observer">Remove observer</button>';
toolbox.innerHTML+=button_set_observer+button_remove_observer;
document.body.insertBefore(toolbox, document.body.firstChild);
// get created elements from dom
var button_set_observer = document.getElementById('set_observer');
var button_remove_observer = document.getElementById('remove_observer');
// bind event listener
// set
button_set_observer.addEventListener('click', function(){
	button_set_observer.disabled = 'true';
	button_remove_observer.disabled = '';
	// observer
	observer.set_observer();
	observer.refresh_tickets_on_the_page();
});
// remove
button_remove_observer.addEventListener('click', function(){
	button_set_observer.disabled = '';
	button_remove_observer.disabled = 'true';
	// hilight_area
	highlight_area.remove_class("observer_is_set");
	highlight_area.remove_class("observer_timeout");
	highlight_area.add_class("observer_is_not_set");
	// observer
	observer.remove_observer();
	observer.refresh_tickets_on_the_page();
});



//scroll top
var scrolltop = document.createElement('a');
scrolltop.textContent = "^";
scrolltop.id = 'scrolltop';
scrolltop.href = "javascript:void(0)";
scrolltop.style.position = 'fixed';
scrolltop.style.bottom = "20px";
scrolltop.style.right = "20px";
scrolltop.style.background = "#F0EADE";
scrolltop.style.color= "#6393DF";
scrolltop.style.padding = "15px";
scrolltop.style.borderRadius = "6px";

document.body.insertBefore(scrolltop, document.body.firstChild);

var scrolltop = document.getElementById('scrolltop');
// bind event listener
scrolltop.addEventListener('click', function(){
	window.scrollTo(0,0);
});



// hilight area feature
var highlight_area = new Object({
	highlight_area_element: document.getElementById("toolbox"),//("set_observer"),//("gridtableoptticketlist").nextSibling,
	toggle_class: function(className){
		this.highlight_area_element.classList.toggle(className);
	},	
	remove_class: function(className){
		this.highlight_area_element.classList.remove(className);
	},
	add_class: function(className){
		this.highlight_area_element.classList.add(className);
	}
});
// by default page observer is not set
highlight_area.add_class("observer_is_not_set");

//end 

/*
var script = document.createElement('script');
script.src = "https://raw.githubusercontent.com/kolosochek/kayako/master/autocomplete.js";
script.type = "text/javascript"
document.body.appendChild(script);
*/
//debug
//console.log("gotcha");
/*
GM_xmlhttpRequest({
	method:     "GET",
	url:        settings.predefined_replies_url,
	data:       "",
	headers:    {
		"Content-Type": "application/x-www-form-urlencoded"
	},
	onload: function (response) {
		// debug
		console.log(response);//.responseText);
	},
	ontimeout: function(){
		// debug
	    console.log('Timeout');
	},
	// request timeout
	timeout: settings.request_timeout,
});
var textarea = document.querySelector("#tab_ttpostreply textarea");
var another_crewmember_replying = "Внимание! На этот запрос уже отвечает другой сотрудник!\n"
var separator = ',';
// get current crewmember
var who_am_i = document.querySelectorAll("span.smalltext")[1].textContent.trim();
who_am_i = who_am_i.split('|')[0].replace('Logged In:', '').trim();

textarea.addEventListener('input', function(){
	if (document.querySelectorAll("#mcblock_reply").length){
		var crewmembers_replying = document.getElementById("mcblock_reply_users").textContent.trim();
		if (crewmembers_replying){
			var crewmembers_replying_arr = crewmembers_replying.split(separator);
			if (crewmembers_replying_arr){
				for(i=0;i<crewmembers_replying_arr.length;i++){
					if(crewmembers_replying_arr[i] != who_am_i){
						// change textarea style
						textarea.style.border = "4px solid red";
						textarea.style.background = "rgb(255, 201, 201) none repeat scroll 0% 0%;";
						textarea.style.width = "99%";

						if(!(this.value.search(another_crewmember_replying) + 1)){
							//this.value = another_crewmember_replying + this.value;
						}
					}
				}
			}
		}
	}
});
// debug
//console.log(textarea);
*/