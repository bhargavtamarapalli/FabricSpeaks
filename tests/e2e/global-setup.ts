import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global Setup: Setting up test environment...');
  // You can add database seeding or other setup steps here
}

export default globalSetup;
