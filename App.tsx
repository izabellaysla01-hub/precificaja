import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Save, Calculator, Package, ShoppingCart, History, LogOut, X, Clock, DollarSign, Percent, Calendar, Send } from 'lucide-react';

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
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border">
      <h1 className="text-2xl font-bold text-purple-700 mb-6">PrecificaJá 🚀</h1>
      <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border mb-6 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mb-4">{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</button>
      <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium underline">{isRegistering ? 'Criar conta grátis' : 'Já tenho conta'}</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);

  // Estados do Produto (Baseados na sua foto)
  const [nomeProd, setNomeProd] = useState('');
  const [qtdPedido, setQtdPedido] = useState('1');
  const [matsNoPedido, setMatsNoPedido] = useState<any[]>([]);
  const [valorHora, setValorHora] = useState('7');
  const [tempoGasto, setTempoGasto] = useState('60');
  const [custos, setCustos] = useState({ embalagem: '2', energia: '0', taxas: '0', outros: '0' });
  const [lucro, setLucro] = useState('101');
  const [prazo, setPrazo] = useState('');

  // Estado do Estoque
  const [novoMat, setNovoMat] = useState({ nome: '', valor: '', qtd: '1' });

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  // CÁLCULO REAL (Igual à imagem)
  const resultado = useMemo(() => {
    const custoMateriais = matsNoPedido.reduce((acc, m) => acc + (m.valor / m.qtd), 0);
    const maoDeObra = (parseFloat(valorHora || '0') / 60) * parseFloat(tempoGasto || '0');
    const extras = parseFloat(custos.embalagem || '0') + parseFloat(custos.energia || '0') + parseFloat(custos.taxas || '0') + parseFloat(custos.outros || '0');
    
    const subtotalUnidade = custoMateriais + maoDeObra + extras;
    const totalPedido = subtotalUnidade * parseFloat(qtdPedido || '1');
    const precoFinal = totalPedido * (1 + (parseFloat(lucro || '0') / 100));
    
    return isNaN(precoFinal) ? "0.00" : precoFinal.toFixed(2);
  }, [matsNoPedido, valorHora, tempoGasto, custos, lucro, qtdPedido]);

  if (!user) return <Login handleAuth={async () => {
    try { await signInWithEmailAndPassword(auth, 'seuemail@teste.com', '123456'); } catch(e) {}
  }} />; // Para o teste, use o formulário de login real

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center gap-2 text-purple-700 font-bold"><Calculator size={20}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)}><LogOut size={20} className="text-slate-300" /></button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Novo Produto</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none" value={qtdPedido} onChange={e => setQtdPedido(e.target.value)} />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Materiais Utilizados</label>
              <div className="flex gap-2 mb-2">
                <select className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-sm border-none" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setMatsNoPedido([...matsNoPedido, m]);
                }} value="">
                  <option value="">Selecione um material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <button onClick={() => setActiveTab('materiais')} className="bg-orange-50 text-orange-500 p-3 rounded-xl"><Plus/></button>
              </div>
              {matsNoPedido.map((m, i) => (
                <div key={i} className="flex justify-between items-center bg-purple-50 p-2 rounded-lg mb-1 text-xs font-bold text-purple-700">
                  {m.nome} <button onClick={() => setMatsNoPedido(matsNoPedido.filter((_, idx) => idx !== i))}><X size={14}/></button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none" value={valorHora} onChange={e => setValorHora(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Clock size={10}/> Tempo (minutos)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none" value={tempoGasto} onChange={e => setTempoGasto(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                <div key={c}>
                  <label className="text-[8px] text-slate-400 block mb-1 uppercase text-center font-bold">{c}</label>
                  <input type="number" className="w-full p-2 bg-slate-50 rounded-lg text-center outline-none border-none text-xs" value={custos[c as keyof typeof custos]} onChange={e => setCustos({...custos, [c]: e.target.value})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Percent size={10}/> Lucro (%)</label>
                <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none" value={lucro} onChange={e => setLucro(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Calendar size={10}/> Prazo</label>
                <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none text-xs" value={prazo} onChange={e => setPrazo(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-orange-500 font-black text-4xl">R$ {resultado}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  await addDoc(collection(db, "produtos"), { nome: nomeProd, preco: resultado, userId: user.uid, data: new Date().toISOString() });
                  alert("Salvo!");
                  setActiveTab('salvos');
                }} className="bg-orange-500 text-white p-3 px-5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Save size={18}/> SALVAR</button>
                <button className="bg-emerald-500 text-white p-3 px-5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Send size={18}/> ORÇAMENTO</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-md">
              <h2 className="text-purple-700 font-bold mb-4">Adicionar ao Estoque</h2>
              <input placeholder="Nome do Material" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="flex gap-2 mb-6">
                <input type="number" placeholder="Preço" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-24 p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
              </div>
              <button onClick={async () => {
                if (!novoMat.nome || !novoMat.valor) return;
                await addDoc(collection(db, "materiais"), { ...novoMat, valor: parseFloat(novoMat.valor), qtd: parseFloat(novoMat.qtd), userId: user.uid });
                setNovoMat({ nome: '', valor: '', qtd: '1' });
                alert("Material Adicionado!");
              }} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black shadow-lg">CADASTRAR MATERIAL</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
                <div><p className="font-bold text-slate-700">{m.nome}</p><p className="text-xs text-slate-400">R$ {m.valor.toFixed(2)} por {m.qtd} un</p></div>
                <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-300"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around shadow-2xl z-50">
        <button onClick={() => setActiveTab('materiais')} className={activeTab === 'materiais' ? 'text-purple-600' : 'text-slate-300'}><Package/></button>
        <button onClick={() => setActiveTab('criar')} className="bg-orange-500 -mt-12 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white"><Plus size={30}/></button>
        <button onClick={() => setActiveTab('salvos')} className={activeTab === 'salvos' ? 'text-purple-600' : 'text-slate-300'}><History/></button>
      </nav>
    </div>
  );
}
