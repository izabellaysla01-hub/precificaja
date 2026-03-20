import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle } from 'lucide-react';

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
      <h1 className="text-2xl font-bold text-purple-700 mb-6">PrecificaJá 🚀</h1>
      <input type="email" placeholder="E-mail" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg uppercase">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-sm text-purple-600 underline block w-full">{isRegistering ? 'Voltar' : 'Criar conta grátis'}</button>
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

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro!"); }
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-purple-700 font-bold flex items-center gap-2 tracking-tight"><ShoppingCart size={20}/> NOVO PEDIDO</h2>
              <button onClick={() => signOut(auth)} className="text-slate-300"><LogOut size={18}/></button>
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
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3 border-none" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPed([...matsNoPed, m]);
              }} value="">
                <option value="">+ Adicionar Material</option>
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
              <div><label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Valor Hora (R$)</label>
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

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl">R$ {precoFinal}</div>
              <button onClick={async () => {
                await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, userId: user.uid, data: new Date().toLocaleDateString() });
                alert("Salvo!");
                setActiveTab('pedidos');
              }} className="bg-orange-500 text-white px-8 py-4 rounded-3xl font-black shadow-lg uppercase text-xs">Salvar</button>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package/> Estoque</h2>
              <input placeholder="Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "materiais"), { ...novoMat, userId: user.uid });
                setNovoMat({ nome: '', valor: '', qtd: '1' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">ADICIONAR</button>
            </div>
            {materiais.map(m => <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border"><span className="font-bold">{m.nome}</span><button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200"><Trash2/></button></div>)}
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User/> Clientes</h2>
              <input placeholder="Nome" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { ...novoCli, userId: user.uid });
                setNovoCli({ nome: '', zap: '' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">SALVAR</button>
            </div>
            {clientes.map(c => <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border"><span className="font-bold">{c.nome}</span><button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200"><Trash2/></button></div>)}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-3">
             <h2 className="text-purple-700 font-bold mb-4 tracking-tight">Pedidos Salvos</h2>
             {pedidos.map(p => <div key={p.id} className="bg-white p-6 rounded-[30px] shadow-sm flex justify-between items-center border border-slate-100"><div><p className="font-black text-xs uppercase">{p.nomeProd}</p><p className="text-[10px] text-slate-300 font-bold">{p.data}</p></div><div className="text-orange-500 font-black text-xl">R$ {p.preco}</div></div>)}
          </div>
        )}
      </main>

      {/* RODAPÉ COM BOTÕES QUE FICAM LARANJAS QUANDO ATIVOS */}
      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl transition-all ${activeTab === 'clientes' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><User size={22}/></button>
          <button onClick={() => setActiveTab('criar')} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-110 shadow-orange-200' : 'bg-white text-slate-300'}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
