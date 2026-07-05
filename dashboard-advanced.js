(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readJSON = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  function normalizeItem(item, i){
    if (typeof item === 'string') return { id:item, title:item, href:'listings.html', img:'images/property-1.jpg', price:'', location:'' };
    item = item || {};
    return { id:String(item.id || item.property_key || item.title || i || Date.now()), title:item.title || 'Property', price:item.price || '', location:item.location || '', img:item.img || item.image || 'images/property-1.jpg', href:item.href || item.url || 'listings.html' };
  }
  async function getFavs(){
    if (window.Auth && typeof Auth.getFavorites === 'function') { try { return (await Auth.getFavorites()).map(normalizeItem); } catch(e){} }
    return readJSON('uninest-favs').map(normalizeItem);
  }
  async function getRecent(){
    if (window.Auth && typeof Auth.getRecent === 'function') { try { return (await Auth.getRecent()).map(normalizeItem); } catch(e){} }
    return readJSON('uninest-recent').map(normalizeItem);
  }
  async function getBookings(){
    if (window.Auth && typeof Auth.getBookings === 'function') { try { return await Auth.getBookings(); } catch(e){} }
    return readJSON('uninest-bookings');
  }
  function setText(id, txt){ const el=$(id); if(el) el.textContent=txt; }
  function setValue(id, val){ const el=$(id); if(el) el.value=val || ''; }
  function toast(msg){ if (typeof window.showToast === 'function') showToast(msg,'success'); else alert(msg); }
  function card(item, type){
    return `<div class="property-card dashboard-property-card" data-id="${esc(item.id)}"><div class="property-image"><img src="${esc(item.img)}" alt="${esc(item.title)}" loading="lazy">${type==='fav'?`<button type="button" class="property-fav fav-active is-favorite dash-remove-fav" data-id="${esc(item.id)}" aria-label="Remove favorite">♥</button>`:''}</div><div class="property-info"><div class="property-price">${esc(item.price)}</div><h3 class="property-title">${esc(item.title)}</h3><div class="property-location">${esc(item.location)}</div><a href="${esc(item.href)}" class="btn btn-primary property-btn">View Details</a></div></div>`;
  }
  function bookingItem(b){
    const title = b.property_title || b.title || 'Booked Property';
    const total = b.total ? 'PKR ' + Number(b.total).toLocaleString() : '';
    return `<div class="booking-item"><div><div class="booking-code">${esc(b.booking_code || 'Pending Code')}</div><h5 style="margin:6px 0 0">${esc(title)}</h5><div class="booking-meta">${esc(b.room_type || '')} ${b.checkin_date ? '• Move-in: '+esc(b.checkin_date) : ''}</div><div class="booking-meta">${esc(total)} ${b.payment_method ? '• '+esc(b.payment_method) : ''}</div></div><span class="booking-status">${esc(b.status || 'pending')}</span></div>`;
  }
  function empty(kind){ return kind==='booking' ? `<div class="empty-state"><span class="emoji">📅</span><p>Abhi tak koi booking nahi hui.</p><a href="listings.html" class="btn btn-primary">Book a Property</a></div>` : kind==='fav' ? `<div class="empty-state"><span class="emoji">❤️</span><p>Abhi tak koi property save nahi ki.</p><a href="listings.html" class="btn btn-primary">Browse Listings</a></div>` : `<div class="empty-state"><span class="emoji">👁️</span><p>Abhi tak koi property view nahi ki.</p><a href="listings.html" class="btn btn-primary">Explore Now</a></div>`; }
  async function render(){
    const user = (window.Auth && Auth.getCurrentUser && Auth.getCurrentUser()) || {};
    const favs = await getFavs(); const recent = await getRecent(); const bookings = await getBookings();
    setText('stat-favs', favs.length); setText('stat-recent', recent.length); setText('stat-bookings', bookings.length); setText('dash-name', user.name || 'Student'); setText('dash-email', user.email || ''); setText('dash-avatar', (user.name || 'S').trim().charAt(0).toUpperCase());
    setText('welcome-msg', `Welcome back, ${(user.name || 'Student').split(' ')[0]}! Aap apni saved properties, recently viewed aur profile yahan manage kar sakte hain.`);
    setValue('pf-name', user.name || ''); setValue('pf-email', user.email || ''); setValue('pf-phone', user.phone || ''); setValue('pf-uni', user.university || '');
    const fg=$('dash-favs-grid'); if(fg) fg.innerHTML = favs.length ? favs.map(x=>card(x,'fav')).join('') : empty('fav');
    const rg=$('dash-recent-grid'); if(rg) rg.innerHTML = recent.length ? recent.map(x=>card(x,'recent')).join('') : empty('recent');
    const bl=$('dash-bookings-list'); if(bl) bl.innerHTML = bookings.length ? bookings.map(bookingItem).join('') : empty('booking');
  }
  function showPanel(name){
    document.querySelectorAll('.dash-nav a[data-panel]').forEach(a => a.classList.toggle('active', a.dataset.panel === name));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-'+name));
    const hash = name === 'overview' ? '' : '#'+name; if(location.hash !== hash) history.replaceState(null,'', location.pathname + hash);
    render();
  }
  document.addEventListener('DOMContentLoaded', async function(){
    if (!window.Auth || !Auth.isLoggedIn || !Auth.isLoggedIn()) { location.href='login.html'; return; }
    if (Auth.me) { try { await Auth.me(); } catch(e){} }
    document.querySelectorAll('.dash-nav a[data-panel]').forEach(a => a.addEventListener('click', function(e){ e.preventDefault(); showPanel(this.dataset.panel); }));
    document.body.addEventListener('click', async function(e){ const remove=e.target.closest('.dash-remove-fav'); if(remove){ e.preventDefault(); if(Auth.removeFavorite) await Auth.removeFavorite(remove.dataset.id); await render(); toast('Favorite removed'); } });
    const form=$('profile-form');
    if(form) form.addEventListener('submit', async function(e){ e.preventDefault(); const btn=form.querySelector('button[type="submit"]'); const old=btn?btn.textContent:''; if(btn){btn.disabled=true; btn.textContent='Saving...';} const res=Auth.updateUser?await Auth.updateUser({name:$('pf-name')?.value, phone:$('pf-phone')?.value, university:$('pf-uni')?.value}):{ok:false,msg:'Auth missing'}; if(btn){btn.disabled=false; btn.textContent=old||'Save Changes';} if(!res.ok){ alert(res.msg || 'Profile update failed'); return; } const ok=$('profile-success'); if(ok) ok.style.display='block'; if(Auth.updateNavForAuth) Auth.updateNavForAuth(); await render(); toast('Profile updated'); });
    const initial=(location.hash || '#overview').replace('#',''); showPanel(['favorites','recent','bookings','profile'].includes(initial)?initial:'overview');
    window.addEventListener('storage', render); window.addEventListener('uninest:favorites-updated', render);
  });
})();
