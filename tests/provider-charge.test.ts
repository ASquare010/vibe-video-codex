import {test} from 'node:test';import assert from 'node:assert/strict';import {providerCharge} from '../shared/provider-charge.ts';
test('native video rates distinguish Standard and Fast instead of silently undercounting Standard',()=>{
 assert.equal(providerCharge({provider:'veo',model:'veo-3.1-generate-001',nativeSeconds:4},{}).amount,1.6);
 assert.equal(providerCharge({provider:'veo',model:'veo-3.1-fast-generate-001',nativeSeconds:4},{}).amount,.4);
 assert.throws(()=>providerCharge({provider:'veo',model:'unknown',nativeSeconds:4},{}),/Missing verified/);
});
test('only explicit no-charge evidence is zero; unconfirmed failures stay unknown and verified Higgs refunds are recorded',()=>{
 const j={provider:'veo' as const,model:'veo-3.1-generate-001',nativeSeconds:4};
 assert.deepEqual(providerCharge(j,{done:true,error:{code:3}}).amount,null);
 const free=providerCharge(j,{done:true,response:{raiMediaFilteredReasons:['You will not be charged for blocked videos.']}});assert.equal(free.amount,0);assert.equal(free.status,'recorded');
 const refund=providerCharge({provider:'higgsfield',model:'seedance_2_0',nativeSeconds:4,quoteCredits:10},{status:'failed',verifiedChargeCredits:0,chargeEvidence:'Refund confirmed'});assert.equal(refund.amount,0);assert.equal(refund.status,'recorded');
});
