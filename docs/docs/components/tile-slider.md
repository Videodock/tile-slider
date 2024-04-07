# TileSlider

The `TileSlider` is the main component of this package and renders the slider.

## Example

```tsx
const Example = () => (
  <TileSlider
    tilesToShow={3}
    renderTile={renderTile}
    items={items}
    renderRightControl={renderRightControl}
    renderLeftControl={renderLeftControl}
  />
);
```

## Props

| Name               | Type                             | Defaults         | Description                                                         |
|--------------------|----------------------------------|------------------|---------------------------------------------------------------------|
| items              | `T[]`                            |                  | The [data set](../configuration/data-set) with all items            |
| cycleMode          | `CycleMode`                      | `endless`        | Controls how the slider behaves when the end is reached             |
| tilesToShow        | `number`                         | `6`              | Controls how many tiles are visible                                 |
| spacing            | `number`                         | `12`             | The spacing between each tile                                       |
| showControls       | `boolean`                        | `true`           | Controls whether the controls should be rendered                    |
| animated           | `boolean`                        | `!reducedMotion` | Controls whether animations should activated                        |
| animationFn        | `typeof easeOut`                 | `easing.easeOut` | Customise the animation with an easing function                     |
| className          | `string`                         |                  | Add a className to the root component                               |
| pageStep           | `'page' \| 'tile' \| number `    | `page`           | How many steps the slider should slide for each command             |
| renderTile         | `RenderTile`                     |                  | The [renderTile function](../configuration/render-tile)             |
| renderLeftControl  | `RenderControl`                  |                  | The [renderLeftControl function](../configuration/render-controls)  |
| renderRightControl | `RenderControl`                  |                  | The [renderRightControl function](../configuration/render-controls) |
| renderPagination   | `RenderPagination`               |                  | The [renderPagination function](../configuration/render-pagination) |
| onSwipeStart       | `() => void`                     |                  | Callback when the user starts a swipe gesture                       |
| onSwipeEnd         | `() => void`                     |                  | Callback when the user ends the swipe gesture                       |
| onSlideStart       | `(props: CallbackProps) => void` |                  | Callback when the slider starts sliding                             |
| onSlideEnd         | `(props: CallbackProps) => void` |                  | Callback when the slider ends sliding                               |
| overscan           | `number`                         | `tilesToShow`    | Controls how many tiles are preloaded outside the viewport          |
