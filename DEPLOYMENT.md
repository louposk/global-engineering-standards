# Deployment Guide

This document provides instructions for deploying the Global Engineering Standards documentation site.

## GitHub Pages Deployment

This site is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Automatic Deployment

1. **Push to main/master branch**: The site will automatically build and deploy when changes are pushed to the main or master branch.

2. **GitHub Actions Workflow**: The deployment is handled by `.github/workflows/deploy.yml` which:
   - Builds the Docusaurus site
   - Uploads the build artifacts
   - Deploys to GitHub Pages

### Manual Deployment

If you need to deploy manually, you can use the following commands:

```bash
# Build the site
yarn build

# Deploy to GitHub Pages (if you have push access)
yarn deploy
```

### Site Configuration

The site is configured with the following settings in `docusaurus.config.ts`:

- **URL**: `https://louposk.github.io`
- **Base URL**: `/global-engineering-standards/`
- **Organization**: `louposk`
- **Project**: `global-engineering-standards`

### Custom Domain (Optional)

To use a custom domain:

1. Create a `CNAME` file in the `static` directory with your domain name
2. Configure DNS records for your domain to point to GitHub Pages
3. Update the `url` field in `docusaurus.config.ts`

### Files for GitHub Pages

The following files have been created to ensure proper GitHub Pages functionality:

- **`index.html`** (root): Redirects visitors to the main documentation site
- **`static/index.html`**: Fallback redirect page
- **`static/404.html`**: Custom 404 error page with navigation
- **`static/.nojekyll`**: Prevents Jekyll processing on GitHub Pages
- **`.github/workflows/deploy.yml`**: GitHub Actions deployment workflow

### Accessing the Site

Once deployed, the site will be available at:
- **Main Site**: https://louposk.github.io/global-engineering-standards/
- **Root Redirect**: https://louposk.github.io/global-engineering-standards (redirects to main site)

### Troubleshooting

1. **Build Failures**: Check the GitHub Actions logs in the "Actions" tab of your repository
2. **404 Errors**: Ensure the base URL is correctly configured and matches your repository name
3. **Asset Loading Issues**: Verify that all assets are placed in the `static` directory
4. **Redirect Issues**: Check that the index.html files have the correct paths

### Development vs Production

- **Development**: `yarn start` - runs on http://localhost:3000/global-engineering-standards/
- **Production**: Deployed to GitHub Pages at the configured URL

### Prerequisites for Deployment

1. Repository must be public (for free GitHub Pages)
2. GitHub Pages must be enabled in repository settings
3. GitHub Actions must be allowed to deploy to Pages

### Security

The deployment workflow uses minimal permissions and only has access to:
- Read repository contents
- Write to GitHub Pages
- Generate ID tokens for deployment

No sensitive data or secrets are required for deployment.