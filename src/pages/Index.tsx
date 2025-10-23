import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Shield, 
  Brain, 
  FileSpreadsheet, 
  Users, 
  Lock, 
  TrendingUp,
  CheckCircle2,
  Zap,
  BarChart3
} from "lucide-react";
import heroImage from "@/assets/hero-ai-credit.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CrediAI
            </h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">
              Perfis de Acesso
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
          <Button variant="hero" size="lg" onClick={() => navigate("/login")}>
            Acessar Sistema
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] z-0"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm">
                <Zap className="w-4 h-4" />
                <span>Inteligência Artificial Aplicada</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Plataforma Inteligente de Avaliação de Crédito
              </h1>
              <p className="text-xl text-muted-foreground">
                Automatize a análise de crédito com IA. Processos ágeis, precisos e seguros para instituições financeiras modernas.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="xl" onClick={() => navigate("/login")}>
                  Começar Agora
                </Button>
                <Button variant="heroOutline" size="xl">
                  Solicitar Demo
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>100% Conforme LGPD</span>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Plataforma CrediAI" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Precisão na Análise</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">&lt;30s</div>
              <div className="text-muted-foreground">Tempo Médio de Resposta</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Conformidade LGPD</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transforme a análise de crédito em um processo simples e inteligente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">IA Avançada</h3>
              <p className="text-muted-foreground">
                Modelo treinado em Python para avaliação automática e precisa de risco de inadimplência
              </p>
            </Card>

            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Análise em Lote</h3>
              <p className="text-muted-foreground">
                Processe múltiplos clientes simultaneamente através de upload de planilhas CSV ou Excel
              </p>
            </Card>

            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Dashboards Inteligentes</h3>
              <p className="text-muted-foreground">
                Relatórios completos com indicadores de desempenho e taxa de aprovação em tempo real
              </p>
            </Card>

            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Segurança Total</h3>
              <p className="text-muted-foreground">
                Autenticação robusta e conformidade total com a LGPD para proteção de dados
              </p>
            </Card>

            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Score Instantâneo</h3>
              <p className="text-muted-foreground">
                Geração automática de score de crédito e classificação de risco em segundos
              </p>
            </Card>

            <Card className="p-6 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border-border">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Multiusuário</h3>
              <p className="text-muted-foreground">
                Gestão de múltiplas instituições e usuários com diferentes níveis de acesso
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Perfis de Acesso
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cada usuário com suas permissões específicas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-border bg-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Administrador</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Cadastra bancos e instituições financeiras</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Gerencia acessos de usuários</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Controle total do sistema</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-border bg-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Instituição</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Avalia clientes individualmente</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Insere dados cadastrais e financeiros</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Recebe score instantâneo</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-border bg-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Analista</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Análise em lote via upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Processa planilhas CSV/Excel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Exporta resultados completos</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 md:p-16 text-center bg-gradient-to-r from-primary to-accent border-0">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
              Dados entram, decisões confiáveis saem
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Transforme a análise de crédito da sua instituição com inteligência artificial
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="heroOutline" size="xl" className="bg-background text-primary hover:bg-background/90">
                Solicitar Demonstração
              </Button>
              <Button variant="heroOutline" size="xl" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Falar com Especialista
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">CrediAI</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Inteligência artificial aplicada à análise de crédito
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#roles" className="hover:text-foreground transition-colors">Perfis</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2025 CrediAI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
