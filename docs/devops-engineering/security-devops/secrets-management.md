# Secrets Management

Effective secrets management is crucial for maintaining security in DevOps environments. This guide covers best practices, tools, and implementation strategies for securely handling sensitive data like passwords, API keys, certificates, and configuration secrets.

## Overview

Secrets management encompasses:
- **Secret Storage**: Secure storage and encryption of sensitive data
- **Access Control**: Granular permissions and authentication
- **Rotation**: Automated and manual secret rotation procedures
- **Audit**: Comprehensive logging and monitoring of secret access
- **Integration**: Seamless integration with applications and infrastructure

## Secrets Management Principles

### Core Principles

#### Never Store Secrets in Code
- **No hardcoded secrets** in source code repositories
- **Environment-specific configuration** separated from code
- **External secret stores** for all sensitive data
- **Automated detection** of secrets in code commits

#### Least Privilege Access
- **Minimum necessary permissions** for accessing secrets
- **Role-based access control** (RBAC) implementation
- **Time-limited access** where possible
- **Regular access reviews** and cleanup

#### Defense in Depth
- **Multiple layers** of security controls
- **Encryption at rest** and in transit
- **Network segmentation** for secret stores
- **Monitoring and alerting** for unusual access patterns

#### Rotation and Lifecycle Management
- **Regular secret rotation** schedules
- **Automated rotation** where possible
- **Secure secret distribution** to applications
- **Proper secret cleanup** and revocation

## Secret Storage Solutions

### HashiCorp Vault

#### Vault Installation and Configuration

```hcl
# vault.tf - Terraform configuration for Vault
resource "aws_instance" "vault" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.medium"
  key_name      = var.key_name
  vpc_security_group_ids = [aws_security_group.vault.id]
  subnet_id     = var.private_subnet_id
  
  user_data = base64encode(templatefile("${path.module}/vault-init.sh", {
    vault_version = var.vault_version
    kms_key_id    = aws_kms_key.vault.id
  }))
  
  tags = {
    Name = "vault-server"
    Role = "secrets-management"
  }
}

resource "aws_security_group" "vault" {
  name_prefix = "vault-sg"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 8200
    to_port     = 8200
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_kms_key" "vault" {
  description = "KMS key for Vault auto-unseal"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableVaultAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.vault.arn
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}
```

#### Vault Configuration File

```hcl
# vault.hcl
storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
}

seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "arn:aws:kms:us-east-1:123456789:key/12345678-1234-1234"
}

ui = true
api_addr = "https://vault.company.com:8200"
cluster_addr = "https://vault.company.com:8201"

log_level = "Info"
log_format = "json"
```

#### Vault Policies and Authentication

```bash
# vault-setup.sh
#!/bin/bash

# Initialize Vault (run once)
vault operator init -key-shares=5 -key-threshold=3

# Enable authentication methods
vault auth enable aws
vault auth enable kubernetes
vault auth enable userpass

# Configure AWS auth
vault write auth/aws/config/client \
  access_key=$AWS_ACCESS_KEY \
  secret_key=$AWS_SECRET_KEY \
  region=us-east-1

# Create policies
vault policy write app-policy - <<EOF
path "secret/data/app/*" {
  capabilities = ["read"]
}

path "database/creds/app-role" {
  capabilities = ["read"]
}
EOF

vault policy write admin-policy - <<EOF
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
EOF

# Enable secret engines
vault secrets enable -path=secret kv-v2
vault secrets enable database
vault secrets enable pki

# Configure database secrets engine
vault write database/config/postgresql \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/myapp?sslmode=disable" \
  allowed_roles="app-role" \
  username="vault" \
  password="vault-password"

vault write database/roles/app-role \
  db_name=postgresql \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"\
  default_ttl="1h" \
  max_ttl="24h"
```

### AWS Secrets Manager

#### Terraform Configuration

