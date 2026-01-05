import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { 
  Zap, Newspaper, Search, RefreshCw, ShieldAlert, Cpu, Globe, Info
} from 'lucide-react';

// === SISTEM MULTI-BAHASA ===
const translations = {
  id: {
    title: "CRYPTO NEWS ONLY.ID",
    status: "PASAR AKTIF",
    search: "Pindai 250+ Aset Digital...",
    intelTitle: "INTELIJEN WHALE & INSTITUSI",
    intelSub: "MONITOR REAL-TIME PERGERAKAN CEO, PEMERINTAH, & WHALE",
    aiPlaceholder: "Analisa dampak intelijen terhadap harga...",
    runIntel: "PROSES DATA",
    watchlist: "Monitor Pasar",
    aiLoading: "Menganalisa...",
    aiDefault: "Pilih koin untuk memulai analisa mendalam.",
    impactAlpha: "DAMPAK TINGGI",
    scanning: "Mencegat sinyal satelit...",
    all: "SEMUA", bullish: "NAIK", bearish: "TURUN", sideways: "STABIL",
    disclaimer: "Analisis AI bukan saran keuangan. Selalu riset mandiri (DYOR)."
  },
  en: {
    title: "CRYPTO NEWS ONLY.ID",
    status: "MARKET ACTIVE",
    search: "Scan 250+ Digital Assets...",
    intelTitle: "WHALE & INSTITUTIONAL INTEL",
    intelSub: "REAL-TIME CEO, GOVERNMENT, & WHALE TRACKER",
    aiPlaceholder: "Analyze impact of intelligence on price...",
    runIntel: "RUN INTEL",
    watchlist: "Market Watchlist",
    aiLoading: "Analyzing...",
    aiDefault: "Select a coin to start deep analysis.",
    impactAlpha: "HIGH IMPACT",
    scanning: "Intercepting signals...",
    all: "ALL", bullish: "BULLISH", bearish: "BEARISH", sideways: "SIDEWAYS",
    disclaimer: "AI analysis is not financial advice. DYOR."
  }
};

type LangType = 'id' | 'en';

interface Coin {
  id: string; symbol: string; name: string; image: string; current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_1y_in_currency: number;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const App: React.FC = () => {
  const [lang, setLang] = useState<LangType>('id');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [whaleAlerts, setWhaleAlerts] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inputAI, setInputAI] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const t = translations[lang];

