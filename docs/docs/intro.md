---
sidebar_position: 1
---

# Getting started

## Installation

```shell
$ yarn add @videodock/tile-slider
$ npm install @videodock/tile-slider
$ pnpm install @videodock/tile-slider
```

## Import

Start by importing the <code>TileSlider</code> component. Optionally, import the typings and default styling as well.

```tsx title="App.tsx"
import { TileSlider } from '@videodock/tile-slider';

// Optional typings when using TypeScript
import type { RenderTile, RenderControl, RenderPagination } from '@videodock/tile-slider';

// Default styling (import once)
import '@videodock/tile-slider/lib/style.css';
```
