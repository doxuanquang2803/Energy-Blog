/**
 * EcoAdmin - Main JavaScript
 */
console.log("EcoAdmin JavaScript loading...");

// Supabase Configuration
let supabaseClient = null;
let supabaseUrl = '';
let supabaseKey = '';

// DOM Elements
let sidebarItems;
let adminSections;
let toastEl;

// Data state
let currentPosts = [];
let currentCategories = [];
let currentStats = [];

// Initialize Admin Panel
function initAdminPanel() {
    console.log("Initializing Admin Panel...");
    sidebarItems = document.querySelectorAll('.sidebar-nav li');
    adminSections = document.querySelectorAll('.admin-section');
    toastEl = document.getElementById('toast');

    try { initNavigation(); console.log("Navigation init OK"); } catch (e) { console.error(e); }
    try { initDragAndDrop(); } catch (e) { console.error(e); }
    try { loadSupabaseSettings(); } catch (e) { console.error(e); }
    try { initAllImageUploads(); } catch (e) { console.error(e); }
    try { initMediaUpload(); } catch (e) { console.error(e); }
    try { initLightbox(); } catch (e) { console.error(e); }
    try { loadHomepageContent(); } catch (e) { console.error(e); }

    // Sliders
    try {
        const opacitySlider = document.getElementById('hero-overlay-opacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                document.getElementById('opacity-val').textContent = e.target.value + '%';
            });
        }

        const colorPicker = document.getElementById('hero-overlay-color');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                document.getElementById('hero-overlay-color-hex').value = e.target.value;
            });
        }
    } catch (e) { console.error(e); }
    console.log("Initialization complete.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}

// --- Navigation ---
function initNavigation() {
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            sidebarItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            const targetId = item.getAttribute('data-target');
            adminSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // Load specific data when tab is opened
            if (targetId === 'blog-management') loadBlogManagement();
            if (targetId === 'media-library' && supabaseClient) loadMediaLibrary();
            if (targetId === 'homepage-content') {
                loadHomepageContent();
                loadStatistics();
            }
            if (targetId === 'about-content') {
                loadAboutContent();
            }
            if (targetId === 'service-content') {
                loadServiceContent();
            }
            if (targetId === 'project-content') {
                loadProjectContent();
            }
            if (targetId === 'header-footer-content') {
                loadHeaderFooterContent();
            }
            if (targetId === 'contact-content') {
                loadContactContent();
            }
        });
    });
}

// --- Drag & Drop ---
function initDragAndDrop() {
    ['homepage-layout-order', 'about-layout-order', 'service-layout-order'].forEach(id => {
        const list = document.getElementById(id);
        if (!list) return;

        let draggedItem = null;

        list.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'LI') {
                draggedItem = e.target;
                setTimeout(() => e.target.style.opacity = '0.5', 0);
            }
        });

        list.addEventListener('dragend', (e) => {
            if (e.target.tagName === 'LI') {
                e.target.style.opacity = '1';
                draggedItem = null;
            }
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            const currentDraggable = list.querySelector('li[style*="opacity: 0.5"]');
            if (currentDraggable) {
                if (afterElement == null) {
                    list.appendChild(currentDraggable);
                } else {
                    list.insertBefore(currentDraggable, afterElement);
                }
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not([style*="opacity: 0.5"])')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Modals ---
function openPostModal() {
    document.getElementById('post-modal').classList.add('active');
}

function openCategoryModal() {
    document.getElementById('category-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.querySelector('.toast-message').textContent = message;

    if (isError) {
        toastEl.style.borderLeftColor = 'var(--danger)';
        toastEl.querySelector('.toast-icon').innerHTML = '<i class="fa-solid fa-circle-exclamation text-danger"></i>';
    } else {
        toastEl.style.borderLeftColor = 'var(--primary-light)';
        toastEl.querySelector('.toast-icon').innerHTML = '<i class="fa-solid fa-check-circle"></i>';
    }

    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// --- Supabase Integration ---
function loadSupabaseSettings() {
    // Check if configuration exists in the external file
    const configUrl = typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.url : '';
    const configKey = typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.anonKey : '';

    if (configUrl && configKey) {
        document.getElementById('supabase-url').value = 'https://[Hidden for Security]';
        document.getElementById('supabase-key').value = '****************************************';
        document.getElementById('supabase-url').disabled = true;
        document.getElementById('supabase-key').disabled = true;
        connectSupabase(configUrl, configKey);
        console.log("Connected to Supabase using external config file.");
        return;
    }

    // Fallback to localStorage
    const savedUrl = localStorage.getItem('eco_supabase_url');
    const savedKey = localStorage.getItem('eco_supabase_key');

    if (savedUrl && savedKey) {
        document.getElementById('supabase-url').value = savedUrl;
        document.getElementById('supabase-key').value = savedKey;
        connectSupabase(savedUrl, savedKey);
    }
}

function saveSupabaseSettings() {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();

    if (!url || !key) {
        showToast("Please provide both URL and Key", true);
        return;
    }

    localStorage.setItem('eco_supabase_url', url);
    localStorage.setItem('eco_supabase_key', key);

    connectSupabase(url, key);
    showToast("Supabase credentials saved & connected");
}

function connectSupabase(url, key) {
    try {
        supabaseClient = window.supabase.createClient(url, key);
        supabaseUrl = url;
        supabaseKey = key;

        const statusEl = document.getElementById('db-status');
        statusEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--primary-light)"></i> Connected to Supabase';
        statusEl.style.color = "var(--primary-light)";

        // Initial data load
        loadHomepageContent();
    } catch (error) {
        console.error("Supabase connection error:", error);
        showToast("Failed to connect to Supabase. Check credentials.", true);
    }
}

async function testSupabaseConnection() {
    if (!supabaseClient) {
        showToast("Supabase is not connected. Please save settings first.", true);
        return;
    }

    showToast("Testing database connection...");
    try {
        // Try fetching a single row from homepage_content (or any table) to test credentials and connection
        const { data, error } = await supabaseClient.from('homepage_content').select('id').limit(1);

        if (error) {
            // If the table doesn't exist, the API itself might still be connected and authenticated, but table is missing
            const isSchemaError = error.code === 'PGRST116' ||
                error.message.includes('relation') ||
                error.message.includes('does not exist') ||
                error.message.includes('schema cache') ||
                error.message.includes('Could not find the table');

            if (isSchemaError) {
                showToast("Connected successfully to Supabase!", false);
                const statusEl = document.getElementById('db-status');
                statusEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--primary-light)"></i> Connected (Database active, tables not created)';
                statusEl.style.color = "var(--primary-light)";
                return;
            }
            throw error;
        }

        showToast("Connected successfully to Supabase Database!");
        const statusEl = document.getElementById('db-status');
        statusEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--primary-light)"></i> Connected to Supabase';
        statusEl.style.color = "var(--primary-light)";
    } catch (err) {
        console.error(err);
        showToast("Connection failed: " + (err.message || "Invalid credentials"), true);
        const statusEl = document.getElementById('db-status');
        statusEl.innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i> Connection Failed';
        statusEl.style.color = "var(--danger)";
    }
}

// --- Homepage Content ---
// Helper to set element value securely if it exists
function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

// Image Defaults Mapping
const IMAGE_DEFAULTS = {
    hero1: 'img/carousel-1.jpg',
    hero2: 'img/carousel-2.jpg',
    hero3: 'img/carousel-3.jpg',
    about: 'img/about.jpg',
    srv1: 'img/img-600x400-1.jpg',
    srv2: 'img/img-600x400-2.jpg',
    srv3: 'img/img-600x400-3.jpg',
    srv4: 'img/img-600x400-4.jpg',
    srv5: 'img/img-600x400-5.jpg',
    srv6: 'img/img-600x400-6.jpg',
    feat: 'img/feature.jpg',
    quote: 'img/quote.jpg',
    proj1: 'img/img-600x400-6.jpg',
    proj2: 'img/img-600x400-5.jpg',
    proj3: 'img/img-600x400-4.jpg',
    proj4: 'img/img-600x400-3.jpg',
    proj5: 'img/img-600x400-2.jpg',
    proj6: 'img/img-600x400-1.jpg',
    team1: 'img/team-1.jpg',
    team2: 'img/team-2.jpg',
    team3: 'img/team-3.jpg',
    test1: 'img/testimonial-1.jpg',
    test2: 'img/testimonial-2.jpg',
    test3: 'img/testimonial-3.jpg',
    footgal1: 'img/gallery-1.jpg',
    footgal2: 'img/gallery-2.jpg',
    footgal3: 'img/gallery-3.jpg',
    footgal4: 'img/gallery-4.jpg',
    footgal5: 'img/gallery-5.jpg',
    footgal6: 'img/gallery-6.jpg'
};


// Helper to set image preview securely
function setImagePreview(key, url) {
    const previewImg = document.getElementById(`${key}-image-preview`);
    if (previewImg) {
        // Show the active custom image, or fallback to the template default image
        const activeUrl = url && url !== 'null' && url !== 'undefined' && url !== '' ? url : IMAGE_DEFAULTS[key];
        previewImg.src = activeUrl;
        previewImg.setAttribute('src', activeUrl || '');
    }
}

// Helper to get input value securely
function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// Helper to get image preview url securely
function getImageSrc(key) {
    const previewImg = document.getElementById(`${key}-image-preview`);
    return previewImg ? (previewImg.getAttribute('src') || '') : '';
}

// --- Homepage Content ---
function cleanLoadedData(data) {
    if (!data) return {};
    const cleaned = {};
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            cleaned[key] = data[key];
        }
    });
    return cleaned;
}

async function loadHomepageContent() {
    console.log("Loading homepage content...");

    // 0. Always populate with original template defaults first so fields are never empty
    try {
        if (typeof HOMEPAGE_DEFAULTS !== 'undefined') {
            populateHomepageFields(HOMEPAGE_DEFAULTS);
        }
    } catch (e) {
        console.error("Error populating default homepage content:", e);
    }

    // 1. Try loading from LocalStorage first (instant & reliable fallback)
    const localDataStr = localStorage.getItem('eco_homepage_content');
    if (localDataStr) {
        try {
            const localData = JSON.parse(localDataStr);
            const cleanedLocal = cleanLoadedData(localData);
            const mergedLocalData = Object.assign({}, HOMEPAGE_DEFAULTS, cleanedLocal);
            populateHomepageFields(mergedLocalData);
            console.log("Loaded homepage content from LocalStorage fallback.");
        } catch (e) {
            console.error("Error parsing local homepage content:", e);
        }
    }

    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient.from('homepage_content').select('*').single();
        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            // If data contains the serialized content_json column, use that!
            let hpData = data;
            if (data.content_json) {
                hpData = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
            }
            const cleanedDb = cleanLoadedData(hpData);
            const mergedDbData = Object.assign({}, HOMEPAGE_DEFAULTS, cleanedDb);
            populateHomepageFields(mergedDbData);
            console.log("Successfully synchronized homepage content from Supabase DB!");
        }
    } catch (err) {
        console.error("Error loading homepage content from Supabase:", err);
    }
}

function populateHomepageFields(data) {
    if (!data) return;

    // Carousel Slide 1
    setInputValue('hp-hero-title-1', data.hero1_title);
    setInputValue('hp-hero-subtitle-1', data.hero1_subtitle);
    setInputValue('hp-cta-text-1', data.hero1_cta);
    setImagePreview('hero1', data.hero1_img);

    // Carousel Slide 2
    setInputValue('hp-hero-title-2', data.hero2_title);
    setInputValue('hp-hero-subtitle-2', data.hero2_subtitle);
    setInputValue('hp-cta-text-2', data.hero2_cta);
    setImagePreview('hero2', data.hero2_img);

    // Carousel Slide 3
    setInputValue('hp-hero-title-3', data.hero3_title);
    setInputValue('hp-hero-subtitle-3', data.hero3_subtitle);
    setInputValue('hp-cta-text-3', data.hero3_cta);
    setImagePreview('hero3', data.hero3_img);

    // About Us
    setInputValue('hp-about-tagline', data.about_tagline);
    setInputValue('hp-about-title', data.about_title);
    setInputValue('hp-about-desc', data.about_desc);
    setInputValue('hp-about-point-1', data.about_point1);
    setInputValue('hp-about-point-2', data.about_point2);
    setInputValue('hp-about-point-3', data.about_point3);
    setImagePreview('about', data.about_img);

    // Services Main Title
    setInputValue('hp-services-title', data.services_title);

    // Services 1 to 6
    for (let i = 1; i <= 6; i++) {
        setInputValue(`hp-srv-title-${i}`, data[`srv${i}_title`]);
        setInputValue(`hp-srv-desc-${i}`, data[`srv${i}_desc`]);
        setImagePreview(`srv${i}`, data[`srv${i}_img`]);
    }

    // Why Choose Us (Features)
    setInputValue('hp-features-title', data.features_title);
    setInputValue('hp-features-desc', data.features_desc);
    setImagePreview('feat', data.features_img);

    // Free Quote Section
    setInputValue('hp-quote-title', data.quote_title);
    setInputValue('hp-quote-desc', data.quote_desc);
    setImagePreview('quote', data.quote_img);

    // Projects 1 to 6
    for (let i = 1; i <= 6; i++) {
        setInputValue(`hp-proj-title-${i}`, data[`proj${i}_title`]);
        setInputValue(`hp-proj-cat-${i}`, data[`proj${i}_cat`]);
        setImagePreview(`proj${i}`, data[`proj${i}_img`]);
    }

    // Team 1 to 3
    for (let i = 1; i <= 3; i++) {
        setInputValue(`hp-team-name-${i}`, data[`team${i}_name`]);
        setInputValue(`hp-team-role-${i}`, data[`team${i}_role`]);
        setImagePreview(`team${i}`, data[`team${i}_img`]);
    }

    // Testimonials 1 to 3
    for (let i = 1; i <= 3; i++) {
        setInputValue(`hp-test-name-${i}`, data[`test${i}_name`]);
        setInputValue(`hp-test-role-${i}`, data[`test${i}_role`]);
        setInputValue(`hp-test-quote-${i}`, data[`test${i}_quote`]);
        setImagePreview(`test${i}`, data[`test${i}_img`]);
    }

    // Footer contact info
    setInputValue('hp-footer-desc', data.footer_desc);
    setInputValue('hp-footer-address', data.footer_address);
    setInputValue('hp-footer-phone', data.footer_phone);
    setInputValue('hp-footer-email', data.footer_email);
    for (let i = 1; i <= 6; i++) {
        setImagePreview(`footgal${i}`, data[`footgal${i}_img`]);
    }

    // Layout Order
    if (data.layout_order && Array.isArray(data.layout_order)) {
        const orderList = document.getElementById('homepage-layout-order');
        if (orderList) {
            orderList.innerHTML = '';
            data.layout_order.forEach(item => {
                const li = document.createElement('li');
                li.draggable = true;
                li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
                orderList.appendChild(li);
            });
            // Re-apply drag event listeners to newly created list items
            initDragAndDrop();
        }
    }

    // Statistics
    if (data.statistics && Array.isArray(data.statistics) && data.statistics.length > 0) {
        const container = document.getElementById('stats-container');
        if (container) {
            container.innerHTML = '';
            data.statistics.forEach(stat => {
                addStatRow(stat.label, stat.value);
            });
        }
    } else {
        loadStatistics();
    }
}

function buildFilteredPayload(id, dataObj) {
    const payload = {
        id: id,
        content_json: dataObj
    };
    const DB_COLUMNS = [
        'hero1_title', 'hero1_subtitle', 'hero1_cta', 'hero1_img',
        'hero2_title', 'hero2_subtitle', 'hero2_cta', 'hero2_img',
        'hero3_title', 'hero3_subtitle', 'hero3_cta', 'hero3_img',
        'about_tagline', 'about_title', 'about_desc', 'about_point1', 'about_point2', 'about_point3', 'about_img',
        'services_title', 'srv1_title', 'srv1_desc', 'srv1_img', 'srv2_title', 'srv2_desc', 'srv2_img', 'srv3_title', 'srv3_desc', 'srv3_img', 'srv4_title', 'srv4_desc', 'srv4_img', 'srv5_title', 'srv5_desc', 'srv5_img', 'srv6_title', 'srv6_desc', 'srv6_img',
        'features_title', 'features_desc', 'features_img',
        'quote_title', 'quote_desc', 'quote_img',
        'layout_order', 'statistics'
    ];
    DB_COLUMNS.forEach(col => {
        if (dataObj[col] !== undefined) {
            payload[col] = dataObj[col];
        }
    });
    return payload;
}

