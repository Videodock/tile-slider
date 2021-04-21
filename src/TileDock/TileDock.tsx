import React, { useLayoutEffect, useRef, useState } from 'react';
import './style.css';

export const CYCLE_MODE_STOP    = 'CYCLE_MODE_STOP';
export const CYCLE_MODE_RESTART = 'CYCLE_MODE_RESTART';
export const CYCLE_MODE_ENDLESS = 'CYCLE_MODE_ENDLESS';


interface TileDockProps {
    items: Array<any>,
    tilesToShow: number,
    transitionTime:string,
    cycleMode: string,
    showControls:boolean,
    spacing: number,
    animated: boolean,
    minimalTouchMovement: number,
    renderTile: Function,
    renderLeftControl: Function,
    renderRightControl: Function,
};

export const TileDock = ({
  items,
  tilesToShow          = 6,
  transitionTime       = '0.6s',
  cycleMode            = CYCLE_MODE_ENDLESS,
  showControls         = true,
  spacing              = 12,
  animated             = !window.matchMedia('(prefers-reduced-motion)').matches,
  minimalTouchMovement = 30,
  renderTile,
  renderLeftControl,
  renderRightControl,
}: TileDockProps) => {
  const [index,            setIndex]            = useState(0);
  const [slideToIndex,     setSlideToIndex]     = useState(0);
  const [transform,        setTransform]        = useState(-100);
  const [doAnimationReset, setDoAnimationReset] = useState(false);
  const [touchPosition,    setTouchPosition]    = useState<any>();
  const frameRef                                = useRef(null);
  const tilesToShowRounded                      = Math.floor(tilesToShow);
  const offset                                  = Math.round((tilesToShow - tilesToShowRounded) * 10) / 10;
  const offsetCompensation                      = offset ? 1 : 0;
  const tileWidth                               = 100 / (tilesToShowRounded + offset * 2);
  const isMultiPage                             = items.length > tilesToShowRounded;
  const transformWithOffset                     = isMultiPage ? 100 - tileWidth * (tilesToShowRounded + offsetCompensation - offset) + transform : 0;

  const sliceItems = (items: any) => {
    const sliceFrom                    = index;
    const sliceTo                      = index + (tilesToShowRounded * 3) + offsetCompensation * 2;
    const cycleModeEndlessCompensation = cycleMode === CYCLE_MODE_ENDLESS ? tilesToShowRounded : 0;
    const listStartClone               = items.slice(0, tilesToShowRounded + cycleModeEndlessCompensation + offsetCompensation);
    const listEndClone                 = items.slice(0 - (tilesToShowRounded + offsetCompensation));
    const itemsWithClones              = [...listEndClone, ...items, ...listStartClone];
    const itemsSlice                   = itemsWithClones.slice(sliceFrom, sliceTo);

    return itemsSlice;
  };

  const tileList         = isMultiPage ? sliceItems(items) : items;
  const isAnimating      = index !== slideToIndex;
  const transitionBasis  = `transform ${animated ? transitionTime : '0s'} ease`;
  const showLeftControl  = showControls && isMultiPage && !(cycleMode === CYCLE_MODE_STOP && index === 0);
  const showRightControl = isMultiPage && !(cycleMode === CYCLE_MODE_STOP && index === items.length - tilesToShowRounded);

  const slideRight = () => {
    let nextIndex = index + tilesToShowRounded;

    if (nextIndex > items.length - tilesToShowRounded){
      switch(cycleMode){
      case CYCLE_MODE_STOP:
        nextIndex = items.length - tilesToShowRounded;
        break;
      case CYCLE_MODE_RESTART:
        nextIndex = index === items.length - tilesToShowRounded ? items.length : items.length - tilesToShowRounded;
        break;
      case CYCLE_MODE_ENDLESS:
      default:
        break;
      }
    }
    doSlide(nextIndex);
  };
  const slideLeft  = () => {
    let nextIndex = index - tilesToShowRounded;

    if (nextIndex < 0){
      switch(cycleMode){
      case CYCLE_MODE_STOP:
        nextIndex = 0;
        break;
      case CYCLE_MODE_RESTART:
        nextIndex = index === 0 ? 0 - tilesToShowRounded : 0;
        break;
      case CYCLE_MODE_ENDLESS:
      default:
        break;
      }
    }
    doSlide(nextIndex);
  };
  const doSlide    = (nextIndex: number) => {
    const steps    = Math.abs(index - nextIndex);
    const movement = nextIndex > index ? 0 - steps * tileWidth : steps * tileWidth;

    setSlideToIndex(nextIndex);
    setTransform(-100 + movement);

    if(!animated){
      setDoAnimationReset(true);
    }
  };

  const handleAnimationEndEvent = () => setDoAnimationReset(true);
  const handleTouchStart        = (event: React.TouchEvent) => setTouchPosition({ x: event.touches[0].clientX, y: event.touches[0].clientY });
  const handleTouchEnd          = (event: React.TouchEvent) => {
    const newPosition = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    const movementX   = Math.abs(newPosition.x - touchPosition.x);
    const movementY   = Math.abs(newPosition.y - touchPosition.y);

    if(movementX < minimalTouchMovement || movementX < movementY){
      return;
    }
    if(newPosition.x < touchPosition.x) slideRight();
    if(newPosition.x > touchPosition.x) slideLeft();
  };

  useLayoutEffect(() => {
    if(doAnimationReset ){
      let resetIndex = slideToIndex;

      resetIndex = resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
      resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;
      setIndex(resetIndex);

      (frameRef as any).current.style.transition = 'none';
      setTransform(-100);
      setTimeout(() => (frameRef as any).current.style.transition = transitionBasis, 0);
      setDoAnimationReset(false);
    }
  }, [doAnimationReset, index, items.length, slideToIndex, tileWidth, tilesToShowRounded, transitionBasis]);

  const renderGradientEdge = () => {
    const firstPercentage  = cycleMode === CYCLE_MODE_STOP && index === 0 ? offset * tileWidth : 0;
    const secondPercentage = tileWidth * offset;
    const thirdPercentage  = 100 - tileWidth * offset;

    return `linear-gradient(90deg, rgba(255,255,255,1) ${firstPercentage}%, rgba(255,255,255,0) ${secondPercentage}%, rgba(255,255,255,0) ${thirdPercentage}%, rgba(255,255,255,1) 100%)`;
  };

  return (
    <div className="tileDock">
      {showLeftControl && (
        <div className="leftControl">
          {renderLeftControl({ handleClick: slideLeft })}
        </div>
      )}
      <ul
        ref={frameRef}
        style={{
          transform      : `translate3d(${transformWithOffset}%, 0, 0)`,
          WebkitTransform: `translate3d(${transformWithOffset}%, 0, 0)`,
          transition     : transitionBasis,
          marginLeft     : -spacing / 2,
          marginRight    : -spacing / 2,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={handleAnimationEndEvent}
      >
        {tileList.map((item, listIndex) => {
          const isVisible =
              isAnimating ||
              !isMultiPage ||
              (listIndex > tilesToShowRounded - offsetCompensation - 1 && listIndex < tilesToShowRounded * 2 + offsetCompensation + offsetCompensation);

          return (
            <li
              key={`visibleTile${listIndex}`}
              data-index={item.index}
              style={{
                width       : `${tileWidth}%`,
                visibility  : isVisible ? 'visible' : 'hidden',
                paddingLeft : spacing / 2,
                paddingRight: spacing / 2,
              }}
            >
              {renderTile({ item })}
            </li>
          );
        })}
      </ul>
      {offsetCompensation > 0 && isMultiPage && (
        <div className="offsetTile" style={{ background: renderGradientEdge() }} />
      )}
      {showRightControl && (
        <div className="rightControl">
          {renderRightControl({ handleClick: slideRight })}
        </div>
      )}
    </div>
  );
};

