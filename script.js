const PROPERTY_PAGE_MAP = {"1": "hotel-al-noor-boys-hostel.html", "2": "hotel-scholars-co-living-space.html", "3": "hotel-premium-private-suite.html", "4": "hotel-the-scholar-residences.html", "5": "hotel-budget-student-hostel.html", "6": "hotel-safe-haven-girls-hostel.html", "7": "hotel-study-hub-co-living.html", "8": "hotel-unilife-dining-hostel.html", "9": "hotel-luxury-studio-apartment.html"};
function getPropertyPageById(pid){ return PROPERTY_PAGE_MAP[String(pid)] || PROPERTY_PAGE_MAP[pid] || ('hotel-details.html?id=' + pid); }
/* ============================================
   UNINEST PAKISTAN - Complete JavaScript
   Student Housing Platform
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

    // Property details navigation fix: normal hotel-*.html links must open as-is.
    // Only old/broken links like # or hotel-details.html?id=... are converted.
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.property-btn');
        if (!btn) return;

        const rawHref = (btn.getAttribute('href') || '').trim();
        const isRealHotelPage = /^hotel-[a-z0-9-]+\.html(?:[?#].*)?$/i.test(rawHref);
        if (isRealHotelPage) return;

        const pid = btn.dataset.pid
            || btn.closest('.property-card')?.dataset.id
            || (btn.href && new URL(btn.href, window.location.href).searchParams.get('id'))
            || '1';

        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = getPropertyPageById(pid);
    }, true);
    
    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (mobileOverlay) mobileOverlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            if (hamburger) hamburger.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            this.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Mobile dropdown toggle
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('open');
                }
            });
        }
    });
    
    // ==========================================
    // STICKY NAVBAR & SCROLL EFFECTS
    // ==========================================
    const navbar = document.querySelector('.navbar');
    
    function handleScroll() {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    // ==========================================
    // ACTIVE NAVIGATION LINK
    // ==========================================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinkEls = document.querySelectorAll('.nav-links a');
    
    navLinkEls.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
    
    // ==========================================
    // SMOOTH SCROLLING
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ==========================================
    // SCROLL REVEAL ANIMATIONS
    // ==========================================
    const revealElements = document.querySelectorAll('.reveal');
    
    function revealOnScroll() {
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (elementTop < windowHeight - 100) {
                el.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
    
    // ==========================================
    // BACK TO TOP BUTTON
    // ==========================================
    const backToTop = document.querySelector('.back-to-top');
    
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ==========================================
    // STATISTICS COUNTER ANIMATION
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    let countersAnimated = false;
    
    function animateCounters() {
        if (countersAnimated) return;
        
        const statsSection = document.querySelector('.stats-section');
        if (!statsSection) return;
        
        const sectionTop = statsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight - 100) {
            countersAnimated = true;
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                const suffix = stat.getAttribute('data-suffix') || '';
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    stat.textContent = Math.floor(current) + suffix;
                }, 16);
            });
        }
    }
    
    window.addEventListener('scroll', animateCounters);
    animateCounters();
    
    // ==========================================
    // TESTIMONIAL SLIDER
    // ==========================================
    const testimonialTrack = document.querySelector('.testimonial-track');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    
    if (testimonialTrack && testimonialSlides.length > 0) {
        let currentSlide = 0;
        let autoSlideInterval;
        
        function goToSlide(index) {
            if (index < 0) index = testimonialSlides.length - 1;
            if (index >= testimonialSlides.length) index = 0;
            currentSlide = index;
            testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        
        function nextSlide() {
            goToSlide(currentSlide + 1);
        }
        
        function prevSlide() {
            goToSlide(currentSlide - 1);
        }
        
        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 5000);
        }
        
        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }
        
        if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoSlide(); prevSlide(); startAutoSlide(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoSlide(); nextSlide(); startAutoSlide(); });
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopAutoSlide();
                goToSlide(index);
                startAutoSlide();
            });
        });
        
        startAutoSlide();
    }
    
    // ==========================================
    // LISTING FILTERS
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const propertyCards = document.querySelectorAll('.property-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            propertyCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'scaleIn 0.4s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
            
            // Show no results message if needed
            const visibleCards = document.querySelectorAll('.property-card:not(.hidden)');
            const noResults = document.querySelector('.no-results');
            if (noResults) {
                noResults.style.display = visibleCards.length === 0 ? 'block' : 'none';
            }
        });
    });
    
    // ==========================================
    // LISTINGS PAGE FILTERS & SORT
    // ==========================================
    const listingsFilterCity = document.getElementById('filter-city');
    const listingsFilterPrice = document.getElementById('filter-price');
    const listingsFilterType = document.getElementById('filter-type');
    const listingsFilterRating = document.getElementById('filter-rating');
    const listingsSort = document.getElementById('listings-sort');
    
    function filterListings() {
        const cards = document.querySelectorAll('.listings-page .property-card');
        const cityFilter = listingsFilterCity ? listingsFilterCity.value : 'all';
        const priceFilter = listingsFilterPrice ? listingsFilterPrice.value : 'all';
        const typeFilter = listingsFilterType ? listingsFilterType.value : 'all';
        const ratingFilter = listingsFilterRating ? listingsFilterRating.value : 'all';
        
        cards.forEach(card => {
            const city = card.getAttribute('data-city');
            const price = parseInt(card.getAttribute('data-price'));
            const type = card.getAttribute('data-type');
            const rating = parseFloat(card.getAttribute('data-rating'));
            
            let show = true;
            
            if (cityFilter !== 'all' && city !== cityFilter) show = false;
            if (typeFilter !== 'all' && type !== typeFilter) show = false;
            
            if (priceFilter !== 'all') {
                const [min, max] = priceFilter.split('-').map(v => v === 'plus' ? Infinity : parseInt(v));
                if (price < min || (max && price > max)) show = false;
            }
            
            if (ratingFilter !== 'all') {
                const minRating = parseFloat(ratingFilter);
                if (rating < minRating) show = false;
            }
            
            card.classList.toggle('hidden', !show);
        });
        
        const noResults = document.querySelector('.no-results');
        const visibleCards = document.querySelectorAll('.listings-page .property-card:not(.hidden)');
        if (noResults) {
            noResults.style.display = visibleCards.length === 0 ? 'block' : 'none';
        }
    }
    
    function sortListings() {
        const grid = document.querySelector('.listings-page .listings-grid');
        if (!grid || !listingsSort) return;
        
        const cards = Array.from(grid.querySelectorAll('.property-card:not(.hidden)'));
        const sortValue = listingsSort.value;
        
        cards.sort((a, b) => {
            const priceA = parseInt(a.getAttribute('data-price'));
            const priceB = parseInt(b.getAttribute('data-price'));
            const ratingA = parseFloat(a.getAttribute('data-rating'));
            const ratingB = parseFloat(b.getAttribute('data-rating'));
            
            switch(sortValue) {
                case 'price-low': return priceA - priceB;
                case 'price-high': return priceB - priceA;
                case 'rating': return ratingB - ratingA;
                default: return 0;
            }
        });
        
        cards.forEach(card => grid.appendChild(card));
    }
    
    [listingsFilterCity, listingsFilterPrice, listingsFilterType, listingsFilterRating].forEach(el => {
        if (el) el.addEventListener('change', filterListings);
    });
    
    if (listingsSort) listingsSort.addEventListener('change', () => { filterListings(); sortListings(); });
    
    // ==========================================
    // ROOMMATE FILTERS
    // ==========================================
    const roommateFilterCity = document.getElementById('roommate-city');
    const roommateFilterUni = document.getElementById('roommate-uni');
    const roommateFilterGender = document.getElementById('roommate-gender');
    
    function filterRoommates() {
        const cards = document.querySelectorAll('.roommate-card');
        if (!cards.length) return;
        
        const cityFilter = roommateFilterCity ? roommateFilterCity.value : 'all';
        const uniFilter = roommateFilterUni ? roommateFilterUni.value : 'all';
        const genderFilter = roommateFilterGender ? roommateFilterGender.value : 'all';
        
        cards.forEach(card => {
            const city = card.getAttribute('data-city');
            const uni = card.getAttribute('data-uni');
            const gender = card.getAttribute('data-gender');
            
            let show = true;
            if (cityFilter !== 'all' && city !== cityFilter) show = false;
            if (uniFilter !== 'all' && uni !== uniFilter) show = false;
            if (genderFilter !== 'all' && gender !== genderFilter) show = false;
            
            card.style.display = show ? 'block' : 'none';
        });
    }
    
    [roommateFilterCity, roommateFilterUni, roommateFilterGender].forEach(el => {
        if (el) el.addEventListener('change', filterRoommates);
    });
    
    // ==========================================
    // REVIEWS FILTERS
    // ==========================================
    const reviewFilterCity = document.getElementById('review-city');
    const reviewFilterRating = document.getElementById('review-rating');
    
    function filterReviews() {
        const cards = document.querySelectorAll('.review-card');
        if (!cards.length) return;
        
        const cityFilter = reviewFilterCity ? reviewFilterCity.value : 'all';
        const ratingFilter = reviewFilterRating ? reviewFilterRating.value : 'all';
        
        cards.forEach(card => {
            const city = card.getAttribute('data-city');
            const rating = parseInt(card.getAttribute('data-rating'));
            
            let show = true;
            if (cityFilter !== 'all' && city !== cityFilter) show = false;
            if (ratingFilter !== 'all' && rating < parseInt(ratingFilter)) show = false;
            
            card.style.display = show ? 'block' : 'none';
        });
    }
    
    [reviewFilterCity, reviewFilterRating].forEach(el => {
        if (el) el.addEventListener('change', filterReviews);
    });
    
    // (favorites handled later in unified favorites module)
    
    // ==========================================
    // FORM VALIDATION
    // ==========================================
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (!input.value.trim()) {
                isValid = false;
                if (formGroup) formGroup.classList.add('error');
            } else {
                if (formGroup) formGroup.classList.remove('error');
            }
            
            // Email validation
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    isValid = false;
                    if (formGroup) formGroup.classList.add('error');
                }
            }
            
            // Phone validation
            if (input.type === 'tel' && input.value) {
                const phoneRegex = /^[\+]?[0-9\s\-]{10,}$/;
                if (!phoneRegex.test(input.value)) {
                    isValid = false;
                    if (formGroup) formGroup.classList.add('error');
                }
            }
        });
        
        // Password match check
        const password = form.querySelector('input[name="password"]');
        const confirmPassword = form.querySelector('input[name="confirm-password"]');
        if (password && confirmPassword && confirmPassword.value) {
            const cpGroup = confirmPassword.closest('.form-group');
            if (password.value !== confirmPassword.value) {
                isValid = false;
                if (cpGroup) {
                    cpGroup.classList.add('error');
                    const errorEl = cpGroup.querySelector('.form-error');
                    if (errorEl) errorEl.textContent = 'Passwords do not match';
                }
            }
        }
        
        return isValid;
    }
    
    async function saveApiForm(form, endpoint, loadingText) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.oldText = submitBtn.textContent;
            submitBtn.textContent = loadingText || 'Saving...';
        }
        try {
            if (window.UniNestDB) {
                await window.UniNestDB.submitForm(form, endpoint);
            }
            const successMsg = form.querySelector('.success-message');
            if (successMsg) {
                successMsg.classList.add('show');
                setTimeout(() => successMsg.classList.remove('show'), 5000);
            }
            form.reset();
        } catch (error) {
            if (typeof showToast === 'function') showToast(error.message || 'Database request failed.', 'error');
            else alert(error.message || 'Database request failed.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.oldText || 'Submit';
            }
        }
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(this)) saveApiForm(this, '/api/contact', 'Sending...');
        });
    }
    
    // Roommate form
    const roommateForm = document.getElementById('roommate-form');
    if (roommateForm) {
        roommateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(this)) saveApiForm(this, '/api/roommates', 'Saving...');
        });
    }
    
    // Review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(this)) saveApiForm(this, '/api/reviews', 'Saving...');
        });
    }
    
    // ==========================================
    // LOGIN/REGISTER TAB SWITCH
    // ==========================================
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === target + '-form') {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(this)) {
                const successMsg = this.querySelector('.success-message');
                if (successMsg) {
                    successMsg.classList.add('show');
                    setTimeout(() => {
                        successMsg.classList.remove('show');
                    }, 3000);
                }
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(this)) {
                const successMsg = this.querySelector('.success-message');
                if (successMsg) {
                    successMsg.classList.add('show');
                    this.reset();
                    setTimeout(() => {
                        successMsg.classList.remove('show');
                    }, 3000);
                }
            }
        });
    }
    
    // ==========================================
    // NEWSLETTER FORM
    // ==========================================
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const input = this.querySelector('input');
            if (input && input.value.trim()) {
                const btn = this.querySelector('button');
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Saving...';
                try {
                    if (window.UniNestDB) await window.UniNestDB.submit('/api/newsletter', { email: input.value.trim(), source: location.pathname });
                    btn.textContent = 'Subscribed!';
                    btn.style.background = '#059669';
                    input.value = '';
                } catch (error) {
                    btn.textContent = 'Failed';
                    if (typeof showToast === 'function') showToast(error.message || 'Newsletter save failed.', 'error');
                }
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 3000);
            }
        });
    }
    
    // ==========================================
    // HELPFUL BUTTON
    // ==========================================
    document.querySelectorAll('.helpful-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const count = this.querySelector('.helpful-count');
            if (count) {
                let current = parseInt(count.textContent);
                if (this.classList.contains('active')) {
                    current--;
                    this.classList.remove('active');
                } else {
                    current++;
                    this.classList.add('active');
                }
                count.textContent = current;
            }
        });
    });
    
    // ==========================================
    // SEARCH FUNCTIONALITY
    // ==========================================
    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const city = this.querySelector('select[name="city"]')?.value;
            if (city && city !== 'all') {
                window.location.href = 'listings.html?city=' + encodeURIComponent(city);
            } else {
                window.location.href = 'listings.html';
            }
        });
    }
    
    // Handle URL params for listings page
    if (window.location.pathname.includes('listings.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const cityParam = urlParams.get('city');
        if (cityParam && listingsFilterCity) {
            listingsFilterCity.value = cityParam;
            filterListings();
        }
    }
    
    // ==========================================
    // HERO ANIMATIONS
    // ==========================================
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('animate-fadeIn');
    }
    
    // ==========================================
    // PROPERTY CARD ANIMATION ON SCROLL
    // ==========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slideUp');
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.property-card, .blog-card, .roommate-card, .team-card, .why-card, .step-card').forEach(card => {
        cardObserver.observe(card);
    });
    
    // ==========================================
    // NAVBAR LINK SMOOTH CLOSE MOBILE
    // ==========================================
    function closeMobileMenu() {
        if (hamburger) hamburger.classList.remove('active');
        if (navLinks) navLinks.classList.remove('active');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelectorAll('.dropdown').forEach(dropdown => dropdown.classList.remove('open'));
    }

    document.querySelectorAll('.nav-links a:not(.dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // ==========================================
    // CITY PAGE PROPERTY FILTER
    // ==========================================
    const cityPageFilter = document.getElementById('city-property-filter');
    if (cityPageFilter) {
        cityPageFilter.addEventListener('change', function() {
            const cards = document.querySelectorAll('.city-properties .property-card');
            const filter = this.value;
            
            cards.forEach(card => {
                const type = card.getAttribute('data-type');
                if (filter === 'all' || type === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    }
    
    // ==========================================
    // STAR RATING INPUT FOR REVIEWS
    // ==========================================
    const starInputs = document.querySelectorAll('.star-rating-input .star');
    const ratingInput = document.getElementById('rating-value');
    
    starInputs.forEach((star, index) => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            if (ratingInput) ratingInput.value = value;
            
            starInputs.forEach((s, i) => {
                if (i < value) {
                    s.classList.add('active');
                    s.style.color = '#FBBF24';
                    s.style.fill = '#FBBF24';
                } else {
                    s.classList.remove('active');
                    s.style.color = '#D1D5DB';
                    s.style.fill = 'none';
                }
            });
        });
    });
    
});

/* ============================================
   UNINEST EXTRA FEATURES
   1. Dark Mode Toggle
   2. UniNest Assistant Chatbot UI
   3. Save Favorite Listings
   4. Housing Cost Calculator
   5. City Comparison Section
   ============================================ */

