import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Tag } from 'lucide-react';

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
      <h1 className="text-2xl font-bold text-purple-700 mb-6 font-sans text-center">PrecificaJá 🚀</h1>
      <input type="email" placeholder="Seu e-mail" className="w-full p-4 bg-slate-50 rounded-2xl border-none mb-3 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Sua senha" className="w-full p-4 bg-slate-50 rounded-2xl border-none mb-6 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-sm text-purple-600 underline block w-full text-center">{isRegistering ? 'Já tenho conta' : 'Criar conta grátis'}</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'pedidos' | 'clientes'>('criar');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Estados do Produto
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

  // Login e Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1' });
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

  const enviarZap = () => {
    const cli = clientes.find(c => c.id === clienteSel);
    const msg = `*ORÇAMENTO - Loop Creative*%0A---%0A*Produto:* ${nomeProd}%0A*Qtd:* ${qtdPed} un%0A*Prazo:* ${prazo || 'A combinar'}%0A*Total:* R$ ${precoFinal}%0A---%0A*Pagamento:* ${pagamento}`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const salvarMaterial = async () => {
    if (!novoMat.nome || !novoMat.valor) return;
    const dados = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid };
    if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), dados);
    else await addDoc(collection(db, "materiais"), dados);
    setNovoMat({ id: '', nome: '', valor: '', qtd: '1' });
    alert("Estoque atualizado!");
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro de login!"); }
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-purple-700 font-bold flex items-center gap-2"><ShoppingCart size={20}/> NOVO PEDIDO</h2>
              <button onClick={() => signOut(auth)}><LogOut size={18} className="text-slate-300"/></button>
            </div>
            
            <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none border-none shadow-inner" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none text-slate-500 border-none" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
               <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none text-center" placeholder="Qtd" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
            </div>

            <div className="mb-6">
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3 border-none shadow-sm" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPed([...matsNoPed, m]);
              }} value="">
                <option value="">+ Selecionar Material</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <div className="space-y-2">
                {matsNoPed.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-4 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs">
                    {m.nome} <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={18} className="text-purple-300"/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Valor Hora</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Minutos</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">Custos Extras (Opcional)</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'embalagem', label: 'EMBAL.' },
                  { id: 'energia', label: 'LUZ' },
                  { id: 'taxas', label: 'TAXAS' },
                  { id: 'outros', label: 'OUTROS' }
                ].map(c => (
                  <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                    <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Lucro (%)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Prazo</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pagamento</label>
               <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                  <option value="PIX">PIX</option><option value="CARTÃO">CARTÃO</option><option value="DINHEIRO">DINHEIRO</option>
               </select></div>
               <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Desconto (R$)</label>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} /></div>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl">R$ {precoFinal}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, userId: user.uid, data: new Date().toLocaleDateString() });
                  alert("Salvo!");
                  setActiveTab('pedidos');
                }} className="bg-orange-500 text-white p-4 rounded-3xl font-black shadow-lg uppercase text-[10px]">Salvar</button>
                <button onClick={enviarZap} className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg"><MessageCircle size={24}/></button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border border-slate-100">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package/> {novoMat.id ? 'Editar Preço' : 'Novo Material'}</h2>
              <input placeholder="Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-3 mb-6">
                <input type="number" placeholder="Preço" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={salvarMaterial} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg uppercase text-xs">{novoMat.id ? 'Atualizar Valor' : 'Adicionar ao Estoque'}</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
                <div><p className="font-bold text-slate-700">{m.nome}</p><p className="text-xs text-slate-400">R$ {Number(m.valor).toFixed(2)} / {m.qtd} un</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd})} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                  <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200 p-2"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text
