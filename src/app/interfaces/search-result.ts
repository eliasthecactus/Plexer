export interface SearchResult {
    score: string;
    data: VideoType | DirectoryType;
    type: 'episode' | 'movie' | 'show' | 'season';
    cover: string;
    background: string;
    genres: string[];
    downloadUrl?: string;
}

export interface VideoType {
    key: string;
    title: string;
    type: string;
    director: {tag: string}[];
    image: {alt: string, type: string, url: string}[];
    media: {container: string, duration: string, height: string, width: string, videoresolution: string, videocodec: string}[];
    tagline: string;
    summary: string;
    year: string;
    audienceRating: string;
}

export interface DirectoryType {
    key: string;
    title: string;
    type: string;
    year: string;
    genre: {tag: string}[];
    country: {tag: string}[];
    image: {alt: string, type: string, url: string}[];
    summary: string;
    audienceRating: string;
}

export interface SeasonType {
    key: string;
    title: string;
    type: string;
    episodes: {title: string, key: string, downloadUrl: string;}[];
}