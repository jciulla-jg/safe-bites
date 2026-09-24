# Safe Bites: quick setup

Get the app running on your computer and phone in about 15 minutes. Everything
is free: no paid APIs and no credit card anywhere.

## 1. Install

- [Node.js](https://nodejs.org) (LTS), then from the project folder:

  ```bash
  npm install
  ```

- On your phone: **Expo Go** (free, App Store / Google Play).

## 2. Create the database (Supabase, free)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor**. For each file below, paste its
   contents into a new query and click **Run**, in this order:

   | # | File | What it adds |
   |---|---|---|
   | 1 | `supabase/migrations/0001_initial_schema.sql` | Core tables |
   | 2 | `supabase/migrations/0002_seed_allergens.sql` | The allergen list |
   | 3 | `supabase/migrations/0003_menu_item_allergen_feedback.sql` | Diner feedback on menu items |
   | 4 | `supabase/migrations/0004_community_menu_items.sql` | Diner-added menu items |
   | 5 | `supabase/migrations/0005_submission_ownership.sql` | Edit/delete your own entries |
   | 6 | `supabase/migrations/0006_restaurant_descriptions.sql` | Restaurant descriptions |
   | 7 | `supabase/migrations/0007_reviews_limits_reports.sql` | Reports, review dates, comment limit |
   | 8 | `supabase/migrations/0008_review_requests.sql` | Review requests, verification badge |
   | 9 | `supabase/migrations/0009_chains.sql` | Chain restaurant data |
   | 10 | `supabase/migrations/0010_abuse_limits.sql` | One report and one rating per device, input checks |

   Supabase may warn about "destructive operations" on 0005 and 0007. That's
   expected: they replace old access rules, and no data is deleted. The same goes
   for 0010.

3. Optional demo data, also in the SQL Editor, run after the migrations:

   | File | Adds |
   |---|---|
   | `supabase/demo-seed-schenectady-12305.sql` | 6 Schenectady restaurants |
   | `supabase/demo-seed-schenectady-12305-batch2.sql` | 6 more Schenectady restaurants |
   | `supabase/demo-seed-descriptions.sql` | Descriptions for those 12 |
   | `supabase/demo-seed-expanded-menus.sql` | Fuller menus for Ninety Nine and Stella |
   | `supabase/demo-seed-albany-12210.sql` | 5 Albany restaurants |
   | `supabase/demo-seed-saratoga-12866.sql` | 5 Saratoga Springs restaurants |
   | `supabase/demo-seed-chains-fast-food.sql` | McDonald's, Taco Bell |
   | `supabase/demo-seed-chains-fast-casual.sql` | Chipotle, Panera, Subway, Five Guys |
   | `supabase/demo-seed-chains-coffee-sit-down.sql` | Dunkin', Olive Garden, Chili's |

   Every seed file is safe to re-run. Run the two Schenectady batches before
   the descriptions and expanded-menus files.

## 3. Connect the app

Copy `.env.example` to `.env` and fill in your project's values, which you'll
find under **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run it

```bash
npx expo start
```

- **Browser:** press `w`, which opens http://localhost:8081.
- **Phone:** scan the QR code in the terminal. On iPhone use the Camera app;
  on Android scan it from inside Expo Go, or tap "Enter URL manually" and type
  the `exp://…:8081` address the terminal shows. The phone and computer must
  be on the **same Wi-Fi**. Guest and corporate networks usually block this; a
  phone hotspot works as a fallback.
- **Phone-sized window on a desktop** (Windows, Chrome):

  ```bash
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:8081 --window-size=390,844 --user-data-dir="%TEMP%\safe-bites-phone"
  ```

Try zip **12305** (Schenectady), **12210** (Albany) or **12866** (Saratoga
Springs). Chain locations anywhere show data from the chain's guide.

## Checks

```bash
npm test
```

```bash
npm run typecheck
```

## Good to know

- A free Supabase project **pauses after about a week idle**. Open the
  dashboard before a demo to wake it.
- Restaurant search uses the free public OpenStreetMap servers. If a search
  times out, try again, as they're sometimes busy.
- The restriction profile stays on each device. There are no accounts.
- If the map search is down, the app shows your last saved results for that
  zip code and radius, with a note saying so.
- `.github/workflows/supabase-keepalive.yml` pings the database every 3 days
  so the free project never pauses. Add `SUPABASE_URL` and
  `SUPABASE_ANON_KEY` under **Settings → Secrets and variables → Actions** on
  GitHub to turn it on.

## Publishing the web version (GitHub Pages)

The live web app is at **https://jciulla-jg.github.io/safe-bites/**. It's
served from the `gh-pages` branch, which holds only the built files. To
publish changes, rebuild and push the build:

```bash
MSYS_NO_PATHCONV=1 EXPO_BASE_URL=/safe-bites npx expo export --platform web
```

Then copy `dist/` into a checkout of the `gh-pages` branch, add
`404.html` (a copy of `index.html`, so deep links load the app) and an empty
`.nojekyll` (GitHub would otherwise hide the `_expo` folder), then commit and
push. `MSYS_NO_PATHCONV=1` is only needed in Git Bash on Windows. The build
contains the Supabase URL and anon key, which is expected: the anon key is
public, and database row-level security plus the write functions control
what it can do. Never put the service-role key in `.env`.
