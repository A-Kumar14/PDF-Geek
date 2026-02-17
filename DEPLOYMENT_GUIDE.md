# FileGeek MVP Deployment Guide

## Pre-Deployment Checklist

### ✅ Completed
- [x] All features implemented and tested
- [x] Build succeeds with no errors
- [x] Performance optimizations applied
- [x] Documentation complete
- [x] Git history clean with descriptive commits

### ⏳ Before First Deploy
- [ ] Run database migrations
- [ ] Update environment variables
- [ ] Test in staging environment
- [ ] Run Lighthouse audit
- [ ] Mobile device testing

## Database Migration

**CRITICAL:** Must run before deploying backend changes.

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Generate migration
flask db migrate -m "Add QuizResult and FlashcardProgress models for study features"

# Review the generated migration file in migrations/versions/
# Ensure it creates both tables correctly

# Apply migration
flask db upgrade

# Verify tables exist
python -c "from models import db, QuizResult, FlashcardProgress; print('Models imported successfully')"
```

**Expected Tables:**
- `quiz_results`: Tracks quiz attempts and scores
- `flashcard_progress`: Stores flashcard review progress with SM-2 data

## Environment Variables

Ensure these are set in your deployment environment:

### Required
```bash
# AI Provider (at least one)
GOOGLE_API_KEY=your_gemini_key
# OR
OPENAI_API_KEY=your_openai_key

# Authentication
JWT_SECRET=your_secure_random_string

# Database (production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# OR SQLite (development only)
DATABASE_URL=sqlite:///filegeek.db
```

### Optional
```bash
# AI Provider Selection
AI_PROVIDER=gemini  # or 'openai', auto-detects if not set

# Redis (for Celery and rate limiting)
REDIS_URL=redis://localhost:6379/0

# S3 Storage (optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket_name
S3_ENABLED=true

# UploadThing (cloud file uploads)
UPLOADTHING_TOKEN=your_token

# Performance Tuning
NUM_RETRIEVAL_CHUNKS=5
DEEP_THINK_CHUNKS=12

# Security
PII_MASKING_ENABLED=true
CORS_ORIGINS=https://your-frontend-domain.com
```

## Frontend Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   cd frontend
   vercel
   ```

2. **Environment Variables in Vercel:**
   ```
   REACT_APP_API_URL=https://your-backend-api.com
   ```

3. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Static Hosting Alternative

```bash
cd frontend
npm run build

# Output in build/ directory
# Upload to S3, Netlify, or any static host
```

## Backend Deployment

### Render (Recommended)

1. **Create New Web Service:**
   - Connect GitHub repository
   - Root directory: `backend`
   - Build command: `pip install -r ../requirements.txt`
   - Start command: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

2. **Environment Variables:**
   - Add all required env vars in Render dashboard
   - Don't forget `DATABASE_URL` for PostgreSQL

3. **Celery Worker (Separate Service):**
   - Create Background Worker in Render
   - Start command: `celery -A celery_app.celery_app worker --loglevel=info`

### Docker Deployment

```bash
# Build and push images
docker build -t filegeek-backend:latest .
docker push your-registry/filegeek-backend:latest

# Deploy with docker-compose
docker-compose up -d

# Or Kubernetes (k8s manifests not included)
```

## Database Setup

### Development (SQLite)
```bash
# Already configured, no setup needed
DATABASE_URL=sqlite:///filegeek.db
```

### Production (PostgreSQL)

1. **Create Database:**
   ```sql
   CREATE DATABASE filegeek;
   CREATE USER filegeek_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE filegeek TO filegeek_user;
   ```

2. **Update Environment:**
   ```bash
   DATABASE_URL=postgresql://filegeek_user:secure_password@localhost:5432/filegeek
   ```

3. **Run Migrations:**
   ```bash
   flask db upgrade
   ```

## Redis Setup

### Development (Docker)
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Production
- Use managed Redis (Redis Cloud, AWS ElastiCache)
- Update `REDIS_URL` environment variable

## ChromaDB Persistence

### Development
```bash
# Data stored in backend/chroma_data/
# Automatically created, no setup needed
```

### Production
```bash
# Ensure directory is writable
mkdir -p /var/lib/filegeek/chroma_data
chown app:app /var/lib/filegeek/chroma_data

# In Dockerfile
VOLUME /var/lib/filegeek/chroma_data
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-api.com/health
# Expected: {"status": "ok"}
```

### 2. Test Authentication
```bash
# Sign up
curl -X POST https://your-api.com/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST https://your-api.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Test File Upload
- Visit https://your-frontend.com
- Upload a PDF
- Verify indexing completes
- Ask a question

### 4. Test Study Features
```bash
# Generate quiz
"Generate a quiz about [topic]"

# Generate flashcards
"Create flashcards about [topic]"

