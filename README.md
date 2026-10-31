# Ezra Mohammed — Portfolio / Vercel edition

## What changed

- Three Lab tabs: original water-flow integration, optical meter reading, and 10/100/1000 Mbps Ethernet.
- Homepage features the blue-and-white ultrasonic meter (`project1.jpg`). Actual manufactured PCB photos lead the energy, switch and node galleries. GPS sole imagery is retained.
- Pointer-driven perspective gives the hero and gallery photographs depth. This is a 3D presentation of photographs, not a rotatable CAD model. Reduced-motion preferences disable tilt and decorative motion.
- Project Studio at `/admin` manages projects, categories, descriptions, technical facts, cover images, gallery order, uploads, display order, drafts and publishing.
- Shared data uses Supabase Auth, Postgres and Storage. It is not a browser-only project editor.
- Vercel deployment configuration, database schema, seed data and tests are included.

The layout takes inspiration from the clear hierarchy and paired disciplines of https://www.adhamdannaway.com/ while preserving your own identity, content, photographs and dark/lime visual style.

## 1. Prepare the repository

1. Extract the ZIP. Open the `ezra-website` folder.
2. Create a GitHub repository and upload the **contents** of that folder, including `package.json`, `package-lock.json`, `vercel.json`, `site`, `src`, `scripts` and `database`.
3. Do not upload `node_modules`, real `.env` files or credentials. The included `.gitignore` covers them.
4. Keep your existing Netlify deployment online until the Vercel version is verified.

Local development requires Node.js 22 or newer:

```sh
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000 . Use HTTP, not a double-clicked `file://` page, because this edition uses JavaScript modules. A prebuilt admin bundle and empty public configuration are included for static preview. With neither environment variable set, the public website uses the five bundled projects and admin shows setup instructions.

## 2. Set up your shared project database

1. Create a Supabase project at https://supabase.com/dashboard . Choose a region and retain its database password privately.
2. In **SQL Editor**, run `database/schema.sql` once in this new project. It creates `projects`, the admin allowlist, row-level security policies and the `project-images` bucket. Do not run this schema over an unrelated existing application.
3. Run `database/seed.sql`. It adds the five existing projects and does not overwrite an existing project with the same ID.
4. In **Authentication → Users**, create your own email/password user, using a strong password. Confirm its email in the dashboard when appropriate. Copy the user's UUID.
5. In SQL Editor, grant that exact user editor access:

```sql
insert into public.portfolio_admins(user_id)
values ('PASTE_YOUR_AUTH_USER_UUID_HERE');
```

6. Disable new public user signups in Authentication settings. There is no signup form in this app. Even an authenticated account cannot edit until it is in `portfolio_admins`.
7. In the project settings / Connect dialog, obtain the project URL (`https://PROJECT.supabase.co`) and **publishable** API key (`sb_publishable_...`). These two values belong in the Vercel environment variables below. They are public by design; RLS enforces permissions. Never use a secret key, service-role key or database password in the browser configuration.

The supplied SQL grants visitors read access to published projects only. Approved admins can read drafts and write projects. The storage bucket permits image upload/delete only to approved admins. Images in this public bucket are visible by URL, even if their project is a draft. Use public portfolio images only.

## 3. Deploy on Vercel

1. Sign in to https://vercel.com/ and choose **Add New → Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to the folder containing `package.json` and `vercel.json`. If you uploaded the extracted folder instead of its contents, choose `ezra-website`.
4. Use these settings (also specified in `vercel.json`):

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `site` |
| Node.js | 22.x or newer supported version |

5. Add environment variables:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | Your `https://PROJECT.supabase.co` URL, without trailing slash |
| `SUPABASE_PUBLISHABLE_KEY` | Your `sb_publishable_...` key |

