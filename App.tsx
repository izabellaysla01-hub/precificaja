import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2 } from 'lucide-react';

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

  // Estados Calculadora
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

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro de acesso!"); }
  };

  const deletarPedido = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este pedido?")) {
      await deleteDoc(doc(db, "pedidos", id));
    }
  };

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === p.clienteId);
    const msg = `*ORÇAMENTO - PrecificaJá*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Valor:* R$ ${p.preco}%0A*Pagamento:* ${p.pagamento || 'PIX'}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        {/* ABA CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={20}/> NOVO PEDIDO</h2>
            <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Selecionar Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
               <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl">R$ {precoFinal}</div>
              <button onClick={async () => {
                await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, clienteId: clienteSel, pagamento, userId: user.uid, data: new Date().toLocaleDateString() });
                alert("Salvo!"); setActiveTab('pedidos');
              }} className="bg-orange-500 text-white p-4 rounded-3xl font-black shadow-lg uppercase text-xs">Salvar</button>
            </div>
          </div>
        )}

        {/* ABA PEDIDOS SALVOS (COM LIXEIRA) */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3">
             <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History/> Pedidos Salvos</h2>
             {pedidos.length === 0 ? <p className="text-center text-slate-400 py-10">Nenhum pedido salvo.</p> : pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex justify-between items-center border border-slate-50">
                   <div>
                     <p className="font-black text-xs uppercase text-purple-700">{cli?.nome || 'Sem Nome'}</p>
                     <p className="text-[11px] font-bold text-slate-700">{p.nomeProd}</p>
                     <p className="text-[9px] text-slate-300">{p.data}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="text-orange-500 font-black text-lg">R$ {p.preco}</div>
                      <button onClick={() => deletarPedido(p.id)} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                   </div>
                 </div>
               );
             })}
          </div>
        )}

        {/* ABAS ESTOQUE E CLIENTES (MANTIDAS) */}
        {activeTab === 'materiais' && (
          <div className="space-y-4">
             <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package/> Estoque</h2>
              <input placeholder="Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <input type="number" placeholder="Preço" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
              <button onClick={async () => {
                const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid };
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                else await addDoc(collection(db, "materiais"), d);
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border">
                <span className="font-bold">{m.nome}</span>
                <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200"><Trash2/></button>
              </div>
            ))}
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
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm"><span className="font-bold">{c.nome}</span><button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200"><Trash2/></button></div>)}
          </div>
        )}
      </main>

      {/* RODAPÉ COLORIDO */}
      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl transition-all ${activeTab === 'clientes' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-300'}`}><User size={22}/></button>
          <button onClick={() => setActiveTab('criar')} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300'}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
