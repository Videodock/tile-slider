# useResponsiveSize

Not a component, but a hook :-) for generating a value for the tilesToShow prop based on the current screen size. 

## Example

See a working example [here](../examples-advanced/responsive-slider)! 

```tsx
const Example = () => {
  const [tilesToShow] = useResponsiveSize([{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }]);
  
  return (
    <TileSlider
      tilesToShow={3}
      renderTile={renderTile}
      items={items}
      renderRightControl={renderRightControl}
      renderLeftControl={renderLeftControl}
    />
  );
}
```

## Arguments

| Name  | Type           | Defaults         | Description                                 |
|-------|----------------|------------------|---------------------------------------------|
| sizes | `SizeConfig[]` |                  | A list of size configs with all breakpoints |

## Breakpoints

| Name | Max size |
|------|----------|
| xs   | `479px`  |
| sm   | `767px`  |
| md   | `1023px` |
| lg   | `1199px` |
| xl   |          |
