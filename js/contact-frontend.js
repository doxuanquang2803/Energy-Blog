document.addEventListener('DOMContentLoaded', async function () {
    const isContactPage = window.location.pathname.toLowerCase().includes('contact.html');
    if (!isContactPage) return;

    // Load Data
    let contactData = null;
    const cached = localStorage.getItem('eco_contact_content');
    if (cached) {
        try { contactData = JSON.parse(cached); } catch(e){}
    }

    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        try {
            const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            const { data, error } = await client.from('homepage_content').select('*').eq('id', 11).maybeSingle();
            if (!error && data && data.content_json) {
                contactData = Object.assign({}, contactData, typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json);
                localStorage.setItem('eco_contact_content', JSON.stringify(contactData));
            }
        } catch(e){}
    }

    if (!contactData) return;

    // Apply Banner
    const header = document.querySelector('.page-header');
    if (header && contactData.banner) {
        if (contactData.banner.image) {
            header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${contactData.banner.image}')`;
        }
        const titleEl = header.querySelector('h1');
        if (titleEl && contactData.banner.title) titleEl.textContent = contactData.banner.title;
        const breadcrumbActive = header.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive && contactData.banner.title) breadcrumbActive.textContent = contactData.banner.title;
    }

    // Apply Content
    const subtitleEl = document.querySelector('.contact-text h6.text-primary');
    if (subtitleEl && contactData.content && contactData.content.subtitle) {
        subtitleEl.textContent = contactData.content.subtitle;
    }
    const titleEl = document.querySelector('.contact-text h1.mb-4');
    if (titleEl && contactData.content && contactData.content.title) {
        titleEl.textContent = contactData.content.title;
    }
    const descEl = document.querySelector('.contact-text p.mb-4');
    if (descEl && contactData.content && contactData.content.description) {
        descEl.innerHTML = contactData.content.description;
    }

    // Apply Map
    const iframe = document.querySelector('#section-contact iframe');
    if (iframe && contactData.map_url) {
        iframe.src = contactData.map_url;
    }

    // Intercept form submission
    const form = document.querySelector('.contact form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !message) {
                const existingAlert = form.parentNode.querySelector('.alert-danger');
                if (existingAlert) existingAlert.remove();

                const errDiv = document.createElement('div');
                errDiv.className = 'alert alert-danger mt-3';
                errDiv.textContent = 'Please fill in Name, Email, and Message fields.';
                form.insertAdjacentElement('beforebegin', errDiv);
                setTimeout(() => { errDiv.remove(); }, 5000);

                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            const newMsg = {
                id: 'msg-' + Date.now(),
                date: new Date().toISOString(),
                name, email, subject, message
            };

            if (!contactData.messages) contactData.messages = [];
            contactData.messages.push(newMsg);

            // Save
            localStorage.setItem('eco_contact_content', JSON.stringify(contactData));
            
            if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
                try {
                    const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                    await client.from('homepage_content').upsert({ id: 11, content_json: contactData });
                } catch(err) {}
            }

            // Show success
            const responseDiv = document.createElement('div');
            responseDiv.className = 'alert alert-success mt-3';
            responseDiv.textContent = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
            form.insertAdjacentElement('beforebegin', responseDiv);
            
            form.reset();
            btn.textContent = originalText;
            btn.disabled = false;

            setTimeout(() => { responseDiv.remove(); }, 5000);
        });
    }
});
