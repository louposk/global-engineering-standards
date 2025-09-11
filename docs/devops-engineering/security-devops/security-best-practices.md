# Security Best Practices for DevOps

Security in DevOps (DevSecOps) integrates security practices throughout the software development and deployment pipeline. This comprehensive guide covers essential security practices, tools, and methodologies for maintaining secure DevOps environments.

## Overview

DevSecOps encompasses:
- **Shift-Left Security**: Integrating security early in the development lifecycle
- **Continuous Security**: Ongoing security monitoring and validation
- **Infrastructure Security**: Securing the underlying infrastructure and platforms
- **Application Security**: Protecting applications and data throughout the pipeline
- **Compliance**: Meeting regulatory and organizational security requirements

## Fundamental Security Principles

### Defense in Depth
- **Multiple Security Layers**: Implement overlapping security controls
- **Fail-Safe Defaults**: Secure by default configurations
- **Least Privilege**: Grant minimum necessary permissions
- **Zero Trust**: Never trust, always verify approach

### Security by Design
- **Threat Modeling**: Identify potential security risks early
- **Secure Architecture**: Design systems with security considerations
- **Risk Assessment**: Evaluate and prioritize security risks
- **Security Requirements**: Include security in functional requirements

## Pipeline Security

### Source Code Security

#### Repository Security
```yaml
# .github/branch-protection.yml
branch_protection_rules:
  main:
    required_status_checks:
      strict: true
      contexts:
        - security-scan
        - code-quality
        - tests
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    restrictions:
      users: []
      teams: ["security-team", "senior-developers"]
```

#### Pre-commit Security Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: detect-private-key
      - id: end-of-file-fixer
      - id: trailing-whitespace

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/bridgecrewio/checkov
    rev: 2.5.0
    hooks:
      - id: checkov
        args: ['-d', '.', '--framework', 'terraform', '--framework', 'dockerfile']

  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tfsec
      - id: terraform_checkov
```

#### Static Application Security Testing (SAST)
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, python, java

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      - name: Run Bandit (Python)
        run: |
          pip install bandit
          bandit -r . -f json -o bandit-report.json
        continue-on-error: true

      - name: Run ESLint Security (JavaScript)
        run: |
          npm install eslint-plugin-security
          npx eslint --ext .js,.ts --format json --output-file eslint-security.json .
        continue-on-error: true

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --debug --only-verified

      - name: Run Gitleaks
        uses: zricethezav/gitleaks-action@master
        with:
          config-path: .gitleaks.toml
```

### Container Security

#### Dockerfile Security Best Practices
```dockerfile
# Secure Dockerfile example
# Use official, minimal base image
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies as root, then switch user
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### Container Image Scanning
```yaml
# Container security scanning pipeline
name: Container Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk container scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: myapp:${{ github.sha }}
          args: --severity-threshold=high

      - name: Run Docker Bench for Security
        run: |
          docker run --rm --net host --pid host --userns host --cap-add audit_control \
            -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
            -v /var/lib:/var/lib:ro \
            -v /var/run/docker.sock:/var/run/docker.sock:ro \
            -v /usr/lib/systemd:/usr/lib/systemd:ro \
            -v /etc:/etc:ro \
            --label docker_bench_security \
            docker/docker-bench-security
```

### Infrastructure as Code Security

#### Terraform Security Scanning
```hcl
# terraform/security.tf - Security configuration example

# Enable CloudTrail for audit logging
resource "aws_cloudtrail" "security_trail" {
  name                          = "${var.environment}-security-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_bucket.bucket
  s3_key_prefix               = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  enable_log_file_validation   = true
  kms_key_id                  = aws_kms_key.cloudtrail_key.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.sensitive_data.arn}/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*"]
    }
  }

  tags = local.security_tags
}

