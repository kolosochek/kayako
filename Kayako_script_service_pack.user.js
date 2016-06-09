// ==UserScript==
// @name        Kayako script service pack
// @namespace   https://support.mchost.ru/support/staff/*
// @description 31337 mchost ticket system help tools pack, like fast search in predefined replies, fast search into whois or dig and even more.
// @include     https://support.mchost.ru/support/*
// @version     2.0
// ==/UserScript==

//begin
var settings = new Object({
    'request_timeout': 10000, // request timeout 5s
    'refresh_timeout': 30000, // send request every 15 seconds
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
    'ticket_id': 0,
    'leftSide': '',
    'token': '',
    'combo': '',
    'result': '',
    '_txtHint': '',
    'newline': '\n',
    'charset': '&usecharset=2',
    'current_page': undefined,
    'click': new Event("click"),
    // play alert sound
    play_sound: function() {
        document.getElementById("prcachemenu_r").innerHTML = '<audio autoplay="autoplay"><source src="' + settings.alert_file_url + '" type="audio/mpeg" /><source src="' + settings.alert_file_url_ogg + '" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + settings.alert_file_url + '" /></audio>';
    },
    getCaretPosition: function(obj) {
        var cursorPos = null;
        if (document.selection) {
            var range = document.selection.createRange();
            range.moveStart('textedit', -1);
            cursorPos = range.text.length;
        } else {
            cursorPos = obj.selectionStart;
        }
        return cursorPos;
    },
    getCaretCoordinates: function(element, position) {
        var properties = [
            'boxSizing',
            'width', // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
            'height',
            'overflowX',
            'overflowY', // copy the scrollbar for IE

            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',

            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',

            // https://developer.mozilla.org/en-US/docs/Web/CSS/font
            'fontStyle',
            'fontVariant',
            'fontWeight',
            'fontStretch',
            'fontSize',
            'lineHeight',
            'fontFamily',

            'textAlign',
            'textTransform',
            'textIndent',
            'textDecoration', // might not make a difference, but better be safe

            'letterSpacing',
            'wordSpacing'
        ];

        var isFirefox = !(window.mozInnerScreenX == null);
        var mirrorDivDisplayCheckbox = document.getElementById('mirrorDivDisplay');
        var mirrorDiv, computed, style;
        // mirrored div
        mirrorDiv = document.getElementById(element.nodeName + '--mirror-div');
        if (!mirrorDiv) {
            mirrorDiv = document.createElement('div');
            mirrorDiv.id = element.nodeName + '--mirror-div';
            document.body.appendChild(mirrorDiv);
        }

        style = mirrorDiv.style;
        computed = getComputedStyle(element);

        // default textarea styles
        style.whiteSpace = 'pre-wrap';
        if (element.nodeName !== 'INPUT')
            style.wordWrap = 'break-word'; // only for textarea-s

        // position off-screen
        style.position = 'absolute'; // required to return coordinates properly
        style.top = element.offsetTop + parseInt(computed.borderTopWidth) + 'px';
        style.left = "400px";
        style.visibility = 'hidden'; // not 'display: none' because we want rendering

        // transfer the element's properties to the div
        properties.forEach(function(prop) {
            style[prop] = computed[prop];
        });

        if (isFirefox) {
            style.width = parseInt(computed.width) - 2 + 'px' // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
                // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
            if (element.scrollHeight > parseInt(computed.height))
                style.overflowY = 'scroll';
        } else {
            style.overflow = 'hidden'; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
        }

        mirrorDiv.textContent = element.value.substring(0, position);
        // the second special handling for input type="text" vs textarea: spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
        if (element.nodeName === 'INPUT')
            mirrorDiv.textContent = mirrorDiv.textContent.replace(/\s/g, "\u00a0");

        var span = document.createElement('span');
        // Wrapping must be replicated *exactly*, including when a long word gets
        // onto the next line, with whitespace at the end of the line before (#7).
        // The  *only* reliable way to do that is to copy the *entire* rest of the
        // textarea's content into the <span> created at the caret position.
        // for inputs, just '.' would be enough, but why bother?
        span.textContent = element.value.substring(position) || '.'; // || because a completely empty faux span doesn't render at all
        span.style.backgroundColor = "lightgrey";
        mirrorDiv.appendChild(span);

        var coordinates = {
            top: span.offsetTop + parseInt(computed['borderTopWidth']),
            left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
        };

        return coordinates;
    },
    // toolbox feature
    create_toolbox: function() {
        settings.toolbox = document.createElement('div');
        settings.toolbox.id = 'toolbox';
        settings.toolbox.style.position = 'fixed';
        settings.button_set_observer = '<button id="set_observer">Set observer</button>';
        settings.button_remove_observer = '<button id="remove_observer">Remove observer</button>';
        settings.toolbox.innerHTML += settings.button_set_observer + settings.button_remove_observer;
        document.body.insertBefore(settings.toolbox, document.body.firstChild);
        // get created elements from dom
        settings.button_set_observer = document.getElementById('set_observer');
        settings.button_remove_observer = document.getElementById('remove_observer');
        // hilight area feature
        settings.highlight_area = new Object({
            highlight_area_element: document.getElementById("toolbox"), //("set_observer"),//("gridtableoptticketlist").nextSibling,
            toggle_class: function(className) {
                this.highlight_area_element.classList.toggle(className);
            },
            remove_class: function(className) {
                this.highlight_area_element.classList.remove(className);
            },
            add_class: function(className) {
                this.highlight_area_element.classList.add(className);
            }
        });
        // by default page observer is not set
        settings.highlight_area.add_class("observer_is_not_set");
        // and remove_observer button is disabled
        settings.button_set_observer.disabled = '';
        settings.button_remove_observer.disabled = 'true';
        // bind event listener
        // set
        settings.button_set_observer.addEventListener('click', function() {
            settings.button_set_observer.disabled = 'true';
            settings.button_remove_observer.disabled = '';
            // observer
            observer.set_observer();
            observer.refresh_tickets_on_the_page();
        });
        // remove
        settings.button_remove_observer.addEventListener('click', function() {
            settings.button_set_observer.disabled = '';
            settings.button_remove_observer.disabled = 'true';
            // hilight_area
            settings.highlight_area.remove_class("observer_is_set");
            settings.highlight_area.remove_class("observer_timeout");
            settings.highlight_area.add_class("observer_is_not_set");
            // observer
            observer.remove_observer();
            observer.refresh_tickets_on_the_page();
        });
    },
    create_scrolltop: function() {
        //scroll top
        var scrolltop = document.createElement('a');
        scrolltop.textContent = "^";
        scrolltop.id = 'scrolltop';
        scrolltop.href = "javascript:void(0)";
        scrolltop.style.position = 'fixed';
        scrolltop.style.bottom = "20px";
        scrolltop.style.right = "20px";
        scrolltop.style.background = "#F0EADE";
        scrolltop.style.color = "#6393DF";
        scrolltop.style.padding = "15px";
        scrolltop.style.borderRadius = "6px";
        document.body.insertBefore(scrolltop, document.body.firstChild);
        var scrolltop = document.getElementById('scrolltop');
        // bind event listener
        scrolltop.addEventListener('click', function() {
            window.scrollTo(0, 0);
        });
    },
});
settings.combination = [{
            // мультименю
            id: 'йцу',
            options: [
                'Ваш сайт доступен и работает в штатном режиме  , что так же подтверждается данными мониторинга.' + settings.newline + 'Вы можете проверить доступность сайта в независимом анонимайзере, например http://www.seogadget.ru/anonymizer .' + settings.newline + 'Возможно Вам так же следует обновить подключение к сети интернет(перезагрузить роутер) или попробовать зайти на сайт с другого устройства, в другом браузере.',
                'Пожалуйста, ознакомьтесь с подробным описанием тарифа "Конструктор" по ссылке https://mchost.ru/services/virtual-hosting/constructor/' + settings.newline + ' Если Вас устраивают условия предоставления тарифа, сообщите нам о своем согласии в ответном письме, сменим тариф.',
                'Вы можете посмотреть все логины, пароли и хосты по этой инструкции https://qa.mchost.ru/q/gde-v-paneli-upravleniya-uvidet-loginy-paroli-i-khosty' + settings.newline + ' Пожалуйста, убедитесь в том что Вы не копируете пробелы или попробуйте вводить данные вручную.',
                'В этой ситуации Вам следует обращаться к разработчику сервиса, с которым возникли проблемы',
                'Услугу регистрации домена перенесли.' + settings.newline + 'Продлить домен можно по этой инструкции https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya',
                'Тариф Вашего аккаунта был изменен на "Конструктор"',
                'Продлить домен можно по ссылке https://cp.mchost.ru/services_add.php?service_type_id=3 или по этой инструкции https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya',
                "Вы можете подключиться к сайту по протоколу FTP используя популярную программу FileZilla. Настроить ее можно по этой инструкции https://qa.mchost.ru/q/nastraivaem-filezilla .'+settings.newline+' После этого сможете редактировать файлы.",
                'Давайте уточним: ' + settings.newline + '1. С какого конкретно почтового ящика отправляли письмо' + settings.newline + '2. На какой конкретно ящик' + settings.newline + '3. Примерное время отправки' + settings.newline + '4. Как отправляете(почтовая программа, скрипт на сайте=путь к файлу скрипта)' + settings.newline + '5. Если получаете сообщение об ошибке - приведите текст такого сообщения' + settings.newline + 'Постараемся Вам помочь',
                'Вы можете настроить популярные почтовые сервисы(yandex, mailru или gmail) по этой инструкции https://qa.mchost.ru/q/kak-nastroit-yandeks-google-ili-mailru-pochtu-dlya-domena'
            ]
        },
        // благодарю
        {
            id: 'благодарю вас за',
            options: ['Благодарю вас за ожидание, тариф Вашего аккаунта был изменен на "Конструктор"', 'Благодарю вас за ожидание , Ваш сайт активируется. Пожалуйста, ознакомьтесь https://qa.mchost.ru/q/kak-predotvratit-zarazhenie-sayta']
        }, {
            id: 'благодарю вас',
            options: ["Благодарю Вас за информацию", "Благодарю Вас за ожидание"]
        }, {
            id: 'благ',
            options: ["Благодарю Вас за информацию", "Благодарю Вас за ожидание"]
        },
        // NS
        {
            id: 'наши NS',
            options: ['наши NS:' + settings.newline + 'ns1.mchost.ru' + settings.newline + 'ns2.mchost.ru' + settings.newline + 'ns3.mchost.ru' + settings.newline + 'ns4.mchost.ru' + settings.newline]
        },
        // неверные NS
        {
            id: 'для дом',
            options: ['Для домена  указаны неверные DNS NS записи http://whois.domaintools.com/ ' + settings.newline + 'Если Вы хотите что бы сайт был доступен с нашего хостинга, Вам нужно у регистратора домена указать наши NS записи:' + settings.newline + 'ns1.mchost.ru' + settings.newline + 'ns2.mchost.ru' + settings.newline + 'ns3.mchost.ru' + settings.newline + 'ns4.mchost.ru' + settings.newline]
        },
        // проверили файлы сайта
        {
            id: 'проверили фай',
            options: ['Проверили файлы сайта, вот что нашли: ' + settings.newline + settings.newline + settings.newline + 'Пожалуйста сообщите нам об очистке указанных файлов.']
        }, {
            id: 'здр',
            options: ['Здравствуйте. ']
        }, {
            id: 'plh',
            options: ['Здравствуйте. ']
        },
        // к сожалению
        {
            id: 'к сожа',
            options: ['К сожалению, ']
        },
        // "Сайт без забот"
        {
            id: 'в рам',
            options: ['В рамках услуги "Сайт без забот" мы можем выполнить комплексную очистку от вирусного кода с последующим поиском и устранением уязвимостей сайта (включающим в себя обновление CMS, модулей и плагинов, предоставление консультации по необходимым мерам защиты). Стоимость этих работ составляет от 1000 руб. ' + settings.newline + ' Если нужна наша помощь, то пополните баланс и сообщите нам какой вид работ следует провести. ']
        },
        // условия тарифа конструктор
        {
            id: 'условия конс',
            options: ['Пожалуйста, ознакомьтесь с условиями предоставления тарифа "Конструктор" по ссылке http://mchost.ru/services/virtual-hosting/constructor/' + settings.newline + 'Вы можете удалить все неиспользуемые услуги в разделе "Услуги" по ссылке https://cp.mchost.ru/services.php' + settings.newline + 'Обратите внимание на стоимость услуг:' + settings.newline + 'Дисковое пространство - 0,2 руб. за 1 Мб в месяц' + settings.newline + 'Размещение одного сайта - 59 руб. в месяц' + settings.newline + 'MySQL база - 29 руб. в месяц' + settings.newline + 'Выделенный IP - 150 руб. в месяц' + settings.newline + 'Пожалуйста, сообщите нам о своем согласии и готовности к смене тарифа Вашего аккаунта на "Конструктор"']
        }, {
            id: 'тариф конс',
            options: ['Пожалуйста, ознакомьтесь с условиями предоставления тарифа "Конструктор" по ссылке http://mchost.ru/services/virtual-hosting/constructor/' + settings.newline + 'Вы можете удалить все неиспользуемые услуги в разделе "Услуги" по ссылке https://cp.mchost.ru/services.php' + settings.newline + 'Обратите внимание на стоимость услуг:' + settings.newline + 'Дисковое пространство - 0,2 руб. за 1 Мб в месяц' + settings.newline + 'Размещение одного сайта - 59 руб. в месяц' + settings.newline + 'MySQL база - 29 руб. в месяц' + settings.newline + 'Выделенный IP - 150 руб. в месяц' + settings.newline + 'Пожалуйста, сообщите нам о своем согласии и готовности к смене тарифа Вашего аккаунта на "Конструктор"']
        }, {
            id: 'ознакомьтесь с усло',
            options: ['Пожалуйста, ознакомьтесь с условиями предоставления тарифа "Конструктор" по ссылке http://mchost.ru/services/virtual-hosting/constructor/' + settings.newline + 'Вы можете удалить все неиспользуемые услуги в разделе "Услуги" по ссылке https://cp.mchost.ru/services.php' + settings.newline + 'Обратите внимание на стоимость услуг:' + settings.newline + 'Дисковое пространство - 0,2 руб. за 1 Мб в месяц' + settings.newline + 'Размещение одного сайта - 59 руб. в месяц' + settings.newline + 'MySQL база - 29 руб. в месяц' + settings.newline + 'Выделенный IP - 150 руб. в месяц' + settings.newline + 'Пожалуйста, сообщите нам о своем согласии и готовности к смене тарифа Вашего аккаунта на "Конструктор"']
        },
        //
        {
            id: 'для ускорения зачи',
            options: ['Для ускорения зачисления средств Вы можете прислать нам фотокопию квитанции. ']
        },
        // за что заблокировали
        {
            id: 'ваш сайт д',
            options: ['Ваш сайт доступен и работает в штатном режиме  , что так же подтверждается данными мониторинга.' + settings.newline + 'Вы можете проверить доступность сайта в независимом анонимайзере, например http://www.seogadget.ru/anonymizer .' + settings.newline + 'Возможно Вам так же следует обновить подключение к сети интернет(перезагрузить роутер) или попробовать зайти на сайт с другого устройства, в другом браузере.']
        }, {
            id: 'вам был',
            options: ['Вам было направлено следущее сообщение:"' + settings.newline +
            '" Ответа на него не поступало.' + settings.newline + 'Могу заверить Вас, что это не ложная тревога - на сайте обнаружен вредноносный код, нужно максимально оперативно решить проблему.']
        }, {
            id: 'вам нео',
            options: ["Вам необходимо действовать по инструкции: "]
        },
        // работаем
        {
            id: 'ваша за',
            options: ['Ваша заявка направлена в Финансовый Отдел, пожалуйста, ожидайте ответа.']
        }, {
            id: 'раб',
            options: ['Работаем по Вашей заявке, пожалуйста, ожидайте ответа.']
        },

        {
            id: 'посмотреть за ч',
            options: ['Посмотреть за что конкретно были списаны средства, когда и в каком объеме можно в разделе "Финансы" по ссылке https://cp.mchost.ru/operations.php']
        }, {
            id: 'в разделе',
            options: ['в разделе "Финансы" по ссылке https://cp.mchost.ru/operations.php', 'в разделе "Услуги" по ссылке https://cp.mchost.ru/services.php', 'в разделе "Поддержка" по ссылке https://cp.mchost.ru/request.php']
        }, {
            id: 'прямо сей',
            options: ['Прямо сейчас для домена  указаны неверные NS записи http://whois.domaintools.com/' + settings.newline + 'Вам нужно сменить NS записи у регистратора домена на наши:' + settings.newline + ' ns1.mchost.ru' + settings.newline + 'ns2.mchost.ru' + settings.newline + 'ns3.mchost.ru' + settings.newline + 'ns4.mchost.ru' + settings.newline + 'Обращаю Ваше внимание на то что смена DNS NS записей обычно происходит интервале 4-24 часа.']
        }, {
            id: 'продлить до',
            options: ['Продлить домен можно по ссылке https://cp.mchost.ru/services_add.php?service_type_id=3 или по этой инструкции https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya ']
        }, {
            id: 'максимально под',
            options: ['Максимально подробно опишите что именно не работает, что хотите получить в итоге. ']
        },
        // к сожалению
        {
            id: 'данные дл',
            options: ['Данные для авторизации я только что отправил на контактный email аккаунта.']
        }, {
            id: 'речь идет',
            options: ['Скорее всего речь идет о сайте ']
        },
        // пожалуйста
        {
            id: 'пож',
            options: ['пожалуйста, ']
        },
        // всегда
        {
            id: 'всег',
            options: ['Всегда пожалуйста, обращайтесь. ']
        },
        // выслал
        {
            id: 'выслал да',
            options: ['Выслал данные для авторизации в панели управления хостингом на контактный email аккаунта']
        },
        // давайте
        {
            id: 'давайте у',
            options: ['давайте уточним']
        },
        // не беспокойтесь
        {
            id: 'не бесп',
            options: ['Не беспокойтесь, сейчас во всем разберемся']
        },
        // обращайтесь
        {
            id: 'обращ',
            options: ['Обращайтесь, всегда рады Вам помочь.']
        },
        // мы не оказываем услуг по разработке
        {
            id: 'мы не ок',
            options: ['К сожалению, мы не оказываем услуг по разработке сайтов. По этому вопросу Вам следует обращаться к профильным специалистам.']
        },
        // не понял
        {
            id: 'не понял',
            options: [" Вас, Вы не могли бы перефразировать?"]
        },
        // misc
        {
            id: 'необходимо з',
            options: ['Необходимо заметить, что смена DNS NS записей обычно происходит в интервале 2-24 часа.']
        }, {
            id: 'вы можете вос',
            options: ['Вы можете восстановить файлы или БД конкретного сайта за любую доступную дату по этой инструкции https://qa.mchost.ru/q/kak-na-virtualnom-khostinge-vosstanovit-dannye-s-bekapa']
        }, {
            id: 'восстановить фа',
            options: ['Восстановить файлы или БД конкретного сайта за любую доступную дату Вы по этой инструкции https://qa.mchost.ru/q/kak-na-virtualnom-khostinge-vosstanovit-dannye-s-bekapa']
        }, {
            id: 'вы мож',
            options: ["Вы можете подключиться к сайту по протоколу FTP, например используя популярную программу FileZilla, вот инструкция по ее настройке https://qa.mchost.ru/q/nastraivaem-filezilla"]
        },
        // misc
        {
            id: 'после поп',
            options: ["После пополнения баланса аккаунт будет разблокирован автоматически."]
        }, {
            id: 'пополните бал',
            options: ["Пополните баланс до положительного значения и аккаунт будет разблокирован автоматически"]
        },
        //Пополните баланс до положительного значения и аккаунт будет разблокирован автоматически.
        // qa shortcuts
        // ftp файлзилла
        {
            id: 'аез',
            options: ["https://qa.mchost.ru/q/nastraivaem-filezilla"]
        },
        // fin финансы
        {
            id: 'ашт',
            options: ["https://cp.mchost.ru/operations.php"]
        },
        // ser услуги
        {
            id: 'ыук',
            options: ["https://cp.mchost.ru/services.php"]
        },
        // cal калькулятор
        {
            id: 'сфд',
            options: ["https://cp.mchost.ru/services.php#frame_pay"]
        },
        // tar смена тарифа
        {
            id: 'ефк',
            options: ["https://cp.mchost.ru/services.php#frame_plan"]
        },
        // con конструктор
        {
            id: 'сщт',
            options: ["http://mchost.ru/services/virtual-hosting/constructor/"]
        },
        // par пароли и хосты
        {
            id: 'зфк',
            options: ["https://qa.mchost.ru/q/gde-v-paneli-upravleniya-uvidet-loginy-paroli-i-khosty"]
        },
        // pro продлить домен
        {
            id: 'зкщ',
            options: ["https://qa.mchost.ru/q/kak-prodlit-registratsiyu-domena-cherez-panel-upravleniya"]
        },
        // bac
        {
            id: 'ифс',
            options: ["https://cp.mchost.ru/backup_request.php"]
        },

    ];

