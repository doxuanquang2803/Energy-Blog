import re

with open('/Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/project.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Project header text
content = content.replace('Our Projects', 'Project Detail')
content = content.replace('<li class="breadcrumb-item text-white active" aria-current="page">Project</li>', '<li class="breadcrumb-item text-white active" aria-current="page">Project Detail</li>')

# Replace the main section-projects with section-project-detail
detail_html = """    <!-- Project Detail Start -->
    <div id="section-project-detail" class="container-xxl py-5">
        <div class="container">
            <div class="row g-5">
                <div class="col-lg-8 wow fadeInUp" data-wow-delay="0.1s">
                    <img class="img-fluid rounded mb-5 project-detail-img" src="img/img-600x400-1.jpg" alt="">
                    <p class="fs-5 text-primary mb-3 project-detail-category">Category</p>
                    <h1 class="display-5 mb-4 project-detail-title">Project Title</h1>
                    <div class="project-detail-content text-muted fs-5">
                        <p>Project details will be loaded here...</p>
                    </div>
                </div>
                <div class="col-lg-4 wow fadeInUp" data-wow-delay="0.5s">
                    <div class="bg-light rounded p-5 mb-5">
                        <h4 class="mb-4">Project Details</h4>
                        <div class="row g-3">
                            <div class="col-sm-12">
                                <h5>Client:</h5>
                                <p>Loading...</p>
                            </div>
                            <div class="col-sm-12">
                                <h5>Location:</h5>
                                <p>Loading...</p>
                            </div>
                            <div class="col-sm-12">
                                <h5>Duration:</h5>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Project Detail End -->"""

content = re.sub(r'<!-- Project Start -->.*?<!-- Project End -->', detail_html, content, flags=re.DOTALL)

with open('/Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/project-detail.html', 'w', encoding='utf-8') as f:
    f.write(content)
