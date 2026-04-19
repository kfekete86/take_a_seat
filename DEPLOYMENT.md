# Deployment Guide

This guide provides detailed instructions for deploying the F1 Facebook Poster to various cloud platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [AWS Deployment](#aws-deployment)
- [Google Cloud Platform](#google-cloud-platform)
- [Azure Deployment](#azure-deployment)
- [DigitalOcean](#digitalocean)
- [Railway](#railway)
- [Fly.io](#flyio)
- [Environment Management](#environment-management)
- [Monitoring and Logging](#monitoring-and-logging)

## Prerequisites

Before deploying, ensure you have:

1. **Facebook Credentials**
   - Page Access Token (long-lived recommended)
   - Page ID

2. **Docker** (for container-based deployments)
   - Docker installed locally for testing
   - Docker Hub or cloud container registry account

3. **Cloud Platform Account**
   - Choose one of the supported platforms below

## AWS Deployment

### Option 1: AWS ECS with Fargate (Serverless)

#### Step 1: Create ECR Repository

```bash
# Login to AWS
aws configure

# Create ECR repository
aws ecr create-repository --repository-name f1-facebook-poster --region us-east-1

# Get the repository URI
aws ecr describe-repositories --repository-names f1-facebook-poster --query 'repositories[0].repositoryUri' --output text
```

#### Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t f1-facebook-poster .

# Tag image
docker tag f1-facebook-poster:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/f1-facebook-poster:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/f1-facebook-poster:latest
```

#### Step 3: Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "f1-facebook-poster",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "f1-facebook-poster",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/f1-facebook-poster:latest",
      "essential": true,
      "environment": [
        {
          "name": "CRON_SCHEDULE",
          "value": "0 * * * *"
        },
        {
          "name": "AUTO_POST_ENABLED",
          "value": "true"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        }
      ],
      "secrets": [
        {
          "name": "FACEBOOK_PAGE_ACCESS_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:f1-facebook-token"
        },
        {
          "name": "FACEBOOK_PAGE_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:f1-facebook-page-id"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/f1-facebook-poster",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 4: Store Secrets in AWS Secrets Manager

```bash
# Store Facebook token
aws secretsmanager create-secret \
  --name f1-facebook-token \
  --secret-string "YOUR_FACEBOOK_TOKEN" \
  --region us-east-1

# Store Page ID
aws secretsmanager create-secret \
  --name f1-facebook-page-id \
  --secret-string "YOUR_PAGE_ID" \
  --region us-east-1
```

#### Step 5: Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/f1-facebook-poster --region us-east-1
```

#### Step 6: Register Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 7: Create ECS Cluster and Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name f1-poster-cluster --region us-east-1

# Create service
aws ecs create-service \
  --cluster f1-poster-cluster \
  --service-name f1-facebook-poster \
  --task-definition f1-facebook-poster \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### Option 2: AWS Lambda (Scheduled Function)

Create a Lambda function with the Docker image and set up EventBridge to trigger it hourly.

## Google Cloud Platform

### Option 1: Cloud Run (Recommended)

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and submit
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/f1-facebook-poster

# Deploy
gcloud run deploy f1-facebook-poster \
  --image gcr.io/YOUR_PROJECT_ID/f1-facebook-poster \
  --platform managed \
  --region us-central1 \
  --set-env-vars "CRON_SCHEDULE=0 * * * *,AUTO_POST_ENABLED=true,LOG_LEVEL=info" \
  --set-secrets "FACEBOOK_PAGE_ACCESS_TOKEN=facebook-token:latest,FACEBOOK_PAGE_ID=facebook-page-id:latest" \
  --no-allow-unauthenticated \
  --cpu 1 \
  --memory 512Mi
```

### Option 2: Google Kubernetes Engine (GKE)

```bash
# Create cluster
gcloud container clusters create f1-poster-cluster --num-nodes=1 --machine-type=e2-small

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/f1-facebook-poster

# Create Kubernetes deployment
kubectl create deployment f1-facebook-poster --image=gcr.io/YOUR_PROJECT_ID/f1-facebook-poster

# Create secrets
kubectl create secret generic facebook-credentials \
  --from-literal=token=YOUR_TOKEN \
  --from-literal=page-id=YOUR_PAGE_ID
```

## Azure Deployment

### Azure Container Instances

```bash
# Login
az login

# Create resource group
az group create --name f1-poster-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group f1-poster-rg --name f1posterregistry --sku Basic

# Login to ACR
az acr login --name f1posterregistry

# Build and push
docker build -t f1-facebook-poster .
docker tag f1-facebook-poster f1posterregistry.azurecr.io/f1-facebook-poster:latest
docker push f1posterregistry.azurecr.io/f1-facebook-poster:latest

# Deploy to ACI
az container create \
  --resource-group f1-poster-rg \
  --name f1-facebook-poster \
  --image f1posterregistry.azurecr.io/f1-facebook-poster:latest \
  --registry-login-server f1posterregistry.azurecr.io \
  --registry-username $(az acr credential show --name f1posterregistry --query username -o tsv) \
  --registry-password $(az acr credential show --name f1posterregistry --query passwords[0].value -o tsv) \
  --environment-variables \
    CRON_SCHEDULE='0 * * * *' \
    AUTO_POST_ENABLED=true \
    LOG_LEVEL=info \
  --secure-environment-variables \
    FACEBOOK_PAGE_ACCESS_TOKEN='YOUR_TOKEN' \
    FACEBOOK_PAGE_ID='YOUR_PAGE_ID' \
  --cpu 1 \
  --memory 0.5 \
  --restart-policy Always
```

## DigitalOcean

### DigitalOcean App Platform

1. **Via Web Console:**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Configure environment variables
   - Deploy

2. **Via CLI:**

```bash
# Install doctl
brew install doctl  # macOS
# or download from https://github.com/digitalocean/doctl

# Authenticate
doctl auth init

# Create app spec (app.yaml)
cat > app.yaml <<EOF
name: f1-facebook-poster
services:
- name: worker
  github:
    repo: YOUR_USERNAME/take_a_seat
    branch: main
    deploy_on_push: true
  dockerfile_path: Dockerfile
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: CRON_SCHEDULE
    value: "0 * * * *"
  - key: AUTO_POST_ENABLED
    value: "true"
  - key: LOG_LEVEL
    value: "info"
  - key: FACEBOOK_PAGE_ACCESS_TOKEN
    value: YOUR_TOKEN
    type: SECRET
  - key: FACEBOOK_PAGE_ID
    value: YOUR_PAGE_ID
    type: SECRET
EOF

# Create app
doctl apps create --spec app.yaml
```

## Railway

Railway offers the simplest deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
railway variables set FACEBOOK_PAGE_ID=your_page_id
railway variables set CRON_SCHEDULE="0 * * * *"
railway variables set AUTO_POST_ENABLED=true

# Deploy
railway up
```

Or use the Railway web interface:
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

## Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app (creates fly.toml)
flyctl launch --name f1-facebook-poster

# Set secrets
flyctl secrets set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
flyctl secrets set FACEBOOK_PAGE_ID=your_page_id

# Deploy
flyctl deploy
```

## Environment Management

### Best Practices for Secrets

1. **Never commit secrets to Git**
   - Use `.env` for local development only
   - Add `.env` to `.gitignore`

2. **Use platform-specific secret management**
   - AWS: Secrets Manager or Parameter Store
   - GCP: Secret Manager
   - Azure: Key Vault
   - Others: Built-in secret storage

3. **Rotate tokens regularly**
   - Generate new Facebook tokens periodically
   - Update secrets in your deployment platform

### Secret Rotation Script

```bash
#!/bin/bash
# rotate-facebook-token.sh

# Get new token from Facebook
NEW_TOKEN="your_new_token"

# Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id f1-facebook-token \
  --secret-string "$NEW_TOKEN"

# Restart ECS service to pick up new secret
aws ecs update-service \
  --cluster f1-poster-cluster \
  --service f1-facebook-poster \
  --force-new-deployment
```

## Monitoring and Logging

### AWS CloudWatch

```bash
# View logs
aws logs tail /ecs/f1-facebook-poster --follow

# Create metric filter for errors
aws logs put-metric-filter \
  --log-group-name /ecs/f1-facebook-poster \
  --filter-name ErrorCount \
  --filter-pattern "[ERROR]" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=F1Poster,metricValue=1
```

### GCP Cloud Logging

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=f1-facebook-poster" --limit 50

# Follow logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=f1-facebook-poster"
```

### Healthcheck Endpoints

Add to your application for cloud platform health checks:

```typescript
// Add to src/index.ts
import http from 'http';

// Create simple health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

server.listen(3000);
```

## Cost Optimization

### Estimated Monthly Costs

| Platform | Configuration | Est. Cost |
|----------|--------------|-----------|
| AWS ECS Fargate | 256 CPU, 512 MB | ~$5-10 |
| GCP Cloud Run | 1 vCPU, 512 MB | ~$5-8 |
| Azure ACI | 1 vCPU, 0.5 GB | ~$10-15 |
| DigitalOcean | Basic XXS | $5 |
| Railway | Starter | $5 |
| Fly.io | Shared CPU | $3-5 |

### Tips to Reduce Costs

1. Use smaller container sizes (256 MB RAM is often sufficient)
2. Schedule checks less frequently if possible
3. Use serverless options (Cloud Run, Lambda) that charge per-use
4. Monitor usage and right-size resources

## Troubleshooting Deployments

### Container Exits Immediately

```bash
# Check logs
docker logs f1-facebook-poster

# Run interactively
docker run -it --entrypoint /bin/sh f1-facebook-poster

# Verify environment variables
docker run --env-file .env f1-facebook-poster env
```

### Network Issues

Ensure your cloud platform allows outbound HTTPS connections:
- OpenF1 API: `https://api.openf1.org`
- Facebook Graph API: `https://graph.facebook.com`

### Facebook API Errors

Common issues:
- Token expired: Generate new long-lived token
- Missing permissions: Re-authorize with correct scopes
- Rate limiting: Reduce check frequency

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test locally with Docker first

## Next Steps

After deployment:
1. Monitor logs for first few hours
2. Verify posts are being made to Facebook
3. Set up alerts for failures
4. Consider adding a database for state persistence