```hcl
# secrets.tf
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}/database/credentials"
  description            = "Database credentials for ${var.environment}"
  recovery_window_in_days = 7
  
  replica {
    region = var.backup_region
  }
  
  tags = {
    Environment = var.environment
    Purpose     = "database-access"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
  })
}

resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.environment}/api-keys"
  description = "Third-party API keys for ${var.environment}"
  
  tags = {
    Environment = var.environment
    Purpose     = "api-access"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    stripe_api_key    = var.stripe_api_key
    sendgrid_api_key  = var.sendgrid_api_key
    jwt_signing_key   = var.jwt_signing_key
  })
}

# IAM role for applications to access secrets
resource "aws_iam_role" "app_secrets_role" {
  name = "${var.environment}-app-secrets-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "app_secrets_policy" {
  name = "${var.environment}-app-secrets-policy"
  role = aws_iam_role.app_secrets_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      }
    ]
  })
}
```

#### Automatic Secret Rotation

```python
# secret_rotation.py
import json
import boto3
import psycopg2
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """
    Lambda function for automatic database password rotation
    """
    secrets_client = boto3.client('secretsmanager')
    
    secret_arn = event['SecretArn']
    token = event['ClientRequestToken']
    step = event['Step']
    
    if step == "createSecret":
        create_secret(secrets_client, secret_arn, token)
    elif step == "setSecret":
        set_secret(secrets_client, secret_arn, token)
    elif step == "testSecret":
        test_secret(secrets_client, secret_arn, token)
    elif step == "finishSecret":
        finish_secret(secrets_client, secret_arn, token)
    
    return {"statusCode": 200}

def create_secret(secrets_client, secret_arn, token):
    """Create a new secret version with a new password"""
    try:
        # Get current secret
        current_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT"
        )
        
        current_creds = json.loads(current_secret['SecretString'])
        
        # Generate new password
        new_password = generate_password()
        
        # Create new secret version
        new_creds = current_creds.copy()
        new_creds['password'] = new_password
        
        secrets_client.put_secret_value(
            SecretId=secret_arn,
            ClientRequestToken=token,
            SecretString=json.dumps(new_creds),
            VersionStages=['AWSPENDING']
        )
        
    except Exception as e:
        print(f"Error in create_secret: {e}")
        raise

def set_secret(secrets_client, secret_arn, token):
    """Set the new password in the database"""
    try:
        # Get pending secret
        pending_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionId=token,
            VersionStage="AWSPENDING"
        )
        
        pending_creds = json.loads(pending_secret['SecretString'])
        
        # Connect using current credentials
        current_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT"
        )
        
        current_creds = json.loads(current_secret['SecretString'])
        
        # Update password in database
        conn = psycopg2.connect(
            host=current_creds['host'],
            port=current_creds['port'],
            database=current_creds['database'],
            user=current_creds['username'],
            password=current_creds['password']
        )
        
        cursor = conn.cursor()
        cursor.execute(
            "ALTER USER %s WITH PASSWORD %s",
            (current_creds['username'], pending_creds['password'])
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error in set_secret: {e}")
        raise

def test_secret(secrets_client, secret_arn, token):
    """Test the new credentials"""
    try:
        # Get pending secret
        pending_secret = secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionId=token,
            VersionStage="AWSPENDING"
        )
        
        pending_creds = json.loads(pending_secret['SecretString'])
        
        # Test connection with new credentials
        conn = psycopg2.connect(
            host=pending_creds['host'],
            port=pending_creds['port'],
            database=pending_creds['database'],
            user=pending_creds['username'],
            password=pending_creds['password']
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result[0] != 1:
            raise Exception("Test query failed")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error in test_secret: {e}")
        raise

def finish_secret(secrets_client, secret_arn, token):
    """Finalize the rotation by updating version stages"""
    try:
        secrets_client.update_secret_version_stage(
            SecretId=secret_arn,
            VersionStage="AWSCURRENT",
            ClientRequestToken=token,
            RemoveFromVersionId=secrets_client.describe_secret(
                SecretId=secret_arn
            )['VersionIdsToStages'].get('AWSCURRENT', [None])[0]
        )
        
    except Exception as e:
        print(f"Error in finish_secret: {e}")
        raise

def generate_password(length=16):
    """Generate a secure random password"""
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password
```

### Kubernetes Secrets

#### External Secrets Operator

