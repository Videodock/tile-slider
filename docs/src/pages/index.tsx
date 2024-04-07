import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { items, renderLeftControl, renderRightControl, type Tile } from '@site/docs/helpers';

import { TileSlider, type RenderTile } from '../../../src';
import '../../../src/style.css';

import styles from './index.module.css';
import { Document } from 'postcss';

const renderTile: RenderTile<Tile> = ({ item, isVisible }) => {
  return (
    <div className={`exampleTile ${!isVisible ? 'outOfView' : ''}`}>
      <img src={item.image} alt={item.title} />
    </div>
  );
};

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        <TileSlider
          items={items}
          tilesToShow={2}
          renderLeftControl={renderLeftControl}
          renderRightControl={renderRightControl}
          renderTile={renderTile}
        />

        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Get started!
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <HomepageHeader />
    </Layout>
  );
}
