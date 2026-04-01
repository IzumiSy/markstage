/**
 * Browser-safe exports from @izumisy/react-preview.
 *
 * This sub-path (`@izumisy/react-preview/dom`) avoids pulling in Node.js
 * dependencies (e.g. `node:crypto`) so it can be safely imported from
 * browser code such as React components or Vue SFCs.
 */
export {
  WRAP_STYLES,
  ALIGN_STYLES,
} from "./preview-module";
