import React, { useCallback, useRef, useState } from "react";

import "./TileSlider.css";
import { clx } from "./utils";

export const CYCLE_MODE_STOP = "stop";
export const CYCLE_MODE_RESTART = "restart";
export const CYCLE_MODE_ENDLESS = "endless";

export type CycleMode = "stop" | "restart" | "endless";
export type RenderTile<T> = (
  item: T,
  isInView: boolean,
  listIndex: number,
  renderKey: string,
  slide?: (direction: Direction) => void
) => JSX.Element;
export type RenderControl = (props: ControlProps) => JSX.Element;

export type ControlProps = {
  onClick: () => void;
  disabled: boolean;
};

type Direction = "left" | "right";
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
  pageStep?: "page" | "tile";
  renderTile: RenderTile<T>;
  renderLeftControl?: RenderControl;
  renderRightControl?: RenderControl;
  renderPaginationDots?: (index: number, pageIndex: number) => JSX.Element;
  renderAriaLabel?: (item: T, index: number, key: string, total: number) => string;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSlideEnd?: () => void;
  overscan?: number;
  throttleOnTransition?: boolean;
};

const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;

const TileSlider = <T extends unknown> ({
                                          items,
                                          tilesToShow = 6,
                                          cycleMode = "endless",
                                          spacing = 12,
                                          minimalTouchMovement = 30,
                                          showControls = true,
                                          animated = !window.matchMedia("(prefers-reduced-motion)").matches,
                                          transitionTime = "0.6s",
                                          transitionTimingFunction = "cubic-bezier(0.39, 0.06, 0.29, 0.96)",
                                          wrapWithEmptyTiles = false,
                                          showDots = false,
                                          pageStep = "page",
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
                                          throttleOnTransition = false
                                        }: TileSliderProps<T>) => {
  const frameRef = useRef<HTMLUListElement>(null);
  const slideToIndexRef = useRef(0);
  const isSlidingRef = useRef(false);
  const slideKeyRef = useRef(10000);
  const [index, setIndex] = useState(0);
  const [slideBefore, setSlideBefore] = useState(false);
  const tileWidth: number = 100 / tilesToShow;
  const isMultiPage: boolean = items?.length > tilesToShow;
  const leftOffset: number = isMultiPage ? 100 - tileWidth * (tilesToShow + 1) + -100 : wrapWithEmptyTiles ? -100 : 0;
  const pages = Math.ceil(items.length / tilesToShow);
  const transitionBasis: string = isMultiPage && animated ? `transform ${transitionTime} ${transitionTimingFunction}` : "";
  const needControls: boolean = showControls && isMultiPage;
  const showLeftControl: boolean = needControls && !(cycleMode === "stop" && index === 0);
  const showRightControl: boolean = needControls && !(cycleMode === "stop" && index === items.length - tilesToShow);
  const pageStepCompensation = pageStep === "tile" ? 0 : 2;
  const renderAmount = isMultiPage ? tilesToShow + overscan * 2 + pageStepCompensation : tilesToShow;

  const moveFrame = useCallback((offset: string, animated: boolean) => {
    if (!frameRef.current) return;

    frameRef.current.style.transition = animated ? transitionBasis : "none";
    frameRef.current.style.transform = `translateX(${offset})`;
  }, [transitionBasis]);

  const resetAnimation = useCallback(() => {
    const slideToIndex = slideToIndexRef.current;
    let resetIndex: number = slideToIndex;

    if (cycleMode !== CYCLE_MODE_ENDLESS) {
      resetIndex = resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
      resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;
    }

    // unblock slide calls
    isSlidingRef.current = false;

    // render the next tiles into view
    setIndex(resetIndex);
    setSlideBefore(true);

    // reset frame position but without animation
    moveFrame("0", false);
    if (onSlideEnd) onSlideEnd();
  }, [cycleMode, items.length, moveFrame, onSlideEnd]);

  /**
   * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
   */
  const slide = useCallback((direction: Direction, toIndex?: number) => {
    if (throttleOnTransition && isSlidingRef.current) return false;

    // block upcoming slide calls until we're ready again
    isSlidingRef.current = true;

    const directionFactor = direction === "right" ? 1 : -1;
    const stepCount = pageStep === "page" ? tilesToShow : 1;

    let nextIndex: number = typeof toIndex === "number" ? toIndex : index + stepCount * directionFactor;

    if (nextIndex < 0) {
      if (cycleMode === "stop") nextIndex = 0;
      if (cycleMode === "restart") nextIndex = index === 0 ? 0 - stepCount : 0;
    }

    if (nextIndex > items.length - stepCount) {
      if (cycleMode === "stop") nextIndex = items.length - stepCount;
      if (cycleMode === "restart") nextIndex = index >= items.length - stepCount ? items.length : items.length - stepCount;
    }

    const delta = nextIndex - index;
    const steps = Math.abs(delta);
    const movement = steps * tileWidth * (0 - directionFactor);

    // add/subtract slideKeyRef with
    slideKeyRef.current += delta;

    slideToIndexRef.current = nextIndex;
    moveFrame(`${movement}%`, animated);
    if (!animated) resetAnimation();
  }, [throttleOnTransition, pageStep, tilesToShow, index, items.length, tileWidth, moveFrame, animated, resetAnimation, cycleMode]);

  const swipeDataRef = useRef({ isDragging: false, startPosition: { x: 0, y: 0 }, startTime: 0 });

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!isMultiPage) return;

    swipeDataRef.current.startPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
    swipeDataRef.current.startTime = Date.now();
  }, [isMultiPage]);

  function handleTouchMove (event: React.TouchEvent) {
    if (!isMultiPage) return;

    const { startPosition, isDragging } = swipeDataRef.current;
    const newPosition: Position = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
    const rawMovement = newPosition.x - startPosition.x;
    const movementX: number = Math.abs(rawMovement);
    const movementY: number = Math.abs(newPosition.y - startPosition.y);

    if ((movementX > movementY && movementX > 10) || isDragging) {
      if (event.cancelable) {
        event.preventDefault();
        event.stopPropagation();
      }

      moveFrame(`${Math.round(rawMovement)}px`, false);

      // only the triggered for the first event
      if (!isDragging) {
        if (onSwipeStart) onSwipeStart();
        swipeDataRef.current.isDragging = true;
      }
    }
  }

  function handleTouchEnd (event: React.TouchEvent) {
    if (!isMultiPage) return;

    const { startPosition, startTime, isDragging } = swipeDataRef.current;
    const newPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };

    const movementX: number = Math.abs(newPosition.x - startPosition.x);
    const movementY: number = Math.abs(newPosition.y - startPosition.y);
    const direction: Direction = newPosition.x < startPosition.x ? "right" : "left";

    let performsSlide = false;
    const draggedTime = Date.now() - startTime;

    if (isDragging && movementX > minimalTouchMovement && movementX > movementY) {
      if (draggedTime < 300) {
        slide(direction);
        performsSlide = true;
      } else {
        const frameWidth = frameRef.current?.offsetWidth || 100;
        const realTileWidth = frameWidth / tilesToShow;
        const tilesDragged = Math.ceil(movementX / realTileWidth);

        if (tilesDragged > 0) {
          const tileOffset = tilesDragged * (direction === "left" ? -1 : 1);

          slide(direction, index + tileOffset);
          performsSlide = true;
        }
      }
    }

    if (!performsSlide) {
      // reset frame
      moveFrame("0", true);
    }

    onSwipeEnd && onSwipeEnd();
    swipeDataRef.current.isDragging = true;
  }

  const handleTouchCancel = () => {
    if (!isMultiPage) return;

    onSwipeEnd && onSwipeEnd();
    swipeDataRef.current.isDragging = true;
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLUListElement>) => {
    if (event.target === frameRef.current) {
      resetAnimation();
    }
  };

  const ulStyle = {
    left: `${leftOffset}%`,
    marginLeft: -spacing / 2,
    marginRight: -spacing / 2
  } as React.CSSProperties;

  const leftControlDisabled = (cycleMode === "stop" && index === 0) || !slideBefore;
  const rightControlDisabled = cycleMode === "stop" && index === items.length - tilesToShow;

  const paginationDots = () => {
    if (showDots && isMultiPage && !!renderPaginationDots) {
      const length = pages;

      return (
        <div className="TileSlider-dots">
          {Array.from({ length }, (_, pageIndex) => {
            return renderPaginationDots(Math.floor(index / tilesToShow), pageIndex);
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
          aria-label={renderAriaLabel && renderAriaLabel(item, index, key, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2
          }}
        >
          {renderTile(item, true, index, key, undefined)}
        </li>
      );
    });

  const renderMultiPageTiles = () => {
    const tiles = [];

    for (let i = 0; i < renderAmount; i++) {
      const tileIndex = (index - tilesToShow - 1) + i;
      const isInView = tileIndex >= index && tileIndex <= index + tilesToShow - 1;
      const itemIndex = getCircularIndex(tileIndex, items.length);
      const item = items[itemIndex];
      const key = `tile_${slideKeyRef.current + i}`;

      tiles.push(
        <li
          className="TileSlider-tile"
          data-key={key}
          key={key}
          aria-label={renderAriaLabel && renderAriaLabel(item, itemIndex, key, items.length)}
          style={{
            width: `${tileWidth}%`,
            paddingLeft: spacing / 2,
            paddingRight: spacing / 2,
            transition: `opacity .6s ease-in`
          }}
        >
          {renderTile(item, isInView, itemIndex, key, slide)}
        </li>
      );
    }

    return tiles;
  };

  return (
    <div className={clx("TileSlider", className)}>
      {showLeftControl && !!renderLeftControl && (
        <div className="TileSlider-leftControl">
          {renderLeftControl({
            onClick: () => slide("left"),
            disabled: leftControlDisabled
          })}
        </div>
      )}
      <ul
        ref={frameRef}
        className="TileSlider-container"
        style={ulStyle}
        onTouchStart={isMultiPage ? handleTouchStart : undefined}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onTransitionEnd={handleTransitionEnd}
      >
        {wrapWithEmptyTiles ? (
          <li
            className="TileSlider-emptyTile"
            style={{
              width: `${tileWidth}%`,
              paddingLeft: spacing / 2,
              paddingRight: spacing / 2
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
              paddingRight: spacing / 2
            }}
          />
        ) : null}
      </ul>
      {showRightControl && !!renderRightControl && (
        <div className="TileSlider-rightControl">
          {renderRightControl({
            onClick: () => slide("right"),
            disabled: rightControlDisabled
          })}
        </div>
      )}
      {paginationDots()}
    </div>
  );
};

export default TileSlider;