// ==========================================
// 1. DARK MODE TOGGLE
// ==========================================
(function() {
    const btn = document.getElementById('dark-mode-toggle');
    const saved = localStorage.getItem('uninest-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

    function updateIcon() {
        if (!btn) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.innerHTML = isDark
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
        btn.title = isDark ? 'Light Mode' : 'Dark Mode';
    }

    if (btn) {
        updateIcon();
        btn.addEventListener('click', function() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('uninest-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('uninest-theme', 'dark');
            }
            updateIcon();
        });
    }
})();

// ==========================================
// 2. CHATBOT UI
// ==========================================
(function() {
    const toggle = document.getElementById('chatbot-toggle');
    const chatbox = document.getElementById('chatbot-box');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');

    const responses = {
        'karachi': 'Karachi mein 200+ verified properties hain. PKR 8,500 se shuru hoti hain. <a href="city-karachi.html">Karachi listings dekhein</a>',
        'lahore': 'Lahore mein 180+ properties hain. Average rent PKR 18,000/month hai. <a href="city-lahore.html">Lahore listings dekhein</a>',
        'islamabad': 'Islamabad mein 120+ properties hain. Average PKR 22,000/month. <a href="city-islamabad.html">Islamabad listings dekhein</a>',
        'hostel': 'Boys aur girls dono ke liye hostels available hain. PKR 8,500 se shuru. <a href="listings.html">Hostel listings dekhein</a>',
        'roommate': 'Roommate finder feature available hai! <a href="roommate.html">Roommate dhundein</a>',
        'price': 'Prices PKR 8,500/month se PKR 35,000/month tak hain. Budget ke hisab se filter karein.',
        'contact': 'Support: support@uninest.pk | Phone: +92 300 1234567 | <a href="contact.html">Contact form</a>',
        'register': 'Register karna bilkul free hai! <a href="login.html">Register karein</a>',
        'default': 'Mujhe samajh nahi aaya. Try karo: "karachi", "hostel", "roommate", "price", ya "contact".'
    };

    function addMessage(text, isUser) {
        const div = document.createElement('div');
        div.className = 'chat-msg ' + (isUser ? 'chat-user' : 'chat-bot');
        div.innerHTML = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function getBotResponse(msg) {
        const m = msg.toLowerCase();
        for (const key in responses) {
            if (key !== 'default' && m.includes(key)) return responses[key];
        }
        return responses['default'];
    }

    if (toggle && chatbox) {
        toggle.addEventListener('click', () => chatbox.classList.toggle('active'));
        if (closeBtn) closeBtn.addEventListener('click', () => chatbox.classList.remove('active'));

        function handleSend() {
            const val = input.value.trim();
            if (!val) return;
            addMessage(val, true);
            input.value = '';
            setTimeout(() => addMessage(getBotResponse(val), false), 600);
        }

        sendBtn.addEventListener('click', handleSend);
        input.addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });
    }
})();

