# DevOps Tools: Docker and Ansible

Docker and Ansible are foundational tools in modern DevOps practices, enabling containerization and configuration management respectively. Together, they provide powerful capabilities for application deployment, infrastructure management, and operational consistency.

## Overview

This guide covers the practical implementation of Docker and Ansible in DevOps workflows:
- **Docker**: Containerization platform for application packaging and deployment
- **Ansible**: Configuration management and automation tool
- **Integration Patterns**: How to use these tools together effectively
- **Best Practices**: Enterprise-grade implementation strategies

## Docker Fundamentals

### Core Concepts

#### Containers vs. Virtual Machines
- **Containers**: Lightweight, OS-level virtualization
- **Shared Kernel**: More efficient resource utilization
- **Faster Startup**: Seconds vs. minutes for VMs
- **Portability**: "Write once, run anywhere" principle

#### Docker Components
- **Docker Engine**: Core containerization runtime
- **Docker Images**: Read-only templates for containers
- **Docker Containers**: Running instances of images
- **Dockerfile**: Instructions for building images
- **Docker Compose**: Multi-container application definition
- **Docker Registry**: Repository for storing and sharing images

### Docker Implementation

#### Dockerfile Best Practices

```dockerfile
# Use official base images
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership and switch user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHEK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Multi-Stage Builds

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose for Local Development

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - database
    networks:
      - app-network

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Docker Security Best Practices

#### Image Security
- Use official and verified base images
- Regularly update base images
- Scan images for vulnerabilities
- Use minimal base images (Alpine, Distroless)
- Don't run containers as root

#### Runtime Security
- Implement resource constraints
- Use read-only file systems where possible
- Enable user namespaces
- Use security profiles (AppArmor, SELinux)
- Network segmentation and policies

#### Secrets Management
- Never embed secrets in images
- Use Docker secrets or external secret management
- Implement proper secret rotation
- Audit secret access and usage

## Ansible Fundamentals

### Core Concepts

#### Infrastructure as Code
- **Declarative**: Describe desired state, not steps
- **Idempotent**: Safe to run multiple times
- **Agentless**: No software installation on managed nodes
- **Version Control**: Infrastructure definitions in Git

#### Ansible Components
- **Inventory**: List of managed hosts and groups
- **Playbooks**: YAML files defining automation tasks
- **Tasks**: Individual automation actions
- **Modules**: Reusable automation components
- **Roles**: Reusable collections of tasks and configurations
- **Ansible Vault**: Encryption for sensitive data

### Ansible Implementation

#### Inventory Management

**Static Inventory (hosts.yml)**:
```yaml
all:
  children:
    web_servers:
      hosts:
        web1.example.com:
          ansible_host: 192.168.1.10
        web2.example.com:
          ansible_host: 192.168.1.11
      vars:
        http_port: 80
        https_port: 443
    
    database_servers:
      hosts:
        db1.example.com:
          ansible_host: 192.168.1.20
        db2.example.com:
          ansible_host: 192.168.1.21
      vars:
        db_port: 5432
    
    production:
      children:
        web_servers:
        database_servers:
      vars:
        environment: production
```

**Dynamic Inventory**: Integration with cloud providers (AWS, Azure, GCP)

#### Playbook Structure

```yaml
---
- name: Deploy Web Application
  hosts: web_servers
  become: yes
  gather_facts: yes
  
  vars:
    app_name: mywebapp
    app_version: "{{ lookup('env', 'APP_VERSION') | default('latest') }}"
  
  pre_tasks:
    - name: Update system packages
      package:
        name: "*"
        state: latest
      when: ansible_os_family == "RedHat"
  
  roles:
    - docker
    - nginx
    - application
  
  tasks:
    - name: Ensure application is running
      docker_container:
        name: "{{ app_name }}"
        image: "myregistry/{{ app_name }}:{{ app_version }}"
        state: started
        restart_policy: always
        ports:
          - "8080:8080"
        env:
          ENVIRONMENT: "{{ environment }}"
  
  post_tasks:
    - name: Verify application health
      uri:
        url: "http://{{ ansible_host }}:8080/health"
        method: GET
        status_code: 200
      retries: 5
      delay: 10