async function saveAllHomepageContent(silent = false) {
    // 1. Gather all homepage data from inputs
    const hpData = {
        // Slide 1
        hero1_title: getInputValue('hp-hero-title-1'),
        hero1_subtitle: getInputValue('hp-hero-subtitle-1'),
        hero1_cta: getInputValue('hp-cta-text-1'),
        hero1_img: getImageSrc('hero1'),

        // Slide 2
        hero2_title: getInputValue('hp-hero-title-2'),
        hero2_subtitle: getInputValue('hp-hero-subtitle-2'),
        hero2_cta: getInputValue('hp-cta-text-2'),
        hero2_img: getImageSrc('hero2'),

        // Slide 3
        hero3_title: getInputValue('hp-hero-title-3'),
        hero3_subtitle: getInputValue('hp-hero-subtitle-3'),
        hero3_cta: getInputValue('hp-cta-text-3'),
        hero3_img: getImageSrc('hero3'),

        // About Us
        about_tagline: getInputValue('hp-about-tagline'),
        about_title: getInputValue('hp-about-title'),
        about_desc: getInputValue('hp-about-desc'),
        about_point1: getInputValue('hp-about-point-1'),
        about_point2: getInputValue('hp-about-point-2'),
        about_point3: getInputValue('hp-about-point-3'),
        about_img: getImageSrc('about'),

        // Services
        services_title: getInputValue('hp-services-title'),
        srv1_title: getInputValue('hp-srv-title-1'),
        srv1_desc: getInputValue('hp-srv-desc-1'),
        srv1_img: getImageSrc('srv1'),

        srv2_title: getInputValue('hp-srv-title-2'),
        srv2_desc: getInputValue('hp-srv-desc-2'),
        srv2_img: getImageSrc('srv2'),

        srv3_title: getInputValue('hp-srv-title-3'),
        srv3_desc: getInputValue('hp-srv-desc-3'),
        srv3_img: getImageSrc('srv3'),

        srv4_title: getInputValue('hp-srv-title-4'),
        srv4_desc: getInputValue('hp-srv-desc-4'),
        srv4_img: getImageSrc('srv4'),

        srv5_title: getInputValue('hp-srv-title-5'),
        srv5_desc: getInputValue('hp-srv-desc-5'),
        srv5_img: getImageSrc('srv5'),

        srv6_title: getInputValue('hp-srv-title-6'),
        srv6_desc: getInputValue('hp-srv-desc-6'),
        srv6_img: getImageSrc('srv6'),

        // Features
        features_title: getInputValue('hp-features-title'),
        features_desc: getInputValue('hp-features-desc'),
        features_img: getImageSrc('feat'),

        // Free Quote
        quote_title: getInputValue('hp-quote-title'),
        quote_desc: getInputValue('hp-quote-desc'),
        quote_img: getImageSrc('quote'),

        // Projects
        proj1_title: getInputValue('hp-proj-title-1'), proj1_cat: getInputValue('hp-proj-cat-1'), proj1_img: getImageSrc('proj1'),
        proj2_title: getInputValue('hp-proj-title-2'), proj2_cat: getInputValue('hp-proj-cat-2'), proj2_img: getImageSrc('proj2'),
        proj3_title: getInputValue('hp-proj-title-3'), proj3_cat: getInputValue('hp-proj-cat-3'), proj3_img: getImageSrc('proj3'),
        proj4_title: getInputValue('hp-proj-title-4'), proj4_cat: getInputValue('hp-proj-cat-4'), proj4_img: getImageSrc('proj4'),
        proj5_title: getInputValue('hp-proj-title-5'), proj5_cat: getInputValue('hp-proj-cat-5'), proj5_img: getImageSrc('proj5'),
        proj6_title: getInputValue('hp-proj-title-6'), proj6_cat: getInputValue('hp-proj-cat-6'), proj6_img: getImageSrc('proj6'),

        // Team
        team1_name: getInputValue('hp-team-name-1'), team1_role: getInputValue('hp-team-role-1'), team1_img: getImageSrc('team1'),
        team2_name: getInputValue('hp-team-name-2'), team2_role: getInputValue('hp-team-role-2'), team2_img: getImageSrc('team2'),
        team3_name: getInputValue('hp-team-name-3'), team3_role: getInputValue('hp-team-role-3'), team3_img: getImageSrc('team3'),

        // Testimonials
        test1_name: getInputValue('hp-test-name-1'), test1_role: getInputValue('hp-test-role-1'), test1_quote: getInputValue('hp-test-quote-1'), test1_img: getImageSrc('test1'),
        test2_name: getInputValue('hp-test-name-2'), test2_role: getInputValue('hp-test-role-2'), test2_quote: getInputValue('hp-test-quote-2'), test2_img: getImageSrc('test2'),
        test3_name: getInputValue('hp-test-name-3'), test3_role: getInputValue('hp-test-role-3'), test3_quote: getInputValue('hp-test-quote-3'), test3_img: getImageSrc('test3'),

        // Footer Contact
        footer_desc: getInputValue('hp-footer-desc'),
        footer_address: getInputValue('hp-footer-address'),
        footer_phone: getInputValue('hp-footer-phone'),
        footer_email: getInputValue('hp-footer-email'),
        footgal1_img: getImageSrc('footgal1'),
        footgal2_img: getImageSrc('footgal2'),
        footgal3_img: getImageSrc('footgal3'),
        footgal4_img: getImageSrc('footgal4'),
        footgal5_img: getImageSrc('footgal5'),
        footgal6_img: getImageSrc('footgal6'),

        // Layout Order
        layout_order: Array.from(document.querySelectorAll('#homepage-layout-order li')).map(li => li.textContent.trim()),

        // Statistics
        statistics: Array.from(document.querySelectorAll('.stat-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            return {
                label: inputs[0] ? inputs[0].value.trim() : '',
                value: inputs[1] ? inputs[1].value.trim() : ''
            };
        })
    };

    // 2. Persist in LocalStorage (client side instant backup)
    localStorage.setItem('eco_homepage_content', JSON.stringify(hpData));

    // 3. Save to Supabase (if connected)
    if (!supabaseClient) {
        if (!silent) showToast("Homepage content saved locally!");
        return;
    }

    try {
        if (!silent) showToast("Saving to Supabase Database...");

        // Build payload including schema fallback
        const payload = buildFilteredPayload(1, hpData);

        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;

        if (!silent) showToast("Homepage content saved successfully to Supabase!");
    } catch (err) {
        console.error("Error saving content to Supabase:", err);
        if (!silent) showToast("Saved locally. Supabase error: Check your database schema/columns.", true);
        throw err;
    }
}

// Retro-compatible saveContent for other parts of dashboard
async function saveContent(section) {
    if (section === 'homepage_content') {
        await saveAllHomepageContent();
    } else {
        showToast("Saved settings successfully");
    }
}

// Custom Premium Section Saving feedback Micro-interaction
async function saveIndividualSection(sectionKey, btn) {
    if (!btn) return;

    // Store original inner HTML & width to prevent layout shifting inside the button
    const originalHTML = btn.innerHTML;
    const btnWidth = btn.offsetWidth;
    btn.style.width = btnWidth + 'px';

    // Set to premium loading state
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;

    try {
        // Save all data silently
        await saveAllHomepageContent(true);

        // Success feedback
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Updated!`;

        // Restore default state
        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);

    } catch (error) {
        console.error("Failed to save section:", error);

        // Failure feedback
        btn.classList.remove('loading');
        btn.classList.add('danger');
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error!`;

        // Restore default state
        setTimeout(() => {
            btn.classList.remove('danger');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    }
}

// --- Homepage Default Values ---
const HOMEPAGE_DEFAULTS = {
    hero1_title: 'Pioneers Of Solar And Renewable Energy',
    hero1_subtitle: 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.',
    hero1_cta: 'Read More',
    hero1_img: 'img/carousel-1.jpg',

    hero2_title: 'Pioneers Of Solar And Renewable Energy',
    hero2_subtitle: 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.',
    hero2_cta: 'Read More',
    hero2_img: 'img/carousel-2.jpg',

    hero3_title: 'Pioneers Of Solar And Renewable Energy',
    hero3_subtitle: 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.',
    hero3_cta: 'Read More',
    hero3_img: 'img/carousel-3.jpg',

    about_tagline: 'About Us',
    about_title: '25+ Years Experience In Solar & Renewable Energy Industry',
    about_desc: 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet',
    about_point1: 'Diam dolor diam ipsum',
    about_point2: 'Aliqu diam amet diam et eos',
    about_point3: 'Tempor erat elitr rebum at clita',
    about_img: 'img/about.jpg',

    services_title: 'We Are Pioneers In The World Of Renewable Energy',
    srv1_title: 'Solar Panels', srv1_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv1_img: 'img/img-600x400-1.jpg',
    srv2_title: 'Wind Turbines', srv2_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv2_img: 'img/img-600x400-2.jpg',
    srv3_title: 'Hydropower Plants', srv3_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv3_img: 'img/img-600x400-3.jpg',
    srv4_title: 'Solar Panels', srv4_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv4_img: 'img/img-600x400-4.jpg',
    srv5_title: 'Wind Turbines', srv5_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv5_img: 'img/img-600x400-5.jpg',
    srv6_title: 'Hydropower Plants', srv6_desc: 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', srv6_img: 'img/img-600x400-6.jpg',

    features_title: 'Complete Commercial & Residential Solar Systems',
    features_desc: 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet',
    features_img: 'img/feature.jpg',

    quote_title: 'Get A Free Quote',
    quote_desc: 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet',
    quote_img: 'img/quote.jpg',

    proj1_title: 'We Are pioneers of solar & renewable energy industry', proj1_cat: 'Solar Panels', proj1_img: 'img/img-600x400-6.jpg',
    proj2_title: 'We Are pioneers of solar & renewable energy industry', proj2_cat: 'Wind Turbines', proj2_img: 'img/img-600x400-5.jpg',
    proj3_title: 'We Are pioneers of solar & renewable energy industry', proj3_cat: 'Hydropower Plants', proj3_img: 'img/img-600x400-4.jpg',
    proj4_title: 'We Are pioneers of solar & renewable energy industry', proj4_cat: 'Solar Panels', proj4_img: 'img/img-600x400-3.jpg',
    proj5_title: 'We Are pioneers of solar & renewable energy industry', proj5_cat: 'Wind Turbines', proj5_img: 'img/img-600x400-2.jpg',
    proj6_title: 'We Are pioneers of solar & renewable energy industry', proj6_cat: 'Hydropower Plants', proj6_img: 'img/img-600x400-1.jpg',

    team1_name: 'Full Name', team1_role: 'Designation', team1_img: 'img/team-1.jpg',
    team2_name: 'Full Name', team2_role: 'Designation', team2_img: 'img/team-2.jpg',
    team3_name: 'Full Name', team3_role: 'Designation', team3_img: 'img/team-3.jpg',

    test1_name: 'Client Name', test1_role: 'Profession', test1_quote: 'Clita stet dolor ipsum duo. Magna stet gubergren dolores gubergren elitr elitr magna sea.', test1_img: 'img/testimonial-1.jpg',
    test2_name: 'Client Name', test2_role: 'Profession', test2_quote: 'Clita stet dolor ipsum duo. Magna stet gubergren dolores gubergren elitr elitr magna sea.', test2_img: 'img/testimonial-2.jpg',
    test3_name: 'Client Name', test3_role: 'Profession', test3_quote: 'Clita stet dolor ipsum duo. Magna stet gubergren dolores gubergren elitr elitr magna sea.', test3_img: 'img/testimonial-3.jpg',

    footer_desc: 'Dolor amet sit justo amet elitr clita ipsum elitr est.',
    footer_address: '123 Street, New York, USA',
    footer_phone: '+012 345 67890',
    footer_email: 'info@example.com',
    footgal1_img: 'img/gallery-1.jpg',
    footgal2_img: 'img/gallery-2.jpg',
    footgal3_img: 'img/gallery-3.jpg',
    footgal4_img: 'img/gallery-4.jpg',
    footgal5_img: 'img/gallery-5.jpg',
    footgal6_img: 'img/gallery-6.jpg',

    layout_order: [
        "Hero Banner Carousel",
        "Statistics Counter",
        "About Us Section",
        "Our Services",
        "Why Choose Us (Features)",
        "Project Gallery",
        "Free Quote Section"
    ],
    statistics: [
        { label: 'Happy Customers', value: '3453' },
        { label: 'Project Done', value: '4234' },
        { label: 'Awards Win', value: '3123' },
        { label: 'Expert Workers', value: '1831' }
    ]
};

async function resetAllHomepageContent() {
    if (!confirm("Are you sure you want to restore all homepage content to original default values? This will replace your current edits.")) {
        return;
    }

    try {
        showToast("Restoring default values...");
        populateHomepageFields(HOMEPAGE_DEFAULTS);
        localStorage.setItem('eco_homepage_content', JSON.stringify(HOMEPAGE_DEFAULTS));

        if (supabaseClient) {
            const payload = buildFilteredPayload(1, HOMEPAGE_DEFAULTS);
            const { error } = await supabaseClient.from('homepage_content').upsert(payload);
            if (error) throw error;
            showToast("Default values restored & saved to Supabase successfully!");
        } else {
            showToast("Default values restored locally successfully!");
        }
    } catch (err) {
        console.error("Error resetting defaults:", err);
        showToast("Error resetting default values", true);
    }
}

async function resetSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section to original default template values?`)) {
        return;
    }

    try {
        showToast(`Resetting ${sectionKey} section...`);

        if (sectionKey === 'layout') {
            const orderList = document.getElementById('homepage-layout-order');
            if (orderList) {
                orderList.innerHTML = '';
                HOMEPAGE_DEFAULTS.layout_order.forEach(item => {
                    const li = document.createElement('li');
                    li.draggable = true;
                    li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
                    orderList.appendChild(li);
                });
                initDragAndDrop();
            }
        } else if (sectionKey === 'carousel') {
            // Slide 1
            setInputValue('hp-hero-title-1', HOMEPAGE_DEFAULTS.hero1_title);
            setInputValue('hp-hero-subtitle-1', HOMEPAGE_DEFAULTS.hero1_subtitle);
            setInputValue('hp-cta-text-1', HOMEPAGE_DEFAULTS.hero1_cta);
            setImagePreview('hero1', HOMEPAGE_DEFAULTS.hero1_img);
            // Slide 2
            setInputValue('hp-hero-title-2', HOMEPAGE_DEFAULTS.hero2_title);
            setInputValue('hp-hero-subtitle-2', HOMEPAGE_DEFAULTS.hero2_subtitle);
            setInputValue('hp-cta-text-2', HOMEPAGE_DEFAULTS.hero2_cta);
            setImagePreview('hero2', HOMEPAGE_DEFAULTS.hero2_img);
            // Slide 3
            setInputValue('hp-hero-title-3', HOMEPAGE_DEFAULTS.hero3_title);
            setInputValue('hp-hero-subtitle-3', HOMEPAGE_DEFAULTS.hero3_subtitle);
            setInputValue('hp-cta-text-3', HOMEPAGE_DEFAULTS.hero3_cta);
            setImagePreview('hero3', HOMEPAGE_DEFAULTS.hero3_img);

        } else if (sectionKey === 'about') {
            setInputValue('hp-about-tagline', HOMEPAGE_DEFAULTS.about_tagline);
            setInputValue('hp-about-title', HOMEPAGE_DEFAULTS.about_title);
            setInputValue('hp-about-desc', HOMEPAGE_DEFAULTS.about_desc);
            setInputValue('hp-about-point-1', HOMEPAGE_DEFAULTS.about_point1);
            setInputValue('hp-about-point-2', HOMEPAGE_DEFAULTS.about_point2);
            setInputValue('hp-about-point-3', HOMEPAGE_DEFAULTS.about_point3);
            setImagePreview('about', HOMEPAGE_DEFAULTS.about_img);

        } else if (sectionKey === 'services') {
            setInputValue('hp-services-title', HOMEPAGE_DEFAULTS.services_title);
            for (let i = 1; i <= 6; i++) {
                setInputValue(`hp-srv-title-${i}`, HOMEPAGE_DEFAULTS[`srv${i}_title`]);
                setInputValue(`hp-srv-desc-${i}`, HOMEPAGE_DEFAULTS[`srv${i}_desc`]);
                setImagePreview(`srv${i}`, HOMEPAGE_DEFAULTS[`srv${i}_img`]);
            }

        } else if (sectionKey === 'features') {
            setInputValue('hp-features-title', HOMEPAGE_DEFAULTS.features_title);
            setInputValue('hp-features-desc', HOMEPAGE_DEFAULTS.features_desc);
            setImagePreview('feat', HOMEPAGE_DEFAULTS.features_img);

        } else if (sectionKey === 'quote') {
            setInputValue('hp-quote-title', HOMEPAGE_DEFAULTS.quote_title);
            setInputValue('hp-quote-desc', HOMEPAGE_DEFAULTS.quote_desc);
            setImagePreview('quote', HOMEPAGE_DEFAULTS.quote_img);

        } else if (sectionKey === 'stats') {
            const container = document.getElementById('stats-container');
            if (container) {
                container.innerHTML = '';
                HOMEPAGE_DEFAULTS.statistics.forEach(stat => {
                    addStatRow(stat.label, stat.value);
                });
            }
        } else if (sectionKey === 'projects') {
            for (let i = 1; i <= 6; i++) {
                setInputValue(`hp-proj-title-${i}`, HOMEPAGE_DEFAULTS[`proj${i}_title`]);
                setInputValue(`hp-proj-cat-${i}`, HOMEPAGE_DEFAULTS[`proj${i}_cat`]);
                setImagePreview(`proj${i}`, HOMEPAGE_DEFAULTS[`proj${i}_img`]);
            }
        } else if (sectionKey === 'team') {
            for (let i = 1; i <= 3; i++) {
                setInputValue(`hp-team-name-${i}`, HOMEPAGE_DEFAULTS[`team${i}_name`]);
                setInputValue(`hp-team-role-${i}`, HOMEPAGE_DEFAULTS[`team${i}_role`]);
                setImagePreview(`team${i}`, HOMEPAGE_DEFAULTS[`team${i}_img`]);
            }
        } else if (sectionKey === 'testimonials') {
            for (let i = 1; i <= 3; i++) {
                setInputValue(`hp-test-name-${i}`, HOMEPAGE_DEFAULTS[`test${i}_name`]);
                setInputValue(`hp-test-role-${i}`, HOMEPAGE_DEFAULTS[`test${i}_role`]);
                setInputValue(`hp-test-quote-${i}`, HOMEPAGE_DEFAULTS[`test${i}_quote`]);
                setImagePreview(`test${i}`, HOMEPAGE_DEFAULTS[`test${i}_img`]);
            }
        } else if (sectionKey === 'footer') {
            setInputValue('hp-footer-desc', HOMEPAGE_DEFAULTS.footer_desc);
            setInputValue('hp-footer-address', HOMEPAGE_DEFAULTS.footer_address);
            setInputValue('hp-footer-phone', HOMEPAGE_DEFAULTS.footer_phone);
            setInputValue('hp-footer-email', HOMEPAGE_DEFAULTS.footer_email);
            for (let i = 1; i <= 6; i++) {
                setImagePreview(`footgal${i}`, HOMEPAGE_DEFAULTS[`footgal${i}_img`]);
            }
        }

        // Save progress locally and on DB
        await saveAllHomepageContent();
        showToast(`Section '${sectionKey}' reset successfully!`);
    } catch (err) {
        console.error(`Error resetting section ${sectionKey}:`, err);
        showToast(`Error resetting ${sectionKey} section`, true);
    }
}

async function resetIndividualSlide(slideNum) {
    if (!confirm(`Are you sure you want to restore Slide ${slideNum} to original default template values?`)) {
        return;
    }
    try {
        showToast(`Resetting Slide ${slideNum}...`);
        setInputValue(`hp-hero-title-${slideNum}`, HOMEPAGE_DEFAULTS[`hero${slideNum}_title`]);
        setInputValue(`hp-hero-subtitle-${slideNum}`, HOMEPAGE_DEFAULTS[`hero${slideNum}_subtitle`]);
        setInputValue(`hp-cta-text-${slideNum}`, HOMEPAGE_DEFAULTS[`hero${slideNum}_cta`]);
        setImagePreview(`hero${slideNum}`, HOMEPAGE_DEFAULTS[`hero${slideNum}_img`]);

        await saveAllHomepageContent(true);
        showToast(`Slide ${slideNum} reset successfully!`);
    } catch (e) {
        console.error(e);
        showToast(`Error resetting Slide ${slideNum}`, true);
    }
}

// --- Posts Management ---
async function loadPosts() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        currentPosts = data;
        renderPosts();
    } catch (err) {
        console.error("Error loading posts:", err);
    }
}

function renderPosts() {
    const tbody = document.getElementById('posts-table-body');
    tbody.innerHTML = '';

    if (currentPosts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No posts found.</td></tr>`;
        return;
    }

    currentPosts.forEach(post => {
        const date = new Date(post.created_at || Date.now()).toLocaleDateString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${post.title}</strong></td>
            <td>${post.category || 'Uncategorized'}</td>
            <td><span class="badge-status status-${post.status}">${post.status}</span></td>
            <td>${date}</td>
            <td class="action-btns">
                <button class="icon-btn" onclick="editPost('${post.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn delete" onclick="deletePost('${post.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function savePost() {
    if (!supabaseClient) return;

    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const status = document.getElementById('post-status').value;
    const content = document.getElementById('post-content').value;
    const thumbnail = document.getElementById('post-thumbnail').value;

    if (!title) {
        showToast("Title is required", true);
        return;
    }

    try {
        const postData = { title, category, status, content, thumbnail_url: thumbnail };
        const { error } = await supabaseClient.from('posts').insert([postData]);
        if (error) throw error;

        showToast("Post saved successfully");
        closeModal('post-modal');
        loadPosts();

        // Reset form
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
    } catch (err) {
        console.error(err);
        showToast("Error saving post", true);
    }
}

async function deletePost(id) {
    if (!supabaseClient || !confirm("Are you sure you want to delete this post?")) return;

    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', id);
        if (error) throw error;
        showToast("Post deleted");
        loadPosts();
    } catch (err) {
        console.error(err);
        showToast("Error deleting post", true);
    }
}

// --- Category Management ---
async function loadCategories() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('categories').select('*');
        if (error) throw error;

        currentCategories = data;
        renderCategories();
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    currentCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-card';
        div.innerHTML = `
            <div>
                <div class="category-header">
                    <h4>${cat.name}</h4>
                    <div class="action-btns">
                        <button class="icon-btn delete" onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <p class="category-desc">${cat.description || 'No description provided.'}</p>
            </div>
        `;
        grid.appendChild(div);
    });
}

