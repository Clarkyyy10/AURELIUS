-- AURELIUS security migration (docs/phase2-plan.md §3; NFR security; manuscript §3.15).
--
-- How access works:
--   * The browser never reads or writes tables directly. Supabase's public Data API roles (anon,
--     authenticated) get NO table access, except SELECT on their own notifications (Realtime bell).
--   * The Next.js server runs each request in a transaction as the private role "aurelius_app" with
--     the signed-in user's id in request.jwt.claims, so the Row Level Security policies below apply
--     to every query the app makes (defence in depth on top of the checks in the API routes).
--   * Server-only bookkeeping (login lockout, rate limits) uses the privileged connection.

-- ------------------------------------------------------------------ links to Supabase Auth

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Keep users.email and users.email_confirmed_at in step with Supabase Auth (FR-41).
CREATE OR REPLACE FUNCTION public.sync_user_email() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.users SET email = NEW.email, email_confirmed_at = NEW.email_confirmed_at WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_user_email();

-- ------------------------------------------------------------------ data integrity

ALTER TABLE public.quotations ADD CONSTRAINT quotations_one_parent CHECK (num_nonnulls(order_id, service_request_id) = 1);
ALTER TABLE public.payments ADD CONSTRAINT payments_one_parent CHECK (num_nonnulls(order_id, service_request_id) = 1);
ALTER TABLE public.status_history ADD CONSTRAINT status_history_one_parent CHECK (num_nonnulls(order_id, service_request_id) = 1);

ALTER TABLE public.quotations ADD CONSTRAINT quotations_amounts
  CHECK (final_price >= 0 AND down_payment_required >= 0 AND down_payment_required <= final_price);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_decision CHECK (response_decision IS NULL OR response_decision IN ('accepted', 'declined'));
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
ALTER TABLE public.payments ADD CONSTRAINT payments_proof_rules
  CHECK (proof_type IS NULL OR (proof_type IN ('image/jpeg', 'image/png', 'application/pdf') AND proof_size_bytes BETWEEN 1 AND 5242880));
ALTER TABLE public.products ADD CONSTRAINT products_price_not_negative CHECK (price >= 0);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity CHECK (quantity BETWEEN 1 AND 5);
ALTER TABLE public.custom_designs ADD CONSTRAINT custom_designs_estimate CHECK (estimate_weight_g >= 0 AND estimate_price >= 0 AND version >= 1);
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_single_row CHECK (id = 1);

-- Only one current quotation per order or service request.
CREATE UNIQUE INDEX quotations_one_current_order ON public.quotations (order_id) WHERE is_current AND order_id IS NOT NULL;
CREATE UNIQUE INDEX quotations_one_current_service ON public.quotations (service_request_id) WHERE is_current AND service_request_id IS NOT NULL;
CREATE INDEX payments_order_idx ON public.payments (order_id);
CREATE INDEX payments_service_idx ON public.payments (service_request_id);
CREATE INDEX status_history_order_idx ON public.status_history (order_id, at);
CREATE INDEX status_history_service_idx ON public.status_history (service_request_id, at);

-- Readable codes (OR-2026-0001, CO-…, SR-…), allocated inside the same transaction as the record.
CREATE OR REPLACE FUNCTION public.next_code(p_prefix text) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  y int := extract(year FROM (now() AT TIME ZONE 'Asia/Manila'))::int;
  n int;
BEGIN
  IF p_prefix NOT IN ('OR', 'CO', 'SR') THEN
    RAISE EXCEPTION 'unknown code prefix %', p_prefix;
  END IF;
  INSERT INTO public.code_counters (prefix, year, last) VALUES (p_prefix, y, 1)
    ON CONFLICT (prefix, year) DO UPDATE SET last = public.code_counters.last + 1
    RETURNING last INTO n;
  RETURN p_prefix || '-' || y || '-' || lpad(n::text, 4, '0');
END;
$$;

-- ------------------------------------------------------------------ roles

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aurelius_app') THEN
    CREATE ROLE aurelius_app NOLOGIN NOINHERIT;
  END IF;
END
$$;
GRANT aurelius_app TO postgres;
GRANT USAGE ON SCHEMA public TO aurelius_app;

-- The signed-in user id, read from the JWT claims the server (or Realtime) sets for the transaction.
-- Same value as auth.uid(), without depending on grants in the auth schema.
CREATE OR REPLACE FUNCTION public.app_uid() RETURNS uuid
  LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;
REVOKE ALL ON FUNCTION public.app_uid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_uid() TO aurelius_app, authenticated;

-- Is the current user the store owner?
CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = public.app_uid() AND role = 'owner');
$$;
REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;

