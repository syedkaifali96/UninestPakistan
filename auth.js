/* ============================================
   UniNest Advanced Auth System
   Backend JWT + SQLite when running with npm start.
   Safe localStorage fallback when opened with file://.
   ============================================ */
(function(){
    const USERS_KEY = 'uninest_users';
    const SESSION_KEY = 'uninest_session';
    const TOKEN_KEY = 'uninest_token';
    const API_BASE = location.protocol === 'file:' ? null : '';

    const qs = (sel, root=document) => root.querySelector(sel);

    function getUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
    function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    function getSession(){
        try {
            const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            if (session && session.expiresAt && Date.now() > session.expiresAt) { clearSession(); return null; }
            return session;
        } catch { return null; }
    }
    function setSession(user, token){
        const cleanUser = Object.assign({}, user || {});
        cleanUser.expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem(SESSION_KEY, JSON.stringify(cleanUser));
        if (token) localStorage.setItem(TOKEN_KEY, token);
    }
    function clearSession(){ localStorage.removeItem(SESSION_KEY); localStorage.removeItem(TOKEN_KEY); }
    function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
    async function api(path, options={}){
        if (!API_BASE) throw new Error('Backend is not running. Open website with npm start / localhost for database login.');
        const headers = Object.assign({ 'Content-Type':'application/json' }, options.headers || {});
        const token = getToken();
        if (token) headers.Authorization = 'Bearer ' + token;
        const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) throw new Error(json.message || 'Request failed');
        return json;
    }
    async function login(email, password){
        email = String(email || '').trim().toLowerCase();
        if (!email || !password) return { ok:false, msg:'Email aur password required hain.' };
        if (API_BASE) {
            try {
                const res = await api('/api/login', { method:'POST', body: JSON.stringify({ email, password }) });
                setSession(res.user, res.token);
                await syncLocalFavoritesToServer().catch(()=>{});
                return { ok:true, user:res.user };
            } catch(err) { return { ok:false, msg:err.message || 'Login failed' }; }
        }
        const user = getUsers().find(u => String(u.email).toLowerCase() === email && u.password === password);
        if (!user) return { ok:false, msg:'Invalid email ya password.' };
        setSession(user);
        return { ok:true, user };
    }
    async function register(data){
        const name = String(data.name || data.fullname || '').trim();
        const email = String(data.email || '').trim().toLowerCase();
        const password = String(data.password || '');
        const confirmPassword = String(data.confirmPassword || data.confirm_password || data['confirm-password'] || password);
        if (!name || !email || !password) return { ok:false, msg:'Name, email aur password required hain.' };
        if (password !== confirmPassword) return { ok:false, msg:'Passwords match nahi kar rahe.' };
        if (password.length < 6) return { ok:false, msg:'Password kam az kam 6 characters ka hona chahiye.' };
        if (API_BASE) {
            try {
                await api('/api/register', { method:'POST', body: JSON.stringify({ name, email, phone:data.phone || '', university:data.university || '', password }) });
                const loginRes = await login(email, password);
                if (loginRes.ok) return { ok:true, user:loginRes.user, msg:'Account created and logged in.' };
                return { ok:true, msg:'Account created. Ab login karein.' };
            } catch(err) { return { ok:false, msg:err.message || 'Registration failed' }; }
        }
        const users = getUsers();
        if (users.some(u => String(u.email).toLowerCase() === email)) return { ok:false, msg:'Yeh email already registered hai.' };
        const user = { id:Date.now(), name, email, phone:data.phone || '', university:data.university || '', password, role:'student', createdAt:new Date().toISOString(), favorites:[], recentlyViewed:[] };
        users.push(user); saveUsers(users); setSession(user);
        return { ok:true, user };
    }
    async function updateUser(updates){
        const user = getSession(); if (!user) return { ok:false, msg:'Login required' };
        const payload = { name:updates.name || user.name, phone:updates.phone || '', university:updates.university || '' };
        if (API_BASE && getToken()) {
            try { const res = await api('/api/me', { method:'PUT', body: JSON.stringify(payload) }); setSession(res.user, getToken()); return { ok:true, user:res.user }; }
            catch(err) { return { ok:false, msg:err.message }; }
        }
        const updated = Object.assign({}, user, payload);
        setSession(updated);
        const users = getUsers().map(u => u.email === updated.email ? Object.assign({}, u, payload) : u);
        saveUsers(users);
        return { ok:true, user:updated };
    }
    async function me(){
        const user = getSession(); if (!user) return null;
        if (API_BASE && getToken()) {
            try { const res = await api('/api/me'); setSession(res.user, getToken()); return res.user; } catch { return user; }
        }
        return user;
    }
    function logout(){ clearSession(); window.location.href = 'login.html'; }
    function isLoggedIn(){ return !!getSession(); }
    function getCurrentUser(){ return getSession(); }
    function updateNavForAuth(){
        const user = getSession();
        const allNavButtons = document.querySelectorAll('.nav-buttons');
        allNavButtons.forEach(function(navButtons){
            const isMobile = navButtons.classList.contains('nav-buttons-mobile');
            if (user) {
                const firstName = (user.name || 'Student').split(' ')[0];
                navButtons.innerHTML = isMobile
                    ? `<a href="dashboard.html" class="btn btn-primary btn-full">👤 ${firstName} Dashboard</a><button type="button" class="logout-btn btn btn-outline btn-full">Logout</button>`
                    : `<a href="dashboard.html" class="nav-user btn btn-ghost btn-sm">👤 ${firstName}</a><button type="button" class="logout-btn btn btn-outline btn-sm">Logout</button>`;
            } else {
                navButtons.innerHTML = isMobile
                    ? '<a href="login.html" class="btn btn-outline btn-full">Login</a><a href="login.html" class="btn btn-primary btn-full">Register</a>'
                    : '<a href="login.html" class="btn btn-ghost btn-sm">Login</a><a href="login.html" class="btn btn-primary btn-sm">Register</a>';
            }
        });
    }

    function normalizeBranding(){
        document.querySelectorAll('.logo').forEach(function(logo){
            if (!logo.querySelector('.logo-img')) logo.insertAdjacentHTML('afterbegin','<img src="images/logo.png" class="logo-img" alt="UniNest Pakistan" loading="lazy">');
            if (!logo.querySelector('.logo-text')) logo.insertAdjacentHTML('beforeend','<span class="logo-text">UniNest</span>');
        });
    }

    function isAuthPage(){
        const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        return ['login.html','forgot-password.html'].includes(page) || document.body.classList.contains('auth-only-page');
    }

    function normalizeFooter(){
        if (isAuthPage()) {
            document.querySelectorAll('footer.footer, .footer').forEach(function(el){ el.remove(); });
            return;
        }
        let footer = document.querySelector('footer.footer');
        if (!footer) { footer = document.createElement('footer'); footer.className = 'footer'; document.body.appendChild(footer); }
        footer.innerHTML = `
        <div class="container">
            <div class="footer-grid polished-footer-grid">
                <div class="footer-brand">
                    <a href="index.html" class="logo footer-logo"><img src="images/logo.png" class="logo-img" alt="UniNest Pakistan" loading="lazy"><span class="logo-text">UniNest</span></a>
                    <p>Pakistan's trusted student housing platform for verified hostels, co-living spaces and private rooms.</p>
                    <div class="footer-social" aria-label="Social links">
                        <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 8.5V6.8c0-.7.2-1.1 1.2-1.1H17V2.6c-.9-.1-1.7-.2-2.6-.2-2.7 0-4.5 1.6-4.5 4.7v1.4H7v3.5h2.9V22H14V12h2.8l.4-3.5H14z"/></svg></a>
                        <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
                        <a href="#" aria-label="Twitter X"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 6.4 22H3.2l7.3-8.4L2.8 2h6.4l4.5 6.7L18.9 2zm-1.1 17.9h1.7L8.3 4H6.5l11.3 15.9z"/></svg></a>
                        <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.9 8.8H3.2V21h3.7V8.8zM5.1 3a2.1 2.1 0 100 4.2A2.1 2.1 0 005.1 3zM21 14.2c0-3.3-1.8-5.7-4.6-5.7-1.7 0-2.8.9-3.3 1.8h-.1V8.8H9.5V21h3.7v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.9 2 3.3v6H21v-6.8z"/></svg></a>
                    </div>
                </div>
                <div class="footer-column"><h4>Quick Links</h4><ul class="footer-links"><li><a href="index.html">Home</a></li><li><a href="listings.html">Listings</a></li><li><a href="roommate.html">Roommate Finder</a></li><li><a href="reviews.html">Reviews</a></li><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul></div>
                <div class="footer-column"><h4>Cities</h4><ul class="footer-links"><li><a href="city-karachi.html">Karachi</a></li><li><a href="city-lahore.html">Lahore</a></li><li><a href="city-islamabad.html">Islamabad</a></li></ul></div>
                <div class="footer-column"><h4>Contact</h4><ul class="footer-contact"><li><span class="footer-ico">✉</span> support@uninest.pk</li><li><span class="footer-ico">☎</span> +92 300 1234567</li><li><span class="footer-ico">📍</span> Karachi, Lahore, Islamabad</li></ul></div>
            </div>
            <div class="footer-bottom"><p>© 2026 UniNest Pakistan. All rights reserved.</p><p>Made with <span>♥</span> for Pakistani Students</p></div>
        </div>`;
    }
    function readFavs(){ try { return JSON.parse(localStorage.getItem('uninest-favs') || '[]'); } catch { return []; } }
    async function addFavoriteObject(item){
        if (typeof item === 'string') item = { id:item, title:item, href:'listings.html' };
        item = item || {};
        const favs = readFavs();
        const id = String(item.id || item.title || Date.now());
        if (!favs.some(f => String(f.id) === id)) { favs.push(Object.assign({}, item, { id })); localStorage.setItem('uninest-favs', JSON.stringify(favs)); }
        if (API_BASE && getToken()) await api('/api/favorites', { method:'POST', body: JSON.stringify(item) }).catch(()=>{});
    }
    async function removeFavorite(id){
        id = String(id);
        localStorage.setItem('uninest-favs', JSON.stringify(readFavs().filter(f => String(f.id || f) !== id)));
        if (API_BASE && getToken()) await api('/api/favorites/' + encodeURIComponent(id), { method:'DELETE' }).catch(()=>{});
    }
    async function getFavorites(){
        if (API_BASE && getToken()) {
            try { const res = await api('/api/favorites'); if (Array.isArray(res.rows)) { localStorage.setItem('uninest-favs', JSON.stringify(res.rows)); return res.rows; } } catch {}
        }
        return readFavs();
    }
    async function addRecent(item){
        const key = 'uninest-recent';
        let recent = []; try { recent = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
        const id = String(item.id || item.title || Date.now());
        recent = recent.filter(r => String(r.id) !== id);
        recent.unshift(Object.assign({}, item, { id }));
        recent = recent.slice(0, 12);
        localStorage.setItem(key, JSON.stringify(recent));
        if (API_BASE && getToken()) await api('/api/recent', { method:'POST', body: JSON.stringify(item) }).catch(()=>{});
    }
    async function getRecent(){
        if (API_BASE && getToken()) {
            try { const res = await api('/api/recent'); if (Array.isArray(res.rows)) { localStorage.setItem('uninest-recent', JSON.stringify(res.rows)); return res.rows; } } catch {}
        }
        try { return JSON.parse(localStorage.getItem('uninest-recent') || '[]'); } catch { return []; }
    }
    async function getBookings(){
        if (API_BASE && getToken()) {
            try { const res = await api('/api/bookings/me'); if (Array.isArray(res.rows)) { localStorage.setItem('uninest-bookings', JSON.stringify(res.rows)); return res.rows; } } catch {}
        }
        try { return JSON.parse(localStorage.getItem('uninest-bookings') || '[]'); } catch { return []; }
    }

    async function syncLocalFavoritesToServer(){
        if (!API_BASE || !getToken()) return;
        for (const f of readFavs()) await api('/api/favorites', { method:'POST', body: JSON.stringify(f) }).catch(()=>{});
    }


    function isPublicPage(){
        const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        return ['login.html','forgot-password.html','privacy.html','terms.html','404.html'].includes(page);
    }
    function requireLoginForWebsite(){
        if (isPublicPage()) return;
        if (!isLoggedIn()) {
            const next = encodeURIComponent((window.location.pathname.split('/').pop() || 'index.html') + window.location.search + window.location.hash);
            window.location.replace('login.html?next=' + next);
        }
    }

    window.Auth = { login, register, logout, isLoggedIn, getCurrentUser, updateUser, updateNavForAuth, me, api, addFavoriteObject, addFavorite:addFavoriteObject, removeFavorite, getFavorites, addRecent, addRecentlyViewed:addRecent, getRecent, getBookings, requireLoginForWebsite };

    document.addEventListener('DOMContentLoaded', function(){
        requireLoginForWebsite();
        normalizeBranding();
        normalizeFooter();
        updateNavForAuth();
        document.addEventListener('click', function(e){ const b = e.target.closest('.logout-btn, #logout-btn'); if (b) { e.preventDefault(); logout(); } });

        const loginForm = qs('#login-form');
        if (loginForm) {
            if (isLoggedIn()) { const next = new URLSearchParams(location.search).get('next') || 'index.html'; window.location.href = next; }
            loginForm.addEventListener('submit', async function(e){
                e.preventDefault(); e.stopImmediatePropagation();
                const btn = qs('button[type="submit"]', loginForm), err = qs('.auth-error', loginForm), ok = qs('.success-message', loginForm);
                if (err) err.style.display='none'; if (ok) ok.style.display='none';
                const old = btn ? btn.textContent : ''; if (btn) { btn.disabled=true; btn.textContent='Logging in...'; }
                const result = await login(qs('[name="email"]', loginForm).value, qs('[name="password"]', loginForm).value);
                if (btn) { btn.disabled=false; btn.textContent=old || 'Login'; }
                if (!result.ok) { if (err) { err.textContent=result.msg; err.style.display='block'; } else alert(result.msg); return; }
                if (ok) { ok.textContent='Login successful! Redirecting...'; ok.style.display='block'; ok.classList.add('show'); }
                setTimeout(()=> { const next = new URLSearchParams(location.search).get('next') || 'index.html'; location.href = next; }, 500);
            }, true);
        }
        const regForm = qs('#register-form');
        if (regForm) {
            regForm.addEventListener('submit', async function(e){
                e.preventDefault(); e.stopImmediatePropagation();
                const btn = qs('button[type="submit"]', regForm), err = qs('.auth-error', regForm), ok = qs('.success-message', regForm);
                if (err) err.style.display='none'; if (ok) ok.style.display='none';
                const old = btn ? btn.textContent : ''; if (btn) { btn.disabled=true; btn.textContent='Creating account...'; }
                const data = Object.fromEntries(new FormData(regForm).entries());
                data.name = data.fullname || data.name;
                data.confirmPassword = data['confirm-password'] || data.confirmPassword;
                const result = await register(data);
                if (btn) { btn.disabled=false; btn.textContent=old || 'Create Account'; }
                if (!result.ok) { if (err) { err.textContent=result.msg; err.style.display='block'; } else alert(result.msg); return; }
                if (ok) { ok.textContent='Account created! Redirecting to dashboard...'; ok.style.display='block'; ok.classList.add('show'); }
                setTimeout(()=> { const next = new URLSearchParams(location.search).get('next') || 'index.html'; location.href = next; }, 700);
            }, true);
        }
    });
})();
