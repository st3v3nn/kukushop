--
-- PostgreSQL database dump
--

\restrict n8CS3CeXKpmA9tRFYaDVIZKawddbVH3kLafJBLCq5D1URL07Ds8Dk4ff8eMClCw

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    label text,
    street text,
    city text,
    phone text,
    instructions text,
    latitude numeric,
    longitude numeric,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO speedy_admin;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.favorites (
    user_id uuid NOT NULL,
    item_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO speedy_admin;

--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.menu_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menu_categories OWNER TO speedy_admin;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    image_url text,
    secondary_image_url text,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_featured boolean DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    tier_pricing jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.menu_items OWNER TO speedy_admin;

--
-- Name: mpesa_stk_callbacks; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.mpesa_stk_callbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stk_request_id uuid,
    merchant_request_id text,
    checkout_request_id text,
    result_code integer,
    result_desc text,
    mpesa_receipt_number text,
    amount numeric,
    phone text,
    transaction_date text,
    body jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mpesa_stk_callbacks OWNER TO speedy_admin;

--
-- Name: mpesa_stk_requests; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.mpesa_stk_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    merchant_request_id text,
    checkout_request_id text,
    response_code text,
    response_description text,
    amount numeric,
    phone text,
    account_reference text,
    transaction_desc text,
    status text DEFAULT 'initiated'::text,
    provider_response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mpesa_stk_requests OWNER TO speedy_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type text DEFAULT 'info'::text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO speedy_admin;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    menu_item_id uuid,
    name text,
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0,
    total_price numeric DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO speedy_admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    delivery_address_id uuid,
    subtotal numeric DEFAULT 0,
    delivery_fee numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    total numeric DEFAULT 0,
    notes text,
    promotion_code text,
    payment_method text,
    status text DEFAULT 'created'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_rider_id uuid,
    payment_status text DEFAULT 'pending'::text,
    phone text
);


ALTER TABLE public.orders OWNER TO speedy_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.refresh_tokens (
    token text NOT NULL,
    user_id uuid,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO speedy_admin;

--
-- Name: refresh_tokens_audit; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.refresh_tokens_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text,
    user_id uuid,
    action text NOT NULL,
    ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens_audit OWNER TO speedy_admin;

--
-- Name: rider_orders; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.rider_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    status text NOT NULL,
    customer_name text,
    customer_phone text,
    items jsonb DEFAULT '[]'::jsonb,
    total numeric DEFAULT 0,
    address jsonb DEFAULT '{}'::jsonb,
    distance text,
    estimated_time text,
    payment_method text,
    assigned_rider_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rider_orders OWNER TO speedy_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: speedy_admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    phone text,
    role text DEFAULT 'customer'::text NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reset_token text,
    reset_token_expires timestamp with time zone,
    avatar_url text
);


ALTER TABLE public.users OWNER TO speedy_admin;

