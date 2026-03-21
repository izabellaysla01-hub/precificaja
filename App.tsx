import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar } from 'lucide-react';

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

// --- TELA DE LOGIN COM RECUPERAÇÃO DE SENHA ---
const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => {
  const recuperarSenha = async () => {
    if (!email) return alert("Digite seu e-mail primeiro para eu te mandar o link!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enviamos um link para o seu e-mail! Verifique sua caixa de entrada (e o lixo/spam).");
    } catch (e) { alert("E-mail não encontrado ou inválido."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center border border-slate-100">
        <h1 className="text-3xl font-black text-purple-700 mb-2 font-sans">PrecificaJá 🚀</h1>
        <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-widest">Sua papelaria lucrando mais</p>
        <input type="email" placeholder="Seu e-mail" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-2 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(e.target.value)} />
        
        <button onClick={recuperarSenha} className="text-[10px] text-purple-400 font-bold uppercase mb-6 hover:text-purple-600 block w-full text-right pr-2">Esqueci minha senha</button>
        
        <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all uppercase">{isRegistering ? 'Criar Conta Grátis' : 'Entrar no App'}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-sm text-purple-600 underline block w-full font-medium">{isRegistering ? 'Já tenho login' : 'Cadastrar novo usuário'}</button>
      </div>
    </div>
  );
};

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
  const [custos, setCustos] = useState({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
  const [lucro, setLucro] = useState('100');
  const [desconto, setDesconto] = useState('0');
  const [prazo, setPrazo] = useState('');
  const [clienteSel, setClienteSel] = useState('');

  // Estados Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1' });
  const [novoCli, setNovoCli] = useState({ nome: '', zap: '' });

  useEffect(() => { return onAuthStateChanged(auth, u => setUser(u)); }, []);
  useEffect(() => {
    if (user) {
      onSnapshot(query(collection(db, "materiais"), where("userId", "==", user.uid)), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "pedidos"), where("userId", "==", user.uid)), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "clientes"), where("userId", "==", user.uid)), s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const precoFinal = useMemo(() => {
    const cMat = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 1)), 0);
    const mObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const ex = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    const subtotal = (cMat + mObra + ex) * Number(qtdPed || 1);
    const total = subtotal * (1 + (Number(lucro || 0) / 100)) - Number(desconto || 0);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*Orçamento - Loop Creative*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("E-mail ou senha incorretos!"); }
  };

  const confirmarExcluir = async (tipo: string, id: string) => {
    if (window.confirm(`Excluir ${tipo}?`)) {
      await deleteDoc(doc(db, tipo === 'pedido' ? "pedidos" : tipo === 'cliente' ? "clientes" : "materiais", id));
    }
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-red-500 bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"><LogOut size={14}/> SAIR</button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><ShoppingCart size={18}/> Novo Orçamento</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
               </div>
               <div><label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
               </div>
            </div>

            <div className="mb-6">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
               <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full mb-4" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Escolher Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>

               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados (Folhas/Unid)</label>
               <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setMatsNoPed([...matsNoPed, { ...m, qtdUsada: 1 }]);
               }} value="">
                  <option value="">+ Adicionar Material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
               </select>
               <div className="space-y-2">
                  {matsNoPed.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs">
                      <span>{m.nome}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-12 bg-white rounded-lg p-1 text-center" value={m.qtdUsada} onChange={e => {
                           const nova = [...matsNoPed]; nova[i].qtdUsada = e.target.value; setMatsNoPed(nova);
                        }} />
                        <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Clock size={10}/> Tempo Gasto (min)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
            </div>

            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Custos Extras (Opcional)</p>
              <div className="grid grid-cols-4 gap-2">
                {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                  <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                    <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Percent size={10}/> Lucro %</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Calendar size={10}/> Prazo</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            </div>

            <div className="mb-10">
               <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 ml-1"><Tag size={10}/> Desconto (R$)</label>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
            </div>

            <div className="flex items-center justify-between border-t pt-8">
              <div className="text-orange-500 font-black text-5xl tracking-tighter">R$ {precoFinal}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                   await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, clienteId: clienteSel, prazo, qtdPed, userId: user.uid, data: new Date().toLocaleDateString() });
                   alert("Salvo!"); setActiveTab('pedidos');
                }} className="bg-orange-500 text-white px-8 py-5 rounded-[25px] font-black uppercase text-xs shadow-lg">Salvar</button>
                <button onClick={() => enviarZap({nomeProd, preco: precoFinal, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-5 rounded-[25px] shadow-lg"><MessageCircle/></button>
              </div>
            </div>
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex justify-between items-center border">
                   <div>
                      <p className="font-black text-[10px] uppercase text-purple-700 leading-none mb-1">{cli?.nome || 'Sem Nome'}</p>
                      <p className="font-bold text-slate-700 text-sm">{p.nomeProd}</p>
                      <p className="text-[9px] text-slate-300 font-bold uppercase">{p.data}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="text-orange-500 font-black text-xl mr-2">R$ {p.preco}</div>
                      <button onClick={() => enviarZap(p)} className="text-emerald-500 p-2 bg-emerald-50 rounded-xl"><MessageCircle size={20}/></button>
                      <button onClick={() => confirmarExcluir('pedido', p.id)} className="text-red-200 p-2"><Trash2 size={20}/></button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

        {/* ESTOQUE */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package size={20}/> Estoque</h2>
              <input placeholder="Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-3 mb-6">
                <input type="number" placeholder="Preço" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid };
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                else await addDoc(collection(db, "materiais"), d);
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Material</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border">
                <div><p className="font-bold">{m.nome}</p><p className="text-orange-500 font-black text-sm">R$ {(Number(m.valor)/Number(m.qtd)).toFixed(2)} <span className="text-[10px] text-slate-300">/ un.</span></p></div>
                <div className="flex gap-1">
                  <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd})} className="text-orange-400 p-2"><Edit2 size={20}/></button>
                  <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-200 p-2"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Clientes</h2>
              <input placeholder="Nome" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { ...novoCli, userId: user.uid });
                setNovoCli({ nome: '', zap: '' }); alert("Cliente Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm font-bold"><span className="ml-2">{c.nome}</span><button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={20}/></button></div>)}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl transition-all ${activeTab === 'clientes' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><User size={22}/></button>
          <button onClick={() => setActiveTab('criar')} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300'}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
