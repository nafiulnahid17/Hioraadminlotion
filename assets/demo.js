const STORE = 'hiora_studio_demo_v2';
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
const ahead = (days) => new Date(Date.now() + days * 86400000).toISOString();
const names = ['Nusrat Jahan','Sadia Rahman','Tasnim Ahmed','Faria Islam','Mim Akter','Raisa Chowdhury','Ayesha Siddika','Maisha Khan','Jannatul Ferdous','Sumaiya Sultana','Shamima Akter','Farhana Yasmin'];
const city = ['Dhaka','Chattogram','Rajshahi','Sylhet','Dhaka','Khulna','Cumilla','Dhaka','Barishal','Gazipur','Dhaka','Bogura'];
const stages = ['New','Confirmed','Shipped','Delivered','Confirmed','Packed','Delivered','New','Shipped','Delivered','Cancelled','Confirmed'];
const methods = ['Cash on Delivery','bKash','Cash on Delivery','Nagad','Cash on Delivery','bKash'];
const due = [-2,-1,0,1,2,3,null,-1,1,4,null,0];
const sources = ['Website','Facebook','Website','WhatsApp','Facebook','Website','Facebook','Website','WhatsApp','Facebook','Website','Website'];
function starter() {
  const customers = names.map((name,i)=>({
    id:`demo-c-${i+1}`,name,phone:`0100000${String(i+1).padStart(4,'0')}`,email:'',city:city[i],address:`Demo address, ${city[i]}`,source:sources[i],
    contact_status:['New','Contacted','Follow-up','Converted','No answer','Contacted','Converted','New','Follow-up','Converted','Contacted','New'][i],
    last_contacted_at: i%3?ago(i+1):null,next_followup_at: due[i]===null?null:ahead(due[i]),notes:'',created_at:ago(i*2+1),updated_at:ago(i+1)
  }));
  const orders = customers.map((c,i)=>({
    id:`demo-o-${i+1}`,order_code:`HIO-${String(2401+i).padStart(4,'0')}`,customer_id:c.id,
    product_name:'APLB Glutathione Niacinamide Body Lotion 300ml',quantity:i===3?2:1,unit_price:1580,
    delivery_charge:city[i]==='Dhaka'?80:150,total:(i===3?2:1)*1580+(city[i]==='Dhaka'?80:150),
    payment_method:methods[i%methods.length],payment_status:stages[i]==='Delivered'?'Paid':i===10?'Refunded':'Unpaid',
    status:stages[i],courier:'',tracking_number:'',notes:'',created_at:ago(i*1.6+0.8),updated_at:ago(i*.8)
  }));
  const interactions = [{id:'demo-i-1',customer_id:'demo-c-3',order_id:'demo-o-3',type:'Call',outcome:'Follow-up',notes:'Asked about delivery timeline.',next_followup_at:ahead(0),created_at:ago(1)},
  {id:'demo-i-2',customer_id:'demo-c-6',order_id:null,type:'WhatsApp',outcome:'Contacted',notes:'Confirmed interest in product.',next_followup_at:ahead(2),created_at:ago(2)},
  {id:'demo-i-3',customer_id:'demo-c-9',order_id:null,type:'Call',outcome:'No answer',notes:'Try again during business hours.',next_followup_at:ahead(1),created_at:ago(1)}];
  return {customers,orders,interactions};
}
export function loadDemo() {
  try {
    const d=JSON.parse(localStorage.getItem(STORE)||'null');
    if(d && Array.isArray(d.orders)&&Array.isArray(d.customers)&&Array.isArray(d.interactions))return d;
  }catch{}
  return starter();
}
export function saveDemo(data) { localStorage.setItem(STORE,JSON.stringify(data)); }
export function resetDemo() { localStorage.removeItem(STORE); return starter(); }
