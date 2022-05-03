/// <reference types="react" />
import './TileSlider.css';
export declare const CYCLE_MODE_STOP = "stop";
export declare const CYCLE_MODE_RESTART = "restart";
export declare const CYCLE_MODE_ENDLESS = "endless";
export declare type CycleMode = 'stop' | 'restart' | 'endless';
export declare type RenderTile<T> = (item: T, isInView: boolean, listIndex: number, renderKey: string, slide: (direction: Direction) => void) => JSX.Element;
export declare type RenderControl = (props: ControlProps) => JSX.Element;
export declare type ControlProps = {
    onClick: () => void;
    disabled: boolean;
};
declare type Direction = 'left' | 'right';
export declare type TileSliderProps<T> = {
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
declare type Tile<T> = {
    item: T;
    key: string;
    index: number;
};
declare const TileSlider: <T extends unknown>({ items, tilesToShow, cycleMode, spacing, minimalTouchMovement, showControls, animated, transitionTime, transitionTimingFunction, wrapWithEmptyTiles, showDots, pageStep, renderTile, renderLeftControl, renderRightControl, renderPaginationDots, renderAriaLabel, className, onSwipeStart, onSwipeEnd, onSlideEnd, }: TileSliderProps<T>) => JSX.Element;
export default TileSlider;
