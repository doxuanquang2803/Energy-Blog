/**
 * Blog Frontend - Handles blog listing, search, detail, comments
 * Data stored in localStorage key: eco_blog_content (id=10 in Supabase)
 */

const BLOG_DEFAULTS = {
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
            content: 'Solar panel technology has advanced dramatically in recent years. New perovskite-silicon tandem cells are pushing efficiency beyond 30%, promising a revolution in how we harness sunlight. These breakthroughs could make solar energy the most affordable power source globally within the next decade.\n\nResearchers are also exploring transparent solar cells that could be integrated into windows, turning entire buildings into power generators. The combination of improved efficiency and creative applications suggests a bright future for solar technology.',
            thumbnail: 'img/img-600x400-1.jpg', status: 'published',
            created_at: '2026-05-15T10:00:00Z', author: 'Admin',
            comments: [
                { name: 'John Doe', email: 'john@example.com', text: 'Great article! Very informative about the future of solar.', date: '2026-05-16T08:00:00Z' }
            ]
        },
        {
            id: 'post-2', title: 'How Wind Farms Are Changing Rural Communities', slug: 'wind-farms-rural-communities',
            category_id: '2', category_name: 'Wind Power',
            tags: ['wind','sustainability','green'],
            content: 'Wind energy is transforming rural landscapes across the globe. Modern wind turbines generate enough electricity to power thousands of homes while providing substantial lease income to landowners. Communities near wind farms often see increased tax revenue, funding better schools and infrastructure.\n\nHowever, the transition is not without challenges. Balancing economic benefits with environmental concerns requires careful planning and community engagement.',
            thumbnail: 'img/img-600x400-2.jpg', status: 'published',
            created_at: '2026-05-12T14:30:00Z', author: 'Admin',
            comments: []
        },
        {
            id: 'post-3', title: '10 Simple Ways to Live More Sustainably', slug: '10-ways-live-sustainably',
            category_id: '3', category_name: 'Sustainability',
            tags: ['sustainability','eco-friendly','energy-saving'],
            content: 'Living sustainably does not require drastic lifestyle changes. Small, consistent actions can make a significant impact on your carbon footprint. Here are ten practical steps you can start today:\n\n1. Switch to LED lighting throughout your home\n2. Use reusable bags and containers\n3. Reduce water waste with low-flow fixtures\n4. Choose public transportation or cycling when possible\n5. Support local and organic food producers\n6. Minimize single-use plastics\n7. Invest in energy-efficient appliances\n8. Start composting kitchen waste\n9. Plant trees and maintain green spaces\n10. Educate others about sustainability practices',
            thumbnail: 'img/img-600x400-3.jpg', status: 'published',
            created_at: '2026-05-10T09:15:00Z', author: 'Admin',
            comments: [
                { name: 'Sarah M.', email: 'sarah@example.com', text: 'Love these tips! Already started composting.', date: '2026-05-11T12:00:00Z' },
                { name: 'Mike R.', email: 'mike@example.com', text: 'Number 7 saved me a lot on electricity bills!', date: '2026-05-12T15:30:00Z' }
            ]
        },
        {
            id: 'post-4', title: 'Green Tech Innovations That Will Shape 2027', slug: 'green-tech-innovations-2027',
            category_id: '4', category_name: 'Green Technology',
            tags: ['innovation','green','clean-energy','climate'],
            content: 'The green technology sector continues to innovate at an unprecedented pace. From advanced battery storage solutions to AI-powered energy management systems, the tools available to combat climate change are more powerful than ever.\n\nKey innovations to watch include solid-state batteries, green hydrogen production, carbon capture technology, and smart grid systems that optimize energy distribution in real-time.',
            thumbnail: 'img/img-600x400-4.jpg', status: 'published',
            created_at: '2026-05-08T11:45:00Z', author: 'Admin',
            comments: []
        },
        {
            id: 'post-5', title: 'Reducing Your Home Energy Bill: A Complete Guide', slug: 'reducing-home-energy-bill',
            category_id: '5', category_name: 'Energy Tips',
            tags: ['energy-saving','sustainability','renewable'],
            content: 'Energy costs continue to rise, but there are many strategies homeowners can employ to significantly reduce their bills. This comprehensive guide covers everything from simple behavioral changes to strategic investments in energy efficiency.\n\nStart with an energy audit to identify where your home loses the most energy. Common culprits include poor insulation, outdated HVAC systems, and inefficient lighting. Addressing these issues can reduce your energy consumption by 20-40%.',
            thumbnail: 'img/img-600x400-5.jpg', status: 'published',
            created_at: '2026-05-05T16:20:00Z', author: 'Admin',
            comments: []
        },
        {
            id: 'post-6', title: 'Understanding Solar Panel Installation Process', slug: 'understanding-solar-installation',
            category_id: '1', category_name: 'Solar Energy',
            tags: ['solar','renewable','energy-saving'],
            content: 'Installing solar panels on your home is one of the best investments you can make for both the environment and your finances. This guide walks you through the entire process, from initial assessment to final connection.\n\nThe first step is evaluating your roof orientation and shading. South-facing roofs with minimal obstruction are ideal. Next, a qualified installer will design a system sized to your energy needs and handle all permitting requirements.',
            thumbnail: 'img/img-600x400-6.jpg', status: 'published',
            created_at: '2026-05-02T13:00:00Z', author: 'Admin',
            comments: []
        }
    ]
};

