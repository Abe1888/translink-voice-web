/**
 * Type declarations for troika-three-text
 */

declare module 'troika-three-text' {
    import { Mesh, Material, Color } from 'three';

    export class Text extends Mesh {
        text: string;
        fontSize: number;
        color: number | string | Color;
        anchorX: 'left' | 'center' | 'right' | number;
        anchorY: 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom' | number;
        maxWidth: number;
        lineHeight: number;
        letterSpacing: number;
        textAlign: 'left' | 'center' | 'right' | 'justify';
        font: string | null;
        fontWeight: string | number;
        fontStyle: 'normal' | 'italic';
        outlineWidth: number | string;
        outlineColor: number | string | Color;
        outlineBlur: number | string;
        outlineOffsetX: number | string;
        outlineOffsetY: number | string;
        strokeWidth: number | string;
        strokeColor: number | string | Color;
        fillOpacity: number;
        strokeOpacity: number;
        depthOffset: number;
        clipRect: [number, number, number, number] | null;
        orientation: string;
        glyphGeometryDetail: number;
        sdfGlyphSize: number;
        gpuAccelerateSDF: boolean;
        material: Material;

        sync(callback?: () => void): void;
        dispose(): void;
    }
}