// ==========================================
// 3. SAVE FAVORITES (localStorage) - improved
// ==========================================
(function() {
    function slug(str){ return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

    let favs = JSON.parse(localStorage.getItem('uninest-favs') || '[]');
    // migrate old string array to objects
    if (favs.length && typeof favs[0] === 'string') {
        favs = favs.map(id => ({ id }));
        localStorage.setItem('uninest-favs', JSON.stringify(favs));
    }

    function saveFavs() { localStorage.setItem('uninest-favs', JSON.stringify(favs)); }
    function isFav(id) { return favs.some(f => f.id === id); }

    function updateFavBtn(btn, id) {
        btn.classList.toggle('fav-active', isFav(id));
        btn.title = isFav(id) ? 'Remove from favorites' : 'Save to favorites';
    }

    function renderFavoritesSection() {
        const section = document.getElementById('favorites-section');
        if (!section) return;
        const grid = section.querySelector('#favs-grid');
        if (!grid) return;
        if (favs.length === 0) {
            grid.innerHTML = `<div class="empty-favs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><p>Abhi tak koi property save nahi ki.<br><a href="listings.html">Listings dekhein →</a></p></div>`;
            return;
        }
        let html = `<p style="text-align:center;color:var(--text-light);margin-bottom:24px">${favs.length} saved properties</p><div class="favs-grid-inner">`;
        favs.forEach(f => {
            html += `
                <div class="fav-item">
                    <div class="fav-image"><img src="${f.img || 'images/property-1.jpg'}" alt="${f.title}"></div>
                    <div class="fav-info">
                        <h4>${f.title}</h4>
                        <div class="fav-price">${f.price || ''}</div>
                        <a href="${f.href || 'listings.html'}" class="btn btn-primary">View</a>
                    </div>
                </div>`;
        });
        html += `</div>`;
        grid.innerHTML = html;
    }

    document.querySelectorAll('.property-fav').forEach(btn => {
        // initialize state
        const card = btn.closest('.property-card');
        const title = card?.querySelector('.property-title')?.textContent?.trim() || '';
        const price = card?.querySelector('.property-price')?.textContent?.trim() || '';
        const id = slug(title + '-' + price);
        updateFavBtn(btn, id);

        btn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const card = btn.closest('.property-card');
            const title = card?.querySelector('.property-title')?.textContent?.trim() || 'Property';
            const price = card?.querySelector('.property-price')?.textContent?.trim() || '';
            const img = card?.querySelector('.property-image img')?.getAttribute('src') || '';
            const href = card?.querySelector('.property-btn')?.getAttribute('href') || 'listings.html';
            const id = slug(title + '-' + price);

            const idx = favs.findIndex(f => f.id === id);
            let added = false;
            if (idx > -1) {
                favs.splice(idx, 1);
            } else {
                favs.push({ id, title, price, img, href });
                added = true;
            }
            saveFavs();
            updateFavBtn(btn, id);
            // small feedback animation
            if (card) { card.style.transform = 'scale(1.02)'; setTimeout(() => card.style.transform = '', 300); }
            renderFavoritesSection();
            showToast(added ? '❤️ Saved to favorites!' : '💔 Removed from favorites', added ? 'success' : 'warning');
        });
    });

    // initial render on load
    renderFavoritesSection();
})();

