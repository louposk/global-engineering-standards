# Compliance in DevOps

Compliance in DevOps environments requires balancing security, regulatory requirements, and operational efficiency. This guide covers implementing compliance frameworks, automating compliance checks, and maintaining audit trails while supporting rapid development and deployment cycles.

## Overview

DevOps compliance encompasses:
- **Regulatory Frameworks**: SOX, GDPR, HIPAA, PCI DSS, SOC 2
- **Industry Standards**: ISO 27001, NIST, CIS Controls
- **Automated Compliance**: Continuous compliance monitoring and validation
- **Audit Trails**: Comprehensive logging and documentation
- **Risk Management**: Identifying and mitigating compliance risks

## Common Compliance Frameworks

### SOX (Sarbanes-Oxley Act)

#### Key Requirements
- **Financial Data Protection**: Secure handling of financial information
- **Access Controls**: Strict user access management
- **Change Management**: Documented and approved changes
- **Audit Trails**: Comprehensive logging of financial data access

#### Implementation
```yaml
# SOX compliance configuration
sox_compliance:
  financial_systems:
    - erp_system
    - accounting_database
    - reporting_platform
  
  controls:
    access_control:
      mfa_required: true
      role_based_access: true
      regular_access_reviews: quarterly
    
    change_management:
      approval_required: true
      segregation_of_duties: true
      documentation_required: true
    
    monitoring:
      real_time_alerts: true
      audit_log_retention: 7_years
      automated_compliance_checks: true
```

### GDPR (General Data Protection Regulation)

#### Key Requirements
- **Data Privacy**: Protection of personal data
- **Consent Management**: Clear consent for data processing
- **Data Subject Rights**: Right to erasure, portability, access
- **Breach Notification**: 72-hour breach notification requirement

#### Implementation
```python
# GDPR compliance implementation
class GDPRCompliance:
    def __init__(self, data_controller):
        self.data_controller = data_controller
        self.audit_logger = AuditLogger()
    
    def process_data_subject_request(self, request_type, user_id, requester_email):
        """
        Handle GDPR data subject requests
        """
        # Verify request authenticity
        if not self.verify_data_subject_identity(user_id, requester_email):
            raise UnauthorizedRequestError("Identity verification failed")
        
        self.audit_logger.log({
            'event': 'gdpr_request_received',
            'request_type': request_type,
            'user_id': user_id,
            'timestamp': datetime.utcnow()
        })
        
        if request_type == 'access':
            return self.handle_access_request(user_id)
        elif request_type == 'erasure':
            return self.handle_erasure_request(user_id)
        elif request_type == 'portability':
            return self.handle_portability_request(user_id)
        
    def handle_erasure_request(self, user_id):
        """
        Handle right to erasure (right to be forgotten)
        """
        # Find all personal data
        personal_data_locations = self.find_personal_data(user_id)
        
        # Check for legal basis to retain data
        retention_requirements = self.check_retention_requirements(user_id)
        
        erasure_results = []
        for location in personal_data_locations:
            if location not in retention_requirements:
                result = self.erase_data(location, user_id)
                erasure_results.append(result)
        
        # Log the erasure
        self.audit_logger.log({
            'event': 'gdpr_erasure_completed',
            'user_id': user_id,
            'locations_erased': len(erasure_results),
            'timestamp': datetime.utcnow()
        })
        
        return {
            'status': 'completed',
            'erased_locations': len(erasure_results),
            'retained_locations': len(retention_requirements)
        }
    
    def data_breach_notification(self, breach_details):
        """
        Handle GDPR breach notification requirements
        """
        # Assess severity
        severity = self.assess_breach_severity(breach_details)
        
        if severity in ['high', 'critical']:
            # Notify supervisory authority within 72 hours
            self.notify_supervisory_authority(breach_details)
            
            # Notify affected data subjects if high risk
            if severity == 'critical':
                self.notify_data_subjects(breach_details)
        
        self.audit_logger.log({
            'event': 'gdpr_breach_processed',
            'severity': severity,
            'timestamp': datetime.utcnow(),
            'breach_id': breach_details['id']
        })
```

