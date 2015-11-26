// ==UserScript==
// @name        Kayako script service pack
// @namespace   https://support.mchost.ru/support/staff/*
// @description 31337 mchost ticket system help tools pack, like fast search in predefined replies, fast search into whois or dig and even more.
// @include		https://support.mchost.ru/support/*
// @version     1
// @grant GM_xmlhttpRequest
// ==/UserScript==

//begin
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
	// request timeout, 4s for best perfomance
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
						if(!(this.value.search(another_crewmember_replying) + 1)){
							// change textarea style
							textarea.style.border = "4px solid red";
							textarea.style.background = "rgb(255, 201, 201) none repeat scroll 0% 0%;";
							textarea.style.width = "99%"
							//this.value = another_crewmember_replying + this.value;	
						}
					}
				}
			}
		}
	}
});
// debug
console.log(textarea);
*/



var settings = new Object({
	'request_timeout': 5000,
	'refresh_timeout': 15000, // send request every 15 seconds
	'alert_file_url': "https://raw.githubusercontent.com/kolosochek/kayako/master/alert.mp3",
	'alert_file_url_ogg': '',
	'tickets_on_the_page_selector': "#ticketlist td.contenttableborder tr",
	// backup trmassaction block because we got wrong encoding in response
	mass_action_backup: document.getElementById('trmassaction'),
	//'predefined_replies_url': "https://support.mchost.ru/support/staff/index.php?_m=tickets&_a=managepredreplies",
});

var observer = new Object({
	tickets_on_the_page: document.querySelectorAll(settings.tickets_on_the_page_selector),
	timer: 0,
	get_page_tickets: function(){
		// get ticket list on current page
		this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector);//"tr.row2");//"tr.rownotes");
		/*var backup;
		for(var i=0;i<this.tickets_on_the_page.length;i++){
			if((i>0) && (i<this.tickets_on_the_page.length - 1)){
				backup = this.tickets_on_the_page
			}
		}
		*/
	},
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
		/* 
		for(var i=0;i<this.tickets_on_the_page.length;i++){
			//for(i=0;i<tickets.length;i++){ if ((tickets[i].id != '') && (tickets[i].id != "trmassaction")) { console.log(tickets[i].querySelector("a")) }}
			// for(i=0;i<tickets.length;i++){ if ((tickets[i].id != '') && (tickets[i].id != "trmassaction")) { console.log(tickets[i]) }}
			if ((this.tickets_on_the_page[i].id != '') && (this.tickets_on_the_page[i].id != "trmassaction")) {
				var ticket_links = this.tickets_on_the_page[i].querySelectorAll('a');
				// debug
				console.log(ticket_links);
				// if we have some links tickets on the page
				if (ticket_links.length){
					// let's iterate in and change target attribute
					for(var i=0;i<this.ticket_links.length;i++){
						// debug
						console.log(ticket_links[i]);
						ticket_links[i].target = '_blank';
					}
				}
			}
			
		}
		*/
	},
	set_observer: function (){
		// debug
		console.log('the observer sucsessfully set');
		// get page tickets
		this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector);//this.get_page_tickets();		
		// send request
		this.timer = setInterval(function(){
			// debug
			console.log('Send request: '+ window.location.href);
			GM_xmlhttpRequest({
				method:     "GET",
				url:        window.location.href,
				data:       "",
				headers:    {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				onload: function (response) {
					// debug
					//console.log(response);//.responseText);
					// refresh current tickets counter
					observer.refresh_tickets_on_the_page();					
					// slice tickets dom form string response
					var chunk_form = '<form name="ticketlist" id="ticketlist" action="index.php" method="POST">'
					var chunk_form_end = '</form>';
					var form_html = response.responseText.substring(response.responseText.search(chunk_form), response.responseText.search(chunk_form_end));
					form_html+= chunk_form_end;
					// debug
					//console.log(form_html);
					var dom = document.createElement('div');
					dom.innerHTML = form_html;
					// store new data in dummy html element
					var tickets_in_response = dom.querySelectorAll(settings.tickets_on_the_page_selector);//"tr.rownotes");
					// debug
					console.log('tickets on the page: ' + (observer.tickets_on_the_page.length - 2));
					console.log('tickets in response: ' + (tickets_in_response.length - 2));
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
						settings.mass_action_backup.innerHTML = backup.innerHTML;
						// refresh current tickets counter
						observer.refresh_tickets_on_the_page();
					} else if(observer.tickets_on_the_page.length > tickets_in_response.length) {
						// insert loaded tickets
						document.getElementById('ticketlist').innerHTML = dom.innerHTML;
						// restore trmassaction block from backup
						settings.mass_action_backup.innerHTML = backup.innerHTML;
						// refresh current tickets counter
						observer.refresh_tickets_on_the_page();
					} else {
						// debug
						console.log("No new tickets");
					}
				},
				ontimeout: function(){
					// debug
				    console.log('Timeout');
				},
				// request timeout
				timeout: settings.request_timeout,
			});
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
toolbox.style.position = 'absolute';
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
	observer.set_observer();
});
// remove
button_remove_observer.addEventListener('click', function(){
	button_set_observer.disabled = '';
	button_remove_observer.disabled = 'true';
	observer.remove_observer();
});

//end 