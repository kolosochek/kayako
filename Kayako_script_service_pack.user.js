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
	// autocomplete settings
	'defaultExtension': 'jpg',
	'defaultQASearchAnchor': '!найди',
	'defaultMchelpSearchAnchor': "!помощь",
	'defaultWhoisSearchAnchor': "!whois",
	'defaultDigSearchAnchor': "!dig",
});

// inject custom css
var style = document.createElement('style');
style.innerHTML = '.observer_is_set { background: green }' +
'.observer_is_not_set { background: #E3858C }' +
'.row1 { position:relative }' + 
'#autocomplete_dropdown { margin: 0 0 0 8px !important; top: 18px !important; max-height: auto !important; min-height: 100% !important; font-weight: 100; }' + 
'#autocomplete_dropdown div { border-bottom: 1px solid gray; margin-bottom: 0px }' + 
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
				// hilight_area
				highlight_area.add_class("observer_is_set");
				highlight_area.remove_class("observer_is_not_set");
				highlight_area.remove_class("observer_timeout");
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
// and remove_observer button is disabled
button_set_observer.disabled = '';
button_remove_observer.disabled = 'true';

// reply page features
var reply_input = document.querySelector("#replyform textarea");
var reply_button = document.querySelector("#ttpostreply");
reply_button.setAttribute('onclick', "switchGridTab('ttpostreply', 'tickets'); document.replyform.replycontents.focus();");
reply_button.setAttribute('href','javascript:void(0);');

