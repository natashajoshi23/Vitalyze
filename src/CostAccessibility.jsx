import { useState, useEffect, useRef } from 'react';

// ── Curated NADAC price table (per-unit, USD) ──────────────────────────────
const ATC_CLASSES = {
  A10BA: { name: 'Biguanides (Diabetes)', drugs: [
    { name: 'Metformin',          price: 0.018 },
    { name: 'Metformin ER',       price: 0.024 },
  ]},
  A10BB: { name: 'Sulfonylureas (Diabetes)', drugs: [
    { name: 'Glipizide',          price: 0.038 },
    { name: 'Glimepiride',        price: 0.021 },
    { name: 'Glyburide',          price: 0.019 },
  ]},
  A10BK: { name: 'SGLT-2 Inhibitors (Diabetes)', drugs: [
    { name: 'Empagliflozin',      price: 17.40 },
    { name: 'Dapagliflozin',      price: 16.80 },
    { name: 'Canagliflozin',      price: 16.20 },
  ]},
  C09AA: { name: 'ACE Inhibitors', drugs: [
    { name: 'Lisinopril',         price: 0.022 },
    { name: 'Enalapril',          price: 0.058 },
    { name: 'Ramipril',           price: 0.061 },
    { name: 'Benazepril',         price: 0.049 },
    { name: 'Quinapril',          price: 0.044 },
  ]},
  C09CA: { name: 'Angiotensin II Receptor Blockers (ARBs)', drugs: [
    { name: 'Losartan',           price: 0.071 },
    { name: 'Valsartan',          price: 0.098 },
    { name: 'Olmesartan',         price: 0.112 },
    { name: 'Irbesartan',         price: 0.089 },
    { name: 'Telmisartan',        price: 0.149 },
  ]},
  C07AB: { name: 'Beta Blockers', drugs: [
    { name: 'Metoprolol',         price: 0.041 },
    { name: 'Atenolol',           price: 0.029 },
    { name: 'Carvedilol',         price: 0.042 },
    { name: 'Bisoprolol',         price: 0.052 },
    { name: 'Propranolol',        price: 0.064 },
  ]},
  C08CA: { name: 'Calcium Channel Blockers', drugs: [
    { name: 'Amlodipine',         price: 0.028 },
    { name: 'Nifedipine',         price: 0.071 },
    { name: 'Felodipine',         price: 0.199 },
    { name: 'Diltiazem',          price: 0.092 },
    { name: 'Verapamil',          price: 0.118 },
  ]},
  C03AA: { name: 'Thiazide Diuretics', drugs: [
    { name: 'Hydrochlorothiazide',price: 0.019 },
    { name: 'Chlorthalidone',     price: 0.048 },
    { name: 'Indapamide',         price: 0.101 },
  ]},
  C03CA: { name: 'Loop Diuretics', drugs: [
    { name: 'Furosemide',         price: 0.027 },
    { name: 'Bumetanide',         price: 0.085 },
    { name: 'Torsemide',          price: 0.062 },
  ]},
  C10AA: { name: 'Statins (HMG-CoA Reductase Inhibitors)', drugs: [
    { name: 'Simvastatin',        price: 0.038 },
    { name: 'Atorvastatin',       price: 0.052 },
    { name: 'Pravastatin',        price: 0.061 },
    { name: 'Lovastatin',         price: 0.078 },
    { name: 'Rosuvastatin',       price: 0.091 },
    { name: 'Fluvastatin',        price: 0.142 },
  ]},
  B01AF: { name: 'Direct Anticoagulants (NOACs)', drugs: [
    { name: 'Apixaban',           price: 5.82 },
    { name: 'Rivaroxaban',        price: 5.64 },
    { name: 'Dabigatran',         price: 5.31 },
  ]},
  B01AC: { name: 'Antiplatelets', drugs: [
    { name: 'Clopidogrel',        price: 0.079 },
    { name: 'Aspirin',            price: 0.009 },
    { name: 'Ticagrelor',         price: 7.20 },
    { name: 'Prasugrel',          price: 6.80 },
  ]},
  H03AA: { name: 'Thyroid Hormones', drugs: [
    { name: 'Levothyroxine',      price: 0.031 },
    { name: 'Liothyronine',       price: 0.241 },
  ]},
  A02BC: { name: 'Proton Pump Inhibitors', drugs: [
    { name: 'Omeprazole',         price: 0.065 },
    { name: 'Pantoprazole',       price: 0.042 },
    { name: 'Esomeprazole',       price: 0.078 },
    { name: 'Lansoprazole',       price: 0.091 },
    { name: 'Rabeprazole',        price: 0.109 },
  ]},
  N02BA: { name: 'Analgesics / Anti-inflammatory', drugs: [
    { name: 'Ibuprofen',          price: 0.042 },
    { name: 'Naproxen',           price: 0.051 },
    { name: 'Acetaminophen',      price: 0.024 },
    { name: 'Celecoxib',          price: 0.289 },
    { name: 'Meloxicam',          price: 0.058 },
  ]},
  R06AE: { name: 'Antihistamines', drugs: [
    { name: 'Cetirizine',         price: 0.031 },
    { name: 'Loratadine',         price: 0.022 },
    { name: 'Diphenhydramine',    price: 0.018 },
    { name: 'Fexofenadine',       price: 0.049 },
    { name: 'Desloratadine',      price: 0.071 },
  ]},
  B03AA: { name: 'Iron Supplements', drugs: [
    { name: 'Slow FE',            price: 0.019 },
    { name: 'Palafer',            price: 0.024 },
    { name: 'Fergon',             price: 0.028 },
    { name: 'ProFerrin',          price: 0.041 },
  ]},
  A11CC: { name: 'Vitamins & Supplements', drugs: [
    { name: 'Vitamin D3',         price: 0.012 },
    { name: 'Vitamin B12',        price: 0.018 },
    { name: 'Folic Acid',         price: 0.014 },
    { name: 'Vitamin C',          price: 0.009 },
    { name: 'Zinc',               price: 0.011 },
  ]},
  N03AX: { name: 'Anticonvulsants / Neuropathic Pain', drugs: [
    { name: 'Gabapentin',         price: 0.032 },
    { name: 'Pregabalin',         price: 0.071 },
    { name: 'Topiramate',         price: 0.048 },
  ]},
};

