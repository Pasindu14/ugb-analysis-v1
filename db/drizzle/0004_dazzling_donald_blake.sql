CREATE TABLE "area_customer_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"report_date" date NOT NULL,
	"area_name" text NOT NULL,
	"supervisor_code" integer NOT NULL,
	"supervisor_name" text NOT NULL,
	"distributor_code" integer NOT NULL,
	"distributor_name" text NOT NULL,
	"division_code" integer NOT NULL,
	"division_name" text NOT NULL,
	"rep_code" integer NOT NULL,
	"rep_name" text NOT NULL,
	"root_code" integer NOT NULL,
	"root_name" text NOT NULL,
	"outlet_type" text NOT NULL,
	"customer_code" integer NOT NULL,
	"customer_name" text NOT NULL,
	"gross_sale_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_sale_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "area_customer_sales" ADD CONSTRAINT "area_customer_sales_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acs_company_report_date_idx" ON "area_customer_sales" USING btree ("company_id","report_date");--> statement-breakpoint
CREATE INDEX "acs_company_area_idx" ON "area_customer_sales" USING btree ("company_id","area_name");--> statement-breakpoint
CREATE INDEX "acs_company_outlet_type_idx" ON "area_customer_sales" USING btree ("company_id","outlet_type");--> statement-breakpoint
CREATE INDEX "acs_company_rep_idx" ON "area_customer_sales" USING btree ("company_id","rep_name");