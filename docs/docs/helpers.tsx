import React, { useRef, useState } from 'react';
import siteConfig from '@generated/docusaurus.config';

import { RenderControl, RenderPagination, RenderTile, TileSlider, TileSliderRef } from '../../src';

export type Tile = {
  title: string;
  image: string;
};

const images = [
  'image1.jpeg',
  'image2.jpeg',
  'image3.jpeg',
  'image4.jpeg',
  'image5.jpeg',
  'image6.jpeg',
  'image7.jpeg',
  'image8.jpeg',
  'image9.jpeg',
  'image10.jpeg',
];

export const IconLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
  </svg>
);

export const IconRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
  </svg>
);

export const renderTile: RenderTile<Tile> = ({ item, isVisible }) => (
  <div className={`exampleTile ${!isVisible ? 'outOfView' : ''}`}>
    <img src={item.image} alt={item.title} />
  </div>
);

export const renderTileWithTitle: RenderTile<Tile> = ({ item, isVisible }) => (
  <div className={`exampleTile ${!isVisible ? 'outOfView' : ''}`}>
    <img src={item.image} alt={item.title} />
    <div>{item.title}</div>
  </div>
);

export const renderLeftControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick}>
    <IconLeft />
  </button>
);

export const renderRightControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick}>
    <IconRight />
  </button>
);

export const renderPagination: RenderPagination = (props) => {
  const pages = Array.from({ length: props.pages }, (_, pageIndex) => pageIndex);

  return (
    <ul className="paginationDots">
      {pages.map((page) => (
        <li key={page} className={props.page === page ? 'activeDot' : ''} onClick={() => props.slideToPage(page)}>
          &#9679;
        </li>
      ))}
    </ul>
  );
};

export const renderCustomPagination: RenderPagination = (props) => {
  return (
    <div>
      <button className="button button--primary margin-right--md" onClick={() => props.slideToIndex(0)}>
        Slide 0
      </button>
      <button className="button button--primary" onClick={() => props.slideToIndex(100)}>
        Slide 100
      </button>
    </div>
  );
};

export const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;

export const makeItems = (length: number): Tile[] =>
  Array.from({ length }, (_, index) => {
    const imageIndex = getCircularIndex(index, 10); // we only have 10 images :)

    return {
      title: `Tile ${index}`,
      image: images[imageIndex] ? `${siteConfig.baseUrl}img/${images[getCircularIndex(imageIndex, 10)]}` : '',
    };
  });

export function easeOutElastic(currentTime: number, startValue: number, changeInValue: number, duration: number): number {
  if (currentTime === 0) {
    return startValue;
  }
  if ((currentTime /= duration) === 1) {
    return startValue + changeInValue;
  }

  const p = duration * 0.3;
  const s = p / 4;

  return (
    changeInValue * Math.pow(2, -10 * currentTime) * Math.sin(((currentTime * duration - s) * (2 * Math.PI)) / p) +
    changeInValue +
    startValue
  );
}

export const WithDynamicPropsExample = () => {
  const tileSliderRef = useRef<TileSliderRef>();
  const [state, setState] = useState({ tilesToShow: 3 });

  return (
    <>
      <TileSlider
        sliderRef={tileSliderRef}
        tilesToShow={state.tilesToShow}
        renderTile={renderTile}
        items={items}
        renderRightControl={renderRightControl}
        renderLeftControl={renderLeftControl}
      />
      <label>Tiles to show: </label>
      <button onClick={() => setState({ tilesToShow: state.tilesToShow - 1})}>-</button>
      <input value={state.tilesToShow} style={{ width: 40, textAlign: 'center' }} />
      <button onClick={() => setState({ tilesToShow: state.tilesToShow + 1})}>+</button>
    </>
  );
};

export const WithRefExample = () => {
  const tileSliderRef = useRef<TileSliderRef>();
  const [state, setState] = useState({ index: 0, itemIndex: 0, page: 0 });

  return (
    <>
      <TileSlider
        sliderRef={tileSliderRef}
        tilesToShow={3}
        renderTile={renderTile}
        items={items}
        renderRightControl={renderRightControl}
        renderLeftControl={renderLeftControl}
        onSlideEnd={({ index, itemIndex, page }) => setState({ index, itemIndex, page })}
      />
      <hr />
      <h3>State</h3>
      <div>
        <label>Current index:</label> {state.index}{' '}
      </div>
      <div>
        <label>Current item index:</label> {state.itemIndex}{' '}
      </div>
      <div>
        <label>Current page:</label> {state.page}
      </div>
      <h3>Controls</h3>
      <div>
        <strong>slide(direction: &apos;left&apos; | &apos;right&apos;)</strong>
        <br />
        <button onClick={() => tileSliderRef.current?.slide('left')}>Slide left</button>{' '}
        <button onClick={() => tileSliderRef.current?.slide('right')}>Slide right</button>
      </div>
      <div>
        <strong>slideToIndex(index: number)</strong>
        <br />
        <button onClick={() => tileSliderRef.current?.slideToIndex(0)}>Slide to index: 0</button>{' '}
        <button onClick={() => tileSliderRef.current?.slideToIndex(10)}>Slide to index: 10</button>{' '}
        <button onClick={() => tileSliderRef.current?.slideToIndex(100)}>Slide to index: 100</button>
        <button onClick={() => tileSliderRef.current?.slideToIndex(105, true)}>Slide to index: 105 (closest)</button>
      </div>
      <div>
        <strong>slideToPage(page: number)</strong>
        <br />
        <button onClick={() => tileSliderRef.current?.slideToPage(0)}>Slide to page 0</button>{' '}
        <button onClick={() => tileSliderRef.current?.slideToPage(3)}>Slide to page 3</button>
      </div>
    </>
  );
};

export const items = makeItems(10);
export const moreItems = makeItems(50);
export const manyItems = makeItems(5000);