async function saveCategory() {
    if (!supabaseClient) return;
    const name = document.getElementById('cat-name').value;
    const desc = document.getElementById('cat-desc').value;

    if (!name) {
        showToast("Category name is required", true);
        return;
    }

    try {
        const { error } = await supabaseClient.from('categories').insert([{ name, description: desc }]);
        if (error) throw error;

        showToast("Category added");
        closeModal('category-modal');
        loadCategories();
    } catch (err) {
        console.error(err);
        showToast("Error adding category", true);
    }
}

async function deleteCategory(id) {
    if (!supabaseClient || !confirm("Delete this category?")) return;
    try {
        const { error } = await supabaseClient.from('categories').delete().eq('id', id);
        if (error) throw error;
        showToast("Category deleted");
        loadCategories();
    } catch (err) {
        console.error(err);
        showToast("Error deleting category", true);
    }
}

// --- Image Upload (Hero & Media Library) ---
const IMAGE_KEYS = [
    'hero1', 'hero2', 'hero3', 'about', 'feat', 'quote', 
    'srv1', 'srv2', 'srv3', 'srv4', 'srv5', 'srv6',
    'proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6',
    'team1', 'team2', 'team3',
    'test1', 'test2', 'test3',
    'footgal1', 'footgal2', 'footgal3', 'footgal4', 'footgal5', 'footgal6',
    'ab-banner', 'ab-about', 'ab-team1', 'ab-team2', 'ab-team3',
    'sv-banner', 'sv-srv1', 'sv-srv2', 'sv-srv3', 'sv-srv4', 'sv-srv5', 'sv-srv6', 'sv-features', 'sv-test1', 'sv-test2', 'sv-test3',
    'pj-banner', 'project-form', 'pj-quote'
];

function initAllImageUploads() {
    IMAGE_KEYS.forEach(key => {
        try {
            initCustomImageUpload(key);
        } catch (e) {
            console.error(`Error initializing upload for ${key}:`, e);
        }
    });
}

function initCustomImageUpload(key) {
    const dropzone = document.getElementById(`${key}-image-dropzone`);
    const input = document.getElementById(`${key}-image-input`);

    if (!dropzone || !input) return;

    // Prevent propagation when the file input is clicked directly or programmatically
    // to avoid bubbling up to the dropzone and causing double-triggering or focus conflicts.
    dropzone.addEventListener('click', (e) => {
        if (e.target === input) return;
        input.click();
    });

    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary-color)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border-color)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length) {
            handleImageUpload(key, e.dataTransfer.files[0]);
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(key, e.target.files[0]);
        }
    });
}

let activeUploadsCount = 0;

