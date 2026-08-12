const fs=require('node:fs');
const path=require('node:path');
const {before,after,afterEach,test}=require('node:test');
const {assertFails,assertSucceeds,initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {ref,getBytes,uploadBytes}=require('firebase/storage');
const PROJECT_ID='aspirenest-rules-test';
let env;
const storageAddress=()=>{const raw=process.env.FIREBASE_STORAGE_EMULATOR_HOST||'127.0.0.1:9199';const [host,port]=raw.split(':');return {host,port:Number(port)}};
before(async()=>{const {host,port}=storageAddress();env=await initializeTestEnvironment({projectId:PROJECT_ID,storage:{host,port,rules:fs.readFileSync(path.resolve(__dirname,'../../storage.rules'),'utf8')}})});
afterEach(async()=>{await env.clearStorage()});
after(async()=>{await env.cleanup()});
const ctx=(uid,email)=>env.authenticatedContext(uid,{email}).storage();
const admin=()=>ctx('admin-uid','aspirenestplatform@gmail.com');
const student=()=>ctx('student-uid','student@example.com');
const other=()=>ctx('other-uid','other@example.com');
const anon=()=>env.unauthenticatedContext().storage();
const seed=async(pathname)=>env.withSecurityRulesDisabled(async(context)=>uploadBytes(ref(context.storage(),pathname),new Uint8Array([1,2,3])));
for(const pathname of ['notes/premium/a.pdf','currentAffairs/private/a.pdf','videos/premium/a.mp4','mockTests/private/a.json','roadmaps/private/a.pdf','intellibook/private/a.bin']){
  test(`protected direct read denied: ${pathname}`,async()=>{await seed(pathname);await assertFails(getBytes(ref(student(),pathname)));await assertFails(getBytes(ref(anon(),pathname)));await assertSucceeds(getBytes(ref(admin(),pathname)))});
}
test('profile owner boundary',async()=>{await seed('profiles/student-uid/avatar.png');await assertSucceeds(getBytes(ref(student(),'profiles/student-uid/avatar.png')));await assertFails(getBytes(ref(other(),'profiles/student-uid/avatar.png')));await assertSucceeds(getBytes(ref(admin(),'profiles/student-uid/avatar.png')))});
test('student cannot write protected asset',async()=>{await assertFails(uploadBytes(ref(student(),'notes/premium/new.pdf'),new Uint8Array([4])));await assertSucceeds(uploadBytes(ref(admin(),'notes/premium/new.pdf'),new Uint8Array([4])))});
