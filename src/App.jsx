import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas'; 
import { 
  BarChart3, TrendingUp, Landmark, Crown, Calculator, PieChart, 
  BookOpen, ChevronRight, ChevronDown, StickyNote, Moon, Sun, RotateCcw, Heart, Activity, 
  Settings, Zap, Download, Image as ImageIcon, Pencil, 
  MessageSquareQuote, X, Check
} from 'lucide-react';
import { 
  LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceDot, Area, ReferenceLine, Legend, ReferenceArea 
} from 'recharts';

// ==========================================
// 1. DATA & TRANSLATIONS
// ==========================================

// Numerische Parameter für Szenarien (Text kommt aus translations)
const SCENARIO_PARAMS = {
  1: { 
    model: "Marktmodell", 
    dI: 100, dS: 1, sI: 20, sS: 1, gMode: 'tax', gAmt: 0, fixed: 50,
    emoji: "🥙"
  },
  2: { 
    model: "Monopol", 
    dI: 140, dS: 1.2, sI: 10, sS: 0.2, gMode: 'tax', gAmt: 0, fixed: 200,
    emoji: "🚆"
  },
  3: { 
    model: "Budgetgerade", 
    inc: 200, p1: 40, p2: 20, pref: 0.6,
    emoji: "🎮"
  }
};