function updateSaveButtonsState() {
    const saveButtons = document.querySelectorAll('.btn-save-section, .btn-save, .btn-primary');
    saveButtons.forEach(btn => {
        if (activeUploadsCount > 0) {
            btn.disabled = true;
            if (!btn.dataset.originalText) {
                btn.dataset.originalText = btn.innerHTML;
            }
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading Image...`;
        } else {
            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                btn.removeAttribute('data-original-text');
            }
        }
    });
}

async function handleImageUpload(key, file) {
    activeUploadsCount++;
    updateSaveButtonsState();

    // Generate local preview immediately for great responsive UX
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById(`${key}-image-preview`);
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.setAttribute('src', e.target.result);
        }
    };
    reader.readAsDataURL(file);

    if (!supabaseClient) {
        showToast("Connected locally! (Connect Supabase to upload to cloud)");
        activeUploadsCount--;
        updateSaveButtonsState();
        return;
    }

    try {
        showToast("Uploading image to Supabase...");
        const fileExt = file.name.split('.').pop();
        const fileName = `${key}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabaseClient.storage.from('media').upload(`homepage/${fileName}`, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabaseClient.storage.from('media').getPublicUrl(`homepage/${fileName}`);

        const previewImg = document.getElementById(`${key}-image-preview`);
        if (previewImg) {
            previewImg.src = publicUrl;
            previewImg.setAttribute('src', publicUrl);
        }

        showToast("Image uploaded successfully to Supabase Storage");
    } catch (err) {
        console.error(err);
        showToast("Cloud upload failed: " + (err.message || 'Unknown error') + ". Using local preview.", true);
    } finally {
        activeUploadsCount--;
        updateSaveButtonsState();
    }
}

function removeImage(key) {
    const previewImg = document.getElementById(`${key}-image-preview`);
    if (previewImg) {
        previewImg.src = '';
        previewImg.removeAttribute('src');
    }

    const previewContainer = document.getElementById(`${key}-preview-container`);
    if (previewContainer) previewContainer.style.display = 'none';

    const dropzone = document.getElementById(`${key}-image-dropzone`);
    if (dropzone) dropzone.style.display = 'block';
}

function initMediaUpload() {
    const input = document.getElementById('library-upload-input');
    if (input) {
        input.addEventListener('change', async (e) => {
            if (!supabaseClient) {
                showToast("Connect Supabase first", true);
                return;
            }

            for (let file of e.target.files) {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `media-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { error } = await supabaseClient.storage.from('media').upload(fileName, file);
                    if (error) throw error;
                } catch (err) {
                    console.error("Upload error for " + file.name, err);
                }
            }

            showToast("Upload complete");
            loadMediaLibrary();
        });
    }
}

async function loadMediaLibrary() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.storage.from('media').list();
        if (error) throw error;

        const gallery = document.getElementById('media-gallery');
        gallery.innerHTML = '';

        // Filter out empty placeholder items that sometimes appear in Supabase storage list
        const files = data.filter(item => item.name !== '.emptyFolderPlaceholder');

        for (let file of files) {
            const { data: { publicUrl } } = supabaseClient.storage.from('media').getPublicUrl(file.name);

            const div = document.createElement('div');
            div.className = 'media-item';
            div.innerHTML = `
                <img src="${publicUrl}" alt="${file.name}" loading="lazy">
                <div class="media-overlay">
                    <button onclick="navigator.clipboard.writeText('${publicUrl}'); showToast('URL Copied!')" title="Copy URL">
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteMedia('${file.name}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            gallery.appendChild(div);
        }
    } catch (err) {
        console.error("Error loading media:", err);
    }
}

async function deleteMedia(fileName) {
    if (!supabaseClient || !confirm("Delete this image?")) return;
    try {
        const { error } = await supabaseClient.storage.from('media').remove([fileName]);
        if (error) throw error;
        showToast("Image deleted");
        loadMediaLibrary();
    } catch (err) {
        console.error(err);
        showToast("Error deleting image", true);
    }
}

// --- Statistics ---
function loadStatistics() {
    // Render static for demo if no DB
    const container = document.getElementById('stats-container');
    if (container.children.length === 0) {
        addStatRow('Happy Customers', '3453');
        addStatRow('Project Done', '4234');
        addStatRow('Awards Win', '3123');
        addStatRow('Expert Workers', '1831');
    }
}

function addStatRow(label = '', value = '') {
    const container = document.getElementById('stats-container');
    const div = document.createElement('div');
    div.className = 'card form-card stat-row';
    div.innerHTML = `
        <div class="form-group">
            <label>Statistic Label</label>
            <input type="text" value="${label}" placeholder="e.g. Trees Planted">
        </div>
        <div class="form-group mb-0">
            <label>Statistic Value</label>
            <input type="text" value="${value}" placeholder="e.g. 5.2 Million">
        </div>
        <button class="btn btn-danger btn-sm mt-3" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-trash"></i> Remove
        </button>
    `;
    container.appendChild(div);
}

// --- Elegant Lightbox Modal for Images ---
function initLightbox() {
    // Check if lightbox already exists, if not, create it
    let lightbox = document.getElementById('admin-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'admin-lightbox';
        lightbox.className = 'lightbox-modal';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <img class="lightbox-content" id="lightbox-img" src="" alt="Zoomed Image">
            <div class="lightbox-caption" id="lightbox-caption"></div>
        `;
        document.body.appendChild(lightbox);

        // Close on clicking X
        lightbox.querySelector('.lightbox-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });

        // Close on clicking backdrop/empty area (anywhere except the image itself)
        lightbox.addEventListener('click', (e) => {
            if (e.target !== document.getElementById('lightbox-img')) {
                closeLightbox();
            }
        });

        // Close on pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        });
    }

    // Attach click listener to all comparison images and reference previews
    document.addEventListener('click', (e) => {
        // Target images inside comparison grid or container
        if (e.target.tagName === 'IMG' &&
            (e.target.closest('.image-comparison-grid') || e.target.classList.contains('ref-thumbnail'))) {

            e.preventDefault();
            e.stopPropagation();
            const src = e.target.src;
            const alt = e.target.alt || "Image Preview";
            openLightbox(src, alt);
        }
    });
}

function openLightbox(src, alt) {
    const lightbox = document.getElementById('admin-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        if (lightboxCaption) {
            lightboxCaption.textContent = alt;
        }
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden'; // prevent scrolling behind lightbox
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('admin-lightbox');
    if (lightbox) {
        lightbox.classList.remove('show');
        document.body.style.overflow = ''; // restore scrolling
    }
}

// --- About Page Customization ---
const ABOUT_DEFAULTS = {
    banner_title: "About Us",
    banner_img: "img/carousel-1.jpg",
    stat1_lbl: "Happy Customers",
    stat1_val: "3453",
    stat2_lbl: "Project Done",
    stat2_val: "4234",
    stat3_lbl: "Awards Win",
    stat3_val: "3123",
    stat4_lbl: "Expert Workers",
    stat4_val: "1831",
    about_tagline: "About Us",
    about_title: "25+ Years Experience In Solar & Renewable Energy Industry",
    about_desc: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet",
    about_point1: "Diam dolor diam ipsum",
    about_point2: "Aliqu diam amet diam et eos",
    about_point3: "Tempor erat elitr rebum at clita",
    about_img: "img/about.jpg",
    team1_name: "Full Name", team1_role: "Designation", team1_img: "img/team-1.jpg",
    team2_name: "Full Name", team2_role: "Designation", team2_img: "img/team-2.jpg",
    team3_name: "Full Name", team3_role: "Designation", team3_img: "img/team-3.jpg",
    layout_order: ["Statistics Counter", "About Us Section", "Our Team"]
};

async function loadAboutContent() {
    console.log("Loading about page content...");
    
    // Populate defaults first
    populateAboutFields(ABOUT_DEFAULTS);

    // Try LocalStorage
    const localDataStr = localStorage.getItem('eco_about_content');
    if (localDataStr) {
        try {
            const localData = JSON.parse(localDataStr);
            const merged = Object.assign({}, ABOUT_DEFAULTS, localData);
            populateAboutFields(merged);
            console.log("Loaded about content from LocalStorage fallback.");
        } catch (e) {
            console.error("Error parsing local about content:", e);
        }
    }

    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient.from('homepage_content').select('*').eq('id', 2).maybeSingle();
        if (error) throw error;

        if (data) {
            let abData = data.content_json || data;
            if (typeof abData === 'string') abData = JSON.parse(abData);
            const merged = Object.assign({}, ABOUT_DEFAULTS, abData);
            populateAboutFields(merged);
            console.log("Successfully synchronized about content from Supabase DB!");
        }
    } catch (err) {
        console.error("Error loading about content from Supabase:", err);
    }
}

function populateAboutFields(data) {
    if (!data) return;
    setInputValue('ab-banner-title', data.banner_title);
    setImagePreview('ab-banner', data.banner_img);

    setInputValue('ab-stat1-lbl', data.stat1_lbl);
    setInputValue('ab-stat1-val', data.stat1_val);
    setInputValue('ab-stat2-lbl', data.stat2_lbl);
    setInputValue('ab-stat2-val', data.stat2_val);
    setInputValue('ab-stat3-lbl', data.stat3_lbl);
    setInputValue('ab-stat3-val', data.stat3_val);
    setInputValue('ab-stat4-lbl', data.stat4_lbl);
    setInputValue('ab-stat4-val', data.stat4_val);

    setInputValue('ab-about-tagline', data.about_tagline);
    setInputValue('ab-about-title', data.about_title);
    setInputValue('ab-about-desc', data.about_desc);
    setInputValue('ab-about-point-1', data.about_point1);
    setInputValue('ab-about-point-2', data.about_point2);
    setInputValue('ab-about-point-3', data.about_point3);
    setImagePreview('ab-about', data.about_img);

    setInputValue('ab-team1-name', data.team1_name);
    setInputValue('ab-team1-role', data.team1_role);
    setImagePreview('ab-team1', data.team1_img);

    setInputValue('ab-team2-name', data.team2_name);
    setInputValue('ab-team2-role', data.team2_role);
    setImagePreview('ab-team2', data.team2_img);

    setInputValue('ab-team3-name', data.team3_name);
    setInputValue('ab-team3-role', data.team3_role);
    setImagePreview('ab-team3', data.team3_img);

    // Layout Order
    if (data.layout_order && Array.isArray(data.layout_order)) {
        const orderList = document.getElementById('about-layout-order');
        if (orderList) {
            orderList.innerHTML = '';
            data.layout_order.forEach(item => {
                const li = document.createElement('li');
                li.draggable = true;
                li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
                orderList.appendChild(li);
            });
            initDragAndDrop();
        }
    }
}

async function saveAboutContent() {
    const abData = {
        banner_title: getInputValue('ab-banner-title'),
        banner_img: getImageSrc('ab-banner'),

        stat1_lbl: getInputValue('ab-stat1-lbl'),
        stat1_val: getInputValue('ab-stat1-val'),
        stat2_lbl: getInputValue('ab-stat2-lbl'),
        stat2_val: getInputValue('ab-stat2-val'),
        stat3_lbl: getInputValue('ab-stat3-lbl'),
        stat3_val: getInputValue('ab-stat3-val'),
        stat4_lbl: getInputValue('ab-stat4-lbl'),
        stat4_val: getInputValue('ab-stat4-val'),

        about_tagline: getInputValue('ab-about-tagline'),
        about_title: getInputValue('ab-about-title'),
        about_desc: getInputValue('ab-about-desc'),
        about_point1: getInputValue('ab-about-point-1'),
        about_point2: getInputValue('ab-about-point-2'),
        about_point3: getInputValue('ab-about-point-3'),
        about_img: getImageSrc('ab-about'),

        team1_name: getInputValue('ab-team1-name'),
        team1_role: getInputValue('ab-team1-role'),
        team1_img: getImageSrc('ab-team1'),

        team2_name: getInputValue('ab-team2-name'),
        team2_role: getInputValue('ab-team2-role'),
        team2_img: getImageSrc('ab-team2'),

        team3_name: getInputValue('ab-team3-name'),
        team3_role: getInputValue('ab-team3-role'),
        team3_img: getImageSrc('ab-team3'),

        layout_order: Array.from(document.querySelectorAll('#about-layout-order li')).map(li => li.textContent.trim())
    };

    localStorage.setItem('eco_about_content', JSON.stringify(abData));
    console.log("saveAboutContent: saving abData =", abData);

    if (!supabaseClient) {
        showToast("About page content saved locally!");
        return;
    }

    try {
        showToast("Saving About page to Supabase Database...");
        const payload = {
            id: 2,
            content_json: abData
        };
        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;
        showToast("About page content saved successfully to Supabase!");
    } catch (err) {
        console.error("Error saving about page:", err);
        showToast("Saved locally. Supabase error: " + err.message, true);
    }
}

// --- Service Page Customization ---
const SERVICE_DEFAULTS = {
    banner_title: "Services",
    banner_img: "img/carousel-1.jpg",
    services_title: "We Are Pioneers In The World Of Renewable Energy",
    srv1_title: "Solar Panels", srv1_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv1_img: "img/img-600x400-1.jpg",
    srv2_title: "Wind Turbines", srv2_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv2_img: "img/img-600x400-2.jpg",
    srv3_title: "Hydropower Plants", srv3_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv3_img: "img/img-600x400-3.jpg",
    srv4_title: "Solar Panels", srv4_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv4_img: "img/img-600x400-4.jpg",
    srv5_title: "Wind Turbines", srv5_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv5_img: "img/img-600x400-5.jpg",
    srv6_title: "Hydropower Plants", srv6_desc: "Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.", srv6_img: "img/img-600x400-6.jpg",
    features_title: "Complete Commercial & Residential Solar Systems",
    features_desc: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet",
    features_img: "img/feature.jpg",
    test1_name: "Client Name", test1_role: "Profession", test1_quote: "Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.", test1_img: "img/testimonial-1.jpg",
    test2_name: "Client Name", test2_role: "Profession", test2_quote: "Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.", test2_img: "img/testimonial-2.jpg",
    test3_name: "Client Name", test3_role: "Profession", test3_quote: "Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.", test3_img: "img/testimonial-3.jpg",
    layout_order: ["Our Services", "Why Choose Us (Features)", "Client Testimonials"]
};

async function loadServiceContent() {
    console.log("Loading service page content...");
    populateServiceFields(SERVICE_DEFAULTS);

    const localDataStr = localStorage.getItem('eco_service_content');
    if (localDataStr) {
        try {
            const localData = JSON.parse(localDataStr);
            const merged = Object.assign({}, SERVICE_DEFAULTS, localData);
            populateServiceFields(merged);
            console.log("Loaded service content from LocalStorage fallback.");
        } catch (e) {
            console.error("Error parsing local service content:", e);
        }
    }

    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient.from('homepage_content').select('*').eq('id', 3).maybeSingle();
        if (error) throw error;

        if (data) {
            let svData = data.content_json || data;
            if (typeof svData === 'string') svData = JSON.parse(svData);
            const merged = Object.assign({}, SERVICE_DEFAULTS, svData);
            populateServiceFields(merged);
            console.log("Successfully synchronized service content from Supabase DB!");
        }
    } catch (err) {
        console.error("Error loading service content from Supabase:", err);
    }
}

function populateServiceFields(data) {
    if (!data) return;
    setInputValue('sv-banner-title', data.banner_title);
    setImagePreview('sv-banner', data.banner_img);

    setInputValue('sv-services-title', data.services_title);
    setInputValue('sv-srv1-title', data.srv1_title);
    setInputValue('sv-srv1-desc', data.srv1_desc);
    setImagePreview('sv-srv1', data.srv1_img);

    setInputValue('sv-srv2-title', data.srv2_title);
    setInputValue('sv-srv2-desc', data.srv2_desc);
    setImagePreview('sv-srv2', data.srv2_img);

    setInputValue('sv-srv3-title', data.srv3_title);
    setInputValue('sv-srv3-desc', data.srv3_desc);
    setImagePreview('sv-srv3', data.srv3_img);

    setInputValue('sv-srv4-title', data.srv4_title);
    setInputValue('sv-srv4-desc', data.srv4_desc);
    setImagePreview('sv-srv4', data.srv4_img);

    setInputValue('sv-srv5-title', data.sv5_title || data.srv5_title);
    setInputValue('sv-srv5-desc', data.sv5_desc || data.srv5_desc);
    setImagePreview('sv-srv5', data.sv5_img || data.srv5_img);

    setInputValue('sv-srv6-title', data.sv6_title || data.srv6_title);
    setInputValue('sv-srv6-desc', data.sv6_desc || data.srv6_desc);
    setImagePreview('sv-srv6', data.sv6_img || data.srv6_img);

    setInputValue('sv-features-title', data.features_title);
    setInputValue('sv-features-desc', data.features_desc);
    setImagePreview('sv-features', data.features_img);

    setInputValue('sv-test1-name', data.test1_name);
    setInputValue('sv-test1-role', data.test1_role);
    setInputValue('sv-test1-quote', data.test1_quote);
    setImagePreview('sv-test1', data.test1_img);

    setInputValue('sv-test2-name', data.test2_name);
    setInputValue('sv-test2-role', data.test2_role);
    setInputValue('sv-test2-quote', data.test2_quote);
    setImagePreview('sv-test2', data.test2_img);

    setInputValue('sv-test3-name', data.test3_name);
    setInputValue('sv-test3-role', data.test3_role);
    setInputValue('sv-test3-quote', data.test3_quote);
    setImagePreview('sv-test3', data.test3_img);

    // Layout Order
    if (data.layout_order && Array.isArray(data.layout_order)) {
        const orderList = document.getElementById('service-layout-order');
        if (orderList) {
            orderList.innerHTML = '';
            data.layout_order.forEach(item => {
                const li = document.createElement('li');
                li.draggable = true;
                li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
                orderList.appendChild(li);
            });
            initDragAndDrop();
        }
    }
}

async function saveServiceContent() {
    const svData = {
        banner_title: getInputValue('sv-banner-title'),
        banner_img: getImageSrc('sv-banner'),
        services_title: getInputValue('sv-services-title'),
        srv1_title: getInputValue('sv-srv1-title'),
        srv1_desc: getInputValue('sv-srv1-desc'),
        srv1_img: getImageSrc('sv-srv1'),
        srv2_title: getInputValue('sv-srv2-title'),
        srv2_desc: getInputValue('sv-srv2-desc'),
        srv2_img: getImageSrc('sv-srv2'),
        srv3_title: getInputValue('sv-srv3-title'),
        srv3_desc: getInputValue('sv-srv3-desc'),
        srv3_img: getImageSrc('sv-srv3'),
        srv4_title: getInputValue('sv-srv4-title'),
        srv4_desc: getInputValue('sv-srv4-desc'),
        srv4_img: getImageSrc('sv-srv4'),
        srv5_title: getInputValue('sv-srv5-title'),
        srv5_desc: getInputValue('sv-srv5-desc'),
        srv5_img: getImageSrc('sv-srv5'),
        srv6_title: getInputValue('sv-srv6-title'),
        srv6_desc: getInputValue('sv-srv6-desc'),
        srv6_img: getImageSrc('sv-srv6'),
        features_title: getInputValue('sv-features-title'),
        features_desc: getInputValue('sv-features-desc'),
        features_img: getImageSrc('sv-features'),
        test1_name: getInputValue('sv-test1-name'),
        test1_role: getInputValue('sv-test1-role'),
        test1_quote: getInputValue('sv-test1-quote'),
        test1_img: getImageSrc('sv-test1'),
        test2_name: getInputValue('sv-test2-name'),
        test2_role: getInputValue('sv-test2-role'),
        test2_quote: getInputValue('sv-test2-quote'),
        test2_img: getImageSrc('sv-test2'),
        test3_name: getInputValue('sv-test3-name'),
        test3_role: getInputValue('sv-test3-role'),
        test3_quote: getInputValue('sv-test3-quote'),
        test3_img: getImageSrc('sv-test3'),
        layout_order: Array.from(document.querySelectorAll('#service-layout-order li')).map(li => li.textContent.trim())
    };

    localStorage.setItem('eco_service_content', JSON.stringify(svData));
    console.log("saveServiceContent: saving svData =", svData);

    if (!supabaseClient) {
        showToast("Service page content saved locally!");
        return;
    }

    try {
        showToast("Saving Service page to Supabase Database...");
        const payload = {
            id: 3,
            content_json: svData
        };
        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;
        showToast("Service page content saved successfully to Supabase!");
    } catch (err) {
        console.error("Error saving service page:", err);
        showToast("Saved locally. Supabase error: " + err.message, true);
    }
}

// --- About Page Layout Reordering Functions ---
async function saveAboutLayout(btn) {
    if (btn) btn.disabled = true;
    try {
        const order = Array.from(document.querySelectorAll('#about-layout-order li')).map(li => li.textContent.trim());
        
        // Retrieve current about content or use defaults
        let abData = Object.assign({}, ABOUT_DEFAULTS);
        const localDataStr = localStorage.getItem('eco_about_content');
        if (localDataStr) {
            try {
                Object.assign(abData, JSON.parse(localDataStr));
            } catch (e) {
                console.error(e);
            }
        }
        abData.layout_order = order;
        
        localStorage.setItem('eco_about_content', JSON.stringify(abData));

        if (supabaseClient) {
            showToast("Updating About layout order in Supabase...");
            const { error } = await supabaseClient.from('homepage_content').upsert({
                id: 2,
                content_json: abData
            });
            if (error) throw error;
            showToast("About Page layout order updated successfully!");
        } else {
            showToast("About Page layout order updated locally!");
        }
    } catch (err) {
        console.error(err);
        showToast("Error updating About Page layout order: " + err.message, true);
    } finally {
        if (btn) btn.disabled = false;
    }
}

function resetAboutLayout() {
    if (!confirm("Are you sure you want to reset the About Page section order to default?")) return;
    const orderList = document.getElementById('about-layout-order');
    if (orderList) {
        orderList.innerHTML = '';
        ABOUT_DEFAULTS.layout_order.forEach(item => {
            const li = document.createElement('li');
            li.draggable = true;
            li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
            orderList.appendChild(li);
        });
        initDragAndDrop();
    }
}

// --- Service Page Layout Reordering Functions ---
async function saveServiceLayout(btn) {
    if (btn) btn.disabled = true;
    try {
        const order = Array.from(document.querySelectorAll('#service-layout-order li')).map(li => li.textContent.trim());
        
        // Retrieve current service content or use defaults
        let svData = Object.assign({}, SERVICE_DEFAULTS);
        const localDataStr = localStorage.getItem('eco_service_content');
        if (localDataStr) {
            try {
                Object.assign(svData, JSON.parse(localDataStr));
            } catch (e) {
                console.error(e);
            }
        }
        svData.layout_order = order;
        
        localStorage.setItem('eco_service_content', JSON.stringify(svData));

        if (supabaseClient) {
            showToast("Updating Service layout order in Supabase...");
            const { error } = await supabaseClient.from('homepage_content').upsert({
                id: 3,
                content_json: svData
            });
            if (error) throw error;
            showToast("Service Page layout order updated successfully!");
        } else {
            showToast("Service Page layout order updated locally!");
        }
    } catch (err) {
        console.error(err);
        showToast("Error updating Service Page layout order: " + err.message, true);
    } finally {
        if (btn) btn.disabled = false;
    }
}

function resetServiceLayout() {
    if (!confirm("Are you sure you want to reset the Service Page section order to default?")) return;
    const orderList = document.getElementById('service-layout-order');
    if (orderList) {
        orderList.innerHTML = '';
        SERVICE_DEFAULTS.layout_order.forEach(item => {
            const li = document.createElement('li');
            li.draggable = true;
            li.innerHTML = `<i class="fa-solid fa-grip-vertical"></i> ${item}`;
            orderList.appendChild(li);
        });
        initDragAndDrop();
    }
}

// --- Individual About Page Section Saving & Resetting Functions ---
async function saveIndividualAboutSection(sectionKey, btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    const btnWidth = btn.offsetWidth;
    btn.style.width = btnWidth + 'px';

    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;

    try {
        await saveAboutContent();

        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Updated!`;

        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    } catch (error) {
        console.error("Failed to save About section:", error);
        btn.classList.remove('loading');
        btn.classList.add('danger');
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error!`;
        setTimeout(() => {
            btn.classList.remove('danger');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    }
}

async function resetAboutSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section of the About Page to original default template values?`)) {
        return;
    }

    try {
        showToast(`Resetting About Page ${sectionKey} section...`);

        if (sectionKey === 'layout') {
            resetAboutLayout();
            return;
        } else if (sectionKey === 'banner') {
            setInputValue('ab-banner-title', ABOUT_DEFAULTS.banner_title);
            setImagePreview('ab-banner', ABOUT_DEFAULTS.banner_img);
        } else if (sectionKey === 'stats') {
            setInputValue('ab-stat1-lbl', ABOUT_DEFAULTS.stat1_lbl);
            setInputValue('ab-stat1-val', ABOUT_DEFAULTS.stat1_val);
            setInputValue('ab-stat2-lbl', ABOUT_DEFAULTS.stat2_lbl);
            setInputValue('ab-stat2-val', ABOUT_DEFAULTS.stat2_val);
            setInputValue('ab-stat3-lbl', ABOUT_DEFAULTS.stat3_lbl);
            setInputValue('ab-stat3-val', ABOUT_DEFAULTS.stat3_val);
            setInputValue('ab-stat4-lbl', ABOUT_DEFAULTS.stat4_lbl);
            setInputValue('ab-stat4-val', ABOUT_DEFAULTS.stat4_val);
        } else if (sectionKey === 'about') {
            setInputValue('ab-about-tagline', ABOUT_DEFAULTS.about_tagline);
            setInputValue('ab-about-title', ABOUT_DEFAULTS.about_title);
            setInputValue('ab-about-desc', ABOUT_DEFAULTS.about_desc);
            setInputValue('ab-about-point-1', ABOUT_DEFAULTS.about_point1);
            setInputValue('ab-about-point-2', ABOUT_DEFAULTS.about_point2);
            setInputValue('ab-about-point-3', ABOUT_DEFAULTS.about_point3);
            setImagePreview('ab-about', ABOUT_DEFAULTS.about_img);
        } else if (sectionKey === 'team') {
            setInputValue('ab-team1-name', ABOUT_DEFAULTS.team1_name);
            setInputValue('ab-team1-role', ABOUT_DEFAULTS.team1_role);
            setImagePreview('ab-team1', ABOUT_DEFAULTS.team1_img);

            setInputValue('ab-team2-name', ABOUT_DEFAULTS.team2_name);
            setInputValue('ab-team2-role', ABOUT_DEFAULTS.team2_role);
            setImagePreview('ab-team2', ABOUT_DEFAULTS.team2_img);

            setInputValue('ab-team3-name', ABOUT_DEFAULTS.team3_name);
            setInputValue('ab-team3-role', ABOUT_DEFAULTS.team3_role);
            setImagePreview('ab-team3', ABOUT_DEFAULTS.team3_img);
        }

        // Save progress locally and on DB
        await saveAboutContent();
        showToast(`About Page Section '${sectionKey}' reset successfully!`);
    } catch (err) {
        console.error(`Error resetting About section ${sectionKey}:`, err);
        showToast(`Error resetting About ${sectionKey} section`, true);
    }
}

// --- Individual Service Page Section Saving & Resetting Functions ---
async function saveIndividualServiceSection(sectionKey, btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    const btnWidth = btn.offsetWidth;
    btn.style.width = btnWidth + 'px';

    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;

    try {
        await saveServiceContent();

        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Updated!`;

        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    } catch (error) {
        console.error("Failed to save Service section:", error);
        btn.classList.remove('loading');
        btn.classList.add('danger');
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error!`;
        setTimeout(() => {
            btn.classList.remove('danger');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    }
}

async function resetServiceSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section of the Service Page to original default template values?`)) {
        return;
    }

    try {
        showToast(`Resetting Service Page ${sectionKey} section...`);

        if (sectionKey === 'layout') {
            resetServiceLayout();
            return;
        } else if (sectionKey === 'banner') {
            setInputValue('sv-banner-title', SERVICE_DEFAULTS.banner_title);
            setImagePreview('sv-banner', SERVICE_DEFAULTS.banner_img);
        } else if (sectionKey === 'services') {
            setInputValue('sv-services-title', SERVICE_DEFAULTS.services_title);
            for (let i = 1; i <= 6; i++) {
                setInputValue(`sv-srv${i}-title`, SERVICE_DEFAULTS[`srv${i}_title`]);
                setInputValue(`sv-srv${i}-desc`, SERVICE_DEFAULTS[`srv${i}_desc`]);
                setImagePreview(`sv-srv${i}`, SERVICE_DEFAULTS[`srv${i}_img`]);
            }
        } else if (sectionKey === 'features') {
            setInputValue('sv-features-title', SERVICE_DEFAULTS.features_title);
            setInputValue('sv-features-desc', SERVICE_DEFAULTS.features_desc);
            setImagePreview('sv-features', SERVICE_DEFAULTS.features_img);
        } else if (sectionKey === 'testimonials') {
            for (let i = 1; i <= 3; i++) {
                setInputValue(`sv-test${i}-name`, SERVICE_DEFAULTS[`test${i}_name`]);
                setInputValue(`sv-test${i}-role`, SERVICE_DEFAULTS[`test${i}_role`]);
                setInputValue(`sv-test${i}-quote`, SERVICE_DEFAULTS[`test${i}_quote`]);
                setImagePreview(`sv-test${i}`, SERVICE_DEFAULTS[`test${i}_img`]);
            }
        }

        // Save progress locally and on DB
        await saveServiceContent();
        showToast(`Service Page Section '${sectionKey}' reset successfully!`);
    } catch (err) {
        console.error(`Error resetting Service section ${sectionKey}:`, err);
        showToast(`Error resetting Service ${sectionKey} section`, true);
    }
}

// ==========================================
// Project Page Customization Logic
// ==========================================

const PROJECT_DEFAULTS = {
    banner_title: "Projects",
    banner_img: "img/carousel-1.jpg",
    tagline: "Our Projects",
    title: "Visit Our Latest Solar And Renewable Energy Projects",
    quote_tagline: "Free Quote",
    quote_title: "Get A Free Quote",
    quote_desc: "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet",
    quote_img: "img/quote.jpg",
    quote_services: ["Solar Panels", "Wind Turbines", "Hydropower Plants"],
    categories: [
        { id: "1", name: "Solar Panels" },
        { id: "2", name: "Wind Turbines" },
        { id: "3", name: "Hydropower Plants" }
    ],
    projects: [
        { category_id: "1", category_name: "Solar Panels", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-6.jpg", content: "Detailed description of this pioneering solar and renewable energy project. We utilize state-of-the-art technology to deliver clean, sustainable power solutions." },
        { category_id: "2", category_name: "Wind Turbines", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-5.jpg", content: "Detailed description of this pioneering wind turbine installation project. Modern wind power turbines generate maximum output with minimal ecological footprint." },
        { category_id: "3", category_name: "Hydropower Plants", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-4.jpg", content: "Detailed description of this advanced hydropower plant project. Our design integrates environmental safety with highly optimized water flow turbine systems." },
        { category_id: "1", category_name: "Solar Panels", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-3.jpg", content: "Detailed description of this pioneering solar and renewable energy project. We utilize state-of-the-art technology to deliver clean, sustainable power solutions." },
        { category_id: "2", category_name: "Wind Turbines", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-2.jpg", content: "Detailed description of this pioneering wind turbine installation project. Modern wind power turbines generate maximum output with minimal ecological footprint." },
        { category_id: "3", category_name: "Hydropower Plants", title: "We Are pioneers of solar & renewable energy industry", img: "img/img-600x400-1.jpg", content: "Detailed description of this advanced hydropower plant project. Our design integrates environmental safety with highly optimized water flow turbine systems." }
    ]
};

let currentProjectCategories = [];
let projectCounter = 0;

async function loadProjectContent() {
    loadQuoteSubmissions();
    if (!supabaseClient) {
        const localData = localStorage.getItem('eco_project_content');
        if (localData) {
            try {
                const merged = Object.assign({}, PROJECT_DEFAULTS, JSON.parse(localData));
                populateProjectFields(merged);
            } catch (e) {
                populateProjectFields(PROJECT_DEFAULTS);
            }
        } else {
            populateProjectFields(PROJECT_DEFAULTS);
        }
        return;
    }

    try {
        showToast("Fetching Project page content from Supabase...");
        const { data, error } = await supabaseClient
            .from('homepage_content')
            .select('*')
            .eq('id', 4)
            .maybeSingle();

        if (error) throw error;

        let merged = Object.assign({}, PROJECT_DEFAULTS);
        if (data) {
            const dbData = data.content_json || data;
            merged = Object.assign({}, PROJECT_DEFAULTS, dbData);
            localStorage.setItem('eco_project_content', JSON.stringify(merged));
        }

        populateProjectFields(merged);
        showToast("Project page content loaded successfully!");
    } catch (err) {
        console.error("Error loading Project page content:", err);
        showToast("Error loading from Supabase. Using local copy.", true);
        const localData = localStorage.getItem('eco_project_content');
        if (localData) {
            try {
                const merged = Object.assign({}, PROJECT_DEFAULTS, JSON.parse(localData));
                populateProjectFields(merged);
            } catch (e) {
                populateProjectFields(PROJECT_DEFAULTS);
            }
        } else {
            populateProjectFields(PROJECT_DEFAULTS);
        }
    }
}

function populateProjectFields(data) {
    setInputValue('pj-banner-title', data.banner_title);
    setImagePreview('pj-banner', data.banner_img);
    setInputValue('pj-tagline', data.tagline);
    setInputValue('pj-title', data.title);
    setInputValue('pj-quote-tagline', data.quote_tagline || 'Free Quote');
    setInputValue('pj-quote-title', data.quote_title || 'Get A Free Quote');
    setInputValue('pj-quote-desc', data.quote_desc || '');
    setImagePreview('pj-quote', data.quote_img || 'img/quote.jpg');

    // Populate Quote Service Options
    const servicesContainer = document.getElementById('pj-quote-services-container');
    if (servicesContainer) {
        servicesContainer.innerHTML = '';
        const services = data.quote_services || PROJECT_DEFAULTS.quote_services;
        services.forEach(srvName => {
            addQuoteServiceOption(srvName);
        });
    }

    // Clear and build Categories
    const categoriesContainer = document.getElementById('pj-categories-container');
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
    }
    
    // Auto-migrate category IDs to sequential numbers: "1", "2", "3", ...
    const originalCategories = data.categories || [];
    currentProjectCategories = originalCategories.map((cat, idx) => {
        return {
            id: String(idx + 1),
            name: cat.name
        };
    });
    
    currentProjectCategories.forEach(cat => {
        addProjectCategoryInput(cat);
    });

    // Populate projects list array in memory
    // Auto-migrate project item category IDs to match the new numeric category IDs
    currentProjectsList = (data.projects || []).map(proj => {
        const oldCatIndex = originalCategories.findIndex(c => c.id === proj.category_id);
        if (oldCatIndex !== -1) {
            proj.category_id = String(oldCatIndex + 1);
        }
        return proj;
    });

    // Render projects list in data table format
    renderProjectsTable();
}

function addProjectCategoryInput(catData = {}) {
    const container = document.getElementById('pj-categories-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'pj-cat-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';

    row.innerHTML = `
        <input type="text" class="pj-cat-name" value="${catData.name || ''}" placeholder="Category Name (e.g. Solar Panels)" style="flex: 2; padding: 8px;" oninput="refreshProjectCategoryDropdowns()">
        <input type="text" class="pj-cat-id" value="${catData.id || ''}" placeholder="Category ID (e.g. 1)" style="flex: 1; padding: 8px;" readonly>
        <button type="button" class="btn-delete" onclick="this.closest('.pj-cat-row').remove(); refreshProjectCategoryDropdowns();" style="background: none; border: none; color: #dc3545; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    container.appendChild(row);
}

function renderProjectsTable() {
    const tbody = document.getElementById('pj-items-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (currentProjectsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 25px; color: #888;">
                    <i class="fa-solid fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block; color: #ccc;"></i>
                    No projects found. Click "Add Project" to create one.
                </td>
            </tr>
        `;
        return;
    }

    currentProjectsList.forEach((proj, index) => {
        const tr = document.createElement('tr');
        
        // Find category name
        const catObj = currentProjectCategories.find(c => String(c.id) === String(proj.category_id));
        const categoryName = catObj ? catObj.name : (proj.category_name || `Category ${proj.category_id}`);

        // Limit content length for preview
        const contentPreview = proj.content ? 
            (proj.content.length > 80 ? proj.content.substring(0, 80) + '...' : proj.content) : 
            '<span style="color: #bbb; font-style: italic;">No description</span>';

        tr.innerHTML = `
            <td>
                <img src="${proj.img || 'img/img-600x400-1.jpg'}" alt="Thumbnail" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
            </td>
            <td style="font-weight: 500;">${proj.title || ''}</td>
            <td>
                <span class="badge" style="background-color: var(--primary-light); color: var(--primary); padding: 5px 10px; border-radius: 4px; font-size: 11px;">${categoryName}</span>
            </td>
            <td style="color: #666; font-size: 13px;">${contentPreview}</td>
            <td style="text-align: center;">
                <button type="button" class="btn btn-sm btn-outline" onclick="showEditProjectModal(${index})" style="padding: 4px 8px; margin-right: 5px; font-size: 12px;">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteProjectItem(${index})" style="padding: 4px 8px; font-size: 12px; color: #dc3545; border-color: #dc3545; background: transparent;">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showAddProjectModal() {
    // Reset inputs
    document.getElementById('project-edit-index').value = "-1";
    document.getElementById('project-form-title').value = "";
    document.getElementById('project-form-content').value = "";
    
    const previewImg = document.getElementById('project-form-image-preview');
    if (previewImg) {
        previewImg.src = "img/img-600x400-1.jpg";
    }

    // Populate Category dropdown
    const categorySelect = document.getElementById('project-form-category');
    if (categorySelect) {
        categorySelect.innerHTML = '';
        currentProjectCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            categorySelect.appendChild(opt);
        });
    }

    // Set title
    document.getElementById('project-modal-title').textContent = "Add New Project";

    // Show modal
    document.getElementById('project-modal').classList.add('active');
}

function showEditProjectModal(index) {
    const proj = currentProjectsList[index];
    if (!proj) return;

    document.getElementById('project-edit-index').value = String(index);
    document.getElementById('project-form-title').value = proj.title || "";
    document.getElementById('project-form-content').value = proj.content || "";

    const previewImg = document.getElementById('project-form-image-preview');
    if (previewImg) {
        previewImg.src = proj.img || "img/img-600x400-1.jpg";
    }

    // Populate Category dropdown
    const categorySelect = document.getElementById('project-form-category');
    if (categorySelect) {
        categorySelect.innerHTML = '';
        currentProjectCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (String(cat.id) === String(proj.category_id)) {
                opt.selected = true;
            }
            categorySelect.appendChild(opt);
        });
    }

    // Set title
    document.getElementById('project-modal-title').textContent = "Edit Project";

    // Show modal
    document.getElementById('project-modal').classList.add('active');
}

function deleteProjectItem(index) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    currentProjectsList.splice(index, 1);
    renderProjectsTable();
}

function submitProjectForm() {
    const indexVal = document.getElementById('project-edit-index').value;
    const index = parseInt(indexVal, 10);

    const title = document.getElementById('project-form-title').value.trim();
    const categorySelect = document.getElementById('project-form-category');
    const categoryId = categorySelect ? categorySelect.value : "";
    const catObj = currentProjectCategories.find(c => String(c.id) === String(categoryId));
    const categoryName = catObj ? catObj.name : "";

    const imgPreview = document.getElementById('project-form-image-preview');
    const imgUrl = imgPreview ? imgPreview.getAttribute('src') || "" : "";

    const content = document.getElementById('project-form-content').value.trim();

    if (!title) {
        showToast("Please enter a project title.", true);
        return;
    }

    const projectData = {
        category_id: categoryId,
        category_name: categoryName,
        title: title,
        content: content,
        img: imgUrl
    };

    if (index === -1) {
        // Create new (add to top of the list)
        currentProjectsList.unshift(projectData);
        showToast("New project added to list.");
    } else {
        // Edit existing
        currentProjectsList[index] = projectData;
        showToast("Project details updated in list.");
    }

    // Close modal & render table
    closeModal('project-modal');
    renderProjectsTable();
}

function refreshProjectCategoryDropdowns() {
    const categories = [];
    const catRows = document.querySelectorAll('.pj-cat-row');
    catRows.forEach((row, index) => {
        const idInput = row.querySelector('.pj-cat-id');
        const nameInput = row.querySelector('.pj-cat-name');
        if (idInput && nameInput) {
            let nameVal = nameInput.value.trim();
            if (nameVal) {
                const id = String(index + 1);
                idInput.value = id;
                categories.push({ id, name: nameVal });
            }
        }
    });

    currentProjectCategories = categories;
}

async function saveProjectContent() {
    refreshProjectCategoryDropdowns();

    const projects = currentProjectsList.map(proj => {
        const catObj = currentProjectCategories.find(c => String(c.id) === String(proj.category_id));
        return {
            category_id: proj.category_id,
            category_name: catObj ? catObj.name : (proj.category_name || ""),
            title: proj.title,
            content: proj.content || "",
            img: proj.img || ""
        };
    });

    const pjData = {
        banner_title: getInputValue('pj-banner-title'),
        banner_img: getImageSrc('pj-banner'),
        tagline: getInputValue('pj-tagline'),
        title: getInputValue('pj-title'),
        quote_tagline: getInputValue('pj-quote-tagline'),
        quote_title: getInputValue('pj-quote-title'),
        quote_desc: getInputValue('pj-quote-desc'),
        quote_img: getImageSrc('pj-quote'),
        quote_services: getQuoteServiceOptions(),
        categories: currentProjectCategories,
        projects: projects
    };

    localStorage.setItem('eco_project_content', JSON.stringify(pjData));

    if (!supabaseClient) {
        showToast("Project page content saved locally!");
        return;
    }

    try {
        showToast("Saving Project page to Supabase Database...");
        const payload = {
            id: 4,
            content_json: pjData
        };
        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;
        showToast("Project page content saved successfully to Supabase!");
    } catch (err) {
        console.error("Error saving Project page content:", err);
        showToast("Saved locally. Supabase error: " + err.message, true);
        throw err;
    }
}

async function saveIndividualProjectSection(sectionKey, btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    const btnWidth = btn.offsetWidth;
    btn.style.width = btnWidth + 'px';

    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;

    try {
        await saveProjectContent();

        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Updated!`;

        setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    } catch (error) {
        console.error("Failed to save Project section:", error);
        btn.classList.remove('loading');
        btn.classList.add('danger');
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error!`;
        setTimeout(() => {
            btn.classList.remove('danger');
            btn.innerHTML = originalHTML;
            btn.style.width = '';
            btn.disabled = false;
        }, 2200);
    }
}

async function resetProjectSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section of the Project Page to original default template values?`)) {
        return;
    }

    try {
        showToast(`Resetting Project Page ${sectionKey} section...`);

        if (sectionKey === 'banner') {
            setInputValue('pj-banner-title', PROJECT_DEFAULTS.banner_title);
            setImagePreview('pj-banner', PROJECT_DEFAULTS.banner_img);
        } else if (sectionKey === 'header') {
            setInputValue('pj-tagline', PROJECT_DEFAULTS.tagline);
            setInputValue('pj-title', PROJECT_DEFAULTS.title);
        } else if (sectionKey === 'categories') {
            // Reset categories only
            const categoriesContainer = document.getElementById('pj-categories-container');
            if (categoriesContainer) {
                categoriesContainer.innerHTML = '';
            }
            currentProjectCategories = JSON.parse(JSON.stringify(PROJECT_DEFAULTS.categories));
            currentProjectCategories.forEach(cat => {
                addProjectCategoryInput(cat);
            });
            refreshProjectCategoryDropdowns();
        } else if (sectionKey === 'projects') {
            // Reset project items only
            currentProjectsList = JSON.parse(JSON.stringify(PROJECT_DEFAULTS.projects));
            renderProjectsTable();
        } else if (sectionKey === 'quote') {
            setInputValue('pj-quote-tagline', PROJECT_DEFAULTS.quote_tagline);
            setInputValue('pj-quote-title', PROJECT_DEFAULTS.quote_title);
            setInputValue('pj-quote-desc', PROJECT_DEFAULTS.quote_desc);
            setImagePreview('pj-quote', PROJECT_DEFAULTS.quote_img);
            // Reset service options
            const srvContainer = document.getElementById('pj-quote-services-container');
            if (srvContainer) {
                srvContainer.innerHTML = '';
                PROJECT_DEFAULTS.quote_services.forEach(s => addQuoteServiceOption(s));
            }
        }

        await saveProjectContent();
        showToast(`Project Page Section '${sectionKey}' reset successfully!`);
    } catch (err) {
        console.error(`Error resetting Project section ${sectionKey}:`, err);
        showToast(`Error resetting Project ${sectionKey} section`, true);
    }
}

function addQuoteServiceOption(name) {
    const container = document.getElementById('pj-quote-services-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'quote-srv-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';

    row.innerHTML = `
        <input type="text" class="quote-srv-name" value="${name || ''}" placeholder="Service name (e.g. Solar Panels)" style="flex: 1; padding: 8px;">
        <button type="button" class="btn-delete" onclick="this.closest('.quote-srv-row').remove();" style="background: none; border: none; color: #dc3545; cursor: pointer;" title="Remove this service option">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    container.appendChild(row);
}

function getQuoteServiceOptions() {
    const container = document.getElementById('pj-quote-services-container');
    if (!container) return [];

    const services = [];
    container.querySelectorAll('.quote-srv-name').forEach(input => {
        const val = input.value.trim();
        if (val) services.push(val);
    });
    return services;
}

let currentQuoteSubmissions = [];

async function loadQuoteSubmissions() {
    const tableBody = document.getElementById('quote-submissions-table-body');
    if (!tableBody) return;

    if (!supabaseClient) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;" class="text-muted">Supabase not configured. Submissions unavailable offline.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('homepage_content')
            .select('*')
            .eq('id', 99)
            .maybeSingle();

        if (error) throw error;

        if (data && data.content_json && Array.isArray(data.content_json.submissions)) {
            currentQuoteSubmissions = data.content_json.submissions;
        } else {
            currentQuoteSubmissions = [];
        }

        renderQuoteSubmissionsTable();
    } catch (err) {
        console.error("Error loading quote submissions:", err);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading submissions from Supabase.</td></tr>';
    }
}

