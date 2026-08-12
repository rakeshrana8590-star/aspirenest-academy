"use strict";

const assert = require("node:assert/strict");
const {
  METHODS,
  OWNER,
  PHASE,
  sanitizeVisibility,
  sanitizeEntry,
  sanitizeProfessionalProfileInput,
  publicProjection,
  fullProfileProjection,
  createLp5MentorProfileAuthority,
} = require("./lp5MentorProfileAuthority");

class FakeDocSnapshot {
  constructor(id, value) {
    this.id = id;
    this._value = value;
    this.exists = value !== undefined;
  }
  data() { return this._value; }
}
class FakeDocRef {
  constructor(store, path) { this.store=store; this.path=path; }
  async get() { return new FakeDocSnapshot(this.path.split("/").pop(), this.store.get(this.path)); }
  async set(value, options={}) {
    const prev=this.store.get(this.path);
    this.store.set(this.path, options && options.merge && prev ? deepMerge(prev,value) : clone(value));
  }
  collection(name) { return new FakeCollectionRef(this.store, `${this.path}/${name}`); }
}
class FakeCollectionRef {
  constructor(store,path){this.store=store;this.path=path;}
  doc(id){return new FakeDocRef(this.store,`${this.path}/${id}`);}
  async get(){
    const prefix=this.path+"/";
    const docs=[];
    for(const [path,value] of this.store.entries()){
      if(!path.startsWith(prefix)) continue;
      const rest=path.slice(prefix.length);
      if(rest.includes("/")) continue;
      docs.push(new FakeDocSnapshot(rest,value));
    }
    return { docs };
  }
}
class FakeFirestore {
  constructor(seed={}){this.store=new Map(Object.entries(seed).map(([k,v])=>[k,clone(v)]));}
  collection(name){return new FakeCollectionRef(this.store,name);}
}
const clone=(x)=>JSON.parse(JSON.stringify(x));
const deepMerge=(a,b)=>{
  if(!a||typeof a!=="object"||Array.isArray(a)) return clone(b);
  const out=clone(a);
  for(const [k,v] of Object.entries(b||{})){
    out[k]=v&&typeof v==="object"&&!Array.isArray(v)&&out[k]&&typeof out[k]==="object"&&!Array.isArray(out[k])
      ? deepMerge(out[k],v) : clone(v);
  }
  return out;
};

const savedObjects=new Map();
const storage={
  bucket(){
    return {
      file(path){
        return {
          async save(bytes,options){savedObjects.set(path,{bytes:Buffer.from(bytes),options});},
          async delete(){savedObjects.delete(path);},
          async getSignedUrl(){return [`https://signed.example/${encodeURIComponent(path)}?sig=1`];},
        };
      },
    };
  },
};

