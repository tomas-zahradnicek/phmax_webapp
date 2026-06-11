/** Hero buď legacy přepínače, nebo CalculatorHeroShell (variant A). */
export function heroHasDisplaySettings(source: string): boolean {
  return (
    source.includes("CalculatorHeroDisplayControls") ||
    source.includes("CalculatorHeroShell")
  );
}
