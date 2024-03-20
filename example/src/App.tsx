import React from 'react';
import { CopyBlock, dracula } from 'react-code-blocks';

import { TileSlider, type RenderTile, type RenderControl, type RenderPaginationDots } from '../../src';
import '../../lib/TileSlider.css';

type Tile = {
  title: string;
  image: string;
};

const images = [
  '/image1.jpeg',
  '/image2.jpeg',
  '/image3.jpeg',
  '/image4.jpeg',
  '/image5.jpeg',
  '/image6.jpeg',
  '/image7.jpeg',
  '/image8.jpeg',
  '/image9.jpeg',
  '/image10.jpeg',
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

const renderTile: RenderTile<Tile> = (item, isInView) => (
  <div className={`exampleTile ${!isInView ? 'outOfView' : ''}`}>
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

const renderPaginationDots: RenderPaginationDots = (index, pageIndex) => (
  <span key={pageIndex} className={`dot${index === pageIndex ? ' activeDot' : ''}`}>
    &#9679;
  </span>
);

const App = () => {
  const items: Tile[] = Array.from({ length: 10 }, (_, index) => ({
    title: `Tile ${index}`,
    image: images[index] ?? '',
  }));

  return (
    <div className="example">
      <div className="exampleMargin">
        <header>
          <h1>@videodock/tile-slider</h1>
        </header>
        <h2>Imports</h2>
        <p>
          Start by importing the <code>TileSlider</code> component. Optionally, import the typings and default styling
          as well.</p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} showLineNumbers text={`import { TileSlider } from '@videodock/tile-slider';

// Optional
import type { RenderTile, RenderControl, RenderPaginationDots } from '@videodock/tile-slider';
import '@videodock/tile-slider/lib/TileSlider.css';`} />
        </div>

        <h2>Creating a data set</h2>
        <p>You probably want to connect this to your own data source, but for now, let&apos;s create an example data
          set.</p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} showLineNumbers text={`// define a type for each item
type Tile = {
  title: string;
  image: string;
};

// create an example data set with 10 tiles
const items: Tile[] = Array.from({ length: 10 }, (_, index) => ({
  title: \`Tile \${index}\`,
  image: \`https://cdn.yourimage.api/img/\${index}.jpg\`,
}));`} />
        </div>

        <h2>Render methods</h2>
        <p>The tile slider uses render methods allowing you to customise all visual elements. You most likely want to
          create the `renderTile`, `renderLeftControl` and `renderRightControl` methods.</p>
        <p>These methods can be defined outside the render function. If you do depend on data from state, context or
          props, wrap these methods with `useCallback` for performance reasons</p>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} showLineNumbers text={`const renderTile: RenderTile<Tile> = (item, isInView) => (
  <div className={\`exampleTile \${!isInView ? 'outOfView' : ''}\`}>
    <img src={item.image} alt={item.title} />
  </div>
);

const renderLeftControl: RenderControl = ({ onClick }) => <button className="control" onClick={onClick} aria-label="Previous page">{'<'}</button>;
const renderRightControl: RenderControl = ({ onClick }) => <button className="control" onClick={onClick} aria-label="Next page">{'>'}</button>;`} />
        </div>

        <h2>Default slider</h2>
        <p>The default TileSlider with the basic render method and left/right controls</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            items={items}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} showLineNumbers text={`const Slider = () => {
  return (
    <TileSlider
      items={items}
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `} />
        </div>

        <h2>Basic with custom props</h2>
        <p>A basic example with some changes to the default props.</p>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={4}
            spacing={16}
            cycleMode="restart" // Set the cycle mode
            transitionTime="0.3s" // Decrease the animation time
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} showLineNumbers text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={4}
      spacing={16}
      cycleMode="restart"
      transitionTime="0.3s"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `} />
        </div>
        <h2>Show out of boundary tiles transparent</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider showOutOfView"
            items={items}
            tilesToShow={5}
            spacing={16}
            cycleMode="restart"
            transitionTime="0.3s"
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8, marginBottom: 16 }}>
          <CopyBlock language="css" theme={dracula} showLineNumbers text={`.showOutOfView {
  overflow: visible !important;
}`} />
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} highlight="4" showLineNumbers text={`const Slider = () => {
  return (
    <TileSlider
      className="slider showOutOfView"
      items={items}
      tilesToShow={4}
      spacing={16}
      cycleMode="restart"
      transitionTime="0.3s"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `} />
        </div>
        <h2>Pagination dots</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={5}
            spacing={16}
            cycleMode="restart"
            transitionTime="0.3s"
            showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
            renderPaginationDots={renderPaginationDots}
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            showDots
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} highlight="1-5,20,21" showLineNumbers text={`const renderPaginationDots: RenderPaginationDots = (index, pageIndex) => (
  <span key={pageIndex} className={\`dot\${index === pageIndex ? ' activeDot' : ''}\`}>
    &#9679;
  </span>
);

const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={4}
      spacing={16}
      cycleMode="restart"
      transitionTime="0.3s"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      renderPaginationDots={renderPaginationDots}
      showDots
    />
  );
};
        `} />
        </div>


        <h2>Page step per tile</h2>
        <h3>Example</h3>
        <div className="sliderContainer">
          <TileSlider
            className="slider"
            items={items}
            tilesToShow={5}
            spacing={16}
            cycleMode="restart"
            transitionTime="0.3s"
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
            pageStep="tile"
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} highlight="14" showLineNumbers text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={4}
      spacing={16}
      cycleMode="restart"
      transitionTime="0.3s"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
      pageStep="tile"
    />
  );
};
        `} />
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
            transitionTime="0.6s"
            renderTile={renderTile}
            renderLeftControl={renderLeftControl}
            renderRightControl={renderRightControl}
          />
        </div>
        <h3>Code</h3>
        <div style={{ overflow: 'hidden', borderRadius: 8 }}>
          <CopyBlock language="tsx" theme={dracula} highlight="6,7,9" showLineNumbers text={`const Slider = () => {
  return (
    <TileSlider
      className="slider"
      items={items}
      tilesToShow={1}
      spacing={0}
      cycleMode="restart"
      transitionTime="0.6s"
      showControls={!matchMedia('(hover: none)').matches} // Hide controls on touch devices
      renderTile={renderTile}
      renderLeftControl={renderLeftControl}
      renderRightControl={renderRightControl}
    />
  );
};
        `} />
        </div>

      </div>
    </div>
  );
};

export default App;
