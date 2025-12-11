import pg from 'pg';
const { Client } = pg;

const host = 'db.jitehefwfoulueiwzmxw.supabase.co';
const user = 'postgres';
const database = 'postgres';
const port = 5432;

const passwords = [
  'ArunaMurali1234@',
  'ArunaMurali1234',
  'ArunaMurali1234@@'
];

async function test() {
  for (const password of passwords) {
    console.log(`Testing password: ${password}`);
    const client = new Client({
      user,
      host,
      database,
      password,
      port,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! Password is: ${password}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  console.log('All passwords failed.');
  process.exit(1);
}

test();
