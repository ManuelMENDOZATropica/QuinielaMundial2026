const fs = require('fs');
const path = require('path');
const db = require('./db');

const URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

function mapTeamName(name) {
  if (name === 'Bosnia & Herzegovina') return 'Bosnia-Herzegovina';
  if (name === 'Curaçao') return 'Curacao';
  if (name === 'Czech Republic') return 'Czechia';
  if (name === 'Turkey') return 'Turkiye';
  return name;
}

function getCdmxDateTime(dateStr, timeStr) {
  // Parse timeStr like "15:00 UTC-4" or "12:00 UTC-7"
  const timeParts = timeStr.split(' ');
  const hhmm = timeParts[0]; // "15:00"
  let offset = '-06:00'; // Default CDMX
  
  if (timeParts.length > 1) {
    const tz = timeParts[1];
    if (tz.startsWith('UTC')) {
      let rawOffset = tz.replace('UTC', '');
      if (rawOffset === '') {
        offset = '+00:00';
      } else {
        if (!rawOffset.includes(':')) {
          const sign = rawOffset.startsWith('-') ? '-' : '+';
          const num = Math.abs(parseFloat(rawOffset));
          const hours = Math.floor(num);
          const minutes = Math.round((num - hours) * 60);
          offset = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
          offset = rawOffset;
        }
      }
    }
  }
  
  const isoStr = `${dateStr}T${hhmm}:00${offset}`;
  const d = new Date(isoStr);
  
  // Convert to CDMX time (UTC-6)
  const cdmxEpoch = d.getTime() - (6 * 60 * 60 * 1000);
  const cdmxDate = new Date(cdmxEpoch);
  
  const year = cdmxDate.getUTCFullYear();
  const month = String(cdmxDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cdmxDate.getUTCDate()).padStart(2, '0');
  const hours = String(cdmxDate.getUTCHours()).padStart(2, '0');
  const minutes = String(cdmxDate.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

async function runMigration() {
  console.log('Fetching official fixtures from openfootball...');
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch fixtures: ${res.statusText}`);
  }
  const data = await res.json();
  console.log(`Fetched ${data.matches.length} matches.`);

  // Load existing database matches to get placeholder teams for knockout stages
  const dbMatches = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM matches ORDER BY match_num', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const dbMatchesMap = {};
  dbMatches.forEach(m => {
    dbMatchesMap[m.match_num] = m;
  });

  console.log('Processing fixtures...');
  const updates = [];

  // Group stage matches are 1 to 72
  // Knockout matches are 73 to 104
  data.matches.forEach((m, index) => {
    const matchNum = index + 1;
    const dateStr = getCdmxDateTime(m.date, m.time);
    const dbMatch = dbMatchesMap[matchNum];

    if (matchNum <= 72) {
      // Group Stage
      const homeTeam = mapTeamName(m.team1);
      const awayTeam = mapTeamName(m.team2);
      const groupName = m.group.replace('Group ', '');
      
      updates.push({
        match_num: matchNum,
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: dateStr,
        group_name: groupName,
        is_knockout: 0,
        stage: 'group'
      });
    } else {
      // Knockout Stage - Keep existing database placeholder teams
      updates.push({
        match_num: matchNum,
        home_team: dbMatch ? dbMatch.home_team : m.team1,
        away_team: dbMatch ? dbMatch.away_team : m.team2,
        match_date: dateStr,
        group_name: dbMatch ? dbMatch.group_name : m.round,
        is_knockout: 1,
        stage: dbMatch ? dbMatch.stage : 'r32'
      });
    }
  });

  console.log('Writing updates to SQLite database...');
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`
        UPDATE matches 
        SET home_team = ?, away_team = ?, match_date = ?, group_name = ?, is_knockout = ?, stage = ? 
        WHERE match_num = ?
      `);

      updates.forEach(u => {
        stmt.run([u.home_team, u.away_team, u.match_date, u.group_name, u.is_knockout, u.stage, u.match_num]);
      });

      stmt.finalize((err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  });

  console.log('Database updated successfully.');

  // Fetch updated matches from database to write fixtures.json
  const updatedMatches = await new Promise((resolve, reject) => {
    db.all('SELECT match_num, group_name, home_team, away_team, match_date, is_knockout, stage FROM matches ORDER BY match_num', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const fixturesPath = path.join(__dirname, 'fixtures.json');
  fs.writeFileSync(fixturesPath, JSON.stringify(updatedMatches, null, 2), 'utf-8');
  console.log(`Wrote fixtures.json successfully to ${fixturesPath}`);

  // Delete predictions that are now invalid because the group matches changed
  // (Since we are re-seeding the group stage, the old predictions on fictional matches are completely irrelevant)
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM predictions WHERE match_id IN (SELECT id FROM matches WHERE stage = \'group\')', (err) => {
      if (err) reject(err);
      else {
        console.log('Deleted old group stage predictions.');
        resolve();
      }
    });
  });
}

runMigration()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
