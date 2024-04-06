import React from 'react';
import { CopyBlock, dracula } from 'react-code-blocks';

import { easing, math, type RenderControl, type RenderPagination, type RenderTile, TileSlider, useResponsiveSize } from '../../src';
import '../../src/style.css';

type Tile = {
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

const IconLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
  </svg>
);

const IconRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
  </svg>
);

const renderTile: RenderTile<Tile> = ({ item, isVisible }) => (
  <div className={`exampleTile ${!isVisible ? 'outOfView' : ''}`}>
    <img src={item.image} alt={item.title} />
  </div>
);

const renderLeftControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick}>
    <IconLeft />
  </button>
);

const renderRightControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick}>
    <IconRight />
  </button>
);

const renderPagination: RenderPagination = (props) => {
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

const makeItems = (length: number): Tile[] =>
  Array.from({ length }, (_, index) => {
    const imageIndex = math.getCircularIndex(index, 10); // we only have 10 images :)

    return {
      title: `Tile ${index}`,
      image: images[imageIndex] ? `${import.meta.env.BASE_URL}${images[math.getCircularIndex(imageIndex, 10)]}` : '',
    };
  });

const items = makeItems(10);
const manyItems = makeItems(5000);

const App = () => {
  const smallScreen = window.matchMedia('screen and (max-width: 640px)').matches;
  const [tilesToShow] = useResponsiveSize([{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }]);

  return (
    <div className="example">
      <div className="exampleMargin">
        <header>
          <h1>@videodock/tile-slider</h1>
        </header>
        <p>
          @videodock/tile-slider is a React component of a performant and accessible slider for your React project. It only renders the
          visible tiles, meaning that you can have thousands of items and still get a good performing site and animation.
        </p>
        <p>It only needs React... no other dependencies needed!</p>
        <h2>Imports</h2>
        <p>
          Start by importing the <code>TileSlider</code> component. Optionally, import the typings and default styling as well.
        </p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            text={`import { TileSlider } from '@videodock/tile-slider';

// Optional
import type { RenderTile, RenderControl, RenderPagination } from '@videodock/tile-slider';
import '@videodock/tile-slider/lib/style.css';`}
          />
        </div>

        <h2>Creating a data set</h2>
        <p>You probably want to connect this to your own data source, but for now, let&apos;s create an example data set.</p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            text={`// define a type for each item
type Tile = {
  title: string;
  image: string;
};

// create an example data set with 10 tiles
const items: Tile[] = Array.from({ length: 10 }, (_, index) => ({
  title: \`Tile \${index}\`,
  image: \`https://cdn.yourimage.api/img/\${index}.jpg\`,
}));`}
          />
        </div>

        <h2>Render methods</h2>
        <p>
          The tile slider uses render methods allowing you to customise all visual elements. You most likely want to create the
          `renderTile`, `renderLeftControl` and `renderRightControl` methods.
        </p>
        <p>
          These methods can be defined outside the render function. If you do depend on data from state, context or props, wrap these
          methods with `useCallback` for performance reasons
        </p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            text={`const renderTile: RenderTile<Tile> = ({ item, isVisible }) => (
  <div className={\`exampleTile \${!isVisible ? 'outOfView' : ''}\`}>
    <img src={item.image} alt={item.title} />
  </div>
);

const renderLeftControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick} aria-label="Previous page">{'<'}</button>
);
const renderRightControl: RenderControl = ({ onClick }) => (
  <button className="control" onClick={onClick} aria-label="Next page">{'>'}</button>
);`}
          />
        </div>

        <h2>Default slider</h2>
        <p>The default TileSlider with the basic render method and left/right controls</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={items}
            tilesToShow={smallScreen ? 2 : 6}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            text={`const Slider = () => {
  // dynamic page size based on screen size
  const smallScreen = window.matchMedia('screen and (max-width: 640px)').matches;
  
  return (
    <TileSlider
      items={items}
      tilesToShow={smallScreen ? 2 : 6}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `}
          />
        </div>

        <h2>Many many slides</h2>
        <p>This slider has 5000 items and still should have great performance!</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={manyItems}
            tilesToShow={smallScreen ? 2 : 6}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="4"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      items={manyItems}
      tilesToShow={smallScreen ? 2 : 6}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};`}
          />
        </div>

        <h2>Responsive slider</h2>
        <p>The `useResponsiveSize` hook can be used to create the tilesToShow based on predefined breakpoints.</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={items}
            tilesToShow={tilesToShow}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            highlight="2,7"
            text={`const Slider = () => {
  const [tilesToShow] = useResponsiveSize([{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }]);
  
  return (
    <TileSlider
      items={items}
      tilesToShow={tilesToShow}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `}
          />
        </div>

        <h2>Basic with custom props</h2>
        <p>A basic example with some changes to the default props.</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={smallScreen ? 2 : 4}
            spacing={16}
            cycleMode="restart" // Set the cycle mode
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={4}
      spacing={16}
      cycleMode="restart"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `}
          />
        </div>
        <h2>Show out of boundary tiles transparent</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider showOutOfView"
            items={items}
            tilesToShow={smallScreen ? 2 : 5}
            spacing={16}
            cycleMode="restart"
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8, marginBottom: 16 }}>
          <CopyBlock
            language="css"
            theme={dracula}
            showLineNumbers
            text={`.showOutOfView {
  overflow: visible !important;
}`}
          />
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="4"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      className="slider showOutOfView"
      items={items}
      tilesToShow={5}
      spacing={16}
      cycleMode="restart"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `}
          />
        </div>

        <h2>Pagination dots</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={smallScreen ? 2 : 5}
            spacing={16}
            cycleMode="restart"
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderPagination={renderPagination}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8, marginBottom: 16 }}>
          <CopyBlock
            language="css"
            theme={dracula}
            showLineNumbers
            text={`.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 5px;
  border-radius: 50%;
  transition: all 200ms ease;
}

