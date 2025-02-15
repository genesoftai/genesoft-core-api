

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."message" AS (
	"sender" "text",
	"content" "text",
	"timestamp" "text"
);


ALTER TYPE "public"."message" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.user (id, email)
  values (new.id, new.email);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$begin
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
end;$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "working_time" "jsonb",
    "llm_usage" "jsonb",
    "tool_usage" "jsonb",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."ai_agent_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "logo_url" "text",
    "color" character varying(50),
    "theme" character varying(50),
    "perception" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."branding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "resend_id" character varying(255) NOT NULL,
    "topic" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."email" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "file_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "reference_link_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."feature" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "is_submit" boolean DEFAULT false,
    "status" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "messages" "jsonb"
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text",
    "type" character varying(50),
    "bucket" character varying(255),
    "path" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "name" "text"
);


ALTER TABLE "public"."file" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_repository" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" character varying(255),
    "repo_id" character varying(255),
    "owner" character varying(255),
    "name" "text",
    "full_name" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."github_repository" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "costs" "jsonb",
    "invoice_id" character varying(255),
    "payment_id" character varying(255),
    "status" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iteration" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "text" NOT NULL,
    "status" "text" DEFAULT 'todo'::"text",
    "type" "text" NOT NULL,
    "feedback_id" "text",
    "working_time" numeric DEFAULT 0.0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."iteration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iteration_task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "iteration_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "team" "text" NOT NULL,
    "status" "text" DEFAULT 'todo'::"text",
    "remark" "text",
    "working_time" numeric DEFAULT 0.0 NOT NULL,
    "tool_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "llm_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "result" "jsonb"
);


ALTER TABLE "public"."iteration_task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."koyeb_project" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "app_id" "text" NOT NULL,
    "service_id" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."koyeb_project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "image" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "customer_id" "text"
);


ALTER TABLE "public"."organization" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "file_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "reference_link_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."page" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "purpose" "text",
    "target_audience" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "branding_id" "uuid"
);


ALTER TABLE "public"."project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reference_link" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "name" "text"
);


ALTER TABLE "public"."reference_link" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."repository_build" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "status" character varying(50) NOT NULL,
    "error_logs" "text",
    "fix_attempts" integer DEFAULT 0 NOT NULL,
    "fix_triggered" boolean DEFAULT false NOT NULL,
    "last_fix_attempt" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "iteration_id" character varying(255) NOT NULL
);


ALTER TABLE "public"."repository_build" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "web" "jsonb",
    "backend_service" "jsonb",
    "database" "jsonb",
    "cloud_service_providers" "jsonb",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."resources_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription" (
    "id" "uuid" NOT NULL,
    "organization_id" "text" NOT NULL,
    "cancel_at" timestamp without time zone,
    "cancel_at_period_end" boolean,
    "canceled_at" timestamp without time zone,
    "created" timestamp without time zone DEFAULT "now"() NOT NULL,
    "current_period_end" timestamp without time zone NOT NULL,
    "current_period_start" timestamp without time zone NOT NULL,
    "ended_at" timestamp without time zone,
    "metadata" "jsonb",
    "price_id" "text",
    "quantity" integer,
    "status" "text",
    "trial_end" timestamp without time zone,
    "trial_start" timestamp without time zone,
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supabase" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "supabase_project_id" "text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "db_password" "text"
);


ALTER TABLE "public"."supabase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "iteration_task_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "team" "text" NOT NULL,
    "status" "text" DEFAULT 'todo'::"text",
    "remark" "text",
    "working_time" numeric DEFAULT 0.0 NOT NULL,
    "tool_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "llm_usage" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."team_task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "image" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "organization_id" "uuid",
    "customer_id" "text"
);


