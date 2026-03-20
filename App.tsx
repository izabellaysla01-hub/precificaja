/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from "./firebase";
import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  Package, 
  ShoppingCart, 
  History, 
  Share2, 
  MessageCircle,
  Clock,
  DollarSign,
  Percent,
  Calendar,
  ChevronRight,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Material {
  id: string;
  nome: string;
  valorPago: number;
  quantidadeComprada: number;
  unidadeMedida: string;
  valorUnitario: number;
}

interface MaterialUsado {
  materialId: string;
  quantidadeUsada: number;
}

interface Produto {
  id: string;
  nome: string;
  materiais: MaterialUsado[];
  maoDeObraHora: number;
  tempoGastoMinutos: number;
  custosExtras: {
    embalagem: number;
    energia: number;
    taxas: number;
    outros: number;
  };
  lucroPorcentagem: number;
  descontoValor: number;
  descontoTipo: 'fixo' | 'porcentagem';
  quantidadePedido: number;
  prazoEntrega: string;
  dataCriacao: string;
}

// --- App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'materiais' | 'criar' | 'salvos'>('criar');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [produtosSalvos, setProdutosSalvos] = useState<Produto[]>([]);
  
  // Estado para o formulário de novo produto
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({
    nome: '',
    materiais: [],
    maoDeObraHora: 0,
    tempoGastoMinutos: 0,
    custosExtras: { embalagem: 0, energia: 0, taxas: 0, outros: 0 },
    lucroPorcentagem: 30,
    descontoValor: 0,
    descontoTipo: 'porcentagem',
    quantidadePedido: 1,
    prazoEntrega: ''
  });

  // Estado para o formulário de novo material
  const [novoMaterial, setNovoMaterial] = useState<Partial<Material>>({
    nome: '',
    valorPago: 0,
    quantidadeComprada: 1,
    unidadeMedida: 'un'
  });

  // Carregar dados do LocalStorage
  useEffect(() => {
    const savedMateriais = localStorage.getItem('precificaja_materiais');
    const savedProdutos = localStorage.getItem('precificaja_produtos');
    if (savedMateriais) setMateriais(JSON.parse(savedMateriais));
    if (savedProdutos) setProdutosSalvos(JSON.parse(savedProdutos));
  }, []);

  // Salvar dados no LocalStorage
  useEffect(() => {
    localStorage.setItem('precificaja_materiais', JSON.stringify(materiais));
  }, [materiais]);

  useEffect(() => {
    localStorage.setItem('precificaja_produtos', JSON.stringify(produtosSalvos));
  }, [produtosSalvos]);

  // --- Funções de Materiais ---

  const adicionarMaterial = () => {
    if (!novoMaterial.nome || !novoMaterial.valorPago || !novoMaterial.quantidadeComprada) return;
    
    const valorUnitario = (novoMaterial.valorPago || 0) / (novoMaterial.quantidadeComprada || 1);
    const material: Material = {
      id: crypto.randomUUID(),
      nome: novoMaterial.nome || '',
      valorPago: novoMaterial.valorPago || 0,
      quantidadeComprada: novoMaterial.quantidadeComprada || 1,
      unidadeMedida: novoMaterial.unidadeMedida || 'un',
      valorUnitario
    };

    setMateriais([...materiais, material]);
    setNovoMaterial({ nome: '', valorPago: 0, quantidadeComprada: 1, unidadeMedida: 'un' });
  };

  const removerMaterial = (id: string) => {
    setMateriais(materiais.filter(m => m.id !== id));
  };

  // --- Funções de Produto ---

  const adicionarMaterialAoProduto = (materialId: string) => {
    if (!materialId) return;
    const jaExiste = novoProduto.materiais?.find(m => m.materialId === materialId);
    if (jaExiste) return;

    setNovoProduto({
      ...novoProduto,
      materiais: [...(novoProduto.materiais || []), { materialId, quantidadeUsada: 1 }]
    });
  };

  const atualizarQtdMaterialProduto = (materialId: string, qtd: number) => {
    setNovoProduto({
      ...novoProduto,
      materiais: novoProduto.materiais?.map(m => 
        m.materialId === materialId ? { ...m, quantidadeUsada: qtd } : m
      )
    });
  };

  const removerMaterialDoProduto = (materialId: string) => {
    setNovoProduto({
      ...novoProduto,
      materiais: novoProduto.materiais?.filter(m => m.materialId !== materialId)
    });
  };

  // --- Cálculos ---

  const calculos = useMemo(() => {
    const custoMateriais = (novoProduto.materiais || []).reduce((acc, item) => {
      const material = materiais.find(m => m.id === item.materialId);
      return acc + (material ? material.valorUnitario * item.quantidadeUsada : 0);
    }, 0);

    const custoMaoDeObra = ((novoProduto.maoDeObraHora || 0) / 60) * (novoProduto.tempoGastoMinutos || 0);
    
    const extras = novoProduto.custosExtras || { embalagem: 0, energia: 0, taxas: 0, outros: 0 };
    const custoExtrasTotal = Object.values(extras).reduce((a, b) => a + b, 0);

    const custoUnitarioBase = custoMateriais + custoMaoDeObra + custoExtrasTotal;
    const custoTotalPedido = custoUnitarioBase * (novoProduto.quantidadePedido || 1);

    const valorLucro = custoTotalPedido * ((novoProduto.lucroPorcentagem || 0) / 100);
    const subtotal = custoTotalPedido + valorLucro;

    let desconto = 0;
    if (novoProduto.descontoTipo === 'fixo') {
      desconto = novoProduto.descontoValor || 0;
    } else {
      desconto = subtotal * ((novoProduto.descontoValor || 0) / 100);
    }

    const precoFinalTotal = Math.max(0, subtotal - desconto);
    const precoFinalUnitario = precoFinalTotal / (novoProduto.quantidadePedido || 1);

    return {
      custoMateriais,
      custoMaoDeObra,
      custoExtrasTotal,
      custoUnitarioBase,
      custoTotalPedido,
      valorLucro,
      desconto,
      precoFinalTotal,
      precoFinalUnitario
    };
  }, [novoProduto, materiais]);

  const salvarProduto = () => {
    if (!novoProduto.nome) {
      alert('Dê um nome ao produto antes de salvar.');
      return;
    }

    const produto: Produto = {
      ...(novoProduto as Produto),
      id: novoProduto.id || crypto.randomUUID(),
      dataCriacao: new Date().toISOString()
    };

    const index = produtosSalvos.findIndex(p => p.id === produto.id);
    if (index >= 0) {
      const novosProdutos = [...produtosSalvos];
      novosProdutos[index] = produto;
      setProdutosSalvos(novosProdutos);
    } else {
      setProdutosSalvos([produto, ...produtosSalvos]);
    }

    alert('Produto salvo com sucesso!');
    setActiveTab('salvos');
  };

  const editarProduto = (p: Produto) => {
    setNovoProduto(p);
    setActiveTab('criar');
  };

  const excluirProduto = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      setProdutosSalvos(produtosSalvos.filter(p => p.id !== id));
    }
  };

  // --- Orçamento e WhatsApp ---

  const gerarTextoOrcamento = () => {
    const dataFormatada = novoProduto.prazoEntrega 
      ? new Date(novoProduto.prazoEntrega).toLocaleDateString('pt-BR') 
      : 'A combinar';

    return `*ORÇAMENTO - ${novoProduto.nome}*
------------------------------
*Quantidade:* ${novoProduto.quantidadePedido} un
*Preço Unitário:* R$ ${calculos.precoFinalUnitario.toFixed(2)}
${novoProduto.descontoValor ? `*Desconto:* R$ ${calculos.desconto.toFixed(2)}\n` : ''}
*VALOR TOTAL:* R$ ${calculos.precoFinalTotal.toFixed(2)}
------------------------------
*Prazo de Entrega:* ${dataFormatada}
------------------------------
Obrigado pela preferência!`;
  };

  const enviarWhatsApp = () => {
    const texto = encodeURIComponent(gerarTextoOrcamento());
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">PrecificaJá</h1>
          </div>
          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => setActiveTab('materiais')}
              className={`tab-btn ${activeTab === 'materiais' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}
            >
              Materiais
            </button>
            <button 
              onClick={() => setActiveTab('criar')}
              className={`tab-btn ${activeTab === 'criar' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}
            >
              Criar Produto
            </button>
            <button 
              onClick={() => setActiveTab('salvos')}
              className={`tab-btn ${activeTab === 'salvos' ? 'bg-white text-primary' : 'hover:bg-white/10'}`}
            >
              Produtos Salvos
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {/* ABA MATERIAIS */}
          {activeTab === 'materiais' && (
            <motion.div 
              key="materiais"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <section className="glass-card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                  <Package className="w-5 h-5" /> Novo Material
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Nome do Material</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Papel Fotográfico A4"
                      className="input-field"
                      value={novoMaterial.nome}
                      onChange={e => setNovoMaterial({...novoMaterial, nome: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Valor Pago (R$)</label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoMaterial.valorPago || ''}
                        onChange={e => setNovoMaterial({...novoMaterial, valorPago: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Qtd Comprada</label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoMaterial.quantidadeComprada || ''}
                        onChange={e => setNovoMaterial({...novoMaterial, quantidadeComprada: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-slate-500">
                    Valor Unitário: <span className="font-bold text-primary">
                      R$ {((novoMaterial.valorPago || 0) / (novoMaterial.quantidadeComprada || 1)).toFixed(2)}
                    </span>
                  </div>
                  <button onClick={adicionarMaterial} className="btn-accent">
                    <Plus className="w-5 h-5" /> Adicionar
                  </button>
                </div>
              </section>

              <section className="glass-card">
                <h2 className="text-xl font-bold mb-4">Materiais Cadastrados</h2>
                {materiais.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhum material cadastrado ainda.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {materiais.map(m => (
                      <div key={m.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{m.nome}</h3>
                          <p className="text-sm text-slate-500">
                            Pago R$ {m.valorPago.toFixed(2)} por {m.quantidadeComprada} {m.unidadeMedida}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Unitário</p>
                            <p className="font-bold text-accent">R$ {m.valorUnitario.toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => removerMaterial(m.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* ABA CRIAR PRODUTO */}
          {activeTab === 'criar' && (
            <motion.div 
              key="criar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> {novoProduto.id ? 'Editar Produto' : 'Novo Produto'}
                  </h2>
                  {novoProduto.id && (
                    <button 
                      onClick={() => setNovoProduto({
                        nome: '', materiais: [], maoDeObraHora: 0, tempoGastoMinutos: 0,
                        custosExtras: { embalagem: 0, energia: 0, taxas: 0, outros: 0 },
                        lucroPorcentagem: 30, descontoValor: 0, descontoTipo: 'porcentagem',
                        quantidadePedido: 1, prazoEntrega: ''
                      })}
                      className="text-sm text-slate-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Cancelar Edição
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Nome e Qtd */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Nome do Produto</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Caneca Personalizada Dia das Mães"
                        className="input-field"
                        value={novoProduto.nome}
                        onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Qtd do Pedido</label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoProduto.quantidadePedido || ''}
                        onChange={e => setNovoProduto({...novoProduto, quantidadePedido: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  {/* Seleção de Materiais */}
                  <div className="border-t border-slate-100 pt-6">
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Materiais Utilizados</label>
                    <div className="flex gap-2 mb-4">
                      <select 
                        className="input-field flex-1"
                        onChange={(e) => adicionarMaterialAoProduto(e.target.value)}
                        value=""
                      >
                        <option value="" disabled>Selecione um material...</option>
                        {materiais.map(m => (
                          <option key={m.id} value={m.id}>{m.nome} (R$ {m.valorUnitario.toFixed(2)})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setActiveTab('materiais')}
                        className="btn-secondary px-4"
                        title="Cadastrar novo material"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {novoProduto.materiais?.map(item => {
                        const m = materiais.find(mat => mat.id === item.materialId);
                        if (!m) return null;
                        return (
                          <div key={item.materialId} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{m.nome}</p>
                              <p className="text-xs text-slate-400">Custo: R$ {(m.valorUnitario * item.quantidadeUsada).toFixed(2)}</p>
                            </div>
                            <div className="w-24">
                              <input 
                                type="number" 
                                className="input-field py-1 text-center"
                                value={item.quantidadeUsada}
                                onChange={e => atualizarQtdMaterialProduto(item.materialId, parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <button 
                              onClick={() => removerMaterialDoProduto(item.materialId)}
                              className="text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mão de Obra */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-accent" /> Valor da Hora (R$)
                      </label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoProduto.maoDeObraHora || ''}
                        onChange={e => setNovoProduto({...novoProduto, maoDeObraHora: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-1">
                        <Clock className="w-4 h-4 text-accent" /> Tempo Gasto (minutos)
                      </label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoProduto.tempoGastoMinutos || ''}
                        onChange={e => setNovoProduto({...novoProduto, tempoGastoMinutos: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  {/* Custos Extras */}
                  <div className="border-t border-slate-100 pt-6">
                    <label className="text-sm font-medium text-slate-600 mb-3 block">Custos Extras (Opcional)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['embalagem', 'energia', 'taxas', 'outros'].map(key => (
                        <div key={key}>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{key}</label>
                          <input 
                            type="number" 
                            className="input-field py-1 text-sm"
                            value={(novoProduto.custosExtras as any)?.[key] || ''}
                            onChange={e => setNovoProduto({
                              ...novoProduto, 
                              custosExtras: { ...novoProduto.custosExtras!, [key]: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lucro e Desconto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-1">
                        <Percent className="w-4 h-4 text-accent" /> Margem de Lucro (%)
                      </label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={novoProduto.lucroPorcentagem || ''}
                        onChange={e => setNovoProduto({...novoProduto, lucroPorcentagem: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-accent" /> Prazo de Entrega
                      </label>
                      <input 
                        type="date" 
                        className="input-field"
                        value={novoProduto.prazoEntrega || ''}
                        onChange={e => setNovoProduto({...novoProduto, prazoEntrega: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Desconto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Valor do Desconto</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          className="input-field flex-1"
                          value={novoProduto.descontoValor || ''}
                          onChange={e => setNovoProduto({...novoProduto, descontoValor: parseFloat(e.target.value) || 0})}
                        />
                        <select 
                          className="input-field w-24"
                          value={novoProduto.descontoTipo}
                          onChange={e => setNovoProduto({...novoProduto, descontoTipo: e.target.value as any})}
                        >
                          <option value="porcentagem">%</option>
                          <option value="fixo">R$</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo de Preços */}
              <div className="glass-card bg-primary text-white border-none">
                <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Resumo da Precificação</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold">Custo Unitário</p>
                    <p className="text-xl font-bold">R$ {calculos.custoUnitarioBase.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold">Lucro Total</p>
                    <p className="text-xl font-bold">R$ {calculos.valorLucro.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold">Desconto</p>
                    <p className="text-xl font-bold">R$ {calculos.desconto.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold">Qtd Pedido</p>
                    <p className="text-xl font-bold">{novoProduto.quantidadePedido} un</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-white/20">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-white/60 uppercase font-bold">Preço Final de Venda (Total)</p>
                    <p className="text-4xl font-black text-accent">R$ {calculos.precoFinalTotal.toFixed(2)}</p>
                    <p className="text-sm text-white/80 mt-1">Unitário: R$ {calculos.precoFinalUnitario.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={salvarProduto} className="btn-accent">
                      <Save className="w-5 h-5" /> Salvar Produto
                    </button>
                    <button onClick={enviarWhatsApp} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all">
                      <MessageCircle className="w-5 h-5" /> Enviar Orçamento
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA PRODUTOS SALVOS */}
          {activeTab === 'salvos' && (
            <motion.div 
              key="salvos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-4">
                <History className="w-5 h-5" /> Histórico de Produtos
              </h2>
              
              {produtosSalvos.length === 0 ? (
                <div className="glass-card text-center py-16 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum produto salvo ainda.</p>
                  <button onClick={() => setActiveTab('criar')} className="text-accent font-bold mt-2 underline">
                    Criar meu primeiro produto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {produtosSalvos.map(p => (
                    <div key={p.id} className="glass-card hover:border-accent/30 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{p.nome}</h3>
                          <p className="text-xs text-slate-400">{new Date(p.dataCriacao).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => editarProduto(p)}
                            className="p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => excluirProduto(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-orange-400">Preço Sugerido</p>
                          <p className="text-xl font-black text-accent">R$ {((p.quantidadePedido || 1) * 10).toFixed(2)}*</p>
                          <p className="text-[10px] text-slate-400">*Recalcule para ver o preço atual</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Qtd</p>
                          <p className="font-bold">{p.quantidadePedido} un</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => editarProduto(p)}
                        className="w-full btn-secondary py-2 text-sm"
                      >
                        Ver Detalhes & Recalcular <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('materiais')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'materiais' ? 'text-primary' : 'text-slate-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Materiais</span>
        </button>
        <button 
          onClick={() => setActiveTab('criar')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'criar' ? 'text-primary' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-full -mt-8 shadow-lg transition-all ${activeTab === 'criar' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase">Criar</span>
        </button>
        <button 
          onClick={() => setActiveTab('salvos')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'salvos' ? 'text-primary' : 'text-slate-400'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Salvos</span>
        </button>
      </nav>
    </div>
  );
}
