--
-- PostgreSQL database dump
--

\restrict JAiSwCbeczQAgeASQ66rjjDRb8pZmVBBuGSCcSJcABfc8sJWFPRsuqbfjpI91UD

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_contact_message_user_info(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_contact_message_user_info() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT email, nickname, username 
        INTO NEW.user_email, NEW.user_nickname, NEW.user_username
        FROM users 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: set_donation_user_info(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_donation_user_info() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT username, name, surname 
        INTO NEW.username, NEW.user_name, NEW.user_surname
        FROM users 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: track_comment_edits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_comment_edits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.is_edited = TRUE;
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_article_author_nickname(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_author_nickname() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.author_id != NEW.author_id THEN
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    ELSIF TG_OP = 'INSERT' THEN
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_article_comments_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_comments_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_article_likes_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_likes_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_article_reaction_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_reaction_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE article_id = NEW.article_id AND reaction_type = 'like'),
            dislikes = (SELECT COUNT(*) FROM likes WHERE article_id = NEW.article_id AND reaction_type = 'dislike')
        WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE article_id = OLD.article_id AND reaction_type = 'like'),
            dislikes = (SELECT COUNT(*) FROM likes WHERE article_id = OLD.article_id AND reaction_type = 'dislike')
        WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_contact_messages_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_contact_messages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_donations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_donations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_donations_user_info(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_donations_user_info() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE donations 
    SET 
        username = NEW.username,
        user_name = NEW.name,
        user_surname = NEW.surname,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;


--
-- Name: update_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_report_reporter_nickname(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_report_reporter_nickname() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.reporter_id != NEW.reporter_id THEN
        NEW.reporter_nickname = (SELECT nickname FROM users WHERE id = NEW.reporter_id);
    ELSIF TG_OP = 'INSERT' THEN
        NEW.reporter_nickname = (SELECT nickname FROM users WHERE id = NEW.reporter_id);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_report_reviewer_nickname(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_report_reviewer_nickname() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.reviewed_by != NEW.reviewed_by THEN
        NEW.reviewer_nickname = (SELECT nickname FROM users WHERE id = NEW.reviewed_by);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_reports_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_reports_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_resolved_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_resolved_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('resolved', 'dismissed') THEN
        NEW.resolved_at = NOW();
    ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status NOT IN ('resolved', 'dismissed') THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb,
    category character varying(255),
    subcategory character varying(255),
    tags text[] DEFAULT '{}'::text[],
    thumbnail text,
    status character varying(50) DEFAULT 'draft'::character varying,
    default_language character varying(10) DEFAULT 'tr'::character varying,
    views integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    report_count integer DEFAULT 0,
    is_hidden boolean DEFAULT false,
    hidden_by uuid,
    hidden_at timestamp with time zone,
    hidden_reason text,
    deleted_at timestamp with time zone,
    pending_review jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    collaborators uuid[] DEFAULT '{}'::uuid[],
    author_nickname character varying(255),
    CONSTRAINT articles_status_valid CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'pending'::character varying, 'archived'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: COLUMN articles.collaborators; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.articles.collaborators IS 'Array of user IDs who are collaborators on this article';


--
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    blocked_actor_ids text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_hidden boolean DEFAULT false,
    parent_id uuid,
    report_count integer DEFAULT 0,
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    reaction_type character varying(20),
    reacted_user_id uuid,
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    is_deleted boolean DEFAULT false,
    hidden_by uuid,
    hidden_reason text,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    delete_reason text,
    moderation_action jsonb DEFAULT '{}'::jsonb,
    hidden boolean DEFAULT false
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email character varying(255),
    user_nickname character varying(255),
    user_username character varying(255),
    name character varying(100) NOT NULL,
    subject character varying(50) NOT NULL,
    message text NOT NULL,
    ip_address inet,
    user_agent text,
    status character varying(50) DEFAULT 'pending'::character varying,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    response text,
    responded_by uuid,
    responded_at timestamp with time zone,
    honeypot_filled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'read'::character varying, 'responded'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT contact_messages_subject_check CHECK (((subject)::text = ANY ((ARRAY['general'::character varying, 'feedback'::character varying, 'collaboration'::character varying, 'report'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: donations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount numeric(18,8) NOT NULL,
    txid character varying(255) NOT NULL,
    donation_date timestamp with time zone NOT NULL,
    message text,
    display_name character varying(255),
    username character varying(255),
    user_name character varying(255),
    user_surname character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT donations_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT donations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    author_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    last_saved timestamp with time zone DEFAULT now(),
    has_unpublished_changes boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    article_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    reaction_type character varying(10) DEFAULT 'like'::character varying
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title text NOT NULL,
    content text,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(20) NOT NULL,
    target_id character varying(255) NOT NULL,
    article_id uuid,
    comment_id uuid,
    profile_id uuid,
    reporter_id uuid,
    reason text NOT NULL,
    details text,
    url text,
    target_data jsonb DEFAULT '{}'::jsonb,
    reporter_data jsonb DEFAULT '{}'::jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    resolution text,
    notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    reporter_nickname character varying(255),
    reviewer_nickname character varying(255),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewing'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))),
    CONSTRAINT reports_type_check CHECK (((type)::text = ANY ((ARRAY['profile'::character varying, 'article'::character varying, 'comment'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: saves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    article_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    blocked_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(255) NOT NULL,
    nickname character varying(255),
    email character varying(255),
    password_hash character varying(255) NOT NULL,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_banned boolean DEFAULT false,
    ban_reason text,
    preferences jsonb DEFAULT '{}'::jsonb,
    name character varying(255),
    surname character varying(255),
    mnemonic_hash text,
    verification_token uuid,
    verification_token_expires_at timestamp with time zone,
    last_mnemonic_attempt timestamp with time zone,
    mnemonic_attempts integer DEFAULT 0,
    status character varying(50) DEFAULT 'active'::character varying,
    report_count integer DEFAULT 0,
    role character varying(20) DEFAULT 'user'::character varying,
    is_hidden boolean DEFAULT false,
    hidden_by uuid,
    hidden_at timestamp with time zone,
    hidden_reason text,
    banned_at timestamp with time zone,
    banned_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    delete_reason text,
    moderation_action jsonb DEFAULT '{}'::jsonb,
    reports_count integer DEFAULT 0,
    deletion_timestamp timestamp with time zone,
    CONSTRAINT users_mnemonic_attempts_non_negative CHECK ((mnemonic_attempts >= 0)),
    CONSTRAINT users_role_valid CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'moderator'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT users_status_valid CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'banned'::character varying, 'hidden'::character varying, 'deleted'::character varying, 'silinecek'::character varying])::text[])))
);


--
-- Name: versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    version_number integer NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    change_note text
);


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.articles VALUES ('3fc38686-5c2a-4f4c-a918-864172a71848', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"tr": {"slug": "test-basligi-olmakla-beraber", "title": "test başlığı olmakla beraber", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "test deneme 1-2 kez daha yazayım tamam", "type": "text"}]}, {"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/articles/3fc38686-5c2a-4f4c-a918-864172a71848/photos/1774913726246-33gnayl1vzq.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "test deneme makalesidir bu bir", "language": "tr"}}', 'revisionistScience', NULL, '{}', NULL, 'published', 'tr', 18, 0, 3, 0, 0, false, NULL, NULL, NULL, NULL, 'null', '{"stats": {"comments": 3}}', '2026-03-31 02:35:26.186291+03', '2026-03-31 03:26:04.723838+03', '2026-03-31 02:35:59.768+03', '{}', NULL);
INSERT INTO public.articles VALUES ('308db9ab-4dd9-49d8-9bb1-86a5b888c939', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}', NULL, NULL, '{}', NULL, 'draft', 'en', 0, 0, 0, 0, 0, false, NULL, NULL, NULL, '2026-03-31 02:00:02.869+03', 'null', '{}', '2026-03-31 01:48:33.973824+03', '2026-03-31 02:00:02.869679+03', NULL, '{}', NULL);
INSERT INTO public.articles VALUES ('0b22ae65-b43d-4a00-b83d-4eaa2d7e0fc2', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}', NULL, NULL, '{}', NULL, 'draft', 'en', 0, 0, 0, 0, 0, false, NULL, NULL, NULL, '2026-03-31 02:00:09.896+03', 'null', '{}', '2026-03-31 01:48:09.170228+03', '2026-03-31 02:00:09.89635+03', NULL, '{}', NULL);
INSERT INTO public.articles VALUES ('c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "ben-spam-degilim-vallahi", "title": "ben spam değilim vallahi", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "gerçekten değilim lütfen..", "language": "en"}}', 'naturalLaw', NULL, '{}', NULL, 'published', 'en', 2, 0, 0, 0, 0, false, NULL, NULL, NULL, '2026-03-31 02:00:34.392+03', 'null', '{"stats": {"comments": 2}}', '2026-03-31 01:21:42.653181+03', '2026-03-31 02:00:34.393727+03', '2026-03-31 01:59:09.621+03', '{}', NULL);
INSERT INTO public.articles VALUES ('54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "deneme", "title": "deneme", "content": {"type": "doc", "content": [{"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/photos/1774915864003-4zzrhmsc7iq.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": " deneme", "language": "en"}}', NULL, NULL, '{}', NULL, 'published', 'en', 13, 0, 5, 0, 0, false, NULL, NULL, NULL, NULL, 'null', '{"stats": {"comments": 5}}', '2026-03-31 03:11:27.885393+03', '2026-03-31 04:14:18.426484+03', '2026-03-31 03:11:27.885+03', '{}', NULL);
INSERT INTO public.articles VALUES ('53d46cbf-bedb-4700-8c8e-4730a664c064', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}', NULL, NULL, '{}', NULL, 'draft', 'en', 0, 0, 0, 0, 0, false, NULL, NULL, NULL, '2026-03-31 03:04:22.205+03', 'null', '{}', '2026-03-31 03:03:43.972291+03', '2026-03-31 03:04:22.205244+03', NULL, '{}', NULL);
INSERT INTO public.articles VALUES ('8fb0338b-b029-4cee-8e62-094c1c1e5e1b', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}', NULL, NULL, '{}', NULL, 'draft', 'en', 0, 0, 0, 0, 0, false, NULL, NULL, NULL, '2026-03-31 03:04:22.246+03', 'null', '{}', '2026-03-31 02:59:39.252842+03', '2026-03-31 03:04:22.247128+03', NULL, '{}', NULL);
INSERT INTO public.articles VALUES ('bc8aa2fe-eb02-455e-a67c-a67182e842c2', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "this-is-an-english-attempt", "title": "this is an english attempt", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "yes it iss an english attempt", "type": "text"}]}]}, "excerpt": "englisssh attempt", "language": "en"}, "tr": {"slug": "bu-turkce-bir-deneme", "title": "bu türkçe bir deneme", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "deneme bir ki", "type": "text"}]}]}, "excerpt": "deneme bir ki", "language": "tr"}}', 'praxeology', NULL, '{}', NULL, 'published', 'tr', 2, 0, 0, 0, 0, false, NULL, NULL, NULL, NULL, 'null', '{}', '2026-03-31 03:39:57.464464+03', '2026-03-31 03:40:00.129889+03', '2026-03-31 03:39:57.463+03', '{}', NULL);
INSERT INTO public.articles VALUES ('1fddc4a1-fcaf-4912-9bcf-9a9e657d3ac8', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"en": {"slug": "among-libertariansor-at-least-among-groups-of-people-inclined-toward-libertarian-ideology", "title": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—libertarianism, which outside the United States still carries a marginal and “unclassified” tone in the eyes of the general public, and, consequently, how libertarianism can move toward its goals, is a subject of deep and contentious debate.", "type": "text"}]}, {"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/comments/photos/1774917365478-voqh94aykqe.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—libertarianism, which outside the United States still carries a marginal and “unclassified” tone in the eyes of the general public, and, consequently, how libertarianism can move toward its goals, is a subject", "language": "en"}}', 'revisionistScience', NULL, '{}', NULL, 'published', 'en', 8, 0, 0, 0, 0, false, NULL, NULL, NULL, NULL, 'null', '{}', '2026-03-31 03:38:09.455038+03', '2026-03-31 04:20:49.737802+03', '2026-03-31 03:38:09.454+03', '{c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4}', NULL);


--
-- Data for Name: blocked_users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments VALUES ('968dcd98-c3d0-4522-b524-5c2d34dd65fa', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"yorum"}]}]}', '2026-03-31 01:22:49.638677+03', '2026-03-31 01:22:49.638677+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('4efacf3f-cec3-4c88-b91e-10a1c19442b4', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"deneme"}]}]}', '2026-03-31 01:23:00.253632+03', '2026-03-31 01:23:00.253632+03', false, '968dcd98-c3d0-4522-b524-5c2d34dd65fa', 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('c01a40f5-8239-4d71-a1b1-ba921ef5ffd4', '3fc38686-5c2a-4f4c-a918-864172a71848', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"image","attrs":{"src":"/uploads/articles/8fb0338b-b029-4cee-8e62-094c1c1e5e1b/photos/1774915179274-tsgtvh6g0zm.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"naber lan bu benim yorum sadasdasd "}]}]}', '2026-03-31 02:59:47.891575+03', '2026-03-31 02:59:47.891575+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('051febd8-9960-41fb-8e20-8cef92d84e80', '3fc38686-5c2a-4f4c-a918-864172a71848', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"image","attrs":{"src":"/uploads/articles/53d46cbf-bedb-4700-8c8e-4730a664c064/photos/1774915424015-21ys2msct4j.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"bu bir spam değildir güzel abim benim"}]}]}', '2026-03-31 03:03:53.707212+03', '2026-03-31 03:03:53.707212+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('84f8b848-f947-44a6-a2fd-92d243e1c662', '3fc38686-5c2a-4f4c-a918-864172a71848', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"image","attrs":{"src":"/uploads/users/repent/photos/1774915697838-dsagbjblyj9.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"bu yorumu lütfen makale atmaaa"}]}]}', '2026-03-31 03:08:26.312862+03', '2026-03-31 03:08:26.312862+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('9fafbeb1-58d0-4880-8034-c82398121082', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"ansfasfasfasfasf"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"a"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"sf"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"asf"}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"asf"}]},{"type":"image","attrs":{"src":"/uploads/users/repent/comments/photos/1774916586162-1hlrapsx2ce.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null}}]}', '2026-03-31 03:23:08.131191+03', '2026-03-31 03:23:08.131191+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('57b06327-b8ee-4d33-b322-424a93f48cce', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"nedene yorumunmu siliyorsunnn "}]},{"type":"image","attrs":{"src":"/uploads/users/repent/comments/photos/1774916778084-91p4be14q27.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null}}]}', '2026-03-31 03:26:20.008735+03', '2026-03-31 03:26:20.008735+03', false, NULL, 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('2eaf49e5-f3cc-4f51-b470-1095004038e8', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"image","attrs":{"src":"/uploads/users/repent/comments/photos/1774916875788-d90oq63l389.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"yehuu"}]}]}', '2026-03-31 03:28:00.763843+03', '2026-03-31 03:28:00.763843+03', false, '57b06327-b8ee-4d33-b322-424a93f48cce', 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('057ba746-76bd-441c-917f-15e170835532', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"heyy"}]}]}', '2026-03-31 03:28:44.493791+03', '2026-03-31 03:28:44.493791+03', false, '2eaf49e5-f3cc-4f51-b470-1095004038e8', 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);
INSERT INTO public.comments VALUES ('ceae6c9b-e411-4b9e-858f-4fc19568c4a0', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"type":"doc","content":[{"type":"image","attrs":{"src":"/uploads/users/repent/comments/photos/1774916974504-159rg8jx795.png","alt":null,"title":null,"width":"100%","height":null,"align":"left"}},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"çalışmşyyy baaayaa nasıl"}]}]}', '2026-03-31 03:29:44.739136+03', '2026-03-31 03:29:44.739136+03', false, '057ba746-76bd-441c-917f-15e170835532', 0, 0, 0, '{}', NULL, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL, '{}', false);


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.contact_messages VALUES ('545e9be2-219a-4228-b9b6-1e49e064d3d0', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', NULL, NULL, 'repent', 'yavuz ilyas', 'general', 'bence iyi değil şu şu özellikler', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'responded', NULL, NULL, 'düzelteceğiz', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-30 23:50:11.772602+03', false, '2026-03-30 23:49:51.033336+03', '2026-03-30 23:50:11.772602+03');
INSERT INTO public.contact_messages VALUES ('8d95c226-09e9-404d-a292-64737c807f61', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', NULL, NULL, 'repent', 'hey bne', 'general', 'hey bana para veeer', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'responded', NULL, NULL, 'devam ediyor bizim çalışmalarımız sizi de dahil edelim..', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 00:01:25.967942+03', false, '2026-03-31 00:01:06.106267+03', '2026-03-31 00:01:25.967942+03');
INSERT INTO public.contact_messages VALUES ('b23bdeb6-2ece-4c88-ad6b-26aeb8220090', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', NULL, NULL, 'repent', 'kajfnasnf asfasf', 'collaboration', 'afsafas', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'responded', NULL, NULL, 'aksf asfa', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 02:10:56.066212+03', false, '2026-03-31 02:10:43.887674+03', '2026-03-31 02:10:56.066212+03');


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.donations VALUES ('763c4aa8-e4d8-4ea4-be20-923c3de420ac', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 0.50000000, 'guyu78g', '2026-03-29 18:10:00+03', 'naber text', NULL, 'repent', 'saTest Adsa', 'Test Soyadas', 'approved', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-29 21:14:11.089848+03', NULL, '2026-03-29 21:11:36.717054+03', '2026-03-29 21:14:11.089848+03');


--
-- Data for Name: drafts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.drafts VALUES ('17c6d642-12c0-4cdf-aadd-bc9d1da709f5', '0b22ae65-b43d-4a00-b83d-4eaa2d7e0fc2', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"tags": [], "views": 0, "status": "draft", "category": null, "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "translations": {"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', '2026-03-31 01:48:09.178182+03', true, '2026-03-31 01:48:09.178182+03', '2026-03-31 01:48:09.178182+03');
INSERT INTO public.drafts VALUES ('fc45b13d-0ccf-41de-9c08-0b1dbb573f26', '308db9ab-4dd9-49d8-9bb1-86a5b888c939', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"tags": [], "views": 0, "status": "draft", "category": null, "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "translations": {"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', '2026-03-31 01:48:33.980015+03', true, '2026-03-31 01:48:33.980015+03', '2026-03-31 01:48:33.980015+03');
INSERT INTO public.drafts VALUES ('63d93c09-9be5-465c-8213-573aa6b3451d', '8fb0338b-b029-4cee-8e62-094c1c1e5e1b', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"tags": [], "views": 0, "status": "draft", "category": null, "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "translations": {"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', '2026-03-31 02:59:39.255199+03', true, '2026-03-31 02:59:39.255199+03', '2026-03-31 02:59:39.255199+03');
INSERT INTO public.drafts VALUES ('c87762f2-fa24-4cc8-9434-748a8af12cbf', '53d46cbf-bedb-4700-8c8e-4730a664c064', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '{"tags": [], "views": 0, "status": "draft", "category": null, "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "translations": {"en": {"slug": "", "title": "", "content": null, "excerpt": "", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', '2026-03-31 03:03:43.977805+03', true, '2026-03-31 03:03:43.977805+03', '2026-03-31 03:03:43.977805+03');


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.likes VALUES ('5a5a8499-4566-4c95-86bf-cabf3f781438', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', '2026-03-31 01:22:31.755113+03', 'like');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.messages VALUES ('0798a2a7-50d6-4529-9680-c1bae36edbb4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'İletişim mesajınıza yanıt (general):

devam ediyor bizim çalışmalarımız sizi de dahil edelim..', '2026-03-31 00:01:26.021221+03', false);
INSERT INTO public.messages VALUES ('b4d13065-9134-4c6b-b53e-92f850822674', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'İletişim mesajınıza yanıt (collaboration):

aksf asfa', '2026-03-31 02:10:56.078572+03', false);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES ('bc05b60f-b950-4d95-af8b-d7839a1274e6', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'contact_message', '{"key":"notifications.messages.contactMessageResponded"}', '{"key":"notifications.messages.contactMessageRespondedWithMessage","values":{"subject":"general","response":"devam ediyor bizim çalışmalarımız sizi de dahil edelim.."}}', '{"link": "/messages", "meta": {"subject": "general", "response": "devam ediyor bizim çalışmalarımız sizi de dahil edelim..", "messageId": "8d95c226-09e9-404d-a292-64737c807f61", "newStatus": "responded"}, "actor": {"id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "name": "repent"}}', true, '2026-03-31 00:01:26.042357+03', '2026-03-31 01:24:09.347095+03');
INSERT INTO public.notifications VALUES ('ff08a1ab-1334-43e6-b6c2-81501e685ca6', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'contact_message', '{"key":"notifications.messages.contactMessageResponded"}', '{"key":"notifications.messages.contactMessageRespondedWithMessage","values":{"subject":"collaboration","response":"aksf asfa"}}', '{"link": "/messages", "meta": {"subject": "collaboration", "response": "aksf asfa", "messageId": "b23bdeb6-2ece-4c88-ad6b-26aeb8220090", "newStatus": "responded"}, "actor": {"id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "name": "repent"}}', true, '2026-03-31 02:10:56.080763+03', '2026-03-31 02:11:10.140555+03');


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reports VALUES ('d63b552e-9c91-4f91-819d-4dd75ff80c7d', 'error', '500', NULL, NULL, NULL, 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'testt', 'http://localhost:5173/article/test-basligi-olmakla-beraber', 'http://localhost:5173/article/test-basligi-olmakla-beraber', '{"location": "http://localhost:5173/article/test-basligi-olmakla-beraber", "timestamp": "2026-03-30T23:36:19.489Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"}', '{"email": null}', 'pending', NULL, NULL, NULL, NULL, '{}', '2026-03-31 02:36:19.490137+03', '2026-03-31 02:36:19.490137+03', NULL, NULL, NULL);


--
-- Data for Name: saves; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', 'repent', NULL, NULL, '$argon2id$v=19$m=65536,t=3,p=4$v49S+Q4KBKH5sppXWUnSjA$bajsvj3LRSi0PLqanwYb5MV7dgeGP6+5NDgCHaYPOJk', '/uploads/users/repent/avatars/1774805163647-atxwwcxjuxi.jpg', 'Bu bir test bio metnidir.as', '2026-03-29 01:18:52.759782+03', '2026-03-31 03:04:22.197589+03', false, NULL, '{"website": "https://example.comsa", "location": "İstanbul, Türkiyesa", "interests": [], "bannerColor": "#0f172a", "bannerImage": "/uploads/users/repent/banners/1774776141988-pfkh0vkpvvt.jpg"}', 'saTest Adsa', 'Test Soyadas', '$argon2id$v=19$m=65536,t=3,p=1$/R373ADmQF3Vxaduq5m9dw$lLpgpftS1AJ6V0Eqij6UaXi+LhSq37jRzA6JcCbm6nk', 'f53328a2-7455-49f3-b144-c805f0a4e36f', '2026-03-31 03:09:22.197+03', NULL, 0, 'hidden', 0, 'admin', true, NULL, '2026-03-31 02:14:55.555+03', 'User preference', NULL, NULL, NULL, NULL, NULL, '{"action": "hidden", "byUser": true, "reason": "User preference", "timestamp": "2026-03-30T23:14:55.555Z"}', 0, NULL);


--
-- Data for Name: versions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.versions VALUES ('a3a1f761-e5f0-448b-b519-a7b064d6e1e2', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 1, '{"tags": [], "views": 0, "status": "published", "category": "naturalLaw", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-30T22:22:02.910Z", "translations": {"en": {"slug": "ben-spam-degilim-vallahi", "title": "ben spam değilim vallahi", "content": {"type": "doc", "content": [{"type": "image", "attrs": {"alt": null, "src": "/uploads/articles/c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd/photos/1774909302701-pm2bg4dtt9.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "gerçekten değilim lütfen..", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 01:22:02.931837+03', 'Version 1');
INSERT INTO public.versions VALUES ('3429b3a1-9c68-4063-b34c-d8b2d5b87a61', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 2, '{"tags": [], "views": 0, "status": "published", "category": "naturalLaw", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-30T22:49:48.372Z", "translations": {"en": {"slug": "ben-spam-degilim-vallahi", "title": "ben spam değilim vallahi", "content": {"type": "doc", "content": [{"type": "image", "attrs": {"alt": null, "src": "/uploads/articles/c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd/photos/1774910974557-4n8yen1dwbi.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "gerçekten değilim lütfen..", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 01:49:48.389395+03', 'Version 2');
INSERT INTO public.versions VALUES ('068a41cb-fd09-4f42-a9c3-2e4172b6dc29', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 3, '{"tags": [], "views": 0, "status": "published", "category": "naturalLaw", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-30T22:53:28.286Z", "translations": {"en": {"slug": "ben-spam-degilim-vallahi", "title": "ben spam değilim vallahi", "content": {"type": "doc", "content": [{"type": "image", "attrs": {"alt": null, "src": "/uploads/articles/c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd/photos/1774911205218-vdsbk8z8mug.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "gerçekten değilim lütfen..", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 01:53:28.293736+03', 'Version 3');
INSERT INTO public.versions VALUES ('4d2b0a8a-88aa-4885-aebc-6e0e2a3db3cd', 'c30a8f8a-d10d-4ac3-9e6f-d1a9141cc7cd', 4, '{"tags": [], "views": 0, "status": "published", "category": "naturalLaw", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-30T22:59:09.621Z", "translations": {"en": {"slug": "ben-spam-degilim-vallahi", "title": "ben spam değilim vallahi", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "gerçekten değilim lütfen..", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 01:59:09.637957+03', 'Version 4');
INSERT INTO public.versions VALUES ('24f39e9d-d191-43e0-97e5-7fb416c0fc17', '3fc38686-5c2a-4f4c-a918-864172a71848', 1, '{"tags": [], "views": 0, "status": "published", "category": "revisionistScience", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-30T23:35:59.768Z", "translations": {"tr": {"slug": "test-basligi-olmakla-beraber", "title": "test başlığı olmakla beraber", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "test deneme 1-2 kez daha yazayım tamam", "type": "text"}]}, {"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/articles/3fc38686-5c2a-4f4c-a918-864172a71848/photos/1774913726246-33gnayl1vzq.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "test deneme makalesidir bu bir", "language": "tr"}}, "collaborators": [], "comments_count": 0, "default_language": "tr"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 02:35:59.778676+03', 'Version 1');
INSERT INTO public.versions VALUES ('1646cdb7-b1aa-4123-85d8-d395466679b2', '54f7dfff-2f1f-4501-97f2-54a2294359f4', 1, '{"tags": [], "views": 0, "status": "published", "category": null, "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-31T00:11:27.885Z", "translations": {"en": {"slug": "deneme", "title": "deneme", "content": {"type": "doc", "content": [{"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/photos/1774915864003-4zzrhmsc7iq.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": " deneme", "language": "en"}}, "collaborators": [], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 03:11:27.899098+03', 'Version 1');
INSERT INTO public.versions VALUES ('0195b771-037d-4298-9b9c-49da35e274fe', '1fddc4a1-fcaf-4912-9bcf-9a9e657d3ac8', 1, '{"tags": [], "views": 0, "status": "published", "category": "revisionistScience", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-31T00:38:09.454Z", "translations": {"en": {"slug": "among-libertariansor-at-least-among-groups-of-people-inclined-toward-libertarian-ideology", "title": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—libertarianism, which outside the United States still carries a marginal and “unclassified” tone in the eyes of the general public, and, consequently, how libertarianism can move toward its goals, is a subject of deep and contentious debate.", "type": "text"}]}, {"type": "image", "attrs": {"alt": null, "src": "/uploads/users/repent/comments/photos/1774917365478-voqh94aykqe.png", "align": "left", "title": null, "width": "100%", "height": null}}, {"type": "paragraph", "attrs": {"textAlign": null}}]}, "excerpt": "Among libertarians—or at least among groups of people inclined toward libertarian ideology—libertarianism, which outside the United States still carries a marginal and “unclassified” tone in the eyes of the general public, and, consequently, how libertarianism can move toward its goals, is a subject", "language": "en"}}, "collaborators": ["c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4"], "comments_count": 0, "default_language": "en"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 03:38:09.468153+03', 'Version 1');
INSERT INTO public.versions VALUES ('ecb04899-5107-459e-a0a6-e196086d17f8', 'bc8aa2fe-eb02-455e-a67c-a67182e842c2', 1, '{"tags": [], "views": 0, "status": "published", "category": "praxeology", "author_id": "c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4", "thumbnail": null, "likes_count": 0, "subcategory": null, "published_at": "2026-03-31T00:39:57.463Z", "translations": {"en": {"slug": "this-is-an-english-attempt", "title": "this is an english attempt", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "yes it iss an english attempt", "type": "text"}]}]}, "excerpt": "englisssh attempt", "language": "en"}, "tr": {"slug": "bu-turkce-bir-deneme", "title": "bu türkçe bir deneme", "content": {"type": "doc", "content": [{"type": "paragraph", "attrs": {"textAlign": null}, "content": [{"text": "deneme bir ki", "type": "text"}]}]}, "excerpt": "deneme bir ki", "language": "tr"}}, "collaborators": [], "comments_count": 0, "default_language": "tr"}', 'c08ce173-9e36-4ec5-9a67-c78d2fd2d0a4', '2026-03-31 03:39:57.477785+03', 'Version 1');


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);


--
-- Name: blocked_users blocked_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_user_id_key UNIQUE (user_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: drafts drafts_article_id_author_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_article_id_author_id_key UNIQUE (article_id, author_id);


--
-- Name: drafts drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: likes likes_user_article_reaction_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_article_reaction_unique UNIQUE (user_id, article_id, reaction_type);


--
-- Name: likes likes_user_article_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_article_unique UNIQUE (user_id, article_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: saves saves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saves
    ADD CONSTRAINT saves_pkey PRIMARY KEY (id);


--
-- Name: saves saves_user_id_article_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saves
    ADD CONSTRAINT saves_user_id_article_id_key UNIQUE (user_id, article_id);


--
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (id);


--
-- Name: user_blocks user_blocks_user_id_blocked_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_user_id_blocked_user_id_key UNIQUE (user_id, blocked_user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nickname_key UNIQUE (nickname);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: idx_articles_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_author_id ON public.articles USING btree (author_id);


--
-- Name: idx_articles_author_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_author_nickname ON public.articles USING btree (author_nickname);


--
-- Name: idx_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_category ON public.articles USING btree (category);


--
-- Name: idx_articles_collaborators; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_collaborators ON public.articles USING gin (collaborators);


--
-- Name: idx_articles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_created_at ON public.articles USING btree (created_at DESC);


--
-- Name: idx_articles_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_deleted_at ON public.articles USING btree (deleted_at);


--
-- Name: idx_articles_is_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_is_hidden ON public.articles USING btree (is_hidden);


--
-- Name: idx_articles_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC);


--
-- Name: idx_articles_report_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_report_count ON public.articles USING btree (report_count);


--
-- Name: idx_articles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_status ON public.articles USING btree (status);


--
-- Name: idx_articles_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_tags ON public.articles USING gin (tags);


--
-- Name: idx_articles_translations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_translations_slug ON public.articles USING gin (translations);


--
-- Name: idx_blocked_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_users_user_id ON public.blocked_users USING btree (user_id);


--
-- Name: idx_comments_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_article_id ON public.comments USING btree (article_id);


--
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- Name: idx_comments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at DESC);


--
-- Name: idx_comments_deleted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_deleted_by ON public.comments USING btree (deleted_by);


--
-- Name: idx_comments_edited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_edited_at ON public.comments USING btree (edited_at);


--
-- Name: idx_comments_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_hidden ON public.comments USING btree (hidden);


--
-- Name: idx_comments_hidden_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_hidden_by ON public.comments USING btree (hidden_by);


--
-- Name: idx_comments_is_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_is_deleted ON public.comments USING btree (is_deleted);


--
-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);


--
-- Name: idx_comments_report_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_report_count ON public.comments USING btree (report_count);


--
-- Name: idx_contact_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);


--
-- Name: idx_contact_messages_reviewed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_reviewed_by ON public.contact_messages USING btree (reviewed_by);


--
-- Name: idx_contact_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);


--
-- Name: idx_contact_messages_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_subject ON public.contact_messages USING btree (subject);


--
-- Name: idx_contact_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_user_id ON public.contact_messages USING btree (user_id);


--
-- Name: idx_donations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_created_at ON public.donations USING btree (created_at DESC);


--
-- Name: idx_donations_donation_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_donation_date ON public.donations USING btree (donation_date DESC);


--
-- Name: idx_donations_reviewed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_reviewed_by ON public.donations USING btree (reviewed_by);


--
-- Name: idx_donations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_status ON public.donations USING btree (status);


--
-- Name: idx_donations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_user_id ON public.donations USING btree (user_id);


--
-- Name: idx_donations_user_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_user_name ON public.donations USING btree (user_name);


--
-- Name: idx_donations_user_surname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_user_surname ON public.donations USING btree (user_surname);


--
-- Name: idx_donations_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donations_username ON public.donations USING btree (username);


--
-- Name: idx_drafts_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drafts_article_id ON public.drafts USING btree (article_id);


--
-- Name: idx_drafts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drafts_author_id ON public.drafts USING btree (author_id);


--
-- Name: idx_follows_follower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_follower_id ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_following_id ON public.follows USING btree (following_id);


--
-- Name: idx_likes_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_article_id ON public.likes USING btree (article_id);


--
-- Name: idx_likes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_created_at ON public.likes USING btree (created_at DESC);


--
-- Name: idx_likes_reaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_reaction_type ON public.likes USING btree (reaction_type);


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_updated_at ON public.notifications USING btree (updated_at);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_reports_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_article_id ON public.reports USING btree (article_id);


--
-- Name: idx_reports_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_comment_id ON public.reports USING btree (comment_id);


--
-- Name: idx_reports_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at DESC);


--
-- Name: idx_reports_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_profile_id ON public.reports USING btree (profile_id);


--
-- Name: idx_reports_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_reporter_id ON public.reports USING btree (reporter_id);


--
-- Name: idx_reports_reporter_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_reporter_nickname ON public.reports USING btree (reporter_nickname);


--
-- Name: idx_reports_reviewed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_reviewed_by ON public.reports USING btree (reviewed_by);


--
-- Name: idx_reports_reviewer_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_reviewer_nickname ON public.reports USING btree (reviewer_nickname);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_reports_target_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_target_data_gin ON public.reports USING gin (target_data);


--
-- Name: idx_reports_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_target_id ON public.reports USING btree (target_id);


--
-- Name: idx_reports_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_type ON public.reports USING btree (type);


--
-- Name: idx_saves_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saves_article_id ON public.saves USING btree (article_id);


--
-- Name: idx_saves_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saves_created_at ON public.saves USING btree (created_at DESC);


--
-- Name: idx_saves_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saves_user_id ON public.saves USING btree (user_id);


--
-- Name: idx_user_blocks_blocked_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocked_user_id ON public.user_blocks USING btree (blocked_user_id);


--
-- Name: idx_user_blocks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_user_id ON public.user_blocks USING btree (user_id);


--
-- Name: idx_users_banned_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_banned_by ON public.users USING btree (banned_by);


--
-- Name: idx_users_deleted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deleted_by ON public.users USING btree (deleted_by);


--
-- Name: idx_users_deletion_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deletion_timestamp ON public.users USING btree (deletion_timestamp);


--
-- Name: idx_users_hidden_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_hidden_by ON public.users USING btree (hidden_by);


--
-- Name: idx_users_is_banned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_banned ON public.users USING btree (is_banned);


--
-- Name: idx_users_is_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_hidden ON public.users USING btree (is_hidden);


--
-- Name: idx_users_last_mnemonic_attempt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_mnemonic_attempt ON public.users USING btree (last_mnemonic_attempt);


--
-- Name: idx_users_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_nickname ON public.users USING btree (nickname);


--
-- Name: idx_users_report_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_report_count ON public.users USING btree (report_count);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_token ON public.users USING btree (verification_token);


--
-- Name: idx_users_verification_token_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_token_expires_at ON public.users USING btree (verification_token_expires_at);


--
-- Name: idx_versions_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_versions_article_id ON public.versions USING btree (article_id);


--
-- Name: idx_versions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_versions_created_at ON public.versions USING btree (created_at DESC);


--
-- Name: idx_versions_version_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_versions_version_number ON public.versions USING btree (article_id, version_number);


--
-- Name: contact_messages trigger_set_contact_message_user_info; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_contact_message_user_info BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_contact_message_user_info();


--
-- Name: donations trigger_set_donation_user_info; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_donation_user_info BEFORE INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.set_donation_user_info();


--
-- Name: articles trigger_update_article_author_nickname; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_article_author_nickname BEFORE INSERT OR UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_article_author_nickname();


--
-- Name: users trigger_update_donations_user_info; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_donations_user_info AFTER UPDATE OF username, name, surname ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_donations_user_info();


--
-- Name: reports trigger_update_report_reporter_nickname; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_report_reporter_nickname BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_report_reporter_nickname();


--
-- Name: reports trigger_update_report_reviewer_nickname; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_report_reviewer_nickname BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_report_reviewer_nickname();


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comments update_comments_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_article_comments_count();


--
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.track_comment_edits();


--
-- Name: contact_messages update_contact_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.update_contact_messages_updated_at();


--
-- Name: donations update_donations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_donations_updated_at();


--
-- Name: drafts update_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON public.drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: likes update_likes_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.update_article_reaction_counts();


--
-- Name: notifications update_notifications_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notifications_updated_at_trigger BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_notifications_updated_at();


--
-- Name: reports update_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_reports_updated_at();


--
-- Name: reports update_resolved_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resolved_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_resolved_at();


--
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: articles articles_hidden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_hidden_by_fkey FOREIGN KEY (hidden_by) REFERENCES public.users(id);


--
-- Name: blocked_users blocked_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- Name: comments comments_hidden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_hidden_by_fkey FOREIGN KEY (hidden_by) REFERENCES public.users(id);


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_reacted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_reacted_user_id_fkey FOREIGN KEY (reacted_user_id) REFERENCES public.users(id);


--
-- Name: contact_messages contact_messages_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_messages contact_messages_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_messages contact_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: donations donations_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: drafts drafts_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: drafts drafts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: likes likes_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: reports reports_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: reports reports_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: saves saves_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saves
    ADD CONSTRAINT saves_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: saves saves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saves
    ADD CONSTRAINT saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blocked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_banned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.users(id);


--
-- Name: users users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id);


--
-- Name: users users_hidden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hidden_by_fkey FOREIGN KEY (hidden_by) REFERENCES public.users(id);


--
-- Name: versions versions_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: versions versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict JAiSwCbeczQAgeASQ66rjjDRb8pZmVBBuGSCcSJcABfc8sJWFPRsuqbfjpI91UD

