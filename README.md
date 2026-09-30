# AHHio

AHHio is an Arabic, RTL marketplace built with React, Vite, and Supabase.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project

## Local development

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Use the Supabase anon/publishable key only. Never expose a service-role key in a `VITE_` variable.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Vite writes the production site to `dist/`. Vercel can deploy this repository with the Vite preset, `npm run build` as the build command, and `dist` as the output directory. The rewrite in `vercel.json` supports React Router routes.

## Supabase deployment

1. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel for every environment you deploy (Preview and Production).
2. Run `supabase/rls.sql` in the Supabase SQL Editor.
3. Set the production site URL and allowed authentication redirect URLs in Supabase Auth settings.
4. Verify customer and vendor registration, checkout, and order status updates against the deployed project before opening traffic.
