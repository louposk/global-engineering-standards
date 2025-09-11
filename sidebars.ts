import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Home',
      collapsible: true,
      collapsed: false,
      items: [
        'welcome-message',
        'overview-guide',
        'quick-links',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsible: true,
      collapsed: true,
      items: [
        'getting-started/introduction-quality-engineering',
        'getting-started/introduction-devops-engineering',
        'getting-started/prerequisites-setup',
      ],
    },
    {
      type: 'category',
      label: 'Quality Engineering',
      collapsible: true,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Testing Strategies',
          collapsible: true,
          collapsed: true,
          items: [
            'quality-engineering/testing-strategies/unit-testing',
            'quality-engineering/testing-strategies/integration-testing',
            'quality-engineering/testing-strategies/end-to-end-testing',
            'quality-engineering/testing-strategies/performance-testing',
          ],
        },
        {
          type: 'category',
          label: 'Test Automation',
          collapsible: true,
          collapsed: true,
          items: [
            'quality-engineering/test-automation',
            'quality-engineering/test-automation-tools-frameworks',
            'quality-engineering/test-automation-best-practices',
            'quality-engineering/test-automation-cicd-integration',
          ],
        },
        {
          type: 'category',
          label: 'Code Quality',
          collapsible: true,
          collapsed: true,
          items: [
            'quality-engineering/code-quality/static-code-analysis',
            'quality-engineering/code-quality/code-reviews',
            'quality-engineering/code-quality/metrics-monitoring',
          ],
        },
        {
          type: 'category',
          label: 'Quality Metrics',
          collapsible: true,
          collapsed: true,
          items: [
            'quality-engineering/quality-metrics/kpis-for-quality',
            'quality-engineering/quality-metrics/monitoring-reporting',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'DevOps Engineering',
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'CI/CD Pipelines',
          collapsible: true,
          collapsed: true,
          items: [
            'devops-engineering/cicd-pipelines',
            'devops-engineering/designing-pipelines',
            'devops-engineering/tools-overview',
          ],
        },
        {
          type: 'category',
          label: 'Infrastructure as Code',
          collapsible: true,
          collapsed: true,
          items: [
            'devops-engineering/infrastructure-as-code',
            'devops-engineering/tools-docker-ansible',
            'devops-engineering/best-practices-iac',
          ],
        },
        {
          type: 'category',
          label: 'Monitoring and Logging',
          collapsible: true,
          collapsed: true,
          items: [
            'devops-engineering/monitoring-logging/tools-grafana-elk',
            'devops-engineering/monitoring-logging/alerting-incident-response',
          ],
        },
        {
          type: 'category',
          label: 'Security in DevOps',
          collapsible: true,
          collapsed: true,
          items: [
            'devops-engineering/security-devops/security-best-practices',
            'devops-engineering/security-devops/secrets-management',
            'devops-engineering/security-devops/compliance',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Tools & Resources',
      collapsible: true,
      collapsed: true,
      items: [
        'tools-resources/recommended-tools',
        'tools-resources/tutorials-guides',
        'tools-resources/schema-templates',
      ],
    },
    {
      type: 'category',
      label: 'Policy & Governance',
      collapsible: true,
      collapsed: true,
      items: [
        'policy-governance/standards-guidelines',
        'policy-governance/compliance-security-policies',
        'policy-governance/review-audit-processes',
      ],
    },
    {
      type: 'category',
      label: 'Community & Support',
      collapsible: true,
      collapsed: true,
      items: [
        'community-support/faqs',
        'community-support/contributing-guidelines',
        'community-support/contact-feedback',
      ],
    },
    {
      type: 'category',
      label: 'Changelog & Updates',
      collapsible: true,
      collapsed: true,
      items: [
        'changelog-updates/document-version-history',
        'changelog-updates/latest-updates',
      ],
    },
  ],
};

export default sidebars;
