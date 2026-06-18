// Site Content Synchronizer / Loader
window.deferInitialization = true; // Signal to main.js to defer carousel/animations until data is ready

let currentFilter = '*';
let currentPage = 1;
const itemsPerPage = 6;

document.addEventListener("DOMContentLoaded", async function () {
    console.log("Site Loader: Initializing dynamic content sync...");

    // Determine current page ID and local cache keys (supporting clean URL path names)
    const path = window.location.pathname.toLowerCase();
    let dbId = 1;
    let pageCacheKey = "eco_homepage_content";
    if (path.includes("about.html") || path.endsWith("/about") || path.endsWith("/about/")) {
        dbId = 2;
        pageCacheKey = "eco_about_content";
    } else if (path.includes("service.html") || path.endsWith("/service") || path.endsWith("/service/")) {
        dbId = 3;
        pageCacheKey = "eco_service_content";
    } else if (path.includes("project.html") || path.includes("project-detail.html") || path.endsWith("/project") || path.endsWith("/project/") || path.includes("/project-detail")) {
        dbId = 4;
        pageCacheKey = "eco_project_content";
    }

    // 1. Instant Cache Render (Anti-flicker / Offline fallback)
    const cachedPageData = localStorage.getItem(pageCacheKey);
    const cachedHomepageData = localStorage.getItem("eco_homepage_content"); // for footer fallback

    if (cachedPageData) {
        try {
            const parsed = JSON.parse(cachedPageData);
            // If it's about/service/project page, we also merge the cached footer info from homepage
            if (dbId !== 1 && cachedHomepageData) {
                const parsedHome = JSON.parse(cachedHomepageData);
                let merged = Object.assign({}, parsedHome, parsed);
                if (dbId === 4) {
                    const cachedServiceData = localStorage.getItem("eco_service_content");
                    if (cachedServiceData) {
                        try {
                            const parsedSrv = JSON.parse(cachedServiceData);
                            for (let i = 1; i <= 3; i++) {
                                if (parsedSrv[`test${i}_name`] !== undefined) merged[`test${i}_name`] = parsedSrv[`test${i}_name`];
                                if (parsedSrv[`test${i}_role`] !== undefined) merged[`test${i}_role`] = parsedSrv[`test${i}_role`];
                                if (parsedSrv[`test${i}_quote`] !== undefined) merged[`test${i}_quote`] = parsedSrv[`test${i}_quote`];
                                if (parsedSrv[`test${i}_img`] !== undefined) merged[`test${i}_img`] = parsedSrv[`test${i}_img`];
                            }
                            for (let i = 1; i <= 6; i++) {
                                if (parsedSrv[`srv${i}_title`] !== undefined) merged[`srv${i}_title`] = parsedSrv[`srv${i}_title`];
                            }
                        } catch (err) {}
                    }
                }
                updateDOM(merged);
            } else {
                updateDOM(parsed);
            }
            console.log(`Site Loader: Rendered cached content for ID ${dbId}.`);
        } catch (e) {
            console.error("Site Loader: Error parsing cached data:", e);
        }
    }

    // 2. Fetch Fresh Data from Supabase
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        try {
            const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            
            // Fetch current page data
            const { data, error } = await client
                .from('homepage_content')
                .select('*')
                .eq('id', dbId)
                .maybeSingle();

            // If we are not on homepage, we also want to fetch the global footer/homepage data (id = 1)
            let homepageRecord = null;
            if (dbId !== 1) {
                const { data: homeData } = await client
                    .from('homepage_content')
                    .select('*')
                    .eq('id', 1)
                    .maybeSingle();
                if (homeData) {
                    homepageRecord = homeData.content_json || homeData;
                }
            }

            // If we are on Project page, we also fetch the Service page data (id = 3) to sync Testimonials
            let serviceRecord = null;
            if (dbId === 4) {
                const { data: srvData } = await client
                    .from('homepage_content')
                    .select('*')
                    .eq('id', 3)
                    .maybeSingle();
                if (srvData) {
                    serviceRecord = srvData.content_json || srvData;
                }
            }

            if (error) throw error;

            let pageData = {};
            if (data) {
                pageData = data.content_json || data;
                localStorage.setItem(pageCacheKey, JSON.stringify(pageData));
            } else {
                console.log(`Site Loader: Row for ID ${dbId} not found in DB. using defaults.`);
            }

            // Merge footer config from homepage data
            let finalData = Object.assign({}, homepageRecord, pageData);
            if (dbId === 4 && serviceRecord) {
                for (let i = 1; i <= 3; i++) {
                    if (serviceRecord[`test${i}_name`] !== undefined) finalData[`test${i}_name`] = serviceRecord[`test${i}_name`];
                    if (serviceRecord[`test${i}_role`] !== undefined) finalData[`test${i}_role`] = serviceRecord[`test${i}_role`];
                    if (serviceRecord[`test${i}_quote`] !== undefined) finalData[`test${i}_quote`] = serviceRecord[`test${i}_quote`];
                    if (serviceRecord[`test${i}_img`] !== undefined) finalData[`test${i}_img`] = serviceRecord[`test${i}_img`];
                }
                for (let i = 1; i <= 6; i++) {
                    if (serviceRecord[`srv${i}_title`] !== undefined) finalData[`srv${i}_title`] = serviceRecord[`srv${i}_title`];
                }
            }
            updateDOM(finalData);
            console.log(`Site Loader: Content successfully synchronized for ID ${dbId} with Supabase DB.`);
        } catch (err) {
            console.error("Site Loader: Supabase fetch error. Using cached/local fallback.", err);
        }
    } else {
        console.warn("Site Loader: Supabase credentials not found. Using local template defaults.");
    }

    // 3. Initialize UI plugins and animations (Carousel, Wow.js, Counter, Spinner removal)
    if (typeof window.initializeSiteFeatures === "function") {
        window.initializeSiteFeatures();
    } else {
        console.error("Site Loader: initializeSiteFeatures function missing from main.js!");
    }

    // 4. Handle anchor/hash scrolling after dynamic content and layout reordering have settled
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            setTimeout(() => {
                const navbar = document.querySelector('.sticky-top');
                const offset = navbar ? navbar.offsetHeight : 75;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = targetEl.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 350);
        }
    }
});

