/**
 * Shared FlashList v2 knobs for feed surfaces.
 * Keep draw buffers modest — larger values trade memory for fewer blank cells.
 */
export const FEED_GRID_DRAW_DISTANCE = 480;
export const FEED_RAIL_DRAW_DISTANCE = 320;
export const FEED_FOR_YOU_DRAW_DISTANCE = 400;

/** Matches FeedItem rail card footprint (image + 3 text rows + padding). */
export const FEED_RAIL_ROW_HEIGHT = 210;
export const FEED_RAIL_FEATURED_ROW_HEIGHT = 224;
