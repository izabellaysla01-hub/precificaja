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

// --- COMPONENTE DE LOGIN ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro no login! Verifique e-mail e senha."); }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">PrecificaJá 🚀</h1>
        <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border mb-3 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border mb-6 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mb-4">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium underline">{isRegistering ? 'Voltar' : 'Criar conta grátis'}</button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  const [novoMaterial, setNovoMaterial] = useState({ nome: '', valorPago: '', quantidadeComprada: '1' });
  const [novoProduto, setNovoProduto] = useState<any>({
    nome: '', materiais: [], maoDeObraHora: '0', tempoGastoMinutos: '0',
    custosExtras: { embalagem: '0', energia: '0', taxas: '0', outros: '0' },
    lucroPorcentagem: '100', quantidadePedido: '1'
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

  // SALVAR MATERIAL NO ESTOQUE
  const addMaterial = async () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago) return alert("Preencha Nome e Preço!");
    try {
      await addDoc(collection(db, "materiais"), {
        nome: novoMaterial.nome,
        valorPago: parseFloat(novoMaterial.valorPago) || 0,
        quantidadeComprada: parseFloat(novoMaterial.quantidadeComprada) || 1,
        userId: user.uid
      });
      setNovoMaterial({ nome: '', valorPago: '', quantidadeComprada: '1' });
      alert("Material adicionado!");
    } catch (e) { alert("Erro ao salvar!"); }
  };

  // SELECIONAR MATERIAL PARA O PRODUTO
  const selecionarMaterial = (id: string) => {
    const mat = materiais.find(m => m.id === id);
    if (!mat) return;
    const jaTem = novoProduto.materiais.find((m: any) => m.materialId === id);
    if (jaTem) return;
    setNovoProduto({
      ...novoProduto,
      materiais: [...novoProduto.materiais, { materialId: id, nome: mat.nome, valorUnit: mat.valorPago / mat.quantidadeComprada, qtdUsada: 1 }]
    });
  };

  // CÁLCULO TOTAL (BLINDADO CONTRA NaN)
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
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <header className="bg-purple-800 text-white p-5 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2"><Calculator /> PrecificaJá</h1>
        <button onClick={() => signOut(auth)} className="opacity-70"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* ABA ESTOQUE */}
        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-md border">
              <h2 className="text-purple-800 font-bold mb-4">Novo Material no Estoque</h2>
              <input placeholder="Ex: Caneca, Papel..." className="w-full p-3 bg-slate-50 rounded-xl mb-3 border-none outline-none" value={novoMaterial.nome} onChange={e => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
              <div className="flex gap-2 mb-4">
                <input type="number" placeholder="Preço Pago R$" className="flex-1 p-3 bg-slate-50 rounded-xl outline-none" value={novoMaterial.valorPago} onChange={e => setNovoMaterial({...novoMaterial, valorPago: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-20 p-3 bg-slate-50 rounded-xl outline-none" value={novoMaterial.quantidadeComprada} onChange={e => setNovoMaterial({...novoMaterial, quantidadeComprada: e.target.value})} />
              </div>
              <button onClick={addMaterial} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg uppercase">Adicionar ao Estoque</button>
            </div>
            
            <div className="bg-white p-6 rounded-3xl shadow-md border">
              <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest">Meus Materiais</h3>
              {materiais.length === 0 && <p className="text-center text-slate-300 py-4">Estoque vazio.</p>}
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="font-bold text-slate-700">{m.nome}</span>
                  <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-purple-800 font-bold mb-6 flex items-center gap-2 text-lg"><ShoppingCart size={20}/> Novo Produto</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400">NOME DO PRODUTO</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400">QTD PEDIDO</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.quantidadePedido} onChange={e => setNovoProduto({...novoProduto, quantidadePedido: e.target.value})} />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400">MATERIAIS UTILIZADOS</label>
              <select className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm mb-3 border-none" onChange={e => selecionarMaterial(e.target.value)} value="">
                <option value="">Selecione um material...</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              {novoProduto.materiais.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl mb-2">
                  <span className="text-xs font-bold text-purple-700">{m.nome}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-12 p-1 bg-white rounded text-center text-xs" value={m.qtdUsada} onChange={e => {
                      const nova =
