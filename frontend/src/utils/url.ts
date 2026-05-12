import { BASE_URL } from '../config';

/**
 * Normalizes a URL by prepending the BASE_URL if it's a relative path starting with /static.
 * @param url The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('/static')) {
        return `${BASE_URL}${url}`;
    }
    return url;
};
