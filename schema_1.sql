--
-- PostgreSQL database dump
--

\restrict 2u5EcRJVzZFaYRvxfBge0ewaYfdCOBclYub3rhugWAYZ5YbKuECFhZtirIU5Y7d

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
-- Name: add_daily_translation(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_daily_translation(user_uuid uuid, article_uuid uuid, lang_code character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO user_daily_translations (user_id, article_id, language_code)
    VALUES (user_uuid, article_uuid, lang_code)
    ON CONFLICT (user_id, translation_date, article_id, language_code) 
    DO UPDATE SET created_at = NOW()
    RETURNING id INTO new_id;
    
    RETURN TRUE;
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: get_pending_translations_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_translations_count(author_uuid uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM article_translation_statuses ats
        JOIN articles a ON ats.article_id = a.id
        WHERE a.author_id = author_uuid 
        AND ats.status = 'pending'
    );
END;
$$;


--
-- Name: get_user_daily_translation_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_daily_translation_count(user_uuid uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM user_daily_translations 
        WHERE user_id = user_uuid 
        AND translation_date = CURRENT_DATE
    );
END;
$$;


--
-- Name: is_translation_approved(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_translation_approved(article_uuid uuid, lang_code character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM article_translation_statuses 
        WHERE article_id = article_uuid 
        AND language_code = lang_code 
        AND status = 'approved'
    );
END;
$$;


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
-- Name: update_attendee_count_on_join(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendee_count_on_join() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE events 
    SET attendee_count = attendee_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$;


--
-- Name: update_attendee_count_on_leave(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendee_count_on_leave() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE events 
    SET attendee_count = GREATEST(attendee_count - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
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
-- Name: update_events_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_events_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_links_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_links_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
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
-- Name: article_translation_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_translation_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    language_code character varying(10) NOT NULL,
    translator_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    review_notes text,
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


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
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid,
    name character varying(100),
    email character varying(255),
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    city character varying(100) NOT NULL,
    location character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    category character varying(100) NOT NULL,
    image_url text,
    link text,
    attendee_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT events_type_check CHECK (((type)::text = ANY ((ARRAY['event'::character varying, 'announcement'::character varying])::text[])))
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
-- Name: links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    url text NOT NULL,
    description text,
    icon_url text,
    type character varying(50) DEFAULT 'social'::character varying,
    platform character varying(100),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    click_count integer DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT links_type_check CHECK (((type)::text = ANY ((ARRAY['social'::character varying, 'donation'::character varying, 'external'::character varying, 'contact'::character varying, 'other'::character varying])::text[])))
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
-- Name: user_daily_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_daily_translations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    translation_date date DEFAULT CURRENT_DATE NOT NULL,
    article_id uuid NOT NULL,
    language_code character varying(10) NOT NULL,
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
    phone_number character varying(20),
    location character varying(255),
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
-- Name: article_translation_statuses article_translation_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_translation_statuses
    ADD CONSTRAINT article_translation_statuses_pkey PRIMARY KEY (id);


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
-- Name: event_attendees event_attendees_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


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
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


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
-- Name: user_daily_translations unique_daily_translation; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_translations
    ADD CONSTRAINT unique_daily_translation UNIQUE (user_id, translation_date, article_id, language_code);


--
-- Name: article_translation_statuses unique_translation_status; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_translation_statuses
    ADD CONSTRAINT unique_translation_status UNIQUE (article_id, language_code, translator_id);


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
-- Name: user_daily_translations user_daily_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_translations
    ADD CONSTRAINT user_daily_translations_pkey PRIMARY KEY (id);


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
-- Name: idx_event_attendees_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);


--
-- Name: idx_event_attendees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);


--
-- Name: idx_events_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_city ON public.events USING btree (city);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (date);


--
-- Name: idx_events_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_is_active ON public.events USING btree (is_active);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (type);


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
-- Name: idx_links_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_links_created_by ON public.links USING btree (created_by);


--
-- Name: idx_links_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_links_display_order ON public.links USING btree (display_order);


--
-- Name: idx_links_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_links_is_active ON public.links USING btree (is_active);


--
-- Name: idx_links_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_links_type ON public.links USING btree (type);


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
-- Name: idx_translation_statuses_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_statuses_article ON public.article_translation_statuses USING btree (article_id);


--
-- Name: idx_translation_statuses_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_statuses_language ON public.article_translation_statuses USING btree (article_id, language_code);


--
-- Name: idx_translation_statuses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_statuses_status ON public.article_translation_statuses USING btree (status);


--
-- Name: idx_translation_statuses_translator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_statuses_translator ON public.article_translation_statuses USING btree (translator_id);


--
-- Name: idx_user_blocks_blocked_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocked_user_id ON public.user_blocks USING btree (blocked_user_id);


--
-- Name: idx_user_blocks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_user_id ON public.user_blocks USING btree (user_id);


--
-- Name: idx_user_daily_translations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_daily_translations_date ON public.user_daily_translations USING btree (translation_date);


--
-- Name: idx_user_daily_translations_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_daily_translations_user_date ON public.user_daily_translations USING btree (user_id, translation_date);


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
-- Name: idx_users_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_location ON public.users USING btree (location) WHERE (location IS NOT NULL);


--
-- Name: idx_users_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_nickname ON public.users USING btree (nickname);


--
-- Name: idx_users_phone_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone_number ON public.users USING btree (phone_number) WHERE (phone_number IS NOT NULL);


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
-- Name: event_attendees update_attendee_count_on_join; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_attendee_count_on_join AFTER INSERT ON public.event_attendees FOR EACH ROW EXECUTE FUNCTION public.update_attendee_count_on_join();


--
-- Name: event_attendees update_attendee_count_on_leave; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_attendee_count_on_leave AFTER DELETE ON public.event_attendees FOR EACH ROW EXECUTE FUNCTION public.update_attendee_count_on_leave();


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
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_events_updated_at();


--
-- Name: likes update_likes_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.update_article_reaction_counts();


--
-- Name: links update_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.update_links_updated_at();


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
-- Name: article_translation_statuses article_translation_statuses_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_translation_statuses
    ADD CONSTRAINT article_translation_statuses_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: article_translation_statuses article_translation_statuses_translator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_translation_statuses
    ADD CONSTRAINT article_translation_statuses_translator_id_fkey FOREIGN KEY (translator_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: event_attendees event_attendees_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_attendees event_attendees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


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
-- Name: links links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: links links_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


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
-- Name: user_daily_translations user_daily_translations_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_translations
    ADD CONSTRAINT user_daily_translations_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: user_daily_translations user_daily_translations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_translations
    ADD CONSTRAINT user_daily_translations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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

\unrestrict 2u5EcRJVzZFaYRvxfBge0ewaYfdCOBclYub3rhugWAYZ5YbKuECFhZtirIU5Y7d

