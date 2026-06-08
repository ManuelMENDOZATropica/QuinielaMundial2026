const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const isPostgres = !!process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new sqlite3.Database(dbPath);
}

// Convert SQLite syntax to PostgreSQL syntax dynamically
function translateSQL(sql) {
  if (!isPostgres) return sql;
  
  let translated = sql;
  
  // Convert ? placeholders to $1, $2, etc.
  let index = 1;
  translated = translated.replace(/\?/g, () => `$${index++}`);
  
  const trimmed = translated.trim().toUpperCase();
  
  // Auto-append RETURNING id for INSERT queries if not already present
  if (trimmed.startsWith('INSERT') && !trimmed.includes('RETURNING')) {
    translated = `${translated} RETURNING id`;
  }
  
  // SQLite to Postgres schema types translation
  if (trimmed.startsWith('CREATE TABLE')) {
    translated = translated
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/TEXT/gi, 'VARCHAR(255)');
  }
  
  return translated;
}

let isSerializing = false;
let serializationQueue = [];
let isExecutingQueueTask = false;

const db = {
  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    if (isPostgres && isSerializing && !isExecutingQueueTask) {
      serializationQueue.push((next) => {
        isExecutingQueueTask = true;
        db.get(sql, params, (err, result) => {
          isExecutingQueueTask = false;
          if (callback) callback(err, result);
          next();
        });
      });
      return;
    }
    
    const translated = translateSQL(sql);
    
    if (isPostgres) {
      pgPool.query(translated, params, (err, res) => {
        if (err) {
          if (callback) callback(err);
          return;
        }
        if (callback) callback(null, res.rows[0] || null);
      });
    } else {
      sqliteDb.get(translated, params, callback);
    }
  },

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    if (isPostgres && isSerializing && !isExecutingQueueTask) {
      serializationQueue.push((next) => {
        isExecutingQueueTask = true;
        db.all(sql, params, (err, result) => {
          isExecutingQueueTask = false;
          if (callback) callback(err, result);
          next();
        });
      });
      return;
    }
    
    const translated = translateSQL(sql);
    
    if (isPostgres) {
      pgPool.query(translated, params, (err, res) => {
        if (err) {
          if (callback) callback(err);
          return;
        }
        if (callback) callback(null, res.rows);
      });
    } else {
      sqliteDb.all(translated, params, callback);
    }
  },

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    if (isPostgres && isSerializing && !isExecutingQueueTask) {
      serializationQueue.push((next) => {
        isExecutingQueueTask = true;
        db.run(sql, params, function(err) {
          isExecutingQueueTask = false;
          if (callback) callback.call(this, err);
          next();
        });
      });
      return;
    }
    
    const translated = translateSQL(sql);
    
    if (isPostgres) {
      pgPool.query(translated, params, (err, res) => {
        if (err) {
          if (callback) callback(err);
          return;
        }
        
        // Emulate SQLite's "this" callback context for lastID and changes
        const context = {
          lastID: (res.rows && res.rows[0] && res.rows[0].id) || null,
          changes: res.rowCount
        };
        if (callback) callback.call(context, null);
      });
    } else {
      sqliteDb.run(translated, params, callback);
    }
  },

  serialize(fn) {
    if (isPostgres) {
      isSerializing = true;
      serializationQueue = [];
      try {
        fn();
        
        const runNext = () => {
          if (serializationQueue.length === 0) {
            isSerializing = false;
            return;
          }
          const task = serializationQueue.shift();
          task(runNext);
        };
        runNext();
      } catch (err) {
        isSerializing = false;
        console.error("Error in serialized database execution:", err);
      }
    } else {
      sqliteDb.serialize(fn);
    }
  },

  prepare(sql) {
    if (isPostgres) {
      return {
        run(params = [], callback) {
          if (typeof params === 'function') {
            callback = params;
            params = [];
          }
          db.run(sql, params, callback);
        },
        finalize(callback) {
          if (callback) callback(null);
        }
      };
    } else {
      return sqliteDb.prepare(sql);
    }
  }
};

module.exports = db;
