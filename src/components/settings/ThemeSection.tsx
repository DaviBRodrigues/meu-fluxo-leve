import { useTheme, PRESET_ACCENTS } from '@/hooks/useTheme';
import { useLayoutTheme, LAYOUT_PRESETS, type LayoutPreset } from '@/contexts/LayoutThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sun, Moon, Palette, RotateCcw, Layout, Layers, Grid3x3, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const PRESET_ICONS: Record<LayoutPreset, React.ReactNode> = {
  'modern-glass': <Layers className="w-6 h-6" />,
  'professional-compact': <Grid3x3 className="w-6 h-6" />,
  'neumorphic-soft': <Circle className="w-6 h-6" />,
};

function PresetPreview({ preset }: { preset: LayoutPreset }) {
  const config = LAYOUT_PRESETS[preset];
  const borderRadius = preset === 'professional-compact' ? '4px' : preset === 'neumorphic-soft' ? '20px' : '12px';

  return (
    <div className="w-full h-20 bg-muted/50 rounded-lg p-2 flex gap-1.5">
      {/* Mini sidebar */}
      <div
        className="h-full bg-card border border-border flex flex-col gap-1 p-1"
        style={{
          width: preset === 'professional-compact' ? '20%' : '25%',
          borderRadius,
        }}
      >
        <div className="w-full h-1.5 rounded-full bg-primary/40" />
        <div className="w-3/4 h-1 rounded-full bg-muted-foreground/20" />
        <div className="w-3/4 h-1 rounded-full bg-muted-foreground/20" />
      </div>
      {/* Mini content */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-7 bg-card border border-border"
              style={{
                borderRadius,
                boxShadow: preset === 'neumorphic-soft'
                  ? '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.5)'
                  : preset === 'modern-glass'
                    ? '0 1px 3px rgba(0,0,0,0.05)'
                    : 'none',
              }}
            />
          ))}
        </div>
        <div
          className="flex-1 bg-card border border-border"
          style={{ borderRadius }}
        />
      </div>
    </div>
  );
}

export default function ThemeSection() {
  const { theme, toggleTheme, accent, setPresetAccent, setCustomAccent, resetAccent } = useTheme();
  const { layoutPreset, setLayoutPreset } = useLayoutTheme();
  const [showCustom, setShowCustom] = useState(accent.name === 'custom');

  return (
    <div className="space-y-4">
      {/* Layout Design Preset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Estilo de Layout
          </CardTitle>
          <CardDescription>Escolha a personalidade visual do design</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(Object.keys(LAYOUT_PRESETS) as LayoutPreset[]).map((key) => {
              const preset = LAYOUT_PRESETS[key];
              const isActive = layoutPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => setLayoutPreset(key)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0',
                        isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {PRESET_ICONS[key]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{preset.label}</span>
                        {isActive && (
                          <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                    </div>
                  </div>
                  <PresetPreview preset={key} />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Light/Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Modo de Exibição
          </CardTitle>
          <CardDescription>Escolha entre tema claro e escuro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-sm font-medium">Claro</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center">
                <Moon className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Escuro</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Cor de Destaque
              </CardTitle>
              <CardDescription>Personalize a cor principal do sistema</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { resetAccent(); setShowCustom(false); }}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Colors */}
          <div className="space-y-2">
            <Label>Cores prontas</Label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_ACCENTS.map((preset) => {
                const isActive = accent.name === preset.name;
                const isDark = theme === 'dark';
                const lightness = isDark ? 42 : 36;
                const bgColor = `hsl(${preset.hue}, ${preset.saturation}%, ${lightness}%)`;
                return (
                  <button
                    key={preset.name}
                    onClick={() => { setPresetAccent(preset); setShowCustom(false); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                      isActive
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-md"
                      style={{ backgroundColor: bgColor }}
                    />
                    <span className="text-xs font-medium">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cor personalizada</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustom(!showCustom)}
              >
                {showCustom ? 'Fechar' : 'Abrir'}
              </Button>
            </div>
            {showCustom && (
              <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl shadow-lg shrink-0"
                    style={{
                      backgroundColor: `hsl(${accent.name === 'custom' ? accent.hue : 180}, 76%, ${theme === 'dark' ? 42 : 36}%)`
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Matiz: {accent.name === 'custom' ? accent.hue : 180}°
                    </Label>
                    <Slider
                      min={0}
                      max={360}
                      step={1}
                      value={[accent.name === 'custom' ? accent.hue : 180]}
                      onValueChange={([v]) => setCustomAccent(v)}
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Hue spectrum preview */}
                <div
                  className="h-3 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, hsl(0,76%,40%), hsl(60,76%,40%), hsl(120,76%,40%), hsl(180,76%,40%), hsl(240,76%,40%), hsl(300,76%,40%), hsl(360,76%,40%))'
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
