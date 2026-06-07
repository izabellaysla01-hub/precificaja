import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu, Search, Settings, CheckSquare, Square, Filter, MapPin, Globe } from 'lucide-react';

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

  // Estados para Filtro na Vitrine Pública do Cliente
  const [filtroVitrineSelecionado, setFiltroVitrineSelecionado] = useState('Todos');
  const [isMenuFiltroVitrineOpen, setIsMenuFiltroVitrineOpen] = useState(false);

  const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo' | 'balcao' | 'financeiro' | 'perfil' | 'anotacoes' | 'fornecedores'>('inicio');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [anotacoes, setAnotacoes] = useState<any[]>([]);
  
  // Estados Novos para Categorias Dinâmicas e Fornecedores
  const [categoriasProd, setCategoriasProd] = useState<any[]>([]);
  const [categoriasForn, setCategoriasForn] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  const [pesquisaMateriais, setPesquisaMateriais] = useState('');
  const [pesquisaFornecedores, setPesquisaFornecedores] = useState('');
  const [filtroFornSelecionado, setFiltroFornSelecionado] = useState('Todos');

  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

  const [filtroStatusPedido, setFiltroStatusPedido] = useState<'Pendente' | 'Vendido' | 'Cancelado'>('Pendente');
  const [isDuplicando, setIsDuplicando] = useState(false);

  const [diaSelecionadoAgenda, setDiaSelecionadoAgenda] = useState<string>(new Date().toISOString().split('T')[0]);

  const [nomeProd, setNomeProd] = useState('');
  const [qtdPed, setQtdPed] = useState('1');
  const [matsNoPed, setMatsNoPed] = useState<any[]>([]);
  const [vHora, setVHora] = useState('9');
  const [tGasto, setTGasto] = useState('60');
  const [custos, setCustos] = useState({ embalagem: '0', impressao: '0', energia: '0' });
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
    
  const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '', email: '', endereco: '' });
  const [novaAnotacao, setNovaAnotacao] = useState({ id: '', titulo: '', conteudo: '', dataPrazo: new Date().toISOString().split('T')[0] });
  
  // Estados de Cadastro Atualizados com Categorias
  const [novoProdCatalogo, setNovoProdCatalogo] = useState<{id: string, nome: string, precoVenda: string, urlImagem: string, categorias: string[]}>({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [] });
  const [inputNovaCategoriaProd, setInputNovaCategoriaProd] = useState('');
  const [mostrarInputNovaCatProd, setMostrarInputNovaCatProd] = useState(false);

  // Estados de Cadastro para Fornecedores
  const [novoFornecedor, setNovoFornecedor] = useState<{id: string, nome: string, site: string, whatsapp: string, endereco: string, categorias: string[]}>({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
  const [inputNovaCategoriaForn, setInputNovaCategoriaForn] = useState('');
  const [mostrarInputNovaCatForn, setMostrarInputNovaCatForn] = useState(false);

  const [zapDonaConta, setZapDonaConta] = useState('');
  const [subindoImagem, setSubindoImagem] = useState(false);

  const [nomeLojaPerfil, setNomeLojaPerfil] = useState('');
  const [logoLojaPerfil, setLogoLojaPerfil] = useState('');
  const [subindoLogo, setSubindoLogo] = useState(false);

  // ESTRUTURA FINANCEIRA FIXA REVISADA
  const [financasFixo, setFinancasFixo] = useState<{
    salario: string;
    aluguel: string;
    internet: string;
    luz: string;
    diasTrabalho: string;
    horasDia: string;
    custosExtras: Array<{ id: string; nome: string; valor: string }>;
  }>({ 
    salario: '0', 
    aluguel: '0', 
    internet: '0', 
    luz: '0', 
    diasTrabalho: '20', 
    horasDia: '8',
    custosExtras: [] 
  });

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

      const qCats = query(collection(db, "categorias_produtos"), where("userId", "==", lojaId));
      getDocs(qCats).then(snapshot => {
        setCategoriasProd(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
          if(docSnap.exists()) {
            setZapDonaConta(docSnap.data().whatsapp || '');
            setNomeLojaPerfil(docSnap.data().nomeLoja || '');
            setLogoLojaPerfil(docSnap.data().logoUrl || '');
          }
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
      const qMaterials = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const unsubMaterials = onSnapshot(qMaterials, s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      const unsubPedidos = onSnapshot(qPedidos, s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
      const unsubClientes = onSnapshot(qClientes, s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qProdutos = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubProdutos = onSnapshot(qProdutos, s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qAnotacoes = query(collection(db, "anotacoes"), where("userId", "==", user.uid));
      const unsubAnotacoes = onSnapshot(qAnotacoes, s => setAnotacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qCatsProd = query(collection(db, "categorias_produtos"), where("userId", "==", user.uid));
      const unsubCatsProd = onSnapshot(qCatsProd, s => {
        if(s.docs.length === 0 && categoriasProd.length === 0) {
          const padroes = ["🖨️ Sublimação", "✂️ Papelaria Personalizada", "🎁 Personalizados", "💕 Datas Comemorativas"];
          padroes.forEach(async (cat) => {
            await addDoc(collection(db, "categorias_produtos"), { nome: cat, userId: user.uid });
          });
        }
        setCategoriasProd(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qCatsForn = query(collection(db, "categorias_fornecedores"), where("userId", "==", user.uid));
      const unsubCatsForn = onSnapshot(qCatsForn, s => {
        if(s.docs.length === 0 && categoriasForn.length === 0) {
          const padroesForn = ["🖨️ Insumos de Sublimação", "✂️ Papelaria e Papéis", "📦 Embalagens e Caixas", "🎁 Brindes e Acrílicos"];
          padroesForn.forEach(async (cat) => {
            await addDoc(collection(db, "categorias_fornecedores"), { nome: cat, userId: user.uid });
          });
        }
        setCategoriasForn(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qFornecedores = query(collection(db, "fornecedores"), where("userId", "==", user.uid));
      const unsubFornecedores = onSnapshot(qFornecedores, s => setFornecedores(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qConfigFin = doc(db, "configuracoes_financeiras", user.uid);
      getDoc(qConfigFin).then(snap => {
        if (snap.exists()) {
          const dadosFin = snap.data() as any;
          setFinancasFixo({
            salario: dadosFin.salario || '0',
            aluguel: dadosFin.aluguel || '0',
            internet: dadosFin.internet || '0',
            luz: dadosFin.luz || '0',
            diasTrabalho: dadosFin.diasTrabalho || '20',
            horasDia: dadosFin.horasDia || '8',
            custosExtras: dadosFin.custosExtras || []
          });
          
          const dias = Number(dadosFin.diasTrabalho || 20);
          const horas = Number(dadosFin.horasDia || 8);
          const totalHorasMes = dias * horas || 160;
          const salario = Number(dadosFin.salario || 0);
          const somaExtras = (dadosFin.custosExtras || []).reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);
          const custosMes = Number(dadosFin.aluguel || 0) + Number(dadosFin.internet || 0) + Number(dadosFin.luz || 0) + somaExtras;
          
          if (salario + custosMes > 0) {
            const fontHoraCalculada = (salario + custosMes) / totalHorasMes;
            setVHora(fontHoraCalculada.toFixed(2));
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
        unsubAnotacoes();
        unsubCatsProd();
        unsubCatsForn();
        unsubFornecedores();
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

  const proximosSeteDias = useMemo(() => {
    const dias = [];
    const nomesDias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const diaNum = String(d.getDate()).padStart(2, '0');
      const stringData = `${ano}-${mes}-${diaNum}`;
      
      dias.push({
        stringData,
        diaNumero: d.getDate(),
        diaSemanaTexto: nomesDias[d.getDay()],
        mesTexto: nomesMeses[d.getMonth()]
      });
    }
    return dias;
  }, []);

  const anotacoesDoDiaSelecionado = useMemo(() => {
    return anotacoes.filter(a => a.dataPrazo === diaSelecionadoAgenda && !a.concluido);
  }, [anotacoes, diaSelecionadoAgenda]);

  const toggleStatusAnotacao = async (id: string, valorAtual: boolean) => {
    await updateDoc(doc(db, "anotacoes", id), { concluido: !valorAtual });
  };

  const dispararPdfAutomaticoCliente = (nomeCliente: string, itens: any[], total: number) => {
    const elemento = document.createElement('div');
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    
    const linhasProdutosHtml = itens.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
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
          <p style="margin: 0; font-size: 14px;"><strong>Cliente Final:</strong> ${nomeComprador}</p>
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

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px; page-break-inside: avoid; break-inside: avoid;">
          <div style="background-color: #7c3aed; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Valor Estimado</span>
            R$ ${total.toFixed(2)}
          </div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">Forma de Pagamento</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
          <div><strong>Forma de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO</div></div>
          <div><strong>Condições de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp</div></div>
        </div>
      </div>
    `;

    const opcoes = { margin: 10, filename: `Pedido_${nomeComprador.replace(/\s+/g, '_')}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
    if ((window as any).html2pdf) { (window as any).html2pdf().from(elemento).set(opcoes).save(); }
  };

  const finalizarPedidoPublicoWhatsapp = () => {
    if (!nomeComprador.trim()) return alert("Por favor, digite seu nome antes de enviar!");
    const itensSelecionados = produtosPublicosFiltrados.filter(p => carrinho[p.id] > 0);
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
        custos: { embalagem: '0', impressao: '0', energia: '0' },
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
    const faturamentoTotal = pedidos.filter(p => p.status === 'Vendido 💰' || p.status === 'Vendido').reduce((acc, p) => acc + Number(p.preco || 0), 0);
    const pendentesCount = pedidos.filter(p => p.status === 'Pendente' || !p.status).length;
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
    const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0);
    
    let totalDesgasteMaquinas = 0;
    const dias = Number(financasFixo.diasTrabalho || 20);
    const horas = Number(financasFixo.horasDia || 8);
    const totalHorasMes = dias * horas || 160;
    const tempoEmHoras = Number(tGasto || 0) / 60;

    equipamentosSelecionados.forEach(idEquip => {
      const eq = equipments.find(e => e.id === idEquip);
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
      htmlLinhasTabela = p.itensCombo.map((item: any) => {
        const qtd = Number(item.qtd || 1);
        const precoVenda = Number(item.precoVenda || 0);
        const subtotal = qtd * precoVenda;
        
        return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${item.nome}</td>
            <td style="padding: 15px 5px; text-align: center; color: #475569;">${qtd}</td>
            <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${precoVenda.toFixed(2)}</td>
            <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${subtotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    } else {
      const arrayLinhasTexto = String(p.nomeProd || '').split('\n');
      htmlLinhasTabela = arrayLinhasTexto.map(linhaTexto => {
        if(!linhaTexto.trim()) return '';
        let quantidadeItem = Number(p.qtdPed || 1);
        let nomeItemLimpo = linhaTexto.trim();
        
        const matchCombo = linhaTexto.trim().match(/^(\d+)x\s+(.+)$/i);
        if(matchCombo) {
          quantidadeItem = Number(matchCombo[1]);
          nomeItemLimpo = matchCombo[2].trim();
        }
        
        const qtdSegura = quantidadeItem > 0 ? quantidadeItem : 1;
        const unitario = (totalNum / qtdSegura).toFixed(2);

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${nomeItemLimpo}</td>
            <td style="padding: 15px 5px; text-align: center; color: #475569;">${quantidadeItem}</td>
            <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${unitario}</td>
            <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(quantidadeItem * Number(unitario)).toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    const cabecalhoNomeHtml = nomeLojaPerfil ? nomeLojaPerfil : "PrecificaJá 🚀";
    const cabecalhoLogoHtml = logoLojaPerfil ? `<div style="margin-bottom: 10px;"><img src="${logoLojaPerfil}" style="max-height: 55px; max-width: 140px; object-fit: contain; border-radius: 8px;"/></div>` : '';

    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            ${cabecalhoLogoHtml}
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px; font-weight: 900;">${cabecalhoNomeHtml}</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; font-weight: bold;">Documento de Orçamento Comercial</p>
          </div>
          <div style="text-align: right; background-color: #f8fafc; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: bold; color: #a78bfa; text-transform: uppercase; display: block;">Código Ref</span>
            <span style="font-size: 14px; font-weight: bold; color: #475569; display: block; margin-top: 2px;">ORC-${Math.floor(1000 + Math.random() * 9000)}</span>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #7c3aed;">
          Referência do Pedido: ${p.nomeProd.replace(/\n/g, ' + ')}
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Dados do Cliente</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px;"><strong>Cliente:</strong> ${cli?.nome || 'Cliente não informado'}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;"><strong>WhatsApp:</strong> ${cli?.zap || 'Não informado'}</p>
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

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px; page-break-inside: avoid; break-inside: avoid;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Subtotal Geral: <strong>R$ ${totalNum.toFixed(2)}</strong></div>
          <div style="background-color: #7c3aed; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Total do Pedido</span>
            R$ ${totalNum.toFixed(2)}
          </div>
        </div>

        <div style="background-color: #7c3aed; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">Formas de Pagamento Aceitas</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
          <div><strong>Meios disponíveis:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO DE CRÉDITO</div></div>
          <div><strong>Condições comerciais:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp da Loja</div></div>
        </div>

        ${p.obsPedido ? `
        <div style="background-color: #f3e8ff; border: 1px solid #e9d5ff; padding: 15px; border-radius: 16px; font-size: 13px; color: #6b21a8; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
          <strong style="text-transform: uppercase; font-size: 10px; display: block; color: #a855f7; margin-bottom: 4px;">Observações Importantes:</strong>
          ${p.obsPedido.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 15px; page-break-inside: avoid; break-inside: avoid;">
          Obrigado pela preferência! Caso tenha dúvidas, entre em contato pelo nosso WhatsApp.
        </div>
      </div>
    `;
    const opcoes = { margin: 10, filename: `Orcamento.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
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
      let colecao = "";
      if (tipo === 'pedido') colecao = "pedidos";
      else if (tipo === 'cliente') colecao = "clientes";
      else if (tipo === 'produto') colecao = "produtos";
      else if (tipo === 'equipamento') colecao = "equipamentos";
      else if (tipo === 'material') colecao = "materiais";
      else if (tipo === 'anotacao') colecao = "anotacoes";
      else if (tipo === 'fornecedor') colecao = "fornecedores";

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

  const cancelarPedidoSemExcluir = async (id: string) => {
    if (window.confirm("Deseja realmente mover este orçamento para os cancelados?")) {
      await updateDoc(doc(db, "pedidos", id), { status: 'Cancelado ❌' });
      alert("Pedido cancelado!");
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
    } catch (error) { alert("Erro ao subir a foto!"); } 
    finally { setSubindoImagem(false); }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSubindoLogo(true);
    try {
      const nomeArquivo = `logo_${user.uid}_${Date.now()}_${file.name}`;
      const logoRef = ref(storage, `logos/${nomeArquivo}`);
      await uploadBytes(logoRef, file);
      const urlDisponivel = await getDownloadURL(logoRef);
      setLogoLojaPerfil(urlDisponivel);
      alert("Logo carregado com sucesso! Salve o perfil para aplicar. 📸");
    } catch (error) { alert("Erro ao subir o logo!"); }
    finally { setSubindoLogo(false); }
  };

  const limparCalculadora = () => {
    setNomeProd(''); setQtdPed('1'); setMatsNoPed([]); setVHora('9'); setTGasto('60');
    setCustos({ embalagem: '0', impressao: '0', energia: '0' });
    setEquipamentosSelecionados([]);
    setLucro('100'); setDesconto('0'); setPrazo(''); setClienteSel('');
    setPedidoEditandoId(null); setPrecoManual(null); setObsPedido('');
    setIsDuplicando(false);
  };

  const carregarPedidoParaEdicao = (p: any) => {
    setIsDuplicando(false);
    setPedidoEditandoId(p.id); setNomeProd(p.nomeProd || ''); setQtdPed(p.qtdPed || '1'); setVHora(p.vHora || '9'); setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0' });
    setLucro(p.lucro || '100'); setDesconto(p.desconto || '0'); setPrazo(p.prazo || ''); setClienteSel(p.clienteId || '');
    setPrecoManual(p.precoManual || null); setObsPedido(p.obsPedido || '');
    setEquipamentosSelecionados(p.equipamentosSelecionados || []);

    if (p.materialsUsados && p.materialsUsados.length > 0) {
      const listaReconstruida = p.materialsUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return { id: mSalvo.id, nome: matDoArmario ? matDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      setMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }
    setActiveTab('criar');
  };

  const handleDuplicarOrcamento = (p: any) => {
    setPedidoEditandoId(null); 
    setIsDuplicando(true);
    setNomeProd(`${p.nomeProd} (Cópia)`); 
    setQtdPed(p.qtdPed || '1'); 
    setVHora(p.vHora || '9'); 
    setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0' });
    setLucro(p.lucro || '100'); 
    setDesconto(p.desconto || '0'); 
    setPrazo(p.prazo || ''); 
    setClienteSel(''); 
    setPrecoManual(p.precoManual || null); 
    setObsPedido(p.obsPedido || '');
    setEquipamentosSelecionados(p.equipamentosSelecionados || []);

    if (p.materialsUsados && p.materialsUsados.length > 0) {
      const listaReconstruida = p.materialsUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return { id: mSalvo.id, nome: matDoArmario ? matDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      setMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }
    setActiveTab('criar');
    alert("Orçamento duplicado com sucesso! Defina o cliente e salve. ✨");
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

  const toggleCategoriaNoProduto = (catNome: string) => {
    const jaTem = novoProdCatalogo.categorias?.includes(catNome) || false;
    if(jaTem) {
      setNovoProdCatalogo({...novoProdCatalogo, categorias: novoProdCatalogo.categorias.filter(c => c !== catNome)});
    } else {
      setNovoProdCatalogo({...novoProdCatalogo, categorias: [...(novoProdCatalogo.categorias || []), catNome]});
    }
  };

  const toggleCategoriaNoFornecedor = (catNome: string) => {
    const jaTem = novoFornecedor.categorias?.includes(catNome) || false;
    if(jaTem) {
      setNovoFornecedor({...novoFornecedor, categorias: novoFornecedor.categorias.filter(c => c !== catNome)});
    } else {
      setNovoFornecedor({...novoFornecedor, categorias: [...(novoFornecedor.categorias || []), catNome]});
    }
  };

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter(m => 
      m.nome?.toLowerCase().includes(pesquisaMateriais.toLowerCase())
    );
  }, [materiais, pesquisaMateriais]);

  const produtosPublicosFiltrados = useMemo(() => {
    if (filtroVitrineSelecionado === 'Todos') return produtosPublicos;
    return produtosPublicos.filter(p => p.categorias && p.categorias.includes(filtroVitrineSelecionado));
  }, [produtosPublicos, filtroVitrineSelecionado]);

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter(f => {
      const matchNome = f.nome?.toLowerCase().includes(pesquisaFornecedores.toLowerCase());
      const matchCat = filtroFornSelecionado === 'Todos' ? true : (f.categorias && f.categorias.includes(filtroFornSelecionado));
      return matchNome && matchCat;
    });
  }, [fornecedores, pesquisaFornecedores, filtroFornSelecionado]);

  const pedidosFiltradosPorStatus = useMemo(() => {
    return pedidos.filter(p => {
      const st = p.status || 'Pendente';
      if (filtroStatusPedido === 'Vendido') return st.includes('Vendido');
      if (filtroStatusPedido === 'Cancelado') return st.includes('Cancelado');
      return st === 'Pendente';
    });
  }, [pedidos, filtroStatusPedido]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando o PrecificaJá... 🚀</div>;

  if (idLojaPublica) {
    if (carregandoPublico) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando Vitrine... 🛍️</div>;
    const totalCarrinho = Object.keys(carrinho).reduce((acc, id) => {
      const prod = produtosPublicos.find(p => p.id === id);
      return acc + (prod ? Number(prod.precoVenda) * carrinho[id] : 0);
    }, 0);

    return (
      <div className="min-h-screen bg-slate-50 pb-40 font-sans text-slate-700 w-full relative">
        <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b sticky top-0 z-50">
          <div className="relative">
            <button onClick={() => setIsMenuFiltroVitrineOpen(!isMenuFiltroVitrineOpen)} className="p-2 text-slate-700 hover:text-purple-700 transition-colors flex items-center gap-1 bg-slate-100 rounded-xl text-xs font-bold">
              <Menu size={18} /> Filtrar
            </button>
            {isMenuFiltroVitrineOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                <button onClick={() => { setFiltroVitrineSelecionado('Todos'); setIsMenuFiltroVitrineOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${filtroVitrineSelecionado === 'Todos' ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`}>✨ Todos os Produtos</button>
                {categoriasProd.map(cat => (
                  <button key={cat.id} onClick={() => { setFiltroVitrineSelecionado(cat.nome); setIsMenuFiltroVitrineOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${filtroVitrineSelecionado === cat.nome ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`}>{cat.nome}</button>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-base font-black text-purple-700">Vitrine de Destaques 🎉</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Filtro: {filtroVitrineSelecionado}</p>
          </div>
          <div className="w-14"></div>
        </header>

        <main className="p-4 max-w-xl mx-auto space-y-6">
          <div className="bg-white p-5 rounded-[30px] border shadow-sm">
            <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Seu Nome Completo</label>
            <input placeholder="Digite seu nome para o pedido..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-bold border border-transparent focus:border-purple-400" value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {produtosPublicosFiltrados.map(p => {
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
                      <button onClick={() => setCarrinho({ ...carrinho, [p.id]: carrinho[p.id] + 1 })} className="w-8 h-8 bg-purple-100 rounded-xl font-black text-purple-700">+</button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {produtosPublicosFiltrados.length === 0 && (
              <p className="text-center font-bold text-xs text-slate-400 py-12">Nenhum produto em destaque nesta categoria no momento. 🙌</p>
            )}
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

  const renderCalculadoraForm = () => (
    <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2 w-full">
      {(pedidoEditandoId || isDuplicando) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl mb-6 flex justify-between items-center animate-pulse w-full">
          <div className="text-xs text-amber-800 font-bold">
            <span>{isDuplicando ? '✨ Você está configurando uma cópia duplicada!' : '✏️ Você está editando um orçamento salvo!'}</span>
          </div>
          <button onClick={() => { limparCalculadora(); setActiveTab('pedidos'); }} className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded-xl font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all">Cancelar Cópia / Edição ❌</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-purple-700 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
          <ShoppingCart size={18}/> {pedidoEditandoId ? 'Editando Dados' : isDuplicando ? 'Salvando Cópia' : 'Novo Orçamento'}
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
                  const selecionado = equipmentsSelecionados.includes(eq.id);
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
            <div className="grid grid-cols-3 gap-2 w-full">
              {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'}].map(c=>(
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
             const dadosPedido = { nomeProd, preco: resumenFinanceiro.final, clienteId: clienteSel, prazo, qtdPed, vHora, tGasto, custos, lucro, discount: desconto, desconto, precoManual: precoManual, obsPedido: obsPedido, equipamentosSelecionados, materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) })) };
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
      
      {/* MENU HAMBÚRGUER LATERAL COMPLETO COM NOVA ABA DE SUPORTE */}
      <div className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`w-72 bg-white h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> Menu PrecificaJá</div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
            </div>
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'inicio' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={16}/> Início</button>
              <button onClick={() => setActiveTab('criar')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'criar' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Plus size={16}/> Orçar</button>
              
              <button onClick={() => setActiveTab('perfil')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'perfil' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Settings size={16}/> Perfil da Loja</button>
              <button onClick={() => setActiveTab('anotacoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'anotacoes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Calendar size={16}/> Agenda / Tarefas </button>

              <button onClick={() => setActiveTab('financeiro')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'financeiro' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Calculator size={16}/> Configurações de Custos</button>
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><History size={16}/> Histórico de Orçamentos</button>
              <button onClick={() => setActiveTab('balcao')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'balcao' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><ShoppingCart size={16}/> Balcão de Vendas Rápido</button>
              <button onClick={() => setActiveTab('catalogo')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'catalogo' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><BookOpen size={16}/> Meu Catálogo Visual</button>
              
              <button onClick={() => setActiveTab('fornecedores')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'fornecedores' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Globe size={16}/> Biblioteca Fornecedores </button>
              
              <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><Package size={16}/> Armário / Insumos</button>
              <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}><User size={16}/> Meus Clientes</button>

              {/* ABA SUPORTE NO HAMBÚRGUER DIRECIONANDO PARA O WHATSAPP */}
              <a href="https://wa.me/5521983858055?text=Ol%C3%A1!%20Estou%20usando%20o%20PrecificaJ%C3%A1%20e%20fiquei%20com%20uma%20d%C3%BAvida.%20Pode%20me%20ajudar%3F" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-emerald-600 hover:bg-emerald-50">
                <MessageCircle size={16}/> Suporte
              </a>
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

            <div className="bg-white p-5 rounded-[35px] border shadow-sm w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-purple-700 font-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Calendar size={16}/> Agenda da Semana
                </h3>
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md font-bold uppercase">Mês Atual</span>
              </div>
              
              <div className="flex justify-between gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
                {proximosSeteDias.map((dia) => {
                  const isActive = diaSelecionadoAgenda === dia.stringData;
                  return (
                    <div 
                      key={dia.stringData} 
                      onClick={() => setDiaSelecionadoAgenda(dia.stringData)}
                      className="flex flex-col items-center gap-1 cursor-pointer min-w-[46px] select-none"
                    >
                      <span className={`text-[10px] font-bold ${isActive ? 'text-orange-500 font-extrabold' : 'text-slate-400'}`}>
                        {dia.diaSemanaTexto}
                      </span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all border ${isActive ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-105' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                        {dia.diaNumero}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 w-full">
                {anotacoesDoDiaSelecionado.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 animate-fadeIn">
                    <button onClick={() => toggleStatusAnotacao(item.id, item.concluido)} className="text-purple-600 mt-0.5 shrink-0">
                      {item.concluido ? <CheckSquare size={19} /> : <Square size={19} className="text-slate-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{item.titulo}</p>
                      {item.conteudo && <p className="text-xs text-slate-500 truncate">{item.conteudo}</p>}
                    </div>
                  </div>
                ))}

                {anotacoesDoDiaSelecionado.length === 0 && (
                  <p className="text-center text-xs font-bold text-slate-400 py-4 italic">
                    ✨ Nenhuma pendência agendada para este dia!
                  </p>
                )}
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

        {/* TELA DE PERFIL DA LOJA */}
        {activeTab === 'perfil' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Settings size={18}/> Perfil da Minha Loja</h2>
              <p className="text-slate-400 text-[11px] mb-6">Personalize o aplicativo com a sua marca. O logo e o nome definidos aqui aparecerão no topo de todos os seus orçamentos em PDF!</p>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Logo Oficial da Empresa</label>
              <div className="mb-5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px] w-full">
                {logoLojaPerfil ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden flex items-center justify-center bg-white p-2">
                    <img src={logoLojaPerfil} alt="Logo da Loja" className="max-w-full max-h-full object-contain" />
                    <button onClick={() => setLogoLojaPerfil('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors w-full h-full justify-center py-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-purple-600">
                      <Camera size={22} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">
                      {subindoLogo ? 'Enviando Imagem...' : '📸 Enviar Logo da Empresa'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={subindoLogo} />
                  </label>
                )}
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Comercial da Loja</label>
              <input 
                placeholder="Ex: Loop Criative" 
                className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold text-slate-800 outline-none border focus:border-purple-400" 
                value={nomeLojaPerfil} 
                onChange={e => setNomeLojaPerfil(e.target.value)} 
              />

              <button onClick={async () => {
                try {
                  await setDoc(doc(db, "configuracoes_loja", user.uid), {
                    nomeLoja: nomeLojaPerfil.trim(),
                    logoUrl: logoLojaPerfil
                  }, { merge: true });
                  alert("Perfil da empresa atualizado com sucesso! 🚀");
                  setActiveTab('inicio');
                } catch {
                  alert("Erro ao salvar as configurações da empresa.");
                }
              }} className="w-full bg-purple-700 hover:bg-purple-800 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md transition-colors" disabled={subindoLogo}>
                Salvar Configurações da Marca
              </button>
            </div>
          </div>
        )}

        {/* TELA DE CONFIGURAÇÃO DE CUSTOS FIXOS CORRIGIDA PARA CELULAR */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Calculator size={18}/> Estrutura de Custos Fixos</h2>
              <p className="text-slate-400 text-[11px] mb-4">Estes são seus gastos operacionais fixos mensais para manter a empresa aberta.</p>

              <label className="text-[10px] font-bold text-purple-700 uppercase ml-1">1. Pró-labore (Seu Salário Mensal)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 font-bold text-purple-700 outline-none" value={financasFixo.salario} onChange={e => setFinancasFixo({...financasFixo, salario: e.target.value})} />

              <div className="grid grid-cols-2 gap-3 mb-3 w-full">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">2. Aluguel / Espaço</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.aluguel} onChange={e => setFinancasFixo({...financasFixo, aluguel: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">3. Internet / Sistemas</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.internet} onChange={e => setFinancasFixo({...financasFixo, internet: e.target.value})} />
                </div>
              </div>

              <div className="mb-4 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">4. Conta de Luz Base</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.luz} onChange={e => setFinancasFixo({...financasFixo, luz: e.target.value})} />
              </div>

              {/* AREA DOS CUSTOS EXTRAS DINÂMICOS - COMPACTADO COM GRID PARA NÃO QUEBRAR EM CELULAR */}
              <div className="border-t border-dashed border-slate-200 pt-3 mt-4 space-y-2.5 w-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">💸 Custos Fixos Adicionais Personalizados</label>
                
                {financasFixo.custosExtras?.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center animate-fadeIn w-full">
                    <input 
                      type="text" 
                      placeholder="Ex: Canva, MEI" 
                      className="w-[60%] p-3.5 bg-slate-50 border rounded-2xl text-xs font-bold outline-none"
                      value={item.nome}
                      onChange={e => {
                        const listaCopiada = [...financasFixo.custosExtras];
                        listaCopiada[idx].nome = e.target.value;
                        setFinancasFixo({...financasFixo, custosExtras: listaCopiada});
                      }}
                    />
                    <input 
                      type="number" 
                      placeholder="0,00" 
                      className="w-[30%] p-3.5 bg-slate-50 border rounded-2xl text-xs font-bold text-center outline-none"
                      value={item.valor}
                      onChange={e => {
                        const listaCopiada = [...financasFixo.custosExtras];
                        listaCopiada[idx].valor = e.target.value;
                        setFinancasFixo({...financasFixo, custosExtras: listaCopiada});
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const filtrados = financasFixo.custosExtras.filter((_, i) => i !== idx);
                        setFinancasFixo({...financasFixo, custosExtras: filtrados});
                      }}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-lg shrink-0">
                      <X size={16}/>
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={() => {
                    const novoItemExtra = { id: String(Date.now()), nome: '', valor: '0' };
                    setFinancasFixo({
                      ...financasFixo, 
                      custosExtras: [...(financasFixo.custosExtras || []), novoItemExtra]
                    });
                  }}
                  className="w-full text-center py-4 px-3 border border-dashed rounded-2xl bg-purple-50/50 hover:bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider transition-colors mt-2">
                  + Adicionar outro custo fixo
                </button>
              </div>

              <div className="w-full border-t mt-4 pt-2">
                <h3 className="text-purple-700 font-bold text-xs uppercase tracking-wider mb-2 mt-2">Sua Carga Horária</h3>
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
              </div>

              <button onClick={async () => {
                await setDoc(doc(db, "configuracoes_financeiras", user.uid), financasFixo);
                
                const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                const somaCustosExtrasDinamicos = (financasFixo.custosExtras || []).reduce((acc, item) => acc + Number(item.valor || 0), 0);
                
                const intentCustos = Number(financasFixo.salario || 0) + Number(financasFixo.aluguel || 0) + Number(financasFixo.internet || 0) + Number(financasFixo.luz || 0) + somaCustosExtrasDinamicos;
                if (totalHoras > 0 && intentCustos > 0) setVHora((intentCustos / totalHoras).toFixed(2));
                
                alert("Todos os custos estruturais foram salvos com sucesso no banco de dados! A calculadora já recalculou seu valor por hora. 🎉🚀");
              }} className="w-full bg-purple-700 hover:bg-purple-800 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md transition-colors">
                Save Configurações Fixas
              </button>
            </div>

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
                if(!novoEquipamento.nome || !novoEquipamento.valorPago) return alert("Preencha o nome e o preço do equipamento!");
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
                    try { await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true }); alert("WhatsApp salvo!"); } 
                    catch { alert("Erro ao salvar."); }
                  }} className="bg-orange-500 text-white text-xs font-black uppercase px-4 rounded-xl shadow">Salvar</button>
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

        {/* MEU CATÁLOGO VISUAL MUDADO COM MODO EDIÇÃO E SELETOR DE CATEGORIAS (TAGS) */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                <BookOpen size={18}/> {novoProdCatalogo.id ? '✏️ Editando Item do Catálogo' : 'Novo Item de Venda Fixa'}
              </h2>
              
              {novoProdCatalogo.id && (
                <button onClick={() => setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [] })} className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide mb-4 active:scale-95 transition-all block">Cancelar Modo Edição ❌</button>
              )}

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
              <input placeholder="Ex: Caneca Alça Coração" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-medium text-sm border focus:border-purple-400" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Fixo de Venda (R$)</label>
              <input type="number" placeholder="Ex: 35.00" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-purple-700 border focus:border-purple-400" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />

              {/* SELETOR DE CATEGORIAS MÚLTIPLAS POR TAGS */}
              <div className="mb-5 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Categorias do Produto (Selecione Múltiplas)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasProd.map(cat => {
                    const marcado = novoProdCatalogo.categorias?.includes(cat.nome) || false;
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoriaNoProduto(cat.nome)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'bg-purple-700 text-white border-purple-700 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
                
                {!mostrarInputNovaCatProd ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatProd(true)} className="text-[10px] text-purple-600 font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Nova Categoria</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🎨 Brindes Luxo" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaProd} onChange={e => setInputNovaCategoriaProd(e.target.value)} />
                    <button type="button" onClick={async () => {
                      if(!inputNovaCategoriaProd.trim()) return setMostrarInputNovaCatProd(false);
                      await addDoc(collection(db, "categorias_produtos"), { nome: inputNovaCategoriaProd.trim(), userId: user.uid });
                      setInputNovaCategoriaProd(''); setMostrarInputNovaCatProd(false);
                    }} className="bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button onClick={async () => {
                if(!novoProdCatalogo.nome || !novoProdCatalogo.precoVenda) return alert("Preencha o nome e o preço!");
                const d = { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem || '', categorias: novoProdCatalogo.categorias || [], userId: user.uid };
                if (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d);
                else await addDoc(collection(db, "produtos"), d);
                setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [] });
                alert("Produto salvo no catálogo!");
              }} className="w-full bg-purple-700 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" disabled={subindoImagem}>
                {novoProdCatalogo.id ? 'Salvar Alterações 📝' : 'Salvar no Catálogo 📖'}
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
                    {p.categorias && p.categorias.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {p.categorias.map((c: string, i: number) => (
                          <span key={i} className="text-[8px] bg-slate-100 font-bold text-slate-500 px-1.5 py-0.5 rounded uppercase">{c.split(' ')[0]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">Vender 🛍️</button>
                    <button onClick={() => setNovoProdCatalogo({ id: p.id, nome: p.nome, precoVenda: String(p.precoVenda), urlImagem: p.urlImagem || '', categorias: p.categorias || [] })} className="text-orange-400 hover:bg-orange-50 p-1.5 rounded-xl"><Edit2 size={15}/></button>
                    <button onClick={() => confirmarExcluir('produto', p.id)} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA DA CALCULADORA COMPOSTA */}
        {activeTab === 'criar' && renderCalculadoraForm()}

        {/* BIBLIOTECA DE FORNECEDORES COMPLETA */}
        {activeTab === 'fornecedores' && (
          <div className="space-y-4 pt-2 w-full animate-fadeIn">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><Globe size={20}/> Cadastrar Novo Fornecedor</h2>
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome da Empresa / Distribuidora</label>
              <input placeholder="Ex: Pampa Papéis" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.nome} onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Site Oficial (Link)</label>
              <input placeholder="Ex: www.pampapapeis.com.br" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.site} onChange={e => setNovoFornecedor({...novoFornecedor, site: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp com DDD</label>
              <input placeholder="Ex: 11999999999" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.whatsapp} onChange={e => setNovoFornecedor({...novoFornecedor, whatsapp: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço Físico (Cidade/Estado)</label>
              <textarea placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none border focus:border-purple-400 resize-none h-16 font-medium text-sm" value={novoFornecedor.endereco} onChange={e => setNovoFornecedor({...novoFornecedor, endereco: e.target.value})} />

              <div className="mb-6 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Categorias do Fornecedor</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasForn.map(cat => {
                    const marcado = novoFornecedor.categorias?.includes(cat.nome) || false;
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoriaNoFornecedor(cat.nome)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'bg-purple-700 text-white border-purple-700 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
                
                {!mostrarInputNovaCatForn ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatForn(true)} className="text-[10px] text-purple-600 font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Categoria de Compras</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🧵 Fitas e Cordões" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaForn} onChange={e => setInputNovaCategoriaForn(e.target.value)} />
                    <button type="button" onClick={async () => {
                      if(!inputNovaCategoriaForn.trim()) return setMostrarInputNovaCatForn(false);
                      await addDoc(collection(db, "categorias_fornecedores"), { nome: inputNovaCategoriaForn.trim(), userId: user.uid });
                      setInputNovaCategoriaForn(''); setMostrarInputNovaCatForn(false);
                    }} className="bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button onClick={async () => {
                if(!novoFornecedor.nome) return alert("Digite o nome do fornecedor!");
                const d = { nome: novoFornecedor.nome, site: novoFornecedor.site, whatsapp: novoFornecedor.whatsapp, endereco: novoFornecedor.endereco, categorias: novoFornecedor.categorias || [], userId: user.uid };
                
                if (novoFornecedor.id) await updateDoc(doc(db, "fornecedores", novoFornecedor.id), d);
                else await addDoc(collection(db, "fornecedores"), d);
                
                setNovoFornecedor({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
                alert("Fornecedor cadastrado com sucesso! 📦🎉");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-md">
                {novoFornecedor.id ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full mt-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Pesquisar por nome do fornecedor..." value={pesquisaFornecedores} onChange={e => setPesquisaFornecedores(e.target.value)} className="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm" />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
                <button onClick={() => setFiltroFornSelecionado('Todos')} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === 'Todos' ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-slate-500'}`}>🌍 Todos</button>
                {categoriasForn.map(cat => (
                  <button key={cat.id} onClick={() => setFiltroFornSelecionado(cat.nome)} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === cat.nome ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-slate-500'}`}>{cat.nome}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              {fornecedoresFiltrados.map(f => (
                <div key={f.id} className="bg-white p-5 rounded-[30px] border shadow-sm flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-base truncate">{f.nome}</h4>
                      {f.endereco && <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1"><MapPin size={12}/> {f.endereco}</p>}
                      {f.categorias && f.categorias.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {f.categorias.map((c: string, idx: number) => (
                            <span key={idx} className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-black uppercase">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setNovoFornecedor({ id: f.id, nome: f.nome, site: f.site || '', whatsapp: f.whatsapp || '', endereco: f.endereco || '', categorias: f.categorias || [] })} className="text-orange-400 p-2 hover:bg-orange-50 rounded-xl"><Edit2 size={16}/></button>
                      <button onClick={() => confirmarExcluir('fornecedor', f.id)} className="text-red-200 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 border-t pt-3 w-full justify-end">
                    {f.site && (
                      <button onClick={() => window.open(f.site.startsWith('http') ? f.site : `https://${f.site}`, '_blank')} className="flex items-center gap-1 text-xs font-black uppercase bg-blue-50 text-blue-600 px-3 py-2 rounded-xl active:scale-95 transition-transform"><Globe size={13}/> Site</button>
                    )}
                    {f.whatsapp && (
                      <button onClick={() => window.open(`https://wa.me/55${f.whatsapp.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-1 text-xs font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl active:scale-95 transition-transform"><MessageCircle size={13}/> WhatsApp</button>
                    )}
                    {f.endereco && (
                      <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(f.endereco)}`, '_blank')} className="flex items-center gap-1 text-xs font-black uppercase bg-slate-50 text-slate-600 px-3 py-2 rounded-xl active:scale-95 transition-transform"><MapPin size={13}/> Mapa</button>
                    )}
                  </div>
                </div>
              ))}
              
              {fornecedoresFiltrados.length === 0 && (
                <p className="text-center font-bold text-xs text-slate-400 py-6 italic">Nenhum fornecedor cadastrado nesta seção. 📦</p>
              )}
            </div>
          </div>
        )}

        {/* HISTÓRICO DE ORÇAMENTOS EXPANDIDO E SEPARADO POR STATUS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <div className="flex justify-between items-center mb-1 w-full">
              <h2 className="text-purple-700 font-bold flex items-center gap-2"><History size={20}/> Histórico da Loja</h2>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full mb-4 border">
              <button onClick={() => setFiltroStatusPedido('Pendente')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Pendente' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400'}`}>Pendentes ⏳</button>
              <button onClick={() => setFiltroStatusPedido('Vendido')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Vendido' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Vendidos 💰</button>
              <button onClick={() => setFiltroStatusPedido('Cancelado')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Cancelado' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Cancelados ❌</button>
            </div>

            {pedidosFiltradosPorStatus.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               const statusAtual = p.status || 'Pendente';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p className="font-black text-[10px] uppercase text-purple-700 mb-1">
                          {cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={statusAtual.includes('Vendido') ? "text-emerald-500" : statusAtual.includes('Cancelado') ? "text-red-400" : "text-orange-400"}>{statusAtual}</span>
                        </p>
                        <div className="font-bold text-slate-700 text-sm whitespace-pre-line">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">({p.qtdPed || 1} un)</span></div>
                        
                        {cli && (cli.zap || cli.email || cli.endereco) && (
                          <div className="mt-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 space-y-0.5">
                            {cli.zap && <p>📱 WhatsApp: <span className="font-semibold text-slate-600">{cli.zap}</span></p>}
                            {cli.email && <p>✉️ E-mail: <span className="font-semibold text-slate-600">{cli.email}</span></p>}
                            {cli.endereco && <p className="mt-1">📍 Entrega: <span className="font-semibold text-slate-600 whitespace-pre-line">{cli.endereco}</span></p>}
                          </div>
                        )}

                        {p.obsPedido && (
                          <p className="text-[11px] text-purple-600 bg-purple-50 p-2 rounded-lg font-medium border border-purple-100 mt-2">🗒️ Notas: {p.obsPedido}</p>
                        )}
                     </div>
                     <div className="text-orange-500 font-black text-xl shrink-0">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1 w-full">
                      {statusAtual === 'Pendente' && (
                        <>
                          <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto active:scale-95"><CheckCircle size={16}/> Confirmar Venda</button>
                          <button onClick={() => carregarPedidoParaEdicao(p)} className="text-purple-600 p-2 bg-purple-50 rounded-xl"><Edit2 size={18}/></button>
                          <button onClick={() => cancelarPedidoSemExcluir(p.id)} title="Cancelar Orçamento" className="text-red-500 p-2 bg-red-50 rounded-xl"><X size={18}/></button>
                        </>
                      )}
                      
                      <button onClick={() => handleDuplicarOrcamento(p)} title="Duplicar este Orçamento" className="text-blue-500 p-2 bg-blue-50 rounded-xl active:scale-95 transition-transform"><Copy size={18}/></button>
                      
                      <button onClick={() => gerarPDF(p)} className="text-orange-500 p-2 bg-orange-50 rounded-xl"><Printer size={18}/></button>
                      <button onClick={() => enviarZap({nomeProd: p.nomeProd, preco: p.preco, clienteId: p.clienteId, prazo: p.prazo, qtdPed: p.qtdPed})} className="text-emerald-500 p-2 bg-emerald-50 rounded-xl"><MessageCircle size={18}/></button>
                      <button onClick={() => confirmarExcluir('pedido', p.id)} className="text-red-200 p-2"><Trash2 size={18}/></button>
                   </div>
                 </div>
               );
            })}

            {pedidosFiltradosPorStatus.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-xs font-bold bg-white rounded-[30px] border shadow-sm">
                Nenhum pedido nesta categoria no momento. 🎉
              </div>
            )}
          </div>
        )}

        {/* GERENCIAR ARMÁRIO / INSUMOS */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package size={20}/> Gerenciar Armário</h2>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Insumo</label>
              <input placeholder="Ex: Caneca Cerâmica" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-medium text-sm border focus:border-purple-400" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              <div className="grid grid-cols-3 gap-3 mb-3 w-full">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Unidade/Caixa/Rolo</label>
                  <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-sm border focus:border-purple-400" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">Rende Quantos?</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center font-medium text-sm border focus:border-purple-400" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div>
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">Estoque Atual</label>
                  <input type="number" className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold text-purple-700 border focus:border-purple-400" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Mínimo Alerta</label>
                  <input type="number" className="w-full p-4 bg-red-50 rounded-2xl outline-none text-center font-bold text-red-700 border focus:border-purple-400" value={novoMat.qtdMinima} onChange={e => setNovoMat({...novoMat, qtdMinima: e.target.value})} />
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
                alert("Material Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">
                {novoMat.id ? 'Atualizar Insumo' : 'Salvar no Armário'}
              </button>
            </div>

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
                    <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}

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
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Comercial / Completo</label>
              <input placeholder="Ex: Maria Silva" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp com DDD</label>
              <input placeholder="Ex: 21999999999" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail de Contato</label>
              <input type="email" placeholder="Ex: cliente@email.com" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.email || ''} onChange={e => setNovoCli({...novoCli, email: e.target.value})} />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço de Entrega Completo</label>
              <textarea placeholder="Rua, Número, Bairro, Cidade, CEP..." className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none border focus:border-purple-400 resize-none h-20 font-medium text-sm" value={novoCli.endereco || ''} onChange={e => setNovoCli({...novoCli, endereco: e.target.value})} />

              <button onClick={async () => {
                if(!novoCli.nome) return alert("Digite o nome do cliente!");
                
                const dadosCliente = { 
                  nome: novoCli.nome, 
                  zap: novoCli.zap, 
                  email: novoCli.email || '', 
                  endereco: novoCli.endereco || '', 
                  userId: user.uid 
                };

                if(novoCli.id) await updateDoc(doc(db, "clientes", novoCli.id), dadosCliente);
                else await addDoc(collection(db, "clientes"), dadosCliente);
                
                setNovoCli({ id: '', nome: '', zap: '', email: '', endereco: '' }); 
                alert("Cadastro do cliente salvo com sucesso! 🎉");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl flex flex-col gap-2 border shadow-sm font-bold w-full mb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col ml-2">
                    <span className="text-slate-800 text-base">{c.nome}</span>
                    <span className="text-xs text-slate-400 font-normal mt-0.5">{c.zap ? `📱 ${c.zap}` : 'Sem número'}</span>
                    {c.email && <span className="text-xs text-slate-400 font-normal mt-0.5">✉️ {c.email}</span>}
                    {c.endereco && <span className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100 whitespace-pre-line">📍 {c.endereco}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setNovoCli({ id: c.id, nome: c.nome, zap: c.zap || '', email: c.email || '', endereco: c.endereco || '' })} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                    <button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200 p-2"><Trash2 size={20}/></button>
                  </div>
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
