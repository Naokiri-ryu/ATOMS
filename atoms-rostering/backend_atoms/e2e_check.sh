#!/bin/bash
BASE="http://localhost:8000/api"
echo "=== 1. admin login ==="
ADMIN=$(curl -s "$BASE/auth/login" -X POST -H 'Content-Type: application/json' -d '{"email":"admin@airnav.com","password":"password"}')
echo "$ADMIN" | head -c 300
echo ""
TOKEN=$(echo "$ADMIN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])' 2>/dev/null || echo "$ADMIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
echo "TOKEN_LEN=${#TOKEN}"
echo "=== 2. patch user 2 password to default ==="
curl -s "$BASE/admin/users/2" -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"password":"password"}' | head -c 300
echo ""
echo "=== 3. login user1 by email ==="
curl -s "$BASE/auth/login" -X POST -H 'Content-Type: application/json' -d '{"email":"user1@airnav.com","password":"password"}' | head -c 200
echo ""
echo "=== 4. login user1 by username ==="
curl -s "$BASE/auth/login" -X POST -H 'Content-Type: application/json' -d '{"email":"user1","password":"password"}' | head -c 200
echo ""