```yaml
# external-secrets-operator.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: external-secrets
---
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretsmanager
  namespace: default
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        serviceAccount:
          name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: default
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@{{ .host }}:{{ .port }}/{{ .database }}"
  data:
  - secretKey: username
    remoteRef:
      key: production/database/credentials
      property: username
  - secretKey: password
    remoteRef:
      key: production/database/credentials
      property: password
  - secretKey: host
    remoteRef:
      key: production/database/credentials
      property: host
  - secretKey: port
    remoteRef:
      key: production/database/credentials
      property: port
  - secretKey: database
    remoteRef:
      key: production/database/credentials
      property: database
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/external-secrets-role
```

## Application Integration

### Secret Injection Patterns

#### Environment Variable Injection

```python
# config.py
import os
import boto3
import json
from functools import lru_cache

class Config:
    def __init__(self):
        self.secrets_client = boto3.client('secretsmanager')
        self._secrets_cache = {}
    
    @lru_cache(maxsize=128)
    def get_secret(self, secret_name):
        """Get secret from AWS Secrets Manager with caching"""
        try:
            if secret_name in self._secrets_cache:
                return self._secrets_cache[secret_name]
            
            response = self.secrets_client.get_secret_value(SecretId=secret_name)
            secret_value = json.loads(response['SecretString'])
            
            self._secrets_cache[secret_name] = secret_value
            return secret_value
        except Exception as e:
            print(f"Error retrieving secret {secret_name}: {e}")
            raise
    
    @property
    def database_url(self):
        """Construct database URL from secrets"""
        if os.getenv('DATABASE_URL'):
            return os.getenv('DATABASE_URL')
        
        db_creds = self.get_secret('production/database/credentials')
        return f"postgresql://{db_creds['username']}:{db_creds['password']}@{db_creds['host']}:{db_creds['port']}/{db_creds['database']}"
    
    @property
    def api_keys(self):
        """Get API keys from secrets"""
        return self.get_secret('production/api-keys')
    
    @property
    def jwt_secret(self):
        """Get JWT signing key"""
        return self.api_keys['jwt_signing_key']

# Usage
config = Config()
app.config['SQLALCHEMY_DATABASE_URI'] = config.database_url
app.config['JWT_SECRET_KEY'] = config.jwt_secret
```

#### Init Container Pattern

```yaml
# deployment-with-init-container.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
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
      serviceAccountName: myapp-sa
      initContainers:
      - name: secret-fetcher
        image: myregistry/secret-fetcher:latest
        env:
        - name: AWS_REGION
          value: "us-east-1"
        - name: SECRET_NAMES
          value: "production/database/credentials,production/api-keys"
        - name: SECRET_PATH
          value: "/etc/secrets"
        volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
        command:
        - /bin/sh
        - -c
        - |
          for secret in $(echo $SECRET_NAMES | tr ',' ' '); do
            echo "Fetching secret: $secret"
            aws secretsmanager get-secret-value \
              --secret-id "$secret" \
              --region "$AWS_REGION" \
              --query 'SecretString' \
              --output text > "/etc/secrets/$(basename $secret).json"
          done
      containers:
      - name: myapp
        image: myregistry/myapp:latest
        env:
        - name: SECRET_PATH
          value: "/etc/secrets"
        volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
          readOnly: true
        ports:
        - containerPort: 8080
      volumes:
      - name: secrets
        emptyDir:
          medium: Memory
```

#### Sidecar Pattern

```yaml
# sidecar-secret-manager.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-with-sidecar
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
        env:
        - name: SECRET_ENDPOINT
          value: "http://localhost:8081/secrets"
        ports:
        - containerPort: 8080
      
      - name: secret-manager
        image: myregistry/secret-manager-sidecar:latest
        env:
        - name: AWS_REGION
          value: "us-east-1"
        - name: SECRET_REFRESH_INTERVAL
          value: "300" # 5 minutes
        - name: SECRETS_CONFIG
          value: |
            {
              "secrets": [
                {
                  "name": "database",
                  "arn": "arn:aws:secretsmanager:us-east-1:123456789:secret:production/database/credentials"
                },
                {
                  "name": "api-keys",
                  "arn": "arn:aws:secretsmanager:us-east-1:123456789:secret:production/api-keys"
                }
              ]
            }
        ports:
        - containerPort: 8081
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
```

