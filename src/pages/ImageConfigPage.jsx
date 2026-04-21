
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';

const ImageConfigPage = () => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('id, imagem_url')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setImageUrl(data.imagem_url || '');
        setConfigId(data.id);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configuração",
        description: error.message || "Não foi possível carregar a configuração de imagem.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        imagem_url: imageUrl,
        updated_at: new Date().toISOString(),
      };
      
      if (configId) {
        payload.id = configId;
      }

      const { data, error } = await supabase
        .from('configuracoes')
        .upsert(
          payload,
          {
            onConflict: 'id',
          }
        )
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
      }

      toast({
        title: "Imagem atualizada",
        description: "A imagem da página inicial foi alterada com sucesso.",
      });
    } catch (error) {
      console.error("Error saving image config:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a imagem.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Configurar Imagem - Grupo Muller</title>
        <meta name="description" content="Configure a imagem da página de solicitação" />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-red-50 rounded-xl">
              <ImageIcon className="w-8 h-8 text-[#DC143C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuração de Imagem</h1>
              <p className="text-gray-500">Personalize a imagem principal da página de solicitação.</p>
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#DC143C]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div className="bg-gray-100 rounded-xl p-4 min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative group">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = '/hero.svg'
                      }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma imagem configurada</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Pré-visualização</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto text-white font-medium py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                  style={{ backgroundColor: '#DC143C' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Salvar Imagem
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ImageConfigPage;