const DRUG_LOOKUP = {};
for (const [classId, cls] of Object.entries(ATC_CLASSES)) {
  for (const drug of cls.drugs) {
    DRUG_LOOKUP[drug.name.toLowerCase()] = { price: drug.price, classId };
  }
}

// Brand name → generic name aliases
const BRAND_ALIASES = {
  // Analgesics
  'advil': 'ibuprofen', 'motrin': 'ibuprofen', 'nuprin': 'ibuprofen',
  'tylenol': 'acetaminophen', 'paracetamol': 'acetaminophen',
  'aleve': 'naproxen', 'naprosyn': 'naproxen',
  'celebrex': 'celecoxib', 'mobic': 'meloxicam',
  // Antihistamines
  'zyrtec': 'cetirizine', 'reactine': 'cetirizine',
  'claritin': 'loratadine', 'aerius': 'desloratadine',
  'benadryl': 'diphenhydramine', 'allegra': 'fexofenadine', 'allegra-d': 'fexofenadine',
  // Iron supplements — brand names + chemical names both resolve
  'proferin': 'proferrin', 'niferex': 'proferrin',
  'fer-in-sol': 'slow fe', 'feosol': 'slow fe',
  'ferro-sequels': 'palafer', 'palafer': 'palafer',
  'fergon': 'fergon',
  // Chemical name aliases → recognizable brand
  'ferrous sulfate': 'slow fe', 'iron sulfate': 'slow fe',
  'ferrous fumarate': 'palafer', 'iron fumarate': 'palafer',
  'ferrous gluconate': 'fergon', 'iron gluconate': 'fergon',
  'iron polysaccharide': 'proferrin', 'iron polysaccharide complex': 'proferrin',
  // Statins
  'lipitor': 'atorvastatin', 'crestor': 'rosuvastatin', 'zocor': 'simvastatin',
  'pravachol': 'pravastatin', 'lescol': 'fluvastatin',
  // Blood pressure
  'zestril': 'lisinopril', 'prinivil': 'lisinopril',
  'vasotec': 'enalapril', 'altace': 'ramipril',
  'cozaar': 'losartan', 'diovan': 'valsartan', 'benicar': 'olmesartan',
  'norvasc': 'amlodipine', 'cardizem': 'diltiazem',
  'lopressor': 'metoprolol', 'toprol': 'metoprolol',
  'tenormin': 'atenolol', 'coreg': 'carvedilol',
  'microzide': 'hydrochlorothiazide', 'lasix': 'furosemide',
  // Diabetes
  'glucophage': 'metformin', 'glucophage xr': 'metformin er',
  'glucotrol': 'glipizide', 'amaryl': 'glimepiride', 'diabeta': 'glyburide',
  'jardiance': 'empagliflozin', 'farxiga': 'dapagliflozin', 'invokana': 'canagliflozin',
  // Thyroid
  'synthroid': 'levothyroxine', 'levoxyl': 'levothyroxine', 'eltroxin': 'levothyroxine',
  'cytomel': 'liothyronine',
  // GI
  'prilosec': 'omeprazole', 'protonix': 'pantoprazole', 'nexium': 'esomeprazole',
  'prevacid': 'lansoprazole', 'aciphex': 'rabeprazole',
  // Blood thinners
  'eliquis': 'apixaban', 'xarelto': 'rivaroxaban', 'pradaxa': 'dabigatran',
  'plavix': 'clopidogrel', 'brilinta': 'ticagrelor', 'effient': 'prasugrel',
  // Neurology
  'neurontin': 'gabapentin', 'lyrica': 'pregabalin', 'topamax': 'topiramate',
};