ALTER TABLE "public"."user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vercel_project" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "text" NOT NULL,
    "vercel_project_id" "text" NOT NULL,
    "vercel_project_name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."vercel_project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_application" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "environment" character varying(50) DEFAULT 'production'::character varying,
    "status" character varying(50) DEFAULT 'running'::character varying,
    "url" "text",
    "third_party_services" "jsonb",
    "image" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."web_application" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding"
    ADD CONSTRAINT "branding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding"
    ADD CONSTRAINT "branding_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."email"
    ADD CONSTRAINT "email_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature"
    ADD CONSTRAINT "feature_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file"
    ADD CONSTRAINT "file_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repository"
    ADD CONSTRAINT "github_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice"
    ADD CONSTRAINT "invoice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iteration"
    ADD CONSTRAINT "iteration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iteration_task"
    ADD CONSTRAINT "iteration_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."koyeb_project"
    ADD CONSTRAINT "koyeb_project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page"
    ADD CONSTRAINT "page_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reference_link"
    ADD CONSTRAINT "reference_link_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repository_build"
    ADD CONSTRAINT "repository_build_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources_usage"
    ADD CONSTRAINT "resources_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription"
    ADD CONSTRAINT "subscription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supabase"
    ADD CONSTRAINT "supabase_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_task"
    ADD CONSTRAINT "team_task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vercel_project"
    ADD CONSTRAINT "vercel_project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_application"
    ADD CONSTRAINT "web_application_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_koyeb_project_updated_at_trigger" BEFORE UPDATE ON "public"."koyeb_project" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_repository_build_updated_at" BEFORE UPDATE ON "public"."repository_build" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscription_updated_at_trigger" BEFORE UPDATE ON "public"."subscription" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_supabase_updated_at_trigger" BEFORE UPDATE ON "public"."supabase" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_ai_agent_usage" BEFORE UPDATE ON "public"."ai_agent_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_branding" BEFORE UPDATE ON "public"."branding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_email" BEFORE UPDATE ON "public"."email" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_feature" BEFORE UPDATE ON "public"."feature" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_feedback" BEFORE UPDATE ON "public"."feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_file" BEFORE UPDATE ON "public"."file" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_github" BEFORE UPDATE ON "public"."github_repository" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_invoice" BEFORE UPDATE ON "public"."invoice" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_iteration" BEFORE UPDATE ON "public"."iteration" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_iteration_task" BEFORE UPDATE ON "public"."iteration_task" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_organization" BEFORE UPDATE ON "public"."organization" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_page" BEFORE UPDATE ON "public"."page" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_project" BEFORE UPDATE ON "public"."project" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_reference_link" BEFORE UPDATE ON "public"."reference_link" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_resources_usage" BEFORE UPDATE ON "public"."resources_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_team_task" BEFORE UPDATE ON "public"."team_task" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_user" BEFORE UPDATE ON "public"."user" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger_on_web_application" BEFORE UPDATE ON "public"."web_application" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_vercel_project_updated_at_trigger" BEFORE UPDATE ON "public"."vercel_project" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."ai_agent_usage"
    ADD CONSTRAINT "ai_agent_usage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branding"
    ADD CONSTRAINT "branding_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature"
    ADD CONSTRAINT "feature_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."github_repository"
    ADD CONSTRAINT "github_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice"
    ADD CONSTRAINT "invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iteration_task"
    ADD CONSTRAINT "iteration_task_iteration_id_fkey" FOREIGN KEY ("iteration_id") REFERENCES "public"."iteration"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page"
    ADD CONSTRAINT "page_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_branding_id_fkey" FOREIGN KEY ("branding_id") REFERENCES "public"."branding"("id");



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources_usage"
    ADD CONSTRAINT "resources_usage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_task"
    ADD CONSTRAINT "team_task_iteration_task_id_fkey" FOREIGN KEY ("iteration_task_id") REFERENCES "public"."iteration_task"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."web_application"
    ADD CONSTRAINT "web_application_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE CASCADE;



CREATE POLICY "Public user are viewable by everyone." ON "public"."user" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own user information." ON "public"."user" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own user information." ON "public"."user" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."ai_agent_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."file" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_repository" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iteration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iteration_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."koyeb_project" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reference_link" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repository_build" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supabase" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vercel_project" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_application" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_agent_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_usage" TO "service_role";



