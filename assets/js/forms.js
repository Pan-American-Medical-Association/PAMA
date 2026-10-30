/* PAMA website forms → Google Apps Script → Google Sheet.
   Paste the Apps Script web app URL below after deploying (Deploy → Web app). */
(function () {
  var ENDPOINT = window.PAMA_FORMS_ENDPOINT || 'https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec';
  var MAX_FILE = 5 * 1024 * 1024;

  // Messages in the page's language (Spanish and Portuguese pages set <html lang>).
  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  var MSG = {
    "Please complete the highlighted fields.": {
      "es": "Por favor, complete los campos resaltados.",
      "pt": "Por favor, preencha os campos destacados.",
      "fr": "Veuillez remplir les champs en surbrillance.",
      "it": "Compili i campi evidenziati.",
      "zh": "请填写突出显示的字段。"
    },
    "Online submissions are being set up. In the meantime, please email <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.": {
      "es": "Los envíos en línea se están configurando. Mientras tanto, escriba a <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "pt": "Os envios on-line estão sendo configurados. Enquanto isso, escreva para <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "fr": "Les envois en ligne sont en cours de configuration. En attendant, écrivez à <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "it": "Gli invii online sono in fase di configurazione. Nel frattempo, scriva a <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "zh": "在线提交功能正在设置中。在此期间，请发送电子邮件至 <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>。"
    },
    "Your file is larger than 5 MB. Please upload a smaller PDF or Word document.": {
      "es": "Su archivo supera los 5 MB. Suba un documento PDF o Word más pequeño.",
      "pt": "Seu arquivo tem mais de 5 MB. Envie um documento PDF ou Word menor.",
      "fr": "Votre fichier dépasse 5 Mo. Veuillez téléverser un document PDF ou Word plus petit.",
      "it": "Il file supera i 5 MB. Carichi un documento PDF o Word più piccolo.",
      "zh": "您的文件超过 5 MB。请上传较小的 PDF 或 Word 文档。"
    },
    "<strong>Thank you!</strong> We received your submission and sent a confirmation to your email.": {
      "es": "<strong>¡Gracias!</strong> Recibimos su formulario y enviamos una confirmación a su correo electrónico.",
      "pt": "<strong>Obrigado!</strong> Recebemos seu envio e mandamos uma confirmação para o seu e-mail.",
      "fr": "<strong>Merci !</strong> Nous avons bien reçu votre envoi et vous avons adressé une confirmation par e-mail.",
      "it": "<strong>Grazie!</strong> Abbiamo ricevuto il Suo invio e Le abbiamo inviato una conferma via e-mail.",
      "zh": "<strong>谢谢！</strong>我们已收到您的提交，并已向您的电子邮箱发送确认信息。"
    },
    "Sorry, something went wrong. Please try again, or email <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.": {
      "es": "Lo sentimos, algo salió mal. Inténtelo de nuevo o escriba a <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "pt": "Desculpe, algo deu errado. Tente novamente ou escreva para <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "fr": "Désolé, une erreur s’est produite. Veuillez réessayer ou écrire à <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "it": "Siamo spiacenti, si è verificato un errore. Riprovi oppure scriva a <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>.",
      "zh": "抱歉，出现了问题。请重试，或发送电子邮件至 <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>。"
    }
  };
  function t(s) { return (MSG[s] && MSG[s][LANG]) || s; }

  function status(form, msg, kind) {
    var el = form.querySelector('.form-status');
    el.className = 'form-status ' + (kind || '');
    el.innerHTML = msg;
    if (kind) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function collect(form) {
    var data = { form_type: form.dataset.form, page: location.pathname };
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'file' || el.type === 'submit') return;
      if (el.type === 'checkbox') {
        var group = form.querySelectorAll('input[type=checkbox][name="' + el.name + '"]');
        if (group.length > 1) {
          if (el.checked) (data[el.name] = data[el.name] || []).push(el.value);
          else data[el.name] = data[el.name] || [];
        } else data[el.name] = el.checked ? 'Yes' : '';
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else data[el.name] = el.value.trim();
    });
    return data;
  }
  function checkGroups(form) {
    var ok = true;
    form.querySelectorAll('fieldset[data-required="true"]').forEach(function (fs) {
      var any = fs.querySelector('input:checked');
      fs.classList.toggle('invalid', !any);
      if (!any) ok = false;
    });
    return ok;
  }

  document.querySelectorAll('form.pama-form').forEach(function (form) {
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var groupsOk = checkGroups(form);
      if (!form.checkValidity() || !groupsOk) {
        form.classList.add('show-errors');
        var first = form.querySelector(':invalid, fieldset.invalid input');
        if (first) first.focus();
        status(form, t("Please complete the highlighted fields."), 'error');
        return;
      }
      if (!ENDPOINT) {
        status(form, t("Online submissions are being set up. In the meantime, please email <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>."), 'error');
        return;
      }
      var data = collect(form);
      var fileInput = form.querySelector('input[type=file]');
      if (fileInput && fileInput.files[0]) {
        var f = fileInput.files[0];
        if (f.size > MAX_FILE) { status(form, t("Your file is larger than 5 MB. Please upload a smaller PDF or Word document."), 'error'); return; }
        data.resume_file = { name: f.name, type: f.type, data: await readFile(f) };
      }
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; var label = btn.textContent; btn.textContent = ({es: 'Enviando…', pt: 'Enviando…', fr: 'Envoi…', it: 'Invio…', zh: '正在发送…'})[LANG] || 'Sending…';
      status(form, '', '');
      try {
        var res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
        var out = await res.json();
        if (!out.ok) throw new Error(out.error || 'Submission failed');
        if (window.pamaTrack) window.pamaTrack('form_submit', { form_type: form.dataset.form, page_path: location.pathname });
        form.reset();
        form.classList.remove('show-errors');
        status(form, t("<strong>Thank you!</strong> We received your submission and sent a confirmation to your email."), 'success');
      } catch (err) {
        status(form, t("Sorry, something went wrong. Please try again, or email <a href=\"mailto:info@pan-american.org\">info@pan-american.org</a>."), 'error');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  });
})();