(async()=>{
  assert.equal(Object.keys(METHODS).length,11);
  assert.equal(OWNER,"lp5MentorProfileService");
  assert.equal(PHASE,"5.1");

  const visibility=sanitizeVisibility({publicProfile:true,studentProfile:true,showContact:false,showPhoto:true});
  assert.equal(visibility.publicProfile,true);
  assert.equal(visibility.showContact,false);

  const entry=sanitizeEntry({id:"e1",title:"Book",type:"Book",visibility:"Private",junk:"x"});
  assert.equal(entry.id,"e1");
  assert.equal(entry.visibility,"Private");
  assert.equal(Object.prototype.hasOwnProperty.call(entry,"junk"),false);

  const input=sanitizeProfessionalProfileInput({
    displayName:"Dr. Mentor",headline:"Academic Mentor",qualification:"Ph.D.",
    currentRole:"Professor",languages:["English"],visibility:{publicProfile:true,studentProfile:true},
    privatePhone:"999",
  });
  assert.equal(input.displayName,"Dr. Mentor");
  assert.equal(Object.prototype.hasOwnProperty.call(input,"privatePhone"),false);

  const canonical={
    mentorUid:"mentor-1",role:"mentor",
    professionalProfile:{
      id:"mentor-1",displayName:"Dr. Mentor",headline:"Academic Mentor",bio:"Bio",
      qualification:"Ph.D.",currentRole:"Professor",publicEmail:"private@example.com",
      publicStatus:"Published",verificationStatus:"verified",
      visibility:{publicProfile:true,studentProfile:true,showContact:false,showPhoto:true,showBooks:true,showResearch:true,showAchievements:true},
      entries:[{id:"e1",type:"Book",title:"Visible Book",visibility:"Public"}],
      photo:{status:"approved",storagePath:"mentor-professional/mentor-1/profile.jpg",contentType:"image/jpeg"},
    }
  };
  const pub=await publicProjection({mentorUid:"mentor-1",canonical,storage,now:()=>1000,audience:"public"});
  assert.equal(pub.displayName,"Dr. Mentor");
  assert.equal(pub.publicEmail,undefined);
  assert.match(pub.photo,/^https:\/\/signed\.example\//);
  assert.equal(Object.prototype.hasOwnProperty.call(pub,"photoState"),false);

  const hidden=await publicProjection({
    mentorUid:"mentor-1",
    canonical:{...canonical,professionalProfile:{...canonical.professionalProfile,verificationStatus:"unverified"}},
    storage,now:()=>1000,audience:"public"
  });
  assert.equal(hidden,null);

  const full=await fullProfileProjection({canonical,mentorUid:"mentor-1",storage,now:()=>1000});
  assert.equal(full.publicEmail,"private@example.com");
  assert.equal(full.photoState.storagePath,"mentor-professional/mentor-1/profile.jpg");
  assert.match(full.photo,/signed\.example/);

  const firestore=new FakeFirestore({
    "roleAuthorities/mentor-1":{uid:"mentor-1",role:"mentor",activeRole:"mentor",accountStatus:"active"},
    "mentorProfiles/mentor-1":{mentorUid:"mentor-1",role:"mentor",status:"active",displayName:"Dr. Mentor"},
  });
  let tick=0;
  const authority=createLp5MentorProfileAuthority({
    firestore,storage,serverTimestamp:()=>({server:true,tick:++tick}),now:()=>1700000000000,
  });

  const auth={uid:"mentor-1",token:{email:"mentor@example.com"}};
  const saved=await authority.operation(auth,{
    method:"saveMentorProfessionalProfile",
    payload:{profile:{displayName:"Dr. Mentor",headline:"New Headline",qualification:"Ph.D.",visibility:{publicProfile:true,studentProfile:true}}},
    meta:{requestId:"r1",correlationId:"c1"},
  });
  assert.equal(saved.ok,true);
  assert.equal(saved.state.profile.headline,"New Headline");
  const persisted=firestore.store.get("mentorProfiles/mentor-1");
  assert.equal(persisted.professionalProfile.headline,"New Headline");
  assert.equal(persisted.role,"mentor");
  assert.equal([...firestore.store.keys()].filter(k=>k.startsWith("lp5AuditLogs/")).length,1);

  let failed=false;
  try {
    await authority.operation(auth,{method:"publishMentorProfessionalProfile",payload:{status:"Published"}});
  } catch (e) {
    failed=e.lp5Code==="FAILED_PRECONDITION";
  }
  assert.equal(failed,true);

  const upload=await authority.operation(auth,{
    method:"uploadMentorProfilePhoto",
    payload:{file:{contentType:"image/jpeg",base64:Buffer.from("fake-image").toString("base64")}},
  });
  assert.equal(upload.state.profile.photoState.status,"pending_review");
  assert.equal(upload.state.profile.visibility.showPhoto,false);
  assert.equal(savedObjects.has("mentor-professional/mentor-1/profile.jpg"),true);

  console.log("LP5_MENTOR_PROFILE_AUTHORITY_TEST=PASS");
  console.log("METHODS=11");
})();
