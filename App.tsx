import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Package, Plus, Trash2, LogOut, Calculator, History, ShoppingCart, Clock, Percent, Calendar, Send, Save } from 'lucide-react';

// --- CONFIGURAÇÃO DO SEU FIREBASE ---
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
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Erro: Verifique seus dados ou se a senha tem 6 dígitos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="text-orange-500 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta profissional' : 'Acesse seu painel'}</p>
        <input type="email" placeholder="Seu e-mail" className="w-full p-3 rounded-xl border border-slate-200 mb-3 focus:ring-2 focus:ring-orange-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Sua senha (min 6 dígitos)" className="w-full p-3 rounded-xl border border-slate-200 mb-6 focus:ring-2 focus:ring-orange-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-600 transition-all mb-4">
          {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
        </button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium">
          {isRegistering ? 'Já tenho conta? Entrar' : 'Novo por aqui? Criar conta'}
        </button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [salvos, setSalvos] = useState<any[]>([]);

  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matSelecionado, setMatSelecionado] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [tempoGasto, setTempoGasto] = useState('');
  const [custos, setCustos] = useState({ embalagem: '', energia: '', taxas: '', outros: '' });
  const [lucro, setLucro] = useState('30');
  const [prazo, setPrazo] = useState('');

  const [nomeMat, setNomeMat] = useState('');
  const [valorMat, setValorMat] = useState('');
  const [qtdMat, setQtdMat] = useState('1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubMat = onSnapshot(qMat, (s) => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubProd = onSnapshot(qProd, (s) => setSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubMat(); unsubProd(); };
    }
  }, [user]);

  const calcularTotal = () => {
    const vHora = parseFloat(valorHora || '0');
    const tGasto = parseFloat(tempoGasto || '0');
    const maoDeObra = (vHora / 60) * tGasto;
    const somaCustos = parseFloat(custos.embalagem || '0') + parseFloat(custos.energia || '0') + parseFloat(custos.taxas || '0') + parseFloat(custos.outros || '0');
    const subtotal = maoDeObra + somaCustos;
    const final = subtotal * (1 + (parseFloat(lucro || '0') / 100));
    return final.toFixed(2);
  };

  const addMaterial = async () => {
    if (!nomeMat || !valorMat) return;
    await addDoc(collection(db, "materiais"), { nome: nomeMat, valor: parseFloat(valorMat), qtd: parseFloat(qtdMat), userId: user.uid });
    setNomeMat(''); setValorMat(''); setQtdMat('1');
    setTab('criar');
  };

  const deleteMaterial = async (id: string) => {
    await deleteDoc(doc(db, "materiais", id));
  };

  const salvarProduto = async () => {
    if (!nomeProd) return alert("Dê um nome ao produto!");
    await addDoc(collection(db, "produtos"), {
      nome: nomeProd,
      valor: calcularTotal(),
      data: new Date().toLocaleDateString(),
      userId: user.uid
    });
    alert("Produto salvo com sucesso!");
    setTab('salvos');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <header className="bg-white p-4 flex justify-between items-center border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Calculator size={20} />
          </div>
          <span className="font-bold text-slate-800">PrecificaJá</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {tab === 'criar' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-purple-700 font-bold flex items-center gap-2 mb-6">
                <ShoppingCart size={18} /> Novo Produto
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                  <input placeholder="Ex: Caneca" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd</label>
                  <input type="number" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm outline-none" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Material</label>
                <div className="flex gap-2">
                  <select className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm text-slate-500 outline-none" value={matSelecionado} onChange={e => setMatSelecionado(e.target.value)}>
                    <option value="">Selecione um material...</option>
                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  <button onClick={() => setTab('materiais')} className="bg-orange-50 text-orange-500 p-3 rounded-xl"><Plus size={20} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><ShoppingCart size={10}/> Valor Hora</label><input type="number" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" value={valorHora} onChange={e => setValorHora(e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Clock size={10}/> Minutos</label><input type="number" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} /></div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-orange-500 font-black text-4xl">R$ {calcularTotal()}</div>
                <button onClick={salvarProduto} className="bg-orange-500 text-white p-3 px-6 rounded-2xl font-bold flex gap-2 shadow-lg"><Save size={18}/> SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-purple-