let blogData = null;
let blogCurrentPage = 1;
let blogPostsPerPage = 6;
let blogFilterCategory = null;
let blogFilterTag = null;
let blogSearchQuery = '';

// --- Initialize ---
document.addEventListener('DOMContentLoaded', async function () {
    await loadBlogData();
    populateBlogNavDropdown();
    applyBlogBanner();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('blog-post.html')) {
        renderPostDetail();
    } else if (path.includes('blog.html') || path.includes('blog-category.html')) {
        initBlogListPage();
    }
});

async function loadBlogData() {
    // 1. Defaults
    blogData = JSON.parse(JSON.stringify(BLOG_DEFAULTS));

    // 2. LocalStorage
    const cached = localStorage.getItem('eco_blog_content');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            blogData = Object.assign({}, BLOG_DEFAULTS, parsed);
            if (parsed.posts) blogData.posts = parsed.posts;
            if (parsed.categories) blogData.categories = parsed.categories;
        } catch (e) { console.error('Blog cache parse error:', e); }
    }

    // 3. Supabase
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        try {
            const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            const { data, error } = await client.from('homepage_content').select('*').eq('id', 10).maybeSingle();
            if (!error && data && data.content_json) {
                const db = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
                blogData = Object.assign({}, BLOG_DEFAULTS, db);
                if (db.posts) blogData.posts = db.posts;
                if (db.categories) blogData.categories = db.categories;
                localStorage.setItem('eco_blog_content', JSON.stringify(blogData));
            }
        } catch (e) { console.error('Blog Supabase fetch error:', e); }
    }
}

// --- Apply Banner ---
function applyBlogBanner() {
    if (!blogData || !blogData.banner) return;
    
    // ONLY apply if on a blog page
    const path = window.location.pathname.toLowerCase();
    const isBlogPage = path.includes('blog.html') || path.includes('blog-post.html') || path.includes('blog-category.html');
    if (!isBlogPage) return;

    const { title, image } = blogData.banner;

    // Apply background image to .page-header
    const header = document.querySelector('.page-header');
    if (header && image) {
        header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${image}')`;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
    }

    // Apply title to blog list page
    const bannerTitle = header ? header.querySelector('h1') : null;
    if (bannerTitle && title && !path.includes('blog-post.html')) {
        bannerTitle.textContent = title;
    }
}

