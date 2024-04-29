import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useEventCallback } from './hooks/useEventCallback';
import { AnimationFn, easeOut, easeOutQuartic } from './utils/easing';
import { getCircularIndex } from './utils/math';
import { clx } from './utils/clx';
import { getVelocity, Position, registerMove, TouchMoves } from './utils/drag';

export const CYCLE_MODE_STOP = 'stop';
export const CYCLE_MODE_RESTART = 'restart';
export const CYCLE_MODE_ENDLESS = 'endless';

export const PREFERS_REDUCED_MOTION = typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion)').matches : false;

const DRAG_EDGE_SNAP = 50;
const SLIDE_SNAPPING_DAMPING = 500;
const DRAG_SNAPPING_DAMPING = 1500;

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
  itemIndex: number;
  total: number;
  page: number;
  pages: number;
  slide: (direction: Direction) => void;
  slideToIndex: (index: number) => void;
  slideToPage: (page: number) => void;
};
export type CallbackProps = Omit<PaginationProps, 'slide' | 'slideToIndex' | 'slideToPage'>;

export type RenderControl = (props: ControlProps) => React.ReactElement;
export type RenderPagination = (props: PaginationProps) => React.ReactElement;

export type TileSliderProps<T> = {
  items: T[];
  sliderRef?: React.ForwardedRef<TileSliderRef>;
  cycleMode?: CycleMode;
  tilesToShow?: number;
  spacing?: number;
  showControls?: boolean;
  animated?: boolean;
  animationFn?: typeof easeOut;
  className?: string;
  pageStep?: 'page' | 'tile' | number;
  renderTile: RenderTile<T>;
  renderLeftControl?: RenderControl;
  renderRightControl?: RenderControl;
  renderPagination?: RenderPagination;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideStart?: (props: CallbackProps) => void;
  onSlideEnd?: (props: CallbackProps) => void;
  overscan?: number;
};

export type TileSliderRef = {
  slide: (direction: Direction) => void;
  slideToIndex: (index: number, closest?: boolean) => void;
  slideToPage: (page: number) => void;
};