function renderQuoteSubmissionsTable() {
    const tableBody = document.getElementById('quote-submissions-table-body');
    if (!tableBody) return;

    if (currentQuoteSubmissions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;" class="text-muted">No submissions found.</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    // Display newest first
    const sorted = [...currentQuoteSubmissions].reverse();
    
    sorted.forEach((sub) => {
        // Calculate the actual index in currentQuoteSubmissions
        const actualIdx = currentQuoteSubmissions.indexOf(sub);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sub.timestamp ? new Date(sub.timestamp).toLocaleString() : 'N/A'}</td>
            <td><strong>${escapeHTML(sub.name || '')}</strong></td>
            <td><a href="mailto:${escapeHTML(sub.email || '')}">${escapeHTML(sub.email || '')}</a></td>
            <td><a href="tel:${escapeHTML(sub.mobile || '')}">${escapeHTML(sub.mobile || '')}</a></td>
            <td><span class="badge" style="background: var(--primary); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${escapeHTML(sub.service || '')}</span></td>
            <td><div style="max-width: 250px; white-space: normal; word-break: break-all;">${escapeHTML(sub.note || '')}</div></td>
            <td style="text-align: center;">
                <button type="button" class="btn-delete" onclick="deleteQuoteSubmission(${actualIdx})" style="background: none; border: none; color: #dc3545; cursor: pointer;" title="Delete this request">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function deleteQuoteSubmission(index) {
    if (!supabaseClient || !confirm("Are you sure you want to delete this submission?")) return;

    try {
        showToast("Deleting submission...");
        currentQuoteSubmissions.splice(index, 1);
        
        const payload = {
            id: 99,
            content_json: { submissions: currentQuoteSubmissions }
        };

        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;

        showToast("Submission deleted successfully!");
        renderQuoteSubmissionsTable();
    } catch (err) {
        console.error("Error deleting submission:", err);
        showToast("Error deleting submission", true);
    }
}

async function clearAllQuoteSubmissions() {
    if (!supabaseClient || !confirm("Are you sure you want to clear ALL quote request submissions? This action cannot be undone.")) return;

    try {
        showToast("Clearing all submissions...");
        currentQuoteSubmissions = [];
        
        const payload = {
            id: 99,
            content_json: { submissions: [] }
        };

        const { error } = await supabaseClient.from('homepage_content').upsert(payload);
        if (error) throw error;

        showToast("All submissions cleared successfully!");
        renderQuoteSubmissionsTable();
    } catch (err) {
        console.error("Error clearing submissions:", err);
        showToast("Error clearing submissions", true);
    }
}

// ==========================================
// Blog Management Logic
// ==========================================

const BLOG_DEFAULTS = {
    banner: {
        title: 'Our Blog',
        image: 'img/carousel-1.jpg'
    },
    categories: [
        { id: '1', name: 'Solar Energy' },
        { id: '2', name: 'Wind Power' },
        { id: '3', name: 'Sustainability' },
        { id: '4', name: 'Green Technology' },
        { id: '5', name: 'Energy Tips' }
    ],
    suggested_tags: ['renewable','solar','wind','green','eco-friendly','sustainability','energy-saving','clean-energy','climate','innovation'],
    posts: [
        {
            id: 'post-1', title: 'The Future of Solar Panel Efficiency', slug: 'future-solar-panel-efficiency',
            category_id: '1', category_name: 'Solar Energy',
            tags: ['solar','innovation','clean-energy'],
            content: 'Solar panel technology has advanced dramatically in recent years. New perovskite-silicon tandem cells are pushing efficiency beyond 30%, promising a revolution in how we harness sunlight.\n\nResearchers are also exploring transparent solar cells that could be integrated into windows, turning entire buildings into power generators.',
            thumbnail: 'img/img-600x400-1.jpg', status: 'published',
            created_at: '2026-05-15T10:00:00Z', author: 'Admin',
            comments: [{ name: 'John Doe', email: 'john@example.com', text: 'Great article!', date: '2026-05-16T08:00:00Z' }]
        },
        {
            id: 'post-2', title: 'How Wind Farms Are Changing Rural Communities', slug: 'wind-farms-rural-communities',
            category_id: '2', category_name: 'Wind Power',
            tags: ['wind','sustainability','green'],
            content: 'Wind energy is transforming rural landscapes across the globe. Modern wind turbines generate enough electricity to power thousands of homes while providing substantial lease income to landowners.',
            thumbnail: 'img/img-600x400-2.jpg', status: 'published',
            created_at: '2026-05-12T14:30:00Z', author: 'Admin', comments: []
        },
        {
            id: 'post-3', title: '10 Simple Ways to Live More Sustainably', slug: '10-ways-live-sustainably',
            category_id: '3', category_name: 'Sustainability',
            tags: ['sustainability','eco-friendly','energy-saving'],
            content: 'Living sustainably does not require drastic lifestyle changes. Small, consistent actions can make a significant impact on your carbon footprint.',
            thumbnail: 'img/img-600x400-3.jpg', status: 'published',
            created_at: '2026-05-10T09:15:00Z', author: 'Admin',
            comments: [
                { name: 'Sarah M.', email: 'sarah@example.com', text: 'Love these tips!', date: '2026-05-11T12:00:00Z' },
                { name: 'Mike R.', email: 'mike@example.com', text: 'Very helpful!', date: '2026-05-12T15:30:00Z' }
            ]
        },
        {
            id: 'post-4', title: 'Green Tech Innovations That Will Shape 2027', slug: 'green-tech-innovations-2027',
            category_id: '4', category_name: 'Green Technology',
            tags: ['innovation','green','clean-energy','climate'],
            content: 'The green technology sector continues to innovate at an unprecedented pace. From advanced battery storage solutions to AI-powered energy management systems.',
            thumbnail: 'img/img-600x400-4.jpg', status: 'published',
            created_at: '2026-05-08T11:45:00Z', author: 'Admin', comments: []
        },
        {
            id: 'post-5', title: 'Reducing Your Home Energy Bill: A Complete Guide', slug: 'reducing-home-energy-bill',
            category_id: '5', category_name: 'Energy Tips',
            tags: ['energy-saving','sustainability','renewable'],
            content: 'Energy costs continue to rise, but there are many strategies homeowners can employ to significantly reduce their bills.',
            thumbnail: 'img/img-600x400-5.jpg', status: 'published',
            created_at: '2026-05-05T16:20:00Z', author: 'Admin', comments: []
        },
        {
            id: 'post-6', title: 'Understanding Solar Panel Installation Process', slug: 'understanding-solar-installation',
            category_id: '1', category_name: 'Solar Energy',
            tags: ['solar','renewable','energy-saving'],
            content: 'Installing solar panels on your home is one of the best investments you can make for both the environment and your finances.',
            thumbnail: 'img/img-600x400-6.jpg', status: 'published',
            created_at: '2026-05-02T13:00:00Z', author: 'Admin', comments: []
        }
    ]
};

let adminBlogData = null;
let adminBlogTags = []; // current post tags
let quillEditor = null;
let blogAutoSaveInterval = null;

async function loadBlogManagement() {
    console.log("Loading Blog Management...");
    adminBlogData = JSON.parse(JSON.stringify(BLOG_DEFAULTS));

    const cached = localStorage.getItem('eco_blog_content');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            adminBlogData = Object.assign({}, BLOG_DEFAULTS, parsed);
            if (parsed.posts) adminBlogData.posts = parsed.posts;
            if (parsed.categories) adminBlogData.categories = parsed.categories;
        } catch (e) { console.error(e); }
    }

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('homepage_content').select('*').eq('id', 10).maybeSingle();
            if (!error && data && data.content_json) {
                const db = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
                adminBlogData = Object.assign({}, BLOG_DEFAULTS, db);
                if (db.posts) adminBlogData.posts = db.posts;
                if (db.categories) adminBlogData.categories = db.categories;
                localStorage.setItem('eco_blog_content', JSON.stringify(adminBlogData));
            }
        } catch (e) { console.error('Blog load error:', e); }
    }

    // Banner Config
    if (!adminBlogData.banner) adminBlogData.banner = JSON.parse(JSON.stringify(BLOG_DEFAULTS.banner));
    const bTitle = document.getElementById('blog-banner-title');
    const bUrl = document.getElementById('blog-banner-img-url');
    const bPrev = document.getElementById('blog-banner-preview');
    if (bTitle) bTitle.value = adminBlogData.banner.title || 'Our Blog';
    if (bUrl) bUrl.value = adminBlogData.banner.image || 'img/carousel-1.jpg';
    if (bPrev) bPrev.src = adminBlogData.banner.image || 'img/carousel-1.jpg';

    renderBlogCategoriesAdmin();
    renderBlogPostsTable();
    refreshBlogCategorySelect();
    renderBlogTagSuggestions();
    initBlogTagInput();
    initBlogPostImageUpload();

    // Init Quill Editor if not initialized
    if (!quillEditor && document.getElementById('quill-editor')) {
        quillEditor = new Quill('#quill-editor', {
            theme: 'snow',
            placeholder: 'Write your amazing story here... You can easily paste or insert images from the toolbar.',
            modules: {
                toolbar: '#quill-toolbar-container'
            }
        });
        
        // Auto-save listener on text change
        let draftTimeout = null;
        quillEditor.on('text-change', function() {
            if (document.getElementById('admin-blog-new-post').style.display === 'block') {
                clearTimeout(draftTimeout);
                draftTimeout = setTimeout(saveBlogPostDraft, 2000);
            }
        });
        document.getElementById('blog-post-title').addEventListener('input', function() {
            clearTimeout(draftTimeout);
            draftTimeout = setTimeout(saveBlogPostDraft, 2000);
        });
    }
}

