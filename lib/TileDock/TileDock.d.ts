/// <reference types="react" />
import './style.css';
export declare const CYCLE_MODE_STOP = "CYCLE_MODE_STOP";
export declare const CYCLE_MODE_RESTART = "CYCLE_MODE_RESTART";
export declare const CYCLE_MODE_ENDLESS = "CYCLE_MODE_ENDLESS";
interface TileDockProps {
    items: Array<any>;
    tilesToShow: number;
    transitionTime: string;
    cycleMode: string;
    showControls: boolean;
    spacing: number;
    animated: boolean;
    minimalTouchMovement: number;
    renderTile: Function;
    renderLeftControl: Function;
    renderRightControl: Function;
}
export declare const TileDock: ({ items, tilesToShow, transitionTime, cycleMode, showControls, spacing, animated, minimalTouchMovement, renderTile, renderLeftControl, renderRightControl, }: TileDockProps) => JSX.Element;
export {};