export const TileSlider = <T,>({
  items,
  sliderRef,
  tilesToShow = 6,
  cycleMode = 'endless',
  spacing = 12,
  showControls = true,
  animated = PREFERS_REDUCED_MOTION,
  animationFn = easeOut,
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
  const pages = Math.ceil(items.length / tilesToShow);
  const needControls: boolean = showControls && isMultiPage;

  const [state, setState] = useState({
    index: 0,
    fromIndex: 0,
    toIndex: 0,
    sliding: false,
    page: 0,
    hasSlideBefore: false,
  });

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
  const stableAnimationFn = useEventCallback(animationFn);

  const sliderDataRef = useRef({
    origin: { x: 0, y: 0 } as Position,
    moves: [] as TouchMoves,
    scrolling: false,
    cancelled: false,
    position: 0,
    velocity: 0,
    lastRenderedIndex: 0,
    animationId: 0,
    frameWidth: 0,
  });

  const calculateIndex = useCallback(() => {
    const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;
    let index = Math.round((sliderDataRef.current.position / tileWidth) * -1);

    if (!isMultiPage) {
      index = 0;
    }

    if (cycleMode === 'stop') {
      index = Math.max(0, Math.min(items.length - tilesToShow, index));
    }

    return index;
  }, [cycleMode, isMultiPage, items.length, tilesToShow]);

  const getSliderPosition = useEventCallback(() => {
    const transform = frameRef.current ? getComputedStyle(frameRef.current).transform?.split(', ')[4] : '0';

    return transform ? parseInt(transform) : 0;
  });

  const handleResize = useEventCallback(() => {
    cancelAnimationFrame(sliderDataRef.current.animationId);
    if (frameRef.current) {
      sliderDataRef.current.frameWidth = parseFloat(getComputedStyle(frameRef.current).width);
      frameRef.current.style.transform = `translateX(${-responsiveTileWidth * state.index}%)`;
    }
  });

  const handleSnapping = useEventCallback((index: number, animationFn: AnimationFn, duration = SLIDE_SNAPPING_DAMPING) => {
    const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;
    const from = getSliderPosition();
    const relativeToPosition = -responsiveTileWidth * index;
    const to = -(index * tileWidth);
    const change = to - from;
    const startTime = Date.now();
    const page = Math.floor(getCircularIndex(index, items.length) / tilesToShow);

    if (!animated) {
      setState((state) => ({ ...state, index, page, hasSlideBefore: true, sliding: false }));
      frameRef.current.style.transform = `translateX(${relativeToPosition}%)`;
      onSlideEnd?.({
        index: index,
        itemIndex: getCircularIndex(index, items.length),
        total: items.length,
        page,
        pages,
      });
      return;
    }

    cancelAnimationFrame(sliderDataRef.current.animationId);
    setState((state) => ({ ...state, toIndex: index, fromIndex: state.index, sliding: true }));

    const snappingDampening = () => {
      // interrupt
      if (!frameRef.current || sliderDataRef.current.scrolling) return;

      const currentTime = Date.now() - startTime;
      const position = animationFn(currentTime, from, change, duration);
      const currentIndex = calculateIndex();

      sliderDataRef.current.position = position;
      frameRef.current.style.transform = `translateX(${position}px)`;

      if (currentTime <= duration) {
        sliderDataRef.current.animationId = requestAnimationFrame(snappingDampening);
      } else {
        frameRef.current.style.transform = `translateX(${relativeToPosition}%)`;
        onSlideEnd?.({
          index: currentIndex,
          itemIndex: getCircularIndex(currentIndex, items.length),
          total: items.length,
          page,
          pages,
        });
        setState((state) => ({
          ...state,
          index,
          page,
          sliding: false,
        }));
      }

      if (sliderDataRef.current.lastRenderedIndex !== currentIndex) {
        sliderDataRef.current.lastRenderedIndex = currentIndex;
        setState((state) => ({ ...state, index: currentIndex, page }));
      }
    };

    requestAnimationFrame(snappingDampening);
  });

  // this effect resets the position when the tilesToShow changes
  useEffect(() => {
    handleResize();
  }, [handleResize, responsiveTileWidth, tilesToShow]);

  const handleVelocity = useEventCallback(() => {
    const startVelocity = sliderDataRef.current.velocity * 16;

    // snap back to the current tile when the velocity is near zero
    if (Math.abs(startVelocity) < 1) {
      return handleSnapping(calculateIndex(), easeOutQuartic, 500);
    }

    // Swipe to prev/next (consider a velocity between -8 and 8 to be a swipe)
    // A velocity of 8 is little more than a gentle swipe
    if (Math.abs(startVelocity) < 8) {
      return handleSnapping(calculateIndex() + (startVelocity > 0 ? -1 : 1), easeOutQuartic, SLIDE_SNAPPING_DAMPING);
    }

    // animation duration based on the velocity
    const startTime = Date.now();
    const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;
    const extraDuration = Math.pow(Math.abs(startVelocity), 2) / 3.5;
    const totalDuration = DRAG_SNAPPING_DAMPING + extraDuration;

    let finished = false;
    let snappingStartTime = -1;
    let snappingDuration = 0;
    let snappingStartPosition = 0;
    let snappingTargetPosition = 0;

    cancelAnimationFrame(sliderDataRef.current.animationId);
    setState((state) => ({ ...state, fromIndex: state.index, sliding: true }));

    const velocityDampening = () => {
      // interrupted by a touch gesture or the slider was unmounted
      if (!frameRef.current || sliderDataRef.current.scrolling) return;

      const currentTime = Date.now() - startTime;
      const currentIndex = calculateIndex();
      const page = Math.floor(getCircularIndex(currentIndex, items.length) / tilesToShow);
      const velocity = easeOutQuartic(currentTime, startVelocity, -startVelocity, totalDuration);

      // total duration of the snap animation from the startTime
      const totalDurationSnap = snappingStartTime + snappingDuration - startTime;

      // handle snapping to the precalculated tile index
      if (snappingStartTime !== -1) {
        const snappingProgress = Date.now() - snappingStartTime;

        sliderDataRef.current.position = easeOut(
          snappingProgress,
          snappingStartPosition,
          snappingTargetPosition - snappingStartPosition,
          snappingDuration,
        );

        if (snappingProgress >= snappingDuration) {
          finished = true;
        }
      } else {
        sliderDataRef.current.position += velocity;
      }

      // calculate the snapping values when the velocity drops below 10
      // this ensures that we have a consistent speed to blend the snapping animation
      if (Math.abs(velocity) <= 10 && snappingStartTime === -1) {
        snappingStartTime = Date.now();

        const targetIndexFloat = -(sliderDataRef.current.position / tileWidth);
        const targetBuffer = 0.35;
        const targetIndex = velocity > 0 ? Math.floor(targetIndexFloat - targetBuffer) : Math.ceil(targetIndexFloat + targetBuffer);
        snappingTargetPosition = -(targetIndex * tileWidth);
        snappingStartPosition = sliderDataRef.current.position;

        // this multiplier aligns pretty well maintaining the same velocity
        snappingDuration = Math.min(2000, Math.abs(snappingTargetPosition - sliderDataRef.current.position) * 5);
      }

      // apply the position
      frameRef.current.style.transform = `translateX(${sliderDataRef.current.position}px)`;

      if (currentTime >= Math.max(totalDuration, totalDurationSnap)) {
        finished = true;
      }

      if (!finished) {
        sliderDataRef.current.animationId = requestAnimationFrame(velocityDampening);
      } else {
        frameRef.current.style.transform = `translateX(${-responsiveTileWidth * currentIndex}%)`;
        onSlideEnd?.({
          index: currentIndex,
          itemIndex: getCircularIndex(currentIndex, items.length),
          total: items.length,
          page,
          pages,
        });
        setState((state) => ({
          ...state,
          index: currentIndex,
          page,
          sliding: false,
        }));
      }

      if (sliderDataRef.current.lastRenderedIndex !== currentIndex) {
        sliderDataRef.current.lastRenderedIndex = currentIndex;
        setState((state) => ({ ...state, index: currentIndex, page }));
      }
    };

    sliderDataRef.current.animationId = requestAnimationFrame(velocityDampening);
  });

  const slideToIndex = useCallback(
    (index: number, closest = false) => {
      const itemIndex = getCircularIndex(state.index, items.length);
      const page = Math.floor(itemIndex / tilesToShow);

      if (closest) {
        const toItemIndex = getCircularIndex(index, items.length);
        const delta = toItemIndex - itemIndex;
        index = state.index + delta;
      }

      if (!isMultiPage) return;

      setState((state) => ({ ...state, page }));
      onSlideStart?.({
        index: index,
        itemIndex,
        total: items.length,
        page,
        pages,
      });
      handleSnapping(index, stableAnimationFn);
    },
    [handleSnapping, isMultiPage, items.length, onSlideStart, pages, stableAnimationFn, state.index, tilesToShow],
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

  useImperativeHandle(
    sliderRef,
    () => {
      return {
        slide,
        slideToPage,
        slideToIndex,
      };
    },
    [slide, slideToIndex, slideToPage],
  );

  const handleTouchStart = useEventCallback((event: TouchEvent): void => {
    sliderDataRef.current.origin = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
    // reset data
    sliderDataRef.current.velocity = 0;
    sliderDataRef.current.moves = registerMove([], sliderDataRef.current.origin);
    sliderDataRef.current.position = getSliderPosition();

    sliderDataRef.current.scrolling = true;
    sliderDataRef.current.cancelled = false;

    onSwipeStart?.();
    onSlideStart?.({
      index: state.index,
      itemIndex: getCircularIndex(state.index, items.length),
      page: state.page,
      pages,
      total: items.length,
    });
  });

  const handleTouchMove = useEventCallback((event: TouchEvent) => {
    const newPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };

    const { origin, scrolling } = sliderDataRef.current;
    sliderDataRef.current.moves = registerMove(sliderDataRef.current.moves, newPosition);

    // total movement
    let delta: number = newPosition.x - origin.x;
    const movementX: number = Math.abs(newPosition.x - origin.x);
    const movementY: number = Math.abs(newPosition.y - origin.y);

    if (movementX < movementY || sliderDataRef.current.cancelled) {
      sliderDataRef.current.cancelled = true;
      return;
    }

    if (movementX > movementY || scrolling) {
      event.preventDefault();
      event.stopPropagation();

      sliderDataRef.current.scrolling = true;

      // snap to edges when there is nothing to scroll
      if (!isMultiPage) delta = Math.max(-DRAG_EDGE_SNAP, Math.min(DRAG_EDGE_SNAP, delta));

      // instead of absolute positioning, we could do `calc(${relativePosition}% + ${delta}px)`
      frameRef.current.style.transform = `translateX(${sliderDataRef.current.position + delta}px)`;
    }
  });

  const handleTouchEnd = useEventCallback((event: TouchEvent) => {
    const { origin, moves } = sliderDataRef.current;
    const newPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };

    // relative movement (velocity)
    const velocity = getVelocity(moves);

    let delta: number = newPosition.x - origin.x;
    const movementX: number = Math.abs(newPosition.x - origin.x);
    const movementY: number = Math.abs(newPosition.y - origin.y);

    // snap to edges when there is nothing to scroll
    if (!isMultiPage) delta = Math.max(-DRAG_EDGE_SNAP, Math.min(DRAG_EDGE_SNAP, delta));

    sliderDataRef.current.scrolling = false;
    sliderDataRef.current.velocity = 0;

    if (sliderDataRef.current.cancelled || !isMultiPage) {
      return handleVelocity();
    }

    sliderDataRef.current.position += delta;

    // we slide when the movement was mostly horizontal
    if (movementX > movementY) {
      sliderDataRef.current.velocity = velocity;
    }

    onSwipeEnd?.();

    handleVelocity();
  });

  useEffect(() => {
    const gesturesElement = gesturesRef.current;

    window.addEventListener('resize', handleResize);
    gesturesElement.addEventListener('touchstart', handleTouchStart);
    gesturesElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gesturesElement.addEventListener('touchend', handleTouchEnd);
    gesturesElement.addEventListener('touchcancel', handleTouchEnd);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      gesturesElement.removeEventListener('touchstart', handleTouchStart);
      gesturesElement.removeEventListener('touchstart', handleTouchStart);
      gesturesElement.removeEventListener('touchmove', handleTouchMove);
      gesturesElement.removeEventListener('touchend', handleTouchEnd);
      gesturesElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleResize, handleTouchEnd, handleTouchMove, handleTouchStart]);

  const renderTileContainer = (index: number) => {
    const itemIndex = getCircularIndex(index, items.length);
    const fromIndex = state.sliding ? Math.min(state.index, state.fromIndex, state.toIndex) : state.index;
    const toIndex = (state.sliding ? Math.max(state.index, state.fromIndex, state.toIndex) : state.index) + tilesToShow;
    const isVisible = index >= fromIndex && index < toIndex;

    return (
      <li
        style={{ width: `${responsiveTileWidth}%`, paddingLeft: spacing / 2, paddingRight: spacing / 2 }}
        className={isVisible ? 'TileSlider--visible' : 'TileSlider--hidden'}
        key={index}
        aria-hidden={!isVisible}
      >
        {renderTile({ item: items[itemIndex], itemIndex, isVisible, index, slide })}
      </li>
    );
  };

  const renderTiles = () => {
    return Array.from({ length: totalTiles }, (_, index) => renderTileContainer(startIndex + index));
  };

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
      {renderPagination?.({
        index: state.index,
        itemIndex: getCircularIndex(state.index, items.length),
        total: items.length,
        page: state.page,
        pages,
        slide,
        slideToPage,
        slideToIndex,
      })}
    </div>
  );
};
