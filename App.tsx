import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent, Calendar, Tag, User, CreditCard, Send, MessageCircle } from 'lucide-react';

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
  const [materiais, setMateriais] = useState<any[]>([]);
  const [pedidosSalvos, setPedidosSalvos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Estados Calculadora
  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matsNoPedido, setMatsNoPedido] = useState<any[]>([]);
  const [valorHora, setValorHora] = useState('9');
  const [tempoGasto, setTempoGasto] = useState('60');
  const [custos, setCustos] = useState({ embalagem: '0', energia: '0', taxas: '0', outros: '0' });
  const [lucro, setLucro] = useState('100');
  const [desconto, setDesconto] = useState('0');
  const [clienteSel, setClienteSel] = useState('');
  const [pagamento, setPagamento] = useState('PIX');

  // Estados Cadastros
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ nome: '', valor: '', qtd: '1' });
  const [novoCliente, setNovoCliente] = useState({ nome: '', zap: '' });

  useEffect(() => { onAuthStateChanged(auth, u => setUser(u)); }, []);
  useEffect(() => {
    if (user) {
      onSnapshot(query(collection(db, "materiais"), where("userId", "==", user.uid)), s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "pedidos"), where("userId", "==", user.uid)), s => setPedidosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "clientes"), where("userId", "==", user.uid)), s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const precoFinal = useMemo(() => {
    const custoMats = matsNoPedido.reduce((acc, m) => acc + (Number(m.valor || 0) / Number(m.qtd || 1)), 0);
    const maoObra = (Number(valorHora || 0) / 60) * Number(tempoGasto || 0);
    const extras = Number(custos.embalagem || 0) + Number(custos.energia || 0) + Number(custos.taxas || 0) + Number(custos.outros || 0);
    const subtotal = (custoMats + maoObra + extras) * Number(qtdPedido || 1);
    const total = subtotal * (1 + (Number(lucro || 0) / 100)) - Number(desconto || 0);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  }, [matsNoPedido, valorHora, tempoGasto, custos, lucro, qtdPedido, desconto]);

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro de login!"); }
  };

  const enviarWhatsApp = () => {
    const cliente = clientes.find(c => c.id === clienteSel);
    const texto = `*ORÇAMENTO - PrecificaJá*%0A---%0A*Produto:* ${nomeProd}%0A*Quantidade:* ${qtdPedido} un%0A*Valor Total:* R$ ${precoFinal}%0A*Pagamento:* ${pagamento}%0A*Data:* ${new Date().toLocaleDateString()}%0A---%0AObrigado pela preferência!`;
    const fone = cliente?.zap ? cliente.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${texto}`, '_blank');
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        
        {/* ABA: CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border border-slate-50 mt-2">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-purple-700 font-bold flex items-center gap-2"><ShoppingCart size={20}/> Novo Pedido</h2>
               <button onClick={() => signOut(auth)}><LogOut size={18} className="text-slate-300"/></button>
            </div>
            
            <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <select className="p-4 bg-slate-50 rounded-2xl outline-none text-slate-400" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">Selecionar Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
               <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Qtd" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} />
            </div>

            <div className="mb-6">
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPedido([...matsNoPedido, m]);
              }} value="">
                <option value="">+ Materiais Utilizados</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <div className="space-y-2">
                {matsNoPedido.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <span className="text-sm font-bold text-purple-700">{m.nome}</span>
                    <button onClick={() => setMatsNoPedido(matsNoPedido.filter((_, idx) => idx !== i))}><X size={18} className="text-purple-300"/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Valor Hora" value={valorHora} onChange={e => setValorHora(e.target.value)} />
              <input type="number" className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Minutos" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
               <select className="col-span-1 p-3 bg-slate-50 rounded-xl outline-none text-[10px] font-bold" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="CARTÃO">CARTÃO</option>
                  <option value="DINHEIRO">DINHEIRO</option>
               </select>
               <input className="p-3 bg-slate-50 rounded-xl outline-none text-[10px] text-center" placeholder="Desconto R$" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
               <input className="p-3 bg-slate-50 rounded-xl outline-none text-[10px] text-center" placeholder="Lucro %" type="number" value={lucro} onChange={e => setLucro(e.target.value)} />
            </div>

            <div className="flex items-center justify-between mt-10">
              <div className="text-orange-500 font-black text-4xl">R$ {precoFinal}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                   await addDoc(collection(db, "pedidos"), { nomeProd, preco: precoFinal, clienteSel, pagamento, data: new Date().toLocaleDateString(), userId: user.uid });
                   alert("Pedido Salvo!");
                   setActiveTab('pedidos');
                }} className="bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg"><Save size={20}/></button>
                <button onClick={enviarWhatsApp} className="bg-emerald-500 text-white p-4 rounded-2xl font-bold shadow-lg"><MessageCircle size={20}/></button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: MATERIAIS */}
        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><Package/> Novo Material</h2>
              <input placeholder="Nome do Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-3 mb-6">
                <input type="number" placeholder="Preço" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                await addDoc(collection(db, "materiais"), { ...novoMat, userId: user.uid });
                setNovoMat({ nome: '', valor: '', qtd: '1' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-bold">CADASTRAR</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm">
                <span className="font-bold">{m.nome}</span>
                <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200"><Trash2/></button>
              </div>
            ))}
          </div>
        )}

        {/* ABA: CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-[40px] shadow-md">
              <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><User/> Novo Cliente</h2>
              <input placeholder="Nome do Cliente" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} />
              <input placeholder="WhatsApp (Ex: 11999999999)" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCliente.zap} onChange={e => setNovoCliente({...novoCliente, zap: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { ...novoCliente, userId: user.uid });
                setNovoCliente({ nome: '', zap: '' });
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-bold">SALVAR CLIENTE</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm">
                <span className="font-bold">{c.nome}</span>
                <button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200"><Trash2/></button>
              </div>
            ))}
          </div>
        )}

        {/* ABA: PEDIDOS SALVOS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-4">
            <h2 className="text-purple-700 font-bold mb-4">Histórico de Pedidos</h2>
            {pedidosSalvos.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-700 uppercase text-xs">{p.nomeProd}</p>
                    <p className="text-[10px] text-slate-300 font-bold">{p.data} - {p.pagamento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-500 font-black text-lg">R$ {p.preco}</p>
                    <button onClick={() => deleteDoc(doc(db, "pedidos", p.id))} className="text-red-100"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER NAV COM 4 BOTÕES */}
      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl ${activeTab === 'materiais' ? 'bg-purple-100 text-purple-700' : 'text-slate-300'}`}><Package size={24}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl ${activeTab === 'clientes' ? 'bg-purple-100 text-purple-700' : 'text-slate-300'}`}><User size={24}/></button>
          <button onClick={() => setActiveTab('criar')} className={`bg-orange-500 p-5 rounded-[22px] text-white shadow-xl border-4 border-white ${activeTab === 'criar' ? 'scale-110' : ''}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl ${activeTab === 'pedidos' ? 'bg-purple-100 text-purple-700' : 'text-slate-300'}`}><History size={24}/></button>
      </div>
    </div>
  );
}
