import fs from 'node:fs/promises';

const BASE='https://mmd-tw.com';
const headers={
  'accept':'application/json',
  'user-agent':'AminoD701-GPT-live-data/1.0 (+https://aminod701.github.io/GPT/)'
};

async function getJson(url){
  const res=await fetch(url,{headers});
  if(!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

function absUrl(url){
  if(!url) return '';
  try{return new URL(url,BASE).href;}catch{return url;}
}

async function fetchBlackHole(){
  const data=await getJson(BASE+'/api/black-hole');
  return {
    source:'mmd-tw.com/api/black-hole',
    fetchedAt:new Date().toISOString(),
    ...data
  };
}

async function fetchMarket(){
  const all=[];
  let after='';
  let page=0;
  const seen=new Set();
  do{
    const url=BASE+'/api/market/catalog'+(after?'?after='+encodeURIComponent(after):'');
    const data=await getJson(url);
    const items=Array.isArray(data?.items)?data.items:[];
    for(const item of items){
      all.push({...item,image_url:absUrl(item?.image_url)});
    }
    const next=data?.next==null?'':String(data.next);
    if(!next||seen.has(next)) break;
    seen.add(next);
    after=next;
    page++;
    if(page>=100) throw new Error('market catalog exceeded 100 pages');
    await new Promise(r=>setTimeout(r,250));
  }while(after);

  return {
    source:'mmd-tw.com/api/market/catalog',
    fetchedAt:new Date().toISOString(),
    count:all.length,
    items:all
  };
}

await fs.mkdir('data',{recursive:true});
const [blackHole,market]=await Promise.all([fetchBlackHole(),fetchMarket()]);
await Promise.all([
  fs.writeFile('data/black-hole.json',JSON.stringify(blackHole,null,2)+'\n'),
  fs.writeFile('data/market-catalog.json',JSON.stringify(market,null,2)+'\n')
]);
console.log(`black-hole updated; market items: ${market.count}`);
