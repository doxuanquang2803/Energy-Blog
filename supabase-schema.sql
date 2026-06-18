-- =========================================================================
-- SOLARTEC / ECOADMIN SUPABASE DATABASE SETUP SCHEMA MIGRATION
-- =========================================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard (https://supabase.com).
-- 2. Select your project, navigate to "SQL Editor" in the left sidebar.
-- 3. Click "New Query" and paste this entire file's content.
-- 4. Click "Run" at the bottom right.
-- 5. Go to your Storage dashboard, create a public bucket named 'media'.
-- =========================================================================

-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE: categories
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL UNIQUE,
    description text
);

-- Enable RLS (Row Level Security) on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (Permissive read-all, write-all for easy local/anon dev)
CREATE POLICY "Allow public read access to categories" 
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to categories" 
ON public.categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to categories" 
ON public.categories FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to categories" 
ON public.categories FOR DELETE USING (true);


-- ==========================================
-- 2. TABLE: posts
-- ==========================================
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    category text,
    status text DEFAULT 'draft'::text,
    content text,
    thumbnail_url text,
    CONSTRAINT status_check CHECK (status IN ('draft', 'published'))
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Allow public read access to posts" 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to posts" 
ON public.posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to posts" 
ON public.posts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to posts" 
ON public.posts FOR DELETE USING (true);


-- ==========================================
-- 3. TABLE: homepage_content
-- ==========================================
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id bigint PRIMARY KEY DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Schema-less complete fallback JSON configuration
    content_json jsonb DEFAULT '{}'::jsonb,

    -- Explicit optional columns for clean queries/indexing
    hero1_title text,
    hero1_subtitle text,
    hero1_cta text,
    hero1_img text,

    hero2_title text,
    hero2_subtitle text,
    hero2_cta text,
    hero2_img text,

    hero3_title text,
    hero3_subtitle text,
    hero3_cta text,
    hero3_img text,

    about_tagline text,
    about_title text,
    about_desc text,
    about_point1 text,
    about_point2 text,
    about_point3 text,
    about_img text,

    services_title text,
    
    srv1_title text, srv1_desc text, srv1_img text,
    srv2_title text, srv2_desc text, srv2_img text,
    srv3_title text, srv3_desc text, srv3_img text,
    srv4_title text, srv4_desc text, srv4_img text,
    srv5_title text, srv5_desc text, srv5_img text,
    srv6_title text, srv6_desc text, srv6_img text,

    features_title text,
    features_desc text,
    features_img text,

    quote_title text,
    quote_desc text,
    quote_img text,

    layout_order jsonb DEFAULT '[]'::jsonb,
    statistics jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS on homepage_content
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage_content
CREATE POLICY "Allow public read access to homepage_content" 
ON public.homepage_content FOR SELECT USING (true);

-- Allow public upsert (Insert with update rights or manual insert)
CREATE POLICY "Allow public insert to homepage_content" 
ON public.homepage_content FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to homepage_content" 
ON public.homepage_content FOR UPDATE USING (true);


-- ==========================================
-- 4. STORAGE BUCKET: 'media' Setup
-- ==========================================
-- Note: Supabase Storage uses its own tables under the 'storage' schema.
-- Copy-paste these insert statements to register the public bucket 'media' programmatically!

INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'media' bucket to allow full anonymous upload and retrieval
CREATE POLICY "Allow public read from media bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Allow public upload to media bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow public update to media bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media');

CREATE POLICY "Allow public delete from media bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');


