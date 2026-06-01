import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu, Search } from 'lucide-react';

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

  const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo' | 'balcao' | 'financeiro'>('inicio');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);

  // NOVO: Estado para a barra de pesquisa de materiais
  const [pesquisaMateriais, setPesquisaMateriais] = useState('');

  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

  const [nomeProd, setNomeProd] = useState('');
  const [qtdPed, setQtdPed] = useState('1');
  const [matsNoPed, setMatsNoPed] = useState<any[]>([]);
  const [vHora, setVHora] = useState('9');
  const [tGasto, setTGasto] = useState('60');
  const [custos, setCustos] = useState({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<string[]>([]);
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

  // Módulo opcional de estrutura financeira fixo e maquinário
  const [financasFixo, setFinancasFixo] = useState({ salario: '0', aluguel: '0', internet: '0', luz: '0', outros: '0', diasTrabalho: '20', horasDia: '8' });
  const [novoEquipamento, setNovoEquipamento] = useState({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });

  const [carrinhoInterno, setCarrinhoInterno] = useState<{ [key: string]: number }>({});
  const [clienteBalcao, setClienteBalcao] = useState('');
  const [nomeKitBalcao, setNomeKitBalcao] = useState('');
  const [prazoBalcao, setPrazoBalcao] = useState('');

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
      const unsubMaterials = onSnapshot(qMateriais, s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      const unsubPedidos = onSnapshot(qPedidos, s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
      const unsubClientes = onSnapshot(qClientes, s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qProdutos = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubProdutos = onSnapshot(qProdutos, s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      // Carrega as configurações de custos automáticos e updates o estado vHora se existirem
      const qConfigFin = doc(db, "configuracoes_financeiras", user.uid);
      getDoc(qConfigFin).then(snap => {
        if (snap.exists()) {
          const dadosFin = snap.data() as any;
          setFinancasFixo(dadosFin);
          
          const dias = Number(dadosFin.diasTrabalho || 20);
          const horas = Number(dadosFin.horasDia || 8);
          const totalHorasMes = dias * horas || 160;
          const salario = Number(dadosFin.salario || 0);
          const custosMes = Number(dadosFin.aluguel || 0) + Number(dadosFin.internet || 0) + Number(dadosFin.luz || 0) + Number(dadosFin.outros || 0);
          
          if (salario + custosMes > 0) {
            const horaCalculada = (salario + custosMes) / totalHorasMes;
            setVHora(horaCalculada.toFixed(2));
          }
        }
      });

      const qEquipamentos = query(collection(db, "equipamentos"), where("userId", "==", user.uid));
      const unsubEquipamentos = onSnapshot(qEquipamentos, s => setEquipamentos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      return () => {
        unsubMaterials();
        unsubPedidos();
        unsubClientes();
        unsubProdutos();
        unsubEquipamentos();
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

  const dispararPdfAutomaticoCliente = (nomeCliente: string, itens: any[], total: number) => {
    const elemento = document.createElement('div');
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    
    const linhasProdutosHtml = itens.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
        <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${p.nome}</td>
        <td style="padding: 15px 5px; text-align: center; color: #475569;">${p.qtd}</td>
        <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${Number(p.precoVenda).toFixed(2)}</td>
        <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(Number(p.precoVenda) * p.qtd).toFixed(2)}</td>
      </tr>
    `).join('');

    elemento.innerHTML = `
      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="color: #7c3aed; margin: 0; font-size: 32px; font-weight: 900;">Comprovante de Pedido 🚀</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; font-weight: bold;">Catálogo de Vendas Online</p>
          </div>
          <div style="text-align: right; background-color: #f8fafc; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: bold; color: #a78bfa; text-transform: uppercase; display: block;">Data do Pedido</span>
            <span style="font-size: 14px; font-weight: bold; color: #475569; display: block; margin-top: 2px;">${dataEmissao}</span>
          </div>
        </div>
        
        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Identificação do Comprador</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px;"><strong>Cliente Final:</strong> ${nomeCliente}</p>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Relação de Itens Escolhidos</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8;">
              <th style="padding: 10px 5px; text-align: left;">Produto</th>
              <th style="padding: 10px 5px; text-align: center;">Quantidade</th>
              <th style="padding: 10px 5px; text-align: right;">Preço Unit.</th>
              <th style="padding: 10px 5px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${linhasProdutosHtml}
          </tbody>
        </table>

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px;">
          <div style="background-color: #7c3aed; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Valor Estimado</span>
            R$ ${total.toFixed(2)}
          </div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Forma de Pagamento</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div><strong>Forma de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO</div></div>
          <div><strong>Condições de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp</div></div>
        </div>
      </div>
    `;

    const opcoes = { margin: 0, filename: `Pedido_${nomeCliente.replace(/\s+/g, '_')}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } };
    if ((window as any).html2pdf) { (window as any).html2pdf().from(elemento).set(opcoes).save(); }
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
    const listaParaPdf: any[] = [];

    itensSelecionados.forEach(p => {
      const qtd = carrinho[p.id];
      const sub = Number(p.precoVenda) * qtd;
      totalGeral += sub;
      textoPedido += `• ${qtd}x _${p.nome}_ — R$ ${sub.toFixed(2)}%0A`;
      listaParaPdf.push({ nome: p.nome, qtd: qtd, precoVenda: p.precoVenda });
    });

    textoPedido += `---%0A`;
    textoPedido += `*VALOR TOTAL:* R$ ${totalGeral.toFixed(2)}%0A`;
    textoPedido += `---%0A`;
    textoPedido += `Aguardo a conversa para acertar os detalhes! 🙌`;

    dispararPdfAutomaticoCliente(nomeComprador.trim(), listaParaPdf, totalGeral);

    const numeroLimpo = zapDaLojaPublica.replace(/\D/g, '');
    if (numeroLimpo) { window.open(`https://wa.me/55${numeroLimpo}?text=${textoPedido}`, '_blank'); } 
    else { window.open(`https://wa.me/?text=${textoPedido}`, '_blank'); }
  };

  const lancarVendaBalcaoInterno = async () => {
    const itensNoCarrinho = produtos.filter(p => carrinhoInterno[p.id] > 0);
    if (itensNoCarrinho.length === 0) return alert("Selecione ao menos 1 item com + e - no balcão!");
    
    let stringNomeCombo = "";
    let totalGeral = 0;
    const arrayItensSalvar: any[] = [];
    
    itensNoCarrinho.forEach((p, idx) => {
      const qtd = carrinhoInterno[p.id];
      totalGeral += Number(p.precoVenda) * qtd;
      stringNomeCombo += `${qtd}x ${p.nome}${idx < itensNoCarrinho.length - 1 ? '\n' : ''}`;
      
      arrayItensSalvar.push({
        nome: p.nome,
        qtd: qtd,
        precoVenda: Number(p.precoVenda)
      });
    });

    const nomeFinalDoRegistro = nomeKitBalcao.trim() ? nomeKitBalcao.trim() : stringNomeCombo;
    const prazoFinalVenda = prazoBalcao ? prazoBalcao : new Date().toISOString().split('T')[0];

    try {
      await addDoc(collection(db, "pedidos"), {
        nomeProd: nomeFinalDoRegistro,
        preco: totalGeral.toFixed(2),
        clienteId: clienteBalcao,
        prazo: prazoFinalVenda,
        qtdPed: "1",
        vHora: "0",
        tGasto: "0",
        custos: { embalagem: '0', impressao: '0', energia: '0', outros: '0' },
        lucro: "0",
        desconto: "0",
        userId: user.uid,
        precoManual: totalGeral.toFixed(2),
        obsPedido: "",
        data: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente',
        itensCombo: arrayItensSalvar 
      });

      setCarrinhoInterno({});
      setClienteBalcao('');
      setNomeKitBalcao('');
      setPrazoBalcao('');
      alert("Combo lançado com sucesso no Histórico! 🚀");
      setActiveTab('pedidos');
    } catch {
      alert("Erro ao lançar venda no balcão.");
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
      return { materiais: "0.00", maoObra: "0.00", extras: "0.00", deprec: "0.00", custoPeca: "0.00", lucroLivre: "0.00", final: isNaN(semDesconto) ? "0.00" : semDesconto.toFixed(2) };
    }

    const totalMaterials = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    const totalMaoObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    
    // Calcula a depreciação apenas das máquinas que foram selecionadas pelo usuário na calculadora
    let totalDesgasteMaquinas = 0;
    const dias = Number(financasFixo.diasTrabalho || 20);
    const horas = Number(financasFixo.horasDia || 8);
    const totalHorasMes = dias * horas || 160;
    const tempoEmHoras = Number(tGasto || 0) / 60;

    equipamentosSelecionados.forEach(idEquip => {
      const eq = equipamentos.find(e => e.id === idEquip);
      if (eq) {
        const valorEquip = Number(eq.valorPago || 0);
        const mesesVida = Number(eq.durabilidadeAnos || 2) * 12;
        const custoHoraEquip = (valorEquip / mesesVida) / totalHorasMes;
        totalDesgasteMaquinas += custoHoraEquip * tempoEmHoras;
      }
    });

    const custoTotalPeca = totalMaterials + totalMaoObra + totalExtras + totalDesgasteMaquinas;
    const custoTotalLote = custoTotalPeca * Number(qtdPed || 1);
    const valorLucroLivre = custoTotalLote * (Number(lucro || 0) / 100);
    const precoFinalCalculado = (custoTotalLote + valorLucroLivre) - Number(desconto || 0);

    return { materiais: totalMaterials.toFixed(2), maoObra: totalMaoObra.toFixed(2), extras: totalExtras.toFixed(2), deprec: totalDesgasteMaquinas.toFixed(2), custoPeca: custoTotalPeca.toFixed(2), lucroLivre: valorLucroLivre.toFixed(2), final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual, equipamentos, equipamentosSelecionados, financasFixo]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* %0A${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const gerarPDF = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataEmissao = p.data || new Date().toLocaleDateString('pt-BR');
    const hoje = new Date(); hoje.setDate(hoje.getDate() + 7);
    const dataValidade = hoje.toLocaleDateString('pt-BR');
    const dataPrazo = p.prazo ? new Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'A combinar';
    const totalNum = Number(p.preco || 0);

    let htmlLinhasTabela = '';

    if (p.itensCombo && Array.isArray(p.itensCombo) && p.itensCombo.length > 0) {
      htmlLinhasTabela = p.itensCombo.map((item: any) => `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
          <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${item.nome}</td>
          <td style="padding: 15px 5px; text-align: center; color: #475569;">${item.qtd}</td>
          <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${Number(item.precoVenda).toFixed(2)}</td>
          <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(Number(item.qtd) * Number(item.precoVenda)).toFixed(2)}</td>
        </tr>
      `).join('');
    } else {
      const arrayLinhasTexto = String(p.nomeProd || '').split('\n');
      htmlLinhasTabela = arrayLinhasTexto.map(linhaTexto => {
        if(!linhaTexto.trim()) return '';
        let quantidadeItem = Number(p.qtdPed || 1);
        let nomeItemLimpo = ApplinhaTexto.trim();
        
        const matchCombo = linhaTexto.trim().match(/^(\d+)x\s+(.+)$/i);
        if(matchCombo) {
          quantidadeItem = Number(matchCombo[1]);
          nomeItemLimpo = matchCombo[2].trim();
        }
        const unitario = (totalNum / quantidadeItem).toFixed(2);

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px;">
            <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${nomeItemLimpo}</td>
            <td style="padding: 15px 5px; text-align: center; color: #475569;">${quantidadeItem}</td>
            <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${unitario}</td>
            <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(quantidadeItem * Number(unitario)).toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

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
        
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #7c3aed;">
          Referência do Pedido: ${p.nomeProd}
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
              <th style="padding: 10px 5px; text-align: left;">Descrição do Item</th>
              <th style="padding: 10px 5px; text-align: center;">Qtd</th>
              <th style="padding: 10px 5px; text-align: right;">Preço Unit.</th>
              <th style="padding: 10px 5px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${htmlLinhasTabela}
          </tbody>
        </table>

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Subtotal Geral: <strong>R$ ${totalNum.toFixed(2)}</strong></div>
          <div style="background-color: #7c3aed; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Total do Pedido</span>
            R$ ${totalNum.toFixed(2)}
          </div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Forma de Pagamento Aceitas</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div><strong>Meios disponíveis:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO DE CRÉDITO</div></div>
          <div><strong>Condições comerciais:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp da Loja</div></div>
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
    const opcoes = { margin: 0, filename: `Orcamento.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } };
    (window as any).html2pdf().from(elemento).set(opcoes).save();
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("E-mail ou senha incorretos!"); }
  };

  // AJUSTADO: Agora aceita 'material' e apaga corretamente da coleção "materiais"
  const confirmarExcluir = async (tipo: string, id: string) => {
    if (window.confirm(`Excluir ${tipo}?`)) {
      let colecao = "";
      if (tipo === 'pedido') colecao = "pedidos";
      else if (tipo === 'cliente') colecao = "clientes";
      else if (tipo === 'produto') colecao = "produtos";
      else if (tipo === 'equipamento') colecao = "equipamentos";
      else if (tipo === 'material') colecao = "materiais"; // Consertado!

      await deleteDoc(doc(db, colecao, id));
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
    
    const textoVenda = String(pedido.nomeProd || '');
    if (textoVenda.includes('x ')) {
      const partesItens = textoVenda.split(/\n| \+ /);
      for (const parte of partesItens) {
        const regexMatch = parte.trim().match(/^(\d+)x\s+(.+)$/i);
        if (regexMatch) {
          const qtdVendida = Number(regexMatch[1]);
          const nomeProdutoTexto = regexMatch[2].trim().toLowerCase();
          const materialCorrespondente = materiais.find(m => nomeProdutoTexto.includes(m.nome.toLowerCase()) || m.nome.toLowerCase().includes(nomeProdutoTexto));
          if (materialCorrespondente) {
            const estoqueAtual = Number(materialCorrespondente.qtdAtual || 0);
            const novoEstoque = Math.max(0, estoqueAtual - qtdVendida);
            await updateDoc(doc(db, "materiais", materialCorrespondente.id), { qtdAtual: novoEstoque });
          }
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
    } catch (error) { alert("Erro ao subir a foto!"); } 
    finally { setSubindoImagem(false); }
  };

  const limparCalculadora = () => {
    setNomeProd(''); setQtdPed('1'); setMatsNoPed([]); setVHora('9'); setTGasto('60');
    setCustos({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setEquipamentosSelecionados([]);
    setLucro('100'); setDesconto('0'); setPrazo(''); setClienteSel('');
    setPedidoEditandoId(null); setPrecoManual(null); setObsPedido('');
  };

  const carregarPedidoParaEdicao = (p: any) => {
    setPedidoEditandoId(p.id); setNomeProd(p.nomeProd || ''); setQtdPed(p.qtdPed || '1'); setVHora(p.vHora || '9'); setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setLucro(p.lucro || '100'); setDesconto(p.desconto || '0'); setPrazo(p.prazo || ''); setClienteSel(p.clienteId || '');
    setPrecoManual(p.precoManual || null); setObsPedido(p.obsPedido || '');
    setEquipamentosSelecionados(p.equipamentosSelecionados || []);

    if (p.materiaisUsados && p.materiaisUsados.length > 0) {
      const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return { id: mSalvo.id, nome: matDoArmario ? matDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      setMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }
    setActiveTab('criar');
  };

  const venderItemDiretoDoCatalogo = (prod: any) => {
    limparCalculadora(); setNomeProd(prod.nome); setPrecoManual(prod.precoVenda); setActiveTab('criar');
  };

  const toggleEquipamento = (id: string) => {
    if (equipamentosSelecionados.includes(id)) {
      setEquipamentosSelecionados(equipamentosSelecionados.filter(item => item !== id));
    } else {
      setEquipamentosSelecionados([...equipamentosSelecionados, id]);
    }
  };

  // NOVO: Filtragem dos materiais com base no input da lupa
  const materiaisFiltrados = useMemo(() => {
    return materiais.filter(m => 
      m.nome?.toLowerCase().includes(pesquisaMateriais.toLowerCase())
    );
  }, [materiais, pesquisaMateriais]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando o PrecificaJá... 🚀</div>;

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

  if (!user) {
    return ( <Login isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleAuth={handleAuth} /> );
  }

  const renderCalculadoraForm = () => (
    <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2 w-full">
      {pedidoEditandoId && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl mb-6 flex justify-between items-center animate-pulse w-full">
          <div className="text-xs text-amber-800 font-bold">
            <span>✏️ Você está editando um orçamento salvo!</span>
          </div>
          <button onClick={() => { limparCalculadora(); setActiveTab('pedidos'); }} className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded-xl font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all">Cancelar Edição ❌</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-purple-700 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
          <ShoppingCart size={18}/> {pedidoEditandoId ? 'Editando Dados' : 'Novo Orçamento'}
        </h2>
        {!pedidoEditandoId && (
          <button onClick={() => setMostrarSeletorCatalogo(!mostrarSeletorCatalogo)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black uppercase border border-purple-100">
            {precoManual ? '✨ Item de Catálogo' : '📖 Usar Catálogo'}
          </button>
        )}
      </div>

      {mostrarSeletorCatalogo && !pedidoEditandoId && (
        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-3xl mb-4 text-xs space-y-2 w-full">
          <p className="font-bold text-purple-700 uppercase text-[10px]">Escolha um produto pronto:</p>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto w-full">
            {produtos.map(p => (
              <div key={p.id} onClick={() => { setNomeProd(p.nome); setPrecoManual(String(p.precoVenda)); setMostrarSeletorCatalogo(false); }} className="bg-white p-2.5 rounded-xl border flex justify-between items-center cursor-pointer hover:border-purple-400 w-full">
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

      <div className="grid grid-cols-3 gap-3 mb-4 w-full">
         <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto / Serviço</label>
            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border focus:border-purple-500" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
         </div>
         <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
            <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
         </div>
      </div>

      <div className="mb-4 w-full">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
         <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full block border border-transparent focus:border-purple-400" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
            <option value="">👤 Escolher Cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
         </select>
      </div>

      {precoManual === null ? (
        <>
          <div className="mb-4 w-full">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados</label>
             <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 block border border-transparent focus:border-purple-400" onChange={e => { const m = materiais.find(item => item.id === e.target.value); if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]); }} value="">
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
            <div className="w-full">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Tempo Gasto (min)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={tGasto} onChange={e => setTGasto(e.target.value)} />
            </div>
            <div className="w-full">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Valor da Hora (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-purple-700 border focus:border-purple-400" value={vHora} onChange={e => setVHora(e.target.value)} />
            </div>
          </div>

          {equipamentos.length > 0 && (
            <div className="mb-4 w-full">
              <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">🛠️ Equipamentos Ativos neste Orçamento</label>
              <div className="flex flex-wrap gap-2 w-full">
                {equipamentos.map(eq => {
                  const selecionado = equipamentosSelecionados.includes(eq.id);
                  return (
                    <button key={eq.id} type="button" onClick={() => toggleEquipamento(eq.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selecionado ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                      {eq.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 w-full">
            <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">📦 Custos Extras por Unidade - Opcional (R$)</label>
            <div className="grid grid-cols-4 gap-2 w-full">
              {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl w-full border">
                  <span className="text-[8px] font-black text-slate-400 mb-1">{c.label}</span>
                  <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold text-slate-700" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 w-full">
            <div className="w-full">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Lucro %</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} />
            </div>
            <div className="w-full">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Prazo</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block" value={prazo} onChange={e => setPrazo(e.target.value)} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl mb-4 text-xs w-full">
          <p className="font-bold text-orange-600">💥 Preço carregado pelo catálogo.</p>
          <p className="text-slate-500 mt-1">Valor Unitário base: <strong>R$ {Number(precoManual).toFixed(2)}</strong></p>
          <div className="mt-3 w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prazo</label>
            <input type="date" className="w-full p-4 bg-white rounded-2xl outline-none text-xs font-bold border block" value={prazo} onChange={e => setPrazo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mb-4 w-full">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total (R$)</label>
         <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
      </div>

      <div className="mb-6 w-full">
         <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">📝 Observações do Orçamento</label>
         <textarea placeholder="Ex: Sinal de 50% para início da produção. Restante na entrega." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold border border-transparent focus:border-purple-400 resize-none h-20" value={obsPedido} onChange={e => setObsPedido(e.target.value)} />
      </div>

      {precoManual === null && (
        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 text-xs space-y-2.5 w-full">
          <p className="font-black text-purple-700 uppercase tracking-wider text-[10px] mb-1">📋 RESUMO FINANCEIRO DA PEÇA</p>
          <div className="flex justify-between text-slate-500 w-full"><span>Materiais:</span><span className="font-bold">R$ {resumenFinanceiro.materiais}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Mão de Obra:</span><span className="font-bold">R$ {resumenFinanceiro.maoObra}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Extras / Custo Manual:</span><span className="font-bold">R$ {resumenFinanceiro.extras}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Depreciação de Equipamentos:</span><span className="font-bold text-purple-700">R$ {resumenFinanceiro.deprec}</span></div>
          <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1 w-full"><span>Custo Total da Peça:</span><span className="text-purple-700">R$ {resumenFinanceiro.custoPeca}</span></div>
          <div className="flex justify-between text-emerald-600 font-bold w-full"><span>Lucro Livre Gerado ({lucro}%) :</span><span>R$ {resumenFinanceiro.lucroLivre}</span></div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-6 w-full">
        <div className="text-orange-500 font-black text-4xl tracking-tighter">R$ {resumenFinanceiro.final}</div>
        <div className="flex gap-2">
          <button onClick={async () => {
             if(!nomeProd) return alert("Digite o nome do produto!");
             const dadosPedido = { nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, vHora, tGasto, custos, lucro, desconto, userId: user.uid, precoManual: precoManual, obsPedido: obsPedido, equipamentosSelecionados, materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) })) };
             if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
             else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente', userId: user.uid });
             limparCalculadora(); setActiveTab('pedidos'); alert("Salvo!");
          }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar</button>
          <button onClick={() => gerarPDF({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, obsPedido})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg"><Printer size={18}/></button>
          <button onClick={() => enviarZap({nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-4 rounded-[22px] shadow-lg"><MessageCircle size={18}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700 w-full relative overflow-x-hidden">
      
      {/* MENU HAMBÚRGUER LATERAL COMPLETO */}
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
              <button onClick={() => setActiveTab('financeiro')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'financeiro' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Calculator size={16}/> Configurações de Custos</button>
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><History size={16}/> Histórico de Orçamentos</button>
              <button onClick={() => setActiveTab('balcao')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'balcao' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><ShoppingCart size={16}/> Balcão de Vendas Rápido</button>
              <button onClick={() => setActiveTab('catalogo')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'catalogo' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookOpen size={16}/> Meu Catálogo Visual</button>
              <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Package size={16}/> Armário / Insumos</button>
              <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><User size={16}/> Meus Clientes</button>
            </nav>
          </div>
          <button onClick={() => signOut(auth)} className="w-full text-red-500 bg-red-50 p-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5"><LogOut size={16}/> Sair</button>
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-40 w-full">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700 hover:text-purple-700 transition-colors">
          <Menu size={24} />
        </button>
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <div className="w-10"></div> 
      </header>

      <div className="p-4 max-w-xl mx-auto w-full">
        {/* TELA INICIAL */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 p-6 rounded-[35px] shadow-lg text-white w-full">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Faturamento Realizado</p>
              <h2 className="text-4xl font-black mt-1 tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
              <p className="text-[11px] text-purple-200 mt-2 opacity-80">📈 Dinheiro gerado de pedidos marcados como vendidos</p>
            </div>

            <div onClick={() => { limparCalculadora(); setActiveTab('criar'); }} 
                 className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-[35px] shadow-md cursor-pointer active:scale-95 transition-all text-white flex justify-between items-center w-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Calculadora Integrada</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Novo Orçamento Rápido 🚀</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Calculator size={24}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3"><History size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes}</p>
              </div>

              <div onClick={() => setActiveTab('balcao')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3"><ShoppingCart size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balcão de Vendas</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{produtos.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div onClick={() => setActiveTab('materiais')} className={`p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full ${dashboardMetrics.criticos > 0 ? 'bg-red-50/50 border-red-100' : 'bg-white'}`}>
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-3"><Package size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Falta Reposição</p>
                <p className="text-2xl font-black mt-0.5">{dashboardMetrics.criticos}</p>
              </div>

              <div onClick={() => setActiveTab('clientes')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 mb-3"><User size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Clientes</p>
                <p className="text-2xl font-black mt-0.5">{dashboardMetrics.totalClientes}</p>
              </div>
            </div>
          </div>
        )}

        {/* TELA DE CONFIGURAÇÃO DE CUSTOS FIXOS */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Calculator size={18}/> Estrutura de Custos Fixos (Opcional)</h2>
              <p className="text-slate-400 text-[11px] mb-4">Insira ou edite seus valores aqui. Eles ficam salvos e você pode alterá-los quando quiser.</p>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Salário Mensal Pretendido</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 font-bold text-purple-700 outline-none" value={financasFixo.salario} onChange={e => setFinancasFixo({...financasFixo, salario: e.target.value})} />

              <div className="grid grid-cols-2 gap-3 mb-3 w-full">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Aluguel / Ponto</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={financasFixo.aluguel} onChange={e => setFinancasFixo({...financasFixo, aluguel: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Internet / Sistema</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={financasFixo.internet} onChange={e => setFinancasFixo({...financasFixo, internet: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Conta de Luz Total</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={financasFixo.luz} onChange={e => setFinancasFixo({...financasFixo, luz: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Outros Gastos Fixos</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={financasFixo.outros} onChange={e => setFinancasFixo({...financasFixo, outros: e.target.value})} />
                </div>
              </div>

              <h3 className="text-purple-700 font-bold text-xs uppercase tracking-wider mb-2 mt-4">Sua Carga Horária</h3>
              <div className="grid grid-cols-2 gap-3 mb-5 w-full">
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Dias de Trabalho no Mês</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.diasTrabalho} onChange={e => setFinancasFixo({...financasFixo, diasTrabalho: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Horas de Trabalho por Dia</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.horasDia} onChange={e => setFinancasFixo({...financasFixo, horasDia: e.target.value})} />
                </div>
              </div>

              <button onClick={async () => {
                await setDoc(doc(db, "configuracoes_financeiras", user.uid), financasFixo);
                
                const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                const intentCustos = Number(financasFixo.salario || 0) + Number(financasFixo.aluguel || 0) + Number(financasFixo.internet || 0) + Number(financasFixo.luz || 0) + Number(financasFixo.outros || 0);
                if (intentCustos > 0) setVHora((intentCustos / totalHoras).toFixed(2));
                
                alert("Custos salvos com sucesso! O valor sugerido para a hora foi atualizado na calculadora. 🎉");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                Salvar Configurações Fixas
              </button>
            </div>

            {/* SEÇÃO DE FERRAMENTAS */}
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Package size={18}/> Minhas Ferramentas de Trabalho (Depreciação)</h2>
              <p className="text-slate-400 text-[11px] mb-4">Adicione ferramentas (secador, prensa) para incluir o desgaste financeiro automaticamente no resumo de custos.</p>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Equipamento</label>
              <input placeholder="Ex: Secador Profissional" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoEquipamento.nome} onChange={e => setNovoEquipamento({...novoEquipamento, nome: e.target.value})} />

              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor Pago</label>
                  <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={novoEquipamento.valorPago} onChange={e => setNovoEquipamento({...novoEquipamento, valorPago: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tempo de Vida (Anos)</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={novoEquipamento.durabilidadeAnos} onChange={e => setNovoEquipamento({...novoEquipamento, durabilidadeAnos: e.target.value})}>
                    <option value="1">1 Ano</option>
                    <option value="2">2 Anos</option>
                    <option value="3">3 Anos</option>
                    <option value="5">5 Anos</option>
                  </select>
                </div>
              </div>

              <button onClick={async () => {
                if(!novoEquipamento.nome || !novoEquipamento.valorPago) return alert("Preencha o nome e o preço del equipamento!");
                const d = { nome: novoEquipamento.nome, valorPago: Number(novoEquipamento.valorPago), durabilidadeAnos: Number(novoEquipamento.durabilidadeAnos), userId: user.uid };
                if (novoEquipamento.id) await updateDoc(doc(db, "equipamentos", novoEquipamento.id), d);
                else await addDoc(collection(db, "equipamentos"), d);
                setNovoEquipamento({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });
                alert("Equipamento salvo!");
              }} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                Salvar Equipamento
              </button>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">Equipamentos Cadastrados</h3>
            <div className="space-y-2 w-full">
              {equipamentos.map(eq => {
                const meses = Number(eq.durabilidadeAnos || 2) * 12;
                const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                const descHora = (Number(eq.valorPago || 0) / meses) / totalHoras;
                return (
                  <div key={eq.id} className="bg-white p-4 rounded-3xl flex justify-between items-center border shadow-sm w-full">
                    <div>
                      <p className="font-bold text-slate-800">{eq.nome}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Desgaste: <span className="font-bold text-purple-700">R$ {isNaN(descHora) ? "0.00" : descHora.toFixed(2)} por hora de uso</span></p>
                    </div>
                    <button onClick={() => confirmarExcluir('equipamento', eq.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇÃO DO BALCÃO DE VENDAS RÁPIDO */}
        {activeTab === 'balcao' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-gradient-to-tr from-purple-800 to-purple-600 p-5 rounded-[35px] text-white shadow-md border border-purple-900 space-y-3.5 w-full">
              <div className="w-full">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200 flex items-center gap-1.5"><Share2 size={14}/> Link da Vitrine de Clientes</h3>
                <div className="mt-1.5 bg-purple-900/40 p-3 rounded-xl text-[11px] font-mono select-all break-all border border-purple-500/30 bg-black/10 w-full font-bold">
                  {linkDoCatalogoDestaCliente}
                </div>
                <div onClick={copiarLinkCatalogo} className="mt-2 w-full bg-white text-purple-800 font-bold p-2.5 rounded-xl text-xs uppercase shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                  <Copy size={13}/> Copiar Link da Vitrine
                </div>
              </div>

              <div className="border-t border-purple-500/30 pt-2.5 w-full">
                <label className="text-[9px] font-black uppercase text-purple-200 block mb-1">📱 Seu WhatsApp de Vendas (Com DDD)</label>
                <div className="flex gap-2 w-full">
                  <input placeholder="Ex: 21983858055" className="flex-1 p-2.5 bg-black/20 text-white rounded-xl text-xs font-bold border border-purple-500/30 outline-none" value={zapDonaConta} onChange={e => setZapDonaConta(e.target.value)} />
                  <button onClick={async () => {
                    if(!zapDonaConta.trim()) return alert("Digite o número!");
                    try { await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true }); alert("WhatsApp saved!"); } 
                    catch { alert("Erro ao salvar."); }
                  }} className="bg-orange-50 text-white text-xs font-black uppercase px-4 rounded-xl shadow">Salvar</button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-slate-900 to-purple-950 p-6 rounded-[35px] shadow-xl border border-slate-800 text-white w-full space-y-4">
              <div>
                <h2 className="text-orange-400 font-black flex items-center gap-2 uppercase text-xs tracking-wider">
                  <ShoppingCart size={16}/> Lançar Combo Rápido do Catálogo
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">Dê um nome ao Kit, escolha o cliente, defina o prazo e as quantidades.</p>
              </div>

              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Nome do Kit / Combo (Opcional)</label>
                <input 
                  placeholder="Ex: Kit Dia dos Namorados, Kit Casal..." 
                  className="w-full p-3.5 bg-slate-800/80 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:border-purple-400"
                  value={nomeKitBalcao}
                  onChange={e => setNomeKitBalcao(e.target.value)}
                />
              </div>
              
              <div className="w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Cliente do Balcão</label>
                <select className="w-full p-3.5 bg-slate-800/80 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:border-purple-400" value={clienteBalcao} onChange={e => setClienteBalcao(e.target.value)}>
                  <option value="" className="text-slate-800">👤 Selecionar Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id} className="text-slate-800">{c.nome}</option>)}
                </select>
              </div>

              <div className="w-full">
                <label className="text-[10px] font-bold text-orange-400 uppercase ml-1 block mb-1">Prazo de Entrega do Combo</label>
                <input 
                  type="date" 
                  className="w-full p-3.5 bg-slate-800/80 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:border-purple-400 block"
                  value={prazoBalcao} 
                  onChange={e => setPrazoBalcao(e.target.value)} 
                />
              </div>

              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl space-y-2 max-h-64 overflow-y-auto">
                {produtos.map(p => {
                  const qtdInterna = carrinhoInterno[p.id] || 0;
                  return (
                    <div key={p.id} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-xs font-bold truncate max-w-[180px] text-slate-200">{p.nome}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-black text-purple-300 mr-1">R$ {Number(p.precoVenda).toFixed(2)}</span>
                        <button onClick={() => setCarrinhoInterno({...carrinhoInterno, [p.id]: Math.max(0, qtdInterna - 1)})} className="w-7 h-7 bg-slate-800 rounded-lg font-black text-slate-300">-</button>
                        <span className="font-bold text-xs w-4 text-center">{qtdInterna}</span>
                        <button onClick={() => setCarrinhoInterno({...carrinhoInterno, [p.id]: qtdInterna + 1})} className="w-7 h-7 bg-purple-600 rounded-lg font-black text-white">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={lancarVendaBalcaoInterno} className="w-full bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95">
                Lançar Combo no Histórico 🚀
              </button>
            </div>
          </div>
        )}

        {/* MEU CATÁLOGO VISUAL */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><BookOpen size={18}/> Novo Item de Venda Fixa</h2>
              <div className="mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px] w-full">
                {novoProdCatalogo.urlImagem ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden">
                    <img src={novoProdCatalogo.urlImagem} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setNovoProdCatalogo(p => ({...p, urlImagem: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors w-full h-full flex justify-center">
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
            <div className="grid grid-cols-1 gap-3 w-full">
              {produtos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-[30px] flex gap-4 items-center border border-slate-100 shadow-sm w-full">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                    {p.urlImagem ? <img src={p.urlImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{p.nome}</p>
                    <p className="text-purple-700 font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">Vender 🛍️</button>
                    <button onClick={() => deleteDoc(doc(db, "produtos", p.id))} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA DA CALCULADORA COMPOSTA */}
        {activeTab === 'criar' && renderCalculadoraForm()}

        {/* HISTÓRICO DE ORÇAMENTOS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><History size={20}/> Histórico</h2>
            {pedidos.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               const ehPendente = p.status !== 'Vendido 💰';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">
                          {cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span>
                        </p>
                        <div className="font-bold text-slate-700 text-sm whitespace-pre-line">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">({p.qtdPed || 1} un)</span></div>
                     </div>
                     <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1 w-full">
                      {ehPendente && (
                        <>
                          <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto active:scale-95"><CheckCircle size={16}/> Confirmar Venda</button>
                          <button onClick={() => carregarPedidoParaEdicao(p)} className="text-purple-600 p-2 bg-purple-50 rounded-xl"><Edit2 size={18}/></button>
                        </>
                      )}
                      <button onClick={() => gerarPDF(p)} className="text-orange-500 p-2 bg-orange-50 rounded-xl"><Printer size={18}/></button>
                      <button onClick={() => enviarZap({nomeProd: p.nomeProd, preco: p.preco, clienteId: p.clienteId, prazo: p.prazo, qtdPed: p.qtdPed})} className="text-emerald-500 p-2 bg-emerald-50 rounded-xl"><MessageCircle size={18}/></button>
                      <button onClick={() => confirmarExcluir('pedido', p.id)} className="text-red-200 p-2"><Trash2 size={18}/></button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

        {/* GERENCIAR ARMÁRIO / INSUMOS */}
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
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block border border-transparent focus:border-purple-400 mt-1" value={novoMat.unidade} onChange={e => setNovoMat({...novoMat, unidade: e.target.value})}>
                  <option value="un">📦 Unidade (un)</option>
                  <option value="g">⚖️ Gramas (g)</option>
                  <option value="kg">🏋️ Quilo (kg)</option>
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

            {/* MODIFICAÇÃO: Barra de Pesquisa com Lupa */}
            <div className="relative w-full mb-2">
              <Search 
                size={18} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
              />
              <input
                type="text"
                placeholder="Pesquisar material no armário..."
                value={pesquisaMateriais}
                onChange={e => setPesquisaMateriais(e.target.value)}
                className="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm"
              />
            </div>

            {/* MODIFICAÇÃO: Loop usando a lista filtrada */}
            {materiaisFiltrados.map(m => {
              const estaAcabando = Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0);
              const valorUnitarioCalculado = Number(m.qtd || 1) > 0 ? (Number(m.valor || 0) / Number(m.qtd || 1)).toFixed(2) : "0.00";
              return (
                <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border w-full mb-2 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">{estaAcabando ? '🔴' : '🟢'} {m.nome}</p>
                    <p className="text-xs text-slate-400 mt-1">Custo unitário: <span className="font-bold text-slate-600">R$ {valorUnitarioCalculado}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">Qtd: <span className="font-bold text-purple-700">{m.qtdAtual} {m.unidade}</span></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, Number(m.qtdAtual || 0) - 1) })} className="w-8 h-8 bg-slate-100 rounded-xl font-bold">-</button>
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Number(m.qtdAtual || 0) + 1 })} className="w-8 h-8 bg-purple-100 rounded-xl font-bold text-purple-700">+</button>
                    <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: String(m.valor), qtd: String(m.qtd), unidade: m.unidade, qtdAtual: String(m.qtdAtual), qtdMinima: String(m.qtdMinima)})} className="text-orange-400 p-2"><Edit2 size={16}/></button>
                    
                    {/* MODIFICAÇÃO: Botão de excluir material funcionando */}
                    <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}

            {/* Aviso caso nada seja encontrado na pesquisa */}
            {materiaisFiltrados.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">Nenhum insumo encontrado com esse nome.</p>
            )}
          </div>
        )}

        {/* ABA DE CLIENTES */}
        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
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
              <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm font-bold w-full mb-2">
                <div className="flex flex-col ml-2"><span className="text-slate-800">{c.nome}</span><span className="text-xs text-slate-400 font-normal">{c.zap ? `📱 ${c.zap}` : 'Sem número'}</span></div>
                <div className="flex gap-1">
                  <button onClick={() => setNovoCli({ id: c.id, nome: c.nome, zap: c.zap || '' })} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                  <button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MENU INFERIOR FIXO ENXUTO */}
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