```

#### Role Development

**Role Directory Structure**:
```
roles/
  docker/
    tasks/main.yml
    handlers/main.yml
    templates/
    files/
    vars/main.yml
    defaults/main.yml
    meta/main.yml
```

**Example Role (roles/docker/tasks/main.yml)**:
```yaml
---
- name: Install required packages
  package:
    name:
      - apt-transport-https
      - ca-certificates
      - curl
      - gnupg
      - lsb-release
    state: present
  when: ansible_os_family == "Debian"

- name: Add Docker GPG key
  apt_key:
    url: https://download.docker.com/linux/ubuntu/gpg
    state: present
  when: ansible_os_family == "Debian"

- name: Add Docker repository
  apt_repository:
    repo: "deb https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
    state: present
  when: ansible_os_family == "Debian"

- name: Install Docker
  package:
    name:
      - docker-ce
      - docker-ce-cli
      - containerd.io
      - docker-compose-plugin
    state: present

- name: Start and enable Docker service
  service:
    name: docker
    state: started
    enabled: yes

- name: Add users to docker group
  user:
    name: "{{ item }}"
    groups: docker
    append: yes
  loop: "{{ docker_users | default([]) }}"
  notify: restart docker
```

### Ansible Best Practices

#### Playbook Organization
- Use roles for reusable components
- Implement proper variable precedence
- Use tags for selective execution
- Implement error handling and recovery
- Use templates for configuration files

#### Security Practices
- Use Ansible Vault for sensitive data
- Implement proper SSH key management
- Use sudo with specific commands only
- Regularly rotate credentials
- Audit playbook execution logs

#### Performance Optimization
- Use async tasks for long-running operations
- Implement parallelism with serial or batch execution
- Use fact caching to reduce gathering overhead
- Optimize SSH connections with pipelining
- Use local actions where appropriate

## Docker and Ansible Integration

### Container Management with Ansible

#### Docker Modules
- **docker_container**: Manage container lifecycle
- **docker_image**: Build and manage images
- **docker_network**: Configure container networking
- **docker_volume**: Manage persistent storage
- **docker_compose**: Orchestrate multi-container applications

#### Example Integration

```yaml
---
- name: Deploy Containerized Application
  hosts: docker_hosts
  become: yes
  
  tasks:
    - name: Pull latest application image
      docker_image:
        name: "{{ app_registry }}/{{ app_name }}"
        tag: "{{ app_version }}"
        pull: yes
        source: pull
    
    - name: Create application network
      docker_network:
        name: "{{ app_name }}_network"
        state: present
    
    - name: Deploy database container
      docker_container:
        name: "{{ app_name }}_db"
        image: postgres:15
        state: started
        restart_policy: always
        networks:
          - name: "{{ app_name }}_network"
        env:
          POSTGRES_DB: "{{ db_name }}"
          POSTGRES_USER: "{{ db_user }}"
          POSTGRES_PASSWORD: "{{ db_password }}"
        volumes:
          - "{{ app_name }}_db_data:/var/lib/postgresql/data"
    
    - name: Deploy application container
      docker_container:
        name: "{{ app_name }}_app"
        image: "{{ app_registry }}/{{ app_name }}:{{ app_version }}"
        state: started
        restart_policy: always
        networks:
          - name: "{{ app_name }}_network"
        ports:
          - "{{ app_port }}:8080"
        env:
          DATABASE_URL: "postgresql://{{ db_user }}:{{ db_password }}@{{ app_name }}_db:5432/{{ db_name }}"
        depends_on:
          - "{{ app_name }}_db"
