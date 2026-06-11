const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load environment variables natively (.env.local overrides .env)
const loadEnvFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const envData = fs.readFileSync(filePath, 'utf-8');
    envData.split(/\r?\n/).forEach(line => {
      // Ignore comments and empty lines
      if (line && !line.trim().startsWith('#')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join('=').trim();
          // Remove wrapping quotes if present
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value;
        }
      }
    });
  }
};

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local')); // overrides .env

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'tropica-mundial-2026-secret-key-123456';

// Connect to Database (Supports both SQLite and PostgreSQL dynamically)
const db = require('./db/db');

// Initialize database tables and seed data automatically on startup
require('./db/init_db');

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3005',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
  'https://www.mundial.tropica.me',
  'https://mundial.tropica.me'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.endsWith('.tropica.me') ||
                      origin.endsWith('.onrender.com');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

// Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      });
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
}

// Admin Check Middleware
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    const adminEmails = ['manuel@tropica.me', 'luis@tropica.me'];
    if (!req.user || !adminEmails.includes(req.user.email.toLowerCase().trim())) {
      return res.status(403).json({ error: "Acceso denegado. Se requiere cuenta de administrador autorizada." });
    }
    next();
  });
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  db.run(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `, [name.trim(), email.trim().toLowerCase(), passwordHash], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: "El correo electrónico ya está registrado" });
      }
      return res.status(500).json({ error: "Error al registrar el usuario" });
    }

    const userId = this.lastID;
    const adminEmails = ['manuel@tropica.me', 'luis@tropica.me'];
    const isAdmin = adminEmails.includes(email.trim().toLowerCase()) ? 1 : 0;
    
    // Ensure database reflects actual admin state
    if (isAdmin) {
      db.run(`UPDATE users SET is_admin = 1 WHERE id = ?`, [userId]);
    }

    const token = jwt.sign({ id: userId, name: name.trim(), email: email.trim().toLowerCase(), is_admin: isAdmin }, JWT_SECRET, { expiresIn: '7d' });

    const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: { id: userId, name: name.trim(), email: email.trim().toLowerCase(), is_admin: isAdmin }
    });
  });
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor al buscar usuario" });
    }
    if (!user) {
      return res.status(400).json({ error: "Correo electrónico o contraseña incorrectos" });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Correo electrónico o contraseña incorrectos" });
    }

    const adminEmails = ['manuel@tropica.me', 'luis@tropica.me'];
    const isAdmin = adminEmails.includes(user.email.trim().toLowerCase()) ? 1 : 0;
    
    // Auto-update admin status in database
    if (user.is_admin !== isAdmin) {
      db.run(`UPDATE users SET is_admin = ? WHERE id = ?`, [isAdmin, user.id]);
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, is_admin: isAdmin }, JWT_SECRET, { expiresIn: '7d' });

    const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, is_admin: isAdmin }
    });
  });
});

// Google OAuth Initialization
app.get('/api/auth/google', (req, res) => {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const redirect_uri = process.env.GOOGLE_CALLBACK_URL;
  const scope = 'openid email profile';
  
  if (!client_id || !redirect_uri) {
    return res.status(500).send("Google OAuth no está configurado en el servidor (faltan variables de entorno: GOOGLE_CLIENT_ID o GOOGLE_CALLBACK_URL)");
  }
  
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${encodeURIComponent(client_id)}` + 
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` + 
    `&response_type=code` + 
    `&scope=${encodeURIComponent(scope)}`;
    
  res.redirect(googleUrl);
});

// Google OAuth Callback Handler
app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Falta el código de autorización de Google");
  }
  
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_CALLBACK_URL;
  
  try {
    // Exchange Google Auth code for Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Error exchanging token:", tokenData);
      return res.status(500).send("Error al obtener el token de Google: " + (tokenData.error_description || tokenData.error));
    }
    
    const { access_token } = tokenData;
    
    // Fetch user profile info using access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const userData = await userResponse.json();
    if (!userResponse.ok) {
      console.error("Error getting user info:", userData);
      return res.status(500).send("Error al obtener información de usuario de Google");
    }
    
    const { email, name } = userData;
    if (!email) {
      return res.status(400).send("No se pudo obtener el correo de Google");
    }
    
    // Check if user exists or register them
    db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()], (err, user) => {
      if (err) {
        console.error("Database error looking up user:", err);
        return res.status(500).send("Error interno al buscar el usuario");
      }
      
      const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
      
      const adminEmails = ['manuel@tropica.me', 'luis@tropica.me'];
      const isAdmin = adminEmails.includes(email.toLowerCase().trim()) ? 1 : 0;

      if (user) {
        // Log in user and update database admin status if mismatch
        if (user.is_admin !== isAdmin) {
          db.run(`UPDATE users SET is_admin = ? WHERE id = ?`, [isAdmin, user.id]);
        }

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email, is_admin: isAdmin },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.cookie('token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        return res.redirect('/#matches');
      } else {
        // Register new user with a random hash (since they authenticate via Google)
        const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);
        
        db.run(`
          INSERT INTO users (name, email, password_hash, is_admin)
          VALUES (?, ?, ?, ?)
        `, [name, email.toLowerCase().trim(), randomPassword, isAdmin], function(err) {
          if (err) {
            console.error("Error creating user via Google:", err);
            return res.status(500).send("Error al registrar el usuario nuevo");
          }
          
          const newUserId = this.lastID;
          const token = jwt.sign(
            { id: newUserId, name: name, email: email.toLowerCase().trim(), is_admin: isAdmin },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          
          return res.redirect('/#matches');
        });
      }
    });
    
  } catch (error) {
    console.error("Error in Google OAuth Callback:", error);
    res.status(500).send("Error interno del servidor durante el inicio de sesión");
  }
});

// Logout User
app.post('/api/auth/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ success: true, message: "Sesión cerrada correctamente" });
});

// Get Current User
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ user: null });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const isProduction = process.env.NODE_ENV === 'production' || (!req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      });
      return res.json({ user: null });
    }
    const adminEmails = ['manuel@tropica.me', 'luis@tropica.me'];
    decoded.is_admin = adminEmails.includes(decoded.email.toLowerCase().trim()) ? 1 : 0;
    res.json({ user: decoded });
  });
});

// ==========================================
// MATCHES & PREDICTIONS ENDPOINTS
// ==========================================

// Get All Matches with User's Predictions
app.get('/api/matches', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT m.id, m.match_num, m.group_name, m.home_team, m.away_team, m.match_date, m.status, 
           m.home_score, m.away_score, m.is_knockout, m.stage,
           p.predicted_home_score, p.predicted_away_score, p.points_earned
    FROM matches m
    LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
    ORDER BY m.match_date ASC, m.match_num ASC
  `, [userId], (err, matches) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener partidos" });
    }
    res.json({ matches });
  });
});

