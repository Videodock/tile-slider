'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".root {\n  overflow: hidden;\n  position: relative;\n}\n\n.container {\n  display: block;\n  margin: 0;\n  padding: 0;\n  white-space: nowrap;\n}\n\n.tile {\n  display: inline-block;\n  list-style-type: none;\n  white-space: normal;\n  box-sizing: border-box;\n}\n\n.emptyTile {\n  box-sizing: border-box;\n\n}\n.emptyTile::before {\n  content: '';\n  display: block;\n  padding-top: 56.25%;\n  background: rgba(255, 255, 255, 0.12);\n  border-radius: 4px;\n}\n\n.leftControl {\n  left: 0px;\n  position: absolute;\n  top: 50%;\n  transform: translateY(-100%);\n  z-index: 1;\n}\n\n.rightControl {\n  position: absolute;\n  right: 0px;\n  top: 50%;\n  transform: translateY(-100%);\n}\n\n.dots {\n  position: relative;\n  display: flex;\n  justify-content: center;\n  width: 100%;\n  margin: 12px;\n}\n";
styleInject(css_248z);

var clx = function () {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    return classes.filter(Boolean).join(' ');
};

var CYCLE_MODE_STOP = 'stop';
var CYCLE_MODE_RESTART = 'restart';
var CYCLE_MODE_ENDLESS = 'endless';
var getCircularIndex = function (index, length) { return ((index % length) + length) % length; };
var TileSlider = function (_a) {
    var items = _a.items, _b = _a.tilesToShow, tilesToShow = _b === void 0 ? 6 : _b, _c = _a.cycleMode, cycleMode = _c === void 0 ? 'endless' : _c, _d = _a.spacing, spacing = _d === void 0 ? 12 : _d, _e = _a.minimalTouchMovement, minimalTouchMovement = _e === void 0 ? 30 : _e, _f = _a.showControls, showControls = _f === void 0 ? true : _f, _g = _a.animated, animated = _g === void 0 ? !window.matchMedia('(prefers-reduced-motion)').matches : _g, _h = _a.transitionTime, transitionTime = _h === void 0 ? '0.6s' : _h, _j = _a.transitionTimingFunction, transitionTimingFunction = _j === void 0 ? 'cubic-bezier(0.39, 0.06, 0.29, 0.96)' : _j, _k = _a.wrapWithEmptyTiles, wrapWithEmptyTiles = _k === void 0 ? false : _k, _l = _a.showDots, showDots = _l === void 0 ? false : _l, _m = _a.pageStep, pageStep = _m === void 0 ? 'page' : _m, renderTile = _a.renderTile, renderLeftControl = _a.renderLeftControl, renderRightControl = _a.renderRightControl, renderPaginationDots = _a.renderPaginationDots, renderAriaLabel = _a.renderAriaLabel, className = _a.className, onSwipeStart = _a.onSwipeStart, onSwipeEnd = _a.onSwipeEnd, onSlideEnd = _a.onSlideEnd, _o = _a.overscan, overscan = _o === void 0 ? tilesToShow : _o;
    var frameRef = React.useRef();
    var _p = React.useState({
        index: 0,
        slideToIndex: 0,
        transform: 0,
        inTransition: false,
        slideBefore: false,
        afterReset: false,
    }), state = _p[0], setState = _p[1];
    var tileWidth = 100 / tilesToShow;
    var isMultiPage = (items === null || items === void 0 ? void 0 : items.length) > tilesToShow;
    var leftOffset = isMultiPage ? 100 - tileWidth * (tilesToShow + 1) + -100 : wrapWithEmptyTiles ? -100 : 0;
    var pages = items.length / tilesToShow;
    var transitionBasis = isMultiPage && animated ? "transform " + transitionTime + " " + transitionTimingFunction : '';
    var needControls = showControls && isMultiPage;
    var showLeftControl = needControls && !(cycleMode === 'stop' && state.index === 0);
    var showRightControl = needControls && !(cycleMode === 'stop' && state.index === items.length - tilesToShow);
    var renderCount = isMultiPage ? tilesToShow + overscan * (pageStep === 'tile' ? 1 : 2) : tilesToShow;
    /**
     * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
     */
    var slide = React.useCallback(function (direction) {
        if (state.inTransition)
            return false;
        var directionFactor = direction === 'right' ? 1 : -1;
        var stepCount = pageStep === 'page' ? tilesToShow : 1;
        var nextIndex = state.index + stepCount * directionFactor;
        if (nextIndex < 0) {
            if (cycleMode === 'stop')
                nextIndex = 0;
            if (cycleMode === 'restart')
                nextIndex = state.index === 0 ? 0 - stepCount : 0;
        }
        if (nextIndex > items.length - stepCount) {
            if (cycleMode === 'stop')
                nextIndex = items.length - stepCount;
            if (cycleMode === 'restart')
                nextIndex = state.index >= items.length - stepCount ? items.length : items.length - stepCount;
        }
        var steps = Math.abs(state.index - nextIndex);
        var movement = steps * tileWidth * (0 - directionFactor);
        setState(function (state) { return (__assign(__assign({}, state), { slideToIndex: nextIndex, transform: movement, inTransition: true, slideBefore: true })); });
        if (!animated && frameRef.current) {
            var event_1 = new TransitionEvent('transitionend', { bubbles: true });
            setTimeout(function () { return frameRef.current.dispatchEvent(event_1); }, 0);
        }
        return true;
    }, [state.inTransition, state.index, pageStep, tilesToShow, items.length, tileWidth, cycleMode, animated]);
    var verticalScrollBlockedRef = React.useRef(false);
    var handleTouchStart = React.useCallback(function (event) {
        var touchPosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
        };
        function handleTouchMove(event) {
            var newPosition = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY,
            };
            var movementX = Math.abs(newPosition.x - touchPosition.x);
            var movementY = Math.abs(newPosition.y - touchPosition.y);
            if ((movementX > movementY && movementX > 10) || verticalScrollBlockedRef.current) {
                event.preventDefault();
                event.stopPropagation();
                verticalScrollBlockedRef.current = true;
                if (onSwipeStart)
                    onSwipeStart();
            }
        }
        function handleTouchEnd(event) {
            var newPosition = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY,
            };
            var movementX = Math.abs(newPosition.x - touchPosition.x);
            var movementY = Math.abs(newPosition.y - touchPosition.y);
            var direction = newPosition.x < touchPosition.x ? 'right' : 'left';
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
            if (onSwipeEnd)
                onSwipeEnd();
        }
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchCancel);
    }, [minimalTouchMovement, slide, onSwipeStart, onSwipeEnd]);
    React.useEffect(function () {
        if (state.afterReset) {
            if (frameRef.current)
                frameRef.current.style.transition = transitionBasis;
            if (onSlideEnd)
                onSlideEnd();
            setState(function (state) { return (__assign(__assign({}, state), { afterReset: false, inTransition: false })); });
        }
    }, [onSlideEnd, state.afterReset, transitionBasis]);
    var resetAnimation = function () {
        var resetIndex = state.slideToIndex;
        if (cycleMode !== CYCLE_MODE_ENDLESS) {
            resetIndex = resetIndex >= items.length ? state.slideToIndex - items.length : resetIndex;
            resetIndex = resetIndex < 0 ? items.length + state.slideToIndex : resetIndex;
            if (resetIndex !== state.slideToIndex) {
                setState(function (state) { return (__assign(__assign({}, state), { slideToIndex: resetIndex })); });
            }
        }
        if (frameRef.current)
            frameRef.current.style.transition = 'none';
        setState(function (state) { return (__assign(__assign({}, state), { index: resetIndex, transform: 0, inTransition: true, slideBefore: true, afterReset: true })); });
    };
    var handleTransitionEnd = function (event) {
        if (event.target === frameRef.current) {
            resetAnimation();
        }
    };
    var ulStyle = {
        transform: "translateX(" + state.transform + "%)",
        // prettier-ignore
        'WebkitTransform': "translateX(" + state.transform + "%)",
        left: leftOffset + "%",
        position: 'relative',
        width: '100%',
        transition: transitionBasis,
        marginLeft: -spacing / 2,
        marginRight: -spacing / 2,
        willChange: 'transform',
    };
    var leftControlDisabled = (cycleMode === 'stop' && state.index === 0) || !state.slideBefore;
    var rightControlDisabled = cycleMode === 'stop' && state.index === items.length - tilesToShow;
    var paginationDots = function () {
        if (showDots && isMultiPage && !!renderPaginationDots) {
            var length_1 = pages;
            return (React__default['default'].createElement("div", { className: 'dots' }, Array.from({ length: length_1 }, function (_, pageIndex) {
                return renderPaginationDots(state.index / tilesToShow, pageIndex);
            })));
        }
    };
    var renderTiles = function () {
        var tiles = [];
        var end = renderCount + state.index;
        var firstInView = state.slideToIndex + tilesToShow;
        var lastInView = tilesToShow * 2 + state.slideToIndex;
        var slideCallback = isMultiPage ? slide : undefined;
        for (var renderIndex = state.index; renderIndex < end; renderIndex++) {
            var isInView = !isMultiPage || (renderIndex > firstInView && renderIndex <= lastInView);
            var circularIndex = getCircularIndex(renderIndex, renderCount);
            var item = items[getCircularIndex(renderIndex, items.length)];
            var key = "tile_" + circularIndex;
            var indexOfItem = renderIndex - state.index;
            tiles.push(React__default['default'].createElement("li", { className: 'tile', key: key, "aria-label": renderAriaLabel && renderAriaLabel(item, indexOfItem, key, items.length), style: {
                    width: tileWidth + "%",
                    paddingLeft: spacing / 2,
                    paddingRight: spacing / 2,
                    transition: !isInView ? 'opacity .6s ease-in' : '',
                } }, renderTile(item, isInView, renderIndex, key, slideCallback)));
        }
        return tiles;
    };
    return (React__default['default'].createElement("div", { className: clx('root', className) },
        showLeftControl && !!renderLeftControl && (React__default['default'].createElement("div", { className: 'leftControl' }, renderLeftControl({
            onClick: function () { return slide('left'); },
            disabled: leftControlDisabled,
        }))),
        React__default['default'].createElement("ul", { ref: frameRef, className: 'container', style: ulStyle, onTouchStart: handleTouchStart, onTransitionEnd: handleTransitionEnd },
            wrapWithEmptyTiles ? (React__default['default'].createElement("li", { className: 'emptyTile', style: {
                    width: tileWidth + "%",
                    paddingLeft: spacing / 2,
                    paddingRight: spacing / 2,
                } })) : null,
            renderTiles(),
            wrapWithEmptyTiles ? (React__default['default'].createElement("li", { className: 'emptyTile', style: {
                    width: tileWidth + "%",
                    paddingLeft: spacing / 2,
                    paddingRight: spacing / 2,
                } })) : null),
        showRightControl && !!renderRightControl && (React__default['default'].createElement("div", { className: 'rightControl' }, renderRightControl({
            onClick: function () { return slide('right'); },
            disabled: rightControlDisabled,
        }))),
        paginationDots()));
};

exports.CYCLE_MODE_ENDLESS = CYCLE_MODE_ENDLESS;
exports.CYCLE_MODE_RESTART = CYCLE_MODE_RESTART;
exports.CYCLE_MODE_STOP = CYCLE_MODE_STOP;
exports.TileSlider = TileSlider;
//# sourceMappingURL=index.js.map
