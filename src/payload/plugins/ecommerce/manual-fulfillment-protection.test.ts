import { describe, expect, it } from "vitest";
import { protectPluginOrderLifecycle, authorizePluginOrderWrite } from "./order-lifecycle";
import { authorizeManualFulfillmentWrite } from "./manual-fulfillment-protection";
import { parseManualFulfillmentCommand } from "./manual-fulfillment-contract";
const id="11111111-1111-4111-8111-111111111111";
const original={id,status:"processing",lifecycle_status:"paid",payment_status:"paid",fulfillment_status:"unfulfilled",checkout_snapshot:{fulfillmentKind:"physical",items:[{quantity:1}]},fulfillment_history:null,manual_shipment:null};
const request=()=>({transactionID:"tx",user:{id,role:"admin",collection:"users"}});
const command=parseManualFulfillmentCommand(id,{action:"prepare",commandKey:"manual-command-0001",expectedRevision:0,reason:"Begin preparation"});
const run=(req:object,data:object,originalDoc:object=original)=>protectPluginOrderLifecycle({req,data,originalDoc,operation:"update"} as never);
describe("manual fulfillment exact write receipt",()=>{
 it("denies direct fulfillment/audit updates even with general settlement authority",async()=>{
  for(const data of [{fulfillment_status:"preparing"},{manual_shipment:{carrier:"hanjin"}},{fulfillment_history:[]}]){
   const req=request();authorizePluginOrderWrite(req);
   await expect(run(req,data)).rejects.toThrow("fulfillment-write-forbidden");
  }
 });
 it("authorizes exactly one matching append on the original request and transaction",async()=>{
  const req=request();const patch=authorizeManualFulfillmentWrite(req as never,{order:original,command,commandId:"operator:1",now:new Date()});
  await expect(run({...req},patch)).rejects.toThrow("fulfillment-write-forbidden");
  await expect(run(req,patch)).resolves.toMatchObject(patch);
  await expect(run(req,patch)).rejects.toThrow("fulfillment-write-forbidden");
 });
 it("denies changed actor/transaction, audit prefix edits and financial fields",async()=>{
  for(const tamper of ["transaction","actor","history","payment"]){
   const req=request();const patch=authorizeManualFulfillmentWrite(req as never,{order:original,command,commandId:"operator:1",now:new Date()});
   if(tamper==="transaction")req.transactionID="other";
   if(tamper==="actor")req.user.id="22222222-2222-4222-8222-222222222222";
   const data=tamper==="history"?{...patch,fulfillment_history:[{...patch.fulfillment_history[0],reason:"forged"}]}:tamper==="payment"?{...patch,payment_status:"refunded"}:patch;
   await expect(run(req,data)).rejects.toThrow("fulfillment-write-forbidden");
  }
 });
 it("rejects fulfilled creation and prepopulated shipment history",async()=>{
  for(const data of [{fulfillment_status:"shipped"},{fulfillment_history:[]},{manual_shipment:{carrier:"hanjin"}}])await expect(protectPluginOrderLifecycle({req:request(),data,operation:"create"} as never)).rejects.toThrow("fulfillment-write-forbidden");
 });
});
