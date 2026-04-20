CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_company_id_idx" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "departments_company_id_is_active_idx" ON "departments" USING btree ("company_id","is_active") WHERE "departments"."is_active" = true;--> statement-breakpoint
CREATE INDEX "departments_company_id_name_idx" ON "departments" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "departments_company_id_is_active_created_at_idx" ON "departments" USING btree ("company_id","is_active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "departments_company_id_name_id_idx" ON "departments" USING btree ("company_id","name","id");