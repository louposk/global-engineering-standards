# Best Practices for Infrastructure as Code

Infrastructure as Code (IaC) best practices ensure reliable, maintainable, and secure infrastructure management. This guide provides comprehensive guidelines for implementing IaC effectively across different tools and environments.

## Overview

IaC best practices cover several key areas:
- **Code Organization**: Structuring IaC projects for maintainability
- **Security**: Implementing security throughout the IaC lifecycle
- **Testing**: Validating infrastructure code before deployment
- **Version Control**: Managing infrastructure changes systematically
- **Collaboration**: Enabling effective team workflows

## Core Principles

### Declarative over Imperative
- **Define desired state** rather than step-by-step instructions
- **Idempotent operations** that can be safely repeated
- **Self-documenting** infrastructure definitions
- **Predictable outcomes** regardless of current state

### Version Control Everything
- All infrastructure code in version control
- Infrastructure changes through pull requests
- Tagged releases for infrastructure versions
- Audit trail of all infrastructure modifications

### Immutable Infrastructure
- Replace rather than modify infrastructure components
- Avoid configuration drift through immutable patterns
- Blue-green and canary deployment strategies
- Consistent environments through recreation

### Modular and Reusable
- Create reusable modules for common patterns
- Separate concerns with proper abstraction
- Share modules across projects and teams
- Maintain backwards compatibility

## Code Organization Best Practices

### Directory Structure

#### Terraform Project Structure
```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── compute/
│   └── database/
├── shared/
│   ├── backend.tf
│   └── providers.tf
└── docs/
    ├── architecture.md
    └── runbooks/
```

#### Ansible Project Structure
```
ansible/
├── inventories/
│   ├── dev/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   ├── staging/
│   └── prod/
├── roles/
│   ├── common/
│   ├── webserver/
│   └── database/
├── playbooks/
│   ├── site.yml
│   ├── deploy.yml
│   └── maintenance.yml
├── filter_plugins/
├── library/
└── ansible.cfg
```

### Naming Conventions

#### Resource Naming
- **Consistent patterns**: Use organization-wide naming standards
- **Environment indication**: Include environment in resource names
- **Purpose clarity**: Names should indicate resource purpose
- **Avoid conflicts**: Ensure globally unique names where required

**Example Naming Convention**:
```hcl
# Format: <org>-<env>-<service>-<resource-type>-<suffix>
resource "aws_instance" "web_server" {
  tags = {
    Name = "acme-prod-webapp-ec2-01"
    Environment = "production"
    Service = "webapp"
    Team = "platform"
  }
}
```

#### Variable Naming
- **Descriptive names**: Clear purpose and usage
- **Consistent casing**: snake_case for Terraform, kebab-case for Ansible
- **Logical grouping**: Related variables grouped together
- **Default values**: Sensible defaults where appropriate

### Module Design Patterns

#### Single Responsibility
```hcl
# Good: Focused module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = local.common_tags
}

# Avoid: Monolithic module that does everything
module "entire_infrastructure" {
  source = "./modules/everything"
  # ... hundreds of variables
}
```

#### Composition over Inheritance
```hcl
# Compose multiple focused modules
module "vpc" {
  source = "./modules/vpc"
  # VPC-specific variables
}

module "security_groups" {
  source = "./modules/security-groups"
  vpc_id = module.vpc.vpc_id
  # Security group specific variables
}

module "compute" {
  source = "./modules/compute"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = module.security_groups.web_sg_id
}
```

## Security Best Practices

### Secrets Management

#### Never Hardcode Secrets
```hcl
# Bad: Hardcoded secrets
resource "aws_db_instance" "main" {
  password = "hardcoded-password"  # Never do this!
}

# Good: Use secret management
resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
}
```

#### External Secret Management
```yaml
# Ansible with external secrets
- name: Deploy application with secrets
  docker_container:
    name: myapp
    image: myapp:latest
    env:
      DB_PASSWORD: "{{ vault_db_password }}"
      API_KEY: "{{ lookup('aws_secretsmanager', 'api-key', region='us-east-1') }}"
```

