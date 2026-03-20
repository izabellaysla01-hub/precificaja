import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar } from 'lucide-react';

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
      <input type="email" placeholder="E-mail" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(e.target.value)} />
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

  // Estados Produto
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
  const [pagamento, setPagamento] = useState('PIX');

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
    // Cálculo dos materiais considerando a quantidade de folhas usada
    const cMat = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 1)), 0);
    const mObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const ex = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    const subtotal = (cMat + mObra + ex) * Number(qtdPed || 1);
    const total = subtotal * (1 + (Number(lucro || 0) / 100)) - Number(desconto || 0);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const msg = `*ORÇAMENTO - Loop Cretive*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Valor:* R$ ${p.preco}%0A*Pagamento:* ${p.pagamento || 'PIX'}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro de acesso!"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={20}/> NOVO PEDIDO</h2>
            <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none shadow-sm border-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Selecionar Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
               <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Materiais e Folhas</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPed([...matsNoPed, { ...m, qtdUsada: 1 }]);
              }} value="">
                <option value="">+ Adicionar Material (Folha, Fita...)</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <div className="space-y-2">
                {matsNoPed.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs">
                    <span className="flex-1">{m.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-purple-300">Qtd folhas:</span>
                      <input type="number" className="w-12 bg-white rounded-lg p-1 text-center outline-none border-none" value={m.qtdUsada} onChange={e => {
                        const nova = [...matsNoPed];
                        nova[i].qtdUsada = e.target.value;
                        setMatsNoPed(nova);
                      }} />
                      <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="number" placeholder="Valor Hora" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} />
              <input type="number" placeholder="Minutos" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} />
            </div>

            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Custos Extras</p>
              <div className="grid grid-cols-4 gap-2">
                {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                  <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                    <input type="number" className="w-full bg-transparent text-center text-xs outline-none" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                  <option value="PIX">PIX</option><option value="CARTÃO">CARTÃO</option><option value="DINHEIRO">DINHEIRO</option>
               </select>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Desconto R$" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl">R$ {precoFinal}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  if(!nomeProd) return alert("Dê um nome!");
                  await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, clienteId: clienteSel, pagamento, userId: user.uid, data: new Date().toLocaleDateString() });
                  alert("Salvo!"); setActiveTab('pedidos');
                }} className="bg-orange-500 text-white p-4 rounded-3xl font-black uppercase text-xs">Salvar</button>
                <button onClick={() => enviarZap({nomeProd, preco: precoFinal, clienteSel, pagamento})} className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg"><MessageCircle/></button>
              </div>
            </div>
          </div>
        )}

        {/* ABA ESTOQUE (COM UNITÁRIO) */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package/> Estoque</h2>
              <input placeholder="Ex: Papel Fotográfico" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-3 mb-6">
                <input type="number" placeholder="Preço do Pacote" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd Folhas" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid };
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                else await addDoc(collection(db, "materiais"), d);
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">SALVAR NO ESTOQUE</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border">
                <div>
                  <p className="font-bold text-slate-700">{m.nome}</p>
                  <p className="text-orange-500 font-black text-sm">R$ {(Number(m.valor)/Number(m.qtd)).toFixed(2)} <span className="text-[10px] text-slate-300 font-normal">/ folha</span></p>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd})} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                   <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200 p-2"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABAS CLIENTES E PEDIDOS (MANTIDAS) */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User/> Clientes</h2>
              <input placeholder="Nome do Cliente" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { ...novoCli, userId: user.uid });
                setNovoCli({ nome: '', zap: '' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border"><span className="font-bold">{c.nome}</span><button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200"><Trash2/></button></div>)}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2">
            <h2 className="text-purple-700 font-bold mb-4">Histórico</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               return (
                 <div key={p.id} className="bg-white p-6 rounded-[30px] shadow-sm flex justify-between items-center border border-slate-50">
                   <div><p className="font-black text-[10px] uppercase text-purple-700">{cli?.nome || 'Sem Nome'}</p><p className="font-bold text-xs">{p.nomeProd}</p></div>
                   <div className="flex items-center gap-3">
                      <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                      <button onClick={() => deleteDoc(doc(db, "pedidos", p.id))} className="text-red-100"><Trash2 size={18}/></button>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </main>

      {/* RODAPÉ COLORIDO */}
      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl transition-all ${activeTab === 'clientes' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><User size={22}/></button>
          <button onClick={() => setActiveTab('criar')} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-125' : 'bg-white text-slate-300'}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
