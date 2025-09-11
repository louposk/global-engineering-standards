# Tutorials and Guides

This comprehensive collection of tutorials and guides provides step-by-step instructions for implementing quality engineering and DevOps practices. Each tutorial includes practical examples, code samples, and best practices to help teams get started quickly.

## Getting Started Tutorials

### Setting Up Your First CI/CD Pipeline

#### Prerequisites
- GitHub repository with a simple application
- Docker installed locally
- Access to a cloud provider (AWS, Azure, or GCP)

#### Step-by-Step Guide

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

2. **GitHub Actions Workflow**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your deployment commands here
```

3. **Testing Your Pipeline**
   - Push code changes to trigger the pipeline
   - Monitor the GitHub Actions tab for build status
   - Verify tests pass and deployment succeeds

### Implementing Static Code Analysis

#### Using SonarQube

1. **Docker Compose Setup**
```yaml
# docker-compose.yml
version: '3.8'
services:
  sonarqube:
    image: sonarqube:community
    hostname: sonarqube
    container_name: sonarqube
    depends_on:
      - db
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    ports:
      - "9000:9000"
  
  db:
    image: postgres:13
    hostname: postgresql
    container_name: postgresql
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - postgresql:/var/lib/postgresql
      - postgresql_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgresql:
  postgresql_data:
```

2. **Project Configuration**
```properties
# sonar-project.properties
sonar.projectKey=my-application
sonar.projectName=My Application
sonar.projectVersion=1.0

sonar.sources=src
sonar.tests=tests
sonar.language=js
sonar.sourceEncoding=UTF-8

