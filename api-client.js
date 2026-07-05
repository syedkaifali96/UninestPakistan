(function() {
  const API_BASE = '';

  function objectFromForm(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    return data;
  }

  async function submit(endpoint, data) {
    const token = localStorage.getItem('uninest_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.ok === false) {
      throw new Error(json.message || 'Request failed');
    }
    if (endpoint === '/api/bookings') {
      try {
        const rows = JSON.parse(localStorage.getItem('uninest-bookings') || '[]');
        rows.unshift(Object.assign({}, data, { id: json.id, booking_code: json.booking_code, status: 'pending', created_at: new Date().toISOString() }));
        localStorage.setItem('uninest-bookings', JSON.stringify(rows.slice(0, 50)));
      } catch {}
    }
    return json;
  }

  async function submitForm(form, endpoint, extraData) {
    const payload = Object.assign(objectFromForm(form), extraData || {});
    return submit(endpoint, payload);
  }

  window.UniNestDB = { submit, submitForm, objectFromForm };
})();
