/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Save, Calculator, Package, ShoppingCart, 
  History, MessageCircle, Clock, DollarSign, Percent, 
  Calendar, ChevronRight, Edit2, X, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- IMPORTAÇÃO FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE (Sua Chave Oficial) ---
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
      alert("Erro na autenticação. Verifique seu e-mail e se a senha tem 6 dígitos.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">PrecificaJá</h1>
        <p className="text-slate-500 mb-6">{isRegistering ? 'Crie sua conta profissional' : 'Acesse seu painel'}</p>
        <input type="email" placeholder="Seu e-mail" className="w-full p-3 rounded-xl border border-slate-200 mb-3 outline-none focus:ring-2 focus:ring-primary" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Sua senha" className="w-full p-3 rounded-xl border border-slate-200 mb-6 outline-none focus:ring-2 focus:ring-primary" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAuth} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:brightness-110 mb-4 transition-all">
          {isRegistering ? 'CADASTRAR AGORA' : 'ENTRAR NO APP'}
        </button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-primary font-medium">
          {isRegistering ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar uma grátis'}
        </button>
      </motion.div>
    </div>
  );
};

// --- Types ---
interface Material {
  id: string;
  nome: string;
  valorPago: number;
  quantidadeComprada: number;
  unidadeMedida: string;
  valorUnitario: number;
  userId?: string;
}

interface MaterialUsado {
  materialId: string;
  quantidadeUsada: number;
}

interface Produto {
  id: string;
  nome: string;
  materiais: MaterialUsado[];
  maoDeObraHora: number;
  tempoGastoMinutos: number;
  custosExtras: {
    embalagem: number;
    energia: number;
    taxas: number;
    outros: number;
  };
  lucroPorcentagem: number;
  descontoValor: number;
  descontoTipo: 'fixo' | 'porcentagem';
  quantidadePedido: number;
  prazoEntrega: string;
  dataCriacao: string;
  userId?: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<Produto[]>([]);
  
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({
    nome: '', materiais: [], maoDeObraHora: 0, tempoGastoMinutos: 0,
    custosExtras: { embalagem: 0, energia: 0, taxas: 0, outros: 0 },
    lucroPorcentagem: 30, descontoValor: 0, descontoTipo: 'porcentagem',
    quantidadePedido: 1, prazoEntrega: ''
  });

  const [novoMaterial, setNovoMaterial] = useState<Partial<Material>>({
    nome: '', valorPago: 0, quantidadeComprada: 1, unidadeMedida: 'un'
  });

