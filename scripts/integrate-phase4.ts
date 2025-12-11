/**
 * Phase 4 Integration Script
 * Automatically integrates all Phase 4 middleware into existing files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🚀 Phase 4 Integration Script\n');

/**
 * Integrate Phase 4 middleware into server/index.ts
 */
function integrateServerIndex() {
  console.log('📝 Integrating Phase 4 middleware into server/index.ts...');
  
  const filePath = path.join(ROOT_DIR, 'server', 'index.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already integrated
  if (content.includes('initializeSentry')) {
    console.log('   ⚠️  Already integrated, skipping...\n');
    return;
  }

  // Add imports at the top (after existing imports)
  const importSection = `// Phase 4: Security & Monitoring
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './utils/sentry';
import { securityHeaders, additionalSecurityHeaders } from './middleware/securityHeaders';
import { csrfProtection, generateCsrfToken, csrfErrorHandler, getCsrfToken } from './middleware/csrfProtection';

`;

  // Find the line after the last import
  const lastImportIndex = content.lastIndexOf('import ');
  const nextLineAfterImport = content.indexOf('\n', lastImportIndex) + 1;
  
  content = content.slice(0, nextLineAfterImport) + '\n' + importSection + content.slice(nextLineAfterImport);

  // Add Sentry initialization at the very beginning (before app creation)
  const appCreationIndex = content.indexOf('const app = express();');
  const sentryInit = `// Initialize Sentry FIRST
initializeSentry();

`;
  content = content.slice(0, appCreationIndex) + sentryInit + content.slice(appCreationIndex);

  // Add additional security headers after helmet
  const helmetIndex = content.indexOf('app.use(\n  helmet(');
  const helmetEndIndex = content.indexOf(');', helmetIndex) + 3; // Find closing );
  const additionalHeadersCode = `\n// Additional security headers\napp.use(additionalSecurityHeaders);\n`;
  content = content.slice(0, helmetEndIndex) + additionalHeadersCode + content.slice(helmetEndIndex);

  // Add Sentry and CSRF after session middleware
  const sessionIndex = content.indexOf('app.use(session({');
  const sessionEndIndex = content.indexOf('}));', sessionIndex) + 4;
  
  const sentryAndCsrfCode = `

// Sentry request tracking
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

// CSRF Protection (skip for webhooks and safe methods)
const conditionalCsrf = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for webhooks
  if (req.path.startsWith('/api/webhooks')) return next();
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // Apply CSRF protection
  csrfProtection(req, res, next);
};

app.use(conditionalCsrf);
app.use(generateCsrfToken);

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// CSRF error handler
app.use(csrfErrorHandler);
`;

  content = content.slice(0, sessionEndIndex) + sentryAndCsrfCode + content.slice(sessionEndIndex);

  // Add Sentry error handler before global error handler
  const errorHandlerIndex = content.indexOf('app.use(globalErrorHandler);');
  const sentryErrorHandlerCode = `  // Sentry error handler (must be before global error handler)\n  app.use(sentryErrorHandler);\n\n  `;
  content = content.slice(0, errorHandlerIndex) + sentryErrorHandlerCode + content.slice(errorHandlerIndex);

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('   ✅ server/index.ts updated\n');
}

/**
 * Integrate Error Boundary into client/src/main.tsx
 */
function integrateClientMain() {
  console.log('📝 Integrating Error Boundary into client/src/main.tsx...');
  
  const filePath = path.join(ROOT_DIR, 'client', 'src', 'main.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  client/src/main.tsx not found, skipping...\n');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already integrated
  if (content.includes('initializeSentry')) {
    console.log('   ⚠️  Already integrated, skipping...\n');
    return;
  }

  // Add imports
  const importSection = `import { initializeSentry } from './lib/sentry';\nimport ErrorBoundary from './components/ErrorBoundary';\n`;
  
  const firstImportIndex = content.indexOf('import ');
  content = content.slice(0, firstImportIndex) + importSection + content.slice(firstImportIndex);

  // Add Sentry initialization
  const reactDomIndex = content.indexOf('createRoot(');
  const sentryInitCode = `\n// Initialize Sentry\ninitializeSentry();\n\n`;
  content = content.slice(0, reactDomIndex) + sentryInitCode + content.slice(reactDomIndex);

  // Wrap root.render with ErrorBoundary
  const renderIndex = content.indexOf('root.render(');
  const renderEndIndex = content.indexOf(');', renderIndex);
  
  // Find the content between root.render( and );
  const renderContent = content.slice(renderIndex + 12, renderEndIndex).trim();
  
  const wrappedRender = `root.render(
  <ErrorBoundary>
    ${renderContent}
  </ErrorBoundary>
);`;

  content = content.slice(0, renderIndex) + wrappedRender + content.slice(renderEndIndex + 2);

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('   ✅ client/src/main.tsx updated\n');
}

/**
 * Integrate Sentry into admin panel
 */
function integrateAdminMain() {
  console.log('📝 Integrating Sentry into Fabric Speaks Admin/src/main.tsx...');
  
  const filePath = path.join(ROOT_DIR, '..', 'Fabric Speaks Admin', 'src', 'main.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  Admin main.tsx not found, skipping...\n');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already integrated
  if (content.includes('initializeSentry')) {
    console.log('   ⚠️  Already integrated, skipping...\n');
    return;
  }

  // Add import
  const importSection = `import { initializeSentry } from './lib/sentry';\n`;
  const firstImportIndex = content.indexOf('import ');
  content = content.slice(0, firstImportIndex) + importSection + content.slice(firstImportIndex);

  // Add Sentry initialization
  const reactDomIndex = content.indexOf('createRoot(');
  const sentryInitCode = `\n// Initialize Sentry for Admin Panel\ninitializeSentry();\n\n`;
  content = content.slice(0, reactDomIndex) + sentryInitCode + content.slice(reactDomIndex);

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('   ✅ Admin main.tsx updated\n');
}

/**
 * Create .env.example with Phase 4 variables
 */
function createEnvExample() {
  console.log('📝 Creating .env.example with Phase 4 variables...');
  
  const filePath = path.join(ROOT_DIR, '.env.example');
  
  const envContent = `# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fabricspeaks
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session
SESSION_SECRET=generate-with-openssl-rand-base64-32

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Phase 4: Monitoring & Error Tracking
SENTRY_DSN=your-sentry-dsn-here
APP_VERSION=1.0.0
NODE_ENV=development
LOG_LEVEL=info

# Phase 4: Redis (Optional - for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Frontend (create .env in client directory)
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_APP_VERSION=1.0.0
`;

  fs.writeFileSync(filePath, envContent, 'utf-8');
  console.log('   ✅ .env.example created\n');
}

/**
 * Verify all Phase 4 files exist
 */
function verifyFiles() {
  console.log('🔍 Verifying Phase 4 files...\n');
  
  const requiredFiles = [
    'server/db/transaction.ts',
    'server/services/orderService.ts',
    'server/middleware/rateLimiter.ts',
    'server/middleware/csrfProtection.ts',
    'server/middleware/securityHeaders.ts',
    'server/middleware/rbac.ts',
    'server/adminInvitations.ts',
    'server/utils/logger.ts',
    'server/utils/sentry.ts',
    'server/utils/auditLog.ts',
    'client/src/lib/sentry.ts',
    'client/src/components/ErrorBoundary.tsx',
    'tests/load/checkout.k6.js',
  ];

  let allExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(ROOT_DIR, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING!`);
      allExist = false;
    }
  }

  console.log('');
  return allExist;
}

/**
 * Main integration function
 */
async function main() {
  try {
    // Verify files first
    const allFilesExist = verifyFiles();
    
    if (!allFilesExist) {
      console.log('❌ Some Phase 4 files are missing. Please ensure all files are created first.\n');
      process.exit(1);
    }

    // Integrate
    integrateServerIndex();
    integrateClientMain();
    integrateAdminMain();
    createEnvExample();

    console.log('✅ Phase 4 Integration Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Add environment variables from .env.example');
    console.log('   2. Run migrations: psql $DATABASE_URL -f supabase/migrations/20251121_add_transaction_support.sql');
    console.log('   3. Run migrations: psql $DATABASE_URL -f supabase/migrations/20251121_add_admin_invitations.sql');
    console.log('   4. Install dependencies: npm install @sentry/node @sentry/react @sentry/profiling-node winston rate-limit-redis redis');
    console.log('   5. Restart server: npm run dev');
    console.log('   6. Run tests: npx tsx scripts/run-phase4-tests.ts\n');

  } catch (error) {
    console.error('❌ Integration failed:', error);
    process.exit(1);
  }
}

main();
