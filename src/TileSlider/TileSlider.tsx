import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import styles from './TileSlider.module.scss';

export const CYCLE_MODE_STOP = 'stop';
export const CYCLE_MODE_RESTART = 'restart';
export const CYCLE_MODE_ENDLESS = 'endless';

export type CycleMode = 'stop' | 'restart' | 'endless';
type Direction = 'left' | 'right';
type Position = { x: number; y: number };

type ControlProps = { onClick: () => void; disabled: boolean };

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
  rootClassName?: string;
  renderTile: (item: T, isInView: boolean) => JSX.Element;
  renderLeftControl?: (props: ControlProps) => JSX.Element;
  renderRightControl?: (props: ControlProps) => JSX.Element;
  renderPaginationDots?: (index: number, pageIndex: number) => JSX.Element;
  renderAriaLabel?: (tile: Tile<T>, total: number) => string;
};

type Tile<T> = {
  item: T;
  key: string;
  index: number;
};

/**
 * Make an unique Tile for all the given sliced items.
 */
const makeTileArray = <T extends unknown>(originalList: T[], slicedItems: T[]): Tile<T>[] => {
  const itemIndices: string[] = [];

  return slicedItems.map((item) => {
    const index = originalList.indexOf(item);
    let key = `tile_${index}`;

    while (itemIndices.includes(key)) key += '_';

    itemIndices.push(key);

    return { item, key, index };
  });
};

/**
 * Return an Tile collection which can be rendered in the slider component. This collection can contain duplicates, so
 * we need to make them 'unique'.
 *
 * In the happy flow, we only have unique tiles to enable wrapping (unlimited scroll):
 *
 *                 [visible tiles]
 * [idx 5],[idx 6],[idx 1],[idx 2],[idx 3],[idx 4]
 *
 * However, when for example there are only 5 items in the data set, the slice will look like this:
 *
 *                 [visible tiles]
 * [idx 4],[idx 5],[idx 1],[idx 2],[idx 3],[idx 4]
 *
 * Notice the duplicate tile with index 4.
 */
