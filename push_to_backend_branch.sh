#!/bin/bash

# ============================================================================
# Push Backend + Frontend to backend branch
# ============================================================================

set -e  # Exit on any error

echo "🚀 Preparing to push all changes to backend branch..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "backend" ]; then
    echo "⚠️  Warning: You are not on the backend branch!"
    echo "   Current branch: $CURRENT_BRANCH"
    read -p "   Do you want to switch to backend branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout backend
        echo "✅ Switched to backend branch"
    else
        echo "❌ Aborted. Please switch to backend branch manually."
        exit 1
    fi
fi

echo ""
echo "📦 Adding all files..."

# Add backend files
git add backend/

# Add frontend files (Phase 1-3 integration)
git add loqui/package.json
git add loqui/package-lock.json
git add "loqui/src/app/(protected)/layout.tsx"
git add "loqui/src/app/(protected)/my-voices/page.tsx"
git add loqui/src/app/register/page.tsx
git add loqui/src/app/signin/page.tsx
git add loqui/src/components/file-uploader.tsx
git add loqui/src/components/nav-user.tsx
git add loqui/src/components/providers.tsx
git add loqui/src/components/recorder.tsx

# Add new directories
git add loqui/src/contexts/
git add loqui/src/lib/
git add loqui/src/types/

# Add documentation
git add FRONTEND_BACKEND_INTEGRATION_PLAN.md
git add INTEGRATION_PROGRESS.md
git add PHASE_2_TESTING.md
git add PHASE_3_QUICKSTART.md
git add PHASE_3_SUMMARY.md
git add PHASE_3_TESTING.md
git add loqui/SETUP_FRONTEND.md

# Add backend documentation
git add backend/FILE_LOCATIONS_GUIDE.md
git add backend/PRODUCTION_CHECKLIST.md
git add backend/QUICK_START.md
git add backend/QUICK_TEST.md
git add backend/TESTING_GUIDE.md
git add backend/VOICE_CLONING_GUIDE.md

# Optional: Add .env.local if it exists (but be careful with secrets!)
if [ -f "loqui/.env.local" ]; then
    echo "⚠️  Found loqui/.env.local - skipping (contains local config)"
fi

echo "✅ Files added to staging"
echo ""

# Show what will be committed
echo "📋 Files to be committed:"
git status --short
echo ""

# Confirm before committing
read -p "🤔 Do you want to commit these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. No changes committed."
    exit 1
fi

# Commit with a comprehensive message
echo ""
echo "💾 Creating commit..."

git commit -m "feat: Phase 1-3 Frontend-Backend Integration

✅ Phase 1: Foundation
- API client configuration with Axios
- JWT token management (localStorage)
- Auth utilities and interceptors
- TypeScript types for API responses

✅ Phase 2: Authentication
- Register page connected to /api/auth/register
- Signin page connected to /api/auth/login
- Protected route middleware with token validation
- User profile from /api/auth/me
- Logout functionality with token cleanup
- AuthContext for global auth state
- Session expiration handling

✅ Phase 3: Voice Samples
- My Voices page connected to /api/samples endpoints
- File upload with drag-and-drop
- Audio recording with MediaRecorder API
- Sample listing with real-time updates
- Sample deletion with confirmation
- Toast notifications (sonner)
- Loading states and error handling
- Removed all mockups from My Voices page

🔗 API Endpoints Connected:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/samples/
- POST /api/samples/upload
- DELETE /api/samples/{sample_id}

📚 Documentation:
- Integration plan (14 steps, 6 phases)
- Phase 2 & 3 testing guides
- Phase 3 quick start guide
- Backend guides (production checklist, testing, etc.)
- Frontend setup instructions

🧪 Testing:
- All Phase 2 features tested and working
- Phase 3 ready for testing
- No linting errors in modified files
- TypeScript compilation successful

Next: Phase 4 - Voice Generation Lab"

echo "✅ Commit created"
echo ""

# Show the commit
git log -1 --stat

echo ""
echo "📤 Pushing to origin/backend..."
read -p "🤔 Proceed with push? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Changes committed locally but not pushed."
    echo "   You can push manually with: git push origin backend"
    exit 1
fi

# Push to remote
git push origin backend

echo ""
echo "✅ Successfully pushed to origin/backend!"
echo ""
echo "🎉 All done! Your changes are now on the remote backend branch."
echo ""
echo "📊 Summary:"
echo "   - Backend code: ✅ Pushed"
echo "   - Frontend code (Phase 1-3): ✅ Pushed"
echo "   - Documentation: ✅ Pushed"
echo "   - Tests: Ready for Phase 3 testing"
echo ""
echo "Next steps:"
echo "   1. Test Phase 3: Follow PHASE_3_TESTING.md"
echo "   2. Proceed to Phase 4: Voice Generation Lab"

