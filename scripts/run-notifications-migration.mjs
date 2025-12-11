/**
 * Run Notifications Migration
 * Executes the notifications tables SQL migration
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, {
    max: 1,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🔄 Running notifications migration...');

    try {
        // Read the migration file
        const migrationSQL = readFileSync(
            resolve(__dirname, '../migrations/004_add_notifications_tables.sql'),
            'utf-8'
        );

        // Execute the migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Notifications tables created successfully!');
        console.log('   - admin_notifications');
        console.log('   - notification_preferences');
        console.log('   - notification_recipients');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
