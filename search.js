/* ============================================
   UniNest Search & Filter System
   ============================================ */

const Search = (function() {
    function getPropertyPage(p) { return (p && p.page) ? p.page : ('hotel-details.html?id=' + (p && p.id ? p.id : 1)); }
    let allProperties = [];

    async function init() {
        allProperties = await API.getProperties() || [];
    }

    function filter({ city = 'all', type = 'all', budget = 'all', gender = 'all', query = '', university = 'all' }) {
        return allProperties.filter(p => {
            if (city !== 'all' && p.city !== city) return false;
            if (type !== 'all' && p.type !== type) return false;
            if (gender !== 'all' && p.gender !== 'any' && p.gender !== gender) return false;
            if (budget !== 'all') {
                const [min, max] = budget.split('-').map(Number);
                if (max && p.price > max) return false;
                if (!max && p.price < min) return false;
            }
            if (query) {
                const q = query.toLowerCase();
                if (!p.title.toLowerCase().includes(q) && !p.area.toLowerCase().includes(q) && !p.city.includes(q)) return false;
            }
            if (university && university !== 'all') {
                const haystack = [p.title, p.area, p.city, p.desc, ...(p.nearby || []), ...(p.amenities || [])].join(' ').toLowerCase();
                const uni = university.toLowerCase();
                const universityRules = {
                    ned: { terms: ['ned'], fallbackCity: 'karachi' },
                    lums: { terms: ['lums'], fallbackCity: 'lahore' },
                    nust: { terms: ['nust'], fallbackCity: 'islamabad' },
                    fast: { terms: ['fast', 'nuces'], fallbackCity: 'all' }
                };
                const rule = universityRules[uni] || { terms: [uni], fallbackCity: 'all' };
                const directMatch = rule.terms.some(term => haystack.includes(term));
                if (!directMatch) {
                    if (rule.fallbackCity && rule.fallbackCity !== 'all') {
                        if (p.city !== rule.fallbackCity) return false;
                    } else if (uni !== 'fast') {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    function renderCard(p, isFav = false) {
        let localFavs = [];
        try { localFavs = JSON.parse(localStorage.getItem('uninest-favs') || '[]'); } catch (e) { localFavs = []; }
        const rawFavs = localFavs;
        const saved = Array.isArray(rawFavs) && rawFavs.some(f => f === p.id || f === String(p.id) || (f && (f.id === p.id || f.id === String(p.id))));
        const stars = '⭐'.repeat(Math.floor(p.rating));
        const amenHtml = p.amenities.slice(0, 3).map(a => `<span class="amenity">${a}</span>`).join('');
        const typeClass = { hostel: 'badge-hostel', coliving: 'badge-coliving', private: 'badge-private' }[p.type] || '';
        const typeLabel = { hostel: 'Hostel', coliving: 'Co-Living', private: 'Private' }[p.type] || p.type;

        return `
        <div class="property-card" data-id="${p.id}" data-type="${p.type}" data-city="${p.city}" data-price="${p.price}" data-rating="${p.rating || 0}">
            <div class="property-image">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
                <span class="property-badge ${typeClass}">${typeLabel}</span>
                <button class="property-fav ${saved ? 'fav-active' : ''}" data-pid="${p.id}" title="${saved ? 'Remove from favorites' : 'Save'}" aria-label="${saved ? 'Remove from favorites' : 'Save to favorites'}">
                    <svg viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </button>
            </div>
            <div class="property-info">
                <div class="property-price">PKR ${p.price.toLocaleString()}<span>/month</span></div>
                <h3 class="property-title">${p.title}</h3>
                <div class="property-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${p.area}, ${p.city.charAt(0).toUpperCase() + p.city.slice(1)}
                </div>
                <div class="property-rating">${stars} (${p.rating})</div>
                <div class="property-amenities">${amenHtml}</div>
                <a class="property-btn" href="${getPropertyPage(p)}" data-pid="${p.id}">View Details</a>
            </div>
        </div>`;
    }

    function renderGrid(container, properties) {
        if (!container) return;
        if (properties.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);grid-column:1/-1"><p style="font-size:1.1rem">🏠 Koi property nahi mili. Filters change karein.</p></div>';
            return;
        }
        container.innerHTML = properties.map(p => renderCard(p)).join('');
        attachFavListeners(container);
        attachViewListeners(container);
    }

    function attachFavListeners(container) {
        container.querySelectorAll('.property-fav').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const pid = parseInt(this.dataset.pid);
                const isActive = this.classList.contains('fav-active');
                if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
                    if (isActive) Auth.removeFavorite(pid);
                    else Auth.addFavorite(pid);
                } else {
                    // fallback localStorage
                    let favs = JSON.parse(localStorage.getItem('uninest-favs') || '[]');
                    if (isActive) favs = favs.filter(f => f !== pid && f !== String(pid) && !(f && (f.id === pid || f.id === String(pid))));
                    else if (!favs.some(f => f === pid || f === String(pid) || (f && (f.id === pid || f.id === String(pid))))) favs.push(pid);
                    localStorage.setItem('uninest-favs', JSON.stringify(favs));
                }
                this.classList.toggle('fav-active');
                window.dispatchEvent(new CustomEvent('uninest:favorites-updated'));
                const svg = this.querySelector('svg');
                if (svg) svg.setAttribute('fill', this.classList.contains('fav-active') ? 'currentColor' : 'none');
                if (typeof showToast !== 'undefined') {
                    showToast(isActive ? '💔 Removed from favorites' : '❤️ Saved to favorites!', isActive ? 'warning' : 'success');
                }
            });
        });
    }

    function attachViewListeners(container) {
        container.querySelectorAll('.property-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const pid = parseInt(this.dataset.pid || this.closest('.property-card')?.dataset.id || '1');
                if (typeof Auth !== 'undefined') Auth.addRecentlyViewed(pid);
                window.location.href = btn.getAttribute('href') || ('hotel-details.html?id=' + pid);
            });
        });
    }

    function openModal(p) {
        const modal = document.getElementById('property-modal');
        if (!modal) return;
        modal.querySelector('#modal-img').src = p.image;
        modal.querySelector('#modal-title').textContent = p.title;
        modal.querySelector('#modal-location').textContent = `${p.area}, ${p.city.charAt(0).toUpperCase() + p.city.slice(1)}`;
        modal.querySelector('#modal-price').innerHTML = `PKR ${p.price.toLocaleString()}<span>/month</span>`;
        modal.querySelector('#modal-desc').textContent = p.desc;
        modal.querySelector('#modal-amenities').innerHTML = p.amenities.map(a => `<span class="modal-amenity">${a}</span>`).join('');
        const wa = modal.querySelector('#modal-whatsapp');
        if (wa) wa.href = `https://wa.me/${p.phone.replace(/\D/g,'')}?text=Hi! I'm interested in ${p.title} on UniNest Pakistan.`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    return { init, filter, renderGrid, renderCard, allProperties: () => allProperties };
})();