## Secret Rotation Strategies

### Automated Rotation

#### Database Credential Rotation

```bash
#!/bin/bash
# rotate-db-credentials.sh

set -e

SECRET_ARN="$1"
ROTATION_LAMBDA_ARN="$2"

echo "Starting rotation for secret: $SECRET_ARN"

# Trigger rotation
aws secretsmanager rotate-secret \
  --secret-id "$SECRET_ARN" \
  --rotation-lambda-arn "$ROTATION_LAMBDA_ARN" \
  --rotation-rules AutomaticallyAfterDays=30

echo "Rotation initiated successfully"

# Monitor rotation status
while true; do
  STATUS=$(aws secretsmanager describe-secret \
    --secret-id "$SECRET_ARN" \
    --query 'RotationEnabled' \
    --output text)
  
  if [ "$STATUS" = "True" ]; then
    echo "Rotation completed successfully"
    break
  else
    echo "Rotation in progress..."
    sleep 30
  fi
done
```

#### API Key Rotation

```python
# api_key_rotation.py
import boto3
import requests
import json
from datetime import datetime, timedelta

class APIKeyRotation:
    def __init__(self, secrets_client, secret_arn):
        self.secrets_client = secrets_client
        self.secret_arn = secret_arn
    
    def rotate_stripe_key(self):
        """Rotate Stripe API key"""
        # Get current secret
        current_secret = self.secrets_client.get_secret_value(
            SecretId=self.secret_arn
        )
        current_keys = json.loads(current_secret['SecretString'])
        
        # Create new Stripe API key
        stripe_response = requests.post(
            'https://api.stripe.com/v1/api_keys',
            headers={
                'Authorization': f"Bearer {current_keys['stripe_master_key']}"
            },
            data={
                'name': f'rotated-key-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
            }
        )
        
        if stripe_response.status_code != 200:
            raise Exception(f"Failed to create new Stripe key: {stripe_response.text}")
        
        new_stripe_key = stripe_response.json()['secret']
        
        # Update secret with new key
        new_keys = current_keys.copy()
        old_stripe_key = new_keys['stripe_api_key']
        new_keys['stripe_api_key'] = new_stripe_key
        
        self.secrets_client.put_secret_value(
            SecretId=self.secret_arn,
            SecretString=json.dumps(new_keys)
        )
        
        # Test new key
        test_response = requests.get(
            'https://api.stripe.com/v1/account',
            headers={'Authorization': f'Bearer {new_stripe_key}'}
        )
        
        if test_response.status_code != 200:
            # Rollback if test fails
            new_keys['stripe_api_key'] = old_stripe_key
            self.secrets_client.put_secret_value(
                SecretId=self.secret_arn,
                SecretString=json.dumps(new_keys)
            )
            raise Exception("New Stripe key test failed, rolled back")
        
        # Deactivate old key
        deactivate_response = requests.post(
            f'https://api.stripe.com/v1/api_keys/{self._extract_key_id(old_stripe_key)}',
            headers={
                'Authorization': f"Bearer {current_keys['stripe_master_key']}"
            },
            data={'active': 'false'}
        )
        
        return {
            'old_key_id': self._extract_key_id(old_stripe_key),
            'new_key_id': self._extract_key_id(new_stripe_key),
            'rotation_time': datetime.now().isoformat()
        }
    
    def _extract_key_id(self, api_key):
        """Extract key ID from API key"""
        # Implementation depends on API key format
        return api_key.split('_')[1] if '_' in api_key else api_key[:8]
```

## Monitoring and Auditing

### Secret Access Monitoring

