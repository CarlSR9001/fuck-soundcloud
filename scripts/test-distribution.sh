#!/bin/bash
set -e

#
# Test script for distribution job
# Creates test contributions and listening data, then triggers distribution
#

API_URL="${API_URL:-http://localhost:8080}"
PERIOD="${PERIOD:-$(date +%Y-%m)}"

echo "=== Distribution Job Test Script ==="
echo "Period: $PERIOD"
echo ""

# 1. Create test users (contributor and artists)
echo "Creating test users..."

CONTRIBUTOR_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contributor@example.com",
    "handle": "contributor",
    "password": "test123456",
    "display_name": "Test Contributor"
  }')

CONTRIBUTOR_TOKEN=$(echo "$CONTRIBUTOR_RESPONSE" | jq -r '.session.jwt // empty')

if [ -z "$CONTRIBUTOR_TOKEN" ]; then
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "contributor@example.com", "password": "test123456"}')
  CONTRIBUTOR_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.session.jwt')
fi

CONTRIBUTOR_ID=$(echo "$CONTRIBUTOR_RESPONSE" | jq -r '.user.id // empty')
if [ -z "$CONTRIBUTOR_ID" ]; then
  ME_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/users/me" \
    -H "Authorization: Bearer $CONTRIBUTOR_TOKEN")
  CONTRIBUTOR_ID=$(echo "$ME_RESPONSE" | jq -r '.id')
fi

echo "Contributor ID: $CONTRIBUTOR_ID"
echo ""

# Create artist users
ARTIST1_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "artist1@example.com",
    "handle": "artist1",
    "password": "test123456",
    "display_name": "Artist One"
  }')

ARTIST1_ID=$(echo "$ARTIST1_RESPONSE" | jq -r '.user.id // empty')
if [ -z "$ARTIST1_ID" ]; then
  ARTIST1_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "artist1@example.com", "password": "test123456"}' | jq -r '.session.jwt')
  ARTIST1_ID=$(curl -s -X GET "$API_URL/api/v1/users/me" \
    -H "Authorization: Bearer $ARTIST1_TOKEN" | jq -r '.id')
fi

echo "Artist 1 ID: $ARTIST1_ID"

ARTIST2_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "artist2@example.com",
    "handle": "artist2",
    "password": "test123456",
    "display_name": "Artist Two"
  }')

ARTIST2_ID=$(echo "$ARTIST2_RESPONSE" | jq -r '.user.id // empty')
if [ -z "$ARTIST2_ID" ]; then
  ARTIST2_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "artist2@example.com", "password": "test123456"}' | jq -r '.session.jwt')
  ARTIST2_ID=$(curl -s -X GET "$API_URL/api/v1/users/me" \
    -H "Authorization: Bearer $ARTIST2_TOKEN" | jq -r '.id')
fi

echo "Artist 2 ID: $ARTIST2_ID"
echo ""

# 2. Create test contribution directly in database (or via admin API)
echo "Creating test contribution in database..."
echo "This requires direct database access or admin API endpoint"
echo ""

# Insert contribution (example SQL)
cat <<EOF
INSERT INTO contributions (id, user_id, amount_cents, type, status, artists_percentage, charity_percentage, platform_percentage, created_at)
VALUES (
  gen_random_uuid(),
  '$CONTRIBUTOR_ID',
  1000, -- \$10.00
  'one_time',
  'completed',
  80,
  10,
  10,
  NOW()
);
EOF

echo ""
echo "Run the above SQL in PostgreSQL to create test contribution"
echo "  docker exec -it postgres psql -U soundcloud -d soundcloud_db"
echo ""

# 3. Create test analytics_play records
echo "Creating test listening data..."
echo "This simulates the contributor listening to tracks from both artists"
echo ""

# Example SQL to insert play events
cat <<EOF
-- Play events for Artist 1 tracks (60% of time)
INSERT INTO analytics_play (id, track_id, user_id, ip_hash, started_at, completed, watch_ms)
SELECT
  gen_random_uuid(),
  t.id,
  '$CONTRIBUTOR_ID',
  'test_hash',
  NOW() - INTERVAL '1 day',
  true,
  180000 -- 3 minutes
FROM tracks t
WHERE t.owner_user_id = '$ARTIST1_ID'
LIMIT 1;

-- Play events for Artist 2 tracks (40% of time)
INSERT INTO analytics_play (id, track_id, user_id, ip_hash, started_at, completed, watch_ms)
SELECT
  gen_random_uuid(),
  t.id,
  '$CONTRIBUTOR_ID',
  'test_hash',
  NOW() - INTERVAL '1 day',
  true,
  120000 -- 2 minutes
FROM tracks t
WHERE t.owner_user_id = '$ARTIST2_ID'
LIMIT 1;
EOF

echo ""
echo "Run the above SQL to create play events"
echo ""

# 4. Trigger distribution job
echo "To trigger distribution job:"
echo "1. Via Redis CLI:"
echo "   redis-cli LPUSH bull:distribution:wait '{\"data\":{\"period\":\"$PERIOD\"}}'"
echo ""
echo "2. Via API (if admin endpoint exists):"
echo "   curl -X POST \"$API_URL/api/v1/admin/jobs/distribution\" \\"
echo "     -H \"Authorization: Bearer \$ADMIN_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"period\": \"$PERIOD\"}'"
echo ""

# 5. Check results
echo "After distribution job completes, check results:"
echo ""
echo "Artist Payouts:"
echo "  docker exec -it postgres psql -U soundcloud -d soundcloud_db -c \"SELECT * FROM artist_payouts WHERE period='$PERIOD';\""
echo ""
echo "Expected results:"
echo "  - Artist 1: \$8.00 * 60% = \$4.80"
echo "  - Artist 2: \$8.00 * 40% = \$3.20"
echo "  - Charity: \$1.00"
echo "  - Platform: \$1.00"
echo ""
echo "Contributions processed:"
echo "  docker exec -it postgres psql -U soundcloud -d soundcloud_db -c \"SELECT * FROM contributions WHERE processed_at IS NOT NULL;\""
echo ""

echo "=== Test Setup Complete ==="
echo "Follow the instructions above to:"
echo "1. Insert test contribution"
echo "2. Insert test play events"
echo "3. Trigger distribution job"
echo "4. Verify payouts were created correctly"
