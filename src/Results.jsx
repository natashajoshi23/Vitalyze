import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CostAccessibility from './CostAccessibility';
import { supabase } from './supabase';
import useIsMobile from './useIsMobile';

const NR = {
  heartRate:              { min:60,  max:100, unit:'bpm',         label:'Heart Rate',       color:'#e8453c' },
  bloodPressureSystolic:  { min:90,  max:120, unit:'mmHg',        label:'BP Systolic',      color:'#8b2020' },
  bloodPressureDiastolic: { min:60,  max:80,  unit:'mmHg',        label:'BP Diastolic',     color:'#0a4a5c' },
  oxygenSaturation:       { min:95,  max:100, unit:'%',           label:'O₂ Saturation',    color:'#00c4b4' },
  temperature:            { min:97,  max:99,  unit:'°F',          label:'Body Temperature', color:'#f59e0b' },
  respiratoryRate:        { min:12,  max:20,  unit:'breaths/min', label:'Respiratory Rate', color:'#0d6b80' },
};

function gs(k, v) {
  const r = NR[k]; if (!r || v===''||v===undefined) return null;
  const n = parseFloat(v); if (n < r.min) return 'low'; if (n > r.max) return 'high'; return 'normal';
}
function calcScore(vitals) {
  const fv = Object.entries(NR).filter(([k]) => vitals[k]!==''&&vitals[k]!==undefined);
  if (!fv.length) return null;
  return Math.round(fv.filter(([k]) => gs(k, vitals[k]) === 'normal').length / fv.length * 100);
}

function VitalGauge({ k, r, value }) {
  const v = parseFloat(value);
  const st = gs(k, value);
  const lo = r.min * 0.80, hi = r.max * 1.20, range = hi - lo;
  const pct        = Math.max(2, Math.min(98, ((v - lo) / range) * 100));
  const normalLeft = ((r.min - lo) / range) * 100;
  const normalW    = ((r.max - r.min) / range) * 100;
  const dotColor   = st === 'normal' ? '#00c4b4' : st === 'high' ? '#e8453c' : '#f59e0b';
  const labelColor = st === 'normal' ? '#0d9488' : st === 'high' ? '#8b2020' : '#b45309';
  const bg         = st === 'normal' ? 'rgba(0,196,180,0.05)' : st === 'high' ? 'rgba(232,69,60,0.04)' : 'rgba(245,158,11,0.04)';
  const bdr        = st === 'normal' ? 'rgba(0,196,180,0.2)'  : st === 'high' ? 'rgba(232,69,60,0.18)' : 'rgba(245,158,11,0.18)';

  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:14, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{r.label}</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.45rem', fontWeight:300, color:'var(--text-primary)', lineHeight:1, letterSpacing:'-.02em' }}>
            {value} <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>{r.unit}</span>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:999, background:bg, color:labelColor, border:`1px solid ${bdr}`, whiteSpace:'nowrap' }}>
          {st === 'normal' ? '✓ Normal' : st === 'high' ? '↑ High' : '↓ Low'}
        </span>
      </div>
      <div style={{ position:'relative', height:5, borderRadius:3, background:'var(--border)' }}>
        <div style={{ position:'absolute', left:`${normalLeft}%`, width:`${normalW}%`, height:'100%', background:'rgba(0,196,180,0.28)', borderRadius:3 }}/>
        <div style={{ position:'absolute', left:`${pct}%`, top:'50%', transform:'translate(-50%,-50%)', width:11, height:11, borderRadius:'50%', background:dotColor, border:'2px solid white', boxShadow:`0 0 0 2px ${dotColor}40`, zIndex:2 }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>&lt;{r.min}</span>
        <span style={{ fontSize:10, color:'#0d9488', fontWeight:600 }}>Normal {r.min}–{r.max}</span>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>&gt;{r.max}</span>
      </div>
    </div>
  );
}

const RECS = {
  heartRate: {
    high: ['Practice diaphragmatic breathing (4-7-8 technique)', 'Reduce caffeine — can raise HR by 5–10 bpm', 'Aim for 30 min moderate cardio 5× per week', 'Discuss beta-blockers (e.g. metoprolol) with your doctor if consistently above 100 bpm'],
    low:  ['Resting HR below 60 is often normal in athletes', 'Seek evaluation if accompanied by dizziness or fainting'],
  },
  bloodPressureSystolic: {
    high: ['Reduce sodium to under 2,300 mg/day — try the DASH diet', '30 min aerobic exercise most days can lower BP by 5–8 mmHg', 'Limit alcohol and manage stress', 'Discuss ACE inhibitors or calcium channel blockers with your doctor'],
    low:  ['Stay well hydrated — dehydration is a common cause', 'Rise slowly from seated or lying positions'],
  },
  bloodPressureDiastolic: {
    high: ['Stress management (meditation, yoga) can lower diastolic BP', 'Maintain a healthy weight'],
    low:  ['Monitor for lightheadedness when standing', 'Ensure adequate fluid intake throughout the day'],
  },
  oxygenSaturation: {
    low: ['Practice slow deep breathing to improve O₂ uptake', 'Avoid smoking and secondhand smoke', 'If below 92%, seek immediate medical attention', 'Ask your doctor whether a sleep study is warranted'],
  },
  temperature: {
    high: ['Stay hydrated — fever increases fluid loss', 'Acetaminophen or ibuprofen can reduce fever — follow dosage guidelines', 'Seek medical care if fever exceeds 103°F or lasts more than 3 days'],
    low:  ['Warm gradually with blankets and warm fluids', 'If below 95°F, seek emergency care — this is hypothermia'],
  },
  respiratoryRate: {
    high: ['Slow your breathing using box breathing (inhale 4s, hold 4s, exhale 4s)', 'Anxiety is a common driver — address underlying stress', 'See your doctor if persistent — can indicate infection or heart failure'],
    low:  ['Very low respiratory rate during wakefulness may indicate CNS depression — seek medical evaluation'],
  },
};

