# Tile Slider

## Introduction

`@videodock/tile-slider` is a React component which can be used to create a performant and accessible slider for your React
website. It only renders the visible tiles, meaning that you can have thousands of items and still get a good performing site and animation.

It only needs React... no other dependencies needed! 

## Installation

The package can be installed using NPM or Yarn.

**Yarn:**
```
$ yarn add @videodock/tile-slider
```

**NPM:**
```
$ npm install @videodock/tile-slider
```

## Usage

This section will be extended. For now, please see the below example which uses all the supported features as for now.

```tsx
import { TileSlider, CYCLE_MODE_RESTART  } from '@videodock/tile-slider';

type Data = { title: string, imageUrl: string };

const items: Data[] = Array.from({ length: 1000 }).map((_, index) => ({
  title: `Item #${index + 1}`,
  imageUrl: 'https://via.placeholder.com/350x150',
}))

const App: React.FC = () => {
  return (
    <TileSlider<Data>
      items={items}
      tilesToShow={6}
      spacing={8}
      cycleMode={CYCLE_MODE_RESTART}
      renderAriaLabel={(tile, total) => `Tile ${tile.index + 1} of ${total}`}
      renderLeftControl={({ onClick, disabled }) => <button onClick={onClick} disabled={disabled}>Slide left</button>}
      renderRightControl={({ onClick, disabled }) => <button onClick={onClick} disabled={disabled}>Slide right</button>}
      renderTile={(tile, inView) => {
        // you can do further performance optimisations for tiles that are not visible.
        return () => (
          <div style={{ width: 350, height: 120, backgroundImage: `url(${tile.item.imageUrl})` }}>
            <p>{tile.item.title}</p>
          </div>
        );
      }}
    />
  );
};

export default App;
```
