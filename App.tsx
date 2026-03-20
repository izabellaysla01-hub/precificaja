import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { Package, Plus, Trash2, LogOut, Calculator, History } from 'lucide-react';

// --- CONFIGURAÇÃO DO SEU FIREBASE ---
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
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Erro na autenticação: Verifique e-mail e senha.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md text-center">
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta' : 'Acesse seu painel'}</p>
        
        <input 
          type="email" placeholder="Seu e-mail" className="input-field mb-3"
          value={email} onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Sua senha" className="input-field mb-6"
          value={password} onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button onClick={handleAuth} className="btn-accent w-full mb-4">
          {isRegistering ? 'Cadastrar Agora' : 'Entrar no App'}
        </button>
        
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-primary font-medium">
          {isRegistering ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar uma grátis'}
        </button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('materiais');
  const [materiais, setMateriais] = useState<any[]>([]);
  const [nomeMat, setNomeMat] = useState('');
  const [valorMat, setValorMat] = useState('');
  const [qtdMat, setQtdMat] = useState('1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "materiais"), where("userId", "==", user.uid));
      return onSnapshot(q, (snapshot) => {
        setMateriais(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [user]);

  const addMaterial = async () => {
    if (!nomeMat || !valorMat) return;
    await addDoc(collection(db, "materiais"), {
      nome: nomeMat,
      valor: parseFloat(valorMat),
      qtd: parseFloat(qtdMat),
      userId: user.uid
    });
    setNomeMat(''); setValorMat('');
  };

  const deleteMaterial = async (id: string) => {
    await deleteDoc(doc(db, "materiais", id));
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-primary p-6 text-white flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calculator size={24} /> PrecificaJá
        </h1>
        <button onClick={() => signOut(auth)} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-all">
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {tab === 'materiais' && (
          <div className="space-y-6">
            <div className="glass-card">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Plus className="text-primary" size={20} /> Novo Material
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <input placeholder="Nome (Ex: Papel A4)" className="input-field" value={nomeMat} onChange={e => setNomeMat(e.target.value)} />
                <div className="flex gap-2">
                  <input type="number" placeholder="Valor (R$)" className="input-field" value={valorMat} onChange={e => setValorMat(e.target.value)} />
                  <input type="number" placeholder="Qtd" className="input-field" value={qtdMat} onChange={e => setQtdMat(e.target.value)} />
                </div>
                <button onClick={addMaterial} className="btn-accent">Salvar na Nuvem</button>
              </div>
            </div>

            <div className="glass-card">
              <h2 className="font-bold text-slate-800 mb-4">Meus Materiais</h2>
              {materiais.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700">{m.nome}</p>
                    <p className="text-xs text-slate-400">R$ {(m.valor / m.qtd).toFixed(2)} / unidade</p>
                  </div>
                  <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-100 p-3 flex justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setTab('materiais')} className={`tab-btn ${tab === 'materiais' ? 'text-primary' : 'text-slate-400'}`}>
          <Package size={24} className="mx-auto" />
          <span className="text-[10px]">MATERIAIS</span>
        </button>
        <button onClick={() => setTab('criar')} className="bg-primary -mt-8 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
          <Plus size={28} />
        </button>
        <button onClick={() => setTab('salvos')} className={`tab-btn ${tab === 'salvos' ? 'text-primary' : 'text-slate-400'}`}>
          <History size={24} className="mx-auto" />
          <span className="text-[10px]">SALVOS</span>
        </button>
      </nav>
    </div>
  );
}