// --- Categories Admin ---
function renderBlogCategoriesAdmin() {
    const list = document.getElementById('blog-categories-list');
    if (!list || !adminBlogData) return;
    list.innerHTML = '';

    adminBlogData.categories.forEach((cat, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8f9fa;border-radius:8px;';
        row.innerHTML = `
            <span style="color:var(--primary);font-weight:600;width:28px;text-align:center;">${idx + 1}</span>
            <input type="text" class="blog-cat-input" data-cat-id="${cat.id}" value="${cat.name}" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;" onchange="updateBlogCategoryName(${idx}, this.value)">
            <button type="button" onclick="deleteBlogCategory(${idx})" style="background:none;border:none;color:#dc3545;cursor:pointer;padding:6px;" title="Delete category">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.appendChild(row);
    });
}

function addBlogCategory() {
    const input = document.getElementById('blog-new-cat-name');
    const name = input ? input.value.trim() : '';
    if (!name) { showToast('Please enter a category name', true); return; }

    const newId = String(Math.max(0, ...adminBlogData.categories.map(c => parseInt(c.id) || 0)) + 1);
    adminBlogData.categories.push({ id: newId, name: name });

    if (input) input.value = '';
    renderBlogCategoriesAdmin();
    refreshBlogCategorySelect();
    showToast(`Category "${name}" added!`);
}

function updateBlogCategoryName(idx, newName) {
    if (!adminBlogData.categories[idx]) return;
    const oldName = adminBlogData.categories[idx].name;
    adminBlogData.categories[idx].name = newName.trim();
    // Update posts with this category
    adminBlogData.posts.forEach(p => {
        if (String(p.category_id) === String(adminBlogData.categories[idx].id)) {
            p.category_name = newName.trim();
        }
    });
    refreshBlogCategorySelect();
}

function deleteBlogCategory(idx) {
    const cat = adminBlogData.categories[idx];
    if (!cat) return;
    if (!confirm(`Delete category "${cat.name}"? Posts in this category will become uncategorized.`)) return;
    adminBlogData.categories.splice(idx, 1);
    renderBlogCategoriesAdmin();
    refreshBlogCategorySelect();
    showToast(`Category deleted.`);
}

function resetBlogCategories() {
    if (!confirm('Reset all categories to defaults? Custom categories will be removed.')) return;
    adminBlogData.categories = JSON.parse(JSON.stringify(BLOG_DEFAULTS.categories));
    renderBlogCategoriesAdmin();
    refreshBlogCategorySelect();
    showToast('Categories reset to defaults.');
}

function refreshBlogCategorySelect() {
    const select = document.getElementById('blog-post-category');
    if (!select || !adminBlogData) return;
    const currentVal = select.value;
    select.innerHTML = '';
    adminBlogData.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (cat.id === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
}

// --- Posts Table ---
function renderBlogPostsTable() {
    const tbody = document.getElementById('blog-posts-table-body');
    if (!tbody || !adminBlogData) return;

    const searchInput = document.getElementById('blog-admin-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let posts = adminBlogData.posts;
    if (query) {
        posts = posts.filter(p => {
            return (p.title || '').toLowerCase().includes(query) ||
                   (p.tags || []).some(t => t.toLowerCase().includes(query)) ||
                   (p.category_name || '').toLowerCase().includes(query);
        });
    }

    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#888;">
            <i class="fa-solid fa-inbox" style="font-size:28px;color:#ccc;display:block;margin-bottom:8px;"></i>
            No posts found. Create your first blog post!</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    posts.forEach((post) => {
        const realIdx = adminBlogData.posts.indexOf(post);
        const date = new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusClass = post.status === 'published' ? 'background:#d4edda;color:#155724;' : 'background:#fff3cd;color:#856404;';
        const tags = (post.tags || []).slice(0, 3).map(t => `<span style="background:rgba(0,105,62,0.08);color:#00693e;padding:2px 8px;border-radius:10px;font-size:11px;margin-right:3px;">${t}</span>`).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${post.thumbnail || 'img/img-600x400-1.jpg'}" style="width:50px;height:35px;object-fit:cover;border-radius:4px;border:1px solid #eee;"></td>
            <td style="font-weight:500;">${post.title || ''}</td>
            <td><span style="background:var(--primary-light);color:var(--primary);padding:4px 10px;border-radius:4px;font-size:11px;">${post.category_name || ''}</span></td>
            <td>${tags}</td>
            <td><span style="${statusClass}padding:4px 10px;border-radius:4px;font-size:11px;font-weight:500;">${post.status || 'draft'}</span></td>
            <td style="font-size:13px;color:#666;">${date}</td>
            <td style="text-align:center;">
                <button class="btn btn-sm btn-outline" onclick="openBlogCommentsModal(${realIdx})" style="padding:4px 10px; font-size:12px; border-radius: 4px;" title="View Comments">
                    <i class="fa-regular fa-comments me-1"></i> ${(post.comments || []).length}
                </button>
            </td>
            <td style="text-align:center;">
                <button class="btn btn-sm btn-outline" onclick="editBlogPost(${realIdx})" style="padding:3px 7px;font-size:11px;margin-right:4px;">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn btn-sm" onclick="deleteBlogPost(${realIdx})" style="padding:3px 7px;font-size:11px;color:#dc3545;border:1px solid #dc3545;background:transparent;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Tag Input ---
function initBlogTagInput() {
    const input = document.getElementById('blog-tag-input');
    if (!input) return;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = this.value.trim().replace(/,/g, '').toLowerCase();
            if (tag && !adminBlogTags.includes(tag)) {
                adminBlogTags.push(tag);
                renderBlogTagBadges();
            }
            this.value = '';
        }
    });
}

function addBlogTagFromSuggestion(tag) {
    if (!adminBlogTags.includes(tag)) {
        adminBlogTags.push(tag);
        renderBlogTagBadges();
    }
}

function removeBlogTag(tag) {
    adminBlogTags = adminBlogTags.filter(t => t !== tag);
    renderBlogTagBadges();
}

function renderBlogTagBadges() {
    const container = document.getElementById('blog-tags-container');
    const input = document.getElementById('blog-tag-input');
    if (!container || !input) return;

    // Remove old badges
    container.querySelectorAll('.blog-tag-badge').forEach(el => el.remove());

    adminBlogTags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'blog-tag-badge';
        badge.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#00693e;color:#fff;padding:4px 10px;border-radius:14px;font-size:12px;font-weight:500;';
        badge.innerHTML = `${tag} <span onclick="removeBlogTag('${tag}')" style="cursor:pointer;opacity:0.8;font-size:14px;line-height:1;">&times;</span>`;
        container.insertBefore(badge, input);
    });

    renderBlogTagSuggestions();
}

function renderBlogTagSuggestions() {
    const container = document.getElementById('blog-tag-suggestions');
    if (!container || !adminBlogData) return;

    const allTags = [...(adminBlogData.suggested_tags || BLOG_DEFAULTS.suggested_tags)];
    adminBlogData.posts.forEach(p => (p.tags || []).forEach(t => { if (!allTags.includes(t)) allTags.push(t); }));

    const available = allTags.filter(t => !adminBlogTags.includes(t));
    container.innerHTML = available.map(t =>
        `<span onclick="addBlogTagFromSuggestion('${t}')" style="display:inline-block;background:#f0f0f0;color:#555;padding:4px 12px;border-radius:14px;font-size:12px;cursor:pointer;border:1px solid #e0e0e0;transition:all 0.2s;" onmouseover="this.style.background='#00693e';this.style.color='#fff';this.style.borderColor='#00693e';" onmouseout="this.style.background='#f0f0f0';this.style.color='#555';this.style.borderColor='#e0e0e0';">${t}</span>`
    ).join('');
}

// --- Image Upload ---
function initBlogPostImageUpload() {
    const dropzone = document.getElementById('blogpost-image-dropzone');
    const fileInput = document.getElementById('blogpost-image-input');
    const preview = document.getElementById('blogpost-image-preview');
    if (!dropzone || !fileInput || !preview) return;

    // Drag & drop only (click is handled by the overlay div's onclick in HTML)
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = '#00693e'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files.length) handleBlogImageFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleBlogImageFile(fileInput.files[0]);
    });

    // Post Banner Dropzone
    const bannerDropzone = document.getElementById('blogpost-banner-dropzone');
    const bannerInput = document.getElementById('blogpost-banner-input');
    if (bannerDropzone && bannerInput) {
        bannerDropzone.addEventListener('dragover', e => { e.preventDefault(); bannerDropzone.style.borderColor = '#00693e'; });
        bannerDropzone.addEventListener('dragleave', () => { bannerDropzone.style.borderColor = ''; });
        bannerDropzone.addEventListener('drop', e => {
            e.preventDefault();
            bannerDropzone.style.borderColor = '';
            if (e.dataTransfer.files.length) handleBlogPostBannerFile(e.dataTransfer.files[0]);
        });
        bannerInput.addEventListener('change', () => {
            if (bannerInput.files.length) handleBlogPostBannerFile(bannerInput.files[0]);
        });
    }
}

async function handleBlogPostBannerFile(file) {
    const preview = document.getElementById('blogpost-banner-preview');
    if (!preview) return;

    // Show local preview first
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; };
    reader.readAsDataURL(file);

    // Upload to Supabase if available
    if (supabaseClient) {
        try {
            showToast("Uploading post banner image...");
            const fileName = `blog/post_banner_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { data, error } = await supabaseClient.storage.from('media').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabaseClient.storage.from('media').getPublicUrl(fileName);
            if (urlData && urlData.publicUrl) {
                preview.src = urlData.publicUrl;
                showToast("Post banner uploaded successfully!");
            }
        } catch (err) {
            console.error("Blog post banner upload error:", err);
            showToast("Banner upload failed. Using local preview.", true);
        }
    }
}

