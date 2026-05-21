/**
 * Flubber.js - Vector Morphing & SVG Geometry Engine
 *
 * Bundled wrapper for flubber library.
 * Provides mathematically continuous SVG shape interpolation.
 */

import { interpolate, toCircle, toRect, fromCircle, fromRect, separate, combine } from 'flubber';

export { interpolate, toCircle, toRect, fromCircle, fromRect, separate, combine };

export default {
    interpolate,
    toCircle,
    toRect,
    fromCircle,
    fromRect,
    separate,
    combine,
};
