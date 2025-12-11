import { faker } from '@faker-js/faker';

/**
 * Valid test user
 */
export const validUser = {
  email: 'test@example.com',
  password: 'Password123',
  name: 'Test User',
};

/**
 * Admin test user
 */
export const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPass123',
  name: 'Admin User',
  role: 'admin',
};

/**
 * Customer test user
 */
export const customerUser = {
  email: 'customer@example.com',
  password: 'CustomerPass123',
  name: 'Customer User',
  role: 'customer',
};

/**
 * Generate random user
 */
export function generateRandomUser() {
  return {
    email: faker.internet.email().toLowerCase(),
    password: 'Password123',
    name: faker.person.fullName(),
  };
}

/**
 * Generate random address
 */
export function generateRandomAddress() {
  return {
    name: faker.person.fullName(),
    phone: faker.phone.number('+1##########'),
    address_line1: faker.location.streetAddress(),
    address_line2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    postal_code: faker.location.zipCode(),
    country: 'USA',
  };
}

/**
 * Valid email addresses
 */
export const validEmails = [
  'user@example.com',
  'user.name@example.com',
  'user+tag@example.co.uk',
  'user123@sub.example.com',
  'test.email+alex@leetcode.com',
];

/**
 * Invalid email addresses
 */
export const invalidEmails = [
  'invalid',
  '@example.com',
  'user@',
  'user @example.com',
  'user@example',
  '',
  'user@.com',
  'user..name@example.com',
];

/**
 * Valid passwords
 */
export const validPasswords = [
  'Password1',
  'MyP@ssw0rd',
  'Str0ngPass!',
  'Test1234',
  'SecureP@ss1',
];

/**
 * Invalid passwords
 */
export const invalidPasswords = {
  tooShort: 'Pass1',
  noUppercase: 'password1',
  noLowercase: 'PASSWORD1',
  noNumber: 'Password',
  empty: '',
};

/**
 * SQL Injection payloads
 */
export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DROP TABLE users--",
  "1' UNION SELECT NULL--",
];

/**
 * XSS payloads
 */
export const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
];

/**
 * Test cart items
 */
export const testCartItems = [
  {
    product_id: 'prod-001',
    variant_id: 'var-001',
    quantity: 2,
  },
  {
    product_id: 'prod-002',
    variant_id: 'var-002',
    quantity: 1,
  },
  {
    product_id: 'prod-003',
    variant_id: 'var-003',
    quantity: 3,
  },
];

/**
 * Test addresses
 */
export const testAddresses = [
  {
    name: 'John Doe',
    phone: '+1234567890',
    address_line1: '123 Main St',
    address_line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    is_default: true,
  },
  {
    name: 'Jane Smith',
    phone: '+1987654321',
    address_line1: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    postal_code: '90001',
    country: 'USA',
    is_default: false,
  },
];
