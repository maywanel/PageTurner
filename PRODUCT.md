# PageTurner

PageTurner provides book discovery, private bookshelves, reading-status tracking, and account administration. This document records implemented product behavior, not a validated market strategy.

## Audience and jobs

**Repository-derived assumptions:** the primary audience is individual readers who want to discover titles, maintain a personal collection, and keep track of what they want to read, are reading, or have finished. Administrators are a secondary operational audience. These roles are inferred from README.md and the implemented routes; no user research or demographic claims are available.

## Core workflows

- Discover books through search and eight topic filters; move through catalog selections of 24 results.
- Save or manually add books to an authenticated personal library. Search titles and authors, filter by reading status, and sort the saved collection.
- Switch between shelf, cover, and topic presentations. Open a book for details, status changes, removal, or available reading links.
- Check an ISBN through the Open Library Read API. Reading and borrowing happen at the external provider; unavailable editions offer an edition search. Availability and provider accounts are outside PageTurner's control.
- Register, sign in, manage an account, and sign out. Authorized administrators access account and system administration.

## Product constraints

Collections belong to their authenticated owners, including when the viewer is an administrator. Mutations use CSRF protection; expired sessions return users to sign-in. Reading links are restricted to HTTPS Open Library and Internet Archive destinations. Preserve these behaviors during visual changes.

The frontend uses React 19, Next.js 16, and Tailwind CSS 4 with a Spring Boot API and MySQL persistence. The shared-origin gateway preserves existing routes and session handling. See README.md for runtime and deployment details.

## Visual authority

The user requested a redesign based on `/home/moel-mes/Downloads/booklibrarydesign.mp4`. The implemented direction uses a warm paper reading room, cloth bindings, wooden shelves, and an opening-book detail view. DESIGN.md captures its actual visual system. Decorative classic books on authentication screens are illustrative; they must not imply a saved user collection.

## Evidence and unknowns

Sources: README.md; frontend/app; frontend/components; frontend/lib. Visual review artifacts live in `.impeccable/review/`. Screenshots may use deterministic test fixtures and are not evidence of live catalog availability. Business model, acquisition goals, audience demographics, and success metrics are not established.
