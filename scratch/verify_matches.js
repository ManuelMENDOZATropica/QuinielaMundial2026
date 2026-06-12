const db = require('../backend/db/db');

db.get('SELECT * FROM matches WHERE match_num = 1', (err, row) => {
  if (err) {
    console.error('Error fetching match #1:', err);
    process.exit(1);
  }
  console.log('Match #1 (Mexico vs South Africa):');
  console.log(JSON.stringify(row, null, 2));

  db.all('SELECT stage, count(*) as count FROM matches GROUP BY stage', (err, rows) => {
    if (err) {
      console.error('Error counting matches by stage:', err);
      process.exit(1);
    }
    console.log('\nMatches by stage:');
    rows.forEach(r => console.log(`  - Stage: ${r.stage}, Count: ${r.count}`));

    db.get('SELECT COUNT(*) as count FROM matches WHERE status = \'finished\'', (err, finishedRow) => {
      console.log(`\nFinished matches count: ${finishedRow.count}`);
      process.exit(0);
    });
  });
});
