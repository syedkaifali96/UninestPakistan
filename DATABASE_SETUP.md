# UniNest Pakistan Database Setup

Database/backend add kar diya gaya hai using **Node.js + Express + SQLite**.

## Added files

- `server.js` - Express backend/API server
- `api-client.js` - Frontend helper for saving forms to backend
- `database/schema.sql` - SQLite database tables
- `package.json` - Node dependencies and start scripts
- `.env.example` - Environment variables sample

## Database tables

- `users`
- `contact_messages`
- `newsletter_subscribers`
- `reviews`
- `roommate_profiles`
- `bookings`

## Working API endpoints

- `POST /api/contact`
- `POST /api/newsletter`
- `POST /api/reviews`
- `POST /api/roommates`
- `POST /api/bookings`
- `POST /api/register`
- `POST /api/login`
- `GET /api/admin/summary`
- `GET /api/admin/bookings`
- `GET /api/admin/contact_messages`
- `GET /api/admin/reviews`
- `GET /api/admin/roommate_profiles`
- `GET /api/admin/newsletter_subscribers`
- `GET /api/admin/users`

## How to run

```bash
npm install
cp .env.example .env
npm start
```

Open:

```text
http://localhost:3000
```

Database file auto-create ho jayegi:

```text
database/uninest.sqlite
```

## What is now connected to database

- Contact form saves to `contact_messages`
- Newsletter form saves to `newsletter_subscribers`
- Review form saves to `reviews` with `pending` status
- Roommate form saves to `roommate_profiles` with `pending` status
- Booking button saves booking to `bookings` and returns real booking code from backend
- Register/login backend endpoints are available

## Important production note

Ye SQLite setup local/small deployment ke liye theek hai. Production ke liye PostgreSQL/MySQL, proper admin authentication, email notifications, payment gateway, HTTPS, and secure cookies/JWT hardening add karni hogi.