// ── Fuzzy drug name matching ─────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Only fuzzy-match against generic names — brand aliases are handled by exact lookup
const ALL_DRUG_KEYS = Object.keys(DRUG_LOOKUP);

function fuzzyResolve(key) {
  // Only try fuzzy if key is at least 4 chars (avoids false positives on short strings)
  if (key.length < 4) return null;
  let best = null, bestDist = Infinity;
  for (const candidate of ALL_DRUG_KEYS) {
    const dist = levenshtein(key, candidate);
    // Accept if distance is ≤ 35% of the longer string's length
    const threshold = Math.floor(Math.max(key.length, candidate.length) * 0.35);
    if (dist <= threshold && dist < bestDist) { bestDist = dist; best = candidate; }
  }
  return best;
}

// ── RxNorm fallback ──────────────────────────────────────────────────────────

async function getRxCUI(name) {
  const res = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=2`);
  const data = await res.json();
  return data?.idGroup?.rxnormId?.[0] || null;
}

async function getRxNormClass(rxcui) {
  const res = await fetch(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}&relaSource=ATC`);
  const data = await res.json();
  const classes = data?.rxclassDrugInfoList?.rxclassDrugInfo || [];
  const ranked = classes.sort((a, b) => (b.rxclassMinConceptItem?.classId?.length || 0) - (a.rxclassMinConceptItem?.classId?.length || 0));
  const best = ranked[0]?.rxclassMinConceptItem;
  return best ? { id: best.classId, name: best.className } : null;
}