-- =========================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER TRIGGER DEFINITIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_homepage_content_updated_at
BEFORE UPDATE ON public.homepage_content
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =========================================================================
-- INITIAL SEEDING DATA FOR HOMEPAGE (OPTIONAL FALLBACK ROW)
-- =========================================================================
INSERT INTO public.homepage_content (
    id,
    hero1_title, hero1_subtitle, hero1_cta, hero1_img,
    hero2_title, hero2_subtitle, hero2_cta, hero2_img,
    hero3_title, hero3_subtitle, hero3_cta, hero3_img,
    about_tagline, about_title, about_desc, about_point1, about_point2, about_point3, about_img,
    services_title,
    srv1_title, srv1_desc, srv1_img,
    srv2_title, srv2_desc, srv2_img,
    srv3_title, srv3_desc, srv3_img,
    srv4_title, srv4_desc, srv4_img,
    srv5_title, srv5_desc, srv5_img,
    srv6_title, srv6_desc, srv6_img,
    features_title, features_desc, features_img,
    quote_title, quote_desc, quote_img,
    layout_order,
    statistics
) VALUES (
    1,
    'Pioneers Of Solar And Renewable Energy', 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.', 'Read More', 'img/carousel-1.jpg',
    'Pioneers Of Solar And Renewable Energy', 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.', 'Read More', 'img/carousel-2.jpg',
    'Pioneers Of Solar And Renewable Energy', 'Vero elitr justo clita lorem. Ipsum dolor at sed stet sit diam no. Kasd rebum ipsum et diam justo clita et kasd rebum sea elitr.', 'Read More', 'img/carousel-3.jpg',
    'About Us', '25+ Years Experience In Solar & Renewable Energy Industry', 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet', 'Diam dolor diam ipsum', 'Aliqu diam amet diam et eos', 'Tempor erat elitr rebum at clita', 'img/about.jpg',
    'We Are Pioneers In The World Of Renewable Energy',
    'Solar Panels', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-1.jpg',
    'Wind Turbines', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-2.jpg',
    'Hydropower Plants', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-3.jpg',
    'Solar Panels', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-4.jpg',
    'Wind Turbines', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-5.jpg',
    'Hydropower Plants', 'Stet stet justo dolor sed duo. Ut clita sea sit ipsum diam lorem diam.', 'img/img-600x400-6.jpg',
    'Complete Commercial & Residential Solar Systems', 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet', 'img/feature.jpg',
    'Get A Free Quote', 'Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo erat amet', 'img/quote.jpg',
    '["Hero Banner Carousel", "Statistics Counter", "About Us Section", "Our Services", "Why Choose Us (Features)", "Project Gallery", "Free Quote Section"]'::jsonb,
    '[{"label":"Happy Customers","value":"3453"},{"label":"Project Done","value":"4234"},{"label":"Awards Win","value":"3123"},{"label":"Expert Workers","value":"1831"}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    hero1_title = EXCLUDED.hero1_title,
    hero1_subtitle = EXCLUDED.hero1_subtitle,
    hero1_cta = EXCLUDED.hero1_cta,
    hero1_img = EXCLUDED.hero1_img,
    hero2_title = EXCLUDED.hero2_title,
    hero2_subtitle = EXCLUDED.hero2_subtitle,
    hero2_cta = EXCLUDED.hero2_cta,
    hero2_img = EXCLUDED.hero2_img,
    hero3_title = EXCLUDED.hero3_title,
    hero3_subtitle = EXCLUDED.hero3_subtitle,
    hero3_cta = EXCLUDED.hero3_cta,
    hero3_img = EXCLUDED.hero3_img,
    about_tagline = EXCLUDED.about_tagline,
    about_title = EXCLUDED.about_title,
    about_desc = EXCLUDED.about_desc,
    about_point1 = EXCLUDED.about_point1,
    about_point2 = EXCLUDED.about_point2,
    about_point3 = EXCLUDED.about_point3,
    about_img = EXCLUDED.about_img,
    services_title = EXCLUDED.services_title,
    srv1_title = EXCLUDED.srv1_title, srv1_desc = EXCLUDED.srv1_desc, srv1_img = EXCLUDED.srv1_img,
    srv2_title = EXCLUDED.srv2_title, srv2_desc = EXCLUDED.srv2_desc, srv2_img = EXCLUDED.srv2_img,
    srv3_title = EXCLUDED.srv3_title, srv3_desc = EXCLUDED.srv3_desc, srv3_img = EXCLUDED.srv3_img,
    srv4_title = EXCLUDED.srv4_title, srv4_desc = EXCLUDED.srv4_desc, srv4_img = EXCLUDED.srv4_img,
    srv5_title = EXCLUDED.srv5_title, srv5_desc = EXCLUDED.srv5_desc, srv5_img = EXCLUDED.srv5_img,
    srv6_title = EXCLUDED.srv6_title, srv6_desc = EXCLUDED.srv6_desc, srv6_img = EXCLUDED.srv6_img,
    features_title = EXCLUDED.features_title,
    features_desc = EXCLUDED.features_desc,
    features_img = EXCLUDED.features_img,
    quote_title = EXCLUDED.quote_title,
    quote_desc = EXCLUDED.quote_desc,
    quote_img = EXCLUDED.quote_img,
    layout_order = EXCLUDED.layout_order,
    statistics = EXCLUDED.statistics;
