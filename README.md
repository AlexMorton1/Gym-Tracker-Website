# Team Habit Tracker

A shared, GitHub-style habit tracker. Express backend, Turso (hosted SQLite)
database, deployed free on Render. Everyone who opens the app sees the same
data — no accounts required, just a shared URL.

## What's inside

```
habit-tracker-app/
  server.js       Express server + API routes
  db.js           Database schema, seeding, and queries (Turso / libSQL)
  public/
    index.html    Home page (ticker + 14-day calendar)      -> home.js
    log.html      Log activity page (mark days, add people) -> app.js
    config.js     <-- EDIT THIS to customise the site name, ticker, colours
    nav.js        Shared top navigation bar
    styles.css
  package.json
  .env.example    Template for local environment variables
```

Current data: one habit ("Gym") with one person ("Alex"), no completions yet
— a clean slate. Use the "+ Add person" button in the app to add your
friends once it's running.

---

## Customising the home page

Everything is in `public/config.js`:

- **Site name** (top-left of the bar): `siteName`
- **Ticker headlines**: the `ticker.rules` list. Each rule covers a range of
  "days since last activity" and has one or more message templates
  (`{name}`, `{days}`, `{dayWord}`, `{habit}`, `{date}`) plus a colour `tone`.
  The first matching rule wins; add, remove or reword rules freely.
- **Habit-specific headlines**: add `habit: 'Run'` (or `habit: ['Gym', 'Run']`)
  to a rule so it only applies when that's what the person last did. Rules
  without `habit` match any habit. Put habit-specific rules above general
  ones, since the first match wins.
- **Ticker speed / label / separator**: `pixelsPerSecond`, `label`, `separator`
- **Calendar colours**: `calendar.habitColors` (by habit name), `bothColor`
  (more than one habit on the same day), and `calendar.days` (default 14)

Note: the calendar colours habits by *name*. Right now the database only
contains the "Gym" habit, so "Run" (red) and the purple "both" colour will
only appear once a habit named "Run" exists.

---

## Part 1 — Create your Turso database

1. Go to [turso.tech](https://turso.tech) and sign up (no credit card required).
2. Install the Turso CLI, or use the web dashboard directly — either works:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   ```
3. Create a database:
   ```bash
   turso db create habit-tracker
   ```
4. Get the connection URL:
   ```bash
   turso db show habit-tracker --url
   ```
   This gives you something like `libsql://habit-tracker-yourname.turso.io` — save it.
5. Create an auth token:
   ```bash
   turso db tokens create habit-tracker
   ```
   Save this too — you won't be able to see it again after this step (you can always create a new one if you lose it).

If you'd rather skip the CLI entirely, the Turso web dashboard has "Create Database" and "Generate Token" buttons that give you the same two values.

## Part 2 — Put the code on GitHub

Render deploys from a Git repository, so the code needs to live on GitHub first.

1. Create a new repository on [github.com](https://github.com) (public or private, either is fine).
2. From inside the `habit-tracker-app` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

## Part 3 — Deploy on Render

1. Go to [render.com](https://render.com) and sign up (no credit card required for the free tier).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the repository you just pushed.
4. Fill in:
   - **Name**: whatever you'd like (this becomes part of your URL)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add the two values from Part 1:
   - `TURSO_DATABASE_URL` → the `libsql://...` URL
   - `TURSO_AUTH_TOKEN` → the token you generated
6. Click **Create Web Service**. Render will build and deploy — this takes a couple of minutes the first time.
7. Once it's live, Render gives you a URL like `https://your-app-name.onrender.com` — that's what you share with your friends.

That's it — no domain purchase needed, HTTPS is automatic.

## Updating the app later

Any time you want to change something (add a feature, tweak styling), push to
the same GitHub repo's `main` branch and Render redeploys automatically:
```bash
git add .
git commit -m "Description of the change"
git push
```

## Good to know

- **Cold starts**: Render's free tier sleeps the app after 15 minutes of no traffic. The first visit after that takes 30–60 seconds to wake up — normal and expected, not a bug.
- **Your data is safe across deploys/restarts**: it lives in Turso, not on Render's disk, so redeploying or the app sleeping/waking never touches your habit data.
- **No login system**: anyone with the URL can add people or mark habits complete. Fine for a small group of friends; if you ever want to lock it down, that would mean adding simple authentication to `server.js`.
- **Local testing**: running `npm start` without setting `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` automatically falls back to a local SQLite file (`habit-tracker.local.db`), so you can develop and test without touching your real Turso data.
- **Adding new habits** (not people): currently set up in the seed data in `db.js`. It's a small addition to expose this in the UI the same way "add person" works, if you want that later.
