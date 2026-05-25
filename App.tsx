import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2 } from 'lucide-react';

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
  
  const [idLojaPublica, setIdLojaPublica] = useState<string | null>(null);
  const [produtosPublicos, setProdutosPublicos] = useState<any[]>([]);
  const [carregandoPublico, setCarregandoPublico] = useState(false);
  const [carrinho, setCarrinho] = useState<{ [key: string]: number }>({});
  const [nomeComprador, setNomeComprador] = useState('');
  const [zapDaLojaPublica, setZapDaLojaPublica] = useState('');

  const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo'>('inicio');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

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
  const [obsPedido, setObsPedido] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
  const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '' });
  
  const [novoProdCatalogo, setNovoProdCatalogo] = useState({ id: '', nome: '', precoVenda: '', urlImagem: '' });
  const [zapDonaConta, setZapDonaConta] = useState('');
  const [subindoImagem, setSubindoImagem] = useState(false);

  const setActiveTab = (tab: any) => {
    useStateActiveTab(tab);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lojaId = params.get('loja');
    if (lojaId) {
      setIdLojaPublica(lojaId);
      setCarregandoPublico(true);
      
      getDoc(doc(db, "configuracoes_loja", lojaId)).then(docSnap => {
        if(docSnap.exists()) {
          setZapDaLojaPublica(docSnap.data().whatsapp || '');
        }
      });

      const q = query(collection(db, "produtos"), where("userId", "==", lojaId));
      getDocs(q).then(snapshot => {
        setProdutosPublicos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setCarregandoPublico(false);
      }).catch(() => setCarregandoPublico(false));
    }
    
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        getDoc(doc(db, "configuracoes_loja", u.uid)).then(docSnap => {
          if(docSnap.exists()) setZapDonaConta(docSnap.data().whatsapp || '');
        });
      }
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

  useEffect(() => {
    if (user && !idLojaPublica) {
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
    }
  }, [user, idLojaPublica]);

  const linkDoCatalogoDestaCliente = useMemo(() => {
    if (!user) return '';
    return `${window.location.origin}${window.location.pathname}?loja=${user.uid}`;
  }, [user]);

  const copiarLinkCatalogo = () => {
    navigator.clipboard.writeText(linkDoCatalogoDestaCliente);
    alert("Link do seu catálogo copiado! 🔗🚀");
  };

  const finalizarPedidoPublicoWhatsapp = () => {
    if (!nomeComprador.trim()) return alert("Por favor, digite seu nome antes de enviar!");
    const itensSelecionados = produtosPublicos.filter(p => carrinho[p.id] > 0);
    if (itensSelecionados.length === 0) return alert("Seu carrinho está vazio!");

    let textoPedido = `*NOVO PEDIDO VIA CATÁLOGO DE VENDAS*%0A`;
    textoPedido += `---%0A`;
    textoPedido += `*Cliente:* ${nomeComprador.trim()}%0A%0A`;
    textoPedido += `*Itens do Pedido:*%0A`;
    
    let totalGeral = 0;
    itensSelecionados.forEach(p => {
      const qtd = carrinho[p.id];
      const sub = Number(p.precoVenda) * qtd;
      totalGeral += sub;
      textoPedido += `• ${qtd}x _${p.nome}_ — R$ ${sub.toFixed(2)}%0A`;
    });

    textoPedido += `---%0A`;
    textoPedido += `*VALOR TOTAL:* R$ ${totalGeral.toFixed(2)}%0A`;
    textoPedido += `---%0A`;
    textoPedido += `Aguardo a confirmação e dados para pagamento! 🙌`;

    const numeroLimpo = zapDaLojaPublica.replace(/\D/g, '');
    if (numeroLimpo) {
      window.open(`https://wa.me/55${numeroLimpo}?text=${textoPedido}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${textoPedido}`, '_blank');
    }
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
    const dataEmissao = p.data || new Date().toLocaleDateString('pt-BR');
    
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 7);
    const dataValidade = hoje.toLocaleDateString('pt-BR');
    
    const dataPrazo = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const totalNum = Number(p.preco || 0);
    const qtdNum = Number(p.qtdPed || 1);
    const precoUnitario = (totalNum / qtdNum).toFixed(2);

    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="color: #7c3aed; margin: 0; font-size: 32px; font-weight: 900;">PrecificaJá 🚀</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; font-weight: bold;">Documento de Orçamento Comercial</p>
          </div>
          <div style="text-align: right; background-color: #f8fafc; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: bold; color: #a78bfa; text-transform: uppercase; display: block;">Código Ref</span>
            <span style="font-size: 14px; font-weight: bold; color: #475569; display: block; margin-top: 2px;">ORC-${Math.floor(1000 + Math.random() * 9000)}</span>
          </div>
        </div>
        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Dados do Cliente</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Cliente:</strong> ${cli?.nome || 'Cliente não informado'}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>WhatsApp:</strong> ${cli?.zap || 'Não informado'}</p>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Informações Básicas e Prazos</div>
        <div style="display: flex; justify-content: space-between; background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9; font-size: 13px;">
          <div><strong>Data de Emissão:</strong><div style="margin-top: 4px; color: #64748b; font-weight: bold;">${dataEmissao}</div></div>
          <div><strong>Validade do Orçamento:</strong><div style="margin-top: 4px; color: #ef4444; font-weight: bold;">${dataValidade} (7 dias)</div></div>
          <div><strong>Prazo de Entrega:</strong><div style="margin-top: 4px; color: #7c3aed; font-weight: bold;">${dataPrazo}</div></div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Produtos / Serviços Selecionados</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">
              <th style="padding: 10px 5px;">Descrição</th>
              <th style="padding: 10px 5px; text-align: center;">Qtd</th>
              <th style="padding: 10px 5px; text-align: right;">Preço Unit.</th>
              <th style="padding: 10px 5px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
              <td style="padding: 15px 5px; font-weight: bold; color: #1e293b;">${p.nomeProd}</td>
              <td style="padding: 15px 5px; text-align: center; color: #475569;">${qtdNum}</td>
              <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${precoUnitario}</td>
              <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${totalNum.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Subtotal: <strong>R$ ${totalNum.toFixed(2)}</strong></div>
          <div style="background-color: #7c3aed; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Total do Pedido</span>
            R$ ${totalNum.toFixed(2)}
          </div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Forma de Pagamento</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div><strong>Forma de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO</div></div>
          <div><strong>Condições de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp</div></div>
        </div>

        ${p.obsPedido ? `
        <div style="background-color: #f3e8ff; border: 1px solid #e9d5ff; padding: 15px; border-radius: 16px; font-size: 13px; color: #6b21a8; margin-bottom: 15px;">
          <strong style="text-transform: uppercase; font-size: 10px; display: block; color: #a855f7; margin-bottom: 4px;">Observações Importantes:</strong>
          ${p.obsPedido.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
          Obrigado pela preferência! Caso tenha dúvidas, entre em contato pelo nosso WhatsApp.
        </div>
      </div>
    `;
    const opcoes = { margin: 0, filename: `Orcamento_${p.nomeProd}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } };
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
      alert("Erro ao subir a foto!");
    } finally {
      setSubindoImagem(false);
    }
  };

  // VITRINE PÚBLICA (Compradores)
  if (idLojaPublica) {
    if (carregandoPublico) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando Vitrine... 🛍️</div>;
    const totalCarrinho = Object.keys(carrinho).reduce((acc, id) => {
      const prod = produtosPublicos.find(p => p.id === id);
      return acc + (prod ? Number(prod.precoVenda) * carrinho[id] : 0);
    }, 0);

    return (
      <div className="min-h-screen bg-slate-50 pb-40 font-sans text-slate-700">
        <header className="bg-white p-4 text-center shadow-sm border-b sticky top-0 z-50">
          <h1 className="text-xl font-black text-purple-700">Vitrine de Destaques 🎉</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Faça suas escolhas e envie no WhatsApp</p>
        </header>

        <main className="p-4 max-w-xl mx-auto space-y-6">
          <div className="bg-white p-5 rounded-[30px] border shadow-sm">
            <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Seu Nome Completo</label>
            <input placeholder="Digite seu nome para o pedido..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-bold border border-transparent focus:border-purple-400" value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {produtosPublicos.map(p => {
              const qtdNoCarinho = carrinho[p.id] || 0;
              return (
                <div key={p.id} className="bg-white p-4 rounded-[35px] border shadow-sm flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                    {p.urlImagem ? <img src={p.urlImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={30} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-base truncate">{p.nome}</p>
                    <p className="text-purple-700 font-black text-lg mt-1">R$ {Number(p.precoVenda).toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setCarrinho({ ...carrinho, [p.id]: Math.max(0, qtdNoCarinho - 1) })} className="w-8 h-8 bg-slate-100 rounded-xl font-black text-slate-600">-</button>
                      <span className="font-bold text-sm w-6 text-center">{qtdNoCarinho}</span>
                      <button onClick={() => setCarrinho({ ...carrinho, [p.id]: qtdNoCarinho + 1 })} className="w-8 h-8 bg-purple-100 rounded-xl font-black text-purple-700">+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {totalCarrinho > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-2xl flex flex-col items-center gap-3 z-50">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total do seu Pedido</span>
              <div className="text-2xl font-black text-orange-500">R$ {totalCarrinho.toFixed(2)}</div>
            </div>
            <button onClick={finalizarPedidoPublicoWhatsapp} className="w-full max-w-md bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 tracking-wider">
              <MessageCircle size={18}/> Encomendar no WhatsApp
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando painel... 🚀</div>;
  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  // CONSTRUTOR REUTILIZÁVEL DA CALCULADORA (CRIAR/EDITAR ORÇAMENTO)
  const renderCalculadoraForm = () => (
    <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-purple-700 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
          <ShoppingCart size={18}/> {pedidoEditandoId ? '✏️ Editando Orçamento' : 'Novo Orçamento'}
        </h2>
        
        {/* BOTÃO EXCLUSIVO DE CANCELAR EDIÇÃO */}
        {pedidoEditandoId ? (
          <button 
            onClick={() => { limparCalculadora(); setActiveTab('pedidos'); }} 
            className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl font-black uppercase border border-red-100 active:scale-95 transition-all"
          >
            Cancelar ❌
          </button>
        ) : (
          <button onClick={() => setMostrarSeletorCatalogo(!mostrarSeletorCatalogo)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black uppercase border border-purple-100">
            {precoManual ? '✨ Item de Catálogo' : '📖 Usar Catálogo'}
          </button>
        )}
      </div>

      {mostrarSeletorCatalogo && !pedidoEditandoId && (
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

      <div className="mb-4">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total (R$)</label>
         <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
      </div>

      <div className="mb-6">
         <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">📝 Observações do Orçamento</label>
         <textarea 
           placeholder="Ex: Sinal de 50% para início da produção. Restante na entrega." 
           className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold border border-transparent focus:border-purple-400 resize-none h-20" 
           value={obsPedido} 
           onChange={e => setObsPedido(e.target.value)} 
         />
      </div>

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
               precoManual: precoManual, obsPedido: obsPedido,
               materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) }))
             };
             if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
             else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente' });
             limparCalculadora(); setActiveTab('pedidos');
             alert("Salvo!");
          }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar</button>
          <button onClick={() => gerarPDF({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, obsPedido})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg"><Printer size={18}/></button>
          <button onClick={() => enviarZap({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-4 rounded-[22px] shadow-lg"><MessageCircle size={18}/></button>
        </div>
      </div>
    </div>
  );

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
              <p className="text-[11px] text-purple-200 mt-2 opacity-80">📈 Dinheiro gerado de pedidos marcados como vendidos</p>
            </div>

            <div onClick={() => { limparCalculadora(); setActiveTab('criar'); }} 
                 className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-[35px] shadow-md cursor-pointer active:scale-95 transition-all text-white flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Calculadora Integrada</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Novo Orçamento Rápido 🚀</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Calculator size={24}/>
              </div>
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
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Clientes</p>
                <p className="text-2xl font-black mt-0.5">{dashboardMetrics.totalClientes}</p>
              </div>
            </div>
          </div>
        )}

        {/* TELA DE CATÁLOGO COM CONFIGURAÇÃO DE WHATSAPP */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2">
            <div className="bg-gradient-to-tr from-purple-800 to-purple-600 p-6 rounded-[35px] text-white shadow-lg border border-purple-900 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200 flex items-center gap-1.5"><Share2 size={14}/> Seu Catálogo Público</h3>
                <p className="text-xs text-purple-100 mt-1 opacity-90">Link exclusivo para enviar aos seus clientes:</p>
                <div className="mt-2 bg-purple-900/40 p-3.5 rounded-2xl text-xs font-mono select-all break-all border border-purple-500/30 bg-black/10">
                  {linkDoCatalogoDestaCliente}
                </div>
                <div onClick={copiarLinkCatalogo} className="mt-2.5 w-full bg-white text-purple-800 font-bold p-3 rounded-xl text-xs uppercase shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                  <Copy size={14}/> Copiar Link do Catálogo
                </div>
              </div>

              <div className="border-t border-purple-500/30 pt-3">
                <label className="text-[10px] font-black uppercase text-purple-200 block mb-1">📱 Seu WhatsApp de Vendas (Com DDD)</label>
                <div className="flex gap-2">
                  <input placeholder="Ex: 11999999999" className="flex-1 p-3 bg-black/20 text-white rounded-xl text-xs font-bold border border-purple-500/30 outline-none" value={zapDonaConta} onChange={e => setZapDonaConta(e.target.value)} />
                  <button onClick={async () => {
                    if(!zapDonaConta.trim()) return alert("Digite o número primeiro!");
                    try {
                      await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true });
                      alert("WhatsApp de vendas salvo com sucesso! 🚀");
                    } catch {
                      alert("Erro ao salvar número.");
                    }
                  }} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase px-4 rounded-xl shadow active:scale-95 transition-all">Salvar</button>
                </div>
              </div>
            </div>

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
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">Vender 🛍️</button>
                    <button onClick={() => setNovoProdCatalogo({ id: p.id, nome: p.nome, precoVenda: String(p.precoVenda), urlImagem: p.urlImagem || '' })} className="text-purple-400 p-1.5"><Edit2 size={15}/></button>
                    <button onClick={() => deleteDoc(doc(db, "produtos", p.id))} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA DE CONTRUÇÃO DA CALCULADORA */}
        {activeTab === 'criar' && renderCalculadoraForm()}

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
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">
                          {cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span>
                        </p>
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

        {/* ABA DE CLIENTES */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Gerenciar Clientes</h2>
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

      {/* MENU INFERIOR 100% PLANO E SIMÉTRICO */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-50 bg-transparent pointer-events-none">
        <div className="relative bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-[30px] flex justify-around items-center px-2 h-16 w-full max-w-xl pointer-events-auto">
          
          <button 
            onClick={() => setActiveTab('inicio')} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'inicio' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <Home size={20} className={activeTab === 'inicio' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
          </button>

          <button 
            onClick={() => setActiveTab('materiais')} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'materiais' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <Package size={20} className={activeTab === 'materiais' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Armário</span>
          </button>

          <button 
            onClick={() => setActiveTab('catalogo')} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'catalogo' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <BookOpen size={20} className={activeTab === 'catalogo' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Catálogo</span>
          </button>

          <button 
            onClick={() => { limparCalculadora(); setActiveTab('criar'); }} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'criar' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <Plus size={20} className={activeTab === 'criar' ? 'stroke-[3]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Orçar</span>
          </button>

          <button 
            onClick={() => setActiveTab('clientes')} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'clientes' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <User size={20} className={activeTab === 'clientes' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Clientes</span>
          </button>

          <button 
            onClick={() => setActiveTab('pedidos')} 
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'pedidos' ? 'text-orange-500' : 'text-slate-300'}`}
          >
            <History size={20} className={activeTab === 'pedidos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Histórico</span>
          </button>

        </div>
      </div>
    </div>
  );
}
