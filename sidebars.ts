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
      label: 'Menu Options',
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'intro',
          label: 'Getting Started',
        },
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
            'quality-engineering/testing-strategies/ui-testing',
            'quality-engineering/testing-strategies/api-testing',
            'quality-engineering/testing-strategies/unit-testing',
            'quality-engineering/testing-strategies/integration-testing',
            'quality-engineering/testing-strategies/end-to-end-testing',
            'quality-engineering/testing-strategies/performance-testing',
          ],
        },
        'quality-engineering/test-automation',
        'quality-engineering/code-quality',
        'quality-engineering/quality-metrics',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial Basics',
      items: [
        'tutorial-basics/create-a-document',
        'tutorial-basics/create-a-page',
        'tutorial-basics/create-a-blog-post',
        'tutorial-basics/markdown-features',
        'tutorial-basics/deploy-your-site',
        'tutorial-basics/congratulations',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial Extras',
      items: [
        'tutorial-extras/manage-docs-versions',
        'tutorial-extras/translate-your-site',
      ],
    },
  ],
};

export default sidebars;
