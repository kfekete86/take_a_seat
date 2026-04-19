# Quick Start Guide

This is a quick reference for setting up and running the F1 Facebook Poster.

## 5-Minute Local Setup

```bash
# 1. Clone and install
git clone https://github.com/kfekete86/take_a_seat.git
cd take_a_seat
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your Facebook credentials

# 3. Build and run
npm run build
npm start
```

## Docker Quick Start

```bash
# 1. Configure
cp .env.example .env
# Edit .env with your Facebook credentials

# 2. Run with Docker Compose
docker-compose up -d

# 3. View logs
docker-compose logs -f
```

## Getting Facebook Credentials Fast

1. **Go to:** https://developers.facebook.com/tools/explorer/
2. **Select your app** (create one if needed)
3. **Click "Generate Access Token"**
4. **Grant permissions:** `pages_manage_posts`, `pages_read_engagement`
5. **Copy token** to `.env` as `FACEBOOK_PAGE_ACCESS_TOKEN`
6. **Get Page ID:** Visit your Facebook page → About → Copy Page ID

## One-Command Cloud Deploy

### Railway (Easiest)
```bash
npm install -g @railway/cli
railway login
railway init
railway variables set FACEBOOK_PAGE_ACCESS_TOKEN=xxx FACEBOOK_PAGE_ID=xxx
railway up
```

### Fly.io (Fast)
```bash
flyctl launch --name f1-facebook-poster
flyctl secrets set FACEBOOK_PAGE_ACCESS_TOKEN=xxx FACEBOOK_PAGE_ID=xxx
flyctl deploy
```

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT/f1-poster
gcloud run deploy f1-facebook-poster --image gcr.io/PROJECT/f1-poster \
  --set-secrets FACEBOOK_PAGE_ACCESS_TOKEN=token:latest
```

## Configuration Cheat Sheet

| Variable | Example | Description |
|----------|---------|-------------|
| `FACEBOOK_PAGE_ACCESS_TOKEN` | `EAABwz...` | Your page access token |
| `FACEBOOK_PAGE_ID` | `123456789` | Your Facebook page ID |
| `CRON_SCHEDULE` | `0 * * * *` | Check every hour |
| `AUTO_POST_ENABLED` | `true` | Auto-post when found |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Common Cron Schedules

- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - At 9 AM and 5 PM

## Troubleshooting

**Problem:** "Invalid Facebook access token"
**Solution:** Generate a new token at https://developers.facebook.com/tools/explorer/

**Problem:** "No completed sessions found"
**Solution:** Normal if no recent F1 races. Check F1 calendar.

**Problem:** Docker container stops
**Solution:** Check logs: `docker logs f1-facebook-poster`

## Project Structure

```
src/
├── services/
│   ├── f1-api.service.ts      # Fetches F1 data from OpenF1 API
│   └── facebook.service.ts    # Posts to Facebook
├── utils/
│   ├── formatter.ts           # Formats posts
│   └── logger.ts             # Logging
├── types/index.ts            # TypeScript types
├── config.ts                 # Configuration
├── poster.ts                 # Main orchestration
└── index.ts                  # Entry point
```

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js 20
- **F1 Data:** OpenF1 API (free, public)
- **Facebook:** Graph API v19
- **Scheduling:** node-cron
- **Container:** Docker

## Post Format Examples

### Race Result
```
#AUSGP 2026 Race

1. Hamilton (Ferrari) 1:31:26.262
2. Russell (Mercedes) +2.762s
3. Alonso (Aston Martin) +4.600s
```

### Next Session
```
Next Result: #ChinaGP 2026 Free Practice 1
```

## Support

- **Full Documentation:** See README.md
- **Cloud Deployment:** See DEPLOYMENT.md
- **Issues:** https://github.com/kfekete86/take_a_seat/issues

## License

MIT - Free to use and modify