// Update DOM elements helper
function updateDOM(data) {
    if (!data) return;

    // --- 0. Topbar Section ---
    const topbarAddr = document.querySelector('.bg-dark .fa-map-marker-alt + small');
    const topbarHours = document.querySelector('.bg-dark .fa-clock + small, .bg-dark .far.fa-clock + small');
    const topbarPhone = document.querySelector('.bg-dark .fa-phone-alt + small');

    if (topbarAddr && data.topbar_address) topbarAddr.textContent = data.topbar_address;
    if (topbarHours && data.topbar_hours) topbarHours.textContent = data.topbar_hours;
    if (topbarPhone && data.topbar_phone) topbarPhone.textContent = data.topbar_phone;

    // --- Page Header Banner ---
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        if (data.banner_title) {
            const h1 = pageHeader.querySelector('h1');
            if (h1) h1.textContent = data.banner_title;
        }
        if (data.banner_img) {
            pageHeader.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, .1), rgba(0, 0, 0, .1)), url(${data.banner_img})`;
        }
    }

    // --- 1. Hero Carousel (3 Slides) ---
    const slides = document.querySelectorAll('#section-hero .owl-carousel-item');
    
    // Slide 1
    if (slides.length >= 1) {
        if (data.hero1_title) {
            const h1 = slides[0].querySelector('h1');
            if (h1) h1.textContent = data.hero1_title;
        }
        if (data.hero1_subtitle) {
            const p = slides[0].querySelector('p');
            if (p) p.textContent = data.hero1_subtitle;
        }
        if (data.hero1_cta && slides[0].querySelector('a')) {
            slides[0].querySelector('a').textContent = data.hero1_cta;
        }
        if (data.hero1_img) {
            const img = slides[0].querySelector('img');
            if (img) img.src = data.hero1_img;
            slides[0].setAttribute('data-dot', `<img src="${data.hero1_img}">`);
        }
    }

    // Slide 2
    if (slides.length >= 2) {
        if (data.hero2_title) {
            const h1 = slides[1].querySelector('h1');
            if (h1) h1.textContent = data.hero2_title;
        }
        if (data.hero2_subtitle) {
            const p = slides[1].querySelector('p');
            if (p) p.textContent = data.hero2_subtitle;
        }
        if (data.hero2_cta && slides[1].querySelector('a')) {
            slides[1].querySelector('a').textContent = data.hero2_cta;
        }
        if (data.hero2_img) {
            const img = slides[1].querySelector('img');
            if (img) img.src = data.hero2_img;
            slides[1].setAttribute('data-dot', `<img src="${data.hero2_img}">`);
        }
    }

    // Slide 3
    if (slides.length >= 3) {
        if (data.hero3_title) {
            const h1 = slides[2].querySelector('h1');
            if (h1) h1.textContent = data.hero3_title;
        }
        if (data.hero3_subtitle) {
            const p = slides[2].querySelector('p');
            if (p) p.textContent = data.hero3_subtitle;
        }
        if (data.hero3_cta && slides[2].querySelector('a')) {
            slides[2].querySelector('a').textContent = data.hero3_cta;
        }
        if (data.hero3_img) {
            const img = slides[2].querySelector('img');
            if (img) img.src = data.hero3_img;
            slides[2].setAttribute('data-dot', `<img src="${data.hero3_img}">`);
        }
    }

    // --- 2. Statistics Counter ---
    const statsCols = document.querySelectorAll('#section-stats .col-md-6');
    const isAboutPage = window.location.pathname.toLowerCase().includes("about.html") || 
                        window.location.pathname.toLowerCase().endsWith("/about") || 
                        window.location.pathname.toLowerCase().endsWith("/about/");
    if (isAboutPage && data.stat1_val !== undefined) {
        for (let i = 1; i <= 4; i++) {
            const idx = i - 1;
            if (statsCols[idx]) {
                const valEl = statsCols[idx].querySelector('h1[data-toggle="counter-up"]');
                const lblEl = statsCols[idx].querySelector('h5');
                const val = data[`stat${i}_val`];
                const lbl = data[`stat${i}_lbl`];
                if (valEl && val !== undefined) valEl.textContent = val;
                if (lblEl && lbl !== undefined) lblEl.textContent = lbl;
            }
        }
    } else if (data.statistics && Array.isArray(data.statistics)) {
        data.statistics.forEach((stat, idx) => {
            if (statsCols[idx]) {
                const valEl = statsCols[idx].querySelector('h1[data-toggle="counter-up"]');
                const lblEl = statsCols[idx].querySelector('h5');
                if (valEl && stat.value !== undefined) valEl.textContent = stat.value;
                if (lblEl && stat.label !== undefined) lblEl.textContent = stat.label;
            }
        });
    }

    // --- 3. About Us Section ---
    const aboutEl = document.getElementById('section-about');
    if (aboutEl) {
        if (data.about_img) {
            const img = aboutEl.querySelector('img');
            if (img) img.src = data.about_img;
        }
        const textContainer = aboutEl.querySelector('.about-text');
        if (textContainer) {
            if (data.about_tagline) {
                const tag = textContainer.querySelector('h6');
                if (tag) tag.textContent = data.about_tagline;
            }
            if (data.about_title) {
                const title = textContainer.querySelector('h1');
                if (title) title.textContent = data.about_title;
            }

            const paras = textContainer.querySelectorAll('p');
            if (paras.length >= 1 && data.about_desc) {
                // Update only text nodes to preserve styling or formatting if any
                const textNodes = Array.from(paras[0].childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                if (textNodes.length > 0) {
                    textNodes[0].textContent = data.about_desc;
                } else {
                    paras[0].textContent = data.about_desc;
                }
            }

            const updateBulletText = (pEl, text) => {
                if (!pEl || text === undefined) return;
                const textNode = Array.from(pEl.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = text;
                } else {
                    pEl.appendChild(document.createTextNode(text));
                }
            };

            if (paras.length >= 2 && data.about_point1 !== undefined) updateBulletText(paras[1], data.about_point1);
            if (paras.length >= 3 && data.about_point2 !== undefined) updateBulletText(paras[2], data.about_point2);
            if (paras.length >= 4 && data.about_point3 !== undefined) updateBulletText(paras[3], data.about_point3);
        }
    }

    // --- 4. Our Services Section ---
    const servicesEl = document.getElementById('section-services');
    if (servicesEl) {
        if (data.services_title) {
            const h1 = servicesEl.querySelector('h1');
            if (h1) h1.textContent = data.services_title;
        }
        const serviceItems = servicesEl.querySelectorAll('.service-item');
        for (let i = 1; i <= 6; i++) {
            const item = serviceItems[i - 1];
            if (item) {
                const img = item.querySelector('img');
                const title = item.querySelector('h4');
                const desc = item.querySelector('p');
                if (img && data[`srv${i}_img`]) img.src = data[`srv${i}_img`];
                if (title && data[`srv${i}_title`]) title.textContent = data[`srv${i}_title`];
                if (desc && data[`srv${i}_desc`]) desc.textContent = data[`srv${i}_desc`];
            }
        }
    }

    // --- 5. Why Choose Us (Features) Section ---
    const featuresEl = document.getElementById('section-features');
    if (featuresEl) {
        if (data.features_img) {
            const img = featuresEl.querySelector('img');
            if (img) img.src = data.features_img;
        }
        const textContainer = featuresEl.querySelector('.feature-text');
        if (textContainer) {
            if (data.features_title) {
                const h1 = textContainer.querySelector('h1');
                if (h1) h1.textContent = data.features_title;
            }
            if (data.features_desc) {
                const desc = textContainer.querySelector('p.mb-4');
                if (desc) desc.textContent = data.features_desc;
            }
        }
    }

    // --- 6. Free Quote Section ---
    const quoteEl = document.getElementById('section-quote');
    if (quoteEl) {
        if (data.quote_img) {
            const img = quoteEl.querySelector('img');
            if (img) img.src = data.quote_img;
        }
        const textContainer = quoteEl.querySelector('.quote-text');
        if (textContainer) {
            if (data.quote_tagline) {
                const h6 = textContainer.querySelector('h6');
                if (h6) h6.textContent = data.quote_tagline;
            }
            if (data.quote_title) {
                const h1 = textContainer.querySelector('h1');
                if (h1) h1.textContent = data.quote_title;
            }
            if (data.quote_desc) {
                const desc = textContainer.querySelector('p.mb-4');
                if (desc) desc.textContent = data.quote_desc;
            }
        }

        // Dynamically populate service dropdown from admin-managed quote_services list
        const serviceSelect = quoteEl.querySelector('#quote-service');
        if (serviceSelect) {
            let serviceTitles = [];

            // Priority: use quote_services from project data (admin-managed)
            if (data.quote_services && Array.isArray(data.quote_services) && data.quote_services.length > 0) {
                serviceTitles = data.quote_services.filter(s => s && s.trim());
            } else {
                // Fallback: use srv1–srv6 titles from service data
                for (let i = 1; i <= 6; i++) {
                    const srvTitle = data[`srv${i}_title`];
                    if (srvTitle && srvTitle.trim() && !serviceTitles.includes(srvTitle.trim())) {
                        serviceTitles.push(srvTitle.trim());
                    }
                }
            }

            if (serviceTitles.length > 0) {
                serviceSelect.innerHTML = '<option value="" selected>Select A Service</option>';
                serviceTitles.forEach(title => {
                    const opt = document.createElement('option');
                    opt.value = title;
                    opt.textContent = title;
                    serviceSelect.appendChild(opt);
                });
            }
        }
    }

    // --- 7. Projects Gallery (6 Items) ---
    const projectsEl = document.getElementById('section-projects');
    if (projectsEl) {
        const projItems = projectsEl.querySelectorAll('.portfolio-item');
        for (let i = 1; i <= 6; i++) {
            const item = projItems[i - 1];
            if (item) {
                const img = item.querySelector('.portfolio-img img');
                const viewBtn = item.querySelector('.portfolio-btn a[data-lightbox="portfolio"]');
                const cat = item.querySelector('.pt-3 p.text-primary');
                const title = item.querySelector('.pt-3 h5');
                
                if (img && data[`proj${i}_img`]) img.src = data[`proj${i}_img`];
                if (viewBtn && data[`proj${i}_img`]) viewBtn.href = data[`proj${i}_img`];
                if (cat && data[`proj${i}_cat`]) cat.textContent = data[`proj${i}_cat`];
                if (title && data[`proj${i}_title`]) title.textContent = data[`proj${i}_title`];
            }
        }
    }

    // --- Projects Page Customization ---
    const projectsPageEl = document.getElementById('section-projects-page');
    if (projectsPageEl) {
        if (data.tagline) {
            const h6 = projectsPageEl.querySelector('h6');
            if (h6) h6.textContent = data.tagline;
        }
        if (data.title) {
            const h1 = projectsPageEl.querySelector('h1');
            if (h1) h1.textContent = data.title;
        }

        const filtersContainer = document.getElementById('portfolio-flters');
        const gridContainer = projectsPageEl.querySelector('.portfolio-container');
        const paginationContainer = document.getElementById('project-pagination');

        function doRender() {
            if (!gridContainer || !data.projects || !Array.isArray(data.projects)) return;

            // 1. Filter projects based on currentFilter
            const filtered = data.projects.filter(proj => {
                if (currentFilter === '*') return true;
                return String(proj.category_id) === String(currentFilter);
            });

            // 2. Paginate
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }
            if (currentPage < 1) currentPage = 1;

            const startIndex = (currentPage - 1) * itemsPerPage;
            const sliced = filtered.slice(startIndex, startIndex + itemsPerPage);

            // 3. Render items
            gridContainer.innerHTML = '';
            sliced.forEach((proj) => {
                // Find actual index in the full projects array to pass to details page
                const actualIndex = data.projects.findIndex(p => p === proj);
                const item = document.createElement('div');
                item.className = `col-lg-4 col-md-6 portfolio-item ${proj.category_id}`;
                item.innerHTML = `
                    <div class="portfolio-img rounded overflow-hidden">
                        <img class="img-fluid" src="${proj.img || 'img/img-600x400-1.jpg'}" alt="">
                        <div class="portfolio-btn">
                            <a class="btn btn-lg-square btn-outline-light rounded-circle mx-1" href="${proj.img || 'img/img-600x400-1.jpg'}" data-lightbox="portfolio"><i class="fa fa-eye"></i></a>
                            <a class="btn btn-lg-square btn-outline-light rounded-circle mx-1" href="project-detail.html?id=${actualIndex}"><i class="fa fa-link"></i></a>
                        </div>
                    </div>
                    <div class="pt-3">
                        <p class="text-primary mb-0">${proj.category_name || ''}</p>
                        <hr class="text-primary w-25 my-2">
                        <a href="project-detail.html?id=${actualIndex}" class="text-dark"><h5 class="lh-base" style="transition: color 0.3s ease;">${proj.title || ''}</h5></a>
                    </div>
                `;
                gridContainer.appendChild(item);
            });

            // 4. Render pagination controls
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                if (totalPages > 1) {
                    // Previous button
                    const prevLi = document.createElement('li');
                    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
                    prevLi.innerHTML = `<a class="page-link" href="#" style="border-radius: 5px; color: ${currentPage === 1 ? '#6c757d' : 'var(--primary)'}; border-color: #dee2e6;"><i class="fa-solid fa-chevron-left"></i></a>`;
                    if (currentPage > 1) {
                        prevLi.addEventListener('click', (e) => {
                            e.preventDefault();
                            currentPage--;
                            doRender();
                        });
                    }
                    paginationContainer.appendChild(prevLi);

                    // Numeric buttons
                    for (let i = 1; i <= totalPages; i++) {
                        const li = document.createElement('li');
                        const isActive = i === currentPage;
                        li.className = `page-item ${isActive ? 'active' : ''}`;
                        li.innerHTML = `
                            <a class="page-link" href="#" style="
                                border-radius: 5px;
                                margin: 0 2px;
                                background-color: ${isActive ? 'var(--primary)' : '#fff'};
                                border-color: ${isActive ? 'var(--primary)' : '#dee2e6'};
                                color: ${isActive ? '#fff' : 'var(--primary)'};
                            ">${i}</a>
                        `;
                        li.addEventListener('click', (e) => {
                            e.preventDefault();
                            currentPage = i;
                            doRender();
                        });
                        paginationContainer.appendChild(li);
                    }

                    // Next button
                    const nextLi = document.createElement('li');
                    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
                    nextLi.innerHTML = `<a class="page-link" href="#" style="border-radius: 5px; color: ${currentPage === totalPages ? '#6c757d' : 'var(--primary)'}; border-color: #dee2e6;"><i class="fa-solid fa-chevron-right"></i></a>`;
                    if (currentPage < totalPages) {
                        nextLi.addEventListener('click', (e) => {
                            e.preventDefault();
                            currentPage++;
                            doRender();
                        });
                    }
                    paginationContainer.appendChild(nextLi);
                }
            }

            // 5. Re-run Isotope and WOW animation to refresh layouts
            if (typeof window.initializeSiteFeatures === "function") {
                window.initializeSiteFeatures();
            }
        }

        // Initialize Categories filters DOM
        if (filtersContainer && data.categories && Array.isArray(data.categories)) {
            filtersContainer.innerHTML = '<li class="mx-2 active" data-filter="*">All</li>';
            data.categories.forEach(cat => {
                const li = document.createElement('li');
                li.className = 'mx-2';
                li.setAttribute('data-filter', String(cat.id));
                li.textContent = cat.name;
                filtersContainer.appendChild(li);
            });

            // Bind click handlers to filters
            const filterItems = filtersContainer.querySelectorAll('li');
            filterItems.forEach(item => {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    filterItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.getAttribute('data-filter');
                    currentPage = 1;
                    doRender();
                });
            });
        }

        // Render projects for the first time
        doRender();
    }

    // --- Project Detail Page Customization ---
    const projectDetailEl = document.getElementById('section-project-detail');
    if (projectDetailEl) {
        // 1. Get project ID from URL query param
        const urlParams = new URLSearchParams(window.location.search);
        const projId = parseInt(urlParams.get('id'), 10);

        if (isNaN(projId) || !data.projects || !data.projects[projId]) {
            // Render not found
            projectDetailEl.innerHTML = `
                <div class="container text-center py-5">
                    <h1 class="display-1 text-danger"><i class="fa-solid fa-triangle-exclamation"></i></h1>
                    <h2 class="mb-4">Project Not Found</h2>
                    <p class="mb-5">The project you are looking for does not exist or has been removed.</p>
                    <a href="project.html" class="btn btn-primary rounded-pill py-3 px-5">Back to Projects</a>
                </div>
            `;
            return;
        }

        const proj = data.projects[projId];

        // 2. Set Banner details
        if (proj.title) {
            const h1 = document.querySelector('.page-header h1');
            if (h1) h1.textContent = proj.title; // Set project title as banner title
        }
        
        // Update breadcrumb active item
        const activeBreadcrumb = document.querySelector('.breadcrumb-item.active');
        if (activeBreadcrumb) activeBreadcrumb.textContent = proj.title;

        // 3. Populate project details
        const imgEl = projectDetailEl.querySelector('.project-detail-img');
        const catEl = projectDetailEl.querySelector('.project-detail-category');
        const titleEl = projectDetailEl.querySelector('.project-detail-title');
        const contentEl = projectDetailEl.querySelector('.project-detail-content');

        if (imgEl) imgEl.src = proj.img || 'img/img-600x400-1.jpg';
        if (catEl) catEl.textContent = proj.category_name || '';
        if (titleEl) titleEl.textContent = proj.title || '';
        if (contentEl) {
            // Use paragraph breaks for multiline content
            const paragraphs = (proj.content || 'No description available.').split('\n').filter(p => p.trim());
            contentEl.innerHTML = paragraphs.map(p => `<p class="fs-5 text-muted mb-4" style="line-height: 1.8;">${p}</p>`).join('');
        }
    }

    // --- 8. Our Team (3 Members) ---
    for (let i = 1; i <= 3; i++) {
        const img = document.getElementById(`team-img-${i}`);
        const name = document.getElementById(`team-name-${i}`);
        const role = document.getElementById(`team-role-${i}`);
        if (img && data[`team${i}_img`]) img.src = data[`team${i}_img`];
        if (name && data[`team${i}_name`]) name.textContent = data[`team${i}_name`];
        if (role && data[`team${i}_role`]) role.textContent = data[`team${i}_role`];
    }

    // --- 9. Testimonials (3 Items) ---
    for (let i = 1; i <= 3; i++) {
        const img = document.getElementById(`test-img-${i}`);
        const quote = document.getElementById(`test-quote-${i}`);
        const name = document.getElementById(`test-name-${i}`);
        const role = document.getElementById(`test-role-${i}`);
        if (img && data[`test${i}_img`]) img.src = data[`test${i}_img`];
        if (quote && data[`test${i}_quote`]) quote.textContent = data[`test${i}_quote`];
        if (name && data[`test${i}_name`]) name.textContent = data[`test${i}_name`];
        if (role && data[`test${i}_role`]) role.textContent = data[`test${i}_role`];
    }

    // --- 10. Footer Section ---
    const footerDesc = document.getElementById('footer-desc');
    const footerAddr = document.getElementById('footer-address');
    const footerPhone = document.getElementById('footer-phone');
    const footerEmail = document.getElementById('footer-email');
    if (footerDesc && data.footer_desc) footerDesc.textContent = data.footer_desc;
    if (footerAddr && data.footer_address) footerAddr.textContent = data.footer_address;
    if (footerPhone && data.footer_phone) footerPhone.textContent = data.footer_phone;
    if (footerEmail && data.footer_email) footerEmail.textContent = data.footer_email;
    
    // Footer Gallery Images
    for (let i = 1; i <= 6; i++) {
        const galImg = document.getElementById(`footer-gal-${i}`);
        if (galImg && data[`footgal${i}_img`]) galImg.src = data[`footgal${i}_img`];
    }

    // --- 10b. Copyright Text ---
    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright && data.footer_copyright) {
        footerCopyright.innerHTML = data.footer_copyright;
    }

    // --- 10c. Social Media Links (Header & Footer share the same URLs) ---
    const socialPlatforms = [
        { key: 'facebook', icon: 'fa-facebook-f' },
        { key: 'twitter', icon: 'fa-twitter' },
        { key: 'linkedin', icon: 'fa-linkedin-in' },
        { key: 'instagram', icon: 'fa-instagram' },
        { key: 'youtube', icon: 'fa-youtube' }
    ];

    socialPlatforms.forEach(({ key, icon }) => {
        const url = data[`social_${key}`];
        if (!url) return;

        // Try ID first, then fallback to CSS selector
        // Topbar
        let topbarLink = document.getElementById(`topbar-social-${key}`);
        if (!topbarLink) {
            topbarLink = document.querySelector(`.bg-dark .btn-link .fab.${icon}`)?.closest('a');
        }
        if (topbarLink) {
            topbarLink.href = url;
            topbarLink.target = '_blank';
        }

        // Footer
        let footerLink = document.getElementById(`footer-social-${key}`);
        if (!footerLink) {
            footerLink = document.querySelector(`#section-footer .btn-social .fab.${icon}`)?.closest('a');
        }
        if (footerLink) {
            footerLink.href = url;
            footerLink.target = '_blank';
        }
    });

    // --- 11. Reorder Sections ---
    if (data.layout_order && Array.isArray(data.layout_order)) {
        if (document.getElementById('homepage-sections-container')) {
            reorderSections('homepage-sections-container', data.layout_order, {
                "Hero Banner Carousel": "section-hero",
                "Statistics Counter": "section-stats",
                "About Us Section": "section-about",
                "Our Services": "section-services",
                "Why Choose Us (Features)": "section-features",
                "Project Gallery": "section-projects",
                "Free Quote Section": "section-quote"
            });
        } else if (document.getElementById('about-sections-container')) {
            reorderSections('about-sections-container', data.layout_order, {
                "Statistics Counter": "section-stats",
                "About Us Section": "section-about",
                "Our Team": "section-team"
            });
        } else if (document.getElementById('service-sections-container')) {
            reorderSections('service-sections-container', data.layout_order, {
                "Our Services": "section-services",
                "Why Choose Us (Features)": "section-features",
                "Client Testimonials": "section-testimonials"
            });
        }
    }
}

