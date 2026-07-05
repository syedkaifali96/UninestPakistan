require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-production';
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'database', 'uninest.sqlite');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new sqlite3.Database(DB_FILE);
const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
db.exec(schema.replace(/ALTER TABLE[^;]+;/g, ''), (err) => { if (err) console.error('Schema error:', err.message); });
// Safe migrations for existing databases
['ALTER TABLE users ADD COLUMN university TEXT','ALTER TABLE users ADD COLUMN updated_at TEXT','ALTER TABLE bookings ADD COLUMN payment_reference TEXT','ALTER TABLE bookings ADD COLUMN payment_account TEXT','ALTER TABLE bookings ADD COLUMN payment_last4 TEXT',"ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'unpaid'"].forEach(sql => db.run(sql, () => {}));

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function required(body, fields) {
  for (const field of fields) {
    if (!body[field] || String(body[field]).trim() === '') {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }
}

function clean(value) {
  return value === undefined || value === null ? null : String(value).trim();
}

function bookingCode() {
  return 'UNI-' + Math.floor(100000 + Math.random() * 900000);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ ok: false, message: 'Login required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Session expired. Please login again.' });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }
  next();
}

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, phone: row.phone || '', university: row.university || '', role: row.role || 'student' };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, database: 'connected' });
});

app.post('/api/contact', async (req, res, next) => {
  try {
    required(req.body, ['name', 'email', 'message']);
    const result = await run(
      `INSERT INTO contact_messages (name, email, phone, city, message) VALUES (?, ?, ?, ?, ?)`,
      [clean(req.body.name), clean(req.body.email), clean(req.body.phone), clean(req.body.city), clean(req.body.message)]
    );
    res.status(201).json({ ok: true, id: result.id, message: 'Contact message saved' });
  } catch (err) { next(err); }
});

app.post('/api/newsletter', async (req, res, next) => {
  try {
    required(req.body, ['email']);
    await run(`INSERT OR IGNORE INTO newsletter_subscribers (email, source) VALUES (?, ?)`, [clean(req.body.email), clean(req.body.source) || 'website']);
    res.status(201).json({ ok: true, message: 'Newsletter subscriber saved' });
  } catch (err) { next(err); }
});

app.post('/api/reviews', async (req, res, next) => {
  try {
    required(req.body, ['name', 'rating', 'review']);
    const result = await run(
      `INSERT INTO reviews (name, university, property, city, rating, review) VALUES (?, ?, ?, ?, ?, ?)`,
      [clean(req.body.name), clean(req.body.university), clean(req.body.property), clean(req.body.city), Number(req.body.rating), clean(req.body.review)]
    );
    res.status(201).json({ ok: true, id: result.id, message: 'Review saved for moderation' });
  } catch (err) { next(err); }
});

app.post('/api/roommates', async (req, res, next) => {
  try {
    required(req.body, ['name', 'city', 'about']);
    const result = await run(
      `INSERT INTO roommate_profiles (name, university, city, budget, gender, movein, about) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clean(req.body.name), clean(req.body.university), clean(req.body.city), clean(req.body.budget), clean(req.body.gender), clean(req.body.movein), clean(req.body.about)]
    );
    res.status(201).json({ ok: true, id: result.id, message: 'Roommate profile saved for moderation' });
  } catch (err) { next(err); }
});

app.post('/api/bookings', async (req, res, next) => {
  try {
    required(req.body, ['full_name', 'phone', 'email', 'university', 'cnic', 'total', 'payment_method']);
    const method = clean(req.body.payment_method);
    if (!['card', 'easypaisa', 'bank'].includes(method)) { const error = new Error('Valid payment method is required'); error.status = 400; throw error; }
    if (method === 'card' && (!req.body.payment_last4 || !req.body.payment_reference || !req.body.payment_account)) { const error = new Error('Card payment details are required'); error.status = 400; throw error; }
    if (method === 'easypaisa' && (!req.body.payment_account || !req.body.payment_reference)) { const error = new Error('Wallet number and transaction ID are required'); error.status = 400; throw error; }
    if (method === 'bank' && (!req.body.payment_account || !req.body.payment_reference)) { const error = new Error('Bank name and reference number are required'); error.status = 400; throw error; }
    let code = bookingCode();
    let tries = 0;
    while (await get('SELECT id FROM bookings WHERE booking_code = ?', [code])) {
      code = bookingCode();
      if (++tries > 5) throw new Error('Could not generate booking code');
    }
    const result = await run(
      `INSERT INTO bookings (
        booking_code, property_id, property_title, room_type, room_price, months, meal_price,
        addons_price, discount, promo_discount, total, checkin_date, checkout_date, full_name,
        phone, email, university, cnic, special_requests, payment_method, payment_reference, payment_account, payment_last4, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, req.body.property_id || null, clean(req.body.property_title), clean(req.body.room_type),
        Number(req.body.room_price || 0), Number(req.body.months || 1), Number(req.body.meal_price || 0),
        Number(req.body.addons_price || 0), Number(req.body.discount || 0), Number(req.body.promo_discount || 0),
        Number(req.body.total || 0), clean(req.body.checkin_date), clean(req.body.checkout_date), clean(req.body.full_name),
        clean(req.body.phone), clean(req.body.email), clean(req.body.university), clean(req.body.cnic),
        clean(req.body.special_requests), method, clean(req.body.payment_reference), clean(req.body.payment_account), clean(req.body.payment_last4), clean(req.body.payment_status) || 'submitted_for_verification'
      ]
    );
    res.status(201).json({ ok: true, id: result.id, booking_code: code, message: 'Booking saved' });
  } catch (err) { next(err); }
});


