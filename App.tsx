import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Calculator, Package, ShoppingCart, History, LogOut, X, User, MessageCircle, Edit2, Clock, DollarSign, Percent, Tag, Calendar, Printer, CheckCircle } from 'lucide-react';

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

// --- TELA DE LOGIN COM RECUPERAÇÃO DE SENHA ---
const Login = ({ isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth }: any) => {
  const recuperarSenha = async () => {
    if (!email) return alert("Digite seu e-mail primeiro para eu te mandar o link!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enviamos um link para o seu e-mail! Verifique sua caixa de entrada (e o lixo/spam).");
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
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'pedidos' | 'clientes'>('criar');
  const [materiais, setMaterials] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

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

  // Estados Login / Cadastro / Novo Material com Campos de Estoque
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [novoMat, setNovoMat] = useState({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
  const [novoCli, setNovoCli] = useState({ nome: '', zap: '' });

  useEffect(() => { return onAuthStateChanged(auth, u => setUser(u)); }, []);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(query(collection(db, "materiais"), where("userId", "==", user.uid)), s => setMaterials(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "pedidos"), where("userId", "==", user.uid)), s => setPedidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, "clientes"), where("userId", "==", user.uid)), s => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user]);

  // Cálculos detalhados para o Resumo Financeiro
  const resumoFinanceiro = useMemo(() => {
    const totalMateriais = matsNoPed.reduce((acc, m) => acc + ((Number(m.valor || 0) / Number(m.qtd || 1)) * Number(m.qtdUsada || 1)), 0);
    const totalMaoObra = (Number(vHora || 0) / 60) * Number(tGasto || 0);
    const totalExtras = Number(custos.embalagem || 0) + Number(custos.impressao || 0) + Number(custos.energia || 0) + Number(custos.outros || 0);
    
    const custoTotalPeca = totalMateriais + totalMaoObra + totalExtras;
    const subtotalGeral = custoTotalPeca * Number(qtdPed || 1);
    
    const valorLucroLivre = subtotalGeral * (Number(lucro || 0) / 100);
    const totalComLucro = subtotalGeral + valorLucroLivre;
    const precoFinalCalculado = totalComLucro - Number(desconto || 0);

    return {
      materiais: totalMateriais.toFixed(2),
      maoObra: totalMaoObra.toFixed(2),
      extras: totalExtras.toFixed(2),
      custoPeca: custoTotalPeca.toFixed(2),
      lucroLivre: valorLucroLivre.toFixed(2),
      final: isNaN(precoFinalCalculado) ? "0.00" : precoFinalCalculado.toFixed(2)
    };
  }, [matsNoPed, vHora, tGasto, custos, lucro, qtdPed, desconto]);

  const enviarZap = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    const msg = `*RESUMO ORÇAMENTO*%0A---%0A*Cliente:* ${cli?.nome || 'Cliente'}%0A*Produto:* ${p.nomeProd}%0A*Qtd:* ${p.qtdPed || 1} un%0A*Prazo:* ${dataP}%0A*VALOR TOTAL:* R$ ${p.preco}%0A---%0AObrigado!`;
    const fone = cli?.zap ? cli.zap.replace(/\D/g, '') : '';
    window.open(`https://wa.me/55${fone}?text=${msg}`, '_blank');
  };

  const gerarPDF = (p: any) => {
    const cli = clientes.find(c => c.id === (p.clienteId || p.clienteSel));
    const dataP = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : 'A combinar';
    
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

        <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Prazo de Entrega:</strong> ${dataP}</p>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Orçamento válido por 7 dias.</p>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8;">
          Gerado automaticamente por PrecificaJá - Sua empresa lucrando mais.
        </div>
      </div>
    `;

    const opcoes = {
      margin: 10,
      filename: `Orcamento_${p.nomeProd || 'cliente'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

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
      await deleteDoc(doc(db, tipo === 'pedido' ? "pedidos" : tipo === 'cliente' ? "clientes" : "materiais", id));
    }
  };

  // FUNÇÃO REVISADA QUE FAZ A BAIXA DO MATERIAL APENAS NA CONFIRMAÇÃO DA VENDA
  const confirmarVendaPedido = async (pedido: any) => {
    if (!pedido.materiaisUsados || pedido.materiaisUsados.length === 0) {
      await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰' });
      alert("Venda confirmada!");
      return;
    }

    for (const m of pedido.materiaisUsados) {
      const matDoBanco = materiais.find(item => item.id === m.id);
      if (matDoBanco) {
        const estoqueFiscal = Number(matDoBanco.qtdAtual || 0);
        const gastoTotal = Number(m.qtdUsada || 0) * Number(pedido.qtdPed || 1);
        const estoqueFinal = Math.max(0, estoqueFiscal - gastoTotal);
        
        await updateDoc(doc(db, "materiais", m.id), { qtdAtual: estoqueFinal });
      }
    }

    await updateDoc(doc(db, "pedidos", pedido.id), { status: 'Vendido 💰' });
    alert("Venda registrada e materiais descontados com sucesso!");
  };

  if (!user) return <Login {...{isRegistering, setIsRegistering, email, setEmail, password, setPassword, handleAuth}} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-700">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="font-black text-purple-700 text-lg flex items-center gap-2"><Calculator size={22}/> PrecificaJá</div>
        <button onClick={() => signOut(auth)} className="text-red-500 bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"><LogOut size={14}/> SAIR</button>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'criar' && (
          <div className="bg-white p-6 rounded-[35px] shadow-xl border mt-2">
            <h2 className="text-purple-700 font-bold mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><ShoppingCart size={18}/> Novo Orçamento</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Produto</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={nomeProd} onChange={e => setNomeProd(e.target.value)} />
               </div>
               <div><label className="text-[10px] font-bold text-slate-400 uppercase text-center block">Qtd</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={qtdPed} onChange={e => setQtdPed(e.target.value)} />
               </div>
            </div>

            <div className="mb-6">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
               <select className="p-4 bg-slate-50 rounded-2xl outline-none w-full mb-4" onChange={e => setClienteSel(e.target.value)} value={clienteSel}>
                  <option value="">👤 Escolher Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>

               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Materiais Usados</label>
               <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none mb-3" onChange={e => {
                  const m = materiais.find(item => item.id === e.target.value);
                  if (m) setMatsNoPed([...matsNoPed, { id: m.id, nome: m.nome, qtdUsada: 1 }]);
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
                        <button onClick={() => setMatsNoPed(matsNoPed.filter((_, idx) => idx !== i))}><X size={16}/></button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Clock size={10}/> Tempo Gasto (min)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={tGasto} onChange={e => setTGasto(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><DollarSign size={10}/> Valor da Hora (R$)</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={vHora} onChange={e => setVHora(e.target.value)} /></div>
            </div>

            <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Custos Extras (Opcional)</p>
              <div className="grid grid-cols-4 gap-2">
                {[{id:'embalagem',label:'EMBAL.'},{id:'impressao',label:'TINTA'},{id:'energia',label:'LUZ'},{id:'outros',label:'OUTROS'}].map(c=>(
                  <div key={c.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span className="text-[8px] font-black text-slate-300 mb-1">{c.label}</span>
                    <input type="number" className="w-full bg-transparent text-center text-xs outline-none font-bold" value={(custos as any)[c.id]} onChange={e => setCustos({...custos, [c.id]: e.target.value})} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Percent size={10}/> Lucro %</label>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={lucro} onChange={e => setLucro(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 ml-1"><Calendar size={10}/> Prazo</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            </div>

            <div className="mb-6">
               <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 ml-1"><Tag size={10}/> Desconto (R$)</label>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-orange-500" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100 text-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-purple-700 tracking-wider mb-2">📊 Resumo Financeiro da Peça</p>
              <div className="flex justify-between text-slate-500"><span>Materiais:</span><span className="font-bold">R$ {resumoFinanceiro.materiais}</span></div>
              <div className="flex justify-between text-slate-500"><span>Mão de Obra:</span><span className="font-bold">R$ {resumoFinanceiro.maoObra}</span></div>
              <div className="flex justify-between text-slate-500"><span>Extras / Custo Manual:</span><span className="font-bold">R$ {resumoFinanceiro.extras}</span></div>
              <div className="flex justify-between text-slate-800 font-bold border-t pt-2 mt-1"><span>Custo Total da Peça:</span><span className="text-purple-700">R$ {resumoFinanceiro.custoPeca}</span></div>
              <div className="flex justify-between text-emerald-600 font-bold"><span>Lucro Livre Gerado ({lucro}%):</span><span>R$ {resumoFinanceiro.lucroLivre}</span></div>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-orange-500 font-black text-4xl tracking-tighter">R$ {resumoFinanceiro.final}</div>
              <div className="flex gap-2">
                <button onClick={async () => {
                   await addDoc(collection(db, "pedidos"), { 
                     nomeProd, 
                     preco: resumoFinanceiro.final, 
                     clienteId: clienteSel, 
                     prazo, 
                     qtdPed, 
                     userId: user.uid, 
                     data: new Date().toLocaleDateString(),
                     status: 'Pendente',
                     materiaisUsados: matsNoPed 
                   });
                   alert("Orçamento salvo no histórico!"); 
                   setNomeProd(''); setMatsNoPed([]);
                   setActiveTab('pedidos');
                }} className="bg-orange-500 text-white px-5 py-4 rounded-[22px] font-black uppercase text-xs shadow-lg">Salvar</button>
                <button onClick={() => gerarPDF({nomeProd, preco: resumoFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-orange-500 text-white p-4 rounded-[22px] shadow-lg hover:bg-orange-600 transition-all active:scale-95"><Printer size={18}/></button>
                <button onClick={() => enviarZap({nomeProd, preco: resumoFinanceiro.final, clienteId: clienteSel, prazo, qtdPed})} className="bg-emerald-500 text-white p-4 rounded-[22px] shadow-lg"><MessageCircle size={18}/></button>
              </div>
            </div>
          </div>
        )}

        {/* ABA HISTÓRICO COM CONFIRMAÇÃO DE VENDA */}
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
                        <p className="font-black text-[10px] uppercase text-purple-700 leading-none mb-1">
                          {cli?.nome || 'Sem Nome'} — <span className={ehPendente ? "text-orange-400" : "text-emerald-500"}>{p.status || 'Pendente'}</span>
                        </p>
                        <p className="font-bold text-slate-700 text-sm">{p.nomeProd} <span className="text-xs text-slate-400 font-normal">({p.qtdPed || 1} un)</span></p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase">{p.data}</p>
                     </div>
                     <div className="text-orange-500 font-black text-xl">R$ {p.preco}</div>
                   </div>

                   <div className="flex items-center justify-end border-t pt-2 gap-1">
                      {ehPendente && (
                        <button onClick={() => confirmarVendaPedido(p)} className="text-emerald-600 p-2 bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all mr-auto">
                          <CheckCircle size={16}/> Confirmar Venda
                        </button>
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

        {/* ESTOQUE E GERENCIAMENTO DE MATERIAIS */}
        {activeTab === 'materiais' && (
          <div className="space-y-4 pt-2">
            <div className="bg-white p-8 rounded-[40px] shadow-md border">
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><Package size={20}/> Gerenciar Armário</h2>
              
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Material</label>
              <input placeholder="Ex: Papel Fotográfico" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoMat.nome} onChange={e => setNovoMat({...novoMat, nome: e.target.value})} />
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço Total do Pacote/Rolo</label>
                  <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={novoMat.valor} onChange={e => setNovoMat({...novoMat, valor: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block text-center">Vem Quantos?</label>
                  <input type="number" placeholder="Ex: 100" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-center" value={novoMat.qtd} onChange={e => setNovoMat({...novoMat, qtd: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-purple-600 uppercase ml-1">Tem no armário hoje?</label>
                  <input type="number" placeholder="Ex: 50" className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-center font-bold text-purple-700" value={novoMat.qtdAtual} onChange={e => setNovoMat({...novoMat, qtdAtual: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Avisar se chegar em:</label>
                  <input type="number" placeholder="Ex: 5" className="w-full p-4 bg-red-50 rounded-2xl outline-none text-center font-bold text-red-700" value={novoMat.qtdMinima} onChange={e => setNovoMat({...novoMat, qtdMinima: e.target.value})} />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Medida por:</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold" value={novoMat.unidade} onChange={e => setNovoMat({...novoMat, unidade: e.target.value})}>
                  <option value="un">📦 Unidade (un)</option>
                  <option value="Folha A4">📄 Folha A4</option>
                  <option value="m">📏 Metro (m)</option>
                  <option value="cm">📐 Centímetro (cm)</option>
                </select>
              </div>

              <button onClick={async () => {
                const d = { 
                  nome: novoMat.nome, 
                  valor: Number(novoMat.valor), 
                  qtd: Number(novoMat.qtd), 
                  unidade: novoMat.unidade,
                  qtdAtual: Number(novoMat.qtdAtual || 0),
                  qtdMinima: Number(novoMat.qtdMinima || 0),
                  userId: user.uid 
                };
                if (novoMat.id) await updateDoc(doc(db, "materiais", novoMat.id), d);
                else await addDoc(collection(db, "materiais"), d);
                setNovoMat({ id: '', nome: '', valor: '', qtd: '1', unidade: 'un', qtdAtual: '0', qtdMinima: '0' });
                alert("Material salvo com sucesso!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                {novoMat.id ? 'Atualizar Insumo' : 'Salvar no Armário'}
              </button>
            </div>
            
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider ml-2">📋 Itens no Armário</h3>
            {materiais.map(m => {
              const estaAcabando = Number(m.qtdAtual || 0) <= Number(m.qtdMinima || 0);
              return (
                <div key={m.id} className={`bg-white p-5 rounded-3xl flex justify-between items-center border ${estaAcabando ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{estaAcabando ? '🔴' : '🟢'}</span>
                      <p className="font-bold text-slate-800">{m.nome}</p>
                    </div>
                    <p className="text-orange-500 font-black text-xs mt-1">
                      Custo: R$ {(Number(m.valor)/Number(m.qtd)).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/{m.unidade || 'un'}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      No armário: <span className={`font-bold ${estaAcabando ? 'text-red-600' : 'text-purple-700'}`}>{m.qtdAtual || 0} {m.unidade || 'un'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={async () => {
                      await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Math.max(0, Number(m.qtdAtual || 0) - 1) });
                    }} className="p-2 bg-slate-100 rounded-xl font-bold text-slate-600 active:scale-95 w-8 h-8 flex items-center justify-center">-</button>
                    
                    <button onClick={async () => {
                      await updateDoc(doc(db, "materiais", m.id), { qtdAtual: Number(m.qtdAtual || 0) + 1 });
                    }} className="p-2 bg-purple-100 rounded-xl font-bold text-purple-700 active:scale-95 w-8 h-8 flex items-center justify-center">+</button>

                    <button onClick={() => setNovoMat({id: m.id, nome: m.nome, valor: m.valor, qtd: m.qtd, unidade: m.unidade || 'un', qtdAtual: String(m.qtdAtual || 0), qtdMinima: String(m.qtdMinima || 0)})} className="text-orange-400 p-2 ml-2"><Edit2 size={18}/></button>
                    <button onClick={() => confirmarExcluir('material', m.id)} className="text-red-200 p-2"><Trash2 size={18}/></button>
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
              <h2 className="text-purple-700 font-bold mb-4 flex items-center gap-2"><User size={20}/> Clientes</h2>
              <input placeholder="Nome" className="w-full p-4 bg-slate-50 rounded-2xl mb-3 outline-none" value={novoCli.nome} onChange={e => setNovoCli({...novoCli, nome: e.target.value})} />
              <input placeholder="WhatsApp" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 outline-none" value={novoCli.zap} onChange={e => setNovoCli({...novoCli, zap: e.target.value})} />
              <button onClick={async () => {
                await addDoc(collection(db, "clientes"), { ...novoCli, userId: user.uid });
                setNovoCli({ nome: '', zap: '' }); alert("Cliente Salvo!");
              }} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-xs">Salvar Cliente</button>
            </div>
            {clientes.map(c => <div key={c.id} className="bg-white p-5 rounded-3xl flex justify-between items-center border shadow-sm font-bold"><span className="ml-2">{c.nome}</span><button onClick={() => confirmarExcluir('cliente', c.id)} className="text-red-200 p-2"><Trash2 size={20}/></button></div>)}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 w-full flex justify-around px-4 items-center">
          <button onClick={() => setActiveTab('materiais')} className={`p-4 rounded-2xl transition-all ${activeTab === 'materiais' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><Package size={22}/></button>
          <button onClick={() => setActiveTab('clientes')} className={`p-4 rounded-2xl transition-all ${activeTab === 'clientes' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><User size={22}/></button>
          <button onClick={() => setActiveTab('criar')} className={`p-5 rounded-[22px] transition-all border-4 border-white shadow-xl ${activeTab === 'criar' ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300'}`}><Plus size={28}/></button>
          <button onClick={() => setActiveTab('pedidos')} className={`p-4 rounded-2xl transition-all ${activeTab === 'pedidos' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}><History size={22}/></button>
      </div>
    </div>
  );
}
