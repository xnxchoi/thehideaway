export const HighlightPalette = {
	BLUE: '84.43% 0.065 210.91', ORANGE: '78.6% 0.1658 74.9677',
	YELLOW: '85% 0.161 82.9', GREEN: '91% 0.228 124.65',
} as const;
export type HIGHLIGHT_PALETTE =  typeof HighlightPalette;
export type HighlightColors=keyof HIGHLIGHT_PALETTE;
export const Palettes=Object.keys(HighlightPalette) as ['BLUE', 'ORANGE', 'YELLOW', 'GREEN']
