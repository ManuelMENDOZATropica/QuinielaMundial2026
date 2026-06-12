const db = require('../backend/db/db');
const bcrypt = require('bcryptjs');

function testPoints() {
  console.log('Testing points calculation logic...');

  db.serialize(() => {
    // 1. Create a dummy user
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('testpassword', salt);
    
    db.run(`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Test User Points', 'testuserpoints@tropica.me', ?)
    `, [hash], function(err) {
      if (err) {
        console.error('Failed to insert dummy user:', err);
        process.exit(1);
      }
      const userId = this.lastID;
      console.log(`Created test user with ID: ${userId}`);

      // Get match #1 ID
      db.get('SELECT id, home_score, away_score, status FROM matches WHERE match_num = 1', (err, match) => {
        if (err || !match) {
          console.error('Failed to get match #1:', err || 'not found');
          cleanUp(userId);
          return;
        }

        console.log(`Match #1 details: ${match.home_team || 'Mexico'} ${match.home_score}-${match.away_score} ${match.away_team || 'South Africa'}, Status: ${match.status}`);

        // 2. Insert prediction: 1-0 (exact match)
        db.run(`
          INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
          VALUES (?, ?, 1, 0)
        `, [userId, match.id], function(err) {
          if (err) {
            console.error('Failed to insert prediction:', err);
            cleanUp(userId);
            return;
          }
          const predId = this.lastID;
          console.log(`Created prediction with ID: ${predId} (1-0 prediction)`);

          // 3. Recalculate points for this prediction
          const actualDiff = match.home_score - match.away_score;
          const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);

          db.all('SELECT * FROM predictions WHERE id = ?', [predId], (err, preds) => {
            const p = preds[0];
            const predDiff = p.predicted_home_score - p.predicted_away_score;
            const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);

            let points = 0;
            if (p.predicted_home_score === match.home_score && p.predicted_away_score === match.away_score) {
              points = 3; // Exact score
            } else if (predWinner === actualWinner) {
              points = 1; // Correct outcome
            }

            console.log(`Computed points for prediction: ${points}`);

            db.run('UPDATE predictions SET points_earned = ? WHERE id = ?', [points, predId], (err) => {
              if (err) {
                console.error('Failed to update prediction points:', err);
                cleanUp(userId);
                return;
              }

              // 4. Update user points total in users table
              db.run(`
                UPDATE users
                SET points = (
                  SELECT COALESCE(SUM(points_earned), 0)
                  FROM predictions
                  WHERE predictions.user_id = users.id
                )
                WHERE id = ?
              `, [userId], (err) => {
                if (err) {
                  console.error('Failed to update user points total:', err);
                  cleanUp(userId);
                  return;
                }

                // 5. Verify user points
                db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                  console.log(`Verified User Points: ${user.points} (Expected: 3)`);
                  if (user.points === 3) {
                    console.log('--- TEST PASSED ---');
                  } else {
                    console.log('--- TEST FAILED ---');
                  }
                  cleanUp(userId);
                });
              });
            });
          });
        });
      });
    });
  });
}

function cleanUp(userId) {
  console.log('Cleaning up test data...');
  db.serialize(() => {
    db.run('DELETE FROM predictions WHERE user_id = ?', [userId], (err) => {
      db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        console.log('Cleanup completed.');
        process.exit(0);
      });
    });
  });
}

testPoints();