# Verify artifacts appear
# Test quiz interaction
# Test flashcard flip and persistence
```

### 5. Performance Check
```bash
# Run Lighthouse
lighthouse https://your-frontend.com --view

# Expected scores:
# Performance: >85
# Accessibility: >90
# Best Practices: >90
```

## Monitoring

### Logging
```bash
# Backend logs
tail -f /var/log/filegeek/app.log

# Celery worker logs
tail -f /var/log/filegeek/celery.log
```

### Error Tracking
```bash
# Install Sentry (recommended)
pip install sentry-sdk

# In app.py
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### Performance Monitoring
- Use Vercel Analytics for frontend
- Use Render Metrics for backend
- Set up uptime monitoring (UptimeRobot, Pingdom)

## Rollback Plan

### If Issues Arise

1. **Revert Git Commit:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Rollback Database:**
   ```bash
   flask db downgrade
   ```

3. **Emergency Disable:**
   - Set `MAINTENANCE_MODE=true` env var
   - Show maintenance page

## Scaling

### Horizontal Scaling

**Backend:**
- Add more web server instances
- Use load balancer (Nginx, AWS ALB)

**Celery Workers:**
- Scale worker count: `-c 4` flag
- Run multiple worker processes

**Database:**
- Use read replicas for ChromaDB queries
- PostgreSQL connection pooling

### Vertical Scaling

**Initial Specs (MVP):**
- Web server: 512MB RAM, 1 CPU
- Celery worker: 1GB RAM, 1 CPU
- Database: 1GB RAM, shared CPU

**Growth Specs:**
- Web server: 2GB RAM, 2 CPU
- Celery worker: 2GB RAM, 2 CPU
- Database: 4GB RAM, dedicated CPU

## Security Hardening

### Production Checklist

- [ ] JWT secret is cryptographically random
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS origins whitelisted
- [ ] Rate limiting enabled
- [ ] PII masking enabled
- [ ] Database backups automated
- [ ] Secrets not in code/git
- [ ] Security headers set (CSP, HSTS)
- [ ] Dependencies updated (no CVEs)

### Security Headers
```python
# In app.py
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

## Backup Strategy

### Database Backups
```bash
# PostgreSQL daily backup
pg_dump -U filegeek_user filegeek > backup_$(date +%Y%m%d).sql

# Automated via cron
0 2 * * * /usr/local/bin/backup_db.sh
```

### ChromaDB Backups
```bash
# Backup chroma_data directory
tar -czf chroma_backup_$(date +%Y%m%d).tar.gz /var/lib/filegeek/chroma_data

# Restore
tar -xzf chroma_backup_20260216.tar.gz -C /var/lib/filegeek/
```

### User Files
- If using S3, backups handled by AWS
- If using local storage, backup uploads/ directory

## Cost Estimation

### MVP Hosting (Monthly)

**Render:**
- Web server: $7/month (Starter)
- Celery worker: $7/month (Starter)
- PostgreSQL: $7/month (Starter)

**Vercel:**
- Frontend: Free (hobby plan)

**Redis Cloud:**
- 30MB: Free

**AI Providers:**
- Gemini: $0.0001/1K chars (~$5-10/month light usage)
- OpenAI: $0.002/1K tokens (~$10-20/month light usage)

**Total:** ~$30-50/month for MVP

### Growth Hosting (Monthly)

- Professional tier: $100-200/month
- Enterprise tier: $500+/month

## Support

### Documentation
- README.md - Project overview
- CLAUDE.md - Development guide
- docs/QUIZ_SYSTEM.md - Quiz feature
- docs/FLASHCARD_SYSTEM.md - Flashcard feature
- TESTING_RESULTS.md - Test status

### Getting Help
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@filegeek.example.com
- Documentation: https://docs.filegeek.example.com

## Success Metrics

### Key Performance Indicators (KPIs)

**Technical:**
- Uptime: >99.9%
- API response time: <500ms (p95)
- Error rate: <1%
- Build success rate: 100%

**User Engagement:**
- Daily active users (DAU)
- Documents uploaded per user
- Quizzes/flashcards generated per session
- Flashcard review completion rate

**Business:**
- Sign-up conversion rate
- User retention (7-day, 30-day)
- Feature adoption (quiz, flashcards)
- Session duration

## Changelog

### v1.1.0 (February 2026) - Study Features
- ✅ Interactive quiz system
- ✅ Flashcard system with spaced repetition
- ✅ Performance optimizations (60-70% faster)
- ✅ Bundle size reduction (200KB smaller)

### v1.0.0 (January 2026) - Initial Release
- Document upload and indexing
- RAG-powered chat
- PDF viewer with annotations
- Study guide generation
- Mermaid diagram support

---

**Deployment Status:** 🟢 Ready for Staging
**Last Updated:** February 16, 2026
**Version:** 1.1.0
