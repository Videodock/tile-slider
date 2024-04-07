import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '@videodock/tile-slider',
  tagline: 'Performant slider written in React with virtualization',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://videodock.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: process.env.BASE_URL  || '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'videodock',
  projectName: 'tile-slider',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/videodock/tile-slider/tree/main/docs',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'TileSlider',
      logo: {
        alt: 'TileSlider Logo',
        src: 'img/icon.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/videodock/tile-slider',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://videodock.com',
          label: 'Videodock',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting started',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Used in',
          items: [
            {
              label: 'OTT Web App',
              href: 'https://github.com/jwplayer/ott-web-app',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Videodock',
              href: 'https://vidoedock.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/videodock/tile-slider',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Video Dock B.V., Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