// ==========================================
// 4. HOUSING COST CALCULATOR
// ==========================================
(function() {
    const calc = document.getElementById('cost-calculator');
    if (!calc) return;

    const citySelect = calc.querySelector('#calc-city');
    const typeSelect = calc.querySelector('#calc-type');
    const monthsInput = calc.querySelector('#calc-months');
    const resultDiv = calc.querySelector('#calc-result');
    const calcBtn = calc.querySelector('#calc-btn');

    const prices = {
        karachi:    { hostel: 9000,  coliving: 14000, private: 20000 },
        lahore:     { hostel: 11000, coliving: 18000, private: 25000 },
        islamabad:  { hostel: 13000, coliving: 20000, private: 30000 }
    };

    if (calcBtn) calcBtn.addEventListener('click', function() {
        const city = citySelect.value;
        const type = typeSelect.value;
        const months = parseInt(monthsInput.value) || 1;
        if (!city || !type) { resultDiv.innerHTML = '<p style="color:var(--secondary)">City aur type select karein.</p>'; return; }
        const monthly = prices[city][type];
        const total = monthly * months;
        const deposit = monthly * 2;
        const food = 8000 * months;
        const total2 = total + deposit + food;
        resultDiv.innerHTML = `
            <table class="calc-table">
                <tr><td>Rent (${months} month)</td><td><b>PKR ${total.toLocaleString()}</b></td></tr>
                <tr><td>Security Deposit</td><td><b>PKR ${deposit.toLocaleString()}</b></td></tr>
                <tr><td>Est. Food (${months} mo)</td><td><b>PKR ${food.toLocaleString()}</b></td></tr>
                <tr class="calc-total"><td>Total Budget</td><td><b>PKR ${total2.toLocaleString()}</b></td></tr>
            </table>`;
    });
})();

