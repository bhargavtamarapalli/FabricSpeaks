import subprocess
import sys
import time
import os

def run_cmd(cmd, desc):
    """Run a command and return True if successful"""
    print(f"\n▶️ {desc}...")
    try:
        result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
        if result.returncode == 0:
            print(f"✅ Success: {desc}")
            return True
        else:
            print(f"❌ Failed: {desc}")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Test the development setup"""
    print("\n🔍 Testing Fabric Speaks Development Setup")
    print("=" * 50)

    # Test 1: Check Docker
    if not run_cmd("docker info", "Checking Docker"):
        print("\n⚠️ Please start Docker Desktop and try again")
        return

    # Test 2: Start DB
    run_cmd("npm run db:down", "Stopping any existing containers")
    if not run_cmd("npm run db:up", "Starting database"):
        print("\n⚠️ Failed to start database")
        return

    # Wait for DB to be ready
    print("\n⏳ Waiting for database to be ready...")
    time.sleep(5)

    # Test 3: Apply migrations
    if not run_cmd("npm run migrate:psql", "Applying migrations"):
        print("\n⚠️ Failed to apply migrations")
        return

    # Test 4: Run tests
    env = os.environ.copy()
    env["DATABASE_URL"] = "postgres://fsuser:postgres@localhost:5432/fabric_speaks"
    env["SUPABASE_URL"] = "http://localhost:54321"
    env["SUPABASE_SERVICE_ROLE_KEY"] = "test-key"
    env["SUPABASE_ANON_KEY"] = "test-key"
    env["INTEGRATION"] = "true"

    print("\n🧪 Running integration tests...")
    result = subprocess.run("npm run test:integration", shell=True, env=env)
    
    print("\n" + "=" * 50)
    if result.returncode == 0:
        print("✅ Setup verified successfully!")
    else:
        print("❌ Some tests failed - check the output above")

if __name__ == "__main__":
    main()