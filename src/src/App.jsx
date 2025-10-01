import React, { useState, useMemo } from 'react';

/*
  Aklla — Formulador de Jabones (Glicerina & Saponificado)
  Single-file app for planning formulas. Validate in lab before production.
*/

// Ingredient library (extend as needed)
const INGREDIENT_LIBRARY = [
  // Polvos y plantas
  { id: 'charcoal', name: 'Carbón activado (polvo)', category: 'Polvos', defaultPercent: 2 },
  { id: 'ricePowder', name: 'Polvo de arroz', category: 'Polvos', defaultPercent: 3 },
  { id: 'maracuyaSeeds', name: 'Pepas maracuyá (molidas)', category: 'Polvos', defaultPercent: 5 },
  { id: 'manzanilla', name: 'Manzanilla (polvo/infusión)', category: 'Polvos', defaultPercent: 2 },

  // Arcillas
  { id: 'greenClay', name: 'Arcilla verde', category: 'Arcillas', defaultPercent: 4 },
  { id: 'whiteClay', name: 'Arcilla blanca', category: 'Arcillas', defaultPercent: 4 },
  { id: 'yellowClay', name: 'Arcilla amarilla', category: 'Arcillas', defaultPercent: 4 },
  { id: 'pinkClay', name: 'Arcilla rosada', category: 'Arcillas', defaultPercent: 4 },

  // Bases
  { id: 'glycerinBase', name: 'Base de glicerina (vegetal)', category: 'Bases', defaultPercent: 85 },

  // Surfactantes / co-tensioactivos
  { id: 'decyl', name: 'Decyl Glucoside', category: 'Surfactantes', defaultPercent: 2 },

  // Aceites vegetales (for saponified recipes) - sapNaoh = NaOH g per g oil
  { id: 'coconutOil', name: 'Aceite de coco', category: 'AceitesVegetales', defaultPercent: 12, sapNaoh: 0.190 },
  { id: 'oliveOil', name: 'Aceite de oliva', category: 'AceitesVegetales', defaultPercent: 30, sapNaoh: 0.134 },
  { id: 'castorOil', name: 'Aceite de ricino', category: 'AceitesVegetales', defaultPercent: 5, sapNaoh: 0.128 },
  { id: 'sunflowerOil', name: 'Aceite girasol', category: 'AceitesVegetales', defaultPercent: 20, sapNaoh: 0.136 },
  { id: 'almondOil', name: 'Aceite almendras', category: 'AceitesVegetales', defaultPercent: 10, sapNaoh: 0.136 },

  // Hidrolatos
  { id: 'roseHydrosol', name: 'Hidrolato de rosas', category: 'Hidrolatos', defaultPercent: 5 },

  // Ceras / Emolientes
  { id: 'beeswax', name: 'Cera de abejas', category: 'Ceras', defaultPercent: 2 },

  // Aceites esenciales y aromas
  { id: 'mentaEO', name: 'Aceite esencial de menta', category: 'AceitesEsenciales', defaultPercent: 0.5 },
  { id: 'lavenderEO', name: 'Aceite esencial de lavanda', category: 'AceitesEsenciales', defaultPercent: 0.6 },
  { id: 'aromaCoco', name: 'Aroma natural (coco)', category: 'Aromas', defaultPercent: 1.5 },

  // Conservantes
  { id: 'sharomix', name: 'Conservante (Sharomix)', category: 'Conservantes', defaultPercent: 0.3 },
];

// Helpers
function percentToGrams(percent, total) { return (percent / 100) * total; }
function gramsToPercent(grams, total) { if (total === 0) return 0; return (grams / total) * 100; }

