export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,x-admin-key');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(req.headers['x-admin-key']!==process.env.ADMIN_KEY)return res.status(401).json({error:'غير مصرح'});
  const BID=process.env.JSONBIN_BIN_ID,BK=process.env.JSONBIN_API_KEY,AK=process.env.ANTHROPIC_API_KEY;
  const{id,action,notes}=req.body;
  if(!id||!action)return res.status(400).json({error:'بيانات ناقصة'});
  try{
    const r1=await fetch(`https://api.jsonbin.io/v3/b/${BID}/latest`,{headers:{'X-Master-Key':BK}});
    const d1=await r1.json();
    const list=(d1.record&&d1.record.requests)?d1.record.requests:[];
    const idx=list.findIndex(r=>r.id===id);
    if(idx===-1)return res.status(404).json({error:'الطلب غير موجود'});
    const item=list[idx];
    item.adminNotes=notes||'';
    item.reviewedAt=new Date().toISOString();
    if(action==='rejected'){
      item.status='rejected';list[idx]=item;
      await fetch(`https://api.jsonbin.io/v3/b/${BID}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':BK},body:JSON.stringify({requests:list})});
      return res.status(200).json({success:true,status:'rejected'});
    }
    const cn=parseFloat(String(item.costConstruction||'0').replace(/,/g,''))||0;
    const sn=Math.round(cn*0.10),tot=cn+sn,opx=Math.round(tot*0.00025*30),grd=tot+opx,dn=parseInt(item.duration)||12;
    const fn=n=>Number(n).toLocaleString('ar-SA');
    const info=`المشروع: ${item.projectName} | الموقع: ${item.location||'جامعة أم القرى'} | النوع: ${item.projectType} | الوصف: ${item.description} | المبررات: ${item.justification||''} | التكلفة: ${fn(cn)} ريال | الإشراف: ${fn(sn)} ريال | الإجمالي: ${fn(tot)} ريال | المدة: ${item.duration} شهر | المستفيد: ${item.beneficiary||'منسوبو الجامعة'}`;
    const SYS='أنت خبير استشاري لدراسات الجدوى. أجب بنص عربي فقط. استخدم العلامات المحددة.';
    const q1=`بيانات: ${info}\n\nاكتب:\n\nVISION:\n[4 جمل رؤية 2030]\n\nPROGRAMS:\n- [ب1]\n- [ب2]\n- [ب3]\n\nOBJECTIVES:\n- [ه1]\n- [ه2]\n- [ه3]\n- [ه4]\n- [ه5]\n\nOBJ_D1:\n[شرح1]\n\nOBJ_D2:\n[شرح2]\n\nOBJ_D3:\n[شرح3]\n\nPROBLEMS:\n- [م1]\n- [م2]\n- [م3]\n\nPI1:\n[أثر1]\n\nPI2:\n[أثر2]\n\nPI3:\n[أثر3]\n\nALIGNMENT:\n[3 جمل]\n\nSITUATION:\n[3 جمل]\n\nDEMAND:\n[4 جمل]\n\nURGENCY:\n[جملتان]\n\nNEG1:\n[ت1]\n\nNEG2:\n[ت2]\n\nNEG3:\n[ت3]\n\nNEG4:\n[ت4]\n\nBEN_A:\n[أمني]\n\nBEN_S:\n[اجتماعي]\n\nBEN_U:\n[عمراني]\n\nBEN_O:\n[تشغيلي]\n\nCONTRACT:\n[4 جمل]\n\nPAYMENT:\n[جدول دفعات]\n\nPROCS:\n- [و1]\n- [و2]\n- [و3]\n- [و4]\n- [و5]`;
    const q2=`بيانات: ${info}\nمدة: ${dn} شهر\n\nاكتب:\n\nVE1:\n[مقترح1]\n\nVE2:\n[مقترح2]\n\nVE3:\n[مقترح3]\n\nVE4:\n[مقترح4]\n\nR1:\n[خطر1]\n\nR1M:\n[م1]\n\nR2:\n[خطر2]\n\nR2M:\n[م2]\n\nR3:\n[خطر3]\n\nR3M:\n[م3]\n\nR4:\n[خطر4]\n\nR4M:\n[م4]\n\nR5:\n[خطر5]\n\nR5M:\n[م5]\n\nR6:\n[خطر6]\n\nR6M:\n[م6]`;
    const H={'Content-Type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'};
    const call=async q=>{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:H,body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:3000,system:SYS,messages:[{role:'user',content:q}]})});const d=await r.json();return d.content?d.content.map(b=>b.text||'').join(''):'';}
    const[t1,t2]=await Promise.all([call(q1),call(q2)]);
    item.status='generated';item.generatedData={t1,t2,cn,sn,tot,opx,grd,dn};
    list[idx]=item;
    await fetch(`https://api.jsonbin.io/v3/b/${BID}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':BK},body:JSON.stringify({requests:list})});
    return res.status(200).json({success:true,status:'generated'});
  }catch(e){return res.status(500).json({error:e.message});}
}
