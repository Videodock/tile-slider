---
sidebar_position: 2
---

# Render tile

The `renderTile` render function is called for each tile rendered in the slider.
Use the `props.item` property to access the data off the current item in the `TileSlider#items` array. 

For the best performance, it's advised to keep the tile component simple.

The `renderTile` prop is required.

## Example

```tsx
import type { RenderTile } from './TileSlider';

const renderTile: RenderTile<Tile> = ({ item, isVisible }) => (
  <div className={`exampleTile ${!isVisible ? 'outOfView' : ''}`}>
    <img src={item.image} alt={item.title} />
  </div>
);
```

## Props

The `renderTile` function receives the following props:

| Name      | Type                                     | Description                                           |
|-----------|------------------------------------------|-------------------------------------------------------|
| item      | `T`                                      | The item rendered for this tile                       |
| itemIndex | `number`                                 | The index used to address the item in the items array |
| index     | `number`                                 | The index relative to the current rendered index      |
| isVisible | `boolean`                                | `true` when the tile is visible (inside viewport)     |
| slide     | `(direction: 'left' \| 'right') => void` | Call this function to slide left or right             |

