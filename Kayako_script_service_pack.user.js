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

var settings = new Object({
	'request_timeout': 4000,
	'predefined_replies_url': "https://support.mchost.ru/support/staff/index.php?_m=tickets&_a=managepredreplies",
});
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
// get ticket list on current page
var tickets_on_the_page = document.querySelectorAll("tr.rownotes");
// and then store it

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
		var tickets_in_responce = response.responseText.match(/class="rownotes"/);
		console.log(tickets_in_responce);
	},
	ontimeout: function(){
		// debug
	    console.log('Timeout');
	},
	// request timeout
	timeout: settings.request_timeout,
});
//end 