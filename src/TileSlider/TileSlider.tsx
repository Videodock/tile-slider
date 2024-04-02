import React, { useCallback, useEffect, useRef, useState } from 'react';

import { clx } from './utils';

export const CYCLE_MODE_STOP = 'stop';
export const CYCLE_MODE_RESTART = 'restart';
export const CYCLE_MODE_ENDLESS = 'endless';

export const PREFERS_REDUCED_MOTION = !window.matchMedia('(prefers-reduced-motion)').matches;

export type CycleMode = 'stop' | 'restart' | 'endless';
export type RenderTile<T> = (
  item: T,
  isInView: boolean,
  listIndex: number,
  renderKey: string,
  slide?: (direction: Direction) => void,
) => React.ReactElement;
export type RenderControl = (props: ControlProps) => React.ReactElement;
export type RenderPaginationDots = (index: number, pageIndex: number) => React.ReactElement;

export type ControlProps = {
  onClick: () => void;
  disabled: boolean;
};

type Direction = 'left' | 'right';
type Position = { x: number; y: number };

export type TileSliderProps<T> = {
  items: T[];
  cycleMode?: CycleMode;
  tilesToShow?: number;
  spacing?: number;
  showControls?: boolean;
  showDots?: boolean;
  animated?: boolean;
  wrapWithEmptyTiles?: boolean;
  transitionTime?: string;
  transitionTimingFunction?: string;
  className?: string;
  pageStep?: 'page' | 'tile';
  renderTile: RenderTile<T>;
  renderLeftControl?: RenderControl;
  renderRightControl?: RenderControl;
  renderPaginationDots?: RenderPaginationDots;
  renderAriaLabel?: (item: T, index: number, key: string, total: number) => string;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideEnd?: () => void;
  overscan?: number;
  throttleOnTransition?: boolean;
};

const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;

