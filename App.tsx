import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon } from 'lucide-react';

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
const storage = getStorage(app);

// --- TELA DE LOGIN ---
const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => {
  const recuperarSenha = async () => {
    if (!email) return alert("Digite seu e-mail primeiro para eu te mandar o link!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enviamos um link para o seu e-mail!");
    } catch (e) { alert("E-mail não encontrado ou inválido."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center border border-slate-100">
        <h1 className="text-3xl font-black text-purple-700 mb-2 font-sans">PrecificaJá 🚀</h1>
        <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-widest">Sua empresa lucrando mais</p>
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo'>('inicio');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  // Estado Edição / Seleção do Catálogo
  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

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
  const [precoManual, setPrecoManual] = useState<string | null>(null);

  // Estados Formulários
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
  const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '' });
  
  // Estado Produto do Catálogo + Imagem
  const [novoProdCatalogo, setNovoProdCatalogo] = useState({ id: '', nome: '', precoVenda: '', urlImagem: '' });
  const [subindoImagem, setSubindoImagem] = useState(false);

  useEffect(() => { 
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    }); 
  }, []);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // SEGURANÇA: Dados isolados por usuário
  useEffect(() => {
    if (user) {
      const qMateriais = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const unsubMateriais = onSnapshot(qMateriais, s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      const unsubPedidos = onSnapshot(qPedidos, s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
      const unsubClientes = onSnapshot(qClientes, s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qProdutos = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubProdutos = onSnapshot(qProdutos, s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      return () => {
        unsubMateriais();
        unsubPedidos();
        unsubClientes();
        unsubProdutos();
      };
    } else {
      setMaterials([]);
      setPedidos([]);
      setClientes([]);
      setProdutos([]);
    }
  }, [user]);

  const limparCalculadora = () => {
    setNomeProd('');
    setQtdPed('1');
    setMatsNoPed([]);
    setVHora('9');
    setTGasto('60');
    setCustos({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setLucro('100');
    setDesconto('0');
    setPrazo('');
    setClienteSel('');
    setPedidoEditandoId(null);
    setPrecoManual(null);
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSubindoImagem(true);
    try {
      const nomeArquivo = `${user.uid}_${Date.now()}_${file.name}`;
      const imagemRef = ref(storage, `produtos/${nomeArquivo}`);
      
      await uploadBytes(imagemRef, file);
      const urlDisponivel = await getDownloadURL(imagemRef);
      
      setNovoProdCatalogo(prev => ({ ...prev, urlImagem: urlDisponivel }));
      alert("Foto carregada com sucesso! 📸");
    } catch (error) {
      console.error(error);
      alert("Erro ao subir a foto!");
    } finally {
      setSubindoImagem(false);
    }
  };

  const carregarPedidoParaEdicao = (p: any) => {
    setPedidoEditandoId(p.id);
    setNomeProd(p.nomeProd || '');
    setQtdPed(p.qtdPed || '1');
    setVHora(p.vHora || '9');
    setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setLucro(p.lucro || '100');
    setDesconto(p.desconto || '0');
    setPrazo(p.prazo || '');
    setClienteSel(p.clienteId || '');
    setPrecoManual(p.precoManual || null);

    if (p.materiaisUsados && p.materiaisUsados.length > 0) {
      const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return {
          id: mSalvo.id,
          nome: matDoArmario ? matDoArmario.nome : mSalvo.nome,
          qtdUsada: Number(mSalvo.qtdUsada || 1),
          valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0),
          qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1),
          unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un')
        };
      });
      setMatsNoPed(listaReconstruida);
    } else {
      setMatsNoPed([]);
    }
    setActiveTab('criar');
  };

  const venderItemDiretoDoCatalogo = (prod: any) => {
    limparCalculadora();
    setNomeProd(prod.nome);
    setPrecoManual(prod.precoVenda);
    setActiveTab('criar');
  };

  const dashboardMetrics = useMemo(() => {
    const faturamentoTotal = pedidos.filter(p => p.status === 'Vendido 💰').reduce((acc, p) => acc + Number(p.preco || 0), 0);
    const pendentesCount = pedidos.filter(p => p.status !== 'Vendido 💰').length;
    const estoqueCriticoCount = materiais.filter(m => Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0)).length;
    return { faturamento: faturamentoTotal.toFixed(2), pendentes: pendentesCount, criticos: estoqueCriticoCount, totalClientes: clientes.length };
  }, [pedidos, materiais, clientes]);

  const resumenFinanceiro = useMemo(() => {
    if (precoManual !== null) {
      const totalCatalogo = Number(precoManual) * Number(qtdPed || 1);
      const semDesconto = totalCatalogo - Number(desconto || 0);
      return { materiais: "0.00", maoObra: "0.00", extras: "0.00", custoPeca: "0.00", lucroLivre: "0.00", final: isNaN(semDesconto) ? "0.00" : semDesconto.toFixed(2) };
    }

    const totalMateriais = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    const totalMaoObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    const custoTotalPeca = totalMateriais + totalMaoObra + totalExtras;
    const subtotalGeral = custoTotalPeca * Number(qtdPed || 1);
    const valorLucroLivre = subtotalGeral * (Number(lucro || 0) / 100);
    const precoFinalCalculado = (subtotalGeral + valorLucroLivre) - Number(desconto || 0);

    return { materiais: totalMateriais.toFixed(2), maoObra: totalMaoObra.toFixed(2), extras: totalExtras.toFixed(2), custoPeca: custoTotalPeca.toFixed(2), lucroLivre: valorLucroLivre.toFixed(2), final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const gerarPDF = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combiner';
    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #334155;">
        <h1 style="color: #6b21a8; margin-bottom: 5px; font-size: 28px;">PrecificaJá 🚀</h1>
        <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-bottom: 30px; font-weight: bold;">Orçamento Comercial</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
          <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${cli?.nome || 'Cliente'}</p>
          <p style="margin: 0;"><strong>WhatsApp:</strong> ${cli?.zap || 'Não informado'}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Descrição do Produto</th>
              <th style="padding: 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: center;">Qtd</th>
              <th style="padding: 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 15px 0; font-weight: bold; color: #1e293b;">${p.nomeProd || 'Produto Personalizado'}</td>
              <td style="padding: 15px 0; text-align: center;">${p.qtdPed || 1} un</td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #ea580c;">R$ ${p.preco}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 14px;"><strong>Prazo de Entrega:</strong> ${dataP}</p>
      </div>
    `;
    const opcoes = { margin: 10, filename: `Orcamento_${p.nomeProd}.pdf`, html2canvas: { scale: 2 }, jsPDF: { format: 'a4', orientation: 'portrait' } };
    (window as any).html2pdf().from(elemento).set(opcoes).save();
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("E-mail ou senha incorretos!"); }
  };

  const confirmarExcluir = async (tipo: string, id: string) => {
    if (window.confirm(`Excluir ${tipo}?`)) {
      await deleteDoc(doc(db, tipo === 'pedido' ? "pedidos" : tipo === 'cliente' ? "clientes" : tipo === 'produto' ? "produtos" : "materiais", id));
    }
  };

  const confirmarVendaPedido = async (pedido: any) => {
    if (pedido.materiaisUsados && pedido.materiaisUsados.length > 0) {
      for (const m of pedido.materiaisUsados) {
        const matDoBanco = materiais.find(item => item.id === m.id);
        if (matDoBanco) {
          const estoqueFiscal = Number(matDoBanco.qtdAtual || 0);
          const gastoTotal = Number(m.qtdUsada || 0) * Number(pedido.qtdPed || 1);
          await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, estoqueFiscal - gastoTotal) });
        }
      }
    }
    await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰' });
    alert("Venda confirmada!");
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando painel... 🚀</div>;
  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-red-500 bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"><LogOut size={14}/> SAIR</button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {/* TELA INICIAL */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2">
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 p-6 rounded-[35px] shadow-lg text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Faturamento Realizado</p>
              <h2 className="text-4xl font-black mt-1 tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3"><History size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes}</p>
              </div>

              <div onClick={() => setActiveTab('catalogo')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3"><BookOpen size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catálogo</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{produtos.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setActiveTab('materiais')} className={`p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all ${dashboardMetrics.criticos > 0 ? 'bg-red-50/50 border-red-100' : 'bg-white'}`}>
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-3"><Package size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Falta Reposição</p>
                <p className="text-2xl font-black mt-0.5">{dashboardMetrics.criticos}</p>
              </div>

              <div onClick={() => setActiveTab('clientes')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 mb-3"><User size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Base Comercial</p>
                <p className="text-2xl font-black mt-0.5">{dashboardMetrics.totalClientes}</p>
              </div>
            </div>
          </div>
        )}

        {/* TELA DE CATÁLOGO COM FOTOS */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-6 rounded-[35px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><BookOpen size={18}/> Novo Item de Venda Fixa</h2>
              
              <div className="mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px]">
                {novoProdCatalogo.urlImagem ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden">
                    <img src={novoProdCatalogo.urlImagem} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setNovoProdCatalogo(p => ({...p, urlImagem: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-purple-600">
                      <Camera size={22} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">
                      {subindoImagem ? 'Subindo Foto...' : '📸 Adicionar Foto do Produto'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImagem} disabled={subindoImagem} />
                  </label>
                )}
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Produto</label>
              <input placeholder="Ex: Caneca Alça Coração" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Fixo de Venda (R$)</label>
              <input type="number" placeholder="Ex: 35.00" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-purple-700" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />

              <button onClick={async () => {
                if(!novoProdCatalogo.nome || !novoProdCatalogo.precoVenda) return alert("Preencha o nome e o preço!");
                const d = { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem || '', userId: user.uid };
                
                if (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d);
                else await addDoc(collection(db, "produtos"), d);
                
                setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '' });
                alert("Produto salvo no catálogo!");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" disabled={subindoImagem}>
                {novoProdCatalogo.id ? 'Atualizar Item' : 'Salvar no Catálogo 📖'}
              </button>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">Seu Catálogo Visual</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {produtos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-[30px] flex gap-4 items-center border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                    {p.urlImagem ? <img src={p.urlImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{p.nome}</p>
                    <p className="text-purple-700 font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">
                      Vender 🛍️
                    </button>
                    <button onClick={() => setNovoProdCatalogo({ id: p.id, nome: p.nome, precoVenda: String(p.precoVenda), urlImagem: p.urlImagem || '' })} className="text-purple-400 p-1.5"><Edit2 size={15}/></button>
                    <button onClick={() => confirmarExcluir('produto', p.id)} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULADORA / CRIAR PEDIDO */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-purple-700 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                <ShoppingCart size={18}/> {pedidoEditandoId ? '✏️ Editando Orçamento' : 'Novo Orçamento'}
              </h2>
              <button onClick={() => setMostrarSeletorCatalogo(!mostrarSeletorCatalogo)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black uppercase border border-purple-100">
                {precoManual ? '✨ Item de Catálogo' : '📖 Usar Catálogo'}
              </button>
            </div>

            {mostrarSeletorCatalogo && (
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-3xl mb-4 text-xs space-y-2">
                <p className="font-bold text-purple-700 uppercase text-[10px]">Escolha um produto pronto:</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {produtos.map(p => (
                    <div key={p.id} onClick={() => {
                      setNomeProd(p.nome);
                      setPrecoManual(String(p.precoVenda));
                      setMostrarSeletorCatalogo(false);
                    }} className="bg-white p-2.5 rounded-xl border flex justify-between items-center cursor-pointer hover:border-purple-400">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                          {p.urlImagem ? <img src={p.urlImagem} className="w-full h-full object-cover" /> : <ImageIcon size={14}/>}
                        </div>
                        <span className="font-bold">{p.nome}</span>
                      </div>
                      <span className="text-purple-700 font-black">R$ {Number(p.precoVenda).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {precoManual && <button onClick={() => setPrecoManual(null)} className="text-[10px] text-red-500 font-bold uppercase underline pt-1 block">Limpar e calcular do zero</button>}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
               <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
               </div>
            </div>

            <div className="mb-4">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
               <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Escolher Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
            </div>

            {precoManual === null ? (
              <>
                <div className="mb-4">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados</label>
                   <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2" onChange={e => {
                      const m = materiais.find(item => item.id === e.target.value);
                      if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]);
                   }} value="">
                      <option value="">+ Adicionar Material...</option>
                      {materiais.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.unidade || 'un'})</option>)}
                   </select>
                   <div className="space-y-2">
                      {matsNoPed.map((m, i) => (
                        <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs">
                          <span>{m.nome}</span>
                          <div className="flex items-center gap-2">
                            <input type="number" className="w-16 bg-white rounded-lg p-1 text-center" value={m.qtdUsada} onChange={e => {
                               const nova = [...matsNoPed]; nova[i].qtdUsada = e.target.value; setMatsNoPed(nova);
                            }} />
                            <span className="text-[10px] text-purple-500">{m.unidade || 'un'}</span>
                            <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Tempo Gasto (min)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
                  <div><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Valor da Hora (R$)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
                </div>
                <div className="mb-4 text-center">
                  <div className="grid grid-cols-4 gap-2">
                    {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                      <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                        <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                        <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Lucro %</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
                  <div><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Prazo</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
                </div>
              </>
            ) : (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl mb-4 text-xs">
                <p className="font-bold text-orange-600">💥 Preço travado pelo catálogo de vendas.</p>
                <p className="text-slate-500 mt-1">Valor Unitário original: <strong>R$ {Number(precoManual).toFixed(2)}</strong></p>
                <div className="mt-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prazo</label>
                  <input type="date" className="w-full p-4 bg-white rounded-2xl outline-none text-xs font-bold border" value={prazo} onChange={e => setPrazo(e.target.value)} />
                </div>
              </div>
            )}

            <div className="mb-6">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total (R$)</label>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
            </div>

            {/* O SEU COMPONENTE DE RESUMO COM OS NOMES ORIGINAIS COMPLETOS */}
            {precoManual === null && (
              <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 text-xs space-y-2.5">
                <p className="font-black text-purple-700 uppercase tracking-wider text-[10px] mb-1">📋 RESUMO FINANCEIRO DA PEÇA</p>
                <div className="flex justify-between text-slate-500"><span>Materiais:</span><span className="font-bold">R$ {resumenFinanceiro.materiais}</span></div>
                <div className="flex justify-between text-slate-500"><span>Mão de Obra:</span><span className="font-bold">R$ {resumenFinanceiro.maoObra}</span></div>
                <div className="flex justify-between text-slate-500"><span>Extras / Custo Manual:</span><span className="font-bold">R$ {resumenFinanceiro.extras}</span></div>
                <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1"><span>Custo Total da Peça:</span><span className="text-purple-700">R$ {resumenFinanceiro.custoPeca}</span></div>
                <div className="flex justify-between text-emerald-600 font-bold"><span>Lucro Livre Gerado ({lucro}%) :</span><span>R$ {resumenFinanceiro.lucroLivre}</span></div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl tracking-tighter">R$ {resumenFinanceiro.final}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                   if(!nomeProd) return alert("Digite o nome do produto!");
                   const dadosPedido = { 
                     nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, vHora, tGasto, custos, lucro, desconto, userId: user.uid,
                     precoManual: precoManual,
                     materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) }))
                   };
                   if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
                   else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString(), status: 'Pendente' });
                   limparCalculadora(); setActiveTab('pedidos');
                   alert("Salvo!");
                }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar</button>
                <button onClick={() => gerarPDF({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg"><Printer size={18}/></button>
                <button onClick={() => enviarZap({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-4 rounded-[22px] shadow-lg"><MessageCircle size={18}/></button>
              </div>
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               const ehPendente = p.status !== 'Vendido 💰';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border">
                   <div className="flex justify-between items-center">
                     <div>
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">{cli?.nome || 'Sem Cliente'} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span></p>
                        <p className="font-bold text-slate-700 text-sm">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">({p.qtdPed || 1} un)</span></p>
                     </div>
                     <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1">
                      {ehPendente && (
                        <>
                          <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto active:scale-95"><CheckCircle size={16}/> Confirmar Venda</button>
                          <button onClick={() => carregarPedidoParaEdicao(p)} className="text-purple-600 p-2 bg-purple-50 rounded-xl"><Edit2 size={18}/></button>
                        </>
                      )}
                      <button onClick={() => gerarPDF(p)} className="text-orange-500 p-2 bg-orange-50 rounded-xl"><Printer size={18}/></button>
                      <button onClick={() => enviarZap(p)} className="text-emerald-500 p-2 bg-emerald-50 rounded-xl"><MessageCircle size={18}/></button>
                      <button onClick={() => confirmarExcluir('pedido', p.id)} className="text-red-200 p-2"><Trash2 size={18}/></button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

        {/* GERENCIAR ARMÁRIO */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package size={20}/> Gerenciar Armário</h2>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Insumo</label>
              <input placeholder="Ex: Caneca Cerâmica" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Caixa/Rolo</label>
                  <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">Rende Quantos?</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">Estoque Atual</label>
                  <input type="number" className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold text-purple-700" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Mínimo Alerta</label>
                  <input type="number" className="w-full p-4 bg-red-50 rounded-2xl outline-none text-center font-bold text-red-700" value={novoMat.qtdMinima} onChange={e => setNovoMat({...novoMat, qtdMinima: e.target.value})} />
                </div>
              </div>
              <div className="mb-6">
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold" value={novoMat.unidade} onChange={e => setNovoMat({...novoMat, unidade: e.target.value})}>
                  <option value="un">📦 Unidade (un)</option>
                  <option value="Folha A4">📄 Folha A4</option>
                  <option value="m">📏 Metro (m)</option>
                  <option value="cm">📐 Centímetro (cm)</option>
                </select>
              </div>
              <button onClick={async () => {
                if(!novoMat.nome) return alert("Digite o nome do insumo!");
                const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), unidade: novoMat.unidade, qtdAtual: Number(novoMat.qtdAtual || 0), qtdMinima: Number(novoMat.qtdMinima || 0), userId: user.uid };
                
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                else await addDoc(collection(db, "materiais"), d);
                
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
                alert("Material salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">
                {novoMat.id ? 'Atualizar Insumo' : 'Salvar no Armário'}
              </button>
            </div>
            {materiais.map(m => {
              const estaAcabando = Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0);
              const valorUnitarioCalculado = Number(m.qtd || 1) > 0 ? (Number(m.valor || 0) / Number(m.qtd || 1)).toFixed(2) : "0.00";
              return (
                <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border">
                  <div>
                    <p className="font-bold text-slate-800">{estaAcabando ? '🔴' : '🟢'} {m.nome}</p>
                    <p className="text-xs text-slate-400 mt-1">Custo unitário: <span className="font-bold text-slate-600">R$ {valorUnitarioCalculado}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">Qtd: <span className="font-bold text-purple-700">{m.qtdAtual} {m.unidade}</span></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, Number(m.qtdAtual || 0) - 1) })} className="w-8 h-8 bg-slate-100 rounded-xl font-bold">-</button>
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Number(m.qtdAtual || 0) + 1 })} className="w-8 h-8 bg-purple-100 rounded-xl font-bold text-purple-700">+</button>
                    <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: String(m.valor), qtd: String(m.qtd), unidade: m.unidade, qtdAtual: String(m.qtdAtual), qtdMinima: String(m.qtdMinima)})} className="text-orange-400 p-2"><Edit2 size={16}/></button>
                    <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Novos Clientes</h2>
              <input placeholder="Nome Comercial" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp com DDD" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                if(!novoCli.nome) return alert("Digite o nome do cliente!");
                
                if(novoCli.id) await updateDoc(doc(db, "clientes", novoCli.id), { nome: novoCli.nome, zap: novoCli.zap, userId: user.uid });
                else await addDoc(collection(db, "clientes"), { nome: novoCli.nome, zap: novoCli.zap, userId: user.uid });
                
                setNovoCli({ id: '', nome: '', zap: '' }); 
                alert("Cliente Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm font-bold">
                <div className="flex flex-col ml-2">
                  <span className="text-slate-800">{c.nome}</span>
                  <span className="text-xs text-slate-400 font-normal">{c.zap ? `📱 ${c.zap}` : 'Sem número'}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setNovoCli({ id: c.id, nome: c.nome, zap: c.zap || '' })} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                  <button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MENU INFERIOR */}
      <div className="fixed bottom-6 w-full flex justify-around px-2 items-center z-50">
          <button onClick={() => setActiveTab('inicio')} className={`p-4 rounded-2xl transition-all ${activeTab === 'inicio' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Home size={22}/></button>
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => { limparCalculadora(); setActiveTab('criar'); }} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300'}`}><Plus size={24}/></button>
          <button onClick={() => setActiveTab('catalogo')} className={`p-4 rounded-2xl transition-all ${activeTab === 'catalogo' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><BookOpen size={22}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
