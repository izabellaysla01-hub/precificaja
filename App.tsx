import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, setDoc } from "firebase/firestore";
import { 
  Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, 
  MessageCircle, Clock, DollarSign, Percent, Calendar, X, LogOut 
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE (Suas chaves oficiais) ---
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

// --- COMPONENTE DE LOGIN ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { alert("Erro: Verifique e-mail e senha (min 6 dígitos)."); }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calculator className="text-orange-500 w-8 h-8" /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta' : 'Acesse seu painel'}</p>
        <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border border-slate-200 mb-3 outline-none focus:ring-2 focus:ring-orange-500" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border border-slate-200 mb-6 outline-none focus:ring-2 focus:ring-orange-500" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-600 mb-4 transition-all">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium">{isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Criar grátis'}</button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Estado do Novo Produto (Fiel à sua foto)
  const [novoProduto, setNovoProduto] = useState<any>({
    nome: '', materiais: [], maoDeObraHora: 0, tempoGastoMinutos: 0,
    custosExtras: { embalagem: 0, energia: 0, taxas: 0, outros: 0 },
    lucroPorcentagem: 100, quantidadePedido: 1, prazoEntrega: ''
  });

  // Estado do Novo Material
  const [novoMaterial, setNovoMaterial] = useState({ nome: '', valorPago: 0, quantidadeComprada: 1 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubM = onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubP = onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubM(); unsubP(); };
    }
  }, [user]);

  // FUNÇÕES DE LÓGICA
  const adicionarMaterialAoProduto = (materialId: string) => {
    const mat = materiais.find(m => m.id === materialId);
    if (!mat) return;
    const jaTem = novoProduto.materiais.find((m:any) => m.id === materialId);
    if (jaTem) return;
    setNovoProduto({ ...novoProduto, materiais: [...novoProduto.materiais, { ...mat, qtdUsada: 1 }] });
  };

  const removerMaterialDoProduto = (id: string) => {
    setNovoProduto({ ...novoProduto, materiais: novoProduto.materiais.filter((m:any) => m.id !== id) });
  };

  const calculos = useMemo(() => {
    const custoMats = novoProduto.materiais.reduce((acc: number, m: any) => acc + ((m.valorPago / m.quantidadeComprada) * (m.qtdUsada || 1)), 0);
    const maoObra = (novoProduto.maoDeObraHora / 60) * novoProduto.tempoGastoMinutos;
    const extras = Object.values(novoProduto.custosExtras).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) as number;
    const custoBaseTotal = (custoMats + maoObra + extras) * novoProduto.quantidadePedido;
    const precoFinal = custoBaseTotal * (1 + (novoProduto.lucroPorcentagem / 100));
    return { precoFinal: precoFinal.toFixed(2), custoMats };
  }, [novoProduto]);

  const salvarMaterial = async () => {
    if (!novoMaterial.nome) return;
    await addDoc(collection(db, "materiais"), { ...novoMaterial, userId: user.uid });
    setNovoMaterial({ nome: '', valorPago: 0, quantidadeComprada: 1 });
    setActiveTab('criar');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-purple-700 font-bold"><Calculator size={20}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Novo Produto</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.quantidadePedido} onChange={e => setNovoProduto({...novoProduto, quantidadePedido: parseInt(e.target.value)})}/>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Materiais Utilizados (Selecione vários)</label>
              <div className="flex gap-2 mb-3">
                <select className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-sm" onChange={e => adicionarMaterialAoProduto(e.target.value)} value="">
                  <option value="">Selecione um material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <button onClick={() => setActiveTab('materiais')} className="bg-orange-50 text-orange-500 p-3 rounded-xl"><Plus/></button>
              </div>
              {/* LISTA DE MATERIAIS ADICIONADOS */}
              <div className="space-y-2">
                {novoProduto.materiais.map((m: any) => (
                  <div key={m.id} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-100">
                    <div className="text-xs font-bold text-purple-700">{m.nome} <span className="text-purple-300 ml-2">R$ {(m.valorPago/m.quantidadeComprada).toFixed(2)} un.</span></div>
                    <button onClick={() => removerMaterialDoProduto(m.id)} className="text-purple-300"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.maoDeObraHora} onChange={e => setNovoProduto({...novoProduto, maoDeObraHora: parseFloat(e.target.value)})}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Clock size={10}/> Tempo (minutos)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.tempoGastoMinutos} onChange={e => setNovoProduto({...novoProduto, tempoGastoMinutos: parseFloat(e.target.value)})}/>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                <div key={c}>
                  <label className="text-[8px] text-slate-400 block mb-1 uppercase text-center">{c}</label>
                  <input type="number" className="w-full p-2 bg-slate-50 rounded-lg text-center outline-none text-xs" value={novoProduto.custosExtras[c]} onChange={e => setNovoProduto({...novoProduto, custosExtras: {...novoProduto.custosExtras, [c]: e.target.value}})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Percent size={10}/> Lucro (%)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.lucroPorcentagem} onChange={e => setNovoProduto({...novoProduto, lucroPorcentagem: parseFloat(e.target.value)})}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Calendar size={10}/> Prazo</label>
                <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.prazoEntrega} onChange={e => setNovoProduto({...novoProduto, prazoEntrega: e.target.value})}/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="text-orange-500 font-black text-4xl">R$ {calculos.precoFinal}</div>
              <div className="flex gap-2">
                <button onClick={() => alert("Produto salvo na nuvem!")} className="bg-orange-500 text-white p-3 px-5 rounded-xl font-bold flex items-center gap-2"><Save size={18}/> SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="text-purple-700 font-bold mb-4">Cadastrar no Estoque</h2>
            <input placeholder="Nome (Ex: Caixa MDF)" className="w-full p-4 bg-slate-50 rounded-xl mb-3 outline-none" value={novoMaterial.nome} onChange={e => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
            <div className="flex gap-3 mb-6">
              <input type="number" placeholder="Preço Pago" className="flex-1 p-4 bg-slate-50 rounded-xl outline-none" value={novoMaterial.valorPago || ''} onChange={e => setNovoMaterial({...novoMaterial, valorPago: parseFloat(e.target.value)})} />
              <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-xl outline-none" value={novoMaterial.quantidadeComprada || ''} onChange={e => setNovoMaterial({...novoMaterial, quantidadeComprada: parseFloat(e.target.value)})}/>
            </div>
            <button onClick={salvarMaterial} className="w-full bg-orange-500 text-white p-4 rounded-xl font-black shadow-lg">ADICIONAR MATERIAL</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('materiais')} className={activeTab === 'materiais' ? 'text-purple-600' : 'text-slate-300'}><Package size={26}/></button>
        <button onClick={() => setActiveTab('criar')} className="bg-orange-500 -mt-12 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white"><Plus size={30}/></button>
        <button onClick={() => setActiveTab('salvos')} className={activeTab === 'salvos' ? 'text-purple-600' : 'text-slate-300'}><History size={26}/></button>
      </nav>
    </div>
  );
}
