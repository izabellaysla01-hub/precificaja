import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu, FolderOpen } from 'lucide-react';

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
        <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-2 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(password)} />
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
  const [modoOrcamento, setModoOrcamento] = useState<'selecao' | 'livre' | 'via_molde'>('selecao');

  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [moldes, setMoldes] = useState<any[]>([]); 

  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [moldeSelecionadoParaOrcamento, setModelSelecionadoParaOrcamento] = useState<any>(null);

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
    setIsMenuOpen(false);
    if (tab === 'criar') setModoOrcamento('selecao'); 
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
        unsubMateriais();
        unsubPedidos();
        unsubClientes();
        unsubProdutos();
        unsubMoldes();
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

  const calcularPrecoBase = (listaMats: any[], valorH: string, tempoG: string, custosAdicionais: any, prcetLucro: string, quantidade: string) => {
    const totalMateriais = listaMats.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    const totalMaoObra = (Number(valorH || 0) / 60) * Number(tempoG || 0);
    const totalExtras = Number(custosAdicionais.embalagem || 0) + Number(custosAdicionais.impressao || 0) + Number(custosAdicionais.energia || 0) + Number(custosAdicionais.outros || 0);
    
    const custoTotalPeca = totalMateriais + totalMaoObra + totalExtras;
    const custoTotalLote = custoTotalPeca * Number(quantidade || 1);
    const valorLucroLivre = custoTotalLote * (Number(prcetLucro || 0) / 100);
    const precoFinalCalculado = (custoTotalLote + valorLucroLivre);

    return {
      materiais: totalMateriais.toFixed(2),
      maoObra: totalMaoObra.toFixed(2),
      extras: totalExtras.toFixed(2),
      custoCentoOuPeca: custoTotalPeca.toFixed(2),
      lucroLivre: valorLucroLivre.toFixed(2),
      totalSemDesconto: precoFinalCalculado
    };
  };

  const resumenFinanceiro = useMemo(() => {
    if (modoOrcamento === 'via_molde' && moldeSelecionadoParaOrcamento) {
      const baseMolde = calcularPrecoBase(
        moldeSelecionadoParaOrcamento.materiaisUsados || [],
        moldeSelecionadoParaOrcamento.vHora,
        moldeSelecionadoParaOrcamento.tGasto,
        moldeSelecionadoParaOrcamento.custos,
        moldeSelecionadoParaOrcamento.lucro,
        qtdPed
      );
      const precoFinalComDesconto = baseMolde.totalSemDesconto - Number(desconto || 0);
      return { ...baseMolde, final: isNaN(precoFinalComDesconto) ? "0.00" : precoFinalComDesconto.toFixed(2) };
    }

    const calculoLivre = calcularPrecoBase(matsNoPed, vHora, tGasto, custos, lucro, qtdPed);
    const precoFinalCalculado = calculoLivre.totalSemDesconto - Number(desconto || 0);

    return { 
      ...calculoLivre,
      custoPeca: calculoLivre.custoCentoOuPeca,
      final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) 
    };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, discount = desconto, modoOrcamento, moldeSelecionadoParaOrcamento]);

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
      await deleteDoc(doc(db, tipo === 'pedido' ? "pedidos" : tipo === 'cliente' ? "clientes" : tipo === 'produto' ? "produtos" : tipo === 'molde' ? "moldes" : "materiais", id));
    }
  };

  const confirmarVendaPedido = async (pedido: any) => {
    try {
      if (pedido.materiaisUsados && pedido.materiaisUsados.length > 0) {
        for (const m of pedido.materiaisUsados) {
          const matDoBanco = materiais.find(item => item.id === m.id);
          if (matDoBanco) {
            const estoqueAtual = Number(matDoBanco.qtdAtual || 0);
            const gastoTotalLote = Number(m.qtdUsada || 0) * Number(pedido.qtdPed || 1);
            
            await updateDoc(doc(db, "materiais", m.id), { 
              qtdAtual: Math.max(0, estoqueAtual - gastoTotalLote) 
            });
          }
        }
      }
      await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰' });
      alert("Venda confirmada! Estoque de insumos atualizado com sucesso no armário! 📦📉");
    } catch (error) {
      alert("Erro ao processar baixa de estoque.");
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
    setModelSelecionadoParaOrcamento(null);
    setObsPedido('');
  };

  // 🕵️ CORREÇÃO CRÍTICA: Impedindo conflito de dados na edição do orçamento livre
  const carregarPedidoParaEdicao = (p: any) => {
    setPedidoEditandoId(p.id);
    setNomeProd(p.nomeProd || '');
    setQtdPed(p.qtdPed || '1');
    setDesconto(p.desconto || '0');
    setPrazo(p.prazo || '');
    setClienteSel(p.clienteId || '');
    setObsPedido(p.obsPedido || '');

    if (p.moldeId) {
      const moldeBase = moldes.find(m => m.id === p.moldeId);
      setModelSelecionadoParaOrcamento(moldeBase || { custos: p.custos, vHora: p.vHora, tGasto: p.tGasto, lucro: p.lucro, materiaisUsados: p.materiaisUsados });
      setModoOrcamento('via_molde');
    } else {
      setModelSelecionadoParaOrcamento(null); // Limpa resquício de molde para destravar a tela livre
      setVHora(p.vHora || '9');
      setTGasto(p.tGasto || '60');
      setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
      setLucro(p.lucro || '100');
      setModoOrcamento('livre');

      if (p.materiaisUsados && p.materiaisUsados.length > 0) {
        const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
          const matDoArmario = materiais.find(item => item.id === mSalvo.id);
          return {
            id: mSalvo.id,
            nome: mSalvo.nome,
            qtdUsada: Number(mSalvo.qtdUsada || 1),
            valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0),
            qtd: matDoArmario ? Number(matDoArmario.qtd) : 1,
            unidade: mSalvo.unidade || 'un'
          };
        });
        setMatsNoPed(listaReconstruida);
      } else {
        setMatsNoPed([]);
      }
    }
    setActiveTab('criar');
  };

  if (!user && !loading && !idLojaPublica) {
    return <Login isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleAuth={handleAuth} />;
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Iniciando Segurança... 🛡️</div>;

  // VITRINE PÚBLICA
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

  const renderCalculadoraForm = () => {
    if (modoOrcamento === 'selecao') {
      return (
        <div className="space-y-4 pt-2 w-full">
          <h2 className="text-purple-700 font-black text-center uppercase text-sm tracking-widest mb-6">Como deseja orçar? 👀</h2>
          
          <div onClick={() => { limparCalculadora(); setModoOrcamento('livre'); }} 
               className="bg-white p-6 rounded-[35px] border-2 border-slate-100 shadow-sm hover:border-orange-400 cursor-pointer transition-all flex items-center gap-4 w-full">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500"><Calculator size={24}/></div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 text-base">Orçamento Livre</h4>
              <p className="text-xs text-slate-400 mt-0.5">Calcule um produto novo ou totalmente personalizado do zero.</p>
            </div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2 mt-4 text-left">Ou usar Moldes estruturados</div>

          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto w-full">
            {moldes.length === 0 ? (
              <p className="text-slate-400 text-xs italic pl-2 text-left">Nenhum molde salvo. Cadastre na aba "Meus Moldes" no menu lateral.</p>
            ) : (
              moldes.map(m => (
                <div key={m.id} onClick={() => {
                  limparCalculadora();
                  setModelSelecionadoParaOrcamento(m);
                  setNomeProd(m.nomeProd);
                  setVHora(m.vHora);
                  setTGasto(m.tGasto);
                  setCustos(m.custos);
                  setLucro(m.lucro);
                  setModoOrcamento('via_molde');
                }} className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm hover:border-purple-500 cursor-pointer transition-all flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><FolderOpen size={20}/></div>
                    <div className="text-left">
                      <span className="font-black text-slate-800 text-sm block">{m.nomeProd}</span>
                      <span className="text-[10px] text-purple-400 uppercase font-black tracking-wider">Lucro: {m.lucro}% • Mão de Obra: {m.tGasto}min</span>
                    </div>
                  </div>
                  <span className="text-purple-600 font-bold text-xs bg-purple-50 px-3 py-1.5 rounded-xl uppercase">Selecionar</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2 w-full">
        <div className="flex justify-between items-center mb-5 w-full border-b pb-3">
          <button onClick={() => setModoOrcamento('selecao')} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold uppercase">
            ⬅️ Voltar Opções
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700">
            {modoOrcamento === 'livre' ? '✨ Modo Livre' : '📂 Baseado em Molde'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 w-full">
           <div className="col-span-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto</label>
              <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={nomeProd} onChange={e => setNomeProd(e.target.value)} disabled={modoOrcamento === 'via_molde'} />
           </div>
           <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center font-bold" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
           </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-4 w-full text-left">
           <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
              <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full block font-bold" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                 <option value="">👤 Escolher Cliente...</option>
                 {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
           </div>
           <div>
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Prazo de Entrega</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block" value={prazo} onChange={e => setPrazo(e.target.value)} />
           </div>
        </div>

        {modoOrcamento === 'livre' ? (
          <>
            <div className="mb-4 w-full text-left">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados</label>
               <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 block font-bold" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]);
               }} value="">
                  <option value="">+ Adicionar Insumo...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.unidade || 'un'})</option>)}
               </select>
               <div className="space-y-2 w-full">
                  {matsNoPed.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl text-purple-700 font-bold text-xs w-full">
                      <span>{m.nome}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-16 bg-white rounded-lg p-1 text-center font-bold" value={m.qtdUsada} onChange={e => {
                           const nova = [...matsNoPed]; nova[i].qtdUsada = e.target.value; setMatsNoPed(nova);
                        }} />
                        <span className="text-[10px] text-purple-500">{m.unidade}</span>
                        <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 w-full text-left">
              <div className="w-full">
                <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Tempo Gasto (min)</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={tGasto} onChange={e => setTGasto(e.target.value)} />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Valor da Hora (R$)</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={vHora} onChange={e => setVHora(e.target.value)} />
              </div>
            </div>
            <div className="mb-4 w-full text-left">
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
            <div className="mb-4 w-full text-left">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Margem Lucro %</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-3xl mb-4 text-xs space-y-2 w-full text-left">
            <span className="font-black text-purple-700 uppercase block text-[10px]">🔒 Estrutura de Custos Fixada pelo Molde</span>
            <p className="text-slate-600">Lucro programado: <strong>{moldeSelecionadoParaOrcamento?.lucro}%</strong></p>
            <p className="text-slate-600">Tempo de montagem: <strong>{moldeSelecionadoParaOrcamento?.tGasto} minutos</strong></p>
            <p className="text-slate-600">Insumos atrelados: <strong>{moldeSelecionadoParaOrcamento?.materiaisUsados?.length || 0} itens salvos</strong></p>
          </div>
        )}

        <div className="mb-4 w-full text-left">
           <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total do Lote (R$)</label>
           <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
        </div>

        <div className="mb-6 w-full text-left">
           <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">📝 Observações e Condições</label>
           <textarea placeholder="Ex: Entrada de 50% via pix." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold resize-none h-16" value={obsPedido} onChange={e => setObsPedido(e.target.value)} />
        </div>

        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 text-xs space-y-2.5 w-full text-left">
          <p className="font-black text-purple-700 uppercase tracking-wider text-[10px] mb-1">📋 Resumo Financeiro Projetado</p>
          <div className="flex justify-between text-slate-500 w-full"><span>Soma Materiais base:</span><span className="font-bold">R$ {resumenFinanceiro.materiais}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Soma Mão de Obra:</span><span className="font-bold">R$ {resumenFinanceiro.maoObra}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Custos Fixos / Extras:</span><span className="font-bold">R$ {resumenFinanceiro.extras}</span></div>
          <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1 w-full"><span>Custo por unidade:</span><span className="text-purple-700">R$ {resumenFinanceiro.custoCentoOuPeca}</span></div>
          <div className="flex justify-between text-emerald-600 font-bold w-full"><span>Lucro Limpo Estimado:</span><span>R$ {resumenFinanceiro.lucroLivre}</span></div>
        </div>

        <div className="flex items-center justify-between border-t pt-6 w-full">
          <div className="text-orange-500 font-black text-3xl tracking-tighter">R$ {resumenFinanceiro.final}</div>
          <div className="flex gap-2">
            <button onClick={async () => {
               if(!nomeProd) return alert("Digite o nome do produto!");
               const dadosPedido = { 
                 nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, vHora, tGasto, custos, lucro, desconto, userId: user.uid,
                 obsPedido: obsPedido, moldeId: modoOrcamento === 'via_molde' ? moldeSelecionadoParaOrcamento.id : null,
                 materiaisUsados: modoOrcamento === 'via_molde' ? (moldeSelecionadoParaOrcamento.materiaisUsados || []) : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) }))
               };
               if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
               else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente', userId: user.uid });
               limparCalculadora(); setActiveTab('pedidos');
               alert("Orçamento cadastrado com sucesso! 🎉💼");
            }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar</button>
            <button onClick={() => gerarPDF({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, obsPedido})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg"><Printer size={18}/></button>
            <button onClick={() => enviarZap({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-4 rounded-[22px] shadow-lg"><MessageCircle size={18}/></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700 w-full relative overflow-x-hidden">
      
      {/* MENU HAMBÚRGUER */}
      <div className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`w-72 bg-white h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> Menu PrecificaJá</div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
            </div>
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'inicio' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={16}/> Início</button>
              <button onClick={() => setActiveTab('criar')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'criar' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Plus size={16}/> Orçar Pedido</button>
              <button onClick={() => setActiveTab('moldes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'moldes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><FolderOpen size={16}/> Meus Moldes Padrão</button>
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><History size={16}/> Histórico Orçamentos</button>
              <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Package size={16}/> Armário / Insumos</button>
              <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><User size={16}/> Meus Clientes</button>
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
        
        {/* TELA DE INÍCIO COM OS ATALHOS RAPIDOS */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 p-6 rounded-[35px] shadow-lg text-white w-full text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Faturamento Realizado</p>
              <h2 className="text-4xl font-black mt-1 tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
            </div>

            <div onClick={() => { limparCalculadora(); setModoOrcamento('selecao'); setActiveTab('criar'); }} 
                 className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-[35px] shadow-md cursor-pointer text-white flex justify-between items-center w-full">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Área de Vendas</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Criar Novo Orçamento 🚀</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Plus size={22}/></div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div onClick={() => setActiveTab('moldes')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer w-full text-left">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3"><FolderOpen size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moldes Salvos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{moldes.length}</p>
              </div>
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer w-full text-left">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3"><History size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              <div onClick={() => setActiveTab('materiais')} className={`p-4 bg-white rounded-3xl border shadow-sm cursor-pointer text-left ${dashboardMetrics.criticos > 0 ? 'border-red-200 bg-red-50/20' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-2"><Package size={16}/></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Armário / Estoque</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{materiais.length}</p>
              </div>

              <div onClick={() => setActiveTab('catalogo')} className="p-4 bg-white rounded-3xl border shadow-sm cursor-pointer text-left">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 mb-2"><BookOpen size={16}/></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Catálogo Vitrine</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{produtos.length}</p>
              </div>

              <div onClick={() => setActiveTab('clientes')} className="p-4 bg-white rounded-3xl border shadow-sm cursor-pointer text-left">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 mb-2"><User size={16}/></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Clientes</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{dashboardMetrics.totalClientes}</p>
              </div>
            </div>

          </div>
        )}

        {/* MEUS MOLDES */}
        {activeTab === 'moldes' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><FolderOpen size={18}/> Cadastrar Molde Padrão</h2>
              
              <div className="mb-3 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Molde Estruturado</label>
                <input placeholder="Ex: Caixa Milk" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
              </div>

              <div className="mb-4 text-left">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Insumos que esse Molde Gasta</label>
                 <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 font-bold" onChange={e => {
                    const m = materiais.find(item => item.id === e.target.value);
                    if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]);
                 }} value="">
                    <option value="">+ Vincular Material...</option>
                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                 </select>
                 <div className="space-y-1.5 w-full">
                    {matsNoPed.map((m, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs font-bold w-full">
                        <span>{m.nome}</span>
                        <div className="flex items-center gap-1.5">
                          <input type="number" className="w-14 bg-white rounded-lg p-1 text-center font-bold" value={m.qtdUsada} onChange={e => {
                             const nova = [...matsNoPed]; nova[i].qtdUsada = e.target.value; setMatsNoPed(nova);
                          }} />
                          <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={14}/></button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tempo de Produção (min)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={tGasto} onChange={e => setTGasto(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor da sua Hora (R$)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={vHora} onChange={e => setVHora(e.target.value)} />
                </div>
              </div>

              <div className="mb-3 text-left">
                <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">📦 Extras embutidos por unidade (R$)</label>
                <div className="grid grid-cols-4 gap-2 w-full">
                  {[{id:'embalagem',label:'EMB.'},{id:'impressao',label:'TINTA.'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTRO'}].map(c=>(
                    <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                      <span className="text-[7px] font-black text-slate-300 mb-1">{c.label}</span>
                      <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sua Porcentagem de Lucro %</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-purple-700" value={lucro} onChange={e => setLucro(e.target.value)} />
              </div>

              {/* 🔒 SEGURANÇA MOLDES: Enviando dados vinculados ao ID do usuário autenticado */}
              <button onClick={async () => {
                if(!nomeProd) return alert("Dê um nome para o molde!");
                try {
                  const d = { 
                    nomeProd, vHora, tGasto, custos, lucro, userId: user.uid,
                    materiaisUsados: matsNoPed.map(m => ({ id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: Number(m.qtdUsada || 1) }))
                  };
                  await addDoc(collection(db, "moldes"), d);
                  limparCalculadora();
                  alert("Molde salvo com sucesso no banco de dados! 📂✨");
                } catch {
                  alert("Erro de conexão ao salvar molde.");
                }
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                Salvar Estrutura do Molde
              </button>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2 text-left">Seus Moldes Ativos</h3>
            <div className="space-y-2 w-full">
              {moldes.map(m => {
                const calculoBaseUnitario = calcularPrecoBase(m.materiaisUsados || [], m.vHora, m.tGasto, m.custos, m.lucro, "1");
                return (
                  <div key={m.id} className="bg-white p-4 rounded-3xl flex justify-between items-center border shadow-sm w-full text-left">
                    <div>
                      <p className="font-bold text-slate-800">{m.nomeProd}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Preço sugerido unitário: <span className="text-purple-700">R$ {Number(calculoBaseUnitario.totalSemDesconto).toFixed(2)}</span></p>
                    </div>
                    <button onClick={() => confirmarExcluir('molde', m.id)} className="text-red-300 p-2"><Trash2 size={18}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ORÇAR PEDIDO */}
        {activeTab === 'criar' && renderCalculadoraForm()}

        {/* HISTÓRICO */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               const ehPendente = p.status !== 'Vendido 💰';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full text-left">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">
                          {cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span>
                        </p>
                        <p className="font-bold text-slate-700 text-sm">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">({p.qtdPed || 1} un)</span></p>
                     </div>
                     <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1 w-full">
                      {ehPendente && (
                        <>
                          <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto"><CheckCircle size={16}/> Confirmar Venda</button>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">Rende Quantos?</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div>
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">Estoque Atual</label>
                  <input type="number" className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold text-purple-700" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Mínimo Alerta</label>
                  <input type="number" className="w-full p-4 bg-red-50 rounded-2xl outline-none text-center font-bold text-red-700" value={novoMat.qtdMinima} onChange={e => setNovoMat({...novoMat, qtdMinima: e.target.value})} />
                </div>
              </div>
              <div className="mb-6 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unidade de Medida</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block mt-1" value={novoMat.unidade} onChange={e => setNovoMat({...novoMat, unidade: e.target.value})}>
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
                <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border w-full mb-2 text-left">
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
           <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Gerenciar Clientes</h2>
              <input placeholder="Nome Comercial" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-bold" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp com DDD" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none font-bold" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                if(!novoCli.nome) return alert("Digite o nome do cliente!");
                if(novoCli.id) await updateDoc(doc(db, "clientes", novoCli.id), { nome: novoCli.nome, zap: novoCli.zap, userId: user.uid });
                else await addDoc(collection(db, "clientes"), { nome: novoCli.nome, zap: novoCli.zap, userId: user.uid });
                setNovoCli({ id: '', nome: '', zap: '' }); 
                alert("Cliente Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm font-bold w-full mb-2 text-left">
                <div className="flex flex-col ml-2"><span className="text-slate-800">{c.nome}</span><span className="text-xs text-slate-400 font-normal">{c.zap ? `📱 ${c.zap}` : 'Sem número'}</span></div>
                <div className="flex gap-1">
                  <button onClick={() => setNovoCli({ id: c.id, nome: c.nome, zap: c.zap || '' })} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                  <button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATÁLOGO VITRINE */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-800 to-purple-600 p-6 rounded-[35px] text-white shadow-lg border border-purple-900 space-y-4 w-full text-left">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200 flex items-center gap-1.5"><Share2 size={14}/> Seu Catálogo Público</h3>
                <p className="text-xs text-purple-100 mt-1 opacity-90">Link exclusivo para enviar aos seus clientes:</p>
                <div className="mt-2 bg-purple-900/40 p-3.5 rounded-2xl text-xs font-mono select-all break-all border border-purple-500/30 bg-black/10 w-full font-bold">
                  {linkDoCatalogoDestaCliente}
                </div>
                <div onClick={copiarLinkCatalogo} className="mt-2.5 w-full bg-white text-purple-800 font-bold p-3 rounded-xl text-xs uppercase shadow flex items-center justify-center gap-2 cursor-pointer">
                  <Copy size={14}/> Copiar Link do Catálogo
                </div>
              </div>
              <div className="border-t border-purple-500/30 pt-3">
                <label className="text-[10px] font-black uppercase text-purple-200 block mb-1">📱 Seu WhatsApp de Vendas (Com DDD)</label>
                <div className="flex gap-2 w-full">
                  <input placeholder="Ex: 11999999999" className="flex-1 p-3 bg-black/20 text-white rounded-xl text-xs font-bold border border-purple-500/30 outline-none" value={zapDonaConta} onChange={e => setZapDonaConta(e.target.value)} />
                  <button onClick={async () => {
                    if(!zapDonaConta.trim()) return alert("Digite o número primeiro!");
                    try {
                      await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true });
                      alert("WhatsApp de vendas salvo com sucesso! 🚀");
                    } catch { alert("Erro ao salvar número."); }
                  }} className="bg-orange-500 text-white text-xs font-black uppercase px-4 rounded-xl">Salvar</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full text-left">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><BookOpen size={18}/> Novo Item de Venda Fixa</h2>
              <div className="mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px] w-full">
                {novoProdCatalogo.urlImagem ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden">
                    <img src={novoProdCatalogo.urlImagem} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setNovoProdCatalogo(p => ({...p, urlImagem: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors w-full h-full justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-purple-600"><Camera size={22} /></div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">{subindoImagem ? 'Subindo Foto...' : '📸 Adicionar Foto do Produto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImagem} disabled={subindoImagem} />
                  </label>
                )}
              </div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Produto</label>
              <input placeholder="Ex: Caneca Alça Coração" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-bold" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Fixo de Venda (R$)</label>
              <input type="number" placeholder="Ex: 35.00" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-purple-700" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />
              <button onClick={async () => {
                if(!novoProdCatalogo.nome || !novoProdCatalogo.precoVenda) return alert("Preencha o nome e o preço!");
                const d = { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem || '', userId: user.uid };
                if (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d);
                else await addDoc(collection(db, "produtos"), d);
                setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '' });
                alert("Produto salvo no catálogo!");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" disabled={subindoImagem}>Salvar no Catálogo 📖</button>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              {produtos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-[30px] flex gap-4 items-center border border-slate-100 shadow-sm w-full text-left">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                    {p.urlImagem ? <img src={p.urlImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{p.nome}</p>
                    <p className="text-purple-700 font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => {
                      limparCalculadora();
                      setNomeProd(p.nome);
                      setModoOrcamento('livre');
                      setActiveTab('criar');
                    }} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase">Vender 🛍️</button>
                    <button onClick={() => deleteDoc(doc(db, "produtos", p.id))} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MENU INFERIOR FIXO */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-30 bg-transparent pointer-events-none">
        <div className="bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-[28px] flex justify-around items-center px-4 h-16 w-full max-w-xl pointer-events-auto border">
          <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'inicio' ? 'text-orange-500' : 'text-slate-300'}`}>
            <Home size={22} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
          </button>
          <button onClick={() => { limparCalculadora(); setModoOrcamento('selecao'); setActiveTab('criar'); }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'criar' ? 'text-orange-500' : 'text-slate-300'}`}>
            <Plus size={22} className="stroke-[3]" />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Orçar</span>
          </button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'pedidos' ? 'text-orange-500' : 'text-slate-300'}`}>
            <History size={22} className="stroke-[2.5]" />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </div>

    </div>
  );
}