// Reorder layout elements based on layoutOrder config
function reorderSections(containerId, layoutOrder, sectionIdMap) {
    const container = document.getElementById(containerId);
    if (!container) return;

    layoutOrder.forEach(sectionName => {
        const id = sectionIdMap[sectionName];
        if (id) {
            const el = document.getElementById(id);
            if (el) {
                container.appendChild(el);
            }
        }
    });
}

// --- Quote Form Submission Handler ---
(function initQuoteForm() {
    document.addEventListener("DOMContentLoaded", function () {
        const quoteForm = document.getElementById('quoteForm');
        if (!quoteForm) return;

        quoteForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = (document.getElementById('quote-name') || {}).value || '';
            const email = (document.getElementById('quote-email') || {}).value || '';
            const mobile = (document.getElementById('quote-mobile') || {}).value || '';
            const service = (document.getElementById('quote-service') || {}).value || '';
            const note = (document.getElementById('quote-note') || {}).value || '';

            if (!name.trim() || !email.trim() || !mobile.trim() || !service.trim()) {
                showQuoteToast('Please fill in all required fields.', true);
                return;
            }

            const submission = {
                name: name.trim(),
                email: email.trim(),
                mobile: mobile.trim(),
                service: service.trim(),
                note: note.trim(),
                timestamp: new Date().toISOString()
            };

            // Check if Supabase is available
            if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
                showQuoteToast('Service not available. Please try again later.', true);
                return;
            }

            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Submitting...';
            }

            try {
                const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

                // Load existing submissions
                const { data: existingData, error: fetchError } = await client
                    .from('homepage_content')
                    .select('*')
                    .eq('id', 99)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                let submissions = [];
                if (existingData && existingData.content_json && Array.isArray(existingData.content_json.submissions)) {
                    submissions = existingData.content_json.submissions;
                }

                submissions.push(submission);

                const { error: upsertError } = await client
                    .from('homepage_content')
                    .upsert({
                        id: 99,
                        content_json: { submissions: submissions }
                    });

                if (upsertError) throw upsertError;

                showQuoteToast('Your quote request has been submitted successfully! We will contact you soon.');
                quoteForm.reset();
            } catch (err) {
                console.error("Quote form submission error:", err);
                showQuoteToast('Failed to submit your request. Please try again later.', true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });
})();

// Simple toast notification for public pages
function showQuoteToast(message, isError) {
    // Remove any existing toast
    const existingToast = document.getElementById('quote-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'quote-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 28px;
        border-radius: 8px;
        color: #fff;
        font-size: 15px;
        font-weight: 500;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        max-width: 90%;
        text-align: center;
        background: ${isError ? '#dc3545' : '#28a745'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
