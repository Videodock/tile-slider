import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useEventCallback } from './hooks/useEventCallback';
import { easeInOut, easeOut } from './utils/easing';
import { getCircularIndex } from './utils/math';
import { clx } from './utils/clx';
import { getVelocity, Position, registerMove, TouchMoves } from './utils/drag';

export const CYCLE_MODE_STOP = 'stop';
export const CYCLE_MODE_RESTART = 'restart';
export const CYCLE_MODE_ENDLESS = 'endless';

export const PREFERS_REDUCED_MOTION = !window.matchMedia('(prefers-reduced-motion)').matches;

const DRAG_EDGE_SNAP = 50;

const VELOCITY_SPEED = 30;
const VELOCITY_DAMPING = 500;
const VELOCITY_ACTIVATION_THRESHOLD = 0.3;

const SNAPPING_OVERLAY = 200;
const SNAPPING_DAMPING = 300;

export type Direction = 'left' | 'right';
export type CycleMode = 'stop' | 'restart' | 'endless';
export type RenderTile<T> = (params: {
  item: T;
  itemIndex: number;
  isVisible: boolean;
  index: number;
  slide: (direction: Direction) => void;
}) => React.ReactElement;

export type ControlProps = {
  onClick: () => void;
  disabled: boolean;
};
export type PaginationProps = {
  index: number;
  total: number;
  page: number;
  pages: number;
  slide: (direction: Direction) => void;
  slideToPage: (page: number) => void;
};

export type RenderControl = (props: ControlProps) => React.ReactElement;
export type RenderPagination = (props: PaginationProps) => React.ReactElement;

export type TileSliderProps<T> = {
  items: T[];
  cycleMode?: CycleMode;
  tilesToShow?: number;
  spacing?: number;
  showControls?: boolean;
  animated?: boolean;
  className?: string;
  pageStep?: 'page' | 'tile' | number;
  renderTile: RenderTile<T>;
  renderLeftControl?: RenderControl;
  renderRightControl?: RenderControl;
  renderPagination?: RenderPagination;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideStart?: () => void;
  onSlideEnd?: () => void;
  overscan?: number;
};

