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
	'request_timeout': 4000,
	'refresh_timeout': 15000, // send request every 15 seconds
	'alert_file_url': "https://raw.githubusercontent.com/kolosochek/kayako/master/alert.mp3",
	'alert_file_url_ogg': '',
	//'predefined_replies_url': "https://support.mchost.ru/support/staff/index.php?_m=tickets&_a=managepredreplies",
});

function set_observer(){
	// debug
	console.log('the observer is set');
	// get ticket list on current page
	var tickets_on_the_page = document.querySelectorAll("#ticketlist td.contenttableborder tr.row2");//"tr.rownotes");
	// send request
	var observer = setInterval(function(){
		console.log('Send request:');
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
				
				var chunk_form = '<form name="ticketlist" id="ticketlist" action="index.php" method="POST">'
				var chunk_form_end = '</form>';
				var form_html = response.responseText.substring(response.responseText.search(chunk_form), response.responseText.search(chunk_form_end));
				form_html+= chunk_form_end;
				// debug
				//console.log(form_html);
				var dom = document.createElement('div');
				dom.innerHTML = form_html;
				// store new data in dummy html element
				var tickets_in_responce = dom.querySelectorAll("#ticketlist td.contenttableborder tr.row2");//"tr.rownotes");
				// debug
				console.log('already on the page: '+ tickets_on_the_page.length);
				console.log('tickets in response: '+ tickets_in_responce.length);
				if (tickets_on_the_page.length < tickets_in_responce.length){
					// debug
					console.log('Got new ticket!');
					// play sound
					play_sound();
					// and then just apply new tickets to the page
					document.getElementById('ticketlist').innerHTML = dom.innerHTML;
					// don't forget to refresh tickets_on_the_page counter
					tickets_on_the_page = document.querySelectorAll("#ticketlist td.contenttableborder tr.row2");
				} else {
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
}

function play_sound(){   
    document.getElementById("prcachemenu_r").innerHTML='<audio autoplay="autoplay"><source src="' + settings.alert_file_url + '" type="audio/mpeg" /><source src="' + settings.alert_file_url_ogg + '" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + settings.alert_file_url +'" /></audio>';
}

function remove_observer(){

}

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
	set_observer();
});
// remove
button_remove_observer.addEventListener('click', function(){
	// debug
	console.log('gotcha');
	remove_observer();
});




// debug
//play_sound();
//end 