-- The store owner's user id, so a customer's action can notify the owner (FR-50) without the
-- customer being able to read the owner's profile.
CREATE OR REPLACE FUNCTION public.owner_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT id FROM public.users WHERE role = 'owner' ORDER BY created_at LIMIT 1;
$fn$;
REVOKE ALL ON FUNCTION public.owner_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_id() TO aurelius_app;
REVOKE ALL ON FUNCTION public.next_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_user_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner() TO aurelius_app, authenticated;
GRANT EXECUTE ON FUNCTION public.next_code(text) TO aurelius_app;

-- Close the public Data API: no table access for anon/authenticated (now and for future tables).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- What the app role may do (rows are further limited by the policies below).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.products, public.services, public.design_options, public.faqs, public.store_settings,
  public.orders, public.order_items, public.custom_designs, public.revision_remarks,
  public.service_requests, public.service_request_services, public.quotations, public.payments,
  public.status_history, public.notifications, public.email_outbox, public.chat_sessions
  TO aurelius_app;
GRANT SELECT ON public.users TO aurelius_app;
GRANT UPDATE (full_name, contact_number) ON public.users TO aurelius_app; -- never role or consent
-- login_attempts, rate_limits, code_counters and _prisma_migrations: no grants (server/privileged only).

-- ------------------------------------------------------------------ Row Level Security

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Helper: does the current user own this order / service request?
CREATE OR REPLACE FUNCTION public.owns_order(p_order uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order AND customer_id = public.app_uid());
$$;
CREATE OR REPLACE FUNCTION public.owns_service_request(p_request uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.service_requests WHERE id = p_request AND customer_id = public.app_uid());
$$;
REVOKE ALL ON FUNCTION public.owns_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_service_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_order(uuid), public.owns_service_request(uuid) TO aurelius_app;

-- users
CREATE POLICY users_read ON public.users FOR SELECT TO aurelius_app USING (id = public.app_uid() OR public.is_owner());
CREATE POLICY users_update_own ON public.users FOR UPDATE TO aurelius_app USING (id = public.app_uid()) WITH CHECK (id = public.app_uid());

-- catalog and settings: everyone reads what is visible; only the owner changes them
CREATE POLICY products_read ON public.products FOR SELECT TO aurelius_app USING (NOT hidden OR public.is_owner());
CREATE POLICY products_owner ON public.products FOR ALL TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY services_read ON public.services FOR SELECT TO aurelius_app USING (NOT hidden OR public.is_owner());
CREATE POLICY services_owner ON public.services FOR ALL TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY design_options_read ON public.design_options FOR SELECT TO aurelius_app USING (active OR public.is_owner());
CREATE POLICY design_options_owner ON public.design_options FOR ALL TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY faqs_read ON public.faqs FOR SELECT TO aurelius_app USING (active OR public.is_owner());
CREATE POLICY faqs_owner ON public.faqs FOR ALL TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY store_settings_read ON public.store_settings FOR SELECT TO aurelius_app USING (true);
CREATE POLICY store_settings_owner ON public.store_settings FOR UPDATE TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());

-- orders and custom orders: customers see and create their own; the owner sees everything.
-- Which fields and statuses may change is enforced by the server's status machines.
CREATE POLICY orders_read ON public.orders FOR SELECT TO aurelius_app USING (customer_id = public.app_uid() OR public.is_owner());
CREATE POLICY orders_insert ON public.orders FOR INSERT TO aurelius_app WITH CHECK (customer_id = public.app_uid() AND NOT public.is_owner());
CREATE POLICY orders_update ON public.orders FOR UPDATE TO aurelius_app
  USING (customer_id = public.app_uid() OR public.is_owner()) WITH CHECK (customer_id = public.app_uid() OR public.is_owner());

CREATE POLICY order_items_read ON public.order_items FOR SELECT TO aurelius_app USING (public.owns_order(order_id) OR public.is_owner());
CREATE POLICY order_items_insert ON public.order_items FOR INSERT TO aurelius_app WITH CHECK (public.owns_order(order_id));

CREATE POLICY custom_designs_read ON public.custom_designs FOR SELECT TO aurelius_app USING (customer_id = public.app_uid() OR public.is_owner());
CREATE POLICY custom_designs_insert ON public.custom_designs FOR INSERT TO aurelius_app
  WITH CHECK (customer_id = public.app_uid() AND public.owns_order(order_id));

CREATE POLICY revision_remarks_read ON public.revision_remarks FOR SELECT TO aurelius_app USING (public.owns_order(order_id) OR public.is_owner());
CREATE POLICY revision_remarks_owner ON public.revision_remarks FOR INSERT TO aurelius_app WITH CHECK (public.is_owner());

