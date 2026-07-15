/**
 * Metro (via Expo) calls util.styleText(['red','inverse','bold'], text).
 * Node < 20.19 only accepts a single format string, which crashes the bundler
 * while logging errors. Apply formats one-by-one when an array is passed.
 */
const util = require("util");

if (typeof util.styleText === "function" && !util.styleText.__arrayPatched) {
  const original = util.styleText.bind(util);
  function patchedStyleText(format, text) {
    if (Array.isArray(format)) {
      return format.reduceRight((acc, f) => original(f, acc), text);
    }
    return original(format, text);
  }
  patchedStyleText.__arrayPatched = true;
  util.styleText = patchedStyleText;
}
