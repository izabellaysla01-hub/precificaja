import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle, Home, BookOpen, Camera, ImageIcon, Copy, Share2, Menu, Search, Settings, CheckSquare, Square, Filter, MapPin, Globe, Palette, TrendingUp, ChevronDown, ChevronUp, FileText } from 'lucide-react';

Const firebaseConfig = {
  ApiKey: "AIzaSyD0BWsNm9DbGGDqiHzkdDmNdxIGdJ9tWe8",
  AuthDomain: "precificaja-968cd.firebaseapp.com",
  ProjectId: "precificaja-968cd",
  StorageBucket: "precificaja-968cd.firebasestorage.app",
  MessagingSenderId: "646149720985",
  AppId: "1:646149720985:web:9c04001f2c6344979a2108"
};

Const app = initializeApp(firebaseConfig);
Const auth = getAuth(app);
Const db = getFirestore(app);
Const storage = getStorage(app);

// --- PALETAS PRÉ-DEFINIDAS ---
Const PRESET_PALETTES = [
  {
    Id: 'purple_creative',
    Nome: 'Roxo Criativo (Padrão)',
    Primary: '#7c3aed',
    PrimaryHover: '#6d28d9',
    Secondary: '#f97316',
    SecondaryHover: '#ea580c'
  },
  {
    Id: 'blue_corporate',
    Nome: 'Azul Corporativo',
    Primary: '#2563eb',
    PrimaryHover: '#1d4ed8',
    Secondary: '#38bdf8',
    SecondaryHover: '#0284c7'
  },
  {
    Id: 'slate_elegant',
    Nome: 'Grafite Elegante',
    Primary: '#334155',
    PrimaryHover: '#1e293b',
    Secondary: '#0ea5e9',
    SecondaryHover: '#0284c7'
  },
  {
    Id: 'emerald_growth',
    Nome: 'Verde Esmeralda',
    Primary: '#059669',
    PrimaryHover: '#047857',
    Secondary: '#10b981',
    SecondaryHover: '#059669'
  }
];

