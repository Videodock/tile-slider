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

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

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

var css_248z = ".tileDock {\n    overflow: hidden;\n    position: relative;\n  }\n  .tileDock ul {\n    display                    : block;\n    white-space                : nowrap;\n    margin                     : 0;\n    padding                    : 0;\n  }\n  .tileDock li {\n    display        : inline-block;\n    list-style-type: none;\n    white-space    : normal;\n  }\n  .tileDock .offsetTile {\n    position: absolute;\n    top     : 0px;\n    left    : 0px;\n    width   : 100%;\n    height  : 100%;\n  }\n  .tileDock .leftControl {\n    left     :  0px;\n    position : absolute;\n    top      : 50%;\n    transform: translateY(-100%);\n    z-index  : 1;\n  }\n  .tileDock .rightControl {\n    position : absolute;\n    right    : 0px;\n    top      : 50%;\n    transform: translateY(-100%);\n  }";
styleInject(css_248z);

var CYCLE_MODE_STOP = 'CYCLE_MODE_STOP';
var CYCLE_MODE_RESTART = 'CYCLE_MODE_RESTART';
var CYCLE_MODE_ENDLESS = 'CYCLE_MODE_ENDLESS';
var TileDock = function (_a) {
    var items = _a.items, _b = _a.tilesToShow, tilesToShow = _b === void 0 ? 6 : _b, _c = _a.transitionTime, transitionTime = _c === void 0 ? '0.6s' : _c, _d = _a.cycleMode, cycleMode = _d === void 0 ? CYCLE_MODE_ENDLESS : _d, _e = _a.showControls, showControls = _e === void 0 ? true : _e, _f = _a.spacing, spacing = _f === void 0 ? 12 : _f, _g = _a.animated, animated = _g === void 0 ? !window.matchMedia('(prefers-reduced-motion)').matches : _g, _h = _a.minimalTouchMovement, minimalTouchMovement = _h === void 0 ? 30 : _h, renderTile = _a.renderTile, renderLeftControl = _a.renderLeftControl, renderRightControl = _a.renderRightControl;
    var _j = React.useState(0), index = _j[0], setIndex = _j[1];
    var _k = React.useState(0), slideToIndex = _k[0], setSlideToIndex = _k[1];
    var _l = React.useState(-100), transform = _l[0], setTransform = _l[1];
    var _m = React.useState(false), doAnimationReset = _m[0], setDoAnimationReset = _m[1];
    var _o = React.useState(), touchPosition = _o[0], setTouchPosition = _o[1];
    var frameRef = React.useRef(null);
    var tilesToShowRounded = Math.floor(tilesToShow);
    var offset = Math.round((tilesToShow - tilesToShowRounded) * 10) / 10;
    var offsetCompensation = offset ? 1 : 0;
    var tileWidth = 100 / (tilesToShowRounded + offset * 2);
    var isMultiPage = items.length > tilesToShowRounded;
    var transformWithOffset = isMultiPage ? 100 - tileWidth * (tilesToShowRounded + offsetCompensation - offset) + transform : 0;
    var sliceItems = function (items) {
        var sliceFrom = index;
        var sliceTo = index + (tilesToShowRounded * 3) + offsetCompensation * 2;
        var cycleModeEndlessCompensation = cycleMode === CYCLE_MODE_ENDLESS ? tilesToShowRounded : 0;
        var listStartClone = items.slice(0, tilesToShowRounded + cycleModeEndlessCompensation + offsetCompensation);
        var listEndClone = items.slice(0 - (tilesToShowRounded + offsetCompensation));
        var itemsWithClones = __spreadArray(__spreadArray(__spreadArray([], listEndClone), items), listStartClone);
        var itemsSlice = itemsWithClones.slice(sliceFrom, sliceTo);
        return itemsSlice;
    };
    var tileList = isMultiPage ? sliceItems(items) : items;
    var isAnimating = index !== slideToIndex;
    var transitionBasis = "transform " + (animated ? transitionTime : '0s') + " ease";
    var showLeftControl = showControls && isMultiPage && !(cycleMode === CYCLE_MODE_STOP && index === 0);
    var showRightControl = isMultiPage && !(cycleMode === CYCLE_MODE_STOP && index === items.length - tilesToShowRounded);
    var slideRight = function () {
        var nextIndex = index + tilesToShowRounded;
        if (nextIndex > items.length - tilesToShowRounded) {
            switch (cycleMode) {
                case CYCLE_MODE_STOP:
                    nextIndex = items.length - tilesToShowRounded;
                    break;
                case CYCLE_MODE_RESTART:
                    nextIndex = index === items.length - tilesToShowRounded ? items.length : items.length - tilesToShowRounded;
                    break;
            }
        }
        doSlide(nextIndex);
    };
    var slideLeft = function () {
        var nextIndex = index - tilesToShowRounded;
        if (nextIndex < 0) {
            switch (cycleMode) {
                case CYCLE_MODE_STOP:
                    nextIndex = 0;
                    break;
                case CYCLE_MODE_RESTART:
                    nextIndex = index === 0 ? 0 - tilesToShowRounded : 0;
                    break;
            }
        }
        doSlide(nextIndex);
    };
    var doSlide = function (nextIndex) {
        var steps = Math.abs(index - nextIndex);
        var movement = nextIndex > index ? 0 - steps * tileWidth : steps * tileWidth;
        setSlideToIndex(nextIndex);
        setTransform(-100 + movement);
        if (!animated) {
            setDoAnimationReset(true);
        }
    };
    var handleAnimationEndEvent = function () { return setDoAnimationReset(true); };
    var handleTouchStart = function (event) { return setTouchPosition({ x: event.touches[0].clientX, y: event.touches[0].clientY }); };
    var handleTouchEnd = function (event) {
        var newPosition = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
        var movementX = Math.abs(newPosition.x - touchPosition.x);
        var movementY = Math.abs(newPosition.y - touchPosition.y);
        if (movementX < minimalTouchMovement || movementX < movementY) {
            return;
        }
        if (newPosition.x < touchPosition.x)
            slideRight();
        if (newPosition.x > touchPosition.x)
            slideLeft();
    };
    React.useLayoutEffect(function () {
        if (doAnimationReset) {
            var resetIndex = slideToIndex;
            resetIndex = resetIndex >= items.length ? slideToIndex - items.length : resetIndex;
            resetIndex = resetIndex < 0 ? items.length + slideToIndex : resetIndex;
            setIndex(resetIndex);
            frameRef.current.style.transition = 'none';
            setTransform(-100);
            setTimeout(function () { return frameRef.current.style.transition = transitionBasis; }, 0);
            setDoAnimationReset(false);
        }
    }, [doAnimationReset, index, items.length, slideToIndex, tileWidth, tilesToShowRounded, transitionBasis]);
    var renderGradientEdge = function () {
        var firstPercentage = cycleMode === CYCLE_MODE_STOP && index === 0 ? offset * tileWidth : 0;
        var secondPercentage = tileWidth * offset;
        var thirdPercentage = 100 - tileWidth * offset;
        return "linear-gradient(90deg, rgba(255,255,255,1) " + firstPercentage + "%, rgba(255,255,255,0) " + secondPercentage + "%, rgba(255,255,255,0) " + thirdPercentage + "%, rgba(255,255,255,1) 100%)";
    };
    return (React__default['default'].createElement("div", { className: "tileDock" },
        showLeftControl && (React__default['default'].createElement("div", { className: "leftControl" }, renderLeftControl({ handleClick: slideLeft }))),
        React__default['default'].createElement("ul", { ref: frameRef, style: {
                transform: "translate3d(" + transformWithOffset + "%, 0, 0)",
                WebkitTransform: "translate3d(" + transformWithOffset + "%, 0, 0)",
                transition: transitionBasis,
                marginLeft: -spacing / 2,
                marginRight: -spacing / 2,
            }, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, onTransitionEnd: handleAnimationEndEvent }, tileList.map(function (item, listIndex) {
            var isVisible = isAnimating ||
                !isMultiPage ||
                (listIndex > tilesToShowRounded - offsetCompensation - 1 && listIndex < tilesToShowRounded * 2 + offsetCompensation + offsetCompensation);
            return (React__default['default'].createElement("li", { key: "visibleTile" + listIndex, "data-index": item.index, style: {
                    width: tileWidth + "%",
                    visibility: isVisible ? 'visible' : 'hidden',
                    paddingLeft: spacing / 2,
                    paddingRight: spacing / 2,
                } }, renderTile({ item: item })));
        })),
        offsetCompensation > 0 && isMultiPage && (React__default['default'].createElement("div", { className: "offsetTile", style: { background: renderGradientEdge() } })),
        showRightControl && (React__default['default'].createElement("div", { className: "rightControl" }, renderRightControl({ handleClick: slideRight })))));
};

exports.CYCLE_MODE_ENDLESS = CYCLE_MODE_ENDLESS;
exports.CYCLE_MODE_RESTART = CYCLE_MODE_RESTART;
exports.CYCLE_MODE_STOP = CYCLE_MODE_STOP;
exports.TileDock = TileDock;
//# sourceMappingURL=index.js.map