// ── Nearby pharmacies via OpenStreetMap Overpass ─────────────────────────────

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearbyPharmacies(lat, lon, radiusM = 5000) {
  const query = `[out:json][timeout:25];(node[amenity=pharmacy](around:${radiusM},${lat},${lon});way[amenity=pharmacy](around:${radiusM},${lat},${lon}););out center 25;`;
  const encoded = encodeURIComponent(query);
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encoded}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
    `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=${encoded}`,
    `https://overpass.openstreetmap.ru/api/interpreter?data=${encoded}`,
  ];
  let data = null;
  for (const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 14000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      const text = await res.text();
      if (text.trim().startsWith('{')) { data = JSON.parse(text); break; }
    } catch { continue; }
  }
  if (!data) throw new Error('Pharmacy service unavailable — try again in a moment');
  const all = (data.elements || [])
    .map(el => {
      const plat = el.lat ?? el.center?.lat;
      const plon = el.lon ?? el.center?.lon;
      const dist = plat && plon ? getDistanceKm(lat, lon, plat, plon) : null;
      return {
        name: el.tags?.name || el.tags?.brand || 'Pharmacy',
        brand: (el.tags?.brand || el.tags?.name || 'Pharmacy').toLowerCase(),
        address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(' '),
        phone: el.tags?.phone || el.tags?.['contact:phone'],
        distKm: dist,
        lat: plat,
        lon: plon,
      };
    })
    .filter(p => p.distKm !== null)
    .sort((a, b) => a.distKm - b.distKm);

  // Cap each brand at 2 locations max, then take top 5 by distance
  const brandCount = {};
  return all.filter(p => {
    brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
    return brandCount[p.brand] <= 2;
  }).slice(0, 5);
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported by your browser')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(new Error(err.code === 1 ? 'Location permission denied' : 'Unable to determine your location')),
      { timeout: 10000 }
    );
  });
}

async function geocodeAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'Vitalyze/1.0' } }
  );
  const data = await res.json();
  if (!data.length) throw new Error(`Location "${address}" not found — try a city name or postal code`);
  const parts = data[0].display_name.split(',');
  const label = parts.slice(0, 3).join(',').trim();
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label };
}

// ── Classification ───────────────────────────────────────────────────────────

function classifyTier(price, allPrices) {
  const sorted = [...allPrices].sort((a, b) => a - b);
  const idx = sorted.findIndex(p => price <= p);
  const pct = idx === -1 ? 99 : Math.round(((idx + 1) / sorted.length) * 100);
  if (pct <= 33) return { tier: 'Low',    pct, color: '#0d9488', bg: 'rgba(13,148,136,0.09)',  border: 'rgba(13,148,136,0.28)' };
  if (pct <= 66) return { tier: 'Medium', pct, color: '#b45309', bg: 'rgba(180,83,9,0.08)',    border: 'rgba(180,83,9,0.22)'   };
  return              { tier: 'High',   pct, color: '#8b2020', bg: 'rgba(139,32,32,0.08)',  border: 'rgba(139,32,32,0.22)'  };
}

// ── Per-drug analysis ────────────────────────────────────────────────────────

async function analyzeDrug(name) {
  const raw = name.trim();
  const key = raw.toLowerCase();

  // 1. Exact generic match
  // 2. Brand alias match
  // 3. Fuzzy match against all known generics + brand names
  const aliasKey = BRAND_ALIASES[key] || key;
  const fuzzyKey = DRUG_LOOKUP[aliasKey] ? aliasKey : (BRAND_ALIASES[aliasKey] || aliasKey);
  const finalKey = DRUG_LOOKUP[fuzzyKey] ? fuzzyKey : (() => {
    const fc = fuzzyResolve(key);
    return fc ? (BRAND_ALIASES[fc] || fc) : null;
  })();

  const correctedFrom = finalKey && finalKey !== key ? raw : null;
  const resolvedKey = finalKey || key;
  const resolvedGenericName = Object.values(ATC_CLASSES).flatMap(c => c.drugs).find(d => d.name.toLowerCase() === resolvedKey)?.name;
  const displayName = correctedFrom && resolvedGenericName
    ? `${resolvedGenericName} (corrected from "${raw}")`
    : resolvedGenericName || raw;

  const local = DRUG_LOOKUP[resolvedKey];
  if (local) {
    const cls = ATC_CLASSES[local.classId];
    const allPrices = cls.drugs.map(d => d.price);
    const classification = classifyTier(local.price, allPrices);
    const alternatives = cls.drugs
      .filter(d => d.name.toLowerCase() !== resolvedKey && d.price < local.price)
      .sort((a, b) => a.price - b.price)
      .slice(0, 2);
    return { name: displayName, ownPrice: local.price, therapeuticClass: { id: local.classId, name: cls.name }, classification, alternatives };
  }
  try {
    const rxcui = await getRxCUI(raw);
    if (!rxcui) return { name, error: 'Drug not found in RxNorm' };
    const tClass = await getRxNormClass(rxcui);
    return { name, rxcui, ownPrice: null, therapeuticClass: tClass, classification: null, alternatives: [], error: 'No pricing data available for this drug' };
  } catch {
    return { name, error: 'Unable to retrieve drug information' };
  }
}

