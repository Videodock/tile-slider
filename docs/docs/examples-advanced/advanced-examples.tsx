import React, { useState } from 'react';

import { math, TileSlider, useResponsiveSize } from '../../../src';
import { items, renderLeftControl, renderRightControl, renderTile } from '../helpers';
import '../../../src/style.css';

export const ResponsiveSlider = () => {
  const [tilesToShow] = useResponsiveSize([{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }]);
  return (
    <TileSlider
      tilesToShow={tilesToShow}
      renderTile={renderTile}
      items={items}
      renderRightControl={renderRightControl}
      renderLeftControl={renderLeftControl}
    />
  );
};

export const SliderWithState = () => {
  const [state, setState] = useState({ index: 0, total: items.length, page: 1, pages: Math.ceil(items.length / 4) });
  return (
    <>
      <TileSlider
        renderTile={renderTile}
        tilesToShow={4}
        items={items}
        renderRightControl={renderRightControl}
        renderLeftControl={renderLeftControl}
        onSlideStart={setState}
        onSlideEnd={setState}
      />
      <code>
        State: {JSON.stringify(state, null, 2)} <br/>
        Circular index: {math.getCircularIndex(state.index, state.total)}
      </code>
    </>
  );
};
