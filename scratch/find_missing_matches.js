const fs = require('fs');

const userMatches = require('./parsed_user_matches.json');
const fixtures = require('../backend/db/fixtures.json').filter(f => f.stage === 'group');

console.log(`User matches count: ${userMatches.length}`);
console.log(`DB/Fixtures matches count: ${fixtures.length}`);

// We want to find which matches are present in fixtures but not in userMatches, and vice versa.
// A match is identified by the pair of teams (unordered).
function matchKey(home, away) {
  return [home, away].sort().join(' vs ');
}

const userKeys = new Set(userMatches.map(m => matchKey(m.home_team, m.away_team)));
const fixtureKeys = new Set(fixtures.map(f => matchKey(f.home_team, f.away_team)));

console.log('\n--- Matches in DB/Fixtures but NOT in User list: ---');
fixtures.forEach(f => {
  const key = matchKey(f.home_team, f.away_team);
  if (!userKeys.has(key)) {
    console.log(`Match #${f.match_num}: ${f.home_team} vs ${f.away_team} (Group ${f.group_name})`);
  }
});

console.log('\n--- Matches in User list but NOT in DB/Fixtures: ---');
userMatches.forEach(um => {
  const key = matchKey(um.home_team, um.away_team);
  if (!fixtureKeys.has(key)) {
    console.log(`User Match #${um.match_num}: ${um.home_team} vs ${um.away_team}`);
  }
});

// Let's also check if there are duplicate matches in the user list
const userKeyCounts = {};
userMatches.forEach(um => {
  const key = matchKey(um.home_team, um.away_team);
  userKeyCounts[key] = (userKeyCounts[key] || 0) + 1;
});

console.log('\n--- Duplicate Matches in User list: ---');
let hasDuplicates = false;
for (const key in userKeyCounts) {
  if (userKeyCounts[key] > 1) {
    console.log(`  - ${key} appears ${userKeyCounts[key]} times`);
    hasDuplicates = true;
  }
}
if (!hasDuplicates) console.log('  None');
