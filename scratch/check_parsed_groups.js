const fs = require('fs');

const userMatches = require('./parsed_user_matches.json');
const fixtures = require('../backend/db/fixtures.json');

// Get group map from fixtures
const teamToGroup = {};
fixtures.forEach(f => {
  if (f.stage === 'group') {
    teamToGroup[f.home_team] = f.group_name;
    teamToGroup[f.away_team] = f.group_name;
  }
});

// Let's count matches per group
const groupCounts = {};
userMatches.forEach(um => {
  const g1 = teamToGroup[um.home_team];
  const g2 = teamToGroup[um.away_team];
  const group = g1 || g2 || 'Unknown';
  groupCounts[group] = (groupCounts[group] || 0) + 1;
});

console.log('Matches per group in user list:');
console.log(groupCounts);

console.log('\nGroup K and L teams in user matches:');
userMatches.forEach(um => {
  const g1 = teamToGroup[um.home_team];
  const g2 = teamToGroup[um.away_team];
  if (g1 === 'K' || g2 === 'K' || g1 === 'L' || g2 === 'L') {
    console.log(`Match #${um.match_num}: ${um.home_team} (${g1}) vs ${um.away_team} (${g2}) on ${um.match_date}`);
  }
});
