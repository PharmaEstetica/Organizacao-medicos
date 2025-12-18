import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Lock, Loader2 } from 'lucide-react';
import { useProtectedAccess } from '@/hooks/useProtectedAccess';
import { PasswordModal } from '@/components/PasswordModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SettingsState {
  relatorios_protected: boolean;
  relatorios_password: string;
  delete_protected: boolean;
  delete_password: string;
  config_protected: boolean;
  config_password: string;
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { 
    isLocked, 
    isProtected,
    showPasswordModal, 
    setShowPasswordModal, 
    verifyPassword,
    loading: accessLoading 
  } = useProtectedAccess('config');

  const [settings, setSettings] = useState<SettingsState>({
    relatorios_protected: true,
    relatorios_password: '',
    delete_protected: true,
    delete_password: '',
    config_protected: true,
    config_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    relatorios: false,
    delete: false,
    config: false
  });
  
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (isProtected && isLocked && !accessLoading) {
      setShowPasswordModal(true);
    }
  }, [isProtected, isLocked, accessLoading, setShowPasswordModal]);

  useEffect(() => {
    if (!isLocked) {
      fetchSettings();
    }
  }, [isLocked]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/all');
      const data = await res.json();
      setSettings({
        relatorios_protected: data.relatorios_protected === 'true',
        relatorios_password: '',
        delete_protected: data.delete_protected === 'true',
        delete_password: '',
        config_protected: data.config_protected === 'true',
        config_password: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!currentPassword) {
      toast({
        title: "Atenção",
        description: "Digite a senha atual para salvar",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          settings: {
            relatorios_protected: String(settings.relatorios_protected),
            relatorios_password: settings.relatorios_password,
            delete_protected: String(settings.delete_protected),
            delete_password: settings.delete_password,
            config_protected: String(settings.config_protected),
            config_password: settings.config_password
          }, 
          currentPassword 
        })
      });
      
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso!",
        });
        setCurrentPassword('');
      } else {
        toast({
          title: "Erro",
          description: "Senha atual incorreta",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading) {
    return (
      <div className="container py-10 max-w-screen-2xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProtected && isLocked) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => window.history.back()}
        onVerify={verifyPassword}
        title="Digite a senha para acessar as Configurações"
      />
    );
  }

  if (loadingSettings) {
    return (
      <div className="container py-10 max-w-screen-2xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-screen-lg">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="h-7 w-7 text-muted-foreground" />
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Gerencie as senhas e bloqueios de acesso do sistema.
      </p>

      <Card className="rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Controle de Acesso por Área
          </CardTitle>
          <CardDescription>
            Configure quais áreas exigem senha para acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Relatórios</Label>
                <p className="text-sm text-muted-foreground">Exigir senha para acessar a aba Relatórios</p>
              </div>
              <Switch
                checked={settings.relatorios_protected}
                onCheckedChange={(v) => setSettings({ ...settings, relatorios_protected: v })}
                data-testid="switch-relatorios-protected"
              />
            </div>
            {settings.relatorios_protected && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm">Senha:</Label>
                <div className="relative max-w-xs">
                  <Input
                    type={showPasswords.relatorios ? 'text' : 'password'}
                    value={settings.relatorios_password}
                    onChange={(e) => setSettings({ ...settings, relatorios_password: e.target.value })}
                    className="pr-10 rounded-sm"
                    placeholder="Digite a senha"
                    data-testid="input-relatorios-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, relatorios: !showPasswords.relatorios })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.relatorios ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Excluir Cadastros/Fórmulas</Label>
                <p className="text-sm text-muted-foreground">Exigir senha para excluir itens</p>
              </div>
              <Switch
                checked={settings.delete_protected}
                onCheckedChange={(v) => setSettings({ ...settings, delete_protected: v })}
                data-testid="switch-delete-protected"
              />
            </div>
            {settings.delete_protected && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm">Senha:</Label>
                <div className="relative max-w-xs">
                  <Input
                    type={showPasswords.delete ? 'text' : 'password'}
                    value={settings.delete_password}
                    onChange={(e) => setSettings({ ...settings, delete_password: e.target.value })}
                    className="pr-10 rounded-sm"
                    placeholder="Digite a senha"
                    data-testid="input-delete-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, delete: !showPasswords.delete })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.delete ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Configurações (esta página)</Label>
                <p className="text-sm text-muted-foreground">Exigir senha para acessar as Configurações</p>
              </div>
              <Switch
                checked={settings.config_protected}
                onCheckedChange={(v) => setSettings({ ...settings, config_protected: v })}
                data-testid="switch-config-protected"
              />
            </div>
            {settings.config_protected && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm">Senha:</Label>
                <div className="relative max-w-xs">
                  <Input
                    type={showPasswords.config ? 'text' : 'password'}
                    value={settings.config_password}
                    onChange={(e) => setSettings({ ...settings, config_password: e.target.value })}
                    className="pr-10 rounded-sm"
                    placeholder="Digite a senha"
                    data-testid="input-config-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, config: !showPasswords.config })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.config ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Senha atual (para confirmar alterações):</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="max-w-xs rounded-sm"
                placeholder="Digite a senha atual de configurações"
                data-testid="input-current-password"
              />
            </div>
            
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-sm"
              data-testid="button-save-settings"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