# Coverage reports
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Exclude files
sonar.exclusions=node_modules/**,coverage/**,dist/**
```

3. **CI Integration**
```yaml
# Add to GitHub Actions workflow
- name: SonarQube Scan
  uses: sonarqube-quality-gate-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### Setting Up Test Automation

#### JavaScript/TypeScript with Jest

1. **Installation**
```bash
npm install --save-dev jest @types/jest ts-jest typescript
```

2. **Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

3. **Sample Tests**
```typescript
// tests/user.service.test.ts
import { UserService } from '../src/services/user.service';
import { User } from '../src/models/user.model';

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService();
  });
  
  describe('createUser', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      };
      
      const user = await userService.createUser(userData);
      
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();
    });
    
    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        age: 25
      };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

## Intermediate Tutorials

### Infrastructure as Code with Terraform

#### Setting Up AWS Infrastructure

1. **Directory Structure**
```
terraform/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── vpc/
│   ├── compute/
│   └── database/
└── shared/
```

2. **VPC Module**
```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-vpc"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]
  
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}
```

3. **Environment Configuration**
```hcl
# environments/dev/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = "dev"
      Project     = "my-application"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"
  
  environment        = "dev"
  vpc_cidr          = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  
  common_tags = {
    Environment = "dev"
    Project     = "my-application"
  }
}
```

### Container Orchestration with Kubernetes

#### Deploying an Application

1. **Application Deployment**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myregistry/myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

2. **Service Configuration**
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

3. **ConfigMap and Secrets**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  app.properties: |
    server.port=3000
    logging.level=info
    cache.ttl=3600

---
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bob3N0OjU0MzIvZGI= # base64 encoded
  api-key: YWJjZGVmZ2hpams= # base64 encoded
```

### Monitoring Setup with Prometheus and Grafana

#### Prometheus Configuration

1. **Prometheus Config**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'myapp'
    static_configs:
      - targets: ['myapp:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

2. **Alert Rules**
```yaml
# rules/alerts.yml
groups:
- name: myapp.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
      description: "95th percentile latency is {{ $value }} seconds"
```

3. **Docker Compose Setup**
```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

## Advanced Tutorials

### Implementing Security Scanning in CI/CD

#### Multi-layered Security Pipeline

1. **Security Workflow**
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run Gitleaks
        uses: zricethezav/gitleaks-action@master
        with:
          config-path: .gitleaks.toml

  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto
          publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}
      
      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

2. **Security Configuration Files**
```toml
# .gitleaks.toml
title = "Gitleaks Configuration"

[extend]
path = "https://raw.githubusercontent.com/zricethezav/gitleaks/master/config/gitleaks.toml"

[[rules]]
description = "Custom API Key Pattern"
id = "custom-api-key"
regex = '''(?i)api[_-]?key[_-]?[=:\s]*['"]?([a-zA-Z0-9]{32,})['"]?'''
entropy = 3.5
secretGroup = 1

[[rules.allowlist]]
description = "Test API Keys"
regex = '''test[_-]?api[_-]?key'''
```

### Performance Testing Integration

#### Load Testing with k6

1. **Performance Test Script**
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],              // Custom error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test home page
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'home page loads': (r) => r.status === 200,
    'home page response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test API endpoint
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check passes': (r) => r.status === 200,
    'health check has correct body': (r) => r.json('status') === 'ok',
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test user creation
  const userData = {
    name: `User_${Math.random().toString(36).substr(2, 9)}`,
    email: `user_${Math.random().toString(36).substr(2, 9)}@example.com`,
  };
  
  response = http.post(`${BASE_URL}/api/users`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'user creation succeeds': (r) => r.status === 201,
    'user has id': (r) => r.json('id') !== undefined,
  }) || errorRate.add(1);
  
  sleep(1);
}
```

2. **CI Integration**
```yaml
# Add to GitHub Actions workflow
performance-test:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v3
    
    - name: Start application
      run: |
        docker run -d -p 3000:3000 --name myapp myapp:${{ github.sha }}
        sleep 30  # Wait for app to start
    
    - name: Run k6 performance tests
      uses: grafana/k6-action@v0.2.0
      with:
        filename: tests/performance/load-test.js
      env:
        BASE_URL: http://localhost:3000
    
    - name: Stop application
      run: docker stop myapp
```

## Troubleshooting Guides

### Common CI/CD Issues

#### Build Failures

**Problem**: Tests fail intermittently

**Solutions**:
1. **Flaky Test Identification**
```bash
# Run tests multiple times to identify flaky tests
for i in {1..10}; do
  echo "Test run $i"
  npm test -- --verbose
  if [ $? -ne 0 ]; then
    echo "Test failed on run $i"
  fi
done
```

2. **Test Isolation**
```javascript
// Use beforeEach/afterEach for proper test isolation
describe('UserService', () => {
  let database;
  
  beforeEach(async () => {
    database = await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase(database);
  });
  
  it('should create user', async () => {
    // Test implementation
  });
});
```

**Problem**: Docker build fails

**Solutions**:
1. **Multi-stage builds for debugging**
```dockerfile
# Add debug stage
FROM node:18-alpine AS debug
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Keep this stage for debugging

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build with debugging**
```bash
# Build debug stage
docker build --target debug -t myapp:debug .

# Run interactive container
docker run -it myapp:debug /bin/sh
```

### Infrastructure Troubleshooting

#### Terraform Issues

**Problem**: State file conflicts

**Solutions**:
1. **State locking with DynamoDB**
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

2. **State recovery**
```bash
# Import existing resources
terraform import aws_instance.web i-1234567890abcdef0

# Remove resources from state
terraform state rm aws_instance.web

# Move resources in state
terraform state mv aws_instance.web aws_instance.web_server
```

**Problem**: Resource drift detection

**Solution**: Regular drift checks
```bash
#!/bin/bash
# drift-check.sh
terraform plan -detailed-exitcode
if [ $? -eq 2 ]; then
  echo "Drift detected! Resources have changed outside of Terraform."
  terraform show
  exit 1
fi
```

### Monitoring and Alerting Issues

#### Prometheus Troubleshooting

**Problem**: Metrics not appearing

**Solutions**:
1. **Check target health**
```bash
# Check if targets are being scraped
curl http://localhost:9090/api/v1/targets
```

2. **Verify metrics endpoint**
```bash
# Check if application exposes metrics
curl http://myapp:3000/metrics
```

3. **Debug scrape configuration**
```yaml
# Add debug configuration
scrape_configs:
  - job_name: 'myapp-debug'
    static_configs:
      - targets: ['myapp:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
    scrape_timeout: 10s
    honor_labels: true
```

**Problem**: High cardinality metrics

**Solution**: Metric optimization
```javascript
// Avoid high cardinality labels
// Bad
http_requests_total{user_id="12345", endpoint="/api/users"}

// Good
http_requests_total{endpoint="/api/users"}
active_users_gauge{}
```

## Best Practices Summary

### CI/CD Best Practices

1. **Pipeline Design**
   - Keep pipelines fast (< 10 minutes for CI)
   - Fail fast with early validation
   - Use parallel jobs where possible
   - Cache dependencies aggressively

2. **Testing Strategy**
   - Implement test pyramid (unit > integration > e2e)
   - Maintain high test coverage (>80%)
   - Use test data builders for consistent test data
   - Implement smoke tests for production

3. **Security Integration**
   - Scan for secrets in every commit
   - Implement SAST and DAST scanning
   - Regularly update dependencies
   - Use least privilege access

### Infrastructure Best Practices

1. **Code Organization**
   - Use consistent naming conventions
   - Implement proper module structure
   - Version control everything
   - Document architectural decisions

2. **Security and Compliance**
   - Encrypt data at rest and in transit
   - Implement proper IAM policies
   - Regular security audits
   - Maintain audit trails

3. **Monitoring and Observability**
   - Implement comprehensive logging
   - Set up meaningful alerts
   - Use distributed tracing
   - Monitor business metrics

## Next Steps

After completing these tutorials:

1. **Assess Your Current State**
   - Audit existing practices
   - Identify improvement opportunities
   - Plan incremental improvements

2. **Implement Gradually**
   - Start with basic CI/CD
   - Add security scanning
   - Implement monitoring
   - Enhance with advanced features

3. **Continuous Improvement**
   - Regular retrospectives
   - Metric-driven optimization
   - Team training and knowledge sharing
   - Stay updated with best practices

4. **Community Engagement**
   - Contribute to open source projects
   - Share learnings with the community
   - Attend conferences and meetups
   - Build internal communities of practice

## Related Resources

- [Recommended Tools](recommended-tools.md) - Comprehensive tool recommendations
- [Schema Templates](schema-templates.md) - Ready-to-use configuration templates
- [CI/CD Pipelines](/devops-engineering/cicd-pipelines.md) - Advanced pipeline concepts
- [Test Automation](/quality-engineering/test-automation.md) - Testing strategies and frameworks