// --- Nav Dropdown ---
function populateBlogNavDropdown() {
    const menu = document.getElementById('blog-categories-menu');
    if (!menu || !blogData) return;
    menu.innerHTML = '<a href="blog.html" class="dropdown-item">All Posts</a>';
    blogData.categories.forEach(cat => {
        const a = document.createElement('a');
        a.href = `blog.html?cat=${encodeURIComponent(cat.id)}`;
        a.className = 'dropdown-item';
        a.textContent = cat.name;
        menu.appendChild(a);
    });
}

// --- Blog Listing Page ---
function initBlogListPage() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cat')) blogFilterCategory = params.get('cat');
    if (params.get('tag')) blogFilterTag = params.get('tag');
    if (params.get('q')) blogSearchQuery = params.get('q');

    const searchInput = document.getElementById('blog-search-input');
    if (searchInput) {
        searchInput.value = blogSearchQuery;
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performBlogSearch(); });
    }
    const searchBtn = document.getElementById('blog-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', performBlogSearch);

    renderBlogSidebar();
    renderBlogPosts();
}

function performBlogSearch() {
    const input = document.getElementById('blog-search-input');
    blogSearchQuery = input ? input.value.trim() : '';
    blogCurrentPage = 1;
    renderBlogPosts();
}

function clearBlogFilters() {
    blogFilterCategory = null;
    blogFilterTag = null;
    blogSearchQuery = '';
    blogCurrentPage = 1;
    const input = document.getElementById('blog-search-input');
    if (input) input.value = '';
    renderBlogPosts();
    renderBlogSidebar();
}

