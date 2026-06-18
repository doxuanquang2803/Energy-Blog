(function ($) {
    "use strict";

    // Expose a global initialization function to allow dynamic content loader to run first
    window.initializeSiteFeatures = function () {
        // Spinner
        if ($('#spinner').length > 0) {
            $('#spinner').removeClass('show');
        }

        // Initiate the wowjs
        new WOW().init();

        // Facts counter
        $('[data-toggle="counter-up"]').counterUp({
            delay: 10,
            time: 2000
        });

        // Header carousel
        $(".header-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            loop: true,
            nav: false,
            dots: true,
            items: 1,
            dotsData: true,
        });

        // Testimonials carousel
        $(".testimonial-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1000,
            center: true,
            dots: false,
            loop: true,
            nav: true,
            navText: [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                }
            }
        });

        // Portfolio isotope and filter
        if ($('.portfolio-container').data('isotope')) {
            $('.portfolio-container').isotope('destroy');
        }
        var portfolioIsotope = $('.portfolio-container').isotope({
            itemSelector: '.portfolio-item',
            layoutMode: 'fitRows'
        });
        
        // Only bind standard isotope click filtering if NOT on the paginated project page
        if (!document.getElementById('section-projects-page')) {
            $('#portfolio-flters li').off('click').on('click', function () {
                $("#portfolio-flters li").removeClass('active');
                $(this).addClass('active');

                portfolioIsotope.isotope({ filter: $(this).data('filter') });
            });
        }
    };

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 100, 'easeInOutExpo');
        return false;
    });

    // Automatically initialize if not deferred by site-loader
    $(document).ready(function () {
        if (!window.deferInitialization) {
            window.initializeSiteFeatures();
        }
    });

})(jQuery);

