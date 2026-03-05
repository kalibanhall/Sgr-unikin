const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ body: data, headers: res.headers, status: res.statusCode }));
    }).on('error', reject);
  });
}

function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: headers,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ body: data, headers: res.headers, status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function testLogin() {
  console.log('=== Test connexion Super Admin ===\n');
  
  // Step 1: Get CSRF token
  const csrfRes = await httpGet('https://sgr.unikin.ac.cd/api/auth/csrf');
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;
  const cookies = (csrfRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log('1. CSRF token obtenu');
  
  // Step 2: Login
  const body = `email=garaphmutwal%40yahoo.fr&password=${encodeURIComponent('Admin@SGR2026!')}&csrfToken=${csrfToken}`;
  const loginRes = await httpPost(
    'https://sgr.unikin.ac.cd/api/auth/callback/credentials',
    body,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': String(Buffer.byteLength(body)),
      'Cookie': cookies,
    }
  );
  
  console.log('2. Resultat login:');
  console.log('   Status:', loginRes.status);
  console.log('   Location:', loginRes.headers.location);
  
  const setCookies = loginRes.headers['set-cookie'] || [];
  const hasSession = setCookies.some(c => c.includes('session-token'));
  console.log('   Session cookie:', hasSession ? 'OUI' : 'NON');
  
  if (hasSession) {
    console.log('\n   CONNEXION REUSSIE!');
  } else if (loginRes.headers.location && loginRes.headers.location.includes('error=')) {
    console.log('\n   CONNEXION ECHOUEE:', loginRes.headers.location);
  }
  
  setCookies.forEach(c => console.log('   Cookie:', c.split(';')[0]));
}

testLogin().catch(e => console.error('Erreur:', e.message));