app.get('/api/bookings/me', authRequired, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const rows = await all(`SELECT id, booking_code, property_id, property_title, room_type, room_price, months, meal_price, addons_price, discount, promo_discount, total, checkin_date, checkout_date, full_name, phone, email, university, payment_method, payment_reference, payment_account, payment_last4, payment_status, status, created_at FROM bookings WHERE lower(email) = lower(?) ORDER BY id DESC`, [user.email]);
    res.json({ ok: true, rows });
  } catch (err) { next(err); }
});

app.post('/api/register', async (req, res, next) => {
  try {
    required(req.body, ['name', 'email', 'password']);
    const hash = await bcrypt.hash(String(req.body.password), 10);
    const result = await run(
      `INSERT INTO users (name, email, phone, university, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [clean(req.body.name), clean(req.body.email).toLowerCase(), clean(req.body.phone), clean(req.body.university), hash]
    );
    res.status(201).json({ ok: true, id: result.id, message: 'User registered' });
  } catch (err) { next(err); }
});


app.post('/api/forgot-password', async (req, res, next) => {
  try {
    required(req.body, ['email']);
    // Security: return a generic response so account existence is not exposed.
    // Production: connect email provider and save one-time reset tokens with expiry.
    await get('SELECT id FROM users WHERE lower(email) = lower(?)', [clean(req.body.email)]).catch(() => null);
    res.json({ ok: true, message: 'If this email exists, reset instructions will be sent.' });
  } catch (err) { next(err); }
});

app.post('/api/login', async (req, res, next) => {
  try {
    required(req.body, ['email', 'password']);
    const user = await get('SELECT * FROM users WHERE lower(email) = lower(?)', [clean(req.body.email)]);
    if (!user || !(await bcrypt.compare(String(req.body.password), user.password_hash))) {
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: publicUser(user) });
  } catch (err) { next(err); }
});


app.get('/api/me', authRequired, async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, user: publicUser(user) });
  } catch (err) { next(err); }
});

app.put('/api/me', authRequired, async (req, res, next) => {
  try {
    await run('UPDATE users SET name = ?, phone = ?, university = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [clean(req.body.name), clean(req.body.phone), clean(req.body.university), req.user.id]);
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: publicUser(user), message: 'Profile updated' });
  } catch (err) { next(err); }
});

app.get('/api/favorites', authRequired, async (req, res, next) => {
  try {
    const rows = await all('SELECT property_key AS id, title, price, location, img, href, created_at FROM user_favorites WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    res.json({ ok: true, rows });
  } catch (err) { next(err); }
});

app.post('/api/favorites', authRequired, async (req, res, next) => {
  try {
    const key = clean(req.body.id || req.body.property_key || req.body.title);
    if (!key) return res.status(400).json({ ok: false, message: 'Property id required' });
    await run(`INSERT INTO user_favorites (user_id, property_key, title, price, location, img, href)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, property_key) DO UPDATE SET title=excluded.title, price=excluded.price, location=excluded.location, img=excluded.img, href=excluded.href`,
      [req.user.id, key, clean(req.body.title), clean(req.body.price), clean(req.body.location), clean(req.body.img), clean(req.body.href)]);
    res.status(201).json({ ok: true, message: 'Favorite saved' });
  } catch (err) { next(err); }
});

app.delete('/api/favorites/:id', authRequired, async (req, res, next) => {
  try {
    await run('DELETE FROM user_favorites WHERE user_id = ? AND property_key = ?', [req.user.id, req.params.id]);
    res.json({ ok: true, message: 'Favorite removed' });
  } catch (err) { next(err); }
});

app.get('/api/recent', authRequired, async (req, res, next) => {
  try {
    const rows = await all('SELECT property_key AS id, title, price, location, img, href, viewed_at FROM user_recent_views WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 20', [req.user.id]);
    res.json({ ok: true, rows });
  } catch (err) { next(err); }
});

app.post('/api/recent', authRequired, async (req, res, next) => {
  try {
    const key = clean(req.body.id || req.body.property_key || req.body.title);
    if (!key) return res.status(400).json({ ok: false, message: 'Property id required' });
    await run(`INSERT INTO user_recent_views (user_id, property_key, title, price, location, img, href)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, property_key) DO UPDATE SET title=excluded.title, price=excluded.price, location=excluded.location, img=excluded.img, href=excluded.href, viewed_at=CURRENT_TIMESTAMP`,
      [req.user.id, key, clean(req.body.title), clean(req.body.price), clean(req.body.location), clean(req.body.img), clean(req.body.href)]);
    res.status(201).json({ ok: true, message: 'Recent view saved' });
  } catch (err) { next(err); }
});

app.get('/api/admin/summary', authRequired, adminRequired, async (req, res, next) => {
  try {
    const tables = ['users', 'contact_messages', 'bookings', 'reviews', 'roommate_profiles', 'newsletter_subscribers'];
    const summary = {};
    for (const table of tables) {
      const row = await get(`SELECT COUNT(*) AS count FROM ${table}`);
      summary[table] = row.count;
    }
    res.json({ ok: true, summary });
  } catch (err) { next(err); }
});

app.get('/api/admin/:table', authRequired, adminRequired, async (req, res, next) => {
  try {
    const allowed = new Set(['users', 'contact_messages', 'bookings', 'reviews', 'roommate_profiles', 'newsletter_subscribers']);
    if (!allowed.has(req.params.table)) return res.status(404).json({ ok: false, message: 'Unknown table' });
    const rows = await all(`SELECT * FROM ${req.params.table} ORDER BY id DESC LIMIT 100`);
    res.json({ ok: true, rows });
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`UniNest running on http://localhost:${PORT}`);
  console.log(`SQLite database: ${DB_FILE}`);
});
