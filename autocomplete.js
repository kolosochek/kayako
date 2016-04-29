function autocomplete(container, config){
    config = config || {};
    config.fontSize =                       config.fontSize   || '12px';
    config.fontFamily =                     config.fontFamily || 'Arial,Helvetica,sans-serif';
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
    txtHint.style.top =  '0';
    txtHint.style.left = '0';
    txtHint.style.width = '100%';
    //txtHint.style.height = '100%';
    txtHint.style.borderColor = 'transparent';
    txtHint.style.background = 'transparent';
    txtHint.style.boxShadow =   'none';
    txtHint.style.color = config.hintColor;
    
    txtInput.style.backgroundColor ='transparent';
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
    //dropDown.style.visibility = 'hidden';
    dropDown.style.top = '20px';
    dropDown.style.left = "40px";
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
            hide :  function() { elem.style.visibility = 'hidden'; },
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
                }
                if (rows.length===1 && token === rows[0].__hint) {
                    return; // do not show the dropDown if it has only one element which matches what we have just displayed.
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
        // uppercase
    { id: 'Благодарю Вас за информацию', options:[", ожидайте пожалуйста "] },
    { id: 'Благодарю Вас', options:[" за информацию", " за ожидание"] },
    { id: 'Благ', options:["одарю Вас за информацию", "одарю Вас за ожидание"] },

    // восстановить пароль
    { id: 'восстановить ', options:['пароль можете по ссылке https://cp.mchost.ru/login.php?status=forget'] },
    { id: 'Восстановить ', options:['пароль можете по ссылке https://cp.mchost.ru/login.php?status=forget'] }, 

    { id: 'ваш сайт', options:[' доступен и работает в штатном режиме'] },
    { id: 'Ваш сайт', options:[' доступен и работает в штатном режиме'] },

    // NS
    { id: 'наши NS', options:[': \nns1.mchost.ru\nns2.mchost.ru\nns3.mchost.ru\nns4.mchost.ru\n'] },
    { id: 'Наши NS', options:[': \nns1.mchost.ru\nns2.mchost.ru\nns3.mchost.ru\nns4.mchost.ru\n'] },

    // неверные NS    
    { id: 'для данного домена указаные неверные DNS NS записи. ', options:['О типах ресурсных записей DNS можете почитать по ссылке: https://ru.wikipedia.org/wiki/%D0%A2%D0%B8%D0%BF%D1%8B_%D1%80%D0%B5%D1%81%D1%83%D1%80%D1%81%D0%BD%D1%8B%D1%85_%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B5%D0%B9_DNS'] },    
    { id: 'для дан', options:['ного домена указаные неверные DNS NS записи.'] },
    { id: 'Для данного домена указаные неверные DNS NS записи. ', options:['О типах ресурсных записей DNS можете почитать по ссылке: https://ru.wikipedia.org/wiki/%D0%A2%D0%B8%D0%BF%D1%8B_%D1%80%D0%B5%D1%81%D1%83%D1%80%D1%81%D0%BD%D1%8B%D1%85_%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B5%D0%B9_DNS'] },    
    { id: 'Для дан', options:['ного домена указаные неверные DNS NS записи.'] },


    // создать заявку
    { id: 'вам не', options:['обходимо создать заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg'] },  
    { id: 'Вам не', options:['обходимо создать заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg'] },  

    // дайте мне
    { id: 'дайте мне несколько минут пожалуйста', options:[', посмотрю Ваш аккаунт'] },        
    { id: 'дай', options:['те мне несколько минут пожалуйста'] },  
        // uppercase
    { id: 'Дайте мне несколько минут пожалуйста', options:[', посмотрю Ваш аккаунт'] },        
    { id: 'Дай', options:['те мне несколько минут пожалуйста'] },  

    // здравствуйте
    { id: 'здр', options:['авствуйте, чем я могу Вам помочь?'] },
    { id: 'Здр', options:['авствуйте, чем я могу Вам помочь?'] },

    // к сожалению
    { id: 'к сожалению в разу', options:["мные сроки проблему решить не получается. Вам необходимо создать заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg , ответ получите на email. Благодарю Вас за понимание", "в этой ситуации ничем не могу Вам помочь"] },
    { id: 'к сож', options:['алению это невозможно', "алению Вы неавторизованы в чате"] },  
        // uppercase
    { id: 'К сожалению в разу', options:["мные сроки проблему решить не получается. Вам необходимо создать заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg , ответ получите на email. Благодарю Вас за понимание", "в этой ситуации ничем не могу Вам помочь"] },
    { id: 'К сож', options:['алению это невозможно', "алению Вы неавторизованы в чате"] },  

    // пожалуйста
    { id: 'пожалуйста, обращайтесь, всегда рад помочь', options:[". Хорошего дня Вам."] },
    { id: 'пожалуйста, обращайтесь', options:[", всегда рад помочь"] },
    { id: 'пожа', options:['луйста, ожидайте', "луйста, обращайтесь", "луйста, ознакомьтесь с инструкцией по ссылке: "] },
        // uppercase
    { id: 'Пожалуйста, обращайтесь, всегда рад помочь', options:[". Хорошего дня Вам."] },
    { id: 'Пожалуйста, обращайтесь', options:[", всегда рад помочь"] },
    { id: 'Пожа', options:['луйста, ожидайте', "луйста, обращайтесь", "луйста, ознакомьтесь с инструкцией по ссылке: ", "луйста, создайте заявку из панели управления хостингом, вот подсказка http://joxi.ru/ZrJYEyws13z8RA.jpg"] },
    
    // давайте    
    { id: 'давайте уточним', options:[' имя домена(адрес сайта)'] },
    { id: 'давайте ', options:['уточним'] },
    { id: 'Давайте ', options:['уточним имя домена(адрес сайта)'] },
    { id: 'Давайте ', options:['уточним'] },

    // не беспокойтесь
    { id: 'не беспокойтесь, сейчас во всем разберемся', options:['. Пожалуйста, ожидайте'] },   
    { id: 'не бесп', options:['окойтесь, сейчас во всем разберемся'] },  
    { id: 'Не беспокойтесь, сейчас во всем разберемся', options:['. Пожалуйста, ожидайте'] }, 
    { id: 'Не бесп', options:['окойтесь, сейчас во всем разберемся'] },

    // обращайтесь
    { id: 'обращайтесь, всегда рад помочь', options:['. Хорошего дня!'] },
    { id: 'обращ', options:['айтесь, всегда рад помочь'] },
        // uppercase
    { id: 'Обращайтесь, всегда рад помочь', options:['. Хорошего дня!'] },
    { id: 'Обращ', options:['айтесь, всегда рад помочь'] },

    // ожидайте
    { id: 'ожид', options:['айте, пожалуйста'] },
    { id: 'Ожид', options:['айте, пожалуйста'] },

    // до свидания
    { id: 'мы не пол', options:["учили от вас никакого сообщения в течение длительного времени. Когда у вас снова возникнут вопросы обращайтесь, мы всегда рады вам помочь. До свидания."]},
    { id: 'Мы не пол', options:["учили от вас никакого сообщения в течение длительного времени. Когда у вас снова возникнут вопросы обращайтесь, мы всегда рады вам помочь. До свидания."]},

    // мы не оказываем услуг по разработке
    // 
    { id: 'мы не оказываем услуг по разработке сайтов', options:['. Пожалуйста, обратитесь к разработчику сайта по этому вопросу'] },    
    { id: 'мы не ок', options:['азываем услуг по разработке сайтов'] },
    { id: 'Мы не оказываем услуг по разработке сайтов', options:['. Пожалуйста, обратитесь к разработчику сайта по этому вопросу'] },    
    { id: 'Мы не ок', options:['азываем услуг по разработке сайтов. Пожалуйста, обратитесь к разработчику сайта по этому вопросу'] },

    
    // не понял
    { id: 'не понял', options:[" Вас, Вы не могли бы перефразировать?"]},
    { id: 'Не понял', options:[" Вас, Вы не могли бы перефразировать?"]},
    // misc
    { id: 'необходимо ', options:['заметить, что смена DNS NS записей может занимать до 24х часов'] },
    { id: 'Необходимо ', options:['заметить, что смена DNS NS записей может занимать до 24х часов'] },

    { id: 'вы мож', options:["ете подключиться к сайту по протоколу FTP, например используя популярную программу FileZilla, вот инструкция по ее настройке http://mchost.ru/help/29/#h268"] },
    { id: 'Вы мож', options:["ете подключиться к сайту по протоколу FTP, например используя популярную программу FileZilla, вот инструкция по ее настройке http://mchost.ru/help/29/#h268"] },
    { id: '', options:[]},
    //"благодарю ", "пожалуйста, ", "давайте ", "к сожалению ", "мы не получили ", "необходимо "]}
    //Скорее всего у Вашего интернет-провайдера не обновился кэш DNS, попробуйте перезагрузить роутер или обновить подключение к интернету
];
ac.onChange = function(text) {
   for (var i=0;i<combination.length;i++) {
       if (text.indexOf(combination[i].id)===0) {
           ac.startFrom = combination[i].id.length;
           ac.options =   combination[i].options;
           ac.repaint();
           return;
       }
   }  
   
}
ac.options = [];
