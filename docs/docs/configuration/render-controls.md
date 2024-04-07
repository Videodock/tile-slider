---
sidebar_position: 3
---

# Render controls

The controls are used to slide the slider left or right.
In most cases, these controls are rendered left and right of the slider.

The `renderLeftControl` and `renderRightControl` methods are optional.

## Example

### renderLeftControl

```tsx
import type { RenderControl } from '@videodock/tile-slider';

const renderLeftControl: RenderControl = ({ onClick, disabled }) => (
  <button className="control" onClick={onClick} aria-label="Previous page" disabled={disabled}>{'<'}</button>
);
```

### renderRightControl

```tsx
import type { RenderControl } from '@videodock/tile-slider';

const renderRightControl: RenderControl = ({ onClick, disabled }) => (
  <button className="control" onClick={onClick} aria-label="Next page" disabled={disabled}>{'>'}</button>
);
```

## Props

The `renderLeftControl` and `renderRightControl` functions receives the following props:

| Name     | Type         | Description                                |
|----------|--------------|--------------------------------------------|
| onClick  | `() => void` | Call this function to slide left or right  |
| disabled | `boolean`    | `true` when the control should be disabled |
