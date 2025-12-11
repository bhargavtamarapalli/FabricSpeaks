/**
 * Phase 1 Functional Tests
 * Tests all implemented features to ensure they work correctly
 */

// Load environment variables FIRST
import '../server/env';

import { emailService } from '../server/services/email';
import { loggers } from '../server/utils/logger';

async function testEmailService() {
  console.log('\n=== Testing Email Service ===\n');
  
  try {
    // Test 1: Send a simple test email
    console.log('Test 1: Sending test email...');
    const result = await emailService.send({
      to: 'fabricspeaksofficial@gmail.com',
      subject: 'Phase 1 Test - Email Service Working!',
      html: `
        <h1>✅ Email Service Test Successful</h1>
        <p>This email confirms that the Nodemailer integration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      `,
      text: 'Email Service Test Successful! Timestamp: ' + new Date().toISOString()
    });
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log('   Check fabricspeaksofficial@gmail.com inbox');
    } else {
      console.log('⚠️  Email service not configured or failed to send');
    }

    // Test 2: Send order confirmation email
    console.log('\nTest 2: Sending order confirmation email...');
    const orderResult = await emailService.sendOrderConfirmation(
      'fabricspeaksofficial@gmail.com',
      {
        orderNumber: 'TEST-' + Date.now(),
        customerName: 'Test Customer',
        items: [
          { name: 'Premium Cotton Fabric', quantity: 2, price: '500' },
          { name: 'Silk Blend Material', quantity: 1, price: '1200' }
        ],
        total: '2200',
        shippingAddress: '123 Test Street\nTest City, TS 12345\nIndia'
      }
    );

    if (orderResult) {
      console.log('✅ Order confirmation email sent successfully!');
    } else {
      console.log('⚠️  Order confirmation email failed');
    }

    // Test 3: Send password reset email
    console.log('\nTest 3: Sending password reset email...');
    const resetResult = await emailService.sendPasswordReset(
      'fabricspeaksofficial@gmail.com',
      'test-reset-token-' + Date.now(),
      'Test User'
    );

    if (resetResult) {
      console.log('✅ Password reset email sent successfully!');
    } else {
      console.log('⚠️  Password reset email failed');
    }

    // Test 4: Send low stock alert
    console.log('\nTest 4: Sending low stock alert...');
    const alertResult = await emailService.sendLowStockAlert(
      'fabricspeaksofficial@gmail.com',
      [
        { name: 'Cotton Fabric - White', sku: 'CF-WHT-001', currentStock: 5, threshold: 10 },
        { name: 'Silk Blend - Red', sku: 'SB-RED-002', currentStock: 2, threshold: 10 }
      ]
    );

    if (alertResult) {
      console.log('✅ Low stock alert sent successfully!');
    } else {
      console.log('⚠️  Low stock alert failed');
    }

  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
}

async function testLogging() {
  console.log('\n=== Testing Winston Logging ===\n');
  
  try {
    // Test different log levels
    loggers.info('Test info log', { test: 'data', timestamp: new Date() });
    loggers.warn('Test warning log', { warning: 'This is a test warning' });
    loggers.error('Test error log', new Error('This is a test error'));
    loggers.security('Test security log', { event: 'test_security_event', ip: '127.0.0.1' });
    
    console.log('✅ Logs written successfully!');
    console.log('   Check logs/combined.log and logs/error.log');
    
    // Show recent logs
    const fs = await import('fs');
    const path = await import('path');
    
    const combinedLogPath = path.resolve(process.cwd(), 'logs', 'combined.log');
    if (fs.existsSync(combinedLogPath)) {
      const logs = fs.readFileSync(combinedLogPath, 'utf-8');
      const lastLogs = logs.split('\n').slice(-5).join('\n');
      console.log('\n📄 Last 5 log entries:');
      console.log(lastLogs);
    }
    
  } catch (error) {
    console.error('❌ Logging test failed:', error);
  }
}

