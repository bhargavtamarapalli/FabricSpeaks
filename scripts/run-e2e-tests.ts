#!/usr/bin/env node

/**
 * E2E Test Runner Script - Playwright
 * 
 * Orchestrates Playwright E2E test execution
 * Commands:
 *   npx ts-node scripts/run-e2e-tests.ts --ui           # Run with UI
 *   npx ts-node scripts/run-e2e-tests.ts --headed       # Run headed (browser visible)
 *   npx ts-node scripts/run-e2e-tests.ts --debug        # Run in debug mode
 *   npx ts-node scripts/run-e2e-tests.ts --report       # Show test report
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestConfig {
  ui: boolean;
  headed: boolean;
  debug: boolean;
  report: boolean;
  project?: string;
  workers?: number;
}

async function runTests(config: TestConfig) {
  console.log('🎭 Fabric Speaks E2E Test Runner\n');

  const args: string[] = [];

  if (config.ui) {
    args.push('--ui');
  } else if (config.headed) {
    args.push('--headed');
  }

  if (config.debug) {
    args.push('--debug');
  }

  if (config.project) {
    args.push('--project', config.project);
  }

  if (config.workers) {
    args.push('--workers', String(config.workers));
  }

  const command = `npx playwright test ${args.join(' ')}`;

  console.log(`📋 Command: ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 10,
    });

    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }

    // Show report if requested
    if (config.report) {
      console.log('\n📊 Opening test report...');
      await execAsync('npx playwright show-report', {
        cwd: path.join(__dirname, '..'),
      });
    }

    console.log('\n✅ E2E tests completed');
  } catch (error: any) {
    console.error('❌ E2E test execution failed:');
    console.error(error.message);

    if (error.stdout) {
      console.log('\nStdout:', error.stdout);
    }

    if (error.stderr) {
      console.log('\nStderr:', error.stderr);
    }

    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const config: TestConfig = {
  ui: args.includes('--ui'),
  headed: args.includes('--headed'),
  debug: args.includes('--debug'),
  report: args.includes('--report'),
  project: args.includes('--project') ? args[args.indexOf('--project') + 1] : undefined,
  workers: args.includes('--workers') ? parseInt(args[args.indexOf('--workers') + 1]) : undefined,
};

// Show help
if (args.includes('--help')) {
  console.log(`
E2E Test Runner - Fabric Speaks

Usage: npx ts-node scripts/run-e2e-tests.ts [options]

Options:
  --ui              Run tests with Playwright Inspector UI
  --headed          Run tests with visible browser
  --debug           Run tests in debug mode
  --report          Show test report after completion
  --project <name>  Run specific browser project (chromium, firefox, webkit)
  --workers <n>     Number of parallel workers
  --help            Show this help message

Examples:
  # Interactive UI mode
  npx ts-node scripts/run-e2e-tests.ts --ui

  # Headed mode with report
  npx ts-node scripts/run-e2e-tests.ts --headed --report

  # Debug mode
  npx ts-node scripts/run-e2e-tests.ts --debug

  # Specific browser
  npx ts-node scripts/run-e2e-tests.ts --project chromium

  # Single worker
  npx ts-node scripts/run-e2e-tests.ts --workers 1
`);
} else {
  runTests(config);
}