# Task Checklist

## Admin App Migration
- [ ] **Phase 1: Preparation & Safety**
    - [ ] Sync Types (Admin App `types/index.ts` <-> Main App `shared/schema.ts`) <!-- id: 0 -->
    - [ ] Setup API Client in Admin App (`src/lib/api.ts`) <!-- id: 1 -->
- [ ] **Phase 2: Backend API Expansion**
    - [ ] Create Dashboard Stats API (`GET /api/admin/stats`) <!-- id: 2 -->
    - [ ] Update Product APIs (Validation, Filtering) <!-- id: 3 -->
    - [ ] Create Bulk Status API <!-- id: 4 -->
    - [ ] Create Bulk Variant Stock API <!-- id: 5 -->
- [ ] **Phase 3: Frontend Migration**
    - [ ] Migrate Overview Page <!-- id: 6 -->
    - [ ] Migrate Products Page <!-- id: 7 -->
    - [ ] Migrate Product Form <!-- id: 8 -->
    - [ ] Migrate Orders Page <!-- id: 9 -->
- [ ] **Phase 4: Cleanup**
    - [ ] Remove Supabase Client <!-- id: 10 -->