function autocomplete(container, config){
    config = config || {};
    config.fontSize =                       config.fontSize   || '12px';
    config.fontFamily =                     config.fontFamily || 'Verdana,Arial';
    config.promptInnerHTML =                config.promptInnerHTML || '';
    config.color =                          config.color || '#4F4F4F';
    config.hintColor =                      config.hintColor || '#aaa';
    config.backgroundColor =                config.backgroundColor || '#fff';
    config.dropDownBorderColor =            config.dropDownBorderColor || '#aaa';
    config.dropDownZIndex =                 config.dropDownZIndex || '100'; // to ensure we are in front of everybody
    config.dropDownOnHoverBackgroundColor = config.dropDownOnHoverBackgroundColor || '#ddd';

    var txtInput = document.querySelector("#tab_ttpostreply textarea") || document.createElement('textarea');
    txtInput.spellcheck = false;

    var txtHint = document.createElement("input");
    //txtInput.cloneNode();
    txtHint.id = 'autocomplete_hint';
    txtHint.disabled='';
    txtHint.style.position = 'absolute';
    txtHint.style.top =  '12px';
    //txtHint.style.left = '0';
    txtHint.style.width = '100%';
    //txtHint.style.height = '100%';
    txtHint.style.textTransform = 'lowercase';
    txtHint.style.borderColor = 'transparent';
    txtHint.style.background = 'transparent';
    txtInput.style.backgroundColor ='transparent';
    txtHint.style.boxShadow =   'none';
    txtHint.style.color = config.hintColor;    
    txtInput.style.verticalAlign = 'top';
    txtInput.style.position = 'relative';

    var wrapper = document.createElement('div');
    wrapper.id = 'autocomplete_wrapper';
    //wrapper.style.position = 'relative';
    wrapper.style.height = '100%';
    wrapper.style.outline = '0';
    wrapper.style.border =  '0';
    wrapper.style.margin =  '0';
    wrapper.style.padding = '0';

    var prompt = document.createElement('div');
    prompt.id = "autocomplete_prompt";
    prompt.style.position = 'absolute';
    prompt.style.outline = '0';
    prompt.style.margin =  '0';
    prompt.style.padding = '0';
    prompt.style.border =  '0';
    prompt.style.fontSize =   config.fontSize;
    prompt.style.fontFamily = config.fontFamily;
    prompt.style.color =           config.color;
    prompt.style.backgroundColor = config.backgroundColor;
    prompt.style.top = '0';
    prompt.style.left = '0';
    prompt.style.overflow = 'hidden';
    prompt.innerHTML = config.promptInnerHTML;
    prompt.style.background = 'transparent';
    if (document.body === undefined) {
        throw 'document.body is undefined. The library was wired up incorrectly.';
    }
    document.body.appendChild(prompt);
    var w = prompt.getBoundingClientRect().right; // works out the width of the prompt.
    wrapper.appendChild(prompt);
    prompt.style.visibility = 'visible';
    prompt.style.left = '-'+w+'px';
    wrapper.style.marginLeft= w+'px';

    wrapper.appendChild(txtHint);
    wrapper.appendChild(txtInput);

    var dropDown = document.createElement('div');
    dropDown.id = "autocomplete_dropdown";
    dropDown.style.position = 'absolute';
    dropDown.style.visibility = 'hidden';
    dropDown.style.top = '0px !important';
    dropDown.style.margin = "0 0 0 8px";
    dropDown.style.outline = '0';
    dropDown.style.margin =  '0';
    dropDown.style.padding = '0';
    dropDown.style.textAlign = 'left';
    dropDown.style.fontSize =   config.fontSize;
    dropDown.style.fontFamily = config.fontFamily;
    dropDown.style.backgroundColor = config.backgroundColor;
    dropDown.style.zIndex = config.dropDownZIndex;
    dropDown.style.cursor = 'default';
    dropDown.style.borderStyle = 'solid';
    dropDown.style.borderWidth = '0px';
    dropDown.style.borderColor = config.dropDownBorderColor;
    dropDown.style.overflowX= 'hidden';
    dropDown.style.whiteSpace = 'pre';
    dropDown.style.overflowY = 'scroll';  // note: this might be ugly when the scrollbar is not required. however in this way the width of the dropDown takes into account

    var createDropDownController = function(elem) {
        var rows = [];
        var ix = 0;
        var oldIndex = -1;

        var onMouseOver =  function() { this.style.outline = '1px solid #ddd'; }
        var onMouseOut =   function() { this.style.outline = '0'; }
        var onMouseDown =  function() { p.hide(); p.onmouseselection(this.__hint); }

        var p = {
            hide :  function() { 
                elem.style.visibility = 'hidden'; 
                var hint = document.querySelector("#autocomplete_hint"); 
                hint.style.visibility = 'visible'; 
            },
            refresh : function(token, array) {
                elem.style.visibility = 'hidden';
                ix = 0;
                elem.innerHTML ='';
                var vph = (window.innerHeight || document.documentElement.clientHeight);
                var rect = elem.parentNode.getBoundingClientRect();
                var distanceToTop = rect.top - 6;                        // heuristic give 6px
                var distanceToBottom = vph - rect.bottom -6;  // distance from the browser border.

                rows = [];
                for (var i=0;i<array.length;i++) {
                    if (array[i].indexOf(token)!==0) { continue; }
                    var divRow =document.createElement('div');
                    divRow.style.color = config.color;
                    divRow.onmouseover = onMouseOver;
                    divRow.onmouseout =  onMouseOut;
                    divRow.onmousedown = onMouseDown;
                    divRow.__hint =    array[i];
                    divRow.innerHTML = token+'<b>'+array[i].substring(token.length)+'</b>';
                    rows.push(divRow);
                    elem.appendChild(divRow);
                }
                if (rows.length===0) {
                    return; // nothing to show.
                    // debug
                    console.log('no rows');
                }
                if (rows.length===1 && token === rows[0].__hint) {
                    return; // do not show the dropDown if it has only one element which matches what we have just displayed.
                    // debug
                    console.log('one row(hint)');
                }

                if (rows.length<2) return;
                p.highlight(0);

                if (distanceToTop > distanceToBottom*3) {        // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
                    elem.style.maxHeight =  distanceToTop+'px';  // we display the dropDown on the top of the input text
                    elem.style.top ='';
                    elem.style.bottom ='100%';
                } else {
                    elem.style.top = '100%';
                    elem.style.bottom = '';
                    elem.style.maxHeight =  distanceToBottom+'px';
                }
                elem.style.visibility = 'visible';
                var ddown = document.querySelector("#autocomplete_dropdown");
                if (ddown.style.visibility == 'visible'){
                    var hint = document.querySelector("#autocomplete_hint");
                    hint.style.visibility = 'hidden';
                } else {
                    var hint = document.querySelector("#autocomplete_hint");
                    hint.style.visibility = 'visible';
                }

            },
            highlight : function(index) {
                if (oldIndex !=-1 && rows[oldIndex]) {
                    rows[oldIndex].style.backgroundColor = config.backgroundColor;
                }
                rows[index].style.backgroundColor = config.dropDownOnHoverBackgroundColor; // <-- should be config
                oldIndex = index;
            },
            move : function(step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
                if (elem.style.visibility === 'hidden')             return ''; // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
                if (ix+step === -1 || ix+step === rows.length) return rows[ix].__hint; // NO CIRCULAR SCROLLING.
                ix+=step;
                p.highlight(ix);
                return rows[ix].__hint;//txtShadow.value = uRows[uIndex].__hint ;
            },
            onmouseselection : function() {} // it will be overwritten.
        };
        return p;
    };

    var dropDownController = createDropDownController(dropDown);

    dropDownController.onmouseselection = function(text) {
        txtInput.value = txtHint.value = leftSide+text;
        rs.onChange(txtInput.value); // <-- forcing it.
        registerOnTextChangeOldValue = txtInput.value; // <-- ensure that mouse down will not show the dropDown now.
        setTimeout(function() { txtInput.focus(); },0);  // <-- I need to do this for IE
    };

    wrapper.appendChild(dropDown);
    container.appendChild(wrapper);

    var spacer;
    var leftSide; // <-- it will contain the leftSide part of the textfield (the bit that was already autocompleted)


    function calculateWidthForText(text) {
        if (spacer === undefined) { // on first call only.
            spacer = document.createElement('span');
            spacer.style.visibility = 'hidden';
            spacer.style.position = 'fixed';
            spacer.style.outline = '0';
            spacer.style.margin =  '0';
            spacer.style.padding = '0';
            spacer.style.border =  '0';
            spacer.style.left = '0';
            spacer.style.whiteSpace = 'pre';
            spacer.style.fontSize =   config.fontSize;
            spacer.style.fontFamily = config.fontFamily;
            spacer.style.fontWeight = 'normal';
            document.body.appendChild(spacer);
        }

        // Used to encode an HTML string into a plain text.
        // taken from http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
        spacer.innerHTML = String(text).replace(/&/g, '&amp;')
                                       .replace(/"/g, '&quot;')
                                       .replace(/'/g, '&#39;')
                                       .replace(/</g, '&lt;')
                                       .replace(/>/g, '&gt;');
        return spacer.getBoundingClientRect().right;
    };


    var rs = {
        onArrowDown : function() {},               // defaults to no action.
        onArrowUp :   function() {},               // defaults to no action.
        onEnter :     function() {},               // defaults to no action.
        onTab :       function() {},               // defaults to no action.
        onChange:     function() { rs.repaint() }, // defaults to repainting.
        onContains:   function(value) { return this.value.search(value) + 1},
        startFrom:    0,
        options:      [],
        wrapper : wrapper,      // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
        input :  txtInput,      // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
        hint  :  txtHint,       // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
        dropDown :  dropDown,         // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
        prompt : prompt,
        setText : function(text) {
            txtHint.value = text;
            txtInput.value = text;
        },
        getText : function() {
            return txtInput.value;
        },
        hideDropDown : function() {
            dropDownController.hide();
        },
        repaint : function() {
            var text = txtInput.value;
            var startFrom =  rs.startFrom;
            var options =    rs.options;
            var optionsLength = options.length;
            // breaking text in leftSide and token.
            var token = text.substring(startFrom);
            leftSide =  text.substring(0,startFrom);
            // updating the hint.
            txtHint.value ='';
            for (var i=0;i<optionsLength;i++) {
                var opt = options[i];
                if (opt.indexOf(token)===0) {         // <-- how about upperCase vs. lowercase
                    txtHint.value = leftSide +opt;
                    break;
                }
            }
            // debug
            console.log('repaint');
            console.log(options.length);
            if (options.length==1){
                console.log('options.length==1');
                var hint = document.querySelector("#autocomplete_hint");
                hint.value = leftSide + options[0];
                hint.visibility = 'visible';
            }
            // moving the dropDown and refreshing it.
            dropDown.style.left = calculateWidthForText(leftSide)+'px';
            dropDownController.refresh(token, rs.options);
        }
    };

    var registerOnTextChangeOldValue;

    /**
     * Register a callback function to detect changes to the content of the input-type-text.
     * Those changes are typically followed by user's action: a key-stroke event but sometimes it might be a mouse click.
    **/
    var registerOnTextChange = function(txt, callback) {
        registerOnTextChangeOldValue = txt.value;
        var handler = function() {
            var value = txt.value;
            if (registerOnTextChangeOldValue !== value) {
                registerOnTextChangeOldValue = value;
                callback(value);
            }
        };

        //
        // For user's actions, we listen to both input events and key up events
        // It appears that input events are not enough so we defensively listen to key up events too.
        // source: http://help.dottoro.com/ljhxklln.php
        //
        // The cost of listening to three sources should be negligible as the handler will invoke callback function
        // only if the text.value was effectively changed.
        //
        //
        if (txt.addEventListener) {
            txt.addEventListener("input",  handler, false);
            txt.addEventListener('keyup',  handler, false);
            txt.addEventListener('change', handler, false);
        } else { // is this a fair assumption: that attachEvent will exist ?
            txt.attachEvent('oninput', handler); // IE<9
            txt.attachEvent('onkeyup', handler); // IE<9
            txt.attachEvent('onchange',handler); // IE<9
        }
    };


    registerOnTextChange(txtInput,function(text) { // note the function needs to be wrapped as API-users will define their onChange
        rs.onChange(text);
    });


    var keyDownHandler = function(e) {
        e = e || window.event;
        var keyCode = e.keyCode;

        if (keyCode == 33) { return; } // page up (do nothing)
        if (keyCode == 34) { return; } // page down (do nothing);

        if (keyCode == 27) { //escape
            dropDownController.hide();
            txtHint.value = txtInput.value; // ensure that no hint is left.
            txtInput.focus();
            return;
        }

        if (keyCode == 39 || keyCode == 35 || keyCode == 9) { // right,  end, tab  (autocomplete triggered)
            if (keyCode == 9) { // for tabs we need to ensure that we override the default behaviour: move to the next focusable HTML-element
                e.preventDefault();
                e.stopPropagation();
                if (txtHint.value.length == 0) {
                    rs.onTab(); // tab was called with no action.
                                // users might want to re-enable its default behaviour or handle the call somehow.
                }
            }
            if (txtHint.value.length > 0) { // if there is a hint
                dropDownController.hide();
                txtInput.value = txtHint.value;
                var hasTextChanged = registerOnTextChangeOldValue != txtInput.value
                registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again.
                                                          // for example imagine the array contains the following words: bee, beef, beetroot
                                                          // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                if (hasTextChanged) {
                    rs.onChange(txtInput.value); // <-- forcing it.
                }
            }
            return;
        }

        if (keyCode == 13) {       // enter  (autocomplete triggered)
            if (txtHint.value.length == 0) { // if there is a hint
                rs.onEnter();
            } else {
                var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
                dropDownController.hide();

                if (wasDropDownHidden) {
                    txtHint.value = txtInput.value; // ensure that no hint is left.
                    txtInput.focus();
                    rs.onEnter();
                    return;
                }

                txtInput.value = txtHint.value;
                var hasTextChanged = registerOnTextChangeOldValue != txtInput.value
                registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again.
                                                          // for example imagine the array contains the following words: bee, beef, beetroot
                                                          // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                if (hasTextChanged) {
                    rs.onChange(txtInput.value); // <-- forcing it.
                }

            }
            return;
        }

        if (keyCode == 40) {     // down
            var m = dropDownController.move(+1);
            if (m == '') { rs.onArrowDown(); }
            txtHint.value = leftSide+m;
            return;
        }

        if (keyCode == 38 ) {    // up
            var m = dropDownController.move(-1);
            if (m == '') { rs.onArrowUp(); }
            txtHint.value = leftSide+m;
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // it's important to reset the txtHint on key down.
        // think: user presses a letter (e.g. 'x') and never releases... you get (xxxxxxxxxxxxxxxxx)
        // and you would see still the hint
        txtHint.value =''; // resets the txtHint. (it might be updated onKeyUp)

    };

    if (txtInput.addEventListener) {
        txtInput.addEventListener("keydown",  keyDownHandler, false);
    } else { // is this a fair assumption: that attachEvent will exist ?
        txtInput.attachEvent('onkeydown', keyDownHandler); // IE<9
    }
    return rs;
}
var ac_selector = document.querySelector("#tab_ttpostreply textarea");
var ac = autocomplete(ac_selector.parentNode);
var combination = [
    // благодарю
    { id: 'благодарю Вас за информацию', options:[", ожидайте пожалуйста "] },
    { id: 'благодарю Вас', options:[" за информацию", " за ожидание"] },
    { id: 'благ', options:["одарю Вас за информацию", "одарю Вас за ожидание"] },
    // восстановить пароль
    { id: 'восстановить ', options:['пароль можете по ссылке https://cp.mchost.ru/login.php?status=forget'] },
    // NS
    { id: 'наши NS', options:[': \nns1.mchost.ru\nns2.mchost.ru\nns3.mchost.ru\nns4.mchost.ru\n'] },
    // неверные NS    
    { id: 'для данного домена указаные неверные DNS NS записи. ', options:['О типах ресурсных записей DNS можете почитать по ссылке: https://ru.wikipedia.org/wiki/%D0%A2%D0%B8%D0%BF%D1%8B_%D1%80%D0%B5%D1%81%D1%83%D1%80%D1%81%D0%BD%D1%8B%D1%85_%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B5%D0%B9_DNS'] },   
    // дайте мне
    { id: 'дайте мне несколько минут пожалуйста', options:[', посмотрю Ваш аккаунт'] }, 
    // здравствуйте
    { id: 'здравствуйте', options:[
    '. Вам необходимо действовать по инструкции ',
    '. Работаем по Вашей заявке, пожалуйста, ожидайте ответа.',
    '. Ваш сайт доступен и работает в штатном режиме  , что так же подтверждается данными мониторинга\n Вы можете проверить доступность сайта в независимом анонимайзере, например http://www.seogadget.ru/anonymizer .\n Возможно Вам так же следует обновить подключение к сети интернет(перезагрузить роутер) или попробовать зайти на сайт в другом браузере, с другого устройства.', 
    '. Посмотреть за что конкретно были списаны средства, когда и в каком объеме можно в разделе "Финансы" по ссылке https://cp.mchost.ru/operations.php',
    '. Пожалуйста, ознакомьтесь с подробным описанием тарифа "Конструктор" по ссылке https://mchost.ru/services/virtual-hosting/constructor/\n Если Вас устраивают условия предоставления тарифа, сообщите нам о своем согласии в ответном письме, сменим тариф.',
    '. Вы можете посмотреть все логины, пароли и хосты по этой инструкции https://qa.mchost.ru/q/gde-v-paneli-upravleniya-uvidet-loginy-paroli-i-khosty\n Пожалуйста, убедитесь в том что Вы не копируете пробелы или попробуйте вводить данные вручную.',
    '. Ваша заявка направлена в Финансовый Отдел, пожалуйста, ожидайте ответа.',
    '. В этой ситуации Вам следует обращаться к разработчику сервиса, с которым возникли проблемы', 
    '. Благодарю Вас за ожидание, услугу регистрации домена перенесли.\n Продлить домен можно по этой инструкции https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya',
    '. Благодарю Вас за ожидание, тариф Вашего аккаунта был изменен на "Конструктор"',
    '. Продлить домен можно по ссылке https://cp.mchost.ru/services_add.php?service_type_id=3 или по этой инструкции https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya',
    ". Вы можете подключиться к сайту по протоколу FTP используя популярную программу FileZilla. Настроить ее можно по этой инструкции https://qa.mchost.ru/q/nastraivaem-filezilla .\n После этого сможете редактировать файлы.",
    '. Давайте уточним: \n 1. С какого конкретно почтового ящика отправляли письмо\n 2. На какой конкретно ящик\n 3. Примерное время отправки\n 4. Как отправляете(почтовая программа, скрипт на сайте)\n Постараемся Вам помочь',
    '. Вы можете настроить почту по этой инструкции https://qa.mchost.ru/q/kak-nastroit-yandeks-google-ili-mailru-pochtu-dlya-domena',
    '. Прямо сейчас для домена sushi-wok.by указаны неверные NS записи http://whois.domaintools.com/\n Вам нужно сменить NS записи у регистратора домена на наши:\n ns1.mchost.ru\n ns2.mchost.ru\n ns3.mchost.ru\n ns4.mchost.ru \nОбращаю Ваше внимание на то что смена DNS NS записей обычно происходит интервале 4-24 часа.',]},
    { id: 'здр', options:['авствуйте'] },  
    // в рамках
    //{ id: 'в рам', options: ['ках услуги "Сайт без забот" мы можем выполнить комплексную очистку от вирусного кода с последующим поиском и устранением уязвимостей сайта (включающим в себя обновление CMS, модулей и плагинов, предоставление консультации по необходимым мерам защиты). Стоимость этих работ составляет от 1000 руб. \n Если нужна наша помощь, то пополните баланс и сообщите нам какой вид работ следует провести.']}
    // работаем
    { id: 'ваша за', options:['явка направлена в Финансовый Отдел, пожалуйста, ожидайте ответа.'] },        
    { id: 'раб', options:['отаем по Вашей заявке, пожалуйста, ожидайте ответа.'] },
    // к сожалению
    { id: 'к сожалению в разу', options:["мные сроки проблему решить не получается. Вам необходимо создать заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg , ответ получите на email. Благодарю Вас за понимание", "в этой ситуации ничем не могу Вам помочь"] },
    { id: 'к сож', options:['алению это невозможно', "алению Вы неавторизованы в чате"] },
    // всегда
    { id: 'все', options:['гда пожалуйста, обращайтесь.'] },
    // давайте    
    { id: 'давайте уточним', options:[' имя домена(адрес сайта)'] },
    { id: 'давайте ', options:['уточним'] },
    // не беспокойтесь
    { id: 'не беспокойтесь, сейчас во всем разберемся', options:['. Пожалуйста, ожидайте'] },   
    { id: 'не бесп', options:['окойтесь, сейчас во всем разберемся'] },  
    // обращайтесь
    { id: 'обращайтесь, всегда рад помочь', options:['. Хорошего дня!'] },
    { id: 'обращ', options:['айтесь, всегда рад помочь'] },
    // ожидайте
    { id: 'ожид', options:['айте, пожалуйста'] },
    // мы не оказываем услуг по разработке
    { id: 'мы не оказываем услуг по разработке сайтов', options:['. Пожалуйста, обратитесь к разработчику сайта по этому вопросу'] },    
    { id: 'мы не ок', options:['азываем услуг по разработке сайтов'] },   
    // не понял
    { id: 'не понял', options:[" Вас, Вы не могли бы перефразировать?"]},
    // misc
    { id: 'необходимо ', options:['заметить, что смена DNS NS записей может занимать до 24х часов'] },
    { id: 'вы мож', options:["ете подключиться к сайту по протоколу FTP, например используя популярную программу FileZilla, вот инструкция по ее настройке http://mchost.ru/help/29/#h268"] },
    //{ id: '', options:[]},
    //"благодарю ", "пожалуйста, ", "давайте ", "к сожалению ", "мы не получили ", "необходимо "]}
    //Скорее всего у Вашего интернет-провайдера не обновился кэш DNS, попробуйте перезагрузить роутер или обновить подключение к интернету
];
ac.onChange = function(text) {
   for (var i=0;i<combination.length;i++) {
       //if (text.toLowerCase().indexOf(combination[i].id) >= 0) {
        if (text.toLowerCase().search(combination[i].id) >= 0) {
        //debug
        console.log('');        
        console.log('combination[i].id: '+ combination[i].id);        
        console.log('combination[i].id: '+ combination[i].options);
        console.log(combination[i]);
        console.log('');
           ac.startFrom = combination[i].id.length;
           ac.options = combination[i].options;
           ac.repaint();
           return;
       }
   }  
   
}
ac.options = [];


//reply_input.style.fontSize = '14px';
// inject autocomplete.js
//var script = document.createElement('script');
//script.src = "https://raw.githubusercontent.com/kolosochek/kayako/master/autocomplete.js";
//script.type = "text/javascript"
//document.body.appendChild(script);
// wait for starting input 
reply_input.addEventListener('input', function(){
	// fix url feature(.jpg by default) for joxi screenshots
	var pattern = "http://joxi.ru/";
	var hash = 14;
	var extension = ".jpg";
	var whitespace = ' ';
	var joxiRegexp = new RegExp("http://joxi.ru/[a-zA-Z0-9]{14}", "g");
	var joxiRegexpWithExtension = new RegExp("http://joxi.ru/[a-zA-Z0-9.]{17}", "g")
	// joxi
    if ((this.value.search(joxiRegexp)+1) && !(this.value.search(joxiRegexpWithExtension)+1)){
	  var patternIndex = this.value.indexOf(pattern)+pattern.length + hash
	  var stringBegining = this.value.substring(0, patternIndex);
	  var stringEnding = this.value.substring(patternIndex);
	  this.value = stringBegining + extension + stringEnding + whitespace;
	}
	// commands feature
    /*
	if((this.value.search('!')+1) && (this.value.length>4)){
	  // qa search
	  var qa_search_regexp = new RegExp(defaultQASearchAnchor+" [а-яА-Яa-zA-Z0-9 ]*!");
	  if (this.value.search(qa_search_regexp)+1){
	    var query = this.value.match(qa_search_regexp)[0];
	    query = query.replace(defaultQASearchAnchor, '').replace('!', '').trim();
	    //debug
	    //console.log(query);
	    GM_xmlhttpRequest({
	        method:     "GET",
	        url:        "https://qa.mchost.ru/pantera/"+query,
	        data:       "",
	        headers:    {
	            "Content-Type": "application/x-www-form-urlencoded"
	        },
	        onload: function (response) {
	        	// debug
	        	//console.log(response.responseText);
	            var qa_links_regexp = new RegExp('<div class="q-line"><a class="q-title" style="" href="[a-zA-Z0-9-\/ ]*">[а-яА-Яa-zA-Z ?]*</a>', 'g');//</a><br>', 'g');
	            var content = '';
	            var links_arr = response.responseText.match(qa_links_regexp);
				if (links_arr == null) {
					console.log('Found nothing');
					textarea.value = defaultQASearchAnchor + ' ';
				} else {
		            if (links_arr.length){
			            for(i=0;i<links_arr.length;i++){
			                var data = links_arr[i].replace('<div class="q-line"><a class="q-title" style="" href="', '<a class="q-title" href="https://qa.mchost.ru');
			                data = data.replace("q-title", "b-link");
			                content+= data;//links_arr[i];            
			            } 
			            if(content.length){
							toggle_modal_window(content);
						} else {
							console.log('Found nothing');
							var content = '<p>Found nothing</p>';
		        			toggle_modal_window(content);
						}
					} 
				}
	        },
	        ontimeout: function(){
	        	//console.log('Timeout');
	        	//var content = "<p>Timeout</p>";
	        	//toggle_modal_window(content);
	        	textarea.value = defaultQASearchAnchor + ' -';
	        },
	        // request timeout, 4s for best perfomance
	        timeout: 4000,
	    });
	  }
	  // whois
	  // TODO: fix regexp
	  var whois_search_regexp = new RegExp(defaultWhoisSearchAnchor+" [а-яА-Яa-zA-Z0-9-_. ]*!");
	  if (this.value.search(whois_search_regexp)+1){
	    var query = this.value.match(whois_search_regexp)[0];
	    query = query.replace(defaultWhoisSearchAnchor, '').replace('!', '').trim();
	    //debug
	    //console.log('query:');
	    //console.log(query);
	    GM_xmlhttpRequest({
	        method:     "GET",
	        url:        "http://whoiz.herokuapp.com/lookup.json?url=" + encodeURIComponent(query),
	        data:       "",
	        headers:    {
	            "Content-Type": "application/json"
	        },
	        onload: function (response) {
	        	var jsonWhois = JSON.parse(response.responseText);
	        	// debug
	        	//console.log(jsonWhois);
	            var content = '';
	            var separator = "\n";
	            var ns = jsonWhois.nameservers;

	            // prepend MSHOST WHOIS LINK
	            content+= "DNS записи для домена " + query + " http://mchost.ru/whois/?domainName=" + query + separator

	            // NS
	            content+= "NS: ";
	            for (nameserver in ns){
	            	//console.log(ns[nameserver].name);
	            	content+=ns[nameserver].name + whitespace;
	            }
	            content+= separator;            
	        	//register
	        	content+= "Registrar: " + jsonWhois['registrar']['id'] + separator;
	        	//created+expiries+status
	        	content+= "Created: " + jsonWhois['created_on'] + separator;
	        	content+= "Expires: " + jsonWhois['expires_on'] + separator;
	        	content+= "Status: ";
	        	var status = jsonWhois['status']
	        	for(index in status){
	        		content+= status[index] + whitespace;
	        	}
	        	// paste content into textarea
	        	textarea.value = content;
	        	
	        },
	        ontimeout: function(){
	        	console.log('Timeout');
	        	//var content = "<p>Timeout</p>";
	        	//toggle_modal_window(content);
	        	textarea.value = defaultWhoisSearchAnchor + ' -';
	        },
	        // request timeout, 4s for best perfomance
	        timeout: 4000,
	    });
	  }
	  // dig
	  var dig_search_regexp = new RegExp(defaultDigSearchAnchor+" [а-яА-Яa-zA-Z0-9-_. ]*!");
	  if (this.value.search(dig_search_regexp)+1){
	    var query = this.value.match(dig_search_regexp)[0];
	    query = query.replace(defaultDigSearchAnchor, '').replace('!', '').trim();
	    // chose 
	    var type = "ANY";
	    //debug
	    console.log('query:');
	    console.log(query);
	    GM_xmlhttpRequest({
	        method:     "GET",
	        url:        "https://toolbox.googleapps.com/apps/dig/lookup?domain=" + encodeURIComponent(query) + "&nameserver=&typ=" + type,
	        data:       '',
	        headers:    {
	            "Content-Type": "application/text-html"
	        },
	        onload: function (response) {
	        	var dig_results_regexp = new RegExp(";ANSWER",'');//[а-яА-Яa-zA-Z0-9-_. ]*!");//.match(/;ANSWER/)
	    		var data = JSON.parse(response.responseText);
	    		// check data
	    		if ((data.response.length) && (data.error_html.length == 0)){
	    			data = data.response
		    		data = data.substring(data.search(/;ANSWER/), data.length);
		    		data = data.substring(0, data.search(/;AUTHORITY/));
		    		data = data.replace(/;ANSWER/,'').trim();
		    		// debug
		    		console.log(data);
		    		// check date length
		    		if (data){
		    			textarea.value = data;
		    		} else {
		    			// debug
		    			console.log('Dig data is empty');
		    			textarea.value = defaultDigSearchAnchor + ' 0';

		    		}
	    		} else {
	    			console.log('Got dig errors');
	    			console.log(data.error_html);
	    		}	        	
	        },
	        ontimeout: function(){
	        	// debug
	        	console.log('Timeout');
	        	textarea.value = defaultDigSearchAnchor + ' -';
	        },
	        // request timeout, 4s for best perfomance
	        timeout: 4000,
	    });
	  }
	}
    */
});



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