-- service requests
CREATE POLICY service_requests_read ON public.service_requests FOR SELECT TO aurelius_app USING (customer_id = public.app_uid() OR public.is_owner());
CREATE POLICY service_requests_insert ON public.service_requests FOR INSERT TO aurelius_app WITH CHECK (customer_id = public.app_uid() AND NOT public.is_owner());
CREATE POLICY service_requests_update ON public.service_requests FOR UPDATE TO aurelius_app
  USING (customer_id = public.app_uid() OR public.is_owner()) WITH CHECK (customer_id = public.app_uid() OR public.is_owner());
CREATE POLICY service_request_services_read ON public.service_request_services FOR SELECT TO aurelius_app
  USING (public.owns_service_request(service_request_id) OR public.is_owner());
CREATE POLICY service_request_services_insert ON public.service_request_services FOR INSERT TO aurelius_app
  WITH CHECK (public.owns_service_request(service_request_id));

-- quotations: the owner issues them; the customer may record an accept/decline on their own
CREATE POLICY quotations_read ON public.quotations FOR SELECT TO aurelius_app
  USING (public.owns_order(order_id) OR public.owns_service_request(service_request_id) OR public.is_owner());
CREATE POLICY quotations_owner_insert ON public.quotations FOR INSERT TO aurelius_app WITH CHECK (public.is_owner());
CREATE POLICY quotations_update ON public.quotations FOR UPDATE TO aurelius_app
  USING (public.is_owner() OR public.owns_order(order_id) OR public.owns_service_request(service_request_id))
  WITH CHECK (public.is_owner() OR public.owns_order(order_id) OR public.owns_service_request(service_request_id));

-- payments: customers submit pending ones for their own records; only the owner records or verifies
CREATE POLICY payments_read ON public.payments FOR SELECT TO aurelius_app
  USING (public.owns_order(order_id) OR public.owns_service_request(service_request_id) OR public.is_owner());
CREATE POLICY payments_insert ON public.payments FOR INSERT TO aurelius_app
  WITH CHECK (
    public.is_owner()
    OR ((public.owns_order(order_id) OR public.owns_service_request(service_request_id))
        AND recorded_by = 'customer' AND status = 'pending_verification')
  );
CREATE POLICY payments_owner_update ON public.payments FOR UPDATE TO aurelius_app USING (public.is_owner()) WITH CHECK (public.is_owner());

-- status history
CREATE POLICY status_history_read ON public.status_history FOR SELECT TO aurelius_app
  USING (public.owns_order(order_id) OR public.owns_service_request(service_request_id) OR public.is_owner());
CREATE POLICY status_history_insert ON public.status_history FOR INSERT TO aurelius_app
  WITH CHECK (public.owns_order(order_id) OR public.owns_service_request(service_request_id) OR public.is_owner());

-- notifications: each person reads and marks their own. The server creates them for the other party
-- (e.g. a customer's order notifies the owner) inside the same transaction.
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO aurelius_app USING (user_id = public.app_uid());
CREATE POLICY notifications_mark ON public.notifications FOR UPDATE TO aurelius_app USING (user_id = public.app_uid()) WITH CHECK (user_id = public.app_uid());
CREATE POLICY notifications_create ON public.notifications FOR INSERT TO aurelius_app WITH CHECK (public.app_uid() IS NOT NULL);

-- email outbox and chat session metadata: written by the server; chat metadata readable by the owner
CREATE POLICY email_outbox_create ON public.email_outbox FOR INSERT TO aurelius_app WITH CHECK (true);
CREATE POLICY chat_sessions_owner_read ON public.chat_sessions FOR SELECT TO aurelius_app USING (public.is_owner() OR user_id = public.app_uid());
CREATE POLICY chat_sessions_write ON public.chat_sessions FOR INSERT TO aurelius_app WITH CHECK (user_id IS NULL OR user_id = public.app_uid());
CREATE POLICY chat_sessions_update ON public.chat_sessions FOR UPDATE TO aurelius_app USING (user_id IS NULL OR user_id = public.app_uid());

-- ------------------------------------------------------------------ Realtime (notification bell)

GRANT SELECT ON public.notifications TO authenticated;
CREATE POLICY notifications_realtime ON public.notifications FOR SELECT TO authenticated USING (user_id = public.app_uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ------------------------------------------------------------------ Storage buckets
-- All uploads and downloads go through the server, which checks the file and the user's access,
-- then hands out short-lived signed links. Only product photos are public.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('service-photos', 'service-photos', false, 5242880, ARRAY['image/jpeg', 'image/png']),
  ('design-snapshots', 'design-snapshots', false, 1048576, ARRAY['image/jpeg', 'image/png']),
  ('product-photos', 'product-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
