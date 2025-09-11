import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Explore Standards 📖
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs/software-engineering/architecture-design">
            Get Started 🚀
          </Link>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50+</div>
            <div className={styles.statLabel}>Standards</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>5</div>
            <div className={styles.statLabel}>Categories</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>100+</div>
            <div className={styles.statLabel}>Best Practices</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <Heading as="h2">Ready to Elevate Your Engineering Standards?</Heading>
          <p>Join teams worldwide who trust our comprehensive standards to deliver exceptional software.</p>
          <div className={styles.buttons}>
            <Link
              className="button button--outline button--lg"
              to="/docs/intro"
              style={{color: 'white', borderColor: 'white'}}>
              Start Your Journey
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Engineering Excellence`}
      description="Comprehensive engineering standards, best practices, and guidelines for modern software development teams">
      <HomepageHeader />
      <main>
        <div className={styles.modernSection}>
          <div className="container">
            <div className={styles.sectionTitle}>
              <Heading as="h2">Engineering Excellence Made Simple</Heading>
              <p>Discover comprehensive standards that transform how your team builds, deploys, and maintains software.</p>
            </div>
          </div>
        </div>
        <HomepageFeatures />
        <StatsSection />
        <CTASection />
      </main>
    </Layout>
  );
}