```python
# secret_monitor.py
import boto3
import json
from datetime import datetime, timedelta
from collections import defaultdict

class SecretAccessMonitor:
    def __init__(self):
        self.cloudtrail = boto3.client('cloudtrail')
        self.secrets_manager = boto3.client('secretsmanager')
    
    def get_secret_access_events(self, hours=24):
        """Get secret access events from CloudTrail"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        events = []
        paginator = self.cloudtrail.get_paginator('lookup_events')
        
        for page in paginator.paginate(
            LookupAttributes=[
                {
                    'AttributeKey': 'EventName',
                    'AttributeValue': 'GetSecretValue'
                }
            ],
            StartTime=start_time,
            EndTime=end_time
        ):
            events.extend(page['Events'])
        
        return events
    
    def analyze_access_patterns(self, events):
        """Analyze secret access patterns for anomalies"""
        access_patterns = defaultdict(lambda: {
            'count': 0,
            'unique_ips': set(),
            'unique_users': set(),
            'time_windows': defaultdict(int)
        })
        
        for event in events:
            secret_arn = self._extract_secret_arn(event)
            if not secret_arn:
                continue
            
            pattern = access_patterns[secret_arn]
            pattern['count'] += 1
            pattern['unique_ips'].add(event.get('SourceIPAddress', 'unknown'))
            pattern['unique_users'].add(event.get('Username', 'unknown'))
            
            # Track access by hour
            hour = event['EventTime'].replace(minute=0, second=0, microsecond=0)
            pattern['time_windows'][hour] += 1
        
        # Detect anomalies
        anomalies = []
        for secret_arn, pattern in access_patterns.items():
            # Check for unusual access frequency
            if pattern['count'] > 100:  # Threshold
                anomalies.append({
                    'type': 'high_frequency_access',
                    'secret_arn': secret_arn,
                    'count': pattern['count']
                })
            
            # Check for access from too many IPs
            if len(pattern['unique_ips']) > 10:  # Threshold
                anomalies.append({
                    'type': 'multiple_ip_access',
                    'secret_arn': secret_arn,
                    'ip_count': len(pattern['unique_ips'])
                })
            
            # Check for unusual time patterns
            max_hourly_access = max(pattern['time_windows'].values())
            if max_hourly_access > 20:  # Threshold
                anomalies.append({
                    'type': 'burst_access',
                    'secret_arn': secret_arn,
                    'max_hourly': max_hourly_access
                })
        
        return anomalies
    
    def _extract_secret_arn(self, event):
        """Extract secret ARN from CloudTrail event"""
        try:
            cloud_trail_event = json.loads(event.get('CloudTrailEvent', '{}'))
            resources = cloud_trail_event.get('resources', [])
            for resource in resources:
                if resource.get('resourceType') == 'AWS::SecretsManager::Secret':
                    return resource.get('resourceName')
        except:
            pass
        return None
    
    def generate_access_report(self):
        """Generate comprehensive secret access report"""
        events = self.get_secret_access_events()
        anomalies = self.analyze_access_patterns(events)
        
        # Get all secrets
        secrets = self.secrets_manager.list_secrets()
        
        report = {
            'report_time': datetime.utcnow().isoformat(),
            'total_secrets': len(secrets['SecretList']),
            'total_access_events': len(events),
            'anomalies': anomalies,
            'summary': {
                'secrets_accessed': len(set(self._extract_secret_arn(event) 
                                         for event in events 
                                         if self._extract_secret_arn(event))),
                'unique_users': len(set(event.get('Username', 'unknown') 
                                      for event in events)),
                'unique_ips': len(set(event.get('SourceIPAddress', 'unknown') 
                                    for event in events))
            }
        }
        
        return report
```

### Compliance Reporting