function filterByCategory(catId) {
    blogFilterCategory = catId;
    blogFilterTag = null;
    blogCurrentPage = 1;
    renderBlogPosts();
    renderBlogSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterByTag(tag) {
    blogFilterTag = tag;
    blogCurrentPage = 1;
    renderBlogPosts();
    renderBlogSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getFilteredPosts() {
    let posts = (blogData.posts || []).filter(p => p.status === 'published');
    if (blogFilterCategory) {
        posts = posts.filter(p => String(p.category_id) === String(blogFilterCategory));
    }
    if (blogFilterTag) {
        posts = posts.filter(p => p.tags && p.tags.includes(blogFilterTag));
    }
    if (blogSearchQuery) {
        const q = blogSearchQuery.toLowerCase();
        posts = posts.filter(p => {
            const titleMatch = (p.title || '').toLowerCase().includes(q);
            const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
            return titleMatch || tagMatch;
        });
    }
    return posts;
}

function renderBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    if (!container) return;

    const filtered = getFilteredPosts();
    const totalPages = Math.ceil(filtered.length / blogPostsPerPage);
    if (blogCurrentPage > totalPages) blogCurrentPage = totalPages || 1;

    const start = (blogCurrentPage - 1) * blogPostsPerPage;
    const paginated = filtered.slice(start, start + blogPostsPerPage);

    // Active filters
    const filtersEl = document.getElementById('blog-active-filters');
    const badgesEl = document.getElementById('blog-filter-badges');
    if (filtersEl && badgesEl) {
        let badges = '';
        if (blogFilterCategory) {
            const cat = blogData.categories.find(c => String(c.id) === String(blogFilterCategory));
            badges += `<span class="filter-badge"><i class="fas fa-folder"></i> ${cat ? cat.name : blogFilterCategory} <span class="remove-filter" onclick="blogFilterCategory=null;renderBlogPosts();renderBlogSidebar();">&times;</span></span> `;
        }
        if (blogFilterTag) {
            badges += `<span class="filter-badge"><i class="fas fa-tag"></i> ${blogFilterTag} <span class="remove-filter" onclick="blogFilterTag=null;renderBlogPosts();renderBlogSidebar();">&times;</span></span> `;
        }
        if (blogSearchQuery) {
            badges += `<span class="filter-badge"><i class="fas fa-search"></i> "${blogSearchQuery}" <span class="remove-filter" onclick="blogSearchQuery='';document.getElementById('blog-search-input').value='';renderBlogPosts();">&times;</span></span> `;
        }
        badgesEl.innerHTML = badges;
        filtersEl.style.display = badges ? 'block' : 'none';
    }

    if (paginated.length === 0) {
        container.innerHTML = `<div class="col-12 no-posts-found"><i class="fas fa-search"></i><h5>No posts found</h5><p>Try a different search term or category.</p></div>`;
        renderBlogPagination(0);
        return;
    }

    container.innerHTML = paginated.map((post, i) => {
        const date = new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const excerpt = (post.content || '').substring(0, 150).replace(/\n/g, ' ') + '...';
        const tags = (post.tags || []).slice(0, 3).map(t => `<a href="javascript:void(0)" class="post-tag" onclick="filterByTag('${t}')">${t}</a>`).join('');
        const commentsCount = (post.comments || []).length;
        const postIndex = blogData.posts.indexOf(post);

        return `
        <div class="col-md-6 wow fadeInUp" data-wow-delay="${0.1 + (i % 3) * 0.2}s">
            <div class="blog-post-card">
                <div class="post-thumbnail">
                    <a href="blog-post.html?id=${postIndex}">
                        <img src="${post.thumbnail || 'img/img-600x400-1.jpg'}" alt="${post.title}" loading="lazy">
                    </a>
                    <span class="post-category-badge">${post.category_name || ''}</span>
                </div>
                <div class="post-body">
                    <div class="post-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                        <span><i class="fas fa-comments"></i> ${commentsCount}</span>
                    </div>
                    <a href="blog-post.html?id=${postIndex}" style="text-decoration:none;">
                        <h5 class="post-title">${post.title}</h5>
                    </a>
                    <p class="post-excerpt">${excerpt}</p>
                    ${tags ? `<div class="post-tags">${tags}</div>` : ''}
                    <div class="post-footer">
                        <a href="blog-post.html?id=${postIndex}" class="read-more-link">Read More <i class="fas fa-arrow-right"></i></a>
                        <span class="comment-count"><i class="fas fa-comment"></i> ${commentsCount}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    renderBlogPagination(totalPages);
}

function renderBlogPagination(totalPages) {
    const pagination = document.getElementById('blog-pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    // Prev
    const prev = document.createElement('li');
    prev.className = `page-item ${blogCurrentPage === 1 ? 'disabled' : ''}`;
    prev.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-left"></i></a>`;
    if (blogCurrentPage > 1) prev.addEventListener('click', e => { e.preventDefault(); blogCurrentPage--; renderBlogPosts(); window.scrollTo({top:0,behavior:'smooth'}); });
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === blogCurrentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" style="border-radius:6px;margin:0 2px;${i===blogCurrentPage?'background:#00693e;border-color:#00693e;color:#fff;':'color:#00693e;'}">${i}</a>`;
        li.addEventListener('click', e => { e.preventDefault(); blogCurrentPage = i; renderBlogPosts(); window.scrollTo({top:0,behavior:'smooth'}); });
        pagination.appendChild(li);
    }

    // Next
    const next = document.createElement('li');
    next.className = `page-item ${blogCurrentPage === totalPages ? 'disabled' : ''}`;
    next.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>`;
    if (blogCurrentPage < totalPages) next.addEventListener('click', e => { e.preventDefault(); blogCurrentPage++; renderBlogPosts(); window.scrollTo({top:0,behavior:'smooth'}); });
    pagination.appendChild(next);
}

function renderBlogSidebar() {
    // Categories
    const catContainer = document.getElementById('blog-sidebar-categories');
    if (catContainer && blogData) {
        const publishedPosts = blogData.posts.filter(p => p.status === 'published');
        catContainer.innerHTML = blogData.categories.map(cat => {
            const count = publishedPosts.filter(p => String(p.category_id) === String(cat.id)).length;
            const isActive = String(blogFilterCategory) === String(cat.id);
            return `<a href="javascript:void(0)" class="category-link ${isActive ? 'active' : ''}" onclick="filterByCategory('${cat.id}')">
                <span><i class="fas fa-chevron-right me-2" style="font-size:10px;"></i>${cat.name}</span>
                <span class="cat-count">${count}</span>
            </a>`;
        }).join('');
    }

    // Tags
    const tagContainer = document.getElementById('blog-sidebar-tags');
    if (tagContainer && blogData) {
        const allTags = [];
        blogData.posts.filter(p => p.status === 'published').forEach(p => {
            (p.tags || []).forEach(t => { if (!allTags.includes(t)) allTags.push(t); });
        });
        tagContainer.innerHTML = allTags.map(t => {
            const isActive = blogFilterTag === t;
            return `<a href="javascript:void(0)" class="tag-item ${isActive ? 'active' : ''}" onclick="filterByTag('${t}')">${t}</a>`;
        }).join('');
    }

    // Recent Posts
    const recentContainer = document.getElementById('blog-sidebar-recent');
    if (recentContainer && blogData) {
        const recent = blogData.posts.filter(p => p.status === 'published').slice(0, 5);
        recentContainer.innerHTML = recent.map(post => {
            const date = new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const postIndex = blogData.posts.indexOf(post);
            return `<a href="blog-post.html?id=${postIndex}" class="recent-post-item">
                <div class="recent-post-thumb"><img src="${post.thumbnail || 'img/img-600x400-1.jpg'}" alt="${post.title}" loading="lazy"></div>
                <div class="recent-post-info">
                    <div class="recent-post-title">${post.title}</div>
                    <div class="recent-post-date"><i class="fas fa-clock me-1"></i>${date}</div>
                </div>
            </a>`;
        }).join('');
    }
}

// --- Post Detail ---
function renderPostDetail() {
    const params = new URLSearchParams(window.location.search);
    const postId = parseInt(params.get('id'), 10);

    if (isNaN(postId) || !blogData.posts[postId]) {
        document.getElementById('blog-post-detail').innerHTML = `
            <div class="text-center py-5"><i class="fas fa-exclamation-triangle text-danger" style="font-size:48px;"></i>
            <h3 class="mt-3">Post Not Found</h3><p class="text-muted">The post you are looking for does not exist.</p>
            <a href="blog.html" class="btn btn-primary rounded-pill py-2 px-4 mt-3">Back to Blog</a></div>`;
        return;
    }

    const post = blogData.posts[postId];
    const date = new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const comments = post.comments || [];

    // Banner & breadcrumb
    const bannerTitle = document.getElementById('post-detail-banner-title');
    if (bannerTitle) bannerTitle.textContent = post.title;
    const breadcrumb = document.getElementById('post-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = post.title.length > 40 ? post.title.substring(0,40)+'...' : post.title;

    // Update header background image to use the post's banner image, fallback to global banner
    const header = document.querySelector('.page-header');
    const globalBanner = blogData.banner ? blogData.banner.image : null;
    const bgImage = post.banner_image || globalBanner || 'img/carousel-1.jpg';
    if (header) {
        header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${bgImage}')`;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
    }

    // Image
    const imgEl = document.getElementById('post-detail-image');
    if (imgEl) imgEl.src = post.thumbnail || 'img/img-600x400-1.jpg';

    // Meta
    const catEl = document.getElementById('post-detail-category');
    if (catEl) { catEl.textContent = post.category_name || ''; catEl.href = `blog.html?cat=${post.category_id}`; }
    const dateEl = document.getElementById('post-detail-date');
    if (dateEl) dateEl.textContent = date;
    const ccEl = document.getElementById('post-detail-comment-count');
    if (ccEl) ccEl.textContent = comments.length;

    // Title
    const titleEl = document.getElementById('post-detail-title');
    if (titleEl) titleEl.textContent = post.title;

    // Tags
    const tagsEl = document.getElementById('post-detail-tags');
    if (tagsEl) {
        tagsEl.innerHTML = (post.tags || []).map(t => `<a href="blog.html?tag=${encodeURIComponent(t)}" class="post-tag">#${t}</a>`).join(' ');
    }

    // Content & Body Images
    const contentEl = document.getElementById('post-detail-content');
    if (contentEl) {
        let html = '';
        if (post.content && (post.content.includes('<p>') || post.content.includes('<h'))) {
            html += post.content;
        } else {
            const paragraphs = (post.content || '').split('\n').filter(p => p.trim());
            html += paragraphs.map(p => `<p>${p}</p>`).join('');
        }

        if (post.body_images && post.body_images.length > 0) {
            post.body_images.forEach(img => {
                if (img.url) {
                    html += `
                    <figure class="my-4 text-center">
                        <img src="${img.url}" class="img-fluid rounded shadow-sm" alt="Blog Image">
                        ${img.caption ? `<figcaption class="mt-2 text-muted fst-italic" style="font-size: 14px;">${escapeHtml(img.caption)}</figcaption>` : ''}
                    </figure>`;
                }
            });
        }
        contentEl.innerHTML = html;
    }

    // Share links
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const fbBtn = document.getElementById('share-facebook');
    if (fbBtn) fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    const twBtn = document.getElementById('share-twitter');
    if (twBtn) twBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    const liBtn = document.getElementById('share-linkedin');
    if (liBtn) liBtn.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;

    // Comments
    renderComments(postId);
    renderBlogSidebar();

    // Page title
    document.title = `${post.title} - Solartec Blog`;
}

function renderComments(postId) {
    const post = blogData.posts[postId];
    if (!post) return;
    const comments = post.comments || [];
    const countEl = document.getElementById('comments-count');
    if (countEl) countEl.textContent = comments.length;
    const ccEl = document.getElementById('post-detail-comment-count');
    if (ccEl) ccEl.textContent = comments.length;

    const listEl = document.getElementById('comments-list');
    if (!listEl) return;

    if (comments.length === 0) {
        listEl.innerHTML = '<p class="text-muted text-center py-3"><i class="fas fa-comment-slash me-2"></i>No comments yet. Be the first to share your thoughts!</p>';
        return;
    }

    listEl.innerHTML = comments.map(c => {
        const initial = (c.name || 'A').charAt(0).toUpperCase();
        const date = new Date(c.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div class="comment-item">
            <div class="comment-avatar">${initial}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(c.name)}</span>
                    <span class="comment-date"><i class="fas fa-clock me-1"></i>${date}</span>
                </div>
                <p class="comment-text">${escapeHtml(c.text)}</p>
            </div>
        </div>`;
    }).join('');
}

async function submitComment(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const postId = parseInt(params.get('id'), 10);
    if (isNaN(postId) || !blogData.posts[postId]) return;

    const name = document.getElementById('comment-name').value.trim();
    const email = document.getElementById('comment-email').value.trim();
    const text = document.getElementById('comment-text').value.trim();

    if (!name || !email || !text) {
        const form = document.getElementById('comment-form');
        if (form) {
            const existingAlert = form.parentNode.querySelector('.alert-danger');
            if (existingAlert) existingAlert.remove();

            const errDiv = document.createElement('div');
            errDiv.className = 'alert alert-danger mt-3';
            errDiv.textContent = 'Please fill in all fields.';
            form.insertAdjacentElement('beforebegin', errDiv);
            setTimeout(() => { errDiv.remove(); }, 5000);
        }
        return;
    }

    const comment = { name, email, text, date: new Date().toISOString() };

    if (!blogData.posts[postId].comments) blogData.posts[postId].comments = [];
    blogData.posts[postId].comments.push(comment);

    // Save
    localStorage.setItem('eco_blog_content', JSON.stringify(blogData));

    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        try {
            const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            await client.from('homepage_content').upsert({ id: 10, content_json: blogData });
        } catch (err) { console.error('Comment save error:', err); }
    }

    renderComments(postId);
    document.getElementById('comment-form').reset();
    document.getElementById('comments-list').scrollIntoView({ behavior: 'smooth' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag));
}