// Save or Update Prediction
app.post('/api/matches/:id/predict', authenticateToken, (req, res) => {
  const matchId = req.params.id;
  const userId = req.user.id;
  const { home_score, away_score } = req.body;

  if (home_score === undefined || away_score === undefined || home_score < 0 || away_score < 0) {
    return res.status(400).json({ error: "Puntajes inválidos" });
  }

  // Get Match to verify kickoff
  db.get(`SELECT * FROM matches WHERE id = ?`, [matchId], (err, match) => {
    if (err || !match) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    // Predictions lock at kickoff date (CDMX time, UTC-6)
    const kickoffTime = new Date(match.match_date.replace(' ', 'T') + '-06:00').getTime();
    const currentTime = Date.now(); // Milliseconds since epoch

    if (match.status !== 'scheduled' || currentTime >= kickoffTime) {
      return res.status(400).json({ error: "Las predicciones para este partido están cerradas (el partido ya comenzó)" });
    }

    // Safe upsert (Compatible with all SQLite versions via Select then Insert/Update)
    db.get(`SELECT id FROM predictions WHERE user_id = ? AND match_id = ?`, [userId, matchId], (err, prediction) => {
      if (err) {
        return res.status(500).json({ error: "Error en base de datos" });
      }

      if (prediction) {
        // Update
        db.run(`
          UPDATE predictions 
          SET predicted_home_score = ?, predicted_away_score = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [home_score, away_score, prediction.id], (err) => {
          if (err) return res.status(500).json({ error: "Error al actualizar predicción" });
          res.json({ success: true, message: "Predicción actualizada" });
        });
      } else {
        // Insert
        db.run(`
          INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
          VALUES (?, ?, ?, ?)
        `, [userId, matchId, home_score, away_score], (err) => {
          if (err) return res.status(500).json({ error: "Error al guardar predicción" });
          res.json({ success: true, message: "Predicción guardada" });
        });
      }
    });
  });
});

// ==========================================
// LEADERBOARD ENDPOINT
// ==========================================

// Get Leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  db.all(`
    SELECT u.id, u.name, u.points,
           SUM(CASE WHEN p.points_earned = 3 THEN 1 ELSE 0 END) as exact_count,
           SUM(CASE WHEN p.points_earned = 1 THEN 1 ELSE 0 END) as outcome_count,
           SUM(CASE WHEN p.points_earned = 0 AND p.points_earned IS NOT NULL AND m.status = 'finished' THEN 1 ELSE 0 END) as wrong_count
    FROM users u
    LEFT JOIN predictions p ON u.id = p.user_id
    LEFT JOIN matches m ON p.match_id = m.id
    GROUP BY u.id
    ORDER BY u.points DESC, exact_count DESC, u.name ASC
  `, [], (err, leaderboard) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener tabla de clasificación" });
    }
    res.json({ leaderboard });
  });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Update official score and recalculate points
app.post('/api/admin/matches/:id/score', requireAdmin, (req, res) => {
  const matchId = req.params.id;
  const { home_score, away_score, status } = req.body; // status: 'finished'

  if (home_score === undefined || away_score === undefined || home_score < 0 || away_score < 0 || status !== 'finished') {
    return res.status(400).json({ error: "Marcadores inválidos o estado inválido (debe ser 'finished')" });
  }

  db.serialize(() => {
    // 1. Update Match
    db.run(`
      UPDATE matches 
      SET home_score = ?, away_score = ?, status = ?
      WHERE id = ?
    `, [home_score, away_score, status, matchId], function(err) {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar marcador oficial" });
      }

      // Calculate actual winner sign: 1 (home win), -1 (away win), 0 (draw)
      const actualDiff = home_score - away_score;
      const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);

      // 2. Retrieve and Update all Predictions for this match
      db.all(`SELECT * FROM predictions WHERE match_id = ?`, [matchId], (err, predictions) => {
        if (err) return res.status(500).json({ error: "Error al procesar predicciones" });

        const stmt = db.prepare(`UPDATE predictions SET points_earned = ? WHERE id = ?`);

        predictions.forEach(p => {
          const predDiff = p.predicted_home_score - p.predicted_away_score;
          const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
          
          let points = 0;
          if (p.predicted_home_score === home_score && p.predicted_away_score === away_score) {
            points = 3; // Exact score
          } else if (predWinner === actualWinner) {
            points = 1; // Correct outcome (win/draw/loss) but incorrect score
          }

          stmt.run([points, p.id]);
        });

        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: "Error al actualizar puntajes de predicción" });

          // 3. Update User points sums cached in users table
          db.run(`
            UPDATE users
            SET points = (
              SELECT COALESCE(SUM(points_earned), 0)
              FROM predictions
              WHERE predictions.user_id = users.id
            )
          `, (err) => {
            if (err) return res.status(500).json({ error: "Error al recalcular puntos de los usuarios" });

            res.json({ success: true, message: "Marcador guardado y clasificaciones actualizadas" });
          });
        });
      });
    });
  });
});

// Development / Demo Helper: Seed fake users and predictions
app.post('/api/admin/system/fill-random', requireAdmin, (req, res) => {
  // Extra safety check: verify request originates from local interface
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ error: "Este endpoint de simulación sólo está disponible en entorno local." });
  }

  const fakeNames = ["Benjamín Delvingt", "Eugenio Siritto", "Lucas Bellocchio", "Sofía Cruz", "Alejandro Pérez", "Mateo Gómez", "Valentina Ortiz", "Lucía Díaz", "Daniel Silva", "Mariana Torres"];
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("123456", salt);

  db.serialize(() => {
    // Get all matches
    db.all(`SELECT id, match_date FROM matches`, [], (err, matches) => {
      if (err || !matches) return res.status(500).json({ error: "Error al cargar partidos" });

      let usersCreated = 0;
      
      fakeNames.forEach((name, idx) => {
        const email = `${name.toLowerCase().replace(/\s+/g, '')}@tropica.me`;
        
        db.run(`
          INSERT INTO users (name, email, password_hash, points)
          VALUES (?, ?, ?, 0)
        `, [name, email, hash], function(err) {
          if (!err) {
            const newUserId = this.lastID;
            usersCreated++;

            // Create random predictions for all matches
            matches.forEach(m => {
              const predHome = Math.floor(Math.random() * 4); // 0-3
              const predAway = Math.floor(Math.random() * 4); // 0-3
              
              db.run(`
                INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
                VALUES (?, ?, ?, ?)
              `, [newUserId, m.id, predHome, predAway]);
            });
          }
        });
      });

      // Recalculate leaderboard points for everyone
      setTimeout(() => {
        res.json({ success: true, message: `Se crearon ${usersCreated} usuarios de prueba con predicciones aleatorias para todos los partidos.` });
      }, 1500);
    });
  });
});
// Local Development Debug Endpoint: Fill random predictions for current user (first 72 group stage matches)
app.post('/api/dev/fill-my-predictions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Extra safety check: verify request originates from local interface
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ error: "Este endpoint de depuración sólo está disponible en entorno local." });
  }

  // Get all group stage matches (first 72 matches)
  db.all(`SELECT id FROM matches WHERE stage = 'group' LIMIT 72`, [], (err, groupMatches) => {
    if (err || !groupMatches) {
      return res.status(500).json({ error: "Error al obtener partidos de grupo" });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      // Delete existing group stage predictions for this user to avoid conflicts
      db.run(`DELETE FROM predictions WHERE user_id = ? AND match_id IN (SELECT id FROM matches WHERE stage = 'group' LIMIT 72)`, [userId]);

      const stmt = db.prepare(`
        INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
        VALUES (?, ?, ?, ?)
      `);

      groupMatches.forEach(m => {
        const predHome = Math.floor(Math.random() * 4); // 0-3
        const predAway = Math.floor(Math.random() * 4); // 0-3
        stmt.run([userId, m.id, predHome, predAway]);
      });

      stmt.finalize(() => {
        db.run("COMMIT", (err) => {
          if (err) {
            return res.status(500).json({ error: "Error al guardar predicciones" });
          }
          res.json({ success: true, message: "Fase de grupos llenada aleatoriamente." });
        });
      });
    });
  });
});


// Temporary Environment Debug Endpoint
app.get('/api/debug-env', (req, res) => {
  res.json({
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HAS_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID
  });
});

// Fallback to Single Page App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
