import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent, Calendar, Tag } from 'lucide-react';

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
const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center border border-slate-100">
      <h1 className="text-2xl font-bold text-purple-700 mb-6 font-sans text-center">PrecificaJá 🚀</h1>
      <input type="email" placeholder="Seu e-mail" className="w-full p-4 bg-slate-50 rounded-2xl border-none mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Sua senha" className="w-full p-4 bg-slate-50 rounded-2xl border-none mb-6 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all uppercase">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-sm text-purple-600 underline block w-full text-center font-medium">{isRegistering ? 'Já tenho conta' : 'Criar conta grátis'}</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados do Produto (O que você pediu!)
  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matsNoPedido, setMatsNoPedido] = useState<any[]>([]);
  const [valorHora, setValorHora] = useState('');
  const [tempoGasto, setTempoGasto] = useState('');
  const [custos, setCustos] = useState({ embalagem: '', energia: '', taxas: '', outros: '' });
  const [lucro, setLucro] = useState('100');
  const [prazo, setPrazo] = useState('');
  const [desconto, setDesconto] = useState('');

  // Estado do Estoque
  const [novoMat, setNovoMat] = useState({ nome: '', valor: '', qtd: '1' });

  useEffect(() => { onAuthStateChanged(auth, u => setUser(u)); }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("Erro! Verifique os dados."); }
  };

  // CÁLCULO FINAL (Soma tudo e subtrai desconto)
  const precoFinal = useMemo(() => {
    const custoMateriais = matsNoPedido.reduce((acc, m) => acc + (Number(m.valor || 0) / Number(m.qtd || 1)), 0);
    const maoObra = (Number(valorHora || 0) / 60) * Number(tempoGasto || 0);
    const extras = Number(custos.embalagem || 0) + Number(custos.energia || 0) + Number(custos.taxas || 0) + Number(custos.outros || 0);
    
    const subtotal = (custoMateriais + maoObra + extras) * Number(qtdPedido || 1);
    const comLucro = subtotal * (1 + (Number(lucro || 0) / 100));
    const totalComDesconto = comLucro - Number(desconto || 0);
    
    return isNaN(totalComDesconto) ? "0.00" : totalComDesconto.toFixed(2);
  }, [matsNoPedido, valorHora, tempoGasto, custos, lucro, qtdPedido, desconto]);

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <main className="p-4 max-w-xl mx-auto">
        
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border border-slate-50 mt-2">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={20}/> Novo Produto</h2>
            
            {/* Nome e Qtd */}
            <div className="flex gap-3 mb-6">
              <input className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nome do Produto" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              <div className="w-20"><label className="text-[9px] font-bold text-slate-300 block text-center uppercase">Qtd</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} /></div>
            </div>

            {/* Seleção de Materiais */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Materiais Utilizados</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-400 mb-3 appearance-none" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPedido([...matsNoPedido, m]);
              }} value="">
                <option value="">Selecione um material...</option>
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

            {/* Hora e Tempo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">Valor da Hora (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="0" value={valorHora} onChange={e => setValorHora(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">Tempo (minutos)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="0" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} /></div>
            </div>

            {/* Custos Extras */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block text-center">Custos Extras (Opcional)</label>
              <div className="grid grid-cols-4 gap-2">
                {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                  <input key={c} type="number" placeholder={c} className="p-3 bg-slate-50 rounded-xl text-center text-[9px] outline-none placeholder:uppercase" value={custos[c as keyof typeof custos]} onChange={e => setCustos({...custos, [c]: e.target.value})} />
                ))}
              </div>
            </div>

            {/* Lucro e Prazo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">Margem de Lucro (%)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">Prazo de Entrega</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            </div>

            {/* Desconto */}
            <div className="mb-8">
               <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valor do Desconto (R$)</label>
               <div className="flex items-center bg-slate-50 rounded-2xl p-4">
                 <Tag size={18} className="text-slate-300 mr-2"/>
                 <input type="number" className="bg-transparent outline-none w-full" placeholder="Ex: 5.00" value={desconto} onChange={e => setDesconto(e.target.value)} />
               </div>
            </div>

            {/* Preço Final e Botão */}
            <div className="flex items-center justify-between mt-10">
              <div className="text-orange-500 font-black text-5xl tracking-tighter">R$ {precoFinal}</div>
              <button onClick={async () => {
                if (!nomeProd) return alert("Dê um nome!");
                await addDoc(collection(db, "produtos"), { nome: nomeProd, preco: precoFinal, userId: user.uid, data: new Date().toLocaleDateString() });
                alert("Salvo!");
                setActiveTab('salvos');
              }} className="bg-orange-500 text-white px-8 py-5 rounded-3xl font-black shadow-lg shadow-orange-200 uppercase text-xs tracking-widest">Salvar</button>
            </div>
          </div>
        )}

        {/* ABA ESTOQUE */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-4">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2 font-sans"><Package/> Cadastrar no Estoque</h2>
              <input placeholder="Nome do Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-3 mb-6">
                <input type="number" placeholder="Preço Pago" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                if (!novoMat.nome || !novoMat.valor) return;
                await addDoc(collection(db, "materiais"), { ...novoMat, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), userId: user.uid });
                setNovoMat({ nome: '', valor: '', qtd: '1' });
                alert("Material cadastrado!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">ADICIONAR MATERIAL</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
                <div className="font-bold text-slate-700">{m.nome}</div>
                <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-200"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'salvos' && (
          <div className="space-y-3 pt-4">
            <h2 className="text-purple-700 font-bold mb-4">Produtos Precificados</h2>
            {produtosSalvos.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[30px] shadow-sm flex justify-between items-center border border-slate-50">
                <div><p className="font-bold">{p.nome}</p><p className="text-[10px] text-slate-300">{p.data}</p></div>
                <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER NAV */}
      <div className="fixed bottom-8 w-full flex justify-around px-8 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-5 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-purple-100 text-purple-700' : 'text-slate-300'}`}><Package size={28}/></button>
          <button onClick={() => setActiveTab('criar')} className={`bg-orange-500 p-6 rounded-[25px] text-white shadow-xl shadow-orange-200 border-4 border-white transition-transform active:scale-90 ${activeTab === 'criar' ? 'scale-110' : ''}`}><Plus size={32}/></button>
          <button onClick={() => setActiveTab('salvos')} className={`p-5 rounded-2xl transition-all ${activeTab === 'salvos' ? 'bg-purple-100 text-purple-700' : 'text-slate-300'}`}><History size={28}/></button>
      </div>
    </div>
  );
}
