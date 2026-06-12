const db = require('../backend/db/db');

db.all('SELECT * FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  console.log(`Total users in DB: ${users.length}`);
  users.forEach(u => {
    console.log(`  - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Points: ${u.points}, Admin: ${u.is_admin}`);
  });

  db.all('SELECT p.*, m.match_num, m.home_team, m.away_team, m.match_date FROM predictions p JOIN matches m ON p.match_id = m.id', (err, predictions) => {
    if (err) {
      console.error('Error fetching predictions:', err);
      return;
    }
    console.log(`\nTotal predictions in DB: ${predictions.length}`);
    predictions.forEach(p => {
      console.log(`  - User ID: ${p.user_id}, Match #${p.match_num} (${p.home_team} vs ${p.away_team}): Pred ${p.predicted_home_score}-${p.predicted_away_score}, Points Earned: ${p.points_earned}`);
    });
    process.exit(0);
  });
});
