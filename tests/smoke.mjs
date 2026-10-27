// Dependency-free smoke checks: render every route and exercise demo CRUD.
import assert from 'node:assert/strict';
const rootEvents={}, docEvents={}, session=new Map(), storage=new Map();
const root={innerHTML:'',addEventListener(type,handler){rootEvents[type]=handler}};
const toast={append(node){node.remove=()=>{};}};
let holder=null;
globalThis.window={HIORA_CONFIG:{},scrollTo(){},confirm(){return true}};
globalThis.sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)};
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
globalThis.document={
  querySelector(s){if(s==='#app')return root;if(s==='#toast-root')return toast;if(s==='#overlay-holder')return holder;return null},
  addEventListener(type,handler){docEvents[type]=handler},
  createElement(){return {innerHTML:'',addEventListener(){},remove(){holder=null}}},
  body:{append(el){holder=el}},
};
const rawFormData=globalThis.FormData;
globalThis.FormData=class FormDataMock{constructor(form){this.values=form.values}get(k){return this.values[k]??null}};
await import('../assets/app.js');
await new Promise(resolve=>setTimeout(resolve,10));
assert.match(root.innerHTML,/Good to see you, Hiora/);
assert.match(root.innerHTML,/Recent orders/);
const click=(action,id='')=>rootEvents.click({target:{closest:()=>({dataset:{action,id}})}});
for (const [target,needle] of [['orders','Every order, in one place'],['customers','Your Hiora community'],['attendance','Contact queue'],['analytics','Understand your growth'],['settings','Workspace information']]){
  click(target);assert.match(root.innerHTML,new RegExp(needle));
}
async function submit(kind,values){const button={disabled:false};const form={dataset:{submit:kind},values,querySelector:()=>button};await docEvents.submit({target:{closest:()=>form},preventDefault(){}})}
click('new-customer');assert.match(holder.innerHTML,/Add a customer/);
await submit('save-customer',{name:'Test Customer',phone:'01000000000',city:'Dhaka',address:'Test address',source:'Website',notes:'Test'});
let state=JSON.parse(storage.get('hiora_studio_demo_v2'));
assert.equal(state.customers[0].name,'Test Customer');
const customerId=state.customers[0].id;
click('new-order');assert.match(holder.innerHTML,/Create an order/);
await submit('save-order',{customer_id:customerId,order_code:'HIO-TEST-01',payment_method:'Cash on Delivery',quantity:'2',unit_price:'1580',delivery_area:'Dhaka',product_name:'Test lotion',notes:''});
state=JSON.parse(storage.get('hiora_studio_demo_v2'));
assert.equal(state.orders[0].total,3240);
click('log-contact',customerId);assert.match(holder.innerHTML,/Log customer attendance/);
await submit('save-contact',{type:'Call',outcome:'Contacted',notes:'Contacted successfully',next_followup_at:''});
state=JSON.parse(storage.get('hiora_studio_demo_v2'));
assert.equal(state.interactions[0].notes,'Contacted successfully');
assert.equal(state.customers[0].contact_status,'Contacted');
globalThis.FormData=rawFormData;
console.log('PASS: all 6 routes, create customer, create order and log customer attendance');
