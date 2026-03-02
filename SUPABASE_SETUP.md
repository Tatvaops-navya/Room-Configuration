# Supabase product variations setup

The **Customize** flow loads product variations from your Supabase project when the user selects a component (Facade, Main Door, Windows, Balcony, Canopy, Lighting, Landscaping, Pathway, etc.).

## 1. Environment variables

In `.env.local` (and in Vercel → Project Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL` – your project URL (e.g. `https://uxqmrmxodsychttcjitp.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon public key (JWT)
- `SUPABASE_SERVICE_ROLE_KEY` – service_role secret (server-only; do not expose in client)

Optional: Supabase Publishable Key can be stored as a comment or separate var if needed elsewhere.

## 2. Create the table and seed data

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Copy the contents of **`supabase/migrations/001_component_variations.sql`** and run it.

This will:

- Create the `product_variations` table with columns:  
  `id`, `component_type`, `component_category`, `component_name`, `component_code`, `variation_code`, `variation_name`, `style_family`, `material`, `color`, `texture`, `palette_code`
- Enable RLS with a “public read” policy.
- Insert all component variations (Facade, Main Door, Windows, Balcony, Canopy, Lighting, Landscaping, Pathway).

If you already had an older `product_variations` table, drop it first in the SQL Editor:  
`DROP TABLE IF EXISTS product_variations CASCADE;`  
then run the migration again.

## 3. Supported component types

The API accepts these `component` query values:  
`wall`, `floor`, `ceiling`, `sofa`, `chair`, `desk`, `table`, `cabinet`, `door`, `window`, `glass-partition`, `decor`, `facade`, `balcony`, `canopy`, `lighting`, `landscaping`, `pathway`.

## 4. Flow

1. User clicks **Customize** and selects a component (e.g. **Main Door**).  
2. App calls `GET /api/product-variations?component=door`.  
3. API queries Supabase for rows where `component_type` matches `door`.  
4. API returns `[{ id, label, description }, ...]` (e.g. `label` = variation_name).  
5. App shows these as options; when the user picks one, that variation is applied and sent to the generate API.

If Supabase is not configured or the query returns no rows, the app falls back to the built-in customization library for that component.
