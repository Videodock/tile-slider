import React, { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useEffect, useState } from 'react';

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
  slide: (direction: Direction) => void,
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
  renderAriaLabel?: (tile: Tile<T>, total: number) => string;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideEnd?: () => void;
};

type Tile<T> = {
  item: T;
  key: string;
  index: number;
};

const getCircularIndex = <T,>(index: number, array: T[]) => {
  const { length } = array;
  return array[((index % length) + length) % length];
};

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
}: TileSliderProps<T>) => {
  const [index, setIndex] = useState<number>(0);
  const [slideToIndex, setSlideToIndex] = useState<number>(0);
  const [transform, setTransform] = useState<number>(0);
  const [doAnimationReset, setDoAnimationReset] = useState<boolean>(false);
  const [didSlideBefore, setDidSlideBefore] = useState(false);
  const [afterReset, setAfterReset] = useState(false);
  const frameRef = useRef<HTMLUListElement>() as React.MutableRefObject<HTMLUListElement>;
  const tileWidth: number = 100 / tilesToShow;
  const isMultiPage: boolean = items?.length > tilesToShow;
  const leftOffset: number = isMultiPage ? 100 - tileWidth * (tilesToShow + 1) + -100 : wrapWithEmptyTiles ? -100 : 0;
  const pages = items.length / tilesToShow;

  const transitionBasis: string = isMultiPage && animated ? `transform ${transitionTime} ${transitionTimingFunction}` : '';

  const needControls: boolean = showControls && isMultiPage;
  const showLeftControl: boolean = needControls && !(cycleMode === 'stop' && index === 0);
  const showRightControl: boolean = needControls && !(cycleMode === 'stop' && index === items.length - tilesToShow);

  const renderCount = isMultiPage ? tilesToShow * 3 : tilesToShow;
  const renderIdsArr = useMemo(
    () => Array.from({ length: isMultiPage ? renderCount + 1 : renderCount }, (_, i) => i),
    [renderCount, isMultiPage],
  );

  /**
   * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
   */
  const slide = useCallback(
    (direction: Direction): boolean => {
      if (!isMultiPage) return false;

      const directionFactor = direction === 'right' ? 1 : -1;
      const stepCount = pageStep === 'page' ? tilesToShow : 1;

      let nextIndex: number = index + stepCount * directionFactor;

      if (nextIndex < 0) {
        if (cycleMode === 'stop') nextIndex = 0;
        if (cycleMode === 'restart') nextIndex = index === 0 ? 0 - stepCount : 0;
      }

      if (nextIndex > items.length - stepCount) {
        if (cycleMode === 'stop') nextIndex = items.length - stepCount;
        if (cycleMode === 'restart') nextIndex = index >= items.length - stepCount ? items.length : items.length - stepCount;
      }

      const steps: number = Math.abs(index - nextIndex);
      const movement: number = steps * tileWidth * (0 - directionFactor);

      setSlideToIndex(nextIndex);
      setTransform(movement);
      setDidSlideBefore(true);

      if (!animated) setDoAnimationReset(true);
      return true;
    },
    [animated, cycleMode, index, items.length, tileWidth, tilesToShow, pageStep, isMultiPage],
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

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchCancel);
    },
    [minimalTouchMovement, slide, onSwipeStart, onSwipeEnd],
  );

  useLayoutEffect(() => {
    const resetAnimation = (): void => {
      const resetIndex: number = slideToIndex;

      // resetIndex = resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
      // resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;

      // if (resetIndex !== slideToIndex) {
      //   setSlideToIndex(resetIndex);
      // }

      setIndex(resetIndex);

      if (frameRef.current) frameRef.current.style.transition = 'none';
      setTransform(0);
      setDoAnimationReset(false);
      setAfterReset(true);
    };

    if (doAnimationReset) resetAnimation();
  }, [doAnimationReset, index, items.length, slideToIndex, tileWidth, tilesToShow, transitionBasis, onSlideEnd]);

  useEffect(() => {
    if (afterReset) {
      if (frameRef.current) frameRef.current.style.transition = transitionBasis;
      if (onSlideEnd) onSlideEnd();
      setAfterReset(false);
    }
  }, [afterReset, onSlideEnd, transitionBasis]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLUListElement>) => {
    if (event.target === frameRef.current) {
      setDoAnimationReset(true);
    }
  };

  const ulStyle = {
    transform: `translate3d(${transform}%, 0, 0)`,
    // prettier-ignore
    'WebkitTransform': `translate3d(${transform}%, 0, 0)`,
    left: `${leftOffset}%`,
    position: 'relative',
    width: '100%',
    transition: transitionBasis,
    marginLeft: -spacing / 2,
    marginRight: -spacing / 2,
  } as React.CSSProperties;

  const leftControlDisabled = (cycleMode === 'stop' && index === 0) || !didSlideBefore;
  const rightControlDisabled = cycleMode === 'stop' && index === items.length - tilesToShow;

  const paginationDots = () => {
    if (showDots && isMultiPage && !!renderPaginationDots) {
      const length = pages;

      return (
        <div className={'dots'}>
          {Array.from({ length }, (_, pageIndex) => {
            return renderPaginationDots(index / tilesToShow, pageIndex);
          })}
        </div>
      );
    }
  };

  const renderTiles = () => {
    const tiles = [];
    const start = index;
    const end = renderCount + index;
    const firstInView = slideToIndex + tilesToShow;
    const lastInView = tilesToShow * 2 + slideToIndex;

    for (let i = start; i < end; i++) {
      const isInView = !isMultiPage || (i > firstInView && i <= lastInView);
      const item = getCircularIndex(i, items);
      const key = getCircularIndex(i, renderIdsArr);

      tiles.push(
        <li
          className={'tile'}
          key={key}
          // aria-label={renderAriaLabel && renderAriaLabel(tile, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2,
            transition: !isInView ? 'opacity .6s ease-in' : '',
          }}
        >
          {renderTile(item, isInView, i, key.toString(), slide)}
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
      <ul ref={frameRef} className={'container'} style={ulStyle} onTouchStart={handleTouchStart} onTransitionEnd={handleTransitionEnd}>
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

        {renderTiles()}
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
