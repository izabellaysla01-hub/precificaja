import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc, Timestamp, limit, startAfter, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu, Search, Settings, CheckSquare, Square, Filter, MapPin, Globe, Palette, TrendingUp, ChevronDown, ChevronUp, FileText, Megaphone, LifeBuoy } from 'lucide-react';

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

const PRESET_PALETTES = [
  { id: 'purple_creative', nome: 'Roxo Criativo (Padrão)', primary: '#7c3aed', primaryHover: '#6d28d9', secondary: '#f97316', secondaryHover: '#ea580c' },
  { id: 'blue_corporate', nome: 'Azul Corporativo', primary: '#2563eb', primaryHover: '#1d4ed8', secondary: '#38bdf8', secondaryHover: '#0284c7' },
  { id: 'slate_elegant', nome: 'Grafite Elegante', primary: '#334155', primaryHover: '#1e293b', secondary: '#0ea5e9', secondaryHover: '#0284c7' },
  { id: 'emerald_growth', nome: 'Verde Esmeralda', primary: '#059669', primaryHover: '#047857', secondary: '#10b981', secondaryHover: '#059669' }
];

const TELAS_ONBOARDING = [
  { emoji: '🚀', titulo: 'Bem-vinda ao PrecificaJá!', texto: 'Em menos de 1 minuto você monta um orçamento completo, com PDF pronto pra mandar no WhatsApp do cliente.' },
  { emoji: '🧮', titulo: 'Passo 1: Orçar', texto: 'Toque em "Orçar", digite o nome do produto, adicione os materiais usados e o tempo gasto. O app calcula o preço sugerido automaticamente.' },
  { emoji: '📦', titulo: 'Passo 2: Armário de Insumos', texto: 'Cadastre seus materiais uma vez só. Toda vez que for orçar, é só selecionar da lista — sem digitar preço de novo.' },
  { emoji: '📄', titulo: 'Passo 3: PDF e WhatsApp', texto: 'Ao salvar, o app gera um PDF profissional e você pode mandar direto pro WhatsApp do cliente com 1 toque.' },
];

const CHANGELOG_APP = [
  {
    data: '28/08/2026',
    titulo: 'Fluxo de caixa, canais de venda e vitrine renovada',
    itens: [
      'Nova aba Fluxo de Caixa: entradas e saídas, compra de material vinculada ao estoque, histórico mensal e sincronização de vendas antigas',
      'Nova aba Canais de Venda: cadastre a comissão de Shopee, Mercado Livre etc. e simule o lucro líquido antes de vender',
      'Sinal / pagamento parcial em Pedidos e Contratos: registre o sinal na hora e, ao confirmar o recebimento total, só o saldo restante entra no caixa',
      'Nova sub-aba Histórico dentro de Contratos, com filtro por mês/ano — contratos com recebimento total confirmado vão pra lá automaticamente',
      'Layout de desktop: menu lateral fixo e mais espaço de tela em telas grandes',
      'Catálogo: produtos agora podem ter galeria de fotos, descrição, variações que somam ao preço (ex: tipo de encadernação) e campo de personalização',
      'Vitrine pública renovada: banner e logo da loja, busca, grade de produtos, carrinho flutuante, checkout em etapas (pedido → dados → pagamento) e tela de "Pedido enviado"',
      'Link personalizado da vitrine (ex: ?loja=minha-loja), configurável no Perfil da Loja'
    ]
  },
  {
    data: '24/08/2026',
    titulo: 'Estabilidade, agilidade e controle financeiro',
    itens: [
      'Avisos e confirmações agora aparecem como notificações discretas (toasts), sem travar a tela',
      'Botões de salvar ficam desativados durante o envio — evita duplicar pedidos, produtos e contratos com cliques repetidos',
      'Histórico de vendas agora usa data e hora reais internamente, deixando os relatórios mais precisos',
      'Histórico de Pedidos carrega por páginas, com botão "Carregar mais" — mais rápido pra quem já tem muitas vendas',
      'Baixa de estoque no Balcão de Vendas agora pode usar a receita de materiais do produto, mais precisa que a busca por nome (o método antigo continua funcionando pra quem não configurar a receita)',
      'Onboarding de boas-vindas pra quem está usando o app pela primeira vez',
      'Novo card "Próximas Entregas" na Tela Inicial',
      'Histórico de preços praticados por produto do catálogo',
      'Alerta de margem de lucro abaixo do mínimo configurado ao montar um orçamento',
      'Aviso quando um material do Armário está sem atualização de preço há muito tempo',
      'Tarefas e pedidos do Kanban agora têm prioridade (baixa/média/alta) e destaque visual quando o prazo está perto de vencer',
      'Templates de contrato: salve cláusulas prontas e reutilize em novos contratos'
    ]
  },
  {
    data: '23/08/2026',
    titulo: 'Tarefas em vários dias e Kanban de pedidos',
    itens: [
      'Uma tarefa pode aparecer em vários dias da Agenda sem virar várias tarefas separadas',
      'Status "Em Produção" nos pedidos: mande um pedido pro Kanban com 1 clique',
      'Confirme a venda direto pelo card do Kanban quando o pedido chegar em "Feito"'
    ]
  },
  {
    data: '22/08/2026',
    titulo: 'Busca e organização',
    itens: [
      'Busca por nome nos Contratos',
      'Busca por nome nos Materiais dentro da Calculadora de orçamento',
      'Novo botão de Pedido no Kanban, separado das Tarefas soltas da Agenda',
      'Nova aba de Atualizações e Suporte no menu'
    ]
  }
];