### Access Control

#### Least Privilege Principle
```hcl
# Specific IAM policies
resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda-specific-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

#### Network Security
```hcl
# Restrictive security groups
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from ALB"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "web-security-group"
  })
}
```

### State File Security

#### Remote State Backend
```hcl
# Secure Terraform backend
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "prod/infrastructure.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
    
    # Additional security
    kms_key_id = "arn:aws:kms:us-east-1:123456789:key/12345678-1234-1234"
  }
}
```

#### State File Access Control
```hcl
# S3 bucket policy for state files
resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}
```

## Testing Strategies

### Static Analysis

#### Terraform Validation
```bash
# Basic validation
terraform fmt -check
terraform validate

# Advanced static analysis
tflint --config=.tflint.hcl
checkov -d .
terrascan scan -t terraform
```

#### Ansible Validation
```bash
# Syntax checking
ansible-playbook --syntax-check site.yml

# Lint checking
ansible-lint playbooks/
yamllint .
```

### Unit Testing

#### Terraform Unit Tests
```hcl
# Example using Terratest
package test

import (
  "testing"
  "github.com/gruntwork-io/terratest/modules/terraform"
  "github.com/stretchr/testify/assert"
)

func TestVPCModule(t *testing.T) {
  terraformOptions := &terraform.Options{
    TerraformDir: "../modules/vpc",
    Vars: map[string]interface{}{
      "vpc_cidr": "10.0.0.0/16",
      "availability_zones": []string{"us-east-1a", "us-east-1b"},
    },
  }

  defer terraform.Destroy(t, terraformOptions)
  terraform.InitAndApply(t, terraformOptions)

  vpcId := terraform.Output(t, terraformOptions, "vpc_id")
  assert.NotEmpty(t, vpcId)
}
```

#### Ansible Testing with Molecule
```yaml
# molecule/default/molecule.yml
dependency:
  name: galaxy
driver:
  name: docker
platforms:
  - name: instance
    image: ubuntu:20.04
    pre_build_image: true
provisioner:
  name: ansible
verifier:
  name: ansible
```

```yaml
# molecule/default/verify.yml
- name: Verify
  hosts: all
  gather_facts: false
  tasks:
    - name: Check if nginx is running
      systemd:
        name: nginx
        state: started
      check_mode: yes
      register: nginx_status
      failed_when: nginx_status.changed
```

### Integration Testing

#### Infrastructure Testing Pipeline
```yaml
# .github/workflows/infrastructure-test.yml
name: Infrastructure Testing

on:
  pull_request:
    paths:
      - 'infrastructure/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
      
      - name: Terraform Init
        run: terraform init
        working-directory: ./infrastructure/environments/test
      
      - name: Terraform Plan
        run: terraform plan
        working-directory: ./infrastructure/environments/test
        env:
          TF_VAR_environment: test
      
      - name: Run Terratest
        run: |
          cd test
          go mod tidy
          go test -v -timeout 30m
```

## Version Control Best Practices

### Branching Strategy

#### GitFlow for Infrastructure
```
main (production)
├── develop (integration)
│   ├── feature/vpc-updates
│   ├── feature/security-groups
│   └── hotfix/critical-security-patch
└── release/v1.2.0
```

#### Pull Request Workflow
1. **Create feature branch** from develop
2. **Implement changes** with proper testing
3. **Run automated validation** (CI/CD pipeline)
4. **Peer review** with infrastructure team
5. **Merge to develop** after approval
6. **Deploy to staging** for integration testing
7. **Create release branch** for production deployment

### Commit Practices

#### Conventional Commits
```
feat(vpc): add support for additional availability zones
fix(security): update security group rules for database access
docs(readme): add deployment instructions
refactor(modules): restructure compute module for better reusability
```

#### Atomic Commits
- Each commit should represent a single logical change
- Include tests and documentation in the same commit
- Ensure each commit leaves the infrastructure in a valid state

### Tagging and Releases

#### Semantic Versioning
```bash
# Major version: Breaking changes
git tag -a v2.0.0 -m "Major infrastructure refactor"

