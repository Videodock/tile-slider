---
sidebar_position: 4
---

# Render pagination

The `renderPagination` prop can be used to render a component that receives pagination data. 

## Example

```tsx
import type { RenderPagination } from './TileSlider';

export const renderPagination: RenderPagination = ({ page, pages, slideToPage }) => {
  const items = Array.from({ length: props.pages }, (_, pageIndex) => pageIndex);

  return (
    <ul className="paginationDots">
      {items.map((current) => (
        <li key={current} className={page === current ? 'activeDot' : ''} onClick={() => slideToPage(current)}>
          &#9679;
        </li>
      ))}
    </ul>
  );
};
```

## Props

The `renderPagination` function receives the following props:

| Name         | Type                                     | Description                               |
|--------------|------------------------------------------|-------------------------------------------|
| page         | `number`                                 | The current page index                    |
| pages        | `number`                                 | The number of pages                       |
| index        | `number`                                 | The current slide index                   |
| total        | `number`                                 | The total slides                          |
| slideToPage  | `(page: number) => void`                 | Callback to slide to the given page index |
| slideToIndex | `(index: number) => void`                | Callback to slide to the given tile index |
| slide        | `(direction: 'left' \| 'right') => void` | Callback to slide left or right           |

