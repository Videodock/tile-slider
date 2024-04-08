# Tile Slider

> See the [v1 branch](https://github.com/Videodock/tile-slider/tree/v1) for the previous version

## Introduction

`@videodock/tile-slider` is a React component of a performant and accessible slider for your React project.
It only renders the visible tiles, meaning that you can have thousands of items and still get a good performing site and animation.

It only needs React... no other dependencies needed!

Checkout the demo page for examples

- https://videodock.github.io/tile-slider/

## Requirements

- react >= 17
- react-dom >= 17

## Installation

Install this package via (P)NPM or Yarn: 

```shell
$ yarn add @videodock/tile-slider
$ npm install @videodock/tile-slider
$ pnpm install @videodock/tile-slider
```

## Usage

This section will be extended. For now, please see the below example which uses all the supported features.

#### Important: .css file import requirement (version 1.0.1 and above)
Starting from version `1.0.1`, it's crucial to include the `.css` import explicitly, as demonstrated in the example below:

```tsx
import { TileSlider, CYCLE_MODE_RESTART } from '@videodock/tile-slider';
import '@videodock/tile-slider/lib/style.css';

type Data = { title: string; imageUrl: string };

const items: Data[] = Array.from({ length: 1000 }).map((_, index) => ({
  title: `Item #${index + 1}`,
  imageUrl: 'https://via.placeholder.com/350x150',
}));

const App: React.FC = () => {
  return (
    <TileSlider<Data>
      items={items}
      tilesToShow={6}
      spacing={8}
      cycleMode={CYCLE_MODE_RESTART}
      renderLeftControl={({ onClick, disabled }) => (
        <button onClick={onClick} disabled={disabled}>
          Slide left
        </button>
      )}
      renderRightControl={({ onClick, disabled }) => (
        <button onClick={onClick} disabled={disabled}>
          Slide right
        </button>
      )}
      renderTile={({ item, isVisible }) => {
        // you can do further performance optimizations for tiles that are not visible.
        return () => (
          <div style={{ width: 350, height: 120, backgroundImage: `url(${item.imageUrl})` }}>
            <p>{item.title}</p>
          </div>
        );
      }}
    />
  );
};

export default App;
```

## Documentation

Run the documentation app, which showcases all features of the TileSlider package:

```shell
cd docs
yarn
yarn start
```
