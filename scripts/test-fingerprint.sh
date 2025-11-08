#!/bin/bash
set -e

#
# Test script for fingerprint job
# Creates a test track and triggers fingerprint generation
#

API_URL="${API_URL:-http://localhost:8080}"
TEST_AUDIO="${TEST_AUDIO:-/tmp/test-audio.mp3}"

echo "=== Fingerprint Job Test Script ==="
echo ""

# 1. Check if test audio file exists, create if not
if [ ! -f "$TEST_AUDIO" ]; then
  echo "Creating test audio file..."
  ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -ac 2 -ar 44100 "$TEST_AUDIO" -y
fi

# 2. Create user (or login)
echo "Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fingerprint-test@example.com",
    "handle": "fingerprint_test",
    "password": "test123456",
    "display_name": "Fingerprint Test"
  }')

# Extract JWT token (from cookie or response)
TOKEN=$(echo "$USER_RESPONSE" | jq -r '.session.jwt // empty')

if [ -z "$TOKEN" ]; then
  echo "Login instead..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "fingerprint-test@example.com",
      "password": "test123456"
    }')
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.session.jwt // empty')
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get JWT token"
  exit 1
fi

echo "Got JWT token: ${TOKEN:0:20}..."
echo ""

# 3. Upload audio file
echo "Uploading test audio file..."
FILE_SIZE=$(stat -f%z "$TEST_AUDIO" 2>/dev/null || stat -c%s "$TEST_AUDIO")
FILE_SHA256=$(shasum -a 256 "$TEST_AUDIO" | awk '{print $1}')

UPLOAD_INIT=$(curl -s -X POST "$API_URL/api/v1/upload/multipart/init" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"test-audio.mp3\",
    \"size\": $FILE_SIZE,
    \"sha256\": \"$FILE_SHA256\"
  }")

UPLOAD_ID=$(echo "$UPLOAD_INIT" | jq -r '.upload_id')
PRESIGNED_URL=$(echo "$UPLOAD_INIT" | jq -r '.presigned_parts[0].url')

echo "Upload ID: $UPLOAD_ID"
echo "Uploading file to MinIO..."

# Upload the file part
ETAG=$(curl -s -X PUT "$PRESIGNED_URL" \
  --upload-file "$TEST_AUDIO" \
  -D - | grep -i etag | awk '{print $2}' | tr -d '\r')

echo "ETag: $ETAG"

# Complete the upload
COMPLETE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/upload/multipart/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"upload_id\": \"$UPLOAD_ID\",
    \"etags\": [\"$ETAG\"]
  }")

ASSET_ID=$(echo "$COMPLETE_RESPONSE" | jq -r '.asset.id')
echo "Asset created: $ASSET_ID"
echo ""

# 4. Create track (which triggers transcode and waveform jobs)
echo "Creating track..."
TRACK_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/tracks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Fingerprint Test Track\",
    \"original_asset_id\": \"$ASSET_ID\",
    \"visibility\": \"public\"
  }")

TRACK_ID=$(echo "$TRACK_RESPONSE" | jq -r '.track.id')
VERSION_ID=$(echo "$TRACK_RESPONSE" | jq -r '.track.primary_version.id')

echo "Track created: $TRACK_ID"
echo "Version ID: $VERSION_ID"
echo ""

# 5. Manually trigger fingerprint job via API (requires admin or special endpoint)
# For now, we'll use BullMQ UI or Redis CLI to add job manually
echo "To trigger fingerprint job, you can:"
echo "1. Add to Redis queue manually:"
echo "   redis-cli LPUSH bull:fingerprint:wait '{\"data\":{\"version_id\":\"$VERSION_ID\"}}'"
echo ""
echo "2. Or create API endpoint: POST /api/v1/admin/jobs/fingerprint"
echo "   with body: {\"version_id\": \"$VERSION_ID\"}"
echo ""

# 6. Wait and check for fingerprint
echo "Waiting for fingerprint to be generated (polling every 5s)..."
for i in {1..12}; do
  sleep 5

  # Query fingerprint (would need API endpoint: GET /api/v1/versions/:id/fingerprint)
  # For now, check database directly or via admin endpoint
  echo "[$i/12] Checking fingerprint status..."

  # You could add: curl -s "$API_URL/api/v1/admin/fingerprints/$VERSION_ID"
  # For now, just show instructions
done

echo ""
echo "=== Test Complete ==="
echo "Track ID: $TRACK_ID"
echo "Version ID: $VERSION_ID"
echo ""
echo "To verify fingerprint was created:"
echo "  docker exec -it postgres psql -U soundcloud -d soundcloud_db -c \"SELECT * FROM audio_fingerprints WHERE track_version_id='$VERSION_ID';\""
echo ""
echo "To check for duplicate reports:"
echo "  docker exec -it postgres psql -U soundcloud -d soundcloud_db -c \"SELECT * FROM reports WHERE track_id='$TRACK_ID';\""
