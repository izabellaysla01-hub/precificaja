import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Package, Plus, Trash2, LogOut, Calculator, History, ShoppingCart, Clock, Percent, Calendar, Send, Save, X } from 'lucide-react';

// CONFIGURAÇÃO FIREBASE (Suas chaves)
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { alert("Erro: Verifique e-mail e senha (mínimo 6 dígitos)."); }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calculator className="text-orange-500 w-8 h-8" /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border border-slate-200 mb-3 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border border-slate-200 mb-6 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mb-4">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600">{isRegistering ? 'Voltar para Login' : 'Criar conta grátis'}</button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('criar');
  const [materiaisCadastrados, setMateriaisCadastrados] = useState<any[]>([]);
  const [salvos, setSalvos] = useState<any[]>([]);

  // Estados do Produto
  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matsNoPedido, setMatsNoPedido] = useState<any[]>([]); // LISTA DE MATERIAIS SELECIONADOS
  const [valorHora, setValorHora] = useState('');
  const [tempoGasto, setTempoGasto] = useState('');
  const [custos, setCustos] = useState({ embalagem: '', energia: '', taxas: '', outros: '' });
  const [lucro, setLucro] = useState('100');
  const [prazo, setPrazo] = useState('');

  // Estados do Novo Material
  const [nomeMat, setNomeMat] = useState('');
  const [valorMat, setValorMat] = useState('');
  const [qtdMat, setQtdMat] = useState('1');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubM = onSnapshot(qMat, s => setMateriaisCadastrados(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubP = onSnapshot(qProd, s => setSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubM(); unsubP(); };
    }
  }, [user]);

  // FUNÇÃO PARA ADICIONAR MATERIAL AO CÁLCULO
  const selecionarMaterial = (id: string) => {
    const mat = materiaisCadastrados.find(m => m.id === id);
    if (mat) setMatsNoPedido([...matsNoPedido, mat]);
  };

  const removerMaterial = (index: number) => {
    const novaLista = matsNoPedido.filter((_, i) => i !== index);
    setMatsNoPedido(novaLista);
  };

  // CÁLCULO MATEMÁTICO COMPLETO
  const calcularTotal = () => {
    const custoMateriais = matsNoPedido.reduce((acc, cur) => acc + (cur.valor / cur.qtd), 0);
    const vHora = parseFloat(valorHora || '0');
    const tGasto = parseFloat(tempoGasto || '0');
    const maoDeObra = (vHora / 60) * tGasto;
    const somaExtras = parseFloat(custos.embalagem || '0') + parseFloat(custos.energia || '0') + parseFloat(custos.taxas || '0') + parseFloat(custos.outros || '0');
    
    const custoTotalBase = (custoMateriais + maoDeObra + somaExtras) * parseFloat(qtdPedido || '1');
    const comLucro = custoTotalBase * (1 + (parseFloat(lucro || '0') / 100));
    return comLucro.toFixed(2);
  };

  const addMaterialAoBanco = async () => {
    if (!nomeMat || !valorMat) return;
    await addDoc(collection(db, "materiais"), { nome: nomeMat, valor: parseFloat(valorMat), qtd: parseFloat(qtdMat), userId: user.uid });
    setNomeMat(''); setValorMat(''); setQtdMat('1');
    setTab('criar');
  };

  const salvarProduto = async () => {
    await addDoc(collection(db, "produtos"), { nome: nomeProd, valor: calcularTotal(), data: new Date().toLocaleDateString(), userId: user.uid });
    alert("Salvo!");
    setTab('salvos');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-purple-600 font-bold"><Calculator size={20}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-slate-400"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {tab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Novo Produto</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">NOME DO PRODUTO</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">QTD</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">MATERIAIS (SELECIONE VÁRIOS)</label>
              <div className="flex gap-2 mb-2">
                <select className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-sm" onChange={e => selecionarMaterial(e.target.value)} value="">
                  <option value="">+ Adicionar material ao cálculo...</option>
                  {materiaisCadastrados.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <button onClick={() => setTab('materiais')} className="bg-orange-50 text-orange-500 p-3 rounded-xl"><Plus/></button>
              </div>
              {/* LISTA DE MATERIAIS NO PEDIDO */}
              <div className="space-y-2">
                {matsNoPedido.map((m, i) => (
                  <div key={i} className="flex justify-between bg-purple-50 p-2 rounded-lg text-xs text-purple-700 font-medium">
                    <span>{m.nome}</span>
                    <button onClick={() => removerMaterial(i)}><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase">VALOR DA HORA (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={valorHora} onChange={e => setValorHora(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase">TEMPO (MINUTOS)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                <div key={c}>
                  <label className="text-[8px] text-slate-400 block mb-1 uppercase text-center">{c}</label>
                  <input type="number" className="w-full p-2 bg-slate-50 rounded-lg text-center outline-none text-xs" value={custos[c as keyof typeof custos]} onChange={e => setCustos({...custos, [c]: e.target.value})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase">LUCRO (%)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={lucro} onChange={e => setLucro(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase">PRAZO</label>
                <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={prazo} onChange={e => setPrazo(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-orange-500 font-black text-4xl">R$ {calcularTotal()}</div>
              <div className="flex gap-2">
                <button onClick={salvarProduto} className="bg-orange-500 text-white p-3 px-5 rounded-xl font-bold flex gap-2"><Save size={18}/> SALVAR</button>
                <button className="bg-emerald-500 text-white p-3 px-5 rounded-xl font-bold flex gap-2"><Send size={18}/> ORÇAMENTO</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'materiais' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="text-purple-700 font-bold mb-4">Cadastrar Material</h2>
            <input placeholder="Nome" className="w-full p-3 bg-slate-50 rounded-xl mb-2" value={nomeMat} onChange={e => setNomeMat(e.target.value)} />
            <div className="flex gap-2 mb-4">
              <input type="number" placeholder="Preço" className="flex-1 p-3 bg-slate-50 rounded-xl" value={valorMat} onChange={e => setValorMat(e.target.value)} />
              <input type="number" placeholder="Qtd" className="w-20 p-3 bg-slate-50 rounded-xl" value={qtdMat} onChange={e => setQtdMat(e.target.value)} />
            </div>
            <button onClick={addMaterialAoBanco} className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold">SALVAR NO ESTOQUE</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around shadow-2xl">
        <button onClick={() => setTab('materiais')} className={tab === 'materiais' ? 'text-purple-600' : 'text-slate-300'}><Package/></button>
        <button onClick={() => setTab('criar')} className="bg-orange-500 -mt-10 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"><Plus/></button>
        <button onClick={() => setTab('salvos')} className={tab === 'salvos' ? 'text-purple-600' : 'text-slate-300'}><History/></button>
      </nav>
    </div>
  );
}
