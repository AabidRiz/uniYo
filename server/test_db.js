const { Client } = require('pg');

const passwordsToTry = ['postgres', 'root', 'admin', '1234', 'password', ''];

async function testConnection() {
  console.log('Testing PostgreSQL connections on localhost:5432...');
  
  for (const pwd of passwordsToTry) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'postgres',
      connectionTimeoutMillis: 2000
    });

    try {
      await client.connect();
      console.log(`SUCCESS: Connected to PostgreSQL with user 'postgres' and password '${pwd}'!`);
      await client.end();
      return pwd;
    } catch (err) {
      console.log(`Attempt with password '${pwd}' failed: ${err.message}`);
    }
  }

  console.log('Could not connect with standard default passwords.');
  return null;
}

testConnection();