// lol jquery loading only on detail tickets page.
if (typeof jQuery === "undefined") {
    settings._txtHint = document.querySelector("#autocomplete_hint");
    settings.reply_input = document.querySelector("#tab_ttpostreply #replyform textarea");
    settings.current_page = 'category';
    document.body.className += ' category__page';
} else {
    settings._txtHint = jQuery("#autocomplete_hint").get(0);
    settings.reply_input = document.querySelector("#tab_ttpostreply #replyform textarea"); //jQuery("#tab_ttpostreply replyform textarea").get(0);
    settings.current_page = 'detail';
    document.body.className += ' detail__page';
}
// inject custom css
var style = document.createElement('style');
style.innerHTML = '#autocomplete_wrapper { position: relative; }' +
    '.observer_is_set { background: green }' +
    '.observer_is_not_set { background: #E3858C }' +
    '.row1 { position:relative }' +
    '#autocomplete_dropdown { margin: 0 0 0 8px; top: 18px; max-height: auto ; min-height: 100%; font-weight: 100; }' +
    '#autocomplete_dropdown div { border-bottom: 1px solid gray; margin-bottom: 0px }' +
    '.observer_timeout { background: yellow }' +
    '#toolbox { padding: 5px; position: fixed; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; margin: 0 0 0 5px; }' +
    document.body.appendChild(style);
