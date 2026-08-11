"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const contract=require(path.join(root,"src/integration/v26/authorizeDecisionContract.json"));
const source=fs.readFileSync(path.join(root,"src/integration/v26/authorizeProductionService.js"),"utf8");
for(const field of ["accessMode","reasonCode","requiredAccess"]){
  assert.ok(contract.resultFields.includes(field),`missing result field ${field}`);
}
assert.equal(Object.prototype.hasOwnProperty.call(contract,"responseFields"),false);
assert.equal(contract.policy.lp3UnifiedDecisionOutput,true);
assert.match(source,/reasonCode:\s*code/);
assert.match(source,/accessMode:/);
assert.match(source,/requiredAccess:/);
assert.doesNotMatch(source,/firebase-admin|firebase\/firestore|accessService/);
console.log("LP3_AUTHORIZE_OUTPUT_CONTRACT_TEST=GREEN");
