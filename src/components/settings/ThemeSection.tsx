import { useTheme, PALETTE_PRESETS, type ColorPalette } from '@/hooks/useTheme';
import { useLayoutTheme, LAYOUT_PRESETS, type LayoutPreset } from '@/contexts/LayoutThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sun, Moon, Palette, RotateCcw, Layout, Layers, Grid3x3, Circle, Paintbrush, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const PRESET_ICONS: Record<LayoutPreset, React.ReactNode> = {
  'modern-glass': <Layers className="w-6 h-6" />,
  'professional-compact': <Grid3x3 className="w-6 h-6" />,
  'neumorphic-soft': <Circle className="w-6 h-6" />,
};

function PresetPreview({ preset }: { preset: LayoutPreset }) {
  const borderRadius = preset === 'professional-compact' ? '4px' : preset === 'neumorphic-soft' ? '20px' : '12px';
  return (
    <div className="w-full h-20 bg-muted/50 rounded-lg p-2 flex gap-1.5">
      <div className="h-full bg-card border border-border flex flex-col gap-1 p-1" style={{ width: preset === 'professional-compact' ? '20%' : '25%', borderRadius }}>
        <div className="w-full h-1.5 rounded-full bg-primary/40" />
        <div className="w-3/4 h-1 rounded-full bg-muted-foreground/20" />
        <div className="w-3/4 h-1 rounded-full bg-muted-foreground/20" />
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-7 bg-card border border-border" style={{ borderRadius, boxShadow: preset === 'neumorphic-soft' ? '2px 2px 4px rgba(0,0,0,0.06), -2px -2px 4px rgba(255,255,255,0.5)' : preset === 'modern-glass' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }} />
          ))}
        </div>
        <div className="flex-1 bg-card border border-border" style={{ borderRadius }} />
      </div>
    </div>
  );
}

// Mini palette preview showing the main colors
function PaletteSwatchPreview({ palette }: { palette: ColorPalette }) {
  const colors = [palette.primary, palette.background, palette.card, palette.secondary, palette.accent];
  return (
    <div className="flex gap-1">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border border-foreground/10"
          style={{ backgroundColor: `hsl(${c})` }}
        />
      ))}
    </div>
  );
}

// Editable color row
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Parse "H S% L%" format
  const parts = value.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  const h = parts ? parseFloat(parts[1]) : 0;
  const s = parts ? parseFloat(parts[2]) : 50;
  const l = parts ? parseFloat(parts[3]) : 50;

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg border border-border shrink-0" style={{ backgroundColor: `hsl(${value})` }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex gap-2 mt-1">
          <div className="flex-1">
            <Slider min={0} max={360} step={1} value={[h]} onValueChange={([v]) => onChange(`${v} ${s}% ${l}%`)} />
          </div>
          <div className="flex-1">
            <Slider min={0} max={100} step={1} value={[s]} onValueChange={([v]) => onChange(`${h} ${v}% ${l}%`)} />
          </div>
          <div className="flex-1">
            <Slider min={0} max={100} step={1} value={[l]} onValueChange={([v]) => onChange(`${h} ${s}% ${v}%`)} />
          </div>
        </div>
        <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span className="flex-1">Matiz</span>
          <span className="flex-1">Saturação</span>
          <span className="flex-1">Luminosidade</span>
        </div>
      </div>
    </div>
  );
}

const EDITABLE_GROUPS = [
  { label: 'Cores Principais', keys: [
    { key: 'background', label: 'Fundo' },
    { key: 'foreground', label: 'Texto' },
    { key: 'primary', label: 'Primária' },
    { key: 'primaryForeground', label: 'Texto Primária' },
  ]},
  { label: 'Cards e Superfícies', keys: [
    { key: 'card', label: 'Card' },
    { key: 'cardForeground', label: 'Texto Card' },
    { key: 'secondary', label: 'Secundária' },
    { key: 'muted', label: 'Muted' },
    { key: 'mutedForeground', label: 'Texto Muted' },
  ]},
  { label: 'Semânticas', keys: [
    { key: 'success', label: 'Sucesso' },
    { key: 'warning', label: 'Alerta' },
    { key: 'destructive', label: 'Destrutiva' },
    { key: 'income', label: 'Receita' },
    { key: 'expense', label: 'Despesa' },
  ]},
  { label: 'Bordas e Sidebar', keys: [
    { key: 'border', label: 'Borda' },
    { key: 'ring', label: 'Ring/Foco' },
    { key: 'sidebarBackground', label: 'Fundo Sidebar' },
    { key: 'sidebarPrimary', label: 'Primária Sidebar' },
  ]},
];

