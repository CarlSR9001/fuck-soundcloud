#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:8080/api/v1}"
TEST_AUDIO_FILE="${TEST_AUDIO_FILE:-./test-assets/test-audio.wav}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}M1 E2E Test Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Check if services are running
echo -e "${YELLOW}[1/9]${NC} Checking if services are running..."
if ! curl -sf "${API_URL/api\/v1/}health" > /dev/null; then
    echo -e "${RED}ERROR: API is not responding. Please run 'docker compose up -d' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Services are running"
echo ""

# Step 2: Create test user (for now, we'll skip auth and use a temp user)
echo -e "${YELLOW}[2/9]${NC} Creating test user..."
# TODO: Implement proper user creation once auth module is complete
# For now, we'll manually insert a test user or use a placeholder
USER_ID="temp-user-id"
echo -e "${GREEN}✓${NC} Using user ID: ${USER_ID}"
echo ""

# Step 3: Create a test audio file if it doesn't exist
echo -e "${YELLOW}[3/9]${NC} Preparing test audio file..."
if [ ! -f "$TEST_AUDIO_FILE" ]; then
    echo "Creating test audio file with FFmpeg..."
    mkdir -p ./test-assets
    ffmpeg -f lavfi -i "sine=frequency=440:duration=10" \
           -ac 2 -ar 44100 \
           "$TEST_AUDIO_FILE" -y 2>/dev/null
    echo -e "${GREEN}✓${NC} Created 10-second test audio file"
else
    echo -e "${GREEN}✓${NC} Test audio file exists"
fi
echo ""

# Step 4: Multipart upload to MinIO
echo -e "${YELLOW}[4/9]${NC} Uploading audio file via multipart upload..."
FILE_SIZE=$(stat -f%z "$TEST_AUDIO_FILE" 2>/dev/null || stat -c%s "$TEST_AUDIO_FILE")
PARTS=3

# Calculate SHA256
SHA256=$(shasum -a 256 "$TEST_AUDIO_FILE" | awk '{print $1}')

# Initialize multipart upload
INIT_RESPONSE=$(curl -sf -X POST "${API_URL}/upload/multipart/init" \
    -H "Content-Type: application/json" \
    -d "{
        \"filename\": \"test-audio.wav\",
        \"size\": ${FILE_SIZE},
        \"sha256\": \"${SHA256}\",
        \"mime\": \"audio/wav\",
        \"parts\": ${PARTS}
    }")

UPLOAD_ID=$(echo "$INIT_RESPONSE" | jq -r '.uploadId')
KEY=$(echo "$INIT_RESPONSE" | jq -r '.key')

if [ -z "$UPLOAD_ID" ] || [ "$UPLOAD_ID" = "null" ]; then
    echo -e "${RED}ERROR: Failed to initialize multipart upload${NC}"
    echo "$INIT_RESPONSE"
    exit 1
fi

echo "Upload ID: $UPLOAD_ID"
echo "Key: $KEY"

# Upload parts (simplified - in real implementation would split file)
# For this test, we'll upload the whole file as one part
PRESIGNED_URL=$(echo "$INIT_RESPONSE" | jq -r '.presignedParts[0].uploadUrl')

echo "Uploading file..."
ETAG=$(curl -sf -X PUT "$PRESIGNED_URL" \
    --upload-file "$TEST_AUDIO_FILE" \
    -w "%{http_code}" -o /dev/null)

# Complete multipart upload
COMPLETE_RESPONSE=$(curl -sf -X POST "${API_URL}/upload/multipart/complete" \
    -H "Content-Type: application/json" \
    -d "{
        \"uploadId\": \"${UPLOAD_ID}\",
        \"key\": \"${KEY}\",
        \"etags\": [{\"partNumber\": 1, \"etag\": \"${ETAG}\"}]
    }")

ASSET_ID=$(echo "$COMPLETE_RESPONSE" | jq -r '.assetId')

if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" = "null" ]; then
    echo -e "${RED}ERROR: Failed to complete upload${NC}"
    echo "$COMPLETE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Asset uploaded with ID: ${ASSET_ID}"
echo ""