export const TileSlider = <T,>({
  items,
  tilesToShow = 6,
  cycleMode = 'endless',
  spacing = 12,
  showControls = true,
  animated = PREFERS_REDUCED_MOTION,
  pageStep = 'page',
  renderTile,
  renderLeftControl,
  renderRightControl,
  renderPagination,
  className,
  onSwipeStart,
  onSwipeEnd,
  onSlideStart,
  onSlideEnd,
  overscan = tilesToShow,
}: TileSliderProps<T>) => {
  const frameRef = useRef<HTMLUListElement>() as React.MutableRefObject<HTMLUListElement>;
  const gesturesRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>;
  const responsiveTileWidth = 100 / tilesToShow;
  const isMultiPage: boolean = items.length > tilesToShow;
  const pages = items.length / tilesToShow;
  const needControls: boolean = showControls && isMultiPage;

  const [state, setState] = useState({ index: 0, hasSlideBefore: false });

  const showLeftControl: boolean = needControls && !(cycleMode === 'stop' && state.index === 0);
  const showRightControl: boolean = needControls && !(cycleMode === 'stop' && state.index === items.length - tilesToShow);
  const leftControlDisabled = (cycleMode === 'stop' && state.index === 0) || !state.hasSlideBefore;
  const rightControlDisabled = cycleMode === 'stop' && state.index === items.length - tilesToShow;

  const dynamicStepCount = pageStep === 'page' ? tilesToShow : 1;
  const stepCount = typeof pageStep === 'number' ? pageStep : dynamicStepCount;

  const leftOverscan = cycleMode === 'stop' ? Math.min(overscan, Math.abs(state.index)) : overscan;
  const rightOverscan = cycleMode === 'stop' ? Math.min(overscan, Math.abs(items.length - state.index - tilesToShow)) : overscan;

  const startIndex = isMultiPage ? state.index - leftOverscan : 0;
  const totalTiles = isMultiPage ? tilesToShow + (leftOverscan + rightOverscan) : items.length;

  const listOffset = isMultiPage ? (state.index - leftOverscan) * responsiveTileWidth : 0;

  const sliderDataRef = useRef({
    origin: { x: 0, y: 0 } as Position,
    moves: [] as TouchMoves,
    scrolling: false,
    position: 0,
    velocity: 0,
    lastRenderedIndex: 0,
  });

  const calculateState = useCallback(() => {
    const tileWidth = frameRef.current.offsetWidth / tilesToShow;
    let index = Math.round((sliderDataRef.current.position / tileWidth) * -1);

    if (!isMultiPage) {
      index = 0;
    }

    if (cycleMode === 'stop') {
      index = Math.max(0, Math.min(items.length - tilesToShow, index));
    }

    return { index, hasSlideBefore: true };
  }, [cycleMode, isMultiPage, items.length, tilesToShow]);

  const getSliderPosition = useEventCallback(() => {
    const transform = getComputedStyle(frameRef.current).transform?.split(', ')[4];

    return transform ? parseInt(transform) : 0;
  });

  const handleSnapping = useEventCallback((index: number, direction?: Direction) => {
    const tileWidth = frameRef.current.offsetWidth / tilesToShow;
    const from = sliderDataRef.current.position;
    const to = -(index * tileWidth);
    const change = to - from;
    const startTime = Date.now();
    const isOvershooting = (change > 0 && direction === 'left') || (change < 0 && direction === 'right');
    const easeFn = isOvershooting ? easeInOut : easeOut;

    if (!animated) {
      frameRef.current.style.transform = `translateX(${-responsiveTileWidth * index}%)`;
      onSlideEnd?.();
      return;
    }

    const snappingDampening = () => {
      const currentTime = Date.now() - startTime;
      const position = easeFn(currentTime, from, change, SNAPPING_DAMPING);

      sliderDataRef.current.position = position;
      frameRef.current.style.transform = `translateX(${position}px)`;

      // interrupt
      if (sliderDataRef.current.scrolling) return;

      if (currentTime <= SNAPPING_DAMPING) {
        requestAnimationFrame(snappingDampening);
      } else {
        frameRef.current.style.transform = `translateX(${-responsiveTileWidth * index}%)`;
        onSlideEnd?.();
      }
    };

    requestAnimationFrame(snappingDampening);
  });

  useEffect(() => {
    frameRef.current.style.transform = `translateX(${-responsiveTileWidth * state.index}%)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsiveTileWidth, tilesToShow]);

  const handleVelocity = useEventCallback(() => {
    const startVelocity = sliderDataRef.current.velocity;
    const changeInVelocity = -startVelocity;
    const startTime = Date.now();
    const direction = startVelocity < 0 ? 'left' : 'right';

    // ignore velocity damping when the velocity is too low or there is only 1 page
    if (Math.abs(changeInVelocity) < VELOCITY_ACTIVATION_THRESHOLD || !isMultiPage) {
      const newState = calculateState();
      sliderDataRef.current.lastRenderedIndex = newState.index;
      setState(newState);
      handleSnapping(newState.index, direction);
      return;
    }

    const velocityDampening = () => {
      const currentTime = Date.now() - startTime;
      const velocity = easeOut(currentTime, startVelocity, changeInVelocity, VELOCITY_DAMPING);
      const newState = calculateState();

      // interrupt
      if (sliderDataRef.current.scrolling) return;

      sliderDataRef.current.position += VELOCITY_SPEED * velocity;
      frameRef.current.style.transform = `translateX(${sliderDataRef.current.position}px)`;

      if (currentTime < VELOCITY_DAMPING - SNAPPING_OVERLAY) {
        requestAnimationFrame(velocityDampening);
      } else {
        handleSnapping(newState.index, direction);
      }

      if (sliderDataRef.current.lastRenderedIndex !== newState.index) {
        sliderDataRef.current.lastRenderedIndex = newState.index;
        setState(newState);
      }
    };

    requestAnimationFrame(velocityDampening);
  });

  const slideToIndex = useCallback(
    (index: number) => {
      const newState = calculateState();
      setState((state) => ({ ...newState, index }));
      onSlideStart?.();
      handleSnapping(index);
    },
    [calculateState, handleSnapping, onSlideStart],
  );

  const slideToPage = useCallback(
    (page: number) => {
      const pageTileIndex = page * stepCount;
      const delta = getCircularIndex(pageTileIndex, items.length) - getCircularIndex(state.index, items.length);

      const index = state.index + delta;

      slideToIndex(index);
    },
    [items.length, slideToIndex, state.index, stepCount],
  );

  const slide = useCallback(
    (direction: Direction) => {
      const directionFactor = direction === 'right' ? 1 : -1;

      slideToIndex(state.index + stepCount * directionFactor);
    },
    [slideToIndex, state.index, stepCount],
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent): void => {
      sliderDataRef.current.origin = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      sliderDataRef.current.velocity = 0; // reset the velocity
      sliderDataRef.current.moves = registerMove(sliderDataRef.current.moves, sliderDataRef.current.origin);
      sliderDataRef.current.position = getSliderPosition();

      onSwipeStart?.();
      onSlideStart?.();
    },
    [getSliderPosition, onSlideStart, onSwipeStart],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const newPosition = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
      const { origin, scrolling } = sliderDataRef.current;
      sliderDataRef.current.moves = registerMove(sliderDataRef.current.moves, newPosition);

      let delta: number = newPosition.x - origin.x;
      const movementX: number = Math.abs(newPosition.x - origin.x);
      const movementY: number = Math.abs(newPosition.y - origin.y);

      if ((movementX > movementY && movementX > 10) || scrolling) {
        event.preventDefault();
        event.stopPropagation();

        // only call this callback once
        if (!scrolling) sliderDataRef.current.scrolling = true;

        // snap to edges when there is nothing to scroll
        if (!isMultiPage) delta = Math.max(-DRAG_EDGE_SNAP, Math.min(DRAG_EDGE_SNAP, delta));

        // instead of absolute positioning, we could do `calc(${relativePosition}% + ${delta}px)`
        frameRef.current.style.transform = `translateX(${sliderDataRef.current.position + delta}px)`;
      }
    },
    [isMultiPage],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      const newPosition = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };

      sliderDataRef.current.moves = registerMove(sliderDataRef.current.moves, newPosition);

      const { origin, moves } = sliderDataRef.current;

      // relative movement (velocity)
      const velocity = getVelocity(moves);

      // total movement
      let delta = newPosition.x - origin.x;
      const movementX = Math.abs(newPosition.x - origin.x);
      const movementY = Math.abs(newPosition.y - origin.y);

      if (!isMultiPage) delta = Math.max(-DRAG_EDGE_SNAP, Math.min(DRAG_EDGE_SNAP, delta));

      sliderDataRef.current.position += delta;
      sliderDataRef.current.velocity = 0;

      // we slide when either the movement was larger than 100px or the velocity greater than 0.2
      if (Math.abs(velocity) > 0.1 && movementX > movementY && animated) {
        sliderDataRef.current.velocity = velocity;
      }

      sliderDataRef.current.scrolling = false;
      handleVelocity();
      onSwipeEnd?.();
    },
    [animated, handleVelocity, isMultiPage, onSwipeEnd],
  );

  useEffect(() => {
    const gesturesElement = gesturesRef.current;

    gesturesElement.addEventListener('touchstart', handleTouchStart);
    gesturesElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gesturesElement.addEventListener('touchend', handleTouchEnd);
    gesturesElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      gesturesElement.removeEventListener('touchstart', handleTouchStart);
      gesturesElement.removeEventListener('touchmove', handleTouchMove);
      gesturesElement.removeEventListener('touchend', handleTouchEnd);
      gesturesElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart]);

  const renderTileContainer = (index: number) => {
    const itemIndex = getCircularIndex(index, items.length);
    const isVisible = index >= state.index && index < state.index + tilesToShow;

    return (
      <li style={{ width: `${responsiveTileWidth}%`, paddingLeft: spacing / 2, paddingRight: spacing / 2 }} key={index}>
        {renderTile({ item: items[itemIndex], itemIndex, isVisible, index, slide })}
      </li>
    );
  };

  const renderTiles = () => {
    return Array.from({ length: totalTiles }, (_, index) => renderTileContainer(startIndex + index));
  };

  const page = Math.floor(getCircularIndex(state.index, items.length) / tilesToShow);

  return (
    <div className={clx('TileSlider', className)}>
      {showLeftControl && !!renderLeftControl && (
        <div className="TileSlider-leftControl">
          {renderLeftControl({
            onClick: () => slide('left'),
            disabled: leftControlDisabled,
          })}
        </div>
      )}
      <div className="TileSlider-gestures" style={{ marginLeft: -(spacing / 2), marginRight: -(spacing / 2) }} ref={gesturesRef}>
        <ul className="TileSlider-list" ref={frameRef} style={{ left: `calc(${listOffset}%)` }}>
          {renderTiles()}
        </ul>
      </div>
      {showRightControl && !!renderRightControl && (
        <div className="TileSlider-rightControl">
          {renderRightControl({
            onClick: () => slide('right'),
            disabled: rightControlDisabled,
          })}
        </div>
      )}
      {renderPagination?.({ index: state.index, total: items.length, page, pages, slide, slideToPage })}
    </div>
  );
};