async function handleBlogImageFile(file) {
    const preview = document.getElementById('blogpost-image-preview');
    if (!preview) return;

    // Show local preview first
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; };
    reader.readAsDataURL(file);

    // Upload to Supabase if available
    if (supabaseClient) {
        try {
            showToast("Uploading image...");
            const fileName = `blog/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { data, error } = await supabaseClient.storage.from('media').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabaseClient.storage.from('media').getPublicUrl(fileName);
            if (urlData && urlData.publicUrl) {
                preview.src = urlData.publicUrl;
                showToast("Image uploaded successfully!");
            }
        } catch (err) {
            console.error("Blog image upload error:", err);
            showToast("Image upload failed. Using local preview.", true);
        }
    }
}

async function handleBlogBannerFile(file) {
    if (!file) return;
    const preview = document.getElementById('blog-banner-preview');
    const urlInput = document.getElementById('blog-banner-img-url');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => { if (preview) preview.src = e.target.result; };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage if available
    if (supabaseClient) {
        try {
            showToast('Uploading banner image...');
            const fileName = `blog/banner_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { data, error } = await supabaseClient.storage.from('media').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabaseClient.storage.from('media').getPublicUrl(fileName);
            if (urlData && urlData.publicUrl) {
                if (preview) preview.src = urlData.publicUrl;
                if (urlInput) urlInput.value = urlData.publicUrl;
                showToast('Banner image uploaded!');
            }
        } catch (err) {
            console.error('Banner upload error:', err);
            showToast('Upload failed. You can still use the URL input.', true);
        }
    }
}

// --- Post CRUD ---
function submitBlogPost() {
    const title = document.getElementById('blog-post-title').value.trim();
    const categorySelect = document.getElementById('blog-post-category');
    const status = document.getElementById('blog-post-status').value;
    const editIdx = parseInt(document.getElementById('blog-post-edit-index').value, 10);

    // Get content from Quill; check if actually empty
    let content = '';
    if (quillEditor) {
        content = quillEditor.root.innerHTML;
        const plainText = quillEditor.getText().trim();
        if (!plainText) content = '';
    } else {
        content = document.getElementById('blog-post-content').value.trim();
    }

    // Get thumbnail: from preview src
    const previewSrc = document.getElementById('blogpost-image-preview').src;
    // Avoid saving blob: or full localhost URL that won't work in production
    const thumbnail = previewSrc.startsWith('blob:') ? 'img/img-600x400-1.jpg' : previewSrc;

    // Get post banner image
    const bannerPreviewSrc = document.getElementById('blogpost-banner-preview').src;
    let bannerImage = bannerPreviewSrc;
    if (bannerImage.startsWith('blob:') || bannerImage.includes('img/carousel-1.jpg')) {
        bannerImage = ''; // Default/empty
    }

    if (!title) { showToast('Please enter a post title.', true); return; }
    if (!content) { showToast('Please enter post content.', true); return; }

    const catId = categorySelect ? categorySelect.value : '';
    const catObj = adminBlogData.categories.find(c => c.id === catId);
    const categoryName = catObj ? catObj.name : '';

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Extract Extra Images
    const body_images = [];
    document.querySelectorAll('#blogpost-extra-images-container .extra-image-row').forEach(row => {
        const url = row.querySelector('.extra-img-url').value.trim();
        const caption = row.querySelector('.extra-img-caption').value.trim();
        if (url) body_images.push({ url, caption });
    });

    const postData = {
        id: editIdx >= 0 ? adminBlogData.posts[editIdx].id : 'post-' + Date.now(),
        title, slug, category_id: catId, category_name: categoryName,
        tags: [...adminBlogTags],
        content, thumbnail, banner_image: bannerImage, status, body_images,
        created_at: editIdx >= 0 ? adminBlogData.posts[editIdx].created_at : new Date().toISOString(),
        author: 'Admin',
        comments: editIdx >= 0 ? (adminBlogData.posts[editIdx].comments || []) : []
    };

    if (editIdx >= 0) {
        adminBlogData.posts[editIdx] = postData;
        showToast('Post updated!');
    } else {
        adminBlogData.posts.unshift(postData);
        showToast('Post created!');
    }

    // Clear draft
    localStorage.removeItem('eco_blog_draft');

    renderBlogPostsTable();
    closeBlogEditor();
    saveBlogContent();
}

function editBlogPost(idx) {
    const post = adminBlogData.posts[idx];
    if (!post) return;

    document.getElementById('blog-post-edit-index').value = String(idx);
    document.getElementById('blog-post-title').value = post.title || '';
    if (quillEditor) {
        quillEditor.root.innerHTML = post.content || '';
    } else {
        document.getElementById('blog-post-content').value = post.content || '';
    }
    document.getElementById('blog-post-status').value = post.status || 'draft';

    const preview = document.getElementById('blogpost-image-preview');
    if (preview) preview.src = post.thumbnail || 'img/img-600x400-1.jpg';

    // Banner Image
    const bannerPreview = document.getElementById('blogpost-banner-preview');
    if (bannerPreview) bannerPreview.src = post.banner_image || 'img/carousel-1.jpg';

    // Category
    const catSelect = document.getElementById('blog-post-category');
    if (catSelect) catSelect.value = post.category_id || '';

    // Tags
    adminBlogTags = [...(post.tags || [])];
    renderBlogTagBadges();

    // Extra Images
    const extraContainer = document.getElementById('blogpost-extra-images-container');
    if (extraContainer) extraContainer.innerHTML = '';
    if (post.body_images && post.body_images.length > 0) {
        post.body_images.forEach(img => addBlogPostExtraImage(img.url, img.caption));
    }

    // Update form title
    const formTitle = document.getElementById('blog-post-form-title');
    if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Post';

    // Open Editor UI
    openBlogEditor(idx, true);
}

function deleteBlogPost(idx) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    adminBlogData.posts.splice(idx, 1);
    renderBlogPostsTable();
    saveBlogContent();
    showToast('Post deleted.');
}

function resetBlogPostForm() {
    document.getElementById('blog-post-edit-index').value = '-1';
    document.getElementById('blog-post-title').value = '';
    if (quillEditor) quillEditor.root.innerHTML = '';
    else document.getElementById('blog-post-content').value = '';
    document.getElementById('blog-post-status').value = 'published';
    const preview = document.getElementById('blogpost-image-preview');
    if (preview) preview.src = 'img/img-600x400-1.jpg';
    
    const bannerPreview = document.getElementById('blogpost-banner-preview');
    if (bannerPreview) bannerPreview.src = 'img/carousel-1.jpg';

    adminBlogTags = [];
    renderBlogTagBadges();
    
    const extraContainer = document.getElementById('blogpost-extra-images-container');
    if (extraContainer) extraContainer.innerHTML = '';

    const formTitle = document.getElementById('blog-post-form-title');
    if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-pen-fancy"></i> Create New Post';
}

// --- New Editor Flow & Preview ---
function openBlogEditor(idx = -1, isEditCall = false) {
    document.getElementById('blog-management-tabs').style.display = 'none';
    document.getElementById('admin-blog-categories').style.display = 'none';
    document.getElementById('admin-blog-posts').style.display = 'none';
    document.getElementById('admin-blog-banner').style.display = 'none';
    document.getElementById('admin-blog-new-post').style.display = 'block';

    if (!isEditCall) {
        if (idx >= 0) {
            editBlogPost(idx);
            return;
        } else {
            resetBlogPostForm();
            // Check for draft
            const draft = localStorage.getItem('eco_blog_draft');
            if (draft) {
                if (confirm("You have an unsaved draft. Do you want to resume it?")) {
                    try {
                        const parsed = JSON.parse(draft);
                        document.getElementById('blog-post-title').value = parsed.title || '';
                        if (quillEditor) quillEditor.root.innerHTML = parsed.content || '';
                        else document.getElementById('blog-post-content').value = parsed.content || '';
                        if (parsed.category_id) document.getElementById('blog-post-category').value = parsed.category_id;
                        if (parsed.thumbnail) document.getElementById('blogpost-image-preview').src = parsed.thumbnail;
                        if (parsed.banner_image) document.getElementById('blogpost-banner-preview').src = parsed.banner_image;
                        adminBlogTags = parsed.tags || [];
                        renderBlogTagBadges();
                        if (parsed.body_images) {
                            parsed.body_images.forEach(img => addBlogPostExtraImage(img.url, img.caption));
                        }
                    } catch(e) {}
                } else {
                    localStorage.removeItem('eco_blog_draft');
                }
            }
        }
    }
}

function closeBlogEditor() {
    document.getElementById('blog-management-tabs').style.display = 'flex';
    document.getElementById('admin-blog-new-post').style.display = 'none';
    document.getElementById('admin-blog-posts').style.display = 'block';
    document.getElementById('admin-blog-categories').style.display = 'block';
    document.getElementById('admin-blog-banner').style.display = 'block';
    resetBlogPostForm();
}

function addBlogPostExtraImage(imgUrl = '', caption = '') {
    const container = document.getElementById('blogpost-extra-images-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'extra-image-row';
    row.style.cssText = 'display: flex; gap: 10px; align-items: flex-start; padding: 10px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;';
    row.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <input type="text" class="extra-img-url" placeholder="Image URL (e.g. from Media Library)" value="${imgUrl}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
            <input type="text" class="extra-img-caption" placeholder="Image Caption / Description" value="${caption}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="btn btn-sm btn-outline text-danger" style="padding: 8px; height: fit-content;" title="Remove image">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
}

function saveBlogPostDraft() {
    const title = document.getElementById('blog-post-title').value.trim();
    const content = quillEditor ? quillEditor.root.innerHTML : document.getElementById('blog-post-content').value.trim();
    const category_id = document.getElementById('blog-post-category').value;
    const thumbnail = document.getElementById('blogpost-image-preview').src;
    const banner_image = document.getElementById('blogpost-banner-preview').src;
    
    const body_images = [];
    document.querySelectorAll('#blogpost-extra-images-container .extra-image-row').forEach(row => {
        const url = row.querySelector('.extra-img-url').value.trim();
        const caption = row.querySelector('.extra-img-caption').value.trim();
        if (url) body_images.push({ url, caption });
    });

    const draft = { title, content, category_id, thumbnail, banner_image, tags: [...adminBlogTags], body_images };
    localStorage.setItem('eco_blog_draft', JSON.stringify(draft));
    
    const statusEl = document.getElementById('blog-draft-status');
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Draft saved at ' + new Date().toLocaleTimeString();
        setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
    }
}

function previewBlogPost() {
    const title = document.getElementById('blog-post-title').value.trim() || 'Untitled Preview';
    const content = quillEditor ? quillEditor.root.innerHTML : document.getElementById('blog-post-content').value.trim();
    const thumbnail = document.getElementById('blogpost-image-preview').src;
    
    const catSelect = document.getElementById('blog-post-category');
    const category_name = catSelect && catSelect.options[catSelect.selectedIndex] ? catSelect.options[catSelect.selectedIndex].text : '';

    let extraImagesHtml = '';
    document.querySelectorAll('#blogpost-extra-images-container .extra-image-row').forEach(row => {
        const url = row.querySelector('.extra-img-url').value.trim();
        const caption = row.querySelector('.extra-img-caption').value.trim();
        if (url) {
            extraImagesHtml += `<figure style="margin: 20px 0; text-align: center;">
                <img src="${url}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${caption ? `<figcaption style="color: #666; font-size: 14px; margin-top: 8px; font-style: italic;">${caption}</figcaption>` : ''}
            </figure>`;
        }
    });

    const tagsHtml = adminBlogTags.map(t => `<span style="display:inline-block; background:#e9ecef; padding:4px 10px; border-radius:20px; font-size:12px; margin-right:5px; color:#333;">#${t}</span>`).join('');
    
    // Check if content already contains HTML (from Quill)
    let contentHtml = content;
    if (!content.includes('<p>') && !content.includes('<h')) {
        contentHtml = content.split('\n').filter(p => p.trim()).map(p => `<p style="line-height: 1.8; margin-bottom: 15px;">${p}</p>`).join('');
    }

    const previewHtml = `
        <img src="${thumbnail}" style="width:100%; max-height:400px; object-fit:cover; border-radius:8px; margin-bottom:20px;">
        <div style="color: var(--primary); font-weight: bold; margin-bottom: 10px;">${category_name}</div>
        <h1 style="margin-bottom: 20px; font-size: 32px;">${title}</h1>
        <div style="margin-bottom: 30px;">${tagsHtml}</div>
        <div class="quill-preview-content" style="font-size: 16px; color: #444; line-height: 1.8;">
            ${contentHtml}
            ${extraImagesHtml}
        </div>
    `;

    document.getElementById('blog-preview-container').innerHTML = previewHtml;
    document.getElementById('blog-preview-modal').classList.add('active');
}

/// --- Save Blog Content ---
async function saveBlogContent() {
    if (!adminBlogData) return;
    
    // Read banner from inputs
    const bTitle = document.getElementById('blog-banner-title');
    const bUrl = document.getElementById('blog-banner-img-url');
    if (bTitle && bUrl) {
        adminBlogData.banner = {
            title: bTitle.value.trim() || 'Our Blog',
            image: bUrl.value.trim() || 'img/carousel-1.jpg'
        };
    }
    
    // Sort posts by date before saving
    adminBlogData.posts.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    
    localStorage.setItem('eco_blog_content', JSON.stringify(adminBlogData));

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('homepage_content').upsert({
                id: 10,
                content_json: adminBlogData
            });
            if (error) throw error;
            showToast('Blog data saved successfully!');
        } catch (e) {
            console.error(e);
            showToast('Saved locally, but failed to sync to cloud.', true);
        }
    } else {
        showToast('Saved locally (Supabase not configured).');
    }
}

// --- Comments Management ---
function openBlogCommentsModal(postIdx) {
    const post = adminBlogData.posts[postIdx];
    if (!post) return;
    
    const container = document.getElementById('blog-comments-container');
    const comments = post.comments || [];
    
    if (comments.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px 20px; color: #888;">
            <i class="fa-regular fa-comment-dots" style="font-size: 32px; margin-bottom: 15px; color: #ddd; display: block;"></i>
            No comments on this post yet.
        </div>`;
    } else {
        let html = '';
        comments.forEach((c, idx) => {
            const dateStr = c.date ? new Date(c.date).toLocaleString() : 'Unknown Date';
            html += `
            <div style="background: #f8f9fa; border: 1px solid #eaeaea; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <strong style="font-size: 14px; color: #333;">${c.name || 'Anonymous'}</strong>
                        <span style="font-size: 12px; color: #666; margin-left: 10px;">${c.email || ''}</span>
                        <div style="font-size: 11px; color: #999; margin-top: 2px;">${dateStr}</div>
                    </div>
                    <button class="btn btn-sm btn-outline" style="color: #dc3545; border-color: #dc3545; padding: 2px 8px; font-size: 11px;" onclick="deleteBlogComment(${postIdx}, ${idx})" title="Delete Comment">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div style="font-size: 14px; color: #444; line-height: 1.5;">
                    ${(c.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
    
    document.getElementById('blog-comments-modal').classList.add('active');
}

function deleteBlogComment(postIdx, commentIdx) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    adminBlogData.posts[postIdx].comments.splice(commentIdx, 1);
    
    // Refresh modal content
    openBlogCommentsModal(postIdx);
    
    // Refresh table to update badge
    renderBlogPostsTable();
    
    // Save changes
    saveBlogContent();
    showToast('Comment deleted successfully.');
}

async function saveBlogContentBtn(btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    try {
        await saveBlogContent();
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved!';
        btn.classList.add('success');
        setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; btn.classList.remove('success'); }, 2200);
    } catch (err) {
        btn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error!';
        setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2200);
    }
}