### HIPAA (Health Insurance Portability and Accountability Act)

#### Key Requirements
- **PHI Protection**: Safeguarding Protected Health Information
- **Access Controls**: Strict access to healthcare data
- **Encryption**: Data encryption in transit and at rest
- **Audit Logs**: Detailed access logging

#### Implementation
```yaml
# HIPAA compliance terraform configuration
resource "aws_s3_bucket" "phi_storage" {
  bucket = "${var.organization}-phi-${var.environment}"
  
  tags = {
    Compliance = "HIPAA"
    DataType = "PHI"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "phi_encryption" {
  bucket = aws_s3_bucket.phi_storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.phi_key.arn
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "phi_block_public" {
  bucket = aws_s3_bucket.phi_storage.id
  
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "phi_access_logs" {
  bucket = aws_s3_bucket.phi_storage.id
  
  target_bucket = aws_s3_bucket.audit_logs.id
  target_prefix = "phi-access-logs/"
}

resource "aws_cloudtrail" "hipaa_trail" {
  name = "${var.environment}-hipaa-trail"
  s3_bucket_name = aws_s3_bucket.audit_logs.bucket
  
  include_global_service_events = true
  is_multi_region_trail = true
  enable_logging = true
  enable_log_file_validation = true
  
  event_selector {
    read_write_type = "All"
    include_management_events = true
    
    data_resource {
      type = "AWS::S3::Object"
      values = ["${aws_s3_bucket.phi_storage.arn}/*"]
    }
  }
}
```

### PCI DSS (Payment Card Industry Data Security Standard)

#### Key Requirements
- **Cardholder Data Protection**: Secure storage and transmission
- **Network Security**: Firewall and network segmentation
- **Access Controls**: Strict access to cardholder data
- **Monitoring**: Continuous monitoring and testing

#### Implementation
```hcl
# PCI DSS compliant infrastructure
resource "aws_vpc" "pci_vpc" {
  cidr_block = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = {
    Name = "${var.environment}-pci-vpc"
    Compliance = "PCI-DSS"
  }
}

# Cardholder Data Environment (CDE) subnet
resource "aws_subnet" "cde_subnet" {
  vpc_id = aws_vpc.pci_vpc.id
  cidr_block = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone = var.availability_zones[0]
  
  tags = {
    Name = "${var.environment}-cde-subnet"
    PCIScope = "CDE"
  }
}

# Strict security group for CDE
resource "aws_security_group" "cde_sg" {
  name_prefix = "cde-sg-"
  vpc_id = aws_vpc.pci_vpc.id
  
  # Only allow necessary ports
  ingress {
    from_port = 443
    to_port = 443
    protocol = "tcp"
    security_groups = [aws_security_group.payment_gateway_sg.id]
  }
  
  egress {
    from_port = 443
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "cde-security-group"
    PCIScope = "CDE"
  }
}

# WAF for PCI compliance
resource "aws_wafv2_web_acl" "pci_waf" {
  name = "${var.environment}-pci-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # SQL injection protection (PCI requirement)
  rule {
    name = "SQLInjectionProtection"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name = "SQLInjectionProtection"
      sampled_requests_enabled = true
    }
  }
  
  tags = {
    Compliance = "PCI-DSS"
  }
}
```

## Automated Compliance Monitoring

### Compliance as Code

#### Open Policy Agent (OPA) Integration