```

### Infrastructure Provisioning

#### Multi-Environment Deployment

```yaml
---
- name: Provision Infrastructure
  hosts: localhost
  gather_facts: no
  
  vars:
    environments:
      development:
        instance_count: 1
        instance_type: t3.micro
      staging:
        instance_count: 2
        instance_type: t3.small
      production:
        instance_count: 3
        instance_type: t3.medium
  
  tasks:
    - name: Create EC2 instances
      amazon.aws.ec2_instance:
        name: "{{ app_name }}-{{ environment }}-{{ item }}"
        image_id: ami-0abcdef1234567890
        instance_type: "{{ environments[environment].instance_type }}"
        key_name: "{{ ssh_key_name }}"
        security_group: "{{ security_group_id }}"
        subnet_id: "{{ subnet_id }}"
        tags:
          Environment: "{{ environment }}"
          Application: "{{ app_name }}"
      loop: "{{ range(1, environments[environment].instance_count + 1) | list }}"
      register: ec2_instances
    
    - name: Add instances to inventory
      add_host:
        name: "{{ item.instances[0].public_ip_address }}"
        groups: "{{ environment }}_servers"
        ansible_user: ubuntu
        ansible_ssh_private_key_file: "{{ ssh_key_path }}"
      loop: "{{ ec2_instances.results }}"

- name: Configure instances
  hosts: "{{ environment }}_servers"
  become: yes
  
  roles:
    - docker
    - monitoring
    - security
```

## Advanced Patterns and Practices

### Blue-Green Deployment

```yaml
---
- name: Blue-Green Deployment
  hosts: web_servers
  serial: 1
  
  vars:
    deployment_color: "{{ 'blue' if current_color == 'green' else 'green' }}"
  
  tasks:
    - name: Deploy new version to {{ deployment_color }} environment
      docker_container:
        name: "{{ app_name }}_{{ deployment_color }}"
        image: "{{ app_registry }}/{{ app_name }}:{{ app_version }}"
        state: started
        ports:
          - "{{ deployment_ports[deployment_color] }}:8080"
    
    - name: Health check new deployment
      uri:
        url: "http://{{ ansible_host }}:{{ deployment_ports[deployment_color] }}/health"
        method: GET
        status_code: 200
      retries: 10
      delay: 5
    
    - name: Update load balancer
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        backup: yes
      notify: reload nginx
    
    - name: Stop old version
      docker_container:
        name: "{{ app_name }}_{{ current_color }}"
        state: stopped
      when: health_check is succeeded
```

### Rolling Updates

```yaml
---
- name: Rolling Update
  hosts: web_servers
  serial: "{{ (groups['web_servers'] | length * 0.3) | round(0, 'ceil') | int }}"
  max_fail_percentage: 10
  
  tasks:
    - name: Remove server from load balancer
      uri:
        url: "{{ load_balancer_api }}/servers/{{ inventory_hostname }}/disable"
        method: POST
      delegate_to: localhost
    
    - name: Wait for connections to drain
      wait_for:
        timeout: 30
    
    - name: Update application
      docker_container:
        name: "{{ app_name }}"
        image: "{{ app_registry }}/{{ app_name }}:{{ app_version }}"
        state: started
        restart: yes
    
    - name: Health check
      uri:
        url: "http://{{ ansible_host }}:{{ app_port }}/health"
        method: GET
        status_code: 200
      retries: 5
      delay: 10
    
    - name: Add server back to load balancer
      uri:
        url: "{{ load_balancer_api }}/servers/{{ inventory_hostname }}/enable"
        method: POST
      delegate_to: localhost