async function resetBlogSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section of the Blog Page to original default template values?`)) {
        return;
    }

    try {
        showToast(`Resetting Blog Page ${sectionKey} section...`);

        if (sectionKey === 'banner') {
            const bTitle = document.getElementById('blog-banner-title');
            const bUrl = document.getElementById('blog-banner-img-url');
            const bPrev = document.getElementById('blog-banner-preview');

            if (bTitle) bTitle.value = BLOG_DEFAULTS.banner.title;
            if (bUrl) bUrl.value = BLOG_DEFAULTS.banner.image;
            if (bPrev) bPrev.src = BLOG_DEFAULTS.banner.image;

            if (adminBlogData) {
                adminBlogData.banner.title = BLOG_DEFAULTS.banner.title;
                adminBlogData.banner.image = BLOG_DEFAULTS.banner.image;
            }
        }

        await saveBlogContent();
        showToast(`Blog Page Section '${sectionKey}' reset successfully!`);
    } catch (err) {
        console.error(`Error resetting Blog section ${sectionKey}:`, err);
        showToast(`Error resetting Blog ${sectionKey} section`, true);
    }
}

// --- Contact Management ---
const CONTACT_DEFAULTS = {
    banner: {
        title: 'Contact',
        image: 'img/carousel-1.jpg'
    },
    content: {
        subtitle: 'Contact Us',
        title: 'Feel Free To Contact Us',
        description: 'The contact form is currently inactive. Get a functional and working contact form with Ajax & PHP in a few minutes. Just copy and paste the files, add a little code and you\'re done. Download Now.'
    },
    map_lat: 42.728767,
    map_lng: -78.013719,
    map_url: 'https://www.google.com/maps?q=42.728767,-78.013719&hl=en&z=14&output=embed',
    messages: []
};

let adminContactData = null;

async function loadContactContent() {
    adminContactData = JSON.parse(JSON.stringify(CONTACT_DEFAULTS));
    const cached = localStorage.getItem('eco_contact_content');
    if (cached) {
        try { adminContactData = Object.assign({}, adminContactData, JSON.parse(cached)); } catch(e){}
    }
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('homepage_content').select('*').eq('id', 11).maybeSingle();
            if (!error && data && data.content_json) {
                adminContactData = Object.assign({}, adminContactData, typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json);
            }
        } catch(e){}
    }

    // Populate inputs
    if (document.getElementById('contact-banner-title')) document.getElementById('contact-banner-title').value = adminContactData.banner.title;
    if (document.getElementById('contact-banner-img')) document.getElementById('contact-banner-img').value = adminContactData.banner.image;
    if (document.getElementById('contact-banner-preview')) document.getElementById('contact-banner-preview').src = adminContactData.banner.image;

    if (document.getElementById('contact-subtitle')) document.getElementById('contact-subtitle').value = adminContactData.content.subtitle;
    if (document.getElementById('contact-title')) document.getElementById('contact-title').value = adminContactData.content.title;
    if (document.getElementById('contact-desc')) document.getElementById('contact-desc').value = adminContactData.content.description;

    const lat = adminContactData.map_lat || CONTACT_DEFAULTS.map_lat;
    const lng = adminContactData.map_lng || CONTACT_DEFAULTS.map_lng;
    
    // Initialize map picker
    setTimeout(() => initAdminMapPicker(lat, lng), 100);
}

async function saveContactContent() {
    if (!adminContactData) adminContactData = JSON.parse(JSON.stringify(CONTACT_DEFAULTS));

    adminContactData.banner.title = document.getElementById('contact-banner-title').value.trim() || 'Contact';
    adminContactData.banner.image = document.getElementById('contact-banner-img').value.trim() || 'img/carousel-1.jpg';

    adminContactData.content.subtitle = document.getElementById('contact-subtitle').value.trim() || 'Contact Us';
    adminContactData.content.title = document.getElementById('contact-title').value.trim() || 'Feel Free To Contact Us';
    adminContactData.content.description = document.getElementById('contact-desc').value.trim() || '';

    adminContactData.map_lat = parseFloat(document.getElementById('contact-map-lat').value) || CONTACT_DEFAULTS.map_lat;
    adminContactData.map_lng = parseFloat(document.getElementById('contact-map-lng').value) || CONTACT_DEFAULTS.map_lng;
    adminContactData.map_url = document.getElementById('contact-map-url').value.trim() || '';

    localStorage.setItem('eco_contact_content', JSON.stringify(adminContactData));

    if (supabaseClient) {
        try {
            showToast("Saving Contact Page settings...");
            const { error } = await supabaseClient.from('homepage_content').upsert({ id: 11, content_json: adminContactData });
            if (error) throw error;
            showToast("Contact settings saved to Supabase!");
        } catch(err) {
            console.error("Save Contact error:", err);
            showToast("Saved locally, but failed to sync to Supabase.", true);
        }
    } else {
        showToast("Contact settings saved locally!");
    }
}

async function resetContactContent() {
    if (!confirm('Are you sure you want to reset the Contact Page content to default?')) return;
    
    adminContactData.banner = JSON.parse(JSON.stringify(CONTACT_DEFAULTS.banner));
    adminContactData.content = JSON.parse(JSON.stringify(CONTACT_DEFAULTS.content));
    adminContactData.map_lat = CONTACT_DEFAULTS.map_lat;
    adminContactData.map_lng = CONTACT_DEFAULTS.map_lng;
    adminContactData.map_url = CONTACT_DEFAULTS.map_url;
    
    // Re-populate inputs
    loadContactContent();
    await saveContactContent();
    showToast('Contact Page reset to default!');
}

async function resetContactSection(sectionKey) {
    if (!confirm(`Are you sure you want to restore the '${sectionKey}' section to its default values?`)) return;
    
    if (sectionKey === 'banner') {
        adminContactData.banner = JSON.parse(JSON.stringify(CONTACT_DEFAULTS.banner));
    } else if (sectionKey === 'content') {
        adminContactData.content = JSON.parse(JSON.stringify(CONTACT_DEFAULTS.content));
    } else if (sectionKey === 'map') {
        adminContactData.map_lat = CONTACT_DEFAULTS.map_lat;
        adminContactData.map_lng = CONTACT_DEFAULTS.map_lng;
        adminContactData.map_url = CONTACT_DEFAULTS.map_url;
        updateAdminMapMarker(CONTACT_DEFAULTS.map_lat, CONTACT_DEFAULTS.map_lng, true);
    }
    
    // Re-populate inputs
    loadContactContent();
    await saveContactContent();
    showToast(`'${sectionKey}' section reset to default!`);
}

function switchContactTab(tabId, btn) {
    document.querySelectorAll('#contact-content .sub-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#contact-content .contact-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';

    if (tabId === 'contact-messages') {
        loadContactMessages();
    } else if (tabId === 'contact-settings' && adminLeafletMap) {
        setTimeout(() => adminLeafletMap.invalidateSize(), 100);
    }
}

let adminLeafletMap = null;
let adminLeafletMarker = null;

function initAdminMapPicker(lat, lng) {
    if (typeof L === 'undefined') return; // Leaflet not loaded yet
    
    if (!adminLeafletMap) {
        adminLeafletMap = L.map('admin-map-picker').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(adminLeafletMap);

        adminLeafletMap.on('click', function(e) {
            updateAdminMapMarker(e.latlng.lat, e.latlng.lng);
        });
    } else {
        adminLeafletMap.setView([lat, lng], 13);
    }
    updateAdminMapMarker(lat, lng, false);
    
    setTimeout(() => adminLeafletMap.invalidateSize(), 100);
}

function updateAdminMapMarker(lat, lng, pan = false) {
    if (!adminLeafletMap) return;
    
    if (adminLeafletMarker) {
        adminLeafletMarker.setLatLng([lat, lng]);
    } else {
        adminLeafletMarker = L.marker([lat, lng]).addTo(adminLeafletMap);
    }
    
    if (pan) adminLeafletMap.panTo([lat, lng]);
    
    document.getElementById('contact-map-lat').value = lat;
    document.getElementById('contact-map-lng').value = lng;
    document.getElementById('map-coords-display').textContent = `Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    
    // Generate Google Maps embed URL dynamically
    const url = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;
    document.getElementById('contact-map-url').value = url;
}

function getContactCurrentLocation() {
    if (navigator.geolocation) {
        showToast("Requesting your current location...");
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateAdminMapMarker(lat, lng, true);
            showToast("Location updated successfully!");
        }, (err) => {
            console.error(err);
            showToast("Failed to get location. Please allow browser location access.", true);
        });
    } else {
        showToast("Geolocation is not supported by your browser.", true);
    }
}

// --- Header & Footer Management ---
async function loadHeaderFooterContent() {
    let data = {};
    const localDataStr = localStorage.getItem('eco_homepage_content');
    if (localDataStr) {
        try { data = JSON.parse(localDataStr); } catch (e) {}
    }
    if (supabaseClient) {
        try {
            const { data: dbData } = await supabaseClient.from('homepage_content').select('*').eq('id', 1).maybeSingle();
            if (dbData && dbData.content_json) {
                data = typeof dbData.content_json === 'string' ? JSON.parse(dbData.content_json) : dbData.content_json;
            }
        } catch(e) {}
    }

    // Topbar
    if (document.getElementById('topbar-address')) document.getElementById('topbar-address').value = data.topbar_address || '123 Street, New York, USA';
    if (document.getElementById('topbar-hours')) document.getElementById('topbar-hours').value = data.topbar_hours || 'Mon - Fri : 09.00 AM - 09.00 PM';
    if (document.getElementById('topbar-phone')) document.getElementById('topbar-phone').value = data.topbar_phone || '+012 345 6789';

    // Social Links
    if (document.getElementById('social-facebook')) document.getElementById('social-facebook').value = data.social_facebook || '';
    if (document.getElementById('social-twitter')) document.getElementById('social-twitter').value = data.social_twitter || '';
    if (document.getElementById('social-linkedin')) document.getElementById('social-linkedin').value = data.social_linkedin || '';
    if (document.getElementById('social-instagram')) document.getElementById('social-instagram').value = data.social_instagram || '';
    if (document.getElementById('social-youtube')) document.getElementById('social-youtube').value = data.social_youtube || '';

    // Footer & Copyright
    if (document.getElementById('footer-copyright')) document.getElementById('footer-copyright').value = data.footer_copyright || '© Your Site Name, All Right Reserved.';
    if (document.getElementById('footer-desc-input')) document.getElementById('footer-desc-input').value = data.footer_desc || 'Dolor amet sit justo amet elitr clita ipsum elitr est.';
    if (document.getElementById('footer-address-input')) document.getElementById('footer-address-input').value = data.footer_address || '123 Street, New York, USA';
    if (document.getElementById('footer-phone-input')) document.getElementById('footer-phone-input').value = data.footer_phone || '+012 345 67890';
    if (document.getElementById('footer-email-input')) document.getElementById('footer-email-input').value = data.footer_email || 'info@example.com';

    for (let i = 1; i <= 6; i++) {
        const preview = document.getElementById(`footgal${i}-image-preview`);
        if (preview) {
            preview.src = data[`footgal${i}_img`] || `img/gallery-${i}.jpg`;
            preview.setAttribute('src', data[`footgal${i}_img`] || `img/gallery-${i}.jpg`);
        }
    }
}

async function saveHeaderFooterContent() {
    showToast("Saving Global Settings...");
    
    // Fetch current to merge
    let data = {};
    if (supabaseClient) {
        try {
            const { data: dbData } = await supabaseClient.from('homepage_content').select('*').eq('id', 1).maybeSingle();
            if (dbData && dbData.content_json) {
                data = typeof dbData.content_json === 'string' ? JSON.parse(dbData.content_json) : dbData.content_json;
            }
        } catch(e) {}
    } else {
        const localDataStr = localStorage.getItem('eco_homepage_content');
        if (localDataStr) try { data = JSON.parse(localDataStr); } catch(e){}
    }

    // Merge Topbar
    data.topbar_address = document.getElementById('topbar-address').value.trim();
    data.topbar_hours = document.getElementById('topbar-hours').value.trim();
    data.topbar_phone = document.getElementById('topbar-phone').value.trim();

    // Merge Social Links
    data.social_facebook = document.getElementById('social-facebook').value.trim();
    data.social_twitter = document.getElementById('social-twitter').value.trim();
    data.social_linkedin = document.getElementById('social-linkedin').value.trim();
    data.social_instagram = document.getElementById('social-instagram').value.trim();
    data.social_youtube = document.getElementById('social-youtube').value.trim();

    // Merge Footer
    data.footer_copyright = document.getElementById('footer-copyright').value.trim();
    data.footer_desc = document.getElementById('footer-desc-input').value.trim();
    data.footer_address = document.getElementById('footer-address-input').value.trim();
    data.footer_phone = document.getElementById('footer-phone-input').value.trim();
    data.footer_email = document.getElementById('footer-email-input').value.trim();

    for (let i = 1; i <= 6; i++) {
        data[`footgal${i}_img`] = getImageSrc(`footgal${i}`);
    }

    localStorage.setItem('eco_homepage_content', JSON.stringify(data));

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('homepage_content').upsert({
                id: 1,
                content_json: data
            });
            if (error) throw error;
            showToast("Global Settings saved to Supabase!");
        } catch(err) {
            console.error(err);
            showToast("Saved locally, failed to sync with Supabase.", true);
        }
    } else {
        showToast("Global Settings saved locally!");
    }
}

// --- Per-section Save for Header & Footer ---
async function saveHeaderFooterSection(section, btnEl) {
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    // Fetch current data to merge
    let data = {};
    if (supabaseClient) {
        try {
            const { data: dbData } = await supabaseClient.from('homepage_content').select('*').eq('id', 1).maybeSingle();
            if (dbData && dbData.content_json) {
                data = typeof dbData.content_json === 'string' ? JSON.parse(dbData.content_json) : dbData.content_json;
            }
        } catch(e) {}
    } else {
        const localDataStr = localStorage.getItem('eco_homepage_content');
        if (localDataStr) try { data = JSON.parse(localDataStr); } catch(e){}
    }

    if (section === 'topbar') {
        data.topbar_address = document.getElementById('topbar-address').value.trim();
        data.topbar_hours = document.getElementById('topbar-hours').value.trim();
        data.topbar_phone = document.getElementById('topbar-phone').value.trim();
    } else if (section === 'social') {
        data.social_facebook = document.getElementById('social-facebook').value.trim();
        data.social_twitter = document.getElementById('social-twitter').value.trim();
        data.social_linkedin = document.getElementById('social-linkedin').value.trim();
        data.social_instagram = document.getElementById('social-instagram').value.trim();
        data.social_youtube = document.getElementById('social-youtube').value.trim();
    } else if (section === 'footer') {
        data.footer_copyright = document.getElementById('footer-copyright').value.trim();
        data.footer_desc = document.getElementById('footer-desc-input').value.trim();
        data.footer_address = document.getElementById('footer-address-input').value.trim();
        data.footer_phone = document.getElementById('footer-phone-input').value.trim();
        data.footer_email = document.getElementById('footer-email-input').value.trim();
        for (let i = 1; i <= 6; i++) {
            data[`footgal${i}_img`] = getImageSrc(`footgal${i}`);
        }
    }

    localStorage.setItem('eco_homepage_content', JSON.stringify(data));

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('homepage_content').upsert({ id: 1, content_json: data });
            if (error) throw error;
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved to Supabase!`);
        } catch(err) {
            console.error(err);
            showToast("Saved locally, failed to sync with Supabase.", true);
        }
    } else {
        showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved locally!`);
    }

    if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save ' + section.charAt(0).toUpperCase() + section.slice(1);
    }
}

function resetHeaderFooterSection(section) {
    if (!confirm(`Reset ${section} to default values?`)) return;

    if (section === 'topbar') {
        document.getElementById('topbar-address').value = '123 Street, New York, USA';
        document.getElementById('topbar-hours').value = 'Mon - Fri : 09.00 AM - 09.00 PM';
        document.getElementById('topbar-phone').value = '+012 345 6789';
    } else if (section === 'social') {
        document.getElementById('social-facebook').value = '';
        document.getElementById('social-twitter').value = '';
        document.getElementById('social-linkedin').value = '';
        document.getElementById('social-instagram').value = '';
        document.getElementById('social-youtube').value = '';
    } else if (section === 'footer') {
        document.getElementById('footer-copyright').value = '© Your Site Name, All Right Reserved.';
        document.getElementById('footer-desc-input').value = 'Dolor amet sit justo amet elitr clita ipsum elitr est.';
        document.getElementById('footer-address-input').value = '123 Street, New York, USA';
        document.getElementById('footer-phone-input').value = '+012 345 67890';
        document.getElementById('footer-email-input').value = 'info@example.com';
        for (let i = 1; i <= 6; i++) {
            const preview = document.getElementById(`footgal${i}-image-preview`);
            if (preview) {
                preview.src = `img/gallery-${i}.jpg`;
                preview.setAttribute('src', `img/gallery-${i}.jpg`);
            }
        }
    }
    showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} reset to defaults.`);
}

function loadContactMessages() {
    const tbody = document.getElementById('contact-messages-tbody');
    if (!tbody || !adminContactData) return;

    const messages = adminContactData.messages || [];
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="fa-solid fa-inbox fa-2x mb-2"></i><br>No messages received yet.</td></tr>';
        return;
    }

    tbody.innerHTML = messages.sort((a,b) => new Date(b.date) - new Date(a.date)).map((msg) => {
        const date = new Date(msg.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' });
        // Escape HTML
        const safeName = msg.name ? msg.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const safeEmail = msg.email ? msg.email.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown';
        const safeSubject = msg.subject ? msg.subject.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'No Subject';
        const safeMsg = msg.message ? msg.message.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const shortMsg = safeMsg.length > 50 ? safeMsg.substring(0,50) + '...' : safeMsg;

        return `
            <tr>
                <td>${date}</td>
                <td><strong>${safeName}</strong></td>
                <td><a href="mailto:${safeEmail}">${safeEmail}</a></td>
                <td>${safeSubject}</td>
                <td title="${safeMsg}">${shortMsg}</td>
                <td>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deleteContactMessage('${msg.id}')" title="Delete message">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteContactMessage(msgId) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    if (!adminContactData) return;
    
    adminContactData.messages = (adminContactData.messages || []).filter(m => String(m.id) !== String(msgId));
    
    localStorage.setItem('eco_contact_content', JSON.stringify(adminContactData));
    
    if (supabaseClient) {
        try {
            await supabaseClient.from('homepage_content').upsert({ id: 11, content_json: adminContactData });
        } catch(err) { console.error(err); }
    }
    
    loadContactMessages();
    showToast('Message deleted.');
}