  // 1. DATA FETCHING
  const fetchData = useCallback(async () => {
    try {
      const [mRes, nRes] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y'),
        fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
      ]);
      const mData = await mRes.json();
      const nData = await nRes.json();

      if (Array.isArray(mData)) setCoins(mData);
      if (nData.Data) {
        const rawNews = nData.Data;
        const filtered = rawNews.filter((n: any) => 
          ["whale", "elon", "sec", "fed", "ceo", "buy", "sell", "listing"].some(key => n.title.toLowerCase().includes(key))
        );
        setWhaleAlerts(filtered.slice(0, 4)); // Ambil 4 berita whale sesuai gambar
        setNews(rawNews.slice(0, 20));
      }
    } catch (e) { console.error("Sync Error"); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 2. AI ANALYST
  const handleAiAnalyst = async () => {
    if (!inputAI && !selectedSymbol) return;
    setIsAiLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Berikan analisis singkat dalam ${lang === 'id' ? 'Bahasa Indonesia' : 'English'} tentang koin ${selectedSymbol} berdasarkan berita terbaru ini: ${whaleAlerts.map(w => w.title).join(", ")}. Pertanyaan: ${inputAI}`;
      const result = await model.generateContent(prompt);
      setAiResponse(result.response.text());
    } catch (e) { setAiResponse("AI Offline..."); } finally { setIsAiLoading(false); }
  };

  const filteredCoins = useMemo(() => {
    let list = coins.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeTab === "bullish") return list.filter(c => c.price_change_percentage_24h > 0);
    if (activeTab === "bearish") return list.filter(c => c.price_change_percentage_24h < 0);
    if (activeTab === "sideways") return list.filter(c => Math.abs(c.price_change_percentage_24h) < 1);
    return list;
  }, [coins, activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-[#010204] text-slate-100 font-sans pb-24 selection:bg-blue-600/40 custom-scrollbar overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-[100] bg-[#010204]/90 border-b border-blue-900/20 p-4 backdrop-blur-lg">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Cpu size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">{t.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div> {t.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
              <input 
                className="w-full bg-slate-900/40 border border-blue-900/20 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-600"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => fetchData()} className="p-2.5 bg-slate-900 border border-blue-900/30 rounded-xl text-slate-400 hover:text-blue-500 transition-all"><RefreshCw size={18}/></button>
            <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="bg-slate-900 text-white text-[10px] font-black px-3 py-2.5 rounded-xl border border-blue-900/30 uppercase">{lang}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 space-y-6">
        
        {/* CHART SECTION */}
        <div className="bg-black rounded-[1.5rem] border border-blue-900/20 overflow-hidden h-[450px] md:h-[600px] shadow-2xl">
          <AdvancedRealTimeChart 
            symbol={selectedSymbol}
            theme="dark" autosize interval="1" timezone="Etc/UTC" style="1" locale="en"
            enable_publishing={false} allow_symbol_change={true}
          />
        </div>

        {/* WHALE INTEL SECTION */}
        <div className="bg-slate-900/10 p-6 rounded-[2rem] border border-blue-900/10 backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-blue-500"><Globe size={200}/></div>
           <div className="flex items-center gap-3 mb-6 relative">
             <ShieldAlert className="text-blue-500" size={24}/>
             <div>
               <h2 className="text-lg font-black uppercase italic text-white tracking-wider">{t.intelTitle}</h2>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t.intelSub}</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {whaleAlerts.map((w, i) => (
                <div key={i} className="p-4 bg-blue-950/20 border border-blue-900/20 rounded-2xl hover:bg-blue-900/30 transition-all cursor-pointer">
                  <span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase mb-2 inline-block tracking-tighter">{t.impactAlpha}</span>
                  <h4 className="text-[11px] font-bold text-slate-200 leading-relaxed line-clamp-2">{w.title}</h4>
                </div>
              ))}
           </div>

           {/* AI BOX */}
           <div className="space-y-4">
              {aiResponse && (
                <div className="p-4 bg-blue-600/5 border border-blue-600/20 rounded-xl text-xs leading-relaxed text-blue-100 border-l-4 border-l-blue-600 animate-in fade-in duration-500">
                  {aiResponse}
                </div>
              )}
              <div className="flex gap-2 bg-black p-2 rounded-2xl border border-blue-900/20">
                <input 
                  className="flex-1 bg-transparent border-none px-4 py-1 text-xs outline-none text-white placeholder:text-slate-700"
                  placeholder={t.aiPlaceholder}
                  value={inputAI}
                  onChange={(e) => setInputAI(e.target.value)}
                />
                <button onClick={handleAiAnalyst} disabled={isAiLoading} className="bg-blue-700 hover:bg-blue-600 px-6 py-2.5 rounded-xl font-black text-[9px] text-white transition-all flex items-center gap-2">
                  {isAiLoading ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>} {t.runIntel}
                </button>
              </div>
           </div>
        </div>

        {/* WATCHLIST SECTION */}
        <div className="bg-[#080a0e] rounded-[2rem] border border-blue-900/10 p-5 shadow-2xl">
          <div className="flex gap-1 mb-6 bg-black/40 p-1.5 rounded-xl border border-white/5">
            {['all', 'bullish', 'bearish', 'sideways'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-slate-400'}`}>
                {t[tab as keyof typeof t]}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredCoins.map((coin) => (
              <div 
                key={coin.id} 
                onClick={() => setSelectedSymbol(`${coin.symbol.toUpperCase()}USDT`)}
                className={`p-4 rounded-[1.8rem] border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group ${selectedSymbol.includes(coin.symbol.toUpperCase()) ? 'bg-blue-600/5 border-blue-500/30' : 'bg-transparent'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} className="w-9 h-9 rounded-full grayscale group-hover:grayscale-0 transition-all" alt="" />
                    <div>
                      <h4 className="font-black text-[13px] uppercase text-white">{coin.symbol}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-white italic tracking-tighter">${coin.current_price.toLocaleString()}</p>
                    <p className={`text-[10px] font-black ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-4 gap-2">
                   {[
                     { label: '1H', val: coin.price_change_percentage_1h_in_currency },
                     { label: '7D', val: coin.price_change_percentage_7d_in_currency },
                     { label: '30D', val: coin.price_change_percentage_30d_in_currency },
                     { label: '1Y', val: coin.price_change_percentage_1y_in_currency }
                   ].map((s, idx) => (
                     <div key={idx} className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-center">
                       <p className="text-[8px] text-slate-500 font-black mb-1">{s.label}</p>
                       <p className={`text-[9px] font-black ${s.val >= 0 ? 'text-green-500' : 'text-red-500'}`}>{s.val?.toFixed(1)}%</p>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER MARQUEE */}
      <footer className="fixed bottom-0 w-full bg-[#010204]/90 backdrop-blur-xl border-t border-blue-900/20 p-3 z-[200]">
        <div className="flex gap-12 animate-marquee whitespace-nowrap uppercase font-black tracking-widest text-slate-500 text-[9px]">
           {news.map((n, i) => (
             <div key={i} className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> {n.title}
             </div>
           ))}
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 10px; }
        @keyframes marquee { 0% { transform: translateX(50%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: flex; animation: marquee 60s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};

export default App;
