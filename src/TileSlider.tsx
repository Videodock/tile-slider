import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useEventCallback } from './hooks/useEventCallback';
import { AnimationFn, clampWithEasing, easeOut, easeOutQuartic } from './utils/easing';
import { getCircularIndex } from './utils/math';
import { clx } from './utils/clx';
import { getVelocity, Position, registerMove, TouchMoves } from './utils/drag';

// only render the given items once and stop sliding when reaching the beginning or end
export const CYCLE_MODE_STOP = 'stop';
// endless render items, but align to the first and last item when using the slide left/right controls
export const CYCLE_MODE_RESTART = 'restart';
// endless render items
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
  classNames?: {
    gestures?: string;
    list?: string;
    leftControl?: string;
    rightControl?: string;
    tile?: string;
  };
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
  classNames = {},
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
  });

  const leftControlDisabled = cycleMode === 'stop' && state.index === 0;
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

  /**
   * Limit the given `index` to a valid index
   */
  const limitIndex = useCallback(
    (index: number) => {
      if (!isMultiPage) {
        index = 0;
      }

      if (cycleMode === CYCLE_MODE_STOP) {
        index = Math.max(0, Math.min(items.length - tilesToShow, index));
      }

      return index;
    },
    [cycleMode, isMultiPage, items.length, tilesToShow],
  );

  /**
   * Calculate the current index based on the position of the slider frame
   */
  const calculateIndex = useCallback(() => {
    const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;

    return limitIndex(Math.round((sliderDataRef.current.position / tileWidth) * -1));
  }, [limitIndex, tilesToShow]);

  /**
   * Get the slider frame position in pixels
   */
  const getSliderPosition = useEventCallback(() => {
    const transform = frameRef.current ? getComputedStyle(frameRef.current).transform?.split(', ')[4] : '0';

    return transform ? parseInt(transform) : 0;
  });

  /**
   * Handle window resize event
   */
  const handleResize = useEventCallback(() => {
    cancelAnimationFrame(sliderDataRef.current.animationId);
    if (frameRef.current) {
      sliderDataRef.current.frameWidth = parseFloat(getComputedStyle(frameRef.current).width);
      frameRef.current.style.transform = `translateX(${-responsiveTileWidth * state.index}%)`;
    }
  });

  // this effect resets the position when the tilesToShow changes
  useEffect(() => {
    handleResize();
  }, [handleResize, responsiveTileWidth, tilesToShow]);

  /**
   * Snapping will slide to the given index using the `animationFn` and `duration` for the easing. This is mainly used
   * when using the API, pagination or left/right controls to slide to a specific index.
   */
  const handleSnapping = useEventCallback((index: number, animationFn: AnimationFn, duration = SLIDE_SNAPPING_DAMPING) => {
    const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;
    const from = getSliderPosition();
    const relativeToPosition = -responsiveTileWidth * index;
    const to = -(index * tileWidth);
    const change = to - from;
    const startTime = Date.now();
    const page = Math.floor(getCircularIndex(index, items.length) / tilesToShow);

    if (!animated) {
      setState((state) => ({ ...state, index, page, sliding: false }));
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

  /**
   * The `handleVelocity` function is called to smoothly transition from a drag gesture to programmatic animation.
   * Based on the speed (velocity), the animation function and duration is calculated until the velocity reaches a given
   * threshold. When this happens, the velocity animation switches to a snapping animation to, also smoothly, align with a
   * tile.
   */
  const handleVelocity = useEventCallback(() => {
    const startVelocity = sliderDataRef.current.velocity * 16;

    // snap back to the current tile when the velocity is near zero
    if (Math.abs(startVelocity) < 1) {
      return handleSnapping(calculateIndex(), easeOutQuartic, 500);
    }

    // Swipe to prev/next (consider a velocity between -8 and 8 to be a swipe)
    // A velocity of 8 is little more than a gentle swipe
    if (Math.abs(startVelocity) < 8) {
      return handleSnapping(calculateIndex(), easeOutQuartic, SLIDE_SNAPPING_DAMPING);
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

        if (cycleMode === CYCLE_MODE_STOP) {
          sliderDataRef.current.position = clampWithEasing(
            sliderDataRef.current.position,
            -tileWidth * (items.length - tilesToShow),
            0,
            DRAG_EDGE_SNAP,
          );
        }
      }

      // calculate the snapping values when the velocity drops below 10 OR when reaching a boundary in cycle mode stop
      // this ensures that we have a consistent speed to blend the snapping animation
      if (
        (Math.abs(velocity) <= 10 ||
          (cycleMode === CYCLE_MODE_STOP && (currentIndex <= 0 || currentIndex >= items.length - tilesToShow))) &&
        snappingStartTime === -1
      ) {
        snappingStartTime = Date.now();

        const targetIndexFloat = -(sliderDataRef.current.position / tileWidth);
        const targetBuffer = 0.35;
        const targetIndex = limitIndex(
          velocity > 0 ? Math.floor(targetIndexFloat - targetBuffer) : Math.ceil(targetIndexFloat + targetBuffer),
        );

        if (cycleMode === CYCLE_MODE_STOP) {
          snappingTargetPosition = -(Math.max(0, Math.min(items.length - tilesToShow, targetIndex)) * tileWidth);
        } else {
          snappingTargetPosition = -(targetIndex * tileWidth);
        }

        // this multiplier aligns pretty well maintaining the same velocity
        snappingDuration = Math.min(2000, Math.abs(snappingTargetPosition - sliderDataRef.current.position) * 5);
        snappingStartPosition = sliderDataRef.current.position;
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
      index = limitIndex(index);
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
    [limitIndex, handleSnapping, isMultiPage, items.length, onSlideStart, pages, stableAnimationFn, state.index, tilesToShow],
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
      let slideStepCount = stepCount;

      if (cycleMode === CYCLE_MODE_RESTART) {
        const itemIndex = getCircularIndex(state.index, items.length);
        const diffToLast = items.length - tilesToShow - itemIndex;
        const diffToFirst = itemIndex;

        // slide to the first/last item when exceeding
        if (direction === 'right' && diffToLast !== 0) slideStepCount = Math.min(diffToLast, slideStepCount);
        if (direction === 'left' && diffToFirst !== 0) slideStepCount = Math.min(diffToFirst, slideStepCount);
      }

      const toIndex = state.index + slideStepCount * directionFactor;

      slideToIndex(toIndex);
    },
    [cycleMode, items.length, slideToIndex, state.index, stepCount, tilesToShow],
  );

  useImperativeHandle(sliderRef, () => {
    return {
      slide,
      slideToPage,
      slideToIndex,
    };
  }, [slide, slideToIndex, slideToPage]);

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

  /**
   * This function returns the new slider position based on the given (drag) delta
   */
  const getSliderDragPosition = (delta: number) => {
    if (!isMultiPage) delta = clampWithEasing(delta, 0, 0, DRAG_EDGE_SNAP);
    let position = sliderDataRef.current.position + delta;

    if (isMultiPage && cycleMode === CYCLE_MODE_STOP) {
      const tileWidth = sliderDataRef.current.frameWidth / tilesToShow;
      const minPosition = -(items.length - tilesToShow) * tileWidth;
      const maxPosition = 0;

      position = clampWithEasing(position, minPosition, maxPosition, DRAG_EDGE_SNAP);
    }

    return position;
  };

  const handleTouchMove = useEventCallback((event: TouchEvent) => {
    const newPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };

    const { origin, scrolling } = sliderDataRef.current;
    sliderDataRef.current.moves = registerMove(sliderDataRef.current.moves, newPosition);

    // total movement
    const delta: number = newPosition.x - origin.x;
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
      frameRef.current.style.transform = `translateX(${getSliderDragPosition(delta)}px)`;
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

    const delta: number = newPosition.x - origin.x;
    const movementX: number = Math.abs(newPosition.x - origin.x);
    const movementY: number = Math.abs(newPosition.y - origin.y);

    sliderDataRef.current.scrolling = false;
    sliderDataRef.current.velocity = 0;

    if (sliderDataRef.current.cancelled || !isMultiPage) {
      return handleVelocity();
    }

    sliderDataRef.current.position = getSliderDragPosition(delta);

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
        className={clx(classNames.tile, isVisible ? 'TileSlider--visible' : 'TileSlider--hidden')}
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

  const renderLeftControlWrapper = () => {
    const content = renderLeftControl?.({
      onClick: () => slide('left'),
      disabled: leftControlDisabled,
    });
    return content && <div className={clx('TileSlider-leftControl', classNames.leftControl)}>{content}</div>;
  };

  const renderRightControlWrapper = () => {
    const content = renderRightControl?.({
      onClick: () => slide('right'),
      disabled: rightControlDisabled,
    });
    return content && <div className={clx('TileSlider-rightControl', classNames.rightControl)}>{content}</div>;
  };

  return (
    <div className={clx('TileSlider', className)}>
      {needControls && renderLeftControlWrapper()}
      <div className={clx('TileSlider-gestures', classNames.gestures)} style={{ marginLeft: -(spacing / 2), marginRight: -(spacing / 2) }} ref={gesturesRef}>
        <ul className={clx('TileSlider-list', classNames.list)} ref={frameRef} style={{ left: `calc(${listOffset}%)` }}>
          {renderTiles()}
        </ul>
      </div>
      {needControls && renderRightControlWrapper()}
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