const Toast = ({ toast }: { toast: { msg: string; tipo: 'sucesso' | 'erro' | 'aviso' } | null }) => {
  if (!toast) return null;
  const cores = { sucesso: '#10b981', erro: '#ef4444', aviso: '#f59e0b' };
  return (
    <div
      style={{ backgroundColor: cores[toast.tipo] }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl z-[100] animate-fadeIn max-w-[90vw] text-center"
    >
      {toast.msg}
    </div>
  );
};

const ConfirmModal = ({ modal, onCancel, onConfirm }: { modal: { msg: string } | null; onCancel: () => void; onConfirm: () => void }) => {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-6" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-bold text-slate-700 mb-5">{modal.msg}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs uppercase py-3 rounded-xl">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white font-bold text-xs uppercase py-3 rounded-xl">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const ModalSinal = ({ item, valor, setValor, onCancel, onConfirmar }: { item: any; valor: string; setValor: (v: string) => void; onCancel: () => void; onConfirmar: () => void }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-6" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-bold text-slate-700 mb-1">Registrar sinal recebido</p>
        <p className="text-xs text-slate-400 mb-4">{item.titulo} — Total: R$ {Number(item.total || 0).toFixed(2)}</p>
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor do Sinal (R$)</label>
        <input type="number" autoFocus className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold border" value={valor} onChange={e => setValor(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs uppercase py-3 rounded-xl">Cancelar</button>
          <button onClick={onConfirmar} className="flex-1 bg-emerald-500 text-white font-bold text-xs uppercase py-3 rounded-xl">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const OnboardingCarrossel = ({ onFinalizar }: { onFinalizar: () => void }) => {
  const [step, setStep] = useState(0);
  const tela = TELAS_ONBOARDING[step];
  const ultimaTela = step === TELAS_ONBOARDING.length - 1;

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-6">{tela.emoji}</div>
      <h2 className="text-xl font-black text-purple-700 mb-3">{tela.titulo}</h2>
      <p className="text-slate-500 text-sm mb-10 max-w-sm">{tela.texto}</p>

      <div className="flex gap-1.5 mb-8">
        {TELAS_ONBOARDING.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-purple-600' : 'w-1.5 bg-slate-200'}`} />
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        {!ultimaTela && (
          <button onClick={onFinalizar} className="flex-1 text-slate-400 font-bold text-xs uppercase py-3">Pular</button>
        )}
        <button
          onClick={() => ultimaTela ? onFinalizar() : setStep(step + 1)}
          className="flex-1 bg-purple-600 text-white font-black text-xs uppercase py-3.5 rounded-2xl"
        >
          {ultimaTela ? 'Começar a Usar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
};

const SignaturePad = ({ onSave, corTraco = '#1e293b' }: { onSave: (dataUrl: string) => void; corTraco?: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [desenhando, setDesenhando] = useState(false);
  const [temTraco, setTemTraco] = useState(false);
  const tracosRef = React.useRef<{ x: number; y: number }[][]>([]);

  const redesenharTudo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = corTraco;
    tracosRef.current.forEach(traco => {
      if (traco.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(traco[0].x, traco[0].y);
      traco.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  const configurarCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ratio = window.devicePixelRatio || 1;
    const largura = container.offsetWidth;
    const altura = container.offsetHeight;
    if (largura === 0 || altura === 0) return;
    canvas.width = largura * ratio;
    canvas.height = altura * ratio;
    canvas.style.width = `${largura}px`;
    canvas.style.height = `${altura}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    redesenharTudo();
  };

  useEffect(() => {
    configurarCanvas();
    const observer = new ResizeObserver(() => configurarCanvas());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [corTraco]);

  const pegarPosicao = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const iniciarTraco = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = pegarPosicao(e);
    tracosRef.current.push([{ x, y }]);
    setDesenhando(true);
  };

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    if (!desenhando) return;
    e.preventDefault();
    const { x, y } = pegarPosicao(e);
    const tracoAtual = tracosRef.current[tracosRef.current.length - 1];
    tracoAtual.push({ x, y });
    redesenharTudo();
    setTemTraco(true);
  };

  const pararTraco = () => setDesenhando(false);

  const limpar = () => {
    tracosRef.current = [];
    redesenharTudo();
    setTemTraco(false);
  };

  const salvar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !temTraco) return alert('Desenhe sua assinatura antes de salvar!');
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full">
      <div ref={containerRef} className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden w-full h-48">
        <canvas
          ref={canvasRef}
          className="touch-none bg-white block"
          onMouseDown={iniciarTraco}
          onMouseMove={desenhar}
          onMouseUp={pararTraco}
          onMouseLeave={pararTraco}
          onTouchStart={iniciarTraco}
          onTouchMove={desenhar}
          onTouchEnd={pararTraco}
        />
      </div>
      <p className="text-[10px] text-slate-400 text-center mt-1">Desenhe sua assinatura acima com o dedo ou mouse</p>
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={limpar} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs uppercase py-3 rounded-xl">Limpar</button>
        <button type="button" onClick={salvar} className="flex-1 bg-emerald-500 text-white font-bold text-xs uppercase py-3 rounded-xl">Confirmar Assinatura</button>
      </div>
    </div>
  );
};

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

  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' | 'aviso' } | null>(null);
  const [modalConfirm, setModalConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [salvando, setSalvando] = useState<{ [key: string]: boolean }>({});
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  const showToast = (msg: string, tipo: 'sucesso' | 'erro' | 'aviso' = 'sucesso') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmar = (msg: string, onConfirm: () => void) => {
    setModalConfirm({ msg, onConfirm });
  };

  const finalizarOnboarding = async () => {
    setMostrarOnboarding(false);
    if (user) {
      try { await setDoc(doc(db, "configuracoes_loja", user.uid), { onboardingVisto: true }, { merge: true }); } catch {}
    }
  };

  const [idLojaPublica, setIdLojaPublica] = useState<string | null>(null);
  const [produtosPublicos, setProdutosPublicos] = useState<any[]>([]);
  const [carregandoPublico, setCarregandoPublico] = useState(false);
  const [carrinhoPublico, setCarrinhoPublico] = useState<{ itemId: string; produtoId: string; nome: string; precoUnitario: number; detalhe: string; qtd: number }[]>([]);
  const [produtoDetalheAberto, setProdutoDetalheAberto] = useState<any>(null);
  const [imagemAtivaDetalhe, setImagemAtivaDetalhe] = useState(0);
  const [variacoesEscolhidas, setVariacoesEscolhidas] = useState<{ [grupoId: string]: string }>({});
  const [personalizacaoTexto, setPersonalizacaoTexto] = useState('');
  const [qtdDetalhe, setQtdDetalhe] = useState(1);
  const [telefoneComprador, setTelefoneComprador] = useState('');
  const [modalidadeEntrega, setModalidadeEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [enderecoComprador, setEnderecoComprador] = useState('');
  const [formaPagamentoComprador, setFormaPagamentoComprador] = useState<'pix' | 'dinheiro_sinal' | 'cartao_credito' | 'cartao_debito'>('pix');
  const [observacoesComprador, setObservacoesComprador] = useState('');
  const [nomeComprador, setNomeComprador] = useState('');
  const [zapDaLojaPublica, setZapDaLojaPublica] = useState('');

  const [filtroVitrineSelecionado, setFiltroVitrineSelecionado] = useState('Todos');
  const [isMenuFiltroVitrineOpen, setIsMenuFiltroVitrineOpen] = useState(false);

  const [assinaturaLojaUrl, setAssinaturaLojaUrl] = useState('');
  const [mostrarPadAssinaturaLoja, setMostrarPadAssinaturaLoja] = useState(false);
  const [idContratoParaAssinar, setIdContratoParaAssinar] = useState<string | null>(null);
  const [contratoParaAssinar, setContratoParaAssinar] = useState<any>(null);
  const [clienteDoContratoAssinar, setClienteDoContratoAssinar] = useState<any>(null);
  const [carregandoAssinatura, setCarregandoAssinatura] = useState(false);
  const [assinaturaEnviada, setAssinaturaEnviada] = useState(false);

  const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo' | 'balcao' | 'financeiro' | 'perfil' | 'anotacoes' | 'fornecedores' | 'contratos' | 'atualizacoes' | 'suporte' | 'comissoes' | 'caixa'>('inicio');

  const [subAbaFinanceiro, setSubAbaFinanceiro] = useState<'geral' | 'impressao' | 'equipamentos' | 'historico'>('geral');

  const [mesFiltroHistorico, setMesFiltroHistorico] = useState<string>(String(new Date().getMonth() + 1));
  const [anoFiltroHistorico, setAnoFiltroHistorico] = useState<string>(String(new Date().getFullYear()));
  const [mesExpandido, setMesExpandido] = useState<string | null>(null);

  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [ultimoDocPedido, setUltimoDocPedido] = useState<any>(null);
  const [temMaisPedidos, setTemMaisPedidos] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const TAMANHO_PAGINA = 30;
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [anotacoes, setAnotacoes] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [templatesContrato, setTemplatesContrato] = useState<any[]>([]);

  const [categoriasProd, setCategoriasProd] = useState<any[]>([]);
  const [categoriasForn, setCategoriasForn] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [canaisVenda, setCanaisVenda] = useState<any[]>([]);
  const [novoCanal, setNovoCanal] = useState({ id: '', nome: '', comissaoPercent: '', taxaFixa: '0' });
  const [custoTesteComissao, setCustoTesteComissao] = useState('0');
  const [precoTesteComissao, setPrecoTesteComissao] = useState('0');
  const [movimentacoesCaixa, setMovimentacoesCaixa] = useState<any[]>([]);
  const [novaMovimentacao, setNovaMovimentacao] = useState({ tipo: 'saida', descricao: '', valor: '', materialVinculado: '', qtdComprada: '' });
  const [filtroTipoCaixa, setFiltroTipoCaixa] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [mostrarModalSinal, setMostrarModalSinal] = useState<any>(null);
  const [valorSinalInput, setValorSinalInput] = useState('');

  const [pesquisaMateriais, setPesquisaMateriais] = useState('');
  const [pesquisaFornecedores, setPesquisaFornecedores] = useState('');
  const [filtroFornSelecionado, setFiltroFornSelecionado] = useState('Todos');
  const [pesquisaContratos, setPesquisaContratos] = useState('');
  const [subAbaContratos, setSubAbaContratos] = useState<'ativos' | 'historico'>('ativos');
  const [mesFiltroContratosHist, setMesFiltroContratosHist] = useState<string>('Todos');
  const [anoFiltroContratosHist, setAnoFiltroContratosHist] = useState<string>('Todos');
  const [pesquisaMatsCalculadora, setPesquisaMatsCalculadora] = useState('');

  const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

  const [filtroStatusPedido, setFiltroStatusPedido] = useState<'Pendente' | 'Produção' | 'Vendido' | 'Cancelado'>('Pendente');
  const [isDuplicando, setIsDuplicando] = useState(false);

  const [diaSelecionadoAgenda, setDiaSelecionadoAgenda] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subAbaAnotacoes, setSubAbaAnotacoes] = useState<'agenda' | 'kanban'>('agenda');
  const [itemArrastandoId, setItemArrastandoId] = useState<string | null>(null);
  const [colunaAlvoOver, setColunaAlvoOver] = useState<string | null>(null);
  const [datasExtras, setDatasExtras] = useState<string[]>([]);
  const [novaDataExtra, setNovaDataExtra] = useState(new Date().toISOString().split('T')[0]);

  const [modoCalculo, setModoCalculo] = useState<'peca' | 'lote'>('peca');

  const [nomeProd, setNomeProd] = useState('');
  const [detalhamentoPed, setDetalhamentoPed] = useState('');
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
  const [produtoCatalogoSelecionadoId, setProdutoCatalogoSelecionadoId] = useState<string | null>(null);
  const [docObsPedido, setDocObsPedido] = useState('');

  const [precoFinalDigitado, setPrecoFinalDigitado] = useState<string>('0.00');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });

  const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '', email: '', endereco: '', cpfCnpj: '' });
  const [novaAnotacao, setNovaAnotacao] = useState({ id: '', titulo: '', conteudo: '', dataPrazo: new Date().toISOString().split('T')[0], prioridade: 'media' });

  const [novoProdCatalogo, setNovoProdCatalogo] = useState<{id: string, nome: string, precoVenda: string, urlImagem: string, categorias: string[], materiaisAssociados: {id: string, nome: string, qtdUsada: number}[], imagens: string[], descricao: string, variacoes: {id: string, nome: string, opcoes: {id: string, label: string, precoAdicional: string}[]}[], personalizavel: boolean, personalizacaoPlaceholder: string}>({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [], materiaisAssociados: [], imagens: [], descricao: '', variacoes: [], personalizavel: false, personalizacaoPlaceholder: 'Ex: nome, cor, tema, data da entrega...' });
  const [novoGrupoVariacaoNome, setNovoGrupoVariacaoNome] = useState('');
  const [inputNovaCategoriaProd, setInputNovaCategoriaProd] = useState('');
  const [mostrarInputNovaCatProd, setMostrarInputNovaCatProd] = useState(false);

  const [novoFornecedor, setNovoFornecedor] = useState<{id: string, nome: string, site: string, whatsapp: string, endereco: string, categorias: string[]}>({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
  const [inputNovaCategoriaForn, setInputNovaCategoriaForn] = useState('');
  const [mostrarInputNovaCatForn, setMostrarInputNovaCatForn] = useState(false);

  const [zapDonaConta, setZapDonaConta] = useState('');
  const [subindoImagem, setSubindoImagem] = useState(false);

  const [nomeLojaPerfil, setNomeLojaPerfil] = useState('');
  const [nomeFantasiaPerfil, setNomeFantasiaPerfil] = useState('');
  const [cpfCnpjPerfil, setCpfCnpjPerfil] = useState('');
  const [telefonePerfil, setTelefonePerfil] = useState('');
  const [emailPerfil, setEmailPerfil] = useState('');
  const [cepPerfil, setCepPerfil] = useState('');
  const [enderecoPerfil, setEnderecoPerfil] = useState('');
  const [cidadePerfil, setCidadePerfil] = useState('');
  const [estadoPerfil, setEstadoPerfil] = useState('');
  const [dadosBancariosPerfil, setDadosBancariosPerfil] = useState('');
  const [logoLojaPerfil, setLogoLojaPerfil] = useState('');
  const [subindoLogo, setSubindoLogo] = useState(false);
  const [bannerLojaUrl, setBannerLojaUrl] = useState('');
  const [subindoBanner, setSubindoBanner] = useState(false);
  const [slugLojaPerfil, setSlugLojaPerfil] = useState('');
  const [inputSlugLoja, setInputSlugLoja] = useState('');
  const [buscaVitrine, setBuscaVitrine] = useState('');
  const [mostrarCheckoutPublico, setMostrarCheckoutPublico] = useState(false);
  const [etapaCheckout, setEtapaCheckout] = useState<'carrinho' | 'dados' | 'pagamento'>('carrinho');
  const [pedidoPublicoEnviado, setPedidoPublicoEnviado] = useState(false);
  const [suporteZapPerfil, setSuporteZapPerfil] = useState('');

  const [novoContrato, setNovoContrato] = useState({
    id: '',
    clienteId: '',
    tipoEvento: '',
    dataEvento: '',
    localEvento: '',
    valorTotal: '',
    clausulas: `1. DAS PARTES E DO OBJETO\nO presente contrato estabelece os termos para a prestação dos serviços/produtos contratados.\n\n2. DO PAGAMENTO E CONFIRMAÇÃO\nO serviço será iniciado ou reservado mediante confirmação do pagamento acordado entre as partes.\n\n3. DAS CONDIÇÕES DE ENTREGA E CANCELAMENTO\nA entrega ou execução ocorrerá na data e local combinados. Em caso de cancelamento por parte do cliente, aplicar-se-ão os termos acordados prévia e formalmente.`
  });

  const [themeColors, setThemeColors] = useState({
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    secondary: '#f97316',
    secondaryHover: '#ea580c'
  });

  const [financasFixo, setFinancasFixo] = useState({ salario: '0', aluguel: '0', internet: '0', luz: '0', outros: '0', diasTrabalho: '20', horasDia: '8', margemMinima: '30' });
  const [novoEquipamento, setNovoEquipamento] = useState({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });

  const [precoTinta, setPrecoTinta] = useState('62');
  const [unidadeTinta, setUnidadeTinta] = useState('Garrafinha');
  const [qtdCores, setQtdCores] = useState('4');
  const [paginasConjunto, setPaginasConjunto] = useState('1500');

  const [carrinhoInterno, setCarrinhoInterno] = useState<{ [key: string]: number }>({});
  const [clienteBalcao, setClienteBalcao] = useState('');
  const [nomeKitBalcao, setNomeKitBalcao] = useState('');
  const [prazoBalcao, setPrazoBalcao] = useState('');

  const [historicoPrecoAberto, setHistoricoPrecoAberto] = useState<string | null>(null);
  const [historicoPrecoDados, setHistoricoPrecoDados] = useState<any[]>([]);

  const setActiveTab = (tab: any) => {
    useStateActiveTab(tab);
    setIsMenuOpen(false);
  };

  const colunasKanban = [
    { id: 'a_fazer', nome: 'A Fazer', emoji: '📋', cor: '#94a3b8' },
    { id: 'fazendo', nome: 'Fazendo', emoji: '🔧', cor: themeColors.secondary },
    { id: 'feito', nome: 'Feito', emoji: '✅', cor: '#10b981' },
  ];

  const moverStatusKanban = async (id: string, tipo: string, novoStatus: string) => {
    const colecao = tipo === 'pedido' ? 'pedidos' : 'anotacoes';
    await updateDoc(doc(db, colecao, id), { statusKanban: novoStatus });
  };

  const diasRestantes = (dataPrazoStr: string) => {
    if (!dataPrazoStr) return null;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prazoData = new Date(dataPrazoStr + 'T00:00:00');
    return Math.floor((prazoData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Um card por tarefa/pedido — nunca duplica por causa de datas extras
  const itensDoKanban = useMemo(() => {
    const tarefas = anotacoes.filter(a => a.apareceNoKanban && !a.concluido).map(a => ({
      id: a.id, tipo: 'tarefa', titulo: a.titulo, conteudo: a.conteudo, dataPrazo: a.dataPrazo, datasExtras: a.datasExtras || [], statusKanban: a.statusKanban || 'a_fazer', prioridade: a.prioridade || 'media'
    }));
    const pedidosEmProducao = pedidos.filter(p => (p.status || '').includes('Produção')).map(p => {
      const cli = clientes.find(c => c.id === p.clienteId);
      return { id: p.id, tipo: 'pedido', titulo: p.nomeProd, conteudo: cli?.nome ? `Cliente: ${cli.nome}` : '', dataPrazo: p.prazo, datasExtras: [], statusKanban: p.statusKanban || 'a_fazer', prioridade: p.prioridade || 'media' };
    });
    return [...tarefas, ...pedidosEmProducao];
  }, [anotacoes, pedidos, clientes]);

  const custoPorPaginaCalculado = useMemo(() => {
    const preco = Number(precoTinta) || 0;
    const cores = Number(qtdCores) || 0;
    const paginas = Number(paginasConjunto) || 1;
    return paginas > 0 ? (cores * preco) / paginas : 0;
  }, [precoTinta, qtdCores, paginasConjunto]);

  const formatarMoedaLocal = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const comprimirImagem = (file: File, maxLargura = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const escala = Math.min(1, maxLargura / img.width);
          canvas.width = img.width * escala;
          canvas.height = img.height * escala;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lojaId = params.get('loja');
    const contratoId = params.get('assinar');

    if (contratoId) {
      setIdContratoParaAssinar(contratoId);
      setCarregandoAssinatura(true);
      setLoading(false);
      getDoc(doc(db, "contratos", contratoId)).then(async (docSnap) => {
        if (docSnap.exists()) {
          const dadosContrato = { id: docSnap.id, ...docSnap.data() } as any;
          setContratoParaAssinar(dadosContrato);
          if (dadosContrato.clienteId) {
            const cliSnap = await getDoc(doc(db, "clientes", dadosContrato.clienteId));
            if (cliSnap.exists()) setClienteDoContratoAssinar({ id: cliSnap.id, ...cliSnap.data() });
          }
          if (dadosContrato.userId) {
            const lojaSnap = await getDoc(doc(db, "configuracoes_loja", dadosContrato.userId));
            if (lojaSnap.exists()) {
              const dl = lojaSnap.data() as any;
              setNomeLojaPerfil(dl.nomeLoja || '');
              setNomeFantasiaPerfil(dl.nomeFantasia || '');
              setCpfCnpjPerfil(dl.cpfCnpj || '');
              setEnderecoPerfil(dl.endereco || '');
              setDadosBancariosPerfil(dl.dadosBancarios || '');
              setLogoLojaPerfil(dl.logoUrl || '');
              setAssinaturaLojaUrl(dl.assinaturaUrl || '');
              if (dl.themeColors) setThemeColors(dl.themeColors);
            }
          }
        }
        setCarregandoAssinatura(false);
      }).catch(() => setCarregandoAssinatura(false));
      return;
    }

    if (lojaId) {
      setCarregandoPublico(true);

      // Resolve link personalizado (slug) -> uid real do dono da loja.
      // getDoc de um documento específico (não é "list"), então funciona com a regra
      // pública já existente sem precisar abrir permissão de listagem.
      (async () => {
        let uidResolvido = lojaId;
        try {
          const slugSnap = await getDoc(doc(db, "slugs_loja", lojaId));
          if (slugSnap.exists()) uidResolvido = (slugSnap.data() as any).userId;
        } catch {}

        setIdLojaPublica(uidResolvido);

        getDoc(doc(db, "configuracoes_loja", uidResolvido)).then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setZapDaLojaPublica(data.whatsapp || '');
            setNomeLojaPerfil(data.nomeLoja || '');
            setLogoLojaPerfil(data.logoUrl || '');
            setBannerLojaUrl(data.bannerUrl || '');
            if (data.themeColors) setThemeColors(data.themeColors);
          }
        });

        const qCats = query(collection(db, "categorias_produtos"), where("userId", "==", uidResolvido));
        getDocs(qCats).then(snapshot => {
          setCategoriasProd(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const q = query(collection(db, "produtos"), where("userId", "==", uidResolvido));
        getDocs(q).then(snapshot => {
          setProdutosPublicos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          setCarregandoPublico(false);
        }).catch(() => setCarregandoPublico(false));
      })();
    }

    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        getDoc(doc(db, "configuracoes_loja", u.uid)).then(docSnap => {
          if(docSnap.exists()) {
            const data = docSnap.data();
            setZapDonaConta(data.whatsapp || '');
            setNomeLojaPerfil(data.nomeLoja || '');
            setNomeFantasiaPerfil(data.nomeFantasia || '');
            setCpfCnpjPerfil(data.cpfCnpj || '');
            setTelefonePerfil(data.telefone || '');
            setEmailPerfil(data.email || '');
            setCepPerfil(data.cep || '');
            setEnderecoPerfil(data.endereco || '');
            setCidadePerfil(data.cidade || '');
            setEstadoPerfil(data.estado || '');
            setDadosBancariosPerfil(data.dadosBancarios || '');
            setLogoLojaPerfil(data.logoUrl || '');
            setBannerLojaUrl(data.bannerUrl || '');
            setSlugLojaPerfil(data.slug || '');
            setInputSlugLoja(data.slug || '');
            setAssinaturaLojaUrl(data.assinaturaUrl || '');
            setSuporteZapPerfil(data.suporteZap || data.whatsapp || '');
            if (data.themeColors) setThemeColors(data.themeColors);
            if (data.onboardingVisto !== true) setMostrarOnboarding(true);
          } else {
            setMostrarOnboarding(true);
          }
        });
      } else {
        setMaterials([]);
        setPedidos([]);
        setClientes([]);
        setProdutos([]);
        setEquipamentos([]);
        setAnotacoes([]);
        setContratos([]);
        setTemplatesContrato([]);
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

  // Pedidos: busca paginada (30 por vez), ordenada pelo mais recente.
  // Se o índice composto (userId + data) ainda não existir no Firestore, cai num fallback
  // sem ordenação — assim o histórico NUNCA fica vazio, mesmo sem o índice configurado.
  useEffect(() => {
    if (!user || idLojaPublica) return;
    const qPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid), orderBy("data", "desc"), limit(TAMANHO_PAGINA));
    const unsub = onSnapshot(
      qPedidos,
      s => {
        setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setUltimoDocPedido(s.docs[s.docs.length - 1] || null);
        setTemMaisPedidos(s.docs.length === TAMANHO_PAGINA);
      },
      erro => {
        console.error("Falha na busca paginada de pedidos (provável índice ausente):", erro);
        const qFallback = query(collection(db, "pedidos"), where("userId", "==", user.uid));
        onSnapshot(qFallback, s2 => {
          setPedidos(s2.docs.map(d => ({ id: d.id, ...d.data() })));
          setTemMaisPedidos(false);
        });
      }
    );
    return () => unsub();
  }, [user, idLojaPublica]);

  const carregarMaisPedidos = async () => {
    if (!ultimoDocPedido || carregandoMais || !user) return;
    setCarregandoMais(true);
    try {
      const qMais = query(collection(db, "pedidos"), where("userId", "==", user.uid), orderBy("data", "desc"), startAfter(ultimoDocPedido), limit(TAMANHO_PAGINA));
      const snap = await getDocs(qMais);
      setPedidos(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
      setUltimoDocPedido(snap.docs[snap.docs.length - 1] || null);
      setTemMaisPedidos(snap.docs.length === TAMANHO_PAGINA);
    } catch {
      showToast("Erro ao carregar mais pedidos.", 'erro');
    } finally {
      setCarregandoMais(false);
    }
  };

  useEffect(() => {
    if (user && !idLojaPublica) {
      const qMaterials = query(collection(db, "materiais"), where("userId", "==", user.uid));
      const unsubMaterials = onSnapshot(qMaterials, s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
      const unsubClientes = onSnapshot(qClientes, s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qProdutos = query(collection(db, "produtos"), where("userId", "==", user.uid));
      const unsubProdutos = onSnapshot(qProdutos, s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qAnotacoes = query(collection(db, "anotacoes"), where("userId", "==", user.uid));
      const unsubAnotacoes = onSnapshot(qAnotacoes, s => setAnotacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qContratos = query(collection(db, "contratos"), where("userId", "==", user.uid));
      const unsubContratos = onSnapshot(qContratos, s => setContratos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qTemplates = query(collection(db, "templates_contrato"), where("userId", "==", user.uid));
      const unsubTemplates = onSnapshot(qTemplates, s => setTemplatesContrato(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      // Semeia as categorias padrão SÓ UMA VEZ, via getDocs (não via onSnapshot) —
      // evita a corrida que causava categorias duplicadas quando o Firestore respondia
      // mais de uma vez rápido (cache + servidor) antes do estado atualizar.
      const qCatsProd = query(collection(db, "categorias_produtos"), where("userId", "==", user.uid));
      getDocs(qCatsProd).then(snap => {
        if (snap.empty) {
          const padroes = ["🖨️ Sublimação", "✂️ Papelaria Personalizada", "🎁 Personalizados", "💕 Datas Comemorativas"];
          padroes.forEach(cat => addDoc(collection(db, "categorias_produtos"), { nome: cat, userId: user.uid }));
        }
      });
      const unsubCatsProd = onSnapshot(qCatsProd, s => {
        setCategoriasProd(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qCatsForn = query(collection(db, "categorias_fornecedores"), where("userId", "==", user.uid));
      getDocs(qCatsForn).then(snap => {
        if (snap.empty) {
          const padroesForn = ["🖨️ Insumos de Sublimação", "✂️ Papelaria e Papéis", "📦 Embalagens e Caixas", "🎁 Brindes e Acrílicos"];
          padroesForn.forEach(cat => addDoc(collection(db, "categorias_fornecedores"), { nome: cat, userId: user.uid }));
        }
      });
      const unsubCatsForn = onSnapshot(qCatsForn, s => {
        setCategoriasForn(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qFornecedores = query(collection(db, "fornecedores"), where("userId", "==", user.uid));
      const unsubFornecedores = onSnapshot(qFornecedores, s => setFornecedores(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qCanaisVenda = query(collection(db, "canais_venda"), where("userId", "==", user.uid));
      const unsubCanaisVenda = onSnapshot(qCanaisVenda, s => setCanaisVenda(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      // Sem orderBy aqui de propósito (mesmo erro que já tivemos nos pedidos):
      // where + orderBy junto exige índice composto. Ordenamos no JS em vez disso.
      const qCaixa = query(collection(db, "movimentacoes_caixa"), where("userId", "==", user.uid));
      const unsubCaixa = onSnapshot(qCaixa, s => setMovimentacoesCaixa(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qConfigFin = doc(db, "configuracoes_financeiras", user.uid);
      getDoc(qConfigFin).then(snap => {
        if (snap.exists()) {
          const dadosFin = snap.data() as any;
          setFinancasFixo(prev => ({ ...prev, ...dadosFin }));

          if (dadosFin.precoTinta) setPrecoTinta(dadosFin.precoTinta);
          if (dadosFin.unidadeTinta) setUnidadeTinta(dadosFin.unidadeTinta);
          if (dadosFin.qtdCores) setQtdCores(dadosFin.qtdCores);
          if (dadosFin.paginasConjunto) setPaginasConjunto(dadosFin.paginasConjunto);

          if (dadosFin.custoPorPaginaCalculado) {
            setCustos(prev => ({ ...prev, impressao: Number(dadosFin.custoPorPaginaCalculado).toFixed(2) }));
          }

          const dias = Number(dadosFin.diasTrabalho || 20);
          const horas = Number(dadosFin.horasDia || 8);
          const totalHorasMes = dias * horas || 160;
          const salario = Number(dadosFin.salario || 0);
          const custosMes = Number(dadosFin.aluguel || 0) + Number(dadosFin.internet || 0) + Number(dadosFin.luz || 0) + Number(dadosFin.outros || 0);

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
        unsubClientes();
        unsubProdutos();
        unsubEquipamentos();
        unsubAnotacoes();
        unsubContratos();
        unsubTemplates();
        unsubCatsProd();
        unsubCatsForn();
        unsubFornecedores();
        unsubCanaisVenda();
        unsubCaixa();
      };
    }
  }, [user, idLojaPublica]);

  const linkDoCatalogoDestaCliente = useMemo(() => {
    if (!user) return '';
    const identificador = slugLojaPerfil || user.uid;
    return `${window.location.origin}${window.location.pathname}?loja=${identificador}`;
  }, [user, slugLojaPerfil]);

  // Salva um link personalizado (ex: ?loja=minha-loja em vez do código aleatório).
  // Guarda numa coleção separada slugs_loja/{slug} -> {userId}, e checa se já não
  // está em uso por outra pessoa antes de salvar.
  const salvarSlugLoja = async () => {
    if (!user || salvando.slug) return;
    const novoSlug = inputSlugLoja.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!novoSlug) return showToast("Digite um link válido (só letras, números e traço).", 'erro');
    setSalvando(prev => ({ ...prev, slug: true }));
    try {
      const slugDoc = await getDoc(doc(db, "slugs_loja", novoSlug));
      if (slugDoc.exists() && (slugDoc.data() as any).userId !== user.uid) {
        showToast("Esse link já está em uso por outra loja. Escolha outro.", 'erro');
        return;
      }
      if (slugLojaPerfil && slugLojaPerfil !== novoSlug) {
        try { await deleteDoc(doc(db, "slugs_loja", slugLojaPerfil)); } catch {}
      }
      await setDoc(doc(db, "slugs_loja", novoSlug), { userId: user.uid });
      await setDoc(doc(db, "configuracoes_loja", user.uid), { slug: novoSlug }, { merge: true });
      setSlugLojaPerfil(novoSlug);
      setInputSlugLoja(novoSlug);
      showToast("Link personalizado salvo! 🔗");
    } catch {
      showToast("Erro ao salvar o link.", 'erro');
    } finally {
      setSalvando(prev => ({ ...prev, slug: false }));
    }
  };

  const copiarLinkCatalogo = () => {
    navigator.clipboard.writeText(linkDoCatalogoDestaCliente);
    showToast("Link do seu catálogo copiado! 🔗🚀");
  };

  const gerarLinkAssinaturaContrato = (contratoId: string) => {
    return `${window.location.origin}${window.location.pathname}?assinar=${contratoId}`;
  };

  const copiarLinkAssinatura = (contratoId: string) => {
    navigator.clipboard.writeText(gerarLinkAssinaturaContrato(contratoId));
    showToast("Link de assinatura copiado! Envie para o cliente assinar pelo celular dele. ✍️🔗");
  };

  const salvarAssinaturaLoja = async (dataUrl: string) => {
    if (!user) return;
    try {
      setAssinaturaLojaUrl(dataUrl);
      await setDoc(doc(db, "configuracoes_loja", user.uid), { assinaturaUrl: dataUrl }, { merge: true });
      setMostrarPadAssinaturaLoja(false);
      showToast("Assinatura salva! Ela vai aparecer automaticamente nos seus contratos. ✍️");
    } catch {
      showToast("Erro ao salvar assinatura.", 'erro');
    }
  };

  const salvarAssinaturaCliente = async (dataUrl: string) => {
    if (!idContratoParaAssinar) return;
    try {
      const assinadoEm = new Date().toISOString();
      await updateDoc(doc(db, "contratos", idContratoParaAssinar), {
        assinaturaClienteUrl: dataUrl,
        assinadoEm
      });
      setContratoParaAssinar((prev: any) => ({ ...prev, assinaturaClienteUrl: dataUrl, assinadoEm }));
      setAssinaturaEnviada(true);
    } catch {
      alert("Erro ao salvar sua assinatura. Tente novamente.");
    }
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

  // CORRIGIDO: uma tarefa aparece no dia se a data bater com dataPrazo OU qualquer data extra —
  // sem precisar duplicar o documento (evita "5 caixas milk" aparecendo no Kanban)
  const anotacoesDoDiaSelecionado = useMemo(() => {
    return anotacoes.filter(a => {
      if (a.concluido) return false;
      const todasAsDatas = [a.dataPrazo, ...(a.datasExtras || [])];
      return todasAsDatas.includes(diaSelecionadoAgenda);
    });
  }, [anotacoes, diaSelecionadoAgenda]);

  // Próximas entregas: pedidos ativos com prazo nos próximos 7 dias
  const proximasEntregas = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const em7dias = new Date(); em7dias.setDate(hoje.getDate() + 7);

    return pedidos
      .filter(p => {
        if (!p.prazo) return false;
        const st = p.status || 'Pendente';
        if (st.includes('Vendido') || st.includes('Cancelado')) return false;
        const dataPrazo = new Date(p.prazo + 'T00:00:00');
        return dataPrazo >= hoje && dataPrazo <= em7dias;
      })
      .sort((a, b) => a.prazo.localeCompare(b.prazo));
  }, [pedidos]);

  const toggleStatusAnotacao = async (id: string, valorAtual: boolean) => {
    await updateDoc(doc(db, "anotacoes", id), { concluido: !valorAtual });
  };

  const gerarPDFContrato = (contrato: any) => {
    const cli = clientes.find(c => c.id === contrato.clienteId) || clienteDoContratoAssinar;
    const dataEmissao = contrato.dataEmissao || new Date().toLocaleDateString('pt-BR');
    const dataEventoFormatada = contrato.dataEvento ? new Date(contrato.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';

    const nomeEmpresaExibir = nomeFantasiaPerfil || nomeLojaPerfil || 'Empresa Contratada';
    const cpfCnpjEmpresaExibir = cpfCnpjPerfil || 'Não informado';

    const clausulasFormatadas = (contrato.clausulas || '').split('\n\n').map((bloco: string) => {
      const linhas = bloco.split('\n');
      const titulo = linhas[0] || '';
      const corpo = linhas.slice(1).join('<br>') || '';
      return `
        <div style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; -webkit-region-break-inside: avoid;">
          <div style="font-weight: bold; font-size: 11px; color: ${themeColors.primary}; text-transform: uppercase; margin-bottom: 3px;">${titulo}</div>
          <div style="font-size: 11px; color: #334155; line-height: 1.5; text-align: justify;">${corpo || titulo}</div>
        </div>
      `;
    }).join('');

    const imgAssinaturaCliente = contrato.assinaturaClienteUrl
      ? `<img src="${contrato.assinaturaClienteUrl}" style="height:55px; object-fit:contain; display:block; margin:0 auto;" />`
      : `<div style="height:55px;"></div>`;

    const imgAssinaturaEmpresa = assinaturaLojaUrl
      ? `<img src="${assinaturaLojaUrl}" style="height:55px; object-fit:contain; display:block; margin:0 auto;" />`
      : `<div style="height:55px;"></div>`;

    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 20px 10px; font-family: Arial, sans-serif; color: #334155; max-width: 700px; margin: 0 auto; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; page-break-inside: avoid;">
          <div>
            <h1 style="color: ${themeColors.primary}; margin: 0; font-size: 20px; font-weight: 900;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; margin: 3px 0 0 0; font-weight: bold;">Documento Comercial e Termos de Acordo</p>
          </div>
          <div style="text-align: right; background-color: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="font-size: 8px; font-weight: bold; color: ${themeColors.primary}; text-transform: uppercase; display: block;">Data de Emissão</span>
            <span style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-top: 2px;">${dataEmissao}</span>
          </div>
        </div>

        <div style="page-break-inside: avoid; margin-bottom: 20px;">
          <div style="background-color: ${themeColors.primary}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">1. Identificação das Partes</div>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9; font-size: 11px; line-height: 1.5;">
            <p style="margin: 0;"><strong>CONTRATANTE (CLIENTE):</strong> ${cli?.nome || 'Não informado'} — <strong>CPF/CNPJ:</strong> ${cli?.cpfCnpj || 'Não informado'}</p>
            ${cli?.endereco ? `<p style="margin: 4px 0 0 0; color: #64748b;"><strong>Endereço:</strong> ${cli.endereco}</p>` : ''}
            <div style="border-top: 1px dashed #cbd5e1; margin: 8px 0;"></div>
            <p style="margin: 0;"><strong>CONTRATADO (EMPRESA):</strong> ${nomeEmpresaExibir} — <strong>CPF/CNPJ:</strong> ${cpfCnpjEmpresaExibir}</p>
            ${enderecoPerfil ? `<p style="margin: 4px 0 0 0; color: #64748b;"><strong>Endereço:</strong> ${enderecoPerfil}</p>` : ''}
          </div>
        </div>

        <div style="page-break-inside: avoid; margin-bottom: 20px;">
          <div style="background-color: ${themeColors.primary}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">2. Resumo do Evento e Valores</div>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9; font-size: 11px; line-height: 1.5;">
            <p style="margin: 0;"><strong>Serviço / Evento:</strong> ${contrato.tipoEvento || 'Não informado'}</p>
            <p style="margin: 4px 0 0 0;"><strong>Data do Evento:</strong> ${dataEventoFormatada} — <strong>Local:</strong> ${contrato.localEvento || 'Não informado'}</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: ${themeColors.primary}; font-weight: 900;">Valor Total Combinado: R$ ${Number(contrato.valorTotal || 0).toFixed(2)}</p>
            ${dadosBancariosPerfil ? `<p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b; background-color: #ffffff; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;"><strong>Dados para Pagamento:</strong> ${dadosBancariosPerfil}</p>` : ''}
          </div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; page-break-inside: avoid;">3. Cláusulas e Condições Gerais</div>
        <div style="margin-bottom: 20px;">
          ${clausulasFormatadas}
        </div>

        <div style="display: flex; justify-content: space-between; gap: 40px; margin-top: 60px; padding-top: 20px; page-break-inside: avoid; break-inside: avoid;">
          <div style="flex: 1; text-align: center;">
            ${imgAssinaturaCliente}
            <div style="border-top: 1px solid #94a3b8; margin-top: 4px; margin-bottom: 8px;"></div>
            <div style="font-size: 11px; font-weight: bold; color: #1e293b;">${cli?.nome || 'Cliente'}</div>
            <div style="font-size: 8px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">CONTRATANTE</div>
          </div>
          <div style="flex: 1; text-align: center;">
            ${imgAssinaturaEmpresa}
            <div style="border-top: 1px solid #94a3b8; margin-top: 4px; margin-bottom: 8px;"></div>
            <div style="font-size: 11px; font-weight: bold; color: #1e293b;">${nomeEmpresaExibir}</div>
            <div style="font-size: 8px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">CONTRATADO</div>
          </div>
        </div>
      </div>
    `;

    const opcoes = {
      margin: [12, 12, 12, 12],
      filename: `Contrato_${(cli?.nome || 'Cliente').replace(/\s+/g, '_')}.pdf`,
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    if ((window as any).html2pdf) {
      (window as any).html2pdf().from(elemento).set(opcoes).save();
    }
  };

  const enviarContratoWhatsapp = (contrato: any) => {
    const cli = clientes.find(c => c.id === contrato.clienteId);
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    const linkAssinatura = contrato.id ? gerarLinkAssinaturaContrato(contrato.id) : '';
    const jaAssinado = !!contrato.assinaturaClienteUrl;
    const msg = `*CONTRATO DE PRESTAÇÃO DE SERVIÇOS*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Evento:* ${contrato.tipoEvento || 'Serviço'}%0A*Data:* ${contrato.dataEvento || 'A combinar'}%0A*Valor Total:* R$ ${Number(contrato.valorTotal || 0).toFixed(2)}%0A---%0AOlá! Segue o resumo do nosso contrato. Acabo de baixar o PDF formal em anexo para você! 🙌🏼${(!jaAssinado && linkAssinatura) ? `%0A%0A✍️ Para assinar digitalmente, acesse:%0A${encodeURIComponent(linkAssinatura)}` : ''}`;
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const dispararPdfAutomaticoCliente = (nomeCliente: string, itens: any[], total: number, dadosExtras: { telefone?: string; modalidade?: string; endereco?: string; formaPagamento?: string; observacoes?: string } = {}) => {
    const elemento = document.createElement('div');
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    const linesHtml = itens.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">
          ${p.nome}
          ${p.detalhe ? `<div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">${p.detalhe}</div>` : ''}
        </td>
        <td style="padding: 15px 5px; text-align: center; color: #475569;">${p.qtd}</td>
        <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${Number(p.precoVenda).toFixed(2)}</td>
        <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(Number(p.precoVenda) * p.qtd).toFixed(2)}</td>
      </tr>
    `).join('');

    const nomesFormaPagamento: any = { pix: 'Pix', dinheiro_sinal: 'Dinheiro (sinal 50% + 50% na entrega)', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito' };

    elemento.innerHTML = `
      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="color: ${themeColors.primary}; margin: 0; font-size: 32px; font-weight: 900;">Comprovante de Pedido 🚀</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; font-weight: bold;">Catálogo de Vendas Online</p>
          </div>
          <div style="text-align: right; background-color: #f8fafc; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <span style="font-size: 10px; font-weight: bold; color: ${themeColors.primary}; text-transform: uppercase; display: block;">Data do Pedido</span>
            <span style="font-size: 14px; font-weight: bold; color: #475569; display: block; margin-top: 2px;">${dataEmissao}</span>
          </div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Identificação do Comprador</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px;"><strong>Cliente Final:</strong> ${nomeCliente}</p>
          ${dadosExtras.telefone ? `<p style="margin: 6px 0 0 0; font-size: 13px;"><strong>WhatsApp:</strong> ${dadosExtras.telefone}</p>` : ''}
          ${dadosExtras.modalidade ? `<p style="margin: 6px 0 0 0; font-size: 13px;"><strong>Modalidade:</strong> ${dadosExtras.modalidade}</p>` : ''}
          ${dadosExtras.endereco ? `<p style="margin: 6px 0 0 0; font-size: 13px;"><strong>Endereço de Entrega:</strong> ${dadosExtras.endereco}</p>` : ''}
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Relação de Itens Escolhidos</div>
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
            ${linesHtml}
          </tbody>
        </table>

        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 35px; padding-right: 5px; page-break-inside: avoid; break-inside: avoid;">
          <div style="background-color: ${themeColors.primary}; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Valor Estimado</span>
            R$ ${total.toFixed(2)}
          </div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">Forma de Pagamento</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
          <div><strong>Forma de pagamento escolhida:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">${nomesFormaPagamento[dadosExtras.formaPagamento || 'pix'] || 'A combinar'}</div></div>
          ${dadosExtras.observacoes ? `<div style="margin-top: 10px;"><strong>Observações:</strong><div style="margin-top: 4px; color: #475569;">${dadosExtras.observacoes}</div></div>` : ''}
        </div>
      </div>
    `;

    const opcoes = { margin: 10, filename: `Pedido_${nomeCliente.replace(/\s+/g, '_')}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
    if ((window as any).html2pdf) { (window as any).html2pdf().from(elemento).set(opcoes).save(); }
  };

  const adicionarAoCarrinhoPublico = (produto: any, precoUnitario: number, detalhe: string, qtd: number) => {
    setCarrinhoPublico(prev => [...prev, { itemId: `item_${Date.now()}`, produtoId: produto.id, nome: produto.nome, precoUnitario, detalhe, qtd }]);
  };

  const removerDoCarrinhoPublico = (itemId: string) => {
    setCarrinhoPublico(prev => prev.filter(i => i.itemId !== itemId));
  };

  const abrirDetalheProduto = (p: any) => {
    setProdutoDetalheAberto(p);
    setImagemAtivaDetalhe(0);
    setVariacoesEscolhidas({});
    setPersonalizacaoTexto('');
    setQtdDetalhe(1);
  };

  const confirmarAdicaoDetalhe = () => {
    if (!produtoDetalheAberto) return;
    const grupos = produtoDetalheAberto.variacoes || [];
    for (const g of grupos) {
      if (!variacoesEscolhidas[g.id]) return showToast(`Escolha uma opção em "${g.nome}"`, 'erro');
    }
    let precoUnit = Number(produtoDetalheAberto.precoVenda || 0);
    const partesDetalhe: string[] = [];
    grupos.forEach((g: any) => {
      const opcaoId = variacoesEscolhidas[g.id];
      const opcao = g.opcoes.find((o: any) => o.id === opcaoId);
      if (opcao) {
        precoUnit += Number(opcao.precoAdicional || 0);
        partesDetalhe.push(`${g.nome}: ${opcao.label}`);
      }
    });
    if (personalizacaoTexto.trim()) partesDetalhe.push(`Personalização: ${personalizacaoTexto.trim()}`);
    adicionarAoCarrinhoPublico(produtoDetalheAberto, precoUnit, partesDetalhe.join(' • '), qtdDetalhe);
    setProdutoDetalheAberto(null);
    showToast("Adicionado ao carrinho! 🛍️");
  };

  const finalizarPedidoPublicoWhatsapp = () => {
    if (!nomeComprador.trim()) return showToast("Digite seu nome antes de enviar!", 'erro');
    if (!telefoneComprador.trim()) return showToast("Digite seu telefone/WhatsApp antes de enviar!", 'erro');
    if (modalidadeEntrega === 'entrega' && !enderecoComprador.trim()) return showToast("Digite o endereço de entrega!", 'erro');
    if (carrinhoPublico.length === 0) return showToast("Seu carrinho está vazio!", 'erro');

    const totalGeral = carrinhoPublico.reduce((acc, i) => acc + i.precoUnitario * i.qtd, 0);

    const nomesModalidade: any = { entrega: 'Entrega', retirada: 'Retirada no local' };
    const nomesFormaPagamento: any = { pix: 'Pix', dinheiro_sinal: 'Dinheiro (sinal de 50% + 50% na entrega)', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito' };

    let textPedido = `*NOVO PEDIDO VIA CATÁLOGO DE VENDAS*%0A`;
    textPedido += `---%0A`;
    textPedido += `*Cliente:* ${nomeComprador.trim()}%0A`;
    textPedido += `*WhatsApp:* ${telefoneComprador.trim()}%0A`;
    textPedido += `*Modalidade:* ${nomesModalidade[modalidadeEntrega]}%0A`;
    if (modalidadeEntrega === 'entrega') textPedido += `*Endereço:* ${enderecoComprador.trim()}%0A`;
    textPedido += `%0A*Itens do Pedido:*%0A`;

    carrinhoPublico.forEach(i => {
      const sub = i.precoUnitario * i.qtd;
      textPedido += `• ${i.qtd}x _${i.nome}_${i.detalhe ? ` (${i.detalhe})` : ''} — R$ ${sub.toFixed(2)}%0A`;
    });

    textPedido += `---%0A`;
    textPedido += `*VALOR TOTAL:* R$ ${totalGeral.toFixed(2)}%0A`;
    textPedido += `*Forma de Pagamento:* ${nomesFormaPagamento[formaPagamentoComprador]}%0A`;
    if (formaPagamentoComprador === 'dinheiro_sinal') {
      textPedido += `_(Sinal de R$ ${(totalGeral / 2).toFixed(2)} + R$ ${(totalGeral / 2).toFixed(2)} na finalização)_%0A`;
    }
    if (observacoesComprador.trim()) textPedido += `*Observações:* ${observacoesComprador.trim()}%0A`;
    textPedido += `---%0A`;
    textPedido += `Aguardo a conversa para acertar os detalhes! 🙌`;

    const listaParaPdf = carrinhoPublico.map(i => ({ nome: i.nome, qtd: i.qtd, precoVenda: i.precoUnitario, detalhe: i.detalhe }));
    dispararPdfAutomaticoCliente(nomeComprador.trim(), listaParaPdf, totalGeral, {
      telefone: telefoneComprador.trim(),
      modalidade: nomesModalidade[modalidadeEntrega],
      endereco: modalidadeEntrega === 'entrega' ? enderecoComprador.trim() : '',
      formaPagamento: formaPagamentoComprador,
      observacoes: observacoesComprador.trim()
    });

    const numeroLimpo = zapDaLojaPublica.replace(/\D/g, '');
    if (numeroLimpo) { window.open(`https://wa.me/55${numeroLimpo}?text=${textPedido}`, '_blank'); }
    else { window.open(`https://wa.me/?text=${textPedido}`, '_blank'); }

    setMostrarCheckoutPublico(false);
    setPedidoPublicoEnviado(true);
    setCarrinhoPublico([]);
  };

  const lancarVendaBalcaoInterno = async () => {
    if (salvando.balcao) return;
    const itensNoCarrinho = produtos.filter(p => carrinhoInterno[p.id] > 0);
    if (itensNoCarrinho.length === 0) return showToast("Selecione ao menos 1 item com + e - no balcão!", 'erro');

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
        precoVenda: Number(p.precoVenda),
        materiaisAssociados: p.materiaisAssociados || []
      });
    });

    const nomeFinalDoRegistro = nomeKitBalcao.trim() ? nomeKitBalcao.trim() : stringNomeCombo;
    const prazoFinalVenda = prazoBalcao ? prazoBalcao : new Date().toISOString().split('T')[0];

    setSalvando(prev => ({ ...prev, balcao: true }));
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
        dataVenda: Timestamp.now(),
        status: 'Pendente',
        itensCombo: arrayItensSalvar,
        modoCalculo: 'peca'
      });

      setCarrinhoInterno({});
      setClienteBalcao('');
      setNomeKitBalcao('');
      setPrazoBalcao('');
      showToast("Combo lançado com sucesso no Histórico! 🚀");
      setActiveTab('pedidos');
    } catch {
      showToast("Erro ao lançar venda no balcão.", 'erro');
    } finally {
      setSalvando(prev => ({ ...prev, balcao: false }));
    }
  };

  const excluirContratoInteligente = async (contratoItem: any) => {
    confirmar("Deseja realmente excluir este contrato?", async () => {
      try {
        if (contratoItem.id) {
          await deleteDoc(doc(db, "contratos", contratoItem.id));
          showToast("Contrato excluído com sucesso! 🗑️");
          return;
        }

        const q = query(
          collection(db, "contratos"),
          where("userId", "==", user.uid),
          where("clienteId", "==", contratoItem.clienteId || '')
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          snapshot.docs.forEach(async (d) => {
            await deleteDoc(doc(db, "contratos", d.id));
          });
          showToast("Contrato antigo excluído do banco! 🗑️");
        } else {
          showToast("Não foi possível encontrar a referência do contrato no banco.", 'erro');
        }
      } catch (e) {
        showToast("Erro ao tentar excluir contrato.", 'erro');
      }
    });
  };

  const zerarTodosContratos = async () => {
    confirmar("Tem certeza que deseja APAGAR TODOS OS CONTRATOS salvos para zerar os testes?", async () => {
      try {
        const q = query(collection(db, "contratos"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        snap.docs.forEach(async (d) => {
          await deleteDoc(doc(db, "contratos", d.id));
        });
        showToast("Todos os contratos de teste foram removidos! ✨");
      } catch {
        showToast("Erro ao zerar contratos.", 'erro');
      }
    });
  };

  const confirmarExcluir = async (tipo: string, id: string) => {
    if (!id) return;
    confirmar(`Tem certeza de que deseja excluir este ${tipo}?`, async () => {
      let colecao = "";
      if (tipo === 'pedido') colecao = "pedidos";
      else if (tipo === 'cliente') colecao = "clientes";
      else if (tipo === 'produto') colecao = "produtos";
      else if (tipo === 'equipamento') colecao = "equipamentos";
      else if (tipo === 'material') colecao = "materiais";
      else if (tipo === 'anotacao') colecao = "anotacoes";
      else if (tipo === 'fornecedor') colecao = "fornecedores";
      else if (tipo === 'canal_venda') colecao = "canais_venda";

      if (colecao) {
        try {
          await deleteDoc(doc(db, colecao, id));
          showToast("Item excluído com sucesso! 🗑️");
        } catch (error) {
          showToast("Erro ao excluir do banco de dados.", 'erro');
        }
      }
    });
  };

  const confirmarVendaPedido = async (pedido: any) => {
    // 1. materiaisUsados (orçamento feito na calculadora) — baixa por ID, como já era
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

    // 2. itensCombo (balcão) — usa a receita por ID quando o produto tiver uma cadastrada;
    //    senão cai no método antigo por nome, sem quebrar quem ainda não recadastrou os produtos
    if (pedido.itensCombo && Array.isArray(pedido.itensCombo) && pedido.itensCombo.length > 0) {
      for (const item of pedido.itensCombo) {
        if (item.materiaisAssociados && item.materiaisAssociados.length > 0) {
          for (const m of item.materiaisAssociados) {
            const matDoBanco = materiais.find(mat => mat.id === m.id);
            if (matDoBanco) {
              const gastoTotal = Number(m.qtdUsada || 0) * Number(item.qtd || 1);
              await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, Number(matDoBanco.qtdAtual || 0) - gastoTotal) });
            }
          }
        } else {
          const nomeProdutoTexto = String(item.nome || '').toLowerCase();
          const materialCorrespondente = materiais.find(m => nomeProdutoTexto.includes(m.nome.toLowerCase()) || m.nome.toLowerCase().includes(nomeProdutoTexto));
          if (materialCorrespondente) {
            const gastoTotal = Number(item.qtd || 0);
            const estoqueAtual = Number(materialCorrespondente.qtdAtual || 0);
            await updateDoc(doc(db, "materiais", materialCorrespondente.id), { qtdAtual: Math.max(0, estoqueAtual - gastoTotal) });
          }
        }
      }
    } else {
      // Fallback pro formato antigo de nomeProd combinado em texto livre (pedidos anteriores a itensCombo)
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
    }

    // Lança no caixa só o saldo que ainda faltava (o sinal, se houve, já foi lançado
    // separadamente quando foi registrado) — assim nunca conta o valor em dobro.
    const valorSinalJaRecebido = Number(pedido.valorSinal || 0);
    const valorRestante = Math.max(0, Number(pedido.preco || 0) - valorSinalJaRecebido);

    await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰', statusPagamento: 'pago_total' });

    if (valorRestante > 0) {
      await registrarMovimentacaoCaixa('entrada', valorRestante, `Venda — ${pedido.nomeProd}${valorSinalJaRecebido > 0 ? ' (saldo restante)' : ''}`, 'venda', pedido.id);
    }

    showToast("Venda confirmada!");
  };

  // Registra uma entrada ou saída no fluxo de caixa
  const registrarMovimentacaoCaixa = async (tipo: 'entrada' | 'saida', valor: number, descricao: string, origem: string, pedidoId: string | null = null) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "movimentacoes_caixa"), {
        tipo, valor, descricao, origem, pedidoId, data: Timestamp.now(), userId: user.uid
      });
    } catch {
      showToast("Erro ao lançar no caixa.", 'erro');
    }
  };

  const excluirMovimentacaoCaixa = (m: any) => {
    const avisoVinculo = m.pedidoId
      ? ' Essa movimentação veio de um pedido — excluir aqui NÃO desfaz o status do pedido, só remove o lançamento do caixa.'
      : '';
    confirmar(`Excluir esta movimentação (${m.descricao})?${avisoVinculo}`, async () => {
      try {
        await deleteDoc(doc(db, "movimentacoes_caixa", m.id));
        showToast("Movimentação excluída.");
      } catch {
        showToast("Erro ao excluir movimentação.", 'erro');
      }
    });
  };

  // Sinal recebido: fica salvo no próprio pedido e já lança a entrada no caixa na hora
  const confirmarRegistroSinal = async () => {
    if (!mostrarModalSinal) return;
    const valor = Number(valorSinalInput || 0);
    if (valor <= 0) return showToast("Digite um valor de sinal válido.", 'erro');
    if (valor > Number(mostrarModalSinal.total || 0)) return showToast("O sinal não pode ser maior que o valor total.", 'erro');
    const colecao = mostrarModalSinal.tipo === 'contrato' ? 'contratos' : 'pedidos';
    try {
      await updateDoc(doc(db, colecao, mostrarModalSinal.id), { valorSinal: valor, statusPagamento: 'sinal_recebido' });
      await registrarMovimentacaoCaixa('entrada', valor, `Sinal — ${mostrarModalSinal.titulo}`, 'sinal', mostrarModalSinal.id);
      showToast("Sinal registrado! 💰");
      setMostrarModalSinal(null);
      setValorSinalInput('');
    } catch {
      showToast("Erro ao registrar sinal.", 'erro');
    }
  };

  // Confirma o recebimento total de um contrato — lança no caixa só o saldo que
  // ainda faltava (o sinal, se houve, já foi lançado separadamente antes)
  const confirmarRecebimentoContrato = async (contrato: any) => {
    const valorSinalJa = Number(contrato.valorSinal || 0);
    const valorRestante = Math.max(0, Number(contrato.valorTotal || 0) - valorSinalJa);
    try {
      await updateDoc(doc(db, "contratos", contrato.id), { statusPagamento: 'pago_total', pagamentoConfirmadoEm: Timestamp.now() });
      if (valorRestante > 0) {
        await registrarMovimentacaoCaixa('entrada', valorRestante, `Contrato — ${contrato.tipoEvento || 'Serviço'}${valorSinalJa > 0 ? ' (saldo restante)' : ''}`, 'contrato', contrato.id);
      }
      showToast("Recebimento confirmado! 💰");
      setSubAbaContratos('historico');
    } catch {
      showToast("Erro ao confirmar recebimento.", 'erro');
    }
  };

  const cancelarPedidoSemExcluir = async (id: string) => {
    confirmar("Deseja realmente mover este orçamento para os cancelados?", async () => {
      await updateDoc(doc(db, "pedidos", id), { status: 'Cancelado ❌' });
      showToast("Pedido cancelado!");
    });
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
      setNovoProdCatalogo(prev => ({ ...prev, urlImagem: urlDisponivel, imagens: prev.imagens.length > 0 ? prev.imagens : [urlDisponivel] }));
      showToast("Foto carregada com sucesso! 📸");
    } catch (error) { showToast("Erro ao subir a foto!", 'erro'); }
    finally { setSubindoImagem(false); }
  };

  // Galeria: permite várias fotos por produto (a primeira vira a foto de capa automaticamente)
  const handleUploadImagemGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (novoProdCatalogo.imagens.length >= 6) return showToast("Máximo de 6 fotos por produto.", 'erro');
    setSubindoImagem(true);
    try {
      const nomeArquivo = `${user.uid}_${Date.now()}_${file.name}`;
      const imagemRef = ref(storage, `produtos/${nomeArquivo}`);
      await uploadBytes(imagemRef, file);
      const urlDisponivel = await getDownloadURL(imagemRef);
      setNovoProdCatalogo(prev => {
        const novasImagens = [...prev.imagens, urlDisponivel];
        return { ...prev, imagens: novasImagens, urlImagem: prev.urlImagem || novasImagens[0] };
      });
      showToast("Foto adicionada à galeria! 📸");
    } catch (error) { showToast("Erro ao subir a foto!", 'erro'); }
    finally { setSubindoImagem(false); }
  };

  const removerImagemGaleria = (idx: number) => {
    setNovoProdCatalogo(prev => {
      const novasImagens = prev.imagens.filter((_, i) => i !== idx);
      return { ...prev, imagens: novasImagens, urlImagem: novasImagens[0] || '' };
    });
  };

  // Variações: grupos de opções que somam ao preço base (ex: "Encadernação" -> Wire-o / Espiral +R$10 / Disco +R$49)
  const adicionarGrupoVariacao = () => {
    if (!novoGrupoVariacaoNome.trim()) return;
    const novoGrupo = { id: `grupo_${Date.now()}`, nome: novoGrupoVariacaoNome.trim(), opcoes: [] as {id: string, label: string, precoAdicional: string}[] };
    setNovoProdCatalogo(prev => ({ ...prev, variacoes: [...prev.variacoes, novoGrupo] }));
    setNovoGrupoVariacaoNome('');
  };

  const removerGrupoVariacao = (grupoId: string) => {
    setNovoProdCatalogo(prev => ({ ...prev, variacoes: prev.variacoes.filter(g => g.id !== grupoId) }));
  };

  const adicionarOpcaoVariacao = (grupoId: string) => {
    setNovoProdCatalogo(prev => ({
      ...prev,
      variacoes: prev.variacoes.map(g => g.id === grupoId ? { ...g, opcoes: [...g.opcoes, { id: `opcao_${Date.now()}`, label: '', precoAdicional: '0' }] } : g)
    }));
  };

  const removerOpcaoVariacao = (grupoId: string, opcaoId: string) => {
    setNovoProdCatalogo(prev => ({
      ...prev,
      variacoes: prev.variacoes.map(g => g.id === grupoId ? { ...g, opcoes: g.opcoes.filter(o => o.id !== opcaoId) } : g)
    }));
  };

  const atualizarOpcaoVariacao = (grupoId: string, opcaoId: string, campo: 'label' | 'precoAdicional', valor: string) => {
    setNovoProdCatalogo(prev => ({
      ...prev,
      variacoes: prev.variacoes.map(g => g.id === grupoId ? { ...g, opcoes: g.opcoes.map(o => o.id === opcaoId ? { ...o, [campo]: valor } : o) } : g)
    }));
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSubindoLogo(true);
    try {
      const dataUrl = await comprimirImagem(file, 300);
      setLogoLojaPerfil(dataUrl);
      showToast("Logo carregado com sucesso! Salve o perfil para aplicar. 📸");
    } catch (error) {
      showToast("Erro ao subir o logo!", 'erro');
    } finally {
      setSubindoLogo(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSubindoBanner(true);
    try {
      const dataUrl = await comprimirImagem(file, 900);
      setBannerLojaUrl(dataUrl);
      showToast("Banner carregado! Salve o perfil para aplicar. 🖼️");
    } catch (error) {
      showToast("Erro ao subir o banner!", 'erro');
    } finally {
      setSubindoBanner(false);
    }
  };

  const limparCalculadora = () => {
    setNomeProd(''); setDetalhamentoPed(''); setQtdPed('1'); setMatsNoPed([]); setVHora('9'); setTGasto('60');
    setCustos({ embalagem: '0', impressao: custoPorPaginaCalculado.toFixed(2), energia: '0', outros: '0' });
    setEquipamentosSelecionados([]);
    setLucro('100'); setDesconto('0'); setPrazo(''); setClienteSel('');
    setPedidoEditandoId(null); setPrecoManual(null); setProdutoCatalogoSelecionadoId(null); setDocObsPedido('');
    setIsDuplicando(false);
    setModoCalculo('peca');
    setPrecoFinalDigitado('0.00');
    setPesquisaMatsCalculadora('');
  };

  const carregarPedidoParaEdicao = (p: any) => {
    setIsDuplicando(false);
    setPedidoEditandoId(p.id); setNomeProd(p.nomeProd || ''); setDetalhamentoPed(p.detalhamentoPed || ''); setQtdPed(p.qtdPed || '1'); setVHora(p.vHora || '9'); setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setLucro(p.lucro || '100'); setDesconto(p.desconto || '0'); setPrazo(p.prazo || ''); setClienteSel(p.clienteId || '');
    setPrecoManual(p.precoManual || null); setDocObsPedido(p.obsPedido || '');
    setEquipamentosSelecionados(p.equipamentosSelecionados || []);
    setModoCalculo(p.modoCalculo || 'peca');

    if (p.materiaisUsados && p.materiaisUsados.length > 0) {
      const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return { id: mSalvo.id, nome: matDoArmario ? matDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      setMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }

    setPrecoFinalDigitado(p.preco || '0.00');
    setActiveTab('criar');
  };

  const handleDuplicarOrcamento = (p: any) => {
    setPedidoEditandoId(null);
    setIsDuplicando(true);
    setNomeProd(`${p.nomeProd} (Cópia)`);
    setDetalhamentoPed(p.detalhamentoPed || '');
    setQtdPed(p.qtdPed || '1');
    setVHora(p.vHora || '9');
    setTGasto(p.tGasto || '60');
    setCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    setLucro(p.lucro || '100');
    setDesconto(p.desconto || '0');
    setPrazo(p.prazo || '');
    setClienteSel('');
    setPrecoManual(p.precoManual || null);
    setDocObsPedido(p.obsPedido || '');
    setEquipamentosSelecionados(p.equipamentosSelecionados || []);
    setModoCalculo(p.modoCalculo || 'peca');

    if (p.materiaisUsados && p.materiaisUsados.length > 0) {
      const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        return { id: mSalvo.id, nome: matDoArmario ? matDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? matDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      setMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }

    setPrecoFinalDigitado(p.preco || '0.00');
    setActiveTab('criar');
    showToast("Orçamento duplicado com sucesso! Defina o cliente e salve. ✨");
  };

  const venderItemDiretoDoCatalogo = (prod: any) => {
    limparCalculadora(); setNomeProd(prod.nome); setPrecoManual(prod.precoVenda); setProdutoCatalogoSelecionadoId(prod.id); setActiveTab('criar');
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

  // Remove categorias com nome repetido (mantém a primeira de cada nome).
  // Não afeta produtos/fornecedores já marcados com essas categorias — só limpa a lista de seleção.
  const limparCategoriasDuplicadas = async (tipo: 'produtos' | 'fornecedores') => {
    const lista = tipo === 'produtos' ? categoriasProd : categoriasForn;
    const vistos = new Set<string>();
    const duplicadas = lista.filter(cat => {
      if (vistos.has(cat.nome)) return true;
      vistos.add(cat.nome);
      return false;
    });
    if (duplicadas.length === 0) return showToast("Nenhuma categoria duplicada encontrada! ✨");
    confirmar(`Encontrei ${duplicadas.length} categoria(s) duplicada(s). Remover as repetidas?`, async () => {
      try {
        for (const cat of duplicadas) {
          await deleteDoc(doc(db, tipo === 'produtos' ? "categorias_produtos" : "categorias_fornecedores", cat.id));
        }
        showToast("Categorias duplicadas removidas! ✨");
      } catch {
        showToast("Erro ao remover duplicadas.", 'erro');
      }
    });
  };

  const excluirCategoria = (tipo: 'produtos' | 'fornecedores', cat: any) => {
    confirmar(`Excluir a categoria "${cat.nome}"? Isso não remove ela dos itens que já usam essa categoria, só some da lista de seleção.`, async () => {
      try {
        await deleteDoc(doc(db, tipo === 'produtos' ? "categorias_produtos" : "categorias_fornecedores", cat.id));
        showToast("Categoria excluída.");
      } catch {
        showToast("Erro ao excluir categoria.", 'erro');
      }
    });
  };

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter(m =>
      m.nome?.toLowerCase().includes(pesquisaMateriais.toLowerCase())
    );
  }, [materiais, pesquisaMateriais]);

  const materiaisFiltradosCalculadora = useMemo(() => {
    return materiais.filter(m =>
      m.nome?.toLowerCase().includes(pesquisaMatsCalculadora.toLowerCase())
    );
  }, [materiais, pesquisaMatsCalculadora]);

  const produtosPublicosFiltrados = useMemo(() => {
    let lista = produtosPublicos;
    if (filtroVitrineSelecionado !== 'Todos') lista = lista.filter(p => p.categorias && p.categorias.includes(filtroVitrineSelecionado));
    if (buscaVitrine.trim()) lista = lista.filter(p => p.nome?.toLowerCase().includes(buscaVitrine.toLowerCase()));
    return lista;
  }, [produtosPublicos, filtroVitrineSelecionado, buscaVitrine]);

  const proveedoresFiltrados = useMemo(() => {
    return fornecedores.filter(f => {
      const matchNome = f.nome?.toLowerCase().includes(pesquisaFornecedores.toLowerCase());
      const matchCat = filtroFornSelecionado === 'Todos' ? true : (f.categorias && f.categorias.includes(filtroFornSelecionado));
      return matchNome && matchCat;
    });
  }, [fornecedores, pesquisaFornecedores, filtroFornSelecionado]);

  const contratosFiltrados = useMemo(() => {
    if (!pesquisaContratos.trim()) return contratos;
    const termo = pesquisaContratos.toLowerCase();
    return contratos.filter(c => {
      const cli = clientes.find(item => item.id === c.clienteId);
      const nomeCli = cli?.nome?.toLowerCase() || '';
      const tipoEvento = (c.tipoEvento || '').toLowerCase();
      return nomeCli.includes(termo) || tipoEvento.includes(termo);
    });
  }, [contratos, clientes, pesquisaContratos]);

  const contratosAtivos = useMemo(() => {
    return contratosFiltrados.filter(c => c.statusPagamento !== 'pago_total');
  }, [contratosFiltrados]);

  // Histórico de contratos: agrupado por mês/ano do recebimento total (ou data de emissão, se mais antigo)
  const historicoContratosMensal = useMemo(() => {
    const agrupado: { [key: string]: { total: number; qtd: number; mesAnoTexto: string; itens: any[] } } = {};
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    contratosFiltrados.filter(c => c.statusPagamento === 'pago_total').forEach(c => {
      let mes: number | null = null;
      let ano: number | null = null;
      if (c.pagamentoConfirmadoEm?.toDate) {
        const d = c.pagamentoConfirmadoEm.toDate();
        mes = d.getMonth() + 1; ano = d.getFullYear();
      } else if (c.dataEmissao) {
        const partes = c.dataEmissao.split('/');
        if (partes.length === 3) { mes = Number(partes[1]); ano = Number(partes[2]); }
      }
      if (!mes || !ano) return;
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      const nomeMesTexto = `${nomesMeses[mes - 1]} / ${ano}`;
      if (!agrupado[chave]) agrupado[chave] = { total: 0, qtd: 0, mesAnoTexto: nomeMesTexto, itens: [] };
      agrupado[chave].total += Number(c.valorTotal || 0);
      agrupado[chave].qtd += 1;
      agrupado[chave].itens.push(c);
    });

    return Object.keys(agrupado).sort((a, b) => b.localeCompare(a)).map(chave => ({ chave, ...agrupado[chave] }));
  }, [contratosFiltrados]);

  const historicoContratosFiltradoPorData = useMemo(() => {
    if (mesFiltroContratosHist === 'Todos' && anoFiltroContratosHist === 'Todos') return historicoContratosMensal;
    return historicoContratosMensal.filter(item => {
      const [ano, mes] = item.chave.split('-');
      const matchMes = mesFiltroContratosHist === 'Todos' || Number(mes) === Number(mesFiltroContratosHist);
      const matchAno = anoFiltroContratosHist === 'Todos' || Number(ano) === Number(anoFiltroContratosHist);
      return matchMes && matchAno;
    });
  }, [historicoContratosMensal, mesFiltroContratosHist, anoFiltroContratosHist]);

  const pedidosFiltradosPorStatus = useMemo(() => {
    return pedidos.filter(p => {
      const st = p.status || 'Pendente';
      if (filtroStatusPedido === 'Vendido') return st.includes('Vendido');
      if (filtroStatusPedido === 'Cancelado') return st.includes('Cancelado');
      if (filtroStatusPedido === 'Produção') return st.includes('Produção');
      return st === 'Pendente';
    });
  }, [pedidos, filtroStatusPedido]);

  const saldoCaixa = useMemo(() => {
    return movimentacoesCaixa.reduce((acc, m) => acc + (m.tipo === 'entrada' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0);
  }, [movimentacoesCaixa]);

  const saldoMesAtualCaixa = useMemo(() => {
    const agora = new Date();
    return movimentacoesCaixa.reduce((acc, m) => {
      if (!m.data?.toDate) return acc;
      const d = m.data.toDate();
      if (d.getMonth() !== agora.getMonth() || d.getFullYear() !== agora.getFullYear()) return acc;
      return acc + (m.tipo === 'entrada' ? Number(m.valor || 0) : -Number(m.valor || 0));
    }, 0);
  }, [movimentacoesCaixa]);

  // Histórico mensal do próprio caixa — entradas, saídas e saldo de cada mês
  const historicoCaixaMensal = useMemo(() => {
    const agrupado: { [key: string]: { entradas: number; saidas: number; mesAnoTexto: string; itens: any[] } } = {};
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    movimentacoesCaixa.forEach(m => {
      if (!m.data?.toDate) return;
      const d = m.data.toDate();
      const mes = d.getMonth() + 1, ano = d.getFullYear();
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      if (!agrupado[chave]) agrupado[chave] = { entradas: 0, saidas: 0, mesAnoTexto: `${nomesMeses[mes - 1]} / ${ano}`, itens: [] };
      if (m.tipo === 'entrada') agrupado[chave].entradas += Number(m.valor || 0);
      else agrupado[chave].saidas += Number(m.valor || 0);
      agrupado[chave].itens.push(m);
    });
    return Object.keys(agrupado).sort((a, b) => b.localeCompare(a)).map(chave => ({ chave, ...agrupado[chave] }));
  }, [movimentacoesCaixa]);

  // Varre todas as vendas já confirmadas e lança no caixa as que ainda não tem registro —
  // resolve o caso de vendas feitas antes do fluxo de caixa existir.
  const sincronizarVendasAntigas = async () => {
    if (!user || salvando.sync) return;
    setSalvando(prev => ({ ...prev, sync: true }));
    try {
      const qTodosPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      const snap = await getDocs(qTodosPedidos);
      const idsJaLancados = new Set(movimentacoesCaixa.filter(m => m.pedidoId).map(m => m.pedidoId));
      const vendasSemLancamento = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(p => (p.status === 'Vendido 💰' || p.status === 'Vendido') && !idsJaLancados.has(p.id));

      if (vendasSemLancamento.length === 0) {
        showToast("Todas as vendas já estão no caixa! ✨");
        return;
      }

      confirmar(`Encontrei ${vendasSemLancamento.length} venda(s) confirmada(s) que ainda não estavam no caixa. Lançar agora?`, async () => {
        try {
          for (const p of vendasSemLancamento) {
            const valorSinalJa = Number(p.valorSinal || 0);
            const valorFinal = Number(p.preco || 0) - valorSinalJa;
            if (valorFinal > 0) {
              await addDoc(collection(db, "movimentacoes_caixa"), {
                tipo: 'entrada',
                valor: valorFinal,
                descricao: `Venda — ${p.nomeProd}`,
                origem: 'venda',
                pedidoId: p.id,
                data: p.dataVenda || Timestamp.now(),
                userId: user.uid
              });
            }
          }
          showToast("Vendas antigas sincronizadas com o caixa! 🚀");
        } catch {
          showToast("Erro ao sincronizar vendas.", 'erro');
        }
      });
    } catch {
      showToast("Erro ao buscar vendas antigas.", 'erro');
    } finally {
      setSalvando(prev => ({ ...prev, sync: false }));
    }
  };

  const movimentacoesCaixaOrdenadas = useMemo(() => {
    return [...movimentacoesCaixa]
      .filter(m => filtroTipoCaixa === 'todos' || m.tipo === filtroTipoCaixa)
      .sort((a, b) => ((b.data?.seconds || 0) - (a.data?.seconds || 0)));
  }, [movimentacoesCaixa, filtroTipoCaixa]);

  const salvarMovimentacaoCaixa = async () => {
    if (salvando.caixa) return;
    if (!novaMovimentacao.descricao || !novaMovimentacao.valor) return showToast("Preencha a descrição e o valor!", 'erro');
    setSalvando(prev => ({ ...prev, caixa: true }));
    try {
      const valorNum = Number(novaMovimentacao.valor);
      await addDoc(collection(db, "movimentacoes_caixa"), {
        tipo: novaMovimentacao.tipo,
        valor: valorNum,
        descricao: novaMovimentacao.descricao,
        origem: novaMovimentacao.materialVinculado ? 'material' : 'manual',
        pedidoId: null,
        data: Timestamp.now(),
        userId: user.uid
      });

      // Se marcou um material e uma quantidade comprada, já atualiza o estoque e o
      // custo desse material no Armário — assim a compra alimenta os dois lugares de uma vez.
      if (novaMovimentacao.tipo === 'saida' && novaMovimentacao.materialVinculado && novaMovimentacao.qtdComprada) {
        const mat = materiais.find(m => m.id === novaMovimentacao.materialVinculado);
        if (mat) {
          await updateDoc(doc(db, "materiais", mat.id), {
            qtdAtual: Number(mat.qtdAtual || 0) + Number(novaMovimentacao.qtdComprada),
            valor: valorNum,
            qtd: Number(novaMovimentacao.qtdComprada),
            atualizadoEm: Timestamp.now()
          });
        }
      }

      setNovaMovimentacao({ tipo: 'saida', descricao: '', valor: '', materialVinculado: '', qtdComprada: '' });
      showToast("Movimentação registrada! 💸");
    } catch {
      showToast("Erro ao registrar movimentação.", 'erro');
    } finally {
      setSalvando(prev => ({ ...prev, caixa: false }));
    }
  };

  const dashboardMetrics = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();

    const pedidosDoMes = pedidos.filter(p => {
      const isVendido = p.status === 'Vendido 💰' || p.status === 'Vendido';
      if (!isVendido) return false;

      let dataRef: Date | null = null;
      if (p.dataVenda?.toDate) {
        dataRef = p.dataVenda.toDate();
      } else if (p.data) {
        const partes = p.data.split('/');
        if (partes.length === 3) dataRef = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      }
      if (!dataRef) return false;

      return dataRef.getMonth() + 1 === mesAtual && dataRef.getFullYear() === anoAtual;
    });

    const faturamentoMes = pedidosDoMes.reduce((acc, p) => acc + Number(p.preco || 0), 0);
    const pendentesCount = pedidos.filter(p => p.status === 'Pendente' || !p.status).length;
    const estoqueCriticoCount = materiais.filter(m => Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0)).length;

    return {
      faturamento: faturamentoMes.toFixed(2),
      pendentes: pendentesCount,
      criticos: estoqueCriticoCount,
      totalClientes: clientes.length
    };
  }, [pedidos, materiais, clientes]);

  const historicoFinanceiroMensal = useMemo(() => {
    const agrupado: { [key: string]: { total: number; qtd: number; mesAnoTexto: string; itensVendidos: any[] } } = {};
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    pedidos.forEach(p => {
      const isVendido = p.status === 'Vendido 💰' || p.status === 'Vendido';
      if (!isVendido) return;

      let mes: number | null = null;
      let ano: number | null = null;
      if (p.dataVenda?.toDate) {
        const d = p.dataVenda.toDate();
        mes = d.getMonth() + 1;
        ano = d.getFullYear();
      } else if (p.data) {
        const partes = p.data.split('/');
        if (partes.length === 3) { mes = Number(partes[1]); ano = Number(partes[2]); }
      }
      if (!mes || !ano) return;

      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      const nomeMesTexto = `${nomesMeses[mes - 1]} / ${ano}`;

      if (!agrupado[chave]) {
        agrupado[chave] = { total: 0, qtd: 0, mesAnoTexto: nomeMesTexto, itensVendidos: [] };
      }

      agrupado[chave].total += Number(p.preco || 0);
      agrupado[chave].qtd += 1;
      agrupado[chave].itensVendidos.push(p);
    });

    return Object.keys(agrupado)
      .sort((a, b) => b.localeCompare(a))
      .map(chave => ({
        chave,
        ...agrupado[chave]
      }));
  }, [pedidos]);

  const historicoFiltradoPorData = useMemo(() => {
    if (mesFiltroHistorico === 'Todos' && anoFiltroHistorico === 'Todos') {
      return historicoFinanceiroMensal;
    }

    return historicoFinanceiroMensal.filter(item => {
      const [ano, mes] = item.chave.split('-');
      const matchMes = mesFiltroHistorico === 'Todos' || Number(mes) === Number(mesFiltroHistorico);
      const matchAno = anoFiltroHistorico === 'Todos' || Number(ano) === Number(anoFiltroHistorico);
      return matchMes && matchAno;
    });
  }, [historicoFinanceiroMensal, mesFiltroHistorico, anoFiltroHistorico]);

  const resumenFinanceiro = useMemo(() => {
    const qtdNum = Math.max(1, Number(qtdPed) || 1);

    if (precoManual !== null) {
      const baseVal = Number(precoManual || 0);
      const totalCatalogo = modoCalculo === 'peca' ? baseVal * qtdNum : baseVal;
      const semDesconto = totalCatalogo - Number(desconto || 0);
      const custoPecaUnitario = modoCalculo === 'peca' ? baseVal : baseVal / qtdNum;

      return {
        materiais: "0.00",
        maoObra: "0.00",
        extras: "0.00",
        deprec: "0.00",
        custoPeca: custoPecaUnitario.toFixed(2),
        lucroLivre: "0.00",
        final: isNaN(semDesconto) ? "0.00" : semDesconto.toFixed(2)
      };
    }

    const totalMaterials = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    const totalMaoObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);

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

    const custoTotalBasePeca = totalMaterials + totalMaoObra + totalExtras + totalDesgasteMaquinas;

    let custoTotalInvestido = 0;
    let valorLucroLivre = 0;
    let precoFinalCalculado = 0;

    if (modoCalculo === 'peca') {
      custoTotalInvestido = custoTotalBasePeca * qtdNum;
      valorLucroLivre = custoTotalInvestido * (Number(lucro || 0) / 100);
      precoFinalCalculado = (custoTotalInvestido + valorLucroLivre) - Number(desconto || 0);
    } else {
      custoTotalInvestido = custoTotalBasePeca;
      valorLucroLivre = custoTotalInvestido * (Number(lucro || 0) / 100);
      precoFinalCalculado = (custoTotalInvestido + valorLucroLivre) - Number(desconto || 0);
    }

    const custoUnitarioExibicao = modoCalculo === 'peca' ? custoTotalBasePeca : (custoTotalBasePeca / qtdNum);

    return {
      materiais: totalMaterials.toFixed(2),
      maoObra: totalMaoObra.toFixed(2),
      extras: totalExtras.toFixed(2),
      deprec: totalDesgasteMaquinas.toFixed(2),
      custoPeca: custoUnitarioExibicao.toFixed(2),
      lucroLivre: valorLucroLivre.toFixed(2),
      final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2)
    };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual, equipamentos, equipamentosSelecionados, financasFixo, modoCalculo]);

  useEffect(() => {
    setPrecoFinalDigitado(resumenFinanceiro.final);
  }, [resumenFinanceiro.final]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* %0A${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const gerarPDF = (p: any) => {
    const idDoCliente = p.clienteId || p.clienteSel || '';
    const cli = clientes.find(c => c.id === idDoCliente);

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
    }
    else {
      const textoProduto = String(p.nomeProd || 'Produto Não Informado');
      const quantidadeItem = Number(p.qtdPed || 1);
      const unitario = p.precoManual ? Number(p.precoManual) : (totalNum / quantidadeItem);

      let htmlDetalhamentoKit = '';
      if (p.detalhamentoPed && p.detalhamentoPed.trim()) {
        const listaItens = p.detalhamentoPed.split('\n').filter((l: string) => l.trim() !== '');
        const lisHtml = listaItens.map((i: string) => `<li style="margin-bottom: 3px;">${i.replace(/^[\s•*-]+/, '')}</li>`).join('');

        htmlDetalhamentoKit = `
          <div style="margin-top: 8px; padding: 10px 12px; background-color: #fcfaff; border-left: 3px solid ${themeColors.primary}; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: bold; color: ${themeColors.primary}; margin-bottom: 4px; text-transform: uppercase; tracking-wide: 0.5px;">Composição / Itens Incluso no Kit:</div>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.4;">
              ${lisHtml}
            </ul>
          </div>
        `;
      }

      htmlLinhasTabela = `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left; vertical-align: top;">
            <div style="font-size: 15px; font-weight: 800; color: #1e293b;">${textoProduto}</div>
            ${htmlDetalhamentoKit}
          </td>
          <td style="padding: 15px 5px; text-align: center; color: #475569; vertical-align: top;">${quantidadeItem}</td>
          <td style="padding: 15px 5px; text-align: right; color: #475569; vertical-align: top;">R$ ${unitario.toFixed(2)}</td>
          <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b; vertical-align: top;">R$ ${totalNum.toFixed(2)}</td>
        </tr>
      `;
    }

    const cabecalhoNomeHtml = nomeLojaPerfil ? nomeLojaPerfil : "PrecificaJá";
    const cabecalhoLogoHtml = logoLojaPerfil ? `<img src="${logoLojaPerfil}" style="max-height: 70px; max-width: 160px; object-fit: contain; display: block;"/>` : '';

    const elemento = document.createElement('div');
    elemento.innerHTML = `
      <div style="padding: 35px; font-family: sans-serif; color: #334155; max-width: 750px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px; gap: 20px;">
          <div style="flex-shrink: 0; display: flex; align-items: center;">
            ${cabecalhoLogoHtml}
          </div>
          <div style="text-align: right; flex-grow: 1;">
            <h1 style="color: ${themeColors.primary}; margin: 0; font-size: 24px; font-weight: 900; line-height: 1.1;">${cabecalhoNomeHtml}</h1>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0; font-weight: bold;">Documento de Orçamento Comercial</p>
            <div style="display: inline-block; margin-top: 6px; background-color: #f8fafc; padding: 4px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-size: 11px; font-weight: bold; color: #475569;">ORÇAMENTO REF: ORC-${Math.floor(1000 + Math.random() * 9000)}</span>
            </div>
          </div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Dados do Emissor</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px;"><strong>${cabecalhoNomeHtml}</strong>${cpfCnpjPerfil ? ` — CPF/CNPJ: ${cpfCnpjPerfil}` : ''}</p>
          ${enderecoPerfil ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;"><strong>Endereço:</strong> ${enderecoPerfil}${cidadePerfil ? `, ${cidadePerfil}` : ''}${estadoPerfil ? `/${estadoPerfil}` : ''}</p>` : ''}
          ${telefonePerfil ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;"><strong>Contato:</strong> ${telefonePerfil}${emailPerfil ? ` • ${emailPerfil}` : ''}</p>` : ''}
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Dados do Cliente</div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px;"><strong>Cliente:</strong> ${cli?.nome || 'Cliente não informado'}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;"><strong>WhatsApp:</strong> ${cli?.zap || 'Não informado'}</p>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Informações Básicas e Prazos</div>
        <div style="display: flex; justify-content: space-between; background-color: #f8fafc; padding: 15px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f1f5f9; font-size: 13px;">
          <div><strong>Data de Emissão:</strong><div style="margin-top: 4px; color: #64748b; font-weight: bold;">${dataEmissao}</div></div>
          <div><strong>Validade do Orçamento:</strong><div style="margin-top: 4px; color: #ef4444; font-weight: bold;">${dataValidade} (7 dias)</div></div>
          <div><strong>Prazo de Entrega:</strong><div style="margin-top: 4px; color: ${themeColors.primary}; font-weight: bold;">${dataPrazo}</div></div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">Produtos / Serviços Selecionados</div>
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
          <div style="background-color: ${themeColors.primary}; color: white; padding: 12px 25px; border-radius: 12px; font-size: 18px; font-weight: 900; text-align: right; min-width: 180px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; opacity: 0.8; margin-bottom: 2px;">Total do Pedido</span>
            R$ ${totalNum.toFixed(2)}
          </div>
        </div>

        <div style="background-color: ${themeColors.primary}; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">Formas de Pagamento Aceitas</div>
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

    const opcoes = { margin: [10, 10, 10, 10], filename: `Pedido_${p.id || 'Venda'}.pdf`, html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
    (window as any).html2pdf().from(elemento).set(opcoes).save();
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("E-mail ou senha incorretos!"); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando o PrecificaJá... 🚀</div>;

  if (idContratoParaAssinar) {
    if (carregandoAssinatura) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando contrato... ✍️</div>;

    if (!contratoParaAssinar) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <p className="font-bold text-slate-400 text-sm">Contrato não encontrado. Peça um novo link para quem te enviou. 🙏</p>
        </div>
      );
    }

    const jaAssinadoAntes = !!contratoParaAssinar.assinaturaClienteUrl;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-[35px] shadow-xl w-full max-w-md border border-slate-100">
          <h1 style={{ color: themeColors.primary }} className="text-xl font-black text-center mb-1">Assinatura do Contrato ✍️</h1>
          <p className="text-slate-400 text-[11px] text-center mb-5 uppercase font-bold tracking-widest">PrecificaJá</p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-xs space-y-1.5 border">
            <p><strong>Cliente:</strong> {clienteDoContratoAssinar?.nome || 'Não informado'}</p>
            <p><strong>Serviço/Evento:</strong> {contratoParaAssinar.tipoEvento || 'Não informado'}</p>
            <p><strong>Data:</strong> {contratoParaAssinar.dataEvento || 'A combinar'}</p>
            <p><strong>Valor Total:</strong> R$ {Number(contratoParaAssinar.valorTotal || 0).toFixed(2)}</p>
          </div>

          <div className="mb-5">
            <p style={{ color: themeColors.primary }} className="text-[11px] font-black uppercase tracking-wider mb-2">
              📄 Leia o contrato antes de assinar
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 max-h-64 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-3">
              {(contratoParaAssinar.clausulas || '').split('\n\n').map((bloco: string, idx: number) => {
                const linhas = bloco.split('\n');
                const titulo = linhas[0] || '';
                const corpo = linhas.slice(1).join('\n');
                return (
                  <div key={idx}>
                    <p style={{ color: themeColors.primary }} className="font-bold uppercase text-[10px] mb-0.5">{titulo}</p>
                    {corpo && <p className="whitespace-pre-line">{corpo}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => gerarPDFContrato(contratoParaAssinar)}
            style={{ borderColor: themeColors.primary, color: themeColors.primary }}
            className="w-full border-2 font-black text-xs uppercase py-3 rounded-2xl mb-5 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Printer size={16}/> Baixar Contrato em PDF
          </button>

          {(assinaturaEnviada || jaAssinadoAntes) ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
              <p className="font-bold text-slate-700 text-sm">Assinatura registrada com sucesso!</p>
              <p className="text-slate-400 text-xs mt-1">Pode fechar esta página. 🙌</p>

              <button
                onClick={() => gerarPDFContrato(contratoParaAssinar)}
                style={{ backgroundColor: themeColors.primary }}
                className="w-full text-white font-black text-xs uppercase py-3.5 rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Printer size={16}/> Baixar Contrato Assinado em PDF
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-slate-500 mb-2 font-semibold">Confirme lendo o contrato com quem te enviou e assine abaixo:</p>
              <SignaturePad onSave={salvarAssinaturaCliente} />
            </>
          )}
        </div>
      </div>
    );
  }

  if (!user && !idLojaPublica) {
    return (
      <Login
        isRegistering={isRegistering} setIsRegistering={setIsRegistering}
        email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        handleAuth={handleAuth}
      />
    );
  }

  if (idLojaPublica) {
    if (carregandoPublico) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando Vitrine... 🛍️</div>;
    const totalCarrinhoPublico = carrinhoPublico.reduce((acc, i) => acc + i.precoUnitario * i.qtd, 0);
    const qtdTotalCarrinho = carrinhoPublico.reduce((acc, i) => acc + i.qtd, 0);
    const passos = [
      { n: '01', t: 'Escolha os itens', d: 'Navegue pelo catálogo e adicione o que quiser ao carrinho.' },
      { n: '02', t: 'Revise o pedido', d: 'Confira os itens, quantidades e o total antes de enviar.' },
      { n: '03', t: 'Preencha seus dados', d: 'Nome, WhatsApp, modalidade e forma de pagamento.' },
      { n: '04', t: 'Feche o pedido', d: 'O pedido vai direto pro WhatsApp da loja.' },
    ];
    const nomesModalidadeTexto: any = { entrega: 'Entrega', retirada: 'Retirada no local' };

    if (pedidoPublicoEnviado) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[40px] shadow-xl max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="font-black text-slate-800 text-xl mb-1">Pedido enviado! ✅</h2>
            <p className="text-slate-500 text-sm mb-6">Seu pedido foi aberto no WhatsApp da loja. Assim que confirmarem, você recebe os próximos passos por lá.</p>
            <button onClick={() => setPedidoPublicoEnviado(false)} style={{ backgroundColor: themeColors.primary }} className="w-full text-white font-black text-xs uppercase py-3.5 rounded-2xl">
              Voltar pra Vitrine
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-700 w-full relative">
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="flex justify-between items-center p-4">
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
            <h1 className="text-sm font-black text-purple-700 truncate max-w-[45%]">{nomeLojaPerfil || 'Vitrine'}</h1>
            <button onClick={() => { setMostrarCheckoutPublico(true); setEtapaCheckout('carrinho'); }} className="relative p-2 bg-slate-100 rounded-xl text-slate-700">
              <ShoppingCart size={18}/>
              {qtdTotalCarrinho > 0 && (
                <span style={{ backgroundColor: themeColors.secondary }} className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">{qtdTotalCarrinho}</span>
              )}
            </button>
          </div>

          {bannerLojaUrl && (
            <div className="w-full h-32 sm:h-44 overflow-hidden">
              <img src={bannerLojaUrl} className="w-full h-full object-cover" />
            </div>
          )}

          {logoLojaPerfil && (
            <div className={`max-w-xl mx-auto px-4 flex items-center gap-3 ${bannerLojaUrl ? '-mt-8 relative z-10 pb-3' : 'pb-3 pt-1'}`}>
              <img src={logoLojaPerfil} className="w-16 h-16 rounded-2xl border-4 border-white bg-white object-contain shadow-lg shrink-0" />
              <p className="text-[10px] text-slate-400 font-bold uppercase pb-1">Filtro: {filtroVitrineSelecionado}</p>
            </div>
          )}
        </header>

        {/* Carrinho flutuante — some quando o checkout já está aberto */}
        {qtdTotalCarrinho > 0 && !mostrarCheckoutPublico && (
          <button
            onClick={() => { setMostrarCheckoutPublico(true); setEtapaCheckout('carrinho'); }}
            style={{ backgroundColor: themeColors.primary }}
            className="fixed bottom-5 right-4 z-40 text-white rounded-full shadow-xl px-5 py-3.5 flex items-center gap-2 active:scale-95 transition-all"
          >
            <ShoppingCart size={18}/>
            <span className="font-black text-xs">{qtdTotalCarrinho} · R$ {totalCarrinhoPublico.toFixed(2)}</span>
          </button>
        )}

        <main className="p-4 max-w-xl mx-auto space-y-6">
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={buscaVitrine}
              onChange={e => setBuscaVitrine(e.target.value)}
              className="w-full p-3.5 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {produtosPublicosFiltrados.map(p => {
              const temImagem = p.urlImagem || (p.imagens && p.imagens[0]);
              const temVariacoes = p.variacoes && p.variacoes.length > 0;
              return (
                <div key={p.id} className="bg-white rounded-[26px] border shadow-sm overflow-hidden flex flex-col">
                  <div onClick={() => abrirDetalheProduto(p)} className="w-full aspect-square bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300 cursor-pointer">
                    {temImagem ? <img src={temImagem} alt={p.nome} className="w-full h-full object-cover" /> : <ImageIcon size={28} />}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p onClick={() => abrirDetalheProduto(p)} className="font-bold text-slate-800 text-xs leading-tight line-clamp-2 cursor-pointer min-h-[2rem]">{p.nome}</p>
                    <p className="text-purple-700 font-black text-sm mt-1">
                      {temVariacoes ? 'A partir de ' : ''}R$ {Number(p.precoVenda).toFixed(2)}
                    </p>
                    <button onClick={() => abrirDetalheProduto(p)} style={{ backgroundColor: temVariacoes || p.personalizavel ? themeColors.primary : undefined }} className={`mt-2 py-2 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all ${temVariacoes || p.personalizavel ? 'text-white' : 'bg-purple-50 text-purple-700'}`}>
                      {temVariacoes || p.personalizavel ? 'Escolher opções' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              );
            })}

            {produtosPublicosFiltrados.length === 0 && (
              <p className="col-span-2 text-center font-bold text-xs text-slate-400 py-12">Nenhum produto encontrado. 🙌</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-[30px] border shadow-sm">
            <p className="text-center text-[10px] font-black uppercase text-purple-500 tracking-widest mb-1">— Passo a Passo —</p>
            <h3 className="text-center font-black text-slate-800 text-lg mb-1">Como funciona</h3>
            <p className="text-center text-slate-400 text-xs mb-5">Pedir é simples e rápido. Em poucos toques você finaliza direto no WhatsApp.</p>
            <div className="space-y-3">
              {passos.map(passo => (
                <div key={passo.n} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Passo {passo.n}</span>
                  <p className="font-bold text-slate-800 text-sm mt-1">{passo.t}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{passo.d}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Modal de detalhes do produto (fotos, variações, personalização) */}
        {produtoDetalheAberto && (() => {
          const p = produtoDetalheAberto;
          const imagens = (p.imagens && p.imagens.length > 0) ? p.imagens : (p.urlImagem ? [p.urlImagem] : []);
          let precoComVariacoes = Number(p.precoVenda || 0);
          (p.variacoes || []).forEach((g: any) => {
            const opcaoId = variacoesEscolhidas[g.id];
            const opcao = g.opcoes.find((o: any) => o.id === opcaoId);
            if (opcao) precoComVariacoes += Number(opcao.precoAdicional || 0);
          });
          return (
            <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center" onClick={() => setProdutoDetalheAberto(null)}>
              <div className="bg-white rounded-t-[35px] sm:rounded-[35px] w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="relative">
                  <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {imagens.length > 0 ? <img src={imagens[imagemAtivaDetalhe]} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-slate-300" />}
                  </div>
                  <button onClick={() => setProdutoDetalheAberto(null)} className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow"><X size={18}/></button>
                </div>
                {imagens.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {imagens.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setImagemAtivaDetalhe(idx)} className={`aspect-square rounded-xl overflow-hidden border-2 ${imagemAtivaDetalhe === idx ? 'border-purple-600' : 'border-transparent'}`}>
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="font-black text-slate-800 text-xl">{p.nome}</h2>
                    <p className="text-purple-700 font-black text-2xl mt-1">R$ {precoComVariacoes.toFixed(2)}</p>
                  </div>

                  {p.descricao && <p className="text-slate-500 text-sm leading-relaxed">{p.descricao}</p>}

                  {(p.variacoes || []).map((g: any) => (
                    <div key={g.id}>
                      <p className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">{g.nome}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.opcoes.map((o: any) => {
                          const selecionado = variacoesEscolhidas[g.id] === o.id;
                          return (
                            <button key={o.id} onClick={() => setVariacoesEscolhidas(prev => ({ ...prev, [g.id]: o.id }))} style={{ backgroundColor: selecionado ? themeColors.primary : undefined, borderColor: selecionado ? themeColors.primary : undefined }} className={`px-4 py-2.5 rounded-full text-xs font-bold border-2 ${selecionado ? 'text-white' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {o.label}{Number(o.precoAdicional || 0) > 0 ? ` +R$ ${Number(o.precoAdicional).toFixed(2)}` : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {p.personalizavel && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1">Personalize seu Pedido</p>
                      <textarea placeholder={p.personalizacaoPlaceholder || 'Ex: nome, cor, tema...'} maxLength={300} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-medium border resize-none h-20" value={personalizacaoTexto} onChange={e => setPersonalizacaoTexto(e.target.value)} />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-2 border">
                      <button onClick={() => setQtdDetalhe(q => Math.max(1, q - 1))} className="font-black text-slate-500 w-6">-</button>
                      <span className="font-bold w-6 text-center">{qtdDetalhe}</span>
                      <button onClick={() => setQtdDetalhe(q => q + 1)} className="font-black text-purple-600 w-6">+</button>
                    </div>
                    <button onClick={confirmarAdicaoDetalhe} style={{ backgroundColor: themeColors.primary }} className="flex-1 text-white font-black text-xs uppercase py-3.5 rounded-2xl active:scale-95 transition-all">
                      Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Checkout em etapas: Carrinho -> Seus Dados -> Pagamento -> WhatsApp */}
        {mostrarCheckoutPublico && (
          <div className="fixed inset-0 bg-white z-[120] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <button onClick={() => setMostrarCheckoutPublico(false)} className="text-slate-400"><X size={22}/></button>
              <h2 className="font-black text-slate-800 text-sm uppercase">Fechar Pedido</h2>
              <div className="w-6"></div>
            </div>

            <div className="flex justify-center gap-8 py-5">
              {[{ k: 'carrinho', l: 'Pedido', n: 1 }, { k: 'dados', l: 'Seus Dados', n: 2 }, { k: 'pagamento', l: 'Pagamento', n: 3 }].map(passo => (
                <div key={passo.k} className="flex flex-col items-center gap-1">
                  <div style={{ borderColor: etapaCheckout === passo.k ? themeColors.primary : '#e2e8f0', color: etapaCheckout === passo.k ? themeColors.primary : '#94a3b8' }} className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-sm">{passo.n}</div>
                  <span className="text-[9px] font-black uppercase text-slate-400">{passo.l}</span>
                </div>
              ))}
            </div>

            <div className="max-w-md mx-auto px-5 pb-32">
              {etapaCheckout === 'carrinho' && (
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 text-base mb-2">Revise seu pedido</h3>
                  {carrinhoPublico.map(i => (
                    <div key={i.itemId} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-800 text-sm">{i.nome}</p>
                          {i.detalhe && <p className="text-[10px] text-slate-400 mt-0.5">{i.detalhe}</p>}
                        </div>
                        <button onClick={() => removerDoCarrinhoPublico(i.itemId)} className="text-red-300 shrink-0"><Trash2 size={16}/></button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1 border">
                          <button onClick={() => setCarrinhoPublico(prev => prev.map(it => it.itemId === i.itemId ? { ...it, qtd: Math.max(1, it.qtd - 1) } : it))} className="font-black text-slate-500 w-5">-</button>
                          <span className="font-bold text-xs w-5 text-center">{i.qtd}</span>
                          <button onClick={() => setCarrinhoPublico(prev => prev.map(it => it.itemId === i.itemId ? { ...it, qtd: it.qtd + 1 } : it))} className="font-black text-purple-600 w-5">+</button>
                        </div>
                        <span className="font-black text-purple-700 text-sm">R$ {(i.precoUnitario * i.qtd).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {carrinhoPublico.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Seu carrinho está vazio.</p>}

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs font-bold text-slate-400 uppercase">Subtotal</span>
                    <span className="font-black text-lg text-slate-800">R$ {totalCarrinhoPublico.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {etapaCheckout === 'dados' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-base mb-2">Seus dados</h3>
                  <p className="text-slate-400 text-xs -mt-3">Precisamos disso para confirmar o pedido.</p>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Nome Completo</label>
                    <input placeholder="Digite seu nome..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-bold border border-transparent focus:border-purple-400" value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Telefone / WhatsApp</label>
                    <input placeholder="(11) 99999-9999" className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-bold border border-transparent focus:border-purple-400" value={telefoneComprador} onChange={e => setTelefoneComprador(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-600 ml-1 block mb-1">Modalidade</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setModalidadeEntrega('entrega')} style={{ borderColor: modalidadeEntrega === 'entrega' ? themeColors.primary : undefined, color: modalidadeEntrega === 'entrega' ? themeColors.primary : undefined }} className={`py-3 rounded-xl text-xs font-black uppercase border-2 ${modalidadeEntrega === 'entrega' ? 'bg-purple-50' : 'bg-slate-50 border-transparent text-slate-500'}`}>Entrega</button>
                      <button onClick={() => setModalidadeEntrega('retirada')} style={{ borderColor: modalidadeEntrega === 'retirada' ? themeColors.primary : undefined, color: modalidadeEntrega === 'retirada' ? themeColors.primary : undefined }} className={`py-3 rounded-xl text-xs font-black uppercase border-2 ${modalidadeEntrega === 'retirada' ? 'bg-purple-50' : 'bg-slate-50 border-transparent text-slate-500'}`}>Retirada no Local</button>
                    </div>
                  </div>
                  {modalidadeEntrega === 'entrega' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Endereço de Entrega</label>
                      <textarea placeholder="Rua, número, bairro, referência..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-medium text-sm border border-transparent focus:border-purple-400 resize-none h-16" value={enderecoComprador} onChange={e => setEnderecoComprador(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {etapaCheckout === 'pagamento' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-base mb-2">Forma de pagamento</h3>
                  <div className="space-y-2">
                    {[
                      { v: 'pix', l: 'Pix', s: 'Aprovação imediata' },
                      { v: 'dinheiro_sinal', l: 'Dinheiro', s: 'Sinal de 50% de entrada + 50% na finalização' },
                      { v: 'cartao_credito', l: 'Cartão de Crédito', s: 'Combinado com a loja' },
                      { v: 'cartao_debito', l: 'Cartão de Débito', s: 'Combinado com a loja' },
                    ].map(op => (
                      <button key={op.v} onClick={() => setFormaPagamentoComprador(op.v as any)} style={{ borderColor: formaPagamentoComprador === op.v ? themeColors.primary : undefined }} className={`w-full text-left p-3 rounded-2xl border-2 ${formaPagamentoComprador === op.v ? 'bg-purple-50 border-purple-600' : 'bg-slate-50 border-transparent'}`}>
                        <p className="font-bold text-sm text-slate-800">{op.l}</p>
                        <p className="text-[10px] text-slate-400">{op.s}</p>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-600 ml-1">Observações (opcional)</label>
                    <textarea placeholder="Cor, tamanho, observações..." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none font-medium text-sm border border-transparent focus:border-purple-400 resize-none h-16" value={observacoesComprador} onChange={e => setObservacoesComprador(e.target.value)} />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{qtdTotalCarrinho} itens</span><span>R$ {totalCarrinhoPublico.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-slate-800"><span>Total</span><span>R$ {totalCarrinhoPublico.toFixed(2)}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 max-w-md mx-auto">
              {etapaCheckout !== 'carrinho' && (
                <button onClick={() => setEtapaCheckout(etapaCheckout === 'pagamento' ? 'dados' : 'carrinho')} className="flex-1 bg-slate-100 text-slate-600 font-black text-xs uppercase py-4 rounded-2xl flex items-center justify-center gap-1"><ChevronDown className="rotate-90" size={14}/> Voltar</button>
              )}
              {etapaCheckout !== 'pagamento' ? (
                <button
                  onClick={() => {
                    if (etapaCheckout === 'carrinho') {
                      if (carrinhoPublico.length === 0) return showToast("Adicione ao menos um item!", 'erro');
                      setEtapaCheckout('dados');
                    } else if (etapaCheckout === 'dados') {
                      if (!nomeComprador.trim()) return showToast("Digite seu nome!", 'erro');
                      if (!telefoneComprador.trim()) return showToast("Digite seu telefone!", 'erro');
                      if (modalidadeEntrega === 'entrega' && !enderecoComprador.trim()) return showToast("Digite o endereço de entrega!", 'erro');
                      setEtapaCheckout('pagamento');
                    }
                  }}
                  style={{ backgroundColor: themeColors.primary }}
                  className="flex-1 text-white font-black text-xs uppercase py-4 rounded-2xl"
                >
                  Continuar
                </button>
              ) : (
                <button onClick={finalizarPedidoPublicoWhatsapp} className="flex-1 bg-emerald-500 text-white font-black text-xs uppercase py-4 rounded-2xl flex items-center justify-center gap-2">
                  <MessageCircle size={16}/> Fechar Pedido
                </button>
              )}
            </div>
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
        <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
          <ShoppingCart size={18}/> {pedidoEditandoId ? 'Editando Dados' : isDuplicando ? 'Salvando Cópia' : 'Novo Orçamento'}
        </h2>
        {!pedidoEditandoId && (
          <button onClick={() => setMostrarSeletorCatalogo(!mostrarSeletorCatalogo)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black uppercase border border-purple-100">
            {precoManual ? '✨ Item de Catálogo' : '📖 Usar Catálogo'}
          </button>
        )}
      </div>

      <div className="mb-5 w-full">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-2">
          Modo de Cálculo
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl w-full">
          <button
            type="button"
            onClick={() => setModoCalculo('peca')}
            style={{
              backgroundColor: modoCalculo === 'peca' ? themeColors.primary : 'transparent',
              color: modoCalculo === 'peca' ? '#ffffff' : '#64748b'
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs transition-all text-center ${
              modoCalculo === 'peca' ? 'shadow-sm' : ''
            }`}
          >
            Por Peça
          </button>

          <button
            type="button"
            onClick={() => setModoCalculo('lote')}
            style={{
              backgroundColor: modoCalculo === 'lote' ? themeColors.primary : 'transparent',
              color: modoCalculo === 'lote' ? '#ffffff' : '#64748b'
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs transition-all text-center ${
              modoCalculo === 'lote' ? 'shadow-sm' : ''
            }`}
          >
            Por Lote
          </button>
        </div>
      </div>

      {mostrarSeletorCatalogo && !pedidoEditandoId && (
        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-3xl mb-4 text-xs space-y-2 w-full">
          <p className="font-bold text-purple-700 uppercase text-[10px]">Escolha um produto pronto:</p>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto w-full">
            {produtos.map(p => (
              <div key={p.id} onClick={() => { setNomeProd(p.nome); setPrecoManual(String(p.precoVenda)); setProdutoCatalogoSelecionadoId(p.id); setMostrarSeletorCatalogo(false); }} className="bg-white p-2.5 rounded-xl border flex justify-between items-center cursor-pointer hover:border-purple-400 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                    {p.urlImagem ? <img src={p.urlImagem} className="w-full h-full object-cover" /> : <ImageIcon size={14}/>}
                  </div>
                  <span className="font-bold">{p.nome}</span>
                </div>
                <span style={{ color: themeColors.primary }} className="font-black">R$ {Number(p.precoVenda).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-3 w-full">
         <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto / Serviço</label>
            <input placeholder="Ex: Kit Festa" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border focus:border-purple-500" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
         </div>
         <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">
              {modoCalculo === 'peca' ? 'Qtd Peças' : 'Qtd no Lote'}
            </label>
            <input type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center font-bold" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
         </div>
      </div>

      <div className="mb-4 w-full">
         <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1 block mb-1">
          Detalhamento dos Itens - Opcional
         </label>
         <textarea
           placeholder="Escreva em tópicos o que compõe o kit para sair detalhado no PDF...&#10;Ex:&#10;10 topos de docinho&#10;5 topos de pote&#10;1 cordão de papel de mesa"
           className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold border border-transparent focus:border-purple-400 resize-none h-24"
           value={detalhamentoPed}
           onChange={e => setDetalhamentoPed(e.target.value)}
         />
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
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">
               {modoCalculo === 'peca' ? 'Materiais Usados (Por Peça)' : 'Materiais Usados (Para o Lote Inteiro)'}
             </label>
             <div className="relative w-full mb-2">
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Pesquisar material..."
                 value={pesquisaMatsCalculadora}
                 onChange={e => setPesquisaMatsCalculadora(e.target.value)}
                 className="w-full p-3 pl-10 bg-slate-50 rounded-2xl outline-none text-xs font-medium border border-transparent focus:border-purple-400"
               />
             </div>
             <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 block border border-transparent focus:border-purple-400" onChange={e => { const m = materiais.find(item => item.id === e.target.value); if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade, qtdUsada: 1 }]); }} value="">
                <option value="">+ Adicionar Material... ({materiaisFiltradosCalculadora.length} encontrado{materiaisFiltradosCalculadora.length === 1 ? '' : 's'})</option>
                {materiaisFiltradosCalculadora.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.unidade || 'un'})</option>)}
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
              <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Tempo Gasto (min)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={tGasto} onChange={e => setTGasto(e.target.value)} />
            </div>
            <div className="w-full">
              <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Valor da Hora (R$)</label>
              <input type="number" style={{ color: themeColors.primary }} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-purple-400" value={vHora} onChange={e => setVHora(e.target.value)} />
            </div>
          </div>

          {equipamentos.length > 0 && (
            <div className="mb-4 w-full">
              <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1 block mb-1">🛠️ Equipamentos Ativos neste Orçamento</label>
              <div className="flex flex-wrap gap-2 w-full">
                {equipamentos.map(eq => {
                  const selecionado = equipamentosSelecionados.includes(eq.id);
                  return (
                    <button key={eq.id} type="button" onClick={() => toggleEquipamento(eq.id)} style={{ backgroundColor: selecionado ? themeColors.primary : undefined, borderColor: selecionado ? themeColors.primary : undefined }} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selecionado ? 'text-white shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                      {eq.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 w-full">
            <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1 block mb-1">
              {modoCalculo === 'peca' ? '📦 Custos Extras por Unidade (R$)' : '📦 Custos Extras do Lote (R$)'}
            </label>
            <div className="grid grid-cols-4 gap-2 w-full">
              {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'IMPRES.'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl w-full border">
                  <span className="text-[8px] font-black text-slate-400 mb-1">{c.label}</span>
                  <input type="number" step="0.01" className="w-full bg-transparent text-center text-xs outline-none font-bold text-slate-700" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 w-full">
            <div className="w-full">
              <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Lucro %</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} />
            </div>
            <div className="w-full">
              <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Prazo</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold block" value={prazo} onChange={e => setPrazo(e.target.value)} />
            </div>
          </div>

          {Number(lucro) < Number(financasFixo.margemMinima || 0) && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-4 flex items-center gap-2 w-full">
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-red-600 text-xs font-bold">
                Sua margem de lucro ({lucro}%) está abaixo do mínimo definido ({financasFixo.margemMinima || 0}%). Considere ajustar o preço ou o percentual de lucro.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl mb-4 text-xs w-full">
          <p style={{ color: themeColors.secondary }} className="font-bold">💥 Preço carregado pelo catálogo.</p>
          <p className="text-slate-500 mt-1">Valor Unitário base: <strong>R$ {Number(precoManual).toFixed(2)}</strong></p>
          <div className="mt-3 w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prazo</label>
            <input type="date" className="w-full p-4 bg-white rounded-2xl outline-none text-xs font-bold border block" value={prazo} onChange={e => setPrazo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mb-4 w-full">
         <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desconto Total (R$)</label>
         <input style={{ color: themeColors.secondary }} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
      </div>

      <div className="mb-6 w-full">
         <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1">📝 Observações do Orçamento</label>
         <textarea placeholder="Ex: Sinal de 50% para início da produção. Restante na entrega." className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none text-xs font-semibold border border-transparent focus:border-purple-400 resize-none h-20" value={docObsPedido} onChange={e => setDocObsPedido(e.target.value)} />
      </div>

      {precoManual === null && (
        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 text-xs space-y-2.5 w-full">
          <p style={{ color: themeColors.primary }} className="font-black uppercase tracking-wider text-[10px] mb-1">
            📋 RESUMO FINANCEIRO ({modoCalculo === 'peca' ? 'POR PEÇA' : 'RATEIO DO LOTE'})
          </p>
          <div className="flex justify-between text-slate-500 w-full"><span>Materiais:</span><span className="font-bold">R$ {resumenFinanceiro.materiais}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Mão de Obra:</span><span className="font-bold">R$ {resumenFinanceiro.maoObra}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Extras / Custo Manual:</span><span className="font-bold">R$ {resumenFinanceiro.extras}</span></div>
          <div className="flex justify-between text-slate-500 w-full"><span>Depreciação de Equipamentos:</span><span style={{ color: themeColors.primary }} className="font-bold">R$ {resumenFinanceiro.deprec}</span></div>
          <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1 w-full">
            <span>Custo Unitário da Peça:</span>
            <span style={{ color: themeColors.primary }}>R$ {resumenFinanceiro.custoPeca}</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-bold w-full"><span>Lucro Livre Gerado ({lucro}%) :</span><span>R$ {resumenFinanceiro.lucroLivre}</span></div>
        </div>
      )}

      <div className="flex flex-col items-center border-t pt-6 gap-4 w-full">
        <div className="flex justify-between items-center w-full px-2">
          <div className="text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Preço Sugerido</span>
            <span className="text-base font-bold text-slate-400">R$ {resumenFinanceiro.final}</span>
          </div>

  <div className="text-right flex flex-col items-end">
            <label htmlFor="precoFinalInput" style={{ color: themeColors.secondary }} className="text-[10px] font-black uppercase tracking-wider block mb-1">Preço Final Cobrado</label>
            <div style={{ borderColor: themeColors.secondary }} className="flex items-center gap-1.5 border-2 rounded-2xl px-3 py-1 bg-orange-50/20 focus-within:border-purple-600 transition-all">
              <span style={{ color: themeColors.secondary }} className="font-black text-2xl">R$</span>
              <input
                id="precoFinalInput"
                type="number"
                step="0.01"
                style={{ color: themeColors.secondary }}
                className="bg-transparent font-black text-3xl tracking-tighter outline-none w-32 text-right"
                value={precoFinalDigitado}
                onChange={e => setPrecoFinalDigitado(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="w-full pt-2 flex justify-center">
          <button
            disabled={!!salvando.orcamento}
            style={{ backgroundColor: themeColors.secondary, opacity: salvando.orcamento ? 0.6 : 1 }}
            onClick={async () => {
             if (salvando.orcamento) return;
             if(!nomeProd) return showToast("Digite o nome do produto!", 'erro');

             const precoFinalSalvar = Number(precoFinalDigitado || 0).toFixed(2);

             const dadosPedido = {
               nomeProd,
               detalhamentoPed,
               preco: precoFinalSalvar,
               clienteId: clienteSel,
               prazo,
               qtdPed,
               vHora,
               tGasto,
               custos,
               lucro,
               desconto,
               userId: user.uid,
               precoManual: precoManual,
               obsPedido: docObsPedido,
               equipamentosSelecionados,
               modoCalculo,
               materiaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) }))
             };

             setSalvando(prev => ({ ...prev, orcamento: true }));
             try {
               if (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
               else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), dataVenda: Timestamp.now(), status: 'Pendente', userId: user.uid });

               if (precoManual !== null && produtoCatalogoSelecionadoId) {
                 try {
                   await addDoc(collection(db, "produtos", produtoCatalogoSelecionadoId, "historicoPrecos"), {
                     preco: Number(precoFinalSalvar),
                     data: Timestamp.now()
                   });
                 } catch {}
               }

               gerarPDF({nomeProd, detalhamentoPed, preco: precoFinalSalvar, clienteId: clienteSel, prazo, qtdPed, obsPedido: docObsPedido});

               limparCalculadora();
               setActiveTab('pedidos');
               showToast("Orçamento salvo e PDF gerado com sucesso! 🚀");
             } catch (error) {
               showToast("Erro ao salvar dados.", 'erro');
             } finally {
               setSalvando(prev => ({ ...prev, orcamento: false }));
             }
          }} className="w-full max-w-xs hover:opacity-90 text-white font-black py-4 rounded-[26px] uppercase text-xs shadow-lg transition-transform active:scale-95 tracking-widest text-center">
            {salvando.orcamento ? 'Salvando...' : 'Salvar e Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  );

  // Cria (ou atualiza) UMA anotação, guardando datas extras no mesmo documento —
  // ela vai aparecer em todos os dias da Agenda, mas continua sendo 1 card só no Kanban
  const salvarAnotacao = async (irParaKanban: boolean) => {
    if (salvando.anotacao) return;
    if(!novaAnotacao.titulo) return showToast(irParaKanban ? "Seu pedido precisa de uma descrição básica!" : "Sua tarefa precisa de uma descrição básica!", 'erro');
    const extras = datasExtras.filter(d => d !== novaAnotacao.dataPrazo);

    setSalvando(prev => ({ ...prev, anotacao: true }));
    try {
      if (novaAnotacao.id) {
        const dadosNota: any = { titulo: novaAnotacao.titulo, conteudo: novaAnotacao.conteudo || '', dataPrazo: novaAnotacao.dataPrazo, datasExtras: extras, prioridade: novaAnotacao.prioridade || 'media', concluido: false };
        if (irParaKanban) { dadosNota.apareceNoKanban = true; dadosNota.statusKanban = 'a_fazer'; }
        await updateDoc(doc(db, "anotacoes", novaAnotacao.id), dadosNota);
      } else {
        const dadosNota: any = {
          titulo: novaAnotacao.titulo,
          conteudo: novaAnotacao.conteudo || '',
          dataPrazo: novaAnotacao.dataPrazo,
          datasExtras: extras,
          prioridade: novaAnotacao.prioridade || 'media',
          concluido: false,
          userId: user.uid,
          dataCriacao: new Date().toLocaleDateString('pt-BR'),
          apareceNoKanban: irParaKanban
        };
        if (irParaKanban) dadosNota.statusKanban = 'a_fazer';
        await addDoc(collection(db, "anotacoes"), dadosNota);
      }

      setNovaAnotacao({ id: '', titulo: '', conteudo: '', dataPrazo: new Date().toISOString().split('T')[0], prioridade: 'media' });
      setDatasExtras([]);
      showToast(irParaKanban ? "Pedido criado no Kanban com sucesso! 🗂️✨" : "Tarefa agendada com sucesso! 📅✨");
      if (irParaKanban) setSubAbaAnotacoes('kanban');
    } catch {
      showToast("Erro ao salvar tarefa.", 'erro');
    } finally {
      setSalvando(prev => ({ ...prev, anotacao: false }));
    }
  };

  const formularioTarefaKanban = (
    <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
      <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2"><Calendar size={20}/> Criar Nova Tarefa / Lembrete</h2>
      <p className="text-slate-400 text-[11px] mb-4">Gerencie as pendências e compras do seu negócio por data. O que você colocar aqui alimenta o painel da sua Tela Inicial.</p>

      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">O que precisa fazer?</label>
      <input placeholder="Ex: Comprar papel fotográfico A4 / Entregar caneca do cliente" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-bold text-sm" value={novaAnotacao.titulo} onChange={e => setNovaAnotacao({...novaAnotacao, titulo: e.target.value})} />

      <div className="mb-4 w-full">
        <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Data Limite / Prazo</label>
        <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm block mt-1" value={novaAnotacao.dataPrazo} onChange={e => setNovaAnotacao({...novaAnotacao, dataPrazo: e.target.value})} />
      </div>

      <div className="mb-4 w-full">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-2">Prioridade</label>
        <div className="grid grid-cols-3 gap-2">
          {[{v:'baixa', l:'Baixa', c:'#94a3b8'},{v:'media', l:'Média', c:'#f59e0b'},{v:'alta', l:'Alta', c:'#ef4444'}].map(op => (
            <button key={op.v} type="button" onClick={() => setNovaAnotacao({...novaAnotacao, prioridade: op.v})}
              style={{ backgroundColor: novaAnotacao.prioridade === op.v ? op.c : undefined }}
              className={`py-2.5 rounded-xl text-xs font-bold uppercase ${novaAnotacao.prioridade === op.v ? 'text-white' : 'bg-slate-100 text-slate-500'}`}>
              {op.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 w-full">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">
          Também aparecer nestes dias (opcional)
        </label>
        <p className="text-slate-400 text-[10px] mb-2">É a mesma tarefa aparecendo em vários dias da agenda — não cria tarefas repetidas.</p>
        <div className="flex gap-2 mb-2">
          <input type="date" className="flex-1 p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold" value={novaDataExtra} onChange={e => setNovaDataExtra(e.target.value)} />
          <button type="button" onClick={() => { if (!datasExtras.includes(novaDataExtra) && novaDataExtra !== novaAnotacao.dataPrazo) setDatasExtras([...datasExtras, novaDataExtra]); }} style={{ backgroundColor: themeColors.primary }} className="text-white px-4 rounded-xl text-xs font-black">+ Add</button>
        </div>
        {datasExtras.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {datasExtras.map(d => (
              <span key={d} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                {d.split('-').reverse().join('/')}
                <button onClick={() => setDatasExtras(datasExtras.filter(x => x !== d))}><X size={12}/></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Detalhes Adicionais (Opcional)</label>
      <textarea placeholder="Escreva informações extras ou observações aqui..." className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none border focus:border-purple-400 resize-none h-16 text-sm font-semibold" value={novaAnotacao.conteudo} onChange={e => setNovaAnotacao({...novaAnotacao, conteudo: e.target.value})} />

      <p className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Onde isso deve aparecer?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={!!salvando.anotacao}
          style={{ backgroundColor: themeColors.secondary, opacity: salvando.anotacao ? 0.6 : 1 }}
          onClick={() => salvarAnotacao(false)}
          className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-md flex flex-col items-center gap-1">
          <CheckSquare size={18}/>
          {salvando.anotacao ? 'Salvando...' : (novaAnotacao.id ? 'Atualizar Tarefa' : 'Agendar Tarefa')}
        </button>

        <button
          disabled={!!salvando.anotacao}
          style={{ backgroundColor: themeColors.primary, opacity: salvando.anotacao ? 0.6 : 1 }}
          onClick={() => salvarAnotacao(true)}
          className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-md flex flex-col items-center gap-1">
          🗂️
          {salvando.anotacao ? 'Salvando...' : (novaAnotacao.id ? 'Atualizar e ir p/ Kanban' : 'Novo Pedido no Kanban')}
        </button>
      </div>
    </div>
  );

  const menuNavButtons = (
    <>
      <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'inicio' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'inicio' ? themeColors.primary : undefined }}><Home size={16}/> Início</button>
      <button onClick={() => setActiveTab('criar')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'criar' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'criar' ? themeColors.primary : undefined }}><Plus size={16}/> Orçar</button>
      <button onClick={() => setActiveTab('contratos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'contratos' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'contratos' ? themeColors.primary : undefined }}><FileText size={16}/> Contratos</button>

      <button onClick={() => setActiveTab('perfil')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'perfil' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'perfil' ? themeColors.primary : undefined }}><Settings size={16}/> Perfil da Loja</button>
      <button onClick={() => setActiveTab('anotacoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'anotacoes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'anotacoes' ? themeColors.primary : undefined }}><Calendar size={16}/> Agenda / Tarefas </button>

      <button onClick={() => { setActiveTab('financeiro'); setSubAbaFinanceiro('geral'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'financeiro' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'financeiro' ? themeColors.primary : undefined }}><Calculator size={16}/> Configurações de Custos</button>
      <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'pedidos' ? themeColors.primary : undefined }}><History size={16}/> Histórico de Orçamentos</button>
      <button onClick={() => setActiveTab('balcao')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'balcao' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'balcao' ? themeColors.primary : undefined }}><ShoppingCart size={16}/> Balcão de Vendas Rápido</button>
      <button onClick={() => setActiveTab('catalogo')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'catalogo' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'catalogo' ? themeColors.primary : undefined }}><BookOpen size={16}/> Meu Catálogo Visual</button>

      <button onClick={() => setActiveTab('fornecedores')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'fornecedores' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'fornecedores' ? themeColors.primary : undefined }}><Globe size={16}/> Biblioteca Fornecedores </button>
      <button onClick={() => setActiveTab('comissoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'comissoes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'comissoes' ? themeColors.primary : undefined }}><Percent size={16}/> Canais de Venda</button>
      <button onClick={() => setActiveTab('caixa')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'caixa' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'caixa' ? themeColors.primary : undefined }}><DollarSign size={16}/> Fluxo de Caixa</button>

      <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'materiais' ? themeColors.primary : undefined }}><Package size={16}/> Armário / Insumos</button>
      <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'clientes' ? themeColors.primary : undefined }}><User size={16}/> Meus Clientes</button>

      <div className="border-t pt-2 mt-1">
        <button onClick={() => setActiveTab('atualizacoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'atualizacoes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'atualizacoes' ? themeColors.primary : undefined }}><Megaphone size={16}/> Atualizações</button>
        <button onClick={() => setActiveTab('suporte')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'suporte' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'suporte' ? themeColors.primary : undefined }}><LifeBuoy size={16}/> Suporte</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32 lg:pb-0 font-sans text-slate-700 w-full relative overflow-x-hidden lg:flex">

      {mostrarOnboarding && <OnboardingCarrossel onFinalizar={finalizarOnboarding} />}
      <Toast toast={toast} />
      <ConfirmModal
        modal={modalConfirm}
        onCancel={() => setModalConfirm(null)}
        onConfirm={() => { modalConfirm?.onConfirm(); setModalConfirm(null); }}
      />
      <ModalSinal
        item={mostrarModalSinal}
        valor={valorSinalInput}
        setValor={setValorSinalInput}
        onCancel={() => { setMostrarModalSinal(null); setValorSinalInput(''); }}
        onConfirmar={confirmarRegistroSinal}
      />

      {/* Menu do celular: some quando a tela é grande (desktop usa a barra lateral fixa abaixo) */}
      <div className={`fixed inset-0 bg-black/40 z-50 lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`w-72 bg-white h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none">
            <div className="flex justify-between items-center border-b pb-4">
              <div style={{ color: themeColors.primary }} className="font-black text-lg flex items-center gap-2"><Calculator size={22}/> Menu PrecificaJá</div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
            </div>
            <nav className="flex flex-col gap-1">
              {menuNavButtons}
            </nav>
          </div>
          <button onClick={() => signOut(auth)} className="w-full text-red-500 bg-red-50 p-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5"><LogOut size={16}/> Sair</button>
        </div>
      </div>

      {/* Barra lateral fixa — só aparece em telas grandes (desktop). No celular, some e usa o menu de cima. */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-slate-100 lg:p-6 lg:justify-between">
        <div className="space-y-6 overflow-y-auto">
          <div style={{ color: themeColors.primary }} className="font-black text-lg flex items-center gap-2 pb-4 border-b"><Calculator size={22}/> PrecificaJá</div>
          <nav className="flex flex-col gap-1">
            {menuNavButtons}
          </nav>
        </div>
        <button onClick={() => signOut(auth)} className="w-full text-red-500 bg-red-50 p-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 mt-6"><LogOut size={16}/> Sair</button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-40 w-full lg:hidden">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700 hover:text-purple-700 transition-colors">
            <Menu size={24} />
          </button>
          <div style={{ color: themeColors.primary }} className="font-black text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
          <div className="w-10"></div>
        </header>

        <div className="p-4 lg:p-8 max-w-xl lg:max-w-6xl mx-auto w-full">
        {activeTab === 'inicio' && (
          <div className="space-y-5 pt-2 w-full">
            <div style={{ backgroundColor: themeColors.primary }} className="p-6 rounded-[35px] shadow-lg text-white w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Faturamento do Mês Atual</p>
                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">Zera no dia 1º</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">R$ {dashboardMetrics.faturamento}</h2>
              <p className="text-[11px] text-white/80 mt-2 opacity-80">📈 Vendas concluídas no mês corrente</p>
            </div>

            <div onClick={() => { limparCalculadora(); setActiveTab('criar'); }}
                 style={{ backgroundColor: themeColors.secondary }}
                 className="p-6 rounded-[35px] shadow-md cursor-pointer active:scale-95 transition-all text-white flex justify-between items-center w-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Calculadora Integrada</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Novo Orçamento Rápido 🚀</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Calculator size={24}/>
              </div>
            </div>

            {proximasEntregas.length > 0 && (
              <div className="bg-white p-5 rounded-[35px] border shadow-sm w-full">
                <h3 style={{ color: themeColors.primary }} className="font-black uppercase text-xs tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock size={16}/> Próximas Entregas (7 dias)
                </h3>
                <div className="space-y-2">
                  {proximasEntregas.map(p => {
                    const cli = clientes.find(c => c.id === p.clienteId);
                    const dataFormatada = new Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    return (
                      <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{p.nomeProd}</p>
                          <p className="text-[10px] text-slate-400">{cli?.nome || 'Sem cliente'}</p>
                        </div>
                        <span style={{ color: themeColors.secondary }} className="text-xs font-black shrink-0 ml-2">{dataFormatada}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white p-5 rounded-[35px] border shadow-sm w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 style={{ color: themeColors.primary }} className="font-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Calendar size={16}/> Agenda da Semana
                </h3>
                <span style={{ color: themeColors.primary }} className="text-[10px] bg-purple-50 px-2 py-1 rounded-md font-bold uppercase">Mês Atual</span>
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
                      <span style={{ color: isActive ? themeColors.secondary : undefined }} className={`text-[10px] font-bold ${!isActive ? 'text-slate-400' : 'font-extrabold'}`}>
                        {dia.diaSemanaTexto}
                      </span>
                      <div
                        style={{ backgroundColor: isActive ? themeColors.secondary : undefined, borderColor: isActive ? themeColors.secondary : undefined }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all border ${isActive ? 'text-white shadow-md scale-105' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                        {dia.diaNumero}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 w-full">
                {anotacoesDoDiaSelecionado.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 animate-fadeIn">
                    <button onClick={() => toggleStatusAnotacao(item.id, item.concluido)} style={{ color: themeColors.primary }} className="transition-transform active:scale-95 shrink-0">
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

            <div className="bg-white p-5 rounded-[35px] border shadow-sm w-full">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 style={{ color: themeColors.primary }} className="font-black uppercase text-xs tracking-wider">🗂️ Produção em Andamento</h3>
                <button onClick={() => { setActiveTab('anotacoes'); setSubAbaAnotacoes('kanban'); }} className="text-[10px] font-bold text-slate-400">Ver tudo →</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {colunasKanban.map(coluna => {
                  const qtd = itensDoKanban.filter(item => item.statusKanban === coluna.id).length;
                  return (
                    <div key={coluna.id} onClick={() => { setActiveTab('anotacoes'); setSubAbaAnotacoes('kanban'); }} className="bg-slate-50 rounded-2xl p-3 text-center cursor-pointer active:scale-95 transition-all">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{coluna.emoji} {coluna.nome}</p>
                      <p style={{ color: coluna.cor }} className="text-2xl font-black">{qtd}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div onClick={() => setActiveTab('caixa')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo em Caixa</p>
                <p className={`text-2xl font-black mt-0.5 ${saldoCaixa >= 0 ? 'text-slate-800' : 'text-red-500'}`}>R$ {saldoCaixa.toFixed(2)}</p>
              </div>
              <div style={{ color: themeColors.primary }} className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center"><DollarSign size={20}/></div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div onClick={() => setActiveTab('pedidos')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div style={{ color: themeColors.secondary }} className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center mb-3"><History size={20}/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{dashboardMetrics.pendentes}</p>
              </div>

  <div onClick={() => setActiveTab('balcao')} className="bg-white p-5 rounded-[30px] border shadow-sm cursor-pointer active:scale-95 transition-all w-full">
                <div style={{ color: themeColors.primary }} className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-3"><ShoppingCart size={20}/></div>
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

        {activeTab === 'perfil' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Settings size={18}/> Perfil da Minha Loja</h2>
              <p className="text-slate-400 text-[11px] mb-6">Cadastre as informações da sua empresa. Elas serão preenchidas automaticamente em todos os Contratos e Orçamentos!</p>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Logo Oficial da Empresa</label>
              <div className="mb-5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[140px] w-full">
                {logoLojaPerfil ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden flex items-center justify-center bg-white p-2">
                    <img src={logoLojaPerfil} alt="Logo da Loja" className="max-w-full max-h-full object-contain" />
                    <button onClick={() => setLogoLojaPerfil('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors w-full h-full justify-center py-4">
                    <div style={{ color: themeColors.primary }} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <Camera size={22} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">
                      {subindoLogo ? 'Enviando Imagem...' : '📸 Enviar Logo da Empresa'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={subindoLogo} />
                  </label>
                )}
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Banner / Capa da Vitrine (imagem larga)</label>
              <div className="mb-5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 relative min-h-[110px] w-full">
                {bannerLojaUrl ? (
                  <div className="relative w-full h-28 rounded-2xl overflow-hidden">
                    <img src={bannerLojaUrl} alt="Banner da Loja" className="w-full h-full object-cover" />
                    <button onClick={() => setBannerLojaUrl('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"><X size={14}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors w-full h-full justify-center py-3">
                    <div style={{ color: themeColors.primary }} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <ImageIcon size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">
                      {subindoBanner ? 'Enviando Imagem...' : '🖼️ Enviar Banner da Vitrine'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} disabled={subindoBanner} />
                  </label>
                )}
              </div>

              <div className="mb-6 w-full bg-purple-50/50 border border-purple-100 rounded-2xl p-4">
                <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">Link Personalizado da Vitrine</label>
                <p className="text-[10px] text-slate-400 mb-2">Troque o código aleatório por um link mais fácil de compartilhar.</p>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-white rounded-xl border overflow-hidden">
                    <span className="text-[10px] text-slate-400 pl-3 shrink-0">?loja=</span>
                    <input placeholder="minha-loja" className="w-full p-3 outline-none text-xs font-bold" value={inputSlugLoja} onChange={e => setInputSlugLoja(e.target.value)} />
                  </div>
                  <button disabled={!!salvando.slug} onClick={salvarSlugLoja} style={{ backgroundColor: themeColors.primary, opacity: salvando.slug ? 0.6 : 1 }} className="text-white text-xs font-black uppercase px-4 rounded-xl shrink-0">{salvando.slug ? '...' : 'Salvar'}</button>
                </div>
                {slugLojaPerfil && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-2 break-all">🔗 {window.location.origin}{window.location.pathname}?loja={slugLojaPerfil}</p>
                )}
              </div>

              <div className="mb-5 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">✍️ Assinatura da Empresa</label>
                <p className="text-slate-400 text-[10px] mb-2">Desenhe uma vez e ela entra automática em todos os seus contratos.</p>
                {assinaturaLojaUrl && !mostrarPadAssinaturaLoja ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3">
                    <img src={assinaturaLojaUrl} alt="Assinatura salva" className="h-16 object-contain" />
                    <button onClick={() => setMostrarPadAssinaturaLoja(true)} style={{ color: themeColors.primary }} className="text-[11px] font-bold underline">
                      Refazer assinatura
                    </button>
                  </div>
                ) : (
                  <SignaturePad onSave={salvarAssinaturaLoja} />
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo / Razão Social</label>
                  <input placeholder="Ex: Loop Creative Ltda" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={nomeLojaPerfil} onChange={e => setNomeLojaPerfil(e.target.value)} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Fantasia</label>
                  <input placeholder="Ex: Loop Creative" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={nomeFantasiaPerfil} onChange={e => setNomeFantasiaPerfil(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CPF / CNPJ</label>
                    <input placeholder="00.000.000/0001-00" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={cpfCnpjPerfil} onChange={e => setCpfCnpjPerfil(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Telefone / WhatsApp</label>
                    <input placeholder="(11) 99999-9999" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={telefonePerfil} onChange={e => setTelefonePerfil(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail de Contato</label>
                  <input placeholder="contato@sualoja.com" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={emailPerfil} onChange={e => setEmailPerfil(e.target.value)} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CEP</label>
                    <input placeholder="00000-000" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={cepPerfil} onChange={e => setCepPerfil(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço Completo</label>
                    <input placeholder="Rua, Número, Bairro" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={enderecoPerfil} onChange={e => setEnderecoPerfil(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cidade</label>
                    <input placeholder="São Paulo" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={cidadePerfil} onChange={e => setCidadePerfil(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
                    <input placeholder="SP" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={estadoPerfil} onChange={e => setEstadoPerfil(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dados Bancários / Chave PIX</label>
                  <textarea placeholder="Banco: X | Agência: 0001 | Conta: 12345-6 | PIX: cnpj/e-mail/celular" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400 h-20 resize-none text-xs" value={dadosBancariosPerfil} onChange={e => setDadosBancariosPerfil(e.target.value)} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp de Suporte (aparece na aba Suporte)</label>
                  <input placeholder="Ex: 21999999999" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={suporteZapPerfil} onChange={e => setSuporteZapPerfil(e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest mb-1">
                  <Palette size={18}/> Paleta de Cores do App
                </h3>
                <p className="text-slate-400 text-[11px] mb-4">Escolha um tema pronto ou monte a sua combinação livremente:</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PRESET_PALETTES.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThemeColors({
                        primary: preset.primary,
                        primaryHover: preset.primaryHover,
                        secondary: preset.secondary,
                        secondaryHover: preset.secondaryHover
                      })}
                      className="p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all border-slate-100 bg-slate-50 hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{preset.nome}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Cor Primária</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border">
                      <input
                        type="color"
                        value={themeColors.primary}
                        onChange={e => setThemeColors(prev => ({
                          ...prev,
                          primary: e.target.value,
                          primaryHover: e.target.value
                        }))}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeColors.primary}
                        onChange={e => setThemeColors(prev => ({
                          ...prev,
                          primary: e.target.value,
                          primaryHover: e.target.value
                        }))}
                        className="w-full text-xs font-mono font-bold uppercase outline-none"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border">
                      <input
                        type="color"
                        value={themeColors.secondary}
                        onChange={e => setThemeColors(prev => ({
                          ...prev,
                          secondary: e.target.value,
                          secondaryHover: e.target.value
                        }))}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeColors.secondary}
                        onChange={e => setThemeColors(prev => ({
                          ...prev,
                          secondary: e.target.value,
                          secondaryHover: e.target.value
                        }))}
                        className="w-full text-xs font-mono font-bold uppercase outline-none"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={!!salvando.perfil}
                style={{ backgroundColor: themeColors.primary, opacity: salvando.perfil ? 0.6 : 1 }}
                onClick={async () => {
                setSalvando(prev => ({ ...prev, perfil: true }));
                try {
                  await setDoc(doc(db, "configuracoes_loja", user.uid), {
                    nomeLoja: nomeLojaPerfil.trim(),
                    nomeFantasia: nomeFantasiaPerfil.trim(),
                    cpfCnpj: cpfCnpjPerfil.trim(),
                    telefone: telefonePerfil.trim(),
                    email: emailPerfil.trim(),
                    cep: cepPerfil.trim(),
                    endereco: enderecoPerfil.trim(),
                    cidade: cidadePerfil.trim(),
                    estado: estadoPerfil.trim(),
                    dadosBancarios: dadosBancariosPerfil.trim(),
                    logoUrl: logoLojaPerfil,
                    bannerUrl: bannerLojaUrl,
                    suporteZap: suporteZapPerfil.trim(),
                    themeColors: themeColors
                  }, { merge: true });
                  showToast("Perfil e dados da empresa salvos com sucesso! 🚀");
                  setActiveTab('inicio');
                } catch {
                  showToast("Erro ao salvar as configurações da empresa.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, perfil: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" >
                {salvando.perfil ? 'Salvando...' : 'Salvar Configurações da Marca'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'contratos' && (
          <div className="space-y-6 pt-2 w-full animate-fadeIn">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                  <FileText size={18}/> {novoContrato.id ? '✏️ Editando Contrato' : 'Gerar Novo Contrato'}
                </h2>

                {contratos.length > 0 && (
                  <button onClick={zerarTodosContratos} className="text-[10px] bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all">
                    Zerar Todos
                  </button>
                )}
              </div>

              {novoContrato.id && (
                <button onClick={() => setNovoContrato({ id: '', clienteId: '', tipoEvento: '', dataEvento: '', localEvento: '', valorTotal: '', clausulas: novoContrato.clausulas })} className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide mb-4 block">Cancelar Edição ❌</button>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Cliente (Contratante)</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border focus:border-purple-400" value={novoContrato.clienteId} onChange={e => setNovoContrato({...novoContrato, clienteId: e.target.value})}>
                    <option value="">👤 Selecionar Cliente Cadastrado...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cpfCnpj ? `(${c.cpfCnpj})` : ''}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Evento / Serviço</label>
                    <input placeholder="Ex: Aniversário / Sublimação" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={novoContrato.tipoEvento} onChange={e => setNovoContrato({...novoContrato, tipoEvento: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data do Evento</label>
                    <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={novoContrato.dataEvento} onChange={e => setNovoContrato({...novoContrato, dataEvento: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Local do Evento</label>
                    <input placeholder="Ex: Salão de Festas / Endereço" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={novoContrato.localEvento} onChange={e => setNovoContrato({...novoContrato, localEvento: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor Combinado (R$)</label>
                    <input type="number" step="0.01" placeholder="280.00" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border focus:border-purple-400" value={novoContrato.valorTotal} onChange={e => setNovoContrato({...novoContrato, valorTotal: e.target.value})} />
                  </div>
                </div>

                {templatesContrato.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Usar um template salvo</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border" onChange={e => {
                      const t = templatesContrato.find(item => item.id === e.target.value);
                      if (t) setNovoContrato(prev => ({ ...prev, clausulas: t.clausulas }));
                    }} value="">
                      <option value="">📄 Escolher template...</option>
                      {templatesContrato.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Cláusulas e Termos do Contrato</label>
                  <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-slate-800 outline-none border focus:border-purple-400 h-32 resize-none text-xs leading-relaxed" value={novoContrato.clausulas} onChange={e => setNovoContrato({...novoContrato, clausulas: e.target.value})} />
                  <button
                    type="button"
                    onClick={() => {
                      const nomeTemplate = window.prompt("Nome do template (ex: Sublimação, Festa Infantil...)");
                      if (!nomeTemplate) return;
                      addDoc(collection(db, "templates_contrato"), { nome: nomeTemplate, clausulas: novoContrato.clausulas, userId: user.uid })
                        .then(() => showToast("Template salvo! Já aparece no seletor pra próxima vez. 📄"))
                        .catch(() => showToast("Erro ao salvar template.", 'erro'));
                    }}
                    className="text-[10px] font-black uppercase text-purple-600 underline mt-2 block"
                  >
                    💾 Salvar cláusulas atuais como template
                  </button>
                </div>
              </div>

              <button
                disabled={!!salvando.contrato}
                style={{ backgroundColor: themeColors.primary, opacity: salvando.contrato ? 0.6 : 1 }}
                onClick={async () => {
                if (salvando.contrato) return;
                if (!novoContrato.clienteId || !novoContrato.valorTotal) return showToast("Selecione o cliente e o valor total!", 'erro');

                const dadosContrato = {
                  clienteId: novoContrato.clienteId,
                  tipoEvento: novoContrato.tipoEvento,
                  dataEvento: novoContrato.dataEvento,
                  localEvento: novoContrato.localEvento,
                  valorTotal: novoContrato.valorTotal,
                  clausulas: novoContrato.clausulas,
                  dataEmissao: new Date().toLocaleDateString('pt-BR'),
                  userId: user.uid
                };

                setSalvando(prev => ({ ...prev, contrato: true }));
                try {
                  if (novoContrato.id) {
                    await updateDoc(doc(db, "contratos", novoContrato.id), dadosContrato);
                    showToast("Contrato atualizado com sucesso!");
                    gerarPDFContrato({ id: novoContrato.id, ...dadosContrato });
                  } else {
                    const refCriado = await addDoc(collection(db, "contratos"), dadosContrato);
                    showToast("Contrato gerado com sucesso!");
                    gerarPDFContrato({ id: refCriado.id, ...dadosContrato });
                  }

                  setNovoContrato({ id: '', clienteId: '', tipoEvento: '', dataEvento: '', localEvento: '', valorTotal: '', clausulas: novoContrato.clausulas });
                } catch {
                  showToast("Erro ao salvar o contrato.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, contrato: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                {salvando.contrato ? 'Salvando...' : (novoContrato.id ? 'Salvar Alterações do Contrato' : 'Salvar e Gerar PDF do Contrato 📄')}
              </button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full border">
              <button onClick={() => setSubAbaContratos('ativos')} style={{ color: subAbaContratos === 'ativos' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaContratos === 'ativos' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>📄 Ativos</button>
              <button onClick={() => setSubAbaContratos('historico')} style={{ color: subAbaContratos === 'historico' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaContratos === 'historico' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>📜 Histórico</button>
            </div>

            {subAbaContratos === 'ativos' && (
              <div className="space-y-3 w-full animate-fadeIn">
                <div className="relative w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por cliente ou tipo de evento..."
                    value={pesquisaContratos}
                    onChange={e => setPesquisaContratos(e.target.value)}
                    className="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm"
                  />
                </div>

                <div className="space-y-3 w-full">
                  {contratosAtivos.map((c, idx) => {
                    const cli = clientes.find(item => item.id === c.clienteId);
                    return (
                  <div key={c.id || idx} className="bg-white p-5 rounded-[30px] border shadow-sm flex flex-col gap-3 w-full">
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <span style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase tracking-wider block">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{cli?.nome || 'Cliente não identificado'}</h4>
                        <p className="text-xs text-slate-500 mt-1">Evento: <strong>{c.tipoEvento || 'Não informado'}</strong> | Data: <strong>{c.dataEvento || 'A combinar'}</strong></p>
                        {c.assinaturaClienteUrl ? (
                          <span className="inline-block mt-2 text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">✍️ Assinado pelo cliente</span>
                        ) : (
                          <span className="inline-block mt-2 text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-black uppercase">⏳ Aguardando assinatura</span>
                        )}
                        {c.statusPagamento === 'pago_total' && (
                          <span className="inline-block mt-2 ml-1 text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">💰 Pago Total</span>
                        )}
                        {c.statusPagamento === 'sinal_recebido' && (
                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded mt-2">💰 Sinal: R$ {Number(c.valorSinal || 0).toFixed(2)} • Falta: R$ {(Number(c.valorTotal || 0) - Number(c.valorSinal || 0)).toFixed(2)}</p>
                        )}
                      </div>
                      <div style={{ color: themeColors.primary }} className="font-black text-lg">
                        R$ {Number(c.valorTotal || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 border-t pt-3 w-full flex-wrap">
                      {c.id && c.statusPagamento !== 'pago_total' && c.statusPagamento !== 'sinal_recebido' && (
                        <button onClick={() => { setMostrarModalSinal({ id: c.id, tipo: 'contrato', titulo: c.tipoEvento || 'Contrato', total: c.valorTotal }); setValorSinalInput(''); }} className="text-amber-600 px-3 py-2 bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 mr-auto">💰 Sinal</button>
                      )}
                      {c.id && c.statusPagamento !== 'pago_total' && (
                        <button onClick={() => confirmarRecebimentoContrato(c)} className="text-emerald-600 px-3 py-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 mr-auto"><CheckCircle size={16}/> Recebimento Total</button>
                      )}
                      <button onClick={() => setNovoContrato({ id: c.id || '', clienteId: c.clienteId, tipoEvento: c.tipoEvento || '', dataEvento: c.dataEvento || '', localEvento: c.localEvento || '', valorTotal: c.valorTotal || '', clausulas: c.clausulas || novoContrato.clausulas })} style={{ color: themeColors.primary }} className="p-2 bg-purple-50 rounded-xl"><Edit2 size={16}/></button>

                      <button onClick={() => setNovoContrato({ id: '', clienteId: c.clienteId, tipoEvento: `${c.tipoEvento} (Cópia)`, dataEvento: c.dataEvento || '', localEvento: c.localEvento || '', valorTotal: c.valorTotal || '', clausulas: c.clausulas || novoContrato.clausulas })} title="Duplicar Contrato" className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Copy size={16}/></button>

                      {c.id && !c.assinaturaClienteUrl && (
                        <button onClick={() => copiarLinkAssinatura(c.id)} title="Copiar link de assinatura" className="p-2 bg-amber-50 text-amber-600 rounded-xl">✍️</button>
                      )}

                      <button onClick={() => gerarPDFContrato(c)} style={{ color: themeColors.secondary }} className="p-2 bg-orange-50 rounded-xl"><Printer size={16}/></button>

                      <button onClick={() => enviarContratoWhatsapp(c)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><MessageCircle size={16}/></button>

                      <button onClick={() => excluirContratoInteligente(c)} className="p-2 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              })}

              {contratosAtivos.length === 0 && (
                <p className="text-center font-bold text-xs text-slate-400 py-8 italic">
                  {contratos.length === 0 ? 'Nenhum contrato gerado ainda. 📄' : 'Nenhum contrato ativo encontrado. 🔍'}
                </p>
              )}
                </div>
              </div>
            )}

            {subAbaContratos === 'historico' && (
              <div className="space-y-4 w-full animate-fadeIn">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mês de Referência</label>
                    <select className="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" value={mesFiltroContratosHist} onChange={e => setMesFiltroContratosHist(e.target.value)}>
                      <option value="Todos">📅 Todos os Meses</option>
                      <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
                      <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
                      <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
                      <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Ano de Referência</label>
                    <select className="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" value={anoFiltroContratosHist} onChange={e => setAnoFiltroContratosHist(e.target.value)}>
                      <option value="Todos">🗓️ Todos os Anos</option>
                      <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {historicoContratosFiltradoPorData.map(item => {
                    const isExpanded = mesExpandido === `contrato_${item.chave}`;
                    return (
                      <div key={item.chave} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                        <div onClick={() => setMesExpandido(isExpanded ? null : `contrato_${item.chave}`)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase tracking-wide">{item.mesAnoTexto}</p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.qtd} {item.qtd === 1 ? 'contrato recebido' : 'contratos recebidos'} • Clique para ver 🔍</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Total Recebido</span>
                              <span style={{ color: themeColors.primary }} className="font-black text-lg">R$ {item.total.toFixed(2)}</span>
                            </div>
                            <div style={{ color: themeColors.primary }} className="p-1 bg-white rounded-xl border">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="bg-white p-4 border-t border-slate-200 space-y-2.5 animate-fadeIn">
                            {item.itens.map((c: any) => {
                              const cli = clientes.find(cl => cl.id === c.clienteId);
                              return (
                                <div key={c.id} className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-bold text-slate-800">{cli?.nome || 'Cliente não informado'}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.tipoEvento || 'Serviço'} • {c.dataEvento || 'Sem data'}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-black text-slate-700">R$ {Number(c.valorTotal || 0).toFixed(2)}</span>
                                    <button onClick={() => gerarPDFContrato(c)} style={{ color: themeColors.secondary }}><Printer size={16}/></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {historicoContratosFiltradoPorData.length === 0 && (
                    <p className="text-center font-bold text-xs text-slate-400 py-8 italic">Nenhum contrato com recebimento total confirmado ainda. 📜</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anotacoes' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full border">
              <button onClick={() => setSubAbaAnotacoes('agenda')} style={{ color: subAbaAnotacoes === 'agenda' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaAnotacoes === 'agenda' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>📅 Agenda</button>
              <button onClick={() => setSubAbaAnotacoes('kanban')} style={{ color: subAbaAnotacoes === 'kanban' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaAnotacoes === 'kanban' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>🗂️ Kanban</button>
            </div>

            {subAbaAnotacoes === 'agenda' && (
              <div className="space-y-4 animate-fadeIn">
                {formularioTarefaKanban}

                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">Lista Geral de Pendências</h3>
                <div className="grid grid-cols-1 gap-3 w-full">
                  {anotacoes.map(item => {
                    const todasAsDatas = [item.dataPrazo, ...(item.datasExtras || [])].filter(Boolean);
                    const datasFormatadas = todasAsDatas.map((d: string) => d.split('-').reverse().slice(0, 2).join('/')).join(', ');
                    return (
                      <div key={item.id} className={`bg-white p-5 rounded-3xl border shadow-sm w-full flex flex-col gap-2 relative ${item.concluido ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button onClick={() => toggleStatusAnotacao(item.id, item.concluido)} style={{ color: themeColors.primary }} className="mt-0.5 shrink-0">
                              {item.concluido ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-black text-slate-800 text-base break-words ${item.concluido ? 'line-through text-slate-400' : ''}`}>{item.titulo}</h4>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span style={{ color: themeColors.primary }} className="text-[9px] bg-purple-50 px-2 py-0.5 rounded font-black uppercase">🗓️ {datasFormatadas}</span>
                                {item.apareceNoKanban && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">🗂️ No Kanban</span>}
                                {item.concluido && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">Concluído</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <button onClick={() => { setNovaAnotacao({ id: item.id, titulo: item.titulo, conteudo: item.conteudo, dataPrazo: item.dataPrazo || new Date().toISOString().split('T')[0], prioridade: item.prioridade || 'media' }); setDatasExtras(item.datasExtras || []); }} className="text-orange-400 p-2 hover:bg-orange-50 rounded-xl"><Edit2 size={16}/></button>
                            <button onClick={() => confirmarExcluir('anotacao', item.id)} className="text-red-200 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                          </div>
                        </div>
                        {item.conteudo && <p className="text-slate-600 text-xs font-semibold bg-slate-50 p-3 rounded-2xl border whitespace-pre-line leading-relaxed">{item.conteudo}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {subAbaAnotacoes === 'kanban' && (
              <div className="space-y-4 animate-fadeIn">
                {formularioTarefaKanban}

                <div className="flex gap-3 overflow-x-auto pb-2 w-full snap-x">
                  {colunasKanban.map((coluna, idx) => {
                    const itensDaColuna = itensDoKanban.filter(item => item.statusKanban === coluna.id);
                    const estaSobreEssaColuna = colunaAlvoOver === coluna.id;
                    return (
                      <div
                        key={coluna.id}
                        onDragOver={(e) => { e.preventDefault(); setColunaAlvoOver(coluna.id); }}
                        onDragLeave={() => setColunaAlvoOver(prev => prev === coluna.id ? null : prev)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (itemArrastandoId) {
                            const itemAtual = itensDoKanban.find(x => x.id === itemArrastandoId);
                            if (itemAtual) moverStatusKanban(itemArrastandoId, itemAtual.tipo, coluna.id);
                          }
                          setItemArrastandoId(null);
                          setColunaAlvoOver(null);
                        }}
                        style={estaSobreEssaColuna ? { borderColor: coluna.cor, boxShadow: `0 0 0 2px ${coluna.cor}` } : undefined}
                        className="bg-white rounded-3xl border shadow-sm p-3 min-w-[260px] w-[260px] shrink-0 snap-start transition-all"
                      >
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span style={{ color: coluna.cor }} className="font-black text-xs uppercase tracking-wider">{coluna.emoji} {coluna.nome}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{itensDaColuna.length}</span>
                        </div>
                        <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                          {itensDaColuna.map(item => {
                            const datasKanban = [item.dataPrazo, ...(item.datasExtras || [])].filter(Boolean);
                            const datasKanbanTxt = datasKanban.map((d: string) => d.split('-').reverse().join('/')).join(', ');
                            const dias = item.dataPrazo ? diasRestantes(item.dataPrazo) : null;
                            const perto = dias !== null && dias <= 2 && dias >= 0;
                            const atrasado = dias !== null && dias < 0;
                            const coresPrioridade: any = { baixa: '#94a3b8', media: '#f59e0b', alta: '#ef4444' };
                            return (
                            <div
                              key={`${item.tipo}-${item.id}`}
                              draggable
                              onDragStart={() => setItemArrastandoId(item.id)}
                              onDragEnd={() => { setItemArrastandoId(null); setColunaAlvoOver(null); }}
                              style={{ borderLeftWidth: 4, borderLeftColor: coresPrioridade[item.prioridade || 'media'] }}
                              className={`bg-slate-50 border border-slate-100 rounded-2xl p-3 cursor-grab active:cursor-grabbing transition-opacity ${itemArrastandoId === item.id ? 'opacity-30' : 'opacity-100'} ${(perto || atrasado) ? 'ring-1 ring-red-300' : ''}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                {item.tipo === 'pedido' && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase">💰 Pedido</span>}
                              </div>
                              <p className="font-bold text-slate-800 text-xs break-words">{item.titulo}</p>
                              {datasKanbanTxt && (
                                <p className={`text-[10px] font-semibold mt-1 ${(perto || atrasado) ? 'text-red-500' : 'text-slate-400'}`}>
                                  🗓️ {atrasado ? 'Atrasado' : dias === 0 ? 'Vence hoje' : datasKanbanTxt}
                                </p>
                              )}
                              {item.conteudo && <p className="text-[10px] text-slate-500 mt-1">{item.conteudo}</p>}
                              <div className="flex justify-between items-center mt-2 gap-1">
                                {idx > 0 ? (
                                  <button onClick={() => moverStatusKanban(item.id, item.tipo, colunasKanban[idx - 1].id)} className="text-[9px] font-black uppercase bg-white border px-2 py-1 rounded-lg text-slate-500">◀ Voltar</button>
                                ) : <span />}
                                {idx < colunasKanban.length - 1 ? (
                                  <button onClick={() => moverStatusKanban(item.id, item.tipo, colunasKanban[idx + 1].id)} style={{ backgroundColor: coluna.cor }} className="text-[9px] font-black uppercase text-white px-2 py-1 rounded-lg ml-auto">Avançar ▶</button>
                                ) : item.tipo === 'pedido' ? (
                                  <button onClick={() => { const p = pedidos.find(x => x.id === item.id); if (p) confirmarVendaPedido(p); }} className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-1 rounded-lg ml-auto">✅ Confirmar Venda</button>
                                ) : (
                                  <button onClick={() => confirmarExcluir('anotacao', item.id)} className="text-[9px] font-black uppercase text-red-400 px-2 py-1 rounded-lg ml-auto">Remover</button>
                                )}
                              </div>
                            </div>
                            );
                          })}
                          {itensDaColuna.length === 0 && (
                            <p className="text-center text-[10px] text-slate-300 font-bold py-6 italic">Arraste um card pra cá</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full border flex-wrap">
              <button onClick={() => setSubAbaFinanceiro('geral')} style={{ color: subAbaFinanceiro === 'geral' ? themeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'geral' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Geral</button>
              <button onClick={() => setSubAbaFinanceiro('impressao')} style={{ color: subAbaFinanceiro === 'impressao' ? themeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'impressao' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Impressão 🖨️</button>
              <button onClick={() => setSubAbaFinanceiro('equipamentos')} style={{ color: subAbaFinanceiro === 'equipamentos' ? themeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'equipamentos' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Máquinas</button>
            </div>

            {subAbaFinanceiro === 'geral' && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full animate-fadeIn">
                <h2 style={{ color: themeColors.primary }} className="font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Calculator size={18}/> Estrutura de Custos Fixos (Opcional)</h2>
                <p className="text-slate-400 text-[11px] mb-4">Insira ou edite seus valores aqui. Eles ficam salvos e você pode alterá-los quando quiser.</p>

                <label style={{ color: themeColors.primary }} className="text-[10px] font-bold outline-none uppercase ml-1">Salário Mensal Pretendido</label>
                <input type="number" style={{ color: themeColors.primary }} className="w-full p-4 bg-slate-50 rounded-2xl mb-3 font-bold outline-none" value={financasFixo.salario} onChange={e => setFinancasFixo({...financasFixo, salario: e.target.value})} />

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

                <div className="w-full">
                  <h3 style={{ color: themeColors.primary }} className="font-bold text-xs uppercase tracking-wider mb-2 mt-4">Sua Carga Horária</h3>
                  <div className="grid grid-cols-2 gap-3 mb-5 w-full">
                    <div>
                      <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Dias de Trabalho no Mês</label>
                      <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.diasTrabalho} onChange={e => setFinancasFixo({...financasFixo, diasTrabalho: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Horas de Trabalho por Dia</label>
                      <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.horasDia} onChange={e => setFinancasFixo({...financasFixo, horasDia: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="mt-1 mb-5">
                  <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1">Margem de Lucro Mínima Aceitável (%)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={financasFixo.margemMinima} onChange={e => setFinancasFixo({...financasFixo, margemMinima: e.target.value})} />
                  <p className="text-[10px] text-slate-400 mt-1">Você recebe um alerta ao orçar abaixo desse percentual.</p>
                </div>

                <button
                  disabled={!!salvando.financeiroGeral}
                  style={{ backgroundColor: themeColors.primary, opacity: salvando.financeiroGeral ? 0.6 : 1 }}
                  onClick={async () => {
                  setSalvando(prev => ({ ...prev, financeiroGeral: true }));
                  try {
                    await setDoc(doc(db, "configuracoes_financeiras", user.uid), financasFixo, { merge: true });

                    const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                    const intentCustos = Number(financasFixo.salario || 0) + Number(financasFixo.aluguel || 0) + Number(financasFixo.internet || 0) + Number(financasFixo.luz || 0) + Number(financasFixo.outros || 0);
                    if (intentCustos > 0) setVHora((intentCustos / totalHoras).toFixed(2));

                    showToast("Custos salvos com sucesso! O valor sugerido para a hora foi atualizado na calculadora. 🎉");
                  } catch {
                    showToast("Erro ao salvar custos.", 'erro');
                  } finally {
                    setSalvando(prev => ({ ...prev, financeiroGeral: false }));
                  }
                }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                  {salvando.financeiroGeral ? 'Salvando...' : 'Salvar Configurações Fixas'}
                </button>
              </div>
            )}

            {subAbaFinanceiro === 'impressao' && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full animate-fadeIn space-y-4">
                <div>
                  <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><Printer size={18}/> Calculadora de Impressão</h2>
                  <p className="text-slate-400 text-[11px] mt-1">Configure o gasto real por página para aplicar automaticamente em seus novos orçamentos.</p>
                </div>

                <div className="form-group flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 mb-1">Preço da tinta (R$)</label>
                  <input type="number" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none text-sm font-bold border focus:border-purple-500" value={precoTinta} onChange={e => setPrecoTinta(e.target.value)} />
                </div>

                <div className="form-group flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 mb-1">Unidade da tinta</label>
                  <select className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none text-xs font-bold border focus:border-purple-500" value={unidadeTinta} onChange={e => setUnidadeTinta(e.target.value)}>
                    <option value="Garrafinha">Garrafinha</option>
                    <option value="Cartucho">Cartucho</option>
                    <option value="Litro">Litro</option>
                  </select>
                </div>

                <div className="form-group flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 mb-1">Quantidade de cores</label>
                  <input type="number" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none text-sm font-bold border focus:border-purple-500" value={qtdCores} onChange={e => setQtdCores(e.target.value)} />
                  <span className="text-[10px] text-slate-400 mt-1">Exemplo: 4 cores (preto, ciano, magenta, amarelo)</span>
                </div>

                <div className="form-group flex flex-col">
                  <label className="text-[11px] font-bold text-slate-500 mb-1">Páginas por conjunto completo</label>
                  <input type="number" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none text-sm font-bold border focus:border-purple-500" value={paginasConjunto} onChange={e => setPaginasConjunto(e.target.value)} />
                  <span className="text-[10px] text-slate-400 mt-1">Quantas páginas consegue imprimir com todas as cores cheias</span>
                </div>

                <div className="bg-purple-50 rounded-2xl p-4 flex justify-between items-center border border-purple-100">
                  <div>
                    <h3 style={{ color: themeColors.primary }} className="text-[11px] font-black tracking-wider uppercase">CUSTO TOTAL DAS TINTAS</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{qtdCores} cores × {formatarMoedaLocal(Number(precoTinta) || 0)}</p>
                  </div>
                  <div style={{ color: themeColors.secondary }} className="text-xl font-black">
                    {formatarMoedaLocal((Number(qtdCores) || 0) * (Number(precoTinta) || 0))}
                  </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-5 text-center border border-orange-100">
                  <h3 style={{ color: themeColors.secondary }} className="text-[11px] font-black tracking-wider uppercase">CUSTO POR IMPRESSÃO</h3>
                  <div style={{ color: themeColors.primary }} className="text-3xl font-black my-1">
                    {formatarMoedaLocal(custoPorPaginaCalculado)}
                  </div>
                  <p className="text-[10px] text-purple-500 font-medium">Por página impressa</p>
                </div>

                <h3 className="text-xs font-black text-slate-700 tracking-wider">Exemplos de quantidade:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-800">10 páginas</div>
                    <div style={{ color: themeColors.primary }} className="text-xs font-semibold mt-0.5">{formatarMoedaLocal(custoPorPaginaCalculado * 10)}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-800">50 páginas</div>
                    <div style={{ color: themeColors.primary }} className="text-xs font-semibold mt-0.5">{formatarMoedaLocal(custoPorPaginaCalculado * 50)}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-800">100 páginas</div>
                    <div style={{ color: themeColors.primary }} className="text-xs font-semibold mt-0.5">{formatarMoedaLocal(custoPorPaginaCalculado * 100)}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-800">500 páginas</div>
                    <div style={{ color: themeColors.primary }} className="text-xs font-semibold mt-0.5">{formatarMoedaLocal(custoPorPaginaCalculado * 500)}</div>
                  </div>
                </div>

                <button
                  disabled={!!salvando.impressao}
                  style={{ backgroundColor: themeColors.secondary, opacity: salvando.impressao ? 0.6 : 1 }}
                  onClick={async () => {
                  setSalvando(prev => ({ ...prev, impressao: true }));
                  try {
                    await setDoc(doc(db, "configuracoes_financeiras", user.uid), {
                      precoTinta,
                      unidadeTinta,
                      qtdCores,
                      paginasConjunto,
                      custoPorPaginaCalculado: custoPorPaginaCalculado.toFixed(4)
                    }, { merge: true });

                    setCustos(prev => ({ ...prev, impressao: custoPorPaginaCalculado.toFixed(2) }));
                    showToast("Subcategoria de Impressão gravada! Taxa vinculada com sucesso à calculadora de orçamento. 🚀");
                  } catch {
                    showToast("Erro ao salvar dados de impressão.", 'erro');
                  } finally {
                    setSalvando(prev => ({ ...prev, impressao: false }));
                  }
                }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md mt-4 transition-colors">
                  {salvando.impressao ? 'Salvando...' : 'Salvar Subcategoria de Custo'}
                </button>
              </div>
            )}

            {subAbaFinanceiro === 'equipamentos' && (
              <div className="space-y-6 animate-fadeIn w-full">
                <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
                  <h2 style={{ color: themeColors.primary }} className="font-bold mb-2 flex items-center gap-2 uppercase text-xs tracking-widest"><Package size={18}/> Minhas Ferramentas de Trabalho (Depreciação)</h2>
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

                  <button
                    disabled={!!salvando.equipamento}
                    style={{ backgroundColor: themeColors.secondary, opacity: salvando.equipamento ? 0.6 : 1 }}
                    onClick={async () => {
                    if (salvando.equipamento) return;
                    if(!novoEquipamento.nome || !novoEquipamento.valorPago) return showToast("Preencha o nome e o preço do equipamento!", 'erro');
                    setSalvando(prev => ({ ...prev, equipamento: true }));
                    try {
                      const d = { nome: novoEquipamento.nome, valorPago: Number(novoEquipamento.valorPago), durabilidadeAnos: Number(novoEquipamento.durabilidadeAnos), userId: user.uid };
                      if (novoEquipamento.id) await updateDoc(doc(db, "equipamentos", novoEquipamento.id), d);
                      else await addDoc(collection(db, "equipamentos"), d);
                      setNovoEquipamento({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });
                      showToast("Equipamento salvo!");
                    } catch {
                      showToast("Erro ao salvar equipamento.", 'erro');
                    } finally {
                      setSalvando(prev => ({ ...prev, equipamento: false }));
                    }
                  }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                    {salvando.equipamento ? 'Salvando...' : 'Salvar Equipamento'}
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
                          <p className="text-xs text-slate-400 mt-1">Desgaste: <span style={{ color: themeColors.primary }} className="font-bold">R$ {isNaN(descHora) ? "0.00" : descHora.toFixed(2)} por hora de uso</span></p>
                        </div>
                        <button onClick={() => confirmarExcluir('equipamento', eq.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'balcao' && (
          <div className="space-y-4 pt-2 w-full">
            <div style={{ backgroundColor: themeColors.primary }} className="p-5 rounded-[35px] text-white shadow-md border border-purple-900 space-y-3.5 w-full">
              <div className="w-full">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-200 flex items-center gap-1.5"><Share2 size={14}/> Link da Vitrine de Clientes</h3>
                <div className="mt-1.5 bg-purple-900/40 p-3 rounded-xl text-[11px] font-mono select-all break-all border border-purple-500/30 bg-black/10 w-full font-bold">
                  {linkDoCatalogoDestaCliente}
                </div>
                <div onClick={copiarLinkCatalogo} style={{ color: themeColors.primary }} className="mt-2 w-full bg-white font-bold p-2.5 rounded-xl text-xs uppercase shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                  <Copy size={13}/> Copiar Link da Vitrine
                </div>
              </div>

              <div className="border-t border-purple-500/30 pt-2.5 w-full">
                <label className="text-[9px] font-black uppercase text-purple-200 block mb-1">📱 Seu WhatsApp de Vendas (Com DDD)</label>
                <div className="flex gap-2 w-full">
                  <input placeholder="Ex: 21983858055" className="flex-1 p-2.5 bg-black/20 text-white rounded-xl text-xs font-bold border border-purple-500/30 outline-none" value={zapDonaConta} onChange={e => setZapDonaConta(e.target.value)} />
                  <button
                    disabled={!!salvando.zap}
                    style={{ backgroundColor: themeColors.secondary, opacity: salvando.zap ? 0.6 : 1 }}
                    onClick={async () => {
                    if (salvando.zap) return;
                    if(!zapDonaConta.trim()) return showToast("Digite o número!", 'erro');
                    setSalvando(prev => ({ ...prev, zap: true }));
                    try { await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true }); showToast("WhatsApp salvo!"); }
                    catch { showToast("Erro ao salvar.", 'erro'); }
                    finally { setSalvando(prev => ({ ...prev, zap: false })); }
                  }} className="text-white text-xs font-black uppercase px-4 rounded-xl shadow hover:opacity-90">{salvando.zap ? '...' : 'Salvar'}</button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-slate-900 to-purple-950 p-6 rounded-[35px] shadow-xl border border-slate-800 text-white w-full space-y-4">
              <div>
                <h2 style={{ color: themeColors.secondary }} className="font-black flex items-center gap-2 uppercase text-xs tracking-wider">
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
                <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1 block mb-1">Prazo de Entrega do Combo</label>
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
                        <button onClick={() => setCarrinhoInterno({...carrinhoInterno, [p.id]: qtdInterna + 1})} style={{ backgroundColor: themeColors.primary }} className="w-7 h-7 rounded-lg font-black text-white">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                disabled={!!salvando.balcao}
                style={{ backgroundColor: themeColors.secondary, opacity: salvando.balcao ? 0.6 : 1 }}
                onClick={lancarVendaBalcaoInterno} className="w-full hover:opacity-90 text-white p-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95">
                {salvando.balcao ? 'Lançando...' : 'Lançar Combo no Histórico 🚀'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                <BookOpen size={18}/> {novoProdCatalogo.id ? '✏️ Editando Item do Catálogo' : 'Novo Item de Venda Fixa'}
              </h2>

              {novoProdCatalogo.id && (
                <button onClick={() => setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [], materiaisAssociados: [], imagens: [], descricao: '', variacoes: [], personalizavel: false, personalizacaoPlaceholder: 'Ex: nome, cor, tema, data da entrega...' })} className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide mb-4 active:scale-95 transition-all block">Cancelar Modo Edição ❌</button>
              )}

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Galeria de Fotos (até 6)</label>
              <div className="flex gap-2 flex-wrap mb-5 w-full">
                {novoProdCatalogo.imagens.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border">
                    <img src={img} className="w-full h-full object-cover" />
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] font-black text-center py-0.5">CAPA</span>}
                    <button onClick={() => removerImagemGaleria(idx)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]"><X size={10}/></button>
                  </div>
                ))}
                {novoProdCatalogo.imagens.length < 6 && (
                  <label className="cursor-pointer w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 transition-colors">
                    <Camera size={18} />
                    <span className="text-[8px] font-bold uppercase mt-1">{subindoImagem ? '...' : '+ Foto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImagemGaleria} disabled={subindoImagem} />
                  </label>
                )}
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Produto</label>
              <input placeholder="Ex: Caneca Alça Coração" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-medium text-sm border focus:border-purple-400" value={novoProdCatalogo.nome} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, nome: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Base de Venda (R$)</label>
              <input type="number" placeholder="Ex: 35.00" style={{ color: themeColors.primary }} className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold border focus:border-purple-400" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição do Produto (opcional)</label>
              <textarea placeholder="Especificações, tamanho, material, prazo de produção..." className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none text-xs font-medium border focus:border-purple-400 resize-none h-20" value={novoProdCatalogo.descricao} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, descricao: e.target.value})} />

              <div className="mb-5 w-full bg-purple-50/50 border border-purple-100 rounded-2xl p-4">
                <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">Variações do Produto (opcional)</label>
                <p className="text-[10px] text-slate-400 mb-3">Ex: "Encadernação" com opções Wire-o / Espiral / Disco +R$49. O cliente escolhe uma opção de cada grupo na vitrine.</p>

                {novoProdCatalogo.variacoes.map(grupo => (
                  <div key={grupo.id} className="bg-white rounded-2xl p-3 border mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-xs text-slate-700 uppercase">{grupo.nome}</span>
                      <button onClick={() => removerGrupoVariacao(grupo.id)} className="text-red-400"><Trash2 size={14}/></button>
                    </div>
                    <div className="space-y-1.5">
                      {grupo.opcoes.map(opcao => (
                        <div key={opcao.id} className="flex gap-1.5 items-center">
                          <input placeholder="Ex: Wire-o" className="flex-1 p-2 bg-slate-50 rounded-lg text-xs font-medium outline-none border" value={opcao.label} onChange={e => atualizarOpcaoVariacao(grupo.id, opcao.id, 'label', e.target.value)} />
                          <input type="number" placeholder="+R$0" className="w-20 p-2 bg-slate-50 rounded-lg text-xs font-bold outline-none border text-center" value={opcao.precoAdicional} onChange={e => atualizarOpcaoVariacao(grupo.id, opcao.id, 'precoAdicional', e.target.value)} />
                          <button onClick={() => removerOpcaoVariacao(grupo.id, opcao.id)} className="text-red-300"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => adicionarOpcaoVariacao(grupo.id)} className="text-[10px] font-black uppercase text-purple-600 underline mt-2">+ Adicionar opção</button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input placeholder="Nome do grupo (ex: Encadernação)" className="flex-1 p-2.5 bg-white rounded-xl text-xs font-bold outline-none border" value={novoGrupoVariacaoNome} onChange={e => setNovoGrupoVariacaoNome(e.target.value)} />
                  <button type="button" onClick={adicionarGrupoVariacao} style={{ backgroundColor: themeColors.primary }} className="text-white px-4 rounded-xl text-xs font-black">+ Grupo</button>
                </div>
              </div>

              <div className="mb-5 w-full bg-slate-50 border rounded-2xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={novoProdCatalogo.personalizavel} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, personalizavel: e.target.checked})} className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-700">Permitir personalização (campo de texto livre pro cliente)</span>
                </label>
                {novoProdCatalogo.personalizavel && (
                  <input placeholder="Texto de exemplo do campo (ex: nome, cor, tema...)" className="w-full p-3 bg-white rounded-xl mt-2 outline-none text-xs font-medium border" value={novoProdCatalogo.personalizacaoPlaceholder} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, personalizacaoPlaceholder: e.target.value})} />
                )}
              </div>

              <div className="mb-5 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais usados (opcional, pra baixa automática de estoque no Balcão)</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-2 block border" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setNovoProdCatalogo(prev => ({ ...prev, materiaisAssociados: [...(prev.materiaisAssociados || []), { id: m.id, nome: m.nome, qtdUsada: 1 }] }));
                }} value="">
                  <option value="">+ Adicionar Material...</option>
                  {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <div className="space-y-2 w-full">
                  {(novoProdCatalogo.materiaisAssociados || []).map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100 text-purple-700 font-bold text-xs w-full">
                      <span>{m.nome}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-16 bg-white rounded-lg p-1 text-center" value={m.qtdUsada} onChange={e => {
                          const nova = [...(novoProdCatalogo.materiaisAssociados || [])];
                          nova[i] = { ...nova[i], qtdUsada: Number(e.target.value) };
                          setNovoProdCatalogo(prev => ({ ...prev, materiaisAssociados: nova }));
                        }} />
                        <button onClick={() => setNovoProdCatalogo(prev => ({ ...prev, materiaisAssociados: (prev.materiaisAssociados || []).filter((_, idx) => idx !== i) }))}><X size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5 w-full">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block">Categorias do Produto (Selecione Múltiplas)</label>
                  <button type="button" onClick={() => limparCategoriasDuplicadas('produtos')} className="text-[9px] font-black uppercase text-red-400 underline shrink-0 ml-2">Limpar duplicadas</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasProd.map(cat => {
                    const marcado = novoProdCatalogo.categorias?.includes(cat.nome) || false;
                    return (
                      <div key={cat.id} className="relative">
                        <button type="button" onClick={() => toggleCategoriaNoProduto(cat.nome)} style={{ backgroundColor: marcado ? themeColors.primary : undefined, borderColor: marcado ? themeColors.primary : undefined }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                          {cat.nome}
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); excluirCategoria('produtos', cat); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] leading-none shadow">×</button>
                      </div>
                    );
                  })}
                </div>

                {!mostrarInputNovaCatProd ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatProd(true)} style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Nova Categoria</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🎨 Brindes Luxo" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaProd} onChange={e => setInputNovaCategoriaProd(e.target.value)} />
                    <button type="button" onClick={async () => {
                      if(!inputNovaCategoriaProd.trim()) return setMostrarInputNovaCatProd(false);
                      await addDoc(collection(db, "categorias_produtos"), { nome: inputNovaCategoriaProd.trim(), userId: user.uid });
                      setInputNovaCategoriaProd(''); setMostrarInputNovaCatProd(false);
                    }} style={{ backgroundColor: themeColors.primary }} className="text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button
                disabled={!!salvando.produto}
                style={{ backgroundColor: themeColors.primary, opacity: salvando.produto ? 0.6 : 1 }}
                onClick={async () => {
                if (salvando.produto) return;
                if(!novoProdCatalogo.nome || !novoProdCatalogo.precoVenda) return showToast("Preencha o nome e o preço!", 'erro');
                setSalvando(prev => ({ ...prev, produto: true }));
                try {
                  const d = {
                    nome: novoProdCatalogo.nome,
                    precoVenda: Number(novoProdCatalogo.precoVenda),
                    urlImagem: novoProdCatalogo.urlImagem || '',
                    imagens: novoProdCatalogo.imagens || [],
                    descricao: novoProdCatalogo.descricao || '',
                    variacoes: (novoProdCatalogo.variacoes || []).map(g => ({ ...g, opcoes: g.opcoes.map(o => ({ ...o, precoAdicional: Number(o.precoAdicional || 0) })) })),
                    personalizavel: !!novoProdCatalogo.personalizavel,
                    personalizacaoPlaceholder: novoProdCatalogo.personalizacaoPlaceholder || '',
                    categorias: novoProdCatalogo.categorias || [],
                    materiaisAssociados: novoProdCatalogo.materiaisAssociados || [],
                    userId: user.uid
                  };
                  if (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d);
                  else await addDoc(collection(db, "produtos"), d);
                  setNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [], materiaisAssociados: [], imagens: [], descricao: '', variacoes: [], personalizavel: false, personalizacaoPlaceholder: 'Ex: nome, cor, tema, data da entrega...' });
                  showToast("Produto salvo no catálogo!");
                } catch {
                  showToast("Erro ao salvar produto.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, produto: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" >
                {salvando.produto ? 'Salvando...' : (novoProdCatalogo.id ? 'Salvar Alterações 📝' : 'Salvar no Catálogo 📖')}
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
                    <p style={{ color: themeColors.primary }} className="font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p>
                    {p.categorias && p.categorias.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {p.categorias.map((c: string, i: number) => (
                          <span key={i} className="text-[8px] bg-slate-100 font-bold text-slate-500 px-1.5 py-0.5 rounded uppercase">{c.split(' ')[0]}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={async () => {
                      if (historicoPrecoAberto === p.id) { setHistoricoPrecoAberto(null); return; }
                      try {
                        const snap = await getDocs(collection(db, "produtos", p.id, "historicoPrecos"));
                        const dados = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.data?.seconds || 0) - (a.data?.seconds || 0));
                        setHistoricoPrecoDados(dados);
                        setHistoricoPrecoAberto(p.id);
                      } catch {
                        showToast("Erro ao carregar histórico.", 'erro');
                      }
                    }} className="text-[10px] text-slate-400 font-bold underline mt-1">Ver histórico de preços</button>
                    {historicoPrecoAberto === p.id && (
                      <div className="mt-2 bg-slate-50 rounded-xl p-2 space-y-1">
                        {historicoPrecoDados.length === 0 && <p className="text-[10px] text-slate-400 italic">Nenhum preço registrado ainda.</p>}
                        {historicoPrecoDados.map((h: any) => (
                          <div key={h.id} className="flex justify-between text-[10px] font-semibold text-slate-600">
                            <span>{h.data?.toDate ? h.data.toDate().toLocaleDateString('pt-BR') : '—'}</span>
                            <span>R$ {Number(h.preco).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} style={{ backgroundColor: themeColors.secondary }} className="text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">Vender 🛍️</button>
                    <button onClick={() => setNovoProdCatalogo({ id: p.id, nome: p.nome, precoVenda: String(p.precoVenda), urlImagem: p.urlImagem || '', categorias: p.categorias || [], materiaisAssociados: p.materiaisAssociados || [], imagens: p.imagens || (p.urlImagem ? [p.urlImagem] : []), descricao: p.descricao || '', variacoes: (p.variacoes || []).map((g: any) => ({ ...g, opcoes: g.opcoes.map((o: any) => ({ ...o, precoAdicional: String(o.precoAdicional || 0) })) })), personalizavel: !!p.personalizavel, personalizacaoPlaceholder: p.personalizacaoPlaceholder || 'Ex: nome, cor, tema, data da entrega...' })} className="text-orange-400 hover:bg-orange-50 p-1.5 rounded-xl"><Edit2 size={15}/></button>
                    <button onClick={() => confirmarExcluir('produto', p.id)} className="text-red-200 p-1.5"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'criar' && renderCalculadoraForm()}

        {activeTab === 'fornecedores' && (
          <div className="space-y-4 pt-2 w-full animate-fadeIn">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><Globe size={20}/> Cadastrar Novo Fornecedor</h2>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome da Empresa / Distribuidora</label>
              <input placeholder="Ex: Pampa Papéis" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.nome} onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Site Oficial (Link)</label>
              <input placeholder="Ex: www.pampapapeis.com.br" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.site} onChange={e => setNovoFornecedor({...novoFornecedor, site: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp com DDD</label>
              <input placeholder="Ex: 11999999999" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoFornecedor.whatsapp} onChange={e => setNovoFornecedor({...novoFornecedor, whatsapp: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço Físico (Cidade/Estado)</label>
              <textarea placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none border focus:border-purple-400 resize-none h-16 font-medium text-sm" value={novoFornecedor.endereco} onChange={e => setNovoFornecedor({...novoFornecedor, endereco: e.target.value})} />

              <div className="mb-6 w-full">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block">Categorias do Fornecedor</label>
                  <button type="button" onClick={() => limparCategoriasDuplicadas('fornecedores')} className="text-[9px] font-black uppercase text-red-400 underline shrink-0 ml-2">Limpar duplicadas</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasForn.map(cat => {
                    const marcado = novoFornecedor.categorias?.includes(cat.nome) || false;
                    return (
                      <div key={cat.id} className="relative">
                        <button type="button" onClick={() => toggleCategoriaNoFornecedor(cat.nome)} style={{ backgroundColor: marcado ? themeColors.primary : undefined, borderColor: marcado ? themeColors.primary : undefined }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                          {cat.nome}
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); excluirCategoria('fornecedores', cat); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] leading-none shadow">×</button>
                      </div>
                    );
                  })}
                </div>

                {!mostrarInputNovaCatForn ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatForn(true)} style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Categoria de Compras</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🧵 Fitas e Cordões" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaForn} onChange={e => setInputNovaCategoriaForn(e.target.value)} />
                    <button type="button" onClick={async () => {
                      if(!inputNovaCategoriaForn.trim()) return setMostrarInputNovaCatForn(false);
                      await addDoc(collection(db, "categorias_fornecedores"), { nome: inputNovaCategoriaForn.trim(), userId: user.uid });
                      setInputNovaCategoriaForn(''); setMostrarInputNovaCatForn(false);
                    }} style={{ backgroundColor: themeColors.primary }} className="text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button
                disabled={!!salvando.fornecedor}
                style={{ backgroundColor: themeColors.secondary, opacity: salvando.fornecedor ? 0.6 : 1 }}
                onClick={async () => {
                if (salvando.fornecedor) return;
                if(!novoFornecedor.nome) return showToast("Digite o nome do fornecedor!", 'erro');
                setSalvando(prev => ({ ...prev, fornecedor: true }));
                try {
                  const d = { nome: novoFornecedor.nome, site: novoFornecedor.site, whatsapp: novoFornecedor.whatsapp, endereco: novoFornecedor.endereco, categorias: novoFornecedor.categorias || [], userId: user.uid };

                  if (novoFornecedor.id) await updateDoc(doc(db, "fornecedores", novoFornecedor.id), d);
                  else await addDoc(collection(db, "fornecedores"), d);

                  setNovoFornecedor({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
                  showToast("Fornecedor cadastrado com sucesso! 📦🎉");
                } catch {
                  showToast("Erro ao salvar fornecedor.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, fornecedor: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-md">
                {salvando.fornecedor ? 'Salvando...' : (novoFornecedor.id ? 'Atualizar Fornecedor' : 'Salvar Fornecedor')}
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full mt-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Pesquisar por nome do fornecedor..." value={pesquisaFornecedores} onChange={e => setPesquisaFornecedores(e.target.value)} className="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm" />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
                <button onClick={() => setFiltroFornSelecionado('Todos')} style={{ backgroundColor: filtroFornSelecionado === 'Todos' ? themeColors.primary : undefined, borderColor: filtroFornSelecionado === 'Todos' ? themeColors.primary : undefined }} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === 'Todos' ? 'text-white' : 'bg-white text-slate-500'}`}>🌍 Todos</button>
                {categoriasForn.map(cat => (
                  <button key={cat.id} onClick={() => setFiltroFornSelecionado(cat.nome)} style={{ backgroundColor: filtroFornSelecionado === cat.nome ? themeColors.primary : undefined, borderColor: filtroFornSelecionado === cat.nome ? themeColors.primary : undefined }} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === cat.nome ? 'text-white' : 'bg-white text-slate-500'}`}>{cat.nome}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              {proveedoresFiltrados.map(f => (
                <div key={f.id} className="bg-white p-5 rounded-[30px] border shadow-sm flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-base truncate">{f.nome}</h4>
                      {f.endereco && <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1"><MapPin size={12}/> {f.endereco}</p>}
                      {f.categorias && f.categorias.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {f.categorias.map((c: string, idx: number) => (
                            <span key={idx} style={{ color: themeColors.primary }} className="text-[9px] bg-purple-50 px-2 py-0.5 rounded font-black uppercase">{c}</span>
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
                      <button onClick={() => window.open(`http://maps.google.com/?q=${encodeURIComponent(f.endereco)}`, '_blank')} className="flex items-center gap-1 text-xs font-black uppercase bg-slate-50 text-slate-600 px-3 py-2 rounded-xl active:scale-95 transition-transform"><MapPin size={13}/> Mapa</button>
                    )}
                  </div>
                </div>
              ))}

              {proveedoresFiltrados.length === 0 && (
                <p className="text-center font-bold text-xs text-slate-400 py-6 italic">Nenhum fornecedor cadastrado nesta seção. 📦</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comissoes' && (
          <div className="space-y-4 pt-2 w-full animate-fadeIn">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-1 flex items-center gap-2 uppercase text-xs tracking-widest"><Percent size={18}/> {novoCanal.id ? '✏️ Editando Canal' : 'Cadastrar Canal de Venda'}</h2>
              <p className="text-slate-400 text-[11px] mb-4">Shopee, Mercado Livre, Instagram, venda direta... cadastre a comissão de cada canal pra saber quanto sobra de lucro real em cada venda.</p>

              {novoCanal.id && (
                <button onClick={() => setNovoCanal({ id: '', nome: '', comissaoPercent: '', taxaFixa: '0' })} className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide mb-4 block">Cancelar Edição ❌</button>
              )}

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Canal</label>
              <input placeholder="Ex: Shopee, Mercado Livre, Instagram..." className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCanal.nome} onChange={e => setNovoCanal({...novoCanal, nome: e.target.value})} />

              <div className="grid grid-cols-2 gap-3 mb-4 w-full">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Comissão (%)</label>
                  <input type="number" placeholder="Ex: 14" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-purple-400" value={novoCanal.comissaoPercent} onChange={e => setNovoCanal({...novoCanal, comissaoPercent: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Taxa Fixa por Venda (R$)</label>
                  <input type="number" placeholder="Ex: 4.00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-purple-400" value={novoCanal.taxaFixa} onChange={e => setNovoCanal({...novoCanal, taxaFixa: e.target.value})} />
                </div>
              </div>

              <button
                disabled={!!salvando.canal}
                style={{ backgroundColor: themeColors.secondary, opacity: salvando.canal ? 0.6 : 1 }}
                onClick={async () => {
                  if (salvando.canal) return;
                  if (!novoCanal.nome || novoCanal.comissaoPercent === '') return showToast("Preencha o nome e a comissão do canal!", 'erro');
                  setSalvando(prev => ({ ...prev, canal: true }));
                  try {
                    const d = { nome: novoCanal.nome, comissaoPercent: Number(novoCanal.comissaoPercent), taxaFixa: Number(novoCanal.taxaFixa || 0), userId: user.uid };
                    if (novoCanal.id) await updateDoc(doc(db, "canais_venda", novoCanal.id), d);
                    else await addDoc(collection(db, "canais_venda"), d);
                    setNovoCanal({ id: '', nome: '', comissaoPercent: '', taxaFixa: '0' });
                    showToast("Canal de venda salvo! 🚀");
                  } catch {
                    showToast("Erro ao salvar canal.", 'erro');
                  } finally {
                    setSalvando(prev => ({ ...prev, canal: false }));
                  }
                }}
                className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md"
              >
                {salvando.canal ? 'Salvando...' : (novoCanal.id ? 'Salvar Alterações' : 'Salvar Canal')}
              </button>
            </div>

            {canaisVenda.length > 0 && (
              <div className="space-y-2 w-full">
                {canaisVenda.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-3xl flex justify-between items-center border shadow-sm w-full">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{c.nome}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.comissaoPercent}% de comissão{Number(c.taxaFixa || 0) > 0 ? ` + R$ ${Number(c.taxaFixa).toFixed(2)} fixo` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setNovoCanal({ id: c.id, nome: c.nome, comissaoPercent: String(c.comissaoPercent), taxaFixa: String(c.taxaFixa || 0) })} className="text-orange-400 p-2"><Edit2 size={16}/></button>
                      <button onClick={() => confirmarExcluir('canal_venda', c.id)} className="text-red-200 p-2"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canaisVenda.length > 0 && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
                <h2 style={{ color: themeColors.primary }} className="font-bold mb-1 flex items-center gap-2 uppercase text-xs tracking-widest"><Calculator size={18}/> Simulador de Lucro por Canal</h2>
                <p className="text-slate-400 text-[11px] mb-4">Informe o custo do produto e o preço de venda, e veja quanto sobra de lucro em cada canal depois da comissão.</p>

                <div className="grid grid-cols-2 gap-3 mb-1 w-full">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Custo do Produto (R$)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-purple-400" value={custoTesteComissao} onChange={e => setCustoTesteComissao(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Preço de Venda (R$)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-purple-400" value={precoTesteComissao} onChange={e => setPrecoTesteComissao(e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => setCustoTesteComissao(resumenFinanceiro.custoPeca)} className="text-[10px] font-black uppercase text-purple-600 underline mb-4 block">Usar custo do último orçamento calculado</button>

                <div className="space-y-2 w-full">
                  {canaisVenda.map(c => {
                    const preco = Number(precoTesteComissao) || 0;
                    const custo = Number(custoTesteComissao) || 0;
                    const valorComissao = preco * (Number(c.comissaoPercent) / 100);
                    const taxaFixa = Number(c.taxaFixa || 0);
                    const valorLiquido = preco - valorComissao - taxaFixa;
                    const lucro = valorLiquido - custo;
                    const margemSobreCusto = custo > 0 ? (lucro / custo) * 100 : 0;
                    const lucroNegativo = lucro < 0;
                    return (
                      <div key={c.id} className={`p-4 rounded-2xl border w-full ${lucroNegativo ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-slate-800 text-xs uppercase">{c.nome}</span>
                          <span className={`font-black text-sm ${lucroNegativo ? 'text-red-500' : 'text-emerald-600'}`}>R$ {lucro.toFixed(2)} {lucroNegativo ? '⚠️' : ''}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                          <div>Comissão: <span className="font-bold text-slate-700 block">R$ {valorComissao.toFixed(2)}</span></div>
                          <div>Recebe líquido: <span className="font-bold text-slate-700 block">R$ {valorLiquido.toFixed(2)}</span></div>
                          <div>Margem s/ custo: <span className={`font-bold block ${lucroNegativo ? 'text-red-500' : 'text-slate-700'}`}>{margemSobreCusto.toFixed(0)}%</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {canaisVenda.length === 0 && (
              <p className="text-center font-bold text-xs text-slate-400 py-6 italic">Cadastre seu primeiro canal de venda acima pra começar a simular. 📊</p>
            )}
          </div>
        )}

        {activeTab === 'caixa' && (
          <div className="space-y-4 pt-2 w-full animate-fadeIn">
            <div style={{ backgroundColor: saldoCaixa >= 0 ? themeColors.primary : '#ef4444' }} className="p-6 rounded-[35px] shadow-lg text-white w-full">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Saldo em Caixa (Total)</p>
              <h2 className="text-4xl font-black tracking-tight">R$ {saldoCaixa.toFixed(2)}</h2>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
                <p className="text-[11px] text-white/80">💰 Este mês</p>
                <p className="font-black text-sm">R$ {saldoMesAtualCaixa.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={sincronizarVendasAntigas}
              disabled={!!salvando.sync}
              className="w-full bg-white border border-purple-100 text-purple-600 font-bold text-xs uppercase py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <History size={14}/> {salvando.sync ? 'Sincronizando...' : 'Sincronizar vendas antigas com o caixa'}
            </button>

            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-1 flex items-center gap-2 uppercase text-xs tracking-widest"><DollarSign size={18}/> Nova Movimentação</h2>
              <p className="text-slate-400 text-[11px] mb-4">Vendas confirmadas e sinais recebidos já entram automaticamente aqui. Use este formulário pra lançar gastos (compra de material, aluguel, etc.) ou outras entradas manuais.</p>

              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl w-full mb-4">
                <button type="button" onClick={() => setNovaMovimentacao({...novaMovimentacao, tipo: 'saida'})} style={{ backgroundColor: novaMovimentacao.tipo === 'saida' ? '#ef4444' : 'transparent', color: novaMovimentacao.tipo === 'saida' ? '#ffffff' : '#64748b' }} className="py-2.5 rounded-lg font-bold text-xs uppercase transition-all">Saída</button>
                <button type="button" onClick={() => setNovaMovimentacao({...novaMovimentacao, tipo: 'entrada'})} style={{ backgroundColor: novaMovimentacao.tipo === 'entrada' ? '#10b981' : 'transparent', color: novaMovimentacao.tipo === 'entrada' ? '#ffffff' : '#64748b' }} className="py-2.5 rounded-lg font-bold text-xs uppercase transition-all">Entrada</button>
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
              <input placeholder="Ex: Pacote de folha A4, aluguel, frete..." className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novaMovimentacao.descricao} onChange={e => setNovaMovimentacao({...novaMovimentacao, descricao: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none font-bold border focus:border-purple-400" value={novaMovimentacao.valor} onChange={e => setNovaMovimentacao({...novaMovimentacao, valor: e.target.value})} />

              {novaMovimentacao.tipo === 'saida' && (
                <div className="mb-4 w-full bg-purple-50/50 border border-purple-100 rounded-2xl p-4">
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1 block mb-1">Vincular a um material do Armário (opcional)</label>
                  <p className="text-[10px] text-slate-400 mb-2">Se for uma compra de insumo, isso já atualiza o estoque e o custo desse material.</p>
                  <select className="w-full p-3.5 bg-white rounded-xl outline-none mb-2 block border text-xs font-bold" value={novaMovimentacao.materialVinculado} onChange={e => setNovaMovimentacao({...novaMovimentacao, materialVinculado: e.target.value})}>
                    <option value="">Nenhum — só lançar a saída</option>
                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  {novaMovimentacao.materialVinculado && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Quantidade Comprada</label>
                      <input type="number" placeholder="Ex: 500 (folhas), 1 (pacote)..." className="w-full p-3.5 bg-white rounded-xl outline-none border text-xs font-bold" value={novaMovimentacao.qtdComprada} onChange={e => setNovaMovimentacao({...novaMovimentacao, qtdComprada: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              <button
                disabled={!!salvando.caixa}
                style={{ backgroundColor: novaMovimentacao.tipo === 'entrada' ? '#10b981' : '#ef4444', opacity: salvando.caixa ? 0.6 : 1 }}
                onClick={salvarMovimentacaoCaixa}
                className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md"
              >
                {salvando.caixa ? 'Salvando...' : 'Registrar Movimentação'}
              </button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full border">
              <button onClick={() => setFiltroTipoCaixa('todos')} style={{ color: filtroTipoCaixa === 'todos' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroTipoCaixa === 'todos' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Todos</button>
              <button onClick={() => setFiltroTipoCaixa('entrada')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroTipoCaixa === 'entrada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Entradas</button>
              <button onClick={() => setFiltroTipoCaixa('saida')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroTipoCaixa === 'saida' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Saídas</button>
            </div>

            <div className="space-y-2 w-full">
              {movimentacoesCaixaOrdenadas.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-3xl flex justify-between items-center border shadow-sm w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{ backgroundColor: m.tipo === 'entrada' ? '#d1fae5' : '#fee2e2', color: m.tipo === 'entrada' ? '#059669' : '#dc2626' }} className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                      {m.tipo === 'entrada' ? '↑' : '↓'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{m.descricao}</p>
                      <p className="text-[10px] text-slate-400">{m.data?.toDate ? m.data.toDate().toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`font-black text-sm ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.tipo === 'entrada' ? '+' : '−'} R$ {Number(m.valor || 0).toFixed(2)}
                    </span>
                    <button onClick={() => excluirMovimentacaoCaixa(m)} className="text-red-200 hover:text-red-500 p-1 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}

              {movimentacoesCaixaOrdenadas.length === 0 && (
                <p className="text-center font-bold text-xs text-slate-400 py-8 italic">Nenhuma movimentação registrada ainda. 💸</p>
              )}
            </div>

            {historicoCaixaMensal.length > 0 && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full space-y-3">
                <h2 style={{ color: themeColors.primary }} className="font-bold mb-1 flex items-center gap-2 uppercase text-xs tracking-widest"><TrendingUp size={18}/> Histórico Mensal do Caixa</h2>
                <p className="text-slate-400 text-[11px] mb-2">Entradas, saídas e saldo de cada mês.</p>

                {historicoCaixaMensal.map(item => {
                  const isExpanded = mesExpandido === `caixa_${item.chave}`;
                  const saldoMes = item.entradas - item.saidas;
                  return (
                    <div key={item.chave} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                      <div onClick={() => setMesExpandido(isExpanded ? null : `caixa_${item.chave}`)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                        <div>
                          <p className="font-black text-slate-800 text-sm uppercase tracking-wide">{item.mesAnoTexto}</p>
                          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">↑ R$ {item.entradas.toFixed(2)} • ↓ R$ {item.saidas.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Saldo do Mês</span>
                            <span className={`font-black text-lg ${saldoMes >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>R$ {saldoMes.toFixed(2)}</span>
                          </div>
                          <div style={{ color: themeColors.primary }} className="p-1 bg-white rounded-xl border">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="bg-white p-4 border-t border-slate-200 space-y-2 animate-fadeIn">
                          {item.itens.sort((a: any, b: any) => (b.data?.seconds || 0) - (a.data?.seconds || 0)).map((m: any) => (
                            <div key={m.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                              <span className="font-bold text-slate-700 truncate pr-2">{m.descricao}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`font-black ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>{m.tipo === 'entrada' ? '+' : '−'} R$ {Number(m.valor || 0).toFixed(2)}</span>
                                <button onClick={() => excluirMovimentacaoCaixa(m)} className="text-red-200 hover:text-red-500"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {historicoFiltradoPorData.length > 0 && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><History size={18}/> Histórico de Vendas por Mês</h2>
                    <p className="text-slate-400 text-[11px] mt-0.5">Detalhe de cada peça/combo vendido, por mês:</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mês de Referência</label>
                    <select className="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" value={mesFiltroHistorico} onChange={e => setMesFiltroHistorico(e.target.value)}>
                      <option value="Todos">📅 Todos os Meses</option>
                      <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
                      <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
                      <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
                      <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Ano de Referência</label>
                    <select className="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" value={anoFiltroHistorico} onChange={e => setAnoFiltroHistorico(e.target.value)}>
                      <option value="Todos">🗓️ Todos os Anos</option>
                      <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {historicoFiltradoPorData.map(item => {
                    const isExpanded = mesExpandido === item.chave;
                    return (
                      <div key={item.chave} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                        <div onClick={() => setMesExpandido(isExpanded ? null : item.chave)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase tracking-wide">{item.mesAnoTexto}</p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.qtd} {item.qtd === 1 ? 'venda concluída' : 'vendas concluídas'} • Clique para ver itens 🔍</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Faturamento</span>
                              <span style={{ color: themeColors.primary }} className="font-black text-lg">R$ {item.total.toFixed(2)}</span>
                            </div>
                            <div style={{ color: themeColors.primary }} className="p-1 bg-white rounded-xl border">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="bg-white p-4 border-t border-slate-200 space-y-2.5 animate-fadeIn">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Relação de Peças / Combos Vendidos:</p>
                            <div className="space-y-2">
                              {item.itensVendidos.map((p: any, idx: number) => {
                                const cli = clientes.find(c => c.id === p.clienteId);
                                return (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className="font-bold text-slate-800 break-words whitespace-pre-line">{p.nomeProd}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">👤 {cli?.nome || 'Cliente não informado'} • 🗓️ {p.data}</p>
                                    </div>
                                    <div className="font-black text-slate-700 text-sm shrink-0">R$ {Number(p.preco || 0).toFixed(2)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <div className="flex justify-between items-center mb-1 w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2"><History size={20}/> Histórico da Loja</h2>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full mb-4 border">
              <button onClick={() => setFiltroStatusPedido('Pendente')} style={{ color: filtroStatusPedido === 'Pendente' ? themeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Pendente' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Pendentes </button>
              <button onClick={() => setFiltroStatusPedido('Produção')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Produção' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>Produção </button>
              <button onClick={() => setFiltroStatusPedido('Vendido')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Vendido' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Vendidos </button>
              <button onClick={() => setFiltroStatusPedido('Cancelado')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Cancelado' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Cancelados </button>
            </div>

            {pedidosFiltradosPorStatus.map(p => {
               const cli = clientes.find(c => c.id === p.clienteId);
               const statusAtual = p.status || 'Pendente';
               return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p style={{ color: themeColors.primary }} className="font-black text-[10px] uppercase mb-1">
                          {cli?.nome || 'Sem Cliente'} {p.data ? `— ${p.data}` : ''} — <span className={statusAtual.includes('Vendido') ? "text-emerald-500" : statusAtual.includes('Cancelado') ? "text-red-400" : statusAtual.includes('Produção') ? "text-purple-500" : "text-orange-400"}>{statusAtual}</span>
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
                          <p style={{ color: themeColors.primary }} className="text-[11px] bg-purple-50 p-2 rounded-lg font-medium border border-purple-100 mt-2">🗒️ Notas: {p.obsPedido}</p>
                        )}
                        {p.statusPagamento === 'sinal_recebido' && (
                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded mt-2">💰 Sinal: R$ {Number(p.valorSinal || 0).toFixed(2)} • Falta: R$ {(Number(p.preco || 0) - Number(p.valorSinal || 0)).toFixed(2)}</p>
                        )}
                     </div>
                     <div style={{ color: themeColors.secondary }} className="font-black text-xl shrink-0">R$ {p.preco}</div>
                   </div>

                   <div className="flex items-center border-t pt-3 gap-2 w-full flex-wrap">
                      {statusAtual === 'Pendente' && (
                        <>
                          <button onClick={async () => { await updateDoc(doc(db, "pedidos", p.id), { status: 'Em Produção 🔧', statusKanban: 'a_fazer' }); showToast("Pedido movido pro Kanban! 🔧"); }} className="text-purple-600 px-3 py-2 bg-purple-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 mr-auto">🔧 Iniciar Produção</button>
                          <button onClick={() => carregarPedidoParaEdicao(p)} style={{ color: themeColors.primary }} className="p-2 bg-purple-50 rounded-xl"><Edit2 size={18}/></button>
                          <button onClick={() => cancelarPedidoSemExcluir(p.id)} title="Cancelar Orçamento" className="text-red-500 p-2 bg-red-50 rounded-xl"><X size={18}/></button>
                        </>
                      )}
                      {statusAtual === 'Em Produção 🔧' && (
                        <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 px-3 py-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 mr-auto"><CheckCircle size={16}/> Confirmar Venda</button>
                      )}
                      {(statusAtual === 'Pendente' || statusAtual === 'Em Produção 🔧') && p.statusPagamento !== 'sinal_recebido' && (
                        <button onClick={() => { setMostrarModalSinal({ id: p.id, tipo: 'pedido', titulo: p.nomeProd, total: p.preco }); setValorSinalInput(''); }} className="text-amber-600 px-3 py-2 bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95">💰 Sinal</button>
                      )}

                      <button onClick={() => handleDuplicarOrcamento(p)} title="Duplicar este Orçamento" className="text-blue-500 p-2 bg-blue-50 rounded-xl active:scale-95 transition-transform"><Copy size={18}/></button>
                      <button onClick={() => gerarPDF(p)} style={{ color: themeColors.secondary }} className="p-2 bg-orange-50 rounded-xl active:scale-95 transition-all"><Printer size={18}/></button>
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

            {temMaisPedidos && pedidosFiltradosPorStatus.length > 0 && (
              <button onClick={carregarMaisPedidos} disabled={carregandoMais} className="w-full bg-slate-100 text-slate-500 font-bold text-xs uppercase py-3 rounded-2xl mt-2">
                {carregandoMais ? 'Carregando...' : 'Carregar mais pedidos'}
              </button>
            )}
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2"><Package size={20}/> Gerenciar Armário</h2>
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
                  <label style={{ color: themeColors.primary }} className="text-[10px] font-bold uppercase ml-1">Estoque Atual</label>
                  <input type="number" style={{ color: themeColors.primary }} className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold border focus:border-purple-400" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} />
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
              <button
                disabled={!!salvando.material}
                style={{ backgroundColor: themeColors.secondary, opacity: salvando.material ? 0.6 : 1 }}
                onClick={async () => {
                if (salvando.material) return;
                if(!novoMat.nome) return showToast("Digite o nome do insumo!", 'erro');
                setSalvando(prev => ({ ...prev, material: true }));
                try {
                  const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), unidade: novoMat.unidade, qtdAtual: Number(novoMat.qtdAtual || 0), qtdMinima: Number(novoMat.qtdMinima || 0), userId: user.uid, atualizadoEm: Timestamp.now() };
                  if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                  else await addDoc(collection(db, "materiais"), d);
                  setNovoMat({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
                  showToast("Material Salvo!");
                } catch {
                  showToast("Erro ao salvar material.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, material: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs">
                {salvando.material ? 'Salvando...' : (novoMat.id ? 'Atualizar Insumo' : 'Salvar no Armário')}
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
              const diasDesdeAtualizacao = m.atualizadoEm?.toDate
                ? Math.floor((Date.now() - m.atualizadoEm.toDate().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const desatualizado = diasDesdeAtualizacao !== null && diasDesdeAtualizacao > 30;
              const semRegistroDeData = diasDesdeAtualizacao === null;
              return (
                <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border w-full mb-2 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">{estaAcabando ? '🔴' : '🟢'} {m.nome}</p>
                    <p className="text-xs text-slate-400 mt-1">Custo unitário: <span className="font-bold text-slate-600">R$ {valorUnitarioCalculado}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">Qtd: <span style={{ color: themeColors.primary }} className="font-bold">{m.qtdAtual} {m.unidade}</span></p>
                    {desatualizado && (
                      <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded">⚠️ Preço sem atualizar há {diasDesdeAtualizacao} dias</p>
                    )}
                    {semRegistroDeData && (
                      <p className="text-[10px] text-slate-400 italic mt-1">ℹ️ Ainda sem data de atualização registrada — edite este material pra começar a rastrear</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, Number(m.qtdAtual || 0) - 1) })} className="w-8 h-8 bg-slate-100 rounded-xl font-bold">-</button>
                    <button onClick={async () => await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Number(m.qtdAtual || 0) + 1 })} style={{ color: themeColors.primary }} className="w-8 h-8 bg-purple-100 rounded-xl font-bold">+</button>
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

        {activeTab === 'clientes' && (
           <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2"><User size={20}/> Gerenciar Clientes</h2>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Comercial / Completo</label>
              <input placeholder="Ex: Maria Silva" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CPF / CNPJ do Cliente</label>
              <input placeholder="Ex: 000.000.000-00" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.cpfCnpj || ''} onChange={e => setNovoCli({...novoCli, cpfCnpj: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp com DDD</label>
              <input placeholder="Ex: 21999999999" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail de Contato</label>
              <input type="email" placeholder="Ex: cliente@email.com" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-medium text-sm" value={novoCli.email || ''} onChange={e => setNovoCli({...novoCli, email: e.target.value})} />

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço de Entrega Completo</label>
              <textarea placeholder="Rua, Número, Bairro, Cidade, CEP..." className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none border focus:border-purple-400 resize-none h-20 font-medium text-sm" value={novoCli.endereco || ''} onChange={e => setNovoCli({...novoCli, endereco: e.target.value})} />

              <button
                disabled={!!salvando.cliente}
                style={{ backgroundColor: themeColors.secondary, opacity: salvando.cliente ? 0.6 : 1 }}
                onClick={async () => {
                if (salvando.cliente) return;
                if(!novoCli.nome) return showToast("Digite o nome do cliente!", 'erro');
                setSalvando(prev => ({ ...prev, cliente: true }));
                try {
                  const dadosCliente = {
                    nome: novoCli.nome,
                    zap: novoCli.zap,
                    email: novoCli.email || '',
                    endereco: novoCli.endereco || '',
                    cpfCnpj: novoCli.cpfCnpj || '',
                    userId: user.uid
                  };

                  if(novoCli.id) await updateDoc(doc(db, "clientes", novoCli.id), dadosCliente);
                  else await addDoc(collection(db, "clientes"), dadosCliente);

                  setNovoCli({ id: '', nome: '', zap: '', email: '', endereco: '', cpfCnpj: '' });
                  showToast("Cadastro do cliente salvo com sucesso! 🎉");
                } catch {
                  showToast("Erro ao salvar cliente.", 'erro');
                } finally {
                  setSalvando(prev => ({ ...prev, cliente: false }));
                }
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs">{salvando.cliente ? 'Salvando...' : 'Salvar Cliente'}</button>
            </div>
            {clientes.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl flex flex-col gap-2 border shadow-sm font-bold w-full mb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col ml-2">
                    <span className="text-slate-800 text-base">{c.nome}</span>
                    {c.cpfCnpj && <span className="text-xs text-slate-400 font-normal mt-0.5">🪪 CPF/CNPJ: {c.cpfCnpj}</span>}
                    <span className="text-xs text-slate-400 font-normal mt-0.5">{c.zap ? `📱 ${c.zap}` : 'Sem número'}</span>
                    {c.email && <span className="text-xs text-slate-400 font-normal mt-0.5">✉️ {c.email}</span>}
                    {c.endereco && <span className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100 whitespace-pre-line">📍 {c.endereco}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setNovoCli({ id: c.id, nome: c.nome, zap: c.zap || '', email: c.email || '', endereco: c.endereco || '', cpfCnpj: c.cpfCnpj || '' })} className="text-orange-400 p-2"><Edit2 size={18}/></button>
                    <button onClick={() => confirmar("Tem certeza de que deseja excluir este cliente?", async () => { await deleteDoc(doc(db, "clientes", c.id)); showToast("Cliente excluído."); })} className="text-red-200 p-2"><Trash2 size={20}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'atualizacoes' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-1 flex items-center gap-2"><Megaphone size={20}/> Atualizações do App</h2>
              <p className="text-slate-400 text-[11px] mb-6">Fique por dentro do que já mudou no PrecificaJá.</p>

              <div className="space-y-5">
                {CHANGELOG_APP.map((versao, idx) => (
                  <div key={idx} className="border-l-2 pl-4" style={{ borderColor: themeColors.primary }}>
                    <span style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase tracking-wider block mb-1">{versao.data}</span>
                    <h3 className="font-bold text-slate-800 text-sm mb-2">{versao.titulo}</h3>
                    <ul className="space-y-1.5">
                      {versao.itens.map((item, i) => (
                        <li key={i} className="text-xs text-slate-500 font-medium flex items-start gap-2">
                          <span style={{ color: themeColors.secondary }} className="mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suporte' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full text-center">
              <div style={{ color: themeColors.primary }} className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <LifeBuoy size={28}/>
              </div>
              <h2 className="font-bold text-slate-800 text-lg mb-1">Precisa de ajuda? 🙋‍♀️</h2>
              <p className="text-slate-400 text-xs mb-6">Fale direto com a gente pelo WhatsApp para dúvidas, sugestões ou problemas no app.</p>

              <button
                onClick={() => {
                  const numero = (suporteZapPerfil || zapDonaConta || '').replace(/\D/g, '');
                  if (!numero) return showToast("Cadastre o WhatsApp de suporte no Perfil da Loja primeiro!", 'erro');
                  window.open(`https://wa.me/55${numero}?text=${encodeURIComponent('Olá! Preciso de ajuda com o PrecificaJá 🙌')}`, '_blank');
                }}
                style={{ backgroundColor: themeColors.primary }}
                className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md flex items-center justify-center gap-2"
              >
                <MessageCircle size={18}/> Falar no WhatsApp
              </button>

              {!(suporteZapPerfil || zapDonaConta) && (
                <p className="text-[10px] text-amber-500 font-bold mt-3">⚠️ Nenhum WhatsApp de suporte cadastrado ainda. Vá em Perfil da Loja para adicionar.</p>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-30 bg-transparent pointer-events-none lg:hidden">
        <div className="bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-[28px] flex justify-around items-center px-4 h-16 w-full max-w-xl pointer-events-auto border">
          <button onClick={() => setActiveTab('inicio')} style={{ color: activeTab === 'inicio' ? themeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'inicio' ? 'text-slate-300' : ''}`}>
            <Home size={22} className={activeTab === 'inicio' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
          </button>
          <button onClick={() => setActiveTab('criar')} style={{ color: activeTab === 'criar' ? themeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'criar' ? 'text-slate-300' : ''}`}>
            <Plus size={22} className={activeTab === 'criar' ? 'stroke-[3]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Orçar</span>
          </button>
          <button onClick={() => setActiveTab('contratos')} style={{ color: activeTab === 'contratos' ? themeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'contratos' ? 'text-slate-300' : ''}`}>
            <FileText size={22} className={activeTab === 'contratos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Contratos</span>
          </button>
          <button onClick={() => setActiveTab('pedidos')} style={{ color: activeTab === 'pedidos' ? themeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'pedidos' ? 'text-slate-300' : ''}`}>
            <History size={22} className={activeTab === 'pedidos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </div>

    </div>
  );
}
