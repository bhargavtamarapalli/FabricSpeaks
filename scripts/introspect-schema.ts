import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'fsuser',
  password: 'postgres',
  database: 'fabric_speaks',
});

async function introspectSchema() {
  try {
    await client.connect();
    
    // Get all tables and their columns
    const result = await client.query(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM 
        information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE 
        t.table_schema = 'public'
      ORDER BY 
        t.table_name, c.ordinal_position
    `);
    
    const schema: any = {};
    result.rows.forEach(row => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }
      schema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
      });
    });
    
    console.log('=== LOCAL DATABASE SCHEMA ===\n');
    Object.entries(schema).forEach(([table, cols]: any) => {
      console.log(`TABLE: ${table}`);
      cols.forEach((col: any) => {
        console.log(`  - ${col.column} (${col.type})${col.nullable ? '' : ' NOT NULL'}${col.default ? ` DEFAULT ${col.default}` : ''}`);
      });
      console.log('');
    });
    
    await client.end();
  } catch (err) {
    console.error('Error introspecting schema:', err);
    process.exit(1);
  }
}

introspectSchema();
