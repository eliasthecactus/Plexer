export interface PlexServer {
    name: string;
    address: string;
    port: number;
    online: boolean;
    protocol: 'http' | 'https';
    local: boolean;
    isChecked: boolean;
}
