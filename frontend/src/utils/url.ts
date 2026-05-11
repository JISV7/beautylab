const API_URL = 'http://localhost:8000';

/**
 * Normalizes a URL by prepending the API_URL if it's a relative path starting with /static.
 * @param url The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('/static')) {
        return `${API_URL}${url}`;
    }
    return url;
};