# Security Group with restrictive rules
resource "aws_security_group" "web_sg" {
  name_prefix = "web-sg-"
  vpc_id      = var.vpc_id

  # Allow HTTPS from ALB only
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Allow HTTP from ALB only (for health checks)
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Egress rules
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Database access
  egress {
    description     = "Database access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.db_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "web-security-group"
    Type = "security"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# S3 bucket with security configurations
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "${var.company}-${var.environment}-secure-data"

  tags = local.security_tags
}

# Enable versioning
resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role with least privilege
resource "aws_iam_role" "app_role" {
  name = "${var.environment}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })

  tags = local.security_tags
}

resource "aws_iam_role_policy" "app_policy" {
  name = "${var.environment}-app-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.secure_bucket.arn}/app-data/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_key.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}
```

#### Security Policy Validation
```bash
#!/bin/bash
# security-validation.sh

set -e

echo "Running Terraform security validation..."

# Format check
terraform fmt -check -recursive

# Validation
terraform validate

# Security scanning with multiple tools
echo "Running Checkov..."
checkov -d . --framework terraform --compact --quiet

echo "Running tfsec..."
tfsec . --format json --out tfsec-report.json

echo "Running Terrascan..."
terrascan scan -t terraform -f json -o terrascan-report.json

# Custom policy validation
echo "Running custom policy checks..."
python3 scripts/validate-security-policies.py

echo "Security validation completed successfully!"
```

## Application Security

### Secure Configuration Management

#### Environment-specific Security Configuration
```yaml
# config/security.yml
security:
  development:
    cors:
      allowed_origins: ['http://localhost:3000', 'http://localhost:8080']
    csrf_protection: false
    ssl_required: false
    session:
      secure: false
      same_site: 'lax'
    
  staging:
    cors:
      allowed_origins: ['https://staging.company.com']
    csrf_protection: true
    ssl_required: true
    session:
      secure: true
      same_site: 'strict'
    headers:
      force_https: true
      hsts_max_age: 31536000
  
  production:
    cors:
      allowed_origins: ['https://app.company.com']
    csrf_protection: true
    ssl_required: true
    session:
      secure: true
      same_site: 'strict'
      http_only: true
    headers:
      force_https: true
      hsts_max_age: 31536000
      content_security_policy:
        default_src: "'self'"
        script_src: "'self' 'unsafe-inline'"
        style_src: "'self' 'unsafe-inline'"
        img_src: "'self' data: https:"
        font_src: "'self'"
        connect_src: "'self' https://api.company.com"
```

#### Security Headers Implementation
```javascript
// security-headers.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware configuration
function setupSecurity(app, config) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", config.api_base_url],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.environment === 'production' ? 100 : 1000,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });

  app.use(limiter);

  // Additional security middleware
  app.use((req, res, next) => {
    // Remove server header
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (config.ssl_required) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  });
}

module.exports = { setupSecurity };
```

### Input Validation and Sanitization

```javascript
// validation.js
const Joi = require('joi');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Input validation schemas
const schemas = {
  user: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'strong password'),
    name: Joi.string().trim().min(2).max(100).required()
      .pattern(/^[a-zA-Z\s'-]+$/, 'valid name'),
    age: Joi.number().integer().min(13).max(120)
  }),
  
  content: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    body: Joi.string().trim().min(1).max(10000).required(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10)
  })
};

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
}

// HTML sanitization
function sanitizeHtml(dirty) {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https?:\/\//
  });
}

// SQL injection prevention (using parameterized queries)
class DatabaseService {
  async getUserById(id) {
    // Good: Parameterized query
    const query = 'SELECT * FROM users WHERE id = $1';
    return await this.db.query(query, [id]);
  }
  
  async searchUsers(term) {
    // Good: Escaped and validated input
    const safeTerm = `%${term.replace(/[%_]/g, '\\$&')}%`;
    const query = 'SELECT id, name, email FROM users WHERE name ILIKE $1 LIMIT 50';
    return await this.db.query(query, [safeTerm]);
  }
}

module.exports = {
  schemas,
  validate,
  sanitizeHtml,
  DatabaseService
};
```

## Network Security

### Network Segmentation

```hcl
# network-security.tf
# VPC with multiple subnets for segmentation
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc"
  })
}

# Public subnets for load balancers
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]
  
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private subnets for applications
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Database subnets (isolated)
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 8)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-database-subnet-${count.index + 1}"
    Type = "database"
  })
}

# Network ACLs for additional layer of security
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound HTTP/HTTPS from public subnets
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_subnet.public[0].cidr_block
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = aws_subnet.public[0].cidr_block
    from_port  = 443
    to_port    = 443
  }

  # Allow outbound HTTPS
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow outbound database connections
  egress {
    protocol   = "tcp"
    rule_no    = 200
    action     = "allow"
    cidr_block = aws_subnet.database[0].cidr_block
    from_port  = 5432
    to_port    = 5432
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-nacl"
  })
}
```

### Web Application Firewall (WAF)

```hcl
# waf.tf
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.environment}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Known Bad Inputs
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection Protection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule (if needed)
  rule {
    name     = "GeoBlockRule"
    priority = 5

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }

  tags = local.security_tags

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}WAF"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with Application Load Balancer
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

## Monitoring and Security Analytics

### Security Event Monitoring

