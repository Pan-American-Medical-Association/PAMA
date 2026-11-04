/* Ask PAMA — floating chat bubble on every page. Talks to the Apps Script endpoint (Chat.gs). */
(function () {
  if (window.__pamaChat) return; window.__pamaChat = true;
  var ENDPOINT = window.PAMA_FORMS_ENDPOINT || 'https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec';
  var lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var me = document.currentScript || document.querySelector('script[src*="assets/js/chat.js"]');
  var ROOT = me ? me.src.replace(/assets\/js\/chat\.js.*$/, '') : '/';
  var SITE = ROOT;                                  // privacy link and logo resolve from the site root
  var LANGS = ['es', 'pt', 'fr', 'it', 'zh', 'ru', 'de', 'pl'];
  if (LANGS.indexOf(lang) >= 0) SITE = ROOT + lang + '/';
  var MSG = {
    en: { give: "Ask PAMA is free for everyone, thanks to our supporters. A gift of any size helps keep it open for clinicians, students and families across the Americas.", giveBtn: "Help keep Ask PAMA open", steps: ['Searching our library…', 'Reading the sources…', 'Checking current news…', 'Writing your answer…'], sources: 'Sources', error: 'Sorry, the assistant could not answer right now. Please try again in a moment.', setup: 'The assistant is almost ready. Please check back soon, or email info@pan-american.org.', thinking: 'Searching our sources…', page: 'page' },
    es: { give: "Ask PAMA es gratuito para todos gracias a quienes nos apoyan. Una donación de cualquier monto ayuda a mantenerlo abierto para profesionales de la salud, estudiantes y familias de toda América.", giveBtn: "Ayude a mantener Ask PAMA abierto", steps: ['Buscando en la biblioteca…', 'Leyendo las fuentes…', 'Consultando noticias recientes…', 'Escribiendo la respuesta…'], sources: 'Fuentes', error: 'Lo sentimos, el asistente no pudo responder ahora. Inténtelo de nuevo en un momento.', setup: 'El asistente está casi listo. Vuelva pronto o escriba a info@pan-american.org.', thinking: 'Buscando en nuestras fuentes…', page: 'página' },
    pt: { give: "O Ask PAMA é gratuito para todos graças aos nossos apoiadores. Uma doação de qualquer valor ajuda a mantê-lo aberto para profissionais de saúde, estudantes e famílias de todas as Américas.", giveBtn: "Ajude a manter o Ask PAMA aberto", steps: ['Pesquisando na biblioteca…', 'Lendo as fontes…', 'Verificando notícias recentes…', 'Escrevendo a resposta…'], sources: 'Fontes', error: 'Desculpe, o assistente não conseguiu responder agora. Tente novamente em instantes.', setup: 'O assistente está quase pronto. Volte em breve ou escreva para info@pan-american.org.', thinking: 'Pesquisando nossas fontes…', page: 'página' },
    fr: { give: "Ask PAMA est gratuit pour tous grâce à nos soutiens. Un don de tout montant aide à le garder ouvert pour les soignants, les étudiants et les familles des Amériques.", giveBtn: "Aidez à garder Ask PAMA ouvert", steps: ['Recherche dans la bibliothèque…', 'Lecture des sources…', 'Vérification des actualités…', 'Rédaction de la réponse…'], sources: 'Sources', error: 'Désolé, l’assistant n’a pas pu répondre. Veuillez réessayer dans un instant.', setup: 'L’assistant est presque prêt. Revenez bientôt ou écrivez à info@pan-american.org.', thinking: 'Recherche dans nos sources…', page: 'page' },
    it: { give: "Ask PAMA è gratuito per tutti grazie ai nostri sostenitori. Una donazione di qualsiasi importo aiuta a mantenerlo aperto per operatori sanitari, studenti e famiglie in tutte le Americhe.", giveBtn: "Aiuta a mantenere aperto Ask PAMA", steps: ['Ricerca nella biblioteca…', 'Lettura delle fonti…', 'Controllo delle notizie recenti…', 'Scrittura della risposta…'], sources: 'Fonti', error: 'Spiacenti, l’assistente non è riuscito a rispondere. Riprova tra poco.', setup: 'L’assistente è quasi pronto. Torna presto o scrivi a info@pan-american.org.', thinking: 'Ricerca nelle nostre fonti…', page: 'pagina' },
    zh: { give: "感谢支持者的帮助，Ask PAMA 对所有人免费开放。任何金额的捐款都能帮助它继续为美洲各地的医护人员、学生和家庭服务。", giveBtn: "帮助 Ask PAMA 持续开放", steps: ['正在检索资料库…', '正在阅读来源…', '正在查看最新消息…', '正在撰写回答…'], sources: '来源', error: '抱歉，助手暂时无法回答，请稍后再试。', setup: '助手即将上线。请稍后再来，或发送邮件至 info@pan-american.org。', thinking: '正在检索资料…', page: '页' },
    ru: { give: "Ask PAMA бесплатен для всех благодаря нашим сторонникам. Пожертвование любого размера помогает сохранить его открытым для медиков, студентов и семей по всей Америке.", giveBtn: "Помогите сохранить Ask PAMA открытым", steps: ['Ищем в библиотеке…', 'Читаем источники…', 'Проверяем свежие новости…', 'Пишем ответ…'], sources: 'Источники', error: 'Извините, ассистент сейчас не может ответить. Попробуйте ещё раз чуть позже.', setup: 'Ассистент почти готов. Загляните позже или напишите на info@pan-american.org.', thinking: 'Ищем в наших источниках…', page: 'стр.' },
    de: { give: "Ask PAMA ist dank unserer Unterstützer für alle kostenlos. Eine Spende in jeder Höhe hilft, es für Fachkräfte, Studierende und Familien in ganz Amerika offen zu halten.", giveBtn: "Helfen Sie, Ask PAMA offen zu halten", steps: ['Durchsuche die Bibliothek…', 'Lese die Quellen…', 'Prüfe aktuelle Meldungen…', 'Schreibe die Antwort…'], sources: 'Quellen', error: 'Leider konnte der Assistent gerade nicht antworten. Bitte versuchen Sie es gleich noch einmal.', setup: 'Der Assistent ist fast bereit. Schauen Sie bald wieder vorbei oder schreiben Sie an info@pan-american.org.', thinking: 'Durchsuche unsere Quellen…', page: 'S.' },
    pl: { give: "Ask PAMA jest bezpłatny dla wszystkich dzięki naszym darczyńcom. Darowizna w dowolnej wysokości pomaga utrzymać go otwartym dla medyków, studentów i rodzin w obu Amerykach.", giveBtn: "Pomóż utrzymać Ask PAMA otwartym", steps: ['Przeszukujemy bibliotekę…', 'Czytamy źródła…', 'Sprawdzamy najnowsze wiadomości…', 'Piszemy odpowiedź…'], sources: 'Źródła', error: 'Przepraszamy, asystent nie może teraz odpowiedzieć. Spróbuj ponownie za chwilę.', setup: 'Asystent jest prawie gotowy. Zajrzyj wkrótce lub napisz na info@pan-american.org.', thinking: 'Przeszukujemy nasze źródła…', page: 's.' }
  };
  var T = MSG[lang] || MSG.en;
  var UI = {"en": {"title": "Ask PAMA", "greet": "Hi there! 👋 Ask me about PAMA’s programs, how you can help, or any public-health question.", "send": "Send", "ph": "Type your question…", "q": "Your question", "chips": [["📦", "How can I donate medical supplies?"], ["🦟", "What are the warning signs of dengue?"], ["❤️", "How is high blood pressure prevented?"], ["🌎", "What does PAMA do in Guatemala?"]], "fine": "For education only, not medical advice. In an emergency, call your local emergency number. Questions are saved without names.", "privacy": "Privacy", "open": "Chat with PAMA", "close": "Close chat", "tip": "Need help? Ask PAMA"}, "es": {"title": "Pregúntale a PAMA", "greet": "¡Hola! 👋 Pregúntame sobre los programas de PAMA, cómo puedes ayudar o cualquier tema de salud pública.", "send": "Enviar", "ph": "Escriba su pregunta…", "q": "Su pregunta", "chips": [["📦", "¿Cómo puedo donar insumos médicos?"], ["🦟", "¿Cuáles son los signos de alarma del dengue?"], ["❤️", "¿Cómo se previene la presión arterial alta?"], ["🌎", "¿Qué hace PAMA en Guatemala?"]], "fine": "Solo con fines educativos, no es consejo médico. En una emergencia, llame al número de emergencias local. Las preguntas se guardan sin nombres.", "privacy": "Privacidad", "open": "Chatear con PAMA", "close": "Cerrar chat", "tip": "¿Preguntas? Pregúntale a PAMA"}, "pt": {"title": "Pergunte à PAMA", "greet": "Olá! 👋 Pergunte sobre os programas da PAMA, como você pode ajudar ou qualquer tema de saúde pública.", "send": "Enviar", "ph": "Digite sua pergunta…", "q": "Sua pergunta", "chips": [["📦", "Como posso doar suprimentos médicos?"], ["🦟", "Quais são os sinais de alerta da dengue?"], ["❤️", "Como se previne a pressão alta?"], ["🌎", "O que a PAMA faz na Guatemala?"]], "fine": "Apenas para fins educativos, não é aconselhamento médico. Em uma emergência, ligue para o número de emergência local. As perguntas são guardadas sem nomes.", "privacy": "Privacidade", "open": "Conversar com a PAMA", "close": "Fechar chat", "tip": "Dúvidas? Pergunte à PAMA"}, "fr": {"title": "Demandez à PAMA", "greet": "Bonjour ! 👋 Posez-moi vos questions sur les programmes de PAMA, sur la façon d’aider ou sur la santé publique.", "send": "Envoyer", "ph": "Écrivez votre question…", "q": "Votre question", "chips": [["📦", "Comment puis-je donner des fournitures médicales ?"], ["🦟", "Quels sont les signes d’alerte de la dengue ?"], ["❤️", "Comment prévenir l’hypertension artérielle ?"], ["🌎", "Que fait PAMA au Guatemala ?"]], "fine": "À titre éducatif uniquement, ce n’est pas un avis médical. En cas d’urgence, appelez le numéro d’urgence local. Les questions sont enregistrées sans nom.", "privacy": "Confidentialité", "open": "Discuter avec PAMA", "close": "Fermer le chat", "tip": "Une question ? Demandez à PAMA"}, "it": {"title": "Chiedi a PAMA", "greet": "Ciao! 👋 Chiedimi dei programmi di PAMA, di come puoi aiutare o di qualsiasi tema di salute pubblica.", "send": "Invia", "ph": "Scrivi la tua domanda…", "q": "La tua domanda", "chips": [["📦", "Come posso donare forniture mediche?"], ["🦟", "Quali sono i segnali di allarme della dengue?"], ["❤️", "Come si previene la pressione alta?"], ["🌎", "Che cosa fa PAMA in Guatemala?"]], "fine": "Solo a scopo educativo, non è un parere medico. In caso di emergenza, chiama il numero di emergenza locale. Le domande vengono salvate senza nomi.", "privacy": "Privacy", "open": "Chatta con PAMA", "close": "Chiudi la chat", "tip": "Domande? Chiedi a PAMA"}, "zh": {"title": "问问 PAMA", "greet": "您好！👋 您可以问我 PAMA 的项目、如何提供帮助，或任何公共卫生问题。", "send": "发送", "ph": "请输入您的问题…", "q": "您的问题", "chips": [["📦", "如何捐赠医疗物资？"], ["🦟", "登革热有哪些危险信号？"], ["❤️", "如何预防高血压？"], ["🌎", "PAMA 在危地马拉做什么？"]], "fine": "仅供健康教育参考，不构成医疗建议。如遇紧急情况，请拨打当地急救电话。提问内容不记录姓名。", "privacy": "隐私政策", "open": "与 PAMA 聊天", "close": "关闭聊天", "tip": "有问题？问问 PAMA"}, "ru": {"title": "Спросите PAMA", "greet": "Здравствуйте! 👋 Спросите о программах PAMA, о том, как помочь, или на любую тему общественного здоровья.", "send": "Отправить", "ph": "Введите ваш вопрос…", "q": "Ваш вопрос", "chips": [["📦", "Как пожертвовать медицинские материалы?"], ["🦟", "Каковы тревожные признаки денге?"], ["❤️", "Как предотвратить высокое давление?"], ["🌎", "Что делает PAMA в Гватемале?"]], "fine": "Только в образовательных целях, это не медицинская консультация. В экстренной ситуации звоните по местному номеру экстренной помощи. Вопросы сохраняются без имён.", "privacy": "Конфиденциальность", "open": "Чат с PAMA", "close": "Закрыть чат", "tip": "Есть вопрос? Спросите PAMA"}, "de": {"title": "Fragen Sie PAMA", "greet": "Hallo! 👋 Fragen Sie mich zu den Programmen von PAMA, wie Sie helfen können, oder zu jedem Thema der öffentlichen Gesundheit.", "send": "Senden", "ph": "Ihre Frage eingeben…", "q": "Ihre Frage", "chips": [["📦", "Wie kann ich medizinisches Material spenden?"], ["🦟", "Was sind die Warnzeichen von Dengue?"], ["❤️", "Wie lässt sich Bluthochdruck vorbeugen?"], ["🌎", "Was macht PAMA in Guatemala?"]], "fine": "Nur zu Informationszwecken, keine medizinische Beratung. Rufen Sie im Notfall die örtliche Notrufnummer an. Fragen werden ohne Namen gespeichert.", "privacy": "Datenschutz", "open": "Mit PAMA chatten", "close": "Chat schließen", "tip": "Fragen? Fragen Sie PAMA"}, "pl": {"title": "Zapytaj PAMA", "greet": "Dzień dobry! 👋 Zapytaj o programy PAMA, o to, jak możesz pomóc, lub o dowolny temat zdrowia publicznego.", "send": "Wyślij", "ph": "Wpisz swoje pytanie…", "q": "Twoje pytanie", "chips": [["📦", "Jak mogę przekazać materiały medyczne?"], ["🦟", "Jakie są objawy alarmowe dengi?"], ["❤️", "Jak zapobiegać nadciśnieniu?"], ["🌎", "Co PAMA robi w Gwatemali?"]], "fine": "Wyłącznie w celach edukacyjnych, to nie jest porada medyczna. W nagłym przypadku zadzwoń pod lokalny numer alarmowy. Pytania są zapisywane bez imion.", "privacy": "Prywatność", "open": "Czat z PAMA", "close": "Zamknij czat", "tip": "Pytania? Zapytaj PAMA"}};
  var U = UI[lang] || UI.en;

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  var session = store('pamaChatSession');
  if (!session) { session = Math.random().toString(36).slice(2) + Date.now().toString(36); store('pamaChatSession', session); }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s, id) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[S(\d+)\]/g, '<a class="ask-cite" href="#' + id + '-S$1">$1</a>');
  }
  function render(text, id) {
    var out = [], list = null;
    String(text).split(/\n/).forEach(function (line) {
      var m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (m) { if (!list) { list = []; } list.push('<li>' + inline(m[1], id) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      line = line.replace(/^#{1,6}\s+/, '');
      if (line.trim()) out.push('<p>' + inline(line, id) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }

  /* ---------- Build the launcher + panel ---------- */
  var logo = ROOT + 'assets/img/pama-emblem-v2.png';
  var wrap = document.createElement('div');
  wrap.className = 'pama-chat';
  wrap.innerHTML =
    '<div class="pama-chat-tip" hidden>' + esc(U.tip) + '</div>' +
    '<section class="pama-chat-panel ask-card" role="dialog" aria-modal="false" aria-label="' + esc(U.title) + '" hidden>' +
      '<div class="ask-head"><span class="ask-avatar" aria-hidden="true"><img src="' + logo + '" alt="" width="33" height="33"></span>' +
        '<div class="ask-head-text"><h2>' + esc(U.title) + '</h2></div>' +
        '<button type="button" class="pama-chat-x" aria-label="' + esc(U.close) + '"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" transform="translate(1.1 0)"/></svg></button></div>' +
      '<div class="ask-log" aria-live="polite"><div class="ask-msg ask-bot"><p>' + esc(U.greet) + '</p></div></div>' +
      '<div class="ask-chips">' + U.chips.map(function (c) { return '<button type="button" class="ask-chip" data-q="' + esc(c[1]) + '"><span aria-hidden="true">' + c[0] + ' </span>' + esc(c[1]) + '</button>'; }).join('') + '</div>' +
      '<form class="ask-form"><label class="visually-hidden" for="pama-chat-input">' + esc(U.q) + '</label>' +
        '<textarea id="pama-chat-input" rows="1" maxlength="1000" placeholder="' + esc(U.ph) + '" required></textarea>' +
        '<button type="submit" class="ask-send" aria-label="' + esc(U.send) + '"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg></button></form>' +
      '<p class="ask-fine">' + esc(U.fine) + ' <a href="' + SITE + 'privacy-transparency/">' + esc(U.privacy) + '</a></p>' +
    '</section>' +
    '<button type="button" class="pama-chat-fab" aria-expanded="false" aria-label="' + esc(U.open) + '">' +
      '<img class="pama-chat-logo" src="' + logo + '" alt="" width="46" height="46">' +
      '<svg class="pama-chat-close" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/></svg>' +
    '</button>';
  document.body.appendChild(wrap);

  var panel = wrap.querySelector('.pama-chat-panel');
  var fab = wrap.querySelector('.pama-chat-fab');
  var tip = wrap.querySelector('.pama-chat-tip');
  var log = panel.querySelector('.ask-log');
  var form = panel.querySelector('.ask-form');
  var input = form.querySelector('textarea');
  var button = form.querySelector('button');
  var chips = panel.querySelector('.ask-chips');
  var history = [];
  var busy = false;

  function setOpen(open) {
    panel.hidden = !open;
    wrap.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    fab.setAttribute('aria-label', open ? U.close : U.open);
    store('pamaChatOpen', open ? '1' : '0');
    tip.hidden = true;
    if (open) { log.scrollTop = log.scrollHeight; if (window.matchMedia('(min-width: 600px)').matches) input.focus(); }
  }
  fab.addEventListener('click', function () { setOpen(panel.hidden); });
  panel.querySelector('.pama-chat-x').addEventListener('click', function () { setOpen(false); fab.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); fab.focus(); } });
  tip.addEventListener('click', function () { setOpen(true); });

  function add(cls, html) {
    var d = document.createElement('div');
    d.className = 'ask-msg ' + cls;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function sourcesHtml(sources, id) {
    if (!sources || !sources.length) return '';
    var seen = {};
    return '<ul class="ask-sources" aria-label="' + esc(T.sources) + '">' + sources.map(function (s) {
      var n = s.label.slice(1);
      var detail = s.detail ? ', ' + esc(s.detail.replace(/^p\. /, T.page + ' ')) : '';
      var name = s.url ? '<a href="' + esc(s.url) + '">' + esc(s.title) + '</a>' : esc(s.title);
      return '<li id="' + id + '-S' + n + '"><b>' + n + '</b>' + name + detail + '</li>';
    }).join('') + '</ul>';
  }


  /* Keep the conversation while the visitor moves between pages (this browser tab only). */
  function save() { store('pamaChatLog', JSON.stringify(history.slice(-12))); }
  (function restore() {
    var saved; try { saved = JSON.parse(store('pamaChatLog') || '[]'); } catch (e) { saved = []; }
    if (!saved.length) return;
    chips.hidden = true;
    saved.forEach(function (m, i) {
      history.push(m);
      if (m.role === 'user') add('ask-user', esc(m.content));
      else { var id = 'r' + i; add('ask-bot', render(m.content, id) + sourcesHtml(m.sources || [], id)); }
    });
  })();

  function ask(q) {
    q = String(q || '').trim();
    if (!q || busy) return;
    busy = true; button.disabled = true;
    chips.hidden = true;
    add('ask-user', esc(q));
    history.push({ role: 'user', content: q });
    save();
    var wait = add('ask-bot ask-typing', '<span class="ask-dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="ask-status">' + esc(T.steps[0]) + '</span>');
    var step = 0, statusEl = wait.querySelector('.ask-status');
    var ticker = setInterval(function () { step = Math.min(step + 1, T.steps.length - 1); statusEl.textContent = T.steps[step]; }, 2600);
    if (window.gtag) { try { window.gtag('event', 'chat_question', { language: lang, page_path: location.pathname }); } catch (e) {} }
    var payload = history.slice(-8).map(function (m) { return { role: m.role, content: m.content }; });
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'chat_ask', session: session, lang: lang, messages: payload }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        clearInterval(ticker); wait.remove();
        if (!res || !res.ok) {
          history.pop(); save();
          var msg = res && res.code === 'setup' ? T.setup : (res && res.code === 'rate_limited' && res.error) || T.error;
          add('ask-bot ask-err', '<p>' + esc(msg) + '</p>');
          return;
        }
        var id = 'ans' + history.length;
        history.push({ role: 'assistant', content: res.answer, sources: res.sources || [] });
        save();
        reveal(add('ask-bot', ''), render(res.answer, id), sourcesHtml(res.sources, id), maybeGive);
      })
      .catch(function () { clearInterval(ticker); wait.remove(); history.pop(); save(); add('ask-bot ask-err', '<p>' + esc(T.error) + '</p>'); })
      .then(function () { busy = false; button.disabled = false; });
  }

  /* Type the answer in word by word (instant when the visitor prefers reduced motion). */
  function reveal(el, html, tail, done) {
    done = done || function () {};
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.innerHTML = html + tail; log.scrollTop = log.scrollHeight; done(); return; }
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    var texts = [], walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { texts.push({ node: walker.currentNode, full: walker.currentNode.nodeValue }); walker.currentNode.nodeValue = ''; }
    el.appendChild(tmp);
    var ti = 0, pos = 0;
    (function tick() {
      for (var n = 0; n < 3 && ti < texts.length; n++) {
        var t = texts[ti], next = t.full.indexOf(' ', pos + 1);
        pos = next === -1 ? t.full.length : next;
        t.node.nodeValue = t.full.slice(0, pos);
        if (pos >= t.full.length) { ti++; pos = 0; }
      }
      log.scrollTop = log.scrollHeight;
      if (ti < texts.length) setTimeout(tick, 18);
      else { el.insertAdjacentHTML('beforeend', tail); log.scrollTop = log.scrollHeight; done(); }
    })();
  }

  /* After the second answer, one friendly ask per visit to support the assistant. */
  function maybeGive() {
    var answers = history.filter(function (m) { return m.role === 'assistant'; }).length;
    if (answers < 2 || store('pamaChatGiveShown')) return;
    store('pamaChatGiveShown', '1');
    var href = SITE + 'donate/?utm_source=ask-pama&utm_medium=chat&utm_campaign=keep-ask-pama-open';
    add('ask-bot ask-give', '<p>💙 ' + esc(T.give) + '</p><a class="ask-give-btn" href="' + href + '">' + esc(T.giveBtn) + ' →</a>');
    if (window.gtag) { try { window.gtag('event', 'chat_donate_prompt', { language: lang }); } catch (e) {} }
  }
  log.addEventListener('click', function (e) {
    if (e.target.closest('.ask-give-btn') && window.gtag) { try { window.gtag('event', 'chat_donate_click', { language: lang }); } catch (x) {} }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value; input.value = ''; input.style.height = '';
    ask(q);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
  });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 112) + 'px'; });
  chips.addEventListener('click', function (e) { var b = e.target.closest('.ask-chip'); if (b) ask(b.getAttribute('data-q')); });

  /* Links: /ask/ shows the chat full-size in the page; any page opens it with #ask or ?chat=1;
     ?q=... pre-fills a question (not sent until the visitor presses send). */
  var params = new URLSearchParams(location.search);
  var preset = (params.get('q') || '').slice(0, 300);
  var host = document.querySelector('[data-chat-inline]');
  if (host) {
    host.appendChild(panel);
    panel.classList.add('is-inline');
    panel.setAttribute('role', 'region');
    panel.querySelector('.pama-chat-x').hidden = true;
    panel.hidden = false;
    fab.hidden = true; tip.hidden = true;
    if (preset) input.value = preset;
    input.focus({ preventScroll: true });
    return;
  }
  if (location.hash === '#ask' || params.get('chat') === '1' || preset) {
    setOpen(true);
    if (preset) input.value = preset;
  }
  else if (store('pamaChatOpen') === '1') setOpen(true);
  else if (!store('pamaChatTipShown')) {           // a friendly nudge once per visit
    setTimeout(function () { if (panel.hidden) { tip.hidden = false; store('pamaChatTipShown', '1'); setTimeout(function () { tip.hidden = true; }, 7000); } }, 6000);
  }
})();
