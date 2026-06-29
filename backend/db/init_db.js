const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');

const countriesMap = {
  "Mexico": "mx",
  "South Korea": "kr",
  "South Africa": "za",
  "Czechia": "cz",
  "Canada": "ca",
  "Switzerland": "ch",
  "Qatar": "qa",
  "Bosnia-Herzegovina": "ba",
  "Brazil": "br",
  "Morocco": "ma",
  "Scotland": "gb-sct",
  "Haiti": "ht",
  "USA": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turkiye": "tr",
  "Germany": "de",
  "Ecuador": "ec",
  "Ivory Coast": "ci",
  "Curacao": "cw",
  "Netherlands": "nl",
  "Japan": "jp",
  "Tunisia": "tn",
  "Sweden": "se",
  "Belgium": "be",
  "Iran": "ir",
  "Egypt": "eg",
  "New Zealand": "nz",
  "Spain": "es",
  "Uruguay": "uy",
  "Saudi Arabia": "sa",
  "Cape Verde": "cv",
  "France": "fr",
  "Senegal": "sn",
  "Norway": "no",
  "Iraq": "iq",
  "Argentina": "ar",
  "Austria": "at",
  "Algeria": "dz",
  "Jordan": "jo",
  "Portugal": "pt",
  "Colombia": "co",
  "Uzbekistan": "uz",
  "DR Congo": "cd",
  "England": "gb-eng",
  "Croatia": "hr",
  "Panama": "pa",
  "Ghana": "gh"
};

db.serialize(async () => {
  console.log("Initializing database tables...");
  
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("Error creating 'users' table:", err);
  });

  // Matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_num INTEGER UNIQUE,
      group_name TEXT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      match_date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
      home_score INTEGER DEFAULT NULL, -- marcador tiempo regular (90')
      away_score INTEGER DEFAULT NULL,
      et_home_score INTEGER DEFAULT NULL, -- marcador final tiempo extra (120'), solo eliminatorias
      et_away_score INTEGER DEFAULT NULL,
      pen_winner TEXT DEFAULT NULL, -- 'home' | 'away', ganador en penales
      is_knockout INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'group' -- 'group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'
    )
  `, (err) => {
    if (err) console.error("Error creating 'matches' table:", err);
  });

  // Predictions table
  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      predicted_home_score INTEGER NOT NULL,
      predicted_away_score INTEGER NOT NULL,
      pred_et_home INTEGER DEFAULT NULL, -- predicción tiempo extra (solo si predijo empate en regular)
      pred_et_away INTEGER DEFAULT NULL,
      pred_pen_winner TEXT DEFAULT NULL, -- 'home' | 'away' (solo si predijo empate en tiempo extra)
      points_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, match_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error("Error creating 'predictions' table:", err);
  });

  console.log("Tables created successfully.");

  // Seed Admin User
  const adminEmail = 'admin@tropica.me';
  const adminPassword = 'tropica2026admin';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (err) {
      console.error("Error checking admin user:", err);
      return;
    }
    if (!row) {
      db.run(`
        INSERT INTO users (name, email, password_hash, is_admin)
        VALUES ('TRÓPICA Admin', ?, ?, 1)
      `, [adminEmail, hash], (err) => {
        if (err) console.error("Error creating admin:", err);
        else console.log(`Admin user created. Email: ${adminEmail}, Password: ${adminPassword}`);
      });
    } else {
      console.log("Admin user already exists.");
    }
  });

  // Seed World Cup 2026 Matches from official fixtures.json
  const fixtures = require('./fixtures.json');

  db.get(`SELECT COUNT(*) as count FROM matches`, (err, row) => {
    if (err) {
      console.error("Error checking matches count:", err);
      return;
    }
    const count = row ? Number(row.count) : 0;
    if (count === 0) {
      console.log("Seeding official fixtures...");
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`
          INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        fixtures.forEach(f => {
          stmt.run([f.match_num, f.group_name, f.home_team, f.away_team, f.match_date, f.is_knockout, f.stage]);
        });

        stmt.finalize((err) => {
          if (err) {
            db.run("ROLLBACK");
            console.error("Error seeding fixtures:", err);
          } else {
            db.run("COMMIT");
            console.log(`Successfully seeded ${fixtures.length} matches.`);
          }
        });
      });
    } else {
      console.log("Matches already seeded. Syncing with official fixtures.json...");
      const syncFixtures = require('./sync_fixtures');
      syncFixtures().catch(err => console.error("Error syncing fixtures:", err));
    }
  });
});
