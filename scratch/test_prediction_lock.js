const http = require('http');

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to send requests
function makeRequest(path, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody ? JSON.parse(responseBody) : null
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(data);
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting prediction lock test ---');

  // 1. Register a test user
  const email = `test_${Date.now()}@tropica.me`;
  const registerPayload = {
    name: 'Verification User',
    email: email,
    password: 'password123'
  };

  console.log(`Registering user: ${email}...`);
  const regRes = await makeRequest('/api/auth/register', 'POST', registerPayload);
  
  if (regRes.statusCode !== 201) {
    console.error('Failed to register:', regRes.body);
    process.exit(1);
  }
  console.log('User registered successfully.');

  // Extract JWT token from cookie
  const setCookie = regRes.headers['set-cookie'];
  if (!setCookie) {
    console.error('No cookie returned from registration');
    process.exit(1);
  }
  const tokenCookie = setCookie[0].split(';')[0];
  console.log(`Acquired auth cookie: ${tokenCookie}`);

  // 2. Fetch matches to verify match #1 is in the past
  console.log('Fetching matches...');
  const matchesRes = await makeRequest('/api/matches', 'GET', null, { 'Cookie': tokenCookie });
  if (matchesRes.statusCode !== 200) {
    console.error('Failed to fetch matches:', matchesRes.body);
    process.exit(1);
  }

  const matches = matchesRes.body.matches;
  const match1 = matches.find(m => m.match_num === 1);
  if (!match1) {
    console.error('Match #1 not found in response');
    process.exit(1);
  }

  console.log('Match #1 details:');
  console.log(`- Teams: ${match1.home_team} vs ${match1.away_team}`);
  console.log(`- Date: ${match1.match_date}`);
  console.log(`- Current Prediction: Home ${match1.predicted_home_score}, Away ${match1.predicted_away_score}`);
  
  const kickoffTime = new Date(match1.match_date).getTime();
  const now = Date.now();
  console.log(`- Kickoff time (epoch): ${kickoffTime}`);
  console.log(`- Current time (epoch): ${now}`);
  console.log(`- Is kickoff in the past? ${now > kickoffTime}`);

  // 3. Attempt to predict match #1
  console.log(`Attempting to predict match #1 (id=${match1.id})...`);
  const predictPayload = {
    home_score: 2,
    away_score: 1
  };
  const predictRes = await makeRequest(`/api/matches/${match1.id}/predict`, 'POST', predictPayload, { 'Cookie': tokenCookie });
  
  console.log(`Response status: ${predictRes.statusCode}`);
  console.log('Response body:', predictRes.body);

  if (predictRes.statusCode === 400 && predictRes.body.error && predictRes.body.error.includes('cerradas')) {
    console.log('SUCCESS: Predictions are correctly locked on the backend!');
  } else {
    console.error('FAILURE: Lock check failed or returned unexpected status/message');
    process.exit(1);
  }

  console.log('--- Test completed successfully ---');
}

runTest().catch((err) => {
  console.error('Unhandled error during test:', err);
  process.exit(1);
});
