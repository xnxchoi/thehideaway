import { describe, expect, it } from "vitest";
import { parseManualFulfillmentCommand, planManualFulfillment } from "./manual-fulfillment-contract";
const id="11111111-1111-4111-8111-111111111111";
const common={commandKey:"manual-command-0001",expectedRevision:0,reason:"Operator update"};
const now=new Date("2026-09-14T07:00:00.000Z");
const order={id,lifecycle_status:"paid",payment_status:"paid",fulfillment_status:"unfulfilled",status:"processing",reconciliation_required:false,checkout_snapshot:{fulfillmentKind:"physical",items:[{quantity:2},{quantity:1}]},fulfillment_history:null,manual_shipment:null};
const dispatch={...common,action:"dispatch",carrier:"cj_logistics",trackingNumber:"1234567890",shippedAt:"2026-09-14T06:00:00.000Z",lines:[{snapshotIndex:0,quantity:2},{snapshotIndex:1,quantity:1}]};
const plan=(input:unknown,record:Record<string,unknown>=order)=>planManualFulfillment({order:record,command:parseManualFulfillmentCommand(id,input),actorId:id,commandId:"operator:command-1",now});
describe("manual fulfillment command contract",()=>{
 it("rejects client authority, URL and partial correction properties",()=>{
  for(const extra of [{actorId:id},{trackingUrl:"https://evil.test"},{payment_status:"paid"}])expect(()=>parseManualFulfillmentCommand(id,{...dispatch,...extra})).toThrow("invalid-fulfillment-command");
  expect(()=>parseManualFulfillmentCommand(id,{...common,action:"correct_tracking",carrier:"cj_logistics",trackingNumber:"1234",shippedAt:dispatch.shippedAt})).toThrow();
 });
 it("rejects invalid revision, dates, malformed identity and blank reasons",()=>{
  for(const change of [{expectedRevision:-1},{expectedRevision:0.5},{reason:" "},{commandKey:"short"},{shippedAt:"September 14"},{lines:[{snapshotIndex:0,quantity:1.5}]}])expect(()=>parseManualFulfillmentCommand(id,{...dispatch,...change})).toThrow();
  expect(()=>parseManualFulfillmentCommand("not-uuid",dispatch)).toThrow();
 });
 it("records preparation separately from payment and from a parcel",()=>{
  const patch=plan({...common,action:"prepare"});
  expect(patch.fulfillment_status).toBe("preparing");expect(patch.manual_shipment).toBeNull();
  expect(patch.fulfillment_history).toHaveLength(1);
  expect(patch.fulfillment_history[0]).toMatchObject({action:"prepare",actorId:id,reason:common.reason,recordedAt:now.toISOString(),revision:1,before:{status:"unfulfilled",shipment:null},after:{status:"preparing",shipment:null}});
  expect(patch).not.toHaveProperty("payment_status");
 });
 it("requires preparation and every immutable snapshot line at full quantity",()=>{
  expect(()=>plan(dispatch)).toThrow("fulfillment-transition-invalid");
  const preparing={...order,fulfillment_status:"preparing"};
  for(const lines of [[dispatch.lines[0]],[...dispatch.lines,dispatch.lines[0]],[{snapshotIndex:0,quantity:1},dispatch.lines[1]]])expect(()=>plan({...dispatch,lines},preparing)).toThrow("fulfillment-line-coverage-invalid");
  expect(plan(dispatch,preparing).manual_shipment).toMatchObject({carrier:"cj_logistics",trackingNumber:"1234567890",shippedAt:dispatch.shippedAt,dispatchedRecordedAt:now.toISOString(),deliveredAt:null,lines:dispatch.lines});
 });
 it("rejects unpaid, refunded, canceled, reconciliation and unknown snapshots",()=>{
  for(const change of [{payment_status:"pending"},{payment_status:"partially_refunded"},{lifecycle_status:"canceled"},{reconciliation_required:true},{checkout_snapshot:{items:[{quantity:1}]}},{checkout_snapshot:{fulfillmentKind:"digital",items:[{quantity:1}]}}])expect(()=>plan({...common,action:"prepare"},{...order,...change})).toThrow();
 });
 it("rejects stale revisions, second parcels and future effective dates",()=>{
  expect(()=>plan({...common,action:"prepare",expectedRevision:1})).toThrow("fulfillment-revision-conflict");
  expect(()=>plan({...dispatch,shippedAt:"2026-09-15T06:00:00.000Z"},{...order,fulfillment_status:"preparing"})).toThrow("fulfillment-date-invalid");
  const shipped=plan(dispatch,{...order,fulfillment_status:"preparing"});
  expect(()=>plan({...dispatch,expectedRevision:1},{...order,...shipped})).toThrow("fulfillment-transition-invalid");
 });
 it("requires explicit delivery and retains prefix and dispatch facts for tracking corrections",()=>{
  const shipped=plan(dispatch,{...order,fulfillment_status:"preparing"});
  const corrected=plan({...common,expectedRevision:1,action:"correct_tracking",carrier:"hanjin",trackingNumber:"99999"},{...order,...shipped});
  expect(corrected.fulfillment_status).toBe("shipped");expect(corrected.fulfillment_history[0]).toEqual(shipped.fulfillment_history[0]);
  expect(corrected.manual_shipment).toMatchObject({shippedAt:dispatch.shippedAt,lines:dispatch.lines,deliveredAt:null,trackingNumber:"99999"});
  expect(()=>plan({...common,expectedRevision:2,action:"confirm_delivery",deliveredAt:"2026-09-13T06:00:00.000Z"},{...order,...corrected})).toThrow("fulfillment-date-invalid");
  const delivered=plan({...common,expectedRevision:2,action:"confirm_delivery",deliveredAt:now.toISOString()},{...order,...corrected});
  expect(delivered.fulfillment_status).toBe("delivered");expect(delivered.manual_shipment?.deliveredAt).toBe(now.toISOString());
 });
});
