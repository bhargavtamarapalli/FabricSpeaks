#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all Phase 4 tests and generates a report
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  log(`\n${colors.bright}Running: ${description}${colors.reset}`);
  log(`Command: ${command}`, colors.blue);
  
  try {
    execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
    log(`✅ ${description} - PASSED`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, colors.red);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('  PHASE 4 TEST SUITE', colors.bright);
  log('  Production Blockers - Automated Testing', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  const results: { name: string; passed: boolean }[] = [];

  // 1. Unit Tests
  log('\n📦 Running Unit Tests...', colors.yellow);
  const unitTestsPassed = runCommand(
    'npm run test -- tests/unit',
    'Unit Tests (Transaction Utilities)'
  );
  results.push({ name: 'Unit Tests', passed: unitTestsPassed });

  // 2. Integration Tests
  log('\n🔗 Running Integration Tests...', colors.yellow);
  const integrationTestsPassed = runCommand(
    'npm run test:integration',
    'Integration Tests (Race Conditions)'
  );
  results.push({ name: 'Integration Tests', passed: integrationTestsPassed });

  // 3. E2E Tests
  log('\n🌐 Running E2E Tests...', colors.yellow);
  const e2eTestsPassed = runCommand(
    'npm run test:e2e',
    'E2E Tests (Payment Flow)'
  );
  results.push({ name: 'E2E Tests', passed: e2eTestsPassed });

  // 4. Type Checking
  log('\n📝 Running Type Checking...', colors.yellow);
  const typeCheckPassed = runCommand(
    'npm run check',
    'TypeScript Type Checking'
  );
  results.push({ name: 'Type Checking', passed: typeCheckPassed });

  // Generate Report
  log('\n' + '='.repeat(60), colors.bright);
  log('  TEST RESULTS SUMMARY', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const color = result.passed ? colors.green : colors.red;
    log(`${status} - ${result.name}`, color);
  });

  log('\n' + '-'.repeat(60), colors.bright);
  log(`Total Tests: ${totalTests}`, colors.bright);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
    failedTests === 0 ? colors.green : colors.yellow);
  log('-'.repeat(60) + '\n', colors.bright);

  // Save report to file
  const reportPath = path.join(process.cwd(), 'reports', 'phase4-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
    },
  };

  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 Test report saved to: ${reportPath}`, colors.blue);

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Test runner failed: ${error.message}`, colors.red);
  process.exit(1);
});