```rego
# policies/pci_compliance.rego
package pci.compliance

# PCI DSS Requirement 1: Firewall configuration
deny[msg] {
  input.resource_type == "aws_security_group"
  input.ingress_rules[_].cidr_blocks[_] == "0.0.0.0/0"
  input.ingress_rules[_].from_port != 80
  input.ingress_rules[_].from_port != 443
  msg := "Security groups should not allow unrestricted access except for HTTP/HTTPS"
}

# PCI DSS Requirement 3: Cardholder data protection
deny[msg] {
  input.resource_type == "aws_s3_bucket"
  "cardholder" in input.tags.DataType
  not input.encryption.enabled
  msg := "S3 buckets containing cardholder data must be encrypted"
}

# PCI DSS Requirement 4: Encryption in transit
deny[msg] {
  input.resource_type == "aws_lb_listener"
  input.protocol != "HTTPS"
  "payment" in input.tags.Service
  msg := "Payment service load balancers must use HTTPS"
}

# PCI DSS Requirement 10: Logging
deny[msg] {
  input.resource_type == "aws_instance"
  "payment" in input.tags.Service
  not input.cloudwatch_logs_enabled
  msg := "Payment service instances must have CloudWatch logs enabled"
}
```

#### Automated Policy Evaluation

```python
# compliance_checker.py
import json
import subprocess
from typing import List, Dict

class ComplianceChecker:
    def __init__(self, policies_path: str):
        self.policies_path = policies_path
    
    def evaluate_terraform_plan(self, plan_file: str) -> Dict:
        """
        Evaluate Terraform plan against compliance policies
        """
        # Convert Terraform plan to JSON
        plan_json = self._convert_plan_to_json(plan_file)
        
        violations = []
        for resource in plan_json.get('planned_values', {}).get('root_module', {}).get('resources', []):
            resource_violations = self._evaluate_resource(resource)
            violations.extend(resource_violations)
        
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'total_resources': len(plan_json.get('planned_values', {}).get('root_module', {}).get('resources', [])),
            'violation_count': len(violations)
        }
    
    def _convert_plan_to_json(self, plan_file: str) -> Dict:
        """Convert Terraform plan to JSON format"""
        result = subprocess.run(
            ['terraform', 'show', '-json', plan_file],
            capture_output=True,
            text=True
        )
        return json.loads(result.stdout)
    
    def _evaluate_resource(self, resource: Dict) -> List[Dict]:
        """Evaluate single resource against OPA policies"""
        # Prepare input for OPA
        opa_input = {
            'resource_type': resource.get('type'),
            'name': resource.get('name'),
            'values': resource.get('values', {}),
            'tags': resource.get('values', {}).get('tags', {})
        }
        
        # Add resource-specific fields
        if resource.get('type') == 'aws_security_group':
            opa_input['ingress_rules'] = resource.get('values', {}).get('ingress', [])
        elif resource.get('type') == 'aws_s3_bucket':
            opa_input['encryption'] = {
                'enabled': self._check_s3_encryption(resource)
            }
        
        # Evaluate with OPA
        result = subprocess.run(
            ['opa', 'eval', '-d', self.policies_path, '-I', json.dumps(opa_input), 'data.pci.compliance.deny[x]'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            violations_output = json.loads(result.stdout)
            violations = []
            for violation in violations_output.get('result', []):
                violations.append({
                    'resource': f"{resource.get('type')}.{resource.get('name')}",
                    'policy': 'PCI DSS',
                    'message': violation,
                    'severity': 'HIGH'
                })
            return violations
        
        return []
    
    def _check_s3_encryption(self, resource: Dict) -> bool:
        """Check if S3 bucket has encryption enabled"""
        values = resource.get('values', {})
        return 'server_side_encryption_configuration' in values
```

### Continuous Compliance Pipeline