export default function ThemeSection() {
  const { theme, toggleTheme, paletteName, setPalette, activePalette, setCustom, resetPalette } = useTheme();
  const { layoutPreset, setLayoutPreset } = useLayoutTheme();
  const [showCustomEditor, setShowCustomEditor] = useState(paletteName === 'custom');
  const [editingPalette, setEditingPalette] = useState<{ light: ColorPalette; dark: ColorPalette } | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Initialize custom editor from current active or a preset base
  const startCustomEditor = () => {
    const base = PALETTE_PRESETS.find(p => p.name === (paletteName === 'custom' ? 'default' : paletteName)) || PALETTE_PRESETS[0];
    setEditingPalette(paletteName === 'custom' && activePalette
      ? { light: { ...activePalette }, dark: { ...activePalette } }
      : { light: { ...base.light }, dark: { ...base.dark } }
    );
    setShowCustomEditor(true);
  };

  const updateEditingColor = (key: string, value: string) => {
    if (!editingPalette) return;
    const mode = theme === 'dark' ? 'dark' : 'light';
    setEditingPalette(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [mode]: { ...prev[mode], [key]: value },
      };
    });
  };

  const applyCustomPalette = () => {
    if (!editingPalette) return;
    setCustom(editingPalette.light, editingPalette.dark);
    setShowCustomEditor(false);
  };

  const currentEditing = editingPalette ? (theme === 'dark' ? editingPalette.dark : editingPalette.light) : null;

  return (
    <div className="space-y-4">
      {/* Color Palette */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Paleta de Cores
              </CardTitle>
              <CardDescription>Mude toda a aparência de cores do sistema</CardDescription>
            </div>
            {paletteName !== 'default' && (
              <Button variant="ghost" size="sm" onClick={resetPalette}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Padrão
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Palettes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PALETTE_PRESETS.map((preset) => {
              const isActive = paletteName === preset.name;
              const displayPalette = theme === 'dark' ? preset.dark : preset.light;
              return (
                <button
                  key={preset.name}
                  onClick={() => setPalette(preset.name)}
                  className={cn(
                    'relative text-left p-3 rounded-xl border-2 transition-all',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="text-lg mb-1">{preset.emoji}</div>
                  <div className="font-semibold text-sm">{preset.label}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 mb-2 line-clamp-2">{preset.description}</p>
                  <PaletteSwatchPreview palette={displayPalette} />
                </button>
              );
            })}

            {/* Custom palette button */}
            <button
              onClick={() => {
                if (paletteName === 'custom') {
                  setPalette('custom');
                } else {
                  startCustomEditor();
                }
              }}
              className={cn(
                'relative text-left p-3 rounded-xl border-2 border-dashed transition-all',
                paletteName === 'custom'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
              )}
            >
              {paletteName === 'custom' && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="text-lg mb-1">🎨</div>
              <div className="font-semibold text-sm">Personalizada</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">Monte sua própria paleta</p>
              {paletteName === 'custom' ? (
                <PaletteSwatchPreview palette={activePalette} />
              ) : (
                <div className="flex gap-1">
                  {[0, 60, 120, 240, 300].map(h => (
                    <div key={h} className="w-5 h-5 rounded-full border border-foreground/10" style={{ backgroundColor: `hsl(${h}, 60%, 50%)` }} />
                  ))}
                </div>
              )}
            </button>
          </div>

          {/* Custom Editor Button */}
          {!showCustomEditor && (
            <Button variant="outline" className="w-full" onClick={startCustomEditor}>
              <Paintbrush className="w-4 h-4 mr-2" />
              {paletteName === 'custom' ? 'Editar Paleta Personalizada' : 'Criar Paleta Personalizada'}
            </Button>
          )}

          {/* Custom Palette Editor */}
          {showCustomEditor && currentEditing && (
            <div className="border rounded-xl p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Editor de Paleta</h4>
                  <p className="text-xs text-muted-foreground">
                    Editando modo {theme === 'dark' ? 'escuro' : 'claro'} — alterne o modo para editar o outro
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCustomEditor(false)}>
                  Fechar
                </Button>
              </div>

              {/* Preview bar */}
              <div className="flex gap-1.5 p-3 rounded-lg border bg-card">
                {(['primary', 'background', 'card', 'secondary', 'muted', 'success', 'warning', 'destructive'] as const).map(key => (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-6 rounded-md border border-foreground/10" style={{ backgroundColor: `hsl(${currentEditing[key]})` }} />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">{key}</span>
                  </div>
                ))}
              </div>

              {/* Grouped color editors */}
              {EDITABLE_GROUPS.map(group => (
                <div key={group.label} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
                  >
                    <span className="text-sm font-medium">{group.label}</span>
                    {expandedGroup === group.label ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroup === group.label && (
                    <div className="p-3 space-y-4">
                      {group.keys.map(({ key, label }) => (
                        <ColorRow
                          key={key}
                          label={label}
                          value={currentEditing[key as keyof ColorPalette] as string}
                          onChange={(v) => updateEditingColor(key, v)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Button className="w-full" onClick={applyCustomPalette}>
                Aplicar Paleta Personalizada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                    isActive ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('p-2 rounded-lg shrink-0', isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {PRESET_ICONS[key]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{preset.label}</span>
                        {isActive && <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Ativo</span>}
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
                theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'hsl(0 0% 100%)', borderColor: 'hsl(0 0% 85%)' }}>
                <Sun className="w-6 h-6" style={{ color: 'hsl(38 92% 50%)' }} />
              </div>
              <span className="text-sm font-medium">Claro</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'hsl(222 47% 8%)', borderColor: 'hsl(215 28% 20%)' }}>
                <Moon className="w-6 h-6" style={{ color: 'hsl(221 83% 65%)' }} />
              </div>
              <span className="text-sm font-medium">Escuro</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
