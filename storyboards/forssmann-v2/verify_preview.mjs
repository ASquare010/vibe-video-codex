// Test the image/audio player's scene and cut boundaries without opening or playing media.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const folder=process.argv[2]??'storyboard-v2';assert.ok(['storyboard-v2','storyboard-v3'].includes(folder));
const file='data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625/'+folder+'/review.html';
const source=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
class Element{children=[];classList={add(){},remove(){}};append(e){this.children.push(e)}setAttribute(){} }
class FakeAudio{currentTime=0;constructor(src){this.src=src}pause(){}play(){throw new Error('Verification must not play media')}addEventListener(){} }
const elements=new Map(),context=vm.createContext({document:{getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)},createElement(){return new Element()}},Audio:FakeAudio,Image:Element,requestAnimationFrame(){}});
vm.runInContext(source,context);
assert.equal(elements.get('grid').children.length,60);
assert.equal(elements.get('scene').children.length,4);
const cuts=JSON.parse(vm.runInContext('JSON.stringify(board.cuts)',context));
for(const c of cuts){
  vm.runInContext(`seek(${c.globalStartFrame})`,context);
  assert.equal(elements.get('hero').src,c.image);
  assert.ok(elements.get('cut').textContent.startsWith(c.id));
  vm.runInContext(`seek(${c.globalStartFrame+c.durationFrames-1})`,context);
  assert.equal(elements.get('hero').src,c.image);
}
const starts=JSON.parse(vm.runInContext('JSON.stringify(starts)',context));
for(const [i,frame] of starts.entries()){
  vm.runInContext(`seek(${frame})`,context);
  assert.equal(vm.runInContext('si',context),i);
  assert.equal(vm.runInContext('audios[si].currentTime',context),0);
}
console.log('60 cut starts/ends and four audio scene boundaries passed; no media played.');
