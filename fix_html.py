import os
import re
import glob

# The correct navbar replacement block
NAVBAR_REPLACEMENT = """    <!-- Navbar Start -->
    <nav class="navbar navbar-expand-lg bg-white navbar-light sticky-top p-0">
        <a href="index.html" class="navbar-brand d-flex align-items-center border-end px-4 px-lg-5">
            <h2 class="m-0 text-primary">Solartec</h2>
        </a>
        <button type="button" class="navbar-toggler me-4" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarCollapse">
            <div class="navbar-nav ms-auto p-4 p-lg-0">
                <a href="index.html" class="nav-item nav-link">Home</a>
                <a href="about.html" class="nav-item nav-link">About</a>
                <a href="service.html" class="nav-item nav-link">Service</a>
                <a href="project.html" class="nav-item nav-link">Project</a>
                <div class="nav-item dropdown" id="blog-nav-dropdown">
                    <a href="blog.html" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">Blog</a>
                    <div class="dropdown-menu bg-light m-0" id="blog-categories-menu">
                        <a href="blog.html" class="dropdown-item">All Posts</a>
                    </div>
                </div>
                <a href="contact.html" class="nav-item nav-link">Contact</a>
            </div>
            <a href="index.html#section-quote" class="btn btn-primary rounded-0 py-4 px-lg-5 d-none d-lg-block">Get A Quote<i class="fa fa-arrow-right ms-3"></i></a>
        </div>
    </nav>
    <!-- Navbar End -->"""

# Dictionary of Section Comment -> ID to inject in the div
SECTION_IDS = {
    '<!-- Feature Start -->': 'id="section-stats"',
    '<!-- About Start -->': 'id="section-about"',
    '<!-- Team Start -->': 'id="section-team"',
    '<!-- Service Start -->': 'id="section-services"',
    '<!-- Feature Start -->': 'id="section-features"', # Note: Feature is used for both stats and why choose us, we will handle this with regex
    '<!-- Quote Start -->': 'id="section-quote"',
    '<!-- Project Start -->': 'id="section-projects"',
    '<!-- Testimonial Start -->': 'id="section-testimonial"',
    '<!-- Contact Start -->': 'id="section-contact"',
    '<!-- Footer Start -->': 'id="section-footer"'
}

def process_file(src_path, dst_path):
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace Navbar
    content = re.sub(r'<!-- Navbar Start -->.*?<!-- Navbar End -->', NAVBAR_REPLACEMENT, content, flags=re.DOTALL)

    # 2. Add blog-frontend.js and supabase-config/site-loader
    if 'js/site-loader.js' not in content:
        script_injection = """    <!-- Supabase CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js"></script>
    <script src="js/site-loader.js"></script>
    <script src="js/blog-frontend.js"></script>
    <!-- Template Javascript -->"""
        content = content.replace('<!-- Template Javascript -->', script_injection)
    else:
        if 'js/blog-frontend.js' not in content:
            content = content.replace('<!-- Template Javascript -->', '<script src="js/blog-frontend.js"></script>\n    <!-- Template Javascript -->')

    # 3. Add section IDs dynamically based on comments
    # Replace `<div class="container-xxl` right after the comment with `<div id="..." class="container-xxl`
    # Or `<div class="container-fluid` with `<div id="..." class="container-fluid`
    
    # About
    content = re.sub(r'(<!-- About Start -->\s*<div )class="', r'\1id="section-about" class="', content)
    # Team
    content = re.sub(r'(<!-- Team Start -->\s*<div )class="', r'\1id="section-team" class="', content)
    # Service
    content = re.sub(r'(<!-- Service Start -->\s*<div )class="', r'\1id="section-services" class="', content)
    # Quote
    content = re.sub(r'(<!-- Quote Start -->\s*<div )class="', r'\1id="section-quote" class="', content)
    # Project
    content = re.sub(r'(<!-- Project Start -->\s*<div )class="', r'\1id="section-projects" class="', content)
    # Testimonial
    content = re.sub(r'(<!-- Testimonial Start -->\s*<div )class="', r'\1id="section-testimonial" class="', content)
    # Contact
    content = re.sub(r'(<!-- Contact Start -->\s*<div )class="', r'\1id="section-contact" class="', content)
    # Footer
    content = re.sub(r'(<!-- Footer Start -->\s*<div )class="', r'\1id="section-footer" class="', content)
    
    # Feature blocks (stats vs features)
    # The first Feature Start might be stats or why choose us depending on the page
    # A reliable way: if it contains "counter-up" it's stats, else features. But we can just use python re to find all Feature Start blocks
    feature_blocks = re.split(r'<!-- Feature Start -->', content)
    if len(feature_blocks) > 1:
        for i in range(1, len(feature_blocks)):
            block = feature_blocks[i]
            if 'counter-up' in block:
                block = re.sub(r'^\s*<div class="', r'\n    <div id="section-stats" class="', block)
            else:
                block = re.sub(r'^\s*<div class="', r'\n    <div id="section-features" class="', block)
            feature_blocks[i] = block
        content = '<!-- Feature Start -->'.join(feature_blocks)

    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(content)

pages = ['about.html', 'service.html', 'project.html', 'contact.html', 'feature.html', 'quote.html', '404.html', 'testimonial.html', 'team.html']
for p in pages:
    src = f"/tmp/solartec-github/{p}"
    dst = f"/Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/{p}"
    if os.path.exists(src):
        process_file(src, dst)
        print(f"Restored and updated {p}")
