import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Save, Calculator, Package, ShoppingCart, 
  History, MessageCircle, Clock, DollarSign, Percent, 
  Calendar, ChevronRight, Edit2, X, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

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

// --- TELA DE LOGIN ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Erro no acesso! Verifique e-mail e se a senha tem 6 dígitos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
        <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="text-purple-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">PrecificaJá</h1>
        <input type="email" placeholder="E-mail" className="w-full p-3 rounded-xl border mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-3 rounded-xl border mb-6 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:brightness-110 mb-4 transition-all">
          {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
        </button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-purple-600 font-medium">
          {isRegistering ? 'Voltar para Login' : 'Não tem conta? Criar grátis'}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<any[]>([]);
  
  // ESTADOS DO PRODUTO
  const [novoProduto, setNovoProduto] = useState<any>({
    nome: '', materiais: [], maoDeObraHora: 0, tempoGastoMinutos: 0,
    custosExtras: { embalagem: 0, energia: 0, taxas: 0, outros: 0 },
    lucroPorcentagem: 30, quantidadePedido: 1, prazoEntrega: ''
  });

  // ESTADO DO MATERIAL
  const [novoMaterial, setNovoMaterial] = useState({ nome: '', valorPago: '', quantidadeComprada: '1' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));
      onSnapshot(qMat, s => setMateriais(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(qProd, s => setProdutosSalvos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  // --- FUNÇÕES DE ESTOQUE ---
  const adicionarMaterialAoEstoque = async () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago) return alert("Preencha Nome e Preço!");
    await addDoc(collection(db, "materiais"), {
      nome: novoMaterial.nome,
      valorPago: parseFloat(String(novoMaterial.valorPago)),
      quantidadeComprada: parseFloat(novoMaterial.quantidadeComprada) || 1,
      userId: user.uid
    });
    setNovoMaterial({ nome: '', valorPago: '', quantidadeComprada: '1' });
    alert("Material salvo!");
  };

  // --- FUNÇÕES DO PRODUTO ---
  const selecionarMaterial = (id: string) => {
    const mat = materiais.find(m => m.id === id);
    if (!mat) return;
    const jaTem = novoProduto.materiais.find((m: any) => m.materialId === id);
    if (jaTem) return;
    setNovoProduto({
      ...novoProduto,
      materiais: [...novoProduto.materiais, { materialId: id, nome: mat.nome, valorUnitario: mat.valorPago / mat.quantidadeComprada, quantidadeUsada: 1 }]
    });
  };

  const calculos = useMemo(() => {
    const custoMats = novoProduto.materiais.reduce((acc: number, m: any) => acc + (m.valorUnitario * m.quantidadeUsada), 0);
    const maoObra = (parseFloat(novoProduto.maoDeObraHora) / 60) * parseFloat(novoProduto.tempoGastoMinutos);
    const extras = Object.values(novoProduto.custosExtras).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) as number;
    
    const custoBaseUnidade = custoMats + maoObra + extras;
    const custoTotalPedido = custoBaseUnidade * parseFloat(novoProduto.quantidadePedido);
    const precoFinal = custoTotalPedido * (1 + (parseFloat(novoProduto.lucroPorcentagem) / 100));

    return {
      custoUnitario: custoBaseUnidade || 0,
      total: precoFinal || 0
    };
  }, [novoProduto]);

  const salvarProduto = async () => {
    if (!novoProduto.nome) return alert("Dê um nome ao produto!");
    await addDoc(collection(db, "produtos"), { ...novoProduto, precoFinal: calculos.total, userId: user.uid, data: new Date().toISOString() });
    alert("Produto salvo!");
    setActiveTab('salvos');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER ROXO */}
      <header className="bg-purple-700 text-white p-6 shadow-lg flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator /> PrecificaJá</h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('materiais')} className={`p-2 rounded-lg ${activeTab === 'materiais' ? 'bg-white text-purple-700' : ''}`}>Estoque</button>
          <button onClick={() => setActiveTab('criar')} className={`p-2 rounded-lg ${activeTab === 'criar' ? 'bg-white text-purple-700' : ''}`}>Calculadora</button>
          <button onClick={() => signOut(auth)}><LogOut /></button>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {/* ABA: MATERIAIS */}
        {activeTab === 'materiais' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <h2 className="text-purple-700 font-bold mb-4">Cadastrar no Estoque</h2>
              <input placeholder="Nome do Material" className="w-full p-3 bg-slate-50 rounded-xl mb-3 outline-none" value={novoMaterial.nome} onChange={e => setNovoMaterial({...novoMaterial, nome: e.target.value})} />
              <div className="flex gap-3 mb-4">
                <input type="number" placeholder="Preço Pago (R$)" className="flex-1 p-3 bg-slate-50 rounded-xl outline-none" value={novoMaterial.valorPago} onChange={e => setNovoMaterial({...novoMaterial, valorPago: e.target.value})} />
                <input type="number" placeholder="Qtd" className="w-20 p-3 bg-slate-50 rounded-xl outline-none" value={novoMaterial.quantidadeComprada} onChange={e => setNovoMaterial({...novoMaterial, quantidadeComprada: e.target.value})} />
              </div>
              <button onClick={adicionarMaterialAoEstoque} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-wider">Adicionar Material</button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <h3 className="font-bold mb-4">Materiais Cadastrados</h3>
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                  <div>
                    <p className="font-bold">{m.nome}</p>
                    <p className="text-xs text-slate-400">R$ {m.valorPago.toFixed(2)} por {m.quantidadeComprada} un.</p>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, "materiais", m.id))} className="text-red-300"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border">
              <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2"><ShoppingCart size={20}/> Novo Produto</h2>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Produto</label>
                  <input className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd</label>
                  <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none" value={novoProduto.quantidadePedido} onChange={e => setNovoProduto({...novoProduto, quantidadePedido: e.target.value})} />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Materiais Utilizados</label>
                <select className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm border-none mb-3" onChange={e => selecionarMaterial(e.target.value)} value="">
                  <option value="">Selecione um material do estoque...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <div className="space-y-2">
                  {novoProduto.materiais.map((m: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                      <div className="text-xs font-bold text-purple-700">{m.nome} <span className="text-purple-300 font-normal">R$ {m.valorUnitario.toFixed(2)} un.</span></div>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-12 p-1 bg-white rounded text-center text-xs" value={m.quantidadeUsada} onChange={e => {
                          const novaLista = [...novoProduto.materiais];
                          novaLista[idx].quantidadeUsada = parseFloat(e.target.value) || 0;
                          setNovoProduto({...novoProduto, materiais: novaLista});
                        }} />
                        <button onClick={() => {
                          const novaLista = novoProduto.materiais.filter((_: any, i: number) => i !== idx);
                          setNovoProduto({...novoProduto, materiais: novaLista});
                        }} className="text-purple-300"><X size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 rounded-xl" value={novoProduto.maoDeObraHora} onChange={e => setNovoProduto({...novoProduto, maoDeObraHora: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1"><Clock size={10}/> Tempo (minutos)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 rounded-xl" value={novoProduto.tempoGastoMinutos} onChange={e => setNovoProduto({...novoProduto, tempoGastoMinutos: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {['embalagem', 'energia', 'taxas', 'outros'].map(c => (
                  <div key={c}>
                    <label className="text-[8px] text-slate-400 block mb-1 uppercase text-center font-bold">{c}</label>
                    <input type="number" className="w-full p-2 bg-slate-50 rounded-lg text-center text-xs" value={novoProduto.custosExtras[c]} onChange={e => setNovoProduto({...novoProduto, custosExtras: {...novoProduto.custosExtras, [c]: e.target.value}})} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase">Lucro (%)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 rounded-xl" value={novoProduto.lucroPorcentagem} onChange={e => setNovoProduto({...novoProduto, lucroPorcentagem: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase">Prazo</label>
                  <input type="date" className="w-full p-3 bg-slate-50 rounded-xl" value={novoProduto.prazoEntrega} onChange={e => setNovoProduto({...novoProduto, prazoEntrega: e.target.value})}/>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-orange-500 font-black text-4xl">R$ {calculos.total.toFixed(2)}</div>
                <div className="flex gap-2">
                  <button onClick={salvarProduto} className="bg-orange-500 text-white p-3 px-6 rounded-2xl font-bold flex gap-2 items-center shadow-lg"><Save size={18}/> SALVAR</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: PRODUTOS SALVOS */}
        {activeTab === 'salvos' && (
          <div className="space-y-4">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico</h2>
            {produtosSalvos.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
                <div>
                  <p className="font-bold">{p.nome}</p>
                  <p className="text-[10px] text-slate-400">{new Date(p.data).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-500 font-black text-lg">R$ {parseFloat(p.precoFinal).toFixed(2)}</p>
                  <button onClick={() => deleteDoc(doc(db, "produtos", p.id))} className="text-red-200"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NAV BAR MOBILE */}
      <nav className="fixed bottom-0 w-full bg-white border-t p-4 flex justify-around shadow-2xl z-50">
        <button onClick={() => setActiveTab('materiais')} className={activeTab === 'materiais' ? 'text-purple-600' : 'text-slate-300'}><Package size={28}/></button>
        <button onClick={() => setActiveTab('criar')} className="bg-orange-500 -mt-12 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white"><Plus size={32}/></button>
        <button onClick={() => setActiveTab('salvos')} className={activeTab === 'salvos' ? 'text-purple-600' : 'text-slate-300'}><History size={28}/></button>
      </nav>
    </div>
  );
}