# Step 5: Create track
echo -e "${YELLOW}[5/9]${NC} Creating track..."
TRACK_RESPONSE=$(curl -sf -X POST "${API_URL}/tracks" \
    -H "Content-Type: application/json" \
    -d "{
        \"title\": \"E2E Test Track\",
        \"description_md\": \"Test track for E2E validation\",
        \"visibility\": \"public\",
        \"original_asset_id\": \"${ASSET_ID}\"
    }")

TRACK_ID=$(echo "$TRACK_RESPONSE" | jq -r '.track.id')
VERSION_ID=$(echo "$TRACK_RESPONSE" | jq -r '.version.id')

if [ -z "$TRACK_ID" ] || [ "$TRACK_ID" = "null" ]; then
    echo -e "${RED}ERROR: Failed to create track${NC}"
    echo "$TRACK_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Track created with ID: ${TRACK_ID}"
echo "Version ID: ${VERSION_ID}"
echo ""

# Step 6: Poll version until ready
echo -e "${YELLOW}[6/9]${NC} Waiting for transcode to complete..."
MAX_WAIT=300  # 5 minutes
WAIT_COUNT=0
VERSION_STATUS="pending"

while [ "$VERSION_STATUS" != "ready" ] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    sleep 5
    WAIT_COUNT=$((WAIT_COUNT + 5))

    TRACK_DATA=$(curl -sf "${API_URL}/tracks/${TRACK_ID}")
    VERSION_STATUS=$(echo "$TRACK_DATA" | jq -r '.versions[0].status')

    echo "Status: ${VERSION_STATUS} (waited ${WAIT_COUNT}s)"

    if [ "$VERSION_STATUS" = "failed" ]; then
        echo -e "${RED}ERROR: Transcode failed${NC}"
        echo "$TRACK_DATA" | jq '.versions[0]'
        exit 1
    fi
done

if [ "$VERSION_STATUS" != "ready" ]; then
    echo -e "${RED}ERROR: Transcode timed out after ${MAX_WAIT}s${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Transcode completed successfully"
echo ""

# Step 7: Get stream URL
echo -e "${YELLOW}[7/9]${NC} Fetching signed stream URL..."
STREAM_RESPONSE=$(curl -sf "${API_URL}/stream/${VERSION_ID}.m3u8")
STREAM_URL=$(echo "$STREAM_RESPONSE" | jq -r '.url')

if [ -z "$STREAM_URL" ] || [ "$STREAM_URL" = "null" ]; then
    echo -e "${RED}ERROR: Failed to get stream URL${NC}"
    echo "$STREAM_RESPONSE"
    exit 1
fi

echo "Stream URL: ${STREAM_URL}"
echo ""

# Step 8: Validate playback with FFmpeg
echo -e "${YELLOW}[8/9]${NC} Validating HLS playback with FFmpeg..."
FULL_STREAM_URL="http://localhost:8080${STREAM_URL}"

# Try to read 5 seconds of the stream
if ffmpeg -i "$FULL_STREAM_URL" -t 5 -f null - 2>&1 | grep -q "time="; then
    echo -e "${GREEN}✓${NC} HLS stream is playable"
else
    echo -e "${RED}ERROR: FFmpeg could not read HLS stream${NC}"
    exit 1
fi
echo ""

# Step 9: Verify waveform
echo -e "${YELLOW}[9/9]${NC} Verifying waveform generation..."
WAVEFORM_RESPONSE=$(curl -sf "${API_URL}/versions/${VERSION_ID}/waveform")
WAVEFORM_URL=$(echo "$WAVEFORM_RESPONSE" | jq -r '.url')

if [ -z "$WAVEFORM_URL" ] || [ "$WAVEFORM_URL" = "null" ]; then
    echo -e "${RED}ERROR: Waveform not found${NC}"
    echo "$WAVEFORM_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Waveform available at: ${WAVEFORM_URL}"
echo ""

# Success!
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All E2E tests passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Track ID: ${TRACK_ID}"
echo "Version ID: ${VERSION_ID}"
echo "Player URL: http://localhost:3000/player/${TRACK_ID}"
echo ""
