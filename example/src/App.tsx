import React, { useCallback } from 'react';

import TileSlider from '../../src/TileSlider/TileSlider';
import type { RenderTile, RenderControl } from '../../src/TileSlider/TileSlider';

type Tile = {
  title: string;
};

const App = () => {
  const items: Tile[] = Array.from({ length: 25 }, (_, index) => ({ title: `Tile ${index}` }));

  const renderTile: RenderTile<Tile> = useCallback(
    (item, isInView) => <div className={`exampleTile ${!isInView ? 'outOfView' : ''}`}>{item.title}</div>,
    [],
  );

  const renderLeftControl: RenderControl = useCallback(
    ({ onClick }) => (
      <button className="control" onClick={onClick}>
        &larr;
      </button>
    ),
    [],
  );

  const renderRightControl: RenderControl = useCallback(
    ({ onClick }) => (
      <button className="control" onClick={onClick}>
        &rarr;
      </button>
    ),
    [],
  );

  const renderPaginationDots = useCallback(
    (index: number, pageIndex: number) => (
      <span key={pageIndex} className={`dot${index === pageIndex ? ', activeDot' : ''}`}>
        &#9679;
      </span>
    ),
    [],
  );

  return (
    <div className="example">
      <header>
        <h1>TileSlider</h1>
      </header>
      <h2>Basic example</h2>
      <div className="sliderContainer">
        <TileSlider
          className="slider"
          items={items}
          tilesToShow={5}
          spacing={16}
          cycleMode={'restart'}
          transitionTime={'0.3s'}
          showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
          renderTile={renderTile}
          renderLeftControl={renderLeftControl}
          renderRightControl={renderRightControl}
        />
      </div>
      <h2>Show tiles that are out of boundaries transparent</h2>
      <div className="sliderContainer">
        <TileSlider
          className="slider showOutOfView"
          items={items}
          tilesToShow={5}
          spacing={16}
          cycleMode={'restart'}
          transitionTime={'0.3s'}
          showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
          renderTile={renderTile}
          renderLeftControl={renderLeftControl}
          renderRightControl={renderRightControl}
        />
      </div>
      <h2>Show pagination dots</h2>
      <div className="sliderContainer">
        <TileSlider
          className="slider showOutOfView"
          items={items}
          tilesToShow={5}
          spacing={16}
          cycleMode={'restart'}
          transitionTime={'0.3s'}
          showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
          renderPaginationDots={renderPaginationDots}
          renderTile={renderTile}
          renderLeftControl={renderLeftControl}
          renderRightControl={renderRightControl}
          showDots
        />
      </div>
    </div>
  );
};

export default App;
