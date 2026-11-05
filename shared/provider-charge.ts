type NativeJob={provider:'veo'|'higgsfield';model:string;nativeSeconds:number;unitPriceUsdPerSecond?:number;quoteCredits?:number};
export function providerCharge(j:NativeJob,status:any):{amount:number|null;status:'recorded'|'estimate'|'unpriced';notes:string}{
 const failed=j.provider==='veo'?Boolean(status.done&&(status.error||!status.response?.videos?.length)):['failed','nsfw','ip_detected','canceled'].includes(status.status);
 if(j.provider==='higgsfield'&&typeof status.verifiedChargeCredits==='number')return {amount:status.verifiedChargeCredits,status:'recorded',notes:status.chargeEvidence||'Verified provider charge.'};
 const reasons:string[]=status.response?.raiMediaFilteredReasons||[];
 if(j.provider==='veo'&&failed&&reasons.some(r=>/will not be charged/i.test(r)))return {amount:0,status:'recorded',notes:'Provider explicitly reports no charge for this blocked video. '+reasons.join(' ')};
 if(failed)return {amount:null,status:'unpriced',notes:'Failed/filtered request; final charge not confirmed. Do not retry automatically.'};
 const rate=j.unitPriceUsdPerSecond??({'veo-3.1-generate-001':.4,'veo-3.1-fast-generate-001':.1} as Record<string,number>)[j.model];
 const amount=j.provider==='veo'?j.nativeSeconds*rate:j.quoteCredits;
 if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0)throw new Error('Missing verified model rate / live credit quote');
 return {amount,status:'estimate',notes:'Accepted request reserved at its quoted/published model-specific rate; verify billing. No automatic retries.'};
}
