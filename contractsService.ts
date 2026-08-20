import { 
  db 
} from './App'; // ou o arquivo onde você inicializou o firebase/db
import { 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  collection, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

// 1. Salvar/Buscar Dados da Empresa
export const saveCompanyProfile = async (userId: string, profileData: any) => {
  try {
    const docRef = doc(db, 'company_profile', userId);
    await setDoc(docRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar perfil da empresa:", error);
    throw error;
  }
};

export const getCompanyProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'company_profile', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar perfil da empresa:", error);
    throw error;
  }
};

// 2. Criar/Listar Modelos de Contrato
export const createContractTemplate = async (templateData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'contract_templates'), {
      ...templateData,
      active: true,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar modelo:", error);
    throw error;
  }
};

export const getContractTemplates = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'contract_templates'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao buscar modelos:", error);
    throw error;
  }
};

// 3. Substituir Variáveis no Texto
export const replaceContractVariables = (templateText: string, data: any) => {
  let text = templateText;
  const replacements: Record<string, string> = {
    '{{cliente_nome}}': data.client?.name || '',
    '{{cliente_cpf}}': data.client?.document || '',
    '{{cliente_email}}': data.client?.email || '',
    '{{cliente_telefone}}': data.client?.phone || '',
    '{{cliente_endereco}}': data.client?.address || '',
    '{{empresa_nome}}': data.provider?.businessName || '',
    '{{empresa_cnpj}}': data.provider?.document || '',
    '{{empresa_email}}': data.provider?.email || '',
    '{{empresa_telefone}}': data.provider?.phone || '',
    '{{descricao_servico}}': data.details?.serviceDescription || '',
    '{{data_evento}}': data.details?.eventDate || '',
    '{{local_evento}}': data.details?.eventLocation || '',
    '{{valor_total}}': data.details?.totalAmount ? Number(data.details.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
    '{{valor_sinal}}': data.details?.depositAmount ? Number(data.details.depositAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
    '{{forma_pagamento}}': data.details?.paymentMethod || '',
    '{{parcelamento}}': data.details?.installments || '',
  };

  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replaceAll(key, value);
  });

  return text;
};

// 4. Criar e Gerenciar Contratos
export const createContractFromQuote = async ({ quote, companyProfile, template }: any) => {
  try {
    const publicHash = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    const contractDataPayload = {
      client: {
        name: quote.clientName || quote.cliente || '',
        document: quote.clientDocument || '',
        email: quote.clientEmail || '',
        phone: quote.clientPhone || '',
        address: quote.clientAddress || ''
      },
      provider: {
        businessName: companyProfile?.businessName || '',
        document: companyProfile?.document || '',
        email: companyProfile?.email || '',
        phone: companyProfile?.phone || ''
      },
      details: {
        serviceDescription: quote.serviceDescription || quote.title || quote.nome || '',
        eventDate: quote.eventDate || '',
        eventLocation: quote.eventLocation || '',
        totalAmount: quote.totalAmount || quote.valorTotal || 0,
        depositAmount: quote.depositAmount || 0,
        paymentMethod: quote.paymentMethod || 'PIX',
        installments: quote.installments || 'À vista'
      }
    };

    const finalBodyText = replaceContractVariables(template.content, contractDataPayload);

    const newContract = {
      quoteId: quote.id || null,
      templateId: template.id || null,
      status: 'pending_signature',
      ...contractDataPayload,
      finalBodyText,
      signatureData: {
        signedByClient: false,
        signedAt: null,
        clientIp: null,
        clientUserAgent: null,
        signatureImageBase64: null
      },
      pdfUrl: null,
      publicHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'contracts'), newContract);
    return { id: docRef.id, publicHash, ...newContract };
  } catch (error) {
    console.error("Erro ao gerar contrato:", error);
    throw error;
  }
};

export const getAllContracts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'contracts'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    throw error;
  }
};

export const getContractByHash = async (publicHash: string) => {
  try {
    const q = query(collection(db, 'contracts'), where('publicHash', '==', publicHash));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Erro ao buscar contrato por hash:", error);
    throw error;
  }
};

export const signContractByClient = async (contractId: string, { signatureImageBase64, clientIp, clientUserAgent }: any) => {
  try {
    const contractRef = doc(db, 'contracts', contractId);
    await updateDoc(contractRef, {
      status: 'signed',
      'signatureData.signedByClient': true,
      'signatureData.signedAt': new Date().toISOString(),
      'signatureData.clientIp': clientIp || 'N/I',
      'signatureData.clientUserAgent': clientUserAgent || navigator.userAgent,
      'signatureData.signatureImageBase64': signatureImageBase64 || null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao assinar contrato:", error);
    throw error;
  }
};
