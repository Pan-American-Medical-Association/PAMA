/* Ask PAMA — home-page assistant. Talks to the Apps Script endpoint (Chat.gs). */
(function () {
  var box = document.querySelector('[data-chat]');
  if (!box) return;
  var ENDPOINT = window.PAMA_FORMS_ENDPOINT || 'https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec';
  var lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var MSG = {
    en: { sources: 'Sources', error: 'Sorry, the assistant could not answer right now. Please try again in a moment.', setup: 'The assistant is almost ready. Please check back soon, or email info@pan-american.org.', thinking: 'Searching our sources…', page: 'page' },
    es: { sources: 'Fuentes', error: 'Lo sentimos, el asistente no pudo responder ahora. Inténtelo de nuevo en un momento.', setup: 'El asistente está casi listo. Vuelva pronto o escriba a info@pan-american.org.', thinking: 'Buscando en nuestras fuentes…', page: 'página' },
    pt: { sources: 'Fontes', error: 'Desculpe, o assistente não conseguiu responder agora. Tente novamente em instantes.', setup: 'O assistente está quase pronto. Volte em breve ou escreva para info@pan-american.org.', thinking: 'Pesquisando nossas fontes…', page: 'página' },
    fr: { sources: 'Sources', error: 'Désolé, l’assistant n’a pas pu répondre. Veuillez réessayer dans un instant.', setup: 'L’assistant est presque prêt. Revenez bientôt ou écrivez à info@pan-american.org.', thinking: 'Recherche dans nos sources…', page: 'page' },
    it: { sources: 'Fonti', error: 'Spiacenti, l’assistente non è riuscito a rispondere. Riprova tra poco.', setup: 'L’assistente è quasi pronto. Torna presto o scrivi a info@pan-american.org.', thinking: 'Ricerca nelle nostre fonti…', page: 'pagina' },
    zh: { sources: '来源', error: '抱歉，助手暂时无法回答，请稍后再试。', setup: '助手即将上线。请稍后再来，或发送邮件至 info@pan-american.org。', thinking: '正在检索资料…', page: '页' },
    ru: { sources: 'Источники', error: 'Извините, ассистент сейчас не может ответить. Попробуйте ещё раз чуть позже.', setup: 'Ассистент почти готов. Загляните позже или напишите на info@pan-american.org.', thinking: 'Ищем в наших источниках…', page: 'стр.' },
    de: { sources: 'Quellen', error: 'Leider konnte der Assistent gerade nicht antworten. Bitte versuchen Sie es gleich noch einmal.', setup: 'Der Assistent ist fast bereit. Schauen Sie bald wieder vorbei oder schreiben Sie an info@pan-american.org.', thinking: 'Durchsuche unsere Quellen…', page: 'S.' },
    pl: { sources: 'Źródła', error: 'Przepraszamy, asystent nie może teraz odpowiedzieć. Spróbuj ponownie za chwilę.', setup: 'Asystent jest prawie gotowy. Zajrzyj wkrótce lub napisz na info@pan-american.org.', thinking: 'Przeszukujemy nasze źródła…', page: 's.' }
  };
  var T = MSG[lang] || MSG.en;
  var log = box.querySelector('[data-chat-log]');
  var form = box.querySelector('[data-chat-form]');
  var input = form.querySelector('textarea');
  var button = form.querySelector('button');
  var chips = box.querySelector('[data-chat-chips]');
  var history = [];
  var busy = false;
  var session = '';
  try { session = sessionStorage.getItem('pamaChatSession') || ''; } catch (e) {}
  if (!session) {
    session = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem('pamaChatSession', session); } catch (e) {}
  }

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

  function ask(q) {
    q = String(q || '').trim();
    if (!q || busy) return;
    busy = true; button.disabled = true;
    add('ask-user', esc(q));
    history.push({ role: 'user', content: q });
    var wait = add('ask-bot ask-typing', '<span></span><span></span><span></span><span class="visually-hidden">' + esc(T.thinking) + '</span>');
    if (window.gtag) { try { window.gtag('event', 'chat_question', { language: lang }); } catch (e) {} }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'chat_ask', session: session, lang: lang, messages: history.slice(-8) }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        wait.remove();
        if (!res || !res.ok) {
          history.pop();
          var msg = res && res.code === 'setup' ? T.setup : (res && res.code === 'rate_limited' && res.error) || T.error;
          add('ask-bot ask-err', '<p>' + esc(msg) + '</p>');
          return;
        }
        var id = 'ans' + history.length;
        history.push({ role: 'assistant', content: res.answer });
        add('ask-bot', render(res.answer, id) + sourcesHtml(res.sources, id));
      })
      .catch(function () { wait.remove(); history.pop(); add('ask-bot ask-err', '<p>' + esc(T.error) + '</p>'); })
      .then(function () { busy = false; button.disabled = false; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value; input.value = ''; input.style.height = '';
    ask(q);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
  });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 144) + 'px'; });
  if (chips) chips.addEventListener('click', function (e) {
    var b = e.target.closest('.ask-chip');
    if (b) { chips.hidden = true; ask(b.textContent); }
  });
})();