async function testHealthChecks() {
  console.log('\n=== Testing Health Check Endpoints ===\n');
  
  try {
    const baseUrl = 'http://127.0.0.1:5000';
    
    // Test 1: Main health check
    console.log('Test 1: GET /api/health');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('Status:', healthResponse.status);
    console.log('Response:', JSON.stringify(healthData, null, 2));
    
    if (healthResponse.status === 200) {
      console.log('✅ Health check endpoint working!');
      console.log(`   Database: ${healthData.checks.database.status}`);
      console.log(`   Overall: ${healthData.status}`);
    }

    // Test 2: Readiness probe
    console.log('\nTest 2: GET /api/health/ready');
    const readyResponse = await fetch(`${baseUrl}/api/health/ready`);
    const readyData = await readyResponse.json();
    
    console.log('Status:', readyResponse.status);
    console.log('Response:', JSON.stringify(readyData, null, 2));
    
    if (readyResponse.status === 200 && readyData.ready) {
      console.log('✅ Readiness probe working!');
    }

    // Test 3: Liveness probe
    console.log('\nTest 3: GET /api/health/live');
    const liveResponse = await fetch(`${baseUrl}/api/health/live`);
    const liveData = await liveResponse.json();
    
    console.log('Status:', liveResponse.status);
    console.log('Response:', JSON.stringify(liveData, null, 2));
    
    if (liveResponse.status === 200 && liveData.alive) {
      console.log('✅ Liveness probe working!');
    }

  } catch (error) {
    console.error('❌ Health check test failed:', error);
  }
}

async function testEnvironmentValidation() {
  console.log('\n=== Testing Environment Validation ===\n');
  
  try {
    const { validateEnv, features } = await import('../server/utils/env-validation');
    
    console.log('Validating environment variables...');
    const env = validateEnv();
    
    console.log('✅ Environment validation passed!');
    console.log('\n📊 Feature Flags:');
    console.log(`   Payment (Razorpay): ${features.isPaymentEnabled() ? '✅' : '❌'}`);
    console.log(`   Email (SMTP): ${features.isEmailEnabled() ? '✅' : '❌'}`);
    console.log(`   Cache (Redis): ${features.isCacheEnabled() ? '✅' : '❌'}`);
    console.log(`   Error Tracking (Sentry): ${features.isSentryEnabled() ? '✅' : '❌'}`);
    console.log(`   WhatsApp: ${features.isWhatsAppEnabled() ? '✅' : '❌'}`);
    console.log(`   Cloudinary: ${features.isCloudinaryEnabled() ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Environment validation test failed:', error);
  }
}

async function testSentryIntegration() {
  console.log('\n=== Testing Sentry Integration ===\n');
  
  try {
    const { captureException, captureMessage } = await import('../server/utils/sentry');
    
    // Test 1: Capture a test message
    console.log('Test 1: Capturing test message...');
    captureMessage('Phase 1 Test: Sentry message capture', 'info', {
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Test message captured (check Sentry dashboard in production)');

    // Test 2: Capture a test error
    console.log('\nTest 2: Capturing test error...');
    const testError = new Error('Phase 1 Test: Sentry error capture');
    captureException(testError, {
      test: true,
      errorType: 'test_error'
    });
    console.log('✅ Test error captured (check Sentry dashboard in production)');
    console.log('   Note: In development, errors are logged but not sent to Sentry');
    
  } catch (error) {
    console.error('❌ Sentry integration test failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║        PHASE 1 FUNCTIONAL TESTING SUITE                ║');
  console.log('║        Testing Production Readiness Features          ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    await testEnvironmentValidation();
    await testLogging();
    await testHealthChecks();
    await testSentryIntegration();
    await testEmailService();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║                 ✅ ALL TESTS COMPLETE                  ║');
    console.log(`║              Duration: ${duration} seconds                    ║`);
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    console.log('\n📧 Check your email (fabricspeaksofficial@gmail.com) for:');
    console.log('   1. Test email');
    console.log('   2. Order confirmation');
    console.log('   3. Password reset');
    console.log('   4. Low stock alert');
    
    console.log('\n📄 Check log files:');
    console.log('   - logs/combined.log');
    console.log('   - logs/error.log');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
