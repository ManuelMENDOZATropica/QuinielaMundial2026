const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Connect to Database (Support dynamic path for Render persistent disk)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

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
  `);

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
      home_score INTEGER DEFAULT NULL,
      away_score INTEGER DEFAULT NULL,
      is_knockout INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'group' -- 'group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'
    )
  `);

  // Predictions table
  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      predicted_home_score INTEGER NOT NULL,
      predicted_away_score INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, match_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  console.log("Tables created successfully.");

  // Seed Admin User
  const adminEmail = 'admin@tropica.me';
  const adminPassword = 'tropica2026admin';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (!row) {
      db.run(`
        INSERT INTO users (name, email, password_hash, is_admin)
        VALUES ('Trópica Admin', ?, ?, 1)
      `, [adminEmail, hash], (err) => {
        if (err) console.error("Error creating admin:", err);
        else console.log(`Admin user created. Email: ${adminEmail}, Password: ${adminPassword}`);
      });
    } else {
      console.log("Admin user already exists.");
    }
  });

  // Seed World Cup 2026 Matches
  const groups = {
    A: ["Mexico", "South Korea", "South South Africa", "Czechia"], // Adjusted name check to South Africa later
    B: ["Canada", "Switzerland", "Qatar", "Bosnia-Herzegovina"],
    C: ["Brazil", "Morocco", "Scotland", "Haiti"],
    D: ["USA", "Paraguay", "Australia", "Turkiye"],
    E: ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
    F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
    G: ["Belgium", "Iran", "Egypt", "New Zealand"],
    H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    I: ["France", "Senegal", "Norway", "Iraq"],
    J: ["Argentina", "Austria", "Algeria", "Jordan"],
    K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    L: ["England", "Croatia", "Panama", "Ghana"]
  };
  
  // Let's fix group A South Africa
  groups.A = ["Mexico", "South Korea", "South Africa", "Czechia"];

  db.get(`SELECT COUNT(*) as count FROM matches`, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (row.count === 0) {
      console.log("Seeding fixtures...");
      let matchNum = 1;
      const groupNames = Object.keys(groups);

      groupNames.forEach((groupName, groupIdx) => {
        const teams = groups[groupName];
        // Generate Round Robin fixtures for 4 teams
        // Round 1: T1 vs T3, T2 vs T4
        // Round 2: T1 vs T2, T4 vs T3
        // Round 3: T4 vs T1, T2 vs T3
        const rounds = [
          [[0, 2], [1, 3]],
          [[0, 1], [3, 2]],
          [[3, 0], [1, 2]]
        ];

        rounds.forEach((round, roundIdx) => {
          // Stagger match dates
          // Round 1: June 11 + Math.floor(groupIdx / 2)
          // Round 2: June 16 + Math.floor(groupIdx / 2)
          // Round 3: June 21 + Math.floor(groupIdx / 2)
          let baseDay;
          if (roundIdx === 0) baseDay = 11 + Math.floor(groupIdx / 2);
          else if (roundIdx === 1) baseDay = 16 + Math.floor(groupIdx / 2);
          else baseDay = 21 + Math.floor(groupIdx / 2);

          const dateStr = `2026-06-${String(baseDay).padStart(2, '0')} 18:00`;

          round.forEach(([homeIdx, awayIdx]) => {
            const home = teams[homeIdx];
            const away = teams[awayIdx];

            db.run(`
              INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, stage)
              VALUES (?, ?, ?, ?, ?, 'group')
            `, [matchNum, groupName, home, away, dateStr], (err) => {
              if (err) console.error(`Error seeding match ${matchNum}:`, err);
            });
            matchNum++;
          });
        });
      });

      // Insert some placeholder knockout stages
      // Round of 32 placeholders (16 matches)
      const knockoutDates = [
        "2026-06-28 15:00", "2026-06-28 19:00", "2026-06-29 15:00", "2026-06-29 19:00",
        "2026-06-30 15:00", "2026-06-30 19:00", "2026-07-01 15:00", "2026-07-01 19:00",
        "2026-07-02 15:00", "2026-07-02 19:00", "2026-07-03 15:00", "2026-07-03 19:00",
        "2026-07-04 15:00", "2026-07-04 19:00", "2026-07-05 15:00", "2026-07-05 19:00"
      ];

      for (let k = 0; k < 16; k++) {
        db.run(`
          INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
          VALUES (?, 'Round of 32', ?, ?, ?, 1, 'r32')
        `, [matchNum, `Ganador R32 - P${k+1}`, `Ganador R32 - Q${k+1}`, knockoutDates[k]], (err) => {
          if (err) console.error(`Error seeding knockout match ${matchNum}:`, err);
        });
        matchNum++;
      }

      // Round of 16 placeholders (8 matches)
      const r16Dates = [
        "2026-07-07 15:00", "2026-07-07 19:00", "2026-07-08 15:00", "2026-07-08 19:00",
        "2026-07-09 15:00", "2026-07-09 19:00", "2026-07-10 15:00", "2026-07-10 19:00"
      ];
      for (let k = 0; k < 8; k++) {
        db.run(`
          INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
          VALUES (?, 'Round of 16', ?, ?, ?, 1, 'r16')
        `, [matchNum, `Ganador R16 - P${k+1}`, `Ganador R16 - Q${k+1}`, r16Dates[k]], (err) => {
          if (err) console.error(`Error seeding knockout match ${matchNum}:`, err);
        });
        matchNum++;
      }

      // Quarterfinals placeholders (4 matches)
      const qfDates = [
        "2026-07-12 15:00", "2026-07-12 19:00", "2026-07-13 15:00", "2026-07-13 19:00"
      ];
      for (let k = 0; k < 4; k++) {
        db.run(`
          INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
          VALUES (?, 'Quarterfinals', ?, ?, ?, 1, 'qf')
        `, [matchNum, `Ganador QF - P${k+1}`, `Ganador QF - Q${k+1}`, qfDates[k]], (err) => {
          if (err) console.error(`Error seeding knockout match ${matchNum}:`, err);
        });
        matchNum++;
      }

      // Semifinals placeholders (2 matches)
      const sfDates = [
        "2026-07-15 19:00", "2026-07-16 19:00"
      ];
      for (let k = 0; k < 2; k++) {
        db.run(`
          INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
          VALUES (?, 'Semifinals', ?, ?, ?, 1, 'sf')
        `, [matchNum, `Ganador SF - P${k+1}`, `Ganador SF - Q${k+1}`, sfDates[k]], (err) => {
          if (err) console.error(`Error seeding knockout match ${matchNum}:`, err);
        });
        matchNum++;
      }

      // Third Place Match
      db.run(`
        INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
        VALUES (?, 'Third Place Match', 'Perdedor SF1', 'Perdedor SF2', '2026-07-18 15:00', 1, '3rd')
      `, [matchNum], (err) => {
        if (err) console.error(`Error seeding 3rd place match:`, err);
      });
      matchNum++;

      // Final Match
      db.run(`
        INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage)
        VALUES (?, 'Final', 'Ganador SF1', 'Ganador SF2', '2026-07-19 16:00', 1, 'final')
      `, [matchNum], (err) => {
        if (err) console.error(`Error seeding final match:`, err);
      });
      matchNum++;

      console.log(`Successfully seeded ${matchNum - 1} matches.`);
    } else {
      console.log("Matches already seeded.");
    }
  });
});
