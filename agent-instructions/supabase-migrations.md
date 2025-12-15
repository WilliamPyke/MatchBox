# Supabase Migrations - Best Practices and Guidelines

## Problem Statement

**The Migration Testing Gap:**

- `npx supabase db reset` runs migrations against empty databases
- Production failures occur when migrations run against populated databases with edge cases
- Migrations are only tested in clean environments, missing real-world scenarios

**Undocumented Manual Operations in Supabase UI:**

- These undocumented schema changes can cause migration conflicts in production
- Functions, triggers, policies, or constraints may already exist when migrations run

**Solution:**
**ALWAYS** Use defensive migration patterns and test against realistic data with `./supabase/scripts/test-migration.sh`

## Defensive Migration Patterns

### Tables and Schemas

```sql
-- ✅ GOOD: Defensive table creation
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ BAD: Assumes clean database
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);
```

### Columns and Constraints

```sql
-- ✅ GOOD: Safe column addition (Postgres 9.6+)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ✅ GOOD: Safe constraint addition
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_user_email'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT unique_user_email UNIQUE (email);
    END IF;
END $$;

-- ❌ BAD: Assumes column doesn't exist
ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

### Indexes

```sql
-- ✅ GOOD: Defensive index creation
CREATE UNIQUE INDEX IF NOT EXISTS unique_lolli_balance_move_confirmed
ON reward_transactions (user_id, currency, transaction_type)
WHERE transaction_type = 'lolli_balance_move';

-- ✅ GOOD: Safe index removal
DROP INDEX IF EXISTS old_inefficient_index;

-- ❌ BAD: Assumes index doesn't exist
CREATE UNIQUE INDEX unique_lolli_balance_move_confirmed
ON reward_transactions (user_id, currency, transaction_type);
```

### Functions and Triggers

```sql
-- ✅ GOOD: Idempotent function creation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ GOOD: Safe trigger replacement
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ❌ BAD: Assumes function doesn't exist
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### RLS Policies

```sql
-- ✅ GOOD: Safe policy replacement
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- ✅ GOOD: Conditional policy creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'users' AND policyname = 'Users can read own data'
    ) THEN
        CREATE POLICY "Users can read own data" ON public.users
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- ❌ BAD: Assumes policy doesn't exist
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);
```

### Database Roles

```sql
-- ✅ GOOD: Safe role management
DROP ROLE IF EXISTS app_reader;
CREATE ROLE app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;

-- ✅ GOOD: Conditional role creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_reader') THEN
        CREATE ROLE app_reader;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;
    END IF;
END $$;

-- ❌ BAD: Assumes role doesn't exist
CREATE ROLE app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;
```

### Enums

```sql
-- ✅ GOOD: Safe enum value addition
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM unnest(enum_range(NULL::config_type_enum)) AS val
        WHERE val = 'admin'
    ) THEN
        ALTER TYPE config_type_enum ADD VALUE 'admin';
    END IF;
END $$;

-- ✅ GOOD: Safe enum creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
        CREATE TYPE status_enum AS ENUM ('active', 'inactive', 'pending');
    END IF;
END $$;

-- ❌ BAD: Assumes enum doesn't exist
CREATE TYPE status_enum AS ENUM ('active', 'inactive', 'pending');
```

## Feature Flag Coordination

### When to Use Feature Flags with Migrations

**ALWAYS ask the user if a feature flag is needed when:**

- Adding new tables that UI components will query
- Adding new columns that frontend code will display
- Modifying existing data structures that affect API responses
- Creating new functions/procedures that backend services will call
- Changes that could break existing functionality if not applied

### Feature Flag Integration Pattern

```sql
-- Example: Adding a new feature that requires UI coordination
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
CREATE POLICY "Users can read own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);
```

**Corresponding feature flag check:**

- Feature flag: `ENABLE_NOTIFICATIONS=true/false`
- Frontend: Check flag before showing notification UI
- Backend: Check flag before creating notification records

### Questions to Ask Users

When writing migrations, **ALWAYS ask:**

1. "Does this migration require a new feature flag environment variable?"
2. "Will the UI break if this migration hasn't been applied yet?"
3. "Should this feature be gated behind a feature flag during rollout?"
4. "Are there any backend services that need to check for this feature flag?"

## Anti-Patterns to Avoid

### Never Do These

```sql
-- ❌ Bare CREATE statements
CREATE TABLE users (...);
CREATE FUNCTION calculate_balance(...);
CREATE INDEX idx_user_email ON users(email);

-- ❌ DROP without IF EXISTS
DROP TRIGGER update_user_balance;
DROP POLICY "User read policy";
DROP FUNCTION old_function();

-- ❌ Assuming clean state
ALTER TABLE users ADD COLUMN balance DECIMAL(10,2);
CREATE UNIQUE INDEX unique_email ON users(email);

-- ❌ Complex data migrations without safety checks
UPDATE users SET status = 'active' WHERE created_at < NOW() - INTERVAL '30 days';
```