```python
# security_monitor.py
import json
import boto3
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch

class SecurityMonitor:
    def __init__(self, es_host, aws_region):
        self.es = Elasticsearch([es_host])
        self.cloudtrail = boto3.client('cloudtrail', region_name=aws_region)
        self.guardduty = boto3.client('guardduty', region_name=aws_region)
    
    def detect_suspicious_login_activity(self):
        """Detect multiple failed login attempts"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"event_type": "login_failed"}},
                        {"range": {
                            "@timestamp": {
                                "gte": "now-15m",
                                "lte": "now"
                            }
                        }}
                    ]
                }
            },
            "aggs": {
                "by_ip": {
                    "terms": {
                        "field": "source_ip.keyword",
                        "min_doc_count": 5
                    }
                }
            }
        }
        
        result = self.es.search(index="security-*", body=query)
        
        suspicious_ips = []
        for bucket in result['aggregations']['by_ip']['buckets']:
            if bucket['doc_count'] >= 5:
                suspicious_ips.append({
                    'ip': bucket['key'],
                    'failed_attempts': bucket['doc_count']
                })
        
        return suspicious_ips
    
    def check_privilege_escalation(self):
        """Monitor for privilege escalation attempts"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        response = self.cloudtrail.lookup_events(
            LookupAttributes=[
                {
                    'AttributeKey': 'EventName',
                    'AttributeValue': 'AssumeRole'
                },
            ],
            StartTime=start_time,
            EndTime=end_time
        )
        
        suspicious_events = []
        for event in response['Events']:
            # Check for role assumptions from unusual sources
            if self._is_unusual_role_assumption(event):
                suspicious_events.append(event)
        
        return suspicious_events
    
    def _is_unusual_role_assumption(self, event):
        """Analyze CloudTrail event for suspicious role assumptions"""
        # Implementation depends on your baseline behavior
        source_ip = event.get('SourceIPAddress', '')
        user_identity = event.get('UserIdentity', {})
        
        # Check for assumptions from unusual IP ranges
        if not self._is_known_ip(source_ip):
            return True
        
        # Check for cross-account role assumptions
        if self._is_cross_account_assumption(user_identity):
            return True
        
        return False
    
    def generate_security_report(self):
        """Generate comprehensive security report"""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'suspicious_logins': self.detect_suspicious_login_activity(),
            'privilege_escalation': self.check_privilege_escalation(),
            'guardduty_findings': self._get_recent_guardduty_findings(),
            'waf_blocked_requests': self._get_waf_metrics()
        }
        
        return report
    
    def _get_recent_guardduty_findings(self):
        """Get recent GuardDuty findings"""
        try:
            detectors = self.guardduty.list_detectors()
            if not detectors['DetectorIds']:
                return []
            
            detector_id = detectors['DetectorIds'][0]
            findings = self.guardduty.list_findings(
                DetectorId=detector_id,
                FindingCriteria={
                    'Criterion': {
                        'updatedAt': {
                            'gte': int((datetime.utcnow() - timedelta(hours=24)).timestamp() * 1000)
                        }
                    }
                }
            )
            
            return findings.get('FindingIds', [])
        except Exception as e:
            print(f"Error getting GuardDuty findings: {e}")
            return []
```

### Security Dashboards

```json
{
  "dashboard": {
    "id": null,
    "title": "Security Operations Dashboard",
    "tags": ["security", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Failed Login Attempts",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(increase(auth_failed_total[5m]))",
            "legendFormat": "Failed Logins"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 10},
                {"color": "red", "value": 50}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Security Events Timeline",
        "type": "logs",
        "targets": [
          {
            "expr": "{job=\"security\"} |= \"SECURITY\"",
            "refId": "A"
          }
        ]
      },
      {
        "id": 3,
        "title": "WAF Blocked Requests",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(aws_waf_blocked_requests_total[5m])",
            "legendFormat": "Blocked Requests/sec"
          }
        ]
      },
      {
        "id": 4,
        "title": "Top Blocked IPs",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (source_ip) (increase(security_blocked_ip_total[1h])))"
          }
        ]
      }
    ],
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

## Getting Started Checklist

### Pipeline Security
- [ ] Implement pre-commit security hooks
- [ ] Set up SAST scanning in CI/CD pipelines
- [ ] Configure container image vulnerability scanning
- [ ] Enable dependency vulnerability scanning
- [ ] Set up infrastructure as code security validation
- [ ] Implement secrets scanning and detection

### Infrastructure Security
- [ ] Configure network segmentation and security groups
- [ ] Implement Web Application Firewall (WAF)
- [ ] Set up logging and monitoring for security events
- [ ] Enable encryption at rest and in transit
- [ ] Configure identity and access management (IAM)
- [ ] Implement backup and disaster recovery procedures

### Application Security
- [ ] Implement secure coding practices
- [ ] Set up input validation and sanitization
- [ ] Configure security headers and HTTPS
- [ ] Implement authentication and authorization
- [ ] Set up session management and protection
- [ ] Configure error handling and logging

### Monitoring and Response
- [ ] Set up security event monitoring and alerting
- [ ] Create security incident response procedures
- [ ] Implement security dashboards and reporting
- [ ] Configure automated threat detection
- [ ] Set up security audit logging
- [ ] Plan regular security assessments and penetration testing

## Related Topics

- [Secrets Management](secrets-management.md) - Secure handling of sensitive data
- [Compliance](compliance.md) - Meeting regulatory and industry standards
- [Infrastructure as Code](/devops-engineering/infrastructure-as-code.md) - Secure infrastructure automation
- [Monitoring and Logging](/devops-engineering/monitoring-logging/tools-grafana-elk.md) - Security monitoring implementation