const makeTileSlice = <T extends unknown>(
  items: T[],
  isMultiPage: boolean,
  index: number,
  tilesToShow: number,
  cycleMode: CycleMode
): Tile<T>[] => {
  if (!isMultiPage) return makeTileArray(items, items);

  const sliceFrom: number = index;
  const sliceTo: number = index + tilesToShow * 3;
  const cycleModeEndlessCompensation: number =
    cycleMode === 'endless' ? tilesToShow : 0;
  const listStartClone: T[] = items.slice(
    0,
    tilesToShow + cycleModeEndlessCompensation + 1
  );
  const listEndClone: T[] = items.slice(
    0 - (tilesToShow + cycleModeEndlessCompensation + 1)
  );
  const itemsWithClones: T[] = [...listEndClone, ...items, ...listStartClone];
  const itemsSlice: T[] = itemsWithClones.slice(sliceFrom, sliceTo + 2);

  return makeTileArray(items, itemsSlice);
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
  wrapWithEmptyTiles = false,
  showDots = false,
  renderTile,
  renderLeftControl,
  renderRightControl,
  renderPaginationDots,
  renderAriaLabel,
  rootClassName,
}: TileSliderProps<T>) => {
  const [index, setIndex] = useState<number>(0);
  const [slideToIndex, setSlideToIndex] = useState<number>(0);
  const [transform, setTransform] = useState<number>(-100);
  const [doAnimationReset, setDoAnimationReset] = useState<boolean>(false);
  const [didSlideBefore, setDidSlideBefore] = useState(false);
  const frameRef = useRef<HTMLUListElement>() as React.MutableRefObject<HTMLUListElement>;
  const tileWidth: number = 100 / tilesToShow;
  const isMultiPage: boolean = items?.length > tilesToShow;
  const transformWithOffset: number = isMultiPage
    ? 100 - tileWidth * (tilesToShow + 1) + transform
    : wrapWithEmptyTiles
    ? -100
    : 0;
  const pages = items.length / tilesToShow;
  const tileList: Tile<T>[] = useMemo(() => {
    return makeTileSlice<T>(items, isMultiPage, index, tilesToShow, cycleMode);
  }, [items, isMultiPage, index, tilesToShow, cycleMode]);

  const transitionBasis: string =
    isMultiPage && animated ? `transform ${transitionTime} ease` : ';

  const needControls: boolean = showControls && isMultiPage;
  const showLeftControl: boolean =
    needControls && !(cycleMode === 'stop' && index === 0);
  const showRightControl: boolean =
    needControls &&
    !(cycleMode === 'stop' && index === items.length - tilesToShow);

  /**
   * Slide all tiles in the given direction. Currently only 'left' or 'right' are supported.
   */
  const slide = useCallback(
    (direction: Direction): void => {
      const directionFactor = direction === 'right' ? 1 : -1;
      let nextIndex: number = index + tilesToShow * directionFactor;

      if (nextIndex < 0) {
        if (cycleMode === 'stop') nextIndex = 0;
        if (cycleMode === 'restart')
          nextIndex = index === 0 ? 0 - tilesToShow : 0;
      }

      if (nextIndex > items.length - tilesToShow) {
        if (cycleMode === 'stop') nextIndex = items.length - tilesToShow;
        if (cycleMode === 'restart')
          nextIndex =
            index >= items.length - tilesToShow
              ? items.length
              : items.length - tilesToShow;
      }

      const steps: number = Math.abs(index - nextIndex);
      const movement: number = steps * tileWidth * (0 - directionFactor);

      setSlideToIndex(nextIndex);
      setTransform(-100 + movement);
      setDidSlideBefore(true);

      if (!animated) setDoAnimationReset(true);
    },
    [animated, cycleMode, index, items.length, tileWidth, tilesToShow]
  );

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

        if (movementX > movementY && movementX > 10) {
          event.preventDefault();
          event.stopPropagation();
        }
      }

      function handleTouchEnd(this: HTMLDocument, event: TouchEvent): void {
        const newPosition = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };

        const movementX: number = Math.abs(newPosition.x - touchPosition.x);
        const movementY: number = Math.abs(newPosition.y - touchPosition.y);
        const direction: Direction =
          newPosition.x < touchPosition.x ? 'right' : 'left';

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
      }

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchCancel);
    },
    [minimalTouchMovement, slide]
  );

  useLayoutEffect(() => {
    const resetAnimation = (): void => {
      let resetIndex: number = slideToIndex;

      resetIndex =
        resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
      resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;

      if (resetIndex !== slideToIndex) {
        setSlideToIndex(resetIndex);
      }

      setIndex(resetIndex);

      if (frameRef.current) frameRef.current.style.transition = 'none';
      setTransform(-100);

      setTimeout(() => {
        if (frameRef.current)
          frameRef.current.style.transition = transitionBasis;
      }, 0);
      setDoAnimationReset(false);
    };

    if (doAnimationReset) resetAnimation();
  }, [
    doAnimationReset,
    index,
    items.length,
    slideToIndex,
    tileWidth,
    tilesToShow,
    transitionBasis,
  ]);

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLUListElement>
  ) => {
    if (event.target === frameRef.current) {
      setDoAnimationReset(true);
    }
  };

  const ulStyle = {
    transform: `translate3d(${transformWithOffset}%, 0, 0)`,
    // prettier-ignore
    'WebkitTransform': `translate3d(${transformWithOffset}%, 0, 0)`,
    transition: transitionBasis,
    marginLeft: -spacing / 2,
    marginRight: -spacing / 2,
  };

  const leftControlDisabled =
    (cycleMode === 'stop' && index === 0) || !didSlideBefore;
  const rightControlDisabled =
    cycleMode === 'stop' && index === items.length - tilesToShow;
  const slideOffset = index - slideToIndex;

  const paginationDots = () => {
    if (showDots && isMultiPage && !!renderPaginationDots) {
      const length = pages;

      return (
        <div className={styles.dots}>
          {Array.from({ length }, (_, pageIndex) => {
            return renderPaginationDots(index, pageIndex);
          })}
        </div>
      );
    }
  };

  return (
    <div className={rootClassName}>
      {showLeftControl && !!renderLeftControl && (
        <div className={styles.leftControl}>
          {renderLeftControl({
            onClick: () => slide('left'),
            disabled: leftControlDisabled,
          })}
        </div>
      )}
      <ul
        ref={frameRef}
        className={styles.container}
        style={ulStyle}
        onTouchStart={handleTouchStart}
        onTransitionEnd={handleTransitionEnd}
      >
        {wrapWithEmptyTiles ? (
          <li
            className={styles.emptyTile}
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2,
            }}
          />
        ) : null}
        {tileList.map((tile: Tile<T>, listIndex) => {
          const isInView =
            !isMultiPage ||
            (listIndex > tilesToShow - slideOffset &&
              listIndex < tilesToShow * 2 + 1 - slideOffset);

          return (
            <li
              className={styles.tile}
              key={tile.key}
              aria-label={
                renderAriaLabel && renderAriaLabel(tile, items.length)
              }
              style={{
                width: `${tileWidth}%`,
                paddingLeft: spacing / 2,
                paddingRight: spacing / 2,
                transition: !isInView ? 'opacity .2s ease-in 0s' : ',
              }}
            >
              {renderTile(tile.item, isInView)}
            </li>
          );
        })}
        {wrapWithEmptyTiles ? (
          <li
            className={styles.emptyTile}
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2,
            }}
          />
        ) : null}
      </ul>
      {showRightControl && !!renderRightControl && (
        <div className={styles.rightControl}>
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
