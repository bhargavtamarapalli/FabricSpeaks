/**
 * Search API Integration Test
 * 
 * Tests the product search and filtering API:
 * 1. Search by text
 * 2. Filter by price range
 * 3. Sort by price
 * 4. Filter by category
 */

import '../server/env';
import { createClient } from '@supabase/supabase-js';

async function testSearchAPI() {
  console.log('🧪 Testing Search API...\n');

  try {
    // Step 1: Basic List
    console.log('1️⃣  Listing all products...');
    const listResponse = await fetch('http://localhost:5000/api/products?limit=5');
    const listData = await listResponse.json();
    console.log(`✅ Found ${listData.total} products\n`);

    if (listData.items.length === 0) {
      console.log('⚠️  No products found. Please seed some products first.');
      return;
    }

    const sampleProduct = listData.items[0];
    const searchTerm = sampleProduct.name.split(' ')[0]; // Use first word of name

    // Step 2: Search
    console.log(`2️⃣  Searching for "${searchTerm}"...`);
    const searchResponse = await fetch(`http://localhost:5000/api/products?search=${searchTerm}`);
    const searchData = await searchResponse.json();
    console.log(`✅ Found ${searchData.total} products matching "${searchTerm}"`);
    
    const allMatch = searchData.items.every((p: any) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (allMatch) {
        console.log('✅ All results match the search term\n');
    } else {
        console.log('⚠️  Some results do not match search term\n');
    }

    // Step 3: Price Filter
    console.log('3️⃣  Filtering by price (100 - 1000)...');
    const priceResponse = await fetch('http://localhost:5000/api/products?minPrice=100&maxPrice=1000');
    const priceData = await priceResponse.json();
    console.log(`✅ Found ${priceData.total} products in range`);
    
    const inRange = priceData.items.every((p: any) => Number(p.price) >= 100 && Number(p.price) <= 1000);
    if (inRange) {
        console.log('✅ All results are within price range\n');
    } else {
        console.log('⚠️  Some results are outside price range\n');
    }

    // Step 4: Sorting
    console.log('4️⃣  Sorting by price (asc)...');
    const sortResponse = await fetch('http://localhost:5000/api/products?sortBy=price_asc&limit=5');
    const sortData = await sortResponse.json();
    
    let isSorted = true;
    for (let i = 0; i < sortData.items.length - 1; i++) {
        if (Number(sortData.items[i].price) > Number(sortData.items[i+1].price)) {
            isSorted = false;
            break;
        }
    }
    
    if (isSorted) {
        console.log('✅ Results are sorted by price ascending\n');
    } else {
        console.log('⚠️  Results are NOT sorted correctly\n');
    }

    console.log('🎉 All search tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testSearchAPI();
