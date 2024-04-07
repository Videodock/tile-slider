---
sidebar_position: 1
---

# Data set

## Create a data set

For this example we generate a fake data set using `Array.from`.
You will most likely connect it to an API or JSON file with predefined items.

```tsx title="App.tsx"
// create a type for each item
type Tile = {
  title: string;
  image: string;
};

// create example data set with 10 tiles
const items: Tile[] = Array.from({ length: 10 }, (_, index) => ({
  title: `Tile ${index}`,
  image: `/img/${index}.jpg`,
}));
```