GRANT ALL ON TABLE "public"."branding" TO "anon";
GRANT ALL ON TABLE "public"."branding" TO "authenticated";
GRANT ALL ON TABLE "public"."branding" TO "service_role";



GRANT ALL ON TABLE "public"."email" TO "anon";
GRANT ALL ON TABLE "public"."email" TO "authenticated";
GRANT ALL ON TABLE "public"."email" TO "service_role";



GRANT ALL ON TABLE "public"."feature" TO "anon";
GRANT ALL ON TABLE "public"."feature" TO "authenticated";
GRANT ALL ON TABLE "public"."feature" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."file" TO "anon";
GRANT ALL ON TABLE "public"."file" TO "authenticated";
GRANT ALL ON TABLE "public"."file" TO "service_role";



GRANT ALL ON TABLE "public"."github_repository" TO "anon";
GRANT ALL ON TABLE "public"."github_repository" TO "authenticated";
GRANT ALL ON TABLE "public"."github_repository" TO "service_role";



GRANT ALL ON TABLE "public"."invoice" TO "anon";
GRANT ALL ON TABLE "public"."invoice" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice" TO "service_role";



GRANT ALL ON TABLE "public"."iteration" TO "anon";
GRANT ALL ON TABLE "public"."iteration" TO "authenticated";
GRANT ALL ON TABLE "public"."iteration" TO "service_role";



GRANT ALL ON TABLE "public"."iteration_task" TO "anon";
GRANT ALL ON TABLE "public"."iteration_task" TO "authenticated";
GRANT ALL ON TABLE "public"."iteration_task" TO "service_role";



GRANT ALL ON TABLE "public"."koyeb_project" TO "anon";
GRANT ALL ON TABLE "public"."koyeb_project" TO "authenticated";
GRANT ALL ON TABLE "public"."koyeb_project" TO "service_role";



GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";



GRANT ALL ON TABLE "public"."page" TO "anon";
GRANT ALL ON TABLE "public"."page" TO "authenticated";
GRANT ALL ON TABLE "public"."page" TO "service_role";



GRANT ALL ON TABLE "public"."project" TO "anon";
GRANT ALL ON TABLE "public"."project" TO "authenticated";
GRANT ALL ON TABLE "public"."project" TO "service_role";



GRANT ALL ON TABLE "public"."reference_link" TO "anon";
GRANT ALL ON TABLE "public"."reference_link" TO "authenticated";
GRANT ALL ON TABLE "public"."reference_link" TO "service_role";



GRANT ALL ON TABLE "public"."repository_build" TO "anon";
GRANT ALL ON TABLE "public"."repository_build" TO "authenticated";
GRANT ALL ON TABLE "public"."repository_build" TO "service_role";



GRANT ALL ON TABLE "public"."resources_usage" TO "anon";
GRANT ALL ON TABLE "public"."resources_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."resources_usage" TO "service_role";



GRANT ALL ON TABLE "public"."subscription" TO "anon";
GRANT ALL ON TABLE "public"."subscription" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription" TO "service_role";



GRANT ALL ON TABLE "public"."supabase" TO "anon";
GRANT ALL ON TABLE "public"."supabase" TO "authenticated";
GRANT ALL ON TABLE "public"."supabase" TO "service_role";



GRANT ALL ON TABLE "public"."team_task" TO "anon";
GRANT ALL ON TABLE "public"."team_task" TO "authenticated";
GRANT ALL ON TABLE "public"."team_task" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."vercel_project" TO "anon";
GRANT ALL ON TABLE "public"."vercel_project" TO "authenticated";
GRANT ALL ON TABLE "public"."vercel_project" TO "service_role";



GRANT ALL ON TABLE "public"."web_application" TO "anon";
GRANT ALL ON TABLE "public"."web_application" TO "authenticated";
GRANT ALL ON TABLE "public"."web_application" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