// NaOH calculations
function calculateNaOHForOils(oils, totalBatchGrams, superfatPercent = 5) {
  // oils: [{name, percent, sapNaoh}]
  const result = { totalOilGrams: 0, naohGrams: 0, lyeWaterGrams: 0, totalNaohUnadjusted: 0 };
  let totalNaoh = 0;
  oils.forEach(o => {
    const g = (o.percent / 100) * totalBatchGrams;
    result.totalOilGrams += g;
    if (!o.sapNaoh) return;
    totalNaoh += g * o.sapNaoh;
  });
  result.totalNaohUnadjusted = totalNaoh;
  const naohAfterSuperfat = totalNaoh * (1 - superfatPercent / 100);
  result.naohGrams = naohAfterSuperfat;
  // default water as 38% of oils weight (editable in UI later)
  const waterPercentOfOils = 38;
  result.lyeWaterGrams = (waterPercentOfOils / 100) * result.totalOilGrams;
  return result;
}

export default function App() {
  const [soapType, setSoapType] = useState('glicerina'); // 'glicerina' | 'saponificado'
  const [batchWeight, setBatchWeight] = useState(800);
  const [superfat, setSuperfat] = useState(5);
  const [ingredients, setIngredients] = useState(() => ([
    { id: 'glycerinBase', percent: 85, grams: percentToGrams(85, 800) },
    { id: 'decyl', percent: 2, grams: percentToGrams(2, 800) },
    { id: 'charcoal', percent: 2, grams: percentToGrams(2, 800) },
    { id: 'mentaEO', percent: 0.5, grams: percentToGrams(0.5, 800) },
  ]));

  const libraryById = useMemo(() => {
    const map = {};
    INGREDIENT_LIBRARY.forEach(i => (map[i.id] = i));
    return map;
  }, []);

  function addIngredientFromLibrary(id) {
    const lib = libraryById[id];
    if (!lib) return;
    setIngredients(prev => {
      if (prev.find(p => p.id === id)) return prev;
      const percent = lib.defaultPercent || 1;
      const grams = percentToGrams(percent, batchWeight);
      return [...prev, { id, percent, grams }];
    });
  }

  function updateIngredientPercent(id, percent) {
    setIngredients(prev => prev.map(it => it.id === id ? ({ ...it, percent: Number(percent) || 0, grams: percentToGrams(Number(percent) || 0, batchWeight) }) : it));
  }

  function updateIngredientGrams(id, grams) {
    setIngredients(prev => prev.map(it => it.id === id ? ({ ...it, grams: Number(grams) || 0, percent: gramsToPercent(Number(grams) || 0, batchWeight) }) : it));
  }

  function removeIngredient(id) { setIngredients(prev => prev.filter(i => i.id !== id)); }

  function setTotalBatchWeight(g) {
    const gw = Math.max(1, Number(g) || 0);
    setBatchWeight(gw);
    setIngredients(prev => prev.map(it => ({ ...it, grams: percentToGrams(it.percent, gw) })));
  }

  const totalPercent = useMemo(() => ingredients.reduce((s, i) => s + (Number(i.percent) || 0), 0), [ingredients]);
  const totalGrams = useMemo(() => ingredients.reduce((s, i) => s + (Number(i.grams) || 0), 0), [ingredients]);

  const oilsForNaOH = useMemo(() => {
    if (soapType !== 'saponificado') return [];
    return ingredients.map(i => ({ ...libraryById[i.id], percent: i.percent })).filter(i => i && i.category === 'AceitesVegetales');
  }, [ingredients, soapType, libraryById]);

  const naohCalc = useMemo(() => {
    if (soapType !== 'saponificado') return null;
    return calculateNaOHForOils(oilsForNaOH, batchWeight, superfat);
  }, [oilsForNaOH, batchWeight, superfat, soapType]);

  const suggestedPH = soapType === 'glicerina' ? '7.0 - 8.5 (ideal 7.0 - 7.5 para bebés)' : '9.0 - 10.5 (normal en saponificado)';

  function autoBalancePercents() {
    const total = totalPercent;
    if (total <= 0) return;
    const factor = 100 / total;
    setIngredients(prev => prev.map(it => {
      const newPercent = +(it.percent * factor).toFixed(3);
      return { ...it, percent: newPercent, grams: percentToGrams(newPercent, batchWeight) };
    }));
  }

  function normalizeToBase() {
    if (soapType === 'glicerina') {
      const baseId = 'glycerinBase';
      const othersPercent = ingredients.reduce((s, i) => (i.id === baseId ? s : s + i.percent), 0);
      const targetBase = Math.max(0, 100 - othersPercent);
      if (ingredients.find(i => i.id === baseId)) {
        updateIngredientPercent(baseId, targetBase);
      } else {
        addIngredientFromLibrary(baseId);
        setTimeout(() => updateIngredientPercent(baseId, targetBase), 0);
      }
    } else {
      // For saponified recipes we don't auto-adjust oils here
      alert('Para saponificado: ajusta manualmente los % de aceites vegetales (herramienta NaOH mostrará cálculo).');
    }
  }

  function exportJSON() {
    const out = {
      soapType,
      batchWeight,
      superfat,
      totalPercent: +totalPercent.toFixed(3),
      totalGrams: +totalGrams.toFixed(2),
      suggestedPH,
      ingredients: ingredients.map(i => ({ id: i.id, name: libraryById[i.id]?.name || i.id, percent: +i.percent, grams: +i.grams })),
      naoh: naohCalc ? { naohGrams: +naohCalc.naohGrams.toFixed(3), waterGrams: +naohCalc.lyeWaterGrams.toFixed(2), totalOilsGrams: +naohCalc.totalOilGrams.toFixed(2), totalNaohUnadjusted: +naohCalc.totalNaohUnadjusted.toFixed(3) } : null,
    };
    return JSON.stringify(out, null, 2);
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Aklla — Formulador de Jabones</h1>
            <p className="text-sm text-slate-600">Planea fórmulas, calcula %/g y NaOH (saponificado). Validar en laboratorio antes de producción.</p>
          </div>
          <div className="text-sm text-slate-500">
            <div>Batch: <strong>{batchWeight} g</strong></div>
            <div>Tipo: <strong className="capitalize">{soapType}</strong></div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-2 items-center mb-3">
              <button onClick={() => setSoapType('glicerina')} className={`px-3 py-1 rounded ${soapType === 'glicerina' ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>Glicerina (M&P)</button>
              <button onClick={() => setSoapType('saponificado')} className={`px-3 py-1 rounded ${soapType === 'saponificado' ? 'bg-amber-500 text-white' : 'bg-slate-200'}`}>Saponificado (Cold process)</button>
              <div className="ml-auto flex gap-2 items-center">
                <label className="text-sm">Batch (g)</label>
                <input className="w-28 border rounded px-2 py-1" type="number" value={batchWeight} onChange={e => setTotalBatchWeight(e.target.value)} />
                {soapType === 'saponificado' && (
                  <>
                    <label className="text-sm">Superfat (%)</label>
                    <input className="w-20 border rounded px-2 py-1" type="number" value={superfat} onChange={e => setSuperfat(Number(e.target.value))} />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {ingredients.map(it => (
                <div key={it.id} className="flex items-center gap-3 p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{libraryById[it.id]?.name || it.id}</div>
                    <div className="text-xs text-slate-500">{libraryById[it.id]?.category || 'Personalizado'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs">%</label>
                    <input className="w-20 border rounded px-1 py-0.5" type="number" step="0.001" value={it.percent} onChange={e => updateIngredientPercent(it.id, e.target.value)} />
                    <label className="text-xs">g</label>
                    <input className="w-28 border rounded px-1 py-0.5" type="number" step="0.01" value={it.grams} onChange={e => updateIngredientGrams(it.id, e.target.value)} />
                    <button className="text-red-600 text-sm" onClick={() => removeIngredient(it.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={autoBalancePercents} className="px-3 py-1 rounded bg-slate-800 text-white">Normalizar a 100%</button>
              <button onClick={normalizeToBase} className="px-3 py-1 rounded bg-emerald-600 text-white">Rellenar base automáticamente</button>
              <button onClick={() => setIngredients([])} className="px-3 py-1 rounded bg-red-500 text-white">Limpiar</button>
            </div>

            <div className="mt-4 border-t pt-3">
              <h3 className="font-semibold">Resumen</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                <div>Total %: <strong>{totalPercent.toFixed(3)}%</strong></div>
                <div>Total g ingredientes: <strong>{totalGrams.toFixed(2)} g</strong></div>
                <div>Batch objetivo: <strong>{batchWeight} g</strong></div>
                <div>pH sugerido: <strong>{suggestedPH}</strong></div>
              </div>
            </div>
          </div>

          <aside>
            <div className="p-3 border rounded mb-3">
              <h4 className="font-semibold">Biblioteca</h4>
              <div className="max-h-72 overflow-auto mt-2 space-y-2">
                {INGREDIENT_LIBRARY.map(lib => (
                  <div key={lib.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="text-sm">{lib.name}</div>
                      <div className="text-xs text-slate-500">{lib.category} • default {lib.defaultPercent}%</div>
                    </div>
                    <div>
                      <button onClick={() => addIngredientFromLibrary(lib.id)} className="px-2 py-1 rounded bg-slate-200">Agregar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border rounded">
              <h4 className="font-semibold">pH & notas</h4>
              <div className="text-sm text-slate-600 mt-2">
                <p><strong>Glicerina:</strong> pH objetivo 7.0–8.5. Ajustar con ácido láctico en microdosis si necesita bajar.</p>
                <p className="mt-2"><strong>Saponificado:</strong> pH típico 9.0–10.5; con tiempo y curado baja. No aplicar acidos sin pruebas.</p>
                <p className="mt-2 text-xs text-amber-700">Advertencia: validar conservantes y realizar challenge test si hay agua/hidrolatos.</p>
              </div>
            </div>
          </aside>
        </section>

        {soapType === 'saponificado' && (
          <section className="mt-4 p-4 border rounded bg-slate-50">
            <h3 className="font-semibold">Cálculo NaOH (estimado)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div>Total aceites (g): <strong>{naohCalc ? naohCalc.totalOilGrams.toFixed(2) : '0.00'}</strong></div>
              <div>NaOH requerido (g): <strong>{naohCalc ? naohCalc.naohGrams.toFixed(3) : '0.000'}</strong></div>
              <div>Agua para lejía (g): <strong>{naohCalc ? naohCalc.lyeWaterGrams.toFixed(2) : '0.00'}</strong></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Valores teóricos basados en SAP values. Ajusta SAP, % agua y seguridad según tu proveedor.</p>
          </section>
        )}

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold">Recomendaciones rápidas</h3>
            <ul className="list-disc ml-5 text-sm mt-2 text-slate-600">
              <li>Pesa ingredientes <0.5 g con balanza 0.01 g.</li>
              <li>Prueba de parche para piel sensible.</li>
              <li>Si usas hidrolatos o agua, añade conservante y hace challenge test.</li>
              <li>Registra lote, fecha, operador y materias primas (proveedor/lote).</li>
            </ul>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold">Exportar / Guardar</h3>
            <textarea readOnly className="w-full h-44 border rounded p-2 font-mono text-xs" value={exportJSON()} />
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => navigator.clipboard.writeText(exportJSON())}>Copiar JSON</button>
              <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={() => {
                const blob = new Blob([exportJSON()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `formulacion_aklla_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Descargar JSON</button>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-xs text-slate-500">
          <strong>Nota legal y seguridad:</strong> herramienta de planificación. No sustituye pruebas de laboratorio, challenge test microbiológico ni verificación con proveedores. Sigue protocolos de manipulación de NaOH y EPP.
        </footer>
      </div>
    </div>
  );
  }
   