# Minor version: New features (backward compatible)
git tag -a v1.3.0 -m "Add monitoring infrastructure"

# Patch version: Bug fixes
git tag -a v1.2.1 -m "Fix security group configuration"
```

## Environment Management

### Environment Separation

#### Directory-Based Separation
```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       └── terraform.tfvars
```

#### Workspace-Based Separation
```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Use workspace-specific variables
locals {
  environment_config = {
    dev = {
      instance_type = "t3.micro"
      min_capacity  = 1
      max_capacity  = 2
    }
    prod = {
      instance_type = "t3.large"
      min_capacity  = 3
      max_capacity  = 10
    }
  }
  config = local.environment_config[terraform.workspace]
}
```

### Configuration Management

#### Environment-Specific Variables
```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "instance_config" {
  description = "Instance configuration per environment"
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
  }))
  default = {
    dev = {
      instance_type = "t3.micro"
      min_size      = 1
      max_size      = 2
    }
    staging = {
      instance_type = "t3.small"
      min_size      = 2
      max_size      = 4
    }
    prod = {
      instance_type = "t3.large"
      min_size      = 3
      max_size      = 10
    }
  }
}
```

## Monitoring and Observability

### Infrastructure Monitoring

#### CloudWatch for AWS Resources
```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.environment}-high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = local.common_tags
}
```

#### Prometheus Monitoring
```yaml
# Ansible playbook for Prometheus setup
- name: Deploy Prometheus monitoring
  hosts: monitoring
  become: yes
  tasks:
    - name: Create Prometheus configuration
      template:
        src: prometheus.yml.j2
        dest: /etc/prometheus/prometheus.yml
        backup: yes
      notify: restart prometheus
    
    - name: Deploy Prometheus container
      docker_container:
        name: prometheus
        image: prom/prometheus:latest
        state: started
        restart_policy: always
        ports:
          - "9090:9090"
        volumes:
          - "/etc/prometheus:/etc/prometheus"
          - "prometheus_data:/prometheus"
        command:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
