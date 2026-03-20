import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Package, Plus, Trash2, LogOut, Calculator, History, ShoppingBag, ArrowRight, X } from 'lucide-react';

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
      alert("Erro: Verifique seus dados. A senha deve ter no mínimo 6 dígitos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="text-indigo-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta profissional' : 'Acesse seu painel de artesã'}</p>
        <input type="email" placeholder="Seu e-mail" className="w-full p-3 bg-slate-100 rounded-xl mb-3 outline-none focus:ring-2 ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Sua senha" className="w-full p-3 bg-slate-100 rounded-xl mb-6 outline-none focus:ring-2 ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all mb-4">
          {isRegistering ? 'Cadastrar Agora' : 'Entrar no App'}
        </button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-indigo-600 font-medium">
          {isRegistering ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar uma grátis'}
        </button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('materiais');
  
  // Estados para Materiais
  const [materiais, setMateriais] = useState<any[]>([]);
  const [nomeMat, setNomeMat] = useState('');
  const [valorMat, setValorMat] = useState('');
  const [qtdMat, setQtdMat] = useState('1');

  // Estados para Precificação
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);
  const [nomeProd, setNomeProd] = useState('');
  const [materiaisUsados, setMateriaisUsados] = useState<any[]>([]);
  const [tempoGasto, setTempoGasto] = useState('');
  const [valorHora, setValorHora] = useState('18.00');
  const [lucroDesejado, setLucroDesejado] = useState('100');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const unsubscribeMat = onSnapshot(qMat, (s) => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubscribeProd = onSnapshot(qProd, (s) => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      return () => { unsubscribeMat(); unsubscribeProd(); };
    }
  }, [user]);

  const addMaterial = async () => {
    if (!nomeMat || !valorMat) return;
    await addDoc(collection(db, "materiais"), { nome: nomeMat, valor: parseFloat(valorMat), qtd: parseFloat(qtdMat), userId: user.uid });
    setNomeMat(''); setValorMat(''); setQtdMat('1');
  };

  const calcularPrecoFinal = () => {
    const custoMateriais = materiaisUsados.reduce((acc, m) => acc + (m.valorUnitario * m.qtdUsada), 0);
    const custoTempo = (parseFloat(valorHora) / 60) * (parseFloat(tempoGasto) || 0);
    const custoTotal = custoMateriais + custoTempo;
    return custoTotal * (1 + parseFloat(lucroDesejado) / 100);
  };

  const salvarProduto = async () => {
    if (!nomeProd) return;
    await addDoc(collection(db, "produtos"), {
      nome: nomeProd,
      preco: calcularPrecoFinal(),
      userId: user.uid,
      data: new Date().toLocaleDateString()
    });
    setNomeProd(''); setMateriaisUsados([]); setTempoGasto('');
    setTab('salvos');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-indigo-600 p-6 text-white flex justify-between items-center shadow-lg rounded-b-[2rem]">
        <h1 className="text-xl font-bold flex items-center gap-2"> <Calculator size={24} /> PrecificaJá </h1>
        <button onClick={() => signOut(auth)} className="bg-white/20 p-2 rounded-xl"> <LogOut size={20} /> </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {tab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"> <Plus className="text-indigo-600" /> Novo Material</h2>
              <input placeholder="Ex: Papel Fotográfico" className="w-full p-3 bg-slate-50 rounded-xl mb-3" value={nomeMat} onChange={e => setNomeMat(e.target.value)} />
              <div className="flex gap-2 mb-4">
                <input type="number" placeholder="Preço Pago" className="w-full p-3 bg-slate-50 rounded-xl" value={valorMat} onChange={e => setValorMat(e.target.value)} />
                <input type="number" placeholder="Qtd na emb." className="w-full p-3 bg-slate-50 rounded-xl" value={qtdMat} onChange={e => setQtdMat(e.target.value)} />
              </div>
              <button onClick={addMaterial} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">Salvar Material</button>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 mb-4">Lista de Estoque</h2>
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <div><p className="font-semibold text-slate-700">{m.nome}</p><p className="text-xs text-slate-400">R$ {(m.valor / m.qtd).toFixed(2)} por unidade</p></div>
                  <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-400 p-2"> <Trash2 size={18} /> </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'criar' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">Novo Orçamento</h2>
              <input placeholder="Nome do Produto (Ex: Topo de Bolo)" className="w-full p-3 bg-slate-50 rounded-xl mb-4" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              
              <p className="text-sm font-bold text-slate-500 mb-2">Selecione os materiais:</p>
              <div className="flex gap-2 overflow-x-auto pb-4">
                {materiais.map(m => (
                  <button key={m.id} onClick={() => setMateriaisUsados([...materiaisUsados, { ...m, valorUnitario: m.valor / m.qtd, qtdUsada: 1 }])} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full whitespace-nowrap text-sm border border-indigo-100"> + {m.nome} </button>
                ))}
              </div>

              {materiaisUsados.map((m, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-lg text-sm">
                  <span className="flex-1">{m.nome}</span>
                  <input type="number" className="w-16 p-1 rounded border" value={m.qtdUsada} onChange={e => {
                    const newArr = [...materiaisUsados];
                    newArr[i].qtdUsada = parseFloat(e.target.value);
                    setMateriaisUsados(newArr);
                  }} />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Tempo (minutos)</label><input type="number" className="w-full p-3 bg-slate-50 rounded-xl" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Valor da Hora (R$)</label><input type="number" className="w-full p-3 bg-slate-50 rounded-xl" value={valorHora} onChange={e => setValorHora(e.target.value)} /></div>
              </div>

              <div className="mt-6 bg-indigo-600 p-6 rounded-2xl text-white text-center">
                <p className="text-sm opacity-80">Preço Sugerido</p>
                <h3 className="text-3xl font-bold">R$ {calcularPrecoFinal().toFixed(2)}</h3>
                <button onClick={salvarProduto} className="mt-4 bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold w-full">Salvar no Histórico</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'salvos' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Produtos Precificados</h2>
            {produtosSalvos.map(p => (
              <div key={p.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                <div><p className="font-bold text-slate-700">{p.nome}</p><p className="text-xs text-slate-400">{p.data}</p></div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-indigo-600 text-lg text-right">R$ {p.preco.toFixed(2)}</span>
                  <button onClick={() => deleteDoc(doc(db, "produtos", p.id))} className="text-red-300"> <Trash2 size={18} /> </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-lg border-t border-slate-100 p-4 flex justify-around items-center">
        <button onClick={() => setTab('materiais')} className={`flex flex-col items-center ${tab === 'materiais' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Package size={24} /> <span className="text-[10px] font-bold mt-1 uppercase">Estoque</span>
        </button>
        <button onClick={() => setTab('criar')} className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg -mt-12 border-4 border-white transform active:scale-90 transition-all">
          <Calculator size={28} />
        </button>
        <button onClick={() => setTab('salvos')} className={`flex flex-col items-center ${tab === 'salvos' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <History size={24} /> <span className="text-[10px] font-bold mt-1 uppercase">Histórico</span>
        </button>
      </nav>
    </div>
  );
}
