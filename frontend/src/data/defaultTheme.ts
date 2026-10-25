import type { Theme } from './theme.types';

const MONTSERRAT = "Montserrat, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif";

export const DEFAULT_THEME: Theme = {
    id: 'default-theme',
    name: 'Cursorg',
    description: 'Identidad visual corporativa de Cursorg',
    type: 'preset',
    config: {
        light: {
            colors: {
                primary: '#0D2B4D',
                secondary: '#1E5AA8',
                accent: '#55C7E8',
                background: '#FBFBFE',
                surface: '#F1F5F9',
                border: '#6E7882',
                decorator: '#FFFFFF',
                loader: {
                    enabled: false,
                    selectedTangram: 1,
                },
            },
            typography: {
                h1: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.492', fontWeight: 800, color: '#0D2B4D', lineHeight: '1.12' },
                h2: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.076', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.18' },
                h3: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.73', fontWeight: 700, color: '#1E5AA8', lineHeight: '1.25' },
                h4: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.44', fontWeight: 600, color: '#0D2B4D', lineHeight: '1.3' },
                h5: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.2', fontWeight: 600, color: '#0D2B4D', lineHeight: '1.35' },
                h6: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 600, color: '#0D2B4D', lineHeight: '1.4' },
                title: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.5', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.25' },
                subtitle: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 600, color: '#6E7882', lineHeight: '1.4' },
                paragraph: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 400, color: '#0D2B4D', lineHeight: '1.65' },
                decorator: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 600, color: '#FFFFFF', lineHeight: '1' },
            },
        },
        dark: {
            colors: {
                primary: '#55C7E8',
                secondary: '#7FD9F2',
                accent: '#2F7BC4',
                background: '#071A2E',
                surface: '#0D2B4D',
                border: '#35516E',
                decorator: '#071A2E',
                loader: {
                    enabled: false,
                    selectedTangram: 1,
                },
            },
            typography: {
                h1: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.492', fontWeight: 800, color: '#FFFFFF', lineHeight: '1.12' },
                h2: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.076', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.18' },
                h3: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.73', fontWeight: 700, color: '#7FD9F2', lineHeight: '1.25' },
                h4: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.44', fontWeight: 600, color: '#FBFBFE', lineHeight: '1.3' },
                h5: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.2', fontWeight: 600, color: '#FBFBFE', lineHeight: '1.35' },
                h6: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 600, color: '#FBFBFE', lineHeight: '1.4' },
                title: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.5', fontWeight: 700, color: '#FBFBFE', lineHeight: '1.25' },
                subtitle: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 600, color: '#B8CBDD', lineHeight: '1.4' },
                paragraph: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 400, color: '#E6EEF5', lineHeight: '1.65' },
                decorator: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 700, color: '#071A2E', lineHeight: '1' },
            },
        },
        accessibility: {
            colors: {
                primary: '#0D2B4D',
                secondary: '#1E5AA8',
                accent: '#0B6E8A',
                background: '#FFFFFF',
                surface: '#F1F5F9',
                border: '#0D2B4D',
                decorator: '#FFFFFF',
                loader: {
                    enabled: false,
                    selectedTangram: 1,
                },
            },
            typography: {
                h1: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.75', fontWeight: 800, color: '#0D2B4D', lineHeight: '1.12' },
                h2: { fontId: 'default', fontName: MONTSERRAT, fontSize: '2.3', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.18' },
                h3: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.9', fontWeight: 700, color: '#1E5AA8', lineHeight: '1.25' },
                h4: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.55', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.3' },
                h5: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.3', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.35' },
                h6: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.125', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.4' },
                title: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.6', fontWeight: 700, color: '#0D2B4D', lineHeight: '1.25' },
                subtitle: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.125', fontWeight: 700, color: '#3F4B57', lineHeight: '1.4' },
                paragraph: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.125', fontWeight: 400, color: '#0D2B4D', lineHeight: '1.7' },
                decorator: { fontId: 'default', fontName: MONTSERRAT, fontSize: '1.0', fontWeight: 700, color: '#FFFFFF', lineHeight: '1' },
            },
        },
    },
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