/////////
/////////
/////////           Detail page
/////////
/////////
if (settings.current_page == 'detail') {
    console.log('Work on detail page, autocomplete enabled');
    // get ticket_id
    var ticket_id = window.location.href.split('&');
    for (i = 0; i < ticket_id.length; i++) {
        if (ticket_id[i].search('ticketid') >= 0) {
            settings.ticket_id = parseInt(ticket_id[i].replace('ticketid=', ''));
        }
    }
    settings.reply_button = jQuery("li #ttpostreply");
    settings.reply_button.attr('onclick', "switchGridTab('ttpostreply', 'tickets'); document.replyform.replycontents.focus();");
    settings.reply_button.attr('href', 'javascript:void(0);');

    //////
    ////// AUTOCOMPLETE FUNCTION
    //////
    function autocomplete(container, config) {
        config = config || {};
        config.fontSize = config.fontSize || '11px';
        config.fontFamily = config.fontFamily || 'Verdana,Arial';
        config.promptInnerHTML = config.promptInnerHTML || '';
        config.color = config.color || '#4F4F4F';
        config.hintColor = config.hintColor || '#aaa';
        config.backgroundColor = config.backgroundColor || '#fff';
        config.dropDownBorderColor = config.dropDownBorderColor || '#aaa';
        config.dropDownZIndex = config.dropDownZIndex || '100'; // to ensure we are in front of everybody
        config.dropDownOnHoverBackgroundColor = config.dropDownOnHoverBackgroundColor || '#ddd';

        var txtInput = settings.reply_input || document.createElement('textarea');
        txtInput.spellcheck = false;

        var txtHint = document.createElement("input");
        txtHint.id = 'autocomplete_hint';
        txtHint.disabled = '';
        txtHint.style.textTransform = 'lowercase';
        txtHint.style.position = 'absolute';
        txtHint.style.marginTop = '12px';
        //txtHint.style.height = '100%';
        //txtHint.style.left = '0';
        //txtHint.style.width = '100%';
        txtHint.style.minWidth = '220px';
        txtHint.style.borderColor = 'transparent';
        txtHint.style.background = 'transparent';
        txtInput.style.backgroundColor = 'transparent';
        txtHint.style.boxShadow = 'none';
        txtHint.style.color = config.hintColor;
        txtInput.style.verticalAlign = 'top';
        txtInput.style.position = 'relative';

        var wrapper = document.createElement('div');
        wrapper.id = 'autocomplete_wrapper';
        //wrapper.style.position = 'relative';
        wrapper.style.height = '100%';
        wrapper.style.outline = '0';
        wrapper.style.border = '0';
        wrapper.style.margin = '0';
        wrapper.style.padding = '0';

        var prompt = document.createElement('div');
        prompt.id = "autocomplete_prompt";
        prompt.style.position = 'absolute';
        prompt.style.outline = '0';
        prompt.style.margin = '0';
        prompt.style.padding = '0';
        prompt.style.border = '0';
        prompt.style.fontSize = config.fontSize;
        prompt.style.fontFamily = config.fontFamily;
        prompt.style.color = config.color;
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
        prompt.style.left = '-' + w + 'px';
        wrapper.style.marginLeft = w + 'px';

        wrapper.appendChild(txtHint);
        wrapper.appendChild(txtInput);

        var dropDown = document.createElement('div');
        dropDown.id = "autocomplete_dropdown";
        dropDown.style.position = 'absolute';
        dropDown.style.visibility = 'hidden';
        //dropDown.style.top = '0px !important';
        dropDown.style.margin = "0 0 0 8px";
        dropDown.style.outline = '0';
        dropDown.style.margin = '0';
        dropDown.style.padding = '0';
        dropDown.style.textAlign = 'left';
        dropDown.style.fontSize = config.fontSize;
        dropDown.style.fontFamily = config.fontFamily;
        dropDown.style.backgroundColor = config.backgroundColor;
        dropDown.style.zIndex = config.dropDownZIndex;
        dropDown.style.cursor = 'default';
        dropDown.style.borderStyle = 'solid';
        dropDown.style.borderWidth = '0px';
        dropDown.style.borderColor = config.dropDownBorderColor;
        dropDown.style.overflowX = 'hidden';
        dropDown.style.whiteSpace = 'pre';
        dropDown.style.overflowY = 'scroll';

        var createDropDownController = function(elem) {
            var rows = [];
            var ix = 0;
            var oldIndex = -1;

            var onMouseOver = function() {
                this.style.outline = '1px solid #ddd';
            }
            var onMouseOut = function() {
                this.style.outline = '0';
            }
            var onMouseDown = function() {
                p.hide();
                p.onmouseselection(this.__hint);
            }

            var p = {
                hide: function() {
                    elem.style.visibility = 'hidden';
                },
                refresh: function(token, array) {
                    elem.style.visibility = 'hidden';
                    ix = 0;
                    elem.innerHTML = '';
                    var vph = (window.innerHeight || document.documentElement.clientHeight);
                    var rect = elem.parentNode.getBoundingClientRect();
                    var distanceToTop = rect.top - 6; // heuristic give 6px
                    var distanceToBottom = vph - rect.bottom - 6; // distance from the browser border.

                    rows = [];
                    for (var i = 0; i < array.length; i++) {
                        //if (array[i].indexOf(token)!==0) { continue; }
                        var divRow = document.createElement('div');
                        divRow.style.color = config.color;
                        divRow.onmouseover = onMouseOver;
                        divRow.onmouseout = onMouseOut;
                        divRow.onmousedown = onMouseDown;
                        divRow.__hint = array[i];
                        divRow.innerHTML = "<b>" + array[i] + "</b>";//token + '<b>' + array[i].substring(token.length) + '</b>';
                        rows.push(divRow);
                        elem.appendChild(divRow);
                    }
                    if (rows.length === 0) {
                        console.log('there is no rows');
                        return; // nothing to show.
                    }
                    if (rows.length === 1 && token === rows[0].__hint) {
                        return; // do not show the dropDown if it has only one element which matches what we have just displayed.
                    }

                    if (rows.length < 2) return;
                    p.highlight(0);

                    if (distanceToTop > distanceToBottom * 3) { // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
                        elem.style.maxHeight = distanceToTop + 'px'; // we display the dropDown on the top of the input text
                        elem.style.top = '';
                        elem.style.bottom = '100%';
                    } else {
                        elem.style.top = '100%';
                        elem.style.bottom = '';
                        elem.style.maxHeight = distanceToBottom + 'px';
                    }
                    elem.style.visibility = 'visible';
                },
                highlight: function(index) {
                    if (oldIndex != -1 && rows[oldIndex]) {
                        rows[oldIndex].style.backgroundColor = config.backgroundColor;
                    }
                    rows[index].style.backgroundColor = config.dropDownOnHoverBackgroundColor; // <-- should be config
                    $(rows[index]).trigger('click');
                    $("#autocomplete_dropdown > div").removeClass('state__active');
                    $(rows[index]).toggleClass("state__active");
                    oldIndex = index;
                },
                move: function(step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
                    if (elem.style.visibility === 'hidden') return ''; // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
                    if (ix + step === -1 || ix + step === rows.length) return rows[ix].__hint; // NO CIRCULAR SCROLLING.
                    ix += step;
                    p.highlight(ix);
                    return rows[ix].__hint; //txtShadow.value = uRows[uIndex].__hint ;
                },
                onmouseselection: function() {} // it will be overwritten.
            };
            return p;
        };

        var dropDownController = createDropDownController(dropDown);

        dropDownController.onmouseselection = function(text) {
            txtInput.value = txtHint.value = settings.leftSide + text;
            rs.onChange(txtInput.value); // <-- forcing it.
            registerOnTextChangeOldValue = settings.leftSide + text; // <-- ensure that mouse down will not show the dropDown now.
            setTimeout(function() {
                txtInput.focus();
            }, 0); // <-- I need to do this for IE
            /*
            console.log('\n \n \n \n');
            console.log('______________________________debug combo');
            console.log('token: ' + settings.token);
            console.log('combo: ' + settings.combo);
            console.log('result: ' + settings.result);
            console.log('leftSide: ' + settings.leftSide);
            console.log('settings.text: ' + settings.text);
            console.log('text: ' + text);
            console.log("______________________________debug combo");
            console.log('\n \n \n \n');
            */
        };

        wrapper.appendChild(dropDown);
        container.appendChild(wrapper);

        var spacer;


        function calculateWidthForText(text) {
            if (spacer === undefined) { // on first call only.
                spacer = document.createElement('span');
                spacer.style.visibility = 'hidden';
                spacer.style.position = 'fixed';
                spacer.style.outline = '0';
                spacer.style.margin = '0';
                spacer.style.padding = '0';
                spacer.style.border = '0';
                spacer.style.left = '0';
                spacer.style.whiteSpace = 'pre';
                spacer.style.fontSize = config.fontSize;
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
        }


        var rs = {
            onArrowDown: function() {}, // defaults to no action.
            onArrowUp: function() {}, // defaults to no action.
            onEnter: function() {}, // defaults to no action.
            onTab: function() {}, // defaults to no action.
            onChange: function() {
                rs.repaint()
            }, // defaults to repainting.
            onContains: function(value) {
                return this.value.search(value) + 1
            },
            startFrom: 0,
            options: [],
            wrapper: wrapper, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
            input: txtInput, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
            hint: txtHint, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
            dropDown: dropDown, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
            prompt: prompt,
            setText: function(text) {
                txtHint.value = text;
                txtInput.value = text;
            },
            getText: function() {
                return txtInput.value;
            },
            hideDropDown: function() {
                dropDownController.hide();
            },
            repaint: function() {
                var options = settings.options;
                var optionsLength = settings.options.length;
                var chunk = settings.data.toLowerCase()
                var ls = settings.data.toLowerCase().search(settings.token.toLowerCase());
                var pos = settings.text.toLowerCase().search(settings.data.toLowerCase());
                if (ls >= 0) {
                    if (pos >= 0) {
                        settings.leftSide = settings.text.substr(0, pos + ls);
                    } else {
                        settings.leftSide = settings.text.substr(0, ls);
                    }
                } else {
                    settings.leftSide = settings.text;
                }

                // updating the hint.
                txtHint.value = '';
                // check is there are one or many autocomplete options
                // single
                if (optionsLength === 1) {
                    settings.combo = settings.options[0];
                    if (ls >= 0) {
                        txtHint.value = settings.combo;
                    } else {
                        txtHint.value = settings.options[0];
                    }
                    // dropdown(multiple)
                } else {
                    console.log('got multitple');
                    console.log(settings.options);
                    /*
                    for (var i=0;i<optionsLength;i++) {
                        if (settings.options[i].toLowerCase().search(settings.token.toLowerCase()) >= 0) {
                            console.log('Found');
                            //if (settings.options[i].indexOf(settings.token)===0) {         // <-- how about upperCase vs. lowercase
                            //txtHint.value = settings.leftSide + settings.options[i];
                            settings.combo = settings.options[i];
                            //break;
                        } else {
                            console.log('Nor');
                            txtHint.value = settings.options[i];
                            //txtHint.value = settings.leftSide + settings.options[0];
                        }

                    }
                        */
                    settings.combo = settings.options[0];
                    txtHint.value = settings.options[0];
                    //txtHint.value = settings.leftSide + settings.combo;
                    // moving the dropDown and refreshing it.
                    // debug
                    console.log('going to refresh dropDown');
                    dropDownController.refresh(settings.token, settings.options);
                }
                settings.result = settings.leftSide + settings.combo;
                // set offset for autocomplete hint or dropdown
                settings.caret_coords = settings.getCaretCoordinates(settings.reply_input);
                console.log('caret coords : ' + settings.caret_coords.left + '; ' + settings.caret_coords.top);
                jQuery("#autocomplete_hint").css('left', settings.caret_coords.left + 'px');
                jQuery("#autocomplete_dropdown").css('left', settings.caret_coords.left + 'px');
                jQuery("#autocomplete_hint").css('top', settings.caret_coords.top + 'px');
                jQuery("autocomplete_dropdown").css('top', settings.caret_coords.top + 'px');

                // debug
                console.log('------Debug:');
                console.log('token : ' + settings.token);
                console.log('text: ' + settings.text);
                console.log('data: ' + settings.data);
                console.log('text_slice: ' + settings.text_slice);
                console.log('caret_position : ' + settings.caret_position);
                console.log('options : ' + settings.options);
                console.log('leftSide : ' + settings.leftSide);
                console.log('combo : ' + settings.combo);
                console.log('left : ' + ls);
                console.log('pos : ' + pos);
                console.log('search: ' + settings.text.toLowerCase().search(settings.data.toLowerCase()));
                console.log('------');
                //
            }
        };

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
                txt.addEventListener("input", handler, false);
                txt.addEventListener('keyup', handler, false);
                txt.addEventListener('change', handler, false);
            } else { // is this a fair assumption: that attachEvent will exist ?
                txt.attachEvent('oninput', handler); // IE<9
                txt.attachEvent('onkeyup', handler); // IE<9
                txt.attachEvent('onchange', handler); // IE<9
            }
        };


        registerOnTextChange(txtInput, function(text) { // note the function needs to be wrapped as API-users will define their onChange
            rs.onChange(text);
        });


        var keyDownHandler = function(e) {
            e = e || window.event;
            var keyCode = e.keyCode;
            if (keyCode == 33) {
                return;
            } // page up (do nothing)
            if (keyCode == 34) {
                return;
            } // page down (do nothing);

            if (keyCode == 27) { //escape
                dropDownController.hide();
                txtHint.value = txtInput.value; // ensure that no hint is left.
                txtInput.focus();
                return;
            }

            if (keyCode == 39 || keyCode == 35 || keyCode == 9) { // right,  end, tab  (autocomplete triggered)
                dropDownController.hide();
                if (keyCode == 9) { // for tabs we need to ensure that we override the default behaviour: move to the next focusable HTML-element
                    e.preventDefault();
                    e.stopPropagation();
                    if (txtHint.value.length == 0) {
                        rs.onTab(); // tab was called with no action.
                        // users might want to re-enable its default behaviour or handle the call somehow.
                    }
                }
                // if there is a hint
                if (txtHint.value.length > 0) {
                    dropDownController.hide();
                    // if there is one option, not mutiple options
                    if (settings.options.length === 1) {
                        //debug
                        console.log('got single options, just txtHint');
                        var token_arr = settings.token.split(' ');
                        var index = -1;
                        var slice = '';
                        // check token words length
                        if (token_arr.length === 1) { // single
                            if (settings.text.length) {
                                index = settings.text.toLowerCase().search(token_arr[0].trim());
                            }
                            // do we have token in left part of textarea text
                            if (index >= 0) {
                                slice = settings.text.substr(0, index);
                                settings.result = slice + settings.combo;
                            } else {
                                slice = '';
                                settings.result = settings.combo;
                            }

                        } else { // multiple
                            for (i = 0; i < token_arr.length; i++) {
                                /////
                                ///// TODO: REFACTOR
                                slice = settings.leftSide.replace(token_arr[i].trim(), '');
                                /////
                                /////
                            }
                            settings.result = slice + settings.combo;
                        }
                        // multiple settings.options
                    } else {
                        var dropdown_text = '' //$("#autocomplete_dropdown:first > div.dropdown__active:first").text();
                        console.log('\n \n \n \n');
                        console.log('______________________________debug combo');
                        console.log('dropdown_text: ' + dropdown_text);
                        console.log('txtHint.value: ' + txtHint.value);
                        console.log('slice: ' + slice);
                        console.log('token: ' + settings.token);
                        console.log('combo: ' + settings.combo);
                        console.log('result: ' + settings.result);
                        console.log('leftSide: ' + settings.leftSide);
                        console.log('text: ' + settings.text);
                        console.log("______________________________debug combo");
                        console.log('\n \n \n \n');
                        settings.result = settings.leftSide + txtHint.value;
                    }

                    settings.reply_input.value = settings.result;




                    var hasTextChanged = registerOnTextChangeOldValue != txtInput.value;
                    registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again.
                    // for example imagine the array contains the following words: bee, beef, beetroot
                    // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                    if (hasTextChanged) {
                        rs.onChange(txtInput.value); // <-- forcing it.
                    }
                }
                return;
            }
            if (keyCode == 13) { // enter  (autocomplete triggered)
                var active_row = jQuery("#autocomplete_dropdown > div.state__active");
                // debug
                console.log('active_row: '+ active_row.text());
                if (txtHint.value.length == 0) { // if there is a hint
                    console.log('got hint');
                    rs.onEnter();                    
                    settings.result = settings.leftSide + active_row.val();
                } else {
                    console.log('no hint');
                    var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
                    dropDownController.hide();

                    if (wasDropDownHidden) {
                        txtHint.value = txtInput.value; // ensure that no hint is left.
                        txtInput.focus();
                        rs.onEnter();
                        return;
                    }                 
                    settings.result = txtHint.value;
                }
                settings.result = settings.leftSide + active_row.text();
                txtInput.value = settings.result;
                var hasTextChanged = registerOnTextChangeOldValue != txtInput.value;
                registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again.
                    // for example imagine the array contains the following words: bee, beef, beetroot
                    // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                if (hasTextChanged) {
                    rs.onChange(txtInput.value); // <-- forcing it.
                }

                return;
            }

            if (keyCode == 40) { // down
                var m = dropDownController.move(+1);
                if (m == '') {
                    rs.onArrowDown();
                }
                txtHint.value = m;
                return;
            }

            if (keyCode == 38) { // up
                var m = dropDownController.move(-1);
                if (m == '') {
                    rs.onArrowUp();
                }
                txtHint.value = m;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // it's important to reset the txtHint on key down.
            // think: user presses a letter (e.g. 'x') and never releases... you get (xxxxxxxxxxxxxxxxx)
            // and you would see still the hint
            txtHint.value = ''; // resets the txtHint. (it might be updated onKeyUp)

        };

        if (txtInput.addEventListener) {
            txtInput.addEventListener("keydown", keyDownHandler, false);
        } else { // is this a fair assumption: that attachEvent will exist ?
            txtInput.attachEvent('onkeydown', keyDownHandler); // IE<9
        }
        return rs;
    }
    // 
    var ac = autocomplete(settings.reply_input.parentNode); //settings.reply_input.parentNode);
    ac.onChange = function(text) {
        settings.text = settings.reply_input.value;
        settings.caret_position = settings.getCaretPosition(settings.reply_input);
        settings.text_slice = '';

        /* joxi */
        var pattern = "http://joxi.ru/";
        var hash = 14;
        var extension = ".jpg";
        var whitespace = ' ';
        var joxiRegexp = new RegExp("http://joxi.ru/[a-zA-Z0-9]{14}", "g");
        var joxiRegexpWithExtension = new RegExp("http://joxi.ru/[a-zA-Z0-9.]{17}", "g");
        // joxi
        if ((text.search(joxiRegexp) >= 0) && !(text.search(joxiRegexpWithExtension) + 1)) {
            var patternIndex = text.indexOf(pattern) + pattern.length + hash;
            var stringBegining = text.substring(0, patternIndex);
            var stringEnding = text.substring(patternIndex);
            settings.reply_input.value = stringBegining + extension + stringEnding + whitespace;
        }

        if (settings.caret_position && settings.caret_position >= 15) {
            settings.text_slice = settings.text.substr(settings.caret_position - 15, settings.text.length);
        }
        if (settings.text_slice) {
            settings.data = settings.text_slice;
        } else {
            settings.data = settings.text;
        }
        for (var i = 0; i < settings.combination.length; i++) {
            // if we got any combination
            if (settings.data.toLowerCase().search(settings.combination[i].id) >= 0) {
                settings.token = settings.combination[i].id;
                settings.combination_id = i;
                settings.options = settings.combination[i].options;
                ac.repaint();
                return;
            }
        }
    };
    ac.options = [];

    // diable quote text inserting into reply field
    var last_message_reply = document.querySelector("td.contenttableborder a");
    var last_reply_id = last_message_reply.onclick.toString();
    last_reply_id = last_reply_id.match(/(\d+)/)[0];
    last_message_reply.setAttribute('onclick', 'javascript:void(0)');

    // submit
    var submit = document.querySelector("#replyform input.yellowbuttonbig");
    var submit_wrapper = submit.parentElement;
    var button = document.createElement('input');

    button.id = 'preview_button';
    button.className = 'bluebuttonsuperbig';
    button.style.marginRight = '8px';
    button.value = 'Предпросмотр';
    button.type = 'button';

    submit.parentElement.insertBefore(button, submit);
    submit.setAttribute('disabled', 'true');
    submit.style.background = 'gray';

    // hook click events on preview button
    var button = document.querySelector('#preview_button');
    button.setAttribute('onclick', "autoInsertTP(" + last_reply_id + ", 'reply');");
    button.addEventListener('click', function() {
        if (submit.hasAttribute('disabled')) {
            submit.removeAttribute('disabled');
            submit.style.background = 'transparent url("https://support.mchost.ru/support/themes/admin_default/yellowbuttonbigbg.gif") no-repeat scroll 0% 0%';
            this.style.background = 'gray';
        }
    });

    // hook reply button
    var post_reply_tab = document.querySelector('#ttpostreply');
    last_message_reply.addEventListener('click', function() {
        post_reply_tab.dispatchEvent(settings.click);
    });
}

    // scroll to top button
    settings.create_scrolltop();

