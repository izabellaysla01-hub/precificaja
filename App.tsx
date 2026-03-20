import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, MessageCircle, Clock, DollarSign, Percent, Calendar, LogOut, X } from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD0BWsNm9DbGGDqiHzkdDmNdxIGdJ9tWe8",
  authDomain: "precificaja-968cd.firebaseapp.com",
  projectId: "precificaja-968cd",
  storageBucket: "precificaja-968cd.firebasestorage.app",
  messagingSenderId: "646149720985",
  appId: "1:646149720985:web:9c04001f2c6344979a2108"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Estados dos Formulários
  const [novoMaterial, setNovoMaterial] = useState({ nome: '', valorPago: '', qtdComprada: '1' });
  const [novoProduto, setNovoProduto] = useState<any>({
    nome: '', materiaisUsados: [], maoDeObraHora: '7', tempoGastoMinutos: '60',
    custosExtras: { embalagem: '2', energia: '', taxas: '', outros: '' },
    lucroPorcentagem: '101', quantidadePedido: '1', prazoEntrega: ''
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  // --- LÓGICA DE MATERIAIS ---
  const salvarMaterialNoEstoque = async () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago) return;
    await addDoc(collection(db, "materiais"), {
      nome: novoMaterial.nome,
      valorPago: parseFloat(novoMaterial.valorPago),
      qtdComprada: parseFloat(novoMaterial.qtdComprada),
      userId: user.uid
    });
    setNovoMaterial({ nome: '', valorPago: '', qtdComprada: '1' });
  };

  const selecionarMaterialParaProduto = (id: string) => {
    const mat = materiais.find(m => m.id === id);
    if (!mat) return;
    const jaTem = novoProduto.materiaisUsados.find((m: any) => m.id === id);
    if (jaTem) return;
    setNovoProduto({ ...novoProduto, materiaisUsados: [...novoProduto.materiaisUsados, { ...mat, qtdNoProduto: 1 }] });
  };

  // --- CÁLCULOS (O CORAÇÃO DO APP) ---
  const calculos = useMemo(() => {
    const custoMateriais = novoProduto.materiaisUsados.reduce((acc: number, m: any) => 
      acc + ((m.valorPago / m.qtdComprada) * m.qtdNoProduto), 0);
    
    const maoDeObra = (parseFloat(novoProduto.maoDeObraHora || '0') / 60) * parseFloat(novoProduto.tempoGastoMinutos || '0');
    const extras = Object.values(novoProduto.custosExtras).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) as number;
    
    const custoBaseTotal = (custoMateriais + maoDeObra + extras) * parseFloat(novoProduto.quantidadePedido || '1');
    const precoFinal = custoBaseTotal * (1 + (parseFloat(novoProduto.lucroPorcentagem || '0') / 100));
    
    return precoFinal.toFixed(2);
  }, [novoProduto]);

  if (!user) return <div className="p-10 text-center">Carregando ou Por favor, faça login... (Verifique se a tela de login aparece)</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER ROXO IGUAL AO PRINT */}
      <header className="bg-[#6b21a8] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Calculator className="bg-white text-[#6b21a8] p-1 rounded" /> PrecificaJá
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <button onClick={() => setActiveTab('materiais')} className={activeTab === 'materiais' ? "bg-white text-[#6b21a8] px-3 py-1 rounded-lg" : ""}>Materiais</button>
          <button onClick={() => setActiveTab('criar')} className={activeTab === 'criar' ? "bg-white text-[#6b21a8] px-3 py-1 rounded-lg" : ""}>Criar Produto</button>
          <button onClick={() => setActiveTab('salvos')} className={activeTab === 'salvos' ? "bg-white text-[#6b21a8] px-3 py-1 rounded-lg" : ""}>Produtos Salvos</button>
        </nav>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        {/* ABA: MATERIAIS (ESTOQUE) */}
        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-[#6b21a8] font-bold mb-4 flex items-center gap-2"><Package size={18}/> Novo Material</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Nome do Material" className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-100" value={novoMaterial.nome} onChange={e => setNovoMaterial({...novoMaterial, nome: e.target.value})}/>
                <input type="number" placeholder="Valor Pago (R$)" className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-100" value={novoMaterial.valorPago} onChange={e => setNovoMaterial({...novoMaterial, valorPago: e.target.value})}/>
                <div className="flex gap-2">
                  <input type="number" placeholder="Qtd" className="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100" value={novoMaterial.qtdComprada} onChange={e => setNovoMaterial({...novoMaterial, qtdComprada: e.target.value})}/>
                  <button onClick={salvarMaterialNoEstoque} className="bg-[#f97316] text-white px-6 rounded-xl font-bold shadow-md">+ Adicionar</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold mb-4">Materiais Cadastrados</h2>
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                  <div>
                    <p className="font-bold text-slate-700">{m.nome}</p>
                    <p className="text-xs text-slate-400">Pago R$ {m.valorPago.toFixed(2)} por {m.qtdComprada} un</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Unitário</p>
                      <p className="font-bold text-[#f97316]">R$ {(m.valorPago/m.qtdComprada).toFixed(2)}</p>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-300"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CRIAR PRODUTO (IGUAL AO PRINT) */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
            <h2 className="text-[#6b21a8] font-bold mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Novo Produto</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-50" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd do Pedido</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-50" value={novoProduto.quantidadePedido} onChange={e => setNovoProduto({...novoProduto, quantidadePedido: e.target.value})}/>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Materiais Utilizados</label>
              <div className="flex gap-2 mb-3">
                <select className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-sm border border-slate-50" onChange={e => selecionarMaterialParaProduto(e.target.value)} value="">
                  <option value="">Selecione um material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <button onClick={() => setActiveTab('materiais')} className="bg-[#fff7ed] text-[#f97316] p-3 rounded-xl"><Plus size={20}/></button>
              </div>
              {novoProduto.materiaisUsados.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold">{m.nome}</p>
                    <p className="text-[10px] text-slate-400">Custo: R$ {(m.valorPago/m.qtdComprada).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-16 p-1 text-center bg-white rounded-lg border border-slate-200" value={m.qtdNoProduto} onChange={e => {
                      const novaLista = [...novoProduto.materiaisUsados];
                      novaLista[idx].qtdNoProduto = parseFloat(e.target.value) || 0;
                      setNovoProduto({...novoProduto, materiaisUsados: novaLista});
                    }}/>
                    <button onClick={() => {
                      const novaLista = novoProduto.materiaisUsados.filter((_:any, i:number) => i !== idx);
                      setNovoProduto({...novoProduto, materiaisUsados: novaLista});
                    }} className="text-red-300"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[10px] font-bold text-[#f97316] uppercase flex items-center gap-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.maoDeObraHora} onChange={e => setNovoProduto({...novoProduto, maoDeObraHora: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#f97316] uppercase flex items-center gap-1"><Clock size={10}/> Tempo (minutos)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.tempoGastoMinutos} onChange={e => setNovoProduto({...novoProduto, tempoGastoMinutos: e.target.value})}/>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                <div key={c}>
                  <label className="text-[8px] text-slate-400 block mb-1 uppercase text-center font-bold">{c}</label>
                  <input type="number" className="w-full p-2 bg-slate-50 rounded-lg text-center outline-none text-xs border border-slate-50" value={novoProduto.custosExtras[c]} onChange={e => setNovoProduto({...novoProduto, custosExtras: {...novoProduto.custosExtras, [c]: e.target.value}})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div>
                <label className="text-[10px] font-bold text-[#f97316] uppercase flex items-center gap-1"><Percent size={10}/> Margem de Lucro (%)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.lucroPorcentagem} onChange={e => setNovoProduto({...novoProduto, lucroPorcentagem: e.target.value})}/>