const TileSlider = <T, > ({
  items,
  tilesToShow = 6,
  cycleMode = 'endless',
  spacing = 12,
  showControls = true,
  animated = PREFERS_REDUCED_MOTION,
  transitionTime = '0.6s',
  transitionTimingFunction = 'cubic-bezier(0.39, 0.06, 0.29, 0.96)',
  wrapWithEmptyTiles = false,
  showDots = false,
  pageStep = 'page',
  renderTile,
  renderLeftControl,
  renderRightControl,
  renderPaginationDots,
  renderAriaLabel,
  className,
  onSwipeStart,
  onSwipeEnd,
  onSlideEnd,
  overscan = tilesToShow,
  throttleOnTransition = true,
}: TileSliderProps<T>) => {
  const frameRef = useRef<HTMLUListElement>() as React.MutableRefObject<HTMLUListElement>;
  const tileWidth: number = 100 / tilesToShow;
  const isMultiPage: boolean = items?.length > tilesToShow;
  const leftOffset: number = isMultiPage ? 100 - tileWidth * tilesToShow + -100 : wrapWithEmptyTiles ? -100 : 0;
  const pages = items.length / tilesToShow;
  const transitionBasis: string = isMultiPage && animated ? `transform ${transitionTime} ${transitionTimingFunction}` : '';
  const needControls: boolean = showControls && isMultiPage;
  const pageStepCompensation = pageStep === 'tile' ? 0 : 2;
  const renderAmount = isMultiPage ? tilesToShow + overscan * 2 + pageStepCompensation : tilesToShow;

  const [state, setState] = useState({
    index: 0,
    slideToIndex: 0,
    transform: 0,
    transition: transitionBasis,
    animationRunning: false,
    hasSlideBefore: false,
    isDragging: false,
  });

  const showLeftControl: boolean = needControls && !(cycleMode === 'stop' && state.index === 0);
  const showRightControl: boolean = needControls && !(cycleMode === 'stop' && state.index === items.length - tilesToShow);

  /**
   * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
   */
  const slide = useCallback(
    (direction: Direction, slideAmount: number = 1): boolean => {
      if (throttleOnTransition && state.animationRunning) return false;

      const directionFactor = direction === 'right' ? 1 : -1;
      const stepCount = pageStep === 'page' ? tilesToShow : Math.max(slideAmount, 1);

      let nextIndex: number = state.index + stepCount * directionFactor;

      if (nextIndex < 0) {
        if (cycleMode === 'stop') nextIndex = 0;
        if (cycleMode === 'restart') nextIndex = state.index === 0 ? 0 - stepCount : 0;
      }

      if (nextIndex > items.length - stepCount) {
        if (cycleMode === 'stop') nextIndex = items.length - stepCount;
        if (cycleMode === 'restart') nextIndex = state.index >= items.length - stepCount ? items.length : items.length - stepCount;
      }

      const steps: number = Math.abs(state.index - nextIndex);
      const movement: number = steps * tileWidth * (0 - directionFactor);

      setState((state) => ({
        ...state,
        slideToIndex: nextIndex,
        transform: movement,
        transition: transitionBasis,
        animationRunning: true,
        slideBefore: true,
      }));

      if (!animated && frameRef.current) {
        const event = new TransitionEvent('transitionend', { bubbles: true });

        setTimeout(() => frameRef.current.dispatchEvent(event), 0);
      }

      return true;
    },
    [
      throttleOnTransition,
      state.animationRunning,
      state.index,
      pageStep,
      tilesToShow,
      items.length,
      tileWidth,
      animated,
      cycleMode,
      transitionBasis,
    ],
  );

  const touchDataRef = useRef({
    origin: { x: 0, y: 0 },
    moves: [] as { x: number; y: number; ts: number; }[],
    scrolling: false,
  });

  const handleTouchStart = useCallback(
    (event: TouchEvent): void => {
      touchDataRef.current.origin = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      touchDataRef.current.moves = [{ ...touchDataRef.current.origin, ts: Date.now() }];
    },
    [],
  );

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const newPosition: Position = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
    const { origin, scrolling } = touchDataRef.current;
    touchDataRef.current.moves.unshift({ ...newPosition, ts: Date.now() });
    touchDataRef.current.moves = touchDataRef.current.moves
    .filter(move => Date.now() - move.ts < 500);

    const delta: number = newPosition.x - origin.x;
    const movementX: number = Math.abs(newPosition.x - origin.x);
    const movementY: number = Math.abs(newPosition.y - origin.y);

    // debounce drag when the animation is running
    if (state.animationRunning) {
      return;
    }

    if ((movementX > movementY && movementX > 10) || scrolling) {
      event.preventDefault();
      event.stopPropagation();

      // only call this callback once
      if (!scrolling) {
        touchDataRef.current.scrolling = true;

        onSwipeStart?.();
        setState(state => ({
          ...state,
          isDragging: true,
          animationRunning: false,
          slideToIndex: state.index,
          transform: 0,
          transition: 'none',
        }));
      }

      // move frame
      frameRef.current.style.transform = `translateX(${delta}px)`;
    }
  }, [onSwipeStart, state.animationRunning]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const newPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
    touchDataRef.current.moves.unshift({ ...newPosition, ts: Date.now() });
    touchDataRef.current.moves = touchDataRef.current.moves
    .filter(move => Date.now() - move.ts < 500);

    const { origin, moves } = touchDataRef.current;

    // relative movement (velocity)
    const distance = Math.abs(moves[0].x - moves[moves.length - 1].x);
    const time = moves[0].ts - moves[moves.length - 1].ts;
    const velocity = distance / time;

    // total movement
    const movementX: number = Math.abs(newPosition.x - origin.x);
    const movementY: number = Math.abs(newPosition.y - origin.y);
    const direction: Direction = newPosition.x < origin.x ? 'right' : 'left';

    // tiles moved
    const tileWidth = frameRef.current.offsetWidth / tilesToShow;
    const tilesMoved = Math.ceil(movementX / tileWidth);

    // we slide when either the movement was larger than 100px or the velocity greater than 0.2
    if ((movementX > 100 || velocity > 0.2) && movementX > movementY) {
      slide(direction, tilesMoved);
    } else {
      // reset the drag movement with an animation
      setState(state => ({ ...state, transform: 0, transition: `transform 0.1s ${transitionTimingFunction}` }));
      frameRef.current.style.transform = `translateX(0px)`;
    }

    touchDataRef.current.scrolling = false;
    setState(state => ({ ...state, isDragging: false }));
    if (onSwipeEnd) onSwipeEnd();
  }, [onSwipeEnd, slide, tilesToShow, transitionTimingFunction]);

  // Run code after the slide animation to set the new index
  const postAnimationCleanup = (): void => {
    let resetIndex: number = state.slideToIndex;

    if (cycleMode !== CYCLE_MODE_ENDLESS) {
      resetIndex = resetIndex >= items.length ? state.slideToIndex - items.length : resetIndex;
      resetIndex = resetIndex < 0 ? items.length + state.slideToIndex : resetIndex;

      if (resetIndex !== state.slideToIndex) {
        setState((state) => ({
          ...state,
          slideToIndex: resetIndex,
        }));
      }
    }

    setState((state) => ({
      ...state,
      index: resetIndex,
      transform: 0,
      transition: 'none',
      animationRunning: false,
      slideBefore: true,
    }));

    onSlideEnd && onSlideEnd();
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLUListElement>) => {
    if (event.target === frameRef.current) {
      postAnimationCleanup();
    }
  };

  useEffect(() => {
    const frame = frameRef.current;

    frame.addEventListener('touchstart', handleTouchStart);
    frame.addEventListener('touchmove', handleTouchMove, { passive: false });
    frame.addEventListener('touchend', handleTouchEnd);
    frame.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      frame.removeEventListener('touchstart', handleTouchStart);
      frame.removeEventListener('touchmove', handleTouchMove);
      frame.removeEventListener('touchend', handleTouchEnd);
      frame.removeEventListener('touchcancel', handleTouchEnd);
    }

  }, [handleTouchEnd, handleTouchMove, handleTouchStart]);

  const ulStyle = {
    transform: `translateX(${state.transform}%)`,
    // prettier-ignore
    'WebkitTransform': `translateX(${state.transform}%)`,
    left: `calc(${leftOffset}% - ${spacing}px)`,
    position: 'relative',
    width: `calc(100% + ${spacing}px)`,
    transition: state.transition,
    marginLeft: -spacing / 2,
    marginRight: -spacing / 2,
    willChange: 'transform',
  } as React.CSSProperties;

  const leftControlDisabled = (cycleMode === 'stop' && state.index === 0) || !state.hasSlideBefore;
  const rightControlDisabled = cycleMode === 'stop' && state.index === items.length - tilesToShow;

  const paginationDots = () => {
    if (showDots && isMultiPage && !!renderPaginationDots) {
      const length = pages;

      return (
        <div className="TileSlider-dots">
          {Array.from({ length }, (_, pageIndex) => {
            return renderPaginationDots(state.index / tilesToShow, pageIndex);
          })}
        </div>
      );
    }
  };

  const renderSinglePageTiles = () =>
    items.map((item, index) => {
      const key = `tile_${index}`;

      return (
        <li
          className="TileSlider-tile"
          key={key}
          aria-label={renderAriaLabel?.(item, index, key, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2,
          }}
        >
          {renderTile(item, true, index, key, undefined)}
        </li>
      );
    });

  const renderMultiPageTiles = () => {
    const tiles = [];
    const end = renderAmount + state.index;
    const firstInView = state.slideToIndex + overscan;
    const lastInView = overscan * 2 + state.slideToIndex;

    for (let renderIndex = state.index; renderIndex < end; renderIndex++) {
      const isInView = (renderIndex >= firstInView && renderIndex < lastInView) || state.animationRunning || state.isDragging;
      // To render the item in the correct order, we need an index that reflects the first item that is visible in the viewport relative to the current renderIndex.
      const indexWithoutOverscan = renderIndex - overscan;

      const indexOfItem = getCircularIndex(indexWithoutOverscan, items.length);

      const item = items[indexOfItem];
      const key = `tile_${indexWithoutOverscan}`;

      tiles.push(
        <li
          className="TileSlider-tile"
          key={key}
          aria-label={renderAriaLabel?.(item, indexOfItem, key, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2,
            transition: !isInView ? `opacity .6s ease-in ${transitionTime}` : '',
          }}
        >
          {renderTile(item, isInView, indexWithoutOverscan, key, slide)}
        </li>,
      );
    }

    return tiles;
  };

  return (
    <div className={clx('TileSlider-root', className)}>
      {showLeftControl && !!renderLeftControl && (
        <div className="TileSlider-leftControl">
          {renderLeftControl({
            onClick: () => slide('left'),
            disabled: leftControlDisabled,
          })}
        </div>
      )}
      <ul
        ref={frameRef}
        className="TileSlider-container"
        style={ulStyle}
        onTransitionEnd={handleTransitionEnd}
      >
        {wrapWithEmptyTiles ? (
          <li
            className="TileSlider-emptyTile"
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2,
            }}
          />
        ) : null}
        {isMultiPage ? renderMultiPageTiles() : renderSinglePageTiles()}
        {wrapWithEmptyTiles ? (
          <li
            className="TileSlider-emptyTile"
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2,
            }}
          />
        ) : null}
      </ul>
      {showRightControl && !!renderRightControl && (
        <div className="TileSlider-rightControl">
          {renderRightControl({
            onClick: () => slide('right'),
            disabled: rightControlDisabled,
          })}
        </div>
      )}
      {paginationDots()}
    </div>
  );
};

export { TileSlider };