/////////
/////////
/////////           Category(tickets) page
/////////
/////////
if (settings.current_page == 'category') {
    console.log('Work on category page, observer functions enabled');

    //////
    ////// OBSERVER OBJECT
    //////
    var observer = new Object({
        tickets_on_the_page: document.querySelectorAll(settings.tickets_on_the_page_selector),
        timer: 0,
        refresh_tickets_on_the_page: function() {
            // don't forget to refresh tickets_on_the_page counter
            this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector);
            var tickets = this.tickets_on_the_page;
            // set target="_blank" to all a elements in the ticket to open new tickets in separate tab and don't break the observer
            for (i = 0; i < tickets.length; i++) {
                if ((tickets[i].id != '') && (tickets[i].id != "trmassaction")) {
                    var links = tickets[i].querySelectorAll("a");
                    for (j = 0; j < links.length; j++) {
                        links[j].target = "_blank"
                    }
                }
            }
        },
        set_observer: function() {
            // debug
            console.log('The observer set');
            // hilight_area
            settings.highlight_area.add_class("observer_is_set");
            settings.highlight_area.remove_class("observer_is_not_set");
            settings.highlight_area.remove_class("observer_timeout");
            // get page tickets
            this.tickets_on_the_page = document.querySelectorAll(settings.tickets_on_the_page_selector); //this.get_page_tickets();
            // send request
            this.timer = setInterval(function() {
                var url = window.location.href + settings.charset;
                // debug
                console.log('Send request: ' + url);
                var xhr = new XMLHttpRequest();
                // create async request
                xhr.open('GET', url, true);
                xhr.send();
                xhr.onload = function() {
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
                    form_html += chunk_form_end;
                    // debug
                    //console.log(form_html);
                    var dom = document.createElement('div');
                    dom.innerHTML = form_html;
                    // store new data in dummy html element
                    var tickets_in_response = dom.querySelectorAll(settings.tickets_on_the_page_selector); //"tr.rownotes");
                    // debug
                    console.log('Tickets on the page: ' + (observer.tickets_on_the_page.length - 2));
                    console.log('Tickets in response: ' + (tickets_in_response.length - 2));
                    // check results
                    if (observer.tickets_on_the_page.length < tickets_in_response.length) {
                        // debug
                        console.log('Got new ticket!');
                        //
                        // play sound
                        settings.play_sound();
                        // and then just apply new tickets to the page
                        document.getElementById('ticketlist').innerHTML = dom.innerHTML;
                        // restore trmassaction block from backup
                        document.getElementById('trmassaction').innerHTML = settings.mass_action_backup.innerHTML;
                    } else if (observer.tickets_on_the_page.length > tickets_in_response.length) {
                        // insert loaded tickets
                        document.getElementById('ticketlist').innerHTML = dom.innerHTML;
                        // restore trmassaction block from backup
                        document.getElementById('trmassaction').innerHTML = settings.mass_action_backup.innerHTML;
                    } else {
                        // debug
                        console.log("---***---");
                        console.log("---***---          No new tickets              ");
                        console.log("---***---");
                    }
                    // refresh current tickets counter
                    observer.refresh_tickets_on_the_page();
                    // hilight_area
                    settings.highlight_area.add_class("observer_is_set");
                    settings.highlight_area.remove_class("observer_is_not_set");
                    settings.highlight_area.remove_class("observer_timeout");
                }
                xhr.ontimeout = function() {
                        // debug
                        console.log('Timeout');
                        // hilight_area
                        settings.highlight_area.remove_class("observer_is_set");
                        settings.highlight_area.remove_class("observer_is_not_set");
                        settings.highlight_area.add_class("observer_timeout");
                    }
                    // request timeout
                xhr.timeout = settings.request_timeout;
            }, settings.refresh_timeout);
        },
        remove_observer: function() {
            // debug
            console.log('The observer removed');
            clearInterval(this.timer);
        }
    });
    // create toolbox
    settings.create_toolbox();
}
