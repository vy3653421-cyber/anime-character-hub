import test from "node:test";
import assert from "node:assert/strict";
import { PermissionPolicy } from "./permission-policy";

test("PermissionPolicy defaults to deny and supports confirmation rules", () => {
  const policy = new PermissionPolicy();
  assert.equal(policy.allows("files.read", "read"), false);

  const rule = policy.set("files.delete", "confirm");
  assert.equal(rule.requiresUserConfirmation, true);
  assert.equal(policy.allows("files.delete", "confirm"), true);
  assert.equal(policy.allows("files.delete", "trusted"), false);
});
