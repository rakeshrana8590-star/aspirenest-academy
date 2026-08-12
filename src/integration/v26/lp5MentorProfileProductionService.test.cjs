"use strict";

const assert = require("node:assert/strict");
const {
  METHOD_POLICIES,
  fileToPayload,
  createLp5MentorProfileProductionService,
} = require("./lp5MentorProfileProductionService");

(async()=>{
  assert.equal(Object.keys(METHOD_POLICIES).length,11);
  assert.equal(METHOD_POLICIES.loadMentorProfessionalProfile.phase,"5.1");
  assert.equal(METHOD_POLICIES.verifyMentorProfile.owner,"lp5MentorProfileService");

  const prepared=await fileToPayload({
    name:"mentor.png",
    type:"image/png",
    async arrayBuffer(){return Uint8Array.from([1,2,3,4]).buffer;},
  });
  assert.equal(prepared.contentType,"image/png");
  assert.equal(prepared.size,4);
  assert.ok(prepared.base64);

  const calls=[];
  const service=createLp5MentorProfileProductionService({
    async invokeAcademyOperation(payload){calls.push(payload);return {ok:true,state:{profile:{displayName:"Mentor"}}};},
  });

  const result=await service.invoke("saveMentorProfessionalProfile",{profile:{displayName:"Mentor"}},{requestId:"r1",correlationId:"c1"});
  assert.equal(result.ok,true);
  assert.equal(calls[0].method,"saveMentorProfessionalProfile");
  assert.equal(calls[0].meta.requestId,"r1");
  assert.equal(calls[0].meta.correlationId,"c1");
  assert.equal(calls[0].meta.clientPhase,"5.1");

  await service.invoke("uploadMentorProfilePhoto",{
    file:{
      name:"x.jpg",
      type:"image/jpeg",
      async arrayBuffer(){return Uint8Array.from([9,8,7]).buffer;},
    },
  });
  assert.equal(calls[1].payload.file.contentType,"image/jpeg");
  assert.equal(calls[1].payload.file.size,3);
  assert.equal(Object.prototype.hasOwnProperty.call(calls[1].payload.file,"arrayBuffer"),false);

  const denied=await service.invoke("unknown",{});
  assert.equal(denied.ok,false);
  assert.equal(denied.code,"LP5_METHOD_NOT_ALLOWED");

  console.log("LP5_MENTOR_PROFILE_BROWSER_SERVICE_TEST=PASS");
  console.log("METHODS=11");
})();
