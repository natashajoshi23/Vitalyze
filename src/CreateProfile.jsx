import { useState } from 'react';

export default function CreateProfile() {
  const [form,setForm]=useState({name:'',age:'',gender:''});
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState('');

  const submit=async e=>{
    e.preventDefault();
    if(!form.name||!form.age||!form.gender)return setError('Please fill in all fields.');
    setError('');setLoading(true);
    try{
      const res=await fetch('http://localhost:8080/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data=res.ok?await res.json():form;
      localStorage.setItem('user',JSON.stringify(data));setSuccess(true);
    }catch{localStorage.setItem('user',JSON.stringify(form));setSuccess(true);}
    finally{setLoading(false);}
  };

  const features=[
    {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,text:'6 biometric vitals tracked in real time'},
    {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff9e99" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,text:'Clinical risk analysis with severity alerts'},
    {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c4b4" strokeWidth="2" strokeLinecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>,text:'FDA drug database integration'},
    {icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c4b4" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,text:'AI-powered health summaries'},
  ];

  return(
    <div style={s.page}>
      {/* Left — navy/teal (blue-dominant) */}
      <div style={s.left}>
        <svg width="100%" height="36" viewBox="0 0 500 36" fill="none" style={{marginBottom:36,opacity:.4}}>
          <path d="M0,18 L80,18 L100,18 L115,3 L130,33 L140,1 L152,35 L165,18 L210,18 L240,18 L255,6 L270,30 L285,18 L340,18 L360,18 L375,4 L390,32 L405,18 L500,18" stroke="#00c4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#00c4b4" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:'1.3rem',fontWeight:300,color:'#fff'}}>Vitalyze</span>
        </div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:'clamp(1.8rem,3vw,2.6rem)',fontWeight:300,color:'#fff',lineHeight:1.15,letterSpacing:'-.025em',marginBottom:16}}>
          Your health,<br/><em style={{color:'#00c4b4'}}>clearly understood.</em>
        </h2>
        <p style={{fontSize:15,color:'rgba(255,255,255,0.55)',lineHeight:1.7,marginBottom:40}}>Track your vitals, understand your medications, and take control of your health journey.</p>
        {features.map((f,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <div style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{f.icon}</div>
            <span style={{fontSize:14,color:'rgba(255,255,255,0.8)',fontWeight:500}}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right — form with red CTA (red contrasts beautifully against the blue left panel) */}
      <div style={s.right}>
        <div style={s.fc}>
          {success?(
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <div style={s.si}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:300,fontSize:'1.4rem',color:'var(--text-primary)',marginBottom:8}}>Profile Created!</h2>
              <p style={{fontSize:14,color:'var(--text-muted)'}}>You're all set. Start tracking your vitals.</p>
            </div>
          ):(
            <>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em',color:'#0a4a5c',marginBottom:10}}>Get Started</div>
                <h1 style={{fontFamily:"'Fraunces',serif",fontSize:'1.6rem',fontWeight:300,letterSpacing:'-.02em',color:'var(--text-primary)',marginBottom:6}}>Create Your Profile</h1>
                <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.6}}>Enter your basic info to personalise your health dashboard.</p>
              </div>
              <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:16}}>
                {[{n:'name',l:'Full Name',p:'Jane Smith',t:'text'},{n:'age',l:'Age',p:'42',t:'number',min:0,max:130}].map(f=>(
                  <div key={f.n}>
                    <label style={s.lbl}>{f.l}</label>
                    <input name={f.n} type={f.t} placeholder={f.p} value={form[f.n]} min={f.min} max={f.max} onChange={e=>{if(f.t==="number"&&e.target.value!==""){const n=parseFloat(e.target.value);if(f.min!==undefined&&n<f.min)return;if(f.max!==undefined&&n>f.max)return;}setForm(p=>({...p,[e.target.name]:e.target.value}))}} style={s.inp}/>
                  </div>
                ))}
                <div>
                  <label style={s.lbl}>Gender</label>
                  <select name="gender" value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))} style={{...s.inp,cursor:'pointer'}}>
                    <option value="" disabled>Select gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Transgender Female</option>
                    <option>Transgender Male</option>
                    <option>Genderqueer</option>
                    <option>Prefer not to say</option>
                    <option>Other</option>
                  </select>
                </div>
                {error&&<div style={s.err}>{error}</div>}
                {/* Red button — the action that completes the blue journey */}
                <button type="submit" disabled={loading} style={{...s.redBtn,opacity:loading?.7:1}}>
                  {loading?'Creating…':'Create Profile →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s={
  page:{display:'flex',minHeight:'100vh',fontFamily:"'DM Sans',sans-serif"},
  left:{flex:1,background:'linear-gradient(160deg,#0a4a5c 0%,#0d6b80 50%,#008a7d 100%)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'48px 40px',position:'relative',overflow:'hidden'},
  right:{width:480,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 40px',background:'var(--bg)'},
  fc:{width:'100%',maxWidth:380,background:'var(--surface)',borderRadius:22,border:'1px solid var(--border)',padding:'36px 32px',boxShadow:'var(--shadow-lg)'},
  lbl:{display:'block',fontSize:13,fontWeight:500,color:'var(--text-secondary)',marginBottom:5},
  inp:{width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface-2)',fontSize:14,color:'var(--text-primary)',fontFamily:'inherit',outline:'none',boxSizing:'border-box'},
  err:{background:'var(--red-soft)',border:'1px solid var(--red-border)',borderRadius:9,padding:'10px 14px',fontSize:13,color:'#8b2020',fontWeight:500},
  redBtn:{width:'100%',padding:13,borderRadius:11,border:'none',background:'linear-gradient(135deg,#8b2020,#e8453c)',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(139,32,32,0.35)',marginTop:4},
  si:{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 6px 20px rgba(10,74,92,0.3)'},
};