--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.customer_addresses (id, user_id, label, street, city, phone, instructions, latitude, longitude, is_default, created_at, updated_at) FROM stdin;
34d2ae7c-9985-4255-b161-7cf4aaf928bd	d00eaf37-708e-498e-86df-cceb72f63cce	Home	Bismark road	Nakuru	\N	\N	\N	\N	f	2026-05-25 13:23:24.728204+00	2026-05-25 13:23:24.728204+00
c943f041-5bf3-418e-8697-62c6cc6238db	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	Home	Bondeni 5th floor	Nakuru	\N	\N	\N	\N	f	2026-05-31 18:35:47.488252+00	2026-05-31 18:35:47.488252+00
12678a79-c513-4656-83d9-020378467067	00eb30ae-7662-42db-9c9b-fe8dadede7af	Home	Monarch studios opposite st Anthony hospital	Nakuru	\N	\N	\N	\N	f	2026-06-01 16:34:59.371098+00	2026-06-01 16:34:59.371098+00
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.favorites (user_id, item_id, created_at) FROM stdin;
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.menu_categories (id, name, description, image_url, display_order, is_active, created_at, updated_at) FROM stdin;
0f58437e-ad89-4844-b458-1b399bfa6bb0	Restaurant	Delicious cooked meals prepared with love	/uploads/categories/99526_1779713916395_d993db56ea281329_categories.webp	1	t	2026-05-24 06:14:45.068925+00	2026-05-25 12:58:36.85257+00
446ea926-e393-484d-b614-f4dba7a11d26	Butchery	Fresh high-quality cuts of meat	/uploads/categories/99551_1779714023491_0ce9d9ed483fc072_categories.webp	2	t	2026-05-24 06:14:45.088266+00	2026-05-25 13:00:23.919954+00
25a06939-8193-4b47-bfb4-7e24552b2fbd	Groceries	Fresh fruits, vegetables and essentials	/uploads/categories/99558_1779714064012_cabbf29113139e4f_categories.webp	3	t	2026-05-24 06:14:45.103072+00	2026-05-25 13:01:04.344605+00
3d4e748c-713b-43c4-beb0-df40fbb4a46f	Beverages & Snacks	Hot and cold drinks, refreshments, and light bites.	/uploads/categories/106132_1779714094446_acde0a3d21846698_categories.webp	4	t	2026-05-25 12:21:51.661522+00	2026-05-25 13:01:34.826802+00
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.menu_items (id, category_id, name, description, price, image_url, secondary_image_url, is_available, created_at, updated_at, is_featured, tags, tier_pricing) FROM stdin;
24b0acde-1cb1-4d8b-bdf6-afa39b1986b6	446ea926-e393-484d-b614-f4dba7a11d26	Beef Steak (1kg)	Premium beef steak cut	750	https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80	\N	t	2026-05-24 06:14:45.092518+00	2026-05-24 06:14:45.092518+00	f	{}	[]
5b21b9fd-7ea9-4776-8d6b-ad7f6fc4c95b	25a06939-8193-4b47-bfb4-7e24552b2fbd	Tomatoes (1kg)	Ripe red tomatoes	120	/uploads/products/115111_1779714167363_21f717d76e13beac_products.webp	\N	t	2026-05-24 06:14:45.11623+00	2026-05-25 13:02:47.812309+00	f	{}	[]
c3f56ae0-f2df-48f9-9fec-a7ad18a707ad	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Egg chopps 	.	100	/uploads/products/df477214-559b-4234-8de2-4fd24c3d53c9_1779969044998_17caa8532261e4a4_products.webp	\N	t	2026-05-28 11:50:45.498123+00	2026-05-28 11:50:45.498123+00	t	{.}	[]
2f5c82a4-ab51-4c1a-8cc5-955e18dd497b	0f58437e-ad89-4844-b458-1b399bfa6bb0	Spinach 	Fresh spinach 	50	/uploads/products/Cooked-spinach-in-a-bowl-scaled_1779969178053_9ca9e741e76f2ad2_products.webp	\N	t	2026-05-24 06:14:45.11232+00	2026-05-28 11:52:58.520087+00	f	{}	[]
a117fa0e-e272-4c33-8ee3-c6d74428850c	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Half cake	Enjoy crunchy cooked cakes 	60	/uploads/products/a87dba2c-3cd4-4f95-b44c-7fd9c62ad80d_1779969497809_f4a6579f89a87a3d_products.webp	\N	t	2026-05-28 11:58:18.33865+00	2026-05-28 11:58:18.33865+00	f	{snacks}	[]
94b003f9-ea0f-4959-a584-23813e51e067	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Mandazi	Sweet fried mandazi	20	/uploads/products/0eacb4e7-6dc9-4a4a-933f-8ee858c78341_1779970262139_b5ee95834c835714_products.webp	\N	t	2026-05-28 12:11:02.673102+00	2026-05-28 12:11:02.673102+00	f	{snacks}	[]
ff9f2f92-5b76-429a-9382-0ef21d9fa8af	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Chips masala 	Hot spicy masala fries ganished with fresh coriander 	220	/uploads/products/spicy-chips-masala-recipe-main-photo_1779970484192_e87b97cd51935821_products.webp	\N	t	2026-05-28 12:14:44.528618+00	2026-05-28 12:14:44.528618+00	f	{snacks}	[]
14d1074a-a0b4-4e19-b7a4-54cfa64b0951	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Smocha	A well prepared snack mix of chapati, smokie and fresh kachumbari topped with sweet sauce and mayonnaise.	100	/uploads/products/HFY_PyxaUAArt_L_1779972537143_5e5472b63ea8bbc4_products.webp	\N	t	2026-05-28 12:48:57.393878+00	2026-05-28 12:48:57.393878+00	f	{snacks}	[]
9a8e9af6-c87b-4f9e-9287-05595c012d02	0f58437e-ad89-4844-b458-1b399bfa6bb0	Matumbo	Wet fried matumbos 	150	/uploads/products/images__40__1779972753802_df711159721f790a_products.webp	\N	t	2026-05-28 12:52:34.064792+00	2026-05-28 12:52:34.064792+00	f	{lunch}	[]
f2b91f68-1bf5-45e2-ae47-9030b2e7ffcb	0f58437e-ad89-4844-b458-1b399bfa6bb0	Kuku kienyeji	Pure free range kenyeji chicken wet fry	400	/uploads/products/3d65f52b-68c5-4d5f-b0a8-ca3356fc31b2_1779973354295_0d7d7c1c6f777b40_products.webp	\N	t	2026-05-28 13:02:34.518798+00	2026-05-28 13:02:34.518798+00	f	{lunch}	[{"name": "1/4", "price": 400}, {"name": "1/2", "price": 800}, {"name": "3/4", "price": 1200}, {"name": "Tf", "price": 1600}]
0d8168bf-30a2-4e46-bec6-bb03f8f9deaf	0f58437e-ad89-4844-b458-1b399bfa6bb0	Beens	.	100	/uploads/products/images__14__1779974320277_7bce61e543bde80a_products.webp	\N	t	2026-05-28 13:18:40.621169+00	2026-05-28 13:18:40.621169+00	f	{lunch}	[]
0b08b5c8-f1a0-4960-a684-a162e7629f70	0f58437e-ad89-4844-b458-1b399bfa6bb0	Tumbukiza 	.	220	/uploads/products/images__45__1779975834336_a6ddb12978c44abf_products.webp	\N	t	2026-05-28 13:43:54.64877+00	2026-05-28 13:43:54.64877+00	f	{}	[]
d5aa1503-3b36-475d-8320-18479e5fcc03	0f58437e-ad89-4844-b458-1b399bfa6bb0	Smokie	\N	40	/uploads/products/images__12__1779975945008_e1e19386531a4992_products.webp	\N	t	2026-05-28 13:45:45.221793+00	2026-05-28 13:45:45.221793+00	f	{snacks}	[]
88d4acfd-5421-44e0-92c5-f0ca16c8d64d	0f58437e-ad89-4844-b458-1b399bfa6bb0	Ugali & Greens	\N	100	/uploads/products/IMG-20260208-WA0002_1780126904723_291bdca23dd00fba_products.webp	\N	t	2026-05-30 07:41:45.3734+00	2026-05-30 07:41:45.3734+00	f	{}	[]
cabc7540-0ca3-4c79-801c-4facdd20a862	0f58437e-ad89-4844-b458-1b399bfa6bb0	Plain Biriyani	\N	200	/uploads/products/IMG-20260124-WA0015_1780127733283_1d154b4c5b0c2c25_products.webp	\N	t	2026-05-30 07:55:33.719467+00	2026-05-30 07:55:33.719467+00	f	{}	[{"name": "Chicken Biriyani", "price": 400}]
04f8f3b5-a6c7-4c85-932e-5bb9e37982f9	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Half cake 	.	60	/uploads/products/5e90eeab-7ca7-435e-8f97-5b75243bf691_1780574991219_b44a4c29379a4b39_products.webp	\N	t	2026-06-04 12:09:51.574331+00	2026-06-04 12:09:51.574331+00	f	{}	[]
7a3a2b7b-230c-470c-a7c7-ae2c53252832	0f58437e-ad89-4844-b458-1b399bfa6bb0	Somali Rice & Chutney		250	/uploads/products/IMG-20260124-WA0007_1780127859156_639822740516e358_products.webp	\N	t	2026-05-30 07:57:39.574891+00	2026-05-30 07:58:40.658882+00	f	{}	[{"name": "Somali Rice, Chicken & Chutney", "price": 500}]
8ebeacd8-5afa-4705-9aa5-99efa056d180	0f58437e-ad89-4844-b458-1b399bfa6bb0	Ugali mayai special	\N	150	/uploads/products/IMG-20260124-WA0022_1780128730120_f8779cf23aab4234_products.webp	\N	t	2026-05-30 08:12:10.524474+00	2026-05-30 08:12:10.524474+00	f	{}	[]
189c74c3-02a8-4fe5-80ce-9962b8c7350d	0f58437e-ad89-4844-b458-1b399bfa6bb0	Stocked Sphagetti	\N	300	/uploads/products/IMG-20260124-WA0026_1780129395899_6db7cbd870de09fa_products.webp	\N	t	2026-05-30 08:23:16.278114+00	2026-05-30 08:23:16.278114+00	f	{}	[]
f8047188-38ab-419e-8f77-d4800f71ce4f	0f58437e-ad89-4844-b458-1b399bfa6bb0	Garden of Eden Platter	\N	700	/uploads/products/IMG-20260124-WA0041_1780129689347_519eefea4e3c21a2_products.webp	\N	t	2026-05-30 08:28:09.796569+00	2026-05-30 08:28:09.796569+00	f	{}	[]
928b2db5-4574-42c4-b6c3-e1f491551413	0f58437e-ad89-4844-b458-1b399bfa6bb0	Mukimo	.	120	/uploads/products/mokish_1780574866555_b2b8026ee638ff2f_products.webp	\N	t	2026-06-04 12:07:47.016569+00	2026-06-04 12:07:47.016569+00	f	{lunch}	[]
d1d9e99c-dc39-4087-b45e-3c4965f24031	0f58437e-ad89-4844-b458-1b399bfa6bb0	Ndengu	.	85	/uploads/products/images__41___1__1780575109085_6774b0c55bfc255f_products.webp	\N	t	2026-06-04 12:11:49.254717+00	2026-06-04 12:11:49.254717+00	f	{lunch}	[]
2ee9d270-a4e7-4657-8d4e-a5c38b097ac2	0f58437e-ad89-4844-b458-1b399bfa6bb0	Plain white rice	\N	120	/uploads/products/Brazilian-white-rice-2-679x1024_1780575285156_defcca70bec6dcc0_products.webp	\N	t	2026-06-04 12:14:45.439361+00	2026-06-04 12:14:45.439361+00	f	{}	[]
716c6e65-e10f-4596-a76a-ebcdee39bd01	0f58437e-ad89-4844-b458-1b399bfa6bb0	Coleslaw	..	100	/uploads/products/maxresdefault_1780575914785_8f7ed6b62c02fef2_products.webp	\N	t	2026-06-04 12:25:15.146324+00	2026-06-04 12:37:57.394262+00	f	{snacks}	[]
ebfa4151-b602-4a96-b32a-e92bd696990a	25a06939-8193-4b47-bfb4-7e24552b2fbd	Apples	\N	50	/uploads/products/images__32__1780576803913_c7b9c3a1a4708756_products.webp	\N	t	2026-06-04 12:40:04.162157+00	2026-06-04 12:40:04.162157+00	f	{groceries}	[]
8bee097a-854d-4aec-9ce0-18004ce7f082	25a06939-8193-4b47-bfb4-7e24552b2fbd	Melon	\N	250	/uploads/products/images__35__1780576896828_a47e7ada55da3fec_products.webp	\N	t	2026-06-04 12:41:36.994386+00	2026-06-04 12:41:36.994386+00	f	{groceries}	[]
f14b1c83-62c2-49fb-8f7e-fd9989e1b21a	25a06939-8193-4b47-bfb4-7e24552b2fbd	Bananas	Per pc	15	/uploads/products/bunch-of-ripe-bananas-on-white-background-photo_1780577022330_e11a5312c6865b8b_products.webp	\N	t	2026-06-04 12:43:42.458363+00	2026-06-04 12:43:42.458363+00	f	{groceries}	[]
069dad9e-dee3-446c-85eb-c67224f40179	446ea926-e393-484d-b614-f4dba7a11d26	Goat Meat (1kg)	Fresh goat meat on bone	800	https://images.unsplash.com/photo-1627582875323-289520e5e03a?auto=format&fit=crop&q=80	\N	f	2026-05-24 06:14:45.095635+00	2026-06-05 14:35:00.786001+00	f	{}	[]
40c617b3-1818-4e1a-8a71-60575b1b1fac	0f58437e-ad89-4844-b458-1b399bfa6bb0	White rice	.	120	/uploads/products/Brazilian-white-rice-2-679x1024_1779974400941_4b33b430fa1049e8_products.webp	\N	t	2026-05-28 13:20:01.235771+00	2026-06-10 13:15:46.416879+00	f	{lunch}	[]
9e4439e5-24fb-4ddf-8977-400a4e70f151	0f58437e-ad89-4844-b458-1b399bfa6bb0	Pilau	Aromatic rice cooked with chicken and spices	400	/uploads/products/df1f54fb-7258-4701-88d5-88285ef3e937_1781098742125_b11aab36ea8fd517_products.webp	\N	t	2026-05-24 06:14:45.085496+00	2026-06-10 13:39:02.781439+00	f	{lunch}	[]
21cfa653-04ad-4fd9-9fa3-42391865ab9b	0f58437e-ad89-4844-b458-1b399bfa6bb0	Chips special & Kebab		150	/uploads/products/IMG-20260124-WA0020_1780128621523_67cdf24daee2432d_products.webp	\N	t	2026-05-30 08:10:21.907042+00	2026-06-10 13:44:18.401287+00	f	{snacks}	[]
0ae03e54-0e0e-4d94-be49-0bc33c7b827b	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Fried kenyeji eggs	2pc	80	/uploads/products/images__6__1780577412366_936f41defdf3dc1a_products.webp	\N	t	2026-06-04 12:50:12.600582+00	2026-06-04 12:50:12.600582+00	f	{breakfast}	[]
e19c3958-222c-4e15-99e0-69c02e2f39c4	0f58437e-ad89-4844-b458-1b399bfa6bb0	Kuku Choma (Half)	Grilled chicken served with ugali/chips and kachumbari	250	https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80	/uploads/products/images__28__1780669869647_48450c4e87394c77_products.webp	t	2026-05-24 06:14:45.077573+00	2026-06-05 14:31:10.01979+00	f	{lunch}	[{"name": "1/4", "price": 250}]
c6328e57-4bcc-4d6c-9a29-95fb4beac41b	446ea926-e393-484d-b614-f4dba7a11d26	Chicken breast 	Fresh chicken cuts	700	/uploads/products/images__1__1780670569497_eb910e67965a3ed5_products.webp	\N	t	2026-06-05 14:42:49.797026+00	2026-06-05 14:42:49.797026+00	f	{}	[]
531ff5bd-43d2-4a77-8f19-50165621d4e1	446ea926-e393-484d-b614-f4dba7a11d26	Iiver	\N	400	/uploads/products/chicken_liver__1780671273403_ee810f33e2212ff0_products.webp	\N	t	2026-06-05 14:54:33.811911+00	2026-06-05 14:54:33.811911+00	f	{}	[]
03780aa1-e67f-4fab-ae0b-a26e28950765	446ea926-e393-484d-b614-f4dba7a11d26	Chicken Skins	Per kg	280	/uploads/products/product_1739873084_67b45b3c96765_1780671499126_8d54b280248d61c7_products.webp	\N	t	2026-06-05 14:58:19.306201+00	2026-06-05 14:58:19.306201+00	f	{raw}	[]
ff530f03-a5ab-4911-a09c-dda1cc204f2d	446ea926-e393-484d-b614-f4dba7a11d26	Danish hot dogs	Per pkt	460	/uploads/products/images__29__1780671695003_9c8a05819db742a9_products.webp	\N	t	2026-06-05 15:01:35.214356+00	2026-06-05 15:01:35.214356+00	f	{raw}	[]
fa8fc04b-9056-4b94-9721-ba7d64423170	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Minute maid 	Per pc	85	/uploads/products/images__20__1780671922209_3acf2946d40cdc09_products.webp	\N	t	2026-06-05 15:05:22.436379+00	2026-06-05 15:05:22.436379+00	f	{snacks}	[{"name": "400ml", "price": 85}, {"name": "1L", "price": 180}]
ee418f17-5d77-49cd-b314-7b3377cacfc7	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Predator 	Per pc	80	/uploads/products/predator-energy-drink-pet-400ml_1780672093332_b87fbd9b449a5ee4_products.webp	\N	t	2026-06-05 15:08:13.549648+00	2026-06-05 15:08:13.549648+00	f	{snacks}	[]
c32f76b3-ef4d-4727-8c61-9081584f328d	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Lemonade	Per pc	85	/uploads/products/images__21__1780672158370_9c7b7b0d9077dd34_products.webp	\N	t	2026-06-05 15:09:18.568347+00	2026-06-05 15:09:18.568347+00	f	{snacks}	[]
a41a5a2c-5bb6-477f-a13d-50855d9ef778	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Monster 	Per pc	250	/uploads/products/p1agtdoddevj4oxjd9cj__1__1780672280795_c82149ba2520d16b_products.webp	\N	t	2026-06-05 15:11:21.023359+00	2026-06-05 15:11:21.023359+00	f	{snacks}	[]
1a30e010-2902-48f5-9f74-e258c53c96a4	446ea926-e393-484d-b614-f4dba7a11d26	Eggs	Per tray	470	/uploads/products/images__3__1780916484609_f410a9bc7769fe62_products.webp	\N	t	2026-06-08 11:01:24.956033+00	2026-06-08 11:01:24.956033+00	f	{}	[]
e21feb17-f26d-4c4a-bef5-7c18d6478508	446ea926-e393-484d-b614-f4dba7a11d26	Chicken feet	Raw per kg	120	/uploads/products/679c4ae7-4155-42ca-afd9-85ba8e512e7e_1780916654400_6d42c611a8be3885_products.webp	\N	t	2026-06-08 11:04:14.788468+00	2026-06-08 11:04:14.788468+00	f	{snacks}	[]
afa92325-6c91-4d47-a494-e80d87602781	446ea926-e393-484d-b614-f4dba7a11d26	Chicken wings	Raw wings per kg	580	/uploads/products/images__2__1780917548108_09123418f28decd6_products.webp	\N	t	2026-06-08 11:19:08.421954+00	2026-06-08 11:19:08.421954+00	f	{butchery}	[]
8e32a168-6266-4f72-99e1-07407f73beff	446ea926-e393-484d-b614-f4dba7a11d26	Drumsticks 	Raw fresh chicken cuts per kg	700	/uploads/products/3983657977_1780917738075_4fc2244fdab25517_products.webp	\N	t	2026-06-08 11:22:18.671003+00	2026-06-08 11:22:18.671003+00	f	{}	[]
4e81eee5-5b14-479f-927f-7f1c7b522472	446ea926-e393-484d-b614-f4dba7a11d26	Chicken thighs	Per kg	600	/uploads/products/ChickenThigh__1__1780917911711_36122084c3cb1d04_products.webp	\N	t	2026-06-08 11:25:12.106396+00	2026-06-08 11:25:12.106396+00	f	{}	[]
7575434c-b3b1-4508-8a82-6c8123e95e11	446ea926-e393-484d-b614-f4dba7a11d26	Chicken necks	.	400	/uploads/products/images_1780918217152_ae222b1b302fb187_products.webp	\N	t	2026-06-08 11:30:17.389308+00	2026-06-08 11:30:17.389308+00	f	{}	[]
ecf86091-8cd8-4152-8537-c57714dad8b0	446ea926-e393-484d-b614-f4dba7a11d26	Boneless Chicken breast 	Per kg	700	/uploads/products/images__1__1780918397874_5d741116137895ef_products.webp	\N	t	2026-06-08 11:33:18.099861+00	2026-06-08 11:33:18.099861+00	f	{raw}	[]
8d8b41b7-2d6f-422f-96c0-762b6922be79	446ea926-e393-484d-b614-f4dba7a11d26	Broiler chicken 	.	580	/uploads/products/Wholesale-Frozen-Whole-Chicken-Top-Brazilian-High-_1780918801815_b1a6806f457b355e_products.webp	\N	t	2026-06-08 11:40:01.995831+00	2026-06-08 11:40:01.995831+00	f	{}	[]
2a989cc3-6ca9-41ae-9115-e69499fb4325	446ea926-e393-484d-b614-f4dba7a11d26	Raw smokies	Famers choice per 22pcs pkt	580	/uploads/products/images__4__1780918929698_ded6928f45a73133_products.webp	\N	t	2026-06-08 11:42:09.884061+00	2026-06-08 11:42:09.884061+00	f	{}	[]
dad43c1d-ac84-4828-8b43-2afe7d4c5a62	446ea926-e393-484d-b614-f4dba7a11d26	Gizzards	Fresh raw gizzarrds	600	/uploads/products/PR1328-067b72c1f209b6_1780919114279_a67d7489a763a970_products.webp	\N	t	2026-06-08 11:45:14.558356+00	2026-06-08 11:45:14.558356+00	f	{}	[]
748e1568-c3d6-456f-9a75-cc05fb26f6fc	25a06939-8193-4b47-bfb4-7e24552b2fbd	Ginger 	Per kg	200	/uploads/products/GINGER_1781002103703_fd840882cbd06d5c_products.webp	\N	t	2026-06-09 10:48:23.906968+00	2026-06-09 10:48:23.906968+00	f	{groceries}	[]
12ea4040-1ab9-47e0-b099-af5370f359af	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Samosa	Chicken filled samosa	50	/uploads/products/IMG_20240125_175513_822_1781004081824_40333fcac3620528_products.webp	\N	t	2026-06-09 11:21:22.210292+00	2026-06-09 11:21:22.210292+00	f	{snacks}	[]
82d120f3-3cc5-4df2-9d19-04e471d9efa2	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Fried chicken 	1/4 Crunchy deep fried chicken 	250	/uploads/products/3fb0c689-fb0c-415a-bfd1-460e014dbc11_1781098248831_eb42176564649a0e_products.webp	\N	t	2026-06-10 13:30:49.366222+00	2026-06-10 13:32:35.094368+00	f	{snacks}	[{"name": "1/2", "price": 500}, {"name": "3/4", "price": 750}, {"name": "Full", "price": 1000}]
2cdad5b0-2762-4453-8c11-18e616485500	0f58437e-ad89-4844-b458-1b399bfa6bb0	Chips	Fried crunchy fries	150	/uploads/products/food-1322797_1781098018591_e822551a8df3ad82_products.webp	\N	t	2026-06-10 13:26:59.190181+00	2026-06-10 13:35:15.753582+00	f	{snacks}	[{"name": "Jumbo", "price": 200}, {"name": "Maduo'ng", "price": 250}]
4d4b214d-dd77-48af-a34a-f5c1c68ee8d0	0f58437e-ad89-4844-b458-1b399bfa6bb0	Pilau 	Pilau served with wet fried drumstick and greens on the side	400	/uploads/products/df1f54fb-7258-4701-88d5-88285ef3e937_1781099519757_12c9a0dbc8b71ddf_products.webp	\N	t	2026-06-10 13:52:00.315901+00	2026-06-10 13:52:00.315901+00	f	{meals}	[]
4fbad4f9-ab40-4cdc-a317-de060c538ab2	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Kebabs 	Yummy chicken filled kebabs	80	/uploads/products/images__9__1781099769780_915dfe3a4757392b_products.webp	\N	t	2026-06-10 13:56:10.033989+00	2026-06-10 13:56:10.033989+00	f	{snacks}	[]
120222d8-1186-4b0e-9b1e-63eb144bf40e	3d4e748c-713b-43c4-beb0-df40fbb4a46f	Maru bhajia	.	150	/uploads/products/images__47__1779976045294_c3044e7d8ee0e02c_products.webp	\N	t	2026-05-28 13:47:25.544618+00	2026-06-10 13:57:40.501706+00	f	{snacks}	[{"name": "Jumbo", "price": 200}, {"name": "Maduo'ng", "price": 280}]
\.