```python
# compliance_reporter.py
import boto3
import json
from datetime import datetime, timedelta

class ComplianceReporter:
    def __init__(self):
        self.secrets_manager = boto3.client('secretsmanager')
        self.iam = boto3.client('iam')
    
    def check_rotation_compliance(self, max_age_days=90):
        """Check if secrets are rotated within compliance period"""
        secrets = self.secrets_manager.list_secrets()
        non_compliant = []
        
        for secret in secrets['SecretList']:
            last_rotated = secret.get('LastRotatedDate')
            if not last_rotated:
                # Never rotated
                non_compliant.append({
                    'secret_name': secret['Name'],
                    'issue': 'never_rotated',
                    'created_date': secret.get('CreatedDate', '').isoformat() if secret.get('CreatedDate') else None
                })
            else:
                days_since_rotation = (datetime.now(last_rotated.tzinfo) - last_rotated).days
                if days_since_rotation > max_age_days:
                    non_compliant.append({
                        'secret_name': secret['Name'],
                        'issue': 'rotation_overdue',
                        'days_overdue': days_since_rotation - max_age_days,
                        'last_rotated': last_rotated.isoformat()
                    })
        
        return non_compliant
    
    def check_access_compliance(self):
        """Check IAM policies for overly permissive secret access"""
        issues = []
        
        # Get all IAM roles
        roles = self.iam.list_roles()
        
        for role in roles['Roles']:
            role_name = role['RoleName']
            
            # Get attached policies
            attached_policies = self.iam.list_attached_role_policies(RoleName=role_name)
            
            for policy in attached_policies['AttachedPolicies']:
                policy_document = self.iam.get_policy(
                    PolicyArn=policy['PolicyArn']
                )['Policy']
                
                policy_version = self.iam.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_document['DefaultVersionId']
                )['PolicyVersion']
                
                # Check for overly broad permissions
                statements = policy_version['Document'].get('Statement', [])
                for statement in statements:
                    if self._has_broad_secrets_access(statement):
                        issues.append({
                            'type': 'overly_broad_access',
                            'role_name': role_name,
                            'policy_name': policy['PolicyName'],
                            'statement': statement
                        })
        
        return issues
    
    def _has_broad_secrets_access(self, statement):
        """Check if statement grants overly broad secret access"""
        if statement.get('Effect') != 'Allow':
            return False
        
        actions = statement.get('Action', [])
        if isinstance(actions, str):
            actions = [actions]
        
        resources = statement.get('Resource', [])
        if isinstance(resources, str):
            resources = [resources]
        
        # Check for wildcard actions
        broad_actions = ['secretsmanager:*', '*']
        if any(action in broad_actions for action in actions):
            return True
        
        # Check for wildcard resources with sensitive actions
        sensitive_actions = [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
            'secretsmanager:ListSecrets'
        ]
        
        if any(action in sensitive_actions for action in actions):
            if any(resource == '*' for resource in resources):
                return True
        
        return False
    
    def generate_compliance_report(self):
        """Generate comprehensive compliance report"""
        rotation_issues = self.check_rotation_compliance()
        access_issues = self.check_access_compliance()
        
        return {
            'report_date': datetime.utcnow().isoformat(),
            'rotation_compliance': {
                'total_issues': len(rotation_issues),
                'issues': rotation_issues
            },
            'access_compliance': {
                'total_issues': len(access_issues),
                'issues': access_issues
            },
            'overall_compliance': len(rotation_issues) == 0 and len(access_issues) == 0
        }
```

## Getting Started Checklist

### Secret Storage Setup
- [ ] Choose appropriate secrets management solution
- [ ] Set up secure storage with encryption at rest
- [ ] Configure access controls and authentication
- [ ] Implement network security for secret stores
- [ ] Set up high availability and backup procedures
- [ ] Configure audit logging and monitoring

### Application Integration
- [ ] Remove hardcoded secrets from code repositories
- [ ] Implement secret injection patterns
- [ ] Set up secret caching and refresh mechanisms
- [ ] Configure environment-specific secret management
- [ ] Implement proper error handling for secret access
- [ ] Set up secret validation and testing

### Rotation and Lifecycle
- [ ] Define secret rotation schedules and policies
- [ ] Implement automated rotation for database credentials
- [ ] Set up API key rotation procedures
- [ ] Configure certificate rotation and renewal
- [ ] Create manual rotation runbooks
- [ ] Test rotation procedures and rollback mechanisms

### Monitoring and Compliance
- [ ] Set up secret access monitoring and alerting
- [ ] Implement anomaly detection for unusual access patterns
- [ ] Create compliance checking and reporting
- [ ] Set up regular security audits
- [ ] Configure incident response for secret compromise
- [ ] Document secret management procedures

## Related Topics

- [Security Best Practices](security-best-practices.md) - Overall security implementation
- [Compliance](compliance.md) - Regulatory compliance requirements
- [Infrastructure as Code](/devops-engineering/infrastructure-as-code.md) - Secure infrastructure automation
- [CI/CD Pipelines](/devops-engineering/cicd-pipelines.md) - Secure build and deployment