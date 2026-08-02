import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Rocket, ShieldCheck, Code2, Database, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-8 z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Projeto Inicializado Pronto para Uso</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
          TCC SU - Frontend
        </h1>

        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Ambiente configurado com Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Axios e TanStack Query.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button size="lg" className="gap-2">
            <Rocket className="w-4 h-4" />
            Iniciar Desenvolvimento
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Code2 className="w-4 h-4" />
            Ver Documentação (AGENTS.md)
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
          <Card>
            <CardHeader className="space-y-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle>Next.js & React</CardTitle>
              <CardDescription>App Router com TypeScript e renderização otimizada.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Estrutura de páginas modular com `src/app` e tipos TypeScript rígidos.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle>Tailwind & shadcn/ui</CardTitle>
              <CardDescription>Design moderno com temas e componentes acessíveis.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Classes utilitárias combinadas via `cn()` com componentes personalizáveis.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Database className="w-5 h-5" />
              </div>
              <CardTitle>Axios & React Query</CardTitle>
              <CardDescription>Comunicação robusta com a API do Backend.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Cliente Axios pré-configurado com interceptadores e gerenciamento de cache.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