  // Monitorar Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Carregar Dados do Firebase (em vez do LocalStorage)
  useEffect(() => {
    if (user) {
      const qMat = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const qProd = query(collection(db, "produtos"), where("userId", "==", user.uid));

      const unsubMat = onSnapshot(qMat, (snapshot) => {
        setMateriais(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
      });

      const unsubProd = onSnapshot(qProd, (snapshot) => {
        setProdutosSalvos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Produto)));
      });

      return () => { unsubMat(); unsubProd(); };
    }
  }, [user]);

  // --- Funções de Materiais ---
  const adicionarMaterial = async () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago || !novoMaterial.quantidadeComprada) return;
    
    const valorUnitario = (novoMaterial.valorPago || 0) / (novoMaterial.quantidadeComprada || 1);
    
    await addDoc(collection(db, "materiais"), {
      nome: novoMaterial.nome,
      valorPago: novoMaterial.valorPago,
      quantidadeComprada: novoMaterial.quantidadeComprada,
      unidadeMedida: novoMaterial.unidadeMedida,
      valorUnitario: valorUnitario,
      userId: user.uid
    });

    setNovoMaterial({ nome: '', valorPago: 0, quantidadeComprada: 1, unidadeMedida: 'un' });
  };

  const removerMaterial = async (id: string) => {
    await deleteDoc(doc(db, "materiais", id));
  };

  // --- Funções de Produto ---
  const adicionarMaterialAoProduto = (materialId: string) => {
    if (!materialId) return;
    const jaExiste = novoProduto.materiais?.find(m => m.materialId === materialId);
    if (jaExiste) return;

    setNovoProduto({
      ...novoProduto,
      materiais: [...(novoProduto.materiais || []), { materialId, quantidadeUsada: 1 }]
    });
  };

  const atualizarQtdMaterialProduto = (materialId: string, qtd: number) => {
    setNovoProduto({
      ...novoProduto,
      materiais: novoProduto.materiais?.map(m => 
        m.materialId === materialId ? { ...m, quantidadeUsada: qtd } : m
      )
    });
  };

  const removerMaterialDoProduto = (materialId: string) => {
    setNovoProduto({
      ...novoProduto,
      materiais: novoProduto.materiais?.filter(m => m.materialId !== materialId)
    });
  };

  // --- Cálculos ---
  const calculos = useMemo(() => {
    const custoMateriais = (novoProduto.materiais || []).reduce((acc, item) => {
      const material = materiais.find(m => m.id === item.materialId);
      return acc + (material ? material.valorUnitario * item.quantidadeUsada : 0);
    }, 0);

    const custoMaoDeObra = ((novoProduto.maoDeObraHora || 0) / 60) * (novoProduto.tempoGastoMinutos || 0);
    const extras = novoProduto.custosExtras || { embalagem: 0, energia: 0, taxas: 0, outros: 0 };
    const custoExtrasTotal = Object.values(extras).reduce((a, b) => a + b, 0);

    const custoUnitarioBase = custoMateriais + custoMaoDeObra + custoExtrasTotal;
    const custoTotalPedido = custoUnitarioBase * (novoProduto.quantidadePedido || 1);
    const valorLucro = custoTotalPedido * ((novoProduto.lucroPorcentagem || 0) / 100);
    const subtotal = custoTotalPedido + valorLucro;

    let desconto = 0;
    if (novoProduto.descontoTipo === 'fixo') {
      desconto = novoProduto.descontoValor || 0;
    } else {
      desconto = subtotal * ((novoProduto.descontoValor || 0) / 100);
    }

    const precoFinalTotal = Math.max(0, subtotal - desconto);
    const precoFinalUnitario = precoFinalTotal / (novoProduto.quantidadePedido || 1);

    return { custoMateriais, custoMaoDeObra, custoExtrasTotal, custoUnitarioBase, custoTotalPedido, valorLucro, desconto, precoFinalTotal, precoFinalUnitario };
  }, [novoProduto, materiais]);

  const salvarProduto = async () => {
    if (!novoProduto.nome) return alert('Dê um nome ao produto!');

    const dadosParaSalvar = {
      ...novoProduto,
      userId: user.uid,
      dataCriacao: novoProduto.dataCriacao || new Date().toISOString()
    };

    if (novoProduto.id) {
      await updateDoc(doc(db, "produtos", novoProduto.id), dadosParaSalvar);
    } else {
      await addDoc(collection(db, "produtos"), dadosParaSalvar);
    }

    alert('Produto salvo na nuvem!');
    setActiveTab('salvos');
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-slate-50">
      <header className="bg-primary text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg"><Calculator className="w-6 h-6" /></div>
            <h1 className="text-2xl font-bold tracking-tight">PrecificaJá</h1>
          </div>
          <div className="flex gap-2 items-center">
            <div className="hidden md:flex gap-2 mr-4">
              <button onClick={() => setActiveTab('materiais')} className={`tab-btn ${activeTab === 'materiais' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}>Materiais</button>
              <button onClick={() => setActiveTab('criar')} className={`tab-btn ${activeTab === 'criar' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}>Criar Produto</button>
              <button onClick={() => setActiveTab('salvos')} className={`tab-btn ${activeTab === 'salvos' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}>Produtos Salvos</button>
            </div>
            <button onClick={() => signOut(auth)} className="bg-white/10 p-2 rounded-lg hover:bg-red
