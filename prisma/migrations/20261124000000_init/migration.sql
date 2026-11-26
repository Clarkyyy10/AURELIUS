-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'owner');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('available', 'made_to_order', 'unavailable');

-- CreateEnum
CREATE TYPE "OptionKind" AS ENUM ('product_type', 'material', 'finish', 'gemstone', 'cut', 'size', 'font', 'chain_style', 'clasp', 'design');

-- CreateEnum
CREATE TYPE "OrderKind" AS ENUM ('product', 'custom');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('customer', 'owner');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('jewelry', 'watch');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('down_payment', 'full_payment', 'balance');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending_verification', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('gcash', 'bank_transfer', 'cash_in_store');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "full_name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "contact_number" VARCHAR(16) NOT NULL,
    "privacy_consent_at" TIMESTAMPTZ NOT NULL,
    "privacy_notice_version" VARCHAR(20) NOT NULL,
    "email_confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "email" VARCHAR(254) NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "last_failed_at" TIMESTAMPTZ,
    "locked_until" TIMESTAMPTZ,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "material" VARCHAR(60) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "photos" TEXT[],
    "design" JSONB,
    "availability" "Availability" NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(600) NOT NULL,
    "applies_to" TEXT[],
    "icon" VARCHAR(40) NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_options" (
    "id" VARCHAR(60) NOT NULL,
    "kind" "OptionKind" NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL,
    "attributes" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "design_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "kind" "OrderKind" NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "based_on_product_id" UUID,
    "notes" VARCHAR(500),
    "rejection_reason" VARCHAR(500),
    "client_request_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR(120) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "photo" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_designs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "labels" JSONB NOT NULL,
    "estimate_weight_g" DECIMAL(10,2) NOT NULL,
    "estimate_price" DECIMAL(12,2) NOT NULL,
    "snapshot_path" TEXT,
    "client_request_id" VARCHAR(64),
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_remarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "item_description" VARCHAR(300) NOT NULL,
    "brand_model" VARCHAR(80),
    "material" VARCHAR(80),
    "details" VARCHAR(1000) NOT NULL,
    "photos" TEXT[],
    "preferred_drop_off_date" DATE,
    "dropped_off_at" DATE,
    "source" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "client_request_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_services" (
    "service_request_id" UUID NOT NULL,
    "service_id" VARCHAR(40) NOT NULL,

    CONSTRAINT "service_request_services_pkey" PRIMARY KEY ("service_request_id","service_id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "service_request_id" UUID,
    "final_price" DECIMAL(12,2) NOT NULL,
    "down_payment_required" DECIMAL(12,2) NOT NULL,
    "expected_date" DATE NOT NULL,
    "procedure" VARCHAR(1000),
    "notes" VARCHAR(1000),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "response_decision" VARCHAR(10),
    "response_reason" VARCHAR(500),
    "responded_at" TIMESTAMPTZ,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "service_request_id" UUID,
    "kind" "PaymentKind" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_on" DATE NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference_number" VARCHAR(60),
    "proof_path" TEXT,
    "proof_name" VARCHAR(200),
    "proof_type" VARCHAR(30),
    "proof_size_bytes" INTEGER,
    "recorded_by" "Actor" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "rejection_reason" VARCHAR(500),
    "verified_at" TIMESTAMPTZ,
    "client_request_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "service_request_id" UUID,
    "status" VARCHAR(30) NOT NULL,
    "actor" "Actor" NOT NULL,
    "note" VARCHAR(500),
    "at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_counters" (
    "prefix" VARCHAR(4) NOT NULL,
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "code_counters_pkey" PRIMARY KEY ("prefix","year")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "link" VARCHAR(200) NOT NULL,
    "channels" TEXT[],
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "to_email" VARCHAR(254) NOT NULL,
    "template" VARCHAR(40) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(12) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "provider_id" VARCHAR(80),
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "referred_to_owner" INTEGER NOT NULL DEFAULT 0,
    "drafts_sent" TEXT[],
    "used_fallback" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(120) NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" VARCHAR(200) NOT NULL,
    "answer" VARCHAR(1500) NOT NULL,
    "keywords" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "store_name" VARCHAR(80) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "contact_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "opening_hours" VARCHAR(200) NOT NULL,
    "payment_instructions" VARCHAR(1000) NOT NULL,
    "claiming_note" VARCHAR(300) NOT NULL,
    "policies" VARCHAR(4000) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_hidden_availability_idx" ON "products"("hidden", "availability");

-- CreateIndex
CREATE INDEX "design_options_kind_sort_order_idx" ON "design_options"("kind", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_client_request_id_key" ON "orders"("client_request_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_created_at_idx" ON "orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_kind_status_idx" ON "orders"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_designs_client_request_id_key" ON "custom_designs"("client_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_designs_order_id_version_key" ON "custom_designs"("order_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_code_key" ON "service_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_client_request_id_key" ON "service_requests"("client_request_id");

-- CreateIndex
CREATE INDEX "service_requests_customer_id_created_at_idx" ON "service_requests"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_client_request_id_key" ON "payments"("client_request_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "email_outbox_status_created_at_idx" ON "email_outbox"("status", "created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_designs" ADD CONSTRAINT "custom_designs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_designs" ADD CONSTRAINT "custom_designs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision_remarks" ADD CONSTRAINT "revision_remarks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_services" ADD CONSTRAINT "service_request_services_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_services" ADD CONSTRAINT "service_request_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

