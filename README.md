# UniNest Pakistan 🏠

A student hostel & roommate-finder platform for university students across **Karachi, Lahore, and Islamabad**. Built as an Aptech eProject with a full Node.js/Express + SQLite backend.

### 🔴 Live Demo: [uninest-pakistan--syedkaifali96.replit.app](https://uninest-pakistan--syedkaifali96.replit.app/)

## Features

- 🔍 Property/hostel listings with search & filters (city, budget, gender-specific, university proximity)
- 🤝 Roommate finder with profile matching
- ⭐ Reviews & ratings system
- 📅 Booking system with real booking codes
- 🔐 User authentication (register/login) with JWT + bcrypt password hashing
- 📩 Contact form & newsletter subscription
- 🛠️ Admin dashboard endpoints (bookings, reviews, users, messages, subscribers summary)
- 🏙️ Dedicated city pages (Karachi, Lahore, Islamabad)
- 📖 Guides (budget planning, moving checklist, student housing tips)

## Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript
**Backend:** Node.js, Express.js
**Database:** SQLite3
**Auth:** JWT (jsonwebtoken), bcryptjs

## Project Structure

```
├── server.js              # Express backend & API routes
├── api.js / api-client.js # Frontend API helpers
├── auth.js                # Auth logic (frontend)
├── script.js / search.js  # Core frontend logic
├── style.css              # Global styles
├── database/
│   ├── schema.sql          # SQLite schema
│   └── uninest.sqlite      # DB file (auto-created)
├── *.json                  # Static data (properties, universities, cities, FAQ, testimonials)
└── *.html                  # Pages (index, listings, booking, dashboard, hotel-details, etc.)
```

## Database Tables

`users` · `contact_messages` · `newsletter_subscribers` · `reviews` · `roommate_profiles` · `bookings`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/contact` | Submit contact form |
| POST | `/api/newsletter` | Subscribe to newsletter |
| POST | `/api/reviews` | Submit a review (pending approval) |
| POST | `/api/roommates` | Create roommate profile (pending approval) |
| POST | `/api/bookings` | Create booking, returns booking code |
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login user |
| GET | `/api/admin/summary` | Admin dashboard summary |
| GET | `/api/admin/bookings` | All bookings |
| GET | `/api/admin/contact_messages` | All contact messages |
| GET | `/api/admin/reviews` | All reviews |
| GET | `/api/admin/roommate_profiles` | All roommate profiles |
| GET | `/api/admin/newsletter_subscribers` | All subscribers |
| GET | `/api/admin/users` | All users |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/uninest-pakistan.git
cd uninest-pakistan

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# edit .env: set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD before production

# Run the server
npm start
```

App runs at **http://localhost:3000**. The SQLite database (`database/uninest.sqlite`) is created automatically on first run using `database/schema.sql`.

## Environment Variables (`.env`)

```
PORT=3000
JWT_SECRET=change-this-secret-before-production
DATABASE_FILE=./database/uninest.sqlite
ADMIN_EMAIL=admin@uninest.pk
ADMIN_PASSWORD=change-admin-password-before-production
```

## ⚠️ Production Notes

This SQLite setup is intended for local/small-scale deployment. For production:
- Migrate to PostgreSQL/MySQL
- Add proper admin authentication
- Add email notifications
- Integrate a payment gateway
- Enforce HTTPS + secure cookies
- Harden JWT secret management

## Contributors

- Syed Kaif Ali
- Mujahid Ahmed
- Syed Faizan Ali

**Institution:** Aptech Metro Star Gate — ACCP Semester I
**Faculty Supervisor:** Mr. Syed Muhammad Ali Farhan

## License

This project was developed for educational purposes as part of an Aptech Computer Education eProject.
