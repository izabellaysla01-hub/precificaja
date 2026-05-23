import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Printer, CheckCircle } from 'lucide-react';

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

const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => {
  const recuperarSenha = async () => {
    if (!email) return alert("Digite seu e-mail primeiro!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enviamos um link para o seu e-mail!");
    } catch (e) { alert("E-mail não encontrado."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center border border-slate-100">
        <h1 className="text-3xl font-black text-purple-700 mb-2">PrecificaJá 🚀</h1>
        <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-widest">Sua empresa lucrando mais</p>
        <input type="email" placeholder="Seu e-mail" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-purple-600" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-50 rounded-2xl mb-2 outline-none focus:ring-2 focus:ring-purple-600" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={recuperarSenha} className="text-[10px] text-purple-400 font-bold uppercase mb-6 block w-full text-right pr-2">Esqueci minha senha</button>
        <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 uppercase">{isRegistering ? 'Criar Conta Grátis' : 'Entrar no App'}</button>
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
  const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '' });
  
  const [novoProdCatalogo, setNovoProdCatalogo] = useState({ id: '', nome: '', precoVenda: '', urlImagem: '' });
  const [zapDonaConta, setZapDonaConta] = useState('');
  const [subindoImagem, setSubindoImagem] = useState(false);

  const setActiveTab = (tab: any) => { useStateActiveTab(tab); };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lojaId = params.get('loja');
    if (lojaId) {
      setIdLojaPublica(lojaId);
      setCarregandoPublico(true);
      getDoc(doc(db, "configuracoes_loja", lojaId)).then(docSnap => {
        if(docSnap.exists()) setZapDaLojaPublica(docSnap.data().whatsapp || '');
      });
      getDocs(query(collection(db, "produtos"), where("userId", "==", lojaId))).then(snapshot => {
        setProdutosPublicos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setCarregandoPublico(false);
      }).catch(() => setCarregandoPublico(false));
    }
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        // CORREÇÃO: Acesso ao Firestore simplificado
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
      const unsubM = onSnapshot(query(collection(db, "materiais"), where("userId", "==", user.uid)), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubP = onSnapshot(query(collection(db, "pedidos"), where("userId", "==", user.uid)), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubC = onSnapshot(query(collection(db, "clientes"), where("userId", "==", user.uid)), s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubPr = onSnapshot(query(collection(db, "produtos"), where("userId", "==", user.uid)), s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubM(); unsubP(); unsubC(); unsubPr(); };
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
    if (!nomeComprador.trim()) return alert("Por favor, digite seu nome!");
    const itensSelecionados = produtosPublicos.filter(p => carrinho[p.id] > 0);
    if (itensSelecionados.length === 0) return alert("Seu carrinho está vazio!");

    let textoPedido = `*NOVO PEDIDO VIA CATÁLOGO*%0A---%0A*Cliente:* ${nomeComprador.trim()}%0A%0A*Itens:*%0A`;
    let totalGeral = 0;
    itensSelecionados.forEach(p => {
      const qtd = carrinho[p.id];
      const sub = Number(p.precoVenda) * qtd;
      totalGeral += sub;
      textoPedido += `• ${qtd}x _${p.nome}_ — R$ ${sub.toFixed(2)}%0A`;
    });
    textoPedido += `---%0A*VALOR TOTAL:* R$ ${totalGeral.toFixed(2)}%0A---%0AAguardo confirmação!`;

    const numeroLimpo = zapDaLojaPublica.replace(/\D/g, '');
    window.open(numeroLimpo ? `https://wa.me/55${numeroLimpo}?text=${textoPedido}` : `https://wa.me/?text=${textoPedido}`, '_blank');
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSubindoImagem(true);
    try {
      const imagemRef = ref(storage, `produtos/${user.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(imagemRef, file);
      const urlDisponivel = await getDownloadURL(imagemRef);
      setNovoProdCatalogo(prev => ({ ...prev, urlImagem: urlDisponivel }));
      alert("Foto carregada com sucesso! 📸");
    } catch { alert("Erro ao subir a foto!"); }
    finally { setSubindoImagem(false); }
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
    } else { setMatsNoPed([]); }
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
    return { materiais: totalMateriais.toFixed(2), maoObra: totalMaoObra.toFixed(2), extras: totalExtras.toFixed(2), custoPeca: custoTotalPeca.toFixed(2), lucroLivre: isNaN(valorLucroLivre) ? "0.00" : valorLucroLivre.toFixed(2), final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual]);

  const gerarPDF = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataEmissao = p.data || new Date().toLocaleDateString('pt-BR');
    const hoje = new Date(); hoje.setDate(hoje.getDate() + 7);
    const dataValidade = hoje.toLocaleDateString('pt-BR');
    const dataPrazo = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const totalNum = Number(p.preco || 0);
    const qtdNum = Number(p.qtdPed || 1);
    const precoUnitario = (totalNum / qtdNum).toFixed(2);

    const antigo = document.getElementById('visualizador-pdf-tela');
    if (antigo) document.body.removeChild(antigo);

    const elemento = document.createElement('div');
    elemento.id = "visualizador-pdf-tela";
    elemento.style.position = "fixed"; elemento.style.top = "0"; elemento.style.left = "0";
    elemento.style.width = "100vw"; elemento.style.height = "100vh";
    elemento.style.backgroundColor = "white"; elemento.style.overflowY = "scroll"; elemento.style.zIndex = "99999";

    elemento.innerHTML = `
      <div style="position: fixed; top: 15px; right: 15px; background-color: #ef4444; color: white; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 999999;" onclick="const e = document.getElementById('visualizador-pdf-tela'); if(e) document.body.removeChild(e);">✕</div>

      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto; background-color: white;">
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
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between;">
          <div><strong>Forma de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO</div></div>
          <div><strong>Condições de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp</div></div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
          Obrigado pela preferência! Caso tenha dúvidas, entre em contato pelo nosso WhatsApp.
        </div>
      </div>
    `;
    document.body.appendChild(elemento);
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

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    window.open(`https://wa.me/55${cli?.zap ? cli.zap.replace(/\D/g, '') : ''}?text=${msg}`, '_blank');
  };
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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-red-500 bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"><LogOut size={14}/> SAIR</button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {/* TELA INICIAL: RECONSTRUÍDA COM OS 4 QUADRADINHOS E ROTAS CORRIGIDAS */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2">
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 p-6 rounded-[35px] shadow-lg text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Faturamento Realizado</p>
              <h2 className="text-4xl font-black mt-1 tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
              <p className="text-[11px] text-purple-200 font-medium mt-2 opacity-80">📈 Dinheiro gerado de pedidos marcados como vendidos</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-32">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500"><History size={20}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes} <span className="text-xs font-normal text-slate-400">Abertos</span></p>
                </div>
              </div>

              <div onClick={() => setActiveTab('catalogo')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-32">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500"><BookOpen size={20}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catálogo</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{produtos.length} <span className="text-xs font-normal text-slate-400">itens</span></p>
                </div>
              </div>

              <div onClick={() => setActiveTab('materiais')} className={`p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-32 ${dashboardMetrics.criticos > 0 ? 'bg-red-50/40 border-red-100' : 'bg-white'}`}>
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500"><Package size={20}/></div>
                <div>
                  <p style={{ margin: 0 }} className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Falta Reposição</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{dashboardMetrics.criticos} <span className="text-xs font-normal text-slate-400">itens</span></p>
                </div>
              </div>

              <div onClick={() => setActiveTab('clientes')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-32">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500"><User size={20}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Comercial</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{dashboardMetrics.totalClientes} <span className="text-xs font-normal text-slate-400">clientes</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] border shadow-sm text-center space-y-4">
              <p className="text-sm font-bold text-slate-600">Deseja simular novos custos?</p>
              <button onClick={() => { limparCalculadora(); setActiveTab('criar'); }} className="w-full max-w-sm mx-auto bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 transition-all">
                <Calculator size={16}/> Abrir Calculadora
              </button>
            </div>
          </div>
        )}
        {/* TELA DE CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2">
            <div className="bg-gradient-to-tr from-purple-800 to-purple-600 p-6 rounded-[35px] text-white shadow-lg border border-purple-900 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200">Seu Catálogo Público</h3>
                <div className="mt-2 bg-purple-900/40 p-3.5 rounded-2xl text-xs font-mono select-all break-all border border-purple-500/30">
                  {linkDoCatalogoDestaCliente}
                </div>
                <button onClick={copiarLinkCatalogo} className="mt-2.5 w-full bg-white text-purple-800 font-bold p-3 rounded-xl text-xs uppercase shadow">Copiar Link</button>
              </div>
              <div className="border-t border-purple-500/30 pt-3">
                <label className="text-[10px] font-black uppercase text-purple-200 block mb-1">📱 Seu WhatsApp (Com DDD)</label>
                <div className="flex gap-2">
                  <input placeholder="11999999999" className="flex-1 p-3 bg-black/20 text-white rounded-xl text-xs font-bold outline-none" value={zapDonaConta} onChange={e => setZapDonaConta(e.target.value)} />
                  <button onClick={async () => {
                    await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true });
                    alert("WhatsApp salvo! 🚀");
                  }} className="bg-orange-500 text-white text-xs font-black uppercase px-4 rounded-xl shadow">Salvar</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 uppercase text-xs tracking-widest">Novo Item de Venda</h2>
              <div className="mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px]">
                {novoProdCatalogo.urlImagem ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden"><img src={novoProdCatalogo.urlImagem} className="w-full h-full object-cover" /><button onClick={() => setNovoProdCatalogo(p => ({...p, urlImagem: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button></div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400">
                    <Camera size={22} /><span className="text-[10px] font-bold uppercase">{subindoImagem ? 'Subindo...' : '📸 Foto'}</span>
                    <input type="file" className="hidden" onChange={handleUploadImagem} />
                  </label>
                )}
              </div>
              <input placeholder="Nome" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />
              <input type="number" placeholder="Preço (R$)" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-purple-700" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />
              <button onClick={async () => {
                const d = { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem, userId: user.uid };
                if (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d); else await addDoc(collection(db, "produtos"), d);
                setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '' });
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs">Salvar</button>
            </div>
            
            {produtos.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-[30px] flex gap-4 items-center border shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300">{p.urlImagem ? <img src={p.urlImagem} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{p.nome}</p>
                  <p className="text-purple-700 font-black text-sm">R$ {Number(p.precoVenda).toFixed(2)}</p>
                </div>
                <button onClick={() => venderItemDiretoDoCatalogo(p)} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase">Vender</button>
              </div>
            ))}
          </div>
        )}

        {/* CALCULADORA */}
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <h2 className="text-purple-700 font-bold mb-6 uppercase text-xs tracking-widest">Nova Precificação</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
               <div className="col-span-2"><input placeholder="Produto" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} /></div>
               <div><input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} /></div>
            </div>
            <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full mb-4" onChange={e => setClienteSel(e.target.value)} value={clienteSel}><option value="">👤 Cliente...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
            <div className="text-orange-500 font-black text-4xl tracking-tighter mb-4 text-center">R$ {resumenFinanceiro.final}</div>
            <button onClick={async () => {
              const dPedido = { nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, userId: user.uid, status: 'Pendente', data: new Date().toLocaleDateString('pt-BR') };
              await addDoc(collection(db, "pedidos"), dPedido);
              limparCalculadora(); setActiveTab('pedidos');
            }} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black uppercase text-xs">Salvar Pedido</button>
          </div>
        )}

        {/* HISTÓRICO */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2">
            {pedidos.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center">
                <div><p className="font-bold text-slate-700">{p.nomeProd}</p><p className="text-purple-600 font-black">R$ {p.preco}</p></div>
                <div className="flex gap-2">
                    <button onClick={() => gerarPDF(p)} className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Printer size={18}/></button>
                    <button onClick={() => confirmarExcluir('pedido', p.id)} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MENU INFERIOR ESTÁVEL */}
      <div className="fixed bottom-6 w-full flex justify-around px-2 z-50">
          <button onClick={() => setActiveTab('inicio')} className="p-4 bg-white rounded-2xl text-slate-300"><Home/></button>
          <button onClick={() => setActiveTab('materiais')} className="p-4 bg-white rounded-2xl text-slate-300"><Package/></button>
          <button onClick={() => setActiveTab('criar')} className="p-5 bg-orange-500 rounded-[22px] text-white shadow-xl"><Plus/></button>
          <button onClick={() => setActiveTab('catalogo')} className="p-4 bg-white rounded-2xl text-slate-300"><BookOpen/></button>
          <button onClick={() => setActiveTab('clientes')} className="p-4 bg-white rounded-2xl text-slate-300"><User/></button>
          <button onClick={() => setActiveTab('pedidos')} className="p-4 bg-white rounded-2xl text-slate-300"><History/></button>
      </div>
    </div>
  );
}