// --- TELA DE LOGIN ---
Const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => {
  Const recuperarSenha = async () => {
    If (!email) return alert("Digite seu e-mail primeiro para eu te mandar o link!");
    Try {
      Await sendPasswordResetEmail(auth, email);
      Alert("Enviamos um link para o seu e-mail!");
    } catch (e) { alert("E-mail não encontrado ou inválido."); }
  };

  Return (
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

Export default function App() {
  Const [user, setUser] = useState<any>(null);
  Const [loading, setLoading] = useState(true);
  Const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  Const [idLojaPublica, setIdLojaPublica] = useState<string | null>(null);
  Const [produtosPublicos, setProdutosPublicos] = useState<any[]>([]);
  Const [carregandoPublico, setCarregandoPublico] = useState(false);
  Const [carrinho, setCarrinho] = useState<{ [key: string]: number }>({});
  Const [nomeComprador, setNomeComprador] = useState('');
  Const [zapDaLojaPublica, setZapDaLojaPublica] = useState('');

  // Estados para Filtro na Vitrine Pública do Cliente
  Const [filtroVitrineSelecionado, setFiltroVitrineSelecionado] = useState('Todos');
  Const [isMenuFiltroVitrineOpen, setIsMenuFiltroVitrineOpen] = useState(false);

  Const [activeTab, useStateActiveTab] = useState<'inicio' | 'materiais' | 'criar' | 'pedidos' | 'clientes' | 'catalogo' | 'balcao' | 'financeiro' | 'perfil' | 'anotacoes' | 'fornecedores' | 'contratos'>('inicio');
  
  // Sub-aba interna para a seção financeira
  Const [subAbaFinanceiro, setSubAbaFinanceiro] = useState<'geral' | 'impressao' | 'equipamentos' | 'historico'>('geral');

  // Estados do Histórico Financeiro Avançado
  Const [mesFiltroHistorico, setMesFiltroHistorico] = useState<string>(String(new Date().getMonth() + 1));
  Const [anoFiltroHistorico, setAnoFiltroHistorico] = useState<string>(String(new Date().getFullYear()));
  Const [mesExpandido, setMesExpandido] = useState<string | null>(null);

  Const [materiais, setMaterials] = useState<any[]>([]);
  Const [pedidos, setPedidos] = useState<any[]>([]);
  Const [clientes, setClientes] = useState<any[]>([]);
  Const [produtos, setProdutos] = useState<any[]>([]);
  Const [equipamentos, setEquipamentos] = useState<any[]>([]);
  Const [anotacoes, setAnotacoes] = useState<any[]>([]);
  Const [contratos, setContratos] = useState<any[]>([]);
  
  // Estados para Categorias Dinâmicas e Fornecedores
  Const [categoriasProd, setCategoriasProd] = useState<any[]>([]);
  Const [categoriasForn, setCategoriasForn] = useState<any[]>([]);
  Const [fornecedores, setFornecedores] = useState<any[]>([]);

  Const [pesquisaMateriais, setPesquisaMateriais] = useState('');
  Const [pesquisaFornecedores, setPesquisaFornecedores] = useState('');
  Const [filtroFornSelecionado, setFiltroFornSelecionado] = useState('Todos');

  Const [pedidoEditandoId, setPedidoEditandoId] = useState<string | null>(null);
  Const [mostrarSeletorCatalogo, setMostrarSeletorCatalogo] = useState(false);

  Const [filtroStatusPedido, setFiltroStatusPedido] = useState<'Pendente' | 'Vendido' | 'Cancelado'>('Pendente');
  Const [isDuplicando, setIsDuplicando] = useState(false);

  Const [diaSelecionadoAgenda, setDiaSelecionadoAgenda] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modo de Cálculo ('peca' = por unidade, 'lote' = valor total do lote rateado)
  Const [modoCalculo, setModoCalculo] = useState<'peca' | 'lote'>('peca');

  Const [nomeProd, setNomeProd] = useState('');
  Const [detalhamentoPed, setDetalhamentoPed] = useState(''); 
  Const [qtdPed, setQtdPed] = useState('1');
  Const [matsNoPed, setMatsNoPed] = useState<any[]>([]);
  Const [vHora, setVHora] = useState('9');
  Const [tGasto, setTGasto] = useState('60');
  Const [custos, setCustos] = useState({ embalagem: '0', impressao: '0', energia: '0', outros: '0' });
  Const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<string[]>([]);
  Const [lucro, setLucro] = useState('100');
  Const [desconto, setDesconto] = useState('0');
  Const [prazo, setPrazo] = useState('');
  Const [clienteSel, setClienteSel] = useState('');
  Const [precoManual, setPrecoManual] = useState<string | null>(null);
  Const [docObsPedido, setDocObsPedido] = useState('');

  // Estado para armazenar o valor alterado pelo usuário na calculadora
  Const [precoFinalDigitado, setPrecoFinalDigitado] = useState<string>('0.00');

  Const [email, setEmail] = useState('');
  Const [password, setPassword] = useState('');
  Const [isRegistering, setIsRegistering] = useState(false);
  Const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
    
  Const [novoCli, setNovoCli] = useState({ id: '', nome: '', zap: '', email: '', endereco: '', cpfCnpj: '' });
  Const [novaAnotacao, setNovaAnotacao] = useState({ id: '', titulo: '', conteudo: '', dataPrazo: new Date().toISOString().split('T')[0] });
  
  // Estados de Cadastro Atualizados com Categorias
  Const [novoProdCatalogo, setNovoProdCatalogo] = useState<{id: string, nome: string, precoVenda: string, urlImagem: string, categorias: string[]}>({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [] });
  Const [inputNovaCategoriaProd, setInputNovaCategoriaProd] = useState('');
  Const [mostrarInputNovaCatProd, setMostrarInputNovaCatProd] = useState(false);

  // Estados de Cadastro para Fornecedores
  Const [novoFornecedor, setNovoFornecedor] = useState<{id: string, nome: string, site: string, whatsapp: string, endereco: string, categorias: string[]}>({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
  Const [inputNovaCategoriaForn, setInputNovaCategoriaForn] = useState('');
  Const [mostrarInputNovaCatForn, setMostrarInputNovaCatForn] = useState(false);

  Const [zapDonaConta, setZapDonaConta] = useState('');
  Const [subindoImagem, setSubindoImagem] = useState(false);

  // --- NOVOS DADOS DO PERFIL DA LOJA (PARA CONTRATOS E ORÇAMENTOS) ---
  Const [nomeLojaPerfil, setNomeLojaPerfil] = useState('');
  Const [nomeFantasiaPerfil, setNomeFantasiaPerfil] = useState('');
  Const [cpfCnpjPerfil, setCpfCnpjPerfil] = useState('');
  Const [telefonePerfil, setTelefonePerfil] = useState('');
  Const [emailPerfil, setEmailPerfil] = useState('');
  Const [cepPerfil, setCepPerfil] = useState('');
  Const [enderecoPerfil, setEnderecoPerfil] = useState('');
  Const [cidadePerfil, setCidadePerfil] = useState('');
  Const [estadoPerfil, setEstadoPerfil] = useState('');
  Const [dadosBancariosPerfil, setDadosBancariosPerfil] = useState('');
  Const [logoLojaPerfil, setLogoLojaPerfil] = useState('');
  Const [subindoLogo, setSubindoLogo] = useState(false);

  // --- ESTADOS DA ABA CONTRATOS ---
  Const [novoContrato, setNovoContrato] = useState({
    Id: '',
    ClienteId: '',
    TipoEvento: '',
    DataEvento: '',
    LocalEvento: '',
    ValorTotal: '',
    Clausulas: `1. DAS PARTES E DO OBJETO\nO presente contrato estabelece os termos para a prestação dos serviços/produtos contratados.\n\n2. DO PAGAMENTO E CONFIRMAÇÃO\nO serviço será iniciado ou reservado mediante confirmação do pagamento acordado entre as partes.\n\n3. DAS CONDIÇÕES DE ENTREGA E CANCELAMENTO\nA entrega ou execução ocorrerá na data e local combinados. Em caso de cancelamento por parte do cliente, aplicar-se-ão os termos acordados prévia e formalmente.`
  });

  // --- ESTADO DE TEMA E CORES ---
  Const [themeColors, setThemeColors] = useState({
    Primary: '#7c3aed',
    PrimaryHover: '#6d28d9',
    Secondary: '#f97316',
    SecondaryHover: '#ea580c'
  });

  Const [financasFixo, setFinancasFixo] = useState({ salario: '0', aluguel: '0', internet: '0', luz: '0', outros: '0', diasTrabalho: '20', horasDia: '8' });
  Const [novoEquipamento, setNovoEquipamento] = useState({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });

  // --- ESTADOS PARA A CALCULADORA DE IMPRESSÃO ---
  Const [precoTinta, setPrecoTinta] = useState('62');
  Const [unidadeTinta, setUnidadeTinta] = useState('Garrafinha');
  Const [qtdCores, setQtdCores] = useState('4');
  Const [paginasConjunto, setPaginasConjunto] = useState('1500');

  Const [carrinhoInterno, setCarrinhoInterno] = useState<{ [key: string]: number }>({});
  Const [clienteBalcao, setClienteBalcao] = useState('');
  Const [nomeKitBalcao, setNomeKitBalcao] = useState('');
  Const [prazoBalcao, setPrazoBalcao] = useState('');

  Const setActiveTab = (tab: any) => {
    MustActiveTab(tab);
    SetIsMenuOpen(false);
  };

  Const custoPorPaginaCalculado = useMemo(() => {
    Const preco = Number(precoTinta) || 0;
    Const cores = Number(qtdCores) || 0;
    Const paginas = Number(paginasConjunto) || 1;
    Return paginas > 0 ? (cores * preco) / paginas : 0;
  }, [precoTinta, qtdCores, paginasConjunto]);

  Const formatarMoedaLocal = (valor: number) => {
    Return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  UseEffect(() => {
    Const params = new URLSearchParams(window.location.search);
    Const lojaId = params.get('loja');
    If (lojaId) {
      SetIdLojaPublica(lojaId);
      SetCarregandoPublico(true);
      
      GetDoc(doc(db, "configuracoes_loja", lojaId)).then(docSnap => {
        If(docSnap.exists()) {
          Const data = docSnap.data();
          SetZapDaLojaPublica(data.whatsapp || '');
          If (data.themeColors) setThemeColors(data.themeColors);
        }
      });

      Const qCats = query(collection(db, "categorias_produtos"), where("userId", "==", lojaId));
      GetDocs(qCats).then(snapshot => {
        SetCategoriasProd(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      Const q = query(collection(db, "produtos"), where("userId", "==", lojaId));
      GetDocs(q).then(snapshot => {
        SetProdutosPublicos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        SetCarregandoPublico(false);
      }).catch(() => setCarregandoPublico(false));
    }
    
    Return onAuthStateChanged(auth, u => {
      SetUser(u);
      If (u) {
        GetDoc(doc(db, "configuracoes_loja", u.uid)).then(docSnap => {
          If(docSnap.exists()) {
            Const data = docSnap.data();
            SetZapDonaConta(data.whatsapp || '');
            SetNomeLojaPerfil(data.nomeLoja || '');
            SetNomeFantasiaPerfil(data.nomeFantasia || '');
            SetCpfCnpjPerfil(data.cpfCnpj || '');
            SetTelefonePerfil(data.telefone || '');
            SetEmailPerfil(data.email || '');
            SetCepPerfil(data.cep || '');
            SetEnderecoPerfil(data.endereco || '');
            SetCidadePerfil(data.cidade || '');
            SetEstadoPerfil(data.estado || '');
            SetDadosBancariosPerfil(data.dadosBancarios || '');
            SetLogoLojaPerfil(data.logoUrl || '');
            If (data.themeColors) setThemeColors(data.themeColors);
          }
        });
      } else {
        SetMaterials([]);
        SetPedidos([]);
        SetClientes([]);
        SetProdutos([]);
        SetEquipamentos([]);
        SetAnotacoes([]);
        SetContratos([]);
      }
      SetLoading(false);
    }); 
  }, []);
  
  UseEffect(() => {
    Const script = document.createElement('script');
    Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    Script.async = true;
    Document.body.appendChild(script);
    Return () => { document.body.removeChild(script); };
  }, []);

  UseEffect(() => {
    If (user && !idLojaPublica) {
      Const qMaterials = query(collection(db, "materiais"), where("userId", "==", user.uid));
      Const unsubMaterials = onSnapshot(qMaterials, s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qPedidos = query(collection(db, "pedidos"), where("userId", "==", user.uid));
      Const unsubPedidos = onSnapshot(qPedidos, s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
      Const unsubClientes = onSnapshot(qClientes, s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qProdutos = query(collection(db, "produtos"), where("userId", "==", user.uid));
      Const unsubProdutos = onSnapshot(qProdutos, s => setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qAnotacoes = query(collection(db, "anotacoes"), where("userId", "==", user.uid));
      Const unsubAnotacoes = onSnapshot(qAnotacoes, s => setAnotacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qContratos = query(collection(db, "contratos"), where("userId", "==", user.uid));
      Const unsubContratos = onSnapshot(qContratos, s => setContratos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qCatsProd = query(collection(db, "categorias_produtos"), where("userId", "==", user.uid));
      Const unsubCatsProd = onSnapshot(qCatsProd, s => {
        If(s.docs.length === 0 && categoriasProd.length === 0) {
          Const padroes = ["🖨️ Sublimação", "✂️ Papelaria Personalizada", "🎁 Personalizados", "💕 Datas Comemorativas"];
          Padroes.forEach(async (cat) => {
            Await addDoc(collection(db, "categorias_produtos"), { nome: cat, userId: user.uid });
          });
        }
        SetCategoriasProd(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      Const qCatsForn = query(collection(db, "categorias_fornecedores"), where("userId", "==", user.uid));
      Const unsubCatsForn = onSnapshot(qCatsForn, s => {
        If(s.docs.length === 0 && categoriasForn.length === 0) {
          Const padroesForn = ["🖨️ Insumos de Sublimação", "✂️ Papelaria e Papéis", "📦 Embalagens e Caixas", "🎁 Brindes e Acrílicos"];
          PadroesForn.forEach(async (cat) => {
            Await addDoc(collection(db, "categorias_fornecedores"), { nome: cat, userId: user.uid });
          });
        }
        SetCategoriasForn(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      Const qFornecedores = query(collection(db, "fornecedores"), where("userId", "==", user.uid));
      Const unsubFornecedores = onSnapshot(qFornecedores, s => setFornecedores(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Const qConfigFin = doc(db, "configuracoes_financeiras", user.uid);
      GetDoc(qConfigFin).then(snap => {
        If (snap.exists()) {
          Const dadosFin = snap.data() as any;
          SetFinancasFixo(dadosFin);
          
          If (dadosFin.precoTinta) setPrecoTinta(dadosFin.precoTinta);
          If (dadosFin.unidadeTinta) setUnidadeTinta(dadosFin.unidadeTinta);
          If (dadosFin.qtdCores) setQtdCores(dadosFin.qtdCores);
          If (dadosFin.paginasConjunto) setPaginasConjunto(dadosFin.paginasConjunto);
          
          If (dadosFin.custoPorPaginaCalculado) {
            SetCustos(prev => ({ ...prev, impressao: Number(dadosFin.custoPorPaginaCalculado).toFixed(2) }));
          }

          Const dias = Number(dadosFin.diasTrabalho || 20);
          Const horas = Number(dadosFin.horasDia || 8);
          Const totalHorasMes = dias * horas || 160;
          Const salario = Number(dadosFin.salario || 0);
          Const custosMes = Number(dadosFin.aluguel || 0) + Number(dadosFin.internet || 0) + Number(dadosFin.luz || 0) + Number(dadosFin.outros || 0);
          
          If (salario + custosMes > 0) {
            Const fontHoraCalculada = (salario + custosMes) / totalHorasMes;
            SetVHora(fontHoraCalculada.toFixed(2));
          }
        }
      });

      Const qEquipamentos = query(collection(db, "equipamentos"), where("userId", "==", user.uid));
      Const unsubEquipamentos = onSnapshot(qEquipamentos, s => setEquipamentos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      Return () => {
        UnsubMaterials();
        UnsubPedidos();
        UnsubClientes();
        UnsubProdutos();
        UnsubEquipamentos();
        UnsubAnotacoes();
        UnsubContratos();
        UnsubCatsProd();
        UnsubCatsForn();
        UnsubFornecedores();
      };
    }
  }, [user, idLojaPublica]);

  Const linkDoCatalogoDestaCliente = useMemo(() => {
    If (!user) return '';
    Return `${window.location.origin}${window.location.pathname}?loja=${user.uid}`;
  }, [user]);

  Const copiarLinkCatalogo = () => {
    Navigator.clipboard.writeText(linkDoCatalogoDestaCliente);
    Alert("Link do seu catálogo copiado! 🔗🚀");
  };

  Const proximosSeteDias = useMemo(() => {
    Const dias = [];
    Const nomesDias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    Const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    For (let i = 0; i < 7; i++) {
      Const d = new Date();
      D.setDate(d.getDate() + i);
      
      Const ano = d.getFullYear();
      Const mes = String(d.getMonth() + 1).padStart(2, '0');
      Const diaNum = String(d.getDate()).padStart(2, '0');
      Const stringData = `${ano}-${mes}-${diaNum}`;
      
      Dias.push({
        StringData,
        DiaNumero: d.getDate(),
        DiaSemanaTexto: nomesDias[d.getDay()],
        MesTexto: nomesMeses[d.getMonth()]
      });
    }
    Return dias;
  }, []);

  Const anotacoesDoDiaSelecionado = useMemo(() => {
    Return anotacoes.filter(a => a.dataPrazo === diaSelecionadoAgenda && !a.concluido);
  }, [anotacoes, diaSelecionadoAgenda]);

  Const toggleStatusAnotacao = async (id: string, valorAtual: boolean) => {
    Await updateDoc(doc(db, "anotacoes", id), { concluido: !valorAtual });
  };

  // --- GERADOR DE PDF DE CONTRATO COMPATÍVEL COM O MODELO DA FOTO ---
  Const gerarPDFContrato = (contrato: any) => {
    Const cli = clientes.find(c => c.id === contrato.clienteId);
    Const dataEmissao = contrato.dataEmissao || new Date().toLocaleDateString('pt-BR');
    Const dataEventoFormatada = contrato.dataEvento ? New Date(contrato.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';
    
    Const nomeEmpresaExibir = nomeFantasiaPerfil || nomeLojaPerfil || 'Empresa Contratada';
    Const cpfCnpjEmpresaExibir = cpfCnpjPerfil || 'Não informado';

    Const clausulasFormatadas = (contrato.clausulas || '').split('\n\n').map((bloco: string) => {
      Const linhas = bloco.split('\n');
      Const titulo = linhas[0] || '';
      Const corpo = linhas.slice(1).join('<br>') || '';
      Return `
        <div style="margin-bottom: 12px;">
          <div style="font-[700]; font-size: 11px; color: #4b0082; text-transform: uppercase;">${titulo}</div>
          <div style="font-size: 11px; color: #4a5568; margin-top: 2px; line-height: 1.3;">${corpo || titulo}</div>
        </div>
      `;
    }).join('');

    Const elemento = document.createElement('div');
    Elemento.innerHTML = `
      <div style="padding: 30px; font-family: system-ui, -apple-system, sans-serif; color: #2d3748; max-width: 750px; margin: 0 auto; background: #fff;">
        
        <!-- CABEÇALHO -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h1 style="color: #4c1d95; margin: 0; font-size: 22px; font-weight: 900; tracking-tight: -0.5px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <p style="color: #94a3b8; font-size: 10px; font-weight: 700; uppercase: uppercase; margin: 3px 0 0 0;">DOCUMENTO COMERCIAL E TERMOS DE ACORDO</p>
          </div>
          <div style="background-color: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: right;">
            <span style="font-size: 8px; font-weight: 800; color: #64748b; uppercase: uppercase; display: block;">DATA DE EMISSÃO</span>
            <span style="font-size: 11px; font-weight: 800; color: #4c1d95; display: block;">${dataEmissao}</span>
          </div>
        </div>

        <!-- BLOCOS DE DADOS DAS PARTES -->
        <div style="display: flex; gap: 12px; margin-bottom: 15px;">
          <div style="flex: 1; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background-color: #581c87; color: white; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase;">1. DADOS DO CONTRATANTE (CLIENTE)</div>
            <div style="padding: 10px; font-size: 11px; background-color: #fafafa; line-height: 1.5;">
              <div><strong>Nome:</strong> ${cli?.nome || 'Não informado'}</div>
              <div><strong>CPF/CNPJ:</strong> ${cli?.cpfCnpj || 'Não informado'}</div>
              <div><strong>Endereço:</strong> ${cli?.endereco || 'Não informado'}</div>
            </div>
          </div>

          <div style="flex: 1; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background-color: #581c87; color: white; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase;">2. DADOS DO CONTRATADO (EMPRESA)</div>
            <div style="padding: 10px; font-size: 11px; background-color: #fafafa; line-height: 1.5;">
              <div><strong>Empresa/Nome:</strong> ${nomeEmpresaExibir}</div>
              <div><strong>CPF/CNPJ:</strong> ${cpfCnpjEmpresaExibir}</div>
              ${enderecoPerfil ? `<div><strong>Endereço:</strong> ${enderecoPerfil}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- BLOCO EVENTO E VALOR -->
        <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 15px;">
          <div style="background-color: #581c87; color: white; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase;">3. DADOS DO EVENTO E VALOR COMBINADO</div>
          <div style="padding: 10px; font-size: 11px; background-color: #fafafa; line-height: 1.6;">
            <div><strong>Tipo de Evento:</strong> ${contrato.tipoEvento || 'Não informado'}</div>
            <div><strong>Data do Evento:</strong> ${dataEventoFormatada}</div>
            <div><strong>Local do Evento:</strong> ${contrato.localEvento || 'Não informado'}</div>
            <div style="color: #581c87; font-size: 13px; font-weight: 900; margin-top: 4px;">Valor Total dos Serviços: R$ ${Number(contrato.valorTotal || 0).toFixed(2)}</div>
            ${dadosBancariosPerfil ? `<div style="margin-top: 6px; font-size: 10px; color: #64748b; background-color: #f1f5f9; padding: 6px; border-radius: 6px;"><strong>Dados para Pagamento (PIX/Banco):</strong> ${dadosBancariosPerfil}</div>` : ''}
          </div>
        </div>

        <!-- CLÁUSULAS -->
        <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 35px;">
          <div style="background-color: #581c87; color: white; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase;">4. CLÁUSULAS E TERMOS DE SERVIÇO</div>
          <div style="padding: 12px; background-color: #fafafa;">
            ${clausulasFormatadas}
          </div>
        </div>

        <!-- ASSINATURAS -->
        <div style="display: flex; justify-content: space-between; gap: 40px; margin-top: 40px; page-break-inside: avoid;">
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #cbd5e1; margin-bottom: 6px;"></div>
            <div style="font-size: 11px; font-weight: 800; color: #1e293b;">${cli?.nome || 'Cliente'}</div>
            <div style="font-size: 8px; font-weight: 700; color: #94a3b8; uppercase: uppercase;">ASSINATURA DO CLIENTE</div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #cbd5e1; margin-bottom: 6px;"></div>
            <div style="font-size: 11px; font-weight: 800; color: #1e293b;">${nomeEmpresaExibir}</div>
            <div style="font-size: 8px; font-weight: 700; color: #94a3b8; uppercase: uppercase;">ASSINATURA DA EMPRESA (CONTRATADO)</div>
          </div>
        </div>

      </div>
    `;

    Const opcoes = { margin: 8, filename: `Contrato_${cli?.nome || 'Cliente'}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' } };
    If ((window as any).html2pdf) { (window as any).html2pdf().from(elemento).set(opcoes).save(); }
  };

  Const enviarContratoWhatsapp = (contrato: any) => {
    Const cli = clientes.find(c => c.id === contrato.clienteId);
    Const fone = cli?.zap ? Cli.zap.replace(/\D/g, '') : '';
    Const msg = `*CONTRATO DE PRESTAÇÃO DE SERVIÇOS*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Evento:* ${contrato.tipoEvento || 'Serviço'}%0A*Data:* ${contrato.dataEvento || 'A combinar'}%0A*Valor Total:* R$ ${Number(contrato.valorTotal || 0).toFixed(2)}%0A---%0AOlá! Segue o resumo do nosso contrato. Acabo de baixar o PDF formal em anexo para você!🏼`;
    Window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  Const dispararPdfAutomaticoCliente = (nomeCliente: string, itens: any[], total: number) => {
    Const elemento = document.createElement('div');
    Const dataEmissao = new Date().toLocaleDateString('pt-BR');
    
    Const linesHtml = itens.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${p.nome}</td>
        <td style="padding: 15px 5px; text-align: center; color: #475569;">${p.qtd}</td>
        <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${Number(p.precoVenda).toFixed(2)}</td>
        <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${(Number(p.precoVenda) * p.qtd).toFixed(2)}</td>
      </tr>
    `).join('');

    Elemento.innerHTML = `
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
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
          <div><strong>Forma de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">PIX / CARTÃO</div></div>
          <div><strong>Condições de pagamento:</strong><div style="margin-top: 4px; color: #475569; font-weight: bold;">A combinar direto no WhatsApp</div></div>
        </div>
      </div>
    `;

    Const opcoes = { margin: 10, filename: `Pedido_${nomeCliente.replace(/\s+/g, '_')}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
    If ((window as any).html2pdf) { (window as any).html2pdf().from(elemento).set(opcoes).save(); }
  };

  Const finalizarPedidoPublicoWhatsapp = () => {
    If (!nomeComprador.trim()) return alert("Por favor, digite seu nome antes de enviar!");
    Const itensSelecionados = produtosPublicosFiltrados.filter(p => carrinho[p.id] > 0);
    If (itensSelecionados.length === 0) return alert("Seu carrinho está vazio!");

    Let textPedido = `*NOVO PEDIDO VIA CATÁLOGO DE VENDAS*%0A`;
    TextPedido += `---%0A`;
    TextPedido += `*Cliente:* ${nomeComprador.trim()}%0A%0A`;
    TextPedido += `*Itens do Pedido:*%0A`;
    
    Let totalGeral = 0;
    Const listaParaPdf: any[] = [];

    ItensSelecionados.forEach(p => {
      Const qtd = carrinho[p.id];
      Const sub = Number(p.precoVenda) * qtd;
      TotalGeral += sub;
      TextPedido += `• ${qtd}x _${p.nome}_ — R$ ${sub.toFixed(2)}%0A`;
      ListaParaPdf.push({ nome: p.nome, qtd: qtd, precoVenda: p.precoVenda });
    });

    TextPedido += `---%0A`;
    TextPedido += `*VALOR TOTAL:* R$ ${totalGeral.toFixed(2)}%0A`;
    TextPedido += `---%0A`;
    TextPedido += `Aguardo a conversa para acertar os detalhes! 🙌`;

    DispararPdfAutomaticoCliente(nomeComprador.trim(), listaParaPdf, totalGeral);

    Const numeroLimpo = zapDaLojaPublica.replace(/\D/g, '');
    If (numeroLimpo) { window.open(`https://wa.me/55${numeroLimpo}?text=${textPedido}`, '_blank'); } 
    Else { window.open(`https://wa.me/?text=${textPedido}`, '_blank'); }
  };

  Const lancarVendaBalcaoInterno = async () => {
    Const itensNoCarrinho = produtos.filter(p => carrinhoInterno[p.id] > 0);
    If (itensNoCarrinho.length === 0) return alert("Selecione ao menos 1 item com + e - no balcão!");
    
    Let stringNomeCombo = "";
    Let totalGeral = 0;
    Const arrayItensSalvar: any[] = [];
    
    ItensNoCarrinho.forEach((p, idx) => {
      Const qtd = carrinhoInterno[p.id];
      TotalGeral += Number(p.precoVenda) * qtd;
      StringNomeCombo += `${qtd}x ${p.nome}${idx < itensNoCarrinho.length - 1 ? '\n' : ''}`;
      
      ArrayItensSalvar.push({
        Nome: p.nome,
        Qtd: qtd,
        PrecoVenda: Number(p.precoVenda)
      });
    });

    Const nomeFinalDoRegistro = nomeKitBalcao.trim() ? NomeKitBalcao.trim() : stringNomeCombo;
    Const prazoFinalVenda = prazoBalcao ? PrazoBalcao : new Date().toISOString().split('T')[0];

    Try {
      Await addDoc(collection(db, "pedidos"), {
        NomeProd: nomeFinalDoRegistro,
        Preco: totalGeral.toFixed(2),
        ClienteId: clienteBalcao,
        Prazo: prazoFinalVenda,
        QtdPed: "1",
        VHora: "0",
        TGasto: "0",
        Custos: { embalagem: '0', impressao: '0', energia: '0', outros: '0' },
        Lucro: "0",
        Desconto: "0",
        UserId: user.uid,
        PrecoManual: totalGeral.toFixed(2),
        ObsPedido: "",
        Data: new Date().toLocaleDateString('pt-BR'),
        Status: 'Pendente',
        ItensCombo: arrayItensSalvar,
        ModoCalculo: 'peca'
      });

      SetCarrinhoInterno({});
      SetClienteBalcao('');
      SetNomeKitBalcao('');
      SetPrazoBalcao('');
      Alert("Combo lançado com sucesso no Histórico! 🚀");
      SetActiveTab('pedidos');
    } catch {
      Alert("Erro ao lançar venda no balcão.");
    }
  };

  // --- DASHBOARD METRICS ---
  Const dashboardMetrics = useMemo(() => {
    Const agora = new Date();
    Const mesAtual = agora.getMonth() + 1;
    Const anoAtual = agora.getFullYear();

    Const pedidosDoMes = pedidos.filter(p => {
      Const isVendido = p.status === 'Vendido 💰' || p.status === 'Vendido';
      If (!isVendido || !p.data) return false;

      Const partes = p.data.split('/');
      If (partes.length === 3) {
        Const mesPedido = Number(partes[1]);
        Const anoPedido = Number(partes[2]);
        Return mesPedido === mesAtual && anoPedido === anoAtual;
      }
      Return false;
    });

    Const faturamentoMes = pedidosDoMes.reduce((acc, p) => acc + Number(p.preco || 0), 0);
    Const pendentesCount = pedidos.filter(p => p.status === 'Pendente' || !p.status).length;
    Const estoqueCriticoCount = materiais.filter(m => Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0)).length;

    Return { 
      Faturamento: faturamentoMes.toFixed(2), 
      Pendentes: pendentesCount, 
      Criticos: estoqueCriticoCount, 
      TotalClientes: clientes.length 
    };
  }, [pedidos, materiais, clientes]);

  Const historicoFinanceiroMensal = useMemo(() => {
    Const agrupado: { [key: string]: { total: number; qtd: number; mesAnoTexto: string; itensVendidos: any[] } } = {};
    Const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    Pedidos.forEach(p => {
      Const isVendido = p.status === 'Vendido 💰' || p.status === 'Vendido';
      If (!isVendido || !p.data) return;

      Const partes = p.data.split('/');
      If (partes.length === 3) {
        Const mes = Number(partes[1]);
        Const ano = Number(partes[2]);
        Const chave = `${ano}-${String(mes).padStart(2, '0')}`;
        Const nomeMesTexto = `${nomesMeses[mes - 1]} / ${ano}`;

        If (!agrupado[chave]) {
          Agrupado[chave] = { total: 0, qtd: 0, mesAnoTexto: nomeMesTexto, itensVendidos: [] };
        }

        Agrupado[chave].total += Number(p.preco || 0);
        Agrupado[chave].qtd += 1;
        Agrupado[chave].itensVendidos.push(p);
      }
    });

    Return Object.keys(agrupado)
      .sort((a, b) => b.localeCompare(a))
      .map(chave => ({
        Chave,
        ...agrupado[chave]
      }));
  }, [pedidos]);

  Const historicoFiltradoPorData = useMemo(() => {
    If (mesFiltroHistorico === 'Todos' && anoFiltroHistorico === 'Todos') {
      Return historicoFinanceiroMensal;
    }

    Return historicoFinanceiroMensal.filter(item => {
      Const [ano, mes] = item.chave.split('-');
      Const matchMes = mesFiltroHistorico === 'Todos' || Number(mes) === Number(mesFiltroHistorico);
      Const matchAno = anoFiltroHistorico === 'Todos' || Number(ano) === Number(anoFiltroHistorico);
      Return matchMes && matchAno;
    });
  }, [historicoFinanceiroMensal, mesFiltroHistorico, anoFiltroHistorico]);

  Const resumenFinanceiro = useMemo(() => {
    Const qtdNum = Math.max(1, Number(qtdPed) || 1);

    If (precoManual !== null) {
      Const baseVal = Number(precoManual || 0);
      Const totalCatalogo = modoCalculo === 'peca' ? BaseVal * qtdNum : baseVal;
      Const semDesconto = totalCatalogo - Number(desconto || 0);
      Const custoPecaUnitario = modoCalculo === 'peca' ? BaseVal : baseVal / qtdNum;

      Return { 
        Materiais: "0.00", 
        MaoObra: "0.00", 
        Extras: "0.00", 
        Deprec: "0.00", 
        CustoPeca: custoPecaUnitario.toFixed(2), 
        LucroLivre: "0.00", 
        Final: isNaN(semDesconto) ? "0.00" : semDesconto.toFixed(2) 
      };
    }

    Const totalMaterials = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 0)), 0);
    Const totalMaoObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    Const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    
    Let totalDesgasteMaquinas = 0;
    Const dias = Number(financasFixo.diasTrabalho || 20);
    Const horas = Number(financasFixo.horasDia || 8);
    Const totalHorasMes = dias * horas || 160;
    Const tempoEmHoras = Number(tGasto || 0) / 60;

    EquipamentosSelecionados.forEach(idEquip => {
      Const eq = equipamentos.find(e => e.id === idEquip);
      If (eq) {
        Const valorEquip = Number(eq.valorPago || 0);
        Const mesesVida = Number(eq.durabilidadeAnos || 2) * 12;
        Const custoHoraEquip = (valorEquip / mesesVida) / totalHorasMes;
        TotalDesgasteMaquinas += custoHoraEquip * tempoEmHoras;
      }
    });

    Const custoTotalBasePeca = totalMaterials + totalMaoObra + totalExtras + totalDesgasteMaquinas;
    
    Let custoTotalInvestido = 0;
    Let valorLucroLivre = 0;
    Let precoFinalCalculado = 0;

    If (modoCalculo === 'peca') {
      CustoTotalInvestido = custoTotalBasePeca * qtdNum;
      ValorLucroLivre = custoTotalInvestido * (Number(lucro || 0) / 100);
      PrecoFinalCalculado = (custoTotalInvestido + valorLucroLivre) - Number(desconto || 0);
    } else {
      CustoTotalInvestido = custoTotalBasePeca;
      ValorLucroLivre = custoTotalInvestido * (Number(lucro || 0) / 100);
      PrecoFinalCalculado = (custoTotalInvestido + valorLucroLivre) - Number(desconto || 0);
    }

    Const custoUnitarioExibicao = modoCalculo === 'peca' ? CustoTotalBasePeca : (custoTotalBasePeca / qtdNum);

    Return { 
      Materiais: totalMaterials.toFixed(2), 
      MaoObra: totalMaoObra.toFixed(2), 
      Extras: totalExtras.toFixed(2), 
      Deprec: totalDesgasteMaquinas.toFixed(2), 
      CustoPeca: custoUnitarioExibicao.toFixed(2), 
      LucroLivre: valorLucroLivre.toFixed(2), 
      Final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2) 
    };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto, precoManual, equipamentos, equipamentosSelecionados, financasFixo, modoCalculo]);

  UseEffect(() => {
    SetPrecoFinalDigitado(resumenFinanceiro.final);
  }, [resumenFinanceiro.final]);

  Const enviarZap = (p: any) => {
    Const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    Const dataP = p.prazo ? New Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    Const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* %0A${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    Const fone = cli?.zap ? Cli.zap.replace(/\D/g, '') : '';
    Window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  Const gerarPDF = (p: any) => {
    Const idDoCliente = p.clienteId || p.clienteSel || '';
    Const cli = clientes.find(c => c.id === idDoCliente);
    
    Const dataEmissao = p.data || new Date().toLocaleDateString('pt-BR');
    Const hoje = new Date(); hoje.setDate(hoje.getDate() + 7);
    Const dataValidade = hoje.toLocaleDateString('pt-BR');
    Const dataPrazo = p.prazo ? New Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'A combinar';
    Const totalNum = Number(p.preco || 0);

    Let htmlLinhasTabela = '';

    If (p.itensCombo && Array.isArray(p.itensCombo) && p.itensCombo.length > 0) {
      HtmlLinhasTabela = p.itensCombo.map((item: any) => {
        Const qtd = Number(item.qtd || 1);
        Const precoVenda = Number(item.precoVenda || 0);
        Const subtotal = qtd * precoVenda;
        
        Return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 14px; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding: 15px 5px; font-weight: bold; color: #1e293b; text-align: left;">${item.nome}</td>
            <td style="padding: 15px 5px; text-align: center; color: #475569;">${qtd}</td>
            <td style="padding: 15px 5px; text-align: right; color: #475569;">R$ ${precoVenda.toFixed(2)}</td>
            <td style="padding: 15px 5px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${subtotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    } 
    Else {
      Const textoProduto = String(p.nomeProd || 'Produto Não Informado');
      Const quantidadeItem = Number(p.qtdPed || 1);
      Const unitario = p.precoManual ? Number(p.precoManual) : (totalNum / quantidadeItem);

      Let htmlDetalhamentoKit = '';
      If (p.detalhamentoPed && p.detalhamentoPed.trim()) {
        Const listaItens = p.detalhamentoPed.split('\n').filter((l: string) => l.trim() !== '');
        Const lisHtml = listaItens.map((i: string) => `<li style="margin-bottom: 3px;">${i.replace(/^[\s•*-]+/, '')}</li>`).join('');
        
        HtmlDetalhamentoKit = `
          <div style="margin-top: 8px; padding: 10px 12px; background-color: #fcfaff; border-left: 3px solid ${themeColors.primary}; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: bold; color: ${themeColors.primary}; margin-bottom: 4px; text-transform: uppercase; tracking-wide: 0.5px;">Composição / Itens Incluso no Kit:</div>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.4;">
              ${lisHtml}
            </ul>
          </div>
        `;
      }

      HtmlLinhasTabela = `
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

    Const cabecalhoNomeHtml = nomeLojaPerfil ? NomeLojaPerfil : "PrecificaJá";
    Const cabecalhoLogoHtml = logoLojaPerfil ? `<img src="${logoLojaPerfil}" style="max-height: 70px; max-width: 160px; object-fit: contain; display: block;"/>` : '';

    Const elemento = document.createElement('div');
    Elemento.innerHTML = `
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
    
    Const opcoes = { margin: [10, 10, 10, 10], filename: `Pedido_${p.id || 'Venda'}.pdf`, html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, jsPDF: { format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
    (window as any).html2pdf().from(elemento).set(opcoes).save();
  };

  Const handleAuth = async () => {
    Try {
      If (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      Else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert("E-mail ou senha incorretos!"); }
  };

  Const confirmarExcluir = async (tipo: string, id: string) => {
    If (window.confirm(`Excluir ${tipo}?`)) {
      Let colecao = "";
      If (tipo === 'pedido') colecao = "pedidos";
      Else if (tipo === 'cliente') colecao = "clientes";
      Else if (tipo === 'produto') colecao = "produtos";
      Else if (tipo === 'equipamento') colecao = "equipamentos";
      Else if (tipo === 'material') colecao = "materiais";
      Else if (tipo === 'anotacao') colecao = "anotacoes";
      Else if (tipo === 'fornecedor') colecao = "fornecedores";
      Else if (tipo === 'contrato') colecao = "contratos";

      Await deleteDoc(doc(db, colecao, id));
    }
  };

  Const confirmarVendaPedido = async (pedido: any) => {
    If (pedido.materiaisUsados && pedido.materiaisUsados.length > 0) {
      For (const m of pedido.materiaisUsados) {
        Const matDoBanco = materiais.find(item => item.id === m.id);
        If (matDoBanco) {
          Const estoqueFiscal = Number(matDoBanco.qtdAtual || 0);
          Const gastoTotal = Number(m.qtdUsada || 0) * Number(pedido.qtdPed || 1);
          Await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, estoqueFiscal - gastoTotal) });
        }
      }
    } 
    
    Const textoVenda = String(pedido.nomeProd || '');
    If (textoVenda.includes('x ')) {
      Const partesItens = textoVenda.split(/\n| \+ /);
      For (const parte of partesItens) {
        Const regexMatch = parte.trim().match(/^(\d+)x\s+(.+)$/i);
        If (regexMatch) {
          Const qtdVendida = Number(regexMatch[1]);
          Const nomeProdutoTexto = regexMatch[2].trim().toLowerCase();
          Const materialCorrespondente = materiais.find(m => nomeProdutoTexto.includes(m.nome.toLowerCase()) || m.nome.toLowerCase().includes(nomeProdutoTexto));
          If (materialCorrespondente) {
            Const estoqueAtual = Number(materialCorrespondente.qtdAtual || 0);
            Const novoEstoque = Math.max(0, estoqueAtual - qtdVendida);
            Await updateDoc(doc(db, "materiais", materialCorrespondente.id), { qtdAtual: novoEstoque });
          }
        }
      }
    }
    Await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰' });
    Alert("Venda confirmada!");
  };

  Const cancelarPedidoSemExcluir = async (id: string) => {
    If (window.confirm("Deseja realmente mover este orçamento para os cancelados?")) {
      Await updateDoc(doc(db, "pedidos", id), { status: 'Cancelado ❌' });
      Alert("Pedido cancelado!");
    }
  };

  Const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    Const file = e.target.files?.[0];
    If (!file || !user) return;
    SetSubindoImagem(true);
    Try {
      Const nomeArquivo = `${user.uid}_${Date.now()}_${file.name}`;
      Const imagemRef = ref(storage, `produtos/${nomeArquivo}`);
      Await uploadBytes(imagemRef, file);
      Const urlDisponivel = await getDownloadURL(imagemRef);
      SetNovoProdCatalogo(prev => ({ ...prev, urlImagem: urlDisponivel }));
      Alert("Foto carregada com sucesso! 📸");
    } catch (error) { alert("Erro ao subir a foto!"); } 
    Finally { setSubindoImagem(false); }
  };

  Const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    Const file = e.target.files?.[0];
    If (!file || !user) return;
    SetSubindoLogo(true);
    Try {
      Const nomeArquivo = `logo_${user.uid}_${Date.now()}_${file.name}`;
      Const logoRef = ref(storage, `logos/${nomeArquivo}`);
      Await uploadBytes(logoRef, file);
      Const urlDisponivel = await getDownloadURL(logoRef);
      SetLogoLojaPerfil(urlDisponivel);
      Alert("Logo carregado com sucesso! Salve o perfil para aplicar. 📸");
    } catch (error) { alert("Erro ao subir o logo!"); }
    Finally { setSubindoLogo(false); }
  };

  Const limparCalculadora = () => {
    SetNomeProd(''); setDetalhamentoPed(''); setQtdPed('1'); setMatsNoPed([]); setVHora('9'); setTGasto('60');
    SetCustos({ embalagem: '0', impressao: custoPorPaginaCalculado.toFixed(2), energia: '0', outros: '0' });
    SetEquipamentosSelecionados([]);
    SetLucro('100'); setDesconto('0'); setPrazo(''); setClienteSel('');
    SetPedidoEditandoId(null); setPrecoManual(null); setDocObsPedido('');
    SetIsDuplicando(false);
    SetModoCalculo('peca');
    SetPrecoFinalDigitado('0.00');
  };

  Const carregarPedidoParaEdicao = (p: any) => {
    SetIsDuplicando(false);
    SetPedidoEditandoId(p.id); setNomeProd(p.nomeProd || ''); setDetalhamentoPed(p.detalhamentoPed || ''); setQtdPed(p.qtdPed || '1'); setVHora(p.vHora || '9'); setTGasto(p.tGasto || '60');
    SetCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    SetLucro(p.lucro || '100'); setDesconto(p.desconto || '0'); setPrazo(p.prazo || ''); setClienteSel(p.clienteId || '');
    SetPrecoManual(p.precoManual || null); setDocObsPedido(p.obsPedido || '');
    SetEquipamentosSelecionados(p.equipamentosSelecionados || []);
    SetModoCalculo(p.modoCalculo || 'peca');

    If (p.materiaisUsados && p.materiaisUsados.length > 0) {
      Const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        Const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        Return { id: mSalvo.id, nome: matDoArmario ? MatDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? MatDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      SetMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }
    
    SetPrecoFinalDigitado(p.preco || '0.00');
    SetActiveTab('criar');
  };

  Const handleDuplicarOrcamento = (p: any) => {
    SetPedidoEditandoId(null); 
    SetIsDuplicando(true);
    SetNomeProd(`${p.nomeProd} (Cópia)`); 
    SetDetalhamentoPed(p.detalhamentoPed || '');
    SetQtdPed(p.qtdPed || '1'); 
    SetVHora(p.vHora || '9'); 
    SetTGasto(p.tGasto || '60');
    SetCustos(p.custos || { embalagem: '0', impressao: '0', energia: '0', outros: '0' });
    SetLucro(p.lucro || '100'); 
    SetDesconto(p.desconto || '0'); 
    SetPrazo(p.prazo || ''); 
    SetClienteSel(''); 
    SetPrecoManual(p.precoManual || null); 
    SetDocObsPedido(p.obsPedido || '');
    SetEquipamentosSelecionados(p.equipamentosSelecionados || []);
    SetModoCalculo(p.modoCalculo || 'peca');

    If (p.materiaisUsados && p.materiaisUsados.length > 0) {
      Const listaReconstruida = p.materiaisUsados.map((mSalvo: any) => {
        Const matDoArmario = materiais.find(item => item.id === mSalvo.id);
        Return { id: mSalvo.id, nome: matDoArmario ? MatDoArmario.nome : mSalvo.nome, qtdUsada: Number(mSalvo.qtdUsada || 1), valor: matDoArmario ? Number(matDoArmario.valor) : Number(mSalvo.valor || 0), qtd: matDoArmario ? Number(matDoArmario.qtd) : Number(mSalvo.qtd || 1), unidade: matDoArmario ? MatDoArmario.unidade : (mSalvo.unidade || 'un') };
      });
      SetMatsNoPed(listaReconstruida);
    } else { setMatsNoPed([]); }
    
    SetPrecoFinalDigitado(p.preco || '0.00');
    SetActiveTab('criar');
    Alert("Orçamento duplicado com sucesso! Defina o cliente e salve. ✨");
  };

  Const venderItemDiretoDoCatalogo = (prod: any) => {
    LimparCalculadora(); setNomeProd(prod.nome); setPrecoManual(prod.precoVenda); setActiveTab('criar');
  };

  Const toggleEquipamento = (id: string) => {
    If (equipamentosSelecionados.includes(id)) {
      SetEquipamentosSelecionados(equipamentosSelecionados.filter(item => item !== id));
    } else {
      SetEquipamentosSelecionados([...equipamentosSelecionados, id]);
    }
  };

  Const toggleCategoriaNoProduto = (catNome: string) => {
    Const jaTem = novoProdCatalogo.categorias?.includes(catNome) || false;
    If(jaTem) {
      SetNovoProdCatalogo({...novoProdCatalogo, categorias: novoProdCatalogo.categorias.filter(c => c !== catNome)});
    } else {
      SetNovoProdCatalogo({...novoProdCatalogo, categorias: [...(novoProdCatalogo.categorias || []), catNome]});
    }
  };

  Const toggleCategoriaNoFornecedor = (catNome: string) => {
    Const jaTem = novoFornecedor.categorias?.includes(catNome) || false;
    If(jaTem) {
      SetNovoFornecedor({...novoFornecedor, categorias: novoFornecedor.categorias.filter(c => c !== catNome)});
    } else {
      SetNovoFornecedor({...novoFornecedor, categorias: [...(novoFornecedor.categorias || []), catNome]});
    }
  };

  Const materiaisFiltrados = useMemo(() => {
    Return materiais.filter(m => 
      M.nome?.toLowerCase().includes(pesquisaMateriais.toLowerCase())
    );
  }, [materiais, pesquisaMateriais]);

  Const produtosPublicosFiltrados = useMemo(() => {
    If (filtroVitrineSelecionado === 'Todos') return produtosPublicos;
    Return produtosPublicos.filter(p => p.categorias && p.categorias.includes(filtroVitrineSelecionado));
  }, [produtosPublicos, filtroVitrineSelecionado]);

  Const proveedoresFiltrados = useMemo(() => {
    Return fornecedores.filter(f => {
      Const matchNome = f.nome?.toLowerCase().includes(pesquisaFornecedores.toLowerCase());
      Const matchCat = filtroFornSelecionado === 'Todos' ? True : (f.categorias && f.categorias.includes(filtroFornSelecionado));
      Return matchNome && matchCat;
    });
  }, [fornecedores, pesquisaFornecedores, filtroFornSelecionado]);

  Const pedidosFiltradosPorStatus = useMemo(() => {
    Return pedidos.filter(p => {
      Const st = p.status || 'Pendente';
      If (filtroStatusPedido === 'Vendido') return st.includes('Vendido');
      If (filtroStatusPedido === 'Cancelado') return st.includes('Cancelado');
      Return st === 'Pendente';
    });
  }, [pedidos, filtroStatusPedido]);

  If (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando o PrecificaJá... 🚀</div>;

  If (!user && !idLojaPublica) {
    Return (
      <Login 
        IsRegistering={isRegistering} setIsRegistering={setIsRegistering}
        Email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        HandleAuth={handleAuth}
      />
    );
  }

  If (idLojaPublica) {
    If (carregandoPublico) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-purple-700">Carregando Vitrine... 🛍️</div>;
    Const totalCarrinho = Object.keys(carrinho).reduce((acc, id) => {
      Const prod = produtosPublicos.find(p => p.id === id);
      Return acc + (prod ? Number(prod.precoVenda) * carrinho[id] : 0);
    }, 0);

    Return (
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
              Const qtdNoCarinho = carrinho[p.id] || 0;
              Return (
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

  Const renderCalculadoraForm = () => (
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
            Type="button"
            OnClick={() => setModoCalculo('peca')}
            Style={{ 
              BackgroundColor: modoCalculo === 'peca' ? ThemeColors.primary : 'transparent', 
              Color: modoCalculo === 'peca' ? '#ffffff' : '#64748b'
            }}
            ClassName={`py-2 px-3 rounded-lg font-bold text-xs transition-all text-center ${
              ModoCalculo === 'peca' ? 'shadow-sm' : ''
            }`}
          >
            Por Peça
          </button>

          <button
            Type="button"
            OnClick={() => setModoCalculo('lote')}
            Style={{ 
              BackgroundColor: modoCalculo === 'lote' ? ThemeColors.primary : 'transparent', 
              Color: modoCalculo === 'lote' ? '#ffffff' : '#64748b'
            }}
            ClassName={`py-2 px-3 rounded-lg font-bold text-xs transition-all text-center ${
              ModoCalculo === 'lote' ? 'shadow-sm' : ''
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
              <div key={p.id} onClick={() => { setNomeProd(p.nome); setPrecoManual(String(p.precoVenda)); setMostrarSeletorCatalogo(false); }} className="bg-white p-2.5 rounded-xl border flex justify-between items-center cursor-pointer hover:border-purple-400 w-full">
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
           Placeholder="Escreva em tópicos o que compõe o kit para sair detalhado no PDF...&#10;Ex:&#10;10 topos de docinho&#10;5 topos de pote&#10;1 cordão de papel de mesa" 
           ClassName="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-semibold border border-transparent focus:border-purple-400 resize-none h-24" 
           Value={detalhamentoPed} 
           OnChange={e => setDetalhamentoPed(e.target.value)} 
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
                  Const selecionado = equipamentosSelecionados.includes(eq.id);
                  Return (
                    <button key={eq.id} type="button" onClick={() => toggleEquipamento(eq.id)} style={{ backgroundColor: selecionado ? ThemeColors.primary : undefined, borderColor: selecionado ? ThemeColors.primary : undefined }} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selecionado ? 'text-white shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
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
                Id="precoFinalInput"
                Type="number" 
                Step="0.01" 
                Style={{ color: themeColors.secondary }}
                ClassName="bg-transparent font-black text-3xl tracking-tighter outline-none w-32 text-right"
                Value={precoFinalDigitado}
                OnChange={e => setPrecoFinalDigitado(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="w-full pt-2 flex justify-center">
          <button 
            Style={{ backgroundColor: themeColors.secondary }}
            OnClick={async () => {
             If(!nomeProd) return alert("Digite o nome do produto!");
             
             Const precoFinalSalvar = Number(precoFinalDigitado || 0).toFixed(2);
             
             Const dadosPedido = { 
               NomeProd, 
               DetalhamentoPed, 
               Preco: precoFinalSalvar, 
               ClienteId: clienteSel, 
               Prazo, 
               QtdPed, 
               VHora, 
               TGasto, 
               Custos, 
               Lucro, 
               Desconto, 
               UserId: user.uid, 
               PrecoManual: precoManual, 
               ObsPedido: docObsPedido, 
               EquipamentosSelecionados, 
               ModoCalculo,
               MateriaisUsados: precoManual ? [] : matsNoPed.map(m => ({ id: m.id, nome: m.nome, qtdUsada: Number(m.qtdUsada || 1) })) 
             };
             
             Try {
               If (pedidoEditandoId) await updateDoc(doc(db, "pedidos", pedidoEditandoId), dadosPedido);
               Else await addDoc(collection(db, "pedidos"), { ...dadosPedido, data: new Date().toLocaleDateString('pt-BR'), status: 'Pendente', userId: user.uid });
               
               GerarPDF({nomeProd, detalhamentoPed, preco: precoFinalSalvar, clienteId: clienteSel, prazo, qtdPed, obsPedido: docObsPedido});
               
               LimparCalculadora(); 
               SetActiveTab('pedidos'); 
               Alert("Orçamento salvo e PDF gerado com sucesso! 🚀");
             } catch (error) {
               Alert("Erro ao salvar dados.");
             }
          }} className="w-full max-w-xs hover:opacity-90 text-white font-black py-4 rounded-[26px] uppercase text-xs shadow-lg transition-transform active:scale-95 tracking-widest text-center">
            Salvar e Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );

  Return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700 w-full relative overflow-x-hidden">
      
      {/* MENU HAMBÚRGUER LATERAL COMPLETO */}
      <div className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`w-72 bg-white h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="space-y-6 overflow-y-auto max-h-[85vh] scrollbar-none">
            <div className="flex justify-between items-center border-b pb-4">
              <div style={{ color: themeColors.primary }} className="font-black text-lg flex items-center gap-2"><Calculator size={22}/> Menu PrecificaJá</div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
            </div>
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'inicio' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'inicio' ? ThemeColors.primary : undefined }}><Home size={16}/> Início</button>
              <button onClick={() => setActiveTab('criar')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'criar' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'criar' ? ThemeColors.primary : undefined }}><Plus size={16}/> Orçar</button>
              <button onClick={() => setActiveTab('contratos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'contratos' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'contratos' ? ThemeColors.primary : undefined }}><FileText size={16}/> Contratos</button>
              
              <button onClick={() => setActiveTab('perfil')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'perfil' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'perfil' ? ThemeColors.primary : undefined }}><Settings size={16}/> Perfil da Loja</button>
              <button onClick={() => setActiveTab('anotacoes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'anotacoes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'anotacoes' ? ThemeColors.primary : undefined }}><Calendar size={16}/> Agenda / Tarefas </button>

              <button onClick={() => { setActiveTab('financeiro'); setSubAbaFinanceiro('geral'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'financeiro' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'financeiro' ? ThemeColors.primary : undefined }}><Calculator size={16}/> Configurações de Custos</button>
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'pedidos' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'pedidos' ? ThemeColors.primary : undefined }}><History size={16}/> Histórico de Orçamentos</button>
              <button onClick={() => setActiveTab('balcao')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'balcao' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'balcao' ? ThemeColors.primary : undefined }}><ShoppingCart size={16}/> Balcão de Vendas Rápido</button>
              <button onClick={() => setActiveTab('catalogo')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'catalogo' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'catalogo' ? ThemeColors.primary : undefined }}><BookOpen size={16}/> Meu Catálogo Visual</button>
              
              <button onClick={() => setActiveTab('fornecedores')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'fornecedores' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'fornecedores' ? ThemeColors.primary : undefined }}><Globe size={16}/> Biblioteca Fornecedores </button>
              
              <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'materiais' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'materiais' ? ThemeColors.primary : undefined }}><Package size={16}/> Armário / Insumos</button>
              <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs ${activeTab === 'clientes' ? 'bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`} style={{ color: activeTab === 'clientes' ? ThemeColors.primary : undefined }}><User size={16}/> Meus Clientes</button>
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
        <div style={{ color: themeColors.primary }} className="font-black text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <div className="w-10"></div> 
      </header>

      <div className="p-4 max-w-xl mx-auto w-full">
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
                 Style={{ backgroundColor: themeColors.secondary }}
                 ClassName="p-6 rounded-[35px] shadow-md cursor-pointer active:scale-95 transition-all text-white flex justify-between items-center w-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Calculadora Integrada</p>
                <h3 className="text-xl font-black mt-0.5 tracking-tight">Novo Orçamento Rápido 🚀</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Calculator size={24}/>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[35px] border shadow-sm w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 style={{ color: themeColors.primary }} className="font-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Calendar size={16}/> Agenda da Semana
                </h3>
                <span style={{ color: themeColors.primary }} className="text-[10px] bg-purple-50 px-2 py-1 rounded-md font-bold uppercase">Mês Atual</span>
              </div>
              
              <div className="flex justify-between gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
                {proximosSeteDias.map((dia) => {
                  Const isActive = diaSelecionadoAgenda === dia.stringData;
                  Return (
                    <div 
                      Key={dia.stringData} 
                      OnClick={() => setDiaSelecionadoAgenda(dia.stringData)}
                      ClassName="flex flex-col items-center gap-1 cursor-pointer min-w-[46px] select-none"
                    >
                      <span style={{ color: isActive ? ThemeColors.secondary : undefined }} className={`text-[10px] font-bold ${!isActive ? 'text-slate-400' : 'font-extrabold'}`}>
                        {dia.diaSemanaTexto}
                      </span>
                      <div 
                        Style={{ backgroundColor: isActive ? ThemeColors.secondary : undefined, borderColor: isActive ? ThemeColors.secondary : undefined }}
                        ClassName={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all border ${isActive ? 'text-white shadow-md scale-105' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
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

        {/* TELA DE PERFIL DA LOJA & DADOS CADASTRAIS */}
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
              </div>

              {/* PAINEL DE PERSONALIZAÇÃO DE CORES */}
              <div className="border-t pt-6 mb-6">
                <h3 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest mb-1">
                  <Palette size={18}/> Paleta de Cores do App
                </h3>
                <p className="text-slate-400 text-[11px] mb-4">Escolha um tema pronto ou monte a sua combinação livremente:</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PRESET_PALETTES.map(preset => (
                    <button
                      Key={preset.id}
                      Type="button"
                      OnClick={() => setThemeColors({
                        Primary: preset.primary,
                        PrimaryHover: preset.primaryHover,
                        Secondary: preset.secondary,
                        SecondaryHover: preset.secondaryHover
                      })}
                      ClassName="p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all border-slate-100 bg-slate-50 hover:border-slate-300"
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
                        Type="color" 
                        Value={themeColors.primary} 
                        OnChange={e => setThemeColors(prev => ({ 
                          ...prev, 
                          Primary: e.target.value, 
                          PrimaryHover: e.target.value 
                        }))}
                        ClassName="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input 
                        Type="text"
                        Value={themeColors.primary}
                        OnChange={e => setThemeColors(prev => ({ 
                          ...prev, 
                          Primary: e.target.value, 
                          PrimaryHover: e.target.value 
                        }))}
                        ClassName="w-full text-xs font-mono font-bold uppercase outline-none"
                        MaxLength={7}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border">
                      <input 
                        Type="color" 
                        Value={themeColors.secondary} 
                        OnChange={e => setThemeColors(prev => ({ 
                          ...prev, 
                          Secondary: e.target.value, 
                          SecondaryHover: e.target.value 
                        }))}
                        ClassName="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input 
                        Type="text"
                        Value={themeColors.secondary}
                        OnChange={e => setThemeColors(prev => ({ 
                          ...prev, 
                          Secondary: e.target.value, 
                          SecondaryHover: e.target.value 
                        }))}
                        ClassName="w-full text-xs font-mono font-bold uppercase outline-none"
                        MaxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                Style={{ backgroundColor: themeColors.primary }}
                OnClick={async () => {
                Try {
                  Await setDoc(doc(db, "configuracoes_loja", user.uid), {
                    NomeLoja: nomeLojaPerfil.trim(),
                    NomeFantasia: nomeFantasiaPerfil.trim(),
                    CpfCnpj: cpfCnpjPerfil.trim(),
                    Telefone: telefonePerfil.trim(),
                    Email: emailPerfil.trim(),
                    Cep: cepPerfil.trim(),
                    Endereco: enderecoPerfil.trim(),
                    Cidade: cidadePerfil.trim(),
                    Estado: estadoPerfil.trim(),
                    DadosBancarios: dadosBancariosPerfil.trim(),
                    LogoUrl: logoLojaPerfil,
                    ThemeColors: themeColors
                  }, { merge: true });
                  Alert("Perfil e dados da empresa salvos com sucesso! 🚀");
                  SetActiveTab('inicio');
                } catch {
                  Alert("Erro ao salvar as configurações da empresa.");
                }
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md transition-all" disabled={subindoLogo}>
                Salvar Configurações da Marca
              </button>
            </div>
          </div>
        )}

        {/* ABA NOVA: GERENCIADOR DE CONTRATOS */}
        {activeTab === 'contratos' && (
          <div className="space-y-6 pt-2 w-full animate-fadeIn">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                <FileText size={18}/> {novoContrato.id ? '✏️ Editando Contrato' : 'Gerar Novo Contrato'}
              </h2>

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

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Cláusulas e Termos do Contrato</label>
                  <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-slate-800 outline-none border focus:border-purple-400 h-32 resize-none text-xs leading-relaxed" value={novoContrato.clausulas} onChange={e => setNovoContrato({...novoContrato, clausulas: e.target.value})} />
                </div>
              </div>

              <button 
                Style={{ backgroundColor: themeColors.primary }}
                OnClick={async () => {
                If (!novoContrato.clienteId || !novoContrato.valorTotal) return alert("Selecione o cliente e o valor total!");
                
                Const dadosContrato = {
                  ClienteId: novoContrato.clienteId,
                  TipoEvento: novoContrato.tipoEvento,
                  DataEvento: novoContrato.dataEvento,
                  LocalEvento: novoContrato.localEvento,
                  ValorTotal: novoContrato.valorTotal,
                  Clausulas: novoContrato.clausulas,
                  DataEmissao: new Date().toLocaleDateString('pt-BR'),
                  UserId: user.uid
                };

                Try {
                  If (novoContrato.id) {
                    Await updateDoc(doc(db, "contratos", novoContrato.id), dadosContrato);
                    Alert("Contrato atualizado com sucesso!");
                  } else {
                    Await addDoc(collection(db, "contratos"), dadosContrato);
                    Alert("Contrato gerado com sucesso!");
                  }

                  GerarPDFContrato(dadosContrato);
                  SetNovoContrato({ id: '', clienteId: '', tipoEvento: '', dataEvento: '', localEvento: '', valorTotal: '', clausulas: novoContrato.clausulas });
                } catch {
                  Alert("Erro ao salvar o contrato.");
                }
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                {novoContrato.id ? 'Salvar Alterações do Contrato' : 'Salvar e Gerar PDF do Contrato 📄'}
              </button>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">Seus Contratos Emitidos</h3>
            <div className="space-y-3 w-full">
              {contratos.map(c => {
                Const cli = clientes.find(item => item.id === c.clienteId);
                Return (
                  <div key={c.id} className="bg-white p-5 rounded-[30px] border shadow-sm flex flex-col gap-3 w-full">
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <span style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase tracking-wider block">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{cli?.nome || 'Cliente não identificado'}</h4>
                        <p className="text-xs text-slate-500 mt-1">Evento: <strong>{c.tipoEvento || 'Não informado'}</strong> | Data: <strong>{c.dataEvento || 'A combinar'}</strong></p>
                      </div>
                      <div style={{ color: themeColors.primary }} className="font-black text-lg">
                        R$ {Number(c.valorTotal || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 border-t pt-3 w-full">
                      <button onClick={() => setNovoContrato({ id: c.id, clienteId: c.clienteId, tipoEvento: c.tipoEvento || '', dataEvento: c.dataEvento || '', localEvento: c.localEvento || '', valorTotal: c.valorTotal || '', clausulas: c.clausulas || novoContrato.clausulas })} style={{ color: themeColors.primary }} className="p-2 bg-purple-50 rounded-xl"><Edit2 size={16}/></button>
                      
                      <button onClick={() => setNovoContrato({ id: '', clienteId: c.clienteId, tipoEvento: `${c.tipoEvento} (Cópia)`, dataEvento: c.dataEvento || '', localEvento: c.localEvento || '', valorTotal: c.valorTotal || '', clausulas: c.clausulas || novoContrato.clausulas })} title="Duplicar Contrato" className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Copy size={16}/></button>
                      
                      <button onClick={() => gerarPDFContrato(c)} style={{ color: themeColors.secondary }} className="p-2 bg-orange-50 rounded-xl"><Printer size={16}/></button>
                      
                      <button onClick={() => enviarContratoWhatsapp(c)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><MessageCircle size={16}/></button>
                      
                      <button onClick={() => confirmarExcluir('contrato', c.id)} className="p-2 text-red-300"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              })}

              {contratos.length === 0 && (
                <p className="text-center font-bold text-xs text-slate-400 py-8 italic">Nenhum contrato gerado ainda. 📄</p>
              )}
            </div>
          </div>
        )}

        {/* TELA DE AGENDA / COMPROMISSOS COM PRAZOS */}
        {activeTab === 'anotacoes' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-8 rounded-[40px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2"><Calendar size={20}/> Criar Nova Tarefa / Lembrete</h2>
              <p className="text-slate-400 text-[11px] mb-4">Gerencie as pendências e compras do seu negócio por data. O que você colocar aqui alimenta o painel da sua Tela Inicial.</p>
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">O que precisa fazer?</label>
              <input placeholder="Ex: Comprar papel fotográfico A4 / Entregar caneca do cliente" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none border focus:border-purple-400 font-bold text-sm" value={novaAnotacao.titulo} onChange={e => setNovaAnotacao({...novaAnotacao, titulo: e.target.value})} />
              
              <div className="mb-4 w-full">
                <label style={{ color: themeColors.secondary }} className="text-[10px] font-bold uppercase ml-1">Data Limite / Prazo</label>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm block mt-1" value={novaAnotacao.dataPrazo} onChange={e => setNovaAnotacao({...novaAnotacao, dataPrazo: e.target.value})} />
              </div>

              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Detalhes Adicionais (Opcional)</label>
              <textarea placeholder="Escreva informações extras ou observações aqui..." className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none border focus:border-purple-400 resize-none h-16 text-sm font-semibold" value={novaAnotacao.conteudo} onChange={e => setNovaAnotacao({...novaAnotacao, conteudo: e.target.value})} />
              
              <button 
                Style={{ backgroundColor: themeColors.secondary }}
                OnClick={async () => {
                If(!novaAnotacao.titulo) return alert("Sua tarefa precisa de uma descrição básica!");
                Const dadosNota = { titulo: novaAnotacao.titulo, conteudo: novaAnotacao.conteudo || '', dataPrazo: novaAnotacao.dataPrazo, concluido: false, userId: user.uid, dataCriacao: new Date().toLocaleDateString('pt-BR') };
                
                If (novaAnotacao.id) await updateDoc(doc(db, "anotacoes", novaAnotacao.id), dadosNota);
                Else await addDoc(collection(db, "anotacoes"), dadosNota);
                
                SetNovaAnotacao({ id: '', titulo: '', conteudo: '', dataPrazo: new Date().toISOString().split('T')[0] });
                Alert("Agendado com sucesso! 📅✨");
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-md">
                {novaAnotacao.id ? 'Atualizar Compromisso' : 'Agendar Tarefa'}
              </button>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2 mt-4">Lista Geral de Pendências</h3>
            <div className="grid grid-cols-1 gap-3 w-full">
              {anotacoes.map(item => {
                Const dataFormatada = item.dataPrazo ? Item.dataPrazo.split('-').reverse().slice(0, 2).join('/') : '';
                Return (
                  <div key={item.id} className={`bg-white p-5 rounded-3xl border shadow-sm w-full flex flex-col gap-2 relative ${item.concluido ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start anonymity-wrapper w-full">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button onClick={() => toggleStatusAnotacao(item.id, item.concluido)} style={{ color: themeColors.primary }} className="mt-0.5 shrink-0">
                          {item.concluido ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-black text-slate-800 text-base break-words ${item.concluido ? 'line-through text-slate-400' : ''}`}>
                            {item.titulo}
                          </h4>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span style={{ color: themeColors.primary }} className="text-[9px] bg-purple-50 px-2 py-0.5 rounded font-black uppercase">🗓️ Prazo: {dataFormatada}</span>
                            {item.concluido && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">Concluído</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => setNovaAnotacao({ id: item.id, titulo: item.titulo, conteudo: item.conteudo, dataPrazo: item.dataPrazo || new Date().toISOString().split('T')[0] })} className="text-orange-400 p-2 hover:bg-orange-50 rounded-xl"><Edit2 size={16}/></button>
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

        {/* TELA DE CONFIGURAÇÃO DE CUSTOS FIXOS */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 pt-2 w-full">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full border flex-wrap">
              <button onClick={() => setSubAbaFinanceiro('geral')} style={{ color: subAbaFinanceiro === 'geral' ? ThemeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'geral' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Geral</button>
              <button onClick={() => setSubAbaFinanceiro('impressao')} style={{ color: subAbaFinanceiro === 'impressao' ? ThemeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'impressao' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Impressão 🖨️</button>
              <button onClick={() => setSubAbaFinanceiro('equipamentos')} style={{ color: subAbaFinanceiro === 'equipamentos' ? ThemeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'equipamentos' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Máquinas</button>
              <button onClick={() => setSubAbaFinanceiro('historico')} style={{ color: subAbaFinanceiro === 'historico' ? ThemeColors.primary : undefined }} className={`flex-1 min-w-[70px] py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${subAbaFinanceiro === 'historico' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Histórico 📊</button>
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

                <button 
                  Style={{ backgroundColor: themeColors.primary }}
                  OnClick={async () => {
                  Await setDoc(doc(db, "configuracoes_financeiras", user.uid), financasFixo, { merge: true });
                  
                  Const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                  Const intentCustos = Number(financasFixo.salario || 0) + Number(financasFixo.aluguel || 0) + Number(financasFixo.internet || 0) + Number(financasFixo.luz || 0) + Number(financasFixo.outros || 0);
                  If (intentCustos > 0) setVHora((intentCustos / totalHoras).toFixed(2));
                  
                  Alert("Custos salvos com sucesso! O valor sugerido para a hora foi atualizado na calculadora. 🎉");
                }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                  Salvar Configurações Fixas
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
                  Style={{ backgroundColor: themeColors.secondary }}
                  OnClick={async () => {
                  Try {
                    Await setDoc(doc(db, "configuracoes_financeiras", user.uid), {
                      PrecoTinta,
                      UnidadeTinta,
                      QtdCores,
                      PaginasConjunto,
                      CustoPorPaginaCalculado: custoPorPaginaCalculado.toFixed(4)
                    }, { merge: true });
                    
                    SetCustos(prev => ({ ...prev, impressao: custoPorPaginaCalculado.toFixed(2) }));
                    Alert("Subcategoria de Impressão gravada! Taxa vinculada com sucesso à calculadora de orçamento. 🚀");
                  } catch {
                    Alert("Erro ao salvar dados de impressão.");
                  }
                }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md mt-4 transition-colors">
                  Salvar Subcategoria de Custo
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
                    Style={{ backgroundColor: themeColors.secondary }}
                    OnClick={async () => {
                    If(!novoEquipamento.nome || !novoEquipamento.valorPago) return alert("Preencha o nome e o preço do equipamento!");
                    Const d = { nome: novoEquipamento.nome, valorPago: Number(novoEquipamento.valorPago), durabilidadeAnos: Number(novoEquipamento.durabilidadeAnos), userId: user.uid };
                    If (novoEquipamento.id) await updateDoc(doc(db, "equipamentos", novoEquipamento.id), d);
                    Else await addDoc(collection(db, "equipamentos"), d);
                    SetNovoEquipamento({ id: '', nome: '', valorPago: '', durabilidadeAnos: '2' });
                    Alert("Equipamento salvo!");
                  }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md">
                    Salvar Equipamento
                  </button>
                </div>

                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">Equipamentos Cadastrados</h3>
                <div className="space-y-2 w-full">
                  {equipamentos.map(eq => {
                    Const meses = Number(eq.durabilidadeAnos || 2) * 12;
                    Const totalHoras = Number(financasFixo.diasTrabalho || 20) * Number(financasFixo.horasDia || 8);
                    Const descHora = (Number(eq.valorPago || 0) / meses) / totalHoras;
                    Return (
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

            {subAbaFinanceiro === 'historico' && (
              <div className="bg-white p-6 rounded-[35px] shadow-md border w-full animate-fadeIn space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><DollarSign size={18}/> Histórico Financeiro Mensal</h2>
                    <p className="text-slate-400 text-[11px] mt-0.5">Consulte as vendas fechadas de qualquer época do ano:</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-2xl" style={{ color: themeColors.primary }}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mês de Referência</label>
                    <select 
                      ClassName="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" 
                      Value={mesFiltroHistorico} 
                      OnChange={e => setMesFiltroHistorico(e.target.value)}
                    >
                      <option value="Todos">📅 Todos os Meses</option>
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Ano de Referência</label>
                    <select 
                      ClassName="w-full p-2.5 bg-white rounded-xl text-xs font-bold border outline-none text-slate-700" 
                      Value={anoFiltroHistorico} 
                      OnChange={e => setAnoFiltroHistorico(e.target.value)}
                    >
                      <option value="Todos">🗓️ Todos os Anos</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {historicoFiltradoPorData.map(item => {
                    Const isExpanded = mesExpandido === item.chave;
                    Return (
                      <div key={item.chave} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all">
                        <div 
                          OnClick={() => setMesExpandido(isExpanded ? Null : item.chave)}
                          ClassName="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                        >
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
                              {item.mesAnoTexto}
                            </p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                              {item.qtd} {item.qtd === 1 ? 'venda concluída' : 'vendas concluídas'} • Clique para ver itens 🔍
                            </p>
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
                                Const cli = clientes.find(c => c.id === p.clienteId);
                                Return (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className="font-bold text-slate-800 break-words whitespace-pre-line">{p.nomeProd}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        👤 {cli?.nome || 'Cliente não informado'} • 🗓️ {p.data}
                                      </p>
                                    </div>
                                    <div className="font-black text-slate-700 text-sm shrink-0">
                                      R$ {Number(p.preco || 0).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {historicoFiltradoPorData.length === 0 && (
                    <p className="text-center text-xs font-bold text-slate-400 py-8 italic">
                      Nenhuma venda finalizada encontrada para este filtro de data. 🎉
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* BALCÃO DE VENDAS RÁPIDO */}
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
                    Style={{ backgroundColor: themeColors.secondary }}
                    OnClick={async () => {
                    If(!zapDonaConta.trim()) return alert("Digite o número!");
                    Try { await setDoc(doc(db, "configuracoes_loja", user.uid), { whatsapp: zapDonaConta.trim() }, { merge: true }); alert("WhatsApp salvo!"); } 
                    Catch { alert("Erro ao salvar."); }
                  }} className="text-white text-xs font-black uppercase px-4 rounded-xl shadow hover:opacity-90">Salvar</button>
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
                  Placeholder="Ex: Kit Dia dos Namorados, Kit Casal..." 
                  ClassName="w-full p-3.5 bg-slate-800/80 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:border-purple-400"
                  Value={nomeKitBalcao}
                  OnChange={e => setNomeKitBalcao(e.target.value)}
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
                  Type="date" 
                  ClassName="w-full p-3.5 bg-slate-800/80 rounded-xl text-xs font-bold text-white border border-slate-700 outline-none focus:border-purple-400 block"
                  Value={prazoBalcao} 
                  OnChange={e => setPrazoBalcao(e.target.value)} 
                />
              </div>

              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl space-y-2 max-h-64 overflow-y-auto">
                {produtos.map(p => {
                  Const qtdInterna = carrinhoInterno[p.id] || 0;
                  Return (
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
                Style={{ backgroundColor: themeColors.secondary }}
                OnClick={lancarVendaBalcaoInterno} className="w-full hover:opacity-90 text-white p-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95">
                Lançar Combo no Histórico 🚀
              </button>
            </div>
          </div>
        )}

        {/* MEU CATÁLOGO VISUAL */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4 pt-2 w-full">
            <div className="bg-white p-6 rounded-[35px] shadow-md border w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
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
                    <div style={{ color: themeColors.primary }} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
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
              <input type="number" placeholder="Ex: 35.00" style={{ color: themeColors.primary }} className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold border focus:border-purple-400" value={novoProdCatalogo.precoVenda} onChange={e => setNovoProdCatalogo({...novoProdCatalogo, precoVenda: e.target.value})} />

              <div className="mb-5 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Categorias do Produto (Selecione Múltiplas)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasProd.map(cat => {
                    Const marcado = novoProdCatalogo.categorias?.includes(cat.nome) || false;
                    Return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoriaNoProduto(cat.nome)} style={{ backgroundColor: marcado ? ThemeColors.primary : undefined, borderColor: marcado ? ThemeColors.primary : undefined }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
                
                {!mostrarInputNovaCatProd ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatProd(true)} style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Nova Categoria</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🎨 Brindes Luxo" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaProd} onChange={e => setInputNovaCategoriaProd(e.target.value)} />
                    <button type="button" onClick={async () => {
                      If(!inputNovaCategoriaProd.trim()) return setMostrarInputNovaCatProd(false);
                      Await addDoc(collection(db, "categorias_produtos"), { nome: inputNovaCategoriaProd.trim(), userId: user.uid });
                      SetInputNovaCategoriaProd(''); setMostrarInputNovaCatProd(false);
                    }} style={{ backgroundColor: themeColors.primary }} className="text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button 
                Style={{ backgroundColor: themeColors.primary }}
                OnClick={async () => {
                If(!novoProdCatalogo.nome || !novoProdCatalogo.precoVenda) return alert("Preencha o nome e o preço!");
                Const d = { nome: novoProdCatalogo.nome, precoVenda: Number(novoProdCatalogo.precoVenda), urlImagem: novoProdCatalogo.urlImagem || '', categorias: novoProdCatalogo.categorias || [], userId: user.uid };
                If (novoProdCatalogo.id) await updateDoc(doc(db, "produtos", novoProdCatalogo.id), d);
                Else await addDoc(collection(db, "produtos"), d);
                SetNovoProdCatalogo({ id: '', nome: '', precoVenda: '', urlImagem: '', categorias: [] });
                Alert("Produto salvo no catálogo!");
              }} className="w-full hover:opacity-90 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-md" disabled={subindoImagem}>
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
                    <p style={{ color: themeColors.primary }} className="font-black text-sm mt-0.5">R$ {Number(p.precoVenda).toFixed(2)}</p>
                    {p.categorias && p.categorias.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {p.categorias.map((c: string, i: number) => (
                          <span key={i} className="text-[8px] bg-slate-100 font-bold text-slate-500 px-1.5 py-0.5 rounded uppercase">{c.split(' ')[0]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => venderItemDiretoDoCatalogo(p)} style={{ backgroundColor: themeColors.secondary }} className="text-white px-3 py-2 rounded-xl text-xs font-black uppercase shadow active:scale-95">Vender 🛍️</button>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Categorias do Fornecedor</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoriasForn.map(cat => {
                    Const marcado = novoFornecedor.categorias?.includes(cat.nome) || false;
                    Return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoriaNoFornecedor(cat.nome)} style={{ backgroundColor: marcado ? ThemeColors.primary : undefined, borderColor: marcado ? ThemeColors.primary : undefined }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${marcado ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                        {cat.nome}
                      </button>
                    );
                  })}
                </div>
                
                {!mostrarInputNovaCatForn ? (
                  <button type="button" onClick={() => setMostrarInputNovaCatForn(true)} style={{ color: themeColors.primary }} className="text-[10px] font-black uppercase mt-1 tracking-wider hover:underline">+ Criar Categoria de Compras</button>
                ) : (
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-dashed border-purple-200 mt-2 animate-fadeIn">
                    <input placeholder="Ex: 🧵 Fitas e Cordões" className="flex-1 bg-white p-2.5 rounded-xl text-xs font-bold outline-none border" value={inputNovaCategoriaForn} onChange={e => setInputNovaCategoriaForn(e.target.value)} />
                    <button type="button" onClick={async () => {
                      If(!inputNovaCategoriaForn.trim()) return setMostrarInputNovaCatForn(false);
                      Await addDoc(collection(db, "categorias_fornecedores"), { nome: inputNovaCategoriaForn.trim(), userId: user.uid });
                      SetInputNovaCategoriaForn(''); setMostrarInputNovaCatForn(false);
                    }} style={{ backgroundColor: themeColors.primary }} className="text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase shadow-sm">OK</button>
                  </div>
                )}
              </div>

              <button 
                Style={{ backgroundColor: themeColors.secondary }}
                OnClick={async () => {
                If(!novoFornecedor.nome) return alert("Digite o nome do fornecedor!");
                Const d = { nome: novoFornecedor.nome, site: novoFornecedor.site, whatsapp: novoFornecedor.whatsapp, endereco: novoFornecedor.endereco, categorias: novoFornecedor.categorias || [], userId: user.uid };
                
                If (novoFornecedor.id) await updateDoc(doc(db, "fornecedores", novoFornecedor.id), d);
                Else await addDoc(collection(db, "fornecedores"), d);
                
                SetNovoFornecedor({ id: '', nome: '', site: '', whatsapp: '', endereco: '', categorias: [] });
                Alert("Fornecedor cadastrado com sucesso! 📦🎉");
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-md">
                {novoFornecedor.id ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full mt-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Pesquisar por nome do fornecedor..." value={pesquisaFornecedores} onChange={e => setPesquisaFornecedores(e.target.value)} className="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm" />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none w-full">
                <button onClick={() => setFiltroFornSelecionado('Todos')} style={{ backgroundColor: filtroFornSelecionado === 'Todos' ? ThemeColors.primary : undefined, borderColor: filtroFornSelecionado === 'Todos' ? ThemeColors.primary : undefined }} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === 'Todos' ? 'text-white' : 'bg-white text-slate-500'}`}>🌍 Todos</button>
                {categoriasForn.map(cat => (
                  <button key={cat.id} onClick={() => setFiltroFornSelecionado(cat.nome)} style={{ backgroundColor: filtroFornSelecionado === cat.nome ? ThemeColors.primary : undefined, borderColor: filtroFornSelecionado === cat.nome ? ThemeColors.primary : undefined }} className={`px-3 py-1.5 text-xs font-bold shrink-0 rounded-xl border ${filtroFornSelecionado === cat.nome ? 'text-white' : 'bg-white text-slate-500'}`}>{cat.nome}</button>
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
                      <button onClick={() => window.open(f.site.startsWith('http') ? F.site : `https://${f.site}`, '_blank')} className="flex items-center gap-1 text-xs font-black uppercase bg-blue-50 text-blue-600 px-3 py-2 rounded-xl active:scale-95 transition-transform"><Globe size={13}/> Site</button>
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

        {/* HISTÓRICO DE ORÇAMENTOS EXPANDIDO */}
        {activeTab === 'pedidos' && (
          <div className="space-y-3 pt-2 w-full">
            <div className="flex justify-between items-center mb-1 w-full">
              <h2 style={{ color: themeColors.primary }} className="font-bold flex items-center gap-2"><History size={20}/> Histórico da Loja</h2>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full mb-4 border">
              <button onClick={() => setFiltroStatusPedido('Pendente')} style={{ color: filtroStatusPedido === 'Pendente' ? ThemeColors.primary : undefined }} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Pendente' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Pendentes ⏳</button>
              <button onClick={() => setFiltroStatusPedido('Vendido')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Vendido' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Vendidos 💰</button>
              <button onClick={() => setFiltroStatusPedido('Cancelado')} className={`flex-1 py-2 text-center text-xs font-black uppercase rounded-xl transition-all ${filtroStatusPedido === 'Cancelado' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Cancelados ❌</button>
            </div>

            {pedidosFiltradosPorStatus.map(p => {
               Const cli = clientes.find(c => c.id === p.clienteId);
               Const statusAtual = p.status || 'Pendente';
               Return (
                 <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm flex flex-col gap-3 border w-full">
                   <div className="flex justify-between items-center w-full">
                     <div>
                        <p style={{ color: themeColors.primary }} className="font-black text-[10px] uppercase mb-1">
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
                          <p style={{ color: themeColors.primary }} className="text-[11px] bg-purple-50 p-2 rounded-lg font-medium border border-purple-100 mt-2">🗒️ Notas: {p.obsPedido}</p>
                        )}
                     </div>
                     <div style={{ color: themeColors.secondary }} className="font-black text-xl shrink-0">R$ {p.preco}</div>
                   </div>
                   <div className="flex items-center justify-end border-t pt-2 gap-1 w-full">
                      {statusAtual === 'Pendente' && (
                        <>
                          <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 mr-auto active:scale-95"><CheckCircle size={16}/> Confirmar Venda</button>
                          <button onClick={() => carregarPedidoParaEdicao(p)} style={{ color: themeColors.primary }} className="p-2 bg-purple-50 rounded-xl"><Edit2 size={18}/></button>
                          <button onClick={() => cancelarPedidoSemExcluir(p.id)} title="Cancelar Orçamento" className="text-red-500 p-2 bg-red-50 rounded-xl"><X size={18}/></button>
                        </>
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
          </div>
        )}

        {/* GERENCIAR ARMÁRIO / INSUMOS */}
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
                Style={{ backgroundColor: themeColors.secondary }}
                OnClick={async () => {
                If(!novoMat.nome) return alert("Digite o nome do insumo!");
                Const d = { nome: novoMat.nome, valor: Number(novoMat.valor), qtd: Number(novoMat.qtd), unidade: novoMat.unidade, qtdAtual: Number(novoMat.qtdAtual || 0), qtdMinima: Number(novoMat.qtdMinima || 0), userId: user.uid };
                If (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                Else await addDoc(collection(db, "materiais"), d);
                SetNovoMat({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
                Alert("Material Salvo!");
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs">
                {novoMat.id ? 'Atualizar Insumo' : 'Salvar no Armário'}
              </button>
            </div>

            <div className="relative w-full mb-2">
              <Search 
                Size={18} 
                ClassName="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
              />
              <input
                Type="text"
                Placeholder="Pesquisar material no armário..."
                Value={pesquisaMateriais}
                OnChange={e => setPesquisaMateriais(e.target.value)}
                ClassName="w-full p-4 pl-11 bg-white rounded-2xl border border-slate-200 outline-none text-sm font-medium focus:border-purple-500 transition-colors shadow-sm"
              />
            </div>

            {materiaisFiltrados.map(m => {
              Const estaAcabando = Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0);
              Const valorUnitarioCalculado = Number(m.qtd || 1) > 0 ? (Number(m.valor || 0) / Number(m.qtd || 1)).toFixed(2) : "0.00";
              Return (
                <div key={m.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border w-full mb-2 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">{estaAcabando ? '🔴' : '🟢'} {m.nome}</p>
                    <p className="text-xs text-slate-400 mt-1">Custo unitário: <span className="font-bold text-slate-600">R$ {valorUnitarioCalculado}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">Qtd: <span style={{ color: themeColors.primary }} className="font-bold">{m.qtdAtual} {m.unidade}</span></p>
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

        {/* ABA DE CLIENTES */}
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
                Style={{ backgroundColor: themeColors.secondary }}
                OnClick={async () => {
                If(!novoCli.nome) return alert("Digite o nome do cliente!");
                
                Const dadosCliente = { 
                  Nome: novoCli.nome, 
                  Zap: novoCli.zap, 
                  Email: novoCli.email || '', 
                  Endereco: novoCli.endereco || '', 
                  CpfCnpj: novoCli.cpfCnpj || '',
                  UserId: user.uid 
                };

                If(novoCli.id) await updateDoc(doc(db, "clientes", novoCli.id), dadosCliente);
                Else await addDoc(collection(db, "clientes"), dadosCliente);
                
                SetNovoCli({ id: '', nome: '', zap: '', email: '', endereco: '', cpfCnpj: '' }); 
                Alert("Cadastro do cliente salvo com sucesso! 🎉");
              }} className="w-full hover:opacity-90 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
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
                    <button onClick={() => deleteDoc(doc(db, "clientes", c.id))} className="text-red-200 p-2"><Trash2 size={20}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MENU INFERIOR FIXO */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-30 bg-transparent pointer-events-none">
        <div className="bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.06)] rounded-[28px] flex justify-around items-center px-4 h-16 w-full max-w-xl pointer-events-auto border">
          <button onClick={() => setActiveTab('inicio')} style={{ color: activeTab === 'inicio' ? ThemeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'inicio' ? 'text-slate-300' : ''}`}>
            <Home size={22} className={activeTab === 'inicio' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
          </button>
          <button onClick={() => setActiveTab('criar')} style={{ color: activeTab === 'criar' ? ThemeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'criar' ? 'text-slate-300' : ''}`}>
            <Plus size={22} className={activeTab === 'criar' ? 'stroke-[3]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Orçar</span>
          </button>
          <button onClick={() => setActiveTab('contratos')} style={{ color: activeTab === 'contratos' ? ThemeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'contratos' ? 'text-slate-300' : ''}`}>
            <FileText size={22} className={activeTab === 'contratos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Contratos</span>
          </button>
          <button onClick={() => setActiveTab('pedidos')} style={{ color: activeTab === 'pedidos' ? ThemeColors.secondary : undefined }} className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${activeTab !== 'pedidos' ? 'text-slate-300' : ''}`}>
            <History size={22} className={activeTab === 'pedidos' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Histórico</span>
          </button>
        </div>
      </div>

    </div>
  );
}
