
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Image as ImageIcon, Link as LinkIcon, ExternalLink, MessageCircle, CreditCard } from 'lucide-react';

const WebhookConfigPage = () => {
  const { toast } = useToast();
  const [webhookMensagem, setWebhookMensagem] = useState('');
  const [webhookStatusCartao, setWebhookStatusCartao] = useState('');
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
        .select('id, webhook_mensagem, webhook_status_cartao, imagem_url')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWebhookMensagem(data.webhook_mensagem || '');
        setWebhookStatusCartao(data.webhook_status_cartao || '');
        setImageUrl(data.imagem_url || '');
        setConfigId(data.id);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configuração",
        description: error.message || "Não foi possível carregar as configurações.",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true; // Campo opcional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de URLs
    if (!validateUrl(webhookMensagem)) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Webhook de Mensagens não é uma URL válida",
      });
      return;
    }

    if (!validateUrl(webhookStatusCartao)) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Webhook de Status do Cartão não é uma URL válida",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        webhook_mensagem: webhookMensagem,
        webhook_status_cartao: webhookStatusCartao,
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
        title: "✓ Configuração salva",
        description: "As configurações de webhook foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Configurações - Mais Vantagens</title>
        <meta name="description" content="Configure webhook e imagem do sistema" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-8 border-b border-gray-100 bg-white">
             <h1 className="text-3xl font-bold text-gray-900">
              Configurações do Sistema
            </h1>
            <p className="text-gray-500 mt-2">
              Gerencie integrações e a aparência do formulário de solicitação.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#DC143C' }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Webhooks Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Integrações de Webhook</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure os dois endpoints para envio de dados</p>
                  </div>
                </div>
                
                {/* Webhook de Mensagens */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                      <MessageCircle className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-900">
                        Webhook de Mensagens (WhatsApp)
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Usado para enviar mensagens via WhatsApp e comunicações diretas
                      </p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={webhookMensagem}
                    onChange={(e) => setWebhookMensagem(e.target.value)}
                    placeholder="https://seu-webhook.n8n.cloud/webhook/mensagens"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  />
                  <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                    <span>📨</span>
                    Receberá dados de cliente + tipo_acao: 'envio_whatsapp'
                  </p>
                </div>

                {/* Webhook de Status do Cartão */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mt-0.5">
                      <CreditCard className="w-4 h-4 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-900">
                        Webhook de Status do Cartão
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Usado para atualizar status da solicitação ou aprovação do cartão
                      </p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={webhookStatusCartao}
                    onChange={(e) => setWebhookStatusCartao(e.target.value)}
                    placeholder="https://seu-webhook.n8n.cloud/webhook/status-cartao"
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  />
                  <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                    <span>💳</span>
                    Receberá dados de cliente + novos campos de status
                  </p>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Image Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Imagem da Página Inicial</h2>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL da Imagem
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white shadow-sm mb-4"
                      />
                      <p className="text-sm text-gray-500">
                        Recomendado: Imagem vertical de alta resolução (min. 1080x1920).
                      </p>
                    </div>

                    <div className="relative aspect-[3/2] md:aspect-auto md:h-48 rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = 'https://via.placeholder.com/400x300?text=Erro+na+Imagem'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Sem imagem configurada
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
                        Pré-visualização
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto text-white font-medium py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: '#DC143C' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando Alterações...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Salvar Configurações
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

export default WebhookConfigPage;