```

### Logging and Auditing

#### CloudTrail for AWS
```hcl
resource "aws_cloudtrail" "main" {
  name                          = "${var.environment}-cloudtrail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.bucket
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.sensitive_data.arn}/*"]
    }
  }

  tags = local.common_tags
}
```

### Infrastructure Drift Detection

```bash
#!/bin/bash
# Script to detect infrastructure drift

set -e

ENVIRONMENT=${1:-dev}
echo "Checking for infrastructure drift in $ENVIRONMENT environment..."

cd "environments/$ENVIRONMENT"

# Initialize Terraform
terraform init

# Run plan and capture output
terraform plan -detailed-exitcode -out=tfplan
EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
    echo "❌ Terraform plan failed"
    exit 1
elif [ $EXIT_CODE -eq 2 ]; then
    echo "⚠️  Infrastructure drift detected!"
    terraform show tfplan
    
    # Send alert
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Infrastructure drift detected in '$ENVIRONMENT' environment"}' \
        $SLACK_WEBHOOK_URL
    
    exit 2
else
    echo "✅ No infrastructure drift detected"
fi

# Cleanup
rm -f tfplan
```

## Performance Optimization

### Terraform Performance

#### Parallelism and Resource Targeting
```bash
# Increase parallelism for large infrastructures
terraform apply -parallelism=20

# Target specific resources for faster iterations
terraform apply -target=module.vpc
terraform apply -target=aws_security_group.web

# Use refresh=false when state is known to be current
terraform plan -refresh=false
```

#### State Management Optimization
```hcl
# Use data sources instead of remote state when possible
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["${var.environment}-vpc"]
  }
}

# Avoid unnecessary data source calls
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}
```

### Ansible Performance

#### Optimization Techniques
```yaml
# ansible.cfg optimizations
[defaults]
host_key_checking = False
pipelining = True
forks = 50
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_fact_cache
fact_caching_timeout = 3600

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o ControlPath=/tmp/%h-%p-%r
```

#### Efficient Task Design
```yaml
- name: Install multiple packages efficiently
  package:
    name:
      - nginx
      - git
      - curl
      - vim
    state: present
  # Better than multiple package tasks

- name: Use async for long-running tasks
  command: /usr/bin/long-running-command
  async: 300
  poll: 5
  register: long_task

- name: Conditional execution to skip unnecessary tasks
  service:
    name: nginx
    state: started
  when: ansible_os_family == "RedHat"
```

## Disaster Recovery and Backup

### State Backup Strategies

#### Terraform State Backup
```bash
#!/bin/bash
# Automated state backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="company-terraform-backups"

for env in dev staging prod; do
    echo "Backing up $env state..."
    
    cd "environments/$env"
    terraform state pull > "terraform_${env}_${DATE}.tfstate"
    
    aws s3 cp "terraform_${env}_${DATE}.tfstate" \
        "s3://$BACKUP_BUCKET/terraform-state-backups/"
    
    rm "terraform_${env}_${DATE}.tfstate"
    cd ../..
done
```

#### Configuration Backup
```yaml
- name: Backup configuration files
  hosts: all
  become: yes
  tasks:
    - name: Create backup archive
      archive:
        path:
          - /etc/nginx
          - /etc/ssh
          - /etc/systemd
        dest: "/tmp/config_backup_{{ ansible_hostname }}_{{ ansible_date_time.epoch }}.tar.gz"
        format: gz
    
    - name: Upload to S3
      amazon.aws.aws_s3:
        bucket: company-config-backups
        object: "configs/{{ ansible_hostname }}/config_{{ ansible_date_time.date }}.tar.gz"
        src: "/tmp/config_backup_{{ ansible_hostname }}_{{ ansible_date_time.epoch }}.tar.gz"
        mode: put
```

### Recovery Procedures

#### Infrastructure Recovery Runbook
```markdown
# Infrastructure Recovery Procedures

## Emergency Response
1. Assess the scope of the outage
2. Activate incident response team
3. Determine recovery strategy (restore vs rebuild)

## State Recovery
```bash
# Restore from backup
aws s3 cp s3://company-terraform-backups/terraform-state-backups/terraform_prod_20231201_120000.tfstate terraform.tfstate

# Import existing resources if needed
terraform import aws_instance.web i-1234567890abcdef0

# Verify state
terraform plan
```

## Getting Started Checklist

### Project Setup
- [ ] Define project structure and naming conventions
- [ ] Set up version control repository and branching strategy
- [ ] Configure remote state backend with encryption
- [ ] Implement secrets management solution
- [ ] Create initial module templates and examples

### Security and Compliance
- [ ] Implement access controls and permissions
- [ ] Set up static analysis and security scanning
- [ ] Configure audit logging and monitoring
- [ ] Create security policies and procedures
- [ ] Implement secret rotation procedures

### Testing and Validation
- [ ] Set up automated testing pipeline
- [ ] Implement unit tests for modules
- [ ] Configure integration testing environment
- [ ] Create validation and compliance checks
- [ ] Set up drift detection monitoring

### Documentation and Training
- [ ] Create architecture documentation
- [ ] Write operational runbooks
- [ ] Develop team training materials
- [ ] Establish code review processes
- [ ] Create disaster recovery procedures

## Related Topics

- [Infrastructure as Code](infrastructure-as-code.md) - Core IaC concepts and introduction
- [Tools: Docker and Ansible](tools-docker-ansible.md) - Specific tool implementations
- [Security in DevOps](/devops-engineering/security-devops/security-best-practices.md) - Security practices for DevOps
- [CI/CD Pipelines](/devops-engineering/cicd-pipelines.md) - Integration with continuous delivery