.activeDot {
  color: gray;
}`}
          />
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="1-11,25"
            showLineNumbers
            text={`const renderPagination: RenderPagination = ({ slideToPage, pages, page }) => {
  return (
    <ul className="paginationDots">
      {Array.from({ length: pages }, (_, pageIndex) => pageIndex).map((currentPage) => (
        <li key={page} className={page === currentPage ? 'activeDot' : ''} onClick={() => slideToPage(currentPage)}>
          &#9679;
        </li>
      ))}
    </ul>
  );
};

const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={5}
      spacing={16}
      cycleMode="restart"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      renderPagination={renderPagination}
    />
  );
};
        `}
          />
        </div>

        <h2>Page step per tile</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={smallScreen ? 2 : 5}
            spacing={16}
            cycleMode="restart"
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            pageStep="tile"
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="13"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={5}
      spacing={16}
      cycleMode="restart"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      pageStep="tile"
    />
  );
};
        `}
          />
        </div>

        <h2>Custom page step</h2>
        <p>
          You can use a number for the page step. You probably want to align this with the `overscan` prop to prevent scrolling to empty
          space. The `overscan` prop controls how many tiles are rendered outside the viewport.
        </p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={smallScreen ? 2 : 5}
            spacing={16}
            cycleMode="restart"
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            overscan={6}
            pageStep={6}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="13,14"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={5}
      spacing={16}
      cycleMode="restart"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      overscan={6}
      pageStep={6}
    />
  );
};
        `}
          />
        </div>

        <h2>Single tile</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={1}
            spacing={0}
            cycleMode="restart"
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="6,7,8"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={1}
      spacing={0}
      cycleMode="restart"
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `}
          />
        </div>

        <h2>Different transition function</h2>
        <p>A custom slide animation function can be provided to the animationFn prop. This animation is not used when dragging.</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={items}
            tilesToShow={smallScreen ? 2 : 6}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            animationFn={easing.easeInOut}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="1,11"
            showLineNumbers
            text={`import { easing } from '@videodock/tile-slider';

const Slider = () => {
  return (
    <TileSlider
      items={items}
      tilesToShow={4}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      animationFn={easing.easeInOut}
    />
  );
};
        `}
          />
        </div>

        <h2>Disabled animations</h2>
        <p>
          Animations are disabled by default when the browser is configured for reduced motions (a11y). You can override this or always
          disable animations via the `animated` prop.
        </p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={items}
            tilesToShow={smallScreen ? 2 : 6}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            animated={false}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock
            language="tsx"
            theme={dracula}
            highlight="9"
            showLineNumbers
            text={`const Slider = () => {
  return (
    <TileSlider
      items={items}
      tilesToShow={4}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      animated={false}
    />
  );
};
        `}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