### Risk Factors to Watch For

- **Large data migrations:** Always batch operations and add rollback plans
- **Column type changes:** Consider compatibility with existing data
- **Index creation on large tables:** May cause downtime, consider concurrent creation
- **Policy changes:** Ensure they don't accidentally restrict existing users

## Migration Testing Workflow

### Mandatory Steps

1. **Write Migration with Defensive Patterns**

   - Use `CREATE OR REPLACE`, `IF NOT EXISTS`, `DROP IF EXISTS`
   - Add proper error handling and rollback considerations

2. **Feature Flag Assessment**

   - Ask user about feature flag requirements
   - Coordinate with frontend/backend changes
   - Plan rollout strategy

3. **Test Against Realistic Data**

   ```bash
   # From project root
   ./supabase/scripts/test-migration.sh your_migration_file.sql

   # Or test latest migration
   ./supabase/scripts/test-migration.sh
   ```

4. **Validate Results**

   - Check that migration runs successfully against seeded data
   - Verify no constraint violations or conflicts
   - Test rollback scenarios when possible

5. **Update the Supabase Typescript schema**

   - Check that schema defined in `packages/shared/src/types/supabase.ts` is up to date with the actual Supabase schema after the migration

6. **Review Before Merge**
   - Ensure all defensive patterns are used
   - Confirm feature flag coordination
   - Verify testing has been completed

### Testing Script Benefits

The `test-migration.sh` script catches issues that `npx supabase db reset` misses:

- **Race conditions:** Duplicate data causing constraint violations
- **Precision errors:** Scientific notation breaking decimal handling
- **Ban sync failures:** Complex user states triggering edge cases
- **Performance issues:** Slow queries against populated tables
- **Constraint conflicts:** Unique violations from realistic data scenarios

## Code Examples from Real Migrations

### Example 1: Safe Index Creation (from production fix)

```sql
-- From: 20250911000001_fix_lolli_balance_move_race_condition.sql
-- ✅ GOOD: Defensive unique index with proper conditions
CREATE UNIQUE INDEX IF NOT EXISTS unique_lolli_balance_move_confirmed
ON reward_transactions (user_id, currency, transaction_type)
WHERE transaction_type = 'lolli_balance_move'
  AND (metadata->>'expiration_date' IS NULL OR metadata->>'expiration_date' = '');

CREATE UNIQUE INDEX IF NOT EXISTS unique_lolli_balance_move_pending
ON reward_transactions (user_id, currency, transaction_type)
WHERE transaction_type = 'lolli_balance_move'
  AND metadata->>'expiration_date' IS NOT NULL
  AND metadata->>'expiration_date' != '';
```

### Example 2: Safe Table Creation with RLS (from global_config)

```sql
-- From: 20250822174300_create_global_config_table.sql
-- ✅ GOOD: Comprehensive defensive table creation
CREATE TABLE IF NOT EXISTS public.global_config (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS defensively
ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

-- Safe policy creation
DROP POLICY IF EXISTS "Service role read access" ON public.global_config;
CREATE POLICY "Service role read access" ON public.global_config
  FOR SELECT USING (auth.role() = 'service_role');
```

## Integration with Development Workflow

### For Claude/AI Development

1. **ALWAYS use defensive patterns** - Never assume clean database state
2. **ALWAYS ask about feature flags** - Coordinate with UI/backend changes
3. **ALWAYS test every migration** - Use the test script before merging: `./supabase/scripts/test-migration.sh`
4. **ALWAYS update the Supabase Typescript schema** - Check the typescript types match the supabase schema in `packages/shared/src/types/supabase.ts`
5. **Document assumptions** - Add comments explaining complex conditions
6. **Plan for rollbacks** - Consider how to safely revert changes

### For Manual Development

1. Follow the same patterns as AI development
2. Test locally with seeded data before creating PRs
3. Consider impact on existing functionality
4. Coordinate with team on feature flag requirements

## Summary Checklist

Before merging any migration:

- [ ] Used defensive patterns (`CREATE OR REPLACE`, `IF NOT EXISTS`, etc.)
- [ ] Asked user about feature flag requirements
- [ ] Tested with `./supabase/scripts/test-migration.sh`
- [ ] Added appropriate comments and documentation
- [ ] Verified the types in `packages/shared/src/types/supabase.ts` match the Supabase schema
- [ ] Considered rollback scenarios
- [ ] Coordinated with frontend/backend changes if needed

**Remember:** Production databases have data, concurrent operations, and undocumented manual changes. Always write migrations defensively and test against realistic scenarios.