function VitalRecommendations({ vitals }) {
  const [open, setOpen] = useState(null);
  const offVitals = Object.entries(NR).filter(([k]) => vitals[k]!==''&&vitals[k]!==undefined && gs(k, vitals[k]) !== 'normal');
  if (!offVitals.length) return null;
  return (
    <div style={s.card}>
      <p style={{ ...s.sl, marginBottom:14 }}>Recommendations</p>
      {offVitals.map(([k, r], idx) => {
        const status = gs(k, vitals[k]);
        const recs   = RECS[k]?.[status];
        if (!recs) return null;
        const col = status === 'high' ? '#8b2020' : '#b45309';
        const bg  = status === 'high' ? 'rgba(139,32,32,0.05)' : 'rgba(180,83,9,0.05)';
        const bdr = status === 'high' ? 'rgba(139,32,32,0.16)' : 'rgba(180,83,9,0.16)';
        const isOpen = open === k;
        return (
          <div key={k} style={{ borderRadius:12, border:`1px solid ${bdr}`, marginBottom: idx < offVitals.length-1 ? 8 : 0, overflow:'hidden' }}>
            <button onClick={() => setOpen(isOpen ? null : k)}
              style={{ width:'100%', padding:'12px 16px', background:bg, border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' }}>
              <span style={{ fontWeight:600, fontSize:13, color:col }}>{r.label} — {status === 'high' ? 'High' : 'Low'}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" style={{ transform:isOpen?'rotate(180deg)':'none', transition:'transform .2s', flexShrink:0 }}>
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            {isOpen && (
              <div style={{ padding:'12px 16px 16px', background:'var(--surface)', display:'flex', flexDirection:'column', gap:8 }}>
                {recs.map((rec, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:col, color:'white', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</div>
                    <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConditionInsights({ vitals, conditionInsights }) {
  if (!conditionInsights || conditionInsights.length === 0) return null;
  const relevant = conditionInsights.filter(row => {
    const status = gs(row.vital, vitals[row.vital]);
    return status !== null && status !== 'normal' && status === row.direction;
  });
  if (relevant.length === 0) return null;
  return (
    <div style={{ ...s.card, borderColor:'rgba(13,148,136,0.25)', background:'rgba(13,148,136,0.03)' }}>
      <p style={{ ...s.sl, marginBottom:14 }}>Condition Insights</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {relevant.map((row, i) => {
          const r = NR[row.vital];
          const dirCol = row.direction === 'high' ? '#8b2020' : '#b45309';
          const dirBg  = row.direction === 'high' ? 'rgba(139,32,32,0.05)' : 'rgba(180,83,9,0.05)';
          const dirBdr = row.direction === 'high' ? 'rgba(139,32,32,0.16)' : 'rgba(180,83,9,0.16)';
          return (
            <div key={i} style={{ borderRadius:12, padding:'13px 15px', background:dirBg, border:`1px solid ${dirBdr}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:5 }}>
                {row.condition_name} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>→</span> <span style={{ color:dirCol }}>{r?.label} {row.direction === 'high' ? '↑' : '↓'}</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{row.explanation}</p>
              {row.see_doctor && (
                <div style={{ marginTop:8, fontSize:11, fontWeight:600, color:dirCol }}>Discuss with your doctor →</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Condition normalisation ──────────────────────────────────────────────────
const CONDITION_ALIASES = {
  // Cardiovascular
  'high blood pressure':'hypertension','hbp':'hypertension','elevated blood pressure':'hypertension',
  'hypertensive':'hypertension',
  'low blood pressure':'hypotension','hypotensive':'hypotension',
  'heart attack':'myocardial infarction','mi':'myocardial infarction','cardiac arrest':'myocardial infarction',
  'afib':'atrial fibrillation','a fib':'atrial fibrillation','af':'atrial fibrillation',
  'a-fib':'atrial fibrillation','atrial fib':'atrial fibrillation',
  'svt':'supraventricular tachycardia','supraventricular tach':'supraventricular tachycardia',
  'pvcs':'premature ventricular contractions','pvc':'premature ventricular contractions',
  'heart failure':'heart failure','chf':'heart failure','congestive heart failure':'heart failure',
  'hf':'heart failure',
  'cad':'coronary artery disease','coronary artery disease':'coronary artery disease',
  'pad':'peripheral artery disease','peripheral vascular disease':'peripheral artery disease',
  'dvt':'deep vein thrombosis','blood clot leg':'deep vein thrombosis',
  'pe':'pulmonary embolism','blood clot lung':'pulmonary embolism','pulmonary embolus':'pulmonary embolism',
  'wpw':'wolff parkinson white',
  'mvp':'mitral valve prolapse','mitral prolapse':'mitral valve prolapse',
  'tamponade':'cardiac tamponade','cardiac tamponade':'cardiac tamponade',
  // Respiratory
  'copd':'copd','chronic obstructive pulmonary disease':'copd','emphysema':'copd','chronic bronchitis':'copd',
  'ild':'interstitial lung disease','pulmonary fibrosis':'interstitial lung disease',
  'collapsed lung':'pneumothorax',
  'pleural fluid':'pleural effusion','fluid around lung':'pleural effusion',
  'ards':'ards','acute respiratory distress':'ards','respiratory distress syndrome':'ards',
  'exercise asthma':'exercise induced asthma','eib':'exercise induced asthma',
  'whooping cough':'pertussis','bordetella':'pertussis',
  'respiratory syncytial virus':'rsv',
  // Endocrine
  'type 1 diabetes':'diabetes','type 2 diabetes':'diabetes','t2d':'diabetes','t1d':'diabetes',
  't2dm':'diabetes','t1dm':'diabetes','diabetic':'diabetes','dm':'diabetes',
  'high blood sugar':'hyperglycemia','low blood sugar':'hypoglycemia',
  'underactive thyroid':'hypothyroidism','low thyroid':'hypothyroidism',
  'overactive thyroid':'hyperthyroidism','high thyroid':'hyperthyroidism',
  'thyroid storm':'thyroid storm','thyrotoxicosis':'thyroid storm',
  'myxedema':'myxedema coma','severe hypothyroidism':'myxedema coma',
  'cushings':'cushing syndrome','cushing\'s':'cushing syndrome','hypercortisolism':'cushing syndrome',
  'addisons':'addison disease','addison\'s':'addison disease','adrenal insufficiency':'addison disease',
  'pheo':'pheochromocytoma','pheochromocytoma':'pheochromocytoma',
  'conn\'s syndrome':'primary hyperaldosteronism','primary aldosteronism':'primary hyperaldosteronism',
  'pcos':'pcos','polycystic ovary':'pcos','polycystic ovarian syndrome':'pcos',
  'gestational dm':'gestational diabetes','gdm':'gestational diabetes',
  'acromegaly':'acromegaly','growth hormone excess':'acromegaly',
  'di':'diabetes insipidus','diabetes insipidus':'diabetes insipidus',
  'siadh':'siadh','inappropriate adh':'siadh',
  // Renal
  'ckd':'chronic kidney disease','chronic renal disease':'chronic kidney disease',
  'kidney disease':'chronic kidney disease','renal failure':'chronic kidney disease',
  'aki':'acute kidney injury','acute renal failure':'acute kidney injury',
  'kidney infection':'pyelonephritis','renal infection':'pyelonephritis',
  'kidney stones':'kidney stones','renal calculi':'kidney stones','nephrolithiasis':'kidney stones',
  'uti':'urinary tract infection','bladder infection':'urinary tract infection',
  'ic':'interstitial cystitis','painful bladder':'interstitial cystitis',
  // GI
  'acid reflux':'gerd','heartburn':'gerd','reflux':'gerd',
  'ibs':'irritable bowel syndrome','irritable bowel':'irritable bowel syndrome','spastic colon':'irritable bowel syndrome',
  'crohns':'crohns disease','crohn\'s':'crohns disease','crohn disease':'crohns disease',
  'uc':'ulcerative colitis','colitis':'ulcerative colitis',
  'celiac':'celiac disease','coeliac':'celiac disease','gluten intolerance':'celiac disease',
  'c diff':'c difficile','c. diff':'c difficile','cdiff':'c difficile','clostridium difficile':'c difficile',
  'sibo':'sibo','small intestinal overgrowth':'sibo','bacterial overgrowth':'sibo',
  'pud':'peptic ulcer disease','stomach ulcer':'peptic ulcer disease','gastric ulcer':'peptic ulcer disease',
  'h pylori':'h pylori','helicobacter':'h pylori','h. pylori':'h pylori',
  'gallstones':'biliary colic','gallbladder stones':'biliary colic','cholelithiasis':'biliary colic',
  'gallbladder attack':'biliary colic','biliary colic':'biliary colic',
  'acute cholecystitis':'cholecystitis','inflamed gallbladder':'cholecystitis',
  'pancreatitis':'pancreatitis','inflamed pancreas':'pancreatitis',
  'appendicitis':'appendicitis','inflamed appendix':'appendicitis',
  'diverticulitis':'diverticulitis',
  'fatty liver':'nafld','nash':'nafld','nonalcoholic fatty liver':'nafld',
  'food poisoning':'gastroenteritis','stomach bug':'gastroenteritis','stomach flu':'gastroenteritis',
  'portal hypertension':'portal hypertension','portal htn':'portal hypertension',
  // Liver
  'cirrhosis':'chronic liver disease','liver cirrhosis':'chronic liver disease',
  'liver disease':'chronic liver disease','liver failure':'chronic liver disease',
  'hepatitis':'hepatitis','hep b':'hepatitis','hep c':'hepatitis',
  // Neurological
  'tbi':'traumatic brain injury','head injury':'traumatic brain injury','brain injury':'traumatic brain injury',
  'sah':'subarachnoid hemorrhage','brain bleed':'subarachnoid hemorrhage',
  'concussion':'concussion','mild tbi':'concussion',
  'epilepsy':'epilepsy','seizures':'epilepsy','seizure disorder':'epilepsy',
  'gbs':'guillain barre syndrome','guillain barre':'guillain barre syndrome','guillain-barré':'guillain barre syndrome',
  'als':'als','lou gehrig':'als','motor neurone disease':'als','mnd':'als',
  'ms':'multiple sclerosis','multiple sclerosis':'multiple sclerosis',
  'parkinsons':'parkinsons disease','parkinson\'s':'parkinsons disease','pd':'parkinsons disease',
  'migraine headaches':'migraine','migraines':'migraine',
  'vertigo':'vertigo','meniere\'s':'vertigo','menieres':'vertigo','labyrinthitis':'vertigo',
  // Mental health
  'gad':'generalised anxiety disorder','generalized anxiety':'generalised anxiety disorder','anxiety disorder':'generalised anxiety disorder',
  'social anxiety':'social anxiety disorder','social phobia':'social anxiety disorder',
  'panic attacks':'panic disorder','panic attack':'panic disorder',
  'ptsd':'ptsd','post traumatic stress':'ptsd','trauma':'ptsd',
  'bipolar':'bipolar disorder','manic depression':'bipolar disorder','bipolar 1':'bipolar disorder','bipolar 2':'bipolar disorder',
  'ocd':'ocd','obsessive compulsive':'ocd',
  'seasonal depression':'seasonal affective disorder','sad':'seasonal affective disorder','winter depression':'seasonal affective disorder',
  'adhd':'adhd','add':'adhd','attention deficit':'adhd',
  // Rheumatological / autoimmune
  'ra':'rheumatoid arthritis','rheumatoid':'rheumatoid arthritis',
  'sle':'lupus','lupus erythematosus':'lupus',
  'oa':'osteoarthritis','degenerative joint disease':'osteoarthritis','arthritis':'osteoarthritis',
  'scleroderma':'scleroderma','systemic sclerosis':'scleroderma',
  'sjogrens':'sjogrens syndrome','sjögren\'s':'sjogrens syndrome','dry eye syndrome':'sjogrens syndrome',
  'polymyositis':'polymyositis','dermatomyositis':'polymyositis','inflammatory myopathy':'polymyositis',
  'vasculitis':'vasculitis','arteritis':'vasculitis',
  'gout':'gout','gouty arthritis':'gout','hyperuricemia':'gout',
  'fibro':'fibromyalgia','fibromyalgia syndrome':'fibromyalgia',
  'cfs':'chronic fatigue syndrome','me':'chronic fatigue syndrome','myalgic encephalomyelitis':'chronic fatigue syndrome',
  // Haematological
  'anemia':'anemia','anaemia':'anemia','low iron blood':'anemia',
  'sickle cell':'sickle cell disease','sca':'sickle cell disease',
  'thalassemia':'thalassemia','thalassaemia':'thalassemia',
  'aplastic':'aplastic anemia','bone marrow failure':'aplastic anemia',
  'pvera':'polycythemia vera','polycythaemia vera':'polycythemia vera','high red blood cells':'polycythemia vera',
  'dic':'dic','disseminated intravascular':'dic',
  'hemophilia':'hemophilia','haemophilia':'hemophilia',
  // Cancer
  'leukemia':'leukemia','leukaemia':'leukemia','blood cancer':'leukemia',
  'lymphoma':'lymphoma','hodgkins':'lymphoma','non hodgkins':'lymphoma',
  'chemo':'chemotherapy','chemotherapy side effects':'chemotherapy',
  // Infectious
  'flu':'influenza','seasonal flu':'influenza','influenza a':'influenza','influenza b':'influenza',
  'covid':'covid-19','covid 19':'covid-19','coronavirus':'covid-19','sars-cov-2':'covid-19',
  'long covid':'long covid','post covid':'long covid','long haul covid':'long covid',
  'post viral':'post viral fatigue','post-viral':'post viral fatigue',
  'mono':'mononucleosis','epstein barr':'mononucleosis','ebv':'mononucleosis','kissing disease':'mononucleosis',
  'tb':'tuberculosis','tuberculosis':'tuberculosis',
  'lyme':'lyme disease','lyme borreliosis':'lyme disease',
  'dengue':'dengue fever',
  'chickenpox':'chickenpox','varicella':'chickenpox','chicken pox':'chickenpox',
  'shingles':'shingles','herpes zoster':'shingles',
  'measles':'measles','rubeola':'measles',
  'mumps':'mumps','parotitis':'mumps',
  'rsv':'rsv',
  'whooping cough':'pertussis',
  'strep':'strep throat','streptococcal':'strep throat','strep throat':'strep throat',
  'ear infection':'otitis media','otitis':'otitis media',
  'sinus infection':'sinusitis','sinus':'sinusitis',
  'bronchitis':'acute bronchitis',
  'cold':'common cold','rhinovirus':'common cold',
  'hiv':'hiv aids','aids':'hiv aids','hiv/aids':'hiv aids',
  'malaria':'malaria',
  'septicemia':'sepsis','blood poisoning':'sepsis','septicaemia':'sepsis',
  'nf':'necrotizing fasciitis','flesh eating disease':'necrotizing fasciitis',
  'cellulitis':'cellulitis','skin infection':'cellulitis',
  'osteomyelitis':'osteomyelitis','bone infection':'osteomyelitis',
  'pid':'pelvic inflammatory disease','pelvic infection':'pelvic inflammatory disease',
  // Metabolic
  'high cholesterol':'hyperlipidemia','hypercholesterolemia':'hyperlipidemia','high ldl':'hyperlipidemia',
  'metabolic syndrome':'metabolic syndrome','insulin resistance':'metabolic syndrome',
  'prediabetes':'prediabetes','pre-diabetes':'prediabetes','borderline diabetes':'prediabetes',
  'dehydration':'dehydration','low fluids':'dehydration',
  'electrolyte imbalance':'electrolyte imbalance','low electrolytes':'electrolyte imbalance',
  'low potassium':'hypokalemia','hypokalemia':'hypokalemia',
  'high potassium':'hyperkalemia','hyperkalemia':'hyperkalemia',
  'low sodium':'hyponatremia','hyponatremia':'hyponatremia',
  'low magnesium':'magnesium deficiency','hypomagnesemia':'magnesium deficiency',
  'low calcium':'calcium deficiency','hypocalcemia':'calcium deficiency',
  'low phosphorus':'phosphorus deficiency','hypophosphatemia':'phosphorus deficiency',
  // Respiratory emergencies
  'hape':'hape','high altitude pulmonary edema':'hape','altitude pulmonary edema':'hape',
  'altitude sickness':'altitude sickness','ams':'acute mountain sickness','mountain sickness':'acute mountain sickness',
  'decompression':'decompression sickness','bends':'decompression sickness','the bends':'decompression sickness',
  'near drowning':'near drowning','drowning':'near drowning',
  'co poisoning':'carbon monoxide poisoning','carbon monoxide':'carbon monoxide poisoning',
  // Obstetric
  'preeclampsia':'preeclampsia','pre-eclampsia':'preeclampsia','toxemia':'preeclampsia',
  'postpartum bleed':'postpartum hemorrhage','pphe':'postpartum hemorrhage',
  'pmdd':'pmdd','pms':'pmdd','premenstrual':'pmdd',
  'endometriosis':'endometriosis','endo':'endometriosis',
  'fibroids':'uterine fibroids','uterine fibroids':'uterine fibroids',
  'ovarian cyst':'ovarian torsion','ovarian torsion':'ovarian torsion',
  // Sleep
  'sleep apnea':'sleep apnea','sleep apnoea':'sleep apnea','osa':'sleep apnea',
  'central sleep apnea':'central sleep apnea','csa':'central sleep apnea',
  'pots':'pots','postural tachycardia':'pots','orthostatic tachycardia':'pots',
  // Deficiencies
  'vitamin b12':'vitamin b12 deficiency','b12 deficiency':'vitamin b12 deficiency','b12 low':'vitamin b12 deficiency',
  'vitamin d':'vitamin d deficiency','vit d deficiency':'vitamin d deficiency','low vitamin d':'vitamin d deficiency',
  'vitamin b1':'thiamine deficiency','thiamine':'thiamine deficiency','beriberi':'thiamine deficiency',
  'vitamin b6':'vitamin b6 deficiency','b6 deficiency':'vitamin b6 deficiency',
  'vitamin b9':'folate deficiency','folic acid deficiency':'folate deficiency','folate low':'folate deficiency',
  'vitamin c deficiency':'vitamin c deficiency','scurvy':'vitamin c deficiency',
  'vitamin k deficiency':'vitamin k deficiency',
  'vitamin a deficiency':'vitamin a deficiency',
  'vitamin e deficiency':'vitamin e deficiency',
  'riboflavin deficiency':'riboflavin deficiency','b2 deficiency':'riboflavin deficiency',
  'niacin deficiency':'niacin deficiency','pellagra':'niacin deficiency','b3 deficiency':'niacin deficiency',
  'iron deficiency':'iron deficiency','low iron':'iron deficiency',
  'zinc deficiency':'zinc deficiency','low zinc':'zinc deficiency',
  'magnesium deficiency':'magnesium deficiency','low magnesium':'magnesium deficiency',
  'iodine deficiency':'iodine deficiency','low iodine':'iodine deficiency',
  'selenium deficiency':'selenium deficiency',
  'copper deficiency':'copper deficiency',
  'omega 3 deficiency':'omega-3 deficiency','fish oil deficiency':'omega-3 deficiency',
  'coq10 deficiency':'coq10 deficiency','coenzyme q10 deficiency':'coq10 deficiency',
  'protein deficiency':'protein deficiency','kwashiorkor':'protein deficiency',
  // Lifestyle / other
  'smoking':'smoking','smoker':'smoking','cigarettes':'smoking','nicotine':'smoking',
  'nicotine withdrawal':'nicotine withdrawal','quitting smoking':'nicotine withdrawal',
  'alcohol use':'alcohol use disorder','alcoholism':'alcohol use disorder','alcohol dependence':'alcohol use disorder',
  'alcohol withdrawal':'alcohol withdrawal','delirium tremens':'alcohol withdrawal','dt\'s':'alcohol withdrawal',
  'hangover':'hangover',
  'caffeine':'caffeine excess','too much coffee':'caffeine excess',
  'opioid overdose':'opioid overdose','opioid toxicity':'opioid overdose','narcotic overdose':'opioid overdose',
  'stimulant overdose':'stimulant overdose','cocaine overdose':'stimulant overdose','meth overdose':'stimulant overdose',
  'overtraining':'overtraining syndrome','overtraining syndrome':'overtraining syndrome',
  'deconditioning':'deconditioning','bed rest':'deconditioning','sedentary':'deconditioning',
  'athletes heart':'athletes heart','athlete heart':'athletes heart','runners heart':'athletes heart',
  'heat stroke':'heat stroke','heatstroke':'heat stroke',
  'heat exhaustion':'heat exhaustion','heat illness':'heat exhaustion',
  'hypothermia':'hypothermia','cold exposure':'hypothermia',
  'motion sickness':'motion sickness','car sickness':'motion sickness','sea sickness':'motion sickness',
  'vasovagal':'vasovagal syncope','fainting':'vasovagal syncope','syncope':'vasovagal syncope',
  'rhabdomyolysis':'rhabdomyolysis','rhabdo':'rhabdomyolysis',
  'anaphylaxis':'anaphylaxis','severe allergic reaction':'anaphylaxis','anaphylactic shock':'anaphylaxis',
  'food allergy':'food allergy','nut allergy':'food allergy',
  'palpitations':'benign palpitations','heart palpitations':'benign palpitations',
  'hyperventilation':'hyperventilation syndrome','over breathing':'hyperventilation syndrome',
  'back pain':'chronic back pain','lower back pain':'chronic back pain','sciatica':'chronic back pain',
  'chronic pain':'chronic pain syndrome','chronic pain disorder':'chronic pain syndrome',
  'insomnia':'insomnia','chronic insomnia':'insomnia','sleep problems':'insomnia',
  'pregnancy':'pregnancy','pregnant':'pregnancy','expecting':'pregnancy',
  'menopause':'menopause','perimenopause':'menopause','post menopause':'menopause',
  'post op':'post operative','post surgery':'post operative','after surgery':'post operative',
  'surgery recovery':'post operative','recovering from surgery':'post operative',
  'burns':'major burns','burn injury':'major burns',
  'electrical injury':'electrical injury','electrocution':'electrical injury','lightning strike':'electrical injury',
  'epiglottitis':'epiglottitis','swollen epiglottis':'epiglottitis',
  'pleurisy':'pleurisy','pleuritis':'pleurisy',
  'costochondritis':'costochondritis','chest wall pain':'costochondritis',
  'prostatitis':'prostatitis','prostate infection':'prostatitis',
  'bph':'prostatitis','enlarged prostate':'prostatitis',
  'testicular torsion':'testicular torsion',
  'bulimia':'bulimia nervosa','bulimia nervosa':'bulimia nervosa','binge purge':'bulimia nervosa',
  'anorexia':'anorexia nervosa','anorexia nervosa':'anorexia nervosa',
  'eczema':'eczema','atopic dermatitis':'eczema','atopic eczema':'eczema',
  'psoriasis':'psoriasis',
  'bowel obstruction':'bowel obstruction','intestinal obstruction':'bowel obstruction','blocked bowel':'bowel obstruction',
  'peritonitis':'peritonitis','perforated bowel':'peritonitis',
  'ectopic pregnancy':'ectopic pregnancy','tubal pregnancy':'ectopic pregnancy',
  'sarcoidosis':'sarcoidosis',
  'marfan':'marfan syndrome','marfan\'s':'marfan syndrome',
  'eds':'ehlers danlos syndrome','ehlers danlos':'ehlers danlos syndrome','hypermobility':'ehlers danlos syndrome',
  'raynauds':'raynaud phenomenon','raynaud\'s':'raynaud phenomenon','cold fingers':'raynaud phenomenon',
  'hemochromatosis':'hemochromatosis','iron overload':'hemochromatosis',
  'dic':'dic',
  'vocal cord dysfunction':'vocal cord dysfunction','vcd':'vocal cord dysfunction',
  'laryngitis':'laryngitis','lost voice':'laryngitis',
  'bronchospasm':'bronchospasm','airway spasm':'bronchospasm',
  'beta blocker':'beta blocker side effects','beta blockers':'beta blocker side effects',
  'ace inhibitor':'ace inhibitor side effects','ace inhibitors':'ace inhibitor side effects',
  'diuretic':'diuretic side effects','water pill':'diuretic side effects','water pills':'diuretic side effects',
  'ssri':'ssri side effects','antidepressant':'ssri side effects','antidepressants':'ssri side effects',
  'steroids':'corticosteroid side effects','prednisone':'corticosteroid side effects','corticosteroids':'corticosteroid side effects',
  'statins':'statin side effects','statin':'statin side effects',
};

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

const ALL_CONDITION_KEYS = [
  'hypertension','diabetes','asthma','copd','heart failure','anxiety','hypothyroidism','hyperthyroidism',
  'anemia','sleep apnea','obesity','chronic kidney disease','atrial fibrillation','fever','dehydration',
  'depression','pneumonia','sepsis','pulmonary embolism','myocardial infarction','myocarditis','pericarditis',
  'cardiomyopathy','pulmonary hypertension','hypoglycemia','hyperglycemia','long covid','influenza',
  'anaphylaxis','panic disorder','sickle cell disease','chronic liver disease','tuberculosis',
  'cushing syndrome','addison disease','lupus','rheumatoid arthritis','fibromyalgia',
  'chronic fatigue syndrome','interstitial lung disease','stroke','preeclampsia','peripheral artery disease',
  'altitude sickness','bradycardia','tachycardia','hypotension','ptsd','bipolar disorder','anorexia nervosa',
  'alcohol use disorder','alcohol withdrawal','heat stroke','heat exhaustion','hypothermia','hypokalemia',
  'hyperkalemia','hyponatremia','pcos','crohns disease','ulcerative colitis','pancreatitis','hiv aids',
  'malaria','dengue fever','lyme disease','mononucleosis','covid-19','cystic fibrosis','pneumothorax',
  'aortic dissection','cardiac tamponade','ards','rhabdomyolysis','opioid overdose','stimulant overdose',
  'multiple sclerosis','parkinsons disease','epilepsy','guillain barre syndrome','als','hepatitis',
  'acute kidney injury','pyelonephritis','thyroid storm','myxedema coma','vitamin d deficiency',
  'iron deficiency','malnutrition','pleural effusion','portal hypertension','major burns',
  'carbon monoxide poisoning','overtraining syndrome','vitamin a deficiency','thiamine deficiency',
  'riboflavin deficiency','niacin deficiency','vitamin b6 deficiency','folate deficiency',
  'vitamin b12 deficiency','vitamin c deficiency','vitamin e deficiency','vitamin k deficiency',
  'magnesium deficiency','calcium deficiency','zinc deficiency','phosphorus deficiency','iodine deficiency',
  'selenium deficiency','copper deficiency','omega-3 deficiency','coq10 deficiency','protein deficiency',
  'electrolyte imbalance','infective endocarditis','aortic stenosis','mitral valve prolapse',
  'wolff parkinson white','ventricular tachycardia','complete heart block','meningitis','encephalitis',
  'subarachnoid hemorrhage','traumatic brain injury','appendicitis','cholecystitis','peritonitis',
  'bowel obstruction','ectopic pregnancy','deep vein thrombosis','dic','aplastic anemia','thalassemia',
  'polycythemia vera','pheochromocytoma','primary hyperaldosteronism','carcinoid syndrome','acromegaly',
  'rheumatic fever','gout','vasculitis','sarcoidosis','scleroderma','sjogrens syndrome','polymyositis',
  'muscular dystrophy','hemochromatosis','marfan syndrome','ehlers danlos syndrome','menopause',
  'gestational diabetes','postpartum hemorrhage','central sleep apnea','hape','decompression sickness',
  'near drowning','electrical injury','epiglottitis','necrotizing fasciitis','chronic pain syndrome',
  'raynaud phenomenon','hemophilia','cancer','chemotherapy','leukemia','lymphoma','diabetes insipidus',
  'siadh','osteomyelitis','cellulitis','insomnia','narcolepsy','svt','atrial flutter',
  'premature ventricular contractions','costochondritis','pleurisy','exercise induced asthma','pertussis',
  'rsv','chickenpox','c difficile','celiac disease','psoriasis','pelvic inflammatory disease',
  'ovarian torsion','testicular torsion','biliary colic','sibo','interstitial cystitis','eczema',
  'beta blocker side effects','ace inhibitor side effects','diuretic side effects','ssri side effects',
  'corticosteroid side effects','statin side effects','post viral fatigue','laryngitis',
  'vocal cord dysfunction','chronic sinusitis','measles','mumps','bronchospasm','benign palpitations',
  'athletes heart','deconditioning','caffeine excess','pregnancy','hangover','motion sickness',
  'vasovagal syncope','common cold','acute bronchitis','sinusitis','allergic rhinitis',
  'urinary tract infection','gastroenteritis','migraine','irritable bowel syndrome','peptic ulcer disease',
  'gerd','diverticulitis','strep throat','otitis media','nafld','metabolic syndrome','hyperlipidemia',
  'prediabetes','kidney stones','bulimia nervosa','ocd','seasonal affective disorder','pmdd',
  'endometriosis','uterine fibroids','prostatitis','vertigo','obesity hypoventilation syndrome',
  'smoking','social anxiety disorder','generalised anxiety disorder','pots','hyperventilation syndrome',
  'acute mountain sickness','shingles','osteoarthritis','osteoporosis','chronic back pain','h pylori',
  'adhd','post operative','nicotine withdrawal','concussion','food allergy','atopic dermatitis',
];

// ── Biological Age Calculator ────────────────────────────────────────────────
function calcBioAge(vitals, chronoAge) {
  if (!chronoAge) return null;
  const age = parseFloat(chronoAge);
  if (isNaN(age)) return null;
  let delta = 0, count = 0;
  const hr = parseFloat(vitals.heartRate);
  if (!isNaN(hr)) {
    if (hr > 80) delta += (hr - 80) * 0.12;
    else if (hr < 60) delta -= 2;
    count++;
  }
  const sys = parseFloat(vitals.bloodPressureSystolic);
  if (!isNaN(sys)) {
    if (sys > 120) delta += (sys - 120) * 0.15;
    else if (sys < 90) delta += 3;
    else delta -= 1.5;
    count++;
  }
  const o2 = parseFloat(vitals.oxygenSaturation);
  if (!isNaN(o2)) {
    if (o2 < 95) delta += (95 - o2) * 1.2;
    else delta -= 1;
    count++;
  }
  const temp = parseFloat(vitals.temperature);
  if (!isNaN(temp)) {
    if (temp > 99) delta += (temp - 99) * 1.5;
    else if (temp < 97) delta += 2;
    count++;
  }
  const rr = parseFloat(vitals.respiratoryRate);
  if (!isNaN(rr)) {
    if (rr > 20) delta += (rr - 20) * 0.5;
    else if (rr < 12) delta += 2;
    else delta -= 0.5;
    count++;
  }
  if (!count) return null;
  return Math.max(18, Math.round(age + delta));
}

function BioAgeCard({ vitals }) {
  const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  const chrono  = parseFloat(profile.age);
  const bio     = calcBioAge(vitals, chrono);
  if (!profile.age || isNaN(chrono)) return (
    <div style={{ borderRadius:14, padding:'13px 16px', background:'rgba(13,107,128,0.06)', border:'1px solid rgba(13,107,128,0.18)', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:20 }}>🧬</span>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'#0d6b80', marginBottom:2 }}>Biological Age Estimator</div>
        <div style={{ fontSize:12, color:'var(--text-muted)' }}>Add your age on the <a href="/Profile" style={{ color:'#0d6b80' }}>Profile page</a> to see your biological age estimate.</div>
      </div>
    </div>
  );
  if (!bio) return null;
  const diff = bio - chrono;
  const col  = diff <= -2 ? '#0d9488' : diff >= 3 ? '#e8453c' : '#f59e0b';
  const bg   = diff <= -2 ? 'rgba(13,148,136,0.05)' : diff >= 3 ? 'rgba(232,69,60,0.04)' : 'rgba(245,158,11,0.04)';
  const bdr  = diff <= -2 ? 'rgba(13,148,136,0.2)' : diff >= 3 ? 'rgba(232,69,60,0.18)' : 'rgba(245,158,11,0.18)';
  const msg  = diff <= -2 ? 'Your vitals suggest you\'re aging well — keep it up!'
             : diff >= 3  ? 'Your vitals suggest some age-related strain. Small lifestyle changes can help.'
             : 'Your vitals are in line with your chronological age.';
  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:18, padding:'20px 22px', marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:12 }}>Biological Age Estimate</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:20, flexWrap:'wrap' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>Chronological</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:'2.4rem', fontWeight:300, color:'var(--text-primary)', lineHeight:1 }}>{chrono}</div>
        </div>
        <div style={{ fontSize:22, color:'var(--text-muted)', marginBottom:6 }}>→</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, color:col, fontWeight:600, marginBottom:3 }}>Biological</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:'2.4rem', fontWeight:300, color:col, lineHeight:1 }}>{bio}</div>
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ fontSize:13, fontWeight:700, color:col, marginBottom:4 }}>
            {diff > 0 ? `+${diff}` : diff} years {diff < 0 ? 'younger' : diff > 0 ? 'older' : 'at pace'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.55 }}>{msg}</div>
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:12 }}>Based on heart rate, blood pressure, O₂, temperature, and respiratory rate.</div>
    </div>
  );
}

// ── Percentile Context ────────────────────────────────────────────────────────
const PERCENTILE_NORMS = {
  heartRate:              { mean:72,  sd:12 },
  bloodPressureSystolic:  { mean:120, sd:14 },
  bloodPressureDiastolic: { mean:76,  sd:10 },
  oxygenSaturation:       { mean:97.5,sd:1.5 },
  temperature:            { mean:98.2,sd:0.7 },
  respiratoryRate:        { mean:15,  sd:3   },
};

function normCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

function percentileFor(key, val) {
  const n = PERCENTILE_NORMS[key]; if (!n) return null;
  const z = (parseFloat(val) - n.mean) / n.sd;
  return Math.round(normCDF(z) * 100);
}

function PercentileRow({ k, r, value }) {
  const pct = percentileFor(k, value);
  if (pct === null) return null;
  const better = pct <= 50
    ? `Better than ~${pct}% of adults`
    : `Better than ~${100 - pct}% of adults`;
  const col = pct >= 20 && pct <= 80 ? '#0d9488' : '#f59e0b';
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
      <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
      <span style={{ color:col, fontWeight:600 }}>{better}</span>
    </div>
  );
}

// ── Share / Export ────────────────────────────────────────────────────────────
function ShareExportBar({ vitals, score }) {
  const [copied, setCopied] = useState(false);

  const buildSummary = () => {
    const lines = [`Vitalyze Health Summary\n`];
    if (score !== null) lines.push(`Overall Score: ${score}/100`);
    Object.entries(NR).forEach(([k, r]) => {
      const v = vitals[k]; if (v === '' || v === undefined) return;
      const st = gs(k, v);
      lines.push(`${r.label}: ${v} ${r.unit} (${st === 'normal' ? 'Normal' : st === 'high' ? 'High ↑' : 'Low ↓'})`);
    });
    lines.push(`\nGenerated by Vitalyze`);
    return lines.join('\n');
  };

  const copy = () => {
    navigator.clipboard.writeText(buildSummary()).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ display:'flex', gap:10, marginBottom:12 }}>
      <button onClick={copy} style={{ flex:1, padding:'11px 16px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-primary)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
        {copied
          ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg> Copied!</>
          : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Summary</>
        }
      </button>
      <button onClick={() => window.print()} style={{ flex:1, padding:'11px 16px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#0a4a5c,#0d6b80)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Save as PDF
      </button>
    </div>
  );
}

function normaliseCondition(input) {
  const s = input.trim().toLowerCase();
  if (ALL_CONDITION_KEYS.includes(s)) return s;
  if (CONDITION_ALIASES[s]) return CONDITION_ALIASES[s];
  // fuzzy match against all keys (threshold: ≤30% of key length)
  let best = null, bestDist = Infinity;
  for (const key of ALL_CONDITION_KEYS) {
    const d = levenshtein(s, key);
    if (d < bestDist) { bestDist = d; best = key; }
  }
  if (best && bestDist <= Math.max(2, Math.floor(best.length * 0.30))) return best;
  return s; // fall back to original — Supabase will just return no rows
}
// ────────────────────────────────────────────────────────────────────────────

export default function Results() {
  const mob = useIsMobile();
  const loc = useLocation(), nav = useNavigate();
  const stateVitals = loc.state?.vitals;
  const stateRx     = loc.state?.prescriptions;
  const lastEntry   = JSON.parse(localStorage.getItem('vitals_history') || '[]').slice(-1)[0];
  const vitals      = stateVitals || lastEntry?.vitals || {};
  const prescriptions = stateRx ?? lastEntry?.prescriptions ?? [];
  const [conditionInsights, setConditionInsights] = useState([]);

  const fv    = Object.entries(NR).filter(([k]) => vitals[k]!==''&&vitals[k]!==undefined);
  const score = calcScore(vitals);
  const scoreColor = score===null?'rgba(255,255,255,0.2)':score>=80?'#00c4b4':score>=60?'#f59e0b':'#e8453c';
  const scoreLabel = score===null?'No data':score>=80?'Healthy':score>=60?'Fair':'Needs Attention';
  const scoreDash  = score===null?0:(score/100)*251.3;
  const offCount   = fv.filter(([k]) => gs(k, vitals[k]) !== 'normal').length;

  useEffect(() => {
    if (!fv.length) return;
    const ex = JSON.parse(localStorage.getItem('vitals_history')||'[]');
    const last = ex[ex.length-1];
    if (last && Date.now()-last.timestamp<5000) return;
    localStorage.setItem('vitals_history', JSON.stringify([...ex,{vitals,prescriptions,timestamp:Date.now()}]));
  }, []);

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const conditions = profile.conditions;
    if (!conditions || !conditions.trim()) return;
    const keys = [...new Set(conditions.split(',').map(c => normaliseCondition(c)).filter(Boolean))];
    if (!keys.length) return;
    supabase.from('condition_vitals').select('*').in('condition_key', keys)
      .then(({ data }) => { if (data) setConditionInsights(data); });
  }, []);

  return (
    <div style={s.page}>
      {/* Banner */}
      <div style={s.banner}>
        {/* Background image — doctor/health scene */}
        <div style={{ position:'absolute',inset:0,backgroundImage:'url(/images/health-tech.jpg)',backgroundSize:'cover',backgroundPosition:'center 55%' }}/>
        {/* Gradient overlay — image visible right, fades left into navy */}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to right,rgba(8,28,38,1) 0%,rgba(10,74,92,0.95) 35%,rgba(10,74,92,0.45) 62%,rgba(10,74,92,0.05) 100%)' }}/>
        {/* Subtle ECG decoration */}
        <svg style={{ position:'absolute',bottom:0,left:0,right:0,opacity:0.12 }} height="40" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path d="M0,20 L200,20 L240,20 L270,4 L300,36 L320,2 L350,38 L375,20 L600,20 L640,20 L670,4 L700,36 L720,2 L750,38 L775,20 L1200,20" stroke="#00c4b4" strokeWidth="2" fill="none"/>
        </svg>
        <div style={{ position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding: mob ? '0 16px' : '0 32px',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap: mob ? 'wrap' : 'nowrap' }}>
          <div style={{ paddingBottom:4, flex:1 }}>
            <div style={s.ey}>Analysis</div>
            <h1 style={s.ti}>Your Results</h1>
            {fv.length > 0 ? (
              <>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginTop:8, lineHeight:1.6 }}>
                  {fv.length - offCount} of {fv.length} vitals in normal range
                </p>
                <div style={{ display:'flex', gap:18, marginTop:16, flexWrap:'wrap' }}>
                  {[
                    { label: offCount === 0 ? 'All normal' : `${offCount} flag${offCount>1?'s':''}`, color: offCount===0?'#00c4b4':'#e8453c' },
                    { label: `${fv.length} vitals logged`, color:'rgba(255,255,255,0.7)' },
                    { label: `Score: ${score ?? '—'}`, color: scoreColor },
                  ].map((item,i) => (
                    <span key={i} style={{ fontSize:12, fontWeight:600, color:item.color, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:item.color, display:'inline-block' }}/>
                      {item.label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', marginTop:8 }}>Log your vitals to see your full analysis.</p>
            )}
          </div>
          {fv.length > 0 && !mob && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, paddingBottom:4 }}>
              <svg width="96" height="96" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="7"/>
                <circle cx="45" cy="45" r="38" fill="none" stroke={scoreColor} strokeWidth="7"
                  strokeDasharray={`${scoreDash} 238.8`} strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{ transition:'stroke-dasharray .8s ease' }}/>
                <text x="45" y="41" textAnchor="middle" fontSize="20" fontWeight="300" fill="white" fontFamily="Fraunces">{score ?? '—'}</text>
                <text x="45" y="53" textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.4)" fontFamily="DM Sans">SCORE</text>
              </svg>
              <div style={{ fontSize:11, fontWeight:600, color:scoreColor, textTransform:'uppercase', letterSpacing:'.06em' }}>{scoreLabel}</div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={s.disclaimer}>
        <strong>Medical Disclaimer:</strong>&nbsp;Vitalyze is an educational tool only — not medical advice. Always consult a licensed physician for medical decisions.
      </div>

      <div style={{ ...s.inner, padding: mob ? '20px 16px 0' : '20px 32px 0' }}>
        {fv.length === 0 && (
          <div style={s.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" style={{ marginBottom:16 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            <p style={{ fontFamily:"'Fraunces',serif", fontWeight:300, fontSize:'1.2rem', color:'var(--text-primary)', marginBottom:8 }}>No vitals submitted yet</p>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:24 }}>Head to the Vitals page to enter your readings.</p>
            <button onClick={() => nav('/InputData')} style={s.navyBtn}>Enter Vitals →</button>
          </div>
        )}

        {fv.length > 0 && (
          <>
            {/* Share / Export */}
            <ShareExportBar vitals={vitals} score={score} />

            {/* Biological age */}
            <BioAgeCard vitals={vitals} />

            {/* Vital gauges */}
            <div style={s.card}>
              <p style={{ ...s.sl, marginBottom:14 }}>Vital Signs</p>
              <div style={{ display:'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap:10 }}>
                {fv.map(([k, r]) => <VitalGauge key={k} k={k} r={r} value={vitals[k]} />)}
              </div>
            </div>

            {/* Health-tech image strip */}
            <div style={{ borderRadius:20, overflow:'hidden', height:110, position:'relative' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/smartwatch.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%' }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(8,24,34,0.95) 0%,rgba(10,74,92,0.7) 50%,rgba(10,74,92,0.15) 100%)' }}/>
              <div style={{ position:'relative', zIndex:1, padding:'22px 28px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.05rem', fontWeight:300, color:'white', marginBottom:4 }}>How do you compare to others your age?</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Percentile context based on population health norms below.</div>
                </div>
              </div>
            </div>

            {/* Percentile context */}
            <div style={s.card}>
              <p style={{ ...s.sl, marginBottom:10 }}>Population Percentile</p>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>How your vitals compare to healthy adults</div>
              {fv.map(([k, r]) => <PercentileRow key={k} k={k} r={r} value={vitals[k]} />)}
            </div>

            {/* Condition insights */}
            <ConditionInsights vitals={vitals} conditionInsights={conditionInsights} />

            {/* Recommendations */}
            <VitalRecommendations vitals={vitals} />

            {/* Prescriptions */}
            {prescriptions.filter(p => p.name).length > 0 && (
              <div style={s.card}>
                <p style={{ ...s.sl, marginBottom:14 }}>Prescriptions</p>
                {prescriptions.filter(p => p.name).map((p, i, arr) => (
                  <div key={i} style={{ padding:'10px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>{p.name}</div>
                    {p.sideEffects && <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{p.sideEffects}</div>}
                  </div>
                ))}
              </div>
            )}

            <CostAccessibility prescriptions={prescriptions} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4 }}>
              <button onClick={() => nav('/InputData')} style={s.navyBtn}>Re-enter Vitals</button>
              <button onClick={() => nav('/Trends')} style={s.tealBtn}>View Trends →</button>
            </div>

            {/* Doctor CTA strip */}
            <div style={{ borderRadius:20, overflow:'hidden', height:130, position:'relative', marginTop:8 }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/nurse-consultation.jpg)', backgroundSize:'cover', backgroundPosition:'center 35%' }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(10,74,92,0.95) 0%,rgba(10,74,92,0.7) 50%,rgba(10,74,92,0.2) 100%)' }}/>
              <div style={{ position:'relative', zIndex:1, padding:'24px 32px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.1rem', fontWeight:300, color:'white', marginBottom:5 }}>These results are for reference only.</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>Always share with a licensed physician before making health decisions.</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { fontFamily:"'DM Sans',sans-serif", background:'var(--bg)', minHeight:'100vh', paddingBottom:80 },
  banner:     { minHeight:230, padding:'52px 0 36px', position:'relative', overflow:'hidden' },
  ey:         { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.5)', marginBottom:10 },
  ti:         { fontFamily:"'Fraunces',serif", fontSize:'2rem', fontWeight:300, letterSpacing:'-.02em', color:'#fff' },
  disclaimer: { padding:'10px 32px', background:'rgba(10,74,92,0.05)', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 },
  inner:      { maxWidth:900, margin:'0 auto', padding:'20px 32px 0' },
  card:       { background:'var(--surface)', borderRadius:18, border:'1px solid var(--border)', padding:'20px 22px', marginBottom:12, boxShadow:'var(--shadow-sm)' },
  sl:         { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', margin:0 },
  empty:      { background:'var(--surface)', borderRadius:18, border:'1px solid var(--border)', padding:'56px 24px', textAlign:'center', boxShadow:'var(--shadow-sm)', marginTop:24 },
  navyBtn:    { padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#0a4a5c,#0d6b80)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  tealBtn:    { padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#0d9488,#00c4b4)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
};