// ── Embedded Leaflet Map ─────────────────────────────────────────────────────

function PharmacyMap({ userLoc, pharmacies }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !userLoc || !pharmacies.length) return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true, touchZoom: true })
      .setView([userLoc.lat, userLoc.lon], 14);
    instanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map);

    // User marker
    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#0a4a5c;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7], className: '',
    });
    L.marker([userLoc.lat, userLoc.lon], { icon: userIcon })
      .addTo(map).bindPopup('<b>Your location</b>');

    // Pharmacy markers
    pharmacies.forEach((p, i) => {
      if (!p.lat || !p.lon) return;
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#e8453c;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${i+1}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], className: '',
      });
      const fmtDist = p.distKm < 1 ? `${Math.round(p.distKm*1000)} m` : `${p.distKm.toFixed(1)} km`;
      L.marker([p.lat, p.lon], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b><br/>${p.address || ''}<br/><span style="color:#0a4a5c;font-weight:600">${fmtDist} away</span>${p.phone ? `<br/>${p.phone}` : ''}`);
    });

    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [userLoc, pharmacies]);

  return <div ref={mapRef} style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 12, position: 'relative', zIndex: 0 }} />;
}

// ── Pharmacy Finder Component ────────────────────────────────────────────────

function PharmacyFinder({ drugNames = [] }) {
  const [state, setState] = useState('idle');
  const [pharmacies, setPharmacies] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [leafletLoaded, setLeafletLoaded] = useState(!!window.L);
  const [locMode, setLocMode] = useState('choose'); // 'choose' | 'gps' | 'manual'
  const [manualInput, setManualInput] = useState('');
  const [searchLabel, setSearchLabel] = useState('');

  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  const runSearch = async (loc, label) => {
    setState('loading');
    try {
      setUserLoc(loc);
      setSearchLabel(label);
      const results = await findNearbyPharmacies(loc.lat, loc.lon);
      setPharmacies(results);
      setState(results.length ? 'done' : 'empty');
    } catch (e) {
      setErrorMsg(e.message);
      setState('error');
    }
  };

  const findGPS = async () => {
    setLocMode('gps');
    setState('loading');
    try {
      const loc = await getUserLocation();
      await runSearch(loc, 'your location');
    } catch (e) {
      setErrorMsg(e.message);
      setState('error');
    }
  };

  const findManual = async () => {
    if (!manualInput.trim()) return;
    setLocMode('manual');
    setState('loading');
    try {
      const geo = await geocodeAddress(manualInput);
      await runSearch({ lat: geo.lat, lon: geo.lon }, geo.label);
    } catch (e) {
      setErrorMsg(e.message);
      setState('error');
    }
  };

  const reset = () => { setState('idle'); setLocMode('choose'); setErrorMsg(''); setManualInput(''); setSearchLabel(''); setPharmacies([]); setUserLoc(null); };

  const fmtDist = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <div style={s.pharmacySection}>
      <div style={s.pharmacyHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={s.pharmIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Nearby Pharmacies</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {searchLabel ? `Showing near ${searchLabel}` : 'Find where to fill your prescription'}
            </div>
          </div>
        </div>
        {(state === 'done' || state === 'empty') && (
          <button onClick={reset} style={{ ...s.locBtn, background: 'rgba(10,74,92,0.06)', color: '#0a4a5c', border: '1px solid rgba(10,74,92,0.2)' }}>
            Change Location
          </button>
        )}
      </div>

      {/* Location picker */}
      {locMode === 'choose' && state === 'idle' && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={findGPS} style={s.locBtn}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Use My Location
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Enter city, address, or postal code…"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findManual()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={findManual} disabled={!manualInput.trim()}
              style={{ ...s.locBtn, opacity: manualInput.trim() ? 1 : 0.4, whiteSpace: 'nowrap' }}>
              Search
            </button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>
          <div style={s.spin} /> {locMode === 'manual' ? `Searching near "${manualInput}"…` : 'Finding pharmacies near you…'}
        </div>
      )}
      {state === 'error' && (
        <div style={{ fontSize: 12, color: '#8b2020', padding: '10px 14px', background: 'var(--red-soft)', borderRadius: 8, border: '1px solid var(--red-border)', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            {errorMsg.toLowerCase().includes('unavailable')
              ? 'The pharmacy lookup service is temporarily busy. Please wait a moment and try again.'
              : errorMsg.toLowerCase().includes('permission') || errorMsg.toLowerCase().includes('denied')
              ? 'Location access was denied. Allow location permissions in your browser settings, or enter a location manually below.'
              : errorMsg}
          </div>
          <button onClick={reset}
            style={{ fontSize: 11, fontWeight: 600, color: '#8b2020', background: 'rgba(139,32,32,0.1)', border: '1px solid rgba(139,32,32,0.25)', borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Try Again
          </button>
        </div>
      )}
      {state === 'empty' && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', fontStyle: 'italic' }}>
          No pharmacies found within 5 km of that location.
        </div>
      )}

      {state === 'done' && pharmacies.length > 0 && (
        <>
          {/* Embedded map */}
          {leafletLoaded && <PharmacyMap userLoc={userLoc} pharmacies={pharmacies} />}

          {/* Pharmacy list */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pharmacies.map((p, i) => (
              <div key={i} style={s.pharmCard}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e8453c', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</div>
                  {p.address
                    ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.address}</div>
                    : <a href={`https://www.google.com/maps/search/${encodeURIComponent(p.name + ' pharmacy')}/@${p.lat},${p.lon},15z`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: '#0a4a5c', marginTop: 2, display: 'block', textDecoration: 'none' }}>
                        View on Google Maps →
                      </a>
                  }
                  {p.phone
                    ? <a href={`tel:${p.phone}`} style={{ fontSize: 11, color: '#0a4a5c', fontWeight: 600, marginTop: 3, display: 'block', textDecoration: 'none' }}>{p.phone}</a>
                    : <a href={`https://www.google.com/search?q=${encodeURIComponent(p.name + ' pharmacy phone number ' + (p.address || ''))}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: '#0a4a5c', marginTop: 3, display: 'block', textDecoration: 'none' }}>
                        Find phone number →
                      </a>
                  }
                  {drugNames.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Prices for <em>{drugNames.join(', ')}</em> vary — call ahead to confirm
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={s.distBadge}>{fmtDist(p.distKm)}</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
              Pharmacy data from OpenStreetMap. Hours and availability may vary. Call ahead for exact pricing.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CostAccessibility({ prescriptions, autoRun = false }) {
  const drugs = prescriptions.filter(p => p.name);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const run = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const out = await Promise.all(
        drugs.map(p => analyzeDrug(p.name).catch(() => ({ name: p.name, error: 'Unable to retrieve information for this drug' })))
      );
      setResults(out);
    } catch {
      setResults(drugs.map(p => ({ name: p.name, error: 'Unable to retrieve drug information' })));
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger when used from Drug Lookup tab
  useEffect(() => {
    if (autoRun && drugs.length && !started) run();
  }, [autoRun]);


  if (!drugs.length) return null;

  return (
    <div style={{ ...s.card, borderColor: 'rgba(10,74,92,0.18)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#0a4a5c 0%,#00c4b4 60%,#0d9488 100%)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: started ? 16 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0a4a5c,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0a4a5c' }}>Medication Cost Guide</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg. acquisition cost · cheaper alternatives in same class · nearby pharmacies</div>
        </div>
        {!started && (
          <button onClick={run} style={s.runBtn}>Check Pricing</button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
          <div style={s.spin} />
          Analyzing medication costs…
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          {results.map((r, i) => <DrugCostCard key={i} data={r} />)}

          {/* Pharmacy Finder */}
          <PharmacyFinder drugNames={drugs.map(d => d.name)} />

          <div style={s.disclaimer}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Pricing is for educational purposes only, based on public NADAC/CMS average acquisition cost data. Actual costs vary by insurance, pharmacy, and location. Always consult your doctor or pharmacist before switching medications.
          </div>
        </>
      )}
    </div>
  );
}

// ── Drug Cost Card ───────────────────────────────────────────────────────────

function DrugCostCard({ data }) {
  const { name, therapeuticClass, ownPrice, classification, alternatives, error } = data;
  return (
    <div style={{ ...s.drugCard, ...(classification ? { borderColor: classification.border, background: classification.bg } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
          {therapeuticClass && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Class: {therapeuticClass.name}</div>}
        </div>
        {classification && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: classification.bg, color: classification.color, border: `1px solid ${classification.border}`, whiteSpace: 'nowrap' }}>
            {classification.tier} Cost
          </span>
        )}
        {!classification && !error && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--navy-soft)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>No price data</span>
        )}
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: therapeuticClass ? 4 : 0 }}>{error}</div>}

      {ownPrice !== null && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: alternatives?.length ? 10 : 0 }}>
          Avg. acquisition cost: <strong>${ownPrice < 0.1 ? ownPrice.toFixed(3) : ownPrice.toFixed(2)}/unit</strong>
          {classification && <span style={{ color: classification.color }}> — {classification.pct}th percentile in its class</span>}
        </div>
      )}

      {alternatives?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Lower-cost alternatives in same class
          </div>
          {alternatives.map((alt, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', padding: '5px 0', borderBottom: i < alternatives.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontWeight: 500 }}>{alt.name}</span>
              <span style={{ color: '#0d9488', fontWeight: 600 }}>${alt.price < 0.1 ? alt.price.toFixed(3) : alt.price.toFixed(2)}/unit</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            Same therapeutic class — discuss with your doctor before switching.
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, marginBottom: 14, boxShadow: 'var(--shadow-sm)' },
  drugCard: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 13, padding: '14px 16px', marginBottom: 10 },
  runBtn: { padding: '7px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#0a4a5c,#0d9488)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  spin: { width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: '#00c4b4', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 },
  disclaimer: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8, padding: '10px 12px', background: 'var(--navy-soft)', borderRadius: 9, border: '1px solid var(--border)' },

  // Pharmacy finder
  pharmacySection: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 13, padding: '14px 16px', marginBottom: 10, marginTop: 4 },
  pharmacyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pharmIcon: { width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#8b2020,#e8453c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  locBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--red-border)', background: 'var(--red-soft)', color: '#8b2020', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  pharmCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '9px 12px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' },
  pharmDot: { width: 6, height: 6, borderRadius: '50%', background: '#e8453c', display: 'inline-block', flexShrink: 0 },
  distBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--teal-soft)', border: '1px solid var(--teal-border)', color: '#0a4a5c' },
  mapLink: { fontSize: 11, color: '#0a4a5c', fontWeight: 500, textDecoration: 'none' },
};
