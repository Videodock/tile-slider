'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

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
var getCircularIndex = function (index, array) {
    var length = array.length;
    return array[((index % length) + length) % length];
};
var TileSlider = function (_a) {
    var items = _a.items, _b = _a.tilesToShow, tilesToShow = _b === void 0 ? 6 : _b, _c = _a.cycleMode, cycleMode = _c === void 0 ? 'endless' : _c, _d = _a.spacing, spacing = _d === void 0 ? 12 : _d, _e = _a.minimalTouchMovement, minimalTouchMovement = _e === void 0 ? 30 : _e, _f = _a.showControls, showControls = _f === void 0 ? true : _f, _g = _a.animated, animated = _g === void 0 ? !window.matchMedia('(prefers-reduced-motion)').matches : _g, _h = _a.transitionTime, transitionTime = _h === void 0 ? '0.6s' : _h, _j = _a.transitionTimingFunction, transitionTimingFunction = _j === void 0 ? 'cubic-bezier(0.39, 0.06, 0.29, 0.96)' : _j, _k = _a.wrapWithEmptyTiles, wrapWithEmptyTiles = _k === void 0 ? false : _k, _l = _a.showDots, showDots = _l === void 0 ? false : _l, _m = _a.pageStep, pageStep = _m === void 0 ? 'page' : _m, renderTile = _a.renderTile, renderLeftControl = _a.renderLeftControl, renderRightControl = _a.renderRightControl, renderPaginationDots = _a.renderPaginationDots; _a.renderAriaLabel; var className = _a.className, onSwipeStart = _a.onSwipeStart, onSwipeEnd = _a.onSwipeEnd, onSlideEnd = _a.onSlideEnd;
    var _o = React.useState(0), index = _o[0], setIndex = _o[1];
    var _p = React.useState(0), slideToIndex = _p[0], setSlideToIndex = _p[1];
    var _q = React.useState(0), transform = _q[0], setTransform = _q[1];
    var _r = React.useState(false), doAnimationReset = _r[0], setDoAnimationReset = _r[1];
    var _s = React.useState(false), didSlideBefore = _s[0], setDidSlideBefore = _s[1];
    var _t = React.useState(false), afterReset = _t[0], setAfterReset = _t[1];
    var frameRef = React.useRef();
    var tileWidth = 100 / tilesToShow;
    var isMultiPage = (items === null || items === void 0 ? void 0 : items.length) > tilesToShow;
    var leftOffset = isMultiPage ? 100 - tileWidth * (tilesToShow + 1) + -100 : wrapWithEmptyTiles ? -100 : 0;
    var pages = items.length / tilesToShow;
    var transitionBasis = isMultiPage && animated ? "transform " + transitionTime + " " + transitionTimingFunction : '';
    var needControls = showControls && isMultiPage;
    var showLeftControl = needControls && !(cycleMode === 'stop' && index === 0);
    var showRightControl = needControls && !(cycleMode === 'stop' && index === items.length - tilesToShow);
    var renderCount = isMultiPage ? tilesToShow * 3 : tilesToShow;
    var renderIdsArr = React.useMemo(function () { return Array.from({ length: isMultiPage ? renderCount + 1 : renderCount }, function (_, i) { return i; }); }, [renderCount, isMultiPage]);
    /**
     * Slide all tiles in the given direction. Currently, only 'left' or 'right' are supported.
     */
    var slide = React.useCallback(function (direction) {
        var directionFactor = direction === 'right' ? 1 : -1;
        var stepCount = pageStep === 'page' ? tilesToShow : 1;
        var nextIndex = index + stepCount * directionFactor;
        if (nextIndex < 0) {
            if (cycleMode === 'stop')
                nextIndex = 0;
            if (cycleMode === 'restart')
                nextIndex = index === 0 ? 0 - stepCount : 0;
        }
        if (nextIndex > items.length - stepCount) {
            if (cycleMode === 'stop')
                nextIndex = items.length - stepCount;
            if (cycleMode === 'restart')
                nextIndex = index >= items.length - stepCount ? items.length : items.length - stepCount;
        }
        var steps = Math.abs(index - nextIndex);
        var movement = steps * tileWidth * (0 - directionFactor);
        setSlideToIndex(nextIndex);
        setTransform(movement);
        setDidSlideBefore(true);
        if (!animated)
            setDoAnimationReset(true);
    }, [animated, cycleMode, index, items.length, tileWidth, tilesToShow, pageStep]);
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
        document.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchCancel);
    }, [minimalTouchMovement, slide, onSwipeStart, onSwipeEnd]);
    React.useLayoutEffect(function () {
        var resetAnimation = function () {
            var resetIndex = slideToIndex;
            // resetIndex = resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
            // resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;
            // if (resetIndex !== slideToIndex) {
            //   setSlideToIndex(resetIndex);
            // }
            setIndex(resetIndex);
            if (frameRef.current)
                frameRef.current.style.transition = 'none';
            setTransform(0);
            setDoAnimationReset(false);
            setAfterReset(true);
        };
        if (doAnimationReset)
            resetAnimation();
    }, [doAnimationReset, index, items.length, slideToIndex, tileWidth, tilesToShow, transitionBasis, onSlideEnd]);
    React.useEffect(function () {
        if (afterReset) {
            if (frameRef.current)
                frameRef.current.style.transition = transitionBasis;
            if (onSlideEnd)
                onSlideEnd();
            setAfterReset(false);
        }
    }, [afterReset, onSlideEnd, transitionBasis]);
    var handleTransitionEnd = function (event) {
        if (event.target === frameRef.current) {
            setDoAnimationReset(true);
        }
    };
    var ulStyle = {
        transform: "translate3d(" + transform + "%, 0, 0)",
        // prettier-ignore
        'WebkitTransform': "translate3d(" + transform + "%, 0, 0)",
        left: leftOffset + "%",
        position: 'relative',
        width: '100%',
        transition: transitionBasis,
        marginLeft: -spacing / 2,
        marginRight: -spacing / 2,
    };
    var leftControlDisabled = (cycleMode === 'stop' && index === 0) || !didSlideBefore;
    var rightControlDisabled = cycleMode === 'stop' && index === items.length - tilesToShow;
    var paginationDots = function () {
        if (showDots && isMultiPage && !!renderPaginationDots) {
            var length_1 = pages;
            return (React__default['default'].createElement("div", { className: 'dots' }, Array.from({ length: length_1 }, function (_, pageIndex) {
                return renderPaginationDots(index / tilesToShow, pageIndex);
            })));
        }
    };
    var renderTiles = function () {
        var tiles = [];
        var start = index;
        var end = renderCount + index;
        var firstInView = slideToIndex + tilesToShow;
        var lastInView = tilesToShow * 2 + slideToIndex;
        for (var i = start; i < end; i++) {
            var isInView = !isMultiPage || (i > firstInView && i <= lastInView);
            var item = getCircularIndex(i, items);
            var key = getCircularIndex(i, renderIdsArr);
            tiles.push(React__default['default'].createElement("li", { className: 'tile', key: key, 
                // aria-label={renderAriaLabel && renderAriaLabel(tile, items.length)}
                style: {
                    width: tileWidth + "%",
                    paddingLeft: spacing / 2,
                    paddingRight: spacing / 2,
                    transition: !isInView ? 'opacity .6s ease-in' : '',
                } }, renderTile(item, isInView, i, key.toString(), slide)));
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