6. Enable them for Production. For previews, use a separate Supabase project if you want isolated test data; otherwise preview editors will modify the same database as production.
7. Click **Deploy**. Vercel assigns your project a `.vercel.app` address. Use the exact address returned by Vercel.
8. After deployment, set your production URL in Supabase Authentication URL settings. This app signs in with email/password, without redirect-based OAuth.
9. Open your new website, then its **Project studio** footer link (`/admin`). Sign in with the account you created. Create a test draft, upload an image, save, then publish. Reload the public site and confirm it appears. Unpublish it and confirm it disappears in a signed-out/private window.
10. Future project changes through the studio take effect on the next public page load; no Vercel redeploy is required. Code, hero content, biography or résumé changes require a Git commit and redeploy.

Environment changes require redeploying because `npm run build` generates `site/config.js`. Do not manually edit that generated file and expect it to survive the next build.

## 4. Move traffic from Netlify

Your current `ezramohammed.netlify.app` address belongs to Netlify. It cannot become a Vercel-hosted address. You can use Vercel's assigned `.vercel.app` address, or add a custom domain you own in Vercel → Project Settings → Domains and follow the DNS records shown there.

After testing the new deployment:

- Update résumé/profile/social links to the new address.
- Keep the old site as a redirect if desired. On the **old Netlify site only**, add an `_redirects` file to its published folder containing:

```text
/* https://YOUR_ACTUAL_VERCEL_HOST/:splat 301!
```

Replace the placeholder with your actual Vercel hostname. Do not put this redirect in the new Vercel deployment, and do not enable it before the destination works. To roll back, remove the redirect and redeploy the previous Netlify site.

## Everyday project editing

1. Open Project Studio and sign in.
2. Select a project, or click **New project**.
3. Use a unique lowercase ID such as `industrial-sensor`. Existing IDs are fixed.
4. Complete the story and contribution. Tags/highlights use one item per line. Technical facts use `Label | Value` per line.
5. Upload JPEG, PNG, WebP or AVIF images (up to 5 MB each, 30 images/project). Edit descriptive captions, choose a cover, and reorder with the arrows.
6. Leave **Published** unchecked while drafting. Check it and save when ready.
7. A smaller display order appears earlier. New categories automatically become public filters.
8. Sign out after editing, especially on shared computers.

Changes are protected from overwriting a newer version saved in another session. A conflict asks you to reload. Removing an image from a gallery or deleting a project does not delete its stored files; remove unused files manually in Supabase Storage only after checking that no other project references them. New uploads get unique names to avoid overwriting existing images.

Password recovery: the project owner can update the account from Supabase Authentication. A custom end-user recovery flow is not included. No default password is shipped.

## Simulation scope and engineering assumptions

### Optical meter / IEC 62056-21 Mode C

This is an educational, deterministic exchange, not a serial-port implementation or certified compliance tool:

1. Reader sends `/?!<CR><LF>` at 300 baud, 7E1.
2. Meter returns `/EZRZSIM<CR><LF>`; `EZR` is a fictional demonstration manufacturer code and `Z` is the chosen baud code.
3. Reader sends `<ACK>0Z0<CR><LF>` at 300 baud to select normal readout, then both endpoints switch baud rate.
4. Meter returns a sample energy/voltage data block, framed by STX/ETX with a calculated XOR BCC. XOR covers bytes after STX through ETX. Display shows BCC explicitly in hexadecimal.
5. Misalignment produces a timeout; a deliberately corrupted BCC rejects the energy value.

The animation has a fixed teaching pace. It does not implement physical IR characteristics, parity bit animation, protocol timing tolerances, authentication, programming, Mode E/HDLC or a complete meter parser. The supplied archive contained no IEC documents. The request's “62056-22” was not established; this release deliberately labels the supported illustration **62056-21 Mode C only**. Provide the intended -22 document/profile before extending it.

### Ethernet / 10, 100, 1000 Mbps

