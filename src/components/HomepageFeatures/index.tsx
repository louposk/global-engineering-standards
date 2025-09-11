import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Comprehensive Standards',
    Svg: require('@site/static/img/standards-icon.svg').default,
    description: (
      <>
        Complete engineering standards covering software development, DevOps,
        quality engineering, and policy governance for modern teams.
      </>
    ),
  },
  {
    title: 'Best Practices',
    Svg: require('@site/static/img/best-practices-icon.svg').default,
    description: (
      <>
        Industry-tested practices and guidelines to help teams deliver
        high-quality software with consistency and reliability.
      </>
    ),
  },
  {
    title: 'Implementation Ready',
    Svg: require('@site/static/img/implementation-icon.svg').default,
    description: (
      <>
        Practical guidelines with real-world examples, templates, and tools
        to implement standards in your development workflow.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={clsx("text--center", styles.featureIcon)}>
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="text--center">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
