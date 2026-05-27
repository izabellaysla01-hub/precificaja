import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu } from 'lucide-react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [idLojaPublica, setIdLojaPublica] = useState<string | null>(null);
  const [produtosPublicos, setProdutosPublicos] = useState<any[]>([]);
  const [carregandoPublico, setCarregandoPublico] = useState(false);
  const [carrinho, setCarrinho] = useState<{ [key: string]: number }>({});
  const [nomeComprador, setNomeComprador] = useState('');
  const [zapDaLojaPublica, setZapDaLojaPublica] = useState('');

  const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo' | 'moldes'>('inicio');
  const [modoOrcamento, setModoOrcamento] = useState<'normal' | 'molde'>('normal');

  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [moldes, setMoldes] = useState<any[]>([]);

  // Estados do Orçamento Rápido via Moldes Salvos
  const [quantidadesPedidoMoldes, setQuantidadesPedidoMoldes] = useState<{ [key: string]: number }>({});
  const [clienteSelecionadoMoldes, setClienteSelecionadoMoldes] = useState('');
  const [obsPedidoMoldes, setObsPedidoMoldes] = useState('');
  const [prazoPedidoMoldes, setPrazoPedidoMoldes] = useState('');

  // Estados de criação de um Molde Base Novo
  const [nomeMolde, setNomeMolde] = useState('');
  const [matsNoMolde, setMatsNoMolde] = useState<any[]>([]);
  const [tGastoMolde, setTGastoMolde] = useState('10');
  const [vHoraMolde, setVHoraMolde] = useState('9');
  const [custosMolde, setCustosMolde] = useState({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
  const [lucroMolde, setLucroMolde] = useState('100');
  const [moldeEditandoId, setMoldeEditandoId] = useState<string | null>(null);
  
  const [tipoPrecoMolde, setTipoPrecoMolde] = useState<'auto' | 'manual'>('auto');
  const [precoManualMolde, setPrecoManualMolde] = useState('');

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
  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

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
    setIsMenuOpen(false);
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

      const qMoldes = query(collection(db, "moldes"), where("userId", "==", user.uid));
      const unsubMoldes = onSnapshot(qMoldes, s => setMoldes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      return () => {
        unsubMateriais(); unsubPedidos(); unsubClientes(); unsubProdutos(); unsubMoldes();
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
    const custoTotalLote = custoTotalPeca * Number(qtdPed || 1);
    const valorLucroLivre = custoTotalLote * (Number(lucro || 0) / 100);
    const precoFinalCalculado = (custoTotalLote + valorLucroLivre) - Number(desconto || 0);

    return { 
      materiais: totalMateriais.toFixed(2), 
      maoObra: totalMaoObra.toFixed(2), 
      extras: totalExtras.toFixed(2), 
      custoPeca: custoTotalPeca.toFixed(2), 
      lucroLivre: valorLucroLivre.toFixed(2), 
      final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) 
    };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual]);

  const valorUnitarioDoMoldeGerado = useMemo(() => {
    if (tipoPrecoMolde === 'manual' && precoManualMolde !== '') {
      return isNaN(Number(precoManualMolde)) ? 0 : Number(precoManualMolde);
    }
    const totalMateriais = matsNoMolde.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    const totalMaoObra = (Number(vHoraMolde || 0) / 60) * Number(tGastoMolde || 0);
    const totalExtras = Number(custosMolde.embalagem || 0) + Number(custosMolde.impressao || 0) + Number(custosMolde.energia || 0) + Number(custosMolde.outros || 0);
    const custoPeca = totalMateriais + totalMaoObra + totalExtras;
    const precoVendaUnitario = custoPeca + (custoPeca * (Number(lucroMolde || 0) / 100));
    return isNaN(precoVendaUnitario) ? 0 : precoVendaUnitario;
  }, [matsNoMolde, vHoraMolde, tGastoMolde, custosMolde, lucroMolde, tipoPrecoMolde, precoManualMolde]);

  const resumoPedidoPorMoldes = useMemo(() => {
    let subtotal = 0;
    const itensArray: any[] = [];
    Object.keys(quantidadesPedidoMoldes).forEach(id => {
      const qtd = quantidadesPedidoMoldes[id];
      if (qtd > 0) {
        const itemMolde = moldes.find(m => m.id === id);
        if (itemMolde) {
          const totalItem = Number(itemMolde.precoVendaUnitario || 0) * qtd;
          subtotal += totalItem;
          itensArray.push({ id: itemMolde.id, nome: itemMolde.nome, qtd, subtotal: totalItem, materiaisUsados: itemMolde.materiaisUsados || [] });
        }
      }
    });
    return { total: subtotal.toFixed(2), itens: itensArray };
  }, [quantidadesPedidoMoldes, moldes]);

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
        </div>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Cliente:</strong> ${cli?.nome || 'Cliente não informado'}</p>
        <p><strong>Emissão:</strong> ${dataEmissao} | <strong>Prazo:</strong> ${dataPrazo}</p>
        <p style="font-weight: bold;">Produto: ${p.nomeProd}</p>
        <h2 style="color: #7c3aed;">Total: R$ ${totalNum.toFixed(2)}</h2>
      </div>
    `;
    const opcoes = { margin: 0, filename: `Orcamento_${p.nomeProd}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } };
    (window as any).html2pdf().from(elemento).set(opcoes).save();
  };

  const confirmarExcluir = async (tipo: string, id: string) => {
    if (window.confirm(`Deseja mesmo excluir este registro do sistema?`)) {
      await deleteDoc(doc(db, tipo === 'pedido' ? "pedidos" : tipo === 'cliente' ? "clientes" : tipo === 'produto' ? "produtos" : tipo === 'molde' ? "moldes" : "materiais", id));
      alert("Excluído com sucesso!");
    }
  };

  // REGRAS DE BAIXA INTELIGENTE CORRIGIDAS (CONTROLA MOLDES, CALCULADORA E PRODUTOS DE CATALOGO)
  const confirmarVendaPedido = async (pedido: any) => {
    try {
      // 1. Caso venha da aba de Moldes estruturados
      if (pedido.moldesVinculados && pedido.moldesVinculados.length > 0) {
        for (const itemMolde of pedido.moldesVinculados) {
          if (itemMolde.materiaisUsados && itemMolde.materiaisUsados.length > 0) {
            for (const matGasto of itemMolde.materiaisUsados) {
              const matDoBanco = materiais.find(m => m.id === matGasto.id);
              if (matDoBanco) {
                const estoqueAtual = Number(matDoBanco.qtdAtual || 0);
                const totalDescontar = Number(matGasto.qtdUsada || 0) * Number(itemMolde.qtd || 1);
                await updateDoc(doc(db, "materiais", matGasto.id), { qtdAtual: Math.max(0, estoqueAtual - totalDescontar) });
              }
            }
          }
        }
      } 
      // 2. Caso venha do botão "Vender" simples do Catálogo Comercial (Preço Travado)
      else if (pedido.precoManual && !pedido.materiaisUsados) {
        // Encontra o produto correspondente cadastrado para ler qual material ou estrutura dar baixa se houver vinculo
        const prodFixo = produtos.find(p => p.nome === pedido.nomeProd);
        if (prodFixo && prodFixo.materiaisUsados) {
          for (const m of prodFixo.materialsUsados || prodFixo.materiaisUsados) {
            const matDoBanco = materiais.find(item => item.id === m.id);
            if (matDoBanco) {
              const estoqueFiscal = Number(matDoBanco.qtdAtual || 0);
              const gastoTotal = Number(m.qtdUsada || 0) * Number(pedido.qtdPed || 1);
              await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, estoqueFiscal - gastoTotal) });
            }
          }
        }
      }
      // 3. Caso venha da Calculadora Normal de orçamentos livres
      else if (pedido.materiaisUsados && pedido.materiaisUsados.length > 0) {
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
      alert("Venda faturada com sucesso e estoque do armário deduzido! 📦📈");
    } catch (e) {
      alert("Erro ao faturar venda.");
    }
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

  const limparCalculadora = () => {
    setNomeProd(''); setQtdPed('1'); setMatsNoPed([]); setVHora('9'); setTGasto('60'); setCustos({ embalagem: '0', impressao: '0', energia: '0', outros: '0' }); setLucro('100'); setDesconto('0'); setPrazo(''); setClienteSel(''); setPedidoEditandoId(null); setPrecoManual(null); setObsPedido('');
  };

  const limparFormMolde = () => {
    setNomeMolde(''); setMatsNoMolde([]); setTGastoMolde('10'); setVHoraMolde('9'); setCustosMolde({ embalagem: '0', impressao: '0', energia: '0', outros: '0' }); setLucroMolde('100'); setMoldeEditandoId(null); setPrecoManualMolde(''); setTipoPrecoMolde('auto');
  };

  const carregarPedidoParaEdicao = (p: any) => {
    setPedidoEditandoId(p.id);
    setNomeProd(p.nomeProd || '');
    setQtdPed(p.qtdPed || '1');
    setPrazo(p.prazo || '');
    setClienteSel(p.clienteId || '');
    setObsPedido(p.obsPedido || '');

    // BLINDAGEM CONTRA BUG: Se o pedido for oriundo de Catálogo (Preço manual travado), não quebra as chaves
    if (p.precoManual !== undefined && p.precoManual !== null) {
      setPrecoManual(String(p.precoManual));
      setMatsNoPed([]);
    } else {
      setPrecoManual(null);
      setVHora(p.vHora || '9');
      setTGasto(p.tGasto || '60');
      setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
      setLucro(p.lucro || '100');
      setDesconto(p.desconto || '0');

      if (p.materiaisUsados && p.materiaisUsados.length > 0) {
        setMatsNoPed(p.materiaisUsados.map((mSalvo: any) => {
          const matDoArmario = materiais.find(item => item.id === mSalvo.id);
          return {
            id: mSalvo.id,
            nome: matDoArmario ? matDoArmario.nome : mSalvo.nome,
            qtdUsada: Number(mSalvo.qtdUsada || 1),
            valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0),
            qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1),
            unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un')
          };
        }));
      } else {
        setMatsNoPed([]);
      }
    }
    setModoOrcamento('normal');
    setActiveTab('criar');
  };

  const venderItemDiretoDoCatalogo = (prod: any) => {
    limparCalculadora(); setNomeProd(prod.nome); setPrecoManual(prod.precoVenda); setModoOrcamento('normal'); setActiveTab('criar');
  };

  // FORMULÁRIO COMPLETO DA CALCULADORA
  const renderCalculadoraForm = () => (
    <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2 w-full">
      {pedidoEditandoId && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl mb-6 flex justify-between items-center animate-pulse w-full">
          <div className="text-xs text-amber-800 font-bold"><span>✏️ Você está editando um orçamento salvo!</span></div>
          <button onClick={() => { limparCalculadora(); setActiveTab('pedidos'); }} className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">Cancelar Edição ❌</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-purple-700 font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><ShoppingCart size={18}/> {pedidoEditandoId ? 'Editando Dados' : 'Novo Orçamento'}</h2>
        {!pedidoEditandoId && (
          <button onClick={() => setMostrarSeletorCatalogo(!mostrarSeletorCatalogo)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black uppercase border border-purple-100">{precoManual ? '✨ Item de Catálogo' : '📖 Usar Catálogo'}</button>
        )}
      </div>

      {mostrarSeletorCatalogo && !pedidoEditandoId && (
        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-3xl mb-4 text-xs space-y-2 w-full">
          <p className="font-bold text-purple-700 uppercase text-[10px]">Escolha um produto pronto:</p>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto w-full">
            {produtos.map(p => (
              <div key={p.id} onClick={() => { setNomeProd(p.nome); setPrecoManual(String(p.precoVenda)); setMostrarSeletorCatalogo(false); }} className="bg-white p-2.5 rounded-xl border flex justify-between items-center cursor-pointer hover:border-purple-400 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">{p.urlImagem ? <img src={p.urlImagem} className="w-full h-full object-cover" /> : <ImageIcon size={14}/>}</div>
                  <span className="font-bold">{p.nome}</span>
                </div>
                <span className="text-purple-700 font-black">R$ {Number(p.precoVenda).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4 w-full">
         <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto</label>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
         </div>
         <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
            <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center font-bold" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
         </div>
      </div>

      <div className="mb-4 w-full">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
         <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full block border border-transparent focus:border-purple-400 font-semibold" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
            <option value="">👤 Escolher Cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
         </select>
      </div>

      {precoManual === null ? (
        <>
          <div className="mb-4 w-full">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados</label>
             <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 block border font-medium" onChange={e => {
                const m = materiais.find(item => item.id === e.target.value);
                if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]);
             }} value="">
                <option value="">+ Adicionar Material...</option>
                {materiais.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.unidade || 'un'})</option>)}
             </select>
             <div className="space-y-2 w-full">
                {matsNoPed.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs w-full">
                    <span>{m.nome}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-16 bg-white rounded-lg p-1 text-center" value={m.qtdUsada} onChange={e => { const nova = [...matsNoPed]; nova[i].qtdUsada = e.target.value; setMatsNoPed(nova); }} />
                      <span className="text-[10px] text-purple-500">{m.unidade || 'un'}</span>
                      <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 w-full">
            <div className="w-full"><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Tempo Gasto (min)</label><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
            <div className="w-full"><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Valor da Hora (R$)</label><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
          </div>

          <div className="mb-4 w-full">
            <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">📦 Custos Extras por Unidade (R$)</label>
            <div className="grid grid-cols-4 gap-2 w-full">
              {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl w-full">
                  <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                  <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 w-full">
            <div className="w-full"><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Lucro %</label><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
            <div className="w-full"><label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Prazo</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
          </div>
        </>
      ) : (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl mb-4 text-xs w-full">
          <p className="font-bold text-orange-600">💥 Preço travado pelo catálogo de vendas.</p>
          <p className="text-slate-500 mt-1">Valor Unitário original: <strong>R$ {Number(precoManual).toFixed(2)}</strong></p>
          <div className="mt-3 w-full"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prazo</label><input type="date" className="w-full p-4 bg-white rounded-2xl outline-none text-xs font-bold border block" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
        </div>
      )}

      <div className="mb-4 w-full">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total (R$)</label>
         <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
      </div>

      <div className="mb-6 w-full">
         <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">📝 Observações do Orçamento</label>
         <textarea placeholder="Ex: Sinal de 50% para início da produção. Restante na entrega." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold border resize-none h-20" value={obsPedido} onChange={e => setObsPedido(e.target.value)} />
      </div>

      {precoManual === null && (
        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border text-xs space-y-2.5 w-full">
          <p className="font-black text-purple-700 uppercase tracking-wider text-[10px] mb-1">📋 RESUMO FINANCEIRO DA PEÇA</p>
          <div className="flex justify-between text-slate-500 w-full"><span>Materiais:</span><span className="font-bold">R$ {resumenFinanceiro.materiais}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Mão de Obra:</span><span className="font-bold">R$ {resumenFinanceiro.maoObra}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Extras / Custo Manual:</span><span className="font-bold">R$ {resumenFinanceiro.extras}</span></div>
          <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1 w-full"><span>Custo Total da Peça:</span><span className="text-purple-700">R$ {resumenFinanceiro.custoPeca}</span></div>
          <div className="flex justify-between text-emerald-600 font-bold w-full"><span>Lucro Livre Gerado ({lucro}%) :</span><span>R$ {resumenFinanceiro.lucroLivre}</span></div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-6 w-full">
        <div className="text-orange-500 font-black text-4xl tracking-tighter">R$ {resumenFinanceiro.final}</div>
        <div className="flex gap-2">
          <button onClick={async () => {
             if(!nomeProd) return alert("Digite o nome do produto!");
             const dadosPedido = { nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, vHora, tGasto, custos, lucro, desconto, userId: user.uid, precoManual: precoManual, obsPedido: obsPedido, materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) })) };
             if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
             else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente', userId: user.uid });
             limparCalculadora(); setActiveTab('pedidos'); alert("Orçamento atualizado!");
          }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar Alteraçoes</button>
          <button onClick={() => gerarPDF({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, obsPedido})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg"><Printer size={18}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700 w-full relative overflow-x-hidden">
      
      {/* MENU HAMBÚRGUER COMPLETO CONTENDO ABSOLUTAMENTE TODAS AS ABAS DO APP */}
      <div className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`w-72 bg-white h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> Menu PrecificaJá</div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
            </div>
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'inicio' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={16}/> Início</button>
              <button onClick={() => setActiveTab('criar')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'criar' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Plus size={16}/> Orçar</button>
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><History size={16}/> Histórico</button>
              <button onClick={() => setActiveTab('moldes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'moldes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Calculator size={16}/> Moldes Salvos</button>
              <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Package size={16}/> Armário / Insumos</button>
              <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><User size={16}/> Clientes</button>
              <button onClick={() => setActiveTab('catalogo')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'catalogo' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookOpen size={16}/> Catálogo de Vitrine</button>
            </nav>
          </div>
          <button onClick={() => signOut(auth)} className="w-full text-red-500 bg-red-50 p-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5"><LogOut size={16}/> Sair</button>
        </div>
      </div>

      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-40 w-full">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700 hover:text-purple-700 transition-colors"><Menu size={24} /></button>
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <div className="w-10"></div> 
      </header>

      <main className="p-4 max-w-xl mx-auto w-full">
        {/* TELA INICIAL */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 p-6 rounded-[35px] shadow-lg text-white w-full">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Faturamento Realizado</p>
              <h2 className="text-4xl font-black mt-1 tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
            </div>

            <div onClick={() => { limparCalculadora(); setActiveTab('criar'); }} 
                 className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-[35px] shadow-md cursor-pointer active:scale-95 transition-all text-white flex justify-between items-center w-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Área de Vendas</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Montar Novo Orçamento ⚡</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Plus size={24}/></div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3"><History size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes}</p>
              </div>

              <div onClick={() => setActiveTab('moldes')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3"><Calculator size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seus Moldes</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{moldes.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA UNIFICADA DE ORÇAMENTOS (CALCULADORA OU MOLDES) */}
        {activeTab === 'criar' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-purple-700 p-2.5 rounded-[24px] grid grid-cols-2 gap-2 shadow-sm w-full">
              <button onClick={() => setModoOrcamento('normal')} className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${modoOrcamento === 'normal' ? 'bg-white text-purple-700 shadow' : 'text-purple-200'}`}>🧮 Calculadora Livre</button>
              <button onClick={() => setModoOrcamento('molde')} className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${modoOrcamento === 'molde' ? 'bg-white text-purple-700 shadow' : 'text-purple-200'}`}>✨ Usar Seus Moldes</button>
            </div>

            {modoOrcamento === 'normal' && renderCalculadoraForm()}

            {modoOrcamento === 'molde' && (
              <div className="bg-white p-6 rounded-[35px] border shadow-xl w-full">
                <div className="mb-4 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
                  <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full block border" onChange={e => setClienteSelecionadoMoldes(e.target.value)} value={clienteSelecionadoMoldes}>
                    <option value="">👤 Escolha um cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto mb-4 border-b pb-4 w-full">
                  <p className="text-[10px] font-black uppercase text-purple-600 ml-1">Selecione as Quantidades do Kit:</p>
                  {moldes.map(m => {
                    const qtd = quantidadesPedidoMoldes[m.id] || 0;
                    return (
                      <div key={m.id} className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center border w-full">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m.nome}</p>
                          <p className="text-[11px] text-slate-400">R$ {Number(m.precoVendaUnitario).toFixed(2)} un</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQuantidadesPedidoMoldes({ ...quantidadesPedidoMoldes, [m.id]: Math.max(0, qtd - 1) })} className="w-8 h-8 bg-white shadow-sm rounded-xl font-black text-slate-600 border">-</button>
                          <span className="font-bold text-sm w-6 text-center">{qtd}</span>
                          <button onClick={() => setQuantidadesPedidoMoldes({ ...quantidadesPedidoMoldes, [m.id]: qtd + 1 })} className="w-8 h-8 bg-purple-700 text-white rounded-xl font-black shadow-sm">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-4 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prazo de Entrega</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border font-bold text-xs" value={prazoPedidoMoldes} onChange={e => setPrazoPedidoMoldes(e.target.value)} />
                </div>

                <div className="mb-5 w-full">
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">📝 Observações do Combo</label>
                  <textarea placeholder="Ex: Entrada de 50%..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold border resize-none h-16" value={obsPedidoMoldes} onChange={e => setObsPedidoMoldes(e.target.value)} />
                </div>

                <div className="flex items-center justify-between border-t pt-5 w-full">
                  <div className="text-orange-500 font-black text-4xl">R$ {resumoPedidoPorMoldes.total}</div>
                  <div className="flex gap-1.5">
                    <button onClick={async () => {
                      if (Number(resumoPedidoPorMoldes.total) <= 0) return alert("Selecione a quantidade de algum item!");
                      const descItens = resumoPedidoPorMoldes.itens.map(i => `${i.qtd}x ${i.nome}`).join(' + ');
                      await addDoc(collection(db, "pedidos"), { nomeProd: descItens, preco: resumoPedidoPorMoldes.total, clienteId: clienteSelecionadoMoldes, prazo: prazoPedidoMoldes, obsPedido: obsPedidoMoldes, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente', userId: user.uid, moldesVinculados: resumoPedidoPorMoldes.itens });
                      setQuantidadesPedidoMoldes({}); setClienteSelecionadoMoldes(''); setObsPedidoMoldes(''); setPrazoPedidoMoldes(''); setActiveTab('pedidos'); alert("Orçamento via moldes salvo!");
                    }} className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">Fechar Pedido</button>
                    <button onClick={() => gerarPDF({ nomeProd: "Kit Personalizado Sob Medida", preco: resumoPedidoPorMoldes.total, clienteId: clienteSelecionadoMoldes, prazo: prazoPedidoMoldes, obsPedido: obsPedidoMoldes })} className="bg-purple-50 text-purple-700 p-4 rounded-2xl border"><Printer size={18}/></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FÁBRICA DE MOLDES */}
        {activeTab === 'moldes' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-xl border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><Calculator size={18}/> Salvar Novo Molde Estrutural</h2>
              <div className="mb-3 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Molde</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none border font-semibold" value={nomeMolde} onChange={e => setNomeMolde(e.target.value)} placeholder="Ex: Caixa Milk, Sacola G" />
              </div>

              <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-2 mb-4 w-full">
                <button onClick={() => setTipoPrecoMolde('auto')} className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${tipoPrecoMolde === 'auto' ? 'bg-purple-700 text-white shadow' : 'text-slate-400'}`}>🧮 Auto Pelo Sistema</button>
                <button onClick={() => setTipoPrecoMolde('manual')} className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${tipoPrecoMolde === 'manual' ? 'bg-purple-700 text-white shadow' : 'text-slate-400'}`}>✍️ Digitar Manual</button>
              </div>

              {tipoPrecoMolde === 'auto' ? (
                <>
                  <div className="mb-4 w-full">
                    <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">Insumos Fixos Usados (Por unidade)</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 border block" onChange={e => {
                      const m = materiais.find(item => item.id === e.target.value);
                      if (m) setMatsNoMolde([...matsNoMolde, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]);
                    }} value="">
                      <option value="">+ Vincular Material...</option>
                      {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                    <div className="space-y-2 w-full">
                      {matsNoMolde.map((m, i) => (
                        <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl text-xs font-bold text-purple-700 w-full">
                          <span>{m.nome}</span>
                          <div className="flex items-center gap-2">
                            <input type="number" step="any" className="w-16 bg-white rounded-lg p-1 text-center" value={m.qtdUsada} onChange={e => { const nova = [...matsNoMolde]; nova[i].qtdUsada = e.target.value; setMatsNoMolde(nova); }} />
                            <button onClick={() => setMatsNoMolde(matsNoMolde.filter((_, idx) => idx !== i))}><X size={14}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 w-full">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tempo Gasto (min)</label><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border text-center font-bold" value={tGastoMolde} onChange={e => setTGastoMolde(e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor da Hora (R$)</label><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border text-center font-bold" value={vHoraMolde} onChange={e => setVHoraMolde(e.target.value)} /></div>
                  </div>
                  <div className="mb-4 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lucro %</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold text-purple-700" value={lucroMolde} onChange={e => setLucroMolde(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="mb-4 bg-purple-50/50 p-4 rounded-3xl border border-purple-100 w-full">
                  <label className="text-[10px] font-black text-purple-700 uppercase ml-1">Preço Fixo da Unidade (R$)</label>
                  <input type="number" placeholder="Digite o valor final..." className="w-full p-4 bg-white rounded-2xl mt-1 border outline-none font-bold text-purple-700 text-base shadow-sm" value={precoManualMolde} onChange={e => setPrecoManualMolde(e.target.value)} />
                </div>
              )}

              <div className="bg-purple-50 p-4 rounded-2xl text-xs font-bold text-purple-700 flex justify-between items-center mb-4 w-full">
                <span>VALOR FINAL POR PEÇA:</span><span className="text-lg font-black text-purple-800">R$ {valorUnitarioDoMoldeGerado.toFixed(2)}</span>
              </div>
              <button onClick={async () => {
                if (!nomeMolde) return alert("Dê um nome ao molde!");
                const dados = { nome: nomeMolde, tGasto: tipoPrecoMolde === 'manual' ? '0' : tGastoMolde, vHora: tipoPrecoMolde === 'manual' ? '0' : vHoraMolde, custos: custosMolde, lucro: tipoPrecoMolde === 'manual' ? '0' : lucroMolde, precoVendaUnitario: valorUnitarioDoMoldeGerado, userId: user.uid, materiaisUsados: tipoPrecoMolde === 'manual' ? [] : matsNoMolde.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada) })) };
                if (moldeEditandoId) await updateDoc(doc(db, "moldes", moldeEditandoId), dados);
                else await addDoc(collection(db, "moldes"), dados);
                limparFormMolde(); alert("Molde estrutural salvo!");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl text-xs font-black uppercase tracking-wider">Salvar Molde Base</button>
            </div>
            <div className="space-y-2 w-full">
              {moldes.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-3xl border flex justify-between items-center w-full mb-2">
                  <div><p className="font-bold text-slate-800 text-sm">{m.nome}</p><p className="text-xs text-purple-600 font-bold">R$ {Number(m.precoVendaUnitario || 0).toFixed(2)} / un</p></div>
                  <div className="flex gap-1">
                    <button onClick={() => confirmarExcluir('molde', m.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTÓRICO DE PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico Orçamentos</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId || p.clienteSel);
               const ehPendente = p.status !== 'Vendido 💰';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">{cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span></p>
                        <p className="font-bold text-slate-700 text-sm">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">{p.qtdPed ? `(${p.qtdPed} un)` : ''}</span></p>
                     </div>
                     <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1 w-full">
                      {ehPendente && (
                        <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto active:scale-95"><CheckCircle size={14}/> Registrar Venda</button>
                      )}
                      <button onClick={() => carregarPedidoParaEdicao(p)} className="text-purple-600 p-2 bg-purple-50 rounded-xl"><Edit2 size={16}/></button>
                      <button onClick={() => gerarPDF(p)} className="text-orange-500 p-2 bg-orange-50 rounded-xl"><Printer size={16}/></button>
                      <button onClick={() => confirmarExcluir('pedido', p.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

        {/* GERENCIAR ARMÁRIO */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package size={20}/> Gerenciar Armário</h2>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Insumo</label>
              <input placeholder="Ex: Caneca Cerâmica" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="grid grid-cols-3 gap-3 mb-3 w-full">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Caixa/Rolo</label>
                  <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">Rendimento</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div><label className="text-[10px] font-bold text-purple-600 uppercase ml-1">Estoque Atual</label><input type="number" className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold text-purple-700" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-red-500 uppercase ml-1">Mínimo Alerta</label><input type="number" className="w-full p-4 bg-red-50 rounded-2xl outline-none text-center font-bold text-red-700" value={novoMat.qtdMinima} onChange={e => setNovoMat({...novoMat, qtdMinima: e.target.value})} /></div>
              </div>
              <div className="mb-6 w-full">
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block border" value={novoMat.unidade} onChange={e => setNovoMat({...novoMat, unidade: e.target.value})}>
                  <option value="un">📦 Unidade (un)</option><option value="Folha A4">📄 Folha A4</option><option value="m">📏 Metro (m)</option><option value="cm">📐 Centímetro (cm)</option>
                </select>
              </div>
              <button onClick={async () => {
                if(!novoMat.nome) return alert("Digite o nome!");
                const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), unidade: novoMat.unidade, qtdAtual: Number(novoMat.qtdAtual || 0), qtdMinima: Number(novoMat.qtdMinima || 0), userId: user.uid };
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d); else await addDoc(collection(db, "materiais"), d);
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' }); alert("Material salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar no Armário</button>
            </div>
            {materiais.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border w-full mb-2">
                <div><p className="font-bold text-slate-800">🟢 {m.nome}</p><p className="text-xs text-purple-700 font-bold">Estoque: {m.qtdAtual} {m.unidade}</p></div>
                <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}

        {/* CADASTRAR CLIENTES */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Gerenciar Clientes</h2>
              <input placeholder="Nome Comercial" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp com DDD" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { nome: novoCli.nome, zap: novoCli.zap, userId: user.uid });
                setNovoCli({ id: '', nome: '', zap: '' }); alert("Cliente Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border w-full mb-2 font-bold">
                <div><p className="text-slate-800 text-sm">{c.nome}</p><p className="text-xs text-slate-400 font-normal">{c.zap}</p></div>
                <button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}

        {/* TELA DE CONFIGURAÇÃO DO CATÁLOGO DE VITRINE */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-800 to-purple-600 p-6 rounded-[35px] text-white shadow-lg border border-purple-900 space-y-4 w-full">
              <div className="w-full">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200 flex items-center gap-1.5"><Share2 size={14}/> Seu Catálogo Público</h3>
                <div className="mt-2 bg-purple-900/40 p-3.5 rounded-2xl text-xs font-mono select-all break-all border border-purple-500/30 bg-black/10 w-full font-bold">{linkDoCatalogoDestaCliente}</div>
                <div onClick={copiarLinkCatalogo} className="mt-2.5 w-full bg-white text-purple-800 font-bold p-3 rounded-xl text-xs uppercase shadow flex items-center justify-center gap-2 cursor-pointer">Copiar Link do Catálogo</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><BookOpen size={18}/> Novo Item de Venda Fixa</h2>
              <div className="mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px] w-full">
                {novoProdCatalogo.urlImagem ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden">
                    <img src={novoProdCatalogo.urlImagem} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setNovoProdCatalogo(p => ({...p, urlImagem: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 w-full h-full flex justify-center"><Camera size={22} /><span className="text-xs font-bold uppercase tracking-wide text-[10px]">{subindoImagem ? 'Subindo Foto...' : '📸 Foto do Produto'}</span><input type="file" accept="image/*" className="hidden" onChange={handleUploadImagem} disabled={subindoImagem} /></label>
                )}
              </div>
              <input placeholder="Nome do Produto" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />
              <input type="number" placeholder="Preço Fixo de Venda (R$)" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-purple-700" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "produtos"), { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem || '', userId: user.uid });
                setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '' }); alert("Produto salvo!");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" disabled={subindoImagem}>Salvar no Catálogo 📖</button>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              {produtos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-[30px] flex gap-4 items-center border border-slate-100 shadow-sm w-full">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">{p.urlImagem ? <img src={p.urlImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm truncate">{p.nome}</p><p className="text-purple-700 font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p></div>
                  <button onClick={() => confirmarExcluir('produto', p.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MENU INFERIOR COMPACTO DE 3 BOTÕES (INÍCIO, ORÇAR, HISTÓRICO) */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-30 bg-transparent pointer-events-none">
        <div className="bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-[28px] flex justify-around items-center px-4 h-16 w-full max-w-xl pointer-events-auto border">
          <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'inicio' ? 'text-orange-500' : 'text-slate-300'}`}>
            <Home size={22} className={activeTab === 'inicio' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
          </button>
          <button onClick={() => setActiveTab('criar')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'criar' ? 'text-orange-500' : 'text-slate-300'}`}>
            <Plus size={22} className={activeTab === 'criar' ? 'stroke-[3]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Orçar</span>
          </button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab === 'pedidos' ? 'text-orange-500' : 'text-slate-300'}`}>
            <History size={22} className={activeTab === 'pedidos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </div>

    </div>
  );
}