```yaml
# .github/workflows/compliance-check.yml
name: Compliance Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  compliance-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Setup OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/v0.56.0/opa_linux_amd64_static
          chmod +x opa
          sudo mv opa /usr/local/bin/
      
      - name: Initialize Terraform
        run: terraform init
        working-directory: ./infrastructure
      
      - name: Create Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: ./infrastructure
      
      - name: Run Compliance Checks
        run: |
          python compliance_checker.py --plan ./infrastructure/tfplan --policies ./policies
      
      - name: Run Checkov (Multi-framework scanner)
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: terraform,dockerfile,kubernetes
          compact: true
          quiet: true
          output_format: sarif
          output_file_path: checkov-results.sarif
      
      - name: Upload Compliance Results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: checkov-results.sarif
      
      - name: Comment PR with Compliance Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            try {
              const results = fs.readFileSync('compliance-results.json', 'utf8');
              const compliance = JSON.parse(results);
              
              const comment = `## Compliance Check Results
              
              **Status**: ${compliance.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
              **Violations**: ${compliance.violation_count}
              **Total Resources**: ${compliance.total_resources}
              
              ${compliance.violations.map(v => `- **${v.severity}**: ${v.message} (${v.resource})`).join('\n')}
              `;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            } catch (error) {
              console.log('No compliance results file found');
            }
```

## Audit Trail Management

### Comprehensive Logging Strategy

```python
# audit_logger.py
import json
import boto3
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional

class AuditEventType(Enum):
    USER_ACCESS = "user_access"
    DATA_MODIFICATION = "data_modification"
    SYSTEM_CHANGE = "system_change"
    SECURITY_EVENT = "security_event"
    COMPLIANCE_CHECK = "compliance_check"

@dataclass
class AuditEvent:
    event_type: AuditEventType
    user_id: str
    action: str
    resource: str
    timestamp: datetime
    source_ip: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    compliance_framework: Optional[str] = None

class AuditLogger:
    def __init__(self, environment: str, compliance_frameworks: list):
        self.environment = environment
        self.compliance_frameworks = compliance_frameworks
        self.cloudwatch = boto3.client('logs')
        self.s3 = boto3.client('s3')
        self.log_group = f'/aws/compliance/{environment}'
    
    def log_event(self, event: AuditEvent):
        """
        Log audit event with compliance requirements
        """
        # Enrich event with compliance metadata
        enriched_event = self._enrich_event(event)
        
        # Log to CloudWatch for real-time monitoring
        self._log_to_cloudwatch(enriched_event)
        
        # Store in S3 for long-term retention
        self._store_in_s3(enriched_event)
        
        # Send to compliance monitoring system
        self._send_to_compliance_system(enriched_event)
    
    def _enrich_event(self, event: AuditEvent) -> Dict[str, Any]:
        """Enrich event with additional compliance metadata"""
        enriched = asdict(event)
        enriched.update({
            'event_id': self._generate_event_id(),
            'environment': self.environment,
            'compliance_frameworks': self.compliance_frameworks,
            'timestamp_iso': event.timestamp.isoformat(),
            'retention_years': self._get_retention_requirement(event.event_type)
        })
        
        # Add compliance-specific fields
        if 'SOX' in self.compliance_frameworks and event.event_type == AuditEventType.DATA_MODIFICATION:
            enriched['sox_relevant'] = True
            enriched['requires_approval'] = True
        
        if 'GDPR' in self.compliance_frameworks and 'personal_data' in str(event.resource):
            enriched['gdpr_relevant'] = True
            enriched['data_subject_rights_applicable'] = True
        
        return enriched
    
    def _log_to_cloudwatch(self, event: Dict[str, Any]):
        """Send event to CloudWatch Logs"""
        try:
            self.cloudwatch.put_log_events(
                logGroupName=self.log_group,
                logStreamName=f"audit-{datetime.now().strftime('%Y-%m-%d')}",
                logEvents=[
                    {
                        'timestamp': int(event['timestamp'].timestamp() * 1000),
                        'message': json.dumps(event, default=str)
                    }
                ]
            )
        except Exception as e:
            print(f"Failed to log to CloudWatch: {e}")
    
    def _store_in_s3(self, event: Dict[str, Any]):
        """Store event in S3 for long-term retention"""
        try:
            key = f"audit-logs/{self.environment}/{event['timestamp'].year}/{event['timestamp'].month:02d}/{event['timestamp'].day:02d}/{event['event_id']}.json"
            
            self.s3.put_object(
                Bucket=f"compliance-audit-logs-{self.environment}",
                Key=key,
                Body=json.dumps(event, default=str),
                ServerSideEncryption='aws:kms',
                Metadata={
                    'compliance-frameworks': ','.join(self.compliance_frameworks),
                    'retention-years': str(event['retention_years'])
                }
            )
        except Exception as e:
            print(f"Failed to store in S3: {e}")
    
    def _get_retention_requirement(self, event_type: AuditEventType) -> int:
        """Determine retention requirement based on compliance frameworks"""
        retention_map = {
            'SOX': {
                AuditEventType.DATA_MODIFICATION: 7,
                AuditEventType.USER_ACCESS: 7,
                'default': 7
            },
            'HIPAA': {
                AuditEventType.DATA_MODIFICATION: 6,
                AuditEventType.USER_ACCESS: 6,
                'default': 6
            },
            'PCI': {
                AuditEventType.DATA_MODIFICATION: 1,
                AuditEventType.USER_ACCESS: 1,
                'default': 1
            }
        }
        
        max_retention = 1
        for framework in self.compliance_frameworks:
            if framework in retention_map:
                framework_retention = retention_map[framework].get(
                    event_type, 
                    retention_map[framework]['default']
                )
                max_retention = max(max_retention, framework_retention)
        
        return max_retention
```

### Compliance Reporting

```python
# compliance_reporter.py
import boto3
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List

class ComplianceReporter:
    def __init__(self, environment: str):
        self.environment = environment
        self.cloudwatch = boto3.client('logs')
        self.s3 = boto3.client('s3')
    
    def generate_sox_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """
        Generate SOX compliance report
        """
        query = f"""
        fields @timestamp, user_id, action, resource, sox_relevant
        | filter sox_relevant = true
        | filter @timestamp >= "{start_date.isoformat()}"
        | filter @timestamp <= "{end_date.isoformat()}"
        | stats count() by user_id, action
        """
        
        results = self._execute_cloudwatch_query(query, start_date, end_date)
        
        return {
            'report_type': 'SOX Compliance',
            'period': f"{start_date.date()} to {end_date.date()}",
            'total_events': sum(int(row[2]) for row in results),
            'unique_users': len(set(row[0] for row in results)),
            'top_actions': self._get_top_actions(results),
            'recommendations': self._generate_sox_recommendations(results)
        }
    
    def generate_gdpr_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """
        Generate GDPR compliance report
        """
        query = f"""
        fields @timestamp, user_id, action, resource, gdpr_relevant, event_type
        | filter gdpr_relevant = true
        | filter @timestamp >= "{start_date.isoformat()}"
        | filter @timestamp <= "{end_date.isoformat()}"
        | stats count() by event_type
        """
        
        results = self._execute_cloudwatch_query(query, start_date, end_date)
        
        # Check for data subject requests
        dsr_query = f"""
        fields @timestamp, action, metadata
        | filter action like /gdpr_request/
        | filter @timestamp >= "{start_date.isoformat()}"
        | filter @timestamp <= "{end_date.isoformat()}"
        | stats count() by action
        """
        
        dsr_results = self._execute_cloudwatch_query(dsr_query, start_date, end_date)
        
        return {
            'report_type': 'GDPR Compliance',
            'period': f"{start_date.date()} to {end_date.date()}",
            'data_processing_events': sum(int(row[1]) for row in results),
            'data_subject_requests': {
                'access_requests': self._count_requests(dsr_results, 'access'),
                'erasure_requests': self._count_requests(dsr_results, 'erasure'),
                'portability_requests': self._count_requests(dsr_results, 'portability')
            },
            'compliance_status': 'COMPLIANT',  # Based on analysis
            'recommendations': self._generate_gdpr_recommendations(results)
        }
    
    def generate_comprehensive_report(self, frameworks: List[str], 
                                    start_date: datetime, 
                                    end_date: datetime) -> Dict:
        """
        Generate comprehensive compliance report for multiple frameworks
        """
        report = {
            'generation_date': datetime.utcnow().isoformat(),
            'reporting_period': f"{start_date.date()} to {end_date.date()}",
            'frameworks': frameworks,
            'environment': self.environment,
            'framework_reports': {}
        }
        
        if 'SOX' in frameworks:
            report['framework_reports']['SOX'] = self.generate_sox_report(start_date, end_date)
        
        if 'GDPR' in frameworks:
            report['framework_reports']['GDPR'] = self.generate_gdpr_report(start_date, end_date)
        
        if 'HIPAA' in frameworks:
            report['framework_reports']['HIPAA'] = self.generate_hipaa_report(start_date, end_date)
        
        # Generate summary
        report['summary'] = self._generate_summary(report['framework_reports'])
        
        return report
    
    def _execute_cloudwatch_query(self, query: str, start_date: datetime, end_date: datetime) -> List:
        """Execute CloudWatch Insights query"""
        try:
            response = self.cloudwatch.start_query(
                logGroupName=f'/aws/compliance/{self.environment}',
                startTime=int(start_date.timestamp()),
                endTime=int(end_date.timestamp()),
                queryString=query
            )
            
            query_id = response['queryId']
            
            # Wait for query to complete
            while True:
                result = self.cloudwatch.get_query_results(queryId=query_id)
                if result['status'] == 'Complete':
                    return result['results']
                elif result['status'] == 'Failed':
                    raise Exception("Query failed")
                
                time.sleep(1)
        
        except Exception as e:
            print(f"CloudWatch query failed: {e}")
            return []
```

## Risk Assessment and Management

### Automated Risk Assessment

```python
# risk_assessment.py
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional

class RiskLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class ComplianceFramework(Enum):
    SOX = "SOX"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI_DSS"
    SOC2 = "SOC2"

@dataclass
class ComplianceRisk:
    risk_id: str
    title: str
    description: str
    framework: ComplianceFramework
    risk_level: RiskLevel
    affected_systems: List[str]
    mitigation_status: str
    due_date: Optional[str] = None
    owner: Optional[str] = None

class RiskAssessment:
    def __init__(self):
        self.risks = []
    
    def assess_infrastructure_risks(self, terraform_plan: Dict) -> List[ComplianceRisk]:
        """
        Assess compliance risks from infrastructure configuration
        """
        risks = []
        
        # Check for unencrypted storage
        for resource in terraform_plan.get('planned_values', {}).get('root_module', {}).get('resources', []):
            if resource.get('type') == 'aws_s3_bucket':
                if not self._has_encryption(resource):
                    risks.append(ComplianceRisk(
                        risk_id=f"ENCRYPT-{resource['name']}",
                        title="Unencrypted S3 Bucket",
                        description=f"S3 bucket {resource['name']} does not have encryption enabled",
                        framework=ComplianceFramework.SOX,
                        risk_level=RiskLevel.HIGH,
                        affected_systems=[resource['name']],
                        mitigation_status="Open",
                        owner="Infrastructure Team"
                    ))
            
            # Check for overly permissive security groups
            elif resource.get('type') == 'aws_security_group':
                if self._has_wide_open_ingress(resource):
                    risks.append(ComplianceRisk(
                        risk_id=f"SG-{resource['name']}",
                        title="Overly Permissive Security Group",
                        description=f"Security group {resource['name']} allows unrestricted access",
                        framework=ComplianceFramework.PCI_DSS,
                        risk_level=RiskLevel.CRITICAL,
                        affected_systems=[resource['name']],
                        mitigation_status="Open",
                        owner="Security Team"
                    ))
        
        return risks
    
    def assess_application_risks(self, app_config: Dict) -> List[ComplianceRisk]:
        """
        Assess compliance risks from application configuration
        """
        risks = []
        
        # Check for missing authentication
        if not app_config.get('authentication', {}).get('enabled'):
            risks.append(ComplianceRisk(
                risk_id="AUTH-001",
                title="Missing Authentication",
                description="Application does not have authentication enabled",
                framework=ComplianceFramework.SOX,
                risk_level=RiskLevel.CRITICAL,
                affected_systems=[app_config.get('name', 'unknown')],
                mitigation_status="Open",
                owner="Development Team"
            ))
        
        # Check for weak session management
        session_config = app_config.get('session', {})
        if not session_config.get('secure') or not session_config.get('http_only'):
            risks.append(ComplianceRisk(
                risk_id="SESSION-001",
                title="Weak Session Configuration",
                description="Session cookies are not properly secured",
                framework=ComplianceFramework.GDPR,
                risk_level=RiskLevel.MEDIUM,
                affected_systems=[app_config.get('name', 'unknown')],
                mitigation_status="Open",
                owner="Development Team"
            ))
        
        return risks
    
    def generate_risk_report(self, risks: List[ComplianceRisk]) -> Dict:
        """
        Generate risk assessment report
        """
        risk_by_level = {level: 0 for level in RiskLevel}
        risk_by_framework = {framework: 0 for framework in ComplianceFramework}
        
        for risk in risks:
            risk_by_level[risk.risk_level] += 1
            risk_by_framework[risk.framework] += 1
        
        return {
            'total_risks': len(risks),
            'risk_distribution': {
                'critical': risk_by_level[RiskLevel.CRITICAL],
                'high': risk_by_level[RiskLevel.HIGH],
                'medium': risk_by_level[RiskLevel.MEDIUM],
                'low': risk_by_level[RiskLevel.LOW]
            },
            'framework_distribution': {
                framework.value: count for framework, count in risk_by_framework.items()
            },
            'high_priority_risks': [
                {
                    'id': risk.risk_id,
                    'title': risk.title,
                    'framework': risk.framework.value,
                    'level': risk.risk_level.name,
                    'owner': risk.owner
                }
                for risk in risks if risk.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]
            ],
            'recommendations': self._generate_recommendations(risks)
        }
    
    def _generate_recommendations(self, risks: List[ComplianceRisk]) -> List[str]:
        """Generate recommendations based on identified risks"""
        recommendations = []
        
        critical_risks = [r for r in risks if r.risk_level == RiskLevel.CRITICAL]
        if critical_risks:
            recommendations.append("Address all critical risks immediately")
        
        encryption_risks = [r for r in risks if 'encrypt' in r.title.lower()]
        if encryption_risks:
            recommendations.append("Implement encryption for all sensitive data stores")
        
        auth_risks = [r for r in risks if 'auth' in r.title.lower()]
        if auth_risks:
            recommendations.append("Review and strengthen authentication mechanisms")
        
        return recommendations
```

## Getting Started Checklist

### Framework Implementation
- [ ] Identify applicable compliance frameworks
- [ ] Map framework requirements to technical controls
- [ ] Implement automated compliance checking
- [ ] Set up policy as code validation
- [ ] Configure compliance monitoring and alerting
- [ ] Create framework-specific documentation

### Audit Trail Setup
- [ ] Implement comprehensive audit logging
- [ ] Configure log retention per compliance requirements
- [ ] Set up log integrity and tamper protection
- [ ] Create audit trail monitoring and alerting
- [ ] Implement log analysis and reporting
- [ ] Test log completeness and accuracy

### Risk Management
- [ ] Conduct initial risk assessment
- [ ] Implement automated risk identification
- [ ] Create risk mitigation procedures
- [ ] Set up risk monitoring and tracking
- [ ] Establish risk escalation processes
- [ ] Plan regular risk assessments

### Reporting and Documentation
- [ ] Create compliance reporting automation
- [ ] Set up stakeholder notification procedures
- [ ] Document compliance procedures and controls
- [ ] Create incident response procedures
- [ ] Establish evidence collection processes
- [ ] Plan regular compliance reviews and updates

## Related Topics

- [Security Best Practices](security-best-practices.md) - Foundation security implementations
- [Secrets Management](secrets-management.md) - Secure handling of sensitive data
- [Monitoring and Logging](/devops-engineering/monitoring-logging/tools-grafana-elk.md) - Audit trail implementation
- [Infrastructure as Code](/devops-engineering/infrastructure-as-code.md) - Compliant infrastructure automation