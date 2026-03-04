import { useTheme, PRESET_ACCENTS } from '@/hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sun, Moon, Palette, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ThemeSection() {
  const { theme, toggleTheme, accent, setPresetAccent, setCustomAccent, resetAccent } = useTheme();
  const [showCustom, setShowCustom] = useState(accent.name === 'custom');

  return (
    <div className="space-y-4">
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
