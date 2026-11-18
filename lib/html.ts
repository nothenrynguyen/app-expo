import { load as loadParsed } from "cheerio/slim";
import { parse } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";

// Retain browser-style HTML repair (implicit body/tbody, malformed markup),
// without initializing Cheerio's unused Undici URL-loading client.
export function load(html: string) {
  return loadParsed(parse(html, { treeAdapter: adapter }));
}
