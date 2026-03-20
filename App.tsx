import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent, Calendar, Send } from 'lucide-react';

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

// --- COMPONENTE DE LOGIN ---
const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
      <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calculator className="text-orange-500 w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
      <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta profissional' : 'Acesse seu painel'}</p>
      <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border border-slate-200 mb-3 outline-none focus:ring-2 focus:ring-orange-500" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border border-slate-200 mb-6 outline-none focus:ring-2 focus:ring-orange-500" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-600 mb-4 transition-all">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium">{isRegistering ? 'Já tem conta? Entrar' : 'Novo por aqui? Criar conta'}</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Estados de Entrada
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados do Produto
  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matsNoPedido, setMatsNoPedido] = useState<any[]>([]);
  const [valorHora, setValorHora] = useState('');
  const [tempoGasto, setTempoGasto] = useState('');
  const [custos, setCustos] = useState({ embalagem: '', energia: '', taxas: '', outros: '' });
  const [lucro, setLucro] = useState('100');
  const [prazo, setPrazo] = useState('');

  // Estado do Estoque
  const [novoMat, setNovoMat] = useState({ nome: '', valor: '', qtd: '1' });

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Verifique e-mail e senha (min 6 dígitos)."); }
  };

  const resultadoFinal = useMemo(() => {
    const custoMats = matsNoPedido.reduce((acc, m) => acc + (Number(m.valor || 0) / Number(m.qtd || 1)), 0);
    const vHora = Number(valorHora || 0);
    const tMin = Number(tempoGasto || 0);
    const maoObra = (vHora / 60) * tMin;
    const extras = Number(custos.embalagem || 0) + Number(custos.energia || 0) + Number(custos.taxas || 0) + Number(custos.outros || 0);
    const subtotal = (custoMats + maoObra + extras) * Number(qtdPedido || 1);
    const total = subtotal * (1 + (Number(lucro || 0) / 100));
    return isNaN(total) ? "0.00" : total.toFixed(2);
  }, [matsNoPedido, valorHora, tempoGasto, custos, lucro, qtdPedido]);

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center gap-2 text-purple-700 font-bold"><Calculator size={20}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)}><LogOut size={20} className="text-slate-300" /></button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Novo Produto</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <input className="col-span-2 p-3 bg-slate-50 rounded-xl outline-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              <input type="number" className="p-3 bg-slate-50 rounded-xl outline-none" placeholder="Qtd" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Materiais</label>
              <div className="flex gap-2 mt-1">
                <select className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-sm" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setMatsNoPedido([...matsNoPedido, m]);
                }} value="">
                  <option value="">+ Selecionar material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <button onClick={() => setActiveTab('materiais')} className="bg-orange-50 text-orange-500 p-3 rounded-xl"><Plus/></button>
              </div>
              <div className="mt-3 space-y-2">
                {matsNoPedido.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-2 rounded-lg text-xs font-bold text-purple-700">
                    {m.nome} <button onClick={() => setMatsNoPedido(matsNoPedido.filter((_, idx) => idx !== i))}><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" placeholder="Valor Hora" className="p-3 bg-slate-50 rounded-xl outline-none" value={valorHora} onChange={e => setValorHora(e.target.value)} />
              <input type="number" placeholder="Minutos" className="p-3 bg-slate-50 rounded-xl outline-none" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                <input key={c} type="number" placeholder={c} className="p-2 bg-slate-50 rounded-lg text-center text-[10px] outline-none" value={custos[c as keyof typeof custos]} onChange={e => setCustos({...custos, [c]: e.target.value})} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl">R$ {resultadoFinal}</div>
              <button onClick={async () => {
                if (!nomeProd) return alert("Dê um nome!");
                await addDoc(collection(db, "produtos"), { nome: nomeProd, preco: resultadoFinal, userId: user.uid, data: new Date().toISOString() });
                alert("Salvo!");
                setActiveTab('salvos');
              }} className="bg-orange-500 text-white p-3 px-6 rounded-2xl font-bold shadow-lg">SALVAR</button>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4">Novo no Estoque</h2>
              <input placeholder="Nome" className="w-full p-3 bg-slate-50 rounded-xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-2 mb-4">
                <input type="number" placeholder="Preço" className="flex-1 p-3 bg-slate-50 rounded-xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-20 p-3 bg-slate-50 rounded-xl outline-none" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                if (!novoMat.nome || !novoMat.valor) return;
                await addDoc(collection(db, "materiais"), { ...novoMat, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid });
                setNovoMat({ nome: '', valor: '', qtd: '1' });
                alert("Adicionado!");
              }} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold uppercase shadow-lg">CADASTRAR</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border shadow-sm">
                <div><p className="font-bold">{m.nome}</p><p className="text-xs text-slate-400">R$ {Number(m.valor).toFixed(2)} por {m.qtd} un</p></div>
                <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-300"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'salvos' && (
          <div className="space-y-3">
            {produtosSalvos.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
                <span className="font-bold">{p.nome}</span>
                <span className="text-orange-500 font-black">R$ {p.preco}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around shadow-2xl z-50">
        <button onClick={() => setActiveTab('materiais')} className={`flex flex-col items-center p-2 ${activeTab === 'materiais' ? 'text-purple-600' : 'text-slate-300'}`}><Package/><span className="text-[8px] font-bold">ESTOQUE</span></button>
        <button onClick={() => setActiveTab('criar')} className="bg-orange-500 -mt-12 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white"><Plus/></button>
        <button onClick={() => setActiveTab('salvos')} className={`flex flex-col items-center p-2 ${activeTab === 'salvos' ? 'text-purple-600' : 'text-slate-300'}`}><History/><span className="text-[8px] font-bold">SALVOS</span></button>
      </nav>
    </div>
  );
}
