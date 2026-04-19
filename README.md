# F1 Facebook Poster

Automated service that posts Formula 1 session results to Facebook pages. This application fetches the latest F1 race, qualifying, and practice session results from public APIs and posts them to a Facebook page in a standardized format.

## Features

- ✅ Automatically fetches F1 calendar and session data from OpenF1 API
- ✅ Posts formatted session results to Facebook
- ✅ Announces upcoming sessions
- ✅ Configurable scheduling with cron
- ✅ Docker support for easy cloud deployment
- ✅ TypeScript for type safety
- ✅ Comprehensive logging

## Prerequisites

- Node.js 18+ or Docker
- Facebook Page with admin access
- Facebook Developer App with Page access

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kfekete86/take_a_seat.git
cd take_a_seat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Facebook credentials:

```env
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
FACEBOOK_PAGE_ID=your_page_id_here
CRON_SCHEDULE=0 * * * *
AUTO_POST_ENABLED=true
LOG_LEVEL=info
```

### 4. Build and Run

```bash
# Build TypeScript
npm run build

# Run the application
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Facebook Page Access Token | Yes | - |
| `FACEBOOK_PAGE_ID` | Facebook Page ID | Yes | - |
| `CRON_SCHEDULE` | Cron expression for scheduling | No | `0 * * * *` (hourly) |
| `AUTO_POST_ENABLED` | Enable automatic posting | No | `true` |
| `F1_SEASON` | F1 season year | No | Current year |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | No | `info` |

### Cron Schedule Examples

- `0 * * * *` - Every hour at minute 0
- `*/30 * * * *` - Every 30 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - At 9 AM and 5 PM daily
- `0 0 * * 0` - Weekly on Sunday at midnight

## Getting Facebook Credentials

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" type
4. Fill in app details and create

### Step 2: Get Page Access Token

1. In your app dashboard, go to "Tools" → "Graph API Explorer"
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Grant permissions:
   - `pages_manage_posts` - Required to post to page
   - `pages_read_engagement` - Required to read page data
5. Copy the generated token

**Important:** For production, generate a long-lived page access token:

```bash
curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

### Step 3: Get Page ID

1. Go to your Facebook Page
2. Click "About"
3. Scroll down to find "Page ID"
4. Or use Graph API Explorer: `GET /me/accounts` to list pages you manage

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker Directly

```bash
# Build image
docker build -t f1-facebook-poster .

# Run container
docker run -d \
  --name f1-facebook-poster \
  --env-file .env \
  --restart unless-stopped \
  f1-facebook-poster

# View logs
docker logs -f f1-facebook-poster
```

## Cloud Deployment

### AWS ECS

1. Build and push Docker image to ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker build -t f1-facebook-poster .
docker tag f1-facebook-poster:latest YOUR_ECR_URL/f1-facebook-poster:latest
docker push YOUR_ECR_URL/f1-facebook-poster:latest
```

2. Create ECS task definition with environment variables
3. Create ECS service with Fargate launch type

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/f1-facebook-poster
gcloud run deploy f1-facebook-poster \
  --image gcr.io/YOUR_PROJECT_ID/f1-facebook-poster \
  --platform managed \
  --region us-central1 \
  --set-env-vars "FACEBOOK_PAGE_ACCESS_TOKEN=xxx,FACEBOOK_PAGE_ID=xxx"
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name f1-facebook-poster \
  --image YOUR_REGISTRY/f1-facebook-poster:latest \
  --environment-variables \
    FACEBOOK_PAGE_ACCESS_TOKEN=xxx \
    FACEBOOK_PAGE_ID=xxx \
  --restart-policy Always
```

### Heroku

1. Create `heroku.yml`:

```yaml
build:
  docker:
    web: Dockerfile
```

2. Deploy:

```bash
heroku create your-app-name
heroku stack:set container
heroku config:set FACEBOOK_PAGE_ACCESS_TOKEN=xxx
heroku config:set FACEBOOK_PAGE_ID=xxx
git push heroku main
```

## Post Format

### Race Results Example

```
#AUSGP 2026 Race

1. Hamilton (Ferrari) 1:31:26.262
2. Russel (Mercedes) +2.762s
3. Alonso (Aston Martin) +4.600s
...
```

### Next Session Example

```
Next Result: #ChinaGP 2026 Free Practice 1
```

## Data Sources

This application uses the following public APIs:

- **OpenF1 API** (https://openf1.org/) - Free, public F1 data
  - Calendar/sessions data
  - Driver positions
  - Race control messages

## Development

### Project Structure

```
.
├── src/
│   ├── services/
│   │   ├── f1-api.service.ts      # F1 data fetching
│   │   └── facebook.service.ts    # Facebook API integration
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── utils/
│   │   ├── logger.ts              # Logging utility
│   │   └── formatter.ts           # Post formatting
│   ├── config.ts                  # Configuration management
│   ├── poster.ts                  # Main orchestration logic
│   └── index.ts                   # Application entry point
├── Dockerfile                     # Docker configuration
├── docker-compose.yml             # Docker Compose configuration
├── package.json                   # Node.js dependencies
├── tsconfig.json                  # TypeScript configuration
└── .env.example                   # Environment template
```

### Running in Development

```bash
# Install dependencies
npm install

# Run with ts-node (no build needed)
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint
```

### Building

```bash
npm run build
```

Output will be in `dist/` directory.

## Troubleshooting

### "Invalid Facebook access token"

- Ensure your token has not expired
- Verify you have the correct permissions
- Generate a long-lived token for production use

### "No completed sessions found"

- Check that the F1 season is active
- Verify the OpenF1 API is accessible
- Try adjusting the `F1_SEASON` environment variable

### "Failed to fetch F1 sessions"

- Check your internet connection
- Verify the OpenF1 API is not down
- Check for rate limiting

### Docker container exits immediately

- Check logs: `docker logs f1-facebook-poster`
- Verify environment variables are set correctly
- Ensure `.env` file exists and is properly formatted

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

kfekete86

## Acknowledgments

- [OpenF1](https://openf1.org/) for providing free F1 data
- Facebook Graph API for social media integration
