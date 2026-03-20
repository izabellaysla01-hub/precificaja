import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent } from 'lucide-react';

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

// --- TELA DE LOGIN ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro! Verifique e-mail e senha."); }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">PrecificaJá 🚀</h1>
        <input type="email" placeholder="Seu E-mail" className="w-full p-3 rounded-xl border mb-3 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Sua Senha" className="w-full p-3 rounded-xl border mb-6 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mb-4">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium underline">{isRegistering ? 'Quero Criar uma Conta' : 'Já tenho conta'}</button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Formulário de Material
  const [novoMaterial, setNovoMaterial] = useState({ nome: '', valorPago: '', quantidadeComprada: '1' });
  
  // Formulário de Produto
  const [novoProduto, setNovoProduto] = useState<any>({
    nome: '', materiais: [], maoDeObraHora: '0', tempoGastoMinutos: '0',
    custosExtras: { embalagem: '0', energia: '0', taxas: '0', outros: '0' },
    lucroPorcentagem: '100', quantidadePedido: '1'
  });

  // Monitor de Usuário
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) {
        setMateriais([]);
        setProdutosSalvos([]);
      }
    });
    return unsub;
  }, []);

  // Busca Dados na Nuvem (Firebase)
  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      
      const unsubMat = onSnapshot(qMat, s => {
        setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      
      const unsubProd = onSnapshot(qProd, s => {
        setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubMat(); unsubProd(); };
    }
  }, [user]);

  // Função Salvar Material
  const handleAddMaterial = async () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago) return alert("Preencha o nome e o preço!");
    try {
      await addDoc(collection(db, "materiais"), {
        nome: novoMaterial.nome,
        valorPago: parseFloat(novoMaterial.valorPago) || 0,
        quantidadeComprada: parseFloat(novoMaterial.quantidadeComprada) || 1,
        userId: user.uid
      });
      setNovoMaterial({ nome: '', valorPago: '', quantidadeComprada: '1' });
      alert("Material salvo no seu estoque!");
    } catch (e) { alert("Erro ao conectar com o Google!"); }
  };

  // Lógica da Calculadora
  const totalCalculado = useMemo(() => {
    const custoMats = novoProduto.materiais.reduce((acc: number, m: any) => acc + (m.valorUnit * (parseFloat(m.qtdUsada) || 0)), 0);
    const vHora = parseFloat(novoProduto.maoDeObraHora) || 0;
    const tMin = parseFloat(novoProduto.tempoGastoMinutos) || 0;
    const maoObra = (vHora / 60) * tMin;
    const extras = Object.values(novoProduto.custosExtras).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) as number;
    const custoBase = (custoMats + maoObra + extras) * (parseFloat(novoProduto.quantidadePedido) || 1);
    const comLucro = custoBase * (1 + ((parseFloat(novoProduto.lucroPorcentagem) || 0) / 100));
    return isNaN(comLucro) ? 0 : comLucro;
  }, [novoProduto]);

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <header className="bg-purple-800 text-white p-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-xl font-bold flex items-center gap-2"><Calculator /> PrecificaJá</h1>
        <button onClick={() => signOut(auth)} className="bg-white/10 p-2 rounded-lg"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        
        {/* CONTEÚDO DA ABA ESTOQUE */}
        {activeTab === 'materiais' && (
          <div
