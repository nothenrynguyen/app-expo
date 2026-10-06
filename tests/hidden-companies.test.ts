import assert from "node:assert/strict";
import test from "node:test";
import { companyPreferenceKey, parseHiddenCompanies } from "../lib/hidden-companies";

test("company hiding matches legal suffix variants without matching unrelated names", () => {
  assert.equal(companyPreferenceKey("Tesla, Inc."), companyPreferenceKey("Tesla"));
  assert.notEqual(companyPreferenceKey("Tesla Energy"), companyPreferenceKey("Tesla"));
  assert.notEqual(companyPreferenceKey("ABC"), companyPreferenceKey("ABC Holdings"));
  assert.notEqual(companyPreferenceKey("腾讯"), companyPreferenceKey("百度"));
});
test("stored preferences recover safely and rebuild keys from validated names", () => {
  assert.deepEqual(parseHiddenCompanies("broken"), []);
  assert.deepEqual(parseHiddenCompanies('{"name":"Tesla"}'), []);
  assert.deepEqual(parseHiddenCompanies(JSON.stringify([null, { name: 42 }, { name: " " }, { name: "Tesla", key: "wrong" }, { name: "Tesla, Inc." }])), [{ name: "Tesla, Inc.", key: "tesla" }]);
});
