/* PAMA website forms → Google Apps Script → Google Sheet.
   Paste the Apps Script web app URL below after deploying (Deploy → Web app). */
(function () {
  var ENDPOINT = window.PAMA_FORMS_ENDPOINT || 'https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec';
  var MAX_FILE = 5 * 1024 * 1024;

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
        status(form, 'Please complete the highlighted fields.', 'error');
        return;
      }
      if (!ENDPOINT) {
        status(form, 'Online submissions are being set up. In the meantime, please email <a href="mailto:info@pan-american.org">info@pan-american.org</a>.', 'error');
        return;
      }
      var data = collect(form);
      var fileInput = form.querySelector('input[type=file]');
      if (fileInput && fileInput.files[0]) {
        var f = fileInput.files[0];
        if (f.size > MAX_FILE) { status(form, 'Your file is larger than 5 MB. Please upload a smaller PDF or Word document.', 'error'); return; }
        data.resume_file = { name: f.name, type: f.type, data: await readFile(f) };
      }
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…';
      status(form, '', '');
      try {
        var res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
        var out = await res.json();
        if (!out.ok) throw new Error(out.error || 'Submission failed');
        if (window.pamaTrack) window.pamaTrack('form_submit', { form_type: form.dataset.form, page_path: location.pathname });
        form.reset();
        form.classList.remove('show-errors');
        status(form, '<strong>Thank you!</strong> We received your submission and sent a confirmation to your email.', 'success');
      } catch (err) {
        status(form, 'Sorry, something went wrong. Please try again, or email <a href="mailto:info@pan-american.org">info@pan-american.org</a>.', 'error');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  });
})();
