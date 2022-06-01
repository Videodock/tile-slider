import React, { useCallback, useRef, useEffect, useState } from 'react';

import './TileSlider.css';
import { clx } from './utils';

export const CYCLE_MODE_STOP = 'stop';
export const CYCLE_MODE_RESTART = 'restart';
export const CYCLE_MODE_ENDLESS = 'endless';

export type CycleMode = 'stop' | 'restart' | 'endless';
export type RenderTile<T> = (
  item: T,
  isInView: boolean,
  listIndex: number,
  renderKey: string,
  slide?: (direction: Direction) => void,
) => JSX.Element;
export type RenderControl = (props: ControlProps) => JSX.Element;

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
  minimalTouchMovement?: number;
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
  passiveEventlistener?: boolean;
  renderPaginationDots?: (index: number, pageIndex: number) => JSX.Element;
  renderAriaLabel?: (item: T, index: number, key: string, total: number) => string;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideEnd?: () => void;
  overscan?: number;
  throttleOnTransition?: boolean;
};

const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;

const TileSlider = <T extends unknown>({
  items,
  tilesToShow = 6,
  cycleMode = 'endless',
  spacing = 12,
  minimalTouchMovement = 30,
  showControls = true,
  animated = !window.matchMedia('(prefers-reduced-motion)').matches,
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
  throttleOnTransition = false,
}: TileSliderProps<T>) => {
  const frameRef = useRef<HTMLUListElement>() as React.MutableRefObject<HTMLUListElement>;
  const [state, setState] = useState({
    index: 0,
    slideToIndex: 0,
    transform: 0,
    inTransition: false,
    slideBefore: false,
    afterReset: false,
  });
  const tileWidth: number = 100 / tilesToShow;
  const isMultiPage: boolean = items?.length > tilesToShow;
  const leftOffset: number = isMultiPage ? 100 - tileWidth * (tilesToShow + 1) + -100 : wrapWithEmptyTiles ? -100 : 0;
  const pages = items.length / tilesToShow;
  const transitionBasis: string = isMultiPage && animated ? `transform ${transitionTime} ${transitionTimingFunction}` : '';
  const needControls: boolean = showControls && isMultiPage;
  const showLeftControl: boolean = needControls && !(cycleMode === 'stop' && state.index === 0);
  const showRightControl: boolean = needControls && !(cycleMode === 'stop' && state.index === items.length - tilesToShow);
  const pageStepCompensation = pageStep === 'tile' ? 0 : 2;
  const renderAmount = isMultiPage ? tilesToShow + overscan * 2 + pageStepCompensation : tilesToShow;

  /**
   * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
   */
  const slide = useCallback(
    (direction: Direction): boolean => {
      if (throttleOnTransition && state.inTransition) return false;

      const directionFactor = direction === 'right' ? 1 : -1;
      const stepCount = pageStep === 'page' ? tilesToShow : 1;

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
        inTransition: true,
        slideBefore: true,
      }));

      if (!animated && frameRef.current) {
        const event = new TransitionEvent('transitionend', { bubbles: true });
        setTimeout(() => frameRef.current.dispatchEvent(event), 0);
      }

      return true;
    },
    [throttleOnTransition, state.inTransition, state.index, pageStep, tilesToShow, items.length, tileWidth, cycleMode, animated],
  );

  const verticalScrollBlockedRef = useRef(false);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent): void => {
      const touchPosition: Position = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };

      function handleTouchMove(this: HTMLDocument, event: TouchEvent): void {
        const newPosition: Position = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };
        const movementX: number = Math.abs(newPosition.x - touchPosition.x);
        const movementY: number = Math.abs(newPosition.y - touchPosition.y);

        if ((movementX > movementY && movementX > 10) || verticalScrollBlockedRef.current) {
          event.preventDefault();
          event.stopPropagation();

          verticalScrollBlockedRef.current = true;
          if (onSwipeStart) onSwipeStart();
        }
      }

      function handleTouchEnd(this: HTMLDocument, event: TouchEvent): void {
        const newPosition = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };

        const movementX: number = Math.abs(newPosition.x - touchPosition.x);
        const movementY: number = Math.abs(newPosition.y - touchPosition.y);
        const direction: Direction = newPosition.x < touchPosition.x ? 'right' : 'left';

        if (movementX > minimalTouchMovement && movementX > movementY) {
          slide(direction);
        }

        cleanup();
      }

      function handleTouchCancel() {
        cleanup();
      }

      function cleanup() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchCancel);

        verticalScrollBlockedRef.current = false;
        if (onSwipeEnd) onSwipeEnd();
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchCancel);
    },
    [minimalTouchMovement, slide, onSwipeStart, onSwipeEnd],
  );

  useEffect(() => {
    if (state.afterReset) {
      if (frameRef.current) frameRef.current.style.transition = transitionBasis;
      if (onSlideEnd) onSlideEnd();

      setState((state) => ({
        ...state,
        afterReset: false,
        inTransition: false,
      }));
    }
  }, [onSlideEnd, state.afterReset, transitionBasis]);

  const resetAnimation = (): void => {
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

    if (frameRef.current) frameRef.current.style.transition = 'none';

    setState((state) => ({
      ...state,
      index: resetIndex,
      transform: 0,
      inTransition: true,
      slideBefore: true,
      afterReset: true,
    }));
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLUListElement>) => {
    if (event.target === frameRef.current) {
      resetAnimation();
    }
  };

  const ulStyle = {
    transform: `translateX(${state.transform}%)`,
    // prettier-ignore
    'WebkitTransform': `translateX(${state.transform}%)`,
    left: `${leftOffset}%`,
    position: 'relative',
    width: '100%',
    transition: transitionBasis,
    marginLeft: -spacing / 2,
    marginRight: -spacing / 2,
    willChange: 'transform',
  } as React.CSSProperties;

  const leftControlDisabled = (cycleMode === 'stop' && state.index === 0) || !state.slideBefore;
  const rightControlDisabled = cycleMode === 'stop' && state.index === items.length - tilesToShow;

  const paginationDots = () => {
    if (showDots && isMultiPage && !!renderPaginationDots) {
      const length = pages;

      return (
        <div className={'dots'}>
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
          className={'tile'}
          key={key}
          aria-label={renderAriaLabel && renderAriaLabel(item, index, key, items.length)}
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
    const firstInView = state.slideToIndex + tilesToShow;
    const lastInView = tilesToShow * 2 + state.slideToIndex;

    for (let renderIndex = state.index; renderIndex < end; renderIndex++) {
      const isInView = renderIndex > firstInView && renderIndex <= lastInView;
      const indexOverscanCompensation = renderIndex - tilesToShow - 1;

      const indexOfItem = getCircularIndex(indexOverscanCompensation, items.length);
      const circularIndex = getCircularIndex(renderIndex, renderAmount);

      const item = items[indexOfItem];
      const key = `tile_${circularIndex}`;

      tiles.push(
        <li
          className={'tile'}
          key={key}
          aria-label={renderAriaLabel && renderAriaLabel(item, indexOfItem, key, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2,
            transition: !isInView ? 'opacity .6s ease-in' : '',
          }}
        >
          {renderTile(item, isInView, indexOverscanCompensation, key, slide)}
        </li>,
      );
    }

    return tiles;
  };

  return (
    <div className={clx('root', className)}>
      {showLeftControl && !!renderLeftControl && (
        <div className={'leftControl'}>
          {renderLeftControl({
            onClick: () => slide('left'),
            disabled: leftControlDisabled,
          })}
        </div>
      )}
      <ul
        ref={frameRef}
        className={'container'}
        style={ulStyle}
        onTouchStart={isMultiPage ? handleTouchStart : undefined}
        onTransitionEnd={handleTransitionEnd}
      >
        {wrapWithEmptyTiles ? (
          <li
            className={'emptyTile'}
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
            className={'emptyTile'}
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2,
            }}
          />
        ) : null}
      </ul>
      {showRightControl && !!renderRightControl && (
        <div className={'rightControl'}>
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

export default TileSlider;
