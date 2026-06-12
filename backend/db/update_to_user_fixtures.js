const fs = require('fs');
const path = require('path');
const db = require('./db');

const fixtures = require('./fixtures.json');

function runMigration() {
  console.log('Starting migration to update fixtures in SQLite database...');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. Get all existing matches to compare details
    db.all('SELECT * FROM matches', [], (err, dbMatches) => {
      if (err) {
        console.error('Error loading matches from database:', err);
        db.run('ROLLBACK');
        process.exit(1);
      }

      const dbMatchMap = {};
      dbMatches.forEach(m => {
        dbMatchMap[m.match_num] = m;
      });

      let predictionsDeletedCount = 0;
      let matchesUpdatedCount = 0;
      let matchesInsertedCount = 0;

      // Statements for update and insert
      const updateStmt = db.prepare(`
        UPDATE matches
        SET home_team = ?, away_team = ?, match_date = ?, group_name = ?, is_knockout = ?, stage = ?, status = ?, home_score = ?, away_score = ?
        WHERE match_num = ?
      `);

      const insertStmt = db.prepare(`
        INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage, status, home_score, away_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Keep track of match nums in fixtures
      const fixtureMatchNums = new Set(fixtures.map(f => f.match_num));

      // 2. Process all fixtures
      fixtures.forEach(f => {
        const dbMatch = dbMatchMap[f.match_num];
        const status = f.status || 'scheduled';
        const homeScore = f.home_score !== undefined ? f.home_score : null;
        const awayScore = f.away_score !== undefined ? f.away_score : null;

        if (dbMatch) {
          // Compare teams and date to see if details changed
          const teamsChanged = dbMatch.home_team !== f.home_team || dbMatch.away_team !== f.away_team;
          const dateChanged = dbMatch.match_date !== f.match_date;

          if (teamsChanged || dateChanged) {
            console.log(`Match #${f.match_num} changed:`);
            if (teamsChanged) console.log(`  - Teams: DB (${dbMatch.home_team} vs ${dbMatch.away_team}) -> New (${f.home_team} vs ${f.away_team})`);
            if (dateChanged) console.log(`  - Date: DB (${dbMatch.match_date}) -> New (${f.match_date})`);

            // Delete predictions for this match because it was rescheduled or teams changed
            db.run('DELETE FROM predictions WHERE match_id = ?', [dbMatch.id], function(err) {
              if (err) console.error(`Failed to delete predictions for match #${f.match_num}:`, err);
              else if (this.changes > 0) {
                console.log(`  - Deleted ${this.changes} prediction(s) for this match.`);
                predictionsDeletedCount += this.changes;
              }
            });
          }

          // Update match in-place
          updateStmt.run([
            f.home_team,
            f.away_team,
            f.match_date,
            f.group_name,
            f.is_knockout,
            f.stage,
            status,
            homeScore,
            awayScore,
            f.match_num
          ], (err) => {
            if (err) console.error(`Error updating match #${f.match_num}:`, err);
          });
          matchesUpdatedCount++;
        } else {
          // Insert match
          insertStmt.run([
            f.match_num,
            f.group_name,
            f.home_team,
            f.away_team,
            f.match_date,
            f.is_knockout,
            f.stage,
            status,
            homeScore,
            awayScore
          ], (err) => {
            if (err) console.error(`Error inserting match #${f.match_num}:`, err);
          });
          matchesInsertedCount++;
        }
      });

      updateStmt.finalize();
      insertStmt.finalize();

      // 3. Delete any extra group stage matches that are not in fixtures (specifically matches 71 and 72)
      db.all('SELECT * FROM matches WHERE stage = \'group\'', [], (err, finalDbMatches) => {
        if (err) {
          console.error('Error fetching final matches list:', err);
          db.run('ROLLBACK');
          process.exit(1);
        }

        let matchesDeletedCount = 0;
        finalDbMatches.forEach(m => {
          if (!fixtureMatchNums.has(m.match_num)) {
            console.log(`Match #${m.match_num} (${m.home_team} vs ${m.away_team}) is not in new fixtures. Deleting...`);
            
            // Delete predictions first
            db.run('DELETE FROM predictions WHERE match_id = ?', [m.id], function(err) {
              if (err) console.error(`Failed to delete predictions for deleted match #${m.match_num}:`, err);
              else if (this.changes > 0) {
                predictionsDeletedCount += this.changes;
              }
            });

            // Delete match
            db.run('DELETE FROM matches WHERE id = ?', [m.id], function(err) {
              if (err) console.error(`Failed to delete match #${m.match_num}:`, err);
              else {
                matchesDeletedCount++;
              }
            });
          }
        });

        // 4. Recalculate predictions points for finalized matches
        // Get all finished matches to evaluate predictions
        db.all('SELECT * FROM matches WHERE status = \'finished\'', [], (err, finishedMatches) => {
          if (err) {
            console.error('Error loading finished matches:', err);
            db.run('ROLLBACK');
            process.exit(1);
          }

          console.log(`\nEvaluating predictions for ${finishedMatches.length} finished matches...`);
          
          let predictionsEvaluated = 0;
          const predStmt = db.prepare('UPDATE predictions SET points_earned = ? WHERE id = ?');

          finishedMatches.forEach(fm => {
            const actualDiff = fm.home_score - fm.away_score;
            const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);

            db.all('SELECT * FROM predictions WHERE match_id = ?', [fm.id], (err, preds) => {
              if (err) {
                console.error(`Error loading predictions for match #${fm.match_num}:`, err);
                return;
              }

              preds.forEach(p => {
                const predDiff = p.predicted_home_score - p.predicted_away_score;
                const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);

                let points = 0;
                if (p.predicted_home_score === fm.home_score && p.predicted_away_score === fm.away_score) {
                  points = 3; // Exact score
                } else if (predWinner === actualWinner) {
                  points = 1; // Correct outcome
                }

                predStmt.run([points, p.id]);
                predictionsEvaluated++;
              });
            });
          });

          // Wait a bit to ensure async db runs finish, then commit
          setTimeout(() => {
            predStmt.finalize();

            // 5. Update user point totals
            db.run(`
              UPDATE users
              SET points = (
                SELECT COALESCE(SUM(points_earned), 0)
                FROM predictions
                WHERE predictions.user_id = users.id
              )
            `, (err) => {
              if (err) {
                console.error('Error updating user points:', err);
                db.run('ROLLBACK');
                process.exit(1);
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Failed to commit transaction:', err);
                  db.run('ROLLBACK');
                  process.exit(1);
                }

                console.log('\nMigration completed successfully!');
                console.log(`  - Matches updated in-place: ${matchesUpdatedCount}`);
                console.log(`  - Matches inserted: ${matchesInsertedCount}`);
                console.log(`  - Matches deleted: ${matchesDeletedCount}`);
                console.log(`  - Predictions deleted: ${predictionsDeletedCount}`);
                console.log(`  - Predictions evaluated: ${predictionsEvaluated}`);

                // Print out the total count of matches in the DB now
                db.get('SELECT COUNT(*) as count FROM matches', (err, row) => {
                  console.log(`\nTotal matches in DB now: ${row.count}`);
                  
                  db.get('SELECT COUNT(*) as count FROM matches WHERE stage = \'group\'', (err, rowGroup) => {
                    console.log(`  - Group matches: ${rowGroup.count}`);
                    
                    db.get('SELECT COUNT(*) as count FROM matches WHERE is_knockout = 1', (err, rowKnock) => {
                      console.log(`  - Knockout matches: ${rowKnock.count}`);
                      process.exit(0);
                    });
                  });
                });
              });
            });
          }, 1000);
        });
      });
    });
  });
}

runMigration();