--
-- Data for Name: mpesa_stk_callbacks; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.mpesa_stk_callbacks (id, stk_request_id, merchant_request_id, checkout_request_id, result_code, result_desc, mpesa_receipt_number, amount, phone, transaction_date, body, created_at) FROM stdin;
569a2ff3-0a34-406a-811c-5d036629b04e	f5376ac0-66ba-4643-85b6-6b096b4144de	dd71-416b-aa9f-3c6d4478c34e1063721	ws_CO_25052026163336483743574820	1032	Request Cancelled by user.	\N	\N	\N	\N	{"Body": {"stkCallback": {"ResultCode": 1032, "ResultDesc": "Request Cancelled by user.", "CheckoutRequestID": "ws_CO_25052026163336483743574820", "MerchantRequestID": "dd71-416b-aa9f-3c6d4478c34e1063721"}}}	2026-05-25 13:33:46.661381+00
825991b8-2d29-4229-918e-f7226c0c13fd	f966101b-6f5a-4cb1-96dc-30236c90cde0	5dbc-4521-9032-4e92309616244009	ws_CO_31052026213614575726233064	1037	DS timeout user cannot be reached.	\N	\N	\N	\N	{"Body": {"stkCallback": {"ResultCode": 1037, "ResultDesc": "DS timeout user cannot be reached.", "CheckoutRequestID": "ws_CO_31052026213614575726233064", "MerchantRequestID": "5dbc-4521-9032-4e92309616244009"}}}	2026-05-31 18:36:18.756347+00
c0e838af-6d26-416a-a7e0-276b18637a0d	088c542c-53b2-4b1c-9e51-74a33da728a7	6a50-4ca7-bca1-6f0ed3ae54b33124733	ws_CO_01062026193525968700134822	1	The balance is insufficient for the transaction.	\N	\N	\N	\N	{"Body": {"stkCallback": {"ResultCode": 1, "ResultDesc": "The balance is insufficient for the transaction.", "CheckoutRequestID": "ws_CO_01062026193525968700134822", "MerchantRequestID": "6a50-4ca7-bca1-6f0ed3ae54b33124733"}}}	2026-06-01 16:35:35.593331+00
36611043-1d57-4743-b27c-2b598c93dc3d	d05a4115-0ec9-4902-aba3-df135b39f8ec	8fc3-415b-ba79-04f852fc58507383726	ws_CO_01062026193556196724244112	0	The service request is processed successfully.	UF1E26WQJZ	450	254724244112	20260601193604	{"Body": {"stkCallback": {"ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 450}, {"Name": "MpesaReceiptNumber", "Value": "UF1E26WQJZ"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260601193604}, {"Name": "PhoneNumber", "Value": 254724244112}]}, "CheckoutRequestID": "ws_CO_01062026193556196724244112", "MerchantRequestID": "8fc3-415b-ba79-04f852fc58507383726"}}}	2026-06-01 16:36:05.540713+00
\.


--
-- Data for Name: mpesa_stk_requests; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.mpesa_stk_requests (id, order_id, merchant_request_id, checkout_request_id, response_code, response_description, amount, phone, account_reference, transaction_desc, status, provider_response, created_at, updated_at) FROM stdin;
f5376ac0-66ba-4643-85b6-6b096b4144de	\N	dd71-416b-aa9f-3c6d4478c34e1063721	ws_CO_25052026163336483743574820	0	Success. Request accepted for processing	500	254743574820	Order#a4238071	Order Payment	failed	{"callback": {"Body": {"stkCallback": {"ResultCode": 1032, "ResultDesc": "Request Cancelled by user.", "CheckoutRequestID": "ws_CO_25052026163336483743574820", "MerchantRequestID": "dd71-416b-aa9f-3c6d4478c34e1063721"}}}, "ResponseCode": "0", "CustomerMessage": "Success. Request accepted for processing", "CheckoutRequestID": "ws_CO_25052026163336483743574820", "MerchantRequestID": "dd71-416b-aa9f-3c6d4478c34e1063721", "ResponseDescription": "Success. Request accepted for processing"}	2026-05-25 13:33:36.669389+00	2026-05-25 13:33:46.66524+00
f966101b-6f5a-4cb1-96dc-30236c90cde0	\N	5dbc-4521-9032-4e92309616244009	ws_CO_31052026213614575726233064	0	Success. Request accepted for processing	750	254726233064	Order#82a17c80	Order Payment	failed	{"callback": {"Body": {"stkCallback": {"ResultCode": 1037, "ResultDesc": "DS timeout user cannot be reached.", "CheckoutRequestID": "ws_CO_31052026213614575726233064", "MerchantRequestID": "5dbc-4521-9032-4e92309616244009"}}}, "ResponseCode": "0", "CustomerMessage": "Success. Request accepted for processing", "CheckoutRequestID": "ws_CO_31052026213614575726233064", "MerchantRequestID": "5dbc-4521-9032-4e92309616244009", "ResponseDescription": "Success. Request accepted for processing"}	2026-05-31 18:36:15.57027+00	2026-05-31 18:36:18.760986+00
088c542c-53b2-4b1c-9e51-74a33da728a7	\N	6a50-4ca7-bca1-6f0ed3ae54b33124733	ws_CO_01062026193525968700134822	0	Success. Request accepted for processing	450	254700134822	Order#f916836c	Order Payment	failed	{"callback": {"Body": {"stkCallback": {"ResultCode": 1, "ResultDesc": "The balance is insufficient for the transaction.", "CheckoutRequestID": "ws_CO_01062026193525968700134822", "MerchantRequestID": "6a50-4ca7-bca1-6f0ed3ae54b33124733"}}}, "ResponseCode": "0", "CustomerMessage": "Success. Request accepted for processing", "CheckoutRequestID": "ws_CO_01062026193525968700134822", "MerchantRequestID": "6a50-4ca7-bca1-6f0ed3ae54b33124733", "ResponseDescription": "Success. Request accepted for processing"}	2026-06-01 16:35:26.789364+00	2026-06-01 16:35:35.623916+00
d05a4115-0ec9-4902-aba3-df135b39f8ec	\N	8fc3-415b-ba79-04f852fc58507383726	ws_CO_01062026193556196724244112	0	Success. Request accepted for processing	450	254724244112	Order#f916836c	Order Payment	success	{"callback": {"Body": {"stkCallback": {"ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 450}, {"Name": "MpesaReceiptNumber", "Value": "UF1E26WQJZ"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260601193604}, {"Name": "PhoneNumber", "Value": 254724244112}]}, "CheckoutRequestID": "ws_CO_01062026193556196724244112", "MerchantRequestID": "8fc3-415b-ba79-04f852fc58507383726"}}}, "ResponseCode": "0", "CustomerMessage": "Success. Request accepted for processing", "CheckoutRequestID": "ws_CO_01062026193556196724244112", "MerchantRequestID": "8fc3-415b-ba79-04f852fc58507383726", "ResponseDescription": "Success. Request accepted for processing"}	2026-06-01 16:35:56.985133+00	2026-06-01 16:36:05.547259+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, created_at) FROM stdin;
052e2328-3316-426a-9cb2-ff0e492cc7a6	d00eaf37-708e-498e-86df-cceb72f63cce	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Steven Mwangi! Explore our delicious menu and place your first order.	{}	f	2026-05-25 12:46:58.5872+00
39e4c4ee-53aa-44ec-9cbe-2c01ca31b69c	d00eaf37-708e-498e-86df-cceb72f63cce	order_confirmed	Order Placed! 🛒	Your order #F7DE6C has been placed successfully.	{"orderId": "a4238071-18bc-4b1b-ae78-431916f7de6c"}	f	2026-05-25 13:23:24.785765+00
28517736-7a04-4978-8d5e-7c0183a96fbf	d00eaf37-708e-498e-86df-cceb72f63cce	payment_failed	Payment Failed ❌	Your M-Pesa payment could not be processed. Please try again.	{"orderId": "a4238071-18bc-4b1b-ae78-431916f7de6c"}	f	2026-05-25 13:33:46.677843+00
f22c1bda-290d-43a9-bc6f-eea325162023	f8f912b5-4058-4d71-be3e-37b195048819	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Talia talia! Explore our delicious menu and place your first order.	{}	f	2026-05-27 18:40:18.031148+00
8de3cdba-f6a8-4773-9eb4-44159838911d	45a12625-8047-41ce-9299-834bc44607cf	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Smiley! Explore our delicious menu and place your first order.	{}	f	2026-05-29 16:08:13.730269+00
20c86b7e-323d-4a85-8d87-5137b3fc25b7	cd3aca4a-2b9b-49b2-ae17-ff29c36cfe20	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Wilkins otieno! Explore our delicious menu and place your first order.	{}	f	2026-05-31 18:14:19.504485+00
10dfe0b8-4a6b-446f-a552-eff864f89182	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Jay naph! Explore our delicious menu and place your first order.	{}	f	2026-05-31 18:33:55.98702+00
ce634ca6-7415-4fb9-9e66-81b2afc95857	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	order_confirmed	Order Placed! 🛒	Your order #A7F7AA has been placed successfully.	{"orderId": "82a17c80-101c-4f99-abae-db2661a7f7aa"}	t	2026-05-31 18:35:47.53309+00
5250cdb7-1ab2-4817-b568-b6b2d999786f	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	payment_failed	Payment Failed ❌	Your M-Pesa payment could not be processed. Please try again.	{"orderId": "82a17c80-101c-4f99-abae-db2661a7f7aa"}	f	2026-05-31 18:36:18.769603+00
9c6214e0-8587-454b-96d1-79073cc3b521	\N	payment_received	Payment Received ✅	Your M-Pesa payment of KES 450 has been received.	{"orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	f	2026-06-01 16:36:05.559341+00
d3d0c4bc-0903-4ae9-88b8-29e663aa3029	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	payment_received	Payment Received 💰	M-Pesa payment of KES 450 received for order #0E8066.	{"amount": 450, "orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	f	2026-06-01 16:36:05.585288+00
d9371895-e5a1-4b91-b40d-6c55bd2c4b99	51fd4b19-939b-49d2-a275-4a023696b79c	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, angelica mwelu! Explore our delicious menu and place your first order.	{}	t	2026-06-06 07:26:10.425817+00
1459febd-af59-44a1-b377-215c610f9ae0	d7747014-ee25-4dd3-b761-0eee1dc9cfd0	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Reuben ! Explore our delicious menu and place your first order.	{}	f	2026-06-08 17:21:42.640434+00
8689f261-1383-4f15-8e64-b3c6b701b7e7	79eb1215-a2a4-4db6-9683-aa962571d6b7	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Joseph Ngigi! Explore our delicious menu and place your first order.	{}	f	2026-06-08 18:13:23.451787+00
e5566528-c6cd-465d-9b70-6dbc019f0d56	63e19503-b374-4afb-92ab-c68891c50281	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Sharon ! Explore our delicious menu and place your first order.	{}	f	2026-06-09 10:36:54.294079+00
5d80f805-7363-45a4-b394-aa501e1bb67f	79226fbb-f103-4cc9-9722-070a53637a2d	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Mike! Explore our delicious menu and place your first order.	{}	f	2026-06-10 14:20:57.936552+00
6a0ea475-047d-428f-a05a-7352e7f3c848	00eb30ae-7662-42db-9c9b-fe8dadede7af	welcome	Welcome! 🎉	Welcome to Kuku ni Sisi, Flavian Akwala! Explore our delicious menu and place your first order.	{}	t	2026-06-01 16:34:35.536656+00
144c7d7c-c55a-4aac-a010-9cb6503bbc47	00eb30ae-7662-42db-9c9b-fe8dadede7af	order_confirmed	Order Placed! 🛒	Your order #0E8066 has been placed successfully.	{"orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	t	2026-06-01 16:34:59.413807+00
c72d6286-9553-4196-b90e-953fb7fc9197	00eb30ae-7662-42db-9c9b-fe8dadede7af	payment_failed	Payment Failed ❌	Your M-Pesa payment could not be processed. Please try again.	{"orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	t	2026-06-01 16:35:35.651702+00
f1daade5-309f-44ca-bac6-1fefe05fa911	00eb30ae-7662-42db-9c9b-fe8dadede7af	payment_received	Payment Received ✅	Your M-Pesa payment of KES 450 has been received.	{"orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	t	2026-06-01 16:36:05.566449+00
fb2162e7-3ace-44fe-8044-ad86573d52a4	00eb30ae-7662-42db-9c9b-fe8dadede7af	order_status	Order Update	Your order is being prepared	{"status": "preparing", "orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	f	2026-06-01 17:53:51.132524+00
87323d8e-e42e-4719-9796-9aeae2c838ce	00eb30ae-7662-42db-9c9b-fe8dadede7af	order_status	Order Update	Your order is on the way!	{"status": "on_the_way", "orderId": "f916836c-dde5-4533-a46e-8990f80e8066"}	f	2026-06-01 17:56:26.120421+00
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.order_items (id, order_id, menu_item_id, name, quantity, unit_price, total_price, notes, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.orders (id, customer_id, delivery_address_id, subtotal, delivery_fee, discount, total, notes, promotion_code, payment_method, status, created_at, updated_at, assigned_rider_id, payment_status, phone) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.refresh_tokens (token, user_id, expires_at, created_at) FROM stdin;
d39cd3b3ffea9b3ade929a7a32785fa96a0fe480fb04da754b42b862e628cca0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-01 08:28:19.709+00	2026-05-25 08:28:19.710634+00
0bbe21f8da7dae11b975a3950d48578483854e642f11e664b00be770ba4d1eb4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-01 08:30:03.844+00	2026-05-25 08:30:03.846922+00
c59b5c24889deec4d0257c280da354813e3428f87d320ac93dff70b562d21c81	cd3aca4a-2b9b-49b2-ae17-ff29c36cfe20	2026-06-07 18:14:19.476+00	2026-05-31 18:14:19.476849+00
ce086d518c69873507b28c307dfbcb4b48d4e4f30052bde2ba5acb482c1829f2	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	2026-06-07 18:33:55.976+00	2026-05-31 18:33:55.976549+00
4a1fbf4450618b5ea48052c676fca150aecb8e8816d16d6ccddee0cd869158fb	f8f912b5-4058-4d71-be3e-37b195048819	2026-06-03 18:40:17.933+00	2026-05-27 18:40:17.935327+00
0245dc3975c5045cdcd2d983367570e96110eb066056fb2d5d9c6cef3e83a986	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-04 05:28:35.105+00	2026-05-28 05:28:35.106203+00
03354165d92f4391ef97afe76fb500b40f1fee9fe3803dc742fe70964b1700dd	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-04 06:10:35.263+00	2026-05-28 06:10:35.264088+00
c1c5d448b2da61b5cd6aa50473688f04939a609e4aca2b05b7b412f2285b7ebd	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-04 06:10:35.263+00	2026-05-28 06:10:35.264216+00
5402603cc070b26c881b5f80f95a738d4e885888f304d65a83061bb2767f7769	51fd4b19-939b-49d2-a275-4a023696b79c	2026-06-13 07:26:10.363+00	2026-06-06 07:26:10.364391+00
05d93e950071dbfcef4580762bfd32e7b5a098c68b0f321099628f3db28d61b4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-15 11:37:44.679+00	2026-06-08 11:37:44.679455+00
98ba45ab5610e050b311ec70003ac66fd0f97f07ac38aa57ac0fbb0d43c1bb3f	d7747014-ee25-4dd3-b761-0eee1dc9cfd0	2026-06-15 17:21:42.574+00	2026-06-08 17:21:42.575098+00
1f8f716e6e5c98e9c29f9b50e38f4e610d7ef214ee4e346c86fd4951a82a756b	63e19503-b374-4afb-92ab-c68891c50281	2026-06-16 10:36:54.272+00	2026-06-09 10:36:54.273418+00
1bbde3e469589ca3bcb4d0d4d944c4f72a177d9ecc403bd45f938a6aa7de1801	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-17 13:52:23.093+00	2026-06-10 13:52:23.093827+00
edb30f7f0e6b3e6d8fa9f1eb6dc1955329ad876ed0b8b91157cba24bdfd9e1a4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-17 14:24:31.348+00	2026-06-10 14:24:31.348774+00
56f911e77b19d14d467f70a189b22603f75526484ecd2fe6df8a9e5ef2b52713	45a12625-8047-41ce-9299-834bc44607cf	2026-06-05 16:08:13.675+00	2026-05-29 16:08:13.676101+00
d3c9f2569edae43fedb2a4c4558b080e5afe60a0ee4acb97849cfc7b772e21e1	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	2026-06-17 15:42:07.914+00	2026-06-10 15:42:07.914651+00
\.


--
-- Data for Name: refresh_tokens_audit; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.refresh_tokens_audit (id, token, user_id, action, ip, user_agent, created_at) FROM stdin;
8cdc0b4b-1267-498f-b5a9-879266a569cc	d39cd3b3ffea9b3ade929a7a32785fa96a0fe480fb04da754b42b862e628cca0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	172.18.0.4	curl/8.5.0	2026-05-25 08:28:19.731009+00
cf459523-6df2-4d5b-81c9-a47713a2c4eb	0bbe21f8da7dae11b975a3950d48578483854e642f11e664b00be770ba4d1eb4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	172.18.0.4	curl/8.5.0	2026-05-25 08:30:03.86201+00
40334cb9-1b55-4dbc-97aa-f98d4425e29c	0db6455c3096525cdf3d4ef3e9e6f21108bba418d3422ed7dd907ef3e19bdf8a	d00eaf37-708e-498e-86df-cceb72f63cce	create	129.222.147.136	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-25 12:46:58.586144+00
4824d06b-60b2-4832-94cc-623351491367	3f792b4e733662f779c2905eefcaf818fb5838f946ad2e5381a1731c966fef20	\N	revoke	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 12:55:02.790906+00
c7ff6d1f-6715-4940-b94d-a4b2f13480ce	6b623c0da1393f3232dd6091d11645627e86c56a1a2c9bbf530b422a03a2615d	d00eaf37-708e-498e-86df-cceb72f63cce	create	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 12:55:20.086391+00
d51517cd-9be9-41db-8add-e162f63e71e2	6b623c0da1393f3232dd6091d11645627e86c56a1a2c9bbf530b422a03a2615d	\N	revoke	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 12:56:47.945484+00
66df9bbc-c433-4ff6-9f3e-168dd0d6954a	56d51ae268480a0d78abcd3ed1c9dcab391b3c78f455ddb7db76ee768f412ab6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 12:57:15.655919+00
19ec8026-2575-43b2-9c67-1e1be7f87569	ad1e95ca9574eeb0e734851f18794fa1c8a96eadaed3ca8ab5ed2095dd89cff3	d00eaf37-708e-498e-86df-cceb72f63cce	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:02:40.213582+00
5ff9805a-9bed-4ece-8a2c-18d2619bc1d8	0db6455c3096525cdf3d4ef3e9e6f21108bba418d3422ed7dd907ef3e19bdf8a	d00eaf37-708e-498e-86df-cceb72f63cce	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:02:40.213193+00
fb002d8d-5619-4052-b6e3-1275e3f5bac3	ad1e95ca9574eeb0e734851f18794fa1c8a96eadaed3ca8ab5ed2095dd89cff3	\N	revoke	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:16:23.650979+00
ae41f82b-65f1-4fff-be2b-35e4fb8bd000	6d0617bc1909237c672f5af9bb22381282278232cffd85210f6db130ac471807	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:16:44.149169+00
3a1a443d-c70c-49f8-a0f3-44e898cc4c4e	56d51ae268480a0d78abcd3ed1c9dcab391b3c78f455ddb7db76ee768f412ab6	\N	revoke	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 13:17:45.202616+00
17bf75ee-07c7-4291-9749-bb9de2e6eaa1	a8901117b0ce8cd8f5085908357fdab580336b341038617fcee8c78f6bd8ef75	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 13:17:55.314831+00
6af5e38b-f539-44df-94fe-ac98eae2dcd5	a8901117b0ce8cd8f5085908357fdab580336b341038617fcee8c78f6bd8ef75	\N	revoke	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 13:22:48.286674+00
dc62f6fd-91c3-4887-b4d5-7da479f2c230	38c1cf5c6a47bca473d6174351ecbffcd48a5a6021fb1f256a2e86bb8598704d	d00eaf37-708e-498e-86df-cceb72f63cce	create	129.222.147.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-25 13:22:52.767798+00
fdd9279a-69a4-4e3a-b78f-195553474eb0	6d0617bc1909237c672f5af9bb22381282278232cffd85210f6db130ac471807	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:31:53.566248+00
44397f9e-144f-45e3-9492-2a72e4438c2d	d623b7a7d017e0905ca81cb07d125c2b15b59f64340e0ea64a8596bfcb5a16ff	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:31:53.626566+00
ef5e0c6d-1dcb-43bc-a3de-183cadccc6ea	d623b7a7d017e0905ca81cb07d125c2b15b59f64340e0ea64a8596bfcb5a16ff	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:47:40.45433+00
50ed4cde-8c49-4ace-93fd-d1f5e06d7e7e	9ff721a6a00c86a3db6349d43a574327c9b4cca352f8fd99ae5ad98d8897ef67	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 13:47:40.454134+00
c986efb5-aab3-4025-82e0-042691a4d4f0	9ff721a6a00c86a3db6349d43a574327c9b4cca352f8fd99ae5ad98d8897ef67	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:02:40.435776+00
d4011ff7-bdeb-438b-b1c4-201ea235a930	a9bf063fff3527e470557afcd6051001239d1140fae43da958021f5d7560679b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:02:40.435968+00
a065e687-5b28-4b1b-b166-8a48d22d9d77	a9bf063fff3527e470557afcd6051001239d1140fae43da958021f5d7560679b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:17:40.468768+00
a6f54e95-b1ab-427b-9492-46bb1f1f2dd3	ffee279c05d3ea159142ac68e51458cd8b4f3ab372012cdf1a194bb3926ce339	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:17:40.468407+00
28e7926e-27c5-4ba9-a8cb-a3ca870c44ba	ffee279c05d3ea159142ac68e51458cd8b4f3ab372012cdf1a194bb3926ce339	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:32:40.480661+00
25899288-ccac-4e51-8612-7997747f8503	8d9dcb0280e1fd120d7816fd2526f6050ec1d6182772aaf7c421797ee4551109	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:32:40.481004+00
862c0e17-fea7-4df5-83a2-1eed658fde81	8d9dcb0280e1fd120d7816fd2526f6050ec1d6182772aaf7c421797ee4551109	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:47:40.411652+00
f5c67ed8-c3a0-4680-a0fd-2c798e69edf4	0484830c89615773860858c20df533508b108274493a1562d648b06559ea4ca0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 14:47:40.412152+00
eb2bcad4-fe75-41e5-9de0-dcc0d00f2939	0484830c89615773860858c20df533508b108274493a1562d648b06559ea4ca0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 20:02:52.907124+00
bfcebaa9-a8db-4b50-8016-61a2bc04f7b4	c2a6d8813c95f7b8b83389e31572bf32bae8e512d4fbe873613f18993c7e6232	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 20:02:52.908133+00
cfc8f90b-1b5a-4d37-884a-7f93a6ae0b61	c2a6d8813c95f7b8b83389e31572bf32bae8e512d4fbe873613f18993c7e6232	\N	revoke	129.222.147.136	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-25 20:18:52.026506+00
ca36b6ee-12df-4417-b71d-2ff92c91b1e7	5d4f8ff4ceaac0979335b691cd1d7243283640d15eeab998d7657df863a7dac3	\N	revoke	154.159.237.135	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-05-27 06:40:56.400993+00
758e850f-2b93-4049-860a-91132e8a0c9c	4a1fbf4450618b5ea48052c676fca150aecb8e8816d16d6ccddee0cd869158fb	f8f912b5-4058-4d71-be3e-37b195048819	create	105.164.94.202	Mozilla/5.0 (Linux; Android 13; TECNO KJ5 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/148.0.7778.120 Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/505.0.0.8.102;FBCX/modulariab;]	2026-05-27 18:40:18.029624+00
c0cebe55-bbf2-4813-86bb-799daaf0402c	9061c6b353c9f86d6ab28f3b42b5ff3fbb7cea7ce9a33c73ff730b8065ce40e2	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 05:13:00.219268+00
0b578789-b447-46f0-8e6e-e806f2edd586	0245dc3975c5045cdcd2d983367570e96110eb066056fb2d5d9c6cef3e83a986	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 05:28:35.126017+00
98cc63db-c3ca-48a8-b353-82a341c53ccc	814dccfe7114e8792f7cf22eb51dad97cc07f799eed39a553ce5ce8bed4aeceb	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 05:55:28.890484+00
271522d4-ca12-4240-a516-d59435383005	9061c6b353c9f86d6ab28f3b42b5ff3fbb7cea7ce9a33c73ff730b8065ce40e2	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 05:28:35.125895+00
dc91bbac-5380-4f53-acdb-db2b3dec213e	814dccfe7114e8792f7cf22eb51dad97cc07f799eed39a553ce5ce8bed4aeceb	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 06:10:35.27813+00
da5072ec-42c7-44f1-afe5-16954e1ef8da	814dccfe7114e8792f7cf22eb51dad97cc07f799eed39a553ce5ce8bed4aeceb	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 06:10:35.288243+00
b63c5670-5b35-4e6b-819f-831d9bc64b9b	c1c5d448b2da61b5cd6aa50473688f04939a609e4aca2b05b7b412f2285b7ebd	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 06:10:35.288594+00
fe547b7e-4b49-4f1e-b17c-5578be2ff85c	03354165d92f4391ef97afe76fb500b40f1fee9fe3803dc742fe70964b1700dd	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 06:10:35.307659+00
6e1a0d63-76d6-4625-adc0-f6106870fcb5	9da63603c0162c78274117ce50937276b20375140a11d4986665d182b15c5db3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 11:48:03.68182+00
a48742cf-f6da-47b2-aa1b-0e60955daffc	97f4be495e552b65995e5417de8240480876028847405cfd37716f02f87f13eb	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 11:48:05.241115+00
78330f0f-4d62-45d1-baa6-051cc3628bee	9da63603c0162c78274117ce50937276b20375140a11d4986665d182b15c5db3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:03:04.271914+00
2146d840-dbc1-40e3-8f4b-6162519104c3	c818c4c6f52c83d2d3fc3ab76215af03d2709f2ba6ae10694698072a501c0861	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:03:04.272343+00
c194bf82-d1b6-4ae4-a6f5-1033e4ffff09	04267ffcf649aaf92d18dcc9beb45c5b9ee013a19e594468ee4a917ac75ccf89	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:03:15.360816+00
41f9e0b8-40dd-4b7c-9476-c1301687a44f	97f4be495e552b65995e5417de8240480876028847405cfd37716f02f87f13eb	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:03:15.360424+00
624f423d-a6f8-4496-a46a-79e13bc438ec	c818c4c6f52c83d2d3fc3ab76215af03d2709f2ba6ae10694698072a501c0861	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:18:04.548846+00
297cd82a-0ee4-48ae-885c-e74600d65f7d	984443e9efbff3bc2aeed3af298d6f782ea16df52b8c6685f088e0ccdbfd932d	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:18:04.54939+00
b8d596ff-cd89-4d8d-b7a1-4af45785addb	a5b3e7950de08875841e39b07b7a9a8e878bfb1a6e9c5a6293cbcfd355a3c148	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:18:29.880931+00
b6f0b5ad-2bab-4c68-aeec-9fdd4a2ae0c6	04267ffcf649aaf92d18dcc9beb45c5b9ee013a19e594468ee4a917ac75ccf89	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:18:29.880963+00
d0ecf81b-0da9-406a-976b-d74634fc9b62	984443e9efbff3bc2aeed3af298d6f782ea16df52b8c6685f088e0ccdbfd932d	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:33:04.499039+00
1dedf2b0-23a1-4ebf-bc9f-8871e5d8ffbe	a897e6e1b48ec3ff11f1813a5b9f1d95d0a19866b7f6db7ce39cac49b38fc897	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:33:04.501979+00
ef8e169d-6ab6-47d1-b86c-1c40f1d35d00	a5b3e7950de08875841e39b07b7a9a8e878bfb1a6e9c5a6293cbcfd355a3c148	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:34:19.844597+00
53bb8b74-581d-4dfd-b67e-fca05a89af6c	e31ca2cda5799669b073471b55b9e3f2464cbad2923805b72aabebcb0285329e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:34:19.84589+00
d312feae-111c-4ba2-b34a-b6a0b5850474	a897e6e1b48ec3ff11f1813a5b9f1d95d0a19866b7f6db7ce39cac49b38fc897	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:48:30.620619+00
2e8d28eb-ebf6-4c5c-9fca-43b0e00e956c	0827e415d8804befa629a5b99d22baa2b0e7086449033f4d89d27337818c4f73	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:48:30.620688+00
1fe86602-c1ec-44b1-9602-842ba75ebf80	e31ca2cda5799669b073471b55b9e3f2464cbad2923805b72aabebcb0285329e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:49:34.851442+00
a694f80c-a29a-4e0e-ae73-88eddf484419	9af632d8ce437beb86460a2bb9e4052ef5351dc865795708f37bd8cad6673994	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 12:49:34.851797+00
7f9e6e3a-56ac-4f73-965e-1c372a27404c	0827e415d8804befa629a5b99d22baa2b0e7086449033f4d89d27337818c4f73	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:03:30.627972+00
e1363641-1a5c-46d5-97bb-08a80286a4af	d60ac19ef1119eb064ee620e3801fd58bca76dbb826e8d1619c59471e1b0ee2c	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:03:30.62782+00
e0b58483-6029-49f6-9066-677311b733fc	9af632d8ce437beb86460a2bb9e4052ef5351dc865795708f37bd8cad6673994	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:04:48.836535+00
8116d8f8-e81d-4542-8bf9-729c9058b427	0ac02f596214276e1135375346b29e11dc0991de40aec7fc67c8c53de2dd3218	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:04:48.837088+00
3a644a73-f1f9-4aa1-831c-37b043c39b35	d60ac19ef1119eb064ee620e3801fd58bca76dbb826e8d1619c59471e1b0ee2c	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:18:30.576578+00
b58aa65d-f125-41eb-b177-9389b2c82363	6fead5049c2066d526ff04b0fb839f86c7c61be92cc4a7912a5832dc1f78a6f4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:18:30.576074+00
2e45513c-5400-4375-b8ff-5c5cc04301ae	0ac02f596214276e1135375346b29e11dc0991de40aec7fc67c8c53de2dd3218	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:19:48.95703+00
52293549-7977-44f4-b492-5f76a85c5884	9bc8dd0c1f4f35d6b5891a4ec78ea5ae789a2585a89d5f3d0797000d94350c5e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:19:48.957097+00
44f77660-ad11-4004-a13d-d3f788fdc4df	6fead5049c2066d526ff04b0fb839f86c7c61be92cc4a7912a5832dc1f78a6f4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:33:30.786308+00
f5cb4264-5f7a-4b9e-81b3-5fe66030f780	cc6054832cd320c6bff7b84f0562e7f1270734826a975304425a5645bea884c9	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:34:48.933335+00
49445e77-78cc-4a8f-8d46-c6f873d4765f	cc6054832cd320c6bff7b84f0562e7f1270734826a975304425a5645bea884c9	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:49:49.715291+00
7e9e9137-c4ca-43f0-a624-821d0376c5fc	5d315d1d3abf1c31c005a4c96b6121e6b092d85091aa179c680f54c404c5984e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:05:48.905049+00
7779a791-9309-434d-a74e-b9c5d725902e	5d315d1d3abf1c31c005a4c96b6121e6b092d85091aa179c680f54c404c5984e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:20:48.906134+00
7de9b2c6-0631-44b6-8741-fee365e88b2b	27627bbbcf947f358b4e0c2dc891d0240222c0bb26670bb748c7bdffa49b19b3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:35:48.871623+00
9a1594d3-27ae-4c1b-b65c-c656feb59925	27627bbbcf947f358b4e0c2dc891d0240222c0bb26670bb748c7bdffa49b19b3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:51:05.266565+00
6f81f687-bda3-44ba-bcf0-3a683b1a5843	3c43840d6de4c5af4162b41066a4f8a91a2b0d744e0fe67612ba2aa95ab7e501	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:06:05.33021+00
eb11a578-f3ad-4cb1-b17f-4a5927e893af	3c43840d6de4c5af4162b41066a4f8a91a2b0d744e0fe67612ba2aa95ab7e501	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:21:05.766329+00
e88f9ccf-6ddf-4d2c-8f89-dd836f4441ea	73c9d8fedb3f6b1de61867a68a4fbe08c351b5f23f06d638cc6ebc7fde9faa3b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:36:05.277006+00
67797ca1-7255-420c-9bee-85d56bac4df2	73c9d8fedb3f6b1de61867a68a4fbe08c351b5f23f06d638cc6ebc7fde9faa3b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:51:05.286874+00
49498075-4f24-45ea-b00e-564428e8a5cc	4254d67dd9b174e0a0919a4aa2126559f99065e2f72dc37774490106fd224f79	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:06:05.257032+00
92bf2ed3-c976-4ff3-a892-3de82155ea28	4254d67dd9b174e0a0919a4aa2126559f99065e2f72dc37774490106fd224f79	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:21:05.331506+00
e6f29542-4e81-4681-afc2-a093ac60bd47	323e33642ca75de05ae4c0a2d3de48a40f651095e5c5bc7dd110d1bcc6aa0928	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:36:05.29454+00
7766b60f-3ecc-445a-b7a3-5f389f308938	323e33642ca75de05ae4c0a2d3de48a40f651095e5c5bc7dd110d1bcc6aa0928	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:51:05.486331+00
54d245b3-b855-474b-9fe1-33cc501c0b67	97247c65a360c303e4a607e8859273bf341be7a1584014155ad1c1d2c181341a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 17:06:05.299072+00
d241956a-10b9-4e7b-ba65-643f6d6b20aa	97247c65a360c303e4a607e8859273bf341be7a1584014155ad1c1d2c181341a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 17:21:10.448307+00
716e2ef2-9ac2-45c9-9002-5a39c54c4452	b8d87cd43d8ad676bf85f8b3a33f51d404a68e11b656fd861eacd065efcc6757	\N	revoke	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 17:36:52.785807+00
44a78d65-7f15-4c33-b707-25f2651f81f2	56f911e77b19d14d467f70a189b22603f75526484ecd2fe6df8a9e5ef2b52713	45a12625-8047-41ce-9299-834bc44607cf	create	197.232.165.65	Mozilla/5.0 (Linux; Android 11; 220333QAG Build/RKQ1.211001.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/148.0.7778.175 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/562.0.0.51.73;IABMV/1;]	2026-05-29 16:08:13.729792+00
a8162070-3fcf-4ad5-a8ac-ae801d523ab2	2552e5766a78f11f920823fd3f05380a72cce1b438288bfd8bfe02263fa203cc	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 07:53:55.719604+00
990c3b81-a759-4272-8a08-a8fc4cb35323	2552e5766a78f11f920823fd3f05380a72cce1b438288bfd8bfe02263fa203cc	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:08:55.845434+00
13c5f0f9-2bd8-4590-b230-ee423b72b6b3	07c667535eb73725a0585e4abd4b6f251611945bdb40a504d1c83087acb0d4cf	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.188	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:33:30.787039+00
3f4f0eef-1a1a-4239-b50d-9fd95132b919	9bc8dd0c1f4f35d6b5891a4ec78ea5ae789a2585a89d5f3d0797000d94350c5e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:34:48.933027+00
320b288d-aeb9-46fa-b58c-3a20a26dc85c	ebc5de5790bab4625ef72abed035e865a4eabf82d38dfa7e47ed097d2f7cf0e0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 13:49:49.714208+00
d1120f36-2212-4b3d-ad7f-1348acbebe3e	ebc5de5790bab4625ef72abed035e865a4eabf82d38dfa7e47ed097d2f7cf0e0	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:05:48.904759+00
be1b91bf-a7c0-42cc-b702-d49a93f04caf	d60ad9df2714edcee12ebd1dd4efefe59530cedaea493e2d7e753e07c11bcdc6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:20:48.906992+00
5d25c7d7-827a-4ae6-a86a-8fa920bae36f	d60ad9df2714edcee12ebd1dd4efefe59530cedaea493e2d7e753e07c11bcdc6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:35:48.871025+00
f3a396f7-a471-40bf-8186-7a5ac69623be	b8a214376108db1bcf8becd5f453bee14549aaa39483cc2ec4ab062420020d5e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 14:51:05.268207+00
cb71d57b-3422-45ed-954b-58f64f053499	b8a214376108db1bcf8becd5f453bee14549aaa39483cc2ec4ab062420020d5e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:06:05.329614+00
1e30874a-1c20-46a6-8b9f-b4488f207314	2ad26d5e531c60189675627e8588f61695945559a6e12db4ede78ccdb1594818	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:21:05.766434+00
694cc10a-cc1d-46fa-8e89-f1efc4d89ca4	2ad26d5e531c60189675627e8588f61695945559a6e12db4ede78ccdb1594818	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:36:05.277076+00
23add687-2369-41af-926a-ede762f72ef2	bf679a7567055c664652d412243ce3d7bbcc1ba65524241386dd2fcf97a8d879	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 15:51:05.287336+00
df3ffff4-f5fa-4dee-8566-2ed2d2fcb22f	bf679a7567055c664652d412243ce3d7bbcc1ba65524241386dd2fcf97a8d879	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:06:05.25657+00
a207b356-fd63-48c8-9737-d9f077012a96	db24f860b67d63c40979475712d722c8dcc274f34193ebc6f42e113907c4ec02	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:21:05.333718+00
845189c5-2168-4e85-9259-2e3b2b27bd88	db24f860b67d63c40979475712d722c8dcc274f34193ebc6f42e113907c4ec02	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:36:05.294115+00
a545b31e-d198-4fb9-b611-17b4ba3e02be	20c2a7794cc33ce30c9c5e40be131287f20b322c63ca632aeea98ed969d4d49b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 16:51:05.48686+00
007f24a6-ddb1-4356-b954-a4fa8ee26716	20c2a7794cc33ce30c9c5e40be131287f20b322c63ca632aeea98ed969d4d49b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 17:06:05.298325+00
674334c1-1272-450c-a78e-352c7444556c	b8d87cd43d8ad676bf85f8b3a33f51d404a68e11b656fd861eacd065efcc6757	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-28 17:21:10.44966+00
918707f2-b759-40c2-9907-19c854f5dcb5	07c667535eb73725a0585e4abd4b6f251611945bdb40a504d1c83087acb0d4cf	\N	revoke	154.159.237.11	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 03:15:11.96502+00
be6f3c55-abd8-4ccb-ae2b-ffbab8307255	79ae5aa81d6c961e4015468d6f84786de7b2332c16343e952ceca80abe4bd30a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 07:38:55.08815+00
0df503d2-6d05-48c3-9dbe-a566e4698df8	79ae5aa81d6c961e4015468d6f84786de7b2332c16343e952ceca80abe4bd30a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 07:53:55.719312+00
e5825196-6ac8-48bc-8e1b-d1ae2dd46bed	d482b2d3e7cc7973eb2c2d57322fd07f1b248f85509a25ed7b862b98b46a5d20	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:08:55.846348+00
609e8117-0e99-4293-a1b0-7fb04b38bb80	d482b2d3e7cc7973eb2c2d57322fd07f1b248f85509a25ed7b862b98b46a5d20	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:23:55.734398+00
ac334150-a6b2-455d-8623-8a4a4a80768d	2e25787972744e266f4c84e030d99a810c51ccd0aee08f1510061e550fc1741d	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:23:55.734593+00
db3b0c8a-7335-439f-bcb8-0551f63bc04b	2e25787972744e266f4c84e030d99a810c51ccd0aee08f1510061e550fc1741d	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:38:55.811602+00
63150609-6cca-41a6-975a-ff6a67ce8f13	9645d99a58dc44da9e0487ab5d37f2575dde9f206a56c05f95426cf0e337eb9a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:38:55.812244+00
eef28eec-9d42-4649-a6de-b08e908d5ee4	9645d99a58dc44da9e0487ab5d37f2575dde9f206a56c05f95426cf0e337eb9a	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:53:56.313494+00
38b046f5-4315-4417-9cab-82a2803cff68	1e6fcdb404c6409bcc18bb658c902d445025a0ac9bcba0a89548ffae0e1b191f	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 08:53:56.315321+00
c9d3bf73-b39a-43ca-983c-81341fa5fd62	3b0dcaf3c881986ee0053e2f4b606da762a0a28e3ad5cfbc8004a2c2408ee7bf	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 09:09:57.501571+00
f38062a5-f81c-4c6a-a508-a818c8d0e6e7	1e6fcdb404c6409bcc18bb658c902d445025a0ac9bcba0a89548ffae0e1b191f	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 09:09:57.500538+00
eb2b4201-488b-4fb3-9f21-78225a2543bc	3b0dcaf3c881986ee0053e2f4b606da762a0a28e3ad5cfbc8004a2c2408ee7bf	\N	revoke	129.222.147.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-30 09:25:42.049185+00
58d90208-1d62-4353-834f-e5290af24a86	38c1cf5c6a47bca473d6174351ecbffcd48a5a6021fb1f256a2e86bb8598704d	\N	revoke	129.222.147.63	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-30 19:19:29.694312+00
b8efc867-60af-4756-b786-1dd31ca0717d	837eec210457681b91890e280b02f0d50c3007610f3b4c7c13d58bf848532eb3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.147.63	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-30 19:19:47.018332+00
5638c8ac-77e9-4efc-9dfe-5e5cbc2c93df	c59b5c24889deec4d0257c280da354813e3428f87d320ac93dff70b562d21c81	cd3aca4a-2b9b-49b2-ae17-ff29c36cfe20	create	154.159.238.106	Mozilla/5.0 (Linux; Android 11; RMX3231 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/514.0.0.5.104;FBCX/modulariab;]	2026-05-31 18:14:19.504092+00
661f9a61-f00e-4148-b539-3148b1e5269e	837eec210457681b91890e280b02f0d50c3007610f3b4c7c13d58bf848532eb3	\N	revoke	129.222.147.63	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-05-30 19:54:38.974666+00
56ad3135-9403-435a-a717-664bdf4cf3e9	ce086d518c69873507b28c307dfbcb4b48d4e4f30052bde2ba5acb482c1829f2	3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	create	102.166.131.149	Mozilla/5.0 (Linux; Android 13; TECNO KI7 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/148.0.7778.120 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/473.0.0.9.107;FBCX/modulariab;]	2026-05-31 18:33:55.987057+00
2fb4c288-428a-426c-890a-0456dd81015a	287690d2b8ea5ebebd4eb515620a1ba72d1a6a936a599705ea30440461d4ccf4	00eb30ae-7662-42db-9c9b-fe8dadede7af	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 16:34:35.536075+00
337b7ef6-6795-4cc7-a725-683fad548f18	287690d2b8ea5ebebd4eb515620a1ba72d1a6a936a599705ea30440461d4ccf4	\N	revoke	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:11:42.622958+00
27846d7d-f580-4ed7-b7c3-56d91fe90c35	5857c34266e5835dba74697a197a6aa77be4fb9ca3217a54c9f83bb31c2616f5	00eb30ae-7662-42db-9c9b-fe8dadede7af	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:11:44.777544+00
6ce8a27b-263f-4350-97f3-3fb8925529dd	5857c34266e5835dba74697a197a6aa77be4fb9ca3217a54c9f83bb31c2616f5	\N	revoke	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:31:59.716703+00
a76d953c-1ac1-44f6-b512-2ab9facae21e	120314e843e12d4091ba4ec5447026b76db156dd0fdf11e9751b8a6b26166e8d	00eb30ae-7662-42db-9c9b-fe8dadede7af	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:32:02.175351+00
42d3d165-4432-432f-8202-36f1051224ee	120314e843e12d4091ba4ec5447026b76db156dd0fdf11e9751b8a6b26166e8d	\N	revoke	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:48:12.720887+00
8f0ecbde-4d30-4f80-a804-2c08998976ef	3e2ebb2a237e53300df48aa227619af42f10e4dcebc0726c35630efd35e60083	00eb30ae-7662-42db-9c9b-fe8dadede7af	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-01 17:48:15.241552+00
d34a4338-401f-4faa-9254-5d4d0984d973	57351e3bc56bddb19e753ab41401d522300bf9c6063a8684382ba8769bc81406	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.252.236	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-01 17:51:10.837538+00
7052b70f-3bca-48af-bff2-57f081bb7948	57351e3bc56bddb19e753ab41401d522300bf9c6063a8684382ba8769bc81406	\N	revoke	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-02 06:57:12.113276+00
61812e4c-e66e-41ec-a710-52f6a6da732b	3e2ebb2a237e53300df48aa227619af42f10e4dcebc0726c35630efd35e60083	\N	revoke	105.164.84.238	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-02 17:06:15.748641+00
d0e3ba9b-5287-4dea-aa61-681f608c1420	f588289f82457ff420014f93d74858f696d5e586cce67e4d50579320439dc625	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:00:37.83193+00
e0818dc2-0d23-4eb3-bb67-b912a3a4eb03	6ec631c474425956027cff9f0da3b43c5eeffc0ae37757a86fe097736a294d8c	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:16:35.714518+00
1f1b8e7b-c5fd-40e5-9a37-22a9d84c683f	f588289f82457ff420014f93d74858f696d5e586cce67e4d50579320439dc625	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:16:35.713941+00
ad7fdd6d-aed2-4a72-92b9-b7ded17921cb	6ec631c474425956027cff9f0da3b43c5eeffc0ae37757a86fe097736a294d8c	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:31:36.206513+00
2e5c23c5-e542-45fe-9dc4-bafffbfca39e	7d359706d328a926c74dcef367227a5f4d247f24a8f6c712ac833de2b1390b56	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:31:36.207485+00
21e57536-5478-4c4d-bc73-4bc57603e088	7d359706d328a926c74dcef367227a5f4d247f24a8f6c712ac833de2b1390b56	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:46:49.065763+00
3d36d5b8-3fda-48ea-b2a9-577fcace0530	b42600a2ba21fab9e4e1c97c4a624b9b73e0dcd6eb22a77589b48d007d4090db	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.42	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-04 12:46:49.069598+00
c5ba42e1-481e-4e0f-86fb-d341dac50858	b42600a2ba21fab9e4e1c97c4a624b9b73e0dcd6eb22a77589b48d007d4090db	\N	revoke	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:25:57.103114+00
79392d3e-5929-4d2e-bad0-64643ba2cd7a	471c283e99b132578990fa0813dd82c6f26cb3ce05fda62d734f18a9dea8ed22	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:26:03.732945+00
f1cce8f9-eab7-4370-9c33-92e0c51423cc	471c283e99b132578990fa0813dd82c6f26cb3ce05fda62d734f18a9dea8ed22	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:41:04.636468+00
347797b5-160f-4fcd-9ba2-bca80bc147cc	5393821baba1af8b24e0108be225399ccdfb4d0cf3a997fb227fce95d2bb0586	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:41:04.636697+00
ca18320e-1f42-4567-9de1-886c3c6a6f21	5393821baba1af8b24e0108be225399ccdfb4d0cf3a997fb227fce95d2bb0586	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:56:06.215797+00
740f73bb-5919-4a2b-a4c4-2d2114719fbd	31732479f040f7793f5b7e785be83f73683feb51e9555d9e86aaa309ec4a1dae	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 14:56:06.216355+00
6f68a8b3-5bb6-4070-be35-15d1a8e287c2	31732479f040f7793f5b7e785be83f73683feb51e9555d9e86aaa309ec4a1dae	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 15:11:20.406889+00
b7c3f23f-3897-4501-bbdb-e6f546d6fb21	ccc8e42a4b55f00cf1ce43e1c5604731dc81be720d1d168f645f8d01c0a133a6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.72	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 15:11:20.413357+00
3c1bca8d-1cea-437f-9f0c-beb4ebd0c378	ccc8e42a4b55f00cf1ce43e1c5604731dc81be720d1d168f645f8d01c0a133a6	\N	revoke	102.0.25.70	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 16:33:13.028548+00
574b7270-45c5-481e-8957-13e57c32cfd6	5402603cc070b26c881b5f80f95a738d4e885888f304d65a83061bb2767f7769	51fd4b19-939b-49d2-a275-4a023696b79c	create	105.164.4.116	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-06 07:26:10.426018+00
fed110fe-61cf-4020-bdb2-170269b086aa	430ae5d05edaec43e0373f5db8c3957f39ce5f4b4ca3fa4ef3ccdc013cbff19e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 10:52:44.065932+00
ee0b9cfb-d2e7-4d3c-afed-622c80561045	430ae5d05edaec43e0373f5db8c3957f39ce5f4b4ca3fa4ef3ccdc013cbff19e	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:07:44.845831+00
f94446ad-3a86-4024-9698-8fec4fb1c29a	4900c07bff5b42e1e9cf31e54d9321556719299585103d56e3afd7c2472e0250	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:22:44.687115+00
352dbaf6-5de3-424c-aa79-401675766721	05d93e950071dbfcef4580762bfd32e7b5a098c68b0f321099628f3db28d61b4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:37:44.688501+00
1af52659-bc53-4793-b1e2-b2ecfac6bcbd	98ba45ab5610e050b311ec70003ac66fd0f97f07ac38aa57ac0fbb0d43c1bb3f	d7747014-ee25-4dd3-b761-0eee1dc9cfd0	create	105.164.119.136	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-08 17:21:42.6404+00
fef2700c-7f69-459b-b250-f1a02dfb2c9e	97933bf49f444e22ac93b7a10a823a2fee66df2d459057230a332ac8f170d3b6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:07:44.846943+00
651e9151-1da5-4ad2-a573-c908308df614	97933bf49f444e22ac93b7a10a823a2fee66df2d459057230a332ac8f170d3b6	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:22:44.686571+00
95b33fa8-9d9c-4325-b76f-4da427afbcfd	4900c07bff5b42e1e9cf31e54d9321556719299585103d56e3afd7c2472e0250	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-08 11:37:44.687643+00
850f7093-5d6d-4be3-89af-6320a2d34ff0	ca3dd2e791e36f6071fcec28bda68de200fd89b9bfff9723cfb215713fbc8440	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-08 12:24:17.583586+00
5339fc5b-c9b2-45cb-bcdb-c39bb15c53a0	702ab2c6115d1811dd4d354c0046a628c7cbd1b9eb73ba1985343d1d55d62c8c	79eb1215-a2a4-4db6-9683-aa962571d6b7	create	102.0.25.70	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-08 18:13:23.450515+00
541258fc-7f83-453d-bad0-67d525a9cd41	c6069d37fb7942be2002b2f469701fc8ffe7f70da990f58f9b7253ea1d66a6f2	\N	revoke	102.208.190.22	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-09 08:05:13.202646+00
cb85a57f-27ae-44c8-a8e4-2468998a2b69	2e2d8c99c29f27a6b528c7b180882f7c4da71803251a965828c3e25805fc6c1b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 10:28:00.677166+00
60d7cdab-3ebc-48a8-8ac5-8bad6260d73c	1f8f716e6e5c98e9c29f9b50e38f4e610d7ef214ee4e346c86fd4951a82a756b	63e19503-b374-4afb-92ab-c68891c50281	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-09 10:36:54.29331+00
f05566d1-48c6-4576-b2fa-afe00e1cd465	ab2ad69ddaf6092ceab7b4b7f15c2c1da49124d2cf5896b50044d722d03d0a55	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 10:43:01.210588+00
59f90982-0476-436e-8214-19969dbf2377	2e2d8c99c29f27a6b528c7b180882f7c4da71803251a965828c3e25805fc6c1b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 10:43:01.210442+00
a1a5fe16-346e-4ab9-ae78-58eb645de243	966b740bc4b5ce04d86ecfbb0029081dd5e86220d1ea43bb75d20fa6e5e88061	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 10:59:01.205288+00
51f313ed-3d7b-4a15-a643-9cb12b25c3c3	ab2ad69ddaf6092ceab7b4b7f15c2c1da49124d2cf5896b50044d722d03d0a55	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 10:59:01.207022+00
d6e8c84d-d8f2-4095-a2f9-fa3a6a795849	9f4abc6e68999a223dd1c8eec7ed7bb22ecf0e3e774bd21bf3ca9d8f39f02b9f	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 11:15:01.249178+00
500507d2-ff91-4b0a-9894-a38d17d7f9cf	966b740bc4b5ce04d86ecfbb0029081dd5e86220d1ea43bb75d20fa6e5e88061	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 11:15:01.249906+00
76a0cfd8-e8d2-4e1b-a048-7c1e36cf0fc3	702ab2c6115d1811dd4d354c0046a628c7cbd1b9eb73ba1985343d1d55d62c8c	\N	revoke	41.90.133.58	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-09 11:37:54.812528+00
913e13bf-fca7-40c1-84f7-26c3acb2614e	7cbc52b8655b039f9b1063b1ca7a99ac14eb73e7ac1a2456456d3580be11b002	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 17:20:30.197427+00
ea48a92c-4d0e-40e3-bb0c-95c8a2bb1cc0	7cbc52b8655b039f9b1063b1ca7a99ac14eb73e7ac1a2456456d3580be11b002	\N	revoke	129.222.187.23	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 17:35:56.482647+00
8dbe0872-67a1-4f18-a211-ee747297ebce	ca3dd2e791e36f6071fcec28bda68de200fd89b9bfff9723cfb215713fbc8440	\N	revoke	102.68.78.74	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 02:21:56.350876+00
791f9e58-9dfc-4668-a7cb-0b080ee8ddcc	3dd46dff2004751d57beed307bc5ce429a6a8134f5c6af1be2bed02aa91b8f12	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 11:40:29.610845+00
f8836b6e-f502-41c3-8ff3-38c547b5c997	3dd46dff2004751d57beed307bc5ce429a6a8134f5c6af1be2bed02aa91b8f12	\N	revoke	129.222.187.23	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 11:41:02.863362+00
6f637899-8e21-4c20-bed7-555b9cfb0ad1	03ae31dac30532a10642f7a0e4155ab4d65ed2a44dd219f9ee41bf623bc8d108	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 12:45:17.677654+00
ba19ae29-2bc0-4fea-9336-63b6ee7cb7b3	9f4abc6e68999a223dd1c8eec7ed7bb22ecf0e3e774bd21bf3ca9d8f39f02b9f	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 12:49:41.939329+00
44968cb1-564f-41f1-8096-304a6a6f1623	751ab69e2a31818fb15b395683199aa0dad49144b1d8680732227c5e64c42d84	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 12:49:55.284497+00
4b559371-5758-4107-a0e3-e13dae8b721e	03ae31dac30532a10642f7a0e4155ab4d65ed2a44dd219f9ee41bf623bc8d108	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 13:03:10.723617+00
ee720878-2cbe-411a-a310-f64f89f1cac2	571df03317e9c983d6e18dd64c838ac1f73464042479ee15a825afc78908b0ac	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 13:03:14.007022+00
d2b7ff9f-f50b-4a6b-a0b1-411982c6924e	751ab69e2a31818fb15b395683199aa0dad49144b1d8680732227c5e64c42d84	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:07:03.973136+00
5cfd5826-96af-442a-83a5-9300f24f7333	1a68180007536a79ba9b1591f4d31c928102a1ca10156842171c9f9ebe05edd3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:07:07.25326+00
65dc12d2-30f7-45d8-b7b3-68d684d948f8	571df03317e9c983d6e18dd64c838ac1f73464042479ee15a825afc78908b0ac	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 13:20:32.950188+00
84a9e1c3-4ea3-4ab2-8e65-08db44723ef2	1a68180007536a79ba9b1591f4d31c928102a1ca10156842171c9f9ebe05edd3	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:22:09.337501+00
2f3b3a98-b91b-44bf-96e7-b23247921ac1	5ea3506ed7a6d0ae5731b7ef71653c2aeca0105d710ef1b26eb43d9a0092bf4b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:22:09.338157+00
42f4084d-3367-4629-ba02-7197d15d9abc	5ea3506ed7a6d0ae5731b7ef71653c2aeca0105d710ef1b26eb43d9a0092bf4b	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:37:09.276719+00
b0d406d2-1e32-40d8-b4bd-02e3978753fb	f05974ada516d3ce387f5a75739c0d16f333246ecc3c796774b9ac63587d40e8	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:37:09.276868+00
a9df7aa2-6375-45f5-b363-3a6e2a86c0cf	f05974ada516d3ce387f5a75739c0d16f333246ecc3c796774b9ac63587d40e8	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:52:23.105849+00
35163eca-ba43-4de2-93db-b3a26615932e	821752d3011a9ab564ed7414ed075cbcdf8c0d46d32485653ed31a41c5610d39	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:52:23.120222+00
a2138d59-3dfa-4602-adaf-5cf14750c181	f05974ada516d3ce387f5a75739c0d16f333246ecc3c796774b9ac63587d40e8	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:52:23.120094+00
db1b52ef-2160-44e0-a84e-49c894687d93	1bbde3e469589ca3bcb4d0d4d944c4f72a177d9ecc403bd45f938a6aa7de1801	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 13:52:23.134676+00
5cc529a8-661f-4443-b6e5-75bef2332869	5ed828041defd211a4183bff325a23d849f0a651e70b640b3184dc23c87724f2	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:03:41.779646+00
73b62559-5cc8-4657-9d59-ac437262ad7f	821752d3011a9ab564ed7414ed075cbcdf8c0d46d32485653ed31a41c5610d39	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 14:15:43.260989+00
5bc0e364-4eac-436a-9e2f-28886758d82d	5ed828041defd211a4183bff325a23d849f0a651e70b640b3184dc23c87724f2	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:18:50.859555+00
a99f4d0d-86f8-431f-bba6-f99bc97e32a7	4461f36600a86df79da7602280891ed128430a92562d12a084a27d4dbd3caf62	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:18:50.860214+00
a586cbb8-d775-45b0-b548-64196beaa6aa	c9eb6b8f3f287bb38dcb04f865f31fee1cb7585ca2557b664d95fe17f157e1af	79226fbb-f103-4cc9-9722-070a53637a2d	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 14:20:57.935638+00
7dfa8904-a77b-4949-b999-f15cff9bddcf	c9eb6b8f3f287bb38dcb04f865f31fee1cb7585ca2557b664d95fe17f157e1af	\N	revoke	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 14:24:23.326494+00
30ae22ad-16c8-45b5-b80f-f6d2cf6c44f6	edb30f7f0e6b3e6d8fa9f1eb6dc1955329ad876ed0b8b91157cba24bdfd9e1a4	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	154.159.237.231	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	2026-06-10 14:24:31.353303+00
fc7c4ffb-992b-4ba4-86ed-2f6fa53d1e1a	4461f36600a86df79da7602280891ed128430a92562d12a084a27d4dbd3caf62	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:34:05.866371+00
a6847fcf-933c-49a3-978d-2b5084d9f2d6	0e80223c38d125d5da51a718d644dd941a189c95d97464e924d52a7e46396b2c	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:34:05.869349+00
f2ba62ef-aacd-4286-ba5e-275b99f279da	0e80223c38d125d5da51a718d644dd941a189c95d97464e924d52a7e46396b2c	\N	revoke	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 14:49:19.670448+00
126c7b4d-6f41-4868-99c8-bd2f6bb88b00	4a0c0b162158eab2d1855bef8405e6825226cecc5db029841050c1884e7bc620	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 15:11:43.895188+00
ffbc2b38-9882-4960-a4d3-d7d9c25ee974	4a0c0b162158eab2d1855bef8405e6825226cecc5db029841050c1884e7bc620	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 15:26:52.967875+00
bdb594fa-af09-43b2-9839-273b91cd0c19	990847798769ab657d5eb3dfecbdbf1159dcc56be06467f05312ba74369da208	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 15:26:52.970271+00
8e16e431-3512-4d27-bb88-97b5353e2c8c	990847798769ab657d5eb3dfecbdbf1159dcc56be06467f05312ba74369da208	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	rotate_old	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 15:42:07.930663+00
7a488442-e8cc-4c5f-a780-37c9ff1dc792	d3c9f2569edae43fedb2a4c4558b080e5afe60a0ee4acb97849cfc7b772e21e1	2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	create	129.222.187.23	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-10 15:42:07.930928+00
\.


--
-- Data for Name: rider_orders; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.rider_orders (id, order_number, status, customer_name, customer_phone, items, total, address, distance, estimated_time, payment_method, assigned_rider_id, created_at, updated_at) FROM stdin;
f916836c-dde5-4533-a46e-8990f80e8066	SBT-F916836C	on_the_way	Flavian Akwala		[{"name": "Smokie", "quantity": 2}, {"name": "White rice", "quantity": 1}, {"name": "Tumbukiza ", "quantity": 1}]	450	{"lat": null, "lng": null, "city": "Nakuru", "label": "Home", "street": "Monarch studios opposite st Anthony hospital"}	2.5 km	25 mins	mpesa	\N	2026-06-01 16:34:59.377+00	2026-06-01 17:56:26.114963+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: speedy_admin
--

COPY public.users (id, email, password_hash, name, phone, role, is_active, last_login, created_at, updated_at, reset_token, reset_token_expires, avatar_url) FROM stdin;
79226fbb-f103-4cc9-9722-070a53637a2d	michaelwandetto@gmail.com	$2b$10$8mnrlOO3gZrjqJC.yrH7IOD019ByQurL6pYo7Qq0qfgIHVQzk5/iS	Mike	0726763537	customer	t	\N	2026-06-10 14:20:57.895646+00	2026-06-10 14:20:57.895646+00	\N	\N	\N
2b7ac8a0-90f5-4418-aa24-1fdd429ed00e	admin@kukunisisi.co.ke	$2b$10$qin9NxTfRvIS98VjHEPmXuvzBhLSt4Gv6cAh/pkK2LPA22zYykR7S	Admin	\N	admin	t	2026-06-10 15:11:43.897253+00	2026-05-24 09:29:23.006047+00	2026-05-25 12:57:15.646695+00	\N	\N	\N
d00eaf37-708e-498e-86df-cceb72f63cce	hackbit65@gmail.com	$2b$10$v9jnYnGRSWkMtN5BYF8ZzOScGXkzUMdV4idS.9FFvtAYH8J0miQrC	Steven Mwangi	0743574820	customer	t	2026-05-25 13:22:52.767987+00	2026-05-25 12:46:58.502463+00	2026-05-25 12:46:58.502463+00	\N	\N	\N
f8f912b5-4058-4d71-be3e-37b195048819	estherwinnie281@gmail.com	$2b$10$uhCn1c3AAA8FTGBNoTx82.y/BoBiAxEpkvGA3MvhMbyMscgxND.5m	Talia talia	0798114265	customer	t	\N	2026-05-27 18:40:17.920593+00	2026-05-27 18:40:17.920593+00	\N	\N	\N
45a12625-8047-41ce-9299-834bc44607cf	smileystay24@gmail.com	$2b$10$nbe9BYRzMXTgcGcF/nZvoejQzicuej5xiebw5I1.YYKZEweLK7zRa	Smiley	0112137097	customer	t	\N	2026-05-29 16:08:13.658917+00	2026-05-29 16:08:13.658917+00	\N	\N	\N
cd3aca4a-2b9b-49b2-ae17-ff29c36cfe20	wilkinsotieno50@gmail.com	$2b$10$uuYvF7l/Qr9ga.F1K726ReP.NgxO/it3zIUVCBjVYs6.rvj6aJRuO	Wilkins otieno	0726316691	customer	t	\N	2026-05-31 18:14:19.467255+00	2026-05-31 18:14:19.467255+00	\N	\N	\N
3d017f4a-bd65-4f71-b96a-f0aa355f7a5d	victormakavelich@gmail.com	$2b$10$Fn/16sbi.jsxAQyHCbMiO.AkZ0Puoda4oEwrrMuCB9SUbeaKwmaZy	Jay naph	0726233064	customer	t	\N	2026-05-31 18:33:55.961391+00	2026-05-31 18:33:55.961391+00	\N	\N	\N
00eb30ae-7662-42db-9c9b-fe8dadede7af	hitilafu9sacco@gmail.com	$2b$10$c.d8LtObAVamrSQ3YllZjuYVAa./LVsCSSzuJvs857.kUmm5N19bK	Flavian Akwala	0724244112	customer	t	2026-06-01 17:48:15.241752+00	2026-06-01 16:34:35.394006+00	2026-06-01 16:34:35.394006+00	\N	\N	\N
51fd4b19-939b-49d2-a275-4a023696b79c	angelicamwelu899@gmail.com	$2b$10$rQUDSPa4aIaYTGBpcXvJruF03u1yhneh3Q/g98sZyKUZCWDLLGftW	angelica mwelu	0705056787	customer	t	\N	2026-06-06 07:26:10.35508+00	2026-06-06 07:26:10.35508+00	\N	\N	\N
d7747014-ee25-4dd3-b761-0eee1dc9cfd0	rubenwaweru4@gmail.com	$2b$10$u84xwjPVcPkBsLfPCHm5oe.6vmmLX0MUj6qb.93xUFtXWrIQtw3ai	Reuben 	0718492705	customer	t	\N	2026-06-08 17:21:42.554971+00	2026-06-08 17:21:42.554971+00	\N	\N	\N
79eb1215-a2a4-4db6-9683-aa962571d6b7	ngigijoseph599@gmail.com	$2b$10$y2mczOf4w6FD36XFMilYKenC9hkS6hQz.ax8.1nnBADBq4ob2jHn.	Joseph Ngigi	0706848087	customer	t	\N	2026-06-08 18:13:23.428843+00	2026-06-08 18:13:23.428843+00	\N	\N	\N
63e19503-b374-4afb-92ab-c68891c50281	achiengsharon407@gmail.com	$2b$10$E/ibHB0K/YWFJNVRQOx2IuYht21wPyfvnlblky69596VCECYikMkK	Sharon 	0111708121	customer	t	\N	2026-06-09 10:36:54.267186+00	2026-06-09 10:36:54.267186+00	\N	\N	\N
\.


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (user_id, item_id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: mpesa_stk_callbacks mpesa_stk_callbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.mpesa_stk_callbacks
    ADD CONSTRAINT mpesa_stk_callbacks_pkey PRIMARY KEY (id);


--
-- Name: mpesa_stk_requests mpesa_stk_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.mpesa_stk_requests
    ADD CONSTRAINT mpesa_stk_requests_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens_audit refresh_tokens_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.refresh_tokens_audit
    ADD CONSTRAINT refresh_tokens_audit_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (token);


--
-- Name: rider_orders rider_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.rider_orders
    ADD CONSTRAINT rider_orders_order_number_key UNIQUE (order_number);


--
-- Name: rider_orders rider_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.rider_orders
    ADD CONSTRAINT rider_orders_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_menu_categories_active; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE INDEX idx_menu_categories_active ON public.menu_categories USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_menu_categories_order; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE INDEX idx_menu_categories_order ON public.menu_categories USING btree (display_order);


--
-- Name: idx_menu_items_available; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE INDEX idx_menu_items_available ON public.menu_items USING btree (is_available) WHERE (is_available = true);


--
-- Name: idx_menu_items_category; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE INDEX idx_menu_items_category ON public.menu_items USING btree (category_id);


--
-- Name: idx_mpesa_stk_requests_checkout; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE UNIQUE INDEX idx_mpesa_stk_requests_checkout ON public.mpesa_stk_requests USING btree (checkout_request_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: speedy_admin
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;


--
-- Name: mpesa_stk_callbacks mpesa_stk_callbacks_stk_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.mpesa_stk_callbacks
    ADD CONSTRAINT mpesa_stk_callbacks_stk_request_id_fkey FOREIGN KEY (stk_request_id) REFERENCES public.mpesa_stk_requests(id) ON DELETE SET NULL;


--
-- Name: mpesa_stk_requests mpesa_stk_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.mpesa_stk_requests
    ADD CONSTRAINT mpesa_stk_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_assigned_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_assigned_rider_id_fkey FOREIGN KEY (assigned_rider_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_delivery_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.customer_addresses(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens_audit refresh_tokens_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.refresh_tokens_audit
    ADD CONSTRAINT refresh_tokens_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rider_orders rider_orders_assigned_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: speedy_admin
--

ALTER TABLE ONLY public.rider_orders
    ADD CONSTRAINT rider_orders_assigned_rider_id_fkey FOREIGN KEY (assigned_rider_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict n8CS3CeXKpmA9tRFYaDVIZKawddbVH3kLafJBLCq5D1URL07Ds8Dk4ff8eMClCw