```

## Monitoring and Logging

### Container Monitoring

```yaml
---
- name: Setup Container Monitoring
  hosts: docker_hosts
  become: yes
  
  tasks:
    - name: Deploy Prometheus Node Exporter
      docker_container:
        name: node_exporter
        image: prom/node-exporter:latest
        state: started
        restart_policy: always
        ports:
          - "9100:9100"
        volumes:
          - "/proc:/host/proc:ro"
          - "/sys:/host/sys:ro"
          - "/:/rootfs:ro"
        command:
          - '--path.procfs=/host/proc'
          - '--path.rootfs=/rootfs'
          - '--path.sysfs=/host/sys'
          - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    
    - name: Deploy cAdvisor
      docker_container:
        name: cadvisor
        image: gcr.io/cadvisor/cadvisor:latest
        state: started
        restart_policy: always
        ports:
          - "8080:8080"
        volumes:
          - "/:/rootfs:ro"
          - "/var/run:/var/run:ro"
          - "/sys:/sys:ro"
          - "/var/lib/docker/:/var/lib/docker:ro"
          - "/dev/disk/:/dev/disk:ro"
        privileged: yes
```

### Log Management

```yaml
---
- name: Setup Centralized Logging
  hosts: all
  become: yes
  
  tasks:
    - name: Install Filebeat
      docker_container:
        name: filebeat
        image: docker.elastic.co/beats/filebeat:8.5.0
        state: started
        restart_policy: always
        volumes:
          - "/var/log:/var/log:ro"
          - "/var/lib/docker/containers:/var/lib/docker/containers:ro"
          - "/var/run/docker.sock:/var/run/docker.sock:ro"
          - "{{ filebeat_config_path }}:/usr/share/filebeat/filebeat.yml:ro"
        environment:
          ELASTICSEARCH_HOSTS: "{{ elasticsearch_hosts }}"
        user: root
```

## Troubleshooting and Debugging

### Common Docker Issues

#### Container Debugging
```bash
# Check container logs
docker logs <container_name>

# Execute commands in running container
docker exec -it <container_name> /bin/bash

# Inspect container configuration
docker inspect <container_name>

# Monitor container resources
docker stats <container_name>
```

#### Image Debugging
```bash
# Analyze image layers
docker history <image_name>

# Check image vulnerability
docker scan <image_name>

# Remove unused images
docker image prune -a
```

### Common Ansible Issues

#### Debugging Playbooks
```bash
# Run with verbose output
ansible-playbook -vvv playbook.yml

# Check syntax
ansible-playbook --syntax-check playbook.yml

# Dry run
ansible-playbook --check playbook.yml

# Step through tasks
ansible-playbook --step playbook.yml
```

#### Connection Issues
```bash
# Test connectivity
ansible all -m ping

# Check SSH configuration
ansible-config dump | grep -i ssh

# Debug connection issues
ansible-playbook -vvv --ask-pass playbook.yml
```

## Getting Started Checklist

### Docker Setup
- [ ] Install Docker Engine and Docker Compose
- [ ] Configure Docker daemon and security settings
- [ ] Set up private registry (if needed)
- [ ] Implement image scanning and security policies
- [ ] Create base images and Dockerfile templates
- [ ] Set up build automation and CI/CD integration

### Ansible Setup
- [ ] Install Ansible and required collections
- [ ] Configure inventory and SSH key management
- [ ] Create directory structure and role templates
- [ ] Set up Ansible Vault for secrets management
- [ ] Implement playbook testing and validation
- [ ] Configure logging and audit trails

### Integration
- [ ] Create Docker management roles and playbooks
- [ ] Implement deployment automation
- [ ] Set up monitoring and alerting
- [ ] Create disaster recovery procedures
- [ ] Document processes and runbooks
- [ ] Train team on tools and processes

## Related Topics

- [Infrastructure as Code](infrastructure-as-code.md) - Broader IaC concepts and practices
- [Best Practices for IaC](best-practices-iac.md) - IaC implementation guidelines
- [CI/CD Pipelines](/devops-engineering/cicd-pipelines.md) - Integration with continuous delivery
- [Monitoring and Logging](/devops-engineering/monitoring-logging/tools-grafana-elk.md) - Observability implementation