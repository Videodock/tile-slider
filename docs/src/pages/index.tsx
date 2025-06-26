import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { type Tile, items, renderLeftControl, renderRightControl } from '@site/docs/helpers';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';

import { type RenderTile, TileSlider } from '../../../src';
import '../../../src/style.css';

import { Document } from 'postcss';
import styles from './index.module.css';

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

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <HomepageHeader />
    </Layout>
  );
}