const translations = {
  de: {
    title: "VWL Simulator",
    models: { market: "Marktmodell", monopoly: "Monopol", budget: "Budgetgerade" },
    settings: { title: "Einstellungen", lang: "Sprache", currency: "Währung", grid: "Gitter", anim: "Animation", download: "Exportieren" },
    controls: { 
      axisHeader: "Achsen-Beschriftung", axisX: "X-Achse Name", axisY: "Y-Achse Name", apply: "Ändern",
      demand: "Nachfrage", supply: "Angebot", cost: "Kosten", 
      maxPrice: "Max. Preis", slope: "Steigung", startCost: "Startkosten", 
      fixCost: "Fixkosten", income: "Budget", price: "Preis", pref: "Präferenz",
      mcSlope: "GK Steigung"
    },
    ticker: {
      title: "Markt-Ticker (Szenarien)",
      events: {
        oil: { t: "🛢️ Öl-Krise", d: "Angebotsschock (links)" },
        tech: { t: "🤖 KI-Boom", d: "Angebotsschock (rechts)" },
        summer: { t: "☀️ Urlaubszeit", d: "Nachfrage steigt" },
        recession: { t: "📉 Rezession", d: "Nachfrage sinkt" }
      }
    },
    state: { title: "Staat", tax: "Steuer", sub: "Subvention", amount: "Höhe" },
    charts: { q: "Menge", p: "Preis", mr: "Grenzerlös", mc: "Grenzkosten", atc: "DK", budget: "Budget", utility: "Nutzen", demand: "Nachfrage", supply: "Angebot", supply_eff: "Angebot (+St/Sub)" },
    analysis: { 
      price: "Marktpreis", profit: "Gewinn", cs: "Konsumentenrente", ps: "Produzentenrente", 
      dwl: "Wohlfahrtsverlust", elasticity: "Elastizität", steps: "Rechenweg", welfare: "Wohlfahrt",
      optimalBundle: "Optimales Bündel", taxRev: "Steuereinnahmen", subCost: "Subventionskosten",
      info: "Info"
    },
    stories: {
        market: "Im Gleichgewicht werden {q} Einheiten zu je {p} gehandelt.",
        monopoly: "Der Monopolist setzt den Preis auf {p} (über den Grenzkosten) und macht {profit} Gewinn.",
        budget: "Für maximalen Nutzen kaufst du {x}x {lblX} und {y}x {lblY}."
    },
    math: {
      eq: "1. Gleichsetzen", solve: "2. Nach Q auflösen", p_calc: "3. Preis ermitteln",
      condition: "Bedingung: MR = MC", budget_eq: "Budgetgleichung", slope_calc: "Steigung"
    },
    elast: {
      elastic: "Elastisch (|ε| > 1)", inelastic: "Unelastisch (|ε| < 1)", unit: "Einheitselastisch"
    },
    scenarios: {
      title: "Aufgaben",
      1: { t: "Döner-Markt", lX: "Döner", lY: "Preis (€)", s: "Der Döner-Markt in der Innenstadt. Herrscht vollkommene Konkurrenz? Was passiert bei einer Döner-Steuer?" },
      2: { t: "Bahn-Monopol", lX: "Fahrgäste", lY: "Ticketpreis (€)", s: "Einziger Bahnanbieter auf der Strecke. Hohe Fixkosten für das Schienennetz. Wo liegt das Gewinnmaximum?" },
      3: { t: "Party vs. Bücher", lX: "Videospiele", lY: "Pizza", s: "Du hast 200€ Budget. Games kosten 40€, Pizza 20€. Finde dein optimales Bündel für maximalen Nutzen." }
    },
    theory: {
      title: "Theorie-Guide",
      market: { h: "Vollständige Konkurrenz", intro: "Ein Marktmodell ohne Marktmacht einzelner Akteure.", concepts: [{ t: "Markträumung", c: "Angebot = Nachfrage" }, { t: "Wohlfahrt", c: "Summe aus Konsumenten- und Produzentenrente" }] },
      monopoly: { h: "Monopol", intro: "Ein Markt mit nur einem Anbieter.", concepts: [{ t: "Cournot-Punkt", c: "MR = MC bestimmt Menge, Nachfragekurve bestimmt Preis" }] },
      budget: { h: "Haushaltstheorie", intro: "Nutzenmaximierung unter Budgetrestriktion.", concepts: [{ t: "Budgetgerade", c: "Grenze des Machbaren" }] }
    }
  },
  en: {
    title: "Econ Simulator",
    models: { market: "Market Model", monopoly: "Monopoly", budget: "Consumer Choice" },
    settings: { title: "Settings", lang: "Language", currency: "Currency", grid: "Grid", anim: "Anim", download: "Export" },
    controls: { 
      axisHeader: "Axis Labels", axisX: "X-Axis Name", axisY: "Y-Axis Name", apply: "Apply",
      demand: "Demand", supply: "Supply", cost: "Costs", maxPrice: "Max Price", slope: "Slope", startCost: "Start Cost", fixCost: "Fixed Cost", income: "Budget", price: "Price", pref: "Preference", mcSlope: "MC Slope" 
    },
    ticker: {
      title: "Market Ticker",
      events: {
        oil: { t: "🛢️ Oil Crisis", d: "Supply Shock (Left)" },
        tech: { t: "🤖 AI Boom", d: "Supply Shock (Right)" },
        summer: { t: "☀️ Holiday", d: "Demand Rises" },
        recession: { t: "📉 Recession", d: "Demand Falls" }
      }
    },
    state: { title: "Govt", tax: "Tax", sub: "Subsidy", amount: "Amount" },
    charts: { q: "Quantity", p: "Price", mr: "MR", mc: "MC", atc: "ATC", budget: "Budget", utility: "Utility", demand: "Demand", supply: "Supply", supply_eff: "Supply (+Tax/Sub)" },
    analysis: { price: "Price", profit: "Profit", cs: "Cons. Surplus", ps: "Prod. Surplus", dwl: "Deadweight Loss", elasticity: "Elasticity", steps: "Calc", welfare: "Welfare", optimalBundle: "Optimal Bundle", taxRev: "Tax Revenue", subCost: "Subsidy Cost", info: "Info" },
    stories: {
        market: "In equilibrium, {q} units are traded at {p} each.",
        monopoly: "The monopolist sets the price at {p} (above MC) and makes {profit} profit.",
        budget: "For max utility you buy {x}x {lblX} and {y}x {lblY}."
    },
    math: { eq: "1. Equate D = S", solve: "2. Solve for Q", p_calc: "3. Calc Price", condition: "Condition: MR = MC", budget_eq: "Budget Eq", slope_calc: "Slope" },
    elast: { elastic: "Elastic (|ε| > 1)", inelastic: "Inelastic (|ε| < 1)", unit: "Unit Elastic" },
    scenarios: {
      title: "Tasks",
      1: { t: "Kebab Market", lX: "Kebab", lY: "Price", s: "Local Kebab market. Perfect competition? What happens with a Kebab tax?" },
      2: { t: "Rail Monopoly", lX: "Passengers", lY: "Ticket Price", s: "Single rail provider. High fixed costs. Where is the profit maximum?" },
      3: { t: "Books vs. Party", lX: "Games", lY: "Pizza", s: "Budget 200. Games 40, Pizza 20. Find optimal bundle." }
    },
    theory: { title: "Theory Guide", market: { h: "Perfect Competition", intro: "No market power.", concepts: [{ t: "Clearance", c: "S = D"}] }, monopoly: { h: "Monopoly", intro: "Single seller.", concepts: [] }, budget: { h: "Consumer Choice", intro: "Max Utility.", concepts: [] } }
  },
  es: {
    title: "Simulador Econ",
    models: { market: "Mercado", monopoly: "Monopolio", budget: "Consumidor" },
    settings: { title: "Ajustes", lang: "Idioma", currency: "Moneda", grid: "Red", anim: "Anim", download: "Exportar" },
    controls: { 
      axisHeader: "Etiquetas de Ejes", axisX: "Nombre Eje X", axisY: "Nombre Eje Y", apply: "Aplicar",
      demand: "Demanda", supply: "Oferta", cost: "Costos", maxPrice: "Precio Max", slope: "Pendiente", startCost: "Costo Ini", fixCost: "Costo Fijo", income: "Presupuesto", price: "Precio", pref: "Preferencia", mcSlope: "CM Pendiente" 
    },
    ticker: {
      title: "Noticias de Mercado",
      events: {
        oil: { t: "🛢️ Crisis Petrolera", d: "Choque Oferta (Izq)" },
        tech: { t: "🤖 Boom IA", d: "Choque Oferta (Der)" },
        summer: { t: "☀️ Vacaciones", d: "Sube Demanda" },
        recession: { t: "📉 Recesión", d: "Baja Demanda" }
      }
    },
    state: { title: "Gobierno", tax: "Impuesto", sub: "Subsidio", amount: "Monto" },
    charts: { q: "Cantidad", p: "Precio", mr: "IM", mc: "CM", atc: "CMe", budget: "Presupuesto", utility: "Utilidad", demand: "Demanda", supply: "Oferta", supply_eff: "Oferta (+Imp)" },
    analysis: { price: "Precio", profit: "Beneficio", cs: "Exc. Cons.", ps: "Exc. Prod.", dwl: "Pérd. Efic.", elasticity: "Elasticidad", steps: "Cálculo", welfare: "Bienestar", optimalBundle: "Canasta Óptima", taxRev: "Ingresos", subCost: "Costo Sub.", info: "Info" },
    stories: {
        market: "En equilibrio, se comercian {q} unidades a {p} cada una.",
        monopoly: "El monopolista fija el precio en {p} (sobre CM) y obtiene {profit} de beneficio.",
        budget: "Para máxima utilidad compras {x}x {lblX} y {y}x {lblY}."
    },
    math: { eq: "1. Igualar D = O", solve: "2. Resolver Q", p_calc: "3. Calc Precio", condition: "Condición: IM = CM", budget_eq: "Ec. Presupuesto", slope_calc: "Pendiente" },
    elast: { elastic: "Elástica (|ε| > 1)", inelastic: "Inelástica (|ε| < 1)", unit: "Elast. Unitaria" },
    scenarios: {
      title: "Ejercicios",
      1: { t: "Kebab", lX: "Kebab", lY: "Precio", s: "Mercado de Kebab. ¿Competencia perfecta? ¿Qué pasa con un impuesto?" },
      2: { t: "Tren", lX: "Pasajeros", lY: "Boleto", s: "Único proveedor. Altos costos fijos. ¿Dónde está el máximo beneficio?" },
      3: { t: "Libros vs Fiesta", lX: "Juegos", lY: "Pizza", s: "Presupuesto 200. Juegos 40, Pizza 20. Encuentra canasta óptima." }
    },
    theory: { title: "Guía Teórica", market: { h: "Competencia Perfecta", intro: "Sin poder.", concepts: [] }, monopoly: { h: "Monopolio", intro: "Vendedor único.", concepts: [] }, budget: { h: "Consumidor", intro: "Max Utilidad.", concepts: [] } }
  }
};

const AccordionItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-2 shrink-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-200 dark:border-gray-700">
          {content}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