// ==========================================
// 5. CITY COMPARISON
// ==========================================
(function() {
    const comp = document.getElementById('city-comparison');
    if (!comp) return;

    const data = {
        karachi:   { props: 200, avgRent: 15000, unis: 25, rating: 4.6, transport: 'Good', safety: 'Moderate' },
        lahore:    { props: 180, avgRent: 18000, unis: 30, rating: 4.7, transport: 'Very Good', safety: 'Good' },
        islamabad: { props: 120, avgRent: 22000, unis: 20, rating: 4.8, transport: 'Excellent', safety: 'Excellent' }
    };

    const btns = comp.querySelectorAll('.compare-city-btn');
    const tableDiv = comp.querySelector('#compare-table');
    let selected = [];

    btns.forEach(btn => {
        btn.addEventListener('click', function() {
            const city = this.dataset.city;
            if (selected.includes(city)) {
                selected = selected.filter(c => c !== city);
                this.classList.remove('active');
            } else if (selected.length < 3) {
                selected.push(city);
                this.classList.add('active');
            }
            renderTable();
        });
    });

    function renderTable() {
        if (selected.length === 0) { tableDiv.innerHTML = ''; return; }
        const rows = [
            ['Properties', 'props', ''],
            ['Avg Rent/month', 'avgRent', 'PKR '],
            ['Universities', 'unis', ''],
            ['Rating', 'rating', '⭐'],
            ['Transport', 'transport', ''],
            ['Safety', 'safety', '']
        ];
        let html = '<table class="comp-table"><thead><tr><th>Feature</th>';
        selected.forEach(c => html += `<th>${c.charAt(0).toUpperCase()+c.slice(1)}</th>`);
        html += '</tr></thead><tbody>';
        rows.forEach(([label, key, prefix]) => {
            html += `<tr><td>${label}</td>`;
            selected.forEach(c => {
                const val = data[c][key];
                html += `<td>${prefix}${typeof val === 'number' && key === 'avgRent' ? val.toLocaleString() : val}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        tableDiv.innerHTML = html;
    }
})();

/* ============================================
   PHASE 2 - PROFESSIONAL UPGRADES JS
   ============================================ */

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
window.showToast = function(msg, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '✅'}</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// ==========================================
// LOADING SCREEN
// ==========================================
(function() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    window.addEventListener('load', function() {
        setTimeout(() => screen.classList.add('hidden'), 1800);
    });
})();

// ==========================================
// TYPING ANIMATION (Hero Heading)
// ==========================================
(function() {
    const el = document.getElementById('typing-heading');
    if (!el) return;
    const texts = [
        'Find Verified Student Housing',
        'Safe & Affordable Hostels',
        'Your Perfect Co-Living Space',
        'Trusted Roommate Matching'
    ];
    let ti = 0, ci = 0, deleting = false;
    el.classList.add('typing-cursor');

    function type() {
        const current = texts[ti];
        if (!deleting) {
            el.textContent = current.slice(0, ++ci);
            if (ci === current.length) { deleting = true; setTimeout(type, 1800); return; }
        } else {
            el.textContent = current.slice(0, --ci);
            if (ci === 0) { deleting = false; ti = (ti + 1) % texts.length; }
        }
        setTimeout(type, deleting ? 50 : 80);
    }
    type();
})();

// ==========================================
// PROPERTY DETAIL MODAL
// ==========================================
(function() {
    const modal = document.getElementById('property-modal');
    if (!modal) return;

    const propertyData = [
        { id: 1, title: 'Al-Noor Boys Hostel', location: 'Gulshan-e-Iqbal, Karachi', price: 'PKR 12,000', type: 'Hostel', amenities: ['WiFi', 'AC', 'Laundry', 'Security', '24/7 Guard', 'Parking'], desc: 'Fully verified boys hostel near NED University. Safe neighborhood, warden on duty 24/7.', img: 'images/property-1.jpg', phone: '+923001234567' },
        { id: 2, title: "Scholar's Co-Living Space", location: 'Johar Town, Lahore', price: 'PKR 18,500', type: 'Co-Living', amenities: ['WiFi', 'AC', 'Security', 'Study Room', 'Kitchen', 'Rooftop'], desc: 'Premium co-living space near LUMS. Modern furnished rooms with a vibrant student community.', img: 'images/property-2.jpg', phone: '+923001234567' },
        { id: 3, title: 'Premium Private Suite', location: 'H-12, Islamabad', price: 'PKR 25,000', type: 'Private', amenities: ['WiFi', 'AC', 'TV', 'Attached Bath', 'Parking', 'Backup Power'], desc: 'Luxurious private suite near NUST with all modern amenities. Best for focused students.', img: 'images/property-3.jpg', phone: '+923001234567' },
        { id: 4, title: 'The Scholar Residences', location: 'Model Town, Lahore', price: 'PKR 20,000', type: 'Co-Living', amenities: ['WiFi', 'AC', 'Laundry', 'Gym', 'Cafeteria', 'Security'], desc: 'Established co-living brand in Lahore. Near Punjab University and UCP.', img: 'images/property-4.jpg', phone: '+923001234567' },
        { id: 5, title: 'Budget Student Hostel', location: 'Saddar, Karachi', price: 'PKR 8,500', type: 'Hostel', amenities: ['WiFi', 'Meals', 'Laundry', 'Common Room'], desc: 'Most affordable verified hostel in Karachi. Meals included in rent.', img: 'images/property-5.jpg', phone: '+923001234567' },
        { id: 6, title: 'Safe Haven Girls Hostel', location: 'F-7, Islamabad', price: 'PKR 15,000', type: 'Hostel', amenities: ['WiFi', 'AC', 'Security', 'CCTV', 'Meals', 'Lady Warden'], desc: 'Premium girls-only hostel in the safest sector of Islamabad. Strict security protocols.', img: 'images/property-6.jpg', phone: '+923001234567' },
        { id: 7, title: 'Study Hub Co-Living', location: 'DHA, Lahore', price: 'PKR 22,000', type: 'Co-Living', amenities: ['WiFi', 'AC', 'Laundry', 'Library', 'Cafe', 'EV Charging'], desc: 'Modern co-living in DHA Phase 5. Perfect for LUMS & UCP students.', img: 'images/property-7.jpg', phone: '+923001234567' },
        { id: 8, title: 'UniLife Dining Hostel', location: 'Korangi, Karachi', price: 'PKR 10,000', type: 'Hostel', amenities: ['WiFi', 'Meals', 'Laundry', 'TV Lounge'], desc: 'Affordable hostel with free breakfast & dinner included.', img: 'images/property-8.jpg', phone: '+923001234567' },
        { id: 9, title: 'Luxury Studio Apartment', location: 'G-10, Islamabad', price: 'PKR 35,000', type: 'Private', amenities: ['WiFi', 'AC', 'Security', 'Gym', 'Pool Access', 'Smart TV', 'Backup Power'], desc: 'High-end studio apartment for students who want premium living near COMSATS.', img: 'images/property-9.jpg', phone: '+923001234567' }
    ];

    function openModal(pid) {
        // pid is 1-based property id matching propertyData array
        const d = propertyData.find(p => p.id === pid) || propertyData[(pid - 1) % propertyData.length];
        if (!d) return;
        modal.querySelector('#modal-img').src = d.img;
        modal.querySelector('#modal-img').alt = d.title;
        modal.querySelector('#modal-title').textContent = d.title;
        modal.querySelector('#modal-location').textContent = d.location;
        modal.querySelector('#modal-price').innerHTML = d.price + '<span>/month</span>';
        const typeEl = modal.querySelector('#modal-type');
        if (typeEl) typeEl.textContent = d.type;
        modal.querySelector('#modal-desc').textContent = d.desc;
        const amenDiv = modal.querySelector('#modal-amenities');
        amenDiv.innerHTML = d.amenities.map(a => `<span class="modal-amenity">${a}</span>`).join('');
        modal.querySelector('#modal-whatsapp').href = `https://wa.me/${d.phone}?text=Hi, I am interested in ${d.title} listed on UniNest Pakistan.`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCalendar(modal.querySelector('#modal-calendar'));
    }

    document.querySelectorAll('.property-btn').forEach((btn) => {
        btn.addEventListener('click', function(e) {
            const rawHref = (btn.getAttribute('href') || '').trim();
            if (/^hotel-[a-z0-9-]+\.html(?:[?#].*)?$/i.test(rawHref)) return;
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.property-card');
            const pid = btn.dataset.pid || (card ? card.getAttribute('data-id') : '1') || '1';
            window.location.href = getPropertyPageById(pid);
        });
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    const closeBtn = modal.querySelector('#modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

// ==========================================
// MINI AVAILABILITY CALENDAR
// ==========================================
function renderCalendar(container) {
    if (!container) return;
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const unavailable = [3, 7, 8, 14, 15, 22, 23];

    let html = `<div class="mini-calendar"><h5>📅 Availability — ${monthNames[month]} ${year}</h5><div class="cal-grid">`;
    days.forEach(d => html += `<div class="cal-day header">${d}</div>`);
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const cls = unavailable.includes(d) ? 'unavailable' : (d >= today.getDate() ? 'available' : '');
        html += `<div class="cal-day ${cls}" onclick="this.classList.toggle('selected')">${d}</div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
}

// ==========================================
// IMAGE LIGHTBOX
// ==========================================
(function() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const lbImg = lightbox.querySelector('#lightbox-img');
    const lbClose = lightbox.querySelector('#lightbox-close');

    document.querySelectorAll('.property-image img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            lbImg.src = this.src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    lbClose.addEventListener('click', () => { lightbox.classList.remove('active'); document.body.style.overflow = ''; });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) { lightbox.classList.remove('active'); document.body.style.overflow = ''; } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('active')) { lightbox.classList.remove('active'); document.body.style.overflow = ''; } });
})();

// ==========================================
// LIVE SEARCH FILTER (Hero Search Bar)
// ==========================================
(function() {
    const searchBtn = document.getElementById('hero-search-btn');
    const citySelect = document.getElementById('hero-city');
    const typeSelect = document.getElementById('hero-type');
    const budgetSelect = document.getElementById('hero-budget');
    const resultsBar = document.getElementById('search-results-bar');

    if (!searchBtn) return;

    searchBtn.addEventListener('click', function() {
        const city = citySelect ? citySelect.value : '';
        const type = typeSelect ? typeSelect.value : '';
        const budget = budgetSelect ? budgetSelect.value : '';

        const cards = document.querySelectorAll('.property-card');
        let visible = 0;

        cards.forEach(card => {
            const cardCity = card.dataset.city || '';
            const cardType = card.dataset.type || '';
            const cardPrice = parseInt(card.dataset.price || '0');
            let show = true;
            if (city && cardCity && !cardCity.includes(city)) show = false;
            if (type && cardType && cardType !== type) show = false;
            if (budget) {
                const [min, max] = budget.split('-').map(Number);
                if (max && cardPrice > max) show = false;
                if (!max && cardPrice < min) show = false;
            }
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        if (resultsBar) {
            if (cards.length > 0) {
                resultsBar.textContent = `🔍 ${visible} properties found matching your search`;
                resultsBar.classList.add('visible');
                const listingsSection = document.querySelector('.listings-grid') || document.querySelector('#featured-listings');
                if (listingsSection) listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        if (city) {
            const cityUrls = { karachi: 'city-karachi.html', lahore: 'city-lahore.html', islamabad: 'city-islamabad.html' };
            if (cityUrls[city] && cards.length === 0) {
                setTimeout(() => window.location.href = cityUrls[city], 800);
            }
        }
        showToast(`Searching for ${type || 'all'} properties${city ? ' in ' + city.charAt(0).toUpperCase() + city.slice(1) : ''}...`, 'info');
    });
})();

// ==========================================
// RENT TREND CHART (Canvas)
// ==========================================
(function() {
    const canvas = document.getElementById('rent-chart');
    if (!canvas) return;
    const container = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    const data = {
        labels: ['2022', '2023', '2024', '2025', '2026'],
        karachi:   [8000,  9500,  11000, 13000, 15000],
        lahore:    [10000, 12000, 14500, 16000, 18000],
        islamabad: [13000, 15000, 17000, 19000, 22000]
    };
    const colors = { karachi: '#1A237E', lahore: '#FF6F00', islamabad: '#22C55E' };
    const maxVal = 25000;

    function drawChart() {
        const ratio = window.devicePixelRatio || 1;
        const cssWidth = Math.min(container.clientWidth, 700);
        const cssHeight = cssWidth * 320 / 700;

        canvas.width = Math.round(cssWidth * ratio);
        canvas.height = Math.round(cssHeight * ratio);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        const W = cssWidth;
        const H = cssHeight;
        const PAD = { top: 40, right: 30, bottom: 50, left: 70 };
        const gW = W - PAD.left - PAD.right;
        const gH = H - PAD.top - PAD.bottom;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--white') || '#fff';
        ctx.fillRect(0, 0, W, H);

        // Grid lines and labels
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Poppins, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const y = PAD.top + (gH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(PAD.left, y);
            ctx.lineTo(PAD.left + gW, y);
            ctx.stroke();
            ctx.fillText('PKR ' + ((maxVal - (maxVal / 5) * i) / 1000).toFixed(0) + 'K', PAD.left - 8, y + 4);
        }

        // X labels
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Poppins, sans-serif';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = PAD.left + (gW / (data.labels.length - 1)) * i;
            ctx.fillText(label, x, H - 16);
        });

        // Lines and dots
        ['karachi', 'lahore', 'islamabad'].forEach(city => {
            const vals = data[city];
            ctx.strokeStyle = colors[city];
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            vals.forEach((v, i) => {
                const x = PAD.left + (gW / (vals.length - 1)) * i;
                const y = PAD.top + gH - (v / maxVal) * gH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            vals.forEach((v, i) => {
                const x = PAD.left + (gW / (vals.length - 1)) * i;
                const y = PAD.top + gH - (v / maxVal) * gH;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = colors[city];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });

        // Legend
        const legendItems = [['Karachi', '#1A237E'], ['Lahore', '#FF6F00'], ['Islamabad', '#22C55E']];
        ctx.font = '12px Poppins, sans-serif';
        ctx.textAlign = 'left';
        legendItems.forEach(([name, color], i) => {
            const lx = PAD.left + (gW / 3) * i + gW / 6;
            ctx.fillStyle = color;
            ctx.fillRect(lx - 30, PAD.top - 25, 16, 3);
            ctx.fillStyle = '#374151';
            ctx.fillText(name, lx - 10, PAD.top - 20);
        });
    }

    drawChart();
    window.addEventListener('resize', drawChart);
})();

// ==========================================
// STUDENT REVIEWS UPVOTE (localStorage)
// ==========================================
(function() {
    const votes = JSON.parse(localStorage.getItem('uninest-votes') || '{}');
    document.querySelectorAll('.review-upvote').forEach((btn, i) => {
        const id = 'review-' + i;
        let count = parseInt(btn.dataset.count || btn.querySelector('.vote-count')?.textContent || '0');
        if (votes[id]) { btn.classList.add('voted'); }
        function updateBtn() {
            btn.innerHTML = `👍 Helpful <span class="vote-count">${count}</span>`;
            if (votes[id]) btn.classList.add('voted');
        }
        updateBtn();
        btn.addEventListener('click', function() {
            if (votes[id]) {
                votes[id] = false; count--;
                btn.classList.remove('voted');
            } else {
                votes[id] = true; count++;
                btn.classList.add('voted');
                showToast('Thanks for your feedback!', 'success');
            }
            localStorage.setItem('uninest-votes', JSON.stringify(votes));
            updateBtn();
        });
    });
})();

// ==========================================
// PRINT BROCHURE
// ==========================================
(function() {
    const btn = document.getElementById('print-btn');
    if (btn) btn.addEventListener('click', () => {
        showToast('Preparing brochure...', 'info', 1500);
        setTimeout(() => window.print(), 1500);
    });
})();


// ==========================================
// ROOMMATE CONNECT BUTTONS
// ==========================================
// roommate.html mein Connect button pe request message show karna
let roommateButtons = document.querySelectorAll('.roommate-footer .btn');

roommateButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        // Button ke parent card ko find kar rahe hain
        let card = button.closest('.roommate-card');

        if (card) {
            // Card se roommate ka naam aur university nikal rahe hain
            let name = card.querySelector('h3').textContent;
            let university = card.querySelector('p').textContent; // University text bhi card se read ho raha hai

            // Simple toast/alert message - same feedback style rakha hai
            let msg = 'Request sent to ' + name + '! They\'ll get back to you soon.';
            if (typeof showToast === 'function') {
                showToast(msg, 'success');
            } else {
                alert(msg);
            }

        }

        // Button ko temporarily disable kar rahe hain taake double click na ho
        button.textContent = 'Request Sent';
        button.disabled = true;

        // 2 seconds baad button wapas normal ho jayega
        setTimeout(function() {
            button.textContent = 'Connect';
            button.disabled = false;
        }, 2000);
    });
});

// ==========================================
// SIMPLE PAGINATION ACTIVE BUTTON
// ==========================================
// listings.html aur reviews.html ke pagination buttons ke liye simple UI logic
let paginationButtons = document.querySelectorAll('.pagination button');

paginationButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        // Agar user ne next (>) button click kiya hai
        if (button.textContent.trim() === '>') {
            let activeButton = button.parentElement.querySelector('button.active');
            let nextButton = activeButton ? activeButton.nextElementSibling : null;

            // Next number ko active karo, lekin > button ko active nahi karna
            if (nextButton && nextButton.textContent.trim() !== '>') {
                button.parentElement.querySelectorAll('button').forEach(function(btn) {
                    btn.classList.remove('active');
                });

                nextButton.classList.add('active');
            }
        } else {
            // Normal number button click hone par active class shift karo
            button.parentElement.querySelectorAll('button').forEach(function(btn) {
                btn.classList.remove('active');
            });

            button.classList.add('active');
        }
    });
});


// ==========================================
// POLISH TASK: SIMPLE JSON LOADING MESSAGE
// ==========================================
// properties.json/testimonials.json fetch hotay waqt Loading text show karte hain
(function() {
    function showLoading(file) {
        if (file === 'properties.json') {
            document.querySelectorAll('.listings-grid, #city-listings-grid').forEach(function(grid) {
                if (grid && !grid.innerHTML.trim()) {
                    grid.innerHTML = '<div class="loading-message">Loading properties...</div>';
                }
            });
        }
        if (file === 'testimonials.json') {
            let track = document.querySelector('.testimonial-track');
            if (track && !track.dataset.loadedOnce) {
                track.innerHTML = '<div class="loading-message">Loading reviews...</div>';
            }
        }
    }

    function hideLoading(file) {
        if (file === 'testimonials.json') {
            let track = document.querySelector('.testimonial-track');
            if (track) track.dataset.loadedOnce = 'yes';
        }
    }

    document.addEventListener('uninest:loading-start', function(e) {
        showLoading(e.detail.file);
    });
    document.addEventListener('uninest:loading-end', function(e) {
        hideLoading(e.detail.file);
    });
})();

// ==========================================
// POLISH TASK: EXTRA BEGINNER FORM VALIDATION
// ==========================================
// Ye validation login/register/contact/roommate/review forms ke liye simple error text show karti hai
(function() {
    function setError(input, message) {
        let group = input.closest('.form-group') || input.closest('.form-field');
        if (!group) return;
        let error = group.querySelector('.form-error');
        if (!error) {
            error = document.createElement('span');
            error.className = 'form-error';
            group.appendChild(error);
        }
        error.textContent = message;
        group.classList.add('error');
    }

    function clearError(input) {
        let group = input.closest('.form-group') || input.closest('.form-field');
        if (!group) return;
        group.classList.remove('error');
    }

    function checkSimpleForm(form) {
        let isOk = true;
        let fields = form.querySelectorAll('input[required], select[required], textarea[required]');

        fields.forEach(function(input) {
            clearError(input);

            if (!input.value.trim()) {
                isOk = false;
                setError(input, 'This field is required');
            } else if (input.type === 'email') {
                let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(input.value.trim())) {
                    isOk = false;
                    setError(input, 'Please enter a valid email');
                }
            }
        });

        return isOk;
    }

    document.querySelectorAll('#login-form, #register-form, #contact-form, #roommate-form, #review-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            if (!checkSimpleForm(form)) {
                e.preventDefault();
                if (typeof showToast === 'function') showToast('Please fix form errors first.', 'warning');
            }
        }, true);
    });
})();

// ==========================================
// POLISH TASK: ACCESSIBILITY LABELS VIA JS
// ==========================================
// Agar kisi icon button par aria-label missing ho to JS se add kar do
(function() {
    let labels = [
        ['#chatbot-toggle', 'Open UniNest chatbot'],
        ['#chatbot-close', 'Close chatbot'],
        ['#chatbot-send', 'Send chatbot message'],
        ['#modal-close', 'Close modal'],
        ['#lightbox-close', 'Close image lightbox']
    ];

    labels.forEach(function(item) {
        let btn = document.querySelector(item[0]);
        if (btn && !btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', item[1]);
        }
    });
})();


// ==========================================
// QA TASK: EXTRA ARIA LABELS
// ==========================================
// Static pages par agar aria-label reh gaya ho to yahan se safe fallback add ho jata hai
(function() {
    document.querySelectorAll('.property-fav').forEach(function(btn) {
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', 'Add to favorites');
        }
    });

    document.querySelectorAll('.helpful-btn').forEach(function(btn) {
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', 'Mark as helpful');
        }
    });
})();

/* ============================================
   FINAL FIX: Robust favorites for static + dynamic cards
   Works on file:// and localhost, updates dashboard data.
   ============================================ */
(function(){
    const KEY = 'uninest-favs';
    function slug(str){ return String(str||'property').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || ('property-' + Date.now()); }
    function readFavs(){
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
            return raw.map((f, i) => {
                if (typeof f === 'string') return { id: f, title: f, href: 'listings.html' };
                return { ...f, id: String(f.id || slug((f.title||'property') + '-' + (f.price||i))) };
            });
        } catch(e) { return []; }
    }
    function writeFavs(favs){ localStorage.setItem(KEY, JSON.stringify(favs)); }
    function cardData(card, btn){
        const title = card?.querySelector('.property-title, h3, h4')?.textContent?.trim() || btn?.dataset.title || 'Property';
        const price = card?.querySelector('.property-price, .price')?.textContent?.trim() || btn?.dataset.price || '';
        const img = card?.querySelector('.property-image img, img')?.getAttribute('src') || btn?.dataset.img || 'images/property-1.jpg';
        const href = card?.querySelector('.property-btn, a.btn, a[href*="hotel-"]')?.getAttribute('href') || btn?.dataset.href || 'listings.html';
        const location = card?.querySelector('.property-location')?.textContent?.trim() || '';
        const id = String(btn?.dataset.id || card?.dataset.id || slug(title + '-' + price));
        return { id, title, price, img, href, location };
    }
    function isFav(id){ return readFavs().some(f => String(f.id) === String(id)); }
    function setBtn(btn, active){
        btn.classList.toggle('fav-active', active);
        btn.classList.toggle('is-favorite', active);
        btn.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites');
        btn.title = active ? 'Remove from favorites' : 'Save to favorites';
    }
    function refreshButtons(){
        document.querySelectorAll('.property-fav').forEach(btn => {
            const data = cardData(btn.closest('.property-card'), btn);
            btn.dataset.id = data.id;
            setBtn(btn, isFav(data.id));
        });
    }
    function updateAuthFavorites(item, added){
        if (!window.Auth || !Auth.isLoggedIn()) return;
        try { added ? Auth.addFavoriteObject?.(item) || Auth.addFavorite(item) : Auth.removeFavorite(item.id); } catch(e) {}
    }
    document.addEventListener('click', function(e){
        const btn = e.target.closest('.property-fav');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const data = cardData(btn.closest('.property-card'), btn);
        let favs = readFavs();
        const idx = favs.findIndex(f => String(f.id) === String(data.id));
        let added = false;
        if (idx >= 0) favs.splice(idx, 1);
        else { favs.push(data); added = true; }
        writeFavs(favs);
        updateAuthFavorites(data, added);
        refreshButtons();
        if (typeof showToast === 'function') showToast(added ? '❤️ Property favorites mein save ho gayi' : '💔 Property favorites se remove ho gayi', added ? 'success' : 'warning');
        else alert(added ? 'Saved to favorites' : 'Removed from favorites');
        window.dispatchEvent(new CustomEvent('uninest:favorites-updated'));
    }, true);
    document.addEventListener('DOMContentLoaded', refreshButtons);
    setTimeout(refreshButtons, 500);
    setTimeout(refreshButtons, 1500);
    window.UniNestFavorites = { read: readFavs, write: writeFavs, refresh: refreshButtons, isFav };
})();


// FINAL mobile menu safety: works on all pages and closes after link click
(function(){
  function closeMobileNav(){
    const hamburger=document.querySelector('.hamburger');
    const navLinks=document.querySelector('.nav-links');
    const overlay=document.querySelector('.mobile-overlay');
    if(hamburger) hamburger.classList.remove('active');
    if(navLinks) navLinks.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
    document.body.style.overflow='';
  }
  document.addEventListener('click', function(e){
    const link=e.target.closest('.nav-links a');
    if(link && !link.classList.contains('dropdown-toggle') && window.innerWidth <= 991){
      setTimeout(closeMobileNav, 80);
    }
  });
  window.addEventListener('resize', function(){ if(window.innerWidth > 991) closeMobileNav(); });
})();