The model transfers Ethernet payload (not a TCP file download) over independent ideal full-duplex links. Payload is divided into frames of up to 1500 bytes, with at least 46 bytes for the last frame, including padding if needed. Each frame adds 14 bytes of MAC header, 4 FCS, 8 preamble/SFD and 12 byte-times interframe gap. One gap per frame is counted as wire occupancy, including after the last frame.

`time_seconds = wire_byte_times × 8 / (link_Mbps × 1,000,000)`

The same payload therefore takes ten times longer at 10 Mbps than at 100 Mbps, and one hundred times longer than at 1000 Mbps. No TCP/IP headers, acknowledgements, retransmissions, collisions, switching/propagation latency, storage time or congestion are modeled. This is not an internet speed test or PHY signal simulation. 1 MB means 1,000,000 bytes.

### Water flow

The retained example integrates flow over time: `litres += litres_per_minute × elapsed_seconds / 60`. It does not simulate the ultrasonic transducer. All simulations pause when the document is hidden; switching Lab tabs pauses the outgoing simulation.

## Verification and launch checks

Automated model tests cover all offered optical baud codes, framing/BCC, misalignment, bad checksum, Ethernet minimum padding/frame boundaries/speed ratios, bundled project validation and unsafe image URL rejection. `npm test` passes five tests. `npm run build` succeeds.

Browser checks: desktop hero, real PCB gallery navigation, optical success/error paths, Ethernet progress, water pause on tab change, and a 390-pixel layout. Admin unconfigured state is checked. Supabase login, database writes, RLS enforcement and storage uploads have **not** been exercised against a live project because no project credentials were provided. Before launch, verify:

- Signed-out visitors see published projects, not drafts.
- An ordinary signed-in user not in the admin table cannot write or upload.
- An approved admin can create, edit, publish and delete a disposable test project.
- Uploaded images survive signing out and appear for another browser.
- Failed/expired sessions produce an error without claiming a successful save.
- Concurrent editing produces a conflict rather than overwriting another session.

Configured database failures show an unavailable message; they do not silently resurrect bundled projects that you deleted. With no configuration at all, bundled projects intentionally provide a static preview.

## Files to know

- `site/index.html`, `styles.css`, `app.js`: public portfolio and existing water lab.
- `site/labs.js`, `lab-models.js`: additional simulation UI and calculations.
- `site/content.js`: personal details, experience and static-preview projects.
- `site/projects-loader.js`: published projects from the database.
- `src/admin.js`, `site/admin.html`, `site/studio.css`: project editor.
- `site/project-model.js`: shared project and image validation.
- `database/schema.sql`, `database/seed.sql`: setup and initial projects.
- `scripts/build.mjs`: bundles the admin client and writes public configuration.
- `scripts/seed.mjs`: regenerates initial seed SQL from bundled content. This does not change the live database.
- `vercel.json`: build/output configuration and response security headers.

No production deployment, account creation, DNS changes or changes to the existing Netlify site were performed as part of this package.

## Reference documentation

- IEC 62056-21 catalogue: https://webstore.iec.ch/en/publication/6398
- Gurux IEC connection initialization and baud codes: https://www.gurux.fi/Gurux.DLMS.Iec (its example proceeds to Mode E; this demo selects Mode C readout).
- Elseta WCC-Lite manual, IEC modes: https://elseta.com/wp-content/uploads/WCC-Lite-User-Manual-v1.4.0.pdf
- IEC text excerpt, framing/BCC and ACK option selection: https://standards.iteh.ai/catalog/standards/sist/b41a8333-0754-486f-a49d-85661736fc90/sist-en-62056-21-2004
- Cisco Ethernet framing: https://www.cisco.com/en/US/docs/internetworking/troubleshooting/guide/tr1904.html
- Vercel configuration: https://vercel.com/docs/project-configuration/vercel-json
- Vercel Git deployment: https://vercel.com/docs/git
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage permissions: https://supabase.com/docs/guides/storage/security/access-control
- Supabase password sign-in: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