function App() {
  const [lang, setLang] = useState("de");
  const t = translations[lang] || translations.de;

  // UI STATES
  const [activeModel, setActiveModel] = useState("Marktmodell");
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  
  // SETTINGS
  const [currency, setCurrency] = useState("€");
  const [showGrid, setShowGrid] = useState(true);
  const [animations, setAnimations] = useState(true);

  // PARAMETERS (Market & Monopoly)
  const [demandIntercept, setDemandIntercept] = useState(80);
  const [demandSlope, setDemandSlope] = useState(0.8);
  const [supplyIntercept, setSupplyIntercept] = useState(20);
  const [supplySlope, setSupplySlope] = useState(0.5);
  const [fixedCost, setFixedCost] = useState(50);
  const [govMode, setGovMode] = useState("tax");
  const [govAmount, setGovAmount] = useState(0); 

  // PARAMETERS (Budget)
  const [income, setIncome] = useState(100); 
  const [priceX, setPriceX] = useState(10);  
  const [priceY, setPriceY] = useState(10); 
  const [preference, setPreference] = useState(0.5);

  // LABELS
  const [labelXInput, setLabelXInput] = useState("Menge");
  const [labelYInput, setLabelYInput] = useState("Preis");
  const [appliedLabelX, setAppliedLabelX] = useState("Menge");
  const [appliedLabelY, setAppliedLabelY] = useState("Preis");

  // REFS
  const settingsRef = useRef(null);
  const downloadRef = useRef(null);
  const captureRef = useRef(null);

  // --- EFFECTS & HELPERS ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Update labels when model changes OR lang changes (unless user is in a scenario)
  useEffect(() => {
    if (activeScenarioId) {
        // If inside a scenario, update labels based on current language scenario text
        const sText = t.scenarios[activeScenarioId];
        if (sText) {
            setLabelXInput(sText.lX); setLabelYInput(sText.lY); 
            setAppliedLabelX(sText.lX); setAppliedLabelY(sText.lY);
        }
    } else {
        // Default labels based on model
        const defaultX = activeModel === "Budgetgerade" ? "Gut X" : t.charts.q;
        const defaultY = activeModel === "Budgetgerade" ? "Gut Y" : t.charts.p;
        setLabelXInput(defaultX); setLabelYInput(defaultY); 
        setAppliedLabelX(defaultX); setAppliedLabelY(defaultY);
    }
  }, [lang, activeModel, activeScenarioId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettings(false);
      if (downloadRef.current && !downloadRef.current.contains(event.target)) setShowDownloadMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyLabels = () => { setAppliedLabelX(labelXInput); setAppliedLabelY(labelYInput); };

  const loadScenario = (id) => {
    const sParams = SCENARIO_PARAMS[id];
    const sText = t.scenarios[id]; // Hole Texte aus aktueller Sprache

    setActiveModel(sParams.model);
    if (sParams.model === "Budgetgerade") {
      setIncome(sParams.inc); setPriceX(sParams.p1); setPriceY(sParams.p2); setPreference(sParams.pref);
    } else {
      setDemandIntercept(sParams.dI); setDemandSlope(sParams.dS); setSupplyIntercept(sParams.sI); setSupplySlope(sParams.sS);
      setGovMode(sParams.gMode); setGovAmount(sParams.gAmt);
      if (sParams.fixed) setFixedCost(sParams.fixed);
    }
    
    // Labels aus Text setzen
    setLabelXInput(sText.lX); setLabelYInput(sText.lY); 
    setAppliedLabelX(sText.lX); setAppliedLabelY(sText.lY);
    setActiveScenarioId(id);
  };

  const resetValues = () => {
    setDemandIntercept(80); setDemandSlope(0.8); setSupplyIntercept(20); setSupplySlope(0.5); setFixedCost(50);
    setGovAmount(0); setIncome(100); setPriceX(10); setPriceY(10); setPreference(0.5);
    // Labels reset via Effect when activeScenarioId becomes null
    setActiveScenarioId(null);
  };

  // --- EVENTS LOGIC ---
  const triggerEvent = (eventId) => {
    const logic = {
      'oil': (setS, setD) => { setS(prev => ({ i: Math.min(90, prev.i + 25), s: prev.s + 0.3 })); },
      'tech': (setS, setD) => { setS(prev => ({ i: Math.max(5, prev.i - 15), s: prev.s * 0.8 })); },
      'summer': (setS, setD) => { setD(prev => ({ i: Math.min(190, prev.i + 30), s: prev.s })); },
      'recession': (setS, setD) => { setD(prev => ({ i: Math.max(40, prev.i - 30), s: prev.s })); }
    };

    const apply = logic[eventId];
    if (apply) {
        const setSupplyWrapper = (cb) => {
          const cur = { i: supplyIntercept, s: supplySlope };
          const next = cb(cur);
          setSupplyIntercept(next.i); setSupplySlope(next.s);
        };
        const setDemandWrapper = (cb) => {
          const cur = { i: demandIntercept, s: demandSlope };
          const next = cb(cur);
          setDemandIntercept(next.i); setDemandSlope(next.s);
        };
        apply(setSupplyWrapper, setDemandWrapper);
    }
  };

  const handleDownload = (format) => {
    if (!captureRef.current) return;
    setShowDownloadMenu(false);
    setTimeout(async () => {
        try {
          const canvas = await html2canvas(captureRef.current, {
            scale: 2, useCORS: true, allowTaint: true, foreignObjectRendering: true, logging: false,
            backgroundColor: darkMode ? '#030712' : '#f9fafb',
            scrollX: 0, scrollY: 0,
            windowWidth: document.documentElement.offsetWidth, windowHeight: document.documentElement.offsetHeight
          });
          const link = document.createElement("a");
          link.download = `vwl-sim-${activeModel}.${format}`;
          link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`, 0.9);
          link.click();
        } catch (err) { console.error(err); alert("Fehler beim Export."); }
    }, 100);
  };

  // --- MATH ENGINE ---
  const simulationData = useMemo(() => {
    const safePriceX = priceX > 0 ? priceX : 1; const safePriceY = priceY > 0 ? priceY : 1;
    
    if (activeModel === "Marktmodell") {
      const modifier = govMode === "tax" ? govAmount : -govAmount;
      const qStar = (demandIntercept - (supplyIntercept + modifier)) / (demandSlope + supplySlope);
      const validQ = Math.max(0, qStar);
      const pConsumer = demandIntercept - (demandSlope * validQ); 
      const pProducer = pConsumer - modifier; 
      
      const qOld = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
      const pOld = demandIntercept - (demandSlope * qOld);

      const kr = 0.5 * (demandIntercept - pConsumer) * validQ;
      const pr = 0.5 * (pProducer - supplyIntercept) * validQ;
      const govBudget = govAmount * validQ; 
      const dwl = 0.5 * Math.abs(qOld - validQ) * govAmount;

      const data = []; const maxQ = qOld > 0 ? qOld * 1.5 : 100;
      for (let q = 0; q <= maxQ; q += (maxQ / 20)) {
        data.push({ 
          q: Number(q.toFixed(1)), 
          nachfrage: Math.max(0, demandIntercept - (demandSlope * q)), 
          angebot_effektiv: Math.max(0, (supplyIntercept + modifier) + (supplySlope * q)), 
          angebot_original: Math.max(0, supplyIntercept + (supplySlope * q)) 
        });
      }
      return { 
        data, 
        equilibrium: { q: validQ, p: pConsumer, pProd: pProducer }, 
        original: { q: qOld, p: pOld },
        effectiveIntercept: supplyIntercept + modifier, 
        surplus: { kr, pr, gov: govBudget, dwl } 
      };
    }
    else if (activeModel === "Monopol") {
      const qMonopol = (demandIntercept - supplyIntercept) / ((2 * demandSlope) + supplySlope);
      const validQ = Math.max(0, qMonopol);
      const pMonopol = demandIntercept - (demandSlope * validQ);
      const mcAtOptimum = supplyIntercept + (supplySlope * validQ);
      const atcAtOptimum = validQ > 0 ? supplyIntercept + (0.5 * supplySlope * validQ) + (fixedCost / validQ) : 0;
      const profit = (pMonopol - atcAtOptimum) * validQ;
      const kr = 0.5 * (demandIntercept - pMonopol) * validQ;
      
      const data = []; const maxQ = validQ > 0 ? validQ * 2 : 100;
      for (let q = 0.1; q <= maxQ; q += (maxQ / 40)) { 
        const atcVal = supplyIntercept + (0.5 * supplySlope * q) + (fixedCost / q);
        data.push({ q: Number(q.toFixed(1)), nachfrage: Math.max(0, demandIntercept - (demandSlope * q)), grenzerloes: Math.max(0, demandIntercept - (2 * demandSlope * q)), grenzkosten: Math.max(0, supplyIntercept + (supplySlope * q)), atc: atcVal < demandIntercept * 1.5 ? atcVal : null });
      }
      return { data, equilibrium: { q: validQ, p: pMonopol, mc: mcAtOptimum, atc: atcAtOptimum, profit }, surplus: { kr, profit } };
    }
    else { // Budget
      const maxX = income / safePriceX; const maxY = income / safePriceY;
      const optX = (preference * income) / safePriceX; const optY = ((1 - preference) * income) / safePriceY;
      const maxUtility = Math.pow(optX, preference) * Math.pow(optY, (1 - preference));
      
      const data = []; const rangeX = maxX > 0 ? maxX : 10;
      for (let x = 0.1; x <= rangeX * 1.5; x += (rangeX / 40)) {
        const budgetY = (income - (safePriceX * x)) / safePriceY;
        const term = maxUtility / Math.pow(x, preference);
        let indifferenceY = 0; if (term > 0 && Number.isFinite(term)) indifferenceY = Math.pow(term, 1 / (1 - preference));
        data.push({ x: Number(x.toFixed(2)), y: Math.max(0, budgetY), u: indifferenceY > maxY * 3 ? null : indifferenceY });
      }
      return { data, maxX, maxY, slope: -(safePriceX/safePriceY), optimum: { x: optX, y: optY, u: maxUtility } };
    }
  }, [activeModel, demandIntercept, demandSlope, supplyIntercept, supplySlope, govMode, govAmount, income, priceX, priceY, preference, fixedCost]);

  // --- RENDER HELPERS ---
  const Latex = ({ children }) => <span className="font-serif text-[15px] tracking-wide" style={{ fontFamily: '"Times New Roman", Times, serif' }}>{children}</span>;
  const Var = ({ children }) => <span className="italic font-serif">{children}</span>;
  const chartColors = useMemo(() => ({ grid: darkMode ? "#374151" : "#e5e7eb", text: darkMode ? "#9ca3af" : "#4b5563", tooltipBg: darkMode ? "#1f2937" : "#fff", tooltipColor: darkMode ? "#f3f4f6" : "#111827" }), [darkMode]);

  // 1. RENDER CONTROLS
  const renderControls = () => {
    const isMono = activeModel === "Monopol";
    const isBudget = activeModel === "Budgetgerade";

    return (
      <>
         {/* UNIVERSAL AXIS LABELS - ALWAYS VISIBLE */}
         <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 dark:bg-gray-800 dark:border-gray-700 shrink-0">
             <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Pencil className="w-3 h-3"/> {t.controls.axisHeader}</div>
             <div className="flex gap-2 items-center">
               <input type="text" value={labelXInput} onChange={(e) => setLabelXInput(e.target.value)} className="w-2/5 p-1.5 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="X"/>
               <input type="text" value={labelYInput} onChange={(e) => setLabelYInput(e.target.value)} className="w-2/5 p-1.5 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Y"/>
               <button onClick={applyLabels} className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300" title={t.controls.apply}><Check className="w-4 h-4"/></button>
             </div>
        </div>

        {/* BUDGET CONTROLS */}
        {isBudget && (
          <div className="space-y-6 shrink-0">
             <div className="p-4 bg-green-50 border border-green-100 rounded-lg dark:bg-green-900/20 dark:border-green-800"><label className="text-sm font-bold text-green-800 dark:text-green-400 flex justify-between"><span>{t.controls.income}</span><b>{income}{currency}</b></label><input type="range" min="10" max="500" step="10" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full mt-2 accent-green-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div>
             <div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.price} {appliedLabelX}</span><b>{priceX}{currency}</b></label><input type="range" min="1" max="50" value={priceX} onChange={e => setPriceX(Number(e.target.value))} className="w-full mt-2 accent-blue-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div>
             <div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.price} {appliedLabelY}</span><b>{priceY}{currency}</b></label><input type="range" min="1" max="50" value={priceY} onChange={e => setPriceY(Number(e.target.value))} className="w-full mt-2 accent-purple-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div>
             <div className="p-4 bg-pink-50 border border-pink-100 rounded-lg dark:bg-pink-900/20 dark:border-pink-800"><div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-pink-500"/><label className="text-xs font-bold text-pink-800 dark:text-pink-400 uppercase">{t.controls.pref}</label></div><input type="range" min="0.1" max="0.9" step="0.1" value={preference} onChange={e => setPreference(Number(e.target.value))} className="w-full accent-pink-500 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/><div className="text-center text-xs text-pink-600 mt-1 font-mono">α = {preference}</div></div>
          </div>
        )}

        {/* MARKET & MONOPOLY CONTROLS */}
        {!isBudget && (
          <>
            {!isMono && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 dark:bg-slate-900/20 dark:border-slate-800 shrink-0">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500"/> {t.ticker.title}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(t.ticker.events).map(key => {
                     const evt = t.ticker.events[key];
                     return (
                        <button key={key} onClick={() => triggerEvent(key)} className="text-left px-2 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-slate-800 group">
                          <div className="font-bold text-xs text-slate-700 dark:text-slate-200 group-hover:text-blue-600">{evt.t}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{evt.d}</div>
                        </button>
                     );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6 shrink-0"><h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1">{t.controls.demand}</h3><div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.maxPrice}</span><b>{demandIntercept}{currency}</b></label><input type="range" min="50" max="200" value={demandIntercept} onChange={e => setDemandIntercept(Number(e.target.value))} className="w-full mt-2 accent-blue-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div><div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.slope}</span><b>{demandSlope}</b></label><input type="range" min="0.1" max="5" step="0.1" value={demandSlope} onChange={e => setDemandSlope(Number(e.target.value))} className="w-full mt-2 accent-blue-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div></div>
            <div className="space-y-4 mb-6 shrink-0"><h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1">{isMono ? t.controls.cost : t.controls.supply}</h3><div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.startCost}</span><b>{supplyIntercept}{currency}</b></label><input type="range" min="0" max="100" value={supplyIntercept} onChange={e => setSupplyIntercept(Number(e.target.value))} className="w-full mt-2 accent-red-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div><div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{isMono ? t.controls.mcSlope : t.controls.slope}</span><b>{supplySlope}</b></label><input type="range" min="0.1" max="5" step="0.1" value={supplySlope} onChange={e => setSupplySlope(Number(e.target.value))} className="w-full mt-2 accent-red-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div>{isMono && <div><label className="text-sm text-gray-600 dark:text-gray-300 flex justify-between"><span>{t.controls.fixCost}</span><b>{fixedCost}{currency}</b></label><input type="range" min="0" max="200" step="10" value={fixedCost} onChange={e => setFixedCost(Number(e.target.value))} className="w-full mt-2 accent-purple-600 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700"/></div>}</div>
            
            {!isMono && <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 dark:bg-gray-800 dark:border-gray-700 shrink-0"><h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2"><Landmark className="w-4 h-4"/> {t.state.title}</h3><div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg"><button className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${govMode === 'tax' ? 'bg-white text-orange-600 shadow-sm dark:bg-gray-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setGovMode('tax')}>{t.state.tax}</button><button className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${govMode === 'subsidy' ? 'bg-white text-green-600 shadow-sm dark:bg-gray-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setGovMode('subsidy')}>{t.state.sub}</button></div><div><label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between"><span>{t.state.amount}</span><b>{govAmount}{currency}</b></label><input type="range" min="0" max="40" step="0.5" value={govAmount} onChange={e => setGovAmount(Number(e.target.value))} className={`w-full mt-2 cursor-pointer bg-gray-200 rounded-lg appearance-none h-2 dark:bg-gray-700 ${govMode === 'tax' ? 'accent-orange-500' : 'accent-green-500'}`}/></div></div>}
          </>
        )}
      </>
    )
  };

  // 2. RENDER CHART
  const renderChart = () => {
    const common = { margin: { top: 20, right: 30, left: 40, bottom: 20 } };
    const GridComp = showGrid ? <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} /> : null;
    const XAx = <XAxis dataKey={activeModel === "Budgetgerade" ? "x" : "q"} type="number" stroke={chartColors.text} label={{ value: appliedLabelX, position: 'insideBottomRight', offset: -10, fill: chartColors.text }} domain={['auto', 'auto']} />;
    const YAx = <YAxis dataKey={activeModel === "Budgetgerade" ? "y" : undefined} type="number" stroke={chartColors.text} label={{ value: appliedLabelY, angle: -90, position: 'insideLeft', fill: chartColors.text }} domain={['auto', 'auto']} />;
    const TT = <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipColor, borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} formatter={(val) => val?.toFixed(2)} />;
    const Leg = <Legend verticalAlign="top" height={36} />;
    const anim = { isAnimationActive: animations };

    if (activeModel === "Marktmodell") {
       const effColor = govMode === 'tax' ? "#dc2626" : "#16a34a";
       return (
        <LineChart data={simulationData.data} {...common}>
          {GridComp} {XAx} {YAx} {TT} {Leg}
          <Line type="linear" dataKey="nachfrage" stroke="#2563eb" strokeWidth={3} dot={false} name={t.charts.demand} {...anim}/>
          {govAmount > 0 && <Line type="linear" dataKey="angebot_original" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} name={t.charts.supply} {...anim}/>}
          <Line type="linear" dataKey="angebot_effektiv" stroke={effColor} strokeWidth={3} dot={false} name={govAmount > 0 ? t.charts.supply_eff : t.charts.supply} {...anim}/>
          
          {govAmount > 0 && (
             <>
               <ReferenceDot x={simulationData.original.q} y={simulationData.original.p} r={4} fill="transparent" stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
               <ReferenceLine x={simulationData.original.q} stroke="#e5e7eb" strokeDasharray="3 3" />
             </>
          )}

          <ReferenceLine x={simulationData.equilibrium.q} stroke="#9ca3af" strokeDasharray="5 5" />
          <ReferenceLine y={simulationData.equilibrium.p} stroke="#9ca3af" strokeDasharray="5 5" />
          <ReferenceDot x={simulationData.equilibrium.q} y={simulationData.equilibrium.p} r={6} fill={darkMode ? "#1f2937" : "white"} stroke={darkMode ? "#f3f4f6" : "#111827"} strokeWidth={2} />
          
          {govAmount > 0 && (<><ReferenceDot x={simulationData.equilibrium.q} y={simulationData.equilibrium.pProd} r={4} fill={darkMode ? "#1f2937" : "white"} stroke={effColor} strokeWidth={2} /><ReferenceLine y={simulationData.equilibrium.pProd} stroke={effColor} strokeDasharray="5 5" /><ReferenceLine segment={[{ x: simulationData.equilibrium.q, y: simulationData.equilibrium.p }, { x: simulationData.equilibrium.q, y: simulationData.equilibrium.pProd }]} stroke={govMode === 'tax' ? "orange" : "green"} strokeWidth={4} /></>)}
        </LineChart>
      );
    } else if (activeModel === "Monopol") {
      const eq = simulationData.equilibrium;
      const profitColor = eq.profit >= 0 ? "#22c55e" : "#ef4444";
      return (
        <LineChart data={simulationData.data} {...common}>
          {GridComp} {XAx} {YAx} {TT} {Leg}
          <Line type="linear" dataKey="nachfrage" stroke="#2563eb" strokeWidth={3} dot={false} name={t.charts.demand} {...anim}/>
          <Line type="linear" dataKey="grenzerloes" stroke="#9333ea" strokeWidth={2} strokeDasharray="5 5" dot={false} name={t.charts.mr} {...anim}/>
          <Line type="linear" dataKey="grenzkosten" stroke="#dc2626" strokeWidth={3} dot={false} name={t.charts.mc} {...anim}/>
          <Line type="monotone" dataKey="atc" stroke="#f59e0b" strokeWidth={2} dot={false} name={t.charts.atc} {...anim}/>
          <ReferenceArea x1={0} x2={eq.q} y1={eq.atc} y2={eq.p} fill={profitColor} fillOpacity={0.2} stroke="none" />
          <ReferenceDot x={eq.q} y={eq.mc} r={4} fill="white" stroke="#9333ea" strokeWidth={2} />
          <ReferenceDot x={eq.q} y={eq.p} r={6} fill="white" stroke={darkMode ? "#f3f4f6" : "#111827"} strokeWidth={2} />
          <ReferenceDot x={eq.q} y={eq.atc} r={4} fill="white" stroke="#f59e0b" strokeWidth={2} />
          <ReferenceLine segment={[{ x: eq.q, y: 0 }, { x: eq.q, y: eq.p }]} stroke="#9ca3af" strokeDasharray="3 3" />
          <ReferenceLine segment={[{ x: 0, y: eq.p }, { x: eq.q, y: eq.p }]} stroke="#9ca3af" strokeDasharray="3 3" />
        </LineChart>
      );
    } else { // Budget
      return (
        <ComposedChart data={simulationData.data} {...common}>
          {GridComp} {XAx} {YAx} {TT} {Leg}
          <Area type="linear" dataKey="y" stroke="none" fill="#22c55e" fillOpacity={0.1} />
          <Line type="linear" dataKey="y" stroke="#16a34a" strokeWidth={3} dot={{r: 4}} name={t.charts.budget} {...anim}/>
          <Line type="monotone" dataKey="u" stroke="#ec4899" strokeWidth={2} dot={false} name={t.charts.utility} strokeDasharray="5 5" {...anim}/>
          <ReferenceDot x={simulationData.optimum?.x} y={simulationData.optimum?.y} r={6} fill={darkMode ? "#1f2937" : "white"} stroke="#ec4899" strokeWidth={2} />
          <ReferenceLine x={simulationData.optimum?.x} stroke="#9ca3af" strokeDasharray="3 3" />
          <ReferenceLine y={simulationData.optimum?.y} stroke="#9ca3af" strokeDasharray="3 3" />
        </ComposedChart>
      )
    }
  };

  // 3. RENDER ANALYSIS
  const renderAnalysis = () => {
    const sText = activeScenarioId ? t.scenarios[activeScenarioId] : null;
    const sParams = activeScenarioId ? SCENARIO_PARAMS[activeScenarioId] : null;

    const scenarioCard = sText && (
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg p-5 mb-6 relative overflow-hidden transition-all duration-500 animate-in slide-in-from-right shrink-0">
        <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 text-9xl select-none pointer-events-none">
           {sParams?.emoji || <StickyNote className="w-24 h-24" />}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><BookOpen className="w-4 h-4 text-blue-50"/></div>
            <h3 className="font-bold text-lg tracking-tight">{sText.t}</h3>
          </div>
          <p className="text-blue-50 text-sm leading-relaxed font-medium">{sText.s}</p>
        </div>
      </div>
    );

    const ElasticityBox = () => {
      const eqP = simulationData.equilibrium?.p || 0; const eqQ = simulationData.equilibrium?.q || 0;
      if (!eqQ) return null;
      const elast = (-1 / demandSlope) * (eqP / eqQ); const absEl = Math.abs(elast);
      const text = absEl > 1 ? t.elast.elastic : Math.abs(absEl - 1) < 0.05 ? t.elast.unit : t.elast.inelastic;
      const color = absEl > 1 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400";
      return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 mt-4 shrink-0">
           <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-sm dark:bg-gray-900/50 dark:border-gray-700">
             <div className="flex items-center gap-2 text-gray-800 font-semibold dark:text-gray-200"><Activity className="w-3 h-3 text-gray-500"/> {t.analysis.elasticity}</div>
             <div className={`font-bold text-xs ${color}`}>{text}</div>
           </div>
           <div className="p-4 flex flex-wrap justify-between items-center gap-4">
             <div className="font-serif text-lg text-gray-700 dark:text-gray-300 flex items-center">
                <span className="italic mr-2">ε</span><span className="mr-2">=</span><span className="mr-1">-</span>
                <div className="flex flex-col items-center text-xs mx-1"><span className="border-b border-gray-400 w-full text-center pb-0.5 mb-0.5">1</span><span>{demandSlope}</span></div>
                <span className="mx-2">·</span>
                <div className="flex flex-col items-center text-xs mx-1"><span className="border-b border-gray-400 w-full text-center pb-0.5 mb-0.5">{eqP.toFixed(1)}</span><span>{eqQ.toFixed(1)}</span></div>
             </div>
             <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{elast.toFixed(2)}</div>
           </div>
        </div>
      );
    };
    const StepBox = ({ title, children, highlight }) => (<div className={`p-3 rounded-lg border text-sm transition-colors shrink-0 ${highlight ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700'}`}><div className="text-[10px] text-gray-400 dark:text-gray-500 font-sans uppercase tracking-widest font-bold mb-1">{title}</div><div className="text-gray-700 dark:text-gray-200 font-mono">{children}</div></div>);
    const SurplusRow = ({ label, value, color, darkColor }) => (<div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 shrink-0"><div><div className={`text-xs font-bold uppercase tracking-wider ${color} ${darkColor}`}>{label}</div></div><div className={`font-bold font-mono text-base ${color} ${darkColor}`}>{value?.toFixed(2)} {currency}</div></div>);
    
    const SummaryBox = () => {
      let story = "";
      if (activeModel === "Marktmodell") {
        story = t.stories.market
          .replace("{q}", simulationData.equilibrium?.q.toFixed(1))
          .replace("{p}", simulationData.equilibrium?.p.toFixed(2) + currency);
      } else if (activeModel === "Monopol") {
        story = t.stories.monopoly
          .replace("{p}", simulationData.equilibrium?.p.toFixed(2) + currency)
          .replace("{profit}", simulationData.equilibrium?.profit.toFixed(2) + currency);
      } else {
        story = t.stories.budget
          .replace("{x}", simulationData.optimum?.x?.toFixed(1))
          .replace("{lblX}", appliedLabelX)
          .replace("{y}", simulationData.optimum?.y?.toFixed(1))
          .replace("{lblY}", appliedLabelY);
      }
      return (<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 dark:bg-amber-900/20 dark:border-amber-800 shrink-0"><div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-semibold text-sm"><MessageSquareQuote className="w-4 h-4"/> {t.analysis.info}</div><div className="text-sm text-amber-900 dark:text-amber-200 italic leading-relaxed">"{story}"</div></div>);
    };

    if (activeModel === "Monopol") {
      const mrSlope = (demandSlope * 2).toFixed(2);
      const lhs_const = demandIntercept; const rhs_const = supplyIntercept;
      const step2_const = lhs_const - rhs_const; const step2_slope_sum = Number(mrSlope) + Number(supplySlope);
      return (<div className="space-y-4 flex flex-col h-full overflow-y-auto p-1">{scenarioCard}<SummaryBox/><div className="p-4 bg-purple-50 border border-purple-100 rounded-xl dark:bg-purple-900/20 dark:border-purple-800 shrink-0"><span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase flex items-center gap-2"><Crown className="w-3 h-3"/> {t.analysis.profit}</span><div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{simulationData.equilibrium.profit.toFixed(2)} {currency}</div></div><div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 shrink-0"><div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold text-sm dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200"><Calculator className="w-3 h-3 text-gray-500"/> {t.analysis.steps}</div><div className="p-4 space-y-3"><StepBox title={t.math.condition}><Latex><span className="text-purple-600 dark:text-purple-400">{demandIntercept} - {mrSlope}<Var>Q</Var></span>{' = '}<span className="text-red-600 dark:text-red-400">{supplyIntercept} + {supplySlope}<Var>Q</Var></span></Latex></StepBox><StepBox title={t.math.solve} highlight><Latex><Var>Q</Var> = {step2_const.toFixed(1)} / {step2_slope_sum.toFixed(1)} = <b>{simulationData.equilibrium.q.toFixed(2)}</b></Latex></StepBox><StepBox title={t.math.p_calc}><Latex><Var>P</Var> = {demandIntercept} - ({demandSlope} · {simulationData.equilibrium.q.toFixed(2)}) = <b>{simulationData.equilibrium.p.toFixed(2)}</b></Latex></StepBox></div></div><div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 shrink-0"><div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold text-sm dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200"><PieChart className="w-3 h-3 text-gray-500"/> {t.analysis.welfare}</div><div className="p-4"><SurplusRow label={t.analysis.cs} value={simulationData.surplus.kr} color="text-green-600" darkColor="dark:text-green-400" /><SurplusRow label={t.analysis.profit} value={simulationData.surplus.profit} color="text-purple-600" darkColor="dark:text-purple-400" /></div></div><ElasticityBox /></div>);
    } else if (activeModel === "Marktmodell") {
       const effectiveC = simulationData.effectiveIntercept; const slopeSum = demandSlope + supplySlope; const diffIntercept = demandIntercept - effectiveC;
       return (<div className="space-y-4 flex flex-col h-full overflow-y-auto p-1">{scenarioCard}<SummaryBox/><div className="p-4 bg-blue-50 border border-blue-100 rounded-xl dark:bg-blue-900/20 dark:border-blue-800 shrink-0"><span className="text-xs font-semibold text-blue-400 dark:text-blue-300 uppercase">{t.analysis.price}</span><div className="text-3xl font-bold text-blue-700 dark:text-blue-200">{simulationData.equilibrium.p.toFixed(2)} {currency}</div></div><div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 shrink-0"><div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold text-sm dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200"><Calculator className="w-3 h-3 text-gray-500"/> {t.analysis.steps}</div><div className="p-4 space-y-3"><StepBox title={t.math.eq}><Latex><span className="text-blue-600 dark:text-blue-400">{demandIntercept} - {demandSlope}<Var>Q</Var></span>{' = '}<span className="text-red-600 dark:text-red-400">{effectiveC} + {supplySlope}<Var>Q</Var></span></Latex></StepBox><StepBox title={t.math.solve} highlight><Latex><Var>Q</Var> = {diffIntercept.toFixed(1)} / {slopeSum.toFixed(1)} = <b>{simulationData.equilibrium.q.toFixed(2)}</b></Latex></StepBox><StepBox title={t.math.p_calc}><Latex><Var>P</Var> = {demandIntercept} - ({demandSlope} · {simulationData.equilibrium.q.toFixed(2)}) = <b>{simulationData.equilibrium.p.toFixed(2)}</b></Latex></StepBox></div></div><div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 shrink-0"><div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold text-sm dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200"><PieChart className="w-3 h-3 text-gray-500"/> {t.analysis.welfare}</div><div className="p-4"><SurplusRow label={t.analysis.cs} value={simulationData.surplus.kr} color="text-green-600" darkColor="dark:text-green-400" /><SurplusRow label={t.analysis.ps} value={simulationData.surplus.pr} color="text-yellow-600" darkColor="dark:text-yellow-400" />{govAmount > 0 && (<><SurplusRow label={govMode === 'tax' ? t.analysis.taxRev : t.analysis.subCost} value={Math.abs(simulationData.surplus.gov)} color="text-blue-600" darkColor="dark:text-blue-400" /><SurplusRow label={t.analysis.dwl} value={simulationData.surplus.dwl} color="text-red-500" darkColor="dark:text-red-400" /></>)}</div></div><ElasticityBox /></div>);
    } else { // Budget
      return (<div className="space-y-4 flex flex-col h-full overflow-y-auto p-1">{scenarioCard}<SummaryBox/><div className="p-4 bg-pink-50 border border-pink-100 rounded-xl dark:bg-pink-900/20 dark:border-pink-800 shrink-0"><span className="text-xs font-semibold text-pink-600 dark:text-pink-300 uppercase flex items-center gap-2"><Heart className="w-3 h-3"/> {t.analysis.optimalBundle}</span><div className="flex justify-between mt-2"><div><div className="text-2xl font-bold text-pink-800 dark:text-pink-200">{simulationData.optimum?.x?.toFixed(1)}</div><div className="text-xs text-pink-600/70">{appliedLabelX}</div></div><div className="text-right"><div className="text-2xl font-bold text-pink-800 dark:text-pink-200">{simulationData.optimum?.y?.toFixed(1)}</div><div className="text-xs text-pink-600/70">{appliedLabelY}</div></div></div></div><div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700 shrink-0"><div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold text-sm dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-200"><Calculator className="w-3 h-3 text-gray-500"/> {t.analysis.steps}</div><div className="p-4 space-y-3"><StepBox title={t.math.budget_eq}><Latex><span className="text-blue-600 dark:text-blue-400">{priceX}</span><Var>x₁</Var> + <span className="text-purple-600 dark:text-purple-400">{priceY}</span><Var>x₂</Var> = <span className="text-green-600 dark:text-green-400">{income}</span></Latex></StepBox><StepBox title={t.math.slope_calc}><Latex>- (<Var>p₁</Var> / <Var>p₂</Var>) = <b>{simulationData.slope?.toFixed(2)}</b></Latex></StepBox></div></div></div>);
    }
  };

  const TheoryModal = () => {
    if (!showTheory) return null;
    const content = activeModel === "Marktmodell" ? t.theory.market : activeModel === "Monopol" ? t.theory.monopoly : t.theory.budget;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTheory(false)}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowTheory(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
          <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 shrink-0">
            <BookOpen className="w-6 h-6"/>
            <h2 className="text-xl font-bold">{content.h}</h2>
          </div>
          <div className="overflow-y-auto pr-2">
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{content.intro}</p>
            <div className="space-y-2">
                {content.concepts.map((concept, i) => (<AccordionItem key={i} title={concept.t} content={concept.c} />))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <TheoryModal />
      <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 font-sans dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
        
        {/* SIDEBAR */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10 dark:bg-gray-900 dark:border-gray-800 shrink-0">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0"><h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"><BarChart3 className="w-6 h-6" /> {t.title}</h1><button onClick={resetValues} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md dark:hover:bg-gray-800"><RotateCcw className="w-4 h-4"/></button></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="mt-2 shrink-0"><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" value={activeModel} onChange={e => {setActiveModel(e.target.value); setActiveScenarioId(null);}}><option value="Marktmodell">{t.models.market}</option><option value="Monopol">{t.models.monopoly}</option><option value="Budgetgerade">{t.models.budget}</option></select></div>
            {renderControls()}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 shrink-0"><h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> {t.scenarios.title}</h3><div className="space-y-2">{[1, 2, 3].map(id => (<button key={id} onClick={() => loadScenario(id)} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"><div className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 flex justify-between dark:text-gray-300 dark:group-hover:text-blue-400">{t.scenarios[id].t}<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 dark:text-gray-600"/></div></button>))}</div></div>
          </div>
        </div>
        
        {/* MAIN */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 dark:bg-gray-900 dark:border-gray-800 shrink-0">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.models[activeModel === "Marktmodell" ? "market" : activeModel === "Monopol" ? "monopoly" : "budget"]}</h2>
            <div className="flex items-center gap-4 relative">
               <button onClick={() => setShowTheory(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"><BookOpen className="w-4 h-4"/> {t.theory.title}</button>
               <div className="relative" ref={downloadRef}>
                 <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800 dark:hover:text-gray-200"><Download className="w-5 h-5"/></button>
                 {showDownloadMenu && (<div className="absolute right-0 top-12 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200"><div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.settings.download}</div><button onClick={() => handleDownload('png')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 dark:text-gray-300 dark:hover:bg-gray-800"><ImageIcon className="w-4 h-4"/> PNG Image</button><button onClick={() => handleDownload('jpeg')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 dark:text-gray-300 dark:hover:bg-gray-800"><ImageIcon className="w-4 h-4"/> JPG Image</button></div>)}
               </div>
               <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200'}`}><Settings className="w-5 h-5"/></button>
                 {showSettings && (
                   <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                     <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.settings.title}</div>
                     <div className="space-y-1">
                        <div className="px-3 py-2 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"><span className="flex items-center gap-2">{t.settings.lang}</span><div className="flex gap-1">{['de', 'en', 'es'].map(l => (<button key={l} onClick={() => setLang(l)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold uppercase transition-colors ${lang === l ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{l}</button>))}</div></div>
                        <div className="px-3 py-2 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"><span className="flex items-center gap-2">{t.settings.currency}</span><div className="flex gap-1">{['€', '$', '£'].map(c => (<button key={c} onClick={() => setCurrency(c)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${currency === c ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{c}</button>))}</div></div>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <div className="px-3 py-2 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"><span className="flex items-center gap-2">{t.settings.grid}</span><button onClick={() => setShowGrid(!showGrid)} className={`w-8 h-4 rounded-full relative transition-colors ${showGrid ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showGrid ? 'translate-x-4' : ''}`}></div></button></div>
                        <div className="px-3 py-2 flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"><span className="flex items-center gap-2">{t.settings.anim}</span><button onClick={() => setAnimations(!animations)} className={`w-8 h-4 rounded-full relative transition-colors ${animations ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${animations ? 'translate-x-4' : ''}`}></div></button></div>
                     </div>
                   </div>
                 )}
               </div>
               <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
            </div>
          </header>
          
          <main className="flex-1 p-4 overflow-hidden relative">
            <div ref={captureRef} className={`h-full w-full grid grid-cols-1 lg:grid-cols-3 gap-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="lg:col-span-2 h-full flex flex-col min-h-0">
                   <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 flex flex-col dark:bg-gray-800 dark:border-gray-700 overflow-hidden relative">
                      <div className="absolute inset-4">
                        <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
                      </div>
                   </div>
                </div>
                <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                            <TrendingUp className="w-5 h-5 text-gray-500" /> 
                            {t.settings.title === "Ajustes" ? "Análisis" : (t.settings.title === "Settings" ? "Analysis" : "Analyse")}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">{renderAnalysis()}</div>
                </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;