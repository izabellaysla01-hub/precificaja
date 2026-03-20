import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent, User, MessageCircle, Calendar, Tag } from 'lucide-react';

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

const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center border">
      <h1 className="text-2xl font-bold text-purple-700 mb-6 font-sans">PrecificaJá 🚀</h1>
      <input type="email" placeholder="Seu E-mail" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg uppercase">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-sm text-purple-600 underline block w-full">{isRegistering ? 'Já tenho conta' : 'Criar conta grátis'}</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'pedidos' | 'clientes'>('criar');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const [nomeProd, setNomeProd] = useState('');
  const [qtdPed, setQtdPed] = useState('1');
  const [matsNoPed, setMatsNoPed] = useState<any[]>([]);
  const [vHora, setVHora] = useState('9');
  const [tGasto, setTGasto] = useState('60');
  const [custos, setCustos] = useState({ embalagem: '0', energia: '0', taxas: '0', outros: '0' });
  const [lucro, setLucro] = useState('100');
  const [desconto, setDesconto] = useState('0');
  const [prazo, setPrazo] = useState('');
  const [clienteSel, setClienteSel] = useState('');
  const [pagamento, setPagamento] = useState('PIX');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ nome: '', valor: '', qtd: '1' });
  const [novoCli, setNovoCli] = useState({ nome: '', zap: '' });

  useEffect(() => { onAuthStateChanged(auth, u => setUser(u)); }, []);
  useEffect(() => {
    if (user) {
      onSnapshot(query(collection(db, "materiais"), where("userId", "==", user.uid)), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "pedidos"), where("userId", "==", user.uid)), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "clientes"), where("userId", "==", user.uid)), s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const precoFinal = useMemo(() => {
    const cMat = matsNoPed.reduce((acc, m) => acc + (Number(m.valor || 0) / Number(m.qtd || 1)), 0);
    const mObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const ex = Number(custos.embalagem || 0) + Number(custos.energia || 0) + Number(custos.taxas || 0) + Number(custos.outros || 0);
    const subtotal = (cMat + mObra + ex) * Number(qtdPed || 1);
    const total = subtotal * (1 + (Number(lucro || 0) / 100)) - Number(desconto || 0);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === p.clienteSel);
    const dataFormatada = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*ORÇAMENTO - Loop Creative*%0A---%0A*Produto:* ${p.nomeProd}%0A*Quantidade:* ${p.qtdPed} un%0A*Prazo:* ${dataFormatada}%0A*Pagamento:* ${p.pagamento}%0A---%0A*TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro de acesso!"); }
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        
        {/* ABA: CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-purple-700 font-bold flex items-center gap-2"><ShoppingCart size={20}/> NOVO PEDIDO</h2>
              <button onClick={() => signOut(auth)} className="text-slate-300"><LogOut size={18}/></button>
            </div>
            
            <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none text-slate-500" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
               <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none text-center" placeholder="Qtd" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Materiais</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPed([...matsNoPed, m]);
              }} value="">
                <option value="">+ Selecionar Material</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <div className="space-y-2">
                {matsNoPed.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs">
                    {m.nome} <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-400 uppercase">Valor Hora (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-400 uppercase">Tempo (Min)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
            </div>

            {/* CUSTOS EXTRAS DESCRITOS */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3 text-center">Custos Extras (Opcional)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'embalagem', label: 'EMBAL.' },
                  { id: 'energia', label: 'LUZ' },
                  { id: 'taxas', label: 'TAXAS' },
                  { id: 'outros', label: 'OUTROS' }
                ].map(c => (
                  <div key={c.id} className="flex flex-col items-center">
                    <span className="text-[8px] font-bold text-slate-300 mb-1">{c.label}</span>
                    <input type="number" className="w-full p-2 bg-slate-50 rounded-xl text
