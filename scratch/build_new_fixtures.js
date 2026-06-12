const fs = require('fs');
const path = require('path');

const userMatches = require('./parsed_user_matches.json');
const originalFixtures = require('../backend/db/fixtures.json');

// Map of team to group based on original fixtures
const teamToGroup = {};
originalFixtures.forEach(f => {
  if (f.stage === 'group') {
    teamToGroup[f.home_team] = f.group_name;
    teamToGroup[f.away_team] = f.group_name;
  }
});

// Build new fixtures array
const newFixtures = [];

// Process the 70 user matches
userMatches.forEach((um, idx) => {
  const matchNum = idx + 1;
  
  // Determine group name
  const g1 = teamToGroup[um.home_team];
  const g2 = teamToGroup[um.away_team];
  let groupName = g1 || g2 || 'A';
  if (g1 && g2 && g1 !== g2) {
    groupName = `${g1}-${g2}`;
  }

  // Adjust kickoff times for opening matches (matches 1 and 2) to match their actual times
  let matchDate = um.match_date;
  if (matchNum === 1) {
    matchDate = '2026-06-11 13:00';
  } else if (matchNum === 2) {
    matchDate = '2026-06-11 20:00';
  }

  newFixtures.push({
    match_num: matchNum,
    group_name: groupName,
    home_team: um.home_team,
    away_team: um.away_team,
    match_date: matchDate,
    home_score: um.home_score,
    away_score: um.away_score,
    status: um.status,
    is_knockout: 0,
    stage: 'group'
  });
});

// Append knockout matches (which start from match_num 73 in original fixtures)
const knockoutMatches = originalFixtures.filter(f => f.is_knockout === 1);
knockoutMatches.forEach(km => {
  // Ensure we keep their scores/status if any (usually null/scheduled)
  newFixtures.push({
    match_num: km.match_num,
    group_name: km.group_name,
    home_team: km.home_team,
    away_team: km.away_team,
    match_date: km.match_date,
    home_score: km.home_score !== undefined ? km.home_score : null,
    away_score: km.away_score !== undefined ? km.away_score : null,
    status: km.status || 'scheduled',
    is_knockout: 1,
    stage: km.stage
  });
});

console.log(`Created new fixtures list with ${newFixtures.length} matches:`);
console.log(`  - Group matches: ${newFixtures.filter(f => f.is_knockout === 0).length}`);
console.log(`  - Knockout matches: ${newFixtures.filter(f => f.is_knockout === 1).length}`);

// Write to backend/db/fixtures.json
const fixturesPath = path.join(__dirname, '../backend/db/fixtures.json');
fs.writeFileSync(fixturesPath, JSON.stringify(newFixtures, null, 2), 'utf-8');
console.log(`Successfully wrote fixtures to ${fixturesPath}`);
