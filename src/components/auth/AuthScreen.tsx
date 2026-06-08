import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onStart: (data: any) => void;
}

export const AuthScreen: React.FC<Props> = ({ onStart }) => {
  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    whatsapp: '',
    email: '',
    acceptedTerms: false,
    marketingConsent: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      setError('Aceite os termos para participar.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc("start_participation", {
        p_event_slug: "robustus-expo-2026",
        p_cpf: formData.cpf,
        p_name: formData.name,
        p_whatsapp: formData.whatsapp || null,
        p_email: formData.email || null,
        p_accepted_terms: formData.acceptedTerms,
        p_marketing_consent: formData.marketingConsent
      });

      if (rpcError) throw rpcError;
      if (!data?.ok) {
        setError(data?.status === 'already_played' ? 'Este CPF já participou.' : 'Erro ao iniciar.');
      } else {
        onStart(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 text-white w-full max-w-lg mx-auto">
      <h2 className="text-4xl font-black text-center uppercase italic">Cadastro</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input className="p-4 rounded-xl text-black" placeholder="CPF" type="text" onChange={e => setFormData({...formData, cpf: e.target.value})} required />
        <input className="p-4 rounded-xl text-black" placeholder="Nome" type="text" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <label className="flex items-center gap-2">
          <input type="checkbox" onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})} required />
          Aceito participar da ação.
        </label>
        <button disabled={loading} className="bg-[#f7941d] p-4 rounded-xl font-bold uppercase">Começar</button>
      </form>
      {error && <p className="text-red-500 font-bold">{error}</p>}
    </div>
  );
};
